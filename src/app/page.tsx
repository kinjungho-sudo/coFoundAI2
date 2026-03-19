import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F0E17] text-[#E8E6F0]">
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[#2D2B42]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="font-semibold text-lg">CoFound AI</span>
        </div>
        <Link
          href="/login"
          className="px-5 py-2 bg-[#534AB7] hover:bg-[#6259c7] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          시작하기
        </Link>
      </nav>

      {/* 히어로 */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1A1927] border border-[#2D2B42] rounded-full px-4 py-2 text-xs text-[#8B89A0] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] animate-pulse" />
          AI 공동창업자와 함께 아이디어를 검증하세요
        </div>

        <h1 className="text-5xl font-bold leading-tight mb-6">
          창업 아이디어 검증,
          <br />
          <span className="text-[#534AB7]">2시간</span>으로 압축하다
        </h1>

        <p className="text-[#8B89A0] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          CoFound AI가 소크라테스식 질문으로 아이디어의 핵심을 파고듭니다.
          8단계 인터뷰 후 예비창업패키지 사업계획서를 자동 생성합니다.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-[#534AB7] hover:bg-[#6259c7] text-white font-semibold rounded-2xl transition-colors text-lg"
          >
            무료로 시작하기
          </Link>
          <span className="text-[#8B89A0] text-sm">이메일로 바로 시작 · 회원가입 불필요</span>
        </div>
      </section>

      {/* 핵심 기능 */}
      <section className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "💬",
              color: "#534AB7",
              title: "소크라테스식 인터뷰",
              desc: "AI가 답을 주는 것이 아니라 질문을 던집니다. 8단계 대화를 통해 아이디어의 핵심을 스스로 발견하세요.",
            },
            {
              icon: "📊",
              color: "#1D9E75",
              title: "실시간 점수 대시보드",
              desc: "타겟 고객, 페인포인트, 차별점, 창업자 적합성, 실행 가능성을 100점 만점으로 실시간 평가합니다.",
            },
            {
              icon: "📄",
              color: "#F5A623",
              title: "사업계획서 자동 생성",
              desc: "61점 이상 달성 시 예비창업패키지 공식 양식의 사업계획서를 즉시 생성합니다.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-[#1A1927] border border-[#2D2B42] rounded-2xl p-6"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ backgroundColor: `${f.color}20` }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-[#E8E6F0] mb-2">{f.title}</h3>
              <p className="text-sm text-[#8B89A0] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 악마의 변호인 */}
        <div className="mt-6 bg-[#1A1927] border border-[#E24B4A]/30 rounded-2xl p-6 flex items-start gap-6">
          <div className="w-10 h-10 rounded-xl bg-[#E24B4A]/20 flex items-center justify-center text-xl flex-shrink-0">
            😈
          </div>
          <div>
            <h3 className="font-semibold text-[#E24B4A] mb-1">악마의 변호인</h3>
            <p className="text-sm text-[#8B89A0] leading-relaxed">
              심사위원 관점에서 사업계획의 취약점을 냉철하게 분석합니다. 타겟 고객, 문제 정의, 차별점, 수익 모델, 실행 계획을 각각 검증하세요.
            </p>
          </div>
        </div>
      </section>

      {/* 하단 */}
      <footer className="border-t border-[#2D2B42] px-8 py-6 text-center text-xs text-[#8B89A0]">
        © 2026 CoFound AI · 예비창업자를 위한 AI 검증 플랫폼
      </footer>
    </div>
  );
}
