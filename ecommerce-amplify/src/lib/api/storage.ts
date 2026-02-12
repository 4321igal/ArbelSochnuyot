import { uploadData, getUrl, remove } from 'aws-amplify/storage';

/**
 * Storage API
 *
 * Uses bucket path: images/ (e.g. bucket name contains ecommercestoragebucket00).
 */

const IMAGES_PREFIX = 'images/';

function normalizeKey(key: string): string {
  if (key.startsWith(IMAGES_PREFIX)) return key;
  return `${IMAGES_PREFIX}${key}`;
}

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Upload product image
 *
 * @param productId - Product ID for path organization
 * @param file - File to upload
 * @param filename - Optional custom filename
 * @returns Upload result with key and URL
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  filename?: string
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${IMAGES_PREFIX}products/${productId}/${filename || `${Date.now()}.${ext}`}`;

  const result = await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type,
      accessLevel: 'guest', // Public read
    },
  }).result;

  // Get public URL
  const urlResult = await getUrl({
    key: result.key,
    options: {
      accessLevel: 'guest',
      expiresIn: 3600 * 24 * 7, // 7 days
    },
  });

  return {
    key: result.key,
    url: urlResult.url.toString(),
  };
}

/**
 * Upload category image
 */
export async function uploadCategoryImage(
  categoryId: string,
  file: File
): Promise<UploadResult> {
  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${IMAGES_PREFIX}categories/${categoryId}/${Date.now()}.${ext}`;

  const result = await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type,
      accessLevel: 'guest',
    },
  }).result;

  const urlResult = await getUrl({
    key: result.key,
    options: {
      accessLevel: 'guest',
      expiresIn: 3600 * 24 * 7,
    },
  });

  return {
    key: result.key,
    url: urlResult.url.toString(),
  };
}

/**
 * Get signed URL for an existing file
 */
export async function getSignedUrl(key: string): Promise<string> {
  const normalizedKey = normalizeKey(key);
  const result = await getUrl({
    key: normalizedKey,
    options: {
      accessLevel: 'guest',
      expiresIn: 3600, // 1 hour
    },
  });

  return result.url.toString();
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

/**
 * Upload CSV file for import (stored in S3, then editable + quick add products).
 */
export async function uploadCSVImport(file: File): Promise<UploadResult> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${IMAGES_PREFIX}imports/${Date.now()}-${safeName}`;

  const result = await uploadData({
    key,
    data: file,
    options: {
      contentType: file.type || 'text/csv',
      accessLevel: 'guest',
    },
  }).result;

  const urlResult = await getUrl({
    key: result.key,
    options: {
      accessLevel: 'guest',
      expiresIn: 3600 * 24 * 7,
    },
  });

  return {
    key: result.key,
    url: urlResult.url.toString(),
  };
}

/**
 * Get image URL from key or full URL
 * Handles S3 keys (with or without images/ prefix) and full URLs
 */
export function getImageUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) {
    return '/placeholder.png';
  }

  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }

  // S3 key: ensure images/ prefix for bucket path
  const key = normalizeKey(keyOrUrl);
  return `/api/image/${encodeURIComponent(key)}`;
}
