/**
 * 프롬프트 인젝션 차단 스크립트
 */

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

export function hasInjection(text: string): boolean {
  // 코드블록 인젝션: 500자 초과 코드블록 차단
  const codeBlockPattern = /```[\s\S]*?```/g;
  const codeBlocks = text.match(codeBlockPattern) || [];
  if (codeBlocks.some((block) => block.length > 500)) {
    return true;
  }

  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

export function sanitizeInput(text: string): { safe: boolean; sanitized: string } {
  if (hasInjection(text)) {
    return { safe: false, sanitized: text };
  }
  return { safe: true, sanitized: text.trim() };
}
