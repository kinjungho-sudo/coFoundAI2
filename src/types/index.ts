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
  | "landing_copy";

// 산출물
export interface Output {
  id: string;
  user_id: string;
  session_id: string;
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

// STEP 메타데이터
export const STEP_METADATA: Record<
  number,
  { purpose: string; dimension: ScoreDimension }
> = {
  1: { purpose: "문제 정의 — 해결하고 싶은 핵심 문제 파악", dimension: "pain_point" },
  2: { purpose: "문제 구체화 — 핵심 문제 한 문장 정리", dimension: "pain_point" },
  3: { purpose: "타겟 고객 — 핵심 고객 페르소나 정의", dimension: "target_customer" },
  4: { purpose: "기존 해결책 — 현재 대안 및 지불 의향 확인", dimension: "pain_point" },
  5: { purpose: "차별점 — 10배 더 나은 이유 검증", dimension: "differentiation" },
  6: { purpose: "창업자 적합성 — 이 문제를 해야 하는 이유", dimension: "founder_fit" },
  7: { purpose: "리소스 현황 — 현재 보유 자원 파악", dimension: "feasibility" },
  8: { purpose: "다음 액션 — 이번 주 실행 계획 확정", dimension: "feasibility" },
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
