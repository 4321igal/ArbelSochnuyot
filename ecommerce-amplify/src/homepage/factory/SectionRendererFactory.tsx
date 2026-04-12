import type { HomePageSection } from '@/homepage/types/models';
import { getSectionDefinition } from '@/homepage/registry/sectionRegistry';
import type { HomepageRenderContext } from '@/homepage/rendering/context';

/**
 * Factory: resolves the React component for a section type from the registry.
 * Use with HomePageRenderer for ordered, filtered rendering.
 */
export function createPublicSectionElement(section: HomePageSection, context: HomepageRenderContext) {
  if (!section.enabled) return null;
  try {
    const { Public } = getSectionDefinition(section.type);
    return <Public key={section.id} section={section} context={context} />;
  } catch {
    return (
      <div key={section.id} className="bg-amber-50 text-amber-900 text-sm p-4 text-center">
        מקטע לא נתמך ({section.type})
      </div>
    );
  }
}
