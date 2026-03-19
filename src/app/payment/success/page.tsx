"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        if (res.ok) {
          const data = await res.json();
          setNewBalance(data.new_balance);
          setStatus("success");
        } else {
          const err = await res.json();
          setErrorMsg(err.error || "결제 확인에 실패했습니다.");
          setStatus("error");
        }
      } catch {
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setStatus("error");
      }
    })();
  }, [paymentKey, orderId, amount]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#8B89A0] text-sm">결제를 확인하는 중...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[#E24B4A]/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#E8E6F0] mb-2">결제 실패</h2>
        <p className="text-[#8B89A0] text-sm mb-6">{errorMsg}</p>
        <button
          onClick={() => router.push("/payment")}
          className="px-6 py-3 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-[#1D9E75]/20 flex items-center justify-center mx-auto mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-[#E8E6F0] mb-2">결제 완료!</h2>
      <p className="text-[#8B89A0] text-sm mb-2">크레딧이 충전되었습니다</p>
      {newBalance !== null && (
        <p className="text-2xl font-bold text-[#F5A623] mb-6">
          잔액 <span>{newBalance}</span> 크레딧
        </p>
      )}
      <button
        onClick={() => router.push("/interview")}
        className="w-full py-3 bg-[#534AB7] hover:bg-[#6259c7] text-white font-semibold rounded-xl transition-colors"
      >
        인터뷰 시작하기
      </button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-8">
        <Suspense
          fallback={
            <div className="flex justify-center">
              <div className="w-10 h-10 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
