"use client";

export const runtime = 'edge';

import Link from "next/link";
import { useState } from "react";

const TEMPLATE_SECTIONS = [
  {
    num: "1",
    title: "창업 아이템 개요",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    dotColor: "bg-blue-500",
    subsections: [
      {
        code: "1-1",
        title: "창업 아이템명 및 개요",
        desc: "아이템의 핵심을 한 줄로 표현하고, 어떤 문제를 어떻게 해결하는지 서술합니다.",
        tip: "심사위원이 30초 안에 이해할 수 있어야 합니다. 기술 용어보다 결과와 가치로 설명하세요.",
        fields: ["아이템명", "아이템 요약 (3줄 이내)", "개발 단계 (아이디어/시제품/서비스 중)"],
      },
      {
        code: "1-2",
        title: "창업 아이템의 필요성",
        desc: "해결하려는 문제가 실제로 존재하는지, 얼마나 심각한지 데이터와 사례로 제시합니다.",
        tip: "통계, 인터뷰, 실제 사례를 활용해 문제의 크기를 수치로 보여주세요.",
        fields: ["현재 문제 상황", "불편 사항 및 피해 규모", "기존 해결책의 한계"],
      },
      {
        code: "1-3",
        title: "창업 아이템의 현황",
        desc: "현재 개발 상황, 보유 기술, 지식재산권 등을 정리합니다.",
        tip: "없어도 괜찮습니다. 있다면 구체적으로, 없다면 계획을 명확히 제시하세요.",
        fields: ["현재 개발 단계", "보유 기술/특허", "파트너십/협약 현황"],
      },
      {
        code: "1-4",
        title: "시장 분석 (TAM/SAM/SOM)",
        desc: "목표 시장의 규모를 전체→세분→실제 획득 가능 순으로 분석합니다.",
        tip: "근거 있는 숫자가 중요합니다. '약 OO조 시장'보다 '통계청 자료에 따르면'으로 시작하세요.",
        fields: ["TAM (전체 시장 규모)", "SAM (서비스 가능 시장)", "SOM (실제 목표 시장)"],
      },
    ],
  },
  {
    num: "2",
    title: "창업 아이템의 실현 가능성",
    color: "bg-green-50 border-green-200 text-green-700",
    dotColor: "bg-green-500",
    subsections: [
      {
        code: "2-1",
        title: "기술 및 서비스 차별성",
        desc: "경쟁사 대비 무엇이 10배 나은지 수치로 설명합니다.",
        tip: "JTBD 분석 결과를 활용하여 고객이 진짜 원하는 것과 연결하세요.",
        fields: ["핵심 차별점 (기능/기술/가격/경험)", "경쟁사 비교표", "지속 가능한 경쟁우위"],
      },
      {
        code: "2-2",
        title: "사업화 전략",
        desc: "어떻게 고객을 확보하고, 어떤 채널로 수익을 낼지 구체적으로 서술합니다.",
        tip: "첫 10명의 고객을 어떻게 확보할지부터 시작하세요. 대형 마케팅보다 작은 실험이 설득력 있습니다.",
        fields: ["타겟 고객 정의", "고객 확보 전략 (초기/성장)", "수익 모델", "가격 정책"],
      },
      {
        code: "2-3",
        title: "팀 구성 및 역할",
        desc: "왜 이 팀이 이 문제를 해결할 수 있는지 경험과 역량으로 증명합니다.",
        tip: "창업자의 이 분야 경험 또는 집착이 핵심입니다. '왜 내가 해야 하는가'를 명확히 답하세요.",
        fields: ["창업자 프로필 및 관련 경험", "팀원 역할 및 역량", "외부 자문/멘토"],
      },
    ],
  },
  {
    num: "3",
    title: "성장 전략 및 자금 활용 계획",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    dotColor: "bg-purple-500",
    subsections: [
      {
        code: "3-1",
        title: "목표 및 실행 계획",
        desc: "지원금 수령 후 12개월 내 달성할 구체적인 마일스톤을 제시합니다.",
        tip: "분기별로 나눠서 측정 가능한 목표(KPI)를 설정하세요. 막연한 '성장'보다 '고객 100명 확보'가 좋습니다.",
        fields: ["3개월 목표 및 KPI", "6개월 목표 및 KPI", "12개월 목표 및 KPI"],
      },
      {
        code: "3-2",
        title: "자금 활용 계획",
        desc: "지원금 OO만원을 어디에 어떻게 사용할지 항목별로 상세히 기술합니다.",
        tip: "개발비, 마케팅비, 인건비 등 구체적 비목과 금액을 제시하세요. 심사위원이 납득할 수 있어야 합니다.",
        fields: ["사업화 자금 활용 계획 (항목별)", "기대 효과", "후속 자금 조달 계획"],
      },
      {
        code: "3-3",
        title: "리스크 및 대응 방안",
        desc: "예상되는 위험 요소와 이를 어떻게 극복할지 솔직하게 작성합니다.",
        tip: "리스크를 숨기는 것보다 인정하고 대응책을 제시하는 것이 더 신뢰를 줍니다.",
        fields: ["주요 리스크 요소", "기술/시장/팀 위험", "위기 대응 전략"],
      },
    ],
  },
  {
    num: "4",
    title: "JTBD 분석 (Foal AI 자동 생성)",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    dotColor: "bg-amber-500",
    subsections: [
      {
        code: "4-1",
        title: "기능적 과업 (Functional Jobs)",
        desc: "고객이 제품/서비스를 통해 실제로 수행하고자 하는 작업",
        tip: "Foal AI 인터뷰 완료 후 자동 생성됩니다.",
        fields: ["주요 기능적 과업 목록", "현재 해결 방식과의 비교"],
      },
      {
        code: "4-2",
        title: "감정적 과업 (Emotional Jobs)",
        desc: "고객이 느끼고 싶은 감정 또는 피하고 싶은 감정",
        tip: "Foal AI 인터뷰 완료 후 자동 생성됩니다.",
        fields: ["긍정적 감정 과업", "부정적 감정 회피 과업"],
      },
      {
        code: "4-3",
        title: "사회적 과업 (Social Jobs)",
        desc: "고객이 다른 사람들에게 어떻게 보이고 싶은지에 대한 욕구",
        tip: "Foal AI 인터뷰 완료 후 자동 생성됩니다.",
        fields: ["사회적 인정 욕구", "정체성 표현 방식"],
      },
    ],
  },
];

const EVALUATION_CRITERIA = [
  { item: "문제 명확성", weight: "20점", desc: "해결하려는 문제가 실제로 존재하고 명확한가" },
  { item: "솔루션 차별성", weight: "20점", desc: "기존 대안 대비 실질적인 차별점이 있는가" },
  { item: "시장 규모", weight: "20점", desc: "충분히 큰 시장이 존재하고 근거가 있는가" },
  { item: "팀 역량", weight: "20점", desc: "이 문제를 해결할 수 있는 팀인가" },
  { item: "실행 가능성", weight: "20점", desc: "계획이 현실적이고 실현 가능한가" },
];

export default function TemplatesPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* 헤더 */}
      <header className="bg-[#0B1120] px-6 md:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 rounded-lg bg-[#F0A500] flex items-center justify-center">
            <span className="text-[#0B1120] text-sm font-black">F</span>
          </Link>
          <div>
            <h1 className="text-white font-black text-lg leading-none">사업계획서 양식</h1>
            <p className="text-[#8B9AB0] text-xs mt-0.5">예비창업패키지 공식 양식 가이드</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/announcements" className="text-xs text-[#8B9AB0] hover:text-white transition-colors">
            공고마당
          </Link>
          <Link href="/interview" className="px-4 py-2 bg-[#F0A500] text-[#0B1120] text-xs font-black rounded-xl hover:bg-[#f5b530] transition-colors">
            AI로 작성하기
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <div className="bg-[#0B1120] pb-10 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#F0A500] text-xs font-bold tracking-widest uppercase mb-3">BUSINESS PLAN TEMPLATE</p>
          <h2 className="text-white text-3xl md:text-4xl font-black mb-3">
            예비창업패키지 사업계획서<br />작성 가이드
          </h2>
          <p className="text-[#8B9AB0] text-sm mb-6 max-w-xl">
            심사위원이 보는 공식 양식을 섹션별로 분석하고, 각 항목을 어떻게 작성해야 하는지 팁과 함께 제공합니다.
            Foal AI 인터뷰를 완료하면 이 양식에 맞게 자동으로 작성됩니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl hover:bg-[#f5b530] transition-colors text-sm"
            >
              AI 인터뷰로 자동 작성
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/announcements"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E2D48] text-white font-bold rounded-2xl hover:bg-[#2A3D58] transition-colors text-sm"
            >
              공고 확인하기
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 md:px-12 py-10 space-y-6">
        {/* 심사 기준 요약 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
            <span className="text-[#F0A500]">📊</span> 심사 기준 (100점)
          </h3>
          <div className="space-y-3">
            {EVALUATION_CRITERIA.map((c) => (
              <div key={c.item} className="flex items-center gap-4">
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-bold text-gray-700">{c.item}</span>
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0B1120] rounded-full" style={{ width: "20%" }} />
                </div>
                <span className="text-sm font-black text-gray-900 w-12 text-right">{c.weight}</span>
                <span className="text-xs text-gray-400 hidden md:block flex-1">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 섹션별 양식 */}
        {TEMPLATE_SECTIONS.map((section) => (
          <div key={section.num} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* 섹션 헤더 */}
            <button
              onClick={() => setActiveSection(activeSection === section.num ? null : section.num)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B1120] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#F0A500] font-black text-lg">{section.num}</span>
                </div>
                <h3 className="font-black text-gray-900 text-lg">{section.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                {section.num === "4" && (
                  <span className="bg-[#F0A500] text-[#0B1120] text-xs font-black px-3 py-1 rounded-full">AI 자동 생성</span>
                )}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === section.num ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 서브섹션 */}
            {activeSection === section.num && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {section.subsections.map((sub) => (
                  <div key={sub.code} className="p-6">
                    <div className="flex items-start gap-4">
                      <span className={`flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-lg border ${section.color}`}>
                        {sub.code}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2">{sub.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{sub.desc}</p>

                        {/* 작성 팁 */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
                          <span className="text-amber-500 flex-shrink-0">💡</span>
                          <p className="text-xs text-amber-800 leading-relaxed">{sub.tip}</p>
                        </div>

                        {/* 필수 작성 항목 */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">작성 항목</p>
                          <div className="space-y-1.5">
                            {sub.fields.map((field) => (
                              <div key={field} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${section.dotColor}`} />
                                {field}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Foal AI CTA */}
        <div className="bg-[#0B1120] rounded-3xl p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0A500] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#0B1120] text-2xl font-black">F</span>
          </div>
          <h3 className="text-white font-black text-2xl mb-3">
            이 양식을 AI가 자동으로 채워드립니다
          </h3>
          <p className="text-[#8B9AB0] text-sm mb-6 max-w-md mx-auto leading-relaxed">
            9단계 인터뷰에 답하면 위 모든 섹션이 자동으로 작성됩니다.
            JTBD 분석, 시장 분석, 실행 계획까지 포함됩니다.
          </p>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#F0A500] text-[#0B1120] font-black rounded-2xl hover:bg-[#f5b530] transition-colors"
          >
            지금 인터뷰 시작하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
