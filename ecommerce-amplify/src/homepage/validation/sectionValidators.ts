import type { HomePageSection } from '@/homepage/types/models';
import type { HomePageValidationResult } from '@/homepage/types/models';

function push(
  out: HomePageValidationResult,
  message: string,
  sectionId: string,
  severity: 'error' | 'warning',
  path?: string,
) {
  const row = { sectionId, message, path };
  if (severity === 'error') out.errors.push(row);
  else out.warnings.push(row);
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

const MAX_HEADLINE = 120;
const MAX_CTA = 48;
const MAX_SEO_BODY = 8000;

export function emptyResult(): HomePageValidationResult {
  return { ok: true, errors: [], warnings: [] };
}

export function mergeResults(...parts: HomePageValidationResult[]): HomePageValidationResult {
  const errors = parts.flatMap((p) => p.errors);
  const warnings = parts.flatMap((p) => p.warnings);
  return { ok: errors.length === 0, errors, warnings };
}

export function validateHeroSection(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const c = section.content;
  const headline = str(c.headline).trim();
  if (!headline) push(out, 'כותרת ראשית נדרשת', section.id, 'error', 'content.headline');
  if (headline.length > MAX_HEADLINE) push(out, `כותרת ארוכה מדי (מקסימום ${MAX_HEADLINE})`, section.id, 'warning', 'content.headline');
  const cta = str(c.ctaText).trim();
  if (cta.length > MAX_CTA) push(out, `טקסט כפתור ארוך מדי (מקסימום ${MAX_CTA})`, section.id, 'error', 'content.ctaText');
  const href = str(c.ctaHref);
  if (href && !href.startsWith('/') && !/^https?:\/\//i.test(href)) {
    push(out, 'קישור CTA חייב להתחיל ב-/ או http(s)', section.id, 'error', 'content.ctaHref');
  }
  return out;
}

export function validatePromotionalBanner(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const c = section.content;
  if (!str(c.headline).trim()) push(out, 'כותרת נדרשת', section.id, 'error', 'content.headline');
  if (str(c.body).length > 500) push(out, 'גוף ארוך — קצרו לצורך באנר', section.id, 'warning', 'content.body');
  return out;
}

export function validateTextWithCta(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const c = section.content;
  if (!str(c.headline).trim()) push(out, 'כותרת נדרשת', section.id, 'error', 'content.headline');
  if (!str(c.body).trim()) push(out, 'תוכן נדרש', section.id, 'error', 'content.body');
  return out;
}

export function validateSeoBlock(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const body = str(section.content.body);
  if (body.length > MAX_SEO_BODY) push(out, `גוף SEO חורג מ-${MAX_SEO_BODY} תווים`, section.id, 'error', 'content.body');
  if (!body.trim()) push(out, 'בלוק SEO ריק', section.id, 'warning', 'content.body');
  return out;
}

export function validateFaq(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const items = section.content.items;
  if (!Array.isArray(items) || items.length === 0) {
    push(out, 'הוסיפו לפחות שאלה אחת', section.id, 'warning', 'content.items');
  }
  return out;
}

export function validateTestimonials(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  const items = section.content.items;
  if (!Array.isArray(items) || items.length === 0) {
    push(out, 'הוסיפו לפחות המלצה אחת', section.id, 'warning', 'content.items');
  }
  return out;
}

export function validateGenericHeading(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  if (!str(section.content.heading).trim() && !str(section.title).trim()) {
    push(out, 'מומלץ להגדיר כותרת מקטע', section.id, 'warning', 'content.heading');
  }
  return out;
}

export function validateSplitBanner(section: HomePageSection): HomePageValidationResult {
  const out = emptyResult();
  if (!str(section.content.headline).trim()) push(out, 'כותרת נדרשת', section.id, 'error', 'content.headline');
  return out;
}
