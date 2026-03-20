import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const runtime = "edge";

// POST /api/interview/session — 새 세션 생성
export async function POST() {
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      messages: [],
      scores: {},
      status: "in_progress",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "세션 생성에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(session, { status: 201 });
}
