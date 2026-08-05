export interface EmbeddingInput {
  title: string;
  description: string | null;
  brand: string | null;
  category: string | null;
  size: string | null;
}

export interface EmbeddingClient {
  embed(input: EmbeddingInput): Promise<number[]>;
}

export interface SimilarityInput {
  embeddingA: number[];
  embeddingB: number[];
  brandMatch: boolean;
  sizeMatch: boolean;
  categoryMatch: boolean;
}
