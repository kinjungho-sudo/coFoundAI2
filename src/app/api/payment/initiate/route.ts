import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { CREDIT_PACKAGES } from "@/types";
import type { CreditPackage } from "@/types";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { package: CreditPackage };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { package: pkg } = body;
  const validPackages: CreditPackage[] = ["starter", "basic", "pro"];

  if (!validPackages.includes(pkg)) {
    return NextResponse.json({ error: "유효하지 않은 패키지입니다." }, { status: 400 });
  }

  const packageInfo = CREDIT_PACKAGES[pkg];
  const orderId = `cofound-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // payments 테이블에 orderId 포함해 pending 상태로 저장
  const { error: dbError } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      order_id: orderId,
      package: pkg,
      amount: packageInfo.amount,
      credits: packageInfo.credits,
      status: "pending",
      toss_payment_key: null,
    });

  if (dbError) {
    console.error("[payment/initiate] DB error:", dbError);
    return NextResponse.json({ error: "주문 생성에 실패했습니다." }, { status: 500 });
  }

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    return NextResponse.json({ error: "결제 설정이 올바르지 않습니다." }, { status: 500 });
  }

  return NextResponse.json({
    orderId,
    amount: packageInfo.amount,
    orderName: `CoFound AI ${packageInfo.label} 패키지 (${packageInfo.credits} 크레딧)`,
    clientKey,
  });
}
