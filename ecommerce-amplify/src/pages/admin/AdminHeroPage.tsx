import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getSiteHero,
  saveSiteHero,
  DEFAULT_SITE_HERO,
  resolvePublicHero,
  type SiteHero,
} from '@/lib/api/siteHero';
import { uploadHeroImage } from '@/lib/api/storage';
import { compressHeroImageForUpload, validateHeroImageFile } from '@/lib/hero/heroImage';
import { PublicHeroSection } from '@/components/hero/PublicHeroSection';
import { useAuth } from '@/lib/auth/AuthContext';

export function AdminHeroPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [title, setTitle] = useState(DEFAULT_SITE_HERO.title);
  const [subtitle, setSubtitle] = useState(DEFAULT_SITE_HERO.subtitle ?? '');
  const [ctaText, setCtaText] = useState(DEFAULT_SITE_HERO.ctaText ?? '');
  const [ctaLink, setCtaLink] = useState(DEFAULT_SITE_HERO.ctaLink ?? '');
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await getSiteHero();
        if (cancelled) return;
        const merged = resolvePublicHero(row);
        setTitle(merged.title);
        setSubtitle(merged.subtitle ?? '');
        setCtaText(merged.ctaText ?? '');
        setCtaLink(merged.ctaLink ?? '/inventory');
        setImageKey(row?.imageKey ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'טעינת ה-Hero נכשלה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const previewHero: SiteHero = {
    id: 'hero-main',
    title: title || DEFAULT_SITE_HERO.title,
    subtitle: subtitle || DEFAULT_SITE_HERO.subtitle,
    ctaText: ctaText || DEFAULT_SITE_HERO.ctaText,
    ctaLink: ctaLink || DEFAULT_SITE_HERO.ctaLink,
    imageKey,
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    const v = validateHeroImageFile(file);
    if (v) {
      setError(v);
      showToast('error', v);
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    try {
      setUploadPct(0);
      const compressed = await compressHeroImageForUpload(file);
      const { key } = await uploadHeroImage(compressed, setUploadPct);
      setImageKey(key);
      URL.revokeObjectURL(previewUrl);
      setFilePreview(null);
      showToast('success', 'התמונה הועלתה');
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      const msg = err instanceof Error ? err.message : 'העלאה נכשלה';
      setError(msg);
      showToast('error', msg);
      setFilePreview(null);
    } finally {
      setUploadPct(null);
    }
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveSiteHero({
        title,
        subtitle: subtitle || null,
        ctaText: ctaText || null,
        ctaLink: ctaLink || '/',
        imageKey,
      });
      showToast('success', 'ה-Hero נשמר');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שמירה נכשלה';
      setError(msg);
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const clearImage = () => {
    setImageKey(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-700 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-amber-900">
        נדרשת הרשאת אדמין כדי לערוך את ה-Hero.
        <Link to="/admin" className="ms-2 text-brand-700 underline">דשבורד</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">תמונת Hero בדף הבית</h1>
        <Link to="/" className="text-brand-700 hover:underline text-sm">צפה באתר</Link>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 text-red-800 border border-red-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div>
            <label className="label">כותרת</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">כותרת משנה</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={500}
              rows={3}
              className="input"
            />
          </div>
          <div>
            <label className="label">טקסט הכפתור</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              maxLength={80}
              className="input"
            />
          </div>
          <div>
            <label className="label">קישור הכפתור</label>
            <input
              type="text"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="/inventory או https://…"
              maxLength={500}
              className="input"
            />
          </div>

          <div>
            <label className="label">תמונת רקע</label>
            <p className="text-xs text-gray-500 mb-2">JPG, PNG או WebP — עד 2MB. דחיסה אוטומטית לרוחב מקסימלי 1920px.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFile}
              disabled={uploadPct !== null}
              className="block w-full text-sm"
            />
            {uploadPct !== null && (
              <div className="mt-2 h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-brand-700 transition-all duration-300"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            )}
            {imageKey && (
              <button type="button" onClick={clearImage} className="mt-2 text-sm text-red-600 hover:underline">
                הסר תמונה (רק גרדיאנט)
              </button>
            )}
          </div>

          <button type="submit" disabled={saving || loading} className="btn-accent">
            {saving ? 'שומר…' : 'שמור Hero'}
          </button>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-brand-900 mb-3">תצוגה מקדימה חיה</h2>
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 ring-1 ring-black/5">
            <PublicHeroSection hero={previewHero} backgroundOverrideUrl={filePreview} />
          </div>
          {filePreview && !imageKey && (
            <p className="text-xs text-gray-500 mt-2">תצוגה מקומית בלבד — ההעלאה תסתיים כשהמדדן יסתיים.</p>
          )}
        </div>
      </div>
    </div>
  );
}
