import Anthropic from '@anthropic-ai/sdk';
import { buildVisionUserContent, VISION_SYSTEM_PROMPT } from './prompt.js';
import {
  VISION_ANALYSIS_TOOL_NAME,
  visionAnalysisInputSchema,
  visionAnalysisResultSchema,
} from './response-schema.js';
import type { VisionAnalysisInput, VisionAnalysisResult, VisionAnalyzer } from './types.js';

const MAX_TOKENS = 1536;

// The SDK's default is a 10-minute timeout with 2 retries — fine for a user-facing chat request,
// but this call sits on the hot path of every crawl (apps/worker's analyze-listing job, whose
// try/catch only bounds *job failure*, not wall-clock time). A degraded-but-not-erroring
// Anthropic endpoint could otherwise tie up several of the worker's concurrent job slots for
// tens of minutes each. A short timeout + single retry makes "vision is best-effort" actually
// fail fast instead of just failing safely.
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;

export interface VisionClientConfig {
  apiKey: string;
  model: string;
}

// Thin wrapper around the Anthropic SDK — intentionally untested (no logic of its own to unit
// test beyond what's already covered by prompt.ts/response-schema.ts's pure tests), same
// reasoning as apps/worker's fetch-http-sender.ts and browser/playwright-session.ts. Consumers
// depend on the VisionAnalyzer interface and inject a fake in tests.
export function createVisionAnalyzer({ apiKey, model }: VisionClientConfig): VisionAnalyzer {
  const client = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS, maxRetries: MAX_RETRIES });

  return {
    async analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system: VISION_SYSTEM_PROMPT,
        tools: [
          {
            name: VISION_ANALYSIS_TOOL_NAME,
            description: 'Rapporte le résultat structuré de l\'inspection des photos de l\'annonce.',
            input_schema: visionAnalysisInputSchema,
          },
        ],
        tool_choice: { type: 'tool', name: VISION_ANALYSIS_TOOL_NAME },
        messages: [{ role: 'user', content: buildVisionUserContent(input) }],
      });

      const toolUse = response.content.find(
        (block): block is Anthropic.ToolUseBlock =>
          block.type === 'tool_use' && block.name === VISION_ANALYSIS_TOOL_NAME,
      );
      if (!toolUse) {
        throw new Error('Vision analysis did not return a structured result');
      }

      return visionAnalysisResultSchema.parse(toolUse.input);
    },
  };
}
