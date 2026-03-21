"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { WRITE_SECTIONS } from "@/app/api/write/route";
import ChatInput from "@/components/chat/ChatInput";
import type { Message } from "@/types";

type ChatEntry = { role: "user" | "assistant"; content: string; sectionIdx: number };
type ApiMsg = { role: "user" | "assistant"; content: string };

const SECTION_COUNT = WRITE_SECTIONS.length;

function WritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const sessionId = searchParams.get("session");

  /* ── Refs for async-safe access ── */
  const contextRef = useRef("");
  const approvedRef = useRef(new Set<number>());
  const draftsRef = useRef<Record<number, string>>({});
  const sectionMsgsRef = useRef<ApiMsg[][]>(
    Array.from({ length: SECTION_COUNT }, () => [])
  );
  const isStreamingRef = useRef(false);
  const currentIdxRef = useRef(0);
  const initRef = useRef(false);

  /* ── Display state ── */
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sectionDrafts, setSectionDrafts] = useState<Record<number, string>>({});
  const [approvedSections, setApprovedSections] = useState<Set<number>>(new Set());
  const [allDone, setAllDone] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef<HTMLDivElement>(null);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatEntries, streamingText]);

  /* ── Auto-scroll active section into view ── */
  useEffect(() => {
    activeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentIdx]);

  /* ── Auth + load interview context ── */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (sessionId) {
        try {
          const res = await fetch(`/api/interview/session/${sessionId}`);
          if (res.ok) {
            const session = await res.json();
            const msgs: Message[] = Array.isArray(session.messages)
              ? session.messages
              : [];
            contextRef.current = msgs
              .map(
                (m) =>
                  `[STEP ${m.step}] ${m.role === "ai" ? "AI" : "창업자"}: ${m.content}`
              )
              .join("\n\n");
          }
        } catch {
          /* no session context — write will proceed without it */
        }
      }

      setContextLoaded(true);
    })();
  }, []);

  /* ── Kick off first section once context is ready ── */
  useEffect(() => {
    if (contextLoaded) runSection(0, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextLoaded]);

  /* ── Helpers ── */
  const buildCompleted = () =>
    [...approvedRef.current]
      .sort((a, b) => a - b)
      .map(
        (i) =>
          `[${WRITE_SECTIONS[i].code} ${WRITE_SECTIONS[i].title}]\n${draftsRef.current[i]}`
      )
      .join("\n\n");

  const addEntry = (
    content: string,
    role: "user" | "assistant",
    idx: number
  ) => {
    setChatEntries((prev) => [...prev, { role, content, sectionIdx: idx }]);
  };

  /* ── Core SSE stream runner ── */
  const runSection = async (idx: number, msgs: ApiMsg[]) => {
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;
    currentIdxRef.current = idx;
    setCurrentIdx(idx);
    setIsStreaming(true);
    setStreamingText("");

    const completedContent = buildCompleted();

    try {
      const res = await fetch("/api/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionIdx: idx,
          messages: msgs,
          interviewContext: contextRef.current,
          completedContent,
        }),
      });

      if (!res.ok) {
        addEntry("⚠️ 오류가 발생했습니다. 다시 시도해주세요.", "assistant", idx);
        isStreamingRef.current = false;
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
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const block of parts) {
          const evtLine = block.split("\n").find((l) => l.startsWith("event:"));
          const dataLine = block
            .split("\n")
            .find((l) => l.startsWith("data:"));
          if (!evtLine || !dataLine) continue;

          const event = evtLine.replace("event:", "").trim();
          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(dataLine.replace("data:", "").trim());
          } catch {
            continue;
          }

          if (event === "text") {
            aiText += data.text as string;
            setStreamingText(aiText);
          } else if (event === "draft") {
            const content = data.content as string;
            draftsRef.current = { ...draftsRef.current, [idx]: content };
            setSectionDrafts({ ...draftsRef.current });
          } else if (event === "approve") {
            const approvedIdx = data.sectionIdx as number;
            const draft =
              (data.draft as string) || draftsRef.current[idx] || "";

            /* Commit AI message */
            if (aiText) {
              sectionMsgsRef.current[idx] = [
                ...sectionMsgsRef.current[idx],
                { role: "assistant", content: aiText },
              ];
              addEntry(aiText, "assistant", idx);
              aiText = "";
              setStreamingText("");
            }

            /* Lock section */
            draftsRef.current = { ...draftsRef.current, [approvedIdx]: draft };
            approvedRef.current = new Set([...approvedRef.current, approvedIdx]);
            setSectionDrafts({ ...draftsRef.current });
            setApprovedSections(new Set(approvedRef.current));

            isStreamingRef.current = false;
            setIsStreaming(false);

            const nextIdx = approvedIdx + 1;
            if (nextIdx < SECTION_COUNT) {
              sectionMsgsRef.current[nextIdx] = [];
              setTimeout(() => runSection(nextIdx, []), 700);
            } else {
              setAllDone(true);
            }
          } else if (event === "done") {
            if (aiText) {
              sectionMsgsRef.current[idx] = [
                ...sectionMsgsRef.current[idx],
                { role: "assistant", content: aiText },
              ];
              addEntry(aiText, "assistant", idx);
              setStreamingText("");
              aiText = "";
            }
            isStreamingRef.current = false;
            setIsStreaming(false);
          } else if (event === "error") {
            addEntry(
              `⚠️ ${(data.message as string) || "오류가 발생했습니다."}`,
              "assistant",
              idx
            );
            setStreamingText("");
            isStreamingRef.current = false;
            setIsStreaming(false);
          }
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        addEntry(
          "⚠️ 연결 오류가 발생했습니다. 다시 시도해주세요.",
          "assistant",
          currentIdxRef.current
        );
      }
      isStreamingRef.current = false;
      setIsStreaming(false);
    }
  };

  const handleSend = async (input: string) => {
    if (isStreamingRef.current) return;
    const idx = currentIdxRef.current;
    addEntry(input, "user", idx);
    const updated: ApiMsg[] = [
      ...sectionMsgsRef.current[idx],
      { role: "user", content: input },
    ];
    sectionMsgsRef.current[idx] = updated;
    await runSection(idx, updated);
  };

  const handleDownload = () => {
    const lines = [
      "예비창업패키지 사업계획서 초안",
      "=".repeat(40),
      "",
      ...WRITE_SECTIONS.map((s, i) => [
        `## ${s.code}  ${s.title}`,
        "",
        draftsRef.current[i] || "(미작성)",
        "",
        "---",
        "",
      ]).flat(),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "사업계획서_초안.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div className="flex h-screen bg-[#0F0E17] text-[#E8E6F0] overflow-hidden">
      {/* ─── LEFT: Chat panel ─── */}
      <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-[#2D2B42]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2D2B42]">
          <Link
            href="/interview"
            className="text-[#8B89A0] hover:text-white transition-colors text-lg leading-none"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#8B89A0] uppercase tracking-wider">
              사업계획서 작성
            </p>
            <p className="text-xs font-semibold truncate">
              {currentIdx < SECTION_COUNT
                ? `${currentIdx + 1}/${SECTION_COUNT} — ${WRITE_SECTIONS[currentIdx].title}`
                : "완성!"}
            </p>
          </div>
          {/* Section progress dots */}
          <div className="flex gap-1.5">
            {WRITE_SECTIONS.map((_, i) => (
              <div
                key={i}
                title={WRITE_SECTIONS[i].title}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  approvedSections.has(i)
                    ? "bg-emerald-500"
                    : i === currentIdx
                    ? "bg-[#534AB7] scale-125"
                    : "bg-[#2D2B42]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {chatEntries.map((entry, i) => {
            const prevIdx =
              i > 0 ? chatEntries[i - 1].sectionIdx : entry.sectionIdx;
            const showDivider = i > 0 && entry.sectionIdx !== prevIdx;
            return (
              <div key={i}>
                {showDivider && (
                  <div className="flex items-center gap-2 my-5">
                    <div className="flex-1 h-px bg-[#2D2B42]" />
                    <span className="text-[10px] text-[#534AB7] font-semibold uppercase tracking-wider px-1">
                      {WRITE_SECTIONS[entry.sectionIdx]?.title}
                    </span>
                    <div className="flex-1 h-px bg-[#2D2B42]" />
                  </div>
                )}
                <div
                  className={`flex mb-3 ${
                    entry.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  {entry.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-[10px] font-bold text-white mr-2 flex-shrink-0 mt-0.5">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      entry.role === "assistant"
                        ? "bg-[#1A1927] text-[#E8E6F0] rounded-tl-none border border-[#2D2B42]"
                        : "bg-[#534AB7] text-white rounded-tr-none"
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Streaming bubble */}
          {streamingText && (
            <div className="flex justify-start mb-3">
              <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-[10px] font-bold text-white mr-2 flex-shrink-0 mt-0.5">
                AI
              </div>
              <div className="max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-[#1A1927] text-[#E8E6F0] rounded-tl-none border border-[#2D2B42]">
                {streamingText}
                <span className="inline-block w-0.5 h-[1em] bg-[#534AB7] ml-0.5 align-middle animate-pulse" />
              </div>
            </div>
          )}

          {/* Typing dots (before first text) */}
          {isStreaming && !streamingText && (
            <div className="flex justify-start mb-3">
              <div className="w-7 h-7 rounded-full bg-[#534AB7] flex items-center justify-center text-[10px] font-bold text-white mr-2 flex-shrink-0 mt-0.5">
                AI
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#1A1927] border border-[#2D2B42] rounded-tl-none">
                <div className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="w-1.5 h-1.5 bg-[#534AB7] rounded-full animate-bounce"
                      style={{ animationDelay: `${j * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input / Done */}
        {!allDone ? (
          <ChatInput
            onSend={handleSend}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? "AI가 작성 중입니다..."
                : "피드백이나 수정 요청을 입력하세요..."
            }
          />
        ) : (
          <div className="p-4 border-t border-[#2D2B42]">
            <p className="text-emerald-400 text-xs font-medium text-center mb-3">
              모든 섹션 완성!
            </p>
            <button
              onClick={handleDownload}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm rounded-xl py-2.5 transition-colors font-medium"
            >
              사업계획서 다운로드 (.txt)
            </button>
          </div>
        )}
      </div>

      {/* ─── RIGHT: Document panel ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Doc header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#2D2B42]">
          <div>
            <h2 className="text-sm font-semibold">예비창업패키지 사업계획서</h2>
            <p className="text-xs text-[#8B89A0]">
              {approvedSections.size} / {SECTION_COUNT} 섹션 완성
            </p>
          </div>
          {allDone && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              다운로드
            </button>
          )}
        </div>

        {/* Sections list */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-3">
          {WRITE_SECTIONS.map((section, i) => {
            const isApproved = approvedSections.has(i);
            const isActive = i === currentIdx && !isApproved;
            const draft = sectionDrafts[i];

            return (
              <div
                key={section.id}
                ref={isActive ? activeSectionRef : undefined}
                className={`rounded-xl border transition-all duration-300 ${
                  isApproved
                    ? "border-emerald-500/40 bg-emerald-950/20"
                    : isActive
                    ? "border-[#534AB7]/50 bg-[#534AB7]/5"
                    : "border-[#2D2B42] bg-[#1A1927]/40 opacity-40"
                }`}
              >
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      isApproved
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-[#534AB7] text-white"
                        : "bg-[#2D2B42] text-[#8B89A0]"
                    }`}
                  >
                    {isApproved ? "✓" : i + 1}
                  </span>
                  <span className="text-[10px] text-[#8B89A0] font-mono">
                    {section.code}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isApproved || isActive ? "text-[#E8E6F0]" : "text-[#8B89A0]"
                    }`}
                  >
                    {section.title}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] text-[#534AB7] font-medium animate-pulse">
                      작성 중…
                    </span>
                  )}
                  {isApproved && (
                    <span className="ml-auto text-[10px] text-emerald-400 font-medium">
                      완성
                    </span>
                  )}
                </div>

                {/* Section content */}
                <div className="px-4 pb-4 pl-11">
                  {isApproved || (isActive && draft) ? (
                    <p className="text-sm text-[#C9C7D8] leading-relaxed whitespace-pre-wrap">
                      {draft}
                      {isActive && isStreaming && (
                        <span className="inline-block w-0.5 h-[1em] bg-[#534AB7] ml-0.5 align-middle animate-pulse" />
                      )}
                    </p>
                  ) : isActive ? (
                    /* Skeleton while waiting for first draft */
                    <div className="space-y-2 mt-1">
                      {[85, 100, 70, 90].map((w, j) => (
                        <div
                          key={j}
                          className="h-3 bg-[#2D2B42] rounded animate-pulse"
                          style={{ width: `${w}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8B89A0] leading-relaxed">
                      {section.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Completion banner */}
          {allDone && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-emerald-400 font-semibold text-sm">
                사업계획서 초안 완성!
              </p>
              <p className="text-[#8B89A0] text-xs mt-1 mb-4">
                AI 심사를 받거나 파일로 다운로드하세요.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl px-5 py-2 transition-colors font-medium"
                >
                  다운로드
                </button>
                <Link
                  href="/review"
                  className="bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm rounded-xl px-5 py-2 transition-colors font-medium"
                >
                  AI 심사 받기
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Wrap in Suspense for useSearchParams() */
export default function WritePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#0F0E17] text-[#8B89A0] text-sm">
          로딩 중…
        </div>
      }
    >
      <WritePage />
    </Suspense>
  );
}
