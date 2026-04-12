import { Link } from 'react-router-dom';
import { useStorageImageUrl } from '@/hooks/useStorageImageUrl';
import { StorageImage } from '@/components/StorageImage';
import { ProductGrid } from '@/components/product/ProductGrid';
import type { SectionPublicProps } from '@/homepage/registry/types';

function padYClass(y: string | undefined) {
  switch (y) {
    case 'none':
      return 'py-0';
    case 'sm':
      return 'py-6';
    case 'lg':
      return 'py-16';
    case 'xl':
      return 'py-24';
    default:
      return 'py-12';
  }
}

function maxWClass(w: string | undefined) {
  switch (w) {
    case 'full':
      return 'max-w-full';
    case '5xl':
      return 'max-w-5xl';
    default:
      return 'max-w-7xl';
  }
}

function HeroBg({ imageKey }: { imageKey: string | null | undefined }) {
  const { url, loading } = useStorageImageUrl(imageKey);
  if (!imageKey) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" aria-hidden />
      </>
    );
  }
  return (
    <>
      {!loading && url ? (
        <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" width={1920} height={1080} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 animate-pulse" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent" aria-hidden />
    </>
  );
}

export function PublicHero({ section, context: _ctx }: SectionPublicProps) {
  if (section.type !== 'hero') return null;
  const c = section.content;
  const headline = String(c.headline ?? '');
  const sub = String(c.subheadline ?? '');
  const cta = String(c.ctaHref ?? '/').trim() || '/';
  const ctaText = String(c.ctaText ?? 'Shop');
  const isExternal = /^https?:\/\//i.test(cta);
  const imageKey = (c.imageKey as string | null) ?? null;

  return (
    <section
      className={`relative min-h-[280px] md:min-h-[380px] flex items-center text-white overflow-hidden ${padYClass(section.styling.sectionPaddingY)}`}
      style={{ backgroundColor: section.styling.backgroundColor }}
    >
      <HeroBg imageKey={imageKey} />
      <div
        className={`relative z-10 ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8 w-full`}
        style={{ textAlign: section.styling.textAlign ?? 'left' }}
      >
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg">{headline || section.title}</h1>
          {sub ? <p className="text-lg md:text-xl text-indigo-100/95 mb-6 drop-shadow-md">{sub}</p> : null}
          {isExternal ? (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 shadow-lg"
            >
              {ctaText}
            </a>
          ) : (
            <Link to={cta} className="inline-block bg-white text-indigo-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 shadow-lg">
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function PublicCategoriesGrid({ section, context }: SectionPublicProps) {
  if (section.type !== 'categories_grid') return null;
  const cols = Number(section.config.columns ?? 4);
  const maxItems = Number(section.config.maxItems ?? 8);
  const heading = String(section.content.heading ?? section.title);
  const gridClass =
    cols >= 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 md:grid-cols-4';

  const cats = context.categories.slice(0, maxItems);

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      {section.config.showTitle !== false ? (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>
      ) : null}
      {context.isLoading ? (
        <div className={`grid ${gridClass} gap-4`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : cats.length === 0 ? (
        <p className="text-gray-500">אין קטגוריות להצגה.</p>
      ) : (
        <div className={`grid ${gridClass} gap-4`}>
          {cats.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {category.imageUrl ? (
                <StorageImage
                  keyOrUrl={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                  <span className="text-4xl text-white font-bold">{category.name[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 text-white">
                <h3 className="font-bold">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function PublicProductsCarousel({ section, context }: SectionPublicProps) {
  if (section.type !== 'products_carousel') return null;
  const heading = String(section.content.heading ?? section.title);
  const maxItems = Number(section.config.maxItems ?? 12);
  const products = context.featuredProducts.slice(0, maxItems);

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{heading}</h2>
      <ProductGrid products={products} isLoading={context.isLoading} emptyMessage="אין מוצרים להצגה" />
    </section>
  );
}

export function PublicFeaturedProducts({ section, context }: SectionPublicProps) {
  if (section.type !== 'featured_products') return null;
  const heading = String(section.content.heading ?? section.title);
  const maxItems = Number(section.config.maxItems ?? 8);
  const products = context.featuredProducts.slice(0, maxItems);

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{heading}</h2>
        <Link to="/category/featured" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
          הכל ←
        </Link>
      </div>
      <ProductGrid products={products} isLoading={context.isLoading} emptyMessage="אין מוצרים מומלצים" />
    </section>
  );
}

export function PublicPromotionalBanner({ section }: SectionPublicProps) {
  const c = section.type === 'promotional_banner' ? section.content : {};
  const imageKey =
    section.type === 'promotional_banner' ? ((c.imageKey as string | null) ?? null) : null;
  const { url, loading } = useStorageImageUrl(imageKey);
  if (section.type !== 'promotional_banner') return null;

  return (
    <section
      className={`relative ${padYClass(section.styling.sectionPaddingY)} overflow-hidden bg-gray-900 text-white`}
      style={{ backgroundColor: section.styling.backgroundColor ?? undefined }}
    >
      {imageKey && (
        <div className="absolute inset-0">
          {!loading && url ? (
            <img src={url} alt="" className="w-full h-full object-cover opacity-40" />
          ) : (
            <div className="w-full h-full bg-gray-800 animate-pulse" />
          )}
        </div>
      )}
      <div className={`relative ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-6`}>
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{String(c.headline ?? '')}</h2>
          <p className="text-gray-200 text-sm md:text-base">{String(c.body ?? '')}</p>
        </div>
        <Link
          to={String(c.ctaHref ?? '/search')}
          className="shrink-0 bg-amber-500 text-gray-900 font-bold px-6 py-3 rounded-lg hover:bg-amber-400"
        >
          {String(c.ctaText ?? 'למבצעים')}
        </Link>
      </div>
    </section>
  );
}

export function PublicSplitBanner({ section }: SectionPublicProps) {
  const c = section.type === 'split_banner' ? section.content : {};
  const imageKey = section.type === 'split_banner' ? ((c.imageKey as string | null) ?? null) : null;
  const { url, loading } = useStorageImageUrl(imageKey);
  if (section.type !== 'split_banner') return null;
  const imageSide = String(section.config.imageSide ?? 'left');

  const imageBlock = (
    <div className="flex-1 min-h-[200px] bg-gray-200 rounded-lg overflow-hidden">
      {imageKey && !loading && url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white/50 text-sm">
          תמונה
        </div>
      )}
    </div>
  );

  const textBlock = (
    <div className="flex-1">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{String(c.headline ?? '')}</h2>
      <p className="text-gray-600 mb-4">{String(c.body ?? '')}</p>
      <Link to={String(c.ctaHref ?? '/')} className="text-indigo-600 font-semibold hover:underline">
        {String(c.ctaText ?? '')} →
      </Link>
    </div>
  );

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <div className={`flex flex-col md:flex-row gap-8 items-center ${imageSide === 'right' ? 'md:flex-row-reverse' : ''}`}>
        {imageBlock}
        {textBlock}
      </div>
    </section>
  );
}

export function PublicTextWithCta({ section }: SectionPublicProps) {
  if (section.type !== 'text_with_cta') return null;
  const c = section.content;
  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{String(c.headline ?? '')}</h2>
      <p className="text-gray-600 mb-4 max-w-3xl">{String(c.body ?? '')}</p>
      <Link to={String(c.ctaHref ?? '/')} className="inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">
        {String(c.ctaText ?? '')}
      </Link>
    </section>
  );
}

export function PublicBrandStrip({ section }: SectionPublicProps) {
  if (section.type !== 'brand_strip') return null;
  const c = section.content;
  const logos = (Array.isArray(c.logos) ? c.logos : []) as { label: string; imageKey?: string | null }[];
  const heading = String(c.heading ?? '');

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} border-y border-gray-200 bg-gray-50`}>
      <div className={`${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
        <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">{heading}</h2>
        <div className="flex flex-wrap justify-center gap-8 items-center opacity-80">
          {logos.length === 0 ? (
            <span className="text-gray-400 text-sm">הוסיפו לוגואים בעריכה</span>
          ) : (
            logos.map((logo, i) => (
              <div key={i} className="h-10 min-w-[80px] flex items-center justify-center grayscale">
                {logo.imageKey ? (
                  <StorageImage keyOrUrl={logo.imageKey} alt={logo.label} className="max-h-10 object-contain" />
                ) : (
                  <span className="text-gray-600 font-medium">{logo.label}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function PublicTestimonials({ section }: SectionPublicProps) {
  if (section.type !== 'testimonials') return null;
  const c = section.content;
  const items = (Array.isArray(c.items) ? c.items : []) as { quote: string; author?: string; role?: string }[];

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{String(c.heading ?? '')}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((t, i) => (
          <blockquote key={i} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <p className="text-gray-800 mb-3">&ldquo;{t.quote}&rdquo;</p>
            <footer className="text-sm text-gray-500">
              {(t.author ?? '') + (t.role ? ` · ${t.role}` : '')}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

export function PublicFaq({ section }: SectionPublicProps) {
  if (section.type !== 'faq') return null;
  const c = section.content;
  const items = (Array.isArray(c.items) ? c.items : []) as { q: string; a: string }[];

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} ${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{String(c.heading ?? '')}</h2>
      <dl className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="border-b border-gray-200 pb-4">
            <dt className="font-semibold text-gray-900">{item.q}</dt>
            <dd className="mt-2 text-gray-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PublicSeoTextBlock({ section }: SectionPublicProps) {
  if (section.type !== 'seo_text_block') return null;
  const c = section.content;
  const collapsible = section.config.collapsible === true;

  return (
    <section className={`${padYClass(section.styling.sectionPaddingY)} bg-gray-50 border-t border-gray-200`}>
      <div className={`${maxWClass(section.styling.containerMaxWidth)} mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{String(c.title ?? '')}</h2>
        {collapsible ? (
          <details>
            <summary className="cursor-pointer text-indigo-600">הצג עוד</summary>
            <div className="mt-2 prose prose-sm max-w-none">{String(c.body ?? '')}</div>
          </details>
        ) : (
          <div className="prose prose-sm max-w-none">{String(c.body ?? '')}</div>
        )}
      </div>
    </section>
  );
}
