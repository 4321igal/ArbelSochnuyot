import type { SectionEditorProps } from '@/homepage/registry/types';

function label(t: string) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{t}</label>;
}

export function HeroEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'hero') return null;
  const c = section.content;
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });

  return (
    <div className="space-y-4">
      {label('כותרת (עברית)')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.headline ?? '')}
        onChange={(e) => patch({ headline: e.target.value })}
      />
      {label('משנה (עברית)')}
      <textarea
        className="w-full border rounded px-3 py-2"
        rows={2}
        value={String(c.subheadline ?? '')}
        onChange={(e) => patch({ subheadline: e.target.value })}
      />
      {label('כותרת (English)')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.headlineEn ?? '')}
        onChange={(e) => patch({ headlineEn: e.target.value })}
      />
      {label('CTA טקסט')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.ctaText ?? '')}
        onChange={(e) => patch({ ctaText: e.target.value })}
      />
      {label('קישור CTA')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.ctaHref ?? '')}
        onChange={(e) => patch({ ctaHref: e.target.value })}
      />
      {label('מפתח תמונה (S3 key) — אופציונלי')}
      <input
        className="w-full border rounded px-3 py-2 font-mono text-sm"
        value={String(c.imageKey ?? '')}
        onChange={(e) => patch({ imageKey: e.target.value || null })}
      />
    </div>
  );
}

export function SimpleHeadingEditor({ section, onChange }: SectionEditorProps) {
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const c = section.content;

  return (
    <div className="space-y-4">
      {label('כותרת מקטע')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.heading ?? section.title)}
        onChange={(e) => patch({ heading: e.target.value })}
      />
      {label('Heading (EN)')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.headingEn ?? '')}
        onChange={(e) => patch({ headingEn: e.target.value })}
      />
    </div>
  );
}

export function CategoriesGridEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'categories_grid') return null;
  const patchC = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const patchG = (p: Record<string, unknown>) =>
    onChange({ ...section, config: { ...section.config, ...p } });
  const c = section.content;

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.heading ?? '')} onChange={(e) => patchC({ heading: e.target.value })} />
      {label('מספר עמודות (2–6)')}
      <input
        type="number"
        min={2}
        max={6}
        className="w-full border rounded px-3 py-2"
        value={Number(section.config.columns ?? 4)}
        onChange={(e) => patchG({ columns: Math.min(6, Math.max(2, Number(e.target.value) || 4)) })}
      />
      {label('מקסימום פריטים')}
      <input
        type="number"
        min={1}
        max={24}
        className="w-full border rounded px-3 py-2"
        value={Number(section.config.maxItems ?? 8)}
        onChange={(e) => patchG({ maxItems: Number(e.target.value) || 8 })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.config.showTitle !== false}
          onChange={(e) => patchG({ showTitle: e.target.checked })}
        />
        הצג כותרת
      </label>
    </div>
  );
}

export function ProductsCarouselEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'products_carousel') return null;
  const patchC = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const patchG = (p: Record<string, unknown>) =>
    onChange({ ...section, config: { ...section.config, ...p } });
  const c = section.content;

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.heading ?? '')} onChange={(e) => patchC({ heading: e.target.value })} />
      {label('מקסימום מוצרים')}
      <input
        type="number"
        min={1}
        max={24}
        className="w-full border rounded px-3 py-2"
        value={Number(section.config.maxItems ?? 12)}
        onChange={(e) => patchG({ maxItems: Number(e.target.value) || 12 })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.config.autoplay === true}
          onChange={(e) => patchG({ autoplay: e.target.checked })}
        />
        ניגון אוטומטי (כאשר יש קרוסלה אינטראקטיבית)
      </label>
    </div>
  );
}

export function FeaturedProductsEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'featured_products') return null;
  const patchC = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const patchG = (p: Record<string, unknown>) =>
    onChange({ ...section, config: { ...section.config, ...p } });
  const c = section.content;

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.heading ?? '')} onChange={(e) => patchC({ heading: e.target.value })} />
      {label('מקסימום מוצרים')}
      <input
        type="number"
        min={1}
        max={24}
        className="w-full border rounded px-3 py-2"
        value={Number(section.config.maxItems ?? 8)}
        onChange={(e) => patchG({ maxItems: Number(e.target.value) || 8 })}
      />
    </div>
  );
}

export function PromotionalBannerEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'promotional_banner') return null;
  const c = section.content;
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.headline ?? '')} onChange={(e) => patch({ headline: e.target.value })} />
      {label('גוף')}
      <textarea className="w-full border rounded px-3 py-2" rows={3} value={String(c.body ?? '')} onChange={(e) => patch({ body: e.target.value })} />
      {label('CTA')}
      <input className="w-full border rounded px-3 py-2" value={String(c.ctaText ?? '')} onChange={(e) => patch({ ctaText: e.target.value })} />
      {label('קישור')}
      <input className="w-full border rounded px-3 py-2" value={String(c.ctaHref ?? '')} onChange={(e) => patch({ ctaHref: e.target.value })} />
      {label('מפתח תמונה')}
      <input
        className="w-full border rounded px-3 py-2 font-mono text-sm"
        value={String(c.imageKey ?? '')}
        onChange={(e) => patch({ imageKey: e.target.value || null })}
      />
    </div>
  );
}

export function SplitBannerEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'split_banner') return null;
  const c = section.content;
  const patchContent = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const patchConfig = (p: Record<string, unknown>) =>
    onChange({ ...section, config: { ...section.config, ...p } });

  return (
    <div className="space-y-4">
      <div>
        {label('צד תמונה')}
        <select
          className="w-full border rounded px-3 py-2"
          value={String(section.config.imageSide ?? 'left')}
          onChange={(e) => patchConfig({ imageSide: e.target.value })}
        >
          <option value="left">שמאל</option>
          <option value="right">ימין</option>
        </select>
      </div>
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.headline ?? '')} onChange={(e) => patchContent({ headline: e.target.value })} />
      {label('גוף')}
      <textarea className="w-full border rounded px-3 py-2" rows={3} value={String(c.body ?? '')} onChange={(e) => patchContent({ body: e.target.value })} />
      {label('CTA / קישור')}
      <div className="grid grid-cols-2 gap-2">
        <input className="border rounded px-3 py-2" value={String(c.ctaText ?? '')} onChange={(e) => patchContent({ ctaText: e.target.value })} />
        <input className="border rounded px-3 py-2" value={String(c.ctaHref ?? '')} onChange={(e) => patchContent({ ctaHref: e.target.value })} />
      </div>
      {label('מפתח תמונה')}
      <input
        className="w-full border rounded px-3 py-2 font-mono text-sm"
        value={String(c.imageKey ?? '')}
        onChange={(e) => patchContent({ imageKey: e.target.value || null })}
      />
    </div>
  );
}

export function TextWithCtaEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'text_with_cta') return null;
  const c = section.content;
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.headline ?? '')} onChange={(e) => patch({ headline: e.target.value })} />
      {label('תוכן')}
      <textarea className="w-full border rounded px-3 py-2" rows={4} value={String(c.body ?? '')} onChange={(e) => patch({ body: e.target.value })} />
      {label('CTA')}
      <input className="w-full border rounded px-3 py-2" value={String(c.ctaText ?? '')} onChange={(e) => patch({ ctaText: e.target.value })} />
      {label('קישור')}
      <input className="w-full border rounded px-3 py-2" value={String(c.ctaHref ?? '')} onChange={(e) => patch({ ctaHref: e.target.value })} />
    </div>
  );
}

export function BrandStripEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'brand_strip') return null;
  const c = section.content;
  const logos = (Array.isArray(c.logos) ? c.logos : []) as { label: string; imageKey?: string | null }[];

  const setLogos = (next: typeof logos) => onChange({ ...section, content: { ...section.content, logos: next } });

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.heading ?? '')}
        onChange={(e) => onChange({ ...section, content: { ...section.content, heading: e.target.value } })}
      />
      <button
        type="button"
        className="text-sm text-indigo-600"
        onClick={() => setLogos([...logos, { label: `Brand ${logos.length + 1}`, imageKey: null }])}
      >
        + הוסף לוגו
      </button>
      {logos.map((logo, i) => (
        <div key={i} className="flex gap-2 border rounded p-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            value={logo.label}
            onChange={(e) => {
              const next = [...logos];
              next[i] = { ...next[i], label: e.target.value };
              setLogos(next);
            }}
          />
          <input
            className="flex-1 border rounded px-2 py-1 text-sm font-mono"
            placeholder="S3 key"
            value={String(logo.imageKey ?? '')}
            onChange={(e) => {
              const next = [...logos];
              next[i] = { ...next[i], imageKey: e.target.value || null };
              setLogos(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function TestimonialsEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'testimonials') return null;
  const c = section.content;
  const items = (Array.isArray(c.items) ? c.items : []) as { quote: string; author?: string; role?: string }[];

  const setItems = (next: typeof items) => onChange({ ...section, content: { ...section.content, items: next } });

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.heading ?? '')}
        onChange={(e) => onChange({ ...section, content: { ...section.content, heading: e.target.value } })}
      />
      <button type="button" className="text-sm text-indigo-600" onClick={() => setItems([...items, { quote: '', author: '', role: '' }])}>
        + המלצה
      </button>
      {items.map((item, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <textarea
            className="w-full border rounded px-2 py-1 text-sm"
            rows={2}
            value={item.quote}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], quote: e.target.value };
              setItems(next);
            }}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="שם"
              value={item.author ?? ''}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], author: e.target.value };
                setItems(next);
              }}
            />
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="תפקיד"
              value={item.role ?? ''}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], role: e.target.value };
                setItems(next);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FaqEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'faq') return null;
  const c = section.content;
  const items = (Array.isArray(c.items) ? c.items : []) as { q: string; a: string }[];

  const setItems = (next: typeof items) => onChange({ ...section, content: { ...section.content, items: next } });

  return (
    <div className="space-y-4">
      {label('כותרת')}
      <input
        className="w-full border rounded px-3 py-2"
        value={String(c.heading ?? '')}
        onChange={(e) => onChange({ ...section, content: { ...section.content, heading: e.target.value } })}
      />
      <button type="button" className="text-sm text-indigo-600" onClick={() => setItems([...items, { q: '', a: '' }])}>
        + שאלה
      </button>
      {items.map((item, i) => (
        <div key={i} className="border rounded p-3 space-y-2">
          <input
            className="w-full border rounded px-2 py-1 text-sm font-medium"
            placeholder="שאלה"
            value={item.q}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], q: e.target.value };
              setItems(next);
            }}
          />
          <textarea
            className="w-full border rounded px-2 py-1 text-sm"
            rows={2}
            placeholder="תשובה"
            value={item.a}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...next[i], a: e.target.value };
              setItems(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function SeoEditor({ section, onChange }: SectionEditorProps) {
  if (section.type !== 'seo_text_block') return null;
  const c = section.content;
  const patch = (p: Record<string, unknown>) =>
    onChange({ ...section, content: { ...section.content, ...p } });
  const patchConfig = (p: Record<string, unknown>) =>
    onChange({ ...section, config: { ...section.config, ...p } });

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={section.config.collapsible === true}
          onChange={(e) => patchConfig({ collapsible: e.target.checked })}
        />
        מתקפל (הצג עוד)
      </label>
      {label('כותרת')}
      <input className="w-full border rounded px-3 py-2" value={String(c.title ?? '')} onChange={(e) => patch({ title: e.target.value })} />
      {label('גוף SEO')}
      <textarea className="w-full border rounded px-3 py-2 font-mono text-sm" rows={8} value={String(c.body ?? '')} onChange={(e) => patch({ body: e.target.value })} />
    </div>
  );
}

