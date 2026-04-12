import type { HomePageTemplate } from '@/homepage/types/models';
import type { HomepageRenderContext } from '@/homepage/rendering/context';
import { createPublicSectionElement } from '@/homepage/factory/SectionRendererFactory';

interface HomePageRendererProps {
  template: HomePageTemplate | null | undefined;
  context: HomepageRenderContext;
}

/**
 * Renders a full homepage from JSON: enabled sections only, sorted by `order`.
 */
export function HomePageRenderer({ template, context }: HomePageRendererProps) {
  if (!template?.sections?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">
        אין תוכן לדף הבית. הגדירו מקטעים בממשק הניהול.
      </div>
    );
  }

  const sorted = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="homepage-dynamic" data-template-id={template.id}>
      {sorted.map((section) => createPublicSectionElement(section, context))}
    </div>
  );
}
