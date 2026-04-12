import type { HomePageTemplate, HomePageSection, HomePageStatus, ThemeSettings } from '@/homepage/types/models';
import { getSectionDefinition } from '@/homepage/registry/sectionRegistry';

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export class HomePageTemplateBuilder {
  private template: HomePageTemplate;

  constructor(base: HomePageTemplate) {
    this.template = clone(base);
  }

  setName(name: string): this {
    this.template.name = name;
    return this;
  }

  setTheme(theme: ThemeSettings): this {
    this.template.themeSettings = { ...this.template.themeSettings, ...theme };
    return this;
  }

  setStatus(status: HomePageStatus): this {
    this.template.status = status;
    this.template.metadata.status = status;
    return this;
  }

  setSections(sections: HomePageSection[]): this {
    this.template.sections = sections.map((s, i) => ({ ...s, order: i }));
    return this;
  }

  bumpVersion(): this {
    this.template.metadata.version += 1;
    this.template.metadata.updatedAt = new Date().toISOString();
    return this;
  }

  build(): HomePageTemplate {
    return clone(this.template);
  }
}

export function createEmptySection(type: HomePageSection['type'], order: number, id: string): HomePageSection {
  const def = getSectionDefinition(type);
  return {
    id,
    type,
    title: def.label,
    enabled: true,
    order,
    config: { ...def.defaultConfig },
    content: { ...def.defaultContent },
    aiSettings: {
      tone: 'professional',
      primaryLocale: 'he',
      fieldLocks: {},
      fieldOverrideAllow: {},
    },
    styling: {
      containerMaxWidth: '7xl',
      sectionPaddingY: 'md',
    },
  };
}
