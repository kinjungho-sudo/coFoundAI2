"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { ScoreDimension } from "@/types";

interface SessionSummary {
  id: string;
  status: "in_progress" | "completed" | "abandoned";
  total_score: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

function getLevel(total: number) {
  if (total >= 81) return { label: "우수", color: "#4A90D9" };
  if (total >= 61) return { label: "양호", color: "#1D9E75" };
  return { label: "보완 필요", color: "#E24B4A" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("interview_sessions")
        .select("id, status, messages, scores, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        const summaries: SessionSummary[] = data.map((s) => {
          const scores = (s.scores as Record<ScoreDimension, { score: number }>) || {};
          const total = Object.values(scores).reduce((sum, v) => sum + (v.score ?? 0), 0);
          const messages = Array.isArray(s.messages) ? s.messages : [];
          return {
            id: s.id,
            status: s.status as SessionSummary["status"],
            total_score: total,
            message_count: messages.length,
            created_at: s.created_at,
            updated_at: s.updated_at,
          };
        });
        setSessions(summaries);
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0E17]">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2D2B42] bg-[#1A1927]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-[#E8E6F0]">CoFound AI</span>
          <span className="text-[#2D2B42]">/</span>
          <span className="text-[#8B89A0] text-sm">세션 히스토리</span>
        </div>
        <button
          onClick={() => router.push("/interview")}
          className="px-4 py-2 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          새 인터뷰
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center pt-20">
            <div className="w-10 h-10 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center pt-20">
            <p className="text-[#8B89A0] mb-4">아직 인터뷰 세션이 없습니다.</p>
            <button
              onClick={() => router.push("/interview")}
              className="px-6 py-3 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              첫 인터뷰 시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const level = getLevel(session.total_score);
              const statusLabel =
                session.status === "completed"
                  ? "완료"
                  : session.status === "in_progress"
                  ? "진행 중"
                  : "중단";
              const statusColor =
                session.status === "completed"
                  ? "#1D9E75"
                  : session.status === "in_progress"
                  ? "#534AB7"
                  : "#8B89A0";

              return (
                <div
                  key={session.id}
                  className="bg-[#1A1927] border border-[#2D2B42] hover:border-[#534AB7] rounded-2xl p-5 cursor-pointer transition-colors"
                  onClick={() => router.push(`/interview?session=${session.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                      {session.status === "completed" && (
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: `${level.color}20`, color: level.color }}
                        >
                          {level.label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8B89A0]">
                      {formatDate(session.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    {session.status === "completed" && (
                      <div>
                        <p className="text-xs text-[#8B89A0] mb-0.5">점수</p>
                        <p className="text-2xl font-bold" style={{ color: level.color }}>
                          {session.total_score}
                          <span className="text-sm font-normal text-[#8B89A0]">/100</span>
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[#8B89A0] mb-0.5">메시지</p>
                      <p className="text-lg font-semibold text-[#E8E6F0]">
                        {session.message_count}개
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8B89A0] mb-0.5">마지막 업데이트</p>
                      <p className="text-sm text-[#E8E6F0]">
                        {formatDate(session.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
