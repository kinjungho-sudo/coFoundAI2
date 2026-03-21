import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { anthropic, MODEL, getInterviewSystemPrompt, getScoreSystemPrompt } from "@/lib/claude";
import { validateAndFilter } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateScore } from "@/lib/score-engine";
import { buildRAGContext } from "@/lib/rag/search";
import { STEP_METADATA } from "@/types";
import type { Message, ScoreItem } from "@/types";

export const runtime = "edge";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // 1. 인증 확인
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // 2. Rate Limit 체크
  const { allowed, remaining, retryAfter } = await checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 3. 입력 파싱 및 검증
  let body: { session_id: string; step: number; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { session_id, step, message } = body;

  if (!session_id || typeof step !== "number" || step < 1 || step > 9) {
    return NextResponse.json({ error: "session_id와 step(1-9)이 필요합니다." }, { status: 400 });
  }

  const { ok, filtered, error: filterError } = validateAndFilter(message, { maxLen: 2000 });
  if (!ok) {
    return NextResponse.json({ error: filterError }, { status: 400 });
  }

  // 4. 세션 확인 (RLS 적용 — 본인 세션만)
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  // 5. 메시지 기록에 사용자 메시지 추가
  const messages: Message[] = Array.isArray(session.messages) ? session.messages as Message[] : [];
  const userMessage: Message = {
    step,
    role: "user",
    content: filtered,
    timestamp: new Date().toISOString(),
  };
  messages.push(userMessage);

  // 6. SSE 스트림 생성
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: string, data: unknown) => {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    await writer.write(encoder.encode(payload));
  };

  // 비동기로 Claude API 호출 및 점수 계산
  (async () => {
    try {
      const stepMeta = STEP_METADATA[step];
      const ragContext = await buildRAGContext(filtered, step);
      const systemPrompt = getInterviewSystemPrompt(step, stepMeta?.purpose || "") + ragContext;

      // 이전 대화 히스토리 구성
      const conversationHistory = messages
        .filter((m) => m.step <= step)
        .slice(-10) // 최근 10개만 컨텍스트로 사용
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

      let aiResponse = "";

      // 7. Claude API 스트리밍 호출
      const claudeStream = await anthropic.messages.stream({
        model: MODEL,
        max_tokens: 500,
        system: systemPrompt,
        messages: conversationHistory,
      });

      for await (const chunk of claudeStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          aiResponse += chunk.delta.text;
          await sendEvent("chunk", { text: chunk.delta.text });
        }
      }

      // 8. AI 응답 메시지 기록 추가
      const aiMessage: Message = {
        step,
        role: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      messages.push(aiMessage);

      // 9. 점수 계산 (서버사이드, 비동기 — 현재 STEP 답변 기준)
      if (stepMeta) {
        const scoreSystemPrompt = getScoreSystemPrompt(stepMeta.dimension);
        let retries = 0;
        let scoreData: { score: number; feedback: string } | null = null;

        while (retries < 2 && !scoreData) {
          try {
            const scoreResponse = await anthropic.messages.create({
              model: MODEL,
              max_tokens: 200,
              system: scoreSystemPrompt,
              messages: [{ role: "user", content: filtered }],
            });

            const scoreText =
              scoreResponse.content[0].type === "text"
                ? scoreResponse.content[0].text
                : "";
            const parsed = JSON.parse(scoreText.trim());
            scoreData = {
              score: validateScore(parsed.score),
              feedback: String(parsed.feedback || "").slice(0, 100),
            };
          } catch {
            retries++;
          }
        }

        if (scoreData) {
          // 점수 누적 업데이트
          const scores = (session.scores as Record<string, ScoreItem>) || {};
          scores[stepMeta.dimension] = {
            dimension: stepMeta.dimension,
            label: stepMeta.dimension,
            score: scoreData.score,
            feedback: scoreData.feedback,
          };

          const totalScore = Object.values(scores).reduce(
            (sum, item) => sum + (item.score || 0),
            0
          );

          await sendEvent("score", {
            dimension: stepMeta.dimension,
            score: scoreData.score,
            feedback: scoreData.feedback,
            total: totalScore,
          });

          // DB 업데이트 (메시지 + 점수)
          await supabase
            .from("interview_sessions")
            .update({
              messages: messages as unknown as import("@/lib/database.types").Json,
              scores: scores as unknown as import("@/lib/database.types").Json,
              status: step >= 9 ? "completed" : "in_progress",
              updated_at: new Date().toISOString(),
            })
            .eq("id", session_id);
        }
      }

      // 10. 완료 이벤트
      await sendEvent("done", {
        step_complete: true,
        next_step: step < 9 ? step + 1 : null,
        interview_complete: step >= 9,
      });
    } catch (err) {
      console.error("[interview/message] error:", err);
      const raw = err instanceof Error ? err.message : String(err);
      let userMsg = "일시적인 오류가 발생했습니다. 다시 시도해주세요.";
      try {
        const parsed = JSON.parse(raw);
        const errType = parsed?.error?.type || parsed?.type || "";
        if (errType === "overloaded_error") {
          userMsg = "AI 서버가 잠시 바쁩니다. 1~2분 후 다시 시도해주세요.";
        } else if (errType === "rate_limit_error") {
          userMsg = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        } else if (errType === "invalid_request_error") {
          userMsg = "요청 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.";
        }
      } catch {
        if (raw.includes("overloaded")) userMsg = "AI 서버가 잠시 바쁩니다. 1~2분 후 다시 시도해주세요.";
        else if (raw.includes("rate_limit")) userMsg = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      }
      await sendEvent("error", { message: userMsg });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
