import { RunMeshOpenAI } from "@runmesh/core";

export type EmbeddingVector = number[];

export interface EmbeddingsProvider {
  embed(text: string): Promise<EmbeddingVector>;
}

export class OpenAIEmbeddings implements EmbeddingsProvider {
  constructor(
    private readonly client: RunMeshOpenAI,
    private readonly model = "text-embedding-3-small"
  ) {}

  async embed(text: string): Promise<EmbeddingVector> {
    const response = await this.client.client.embeddings.create({
      model: this.model,
      input: text
    });
    return response.data[0]?.embedding ?? [];
  }
}
