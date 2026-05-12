import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ShieldCheck, HeartHandshake, ArrowLeft, Car as CarIcon } from 'lucide-react';
import { useStorageImageUrl } from '@/hooks/useStorageImageUrl';
import { listFeaturedVehicles, type Vehicle } from '@/lib/api/vehicles';
import { listMakes, type Make } from '@/lib/api/makes';
import { getSiteHero, resolvePublicHero, type SiteHero } from '@/lib/api/siteHero';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';

export function HomePage() {
  const [featured, setFeatured] = useState<Vehicle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [hero, setHero] = useState<SiteHero | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [vehicles, makesList, heroData] = await Promise.all([
          listFeaturedVehicles(8).catch(() => []),
          listMakes().catch(() => []),
          getSiteHero().catch(() => null),
        ]);
        if (cancelled) return;
        setFeatured(vehicles);
        setMakes(makesList);
        setHero(heroData);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedHero = resolvePublicHero(hero);

  return (
    <div>
      <HeroSection hero={resolvedHero} />

      {makes.length > 0 && <MakesGrid makes={makes} />}

      <FeaturedVehiclesSection vehicles={featured} makes={makes} isLoading={isLoading} />

      <WhyArbelSection />

      <CtaBanner />
    </div>
  );
}

function HeroSection({ hero }: { hero: SiteHero }) {
  const { url, loading } = useStorageImageUrl(hero.imageKey);

  return (
    <section className="relative min-h-[500px] md:min-h-[620px] flex items-center bg-brand-900 overflow-hidden">
      {hero.imageKey && !loading && url ? (
        <img
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-l from-brand-900/90 via-brand-900/70 to-brand-900/40" />

      <div className="container-wide relative z-10 py-20">
        <div className="max-w-2xl">
          <span className="inline-block bg-accent-500 text-brand-900 text-xs font-bold px-3 py-1 rounded-full mb-6">
            ארבל סוכנויות
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight text-balance">
            {hero.title}
          </h1>
          {hero.subtitle && (
            <p className="mt-6 text-lg md:text-xl text-white/85 leading-relaxed">
              {hero.subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={hero.ctaLink || '/inventory'} className="btn-accent text-base px-6 py-3">
              {hero.ctaText || 'לקטלוג הרכבים'}
              <ArrowLeft className="w-4 h-4 ms-2" />
            </Link>
            <Link
              to="/finance"
              className="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 text-base px-6 py-3"
            >
              חישוב מימון
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function MakesGrid({ makes }: { makes: Make[] }) {
  return (
    <section className="bg-white py-12 border-b border-gray-100">
      <div className="container-wide">
        <h2 className="text-xl font-bold text-brand-900 mb-6 text-center">חיפוש לפי יצרן</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {makes.slice(0, 16).map((m) => (
            <MakeChip key={m.id} make={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MakeChip({ make }: { make: Make }) {
  const { url } = useStorageImageUrl(make.logoUrl);
  return (
    <Link
      to={`/inventory?make=${make.slug}`}
      className="group flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:border-accent-500 hover:shadow-md transition-all bg-white"
    >
      {url ? (
        <img src={url} alt={make.name} className="h-10 object-contain mb-2" loading="lazy" />
      ) : (
        <CarIcon className="h-8 w-8 text-brand-600 mb-2 group-hover:text-accent-500" />
      )}
      <span className="text-xs font-medium text-brand-800 group-hover:text-accent-600 text-center">
        {make.name}
      </span>
    </Link>
  );
}

function FeaturedVehiclesSection({
  vehicles,
  makes,
  isLoading,
}: {
  vehicles: Vehicle[];
  makes: Make[];
  isLoading: boolean;
}) {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-brand-900">רכבי החודש</h2>
            <p className="text-gray-600 mt-1">מבחר רכבים מובילים מהמלאי שלנו</p>
          </div>
          <Link to="/inventory" className="text-brand-700 hover:text-accent-600 font-medium text-sm flex items-center gap-1">
            כל הרכבים
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <div className="aspect-[4/3] skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-16 skeleton" />
                  <div className="h-5 w-3/4 skeleton" />
                  <div className="h-8 w-1/2 skeleton mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <VehicleGrid vehicles={vehicles} makes={makes} emptyMessage="עדיין לא הוספו רכבים מומלצים" />
        )}
      </div>
    </section>
  );
}

function WhyArbelSection() {
  const items = [
    {
      icon: ShieldCheck,
      title: 'אחריות וביטחון',
      desc: 'כל רכב עובר בדיקה מקיפה. ליווי משפטי בהעברת הבעלות ובדיקת שעבודים.',
    },
    {
      icon: HeartHandshake,
      title: 'ליווי אישי',
      desc: 'איש מכירות צמוד מהפנייה הראשונה ועד למסירת המפתחות. בלי לחץ, רק מקצועיות.',
    },
    {
      icon: Award,
      title: 'מימון בתנאים מצוינים',
      desc: 'פתרונות מימון לכל כיס דרך מספר גופי מימון מובילים. אישור עקרוני תוך 24 שעות.',
    },
  ];
  return (
    <section className="bg-white py-16">
      <div className="container-wide">
        <h2 className="text-3xl font-bold text-brand-900 text-center mb-2">למה ארבל?</h2>
        <p className="text-gray-600 text-center mb-12">היתרונות שמבדילים אותנו מסוכנויות אחרות</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.title} className="text-center p-6 rounded-xl border border-gray-200 hover:border-accent-500 hover:shadow-md transition-all">
              <div className="w-14 h-14 mx-auto bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mb-4">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-brand-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-brand-900 text-white py-12">
      <div className="container-wide text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">לא מצאת את הרכב שחיפשת?</h2>
        <p className="text-white/80 mb-6">השאר פרטים ונחזור אליך עם הצעה מותאמת אישית.</p>
        <Link to="/contact" className="btn-accent text-base px-6 py-3 inline-flex">
          צור קשר עכשיו
        </Link>
      </div>
    </section>
  );
}
