// 메시지 타입
export interface Message {
  step: number;
  role: "ai" | "user";
  content: string;
  timestamp: string;
}

// 점수 차원
export type ScoreDimension =
  | "target_customer"
  | "pain_point"
  | "differentiation"
  | "founder_fit"
  | "feasibility";

// 점수 항목
export interface ScoreItem {
  dimension: ScoreDimension;
  label: string;
  score: number; // 0~20
  feedback: string;
}

// 전체 점수보드
export interface ScoreBoard {
  session_id: string;
  items: Record<ScoreDimension, ScoreItem>;
  total: number; // 0~100
  level: "need_work" | "good" | "excellent";
  updated_at: string;
}

// 인터뷰 세션
export interface InterviewSession {
  id: string;
  user_id: string;
  messages: Message[];
  scores: Partial<Record<ScoreDimension, ScoreItem>>;
  status: "in_progress" | "completed" | "abandoned";
  created_at: string;
  updated_at: string;
}

// 산출물 타입
export type OutputType =
  | "business_plan"
  | "gov_match"
  | "interview_analysis"
  | "landing_copy"
  | "jtbd_analysis"
  | "business_plan_review";

// 크레딧 차감 기준
export const OUTPUT_CREDIT_COST: Record<OutputType, number> = {
  business_plan: 2,
  gov_match: 1,
  interview_analysis: 1,
  landing_copy: 1,
  jtbd_analysis: 0,       // 인터뷰 완료 후 자동 무료 생성
  business_plan_review: 1,
};

// 산출물
export interface Output {
  id: string;
  user_id: string;
  session_id: string | null;
  type: OutputType;
  content: string;
  credits_used: number;
  created_at: string;
}

// 크레딧 패키지
export type CreditPackage = "starter" | "basic" | "pro";

export const CREDIT_PACKAGES: Record<
  CreditPackage,
  { amount: number; credits: number; label: string }
> = {
  starter: { amount: 9900, credits: 3, label: "Starter" },
  basic: { amount: 19900, credits: 8, label: "Basic" },
  pro: { amount: 39900, credits: 20, label: "Pro" },
};

// 악마의 변호인 탭
export type DevilTab =
  | "target_customer"
  | "problem_definition"
  | "differentiation"
  | "revenue_model"
  | "execution_plan";

export const DEVIL_TAB_LABELS: Record<DevilTab, string> = {
  target_customer: "타겟고객",
  problem_definition: "문제정의",
  differentiation: "차별점",
  revenue_model: "수익모델",
  execution_plan: "실행계획",
};

// 악마의 변호인 결과
export interface DevilPoint {
  color: "red" | "amber" | "teal";
  text: string;
}

export interface DevilSection {
  title: string;
  attack: string;
  points: DevilPoint[];
}

export interface DevilAdvocateResult {
  q1: DevilSection;
  q2: DevilSection;
  q3: DevilSection;
  final_question: string;
}

// JTBD 분석 결과
export interface JTBDAnalysis {
  functional_job: string;   // 기능적 과업
  emotional_job: string;    // 감정적 과업
  social_job: string;       // 사회적 과업
  key_phrase: string;       // 핵심 한 마디 ("해냈어." 같은)
  differentiation_statement: string; // 차별점 문장
}

// STEP 메타데이터 (9단계)
export const STEP_METADATA: Record<
  number,
  { purpose: string; dimension: ScoreDimension; label: string }
> = {
  1: { purpose: "아이스브레이킹 — 해결하고 싶은 문제 자유롭게 탐색", dimension: "pain_point", label: "문제 탐색" },
  2: { purpose: "한 줄 소개 도출 — 핵심 문제를 한 문장으로 정리", dimension: "pain_point", label: "문제 정의" },
  3: { purpose: "타겟 고객 좁히기 — 핵심 고객 페르소나 구체화", dimension: "target_customer", label: "타겟 고객" },
  4: { purpose: "핵심 과업(JTBD) 발견 — 기능적·감정적·사회적 과업 분류", dimension: "target_customer", label: "JTBD 발견" },
  5: { purpose: "페인포인트 검증 — 기존 해결 방식 및 지불 의향 확인", dimension: "pain_point", label: "페인포인트" },
  6: { purpose: "차별점 발굴 — 10배 더 나은 이유 검증", dimension: "differentiation", label: "차별점" },
  7: { purpose: "창업자 강점 연결 — 이 문제를 해야 하는 이유", dimension: "founder_fit", label: "창업자 강점" },
  8: { purpose: "리소스 현황 — 현재 보유 자원 파악", dimension: "feasibility", label: "리소스" },
  9: { purpose: "다음 1주일 액션 — 이번 주 실행 계획 확정", dimension: "feasibility", label: "다음 액션" },
};

// API 응답 타입
export interface ApiError {
  error: string;
  code?: string;
}

export interface InterviewMessageRequest {
  session_id: string;
  step: number;
  message: string;
}

export interface ScoreRequest {
  step: number;
  answer: string;
  score_dimension: ScoreDimension;
}

export interface ScoreResponse {
  score: number;
  feedback: string;
}
