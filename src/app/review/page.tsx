"use client";

export const runtime = 'edge';

import Link from "next/link";
import { useState, useRef, useCallback } from "react";

/* ─── 타입 ─── */
interface DimResult {
  score: number;
  summary: string;
  strength: string;
  weakness: string;
}

interface ReviewResult {
  total: number;
  grade: string;
  verdict: string;
  dimensions: {
    problem: DimResult;
    solution: DimResult;
    scalability: DimResult;
    team: DimResult;
  };
  topStrengths: string[];
  criticalIssues: string[];
  judgeComment: string;
  improvementPriority: { item: string; action: string; impact: "high" | "medium" | "low" }[];
}

type UploadState = "idle" | "uploading" | "analyzing" | "done" | "error";

/* ─── 유틸 ─── */
const GRADE_COLOR: Record<string, string> = {
  S: "text-[#F0A500]", A: "text-green-400", B: "text-blue-400",
  C: "text-yellow-400", D: "text-red-400",
};
const IMPACT_COLOR = { high: "bg-red-500/10 text-red-400 border-red-500/30", medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", low: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
const DIM_LABELS = { problem: "문제인식", solution: "실현가능성", scalability: "성장전략", team: "팀" };
const DIM_KEYS = ["problem", "solution", "scalability", "team"] as const;

function ScoreBar({ score, max = 25 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 70 ? "#F0A500" : pct >= 50 ? "#3B82F6" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#1E2D48] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-black text-white w-12 text-right">{score}<span className="text-[#4A5568] font-normal">/{max}</span></span>
    </div>
  );
}

/* ─── 메인 ─── */
export default function ReviewPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [fileData, setFileData] = useState<{ type: "text" | "pdf"; text?: string; base64?: string; filename: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 파일 업로드 처리 ── */
  const handleFile = useCallback(async (file: File) => {
    setUploadState("uploading");
    setStatusMsg("파일 업로드 중...");
    setResult(null);
    setErrorMsg("");
    setUploadedFile({ name: file.name, size: file.size });

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/review/upload", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error || "업로드 실패");
        setUploadState("error");
        return;
      }

      setFileData(json);
      setUploadState("analyzing");
      setStatusMsg("AI 심사 시작 중...");
      await runAnalysis(json);
    } catch (e) {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setUploadState("error");
    }
  }, []);

  /* ── AI 심사 ── */
  async function runAnalysis(data: typeof fileData) {
    if (!data) return;
    setStatusMsg("PSST 기준으로 심사 중... (약 20-40초 소요)");

    try {
      const res = await fetch("/api/review/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok || !res.body) {
        setErrorMsg("분석 서버 오류");
        setUploadState("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            const eventName = line.slice(7).trim();
            const dataLine = lines[lines.indexOf(line) + 1] ?? "";
            const payload = dataLine.startsWith("data: ") ? dataLine.slice(6) : null;

            if (eventName === "status" && payload) {
              const p = JSON.parse(payload);
              setStatusMsg(p.message);
            } else if (eventName === "result" && payload) {
              const r: ReviewResult = JSON.parse(payload);
              setResult(r);
              setUploadState("done");
            } else if (eventName === "error" && payload) {
              const p = JSON.parse(payload);
              setErrorMsg(p.message);
              setUploadState("error");
            }
          }
        }
      }
    } catch {
      setErrorMsg("분석 중 오류가 발생했습니다.");
      setUploadState("error");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setUploadState("idle");
    setUploadedFile(null);
    setFileData(null);
    setResult(null);
    setErrorMsg("");
    setStatusMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalColor = result ? (result.total >= 80 ? "#F0A500" : result.total >= 61 ? "#22c55e" : "#EF4444") : "#4A5568";

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* 네비 */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-[#1E2D48]">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center">
            <span className="text-[#0B1120] text-sm font-black">F</span>
          </Link>
          <div>
            <h1 className="text-white font-black leading-none">AI 사업계획서 심사</h1>
            <p className="text-[#4A5568] text-xs mt-0.5">PSST 기준 · 창업진흥원 심사위원 관점</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/templates" className="text-xs text-[#8B9AB0] hover:text-white transition-colors hidden md:block">
            사업계획서 양식
          </Link>
          <Link href="/interview" className="px-4 py-2 bg-[#F0A500] text-[#0B1120] text-xs font-black rounded-xl hover:bg-[#f5b530] transition-colors">
            AI 인터뷰로 작성하기
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* 업로드 & 결과 그리드 */}
        <div className={`grid gap-8 ${result ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 max-w-xl mx-auto"}`}>

          {/* ── 왼쪽: 업로드 패널 ── */}
          <div className={result ? "lg:col-span-2" : ""}>
            <h2 className="text-white font-black text-xl mb-2">사업계획서 업로드</h2>
            <p className="text-[#8B9AB0] text-sm mb-6">PDF 또는 TXT 파일을 업로드하면 AI가 PSST 기준으로 심사합니다</p>

            {/* 드롭존 */}
            {uploadState === "idle" && (
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver ? "border-[#F0A500] bg-[#F0A500]/5" : "border-[#2A3D58] hover:border-[#F0A500]/50 hover:bg-[#1E2D48]/30"
                }`}
              >
                <div className="text-5xl mb-4">📄</div>
                <p className="text-white font-bold mb-1">파일을 드래그하거나 클릭해서 업로드</p>
                <p className="text-[#4A5568] text-sm">PDF · TXT · 최대 15MB</p>
                <p className="text-[#4A5568] text-xs mt-2">HWP · DOCX → PDF로 변환 후 업로드</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={onFileChange} />
              </div>
            )}

            {/* 업로드 중 / 분석 중 */}
            {(uploadState === "uploading" || uploadState === "analyzing") && (
              <div className="border border-[#2A3D58] rounded-3xl p-8 text-center">
                <div className="w-12 h-12 border-2 border-[#F0A500] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white font-bold mb-1">{uploadedFile?.name}</p>
                <p className="text-[#8B9AB0] text-sm">{statusMsg}</p>
                {uploadState === "analyzing" && (
                  <div className="mt-4 flex justify-center gap-1">
                    {["문제인식", "실현가능성", "성장전략", "팀"].map((label, i) => (
                      <span key={label} className="text-xs text-[#4A5568] px-2 py-1 rounded-full bg-[#1E2D48]"
                        style={{ animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}>
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 에러 */}
            {uploadState === "error" && (
              <div className="border border-red-500/30 bg-red-500/5 rounded-3xl p-8 text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-400 font-bold mb-2">오류 발생</p>
                <p className="text-[#8B9AB0] text-sm whitespace-pre-line mb-6">{errorMsg}</p>
                <button onClick={reset} className="px-6 py-2.5 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors">
                  다시 시도
                </button>
              </div>
            )}

            {/* 완료 상태 — 파일 정보 + 재시도 */}
            {uploadState === "done" && uploadedFile && (
              <div className="border border-[#2A3D58] rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F0A500]/10 flex items-center justify-center text-xl">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{uploadedFile.name}</p>
                    <p className="text-[#4A5568] text-xs">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <span className="text-green-400 text-xs font-bold">심사 완료 ✓</span>
                </div>
                <button onClick={reset} className="w-full py-2.5 border border-[#2A3D58] text-[#8B9AB0] text-sm font-bold rounded-xl hover:border-[#F0A500] hover:text-white transition-colors">
                  다른 파일 심사하기
                </button>
              </div>
            )}

            {/* 가이드 */}
            <div className="mt-6 space-y-3">
              <div className="bg-[#1E2D48] rounded-2xl p-4">
                <p className="text-[#F0A500] text-xs font-bold mb-2">심사 기준 (PSST)</p>
                <div className="space-y-1.5">
                  {[["P", "문제인식", "25점"], ["S", "실현가능성", "25점"], ["S", "성장전략", "25점"], ["T", "팀", "25점"]].map(([k, v, s]) => (
                    <div key={v} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-[#F0A500]/10 text-[#F0A500] font-black flex items-center justify-center text-xs">{k}</span>
                        <span className="text-[#C8D3E0]">{v}</span>
                      </div>
                      <span className="text-[#4A5568]">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-[#F0A500]/20 rounded-2xl p-4">
                <p className="text-[#F0A500] text-xs font-bold mb-1">💡 더 좋은 사업계획서를 원한다면</p>
                <p className="text-[#8B9AB0] text-xs leading-relaxed">Foal AI 인터뷰로 처음부터 작성하면 평균 73점을 받습니다.</p>
                <Link href="/interview" className="inline-block mt-2 text-xs text-[#F0A500] font-bold hover:underline">
                  AI 인터뷰 시작하기 →
                </Link>
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 심사 결과 ── */}
          {result && (
            <div className="lg:col-span-3 space-y-5">

              {/* 총점 헤더 */}
              <div className="bg-[#1E2D48] rounded-3xl p-6 flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[#8B9AB0] text-xs mb-1">총점</p>
                  <p className="font-black leading-none" style={{ fontSize: "4rem", color: totalColor }}>{result.total}</p>
                  <p className="text-[#4A5568] text-sm">/ 100</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-3xl font-black ${GRADE_COLOR[result.grade] ?? "text-white"}`}>{result.grade}</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      result.total >= 80 ? "bg-[#F0A500]/10 text-[#F0A500]" :
                      result.total >= 61 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {result.total >= 80 ? "최상위권" : result.total >= 61 ? "합격권" : "보완 필요"}
                    </span>
                  </div>
                  <p className="text-[#C8D3E0] text-sm leading-relaxed">{result.verdict}</p>
                </div>
              </div>

              {/* PSST 차원별 점수 */}
              <div className="bg-[#1E2D48] rounded-3xl p-6">
                <p className="text-white font-black mb-5">차원별 점수</p>
                <div className="space-y-4">
                  {DIM_KEYS.map((key) => {
                    const d = result.dimensions[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[#C8D3E0] text-sm font-bold">{DIM_LABELS[key]}</span>
                        </div>
                        <ScoreBar score={d.score} />
                        <p className="text-[#8B9AB0] text-xs mt-1.5 leading-relaxed">{d.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 강점 / 핵심 문제 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1E2D48] rounded-2xl p-5">
                  <p className="text-green-400 font-black text-sm mb-3">강점 TOP 3</p>
                  <div className="space-y-2">
                    {result.topStrengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#C8D3E0]">
                        <span className="text-green-400 font-black flex-shrink-0">✓</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#1E2D48] rounded-2xl p-5">
                  <p className="text-red-400 font-black text-sm mb-3">핵심 문제 TOP 3</p>
                  <div className="space-y-2">
                    {result.criticalIssues.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#C8D3E0]">
                        <span className="text-red-400 font-black flex-shrink-0">!</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 심사위원 총평 */}
              <div className="bg-[#0B1120] border border-[#F0A500]/20 rounded-2xl p-5">
                <p className="text-[#F0A500] font-black text-sm mb-3">심사위원 총평</p>
                <p className="text-[#C8D3E0] text-sm leading-relaxed">{result.judgeComment}</p>
              </div>

              {/* 개선 우선순위 */}
              <div className="bg-[#1E2D48] rounded-2xl p-5">
                <p className="text-white font-black text-sm mb-4">개선 우선순위</p>
                <div className="space-y-3">
                  {result.improvementPriority.map((item, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${IMPACT_COLOR[item.impact]}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-xs font-black px-2 py-0.5 rounded border ${IMPACT_COLOR[item.impact]}`}>
                          {item.impact === "high" ? "즉시" : item.impact === "medium" ? "중요" : "권장"}
                        </span>
                        <span className="text-sm font-bold">{item.item}</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-80">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 각 차원 세부 피드백 */}
              <div className="space-y-4">
                <p className="text-white font-black">차원별 상세 피드백</p>
                {DIM_KEYS.map((key) => {
                  const d = result.dimensions[key];
                  return (
                    <div key={key} className="bg-[#1E2D48] rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-white font-black">{DIM_LABELS[key]}</p>
                        <span className="text-[#F0A500] font-black">{d.score}<span className="text-[#4A5568] font-normal text-sm">/25</span></span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
                          <p className="text-green-400 text-xs font-bold mb-1">잘 된 점</p>
                          <p className="text-[#C8D3E0] text-xs leading-relaxed">{d.strength}</p>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                          <p className="text-red-400 text-xs font-bold mb-1">보완할 점</p>
                          <p className="text-[#C8D3E0] text-xs leading-relaxed">{d.weakness}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 하단 CTA */}
              <div className="bg-[#F0A500]/10 border border-[#F0A500]/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white font-black mb-1">사업계획서 점수를 올리고 싶다면?</p>
                  <p className="text-[#8B9AB0] text-sm">Foal AI 인터뷰로 처음부터 작성하면 피드백을 즉시 반영할 수 있습니다.</p>
                </div>
                <Link href="/interview" className="flex-shrink-0 px-5 py-3 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors whitespace-nowrap">
                  AI로 다시 작성 →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
