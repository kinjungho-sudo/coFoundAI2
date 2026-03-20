import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { anthropic, MODEL, getDevilAdvocateSystemPrompt } from "@/lib/claude";
import { validateAndFilter } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { DEVIL_TAB_LABELS } from "@/types";
import type { DevilTab, DevilAdvocateResult } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { allowed, retryAfter } = await checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: `요청이 너무 많습니다. ${retryAfter}초 후 다시 시도해주세요.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: { tab: DevilTab; content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { tab, content } = body;

  const validTabs: DevilTab[] = [
    "target_customer",
    "problem_definition",
    "differentiation",
    "revenue_model",
    "execution_plan",
  ];

  if (!validTabs.includes(tab)) {
    return NextResponse.json({ error: "유효하지 않은 탭입니다." }, { status: 400 });
  }

  const { ok, filtered, error: filterError } = validateAndFilter(content, {
    minLen: 10,
    maxLen: 3000,
  });

  if (!ok) {
    return NextResponse.json({ error: filterError }, { status: 400 });
  }

  const tabName = DEVIL_TAB_LABELS[tab];
  const systemPrompt = getDevilAdvocateSystemPrompt(tabName, filtered);

  let result: DevilAdvocateResult | null = null;
  let retries = 0;

  while (retries < 2 && !result) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: "위 내용을 분석하세요.",
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = JSON.parse(text.trim()) as DevilAdvocateResult;

      // 스키마 검증
      if (parsed.q1 && parsed.q2 && parsed.q3 && parsed.final_question) {
        result = parsed;
      }
    } catch {
      retries++;
    }
  }

  if (!result) {
    return NextResponse.json({ error: "분석에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(result);
}
