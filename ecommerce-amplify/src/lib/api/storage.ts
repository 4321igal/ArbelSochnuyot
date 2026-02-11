import { uploadData, getUrl, remove } from 'aws-amplify/storage';

/**
 * Storage API
 * 
 * Provides methods for file upload/download using Amplify Storage
 */

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
  const key = `products/${productId}/${filename || `${Date.now()}.${ext}`}`;

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
  const key = `categories/${categoryId}/${Date.now()}.${ext}`;

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
  const result = await getUrl({
    key,
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
    key,
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
 * Get image URL from key or full URL
 * Handles both S3 keys and full URLs
 */
export function getImageUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) {
    return '/placeholder.png';
  }

  // If it's already a full URL, return it
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    return keyOrUrl;
  }

  // Otherwise, it's an S3 key - return a placeholder
  // In production, you'd get a signed URL
  return `/api/image/${encodeURIComponent(keyOrUrl)}`;
}
