import { uploadData, getUrl, remove } from 'aws-amplify/storage';

/**
 * Storage API
 *
 * - Store only object KEYS in DB/state (never signed URLs).
 * - Resolve keys to fresh signed URLs at runtime via getSignedUrl / useStorageImageUrl.
 */

const IMAGES_PREFIX = 'images/';
const SIGNED_URL_TTL_SEC = 3600; // 1 hour
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 min (refresh before expiry)

function normalizeKey(key: string): string {
  if (key.startsWith(IMAGES_PREFIX)) return key;
  return `${IMAGES_PREFIX}${key}`;
}

/** In-memory cache: key -> { url, expiresAt } */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export interface UploadResult {
  /** Persist only this key in DB. Do not store signed URLs. */
  key: string;
}

/**
 * Upload product image. Returns only key – persist key in product.images[], never the URL.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  filename?: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${IMAGES_PREFIX}products/${productId}/${filename || `${Date.now()}.${ext}`}`;

  await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type,
      accessLevel: 'guest',
    },
  }).result;

  return { key };
}

/**
 * Upload category image. Persist returned key in category.imageUrl (field holds key, not URL).
 */
export async function uploadCategoryImage(
  categoryId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${IMAGES_PREFIX}categories/${categoryId}/${Date.now()}.${ext}`;

  await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type,
      accessLevel: 'guest',
    },
  }).result;

  return { key };
}

/**
 * Get a fresh signed URL for a storage key. Cached for CACHE_TTL_MS to avoid repeated calls.
 * Use this (or useStorageImageUrl) whenever you need to display an image – do not persist the result.
 */
export async function getSignedUrl(key: string): Promise<string> {
  const normalizedKey = normalizeKey(key);
  const cached = signedUrlCache.get(normalizedKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const result = await getUrl({
    key: normalizedKey,
    options: {
      accessLevel: 'guest',
      expiresIn: SIGNED_URL_TTL_SEC,
    },
  });

  const url = result.url.toString();
  signedUrlCache.set(normalizedKey, {
    url,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return url;
}

/**
 * Try to extract S3 object key from a signed or plain S3/CloudFront URL (for migrating old DB values).
 */
export function extractKeyFromS3Url(url: string): string | null {
  if (!url || !url.startsWith('http')) return null;
  try {
    const u = new URL(url);
    const path = u.pathname;
    // Common patterns: /images/... or /products/... or path after bucket name
    const match = path.match(/\/(images\/[^?]+)/) || path.match(/\/(products\/[^?]+)/) || path.match(/\/(categories\/[^?]+)/);
    if (match) return match[1];
    if (path.includes('images/')) {
      const idx = path.indexOf('images/');
      return path.slice(idx);
    }
    return null;
  } catch {
    return null;
  }
}

/** True if value looks like a storage key (no scheme). */
export function isStorageKey(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  return !t.startsWith('http://') && !t.startsWith('https://');
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  await remove({
    key: normalizeKey(key),
    options: {
      accessLevel: 'guest',
    },
  });
}

/**
 * Upload multiple product images
 */
export async function uploadProductImages(
  productId: string,
  files: File[]
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const file of files) {
    const result = await uploadProductImage(productId, file);
    results.push(result);
  }

  return results;
}

const HERO_SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

/**
 * Upload home hero background image. Returns S3 key only (persist in SiteHero.imageKey).
 * Uses Amplify Storage managed upload (same bucket access as presigned PUT after IAM policy).
 *
 * Optional onProgress reports 0–100 for UI (best-effort; not byte-accurate).
 */
export async function uploadHeroImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const base =
    file.name && HERO_SAFE_NAME.test(file.name)
      ? file.name
      : `upload.${file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'}`;
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const key = `${IMAGES_PREFIX}hero/${Date.now()}-${safe}`;

  onProgress?.(0);
  const task = uploadData({
    key,
    data: file,
    options: {
      contentType: file.type || 'image/jpeg',
      accessLevel: 'guest',
    },
  });

  let fake = 5;
  const tick = window.setInterval(() => {
    fake = Math.min(fake + 10, 85);
    onProgress?.(fake);
  }, 120);

  try {
    await task.result;
  } finally {
    window.clearInterval(tick);
  }
  onProgress?.(100);
  return { key };
}

/**
 * Upload CSV file for import. Returns key only; use getSignedUrl(key) when you need a download URL.
 */
export async function uploadCSVImport(file: File): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${IMAGES_PREFIX}imports/${Date.now()}-${safeName}`;

  await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type || 'text/csv',
      accessLevel: 'guest',
    },
  }).result;

  return { key };
}

/** Placeholder used when no image or when display should use StorageImage for key-based URLs. */
export const PLACEHOLDER_IMAGE = '/placeholder.png';

/**
 * @deprecated Use StorageImage component or useStorageImageUrl for display. Do not use for S3 keys.
 * Returns placeholder for keys and for S3-looking URLs (to avoid showing expired URLs).
 */
export function getImageUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return PLACEHOLDER_IMAGE;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    if (keyOrUrl.includes('amazonaws.com') || keyOrUrl.includes('X-Amz')) return PLACEHOLDER_IMAGE;
    return keyOrUrl;
  }
  return PLACEHOLDER_IMAGE;
}
