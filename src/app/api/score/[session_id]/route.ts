import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { buildScoreBoard } from "@/lib/score-engine";
import type { ScoreDimension } from "@/types";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .select("scores")
    .eq("id", session_id)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 });
  }

  const rawScores = session.scores as Record<
    ScoreDimension,
    { score: number; feedback: string }
  >;
  const scoreBoard = buildScoreBoard(session_id, rawScores || {});

  return NextResponse.json(scoreBoard);
}
