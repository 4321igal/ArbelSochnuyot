import type { ComponentType } from 'react';
import type { HomePageSection, LayoutSettings, SectionKind, HomePageValidationResult } from '@/homepage/types/models';
import type { HomepageRenderContext } from '@/homepage/rendering/context';

export type SectionEditorProps = {
  section: HomePageSection;
  onChange: (next: HomePageSection) => void;
  disabled?: boolean;
};

export type SectionPreviewProps = {
  section: HomePageSection;
  compact?: boolean;
};

export type SectionPublicProps = {
  section: HomePageSection;
  context: HomepageRenderContext;
};

export interface SectionTypeDefinition {
  type: SectionKind;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  defaultContent: Record<string, unknown>;
  aiEnabledFields: string[];
  allowedStylingKeys: (keyof LayoutSettings)[];
  validate: (section: HomePageSection) => HomePageValidationResult;
  Editor: ComponentType<SectionEditorProps>;
  Preview: ComponentType<SectionPreviewProps>;
  Public: ComponentType<SectionPublicProps>;
}
