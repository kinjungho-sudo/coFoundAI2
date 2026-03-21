"use client";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) setError(decodeURIComponent(callbackError));
  }, [searchParams]);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/interview");
    });
  }, [router, supabase]);

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/interview`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (authError) setError(authError.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4">
      {/* 배경 장식 */}
      <div className="fixed top-20 right-20 w-72 h-72 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />
      <div className="fixed bottom-20 left-20 w-48 h-48 rounded-full opacity-5 pointer-events-none"
        style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />

      {/* 카드 */}
      <div className="w-full max-w-md relative">
        {/* 로고 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-[#F0A500] flex items-center justify-center group-hover:bg-[#f5b530] transition-colors">
              <span className="text-[#0B1120] text-2xl font-black">F</span>
            </div>
            <span className="text-white text-xl font-black tracking-tight">Foal AI</span>
          </Link>
          <p className="text-[#8B9AB0] text-sm mt-2">AI 창업 멘토와 함께 아이디어를 검증하세요</p>
        </div>

        {sent ? (
          /* 이메일 전송 완료 */
          <div className="bg-[#1E2D48] rounded-3xl p-8 text-center border border-[#2A3D58]">
            <div className="w-14 h-14 rounded-full bg-[#F0A500]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#F0A500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">이메일을 확인해주세요</p>
            <p className="text-[#8B9AB0] text-sm leading-relaxed">
              <span className="text-[#F0A500] font-medium">{email}</span>으로<br />
              로그인 링크를 보냈습니다.<br />
              링크를 클릭하면 바로 시작됩니다.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-6 text-xs text-[#8B9AB0] hover:text-white transition-colors underline"
            >
              다른 이메일로 시도
            </button>
          </div>
        ) : (
          <div className="bg-[#1E2D48] rounded-3xl p-8 border border-[#2A3D58]">
            <h2 className="text-white font-black text-xl mb-6 text-center">시작하기</h2>

            {/* Google 로그인 */}
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-semibold rounded-2xl transition-colors text-sm"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Google로 계속하기
            </button>

            {/* 구분선 */}
            <div className="flex items-center gap-4 my-5">
              <div className="flex-1 h-px bg-[#2A3D58]" />
              <span className="text-[#4A5568] text-xs">또는</span>
              <div className="flex-1 h-px bg-[#2A3D58]" />
            </div>

            {/* 이메일 Magic Link */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  maxLength={254}
                  className="w-full bg-[#0B1120] border border-[#2A3D58] focus:border-[#F0A500] rounded-2xl px-4 py-3.5 text-white placeholder-[#4A5568] text-sm outline-none transition-colors"
                />
                {error && (
                  <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3.5 bg-[#F0A500] hover:bg-[#f5b530] disabled:opacity-50 text-[#0B1120] font-black rounded-2xl transition-colors text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0B1120]/30 border-t-[#0B1120] rounded-full animate-spin" />
                    전송 중...
                  </span>
                ) : "이메일 링크로 시작하기"}
              </button>
            </form>

            <p className="text-xs text-[#4A5568] text-center mt-4">
              계정이 없으면 자동으로 가입됩니다 · 비밀번호 불필요
            </p>
          </div>
        )}

        <p className="text-center mt-6">
          <Link href="/" className="text-[#4A5568] hover:text-white text-xs transition-colors">
            ← 홈으로
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F0A500] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
