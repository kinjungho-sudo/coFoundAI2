"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // auth/callback에서 넘어온 에러 표시
  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) setError(callbackError);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/interview`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[#534AB7] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-[#E8E6F0]">CoFound AI</h1>
          <p className="text-[#8B89A0] mt-2 text-sm">AI 공동창업자와 아이디어를 검증하세요</p>
        </div>

        {sent ? (
          <div className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1D9E75]/20 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
                <path d="M20 4L9.17 14.83" />
                <path d="M14 3l7 7" />
              </svg>
            </div>
            <p className="text-[#E8E6F0] font-semibold mb-2">이메일을 확인해주세요</p>
            <p className="text-[#8B89A0] text-sm">
              <span className="text-[#534AB7]">{email}</span>로 로그인 링크를 전송했습니다.
              <br />링크를 클릭해서 시작하세요.
            </p>
          </div>
        ) : (
          <div className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-8">
            <h2 className="text-lg font-semibold text-[#E8E6F0] mb-6">로그인 / 회원가입</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8B89A0] mb-2">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@cofound.ai"
                  maxLength={254}
                  className="w-full bg-[#0F0E17] border border-[#2D2B42] focus:border-[#534AB7] rounded-xl px-4 py-3 text-[#E8E6F0] placeholder-[#8B89A0] text-sm outline-none transition-colors"
                />
                {error && <p className="text-[#E24B4A] text-xs mt-1">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#534AB7] hover:bg-[#6259c7] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {isLoading ? "전송 중..." : "이메일로 시작하기"}
              </button>
            </form>
            <p className="text-xs text-[#8B89A0] text-center mt-4">
              계정이 없으면 자동으로 가입됩니다
            </p>
          </div>
        )}

        <p className="text-center text-[#8B89A0] text-xs mt-6">
          <Link href="/" className="hover:text-[#E8E6F0] transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F0E17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
