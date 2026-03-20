"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createClient } from "@/lib/supabase";
import { CREDIT_PACKAGES } from "@/types";
import type { CreditPackage } from "@/types";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaymentWidget: any;
  }
}

const PACKAGE_ORDER: CreditPackage[] = ["starter", "basic", "pro"];

export default function PaymentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selected, setSelected] = useState<CreditPackage>("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setCreditBalance(data?.balance ?? 0);
    })();
  }, []);

  const handlePay = async () => {
    if (!sdkReady || !window.PaymentWidget) {
      setError("결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 주문 생성
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: selected }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "주문 생성에 실패했습니다.");
        return;
      }

      const { orderId, amount, orderName, clientKey } = await res.json();

      // TossPayments 위젯 결제 요청
      const paymentWidget = window.PaymentWidget(clientKey, window.PaymentWidget.ANONYMOUS);

      await paymentWidget.requestPayment({
        orderId,
        orderName,
        customerName: user.email?.split("@")[0] || "창업자",
        customerEmail: user.email,
        amount,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pkg = CREDIT_PACKAGES[selected];

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1/payment-widget"
        onReady={() => setSdkReady(true)}
      />

      <div className="min-h-screen bg-[#0F0E17] flex flex-col">
        {/* 헤더 */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-[#2D2B42] bg-[#1A1927]">
          <button
            onClick={() => router.push("/interview")}
            className="text-[#8B89A0] hover:text-[#E8E6F0] transition-colors"
          >
            ← 인터뷰
          </button>
          <span className="text-[#2D2B42]">/</span>
          <span className="text-[#E8E6F0] font-semibold">크레딧 충전</span>
        </header>

        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
          {/* 현재 잔액 */}
          {creditBalance !== null && (
            <div className="bg-[#1A1927] border border-[#2D2B42] rounded-xl px-5 py-4 mb-8 flex items-center justify-between">
              <span className="text-sm text-[#8B89A0]">현재 크레딧 잔액</span>
              <span className="text-lg font-bold text-[#F5A623]">{creditBalance} 크레딧</span>
            </div>
          )}

          {/* 패키지 선택 */}
          <h2 className="text-lg font-semibold text-[#E8E6F0] mb-4">패키지 선택</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {PACKAGE_ORDER.map((key) => {
              const p = CREDIT_PACKAGES[key];
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-[#534AB7] bg-[#534AB7]/10"
                      : "border-[#2D2B42] bg-[#1A1927] hover:border-[#534AB7]/50"
                  }`}
                >
                  {key === "basic" && (
                    <span className="text-xs bg-[#534AB7] text-white px-2 py-0.5 rounded-full mb-2">
                      추천
                    </span>
                  )}
                  <span className="text-sm font-semibold text-[#E8E6F0] mb-1">{p.label}</span>
                  <span className="text-2xl font-bold text-[#534AB7] mb-1">{p.credits}</span>
                  <span className="text-xs text-[#8B89A0] mb-3">크레딧</span>
                  <span className="text-base font-semibold text-[#E8E6F0]">
                    ₩{p.amount.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 선택 요약 */}
          <div className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-[#8B89A0] mb-4">결제 요약</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#E8E6F0]">{pkg.label} 패키지</span>
              <span className="text-sm text-[#E8E6F0]">{pkg.credits} 크레딧</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-[#8B89A0]">크레딧당</span>
              <span className="text-sm text-[#8B89A0]">
                ₩{Math.round(pkg.amount / pkg.credits).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-[#2D2B42] pt-4 flex justify-between items-center">
              <span className="font-semibold text-[#E8E6F0]">총 결제금액</span>
              <span className="text-xl font-bold text-[#534AB7]">
                ₩{pkg.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#E24B4A] mb-4 text-center">{error}</p>
          )}

          <button
            onClick={handlePay}
            disabled={isLoading || !sdkReady}
            className="w-full py-4 bg-[#534AB7] hover:bg-[#6259c7] disabled:bg-[#2D2B42] disabled:text-[#8B89A0] text-white font-semibold rounded-2xl transition-colors text-base"
          >
            {isLoading
              ? "결제 진행 중..."
              : !sdkReady
              ? "결제 모듈 로딩 중..."
              : `₩${pkg.amount.toLocaleString()} 결제하기`}
          </button>

          <p className="text-xs text-[#8B89A0] text-center mt-4">
            토스페이먼츠로 안전하게 결제됩니다 · 결제 후 즉시 크레딧이 충전됩니다
          </p>
        </div>
      </div>
    </>
  );
}
