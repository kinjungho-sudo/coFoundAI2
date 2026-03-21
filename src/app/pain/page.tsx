"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PAIN_POINTS = [
  { id: 1, text: "사업계획서를 처음 접할 때의 막막함", delay: 0 },
  { id: 2, text: "어디서부터 시작해야 할지 모르겠는 막연함", delay: 0.4 },
  { id: 3, text: "심사 기준에 맞는지 확신이 없는 불안감", delay: 0.8 },
  { id: 4, text: "아이디어는 있는데 글로 못 쓰는 답답함", delay: 1.2 },
  { id: 5, text: "컨설팅 비용 100~300만원의 부담", delay: 1.6 },
  { id: 6, text: "매번 다른 양식에 맞춰 처음부터 다시 쓰는 낭비", delay: 2.0 },
];

const STATS = [
  { num: "87%", label: "예비창업자가 사업계획서 작성에 어려움을 겪음" },
  { num: "평균 3주", label: "초안 완성까지 걸리는 시간" },
  { num: "150만원↑", label: "창업 컨설팅 평균 비용" },
  { num: "62%", label: "첫 제출 후 탈락 (사업계획서 미흡 사유)" },
];

const BEFORE_AFTER = [
  {
    before: "막연하게 구글 검색",
    after: "9단계 질문으로 핵심 발견",
    icon: "🔍",
  },
  {
    before: "빈 문서 앞에서 멍하니",
    after: "AI가 구조 잡고 초안 완성",
    icon: "📄",
  },
  {
    before: "심사 기준 파악 불가",
    after: "예비창업패키지 기준 100% 대응",
    icon: "✅",
  },
  {
    before: "컨설턴트 비용 100~300만원",
    after: "9,900원으로 동일 퀄리티",
    icon: "💰",
  },
  {
    before: "제출 후 불안한 대기",
    after: "악마의 변호인으로 사전 검증",
    icon: "🛡️",
  },
];

export default function PainPointsPage() {
  const [visible, setVisible] = useState(false);
  const [activeBubble, setActiveBubble] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const cycle = setInterval(() => {
      setActiveBubble(i % PAIN_POINTS.length);
      i++;
    }, 2200);
    return () => clearInterval(cycle);
  }, [visible]);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      {/* 네비 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "rgba(11,17,32,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(240,165,0,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center">
            <span className="text-[#0B1120] text-sm font-black">F</span>
          </div>
          <span className="font-black text-lg">Foal AI</span>
        </Link>
        <Link href="/login"
          className="px-5 py-2.5 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors">
          무료로 시작하기
        </Link>
      </nav>

      {/* 히어로 — 페인포인트 */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 relative overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px w-8 bg-[#F0A500]" />
            <span className="text-[#F0A500] text-xs font-bold tracking-widest uppercase">창업자의 현실</span>
            <div className="h-px w-8 bg-[#F0A500]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
            매년 창업 지원사업
            <br />
            <span className="text-[#F0A500]">사업계획서 쓰는 데</span>
            <br />
            시간을 쏟고 계신가요?
          </h1>
          <p className="text-[#8B9AB0] text-lg mb-16">
            좋은 아이디어가 있어도, 사업계획서라는 벽에 막힙니다.
          </p>

          {/* 문서 + 버블 */}
          <div className="relative w-full max-w-2xl mx-auto" style={{ height: "520px" }}>
            {/* 중앙 문서 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-52 bg-white rounded-2xl shadow-2xl p-5 z-10"
              style={{ transform: "translate(-50%, -50%) rotate(-1deg)" }}>
              <div className="text-gray-800 text-sm font-bold text-center mb-4 pb-2 border-b border-gray-100">
                사업계획서
              </div>
              <div className="space-y-2">
                {[100, 85, 95, 70, 90, 75, 88, 60, 80, 65, 92, 55, 78].map((w, i) => (
                  <div key={i} className={`h-2 bg-gray-100 rounded-full`} style={{ width: `${w}%` }} />
                ))}
              </div>
              {/* 막힌 느낌 오버레이 */}
              <div className="absolute inset-0 rounded-2xl bg-gray-900/5 flex items-center justify-center">
                <div className="text-4xl">😶</div>
              </div>
            </div>

            {/* 플로팅 버블들 */}
            {[
              { text: "사업계획서를 처음 접할 때의 막막함", x: "4%", y: "8%", align: "left" },
              { text: "어디서부터 시작해야 할지 모르겠는 막연함", x: "48%", y: "2%", align: "center" },
              { text: "심사 기준에 맞는지 확신이 없는 불안감", x: "58%", y: "18%", align: "right" },
              { text: "아이디어는 있는데 글로 못 쓰는 답답함", x: "2%", y: "62%", align: "left" },
              { text: "컨설팅 비용 100~300만원의 부담", x: "58%", y: "70%", align: "right" },
              { text: "매번 다른 양식에 처음부터 다시 쓰는 낭비", x: "20%", y: "88%", align: "left" },
            ].map((bubble, i) => (
              <div
                key={i}
                className="absolute transition-all duration-700"
                style={{
                  left: bubble.x,
                  top: bubble.y,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: `${i * 0.15}s`,
                }}
              >
                <div className={`
                  bg-[#1E2D48] border text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap
                  transition-all duration-300
                  ${activeBubble === i
                    ? "border-[#F0A500] shadow-[0_0_16px_rgba(240,165,0,0.3)] scale-105"
                    : "border-[#2A3D58]"
                  }
                `}>
                  {activeBubble === i && <span className="mr-1.5">😣</span>}
                  {bubble.text}
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-8 transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transitionDelay: "1s" }}
          >
            <Link href="/login"
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-xl hover:bg-[#f5b530] transition-colors shadow-2xl">
              이 고통을 끝내러 가기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="bg-[#060C18] py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="text-center p-6 bg-[#1E2D48] rounded-2xl">
              <p className="text-3xl font-black text-[#F0A500] mb-2">{s.num}</p>
              <p className="text-xs text-[#8B9AB0] leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-px w-12 bg-[#F0A500] mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black">
              Foal AI를 쓰면<br />
              <span className="text-[#F0A500]">이렇게 달라집니다</span>
            </h2>
          </div>

          {/* 컬럼 헤더 */}
          <div className="grid grid-cols-2 gap-4 mb-4 px-2">
            <div className="text-center">
              <span className="inline-block bg-[#1E2D48] text-[#8B9AB0] text-sm font-bold px-5 py-2 rounded-full">
                ❌ 지금까지
              </span>
            </div>
            <div className="text-center">
              <span className="inline-block bg-[#F0A500]/10 text-[#F0A500] text-sm font-bold px-5 py-2 rounded-full border border-[#F0A500]/30">
                ✅ Foal AI와 함께
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {BEFORE_AFTER.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 items-center">
                {/* Before */}
                <div className="bg-[#1E2D48] rounded-2xl p-5 flex items-center gap-3 border border-[#2A3D58]">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-[#8B9AB0] text-sm line-through">{item.before}</p>
                </div>
                {/* After */}
                <div className="bg-[#1E2D48] rounded-2xl p-5 flex items-center gap-3 border border-[#F0A500]/30">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-white text-sm font-semibold">{item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 고객 목소리 */}
      <section className="bg-[#060C18] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">창업자들이 직접 말합니다</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "3주 동안 혼자 끙끙대던 사업계획서를 Foal AI 인터뷰 하루 만에 초안을 완성했어요. 질문에 답하다 보니 제가 뭘 원하는지가 명확해졌습니다.",
                name: "이준혁",
                role: "예비창업자 · 예비창업패키지 합격",
              },
              {
                quote: "컨설팅 업체에 200만원 견적을 받았는데, Foal AI 쓰고 나서 그냥 직접 썼어요. 오히려 더 내 이야기 같고, 심사위원도 진정성 있다고 했대요.",
                name: "박서연",
                role: "초기창업자 · 초기창업패키지 선정",
              },
              {
                quote: "사업계획서 양식 보는 순간 멈췄었어요. 근데 Foal AI가 질문을 던지고, 그 답이 자연스럽게 계획서가 됐어요. 마법 같았습니다.",
                name: "김민찬",
                role: "예비창업자 · 청년창업사관학교 입교",
              },
            ].map((t, i) => (
              <div key={i} className="bg-[#1E2D48] rounded-2xl p-6 border border-[#2A3D58]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-[#F0A500]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#C8D3E0] text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-white text-sm font-bold">{t.name}</p>
                  <p className="text-[#8B9AB0] text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="h-px w-12 bg-[#F0A500] mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            사업계획서,<br />
            <span className="text-[#F0A500]">이제 혼자 쓰지 마세요</span>
          </h2>
          <p className="text-[#8B9AB0] text-lg mb-10">
            9단계 인터뷰에 답하기만 하면 됩니다.<br />
            9,900원으로 5,000만원짜리 기회를 준비하세요.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-xl hover:bg-[#f5b530] transition-colors shadow-2xl">
            지금 무료로 시작하기
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-[#4A5568] text-sm mt-4">이메일로 바로 시작 · 선착순 500명 3개월 무료</p>
        </div>
      </section>

      {/* 스티키 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F0A500] px-6 py-3 flex items-center justify-between">
        <p className="text-[#0B1120] text-sm font-bold">
          얼리버드 <strong>3개월 전체 무료</strong> — 선착순 마감
        </p>
        <Link href="/login"
          className="px-5 py-2 bg-[#0B1120] text-[#F0A500] text-sm font-black rounded-xl hover:bg-[#1a2540] transition-colors">
          무료 시작 →
        </Link>
      </div>
      <div className="h-12" />
    </div>
  );
}
