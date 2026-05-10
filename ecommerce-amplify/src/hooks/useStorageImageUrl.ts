import { useState, useEffect } from 'react';
import {
  getSignedUrl,
  isStorageKey,
  PLACEHOLDER_IMAGE,
} from '@/lib/api/storage';

function extractKeyFromS3Url(url: string): string | null {
  if (!url || !url.startsWith('http')) return null;
  try {
    const u = new URL(url);
    const path = u.pathname;
    const match = path.match(/\/(images\/[^?]+)/);
    if (match) return match[1];
    if (path.includes('images/')) return path.slice(path.indexOf('images/'));
    return null;
  } catch {
    return null;
  }
}

export interface UseStorageImageUrlResult {
  url: string;
  loading: boolean;
  error: string | null;
}

/**
 * Resolves a storage key or legacy URL to a fresh signed URL for display.
 * Use for any image that may be an S3 key – never persist the returned URL.
 */
export function useStorageImageUrl(
  keyOrUrl: string | null | undefined
): UseStorageImageUrlResult {
  const [url, setUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!keyOrUrl || !keyOrUrl.trim()) {
      setUrl(PLACEHOLDER_IMAGE);
      setLoading(false);
      setError(null);
      return;
    }

    const value = keyOrUrl.trim();

    if (isStorageKey(value)) {
      setLoading(true);
      setError(null);
      getSignedUrl(value)
        .then((signed) => {
          setUrl(signed);
          setError(null);
        })
        .catch((err) => {
          setUrl(PLACEHOLDER_IMAGE);
          setError(err instanceof Error ? err.message : 'Failed to load image');
        })
        .finally(() => setLoading(false));
      return;
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      const extractedKey = extractKeyFromS3Url(value);
      if (extractedKey) {
        setLoading(true);
        setError(null);
        getSignedUrl(extractedKey)
          .then((signed) => {
            setUrl(signed);
            setError(null);
          })
          .catch(() => {
            setUrl(PLACEHOLDER_IMAGE);
            setError(null);
          })
          .finally(() => setLoading(false));
        return;
      }
      setUrl(value);
      setLoading(false);
      setError(null);
      return;
    }

    setUrl(PLACEHOLDER_IMAGE);
    setLoading(false);
    setError(null);
  }, [keyOrUrl]);

  return { url, loading, error };
}
