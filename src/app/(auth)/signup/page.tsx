"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 로그인 페이지가 회원가입을 통합 처리 (Magic Link OTP)
export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
