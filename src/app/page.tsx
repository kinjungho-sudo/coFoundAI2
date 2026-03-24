"use client";

export const runtime = 'edge';

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/* ─── 얼리버드 ─── */
const EARLYBIRD_TOTAL = 500;

/* ─── HOW IT WORKS 스텝 ─── */
const STEPS = [
  { n: 1, label: "문제 탐색", desc: "지금 해결하고 싶은 문제가 뭔가요?" },
  { n: 2, label: "한 줄 정의", desc: "핵심 문제를 한 문장으로" },
  { n: 3, label: "타겟 고객", desc: "누가 이 문제로 밤잠을 설치는가" },
  { n: 4, label: "JTBD 발견", desc: "고객이 진짜 원하는 것은 무엇인가" },
  { n: 5, label: "페인포인트 검증", desc: "지금 어떻게 해결하고 있는가" },
  { n: 6, label: "차별점 발굴", desc: "왜 당신의 해결책이어야 하는가" },
  { n: 7, label: "창업자 강점", desc: "왜 당신이 해야 하는가" },
  { n: 8, label: "리소스 파악", desc: "지금 가진 것과 필요한 것" },
  { n: 9, label: "다음 액션", desc: "이번 주 딱 하나만 한다면" },
];

const QUOTES = [
  { text: "AI가 답을 주는 게 아니라 질문을 던진다는 게 처음엔 이상했어요. 근데 그게 핵심이더라고요. 스스로 답을 찾게 됩니다.", name: "이준혁", role: "예비창업자" },
  { text: "예비창업패키지 준비하면서 방향을 못 잡고 있었는데, 인터뷰 한 번에 사업의 핵심이 명확해졌습니다.", name: "김서연", role: "창업 준비 중" },
  { text: "사람이 쓴 건지 의심될 정도로 퀄리티가 뛰어남. JTBD 분석이 특히 인상적이었어요.", name: "박민준", role: "스타트업 대표" },
];

/* ─── 라이브 데모 데이터 ─── */
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
  { code: "2-1", title: "차별점", content: "기존 전국 타겟팅 → 반경 1km 정밀 타겟, 광고 효과 블랙박스 → 매출 연동 ROI 실시간 측정" },
];

const DIMS = [
  { key: "target" as const, label: "타겟 고객", max: 20 },
  { key: "pain" as const, label: "페인포인트", max: 20 },
  { key: "diff" as const, label: "차별점", max: 20 },
  { key: "founder" as const, label: "창업자 적합성", max: 20 },
  { key: "feasibility" as const, label: "실행 가능성", max: 20 },
];

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

/* ─── 라이브 데모 컴포넌트 ─── */
type Phase = "ai-typing" | "user-typing" | "scoring" | "plan" | "done";

function LiveDemo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("ai-typing");
  const [scores, setScores] = useState({ target: 0, pain: 0, diff: 0, founder: 0, feasibility: 0 });
  const [planIdx, setPlanIdx] = useState(0);
  const [chat, setChat] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scene = SCENARIO[sceneIdx] ?? SCENARIO[SCENARIO.length - 1];
  const aiTyping = useTyping(scene.aiQ, phase === "ai-typing");
  const userTyping = useTyping(scene.userA, phase === "user-typing", 22);

  useEffect(() => {
    if (phase === "ai-typing" && aiTyping.done) {
      const t = setTimeout(() => setPhase("user-typing"), 600);
      return () => clearTimeout(t);
    }
  }, [phase, aiTyping.done]);

  useEffect(() => {
    if (phase === "user-typing" && userTyping.done) {
      setChat(prev => [...prev, { role: "ai", text: scene.aiQ }, { role: "user", text: scene.userA }]);
      const t = setTimeout(() => setPhase("scoring"), 400);
      return () => clearTimeout(t);
    }
  }, [phase, userTyping.done, scene]);

  useEffect(() => {
    if (phase !== "scoring") return;
    const target = scene.score;
    const steps = 30;
    const interval = 900 / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const r = step / steps;
      setScores({
        target: Math.round(target.target * r),
        pain: Math.round(target.pain * r),
        diff: Math.round(target.diff * r),
        founder: Math.round(target.founder * r),
        feasibility: Math.round(target.feasibility * r),
      });
      if (step >= steps) {
        clearInterval(t);
        setScores(target);
        if (sceneIdx === SCENARIO.length - 1) {
          setTimeout(() => { setShowPlan(true); setPhase("plan"); }, 700);
        } else {
          setTimeout(() => { setSceneIdx(i => i + 1); setPhase("ai-typing"); }, 1200);
        }
      }
    }, interval);
    return () => clearInterval(t);
  }, [phase, scene.score, sceneIdx]);

  useEffect(() => {
    if (phase !== "plan") return;
    setPlanIdx(0);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setPlanIdx(i);
      if (i >= PLAN_SECTIONS.length) { clearInterval(t); setTimeout(() => setPhase("done"), 1000); }
    }, 900);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      setSceneIdx(0); setPhase("ai-typing"); setChat([]);
      setScores({ target: 0, pain: 0, diff: 0, founder: 0, feasibility: 0 });
      setShowPlan(false); setPlanIdx(0);
    }, 4000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat, aiTyping.displayed, userTyping.displayed]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-[#0B1120] rounded-3xl border border-[#2A3D58] overflow-hidden shadow-2xl w-full">
      {/* 창 헤더 */}
      <div className="flex items-center gap-2 px-5 py-3 bg-[#060C18] border-b border-[#2A3D58]">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-[#4A5568] font-medium">Foal AI — 창업 인터뷰 시연</span>
        <div className="ml-auto flex items-center gap-1.5">
          {SCENARIO.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i <= sceneIdx ? "bg-[#F0A500]" : "bg-[#1E2D48]"}`} />
          ))}
          <span className="text-[#4A5568] text-xs ml-2">STEP {sceneIdx + 1}/9</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* 왼쪽: 채팅 */}
        <div className="border-r border-[#2A3D58] flex flex-col" style={{ height: 420 }}>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 scrollbar-hide">
            {chat.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-[#F0A500] flex-shrink-0 flex items-center justify-center text-[#0B1120] text-xs font-black">F</div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === "ai" ? "bg-[#1E2D48] text-[#C8D3E0] rounded-tl-none" : "bg-[#F0A500] text-[#0B1120] font-medium rounded-tr-none"
                }`}>{msg.text}</div>
              </div>
            ))}
            {phase === "ai-typing" && aiTyping.displayed && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F0A500] flex-shrink-0 flex items-center justify-center text-[#0B1120] text-xs font-black">F</div>
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tl-none bg-[#1E2D48] text-[#C8D3E0] text-xs leading-relaxed whitespace-pre-line">
                  {aiTyping.displayed}<span className="inline-block w-1 h-3 bg-[#F0A500] ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
            {phase === "user-typing" && userTyping.displayed && (
              <div className="flex gap-2 justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-none bg-[#F0A500] text-[#0B1120] text-xs font-medium leading-relaxed">
                  {userTyping.displayed}<span className="inline-block w-1 h-3 bg-[#0B1120]/40 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
            <div />
          </div>
          <div className="border-t border-[#2A3D58] p-3 flex items-center gap-2">
            <div className="flex-1 bg-[#1E2D48] rounded-xl px-3 py-2 text-xs text-[#4A5568]">
              {phase === "ai-typing" ? "AI가 질문하는 중..." : phase === "user-typing" ? "답변 입력 중..." : phase === "scoring" ? "점수 분석 중..." : "답변을 입력하세요..."}
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${phase === "user-typing" ? "bg-[#F0A500]" : "bg-[#1E2D48]"}`}>
              <svg className={`w-4 h-4 ${phase === "user-typing" ? "text-[#0B1120]" : "text-[#4A5568]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* 오른쪽: 점수 + 사업계획서 */}
        <div className="flex flex-col overflow-y-auto overscroll-contain" style={{ height: 420 }}>
          {!showPlan ? (
            <div className="p-5 flex-1">
              <div className="text-center mb-5">
                <p className="text-[#8B9AB0] text-xs mb-1">창업 아이디어 점수</p>
                <div className="relative inline-flex items-end gap-1">
                  <span className="text-6xl font-black text-white leading-none">{totalScore}</span>
                  <span className="text-[#4A5568] text-lg mb-1">/100</span>
                </div>
                <div className="mt-1">
                  {totalScore >= 81
                    ? <span className="text-xs bg-[#4A90D9] text-white font-black px-3 py-1 rounded-full">정부지원사업 경쟁력 ✓</span>
                    : totalScore >= 61
                    ? <span className="text-xs bg-[#F0A500] text-[#0B1120] font-black px-3 py-1 rounded-full">사업계획서 작성 가능 ✓</span>
                    : <span className="text-xs text-[#8B9AB0]">사업계획서 작성 기준: 61점</span>}
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
                        <div className="h-full rounded-full transition-all duration-100"
                          style={{ width: `${pct}%`, background: pct >= 70 ? "#F0A500" : pct >= 50 ? "#3B82F6" : "#4A5568" }} />
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
            <div className="p-5 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#F0A500] animate-pulse" />
                <p className="text-[#F0A500] text-xs font-bold">사업계획서 자동 작성 중...</p>
              </div>
              <div className="space-y-3">
                {PLAN_SECTIONS.slice(0, planIdx).map((sec, i) => (
                  <div key={i} className="bg-[#1E2D48] rounded-xl p-3 border border-[#2A3D58]"
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

/* ─── 메인 페이지 ─── */
export default function LandingPage() {
  const [earlybirdCount, setEarlybirdCount] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  /* ─── 풀페이지 슬라이드 스크롤 ─── */
  const [current, setCurrent] = useState(0);
  const isAnimating = useRef(false);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const TOTAL = 10;

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= TOTAL || isAnimating.current) return;
    isAnimating.current = true;
    setCurrent(i);
    setTimeout(() => { isAnimating.current = false; }, 800);
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const sec = sectionRefs.current[current];
      if (!sec) return;

      // 이벤트 발생 위치부터 섹션 래퍼까지 모든 스크롤 가능한 요소를 순서대로 확인
      // 가장 안쪽 스크롤 가능 요소가 경계에 도달했을 때만 섹션 전환
      let el = e.target as HTMLElement | null;
      while (el && el !== sec) {
        const overflow = window.getComputedStyle(el).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') {
          const { scrollTop, scrollHeight, clientHeight } = el;
          const atBottom = scrollTop + clientHeight >= scrollHeight - 4;
          const atTop = scrollTop <= 4;
          if (e.deltaY > 0 && !atBottom) return; // 내부 스크롤 여유 있음
          if (e.deltaY < 0 && !atTop) return;     // 내부 스크롤 여유 있음
        }
        el = el.parentElement;
      }

      // 섹션 래퍼 자체의 스크롤 확인
      const { scrollTop, scrollHeight, clientHeight } = sec;
      if (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight - 4) return;
      if (e.deltaY < 0 && scrollTop > 4) return;

      e.preventDefault();
      goTo(current + (e.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [current, goTo]);

  useEffect(() => {
    fetch("/api/earlybird/status")
      .then((r) => r.json())
      .then((d) => setEarlybirdCount(d.count ?? 0))
      .catch(() => setEarlybirdCount(0));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep((prev) => (prev + 1) % 9), 1800);
    return () => clearInterval(timer);
  }, []);

  const remaining = earlybirdCount !== null ? Math.max(0, EARLYBIRD_TOTAL - earlybirdCount) : null;

  return (
    <div className="h-[100dvh] overflow-hidden text-[#0B1120]" style={{ fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 네비게이션 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 py-5"
        style={{ background: "rgba(250,250,248,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(11,17,32,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0B1120] flex items-center justify-center">
            <span className="text-[#F0A500] text-sm font-black">F</span>
          </div>
          <span className="font-black text-lg tracking-tight text-[#0B1120]">Foal AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
          <Link href="/pain" className="hover:text-[#0B1120] transition-colors">창업자의 현실</Link>
          <Link href="/announcements" className="hover:text-[#0B1120] transition-colors">공고마당</Link>
          <Link href="/templates" className="hover:text-[#0B1120] transition-colors">사업계획서 양식</Link>
          <Link href="/review" className="hover:text-[#0B1120] transition-colors">AI 심사</Link>
          <button onClick={() => goTo(3)} className="hover:text-[#0B1120] transition-colors cursor-pointer">데모</button>
          <button onClick={() => goTo(8)} className="hover:text-[#0B1120] transition-colors cursor-pointer">요금제</button>
          <button onClick={() => goTo(7)} className="hover:text-[#0B1120] transition-colors cursor-pointer">후기</button>
        </div>
        <Link href="/login"
          className="px-5 py-2.5 bg-[#0B1120] text-white text-sm font-bold rounded-xl hover:bg-[#1a2540] transition-colors">
          시작하기
        </Link>
      </nav>

      {/* 점 네비게이션 */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i === current ? '#F0A500' : 'rgba(255,255,255,0.45)',
              transform: i === current ? 'scale(1.5)' : 'scale(1)',
              boxShadow: '0 0 0 1.5px rgba(0,0,0,0.25)',
            }}
          />
        ))}
      </div>

      {/* 슬라이딩 컨테이너 */}
      <div style={{
        transform: `translateY(calc(-${current} * 100dvh))`,
        transition: 'transform 750ms cubic-bezier(0.65, 0, 0.35, 1)',
        willChange: 'transform',
      }}>

        {/* ── 섹션 0: 히어로 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[0] = el; }}>
          <section className="bg-[#0B1120] min-h-[100dvh] flex flex-col justify-center px-8 md:px-16 pt-24 pb-20 relative overflow-hidden">
            <div className="absolute top-20 right-10 w-96 h-96 rounded-full opacity-5"
              style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />
            <div className="absolute bottom-10 left-20 w-64 h-64 rounded-full opacity-5"
              style={{ background: "radial-gradient(circle, #F0A500, transparent)" }} />

            <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-px w-12 bg-[#F0A500]" />
                <span className="text-[#F0A500] text-xs font-bold tracking-widest uppercase">AI 창업 멘토</span>
              </div>

              <h1 className="text-[clamp(2.8rem,7vw,6rem)] font-black leading-[1.05] text-white mb-8">
                "내 아이디어,<br />
                <span className="text-[#F0A500]">진짜 될까?"</span><br />
                먼저 확인하세요.
              </h1>

              <p className="text-[#8B9AB0] text-xl max-w-xl leading-relaxed mb-6">
                ChatGPT는 "좋아 보여요"만 돌아옵니다. 지인은 예의상 맞장구를 칩니다.
                Foal AI는 9단계 소크라테스식 인터뷰로 아이디어를 검증하고,
                실제 고객 앞에 랜딩페이지를 띄워 데이터로 확인합니다.
              </p>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#F0A500] text-[#0B1120] font-black flex items-center justify-center text-xs">1</span>
                  <span className="text-[#8B9AB0]">AI 인터뷰로 검증</span>
                </div>
                <div className="h-px w-8 bg-[#2A3D58]" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#2A3D58] text-[#8B9AB0] font-black flex items-center justify-center text-xs">2</span>
                  <span className="text-[#8B9AB0]">랜딩페이지 or 사업계획서</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link href="/login"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-lg hover:bg-[#f5b530] transition-colors">
                  무료로 시작하기
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <button onClick={() => goTo(3)}
                  className="inline-flex items-center gap-2 px-8 py-4 border border-[#2A3D58] text-[#8B9AB0] font-bold rounded-2xl text-lg hover:border-[#F0A500] hover:text-white transition-colors">
                  시연 보기
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {remaining !== null && remaining > 0 && (
                  <span className="text-[#8B9AB0] text-sm">
                    얼리버드 <span className="text-white font-bold">{remaining}자리</span> 남음 · 3개월 무료
                  </span>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#4A5568]">
              <span className="text-xs tracking-widest">SCROLL</span>
              <div className="w-px h-8 bg-gradient-to-b from-[#4A5568] to-transparent" />
            </div>
          </section>
        </div>

        {/* ── 섹션 1: 창업자의 현실 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[1] = el; }}>
          <section className="bg-[#0B1120] min-h-[100dvh] px-8 md:px-16 pt-28 pb-16 flex flex-col justify-center">
            <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-px w-12 bg-[#E24B4A]" />
                <span className="text-[#E24B4A] text-xs font-bold tracking-widest uppercase">창업자의 현실</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                검증 없이 시작하는<br />
                <span className="text-[#E24B4A]">이 악순환</span>, 알고 있습니까
              </h2>
              <p className="text-[#8B9AB0] text-lg mb-10 max-w-xl">
                예비창업자 10명 중 8명이 실질적 검증 없이 사업계획서 작성을 시작합니다.
              </p>

              {/* 3 Pain Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {[
                  {
                    tag: "IDEA CHAOS",
                    label: "아이디어 혼돈",
                    desc: "구조도 논리도 없이 포스트잇만 쌓인다. 어디서부터 시작해야 할지 모른다.",
                    img: "/pain/chaos.jpg",
                  },
                  {
                    tag: "DOCUMENTATION FAILURE",
                    label: "사업계획서 탈락",
                    desc: "검증 없이 쓴 계획서는 심사위원 앞에서 무너진다. '구조 부족', '논리 결여'.",
                    img: "/pain/failure.jpg",
                  },
                  {
                    tag: "MARKET CONFUSION",
                    label: "시장 정의 실패",
                    desc: "타겟도 문제도 시장도 정의되지 않은 채 시작한다. 전부 연결이 안 된다.",
                    img: "/pain/confusion.jpg",
                  },
                ].map((p) => (
                  <div key={p.tag} className="rounded-2xl overflow-hidden bg-[#1E2D48] border border-[#2A3D58]">
                    <div className="relative h-44 bg-[#0B1120] overflow-hidden">
                      <img
                        src={p.img}
                        alt={p.label}
                        className="w-full h-full object-cover opacity-80"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="text-white text-[10px] font-black tracking-widest bg-[#E24B4A]/90 px-2 py-0.5 rounded">{p.tag}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-white font-black text-base mb-1.5">{p.label}</p>
                      <p className="text-[#8B9AB0] text-sm leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Current Behavior Callout */}
              <div className="bg-[#1E2D48]/60 border border-[#2A3D58] rounded-2xl px-6 py-5">
                <p className="text-[#E24B4A] text-xs font-bold tracking-widest uppercase mb-4">지금 이렇게 하고 있지 않나요?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {[
                    'ChatGPT에 "내 아이디어 어때?"라고 물어본다',
                    '지인 카톡으로 "이런 거 써볼래?"라고 묻는다',
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-3 bg-[#0B1120] rounded-xl px-4 py-3">
                      <span className="text-[#E24B4A] font-black text-base flex-shrink-0">✗</span>
                      <span className="text-[#C8D3E0] text-sm">{t}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[#8B9AB0] text-sm leading-relaxed">
                  이게 <span className="text-white font-bold">검증</span>이라고 생각하고 사업계획서 작성을 시작합니다.
                  ChatGPT는 항상 "좋아 보여요"라고 합니다. 지인은 예의상 맞장구를 칩니다.
                  <span className="text-[#F0A500] font-bold"> Foal AI는 다릅니다.</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 2: 숫자 + HOW IT WORKS ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide bg-[#FAFAF8]"
          ref={el => { sectionRefs.current[2] = el; }}>
          <div className="bg-white border-b border-[#E8E4DC] py-10 px-8 md:px-16 pt-24">
            <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-[#E8E4DC]">
              {[
                { n: "9", label: "단계 창업 검증 인터뷰" },
                { n: "7", label: "섹션 대화형 사업계획서" },
                { n: "5,000×", label: "ROI (9,900원 → 5,000만원)" },
              ].map((s) => (
                <div key={s.label} className="px-8 text-center">
                  <p className="text-4xl md:text-5xl font-black text-[#0B1120] mb-1">{s.n}</p>
                  <p className="text-xs text-[#9CA3AF] font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <section id="how" className="py-16 px-8 md:px-16 bg-[#FAFAF8]">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-start gap-4 mb-12">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-px w-12 bg-[#F0A500] mt-3" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#F0A500] text-[#0B1120] text-xs font-black px-2.5 py-1 rounded-full">STEP 1</span>
                    <p className="text-[#F0A500] text-xs font-bold tracking-widest uppercase">창업 검증 인터뷰</p>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-[#0B1120] leading-tight">
                    9개의 질문으로<br />아이디어를 검증한다
                  </h2>
                  <p className="text-[#6B7280] text-base mt-3">소크라테스식 인터뷰로 타겟 고객과 JTBD를 발견합니다. 검증 후 랜딩페이지 또는 사업계획서를 선택하세요.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {STEPS.map((step, i) => (
                    <button key={step.n} onMouseEnter={() => setActiveStep(i)} onClick={() => setActiveStep(i)}
                      className={`w-full text-left px-5 py-4 rounded-2xl transition-all duration-200 ${
                        activeStep === i ? "bg-[#0B1120] text-white" : "bg-white hover:bg-[#F4F3EF] text-[#6B7280]"
                      }`}>
                      <div className="flex items-center gap-4">
                        <span className={`text-2xl font-black w-8 flex-shrink-0 ${activeStep === i ? "text-[#F0A500]" : "text-[#D1D5DB]"}`}>
                          {String(step.n).padStart(2, "0")}
                        </span>
                        <div>
                          <p className={`font-bold text-sm ${activeStep === i ? "text-white" : "text-[#374151]"}`}>{step.label}</p>
                          <p className={`text-xs mt-0.5 ${activeStep === i ? "text-[#8B9AB0]" : "text-[#9CA3AF]"}`}>{step.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="md:sticky md:top-24 h-fit bg-[#0B1120] rounded-3xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-[#4A5568]">Foal AI · STEP {activeStep + 1}/9</span>
                  </div>
                  <div className="flex gap-1 mb-6">
                    {STEPS.map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= activeStep ? "bg-[#F0A500]" : "bg-[#1E2D48]"}`} />
                    ))}
                  </div>
                  <div className="space-y-4 min-h-[200px]">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F0A500] flex-shrink-0 flex items-center justify-center text-[#0B1120] text-xs font-black">F</div>
                      <div className="bg-[#1E2D48] rounded-2xl rounded-tl-none px-4 py-3 text-sm text-[#C8D3E0] max-w-xs leading-relaxed">
                        {activeStep === 0 && "안녕하세요. 저는 AI 창업 멘토, Foal AI입니다. 지금 해결하고 싶은 문제가 뭔가요? 편하게 말씀해주세요."}
                        {activeStep === 1 && "방금 말씀하신 내용에서 핵심 문제를 한 문장으로 표현하면 어떻게 될까요?"}
                        {activeStep === 2 && "그 문제를 가장 심하게 겪는 사람은 누구일까요? 나이, 직업, 상황을 구체적으로 그려보세요."}
                        {activeStep === 3 && "그 사람이 당신의 서비스를 쓰는 이유가 뭘까요? 제품 기능이 아니라 — 진짜 이루고 싶은 것, 느끼고 싶은 것으로 말해보세요."}
                        {activeStep === 4 && "그 사람이 지금 이 문제를 어떻게 해결하고 있을까요? 돈을 내면서 해결하고 있나요, 아니면 그냥 참고 있나요?"}
                        {activeStep === 5 && "기존 방법과 비교해서 본인의 해결책이 왜 10배 더 낫다고 말할 수 있나요?"}
                        {activeStep === 6 && "이 문제를 본인이 해야 하는 이유가 있나요? 경력, 경험, 네트워크 중 어떤 게 이 문제와 연결되나요?"}
                        {activeStep === 7 && "지금 당장 시작하려면 뭐가 필요하고, 뭐가 있나요?"}
                        {activeStep === 8 && "오늘 대화를 바탕으로 이번 주에 딱 하나만 한다면 뭘 하시겠어요?"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                      <div className="flex-1 h-10 bg-[#1E2D48] rounded-xl px-4 flex items-center text-sm text-[#4A5568]">
                        답변을 입력하세요...
                      </div>
                      <div className="w-10 h-10 bg-[#F0A500] rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#0B1120]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 3: 라이브 데모 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[3] = el; }}>
          <section id="demo" className="bg-[#060C18] min-h-[100dvh] py-24 px-6 md:px-16 pt-28">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-full px-4 py-1.5 text-xs text-[#F0A500] font-bold mb-6">
                  STEP 1 — 창업 검증 인터뷰 시연
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                  먼저 아이디어를 검증합니다
                </h2>
                <p className="text-[#8B9AB0] text-lg">
                  AI 질문 → 답변 → 실시간 채점 → 타겟 고객 & 검증 리포트 완성
                </p>
              </div>
              <LiveDemo />
            </div>
          </section>
        </div>

        {/* ── 섹션 4: 인터뷰 완료 후 분기 선택 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[4] = el; }}>
          <section className="bg-[#0B1120] min-h-[100dvh] py-20 px-6 md:px-16 pt-28 flex items-center">
            <div className="max-w-4xl mx-auto w-full">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-full px-4 py-1.5 text-xs text-[#F0A500] font-bold mb-6">
                  인터뷰 완료 후
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                  다음 단계를<br />선택하세요
                </h2>
                <p className="text-[#8B9AB0] text-lg">
                  검증이 끝나면 두 가지 방향으로 나아갈 수 있습니다
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 랜딩페이지 */}
                <div className="bg-[#1E2D48] border border-[#2A3D58] rounded-3xl p-8 hover:border-[#F0A500]/50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0A500]/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-[#F0A500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                    </svg>
                  </div>
                  <span className="text-xs font-black text-[#F0A500] bg-[#F0A500]/10 px-2.5 py-1 rounded-full">옵션 1</span>
                  <h3 className="text-2xl font-black text-white mt-4 mb-3">랜딩페이지<br />자동 제작</h3>
                  <p className="text-[#8B9AB0] text-sm leading-relaxed mb-6">
                    실제 고객이 있는지 먼저 확인하고 싶다면. JTBD 기반으로 헤드라인·문제·차별점·CTA를 자동 생성하고 배포 링크를 만듭니다.
                  </p>
                  <div className="space-y-2">
                    {["JTBD 기반 카피 자동 작성", "페르소나 이미지 포함", "배포 링크 즉시 생성", "고객 유입 DB 확보"].map(t => (
                      <div key={t} className="flex items-center gap-2 text-[#C8D3E0] text-xs">
                        <span className="text-[#F0A500]">→</span>{t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 사업계획서 */}
                <div className="bg-[#1E2D48] border border-[#2A3D58] rounded-3xl p-8 hover:border-[#F0A500]/50 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-[#F0A500]/10 flex items-center justify-center mb-6">
                    <svg className="w-6 h-6 text-[#F0A500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-black text-[#F0A500] bg-[#F0A500]/10 px-2.5 py-1 rounded-full">옵션 2</span>
                  <h3 className="text-2xl font-black text-white mt-4 mb-3">사업계획서<br />자동 제작</h3>
                  <p className="text-[#8B9AB0] text-sm leading-relaxed mb-6">
                    바로 사업계획서를 작성하고 싶다면. 인터뷰에서 발견한 모든 맥락을 AI가 기억하고 섹션별로 함께 완성합니다.
                  </p>
                  <div className="space-y-2">
                    {["7개 섹션 대화형 작성", "예창패 공식 양식 반영", "악마의 변호인 피드백", "PDF/Word 완성본 출력"].map(t => (
                      <div key={t} className="flex items-center gap-2 text-[#C8D3E0] text-xs">
                        <span className="text-[#F0A500]">→</span>{t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center mt-10">
                <Link href="/login"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-lg hover:bg-[#f5b530] transition-colors">
                  인터뷰 시작하기
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 5: STEP 2 사업계획서 작성 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[5] = el; }}>
          <section className="bg-[#0B1120] min-h-[100dvh] py-20 px-6 md:px-16 pt-28 border-t border-[#1E2D48]">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-[#2A3D58] text-[#8B9AB0] text-xs font-black px-2.5 py-1 rounded-full">STEP 2</span>
                <p className="text-[#8B9AB0] text-xs font-bold tracking-widest uppercase">AI 협업 사업계획서 작성</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div>
                  <h2 className="text-4xl font-black text-white leading-tight mb-4">
                    검증된 맥락으로<br />
                    <span className="text-[#F0A500]">섹션별로 함께</span><br />
                    완성합니다
                  </h2>
                  <p className="text-[#8B9AB0] leading-relaxed mb-6">
                    인터뷰에서 발견한 타겟 고객, 문제, 차별점을 AI가 기억한 채로 사업계획서 작성을 시작합니다. 각 섹션을 대화로 다듬고, 마음에 들면 다음으로 넘어갑니다.
                  </p>
                  <div className="space-y-2 mb-8">
                    {[
                      "AI가 인터뷰 맥락으로 초안을 먼저 작성",
                      "\"더 구체적으로\", \"다시 써줘\" 자유롭게 수정",
                      "7개 섹션 완성 시 전체 사업계획서 다운로드",
                    ].map((t) => (
                      <div key={t} className="flex items-start gap-2 text-[#C8D3E0] text-sm">
                        <span className="text-[#F0A500] font-black mt-0.5">→</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F0A500] text-[#0B1120] font-black rounded-xl hover:bg-[#f5b530] transition-colors">
                    검증 인터뷰 시작하기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="space-y-2">
                  {[
                    { code: "1-1", title: "창업 아이템 개요", done: true },
                    { code: "1-3", title: "문제 인식 및 고객 정의", done: true },
                    { code: "2-1", title: "솔루션 및 차별점", active: true },
                    { code: "1-4", title: "목표 시장 및 규모", pending: true },
                    { code: "2-3", title: "비즈니스 모델", pending: true },
                    { code: "3-1", title: "팀 구성 및 역량", pending: true },
                    { code: "4-1", title: "실행 계획", pending: true },
                  ].map((s) => (
                    <div key={s.code}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        s.done ? "border-[#F0A500]/30 bg-[#F0A500]/5" :
                        s.active ? "border-[#F0A500] bg-[#F0A500]/10" :
                        "border-[#1E2D48] bg-[#1E2D48]/30"
                      }`}>
                      <span className={`text-xs font-black w-10 flex-shrink-0 ${s.done ? "text-[#F0A500]" : s.active ? "text-[#F0A500]" : "text-[#4A5568]"}`}>{s.code}</span>
                      <span className={`text-sm flex-1 ${s.done || s.active ? "text-white" : "text-[#4A5568]"}`}>{s.title}</span>
                      {s.done && <span className="text-[#F0A500] text-xs font-black">완료 ✓</span>}
                      {s.active && (
                        <span className="flex items-center gap-1 text-[#F0A500] text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F0A500] animate-pulse" />작성 중
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 6: 사업계획서 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[6] = el; }}>
          <section className="bg-[#0B1120] min-h-[100dvh] py-28 px-8 md:px-16 flex items-center">
            <div className="max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="h-px w-12 bg-[#F0A500] mb-6" />
                  <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                    검증이 끝나면<br />
                    <span className="text-[#F0A500]">AI와 함께</span><br />
                    사업계획서를 씁니다
                  </h2>
                  <p className="text-[#8B9AB0] leading-relaxed mb-8">
                    인터뷰에서 발견한 모든 맥락을 AI가 기억합니다. 빈 칸을 채우는 게 아니라, 대화를 통해 각 섹션을 다듬어 나갑니다.
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: "💬", text: "섹션별 대화형 작성 — AI가 초안, 내가 검토" },
                      { icon: "🎯", text: "JTBD 분석 자동 반영" },
                      { icon: "😈", text: "악마의 변호인 — 심사위원 관점 피드백" },
                      { icon: "📄", text: "완성 시 예비창업패키지 공식 양식 다운로드" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-3 text-[#C8D3E0] text-sm">
                        <span>{item.icon}</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1E2D48] rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#8B9AB0] text-sm font-medium">창업 아이디어 점수</p>
                    <span className="bg-[#F0A500] text-[#0B1120] text-xs font-black px-3 py-1 rounded-full">합격</span>
                  </div>
                  <div className="text-center py-6">
                    <p className="text-7xl font-black text-white">73</p>
                    <p className="text-[#F0A500] text-sm font-bold mt-1">/ 100점</p>
                  </div>
                  {[
                    { label: "타겟 고객", score: 15, max: 20 },
                    { label: "페인포인트", score: 16, max: 20 },
                    { label: "차별점", score: 14, max: 20 },
                    { label: "창업자 적합성", score: 14, max: 20 },
                    { label: "실행 가능성", score: 14, max: 20 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#8B9AB0]">{item.label}</span>
                        <span className="text-white font-bold">{item.score}<span className="text-[#4A5568]">/{item.max}</span></span>
                      </div>
                      <div className="h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F0A500] rounded-full" style={{ width: `${(item.score / item.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 7: 후기 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[7] = el; }}>
          <section id="reviews" className="min-h-[100dvh] py-28 px-8 md:px-16 bg-[#FAFAF8] flex items-center">
            <div className="max-w-5xl mx-auto w-full">
              <div className="mb-16">
                <div className="h-px w-12 bg-[#F0A500] mb-6" />
                <h2 className="text-4xl md:text-5xl font-black text-[#0B1120]">직접 써본 창업자들의 말</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {QUOTES.map((q, i) => (
                  <div key={i} className={`rounded-3xl p-8 ${i === 1 ? "bg-[#0B1120] text-white" : "bg-white"}`}>
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <svg key={j} className="w-4 h-4 text-[#F0A500]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed mb-6 ${i === 1 ? "text-[#C8D3E0]" : "text-[#4B5563]"}`}>&ldquo;{q.text}&rdquo;</p>
                    <div>
                      <p className={`text-sm font-bold ${i === 1 ? "text-white" : "text-[#0B1120]"}`}>{q.name}</p>
                      <p className={`text-xs ${i === 1 ? "text-[#8B9AB0]" : "text-[#9CA3AF]"}`}>{q.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 8: 요금제 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[8] = el; }}>
          <section id="pricing" className="min-h-[100dvh] py-28 px-8 md:px-16 bg-white border-t border-[#E8E4DC] flex items-center">
            <div className="max-w-4xl mx-auto w-full">
              <div className="text-center mb-12">
                <div className="inline-block h-px w-12 bg-[#F0A500] mb-6" />
                <h2 className="text-4xl md:text-5xl font-black text-[#0B1120]">합리적인 가격</h2>
                <p className="text-[#9CA3AF] mt-3">9,900원으로 5,000만원짜리 기회를 준비하세요. ROI 5,000배.</p>
              </div>

              {/* 얼리버드 배너 */}
              {remaining !== null && remaining > 0 && (
                <div className="bg-[#0B1120] rounded-2xl px-6 py-4 flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[#F0A500] font-black text-sm">얼리버드 🔥 — 선착순 500명 · 3개월 전체 기능 무료</p>
                    <p className="text-[#8B9AB0] text-xs mt-0.5">잔여 <span className="text-white font-bold">{remaining}자리</span></p>
                  </div>
                  <Link href="/login" className="flex-shrink-0 px-5 py-2.5 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors">
                    무료 시작
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starter */}
                <div className="bg-[#FAFAF8] border border-[#E8E4DC] rounded-3xl p-7">
                  <p className="text-sm font-bold text-[#9CA3AF] mb-1">Starter</p>
                  <p className="text-4xl font-black text-[#0B1120] mb-0.5">9,900<span className="text-xl font-normal text-[#9CA3AF]">원</span></p>
                  <p className="text-xs text-[#9CA3AF] mb-6">3 크레딧</p>
                  <Link href="/login" className="block w-full py-3 border-2 border-[#0B1120] text-[#0B1120] text-sm font-black rounded-2xl text-center hover:bg-[#0B1120] hover:text-white transition-colors mb-6">
                    시작하기
                  </Link>
                  <ul className="space-y-2">
                    {["AI 인터뷰 + JTBD 분석", "사업계획서 1회 (2cr)", "악마의 변호인 1회 (1cr)"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[#4B5563]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Basic */}
                <div className="bg-[#FAFAF8] border-2 border-[#0B1120] rounded-3xl p-7 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0B1120] text-white text-xs font-black px-3 py-1 rounded-full">인기</div>
                  <p className="text-sm font-bold text-[#9CA3AF] mb-1">Basic</p>
                  <p className="text-4xl font-black text-[#0B1120] mb-0.5">19,900<span className="text-xl font-normal text-[#9CA3AF]">원</span></p>
                  <p className="text-xs text-[#9CA3AF] mb-6">8 크레딧</p>
                  <Link href="/login" className="block w-full py-3 bg-[#0B1120] text-white text-sm font-black rounded-2xl text-center hover:bg-[#1a2540] transition-colors mb-6">
                    시작하기
                  </Link>
                  <ul className="space-y-2">
                    {["AI 인터뷰 + JTBD 분석", "사업계획서 3회 (6cr)", "정부지원사업 매칭 (1cr)", "고객 인터뷰 분석 (1cr)"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[#4B5563]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro */}
                <div className="bg-[#FAFAF8] border border-[#E8E4DC] rounded-3xl p-7">
                  <p className="text-sm font-bold text-[#9CA3AF] mb-1">Pro</p>
                  <p className="text-4xl font-black text-[#0B1120] mb-0.5">39,900<span className="text-xl font-normal text-[#9CA3AF]">원</span></p>
                  <p className="text-xs text-[#9CA3AF] mb-6">20 크레딧</p>
                  <Link href="/login" className="block w-full py-3 border-2 border-[#0B1120] text-[#0B1120] text-sm font-black rounded-2xl text-center hover:bg-[#0B1120] hover:text-white transition-colors mb-6">
                    시작하기
                  </Link>
                  <ul className="space-y-2">
                    {["AI 인터뷰 + JTBD 분석", "사업계획서 무제한", "랜딩페이지 카피 (1cr)", "악마의 변호인 무제한", "모든 산출물 포함"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[#4B5563]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F0A500] flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 섹션 9: CTA + 푸터 ── */}
        <div className="h-[100dvh] overflow-y-auto overscroll-contain scrollbar-hide"
          ref={el => { sectionRefs.current[9] = el; }}>
          <section className="bg-[#0B1120] min-h-[80dvh] py-32 px-8 md:px-16 text-center flex flex-col items-center justify-center">
            <div className="max-w-3xl mx-auto">
              <p className="text-[#F0A500] text-xs font-bold tracking-widest uppercase mb-6">지금 시작하세요</p>
              <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
                모든 창업자는<br />처음엔 Foal입니다.
              </h2>
              <p className="text-[#8B9AB0] text-lg mb-12">
                완성된 아이디어를 가진 사람은 없습니다.<br />질문에 답하다 보면, 사업이 보입니다.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl text-xl hover:bg-[#f5b530] transition-colors">
                인터뷰 시작하기
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          <footer className="bg-[#060C18] px-8 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#0B1120] border border-[#1E2D48] flex items-center justify-center">
                <span className="text-[#F0A500] text-xs font-black">F</span>
              </div>
              <span className="text-[#4A5568] text-sm">Foal AI · 코마인드웍스</span>
            </div>
            <p className="text-[#4A5568] text-xs">© 2026 CoMindWorks. All rights reserved.</p>
          </footer>

          {remaining !== null && remaining > 0 && <div className="h-14" />}
        </div>

      </div>{/* 슬라이딩 컨테이너 끝 */}

      {/* 스티키 하단 바 */}
      {remaining !== null && remaining > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F0A500] px-6 py-3 flex items-center justify-between shadow-2xl">
          <p className="text-[#0B1120] text-sm font-bold">
            얼리버드 잔여 <strong>{remaining}자리</strong> — 선착순 마감 시 종료
          </p>
          <Link href="/login"
            className="flex-shrink-0 px-5 py-2 bg-[#0B1120] text-[#F0A500] text-sm font-black rounded-xl hover:bg-[#1a2540] transition-colors">
            무료 시작 →
          </Link>
        </div>
      )}
    </div>
  );
}
