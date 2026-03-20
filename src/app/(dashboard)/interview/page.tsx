"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import ScoreDashboard from "@/components/score-dashboard/ScoreDashboard";
import CreditBadge from "@/components/credit/CreditBadge";
import type { Message, ScoreBoard, ScoreDimension, ScoreItem } from "@/types";

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
          const err = await res.json();
          if (res.status === 429) {
            setMessages((prev) => [
              ...prev,
              {
                step: currentStep,
                role: "ai",
                content: err.error || "잠시 후 다시 시도해주세요.",
                timestamp: new Date().toISOString(),
              },
            ]);
          }
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

            if (event === "chunk") {
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
        setCreditBalance((prev) => prev - 1);
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
          onCharge={() => router.push("/payment")}
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
                disabled={isStreaming || interviewComplete}
                placeholder={
                  interviewComplete
                    ? "인터뷰가 완료되었습니다. 점수를 확인하세요."
                    : `STEP ${currentStep}/9 — 답변을 입력하세요...`
                }
              />
            </>
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
