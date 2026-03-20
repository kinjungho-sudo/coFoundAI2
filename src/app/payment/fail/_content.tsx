"use client";

import { useSearchParams, useRouter } from "next/navigation";

export function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code") || "";
  const message = searchParams.get("message") || "결제가 취소되었습니다.";

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
      <p className="text-[#8B89A0] text-sm mb-1">{message}</p>
      {code && <p className="text-xs text-[#8B89A0] mb-6">코드: {code}</p>}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push("/payment")}
          className="w-full py-3 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          다시 시도
        </button>
        <button
          onClick={() => router.push("/interview")}
          className="w-full py-3 bg-[#1A1927] border border-[#2D2B42] hover:border-[#534AB7] text-[#8B89A0] hover:text-[#E8E6F0] text-sm rounded-xl transition-colors"
        >
          인터뷰로 돌아가기
        </button>
      </div>
    </div>
  );
}
