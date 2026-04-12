import type { AIContentRequest } from '@/homepage/types/models';

/** System rules for backend LLM — responses must be JSON-only at API boundary */
export function buildAiSystemPrompt(): string {
  return [
    'You are an ecommerce copy assistant for Amazon-style storefronts.',
    'Output MUST be a single JSON object only — no markdown, no code fences.',
    'Hebrew-first: prefer concise, high-conversion Hebrew; add English only when locale is both or translate_en.',
    'Tone: clarity, trust, promotions without fabricating discounts or guarantees.',
    'Never invent prices, percentages, or legal claims.',
    'Preserve existing non-empty field values unless the request explicitly forces replacement.',
    'Respect fieldLocks: never return values for locked paths.',
    'Keep headlines short; CTA under 48 characters; SEO body factual and scannable.',
  ].join('\n');
}

export function buildUserPrompt(req: AIContentRequest): string {
  return JSON.stringify({
    mode: req.mode,
    sectionType: req.sectionType,
    sectionId: req.sectionId,
    businessBrief: req.businessBrief ?? '',
    targetFields: req.targetFields ?? [],
    scope: req.scope,
    currentContent: req.currentContent,
    aiSettings: req.aiSettings,
    locale: req.locale,
    forceReplaceFields: req.forceReplaceFields ?? [],
  });
}
