import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { anthropic, MODEL, getJTBDSystemPrompt } from "@/lib/claude";
import type { Message } from "@/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { session_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const { session_id } = body;
  if (!session_id) {
    return NextResponse.json({ error: "session_id가 필요합니다." }, { status: 400 });
  }

  // 세션 조회 (RLS — 본인 세션만)
  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  // 인터뷰 내용 요약
  const messages: Message[] = Array.isArray(session.messages)
    ? (session.messages as Message[])
    : [];
  const interviewSummary = messages
    .map((m) => `[STEP ${m.step}] ${m.role === "ai" ? "AI" : "창업자"}: ${m.content}`)
    .join("\n\n");

  // Claude API로 JTBD 분석
  let jtbdData = null;
  let retries = 0;

  while (retries < 2 && !jtbdData) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: getJTBDSystemPrompt(interviewSummary),
        messages: [{ role: "user", content: "위 인터뷰 내용을 분석해서 JTBD를 추출해주세요." }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text.trim() : "";
      jtbdData = JSON.parse(text);
    } catch {
      retries++;
    }
  }

  if (!jtbdData) {
    return NextResponse.json({ error: "JTBD 분석에 실패했습니다." }, { status: 500 });
  }

  // outputs 테이블에 저장 (크레딧 차감 없음)
  const { data: output } = await supabase
    .from("outputs")
    .insert({
      user_id: user.id,
      session_id,
      type: "jtbd_analysis",
      content: JSON.stringify(jtbdData),
      credits_used: 0,
    })
    .select()
    .single();

  return NextResponse.json({ id: output?.id, jtbd: jtbdData });
}
