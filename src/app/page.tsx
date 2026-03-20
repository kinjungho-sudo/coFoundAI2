"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const EARLYBIRD_TOTAL = 500;

export default function LandingPage() {
  const [earlybirdCount, setEarlybirdCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/earlybird/status")
      .then((r) => r.json())
      .then((d) => setEarlybirdCount(d.count ?? 0))
      .catch(() => setEarlybirdCount(0));
  }, []);

  const remaining =
    earlybirdCount !== null ? Math.max(0, EARLYBIRD_TOTAL - earlybirdCount) : null;

  return (
    <div className="min-h-screen bg-[#0F0E17] text-[#E8E6F0]">
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#2D2B42]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white text-sm font-bold">F</span>
          </div>
          <span className="font-semibold text-lg">Foal AI</span>
          <span className="text-xs text-[#8B89A0] hidden sm:block">by 코마인드웍스</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          시작하기
        </Link>
      </nav>

      {/* 히어로 */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1A1927] border border-[#2D2B42] rounded-full px-4 py-2 text-xs text-[#8B89A0] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          AI 창업 멘토와 함께 아이디어를 검증하세요
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-6">
          우리는 모두 아직
          <br />
          <span className="text-[#534AB7]">Foal</span>입니다.
        </h1>

        <p className="text-[#8B89A0] text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
          AI가 답을 주는 게 아니라, 질문을 던집니다.
          <br />
          9단계 인터뷰로 아이디어를 검증하고, 사업계획서 언어로 번역합니다.
        </p>

        <p className="text-[#534AB7] text-sm font-medium mb-10">
          9,900원으로 5,000만원 예비창업패키지를 준비하세요. ROI 5,000배.
        </p>

        {/* 얼리버드 카운터 */}
        <div className="max-w-sm mx-auto mb-8 bg-[#1A1927] border border-[#534AB7]/40 rounded-2xl p-5">
          <p className="text-xs text-[#8B89A0] mb-2">얼리어답터 무료 혜택 (선착순 500명)</p>
          {earlybirdCount !== null ? (
            <>
              <div className="flex justify-between text-xs text-[#8B89A0] mb-2">
                <span>가입 완료</span>
                <span>
                  <span className="text-[#E8E6F0] font-bold">{earlybirdCount}</span> / {EARLYBIRD_TOTAL}명
                </span>
              </div>
              <div className="w-full h-2 bg-[#2D2B42] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#534AB7] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (earlybirdCount / EARLYBIRD_TOTAL) * 100)}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-[#1D9E75]">
                {remaining! > 0
                  ? `남은 자리 ${remaining}명 — 3개월 전체 기능 무료`
                  : "얼리버드 마감 — 크레딧 패키지로 이용 가능합니다"}
              </p>
            </>
          ) : (
            <div className="h-8 bg-[#2D2B42] rounded-lg animate-pulse" />
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-[#534AB7] hover:bg-[#6259c7] text-white font-semibold rounded-2xl transition-colors text-lg"
          >
            {remaining !== null && remaining > 0 ? "무료로 시작하기" : "지금 시작하기"}
          </Link>
          <span className="text-[#8B89A0] text-sm">이메일로 바로 시작 · 회원가입 불필요</span>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "💬",
              color: "#534AB7",
              title: "9단계 소크라테스 인터뷰",
              desc: "AI가 답을 주는 게 아니라 질문을 던집니다. JTBD 발견 단계를 포함한 9단계 대화로 아이디어의 핵심을 스스로 찾으세요.",
            },
            {
              icon: "🎯",
              color: "#1D9E75",
              title: "JTBD 분석표 자동 생성",
              desc: "기능적·감정적·사회적 과업을 분석하여 '고객이 진짜 원하는 것'을 찾아냅니다. 인터뷰 완료 후 무료로 자동 생성됩니다.",
            },
            {
              icon: "📄",
              color: "#F5A623",
              title: "사업계획서 즉시 생성",
              desc: "61점 이상 달성 시 예비창업패키지 공식 양식의 사업계획서를 즉시 생성합니다. JTBD 분석이 자동으로 포함됩니다.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-6"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ backgroundColor: `${f.color}20` }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-[#E8E6F0] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8B89A0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 추가 기능 행 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* 사업계획서 평가 */}
          <div className="bg-[#1A1927] border border-[#534AB7]/30 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#534AB7]/20 flex items-center justify-center text-xl flex-shrink-0">
              📋
            </div>
            <div>
              <h3 className="font-semibold text-[#E8E6F0] mb-1">사업계획서 평가 리포트</h3>
              <p className="text-sm text-[#8B89A0] leading-relaxed">
                이미 작성한 사업계획서를 예비창업패키지 심사기준(PSST)으로 평가합니다. 제출 전 미리 검토받으세요.
              </p>
            </div>
          </div>

          {/* 악마의 변호인 */}
          <div className="bg-[#1A1927] border border-[#E24B4A]/30 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E24B4A]/20 flex items-center justify-center text-xl flex-shrink-0">
              😈
            </div>
            <div>
              <h3 className="font-semibold text-[#E24B4A] mb-1">악마의 변호인</h3>
              <p className="text-sm text-[#8B89A0] leading-relaxed">
                심사위원 관점에서 사업계획의 취약점을 냉철하게 분석합니다. 칭찬이 아니라 진짜 피드백을 받으세요.
              </p>
            </div>
          </div>
        </div>

        {/* ROI 강조 배너 */}
        <div className="mt-6 bg-gradient-to-r from-[#534AB7]/20 to-[#1D9E75]/20 border border-[#534AB7]/30 rounded-2xl p-6 text-center">
          <p className="text-sm text-[#8B89A0] mb-1">핵심 논리</p>
          <p className="text-xl font-bold text-[#E8E6F0]">
            9,900원을 써서 <span className="text-[#1D9E75]">5,000만원</span>을 받는다.
          </p>
          <p className="text-xs text-[#8B89A0] mt-1">예비창업패키지 평균 지원금 기준 · ROI 5,000배</p>
        </div>
      </section>

      {/* 하단 */}
      <footer className="border-t border-[#2D2B42] px-8 py-6 text-center text-xs text-[#8B89A0]">
        © 2026 코마인드웍스 (CoMindWorks) · Foal AI — 예비창업자를 위한 AI 창업 멘토
      </footer>
    </div>
  );
}
