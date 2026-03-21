import { NextRequest } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";

export const runtime = "edge";
export const maxDuration = 120;

/* ─── 사업계획서 섹션 정의 ─── */
export const WRITE_SECTIONS = [
  {
    id: "item_overview",
    code: "1-1 ~ 1-2",
    title: "창업 아이템 개요",
    desc: "창업 아이템명, 한 줄 설명, 핵심 가치 제안 (어떤 문제를, 누구의, 어떻게 해결하는가)",
  },
  {
    id: "customer_problem",
    code: "1-3",
    title: "문제 인식 및 고객 정의",
    desc: "타겟 고객 프로파일, 핵심 페인포인트, 현재 대안의 한계점",
  },
  {
    id: "solution_diff",
    code: "2-1 ~ 2-2",
    title: "솔루션 및 차별점",
    desc: "제품/서비스 설명, 기존 대안 대비 10배 나은 이유 (수치 포함)",
  },
  {
    id: "market",
    code: "1-4",
    title: "목표 시장 및 규모",
    desc: "TAM → SAM → SOM 단계별 시장 규모 추정, 초기 타겟 세그먼트",
  },
  {
    id: "biz_model",
    code: "2-3",
    title: "비즈니스 모델",
    desc: "수익 구조, 가격 정책, 초기 고객 확보 전략 (첫 10명을 어떻게 얻을 것인가)",
  },
  {
    id: "team",
    code: "3-1",
    title: "팀 구성 및 역량",
    desc: "'왜 당신이어야 하는가' — 대표자·팀원의 경력·경험이 이 문제와 어떻게 연결되는가",
  },
  {
    id: "execution",
    code: "4-1",
    title: "실행 계획",
    desc: "3개월·6개월·12개월 마일스톤, 지원금 활용 계획, 핵심 KPI",
  },
] as const;

export type SectionId = typeof WRITE_SECTIONS[number]["id"];

/* ─── 시스템 프롬프트 ─── */
function buildSystemPrompt(
  sectionIdx: number,
  completedContent: string,
  interviewContext: string
): string {
  const section = WRITE_SECTIONS[sectionIdx];
  return `당신은 대한민국 예비창업패키지 사업계획서 전문 작성 코치입니다.
창업자와 대화하며 사업계획서를 섹션별로 함께 완성합니다.

[창업자 인터뷰 핵심 내용]
${interviewContext || "인터뷰 데이터 없음 — 대화를 통해 파악하여 진행하세요."}

[이미 완성된 섹션]
${completedContent || "없음 (첫 번째 섹션)"}

[현재 작성할 섹션]
코드: ${section.code}
제목: ${section.title}
작성 기준: ${section.desc}

[작업 방식]
1. 인터뷰 내용을 바탕으로 현재 섹션 초안을 먼저 작성합니다.
2. 초안은 반드시 아래 마커로 감쌉니다:
   ===초안===
   (초안 내용)
   ===끝===
3. 초안 아래에 "이 내용으로 진행할까요? 수정이 필요하면 말씀해주세요." 라고 씁니다.
4. 창업자가 승인("좋아요" / "다음" / "진행해" / "OK" 등)하면 반드시 아래 JSON만 출력:
   {"action":"approve","sectionIdx":${sectionIdx}}
5. 피드백을 받으면 수정 후 새 초안을 제시합니다.

[글쓰기 규칙]
- 사업계획서 공식 문체 (명사형 종결, 격식체)
- 구체적 수치와 근거 반드시 포함
- 각 섹션 250~450자 분량
- 인터뷰에서 파악한 내용을 최대한 활용하여 설득력 있게 작성
- 심사위원이 읽을 문서임을 명심 — 추상적 표현 금지`;
}

/* ─── POST /api/write ─── */
export async function POST(req: NextRequest) {
  let body: {
    sectionIdx: number;
    messages: { role: "user" | "assistant"; content: string }[];
    interviewContext: string;
    completedContent: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (body.sectionIdx < 0 || body.sectionIdx >= WRITE_SECTIONS.length) {
    return new Response("Invalid sectionIdx", { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    body.sectionIdx,
    body.completedContent,
    body.interviewContext
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );

      try {
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1800,
          system: systemPrompt,
          messages: body.messages,
          stream: true,
        });

        let fullText = "";
        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            fullText += chunk.delta.text;
            send("text", { text: chunk.delta.text });
          }
        }

        // 승인 감지
        const approveMatch = fullText.match(/\{"action"\s*:\s*"approve"[^}]*\}/);
        if (approveMatch) {
          // 초안을 함께 추출하여 문서 패널에 저장
          const draftMatch = fullText.match(/===초안===([\s\S]*?)===끝===/);
          send("approve", {
            sectionIdx: body.sectionIdx,
            draft: draftMatch ? draftMatch[1].trim() : "",
          });
        } else {
          // 초안만 추출 (아직 승인 전)
          const draftMatch = fullText.match(/===초안===([\s\S]*?)===끝===/);
          if (draftMatch) {
            send("draft", {
              sectionIdx: body.sectionIdx,
              content: draftMatch[1].trim(),
            });
          }
        }

        send("done", {});
      } catch (err) {
        let msg = "오류가 발생했습니다. 다시 시도해주세요.";
        try {
          const raw = err instanceof Error ? err.message : String(err);
          const p = JSON.parse(raw);
          if ((p?.error?.type || p?.type) === "overloaded_error")
            msg = "AI 서버가 바쁩니다. 1~2분 후 다시 시도해주세요.";
        } catch { /* ignore */ }
        send("error", { message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
