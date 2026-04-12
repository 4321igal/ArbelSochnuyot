import type { AIMode, AIContentRequest, AIContentResponse } from '@/homepage/types/models';

/** Strategy pattern: one handler per AI mode — swap implementations (mock, Bedrock, HTTP) without changing callers */
export type AIContentStrategy = (req: AIContentRequest) => Promise<AIContentResponse>;

export function applyContentPatch(
  current: Record<string, unknown>,
  patch: Record<string, unknown>,
  locks: Record<string, boolean | undefined> | undefined,
  forceReplace: Set<string>,
): Record<string, unknown> {
  const next = { ...current };
  for (const [key, val] of Object.entries(patch)) {
    if (locks?.[key]) continue;
    const existing = next[key];
    const allowReplace = forceReplace.has(key);
    if (existing !== undefined && existing !== null && String(existing).trim() !== '' && !allowReplace) {
      continue;
    }
    next[key] = val;
  }
  return next;
}

/** Deterministic mock generation for demos — replace with real LLM + JSON parse */
export function createMockAiStrategies(): Record<AIMode, AIContentStrategy> {
  return {
    generate_from_brief: async (req) => mockFromBrief(req),
    rewrite: async (req) => mockRewrite(req),
    seo_headline: async (req) => mockPatch(req, ['headline'], (b) => `מבצע: ${String(b).slice(0, 40)}`),
    cta: async (req) => mockPatch(req, ['ctaText'], () => 'קנה עכשיו'),
    promotional: async (req) => mockPromotional(req),
    tone_adapt: async (req) => mockRewrite(req),
    translate_he: async (req) => mockTranslate(req, 'he'),
    translate_en: async (req) => mockTranslate(req, 'en'),
  };
}

async function mockFromBrief(req: AIContentRequest): Promise<AIContentResponse> {
  const brief = req.businessBrief?.trim() || 'חנות אונליין אמינה';
  const patch: Record<string, unknown> = {
    headline: `${brief.split(' ').slice(0, 4).join(' ')} — משלוח מהיר`,
    subheadline: 'מבחר איכותי, החזרות קלות, תשלום מאובטח.',
    ctaText: 'גלו את המבצעים',
  };
  return { contentPatch: patch, warnings: ['Mock AI — החלף בשירות אמיתי בפרודקשן'] };
}

async function mockRewrite(req: AIContentRequest): Promise<AIContentResponse> {
  const h = String(req.currentContent.headline ?? 'מוצרים לעסק שלך');
  return {
    contentPatch: {
      headline: `${h} (ניסוח מחדש)`,
    },
    warnings: undefined,
  };
}

async function mockPatch(
  req: AIContentRequest,
  keys: string[],
  gen: (brief: string) => string,
): Promise<AIContentResponse> {
  const brief = req.businessBrief ?? String(req.currentContent.headline ?? '');
  const patch: Record<string, unknown> = {};
  for (const k of keys) {
    patch[k] = gen(brief);
  }
  return { contentPatch: patch };
}

async function mockPromotional(_req: AIContentRequest): Promise<AIContentResponse> {
  return {
    contentPatch: {
      headline: 'מבצע לזמן מוגבל',
      body: 'הוסיפו לעגלה — משלוח מהיר לכל הארץ. ללא הבטחות מחיר שלא אומתו.',
      ctaText: 'למבצעים',
    },
  };
}

async function mockTranslate(req: AIContentRequest, target: 'he' | 'en'): Promise<AIContentResponse> {
  const patch: Record<string, unknown> = {};
  if (target === 'en') {
    if (req.currentContent.headline) patch.headlineEn = `EN: ${String(req.currentContent.headline)}`;
    if (req.currentContent.subheadline) patch.subheadlineEn = `EN: ${String(req.currentContent.subheadline)}`;
  } else {
    if (req.currentContent.headlineEn) patch.headline = `HE: ${String(req.currentContent.headlineEn)}`;
  }
  return { contentPatch: patch };
}

