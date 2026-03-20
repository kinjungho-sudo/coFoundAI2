const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
export const EMBEDDING_MODEL = "text-embedding-3-small";

export async function createEmbedding(text: string): Promise<number[]> {
  const resp = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI Embeddings ${resp.status}: ${err}`);
  }

  const json = (await resp.json()) as { data: Array<{ embedding: number[] }> };
  return json.data[0].embedding;
}

export function chunkText(text: string, maxChars = 1500): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim().length > 50) chunks.push(current.trim());

  return chunks;
}

export interface RagDocumentInput {
  source_id: string;
  category: "gov_official" | "methodology" | "case_study";
  title: string;
  content: string;
  content_summary?: string;
  metadata?: Record<string, unknown>;
}
