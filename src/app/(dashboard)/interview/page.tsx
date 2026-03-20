"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import ScoreDashboard from "@/components/score-dashboard/ScoreDashboard";
import CreditBadge from "@/components/credit/CreditBadge";
import type { Message, ScoreBoard, ScoreDimension, ScoreItem, JTBDAnalysis } from "@/types";

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  target_customer: "타겟 고객",
  pain_point: "페인포인트",
  differentiation: "차별점",
  founder_fit: "창업자 적합성",
  feasibility: "실행 가능성",
};

const IMPROVEMENT_TIPS: Record<ScoreDimension, string> = {
  target_customer: "특정 인물 1명을 구체화하세요. '30대 직장인'이 아니라 '퇴사 후 창업 준비 중인 35세 전 IT 기획자'처럼.",
  pain_point: "지금 이 문제로 돈을 내는 사람 3명을 찾아 직접 인터뷰하세요. 실제 지출이 없다면 가상의 문제일 수 있습니다.",
  differentiation: "기존 방법 대비 10배 나은 점을 수치로 표현하세요. '편하다'보다 '3시간 → 10분'처럼 측정 가능한 비교로.",
  founder_fit: "'왜 내가 해야 하는가'를 한 단락으로 써보세요. 경력·경험·네트워크 중 이 문제와 연결되는 것을 찾으세요.",
  feasibility: "이번 주 안에 할 수 있는 한 가지 행동을 지금 바로 정하세요. '고객 3명에게 연락하기'처럼 오늘 시작 가능한 것으로.",
};

const INITIAL_AI_MESSAGE: Message = {
  step: 1,
  role: "ai",
  content: "안녕하세요. 저는 AI 창업 멘토, Foal AI입니다. 지금 해결하고 싶은 문제가 뭔가요?",
  timestamp: new Date().toISOString(),
};

const EMPTY_SCOREBOARD: Partial<ScoreBoard> = {
  total: 0,
  items: {} as Record<ScoreDimension, ScoreItem>,
  level: "need_work",
};

export default function InterviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([INITIAL_AI_MESSAGE]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [scoreBoard, setScoreBoard] = useState<Partial<ScoreBoard>>(EMPTY_SCOREBOARD);
  const [creditBalance, setCreditBalance] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<"cofounder" | "devil">("cofounder");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [jtbdData, setJtbdData] = useState<JTBDAnalysis | null>(null);
  const [isGeneratingJTBD, setIsGeneratingJTBD] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionInitRef = useRef(false); // 중복 세션 생성 방지

  // 세션 초기화
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 크레딧 조회
      const { data: creditData } = await supabase
        .from("credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      setCreditBalance(creditData?.balance ?? 0);

      // 새 인터뷰 세션 생성
      const res = await fetch("/api/interview/session", {
        method: "POST",
      });
      if (res.ok) {
        const session = await res.json();
        setSessionId(session.id);
      }
    })();
  }, []);

  // 스크롤 자동 이동
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // JTBD 자동 생성 (인터뷰 완료 시)
  useEffect(() => {
    if (!interviewComplete || !sessionId || jtbdData || isGeneratingJTBD) return;
    setIsGeneratingJTBD(true);

    (async () => {
      try {
        const res = await fetch("/api/output/jtbd-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          setJtbdData(data.jtbd);
        }
      } finally {
        setIsGeneratingJTBD(false);
      }
    })();
  }, [interviewComplete, sessionId]);

  const handleSend = useCallback(
    async (userInput: string) => {
      if (!sessionId || isStreaming) return;

      // 사용자 메시지 즉시 추가
      const userMsg: Message = {
        step: currentStep,
        role: "user",
        content: userInput,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText("");

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/interview/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            step: currentStep,
            message: userInput,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          let errMsg = "오류가 발생했습니다. 다시 시도해주세요.";
          try {
            const err = await res.json();
            errMsg = err.error || errMsg;
          } catch {}
          setMessages((prev) => [
            ...prev,
            {
              step: currentStep,
              role: "ai",
              content: `⚠️ ${errMsg}`,
              timestamp: new Date().toISOString(),
            },
          ]);
          setIsStreaming(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let aiText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
            if (!eventLine || !dataLine) continue;

            const event = eventLine.replace("event:", "").trim();
            const data = JSON.parse(dataLine.replace("data:", "").trim());

            if (event === "error") {
              setMessages((prev) => [
                ...prev,
                {
                  step: currentStep,
                  role: "ai",
                  content: `⚠️ ${data.message || "오류가 발생했습니다."}`,
                  timestamp: new Date().toISOString(),
                },
              ]);
            } else if (event === "chunk") {
              aiText += data.text;
              setStreamingText(aiText);
            } else if (event === "score") {
              setScoreBoard((prev) => {
                const newItems = {
                  ...(prev.items || {}),
                  [data.dimension]: {
                    dimension: data.dimension,
                    label: data.dimension,
                    score: data.score,
                    feedback: data.feedback,
                  },
                } as Record<ScoreDimension, ScoreItem>;

                return {
                  ...prev,
                  items: newItems,
                  total: data.total,
                  level:
                    data.total >= 81
                      ? "excellent"
                      : data.total >= 61
                      ? "good"
                      : "need_work",
                };
              });
            } else if (event === "done") {
              if (data.interview_complete) {
                setInterviewComplete(true);
              }
              if (data.next_step) {
                setCurrentStep(data.next_step);
              }
            }
          }
        }

        // AI 메시지 확정
        if (aiText) {
          setMessages((prev) => [
            ...prev,
            {
              step: currentStep,
              role: "ai",
              content: aiText,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        setStreamingText("");
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, isStreaming, currentStep]
  );

  const handleGeneratePlan = async () => {
    if (!sessionId || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/output/business-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (res.ok) {
        const { id } = await res.json();
        setCreditBalance((prev) => prev - 2);
        router.push(`/output?id=${id}`);
      } else {
        const err = await res.json();
        alert(err.error || "사업계획서 생성에 실패했습니다.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F0E17]">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2D2B42] bg-[#1A1927]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white text-xs font-bold">F</span>
          </div>
          <span className="font-semibold text-[#E8E6F0]">Foal AI</span>
          {interviewComplete && (
            <span className="text-xs bg-[#1D9E75] text-white px-2 py-0.5 rounded-full">
              인터뷰 완료
            </span>
          )}
        </div>
        <CreditBadge
          balance={creditBalance}
          onCharge={() => alert("결제 기능 준비 중입니다.")}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽: 채팅창 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 모드 전환 탭 */}
          <div className="flex border-b border-[#2D2B42]">
            <button
              onClick={() => setMode("cofounder")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === "cofounder"
                  ? "text-[#534AB7] border-b-2 border-[#534AB7]"
                  : "text-[#8B89A0] hover:text-[#E8E6F0]"
              }`}
            >
              창업 멘토 모드
            </button>
            <button
              onClick={() => setMode("devil")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === "devil"
                  ? "text-[#E24B4A] border-b-2 border-[#E24B4A]"
                  : "text-[#8B89A0] hover:text-[#E8E6F0]"
              }`}
            >
              악마의 변호인
            </button>
          </div>

          {mode === "cofounder" ? (
            interviewComplete ? (
              <CompletionPanel
                scoreBoard={scoreBoard}
                jtbdData={jtbdData}
                isGeneratingJTBD={isGeneratingJTBD}
                onGeneratePlan={handleGeneratePlan}
                isGenerating={isGenerating}
                creditBalance={creditBalance}
              />
            ) : (
            <>
              {/* 채팅 메시지 */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* 진행 단계 표시 */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                        step < currentStep
                          ? "bg-[#534AB7]"
                          : step === currentStep
                          ? "bg-[#534AB7] opacity-50"
                          : "bg-[#2D2B42]"
                      }`}
                    />
                  ))}
                </div>

                {messages.map((msg, i) => (
                  <ChatBubble key={i} message={msg} />
                ))}

                {/* 스트리밍 중인 AI 메시지 */}
                {isStreaming && streamingText && (
                  <ChatBubble
                    message={{
                      step: currentStep,
                      role: "ai",
                      content: streamingText,
                      timestamp: "",
                    }}
                    isStreaming
                  />
                )}
                {isStreaming && !streamingText && (
                  <div className="flex justify-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#534AB7] flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0">
                      AI
                    </div>
                    <div className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* 입력창 */}
              <ChatInput
                onSend={handleSend}
                disabled={isStreaming}
                placeholder={`STEP ${currentStep}/9 — 답변을 입력하세요...`}
              />
            </>
            )
          ) : (
            <DevilAdvocatePanel sessionId={sessionId} />
          )}
        </div>

        {/* 오른쪽: 점수 대시보드 */}
        <div className="w-72 border-l border-[#2D2B42] overflow-y-auto">
          <ScoreDashboard
            scoreBoard={scoreBoard}
            onGeneratePlan={handleGeneratePlan}
            isGenerating={isGenerating}
            creditBalance={creditBalance}
          />
        </div>
      </div>
    </div>
  );
}

// 인터뷰 완료 패널 (인라인 컴포넌트)
function CompletionPanel({
  scoreBoard,
  jtbdData,
  isGeneratingJTBD,
  onGeneratePlan,
  isGenerating,
  creditBalance,
}: {
  scoreBoard: Partial<ScoreBoard>;
  jtbdData: JTBDAnalysis | null;
  isGeneratingJTBD: boolean;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  creditBalance: number;
}) {
  const total = scoreBoard.total ?? 0;
  const level = scoreBoard.level ?? "need_work";
  const items = scoreBoard.items ?? ({} as Record<ScoreDimension, ScoreItem>);

  const levelConfig = {
    excellent: { label: "탁월한 창업 아이디어", color: "text-[#1D9E75]", border: "border-[#1D9E75]/30", bg: "bg-[#1D9E75]/10" },
    good: { label: "유망한 창업 아이디어", color: "text-[#534AB7]", border: "border-[#534AB7]/30", bg: "bg-[#534AB7]/10" },
    need_work: { label: "보완이 필요한 단계", color: "text-[#F5A623]", border: "border-[#F5A623]/30", bg: "bg-[#F5A623]/10" },
  };
  const cfg = levelConfig[level];
  const dimensions = Object.keys(DIMENSION_LABELS) as ScoreDimension[];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* 종합 점수 카드 */}
      <div className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
        <p className="text-xs text-[#8B89A0] mb-2">9단계 인터뷰 완료 · 종합 점수</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-6xl font-bold ${cfg.color}`}>{total}</span>
          <span className="text-[#8B89A0] text-xl">/100</span>
        </div>
        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* 차원별 점수 */}
      <div>
        <h3 className="text-sm font-semibold text-[#E8E6F0] mb-3">차원별 평가 결과</h3>
        <div className="space-y-3">
          {dimensions.map((dim) => {
            const item = items[dim];
            const score = item?.score ?? 0;
            const needsWork = score < 11;
            return (
              <div key={dim} className="bg-[#1A1927] border border-[#2D2B42] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#E8E6F0]">{DIMENSION_LABELS[dim]}</span>
                  <span className={`text-sm font-bold ${needsWork ? "text-[#F5A623]" : "text-[#1D9E75]"}`}>
                    {score}/20
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#2D2B42] rounded-full mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${needsWork ? "bg-[#F5A623]" : "bg-[#1D9E75]"}`}
                    style={{ width: `${(score / 20) * 100}%` }}
                  />
                </div>
                {item?.feedback && (
                  <p className="text-xs text-[#8B89A0] mb-1">{item.feedback}</p>
                )}
                {needsWork && IMPROVEMENT_TIPS[dim] && (
                  <div className="mt-2 pt-2 border-t border-[#2D2B42]">
                    <p className="text-xs text-[#F5A623] font-semibold mb-1">💡 개선 방향</p>
                    <p className="text-xs text-[#E8E6F0] leading-relaxed">{IMPROVEMENT_TIPS[dim]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* JTBD 분석 */}
      <div>
        <h3 className="text-sm font-semibold text-[#E8E6F0] mb-3">JTBD 분석 — 고객이 진짜 원하는 것</h3>
        {isGeneratingJTBD ? (
          <div className="bg-[#1A1927] border border-[#2D2B42] rounded-xl p-6 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-[#534AB7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-[#8B89A0]">JTBD 분석 생성 중...</p>
          </div>
        ) : jtbdData ? (
          <div className="space-y-3">
            <div className="bg-[#1A1927] border border-[#2D2B42] rounded-xl p-4 space-y-3">
              {[
                { key: "functional_job" as const, label: "⚙️ 기능적 Job", color: "text-[#534AB7]" },
                { key: "emotional_job" as const, label: "💚 감정적 Job", color: "text-[#1D9E75]" },
                { key: "social_job" as const, label: "🤝 사회적 Job", color: "text-[#F5A623]" },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <p className={`text-xs font-semibold mb-1 ${color}`}>{label}</p>
                  <p className="text-sm text-[#E8E6F0]">{jtbdData[key]}</p>
                </div>
              ))}
            </div>
            {jtbdData.key_phrase && (
              <div className="bg-[#2D2B42] border border-[#534AB7]/40 rounded-xl p-4 text-center">
                <p className="text-xs text-[#8B89A0] mb-1">고객의 한 마디</p>
                <p className="text-lg font-bold text-[#E8E6F0]">"{jtbdData.key_phrase}"</p>
              </div>
            )}
            {jtbdData.differentiation_statement && (
              <div className="bg-[#534AB7]/10 border border-[#534AB7]/30 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#534AB7] mb-1">차별화 포지셔닝</p>
                <p className="text-sm text-[#E8E6F0] leading-relaxed">{jtbdData.differentiation_statement}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1A1927] border border-[#2D2B42] rounded-xl p-4">
            <p className="text-sm text-[#8B89A0]">JTBD 분석을 불러올 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-3 pb-4">
        <button
          onClick={onGeneratePlan}
          disabled={isGenerating || creditBalance < 2}
          className="w-full py-3 bg-[#534AB7] hover:bg-[#6358d6] disabled:bg-[#2D2B42] disabled:text-[#8B89A0] text-white font-semibold rounded-xl transition-colors"
        >
          {isGenerating ? "생성 중..." : "📄 사업계획서 생성 (2 크레딧)"}
        </button>
        {creditBalance < 2 && (
          <p className="text-xs text-center text-[#F5A623]">크레딧이 부족합니다. 충전 후 이용하세요.</p>
        )}
      </div>
    </div>
  );
}

// 악마의 변호인 패널 (인라인 컴포넌트)
function DevilAdvocatePanel({ sessionId }: { sessionId: string | null }) {
  const [tab, setTab] = useState<string>("target_customer");
  const [content, setContent] = useState("");
  const [result, setResult] = useState<import("@/types").DevilAdvocateResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const tabs = [
    { key: "target_customer", label: "타겟고객" },
    { key: "problem_definition", label: "문제정의" },
    { key: "differentiation", label: "차별점" },
    { key: "revenue_model", label: "수익모델" },
    { key: "execution_plan", label: "실행계획" },
  ];

  const colorClass = {
    red: "text-[#E24B4A]",
    amber: "text-[#F5A623]",
    teal: "text-[#1D9E75]",
  };

  const colorIcon = { red: "🔴", amber: "🟡", teal: "🟢" };

  const handleAnalyze = async () => {
    if (!content.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setError("");

    try {
      const res = await fetch("/api/devil-advocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, content }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const err = await res.json();
        setError(err.error || "분석에 실패했습니다.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-[#2D2B42]">
        <p className="text-sm text-[#E24B4A] font-semibold mb-3">심사위원 관점의 냉철한 평가</p>
        {/* 탭 */}
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-[#E24B4A] text-white"
                  : "bg-[#1A1927] text-[#8B89A0] border border-[#2D2B42] hover:border-[#E24B4A]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="분석할 섹션 내용을 입력하세요..."
          rows={5}
          maxLength={3000}
          className="w-full bg-[#1A1927] border border-[#2D2B42] rounded-xl px-4 py-3 text-sm text-[#E8E6F0] placeholder-[#8B89A0] resize-none focus:outline-none focus:border-[#E24B4A]"
        />
        {error && <p className="text-xs text-[#E24B4A] mt-1">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={!content.trim() || isAnalyzing}
          className="mt-2 w-full py-2.5 bg-[#E24B4A] hover:bg-[#f05957] disabled:bg-[#2D2B42] disabled:text-[#8B89A0] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {isAnalyzing ? "분석 중..." : "분석하기"}
        </button>
      </div>

      {result && (
        <div className="p-4 space-y-4">
          {[result.q1, result.q2, result.q3].map((section, i) => (
            <div key={i} className="bg-[#1A1927] border border-[#2D2B42] rounded-xl p-4">
              <p className="text-xs text-[#8B89A0] mb-1">{["❶", "❷", "❸"][i]}</p>
              <p className="font-semibold text-[#E8E6F0] text-sm mb-1">{section.title}</p>
              <p className="text-xs text-[#E24B4A] italic mb-3">"{section.attack}"</p>
              <ul className="space-y-1.5">
                {section.points.map((pt, j) => (
                  <li key={j} className="flex gap-2 text-xs">
                    <span>{colorIcon[pt.color]}</span>
                    <span className={colorClass[pt.color]}>{pt.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="bg-[#2D2B42] border border-[#E24B4A] rounded-xl p-4">
            <p className="text-xs text-[#8B89A0] mb-1">심사위원의 최후 질문</p>
            <p className="text-sm text-[#E8E6F0] font-medium">"{result.final_question}"</p>
          </div>
        </div>
      )}
    </div>
  );
}
