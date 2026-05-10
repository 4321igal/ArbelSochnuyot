import { uploadData, getUrl, remove } from 'aws-amplify/storage';

const IMAGES_PREFIX = 'images/';
const SIGNED_URL_TTL_SEC = 3600;
const CACHE_TTL_MS = 50 * 60 * 1000;

function normalizeKey(key: string): string {
  if (key.startsWith(IMAGES_PREFIX)) return key;
  return `${IMAGES_PREFIX}${key}`;
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export interface UploadResult {
  key: string;
}

export async function uploadVehicleImage(
  vehicleId: string,
  file: File,
  filename?: string,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${IMAGES_PREFIX}vehicles/${vehicleId}/${filename || `${Date.now()}.${ext}`}`;
  await uploadData({
    key,
    data: file,
    options: { contentType: file.type, accessLevel: 'guest' },
  }).result;
  return { key };
}

export async function uploadVehicleImages(
  vehicleId: string,
  files: File[],
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  for (const file of files) {
    results.push(await uploadVehicleImage(vehicleId, file));
  }
  return results;
}

export async function uploadMakeLogo(makeId: string, file: File): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'png';
  const key = `${IMAGES_PREFIX}makes/${makeId}/${Date.now()}.${ext}`;
  await uploadData({
    key,
    data: file,
    options: { contentType: file.type, accessLevel: 'guest' },
  }).result;
  return { key };
}

export async function uploadBodyTypeIcon(bodyTypeId: string, file: File): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'svg';
  const key = `${IMAGES_PREFIX}bodyTypes/${bodyTypeId}/${Date.now()}.${ext}`;
  await uploadData({
    key,
    data: file,
    options: { contentType: file.type, accessLevel: 'guest' },
  }).result;
  return { key };
}

export async function getSignedUrl(key: string): Promise<string> {
  const normalizedKey = normalizeKey(key);
  const cached = signedUrlCache.get(normalizedKey);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const result = await getUrl({
    key: normalizedKey,
    options: { accessLevel: 'guest', expiresIn: SIGNED_URL_TTL_SEC },
  });
  const url = result.url.toString();
  signedUrlCache.set(normalizedKey, { url, expiresAt: Date.now() + CACHE_TTL_MS });
  return url;
}

export function isStorageKey(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const t = value.trim();
  return !t.startsWith('http://') && !t.startsWith('https://');
}

export async function deleteFile(key: string): Promise<void> {
  await remove({ key: normalizeKey(key), options: { accessLevel: 'guest' } });
}

const HERO_SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

export async function uploadHeroImage(
  file: File,
  onProgress?: (percent: number) => void,
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
    options: { contentType: file.type || 'image/jpeg', accessLevel: 'guest' },
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

export async function uploadCSVImport(file: File): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${IMAGES_PREFIX}imports/${Date.now()}-${safeName}`;
  await uploadData({
    key,
    data: file,
    options: { contentType: file.type || 'text/csv', accessLevel: 'guest' },
  }).result;
  return { key };
}

export const PLACEHOLDER_IMAGE = '/placeholder.png';

export function getImageUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return PLACEHOLDER_IMAGE;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    if (keyOrUrl.includes('amazonaws.com') || keyOrUrl.includes('X-Amz')) return PLACEHOLDER_IMAGE;
    return keyOrUrl;
  }
  return PLACEHOLDER_IMAGE;
}
