import { Link } from 'react-router-dom';
import { useStorageImageUrl } from '@/hooks/useStorageImageUrl';
import type { SiteHero } from '@/lib/api/siteHero';

interface PublicHeroSectionProps {
  hero: SiteHero;
  backgroundOverrideUrl?: string | null;
}

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
        <div className="absolute inset-0 bg-gradient-to-l from-brand-900/90 via-brand-900/70 to-brand-900/40" aria-hidden />
      </>
    );
  }

  if (!imageKey) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-l from-brand-900/90 via-brand-900/70 to-brand-900/40" aria-hidden />
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
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 animate-pulse" aria-hidden />
      )}
      <div className="absolute inset-0 bg-gradient-to-l from-brand-900/90 via-brand-900/70 to-brand-900/40" aria-hidden />
    </>
  );
}

export function PublicHeroSection({ hero, backgroundOverrideUrl }: PublicHeroSectionProps) {
  const cta = hero.ctaLink?.trim() || '/inventory';
  const ctaText = hero.ctaText?.trim() || 'לקטלוג הרכבים';
  const isExternal = /^https?:\/\//i.test(cta);

  return (
    <section className="relative min-h-[320px] md:min-h-[420px] flex items-center text-white overflow-hidden">
      <HeroBackground imageKey={hero.imageKey} backgroundOverrideUrl={backgroundOverrideUrl} />
      <div className="relative z-10 container-wide py-16 md:py-24 w-full">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{hero.title}</h1>
          {hero.subtitle ? (
            <p className="text-xl text-white/90 mb-8 drop-shadow-md">{hero.subtitle}</p>
          ) : null}
          {isExternal ? (
            <a
              href={cta}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent-500 text-brand-900 font-bold px-8 py-3 rounded-lg hover:bg-accent-400 transition-colors shadow-lg"
            >
              {ctaText}
            </a>
          ) : (
            <Link
              to={cta}
              className="inline-block bg-accent-500 text-brand-900 font-bold px-8 py-3 rounded-lg hover:bg-accent-400 transition-colors shadow-lg"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
