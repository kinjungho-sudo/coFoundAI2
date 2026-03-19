/**
 * 보안 필터 — API Route에서 직접 import해서 사용
 */

// PII 패턴
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /01[0-9]-?\d{3,4}-?\d{4}/g, replacement: "[전화번호]" },
  { pattern: /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g, replacement: "[이메일]" },
  { pattern: /\d{3}-?\d{2}-?\d{5}/g, replacement: "[사업자번호]" },
  { pattern: /\d{6}-?[1-4]\d{6}/g, replacement: "[주민번호]" },
];

// 인젝션 패턴
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /system\s*:\s*/i,
  /\[system\]/i,
  /forget\s+your\s+(previous|system|role)/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /act\s+as\s+(if\s+you\s+are|a|an)\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /<!--[\s\S]*?-->/g,
];

export function maskPII(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function hasInjection(text: string): boolean {
  const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
  if (codeBlocks.some((b) => b.length > 500)) return true;
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function validateAndFilter(
  text: string,
  options: { minLen?: number; maxLen?: number } = {}
): { ok: boolean; filtered: string; error?: string } {
  const { minLen = 1, maxLen = 2000 } = options;

  if (!text || text.trim().length < minLen) {
    return { ok: false, filtered: text, error: "입력값이 너무 짧습니다." };
  }
  if (text.length > maxLen) {
    return { ok: false, filtered: text, error: `입력값이 ${maxLen}자를 초과합니다.` };
  }
  if (hasInjection(text)) {
    return { ok: false, filtered: text, error: "허용되지 않는 입력 패턴입니다." };
  }

  const filtered = maskPII(text.trim());
  return { ok: true, filtered };
}
