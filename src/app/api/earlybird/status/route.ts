import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export const runtime = "edge";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { count, error } = await supabase
    .from("credits")
    .select("*", { count: "exact", head: true })
    .not("earlybird_expires_at", "is", null)
    .gt("earlybird_expires_at", new Date().toISOString());

  if (error) {
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
