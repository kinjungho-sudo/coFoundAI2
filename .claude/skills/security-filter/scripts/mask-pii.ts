/**
 * PII 마스킹 스크립트
 * Claude API 호출 전 모든 사용자 입력에서 개인정보를 마스킹합니다.
 */

const PII_PATTERNS: Record<string, { pattern: RegExp; replacement: string }> = {
  phone: {
    pattern: /01[0-9]-?\d{3,4}-?\d{4}/g,
    replacement: "[전화번호]",
  },
  email: {
    pattern: /[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[이메일]",
  },
  biz_no: {
    pattern: /\d{3}-?\d{2}-?\d{5}/g,
    replacement: "[사업자번호]",
  },
  rrn: {
    pattern: /\d{6}-?[1-4]\d{6}/g,
    replacement: "[주민번호]",
  },
};

export function maskPII(text: string): string {
  let masked = text;

  for (const { pattern, replacement } of Object.values(PII_PATTERNS)) {
    masked = masked.replace(pattern, replacement);
  }

  return masked;
}

export function hasPII(text: string): boolean {
  return Object.values(PII_PATTERNS).some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}
