import type { AIContentRequest, AIContentResponse, AIMode } from '@/homepage/types/models';
import { createMockAiStrategies, applyContentPatch } from '@/homepage/ai/strategies';
import { buildAiSystemPrompt, buildUserPrompt } from '@/homepage/ai/prompts';

const strategies = createMockAiStrategies();

/**
 * Facade over strategy map. Real deployment: validate JSON from model, log prompts (buildAiSystemPrompt/buildUserPrompt).
 */
export async function runAiContentGeneration(req: AIContentRequest): Promise<AIContentResponse> {
  const run = strategies[req.mode];
  if (!run) {
    return { contentPatch: {}, warnings: [`Unsupported mode: ${req.mode}`] };
  }
  void buildAiSystemPrompt;
  void buildUserPrompt(req);
  return run(req);
}

export async function mergeAiPatchIntoSectionContent(
  current: Record<string, unknown>,
  response: AIContentResponse,
  locks: Record<string, boolean | undefined> | undefined,
  forceReplaceFields: string[] | undefined,
): Promise<Record<string, unknown>> {
  const force = new Set(forceReplaceFields ?? []);
  return applyContentPatch(current, response.contentPatch, locks, force);
}

export function listAiModes(): AIMode[] {
  return [
    'generate_from_brief',
    'rewrite',
    'seo_headline',
    'cta',
    'promotional',
    'tone_adapt',
    'translate_he',
    'translate_en',
  ];
}
