"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

function OutputContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const outputId = searchParams.get("id");
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!outputId) {
      setError("산출물 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    (async () => {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("outputs")
        .select("content, type, created_at")
        .eq("id", outputId)
        .single();

      if (dbError || !data) {
        setError("산출물을 찾을 수 없습니다.");
      } else {
        setContent(data.content || "");
      }
      setIsLoading(false);
    })();
  }, [outputId]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `사업계획서_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F0E17]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#8B89A0] text-sm">사업계획서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F0E17]">
        <div className="text-center">
          <p className="text-[#E24B4A] mb-4">{error}</p>
          <button
            onClick={() => router.push("/interview")}
            className="text-[#534AB7] text-sm hover:underline"
          >
            인터뷰로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E17]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#2D2B42] bg-[#1A1927]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/interview")}
            className="text-[#8B89A0] hover:text-[#E8E6F0] transition-colors"
          >
            ← 인터뷰
          </button>
          <span className="text-[#2D2B42]">/</span>
          <span className="text-[#E8E6F0] font-semibold">사업계획서</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1927] border border-[#2D2B42] hover:border-[#534AB7] text-[#E8E6F0] text-sm rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Markdown 다운로드
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-8">
          <pre className="whitespace-pre-wrap text-[#E8E6F0] text-sm leading-relaxed font-sans">
            {content}
          </pre>
        </div>
      </main>
    </div>
  );
}

export default function OutputPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-[#0F0E17]">
        <div className="w-12 h-12 border-2 border-[#534AB7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OutputContent />
    </Suspense>
  );
}
