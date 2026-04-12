import type { HomePageTemplate, HomePageSection } from '@/homepage/types/models';
import type { HomePageValidationResult } from '@/homepage/types/models';
import { getSectionDefinition } from '@/homepage/registry/sectionRegistry';

export function validateTemplate(template: HomePageTemplate): HomePageValidationResult {
  const errors: HomePageValidationResult['errors'] = [];
  const warnings: HomePageValidationResult['warnings'] = [];

  const ids = new Map<string, number>();
  for (const s of template.sections) {
    ids.set(s.id, (ids.get(s.id) ?? 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) {
      errors.push({ sectionId: id, message: `מזהה כפול: ${id}`, path: 'sections' });
    }
  }

  const enabled = template.sections.filter((s) => s.enabled);
  if (enabled.length === 0) {
    warnings.push({ message: 'אין מקטעים מופעלים — דף הבית יהיה ריק' });
  }

  for (const section of template.sections) {
    const def = getSectionDefinition(section.type);
    const part = def.validate(section);
    errors.push(...part.errors);
    warnings.push(...part.warnings);
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertSectionShape(section: HomePageSection): HomePageSection {
  if (!section.id?.trim()) throw new Error('Section missing id');
  if (section.order < 0) throw new Error('Invalid order');
  return section;
}
