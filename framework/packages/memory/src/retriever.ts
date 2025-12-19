import { EmbeddingVector, EmbeddingsProvider } from "./embeddings.js";

export type RetrievalDocument = {
  id: string;
  text: string;
  embedding?: EmbeddingVector;
};

export interface Retriever {
  add(doc: RetrievalDocument): Promise<void>;
  search(query: string, limit?: number): Promise<RetrievalDocument[]>;
}

export class InMemoryRetriever implements Retriever {
  private readonly docs = new Map<string, RetrievalDocument>();

  constructor(private readonly embeddings: EmbeddingsProvider) {}

  async add(doc: RetrievalDocument): Promise<void> {
    const embedding = doc.embedding ?? (await this.embeddings.embed(doc.text));
    this.docs.set(doc.id, { ...doc, embedding });
  }

  async search(query: string, limit = 5): Promise<RetrievalDocument[]> {
    const queryEmbedding = await this.embeddings.embed(query);
    const scored = Array.from(this.docs.values()).map((doc) => ({
      doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding ?? [])
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.doc);
  }
}

function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  const minLength = Math.min(a.length, b.length);
  const dot = a.slice(0, minLength).reduce((sum, value, idx) => sum + value * b[idx], 0);
  const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}
