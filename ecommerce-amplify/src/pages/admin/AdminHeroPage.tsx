import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getSiteHero,
  saveSiteHero,
  DEFAULT_SITE_HERO,
  resolvePublicHero,
  type SiteHero,
} from '@/lib/api/siteHero';
import {
  uploadHeroImage,
} from '@/lib/api/storage';
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
        setCtaLink(merged.ctaLink ?? '/');
        setImageKey(row?.imageKey ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load hero');
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
      showToast('success', 'Image uploaded');
    } catch (err) {
      URL.revokeObjectURL(previewUrl);
      const msg = err instanceof Error ? err.message : 'Upload failed';
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
      showToast('success', 'Hero saved');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-amber-900">
        Admin access required to edit the site hero.
        <Link to="/admin" className="ml-2 text-indigo-600 underline">
          Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Homepage hero</h1>
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          View store
        </Link>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 text-red-800 border border-red-200 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-4 bg-white rounded-lg shadow p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA label</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              maxLength={80}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA link</label>
            <input
              type="text"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="/category/all or https://…"
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hero image</label>
            <p className="text-xs text-gray-500 mb-2">JPG, PNG, or WebP — max 2MB. Compressed to max width {1920}px before upload.</p>
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
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            )}
            {imageKey && (
              <button
                type="button"
                onClick={clearImage}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Remove image (gradient only)
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            className="w-full sm:w-auto bg-indigo-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save hero'}
          </button>
        </form>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Live preview</h2>
          <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 ring-1 ring-black/5">
            <PublicHeroSection hero={previewHero} backgroundOverrideUrl={filePreview} />
          </div>
          {filePreview && !imageKey && (
            <p className="text-xs text-gray-500 mt-2">Local preview only — upload finished when progress completes.</p>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Loading current hero…</p>
      )}
    </div>
  );
}
