/**
 * RAG 시드 스크립트 — 방법론 및 정부지원사업 문서를 Supabase에 임베딩하여 저장
 * 실행: npx tsx --env-file=.env.local scripts/seed-methodology.ts
 */

import { createClient } from "@supabase/supabase-js";

// ── 환경변수 ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error("❌ 필수 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 임베딩 생성 ───────────────────────────────────────────────────────────────
async function createEmbedding(text: string): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
  const json = (await resp.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0].embedding;
}

// ── 문서 정의 ─────────────────────────────────────────────────────────────────
interface DocInput {
  source_id: string;
  category: "gov_official" | "methodology" | "case_study";
  title: string;
  content: string;
  content_summary: string;
}

const DOCUMENTS: DocInput[] = [
  // ── 맘 테스트 (Rob Fitzpatrick) ──────────────────────────────────────────
  {
    source_id: "mom-test-core-principles",
    category: "methodology",
    title: "맘 테스트: 고객 인터뷰 핵심 원칙",
    content_summary: "진짜 고객 정보를 얻는 질문 방법론",
    content: `맘 테스트(The Mom Test)는 Rob Fitzpatrick이 제안한 고객 인터뷰 방법론입니다.

핵심 원칙:
1. 사람들은 당신의 아이디어를 칭찬하려 한다 — 그래서 미래 의향 질문은 무의미하다.
   "이런 앱이 생기면 쓰실 것 같나요?" → 대부분 "네"라고 답하지만 실제로는 쓰지 않는다.

2. 과거 행동을 물어라 — 미래 의향이 아니라.
   좋은 질문: "지난달에 이 문제로 어떻게 하셨나요? 구체적으로 무엇을 했나요?"
   나쁜 질문: "앞으로 이런 서비스를 쓰실 의향이 있으신가요?"

3. 문제에 집중하라 — 솔루션을 검증하려 하지 마라.
   먼저 문제가 실제로 존재하는지, 얼마나 고통스러운지 파악하라.

4. 돈 이야기를 꺼내라.
   "지금 이 문제를 해결하기 위해 비용을 내고 있나요? 얼마나요?"
   실제로 돈을 내고 있다면 진짜 문제다.

5. 숫자를 요구하라.
   "얼마나 자주 그 문제가 생기나요?" — 빈도와 심각도를 수치화해야 진짜 데이터다.`,
  },
  {
    source_id: "mom-test-buying-signals",
    category: "methodology",
    title: "맘 테스트: 구매 신호 포착하기",
    content_summary: "진짜 잠재 고객을 구별하는 신호들",
    content: `진짜 잠재 고객 vs 예의 바른 거절을 구별하는 방법.

강한 구매 신호:
- "혹시 지금 바로 사용해볼 수 있나요?" — 즉시 사용 요청
- "친구에게도 알려줘도 될까요?" — 자발적 소개
- "이게 있으면 지금 당장 ○○원 내겠어요" — 구체적 금액 제시
- 인터뷰 중 스스로 연락처를 건네는 행동

약한 신호 (무시하라):
- "좋아 보이네요" — 빈말이다
- "나중에 한번 써볼게요" — 관심 없다는 뜻이다
- "가격만 저렴하면요" — 구체성 없는 조건부 긍정

인터뷰 중 해야 할 질문:
"지금 이 자리에서 베타 사용자로 등록하시겠어요?"
→ Yes면 진짜 관심, No면 정중한 거절

검증 사례:
드롭박스 창업자 Drew Houston은 랜딩 페이지 하나로 75,000명의 이메일을 수집했다.
실제 제품 없이도 "베타 대기 등록" 전환율로 수요를 검증한 것이다.`,
  },
  {
    source_id: "mom-test-target-customer",
    category: "methodology",
    title: "맘 테스트: 타겟 고객 좁히기",
    content_summary: "초기 창업자가 타겟을 너무 넓게 잡는 함정과 해결책",
    content: `타겟 고객을 좁히는 것이 성공의 핵심이다.

함정 — "모든 사람이 잠재 고객":
"20~40대 직장인"이라고 하면 타겟 고객이 없는 것과 같다.
초기 단계에서 "모든 사람을 위한 제품"은 "아무도 위한 제품이 아니다"를 의미한다.

올바른 방법 — 극단적으로 좁혀라:
나쁜 예: "중소기업 HR 담당자"
좋은 예: "50인 미만 제조업 HR 담당자 중 근태 관리 소프트웨어를 아직 쓰지 않는 사람"

왜 좁혀야 하나:
1. 좁을수록 메시지가 날카로워진다 — "이건 나를 위한 것이다"
2. 입소문이 퍼지기 쉽다 — 같은 커뮤니티 내 전파
3. 첫 고객 10명이 같은 카테고리면 패턴을 발견할 수 있다

실전 질문:
"지금 바로 연락할 수 있는 이 문제를 가진 사람 3명이 누구인지 말해줄 수 있나요?"
→ 이름을 댈 수 없다면 타겟이 너무 추상적이다.`,
  },

  // ── 린 스타트업 (Eric Ries) ──────────────────────────────────────────────
  {
    source_id: "lean-startup-mvp",
    category: "methodology",
    title: "린 스타트업: MVP로 가장 빠르게 검증하기",
    content_summary: "최소 기능 제품으로 핵심 가정을 검증하는 방법",
    content: `MVP(Minimum Viable Product)는 '최소한의 기능으로 최대의 학습을 얻는 제품'이다.

MVP의 목적:
- 핵심 가정(Assumption)을 실제 데이터로 검증
- 만드는 데 드는 시간과 돈을 최소화
- 빠른 피드백 루프 확보

MVP 유형:
1. 랜딩 페이지 MVP — 제품 없이 수요 검증
   사례: 드롭박스 — 설명 영상만으로 75,000명 이메일 수집

2. 위자드 오브 오즈(Wizard of Oz) MVP — 자동화처럼 보이지만 수동 처리
   사례: Zappos — 신발 사진을 찍고 실제로 사람이 구매해서 배송

3. 컨시어지(Concierge) MVP — 사람이 직접 서비스를 제공
   사례: Food on the Table — 앱 없이 사람이 직접 레시피 배달

핵심 원칙:
"MVP는 가장 단순한 버전이 아니라, 가장 빠르게 가정을 검증하는 버전이다."

검증해야 할 핵심 가정:
- 문제 가정: 실제로 이 문제가 존재하는가?
- 솔루션 가정: 우리 해결책이 효과적인가?
- 채널 가정: 고객을 어떻게 획득하는가?
- 수익 가정: 사람들이 돈을 낼 의향이 있는가?`,
  },
  {
    source_id: "lean-startup-pivot",
    category: "methodology",
    title: "린 스타트업: 피벗 결정 기준",
    content_summary: "언제 방향을 바꾸고 언제 계속할지 판단하는 기준",
    content: `피벗(Pivot)은 실패가 아니라 방향 수정이다. 잘못된 방향을 빨리 발견할수록 성공에 가까워진다.

피벗 신호 (방향을 바꿔야 할 때):
- 제품을 써본 사용자가 재사용하지 않는다 (리텐션 0%)
- 10명에게 설명했는데 아무도 지불 의향이 없다
- 문제는 인정하지만 해결책에 관심이 없다
- 고객 획득 비용이 고객 생애 가치보다 지속적으로 높다

지속 신호 (계속해야 할 때):
- 소수지만 열광적인 팬이 있다
- 사용자가 제품의 특정 기능에 강하게 의존한다
- 자발적으로 친구를 소개한다
- "빨리 정식 출시해 달라"는 요청이 온다

피벗 유형:
1. 고객 세그먼트 피벗 — 같은 문제, 다른 타겟
2. 문제 피벗 — 같은 타겟, 다른 문제 해결
3. 가격 피벗 — 수익 모델 변경
4. 플랫폼 피벗 — 앱에서 API로, API에서 플랫폼으로

"피벗하거나 지속하거나" 결정 전에 물어볼 것:
"우리가 처음 세운 가정이 맞았나? 틀렸다면 어떤 데이터가 틀렸음을 보여주나?"`,
  },
  {
    source_id: "lean-startup-validated-learning",
    category: "methodology",
    title: "린 스타트업: 검증된 학습",
    content_summary: "허영 지표를 피하고 실행 가능한 지표로 학습하기",
    content: `검증된 학습(Validated Learning)은 실제 데이터로 사업 가정을 입증하는 것이다.

허영 지표 (피해야 할 지표):
- 총 가입자 수 (이탈률을 숨긴다)
- 총 페이지뷰 (전환이 없으면 의미 없다)
- 앱 다운로드 수 (활성 사용자 수가 중요하다)

실행 가능한 지표 (의사결정에 쓸 수 있는 지표):
- 활성 사용자 리텐션율 (7일, 30일)
- 고객 획득 비용(CAC) vs 고객 생애 가치(LTV)
- 전환율 (방문자 → 가입, 가입 → 결제)
- NPS (순 추천 지수)

초기 스타트업의 North Star 지표 예시:
- SaaS: 주간 활성 사용자 × 주간 리텐션율
- 마켓플레이스: 첫 거래 완료까지 걸린 시간
- 커머스: 재구매율

핵심 원칙:
"측정할 수 없으면 개선할 수 없다. 하지만 측정 가능한 것만 추구하면 중요한 것을 잃는다."

실전 적용:
MVP를 출시하기 전에 "이 실험이 성공하면 어떤 숫자가 바뀌어야 하는가?"를 먼저 정의하라.`,
  },

  // ── 예비창업패키지 / 정부지원사업 가이드 ────────────────────────────────────
  {
    source_id: "gov-psst-evaluation",
    category: "gov_official",
    title: "예비창업패키지 심사 기준: PSST 프레임워크",
    content_summary: "정부 창업지원사업 심사위원이 보는 핵심 평가 기준",
    content: `예비창업패키지는 중소벤처기업부가 운영하는 초기 창업 지원 프로그램이다.

PSST 평가 프레임워크:
P — Problem (문제): 35%
- 실제로 존재하는 문제인가?
- 문제의 심각성과 시장 규모는?
- 기존 해결책의 한계는?

S — Solution (솔루션): 25%
- 혁신성: 기존 대비 10배 이상 나은가?
- 기술적 실현 가능성
- 지식재산권(IP) 보유 여부

S — Scale (확장성): 20%
- 반복 가능한 비즈니스 모델인가?
- 시장 규모(TAM/SAM/SOM)
- 글로벌 확장 가능성

T — Team (팀): 20%
- 창업자의 문제 해결 역량
- 도메인 전문성
- 팀 구성 (기술 + 비즈니스)

심사에서 자주 탈락하는 이유:
1. "저희 경쟁사는 없습니다" — 경쟁사 분석 부재
2. "전 국민이 타겟" — 타겟 고객 불명확
3. "3년 후 매출 100억" — 근거 없는 낙관적 수치
4. 창업자와 아이템의 연결고리 없음`,
  },
  {
    source_id: "gov-business-plan-writing",
    category: "gov_official",
    title: "사업계획서 작성 핵심: 심사위원을 설득하는 방법",
    content_summary: "실제 채택되는 사업계획서의 구조와 작성 전략",
    content: `심사위원은 수백 개의 사업계획서를 읽는다. 첫 2페이지에서 결정이 난다.

채택되는 사업계획서의 공통점:
1. 문제 정의가 날카롭다
   나쁜 예: "중소기업 디지털 전환의 어려움"
   좋은 예: "50인 미만 제조업체 공장장의 85%가 재고 파악을 엑셀로 한다.
   평균 2시간/일을 낭비하고 재고 오차로 연 200만원 손실 발생"

2. 검증 증거가 있다
   - 잠재 고객 인터뷰 5건 이상 (날짜, 직함 포함)
   - 사전 주문 or 파일럿 계약 letter of intent
   - 경쟁사 리서치 (기능 비교표)

3. 창업자의 스토리와 아이템이 연결된다
   "제가 이 문제를 해결하는 사람이어야 하는 이유"를 설명하라

4. 3개월 실행 계획이 구체적이다
   "B2B 영업 시작"이 아니라
   "1개월: 3개 파일럿 고객 확보, 주간 1:1 피드백, 2개월: 제품 개선 2회 이상,
   3개월: 유료 전환 1건 이상"

5. 예산 배분이 합리적이다
   인건비 > 마케팅 > 개발비 순이 일반적으로 설득력 있다.
   광고비가 전체 50% 이상이면 심사위원이 의심한다.`,
  },
  {
    source_id: "gov-execution-plan",
    category: "gov_official",
    title: "3개월 실행 계획: 검증 마일스톤 설정",
    content_summary: "정부지원사업에서 인정받는 실행 계획 수립 방법",
    content: `실행 계획은 "무엇을 하겠다"가 아니라 "무엇을 검증하겠다"여야 한다.

나쁜 실행 계획:
월 1: 시장 조사, 제품 기획
월 2: 개발
월 3: 출시 및 홍보

좋은 실행 계획 (검증 중심):
월 1:
- 목표: 문제 가정 검증
- 활동: 타겟 고객 10명 심층 인터뷰
- 검증 지표: 7명 이상이 "이 문제에 돈을 낸 경험 있음" 확인
- 산출물: 고객 인터뷰 보고서

월 2:
- 목표: 솔루션 가정 검증
- 활동: 랜딩 페이지 + 와이어프레임으로 사전 예약 받기
- 검증 지표: 전환율 5% 이상 or 사전 예약 50건
- 산출물: MVP 프로토타입

월 3:
- 목표: 수익 모델 검증
- 활동: 5개 파일럿 기업에 무료 → 유료 전환 시도
- 검증 지표: 1건 이상 유료 전환
- 산출물: 첫 매출 증빙 or 구매 의향서

심사위원이 보는 것:
"이 팀이 3개월 후 어떤 상태가 되어 있을지 상상할 수 있는가?"
구체적인 숫자와 날짜가 있어야 신뢰도가 높아진다.`,
  },
];

// ── 시드 실행 ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log(`📚 ${DOCUMENTS.length}개 문서 임베딩 시작...\n`);

  let success = 0;
  let failed = 0;

  for (const doc of DOCUMENTS) {
    process.stdout.write(`  → [${doc.category}] ${doc.title} ... `);
    try {
      const embedding = await createEmbedding(doc.content);

      const { error } = await supabase.from("rag_documents").upsert(
        {
          source_id: doc.source_id,
          category: doc.category,
          title: doc.title,
          content: doc.content,
          content_summary: doc.content_summary,
          metadata: {},
          embedding: embedding as unknown as string,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_id" }
      );

      if (error) throw error;

      console.log("✅");
      success++;
    } catch (err) {
      console.log("❌", (err as Error).message);
      failed++;
    }

    // Rate limit 방지용 딜레이
    await new Promise((r) => setTimeout(r, 200));
  }

  // 업데이트 로그 기록
  await supabase.from("rag_update_logs").insert({
    source_id: "seed-methodology",
    status: failed === 0 ? "success" : "failed",
    documents_added: success,
    documents_updated: 0,
    documents_deleted: 0,
    error_message: failed > 0 ? `${failed}개 문서 실패` : null,
  });

  console.log(`\n✅ 완료: 성공 ${success}개, 실패 ${failed}개`);
}

seed().catch(console.error);
