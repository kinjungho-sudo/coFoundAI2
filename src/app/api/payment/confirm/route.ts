import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase";
import { CREDIT_PACKAGES } from "@/types";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { paymentKey: string; orderId: string; amount: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { paymentKey, orderId, amount } = body;

  if (!paymentKey || !orderId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
  }

  // 금액이 정상 패키지 금액인지 검증
  const validAmounts = Object.values(CREDIT_PACKAGES).map((p) => p.amount);
  if (!validAmounts.includes(amount)) {
    return NextResponse.json({ error: "유효하지 않은 결제 금액입니다." }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  // 1. orderId로 pending 결제 조회 (중복 처리 방지)
  const { data: payment, error: paymentError } = await serviceClient
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "유효하지 않은 주문입니다." }, { status: 404 });
  }

  // 금액 불일치 검증
  if (payment.amount !== amount) {
    return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "결제 서버 설정 오류입니다." }, { status: 500 });
  }

  // 2. TossPayments 서버 검증
  const encryptedSecretKey = Buffer.from(`${secretKey}:`).toString("base64");

  const tossRes = await fetch(TOSS_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encryptedSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  if (!tossRes.ok) {
    const tossErr = await tossRes.json().catch(() => ({}));
    console.error("[payment/confirm] Toss error:", tossErr);

    // 결제 실패 상태 업데이트
    await serviceClient
      .from("payments")
      .update({ status: "failed" })
      .eq("order_id", orderId);

    return NextResponse.json(
      { error: tossErr.message || "결제 검증에 실패했습니다." },
      { status: 402 }
    );
  }

  // 3. 크레딧 원자적 충전 (add_credit RPC — SECURITY DEFINER)
  const { data: newBalance, error: creditError } = await serviceClient.rpc("add_credit", {
    p_user_id: user.id,
    p_amount: payment.credits,
  });

  if (creditError) {
    console.error("[payment/confirm] add_credit error:", creditError);
    return NextResponse.json({ error: "크레딧 충전에 실패했습니다." }, { status: 500 });
  }

  // 4. 결제 상태 success + paymentKey 저장 (단일 업데이트)
  await serviceClient
    .from("payments")
    .update({
      status: "success",
      toss_payment_key: paymentKey,
    })
    .eq("order_id", orderId);

  return NextResponse.json({
    success: true,
    new_balance: newBalance,
    credits_charged: payment.credits,
  });
}
