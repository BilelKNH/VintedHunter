import OpenAI from 'openai';
import type { EmbeddingClient, EmbeddingInput } from './types.js';

// Same reasoning as ai-engine's vision-client.ts: this call sits on the hot path of every
// crawl (apps/worker's analyze-listing job), whose try/catch only bounds *job failure*, not
// wall-clock time. A short timeout + single retry makes "embedding is best-effort" fail fast
// instead of tying up a concurrent job slot for minutes on a degraded OpenAI endpoint.
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 1;

// text-embedding-3-small's native output length — packages/database's Listing.embedding column
// is declared vector(1536) to match. If EMBEDDING_MODEL is ever changed to a model with a
// different native dimension, this constant and the migration both need updating together.
const EXPECTED_DIMENSIONS = 1536;

export interface EmbeddingClientConfig {
  apiKey: string;
  model: string;
}

function buildEmbeddingInputText(input: EmbeddingInput): string {
  return [input.title, input.brand, input.category, input.size, input.description]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' | ');
}

// Thin wrapper around the OpenAI SDK — intentionally untested beyond what's covered by
// similarity.test.ts, same reasoning as ai-engine's vision-client.ts. Consumers depend on the
// EmbeddingClient interface and inject a fake in tests.
export function createEmbeddingClient({ apiKey, model }: EmbeddingClientConfig): EmbeddingClient {
  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });

  return {
    async embed(input: EmbeddingInput): Promise<number[]> {
      const response = await client.embeddings.create({
        model,
        input: buildEmbeddingInputText(input),
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length !== EXPECTED_DIMENSIONS) {
        throw new Error(
          `Embedding response had unexpected shape (length ${embedding?.length ?? 'none'}, expected ${EXPECTED_DIMENSIONS})`,
        );
      }

      return embedding;
    },
  };
}
