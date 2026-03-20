"use client";

import { ScoreBoard, ScoreDimension } from "@/types";
import { getLevelLabel, getLevelColor } from "@/lib/score-engine";

interface ScoreDashboardProps {
  scoreBoard: Partial<ScoreBoard>;
  onGeneratePlan: () => void;
  isGenerating: boolean;
  creditBalance: number;
}

const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  target_customer: "타겟 고객",
  pain_point: "페인포인트",
  differentiation: "차별점",
  founder_fit: "창업자 적합성",
  feasibility: "실행 가능성",
};

const DIMENSIONS: ScoreDimension[] = [
  "target_customer",
  "pain_point",
  "differentiation",
  "founder_fit",
  "feasibility",
];

function ScoreBar({ score }: { score: number }) {
  const percent = (score / 20) * 100;
  const color =
    score >= 16
      ? "#4A90D9"
      : score >= 11
      ? "#1D9E75"
      : score >= 6
      ? "#F5A623"
      : "#E24B4A";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#2D2B42] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-[#8B89A0] w-10 text-right">
        {score}/20
      </span>
    </div>
  );
}

export default function ScoreDashboard({
  scoreBoard,
  onGeneratePlan,
  isGenerating,
  creditBalance,
}: ScoreDashboardProps) {
  const total = scoreBoard.total ?? 0;
  const level = scoreBoard.level ?? "need_work";
  const levelLabel = getLevelLabel(level);
  const levelColor = getLevelColor(level);
  const canGenerate = total >= 61;

  const totalPercent = (total / 100) * 100;
  const totalColor =
    total >= 81
      ? "#4A90D9"
      : total >= 61
      ? "#1D9E75"
      : total >= 31
      ? "#F5A623"
      : "#E24B4A";

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h2 className="text-sm font-semibold text-[#8B89A0] uppercase tracking-wider">
        아이디어 검증 점수
      </h2>

      {/* 총점 */}
      <div className="p-4 bg-[#1A1927] rounded-xl border border-[#2D2B42]">
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold" style={{ color: totalColor }}>
            {total}
          </span>
          <span className="text-[#8B89A0] text-sm">/ 100점</span>
        </div>
        <div className="w-full h-3 bg-[#2D2B42] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${totalPercent}%`, backgroundColor: totalColor }}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: levelColor }}>
          {canGenerate ? "✓" : "⚠"} {levelLabel}
        </p>
      </div>

      {/* 항목별 점수 */}
      <div className="flex flex-col gap-3">
        {DIMENSIONS.map((dim) => {
          const item = scoreBoard.items?.[dim];
          const score = item?.score ?? 0;

          return (
            <div key={dim}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#8B89A0]">
                  {DIMENSION_LABELS[dim]}
                </span>
              </div>
              <ScoreBar score={score} />
              {item?.feedback && (
                <p className="text-xs text-[#534AB7] mt-1 leading-relaxed">
                  {item.feedback}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 산출물 생성 버튼 */}
      <div className="mt-auto">
        {!canGenerate && (
          <p className="text-xs text-[#8B89A0] text-center mb-2">
            61점 이상이면 사업계획서를 생성할 수 있습니다
          </p>
        )}
        {canGenerate && creditBalance < 2 && (
          <p className="text-xs text-[#F5A623] text-center mb-2">
            크레딧이 부족합니다 (2 크레딧 필요)
          </p>
        )}
        <button
          onClick={onGeneratePlan}
          disabled={!canGenerate || isGenerating || creditBalance < 2}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
            canGenerate && creditBalance >= 2
              ? "bg-[#534AB7] hover:bg-[#6259c7] text-white cursor-pointer"
              : "bg-[#2D2B42] text-[#8B89A0] cursor-not-allowed"
          }`}
        >
          {isGenerating ? "생성 중..." : "사업계획서 생성"}
          {canGenerate && creditBalance >= 2 && (
            <span className="ml-1 text-xs opacity-70">(2 크레딧)</span>
          )}
        </button>
      </div>
    </div>
  );
}
