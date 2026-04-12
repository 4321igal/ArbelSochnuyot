import { useState, useEffect } from 'react';
import { HomePageRenderer } from '@/homepage/rendering/HomePageRenderer';
import type { HomePageTemplate } from '@/homepage/types/models';
import { getHomepage } from '@/lib/api/homepageApi';
import { listFeaturedProducts, listTopLevelCategories, type Product, type Category } from '@/lib/api/products';
import exampleRaw from '@/data/exampleHomepageTemplate.json';

const fallbackTemplate = exampleRaw as HomePageTemplate;

/**
 * Storefront home — renders JSON-driven sections when available (mock CMS).
 */
export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [template, setTemplate] = useState<HomePageTemplate>(fallbackTemplate);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [products, cats, tpl] = await Promise.all([
          listFeaturedProducts(16),
          listTopLevelCategories(24),
          getHomepage().catch(() => null),
        ]);
        if (cancelled) return;
        setFeaturedProducts(products);
        setCategories(cats);
        if (tpl) setTemplate(tpl);
      } catch (e) {
        console.error('Failed to load home data:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const context = {
    categories,
    featuredProducts,
    isLoading,
  };

  return (
    <div>
      <HomePageRenderer template={template} context={context} />
    </div>
  );
}
