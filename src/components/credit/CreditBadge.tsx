"use client";

interface CreditBadgeProps {
  balance: number;
  onCharge?: () => void;
}

export default function CreditBadge({ balance, onCharge }: CreditBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-[#1A1927] border border-[#2D2B42] rounded-lg px-3 py-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span className="text-sm text-[#E8E6F0]">
          <span className="font-semibold text-[#F5A623]">{balance}</span>
          <span className="text-[#8B89A0] ml-1">크레딧</span>
        </span>
      </div>
      {onCharge && (
        <button
          onClick={onCharge}
          className="text-xs text-[#534AB7] hover:text-[#6259c7] font-medium transition-colors"
        >
          충전
        </button>
      )}
    </div>
  );
}
