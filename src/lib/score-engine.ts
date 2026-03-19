/**
 * 점수 집계 엔진 — 서버사이드 전용
 */

import type { ScoreDimension, ScoreBoard, ScoreItem } from "@/types";

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  target_customer: "타겟 고객",
  pain_point: "페인포인트",
  differentiation: "차별점",
  founder_fit: "창업자 적합성",
  feasibility: "실행 가능성",
};

export function buildScoreBoard(
  sessionId: string,
  items: Partial<Record<ScoreDimension, { score: number; feedback: string }>>
): ScoreBoard {
  const boardItems: Partial<Record<ScoreDimension, ScoreItem>> = {};
  let total = 0;

  for (const [dim, data] of Object.entries(items)) {
    const dimension = dim as ScoreDimension;
    const validated = validateScore(data.score);
    boardItems[dimension] = {
      dimension,
      label: DIMENSION_LABELS[dimension],
      score: validated,
      feedback: data.feedback,
    };
    total += validated;
  }

  const level = getLevel(total);

  return {
    session_id: sessionId,
    items: boardItems as Record<ScoreDimension, ScoreItem>,
    total,
    level,
    updated_at: new Date().toISOString(),
  };
}

export function validateScore(score: number): number {
  if (typeof score !== "number" || isNaN(score)) return 0;
  return Math.max(0, Math.min(20, Math.round(score)));
}

export function getLevel(total: number): ScoreBoard["level"] {
  if (total >= 81) return "excellent";
  if (total >= 61) return "good";
  return "need_work";
}

export function getLevelLabel(level: ScoreBoard["level"]): string {
  switch (level) {
    case "excellent":
      return "정부지원사업 매칭 추천";
    case "good":
      return "사업계획서 생성 가능";
    case "need_work":
      return "더 구체화가 필요합니다";
  }
}

export function getLevelColor(level: ScoreBoard["level"]): string {
  switch (level) {
    case "excellent":
      return "#4A90D9";
    case "good":
      return "#1D9E75";
    case "need_work":
      return "#E24B4A";
  }
}
