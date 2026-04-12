import type { SectionKind } from '@/homepage/types/models';

/** Default config + content seeds per section type — registry merges these with store overrides */
export const SECTION_DEFAULTS: Record<
  SectionKind,
  { config: Record<string, unknown>; content: Record<string, unknown> }
> = {
  hero: {
    config: { overlayStrength: 0.65, imagePosition: 'center' },
    content: {
      headline: 'מבצעים חדשים כל שבוע',
      headlineEn: 'Fresh deals every week',
      subheadline: 'משלוח מהיר, החזרות קלות, מבחר מוביל',
      subheadlineEn: 'Fast delivery, easy returns, curated selection',
      ctaText: 'קנה עכשיו',
      ctaTextEn: 'Shop now',
      ctaHref: '/category/all',
      imageKey: null,
    },
  },
  categories_grid: {
    config: { columns: 4, maxItems: 8, showTitle: true },
    content: { heading: 'קנו לפי קטגוריה', headingEn: 'Shop by category' },
  },
  products_carousel: {
    config: { maxItems: 12, autoplay: false },
    content: { heading: 'נבחרים בשבילך', headingEn: 'Picked for you', source: 'featured' },
  },
  promotional_banner: {
    config: { variant: 'full_bleed' },
    content: {
      headline: 'מבצע לזמן מוגבל',
      headlineEn: 'Limited-time offer',
      body: 'הוסיפו פריטים לעגלה וקבלו משלוח מהיר.',
      bodyEn: 'Add items to your cart and enjoy fast shipping.',
      ctaText: 'למבצעים',
      ctaTextEn: 'See deals',
      ctaHref: '/search',
      imageKey: null,
    },
  },
  featured_products: {
    config: { columns: 4, maxItems: 8 },
    content: { heading: 'מוצרים מומלצים', headingEn: 'Featured products', source: 'featured' },
  },
  split_banner: {
    config: { imageSide: 'left' },
    content: {
      headline: 'שדרגו את העסק שלכם',
      headlineEn: 'Upgrade your business',
      body: 'ציוד איכותי במחירים תחרותיים.',
      bodyEn: 'Quality supplies at competitive prices.',
      ctaText: 'גלו עוד',
      ctaTextEn: 'Learn more',
      ctaHref: '/category/all',
      imageKey: null,
    },
  },
  text_with_cta: {
    config: {},
    content: {
      headline: 'למה לקנות אצלנו',
      headlineEn: 'Why shop with us',
      body: 'שקיפות, אמינות ושירות לקוחות.',
      bodyEn: 'Transparency, trust, and customer care.',
      ctaText: 'צור קשר',
      ctaTextEn: 'Contact us',
      ctaHref: '/account',
    },
  },
  brand_strip: {
    config: { grayscale: true },
    content: {
      heading: 'מותגים מובילים',
      headingEn: 'Trusted brands',
      logos: [] as { label: string; imageKey?: string | null }[],
    },
  },
  testimonials: {
    config: { layout: 'cards' },
    content: {
      heading: 'מה הלקוחות אומרים',
      headingEn: 'What customers say',
      items: [
        { quote: 'שירות מצוין ומשלוח מהיר.', quoteEn: 'Great service and fast shipping.', author: 'דני', role: 'רכש' },
      ],
    },
  },
  faq: {
    config: { defaultOpenIndex: null as number | null },
    content: {
      heading: 'שאלות נפוצות',
      headingEn: 'FAQ',
      items: [
        { q: 'מה זמני האספקה?', qEn: 'What are delivery times?', a: 'בדרך כלל 2–5 ימי עסקים.', aEn: 'Typically 2–5 business days.' },
      ],
    },
  },
  seo_text_block: {
    config: { collapsible: true },
    content: {
      title: 'מידע נוסף',
      titleEn: 'More information',
      body: 'תוכן SEO תמציתי — התאימו לחנות שלכם.',
      bodyEn: 'Concise SEO copy — customize for your store.',
    },
  },
};
