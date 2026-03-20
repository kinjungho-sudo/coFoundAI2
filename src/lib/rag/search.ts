import { createServiceRoleClient } from "@/lib/supabase";
import { createEmbedding } from "./embeddings";

export interface RagSearchResult {
  id: string;
  source_id: string;
  category: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

// 스텝별 검색 카테고리 매핑
const STEP_CATEGORY_MAP: Record<number, string | undefined> = {
  1: "methodology",   // 문제 발견
  2: "methodology",   // 문제 정의
  3: "methodology",   // 타겟 고객
  4: "case_study",    // 기존 해결책
  5: "methodology",   // 차별화
  6: "case_study",    // 창업자 적합성
  7: "gov_official",  // 실행 계획
  8: "gov_official",  // 다음 단계
};

export async function searchRAGDocuments(
  queryEmbedding: number[],
  options: { category?: string | null; matchCount?: number } = {}
): Promise<RagSearchResult[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("search_rag_documents", {
    query_embedding: queryEmbedding as unknown as string,
    match_count: options.matchCount ?? 3,
    filter_category: options.category ?? null,
  });

  if (error) throw error;
  return (data ?? []) as RagSearchResult[];
}

export async function buildRAGContext(
  userMessage: string,
  step: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return "";

  try {
    const embedding = await createEmbedding(userMessage);
    const category = STEP_CATEGORY_MAP[step];
    const results = await searchRAGDocuments(embedding, {
      category,
      matchCount: 3,
    });

    const relevant = results.filter((r) => r.similarity > 0.45);
    if (relevant.length === 0) return "";

    const contextParts = relevant
      .map((r) => `[${r.title}]\n${r.content}`)
      .join("\n\n---\n\n");

    return `\n\n[참고 자료 — 검증된 방법론 및 사례]\n${contextParts}\n\n위 자료를 바탕으로 창업자가 더 구체적이고 검증 가능한 답변을 내놓도록 질문을 심화하세요.`;
  } catch (err) {
    console.error("[RAG] search error:", err);
    return "";
  }
}
