import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';

interface Props {
  images: string[];
  alt: string;
}

export function VehicleGallery({ images, alt }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-[16/10] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        אין תמונות
      </div>
    );
  }

  const next = () => setActiveIdx((i) => (i + 1) % images.length);
  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);

  return (
    <>
      <div className="space-y-3">
        <div className="relative aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden group">
          <StorageImage
            keyOrUrl={images[activeIdx]}
            alt={`${alt} ${activeIdx + 1}`}
            className="w-full h-full object-cover cursor-zoom-in"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0"
            aria-label="הגדלה"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute top-1/2 -translate-y-1/2 start-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="קודם"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute top-1/2 -translate-y-1/2 end-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="הבא"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 end-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {activeIdx + 1} / {images.length}
              </div>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {images.map((key, idx) => (
              <button
                key={`${key}-${idx}`}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === activeIdx ? 'border-accent-500 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <StorageImage
                  keyOrUrl={key}
                  alt={`תצוגה ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 end-4 text-white p-2 hover:bg-white/10 rounded-full"
            aria-label="סגור"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-6xl max-h-[90vh] w-full">
            <StorageImage
              keyOrUrl={images[activeIdx]}
              alt={`${alt} ${activeIdx + 1}`}
              className="w-full h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute top-1/2 -translate-y-1/2 start-2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
                  aria-label="קודם"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute top-1/2 -translate-y-1/2 end-2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
                  aria-label="הבא"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
