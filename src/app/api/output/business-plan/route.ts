import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase";
import { anthropic, MODEL, getBusinessPlanSystemPrompt } from "@/lib/claude";
import { buildScoreBoard } from "@/lib/score-engine";
import type { Message, ScoreDimension } from "@/types";

const BUSINESS_PLAN_CREDIT_COST = 1;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { session_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { session_id } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id가 필요합니다." }, { status: 400 });
  }

  // 1. 세션 조회 (RLS)
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  // 2. 점수 검증 (61점 이상이어야 산출물 생성 가능)
  const rawScores = session.scores as Record<ScoreDimension, { score: number; feedback: string }>;
  const scoreBoard = buildScoreBoard(session_id, rawScores || {});

  if (scoreBoard.total < 61) {
    return NextResponse.json(
      { error: `점수가 부족합니다. 현재 ${scoreBoard.total}점 (최소 61점 필요)` },
      { status: 403 }
    );
  }

  // 3. 크레딧 차감 (원자적 트랜잭션 — DB 함수 호출)
  const serviceClient = createServiceRoleClient();

  const { data: deductResult, error: deductError } = await serviceClient.rpc("deduct_credit", {
    p_user_id: user.id,
    p_amount: BUSINESS_PLAN_CREDIT_COST,
  });

  if (deductError || !deductResult) {
    return NextResponse.json(
      { error: "크레딧이 부족하거나 차감에 실패했습니다." },
      { status: 402 }
    );
  }

  // 4. 인터뷰 내용 요약 구성
  const messages: Message[] = Array.isArray(session.messages) ? session.messages as Message[] : [];
  const interviewSummary = messages
    .map((m) => `[STEP ${m.step}] ${m.role === "ai" ? "AI" : "창업자"}: ${m.content}`)
    .join("\n\n");

  // 5. Claude API로 사업계획서 생성
  let content = "";
  let retries = 0;

  while (retries < 2) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: getBusinessPlanSystemPrompt(interviewSummary),
        messages: [
          {
            role: "user",
            content: "위 인터뷰 내용을 바탕으로 사업계획서를 작성해주세요.",
          },
        ],
      });

      content =
        response.content[0].type === "text" ? response.content[0].text : "";

      // 섹션 검증 (7개 섹션 모두 포함 여부)
      const requiredSections = ["# 1.", "# 2.", "# 3.", "# 4.", "# 5.", "# 6.", "# 7."];
      const allSectionsPresent = requiredSections.every((s) => content.includes(s));

      if (allSectionsPresent) break;
    } catch {
      // 재시도
    }
    retries++;
  }

  if (!content) {
    // 크레딧 롤백 — 차감 전 잔액 조회 후 복구
    const { data: currentCredit } = await serviceClient
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (currentCredit) {
      await serviceClient
        .from("credits")
        .update({
          balance: currentCredit.balance + BUSINESS_PLAN_CREDIT_COST,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({ error: "사업계획서 생성에 실패했습니다." }, { status: 500 });
  }

  // 6. outputs 테이블에 저장
  const { data: output, error: outputError } = await supabase
    .from("outputs")
    .insert({
      user_id: user.id,
      session_id,
      type: "business_plan",
      content,
      credits_used: BUSINESS_PLAN_CREDIT_COST,
    })
    .select()
    .single();

  if (outputError) {
    console.error("[output/business-plan] DB save error:", outputError);
  }

  return NextResponse.json({
    id: output?.id,
    content,
    credits_used: BUSINESS_PLAN_CREDIT_COST,
  });
}
