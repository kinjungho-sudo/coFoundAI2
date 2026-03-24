"use client";

export const runtime = 'edge';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

/* ─── 시나리오 데이터 ─── */
const SCENARIO = [
  {
    step: 1,
    aiQ: "안녕하세요. 저는 AI 창업 멘토, Foal AI입니다.\n지금 해결하고 싶은 문제가 뭔가요?",
    userA: "소상공인들이 광고비를 써도 효과가 없어요. 어디에 얼마나 써야 하는지 모르거든요.",
    score: { target: 8, pain: 10, diff: 6, founder: 5, feasibility: 7 },
  },
  {
    step: 2,
    aiQ: "그 문제를 가장 심각하게 겪는 사람은 누구인가요?\n이름, 나이, 직업까지 구체적으로 떠올려 보세요.",
    userA: "반경 500m 안에 고객이 다 있는데 SNS 광고로 전국에 뿌리는 40대 치킨집 사장님이요. 월 50만원씩 쓰는데 효과를 모르겠다고 하세요.",
    score: { target: 16, pain: 14, diff: 9, founder: 8, feasibility: 11 },
  },
  {
    step: 3,
    aiQ: "그 사장님은 지금 이 문제를 어떻게 해결하고 있나요?\n완벽하지 않아도 현재 방법이 있을 겁니다.",
    userA: "배달의민족 광고, 동네 현수막, 가끔 전단지 돌리고 있는데 뭐가 효과 있는지 모른다고 해요. 그냥 감으로 해요.",
    score: { target: 18, pain: 17, diff: 13, founder: 12, feasibility: 14 },
  },
  {
    step: 4,
    aiQ: "그 사장님이 진짜 원하는 건 '광고 도구'가 아닙니다.\n그 도구를 통해 얻고 싶은 결과는 무엇인가요?",
    userA: "돈 낭비 없이 근처 단골 손님을 만들고 싶은 거예요. 지금 오는 손님이 다시 오게 하고 새 손님이 들어오는 것.",
    score: { target: 19, pain: 18, diff: 16, founder: 15, feasibility: 16 },
  },
];

const PLAN_SECTIONS = [
  { code: "1-1", title: "창업 아이템명", content: "AI 기반 하이퍼로컬 소상공인 광고 최적화 플랫폼 '니어리(Nearly)'" },
  { code: "1-2", title: "아이템 개요", content: "소상공인이 반경 1km 내 잠재 고객의 행동 패턴을 AI로 분석하여 최적의 시간·채널·메시지로 광고를 집행하고 효과를 실시간 측정할 수 있는 서비스" },
  { code: "1-4", title: "시장 분석", content: "국내 소상공인 광고 시장 14조원 (TAM) → 디지털 전환 소상공인 580억 (SAM) → 초기 목표 수도권 5억 (SOM)" },
  { code: "2-1", title: "차별점", content: "기존 전국 타겟팅 → 반경 1km 정밀 타겟, 광고 효과 블랙박스 → 매출 연동 ROI 실시간 측정, 월 50만원 → 성과 기반 과금으로 낭비 제거" },
];

const DIMS = [
  { key: "target", label: "타겟 고객", max: 20 },
  { key: "pain", label: "페인포인트", max: 20 },
  { key: "diff", label: "차별점", max: 20 },
  { key: "founder", label: "창업자 적합성", max: 20 },
  { key: "feasibility", label: "실행 가능성", max: 20 },
] as const;

/* ─── 타이핑 훅 ─── */
function useTyping(text: string, active: boolean, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    idxRef.current = 0;
  }, [text]);

  useEffect(() => {
    if (!active) return;
    if (idxRef.current >= text.length) { setDone(true); return; }
    const t = setTimeout(() => {
      idxRef.current++;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) setDone(true);
    }, speed);
    return () => clearTimeout(t);
  }, [active, displayed, text, speed]);

  return { displayed, done };
}

/* ─── 메인 데모 컴포넌트 ─── */
type Phase = "ai-typing" | "user-typing" | "scoring" | "plan" | "done";

function LiveDemo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ai-typing");
  const [scores, setScores] = useState({ target: 0, pain: 0, diff: 0, founder: 0, feasibility: 0 });
  const [planIdx, setPlanIdx] = useState(0);
  const [chat, setChat] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scene = SCENARIO[sceneIdx] ?? SCENARIO[SCENARIO.length - 1];

  const aiTyping = useTyping(scene.aiQ, phase === "ai-typing");
  const userTyping = useTyping(scene.userA, phase === "user-typing", 22);

  /* AI 타이핑 완료 → 잠깐 대기 → user 타이핑 */
  useEffect(() => {
    if (phase === "ai-typing" && aiTyping.done) {
      const t = setTimeout(() => setPhase("user-typing"), 600);
      return () => clearTimeout(t);
    }
  }, [phase, aiTyping.done]);

  /* 유저 타이핑 완료 → 채팅 기록 + 점수 애니메이션 */
  useEffect(() => {
    if (phase === "user-typing" && userTyping.done) {
      setChat(prev => [
        ...prev,
        { role: "ai", text: scene.aiQ },
        { role: "user", text: scene.userA },
      ]);
      const t = setTimeout(() => setPhase("scoring"), 400);
      return () => clearTimeout(t);
    }
  }, [phase, userTyping.done, scene]);

  /* 점수 카운트업 */
  useEffect(() => {
    if (phase !== "scoring") return;
    const target = scene.score;
    const duration = 900;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const ratio = step / steps;
      setScores({
        target: Math.round(target.target * ratio),
        pain: Math.round(target.pain * ratio),
        diff: Math.round(target.diff * ratio),
        founder: Math.round(target.founder * ratio),
        feasibility: Math.round(target.feasibility * ratio),
      });
      if (step >= steps) {
        clearInterval(t);
        setScores(target);
        // 마지막 씬이면 plan 단계
        if (sceneIdx === SCENARIO.length - 1) {
          setTimeout(() => { setShowPlan(true); setPhase("plan"); }, 700);
        } else {
          setTimeout(() => {
            setSceneIdx(i => i + 1);
            setPhase("ai-typing");
          }, 1200);
        }
      }
    }, interval);
    return () => clearInterval(t);
  }, [phase, scene.score, sceneIdx]);

  /* 사업계획서 섹션 순차 등장 */
  useEffect(() => {
    if (phase !== "plan") return;
    setPlanIdx(0);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setPlanIdx(i);
      if (i >= PLAN_SECTIONS.length) {
        clearInterval(t);
        setTimeout(() => setPhase("done"), 1000);
      }
    }, 900);
    return () => clearInterval(t);
  }, [phase]);

  /* done → 처음부터 루프 */
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      setSceneIdx(0);
      setPhase("ai-typing");
      setChat([]);
      setScores({ target: 0, pain: 0, diff: 0, founder: 0, feasibility: 0 });
      setShowPlan(false);
      setPlanIdx(0);
    }, 4000);
    return () => clearTimeout(t);
  }, [phase]);

  /* 채팅 스크롤 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, aiTyping.displayed, userTyping.displayed]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-[#0B1120] rounded-3xl border border-[#2A3D58] overflow-hidden shadow-2xl" style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* 창 헤더 */}
      <div className="flex items-center gap-2 px-5 py-3 bg-[#060C18] border-b border-[#2A3D58]">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-[#4A5568] font-medium">Foal AI — 창업 인터뷰</span>
        <div className="ml-auto flex items-center gap-1.5">
          {SCENARIO.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= sceneIdx ? "bg-[#F0A500]" : "bg-[#1E2D48]"}`} />
          ))}
          <span className="text-[#4A5568] text-xs ml-2">STEP {sceneIdx + 1}/9</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* 왼쪽: 채팅 */}
        <div className="border-r border-[#2A3D58] flex flex-col" style={{ height: 460 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {/* 기존 채팅 기록 */}
            {chat.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-[#F0A500] flex-shrink-0 flex items-center justify-center text-[#0B1120] text-xs font-black">F</div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === "ai"
                    ? "bg-[#1E2D48] text-[#C8D3E0] rounded-tl-none"
                    : "bg-[#F0A500] text-[#0B1120] font-medium rounded-tr-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* 현재 AI 타이핑 */}
            {phase === "ai-typing" && aiTyping.displayed && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F0A500] flex-shrink-0 flex items-center justify-center text-[#0B1120] text-xs font-black">F</div>
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tl-none bg-[#1E2D48] text-[#C8D3E0] text-xs leading-relaxed whitespace-pre-line">
                  {aiTyping.displayed}
                  <span className="inline-block w-1 h-3 bg-[#F0A500] ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* 현재 유저 타이핑 */}
            {phase === "user-typing" && userTyping.displayed && (
              <div className="flex gap-2 justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-none bg-[#F0A500] text-[#0B1120] text-xs font-medium leading-relaxed">
                  {userTyping.displayed}
                  <span className="inline-block w-1 h-3 bg-[#0B1120]/40 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* 입력창 */}
          <div className="border-t border-[#2A3D58] p-3 flex items-center gap-2">
            <div className="flex-1 bg-[#1E2D48] rounded-xl px-3 py-2 text-xs text-[#4A5568]">
              {phase === "ai-typing" ? "AI가 질문하는 중..." :
               phase === "user-typing" ? "답변 입력 중..." :
               phase === "scoring" ? "점수 분석 중..." : "답변을 입력하세요..."}
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${phase === "user-typing" ? "bg-[#F0A500]" : "bg-[#1E2D48]"}`}>
              <svg className={`w-4 h-4 ${phase === "user-typing" ? "text-[#0B1120]" : "text-[#4A5568]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 오른쪽: 점수 + 사업계획서 */}
        <div className="flex flex-col overflow-y-auto" style={{ height: 460 }}>
          {!showPlan ? (
            /* 점수 패널 */
            <div className="p-5 flex-1">
              <div className="text-center mb-5">
                <p className="text-[#8B9AB0] text-xs mb-1">창업 아이디어 점수</p>
                <div className="relative inline-flex items-end gap-1">
                  <span className="text-6xl font-black text-white leading-none">{totalScore}</span>
                  <span className="text-[#4A5568] text-lg mb-1">/100</span>
                </div>
                <div className="mt-1">
                  {totalScore >= 61 ? (
                    <span className="text-xs bg-[#F0A500] text-[#0B1120] font-black px-3 py-1 rounded-full">합격 기준 달성 ✓</span>
                  ) : (
                    <span className="text-xs text-[#8B9AB0]">합격 기준 61점</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {DIMS.map((d) => {
                  const val = scores[d.key];
                  const pct = (val / d.max) * 100;
                  return (
                    <div key={d.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8B9AB0]">{d.label}</span>
                        <span className="text-white font-bold">{val}<span className="text-[#4A5568]">/{d.max}</span></span>
                      </div>
                      <div className="h-1.5 bg-[#1E2D48] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-100"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 70 ? "#F0A500" : pct >= 50 ? "#3B82F6" : "#4A5568",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalScore >= 61 && (
                <div className="mt-4 p-3 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-xl text-center">
                  <p className="text-[#F0A500] text-xs font-bold">사업계획서 생성 가능!</p>
                </div>
              )}
            </div>
          ) : (
            /* 사업계획서 자동 작성 */
            <div className="p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F0A500] animate-pulse" />
                <p className="text-[#F0A500] text-xs font-bold">사업계획서 자동 작성 중...</p>
              </div>
              <div className="space-y-3">
                {PLAN_SECTIONS.slice(0, planIdx).map((sec, i) => (
                  <div key={i}
                    className="bg-[#1E2D48] rounded-xl p-3 border border-[#2A3D58]"
                    style={{ animation: "fadeSlideIn 0.4s ease-out" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#F0A500] bg-[#F0A500]/10 px-2 py-0.5 rounded">{sec.code}</span>
                      <span className="text-xs font-bold text-white">{sec.title}</span>
                    </div>
                    <p className="text-xs text-[#8B9AB0] leading-relaxed">{sec.content}</p>
                  </div>
                ))}
                {planIdx < PLAN_SECTIONS.length && (
                  <div className="bg-[#1E2D48] rounded-xl p-3 border border-[#2A3D58] border-dashed animate-pulse">
                    <div className="flex gap-2 items-center">
                      <div className="w-4 h-4 border border-[#F0A500] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-[#4A5568]">작성 중...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── 페이지 ─── */
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 네비 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "rgba(11,17,32,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(240,165,0,0.1)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center">
            <span className="text-[#0B1120] text-sm font-black">F</span>
          </div>
          <span className="font-black text-lg text-white">Foal AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pain" className="text-[#8B9AB0] text-sm hover:text-white transition-colors hidden md:block">창업자의 현실</Link>
          <Link href="/login" className="px-5 py-2.5 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors">
            무료로 시작하기
          </Link>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="pt-28 pb-10 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10"
            style={{ background: "radial-gradient(ellipse, #F0A500, transparent)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-full px-4 py-1.5 text-xs text-[#F0A500] font-bold mb-8">
            🎬 실시간 데모 — 실제 작동 방식
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4">
            9단계 AI 인터뷰로
            <br />
            <span className="text-[#F0A500]">사업계획서 전부 자동화</span>
          </h1>
          <p className="text-[#8B9AB0] text-lg mb-4">
            질문에 답하기만 하면, 나머지는 AI가 합니다
          </p>
          <p className="text-[#4A5568] text-sm mb-12">
            ※ 아래는 실제 Foal AI 작동 방식을 시뮬레이션한 데모입니다
          </p>
        </div>
      </section>

      {/* 라이브 데모 */}
      <section className="px-4 md:px-8 pb-16">
        <LiveDemo />
      </section>

      {/* 설명 */}
      <section className="py-16 px-6 border-t border-[#1E2D48]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "질문에 답하기", desc: "AI가 9개의 소크라테스식 질문을 던집니다. 답변할수록 아이디어가 명확해집니다.", icon: "💬" },
            { step: "02", title: "실시간 채점", desc: "타겟 고객, 페인포인트, 차별점 등 5가지 차원에서 실시간으로 점수가 쌓입니다.", icon: "📊" },
            { step: "03", title: "사업계획서 완성", desc: "61점 달성 시 예비창업패키지 공식 양식에 맞는 사업계획서가 자동으로 완성됩니다.", icon: "📄" },
          ].map((item) => (
            <div key={item.step} className="bg-[#1E2D48] rounded-2xl p-6 border border-[#2A3D58]">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-[#F0A500] text-xs font-black mb-2">STEP {item.step}</div>
              <h3 className="text-white font-black text-lg mb-2">{item.title}</h3>
              <p className="text-[#8B9AB0] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black text-white mb-4">
            직접 해보세요
          </h2>
          <p className="text-[#8B9AB0] mb-8">선착순 500명 · 3개월 전체 기능 무료</p>
          <Link href="/login"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-xl hover:bg-[#f5b530] transition-colors shadow-2xl">
            무료 인터뷰 시작하기
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* 스티키 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F0A500] px-6 py-3 flex items-center justify-between">
        <p className="text-[#0B1120] text-sm font-bold">
          얼리버드 <strong>3개월 전체 무료</strong> — 선착순 마감
        </p>
        <Link href="/login" className="px-5 py-2 bg-[#0B1120] text-[#F0A500] text-sm font-black rounded-xl hover:bg-[#1a2540] transition-colors">
          무료 시작 →
        </Link>
      </div>
      <div className="h-12" />
    </div>
  );
}
