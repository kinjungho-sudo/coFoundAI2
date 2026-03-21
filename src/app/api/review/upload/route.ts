import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/* base64 인코딩 (대용량 파일 스택 오버플로 방지) */
function toBase64(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < uint8.length; i += chunk) {
    binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + chunk, uint8.length)));
  }
  return btoa(binary);
}

/* HWP XML 섹션에서 텍스트 추출 시도 (단순 heuristic) */
async function extractDocxText(buffer: ArrayBuffer): Promise<string | null> {
  // DOCX는 ZIP 파일이므로 edge에서 unzip 불가 → null 반환, 클라이언트에 안내
  void buffer;
  return null;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData 파싱 실패" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });

  const maxBytes = 15 * 1024 * 1024; // 15 MB
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "파일 크기 초과 (최대 15MB)" }, { status: 400 });
  }

  const name = file.name.toLowerCase();

  /* ── TXT ── */
  if (name.endsWith(".txt") || file.type === "text/plain") {
    const text = await file.text();
    if (!text.trim()) return NextResponse.json({ error: "파일이 비어 있습니다" }, { status: 400 });
    return NextResponse.json({
      type: "text",
      text: text.slice(0, 80_000), // 80k char 제한
      filename: file.name,
      size: file.size,
    });
  }

  /* ── PDF ── */
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const base64 = toBase64(buffer);
    return NextResponse.json({
      type: "pdf",
      base64,
      filename: file.name,
      size: file.size,
    });
  }

  /* ── DOCX (미지원 안내) ── */
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return NextResponse.json({
      error: "DOCX는 현재 지원되지 않습니다. PDF 또는 TXT로 변환 후 업로드해주세요.\n\n변환 방법: Word → 다른 이름으로 저장 → PDF 선택",
    }, { status: 415 });
  }

  /* ── HWP ── */
  if (name.endsWith(".hwp") || name.endsWith(".hwpx")) {
    return NextResponse.json({
      error: "HWP는 현재 지원되지 않습니다. PDF로 변환 후 업로드해주세요.\n\n변환 방법: 한글 → 다른 이름으로 저장 → PDF 선택",
    }, { status: 415 });
  }

  return NextResponse.json({
    error: "지원 형식: PDF, TXT\n(HWP · DOCX는 PDF로 변환 후 업로드)",
  }, { status: 415 });
}
