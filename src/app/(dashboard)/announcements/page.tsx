"use client";

export const runtime = 'edge';

import { useState, useEffect } from "react";
import Link from "next/link";
import type { LiveAnnouncement } from "@/app/api/announcements/route";

type Category = "전체" | "예비창업" | "초기창업" | "재도전" | "청년" | "기술창업";

/* 정적 폴백 데이터 — API 실패 시 사용 */
const STATIC_ANNOUNCEMENTS: LiveAnnouncement[] = [
  {
    id: "s1",
    title: "2025년 예비창업패키지",
    org: "중소벤처기업부 · 창업진흥원",
    category: ["예비창업"],
    amount: "최대 5,000만원",
    count: "1,400명",
    deadline: "2025년 4월 (예정)",
    deadlineDate: "2025-04-30",
    eligibility: "창업 경험이 없거나 사업 개시일로부터 1년 미만인 자",
    method: "K-Startup 온라인 신청",
    description: "예비창업자의 혁신적인 아이디어를 사업화할 수 있도록 사업화 자금 및 창업 교육, 멘토링 등을 지원합니다. 심사는 사업계획서 및 발표 평가로 진행됩니다.",
    url: "https://www.k-startup.go.kr",
    isHot: true,
  },
  {
    id: "s2",
    title: "2025년 초기창업패키지",
    org: "중소벤처기업부 · 창업진흥원",
    category: ["초기창업"],
    amount: "최대 1억원",
    count: "1,200명",
    deadline: "2025년 3월 (예정)",
    deadlineDate: "2025-03-31",
    eligibility: "업력 3년 이내 창업기업 대표자",
    method: "K-Startup 온라인 신청",
    description: "창업 초기 기업의 성장을 위한 사업화 자금, 멘토링, 투자 연계 등을 지원합니다. 주관기관별로 분야 특화 프로그램이 운영됩니다.",
    url: "https://www.k-startup.go.kr",
    isHot: true,
  },
  {
    id: "s3",
    title: "청년창업사관학교",
    org: "중소벤처기업부 · 중소기업진흥공단",
    category: ["예비창업", "청년"],
    amount: "최대 1억원 (융자 포함)",
    count: "1,000명",
    deadline: "2025년 2월 (예정)",
    deadlineDate: "2025-02-28",
    eligibility: "만 39세 이하 예비창업자 또는 창업 3년 이내",
    method: "청년창업사관학교 홈페이지 신청",
    description: "청년 창업자에게 입주 공간, 사업화 자금, 멘토링, 네트워킹을 원스톱으로 제공하는 통합 지원 프로그램입니다. 전국 15개 캠퍼스 운영.",
    url: "https://www.oasisschool.or.kr",
  },
  {
    id: "s4",
    title: "재도전성공패키지",
    org: "중소벤처기업부 · 창업진흥원",
    category: ["재도전"],
    amount: "최대 5,000만원",
    count: "200명",
    deadline: "2025년 5월 (예정)",
    deadlineDate: "2025-05-31",
    eligibility: "폐업 후 재창업을 준비 중인 자 (폐업 후 5년 이내)",
    method: "K-Startup 온라인 신청",
    description: "실패 경험을 발판 삼아 재도전하는 창업자를 지원합니다. 폐업 경험자의 강점인 실전 경험을 평가에 반영합니다.",
    url: "https://www.k-startup.go.kr",
  },
  {
    id: "s5",
    title: "창업성장기술개발사업 (디딤돌창업과제)",
    org: "중소벤처기업부 · 중소기업기술정보진흥원",
    category: ["초기창업", "기술창업"],
    amount: "최대 1억원 (과제비)",
    count: "500개 과제",
    deadline: "상시 (분기별 공고)",
    deadlineDate: "2025-12-31",
    eligibility: "업력 7년 이내 중소기업, 기술 기반 창업기업",
    method: "SMTECH 온라인 신청",
    description: "기술 기반 창업기업의 R&D를 지원하여 기술 사업화를 촉진합니다. 제품 개발, 시제품 제작, 인증 취득 등에 활용 가능.",
    url: "https://www.smtech.go.kr",
  },
  {
    id: "s6",
    title: "글로벌 액셀러레이팅 프로그램",
    org: "중소벤처기업부 · 창업진흥원",
    category: ["초기창업", "기술창업"],
    amount: "최대 3,000만원 + 해외 진출 지원",
    count: "100팀",
    deadline: "2025년 6월 (예정)",
    deadlineDate: "2025-06-30",
    eligibility: "글로벌 진출을 희망하는 업력 7년 이내 창업기업",
    method: "K-Startup 온라인 신청",
    description: "국내 유망 스타트업의 해외 시장 진출을 돕는 액셀러레이팅 프로그램. 현지 파트너 연계, 투자 유치, 글로벌 네트워킹 지원.",
    url: "https://www.k-startup.go.kr",
  },
  {
    id: "s7",
    title: "여성창업패키지",
    org: "중소벤처기업부 · 창업진흥원",
    category: ["예비창업", "청년"],
    amount: "최대 5,000만원",
    count: "120명",
    deadline: "2025년 4월 (예정)",
    deadlineDate: "2025-04-15",
    eligibility: "여성 예비창업자 또는 창업 3년 이내 여성 대표자",
    method: "K-Startup 온라인 신청",
    description: "여성 창업자를 위한 특화 지원 프로그램. 사업화 자금, 여성 특화 멘토링, 네트워킹, 투자 연계까지 종합 지원.",
    url: "https://www.k-startup.go.kr",
  },
];

const CATEGORIES: Category[] = ["전체", "예비창업", "초기창업", "재도전", "청년", "기술창업"];

function getDday(deadlineDate: string) {
  const today = new Date();
  const deadline = new Date(deadlineDate);
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "마감", color: "text-gray-400" };
  if (diff === 0) return { label: "D-Day", color: "text-red-400" };
  if (diff <= 7) return { label: `D-${diff}`, color: "text-red-400" };
  if (diff <= 30) return { label: `D-${diff}`, color: "text-yellow-500" };
  return { label: `D-${diff}`, color: "text-green-500" };
}

/* 스켈레톤 카드 */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-12 bg-gray-200 rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-gray-200 rounded-lg" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
        <div className="text-right space-y-1">
          <div className="h-6 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<LiveAnnouncement[]>([]);
  const [source, setSource] = useState<"loading" | "live" | "fallback">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("전체");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setAnnouncements(json.data);
          setSource(json.source === "live" ? "live" : "fallback");
          if (json.fetchedAt) setFetchedAt(json.fetchedAt);
        } else {
          setAnnouncements(STATIC_ANNOUNCEMENTS);
          setSource("fallback");
        }
      })
      .catch(() => {
        setAnnouncements(STATIC_ANNOUNCEMENTS);
        setSource("fallback");
      });
  }, []);

  const filtered = announcements.filter((a) => {
    const matchCategory =
      activeCategory === "전체" ||
      (a.category as string[]).includes(activeCategory);
    const matchSearch =
      search === "" ||
      a.title.includes(search) ||
      a.org.includes(search) ||
      a.description.includes(search);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* 헤더 */}
      <header className="bg-[#0B1120] px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center">
            <span className="text-[#0B1120] text-sm font-black">F</span>
          </Link>
          <div>
            <h1 className="text-white font-black text-lg leading-none">공고마당</h1>
            <p className="text-[#8B9AB0] text-xs mt-0.5">창업 지원 사업 공고 모음</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/interview" className="text-xs text-[#8B9AB0] hover:text-white transition-colors">
            인터뷰 시작
          </Link>
          <Link href="/templates" className="px-4 py-2 bg-[#F0A500] text-[#0B1120] text-xs font-black rounded-xl hover:bg-[#f5b530] transition-colors">
            사업계획서 양식
          </Link>
        </div>
      </header>

      {/* 히어로 배너 */}
      <div className="bg-[#0B1120] pb-8 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 pt-6 mb-3">
            <p className="text-[#F0A500] text-xs font-bold tracking-widest uppercase">ANNOUNCEMENT HUB</p>
            {/* 데이터 소스 배지 */}
            {source === "live" && (
              <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                실시간 데이터
              </span>
            )}
            {source === "fallback" && (
              <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                샘플 데이터
              </span>
            )}
          </div>
          <p className="text-white text-2xl md:text-3xl font-black mb-2">
            지금 신청 가능한 창업 지원 사업
          </p>
          {source === "live" && fetchedAt && (
            <p className="text-[#4A5568] text-xs mb-4">
              마지막 업데이트: {new Date(fetchedAt).toLocaleString("ko-KR")} · bizinfo.go.kr
            </p>
          )}

          {/* 검색 */}
          <div className="relative max-w-xl mt-4">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="사업명, 기관, 키워드로 검색..."
              className="w-full bg-[#1E2D48] border border-[#2A3D58] rounded-2xl pl-11 pr-4 py-3 text-white placeholder-[#4A5568] text-sm outline-none focus:border-[#F0A500] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-12 py-4">
        <div className="max-w-4xl mx-auto flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-[#0B1120] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 self-center">
            {source === "loading" ? "로딩 중..." : `${filtered.length}개 공고`}
          </span>
        </div>
      </div>

      {/* 공고 목록 */}
      <main className="max-w-4xl mx-auto px-6 md:px-12 py-8 space-y-4">
        {/* 로딩 스켈레톤 */}
        {source === "loading" && (
          <>
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </>
        )}

        {/* 결과 없음 */}
        {source !== "loading" && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-bold mb-2">검색 결과가 없습니다</p>
            <p className="text-sm">다른 키워드로 검색해보세요</p>
          </div>
        )}

        {/* 공고 카드 */}
        {source !== "loading" &&
          filtered.map((a) => {
            const dday = getDday(a.deadlineDate);
            const isExpanded = expanded === a.id;
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl border transition-shadow ${
                  isExpanded ? "shadow-md border-gray-200" : "border-gray-100 hover:shadow-sm"
                }`}
              >
                {/* 카드 헤더 */}
                <button
                  className="w-full text-left p-6"
                  onClick={() => setExpanded(isExpanded ? null : a.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {a.isHot && (
                          <span className="bg-[#F0A500] text-[#0B1120] text-xs font-black px-2 py-0.5 rounded-full">HOT</span>
                        )}
                        {(a.category as string[]).map((c) => (
                          <span key={c} className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                        <span className={`text-xs font-bold ${dday.color}`}>{dday.label}</span>
                      </div>
                      <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{a.title}</h3>
                      <p className="text-sm text-gray-500">{a.org}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-black text-[#0B1120] text-lg">{a.amount}</p>
                      {a.count !== "-" && <p className="text-xs text-gray-400">{a.count} 선발</p>}
                    </div>
                  </div>

                  {/* 핵심 정보 요약 */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">신청 마감</p>
                      <p className="text-sm font-semibold text-gray-800">{a.deadline}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">지원 자격</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.eligibility.slice(0, 20)}...</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 hidden md:block">
                      <p className="text-xs text-gray-400 mb-1">신청 방법</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{a.method}</p>
                    </div>
                  </div>
                </button>

                {/* 펼쳐진 상세 내용 */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">사업 개요</p>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{a.description}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">지원 자격</p>
                          <p className="text-sm text-gray-700">{a.eligibility}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">신청 방법</p>
                          <p className="text-sm text-gray-700">{a.method}</p>
                        </div>
                      </div>

                      {/* Foal AI 연계 */}
                      <div className="bg-[#0B1120] rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white text-sm font-bold mb-1">이 공고에 맞는 사업계획서 작성하기</p>
                          <p className="text-[#8B9AB0] text-xs">Foal AI 인터뷰로 {a.title.slice(0, 20)} 맞춤 사업계획서를 작성하세요</p>
                        </div>
                        <Link
                          href="/interview"
                          className="flex-shrink-0 px-4 py-2 bg-[#F0A500] text-[#0B1120] text-sm font-black rounded-xl hover:bg-[#f5b530] transition-colors whitespace-nowrap"
                        >
                          AI 작성 →
                        </Link>
                      </div>

                      <div className="flex gap-3">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
                        >
                          공식 사이트에서 신청
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </main>

      {/* 하단 안내 */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 pb-12">
        <div className="bg-[#FFF8E7] border border-[#F0A500]/30 rounded-2xl p-5 text-sm text-[#92680A]">
          <strong>안내:</strong>{" "}
          {source === "live"
            ? "공고 정보는 bizinfo.go.kr(비즈인포)에서 실시간으로 가져옵니다. "
            : "현재 샘플 데이터를 표시 중입니다. "}
          공고 일정 및 내용은 주관 기관에 따라 변경될 수 있으며, 신청 전 공식 사이트에서 반드시 확인하세요.
        </div>
      </div>
    </div>
  );
}
