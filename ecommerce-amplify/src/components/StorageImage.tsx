import { useStorageImageUrl } from '@/hooks/useStorageImageUrl';
import { PLACEHOLDER_IMAGE } from '@/lib/api/storage';

export interface StorageImageProps {
  /** S3 object key or legacy full URL; null/undefined shows placeholder. */
  keyOrUrl: string | null | undefined;
  alt: string;
  className?: string;
  /** Optional placeholder while loading (default: same as PLACEHOLDER_IMAGE). */
  placeholder?: string;
}

/**
 * Renders an image from a storage key or URL, resolving keys to fresh signed URLs at runtime.
 * Use everywhere product/category/cart images are shown – do not use raw img + getImageUrl for S3 keys.
 */
export function StorageImage({
  keyOrUrl,
  alt,
  className,
  placeholder = PLACEHOLDER_IMAGE,
}: StorageImageProps) {
  const { url, loading } = useStorageImageUrl(keyOrUrl);
  const src = loading ? placeholder : url;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
