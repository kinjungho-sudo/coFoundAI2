import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  // 간단한 어드민 키 인증
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  // 카테고리별 문서 수
  const { data: counts, error: countError } = await supabase
    .from("rag_documents")
    .select("category")
    .eq("is_active", true);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const byCategory = (counts ?? []).reduce(
    (acc: Record<string, number>, row: { category: string }) => {
      acc[row.category] = (acc[row.category] || 0) + 1;
      return acc;
    },
    {}
  );

  // 최근 업데이트 로그 5건
  const { data: logs } = await supabase
    .from("rag_update_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    total_documents: counts?.length ?? 0,
    by_category: byCategory,
    recent_logs: logs ?? [],
  });
}
