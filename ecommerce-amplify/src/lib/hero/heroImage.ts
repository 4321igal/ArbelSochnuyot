/**
 * Validate and optionally compress hero images before S3 upload.
 */

export const HERO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
export const HERO_MAX_WIDTH_PX = 1920;
export const HERO_ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function validateHeroImageFile(file: File): string | null {
  if (!file || !file.type) return 'Invalid file';
  if (!HERO_ALLOWED_MIME.has(file.type)) {
    return 'Please use JPG, PNG, or WebP';
  }
  if (file.size > HERO_MAX_BYTES) {
    return `Image must be ${HERO_MAX_BYTES / (1024 * 1024)}MB or smaller`;
  }
  return null;
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/**
 * Resize wide images and re-encode to reduce payload while staying under max dimensions.
 * PNG/WebP kept when source is png/webp; JPEG for jpeg.
 */
export async function compressHeroImageForUpload(file: File): Promise<File> {
  const err = validateHeroImageFile(file);
  if (err) throw new Error(err);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > HERO_MAX_WIDTH_PX) {
          height = Math.round((height * HERO_MAX_WIDTH_PX) / width);
          width = HERO_MAX_WIDTH_PX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process image'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const quality = mime === 'image/png' ? undefined : 0.85;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }
            if (blob.size > HERO_MAX_BYTES) {
              reject(new Error('Image is still too large after compression. Try a smaller file or lower resolution.'));
              return;
            }
            const name = `hero.${extForMime(mime)}`;
            resolve(new File([blob], name, { type: mime }));
          },
          mime,
          quality
        );
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}
