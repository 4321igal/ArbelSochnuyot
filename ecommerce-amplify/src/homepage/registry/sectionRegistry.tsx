import type { SectionKind } from '@/homepage/types/models';
import type { SectionTypeDefinition, SectionPreviewProps } from '@/homepage/registry/types';
import { SECTION_DEFAULTS } from '@/homepage/registry/sectionDefaults';
import {
  validateHeroSection,
  validatePromotionalBanner,
  validateTextWithCta,
  validateSeoBlock,
  validateFaq,
  validateTestimonials,
  validateGenericHeading,
  validateSplitBanner,
} from '@/homepage/validation/sectionValidators';
import {
  PublicHero,
  PublicCategoriesGrid,
  PublicProductsCarousel,
  PublicFeaturedProducts,
  PublicPromotionalBanner,
  PublicSplitBanner,
  PublicTextWithCta,
  PublicBrandStrip,
  PublicTestimonials,
  PublicFaq,
  PublicSeoTextBlock,
} from '@/homepage/sections/public/PublicSections';
import {
  HeroEditor,
  CategoriesGridEditor,
  ProductsCarouselEditor,
  FeaturedProductsEditor,
  PromotionalBannerEditor,
  SplitBannerEditor,
  TextWithCtaEditor,
  BrandStripEditor,
  TestimonialsEditor,
  FaqEditor,
  SeoEditor,
} from '@/homepage/sections/admin/SectionEditors';
import type { HomepageRenderContext } from '@/homepage/rendering/context';

const PREVIEW_CTX: HomepageRenderContext = { categories: [], featuredProducts: [], isLoading: false };

function PreviewShell({
  Public,
  section,
  compact,
}: {
  Public: SectionTypeDefinition['Public'];
  section: SectionPreviewProps['section'];
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'origin-top scale-[0.82] max-h-[min(70vh,520px)] overflow-auto rounded border border-gray-200 bg-white shadow-inner'
          : ''
      }
    >
      <Public section={section} context={PREVIEW_CTX} />
    </div>
  );
}

function makePreview(Public: SectionTypeDefinition['Public']) {
  return function SectionPreview({ section, compact }: SectionPreviewProps) {
    return <PreviewShell Public={Public} section={section} compact={compact} />;
  };
}

const ALL_STYLES: SectionTypeDefinition['allowedStylingKeys'] = [
  'containerMaxWidth',
  'sectionPaddingY',
  'backgroundColor',
  'textAlign',
];

function def(
  type: SectionKind,
  partial: Omit<SectionTypeDefinition, 'type' | 'defaultConfig' | 'defaultContent' | 'Editor' | 'Preview' | 'Public'> & {
    Editor: SectionTypeDefinition['Editor'];
    Public: SectionTypeDefinition['Public'];
  },
): SectionTypeDefinition {
  const defaults = SECTION_DEFAULTS[type];
  return {
    type,
    defaultConfig: defaults.config,
    defaultContent: defaults.content,
    Preview: makePreview(partial.Public),
    ...partial,
  };
}

const REGISTRY: Record<SectionKind, SectionTypeDefinition> = {
  hero: def('hero', {
    label: 'Hero',
    description: 'כותרת ראשית, תת-כותרת ו-CTA',
    aiEnabledFields: ['headline', 'subheadline', 'ctaText', 'headlineEn', 'subheadlineEn', 'ctaTextEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateHeroSection,
    Editor: HeroEditor,
    Public: PublicHero,
  }),
  categories_grid: def('categories_grid', {
    label: 'רשת קטגוריות',
    description: 'מציג קטגוריות מהקטלוג',
    aiEnabledFields: ['heading', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateGenericHeading,
    Editor: CategoriesGridEditor,
    Public: PublicCategoriesGrid,
  }),
  products_carousel: def('products_carousel', {
    label: 'קרוסלת מוצרים',
    description: 'מוצרים מומלצים בשורה',
    aiEnabledFields: ['heading', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateGenericHeading,
    Editor: ProductsCarouselEditor,
    Public: PublicProductsCarousel,
  }),
  promotional_banner: def('promotional_banner', {
    label: 'באנר קידום',
    description: 'הודעת קידום עם CTA',
    aiEnabledFields: ['headline', 'body', 'ctaText', 'headlineEn', 'bodyEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validatePromotionalBanner,
    Editor: PromotionalBannerEditor,
    Public: PublicPromotionalBanner,
  }),
  featured_products: def('featured_products', {
    label: 'מוצרים מומלצים',
    description: 'רשת מוצרים',
    aiEnabledFields: ['heading', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateGenericHeading,
    Editor: FeaturedProductsEditor,
    Public: PublicFeaturedProducts,
  }),
  split_banner: def('split_banner', {
    label: 'באנר מפוצל',
    description: 'תמונה וטקסט זה לצד זה',
    aiEnabledFields: ['headline', 'body', 'ctaText', 'headlineEn', 'bodyEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateSplitBanner,
    Editor: SplitBannerEditor,
    Public: PublicSplitBanner,
  }),
  text_with_cta: def('text_with_cta', {
    label: 'טקסט עם CTA',
    description: 'בלוק טקסט וכפתור',
    aiEnabledFields: ['headline', 'body', 'ctaText', 'headlineEn', 'bodyEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateTextWithCta,
    Editor: TextWithCtaEditor,
    Public: PublicTextWithCta,
  }),
  brand_strip: def('brand_strip', {
    label: 'פס מותגים',
    description: 'לוגואים',
    aiEnabledFields: ['heading', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateGenericHeading,
    Editor: BrandStripEditor,
    Public: PublicBrandStrip,
  }),
  testimonials: def('testimonials', {
    label: 'המלצות',
    description: 'ציטוטי לקוחות',
    aiEnabledFields: ['heading', 'items', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateTestimonials,
    Editor: TestimonialsEditor,
    Public: PublicTestimonials,
  }),
  faq: def('faq', {
    label: 'שאלות נפוצות',
    description: 'FAQ',
    aiEnabledFields: ['heading', 'items', 'headingEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateFaq,
    Editor: FaqEditor,
    Public: PublicFaq,
  }),
  seo_text_block: def('seo_text_block', {
    label: 'בלוק SEO',
    description: 'טקסט ארוך לקידום',
    aiEnabledFields: ['title', 'body', 'titleEn', 'bodyEn'],
    allowedStylingKeys: ALL_STYLES,
    validate: validateSeoBlock,
    Editor: SeoEditor,
    Public: PublicSeoTextBlock,
  }),
};

export function getSectionDefinition(type: SectionKind): SectionTypeDefinition {
  const d = REGISTRY[type];
  if (!d) throw new Error(`Unknown section type: ${type}`);
  return d;
}

export function listSectionDefinitions(): SectionTypeDefinition[] {
  return Object.values(REGISTRY);
}

export function isSectionKind(s: string): s is SectionKind {
  return s in REGISTRY;
}
