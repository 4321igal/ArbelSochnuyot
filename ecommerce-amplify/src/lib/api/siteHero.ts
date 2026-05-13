import { client } from '../amplify/client';

/** Singleton record id in DynamoDB */
export const SITE_HERO_ID = 'hero-main';

export interface SiteHero {
  id: string;
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  /** S3 key — never treat as a stable public URL */
  imageKey?: string | null;
  /** Free-text phone entered by admin (display format); normalize via toWhatsappDigits */
  whatsappPhone?: string | null;
  updatedAt?: string | null;
}

export interface SiteHeroInput {
  title: string;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  imageKey?: string | null;
  whatsappPhone?: string | null;
}

/** Default WhatsApp number when none is configured */
export const DEFAULT_WHATSAPP_PHONE = '0524448584';

/** Shown when no DB row exists yet */
export const DEFAULT_SITE_HERO: Omit<SiteHero, 'updatedAt'> = {
  id: SITE_HERO_ID,
  title: 'ארבל סוכנויות — הרכב הבא שלך כאן',
  subtitle: 'מאות רכבי יד שנייה ורכבים חדשים, מימון בתנאים מצוינים, ליווי אישי וביטחון מלא.',
  ctaText: 'לקטלוג הרכבים',
  ctaLink: '/inventory',
  imageKey: null,
  whatsappPhone: DEFAULT_WHATSAPP_PHONE,
};

/**
 * Normalize an Israeli phone (e.g. "052-444-8584", "0524448584", "+972524448584")
 * to the digit-only international form wa.me expects: "972524448584".
 * Returns an empty string when the input has no usable digits.
 */
export function toWhatsappDigits(input: string | null | undefined): string {
  if (!input) return '';
  const digits = String(input).replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('972')) return digits;
  if (digits.startsWith('0')) return `972${digits.slice(1)}`;
  return digits;
}

/** Format a phone for display (light-touch: keep what admin typed, fall back to default) */
export function resolveWhatsappPhone(hero: SiteHero | null): string {
  const raw = hero?.whatsappPhone?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_WHATSAPP_PHONE;
}

function mapSiteHero(raw: unknown): SiteHero {
  const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null | undefined;
  if (!row || typeof row !== 'object') {
    throw new Error('Invalid hero response');
  }
  return {
    id: String(row.id ?? SITE_HERO_ID),
    title: (row.title as string) ?? '',
    subtitle: (row.subtitle as string) ?? null,
    ctaText: (row.ctaText as string) ?? null,
    ctaLink: (row.ctaLink as string) ?? null,
    imageKey: (row.imageKey as string) ?? null,
    whatsappPhone: (row.whatsappPhone as string) ?? null,
    updatedAt: (row.updatedAt as string) ?? null,
  };
}

function sanitizeHeroInput(input: SiteHeroInput): SiteHeroInput {
  const title = input.title?.trim() ?? '';
  if (!title || title.length > 200) {
    throw new Error('Title is required (max 200 characters)');
  }
  const subtitle = input.subtitle?.trim() || null;
  if (subtitle && subtitle.length > 500) throw new Error('Subtitle too long (max 500)');
  const ctaText = input.ctaText?.trim() || null;
  if (ctaText && ctaText.length > 80) throw new Error('CTA text too long (max 80)');
  let ctaLink = input.ctaLink?.trim() || '/';
  if (ctaLink.length > 500) throw new Error('CTA link too long');
  if (!ctaLink.startsWith('/') && !/^https?:\/\//i.test(ctaLink)) {
    ctaLink = `/${ctaLink.replace(/^\/+/, '')}`;
  }
  const whatsappRaw = input.whatsappPhone?.trim();
  let whatsappPhone: string | null = null;
  if (whatsappRaw) {
    if (whatsappRaw.length > 32) throw new Error('WhatsApp phone too long (max 32)');
    if (!toWhatsappDigits(whatsappRaw)) throw new Error('מספר WhatsApp לא תקין');
    whatsappPhone = whatsappRaw;
  }
  return {
    title,
    subtitle,
    ctaText,
    ctaLink,
    imageKey: input.imageKey?.trim() || null,
    whatsappPhone,
  };
}

/**
 * GET current hero — equivalent to GET /api/hero
 */
export async function getSiteHero(): Promise<SiteHero | null> {
  const { data, errors } = await client.models.SiteHero.get({ id: SITE_HERO_ID });
  if (errors?.length || !data) return null;
  return mapSiteHero(data);
}

/**
 * Merge defaults for public rendering when row missing or fields empty
 */
export function resolvePublicHero(hero: SiteHero | null): SiteHero {
  const base = hero ?? null;
  return {
    id: SITE_HERO_ID,
    title: base?.title?.trim() || DEFAULT_SITE_HERO.title,
    subtitle: base?.subtitle?.trim() || DEFAULT_SITE_HERO.subtitle,
    ctaText: base?.ctaText?.trim() || DEFAULT_SITE_HERO.ctaText,
    ctaLink: base?.ctaLink?.trim() || DEFAULT_SITE_HERO.ctaLink,
    imageKey: base?.imageKey || null,
    whatsappPhone: base?.whatsappPhone?.trim() || DEFAULT_WHATSAPP_PHONE,
    updatedAt: base?.updatedAt ?? null,
  };
}

/**
 * POST save hero — equivalent to POST /api/hero (Admin only via Cognito group)
 */
export async function saveSiteHero(input: SiteHeroInput): Promise<SiteHero> {
  const safe = sanitizeHeroInput(input);
  const updatedAt = new Date().toISOString();

  const existing = await getSiteHero();

  if (existing) {
    const { data, errors } = await client.models.SiteHero.update({
      id: SITE_HERO_ID,
      title: safe.title,
      subtitle: safe.subtitle ?? undefined,
      ctaText: safe.ctaText ?? undefined,
      ctaLink: safe.ctaLink ?? undefined,
      imageKey: safe.imageKey === null || safe.imageKey === '' ? null : safe.imageKey,
      whatsappPhone: safe.whatsappPhone === null || safe.whatsappPhone === '' ? null : safe.whatsappPhone,
      updatedAt,
    });
    if (errors?.length || !data) {
      throw new Error(errors?.[0]?.message || 'Failed to update hero');
    }
    return mapSiteHero(data);
  }

  const { data, errors } = await client.models.SiteHero.create({
    id: SITE_HERO_ID,
    title: safe.title,
    subtitle: safe.subtitle ?? undefined,
    ctaText: safe.ctaText ?? undefined,
    ctaLink: safe.ctaLink ?? undefined,
    imageKey: safe.imageKey ?? undefined,
    whatsappPhone: safe.whatsappPhone ?? undefined,
    updatedAt,
  });
  if (errors?.length || !data) {
    throw new Error(errors?.[0]?.message || 'Failed to create hero');
  }
  return mapSiteHero(data);
}
