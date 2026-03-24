import { Link } from 'react-router-dom';
import { useStorageImageUrl } from '@/hooks/useStorageImageUrl';
import type { SiteHero } from '@/lib/api/siteHero';

interface PublicHeroSectionProps {
  hero: SiteHero;
  /** Local blob URL for admin preview before upload completes — not used on production home */
  backgroundOverrideUrl?: string | null;
}

/**
 * Full-width home hero with optional background image, gradient overlay, left-aligned copy.
 * Background image uses runtime signed URL (lazy). No text baked into the image.
 */
function HeroBackground({
  imageKey,
  backgroundOverrideUrl,
}: {
  imageKey: string | null | undefined;
  backgroundOverrideUrl?: string | null;
}) {
  const { url, loading } = useStorageImageUrl(backgroundOverrideUrl ? null : imageKey);

  if (backgroundOverrideUrl) {
    return (
      <>
        <img
          src={backgroundOverrideUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent"
          aria-hidden
        />
      </>
    );
  }

  if (!imageKey) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent"
          aria-hidden
        />
      </>
    );
  }

  return (
    <>
      {!loading && (
        <img
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width={1920}
          height={1080}
        />
      )}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 animate-pulse" aria-hidden />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-transparent"
        aria-hidden
      />
    </>
  );
}

export function PublicHeroSection({ hero, backgroundOverrideUrl }: PublicHeroSectionProps) {
  const cta = hero.ctaLink?.trim() || '/category/all';
  const ctaText = hero.ctaText?.trim() || 'Shop Now';
  const isExternal = /^https?:\/\//i.test(cta);

  return (
    <section className="relative min-h-[320px] md:min-h-[420px] flex items-center text-white overflow-hidden">
      <HeroBackground imageKey={hero.imageKey} backgroundOverrideUrl={backgroundOverrideUrl} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="max-w-2xl text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{hero.title}</h1>
          {hero.subtitle ? (
            <p className="text-xl text-indigo-100/95 mb-8 drop-shadow-md">{hero.subtitle}</p>
          ) : null}
          {isExternal ? (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-white text-indigo-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {ctaText}
            </a>
          ) : (
            <Link
              to={cta}
              className="inline-block bg-white text-indigo-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
