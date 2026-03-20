import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase";
import { anthropic, MODEL, getBusinessPlanReviewSystemPrompt } from "@/lib/claude";

const REVIEW_CREDIT_COST = 1;
const EARLYBIRD_SLOTS = 500;

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { content: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { content } = body;
  if (!content || content.trim().length < 100) {
    return NextResponse.json(
      { error: "사업계획서 내용을 100자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  const serviceClient = createServiceRoleClient();

  // 얼리버드 여부 확인
  const { data: creditRow } = await serviceClient
    .from("credits")
    .select("earlybird_expires_at")
    .eq("user_id", user.id)
    .single();

  const isEarlybird =
    creditRow?.earlybird_expires_at !== null &&
    creditRow?.earlybird_expires_at !== undefined &&
    new Date(creditRow.earlybird_expires_at) > new Date();

  if (!isEarlybird) {
    // 크레딧 차감
    const { data: deductResult, error: deductError } = await serviceClient.rpc(
      "deduct_credit",
      { p_user_id: user.id, p_amount: REVIEW_CREDIT_COST }
    );

    if (deductError || !deductResult) {
      return NextResponse.json(
        { error: "크레딧이 부족합니다. 충전 후 이용해주세요." },
        { status: 402 }
      );
    }
  }

  // Claude API로 PSST 평가
  let reviewData = null;
  let retries = 0;

  while (retries < 2 && !reviewData) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 800,
        system: getBusinessPlanReviewSystemPrompt(content.slice(0, 6000)),
        messages: [{ role: "user", content: "위 사업계획서를 PSST 기준으로 평가해주세요." }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text.trim() : "";
      reviewData = JSON.parse(text);
    } catch {
      retries++;
    }
  }

  if (!reviewData) {
    // 실패 시 크레딧 롤백 (얼리버드 아닌 경우만)
    if (!isEarlybird) {
      await serviceClient.rpc("add_credit", {
        p_user_id: user.id,
        p_amount: REVIEW_CREDIT_COST,
      });
    }
    return NextResponse.json({ error: "평가에 실패했습니다." }, { status: 500 });
  }

  // outputs 테이블에 저장
  const { data: output } = await supabase
    .from("outputs")
    .insert({
      user_id: user.id,
      session_id: null,
      type: "business_plan_review",
      content: JSON.stringify(reviewData),
      credits_used: isEarlybird ? 0 : REVIEW_CREDIT_COST,
    })
    .select()
    .single();

  return NextResponse.json({
    id: output?.id,
    review: reviewData,
    credits_used: isEarlybird ? 0 : REVIEW_CREDIT_COST,
  });
}
