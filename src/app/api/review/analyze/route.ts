import { NextRequest } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";

export const runtime = "edge";
export const maxDuration = 120;

const REVIEW_SYSTEM_PROMPT = `당신은 대한민국 창업진흥원 심사위원입니다.
예비창업패키지 사업계획서를 PSST 기준으로 심사합니다.

심사 기준 (총 100점):
- P (문제인식 · Problem): 25점
  · 해결하려는 문제의 실재성 및 심각성
  · 고객 정의의 구체성 (페르소나 수준)
  · 현재 대안 대비 차별적 필요성

- S (실현가능성 · Solution): 25점
  · 솔루션의 구체성 및 기술적 타당성
  · MVP 또는 시제품 완성도
  · 차별점의 명확성 (10배 법칙)

- S (성장전략 · Scalability): 25점
  · TAM/SAM/SOM 시장규모 분석
  · 수익모델의 명확성
  · 성장 로드맵 및 실행계획

- T (팀 · Team): 25점
  · 창업자의 문제 연관성 (왜 나인가)
  · 팀 구성 완성도
  · 실행 역량 및 이력

[출력 형식]
반드시 아래 JSON 형식으로 출력하세요:

{
  "total": <0-100 정수>,
  "grade": "<S|A|B|C|D>",
  "verdict": "<합격 가능성: 상/중/하 + 한 문장 근거>",
  "dimensions": {
    "problem": { "score": <0-25>, "summary": "<2-3문장 평가>", "strength": "<잘 된 점>", "weakness": "<부족한 점>" },
    "solution": { "score": <0-25>, "summary": "<2-3문장 평가>", "strength": "<잘 된 점>", "weakness": "<부족한 점>" },
    "scalability": { "score": <0-25>, "summary": "<2-3문장 평가>", "strength": "<잘 된 점>", "weakness": "<부족한 점>" },
    "team": { "score": <0-25>, "summary": "<2-3문장 평가>", "strength": "<잘 된 점>", "weakness": "<부족한 점>" }
  },
  "topStrengths": ["<강점1>", "<강점2>", "<강점3>"],
  "criticalIssues": ["<핵심 문제1>", "<핵심 문제2>", "<핵심 문제3>"],
  "judgeComment": "<심사위원 총평 — 3-5문장, 날카롭고 건설적으로>",
  "improvementPriority": [
    { "item": "<개선 항목>", "action": "<구체적 행동 지침>", "impact": "<high|medium|low>" }
  ]
}

엄격하게 심사하되 개선 가능한 피드백을 주세요. 전형적인 관료적 표현이 아닌 실질적인 조언을 주세요.`;

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: object) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(req: NextRequest) {
  let body: { type: "text" | "pdf"; text?: string; base64?: string; filename: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const { type, text, base64, filename } = body;

  if (type === "text" && !text?.trim()) {
    return new Response("텍스트가 비어 있습니다", { status: 400 });
  }
  if (type === "pdf" && !base64) {
    return new Response("PDF 데이터가 없습니다", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      sendEvent(controller, "status", { message: "사업계획서 분석 중..." });

      try {
        /* ── 메시지 구성 ── */
        type ContentBlock =
          | { type: "text"; text: string }
          | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

        const content: ContentBlock[] = [];

        if (type === "pdf" && base64) {
          content.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          });
          content.push({
            type: "text",
            text: `파일명: ${filename}\n\n위 첨부 사업계획서를 PSST 기준으로 심사해주세요. 반드시 JSON 형식으로만 출력하세요.`,
          });
        } else {
          content.push({
            type: "text",
            text: `파일명: ${filename}\n\n=== 사업계획서 내용 ===\n${text}\n\n위 사업계획서를 PSST 기준으로 심사해주세요. 반드시 JSON 형식으로만 출력하세요.`,
          });
        }

        /* ── Claude 호출 ── */
        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 3000,
          system: REVIEW_SYSTEM_PROMPT,
          messages: [{ role: "user", content }],
        });

        const raw = response.content[0]?.type === "text" ? response.content[0].text : "";

        /* ── JSON 파싱 ── */
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          sendEvent(controller, "error", { message: "분석 결과 파싱 실패. 다시 시도해주세요." });
          controller.close();
          return;
        }

        const result = JSON.parse(jsonMatch[0]);
        sendEvent(controller, "result", result);
        sendEvent(controller, "done", {});
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        let msg = "분석 중 오류가 발생했습니다. 다시 시도해주세요.";
        try {
          const p = JSON.parse(raw);
          if ((p?.error?.type || p?.type) === "overloaded_error") msg = "AI 서버가 잠시 바쁩니다. 1-2분 후 다시 시도해주세요.";
        } catch { /* ignore */ }
        sendEvent(controller, "error", { message: msg });
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
