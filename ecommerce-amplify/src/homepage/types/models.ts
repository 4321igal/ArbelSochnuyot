/**
 * Core homepage template models — store-agnostic, JSON-serializable.
 */

export type SectionKind =
  | 'hero'
  | 'categories_grid'
  | 'products_carousel'
  | 'promotional_banner'
  | 'featured_products'
  | 'split_banner'
  | 'text_with_cta'
  | 'brand_strip'
  | 'testimonials'
  | 'faq'
  | 'seo_text_block';

export type HomePageStatus = 'draft' | 'published';

export interface ThemeSettings {
  primaryColor?: string;
  accentColor?: string;
  fontHeading?: string;
  fontBody?: string;
  density?: 'comfortable' | 'compact';
}

export interface LayoutSettings {
  containerMaxWidth?: 'full' | '7xl' | '5xl';
  sectionPaddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface FieldLocks {
  [fieldPath: string]: boolean | undefined;
}

export interface AISectionSettings {
  tone?: 'professional' | 'friendly' | 'urgent' | 'luxury' | 'neutral';
  storeType?: string;
  primaryLocale?: 'he' | 'en' | 'both';
  /** When true, AI must not overwrite this field */
  fieldLocks?: FieldLocks;
  /** When false for a field, preserve existing non-empty unless user forces replace */
  fieldOverrideAllow?: Record<string, boolean | undefined>;
}

export interface ValidationRule {
  id: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface HomePageSectionBase {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
  aiSettings: AISectionSettings;
  styling: LayoutSettings;
  validationRules?: ValidationRule[];
}

export type HomePageSection = HomePageSectionBase & {
  type: SectionKind;
};

export interface TemplateVersionSnapshot {
  version: number;
  savedAt: string;
  savedBy?: string;
  label?: string;
  template: HomePageTemplate;
}

export interface TemplateMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  version: number;
  status: HomePageStatus;
  publishedAt?: string;
  history?: TemplateVersionSnapshot[];
}

export interface HomePageTemplate {
  id: string;
  name: string;
  /** Optional multi-tenant key for marketplace installs */
  storeId?: string;
  sections: HomePageSection[];
  themeSettings: ThemeSettings;
  status: HomePageStatus;
  metadata: TemplateMetadata;
}

/** --- AI API contracts (backend returns JSON only) --- */

export type AIMode =
  | 'generate_from_brief'
  | 'rewrite'
  | 'seo_headline'
  | 'cta'
  | 'promotional'
  | 'tone_adapt'
  | 'translate_he'
  | 'translate_en';

export interface AIContentRequest {
  mode: AIMode;
  sectionId: string;
  sectionType: SectionKind;
  businessBrief?: string;
  targetFields?: string[];
  scope: 'section' | 'field';
  currentContent: Record<string, unknown>;
  aiSettings: AISectionSettings;
  locale: 'he' | 'en' | 'both';
  /** Force replace non-empty for listed fields */
  forceReplaceFields?: string[];
}

export interface AIContentResponse {
  contentPatch: Record<string, unknown>;
  warnings?: string[];
}

export interface HomePageValidationResult {
  ok: boolean;
  errors: { sectionId?: string; message: string; path?: string }[];
  warnings: { sectionId?: string; message: string; path?: string }[];
}
