import { Loader2, Upload, Trash2, Star } from 'lucide-react';
import { Section } from '../../FormPrimitives';
import type { StepProps } from '../types';
import { StorageImage } from '@/components/StorageImage';
import { uploadVehicleImages } from '@/lib/api/storage';
import { updateVehicle } from '@/lib/api/vehicles';

interface Props extends StepProps {
  vehicleId: string | null;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export function Step5Images({
  data,
  vehicleId,
  uploading,
  setUploading,
  setField,
  setError,
}: Props) {
  const images = (data.images ?? []).filter((k): k is string => !!k);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!vehicleId) {
      setError('יש להשלים את שלב 1 לפני העלאת תמונות');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const results = await uploadVehicleImages(vehicleId, files);
      const newKeys = results.map((r) => r.key);
      const updated = [...images, ...newKeys];
      await updateVehicle(vehicleId, { images: updated });
      setField('images', updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'העלאה נכשלה');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setField('images', next);
    if (vehicleId) {
      try {
        await updateVehicle(vehicleId, { images: next });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'מחיקה נכשלה');
      }
    }
  };

  const setPrimary = async (idx: number) => {
    if (idx === 0) return;
    const next = [images[idx], ...images.filter((_, i) => i !== idx)];
    setField('images', next);
    if (vehicleId) {
      try {
        await updateVehicle(vehicleId, { images: next });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'עדכון נכשל');
      }
    }
  };

  return (
    <Section title="תמונות הרכב">
      {!vehicleId ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          יש להשלים את שלב 1 (זיהוי הרכב) לפני העלאת תמונות.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            התמונה הראשונה (עם דגל הכוכב) תוצג כתמונה ראשית בכרטיס הרכב.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
            {images.map((key, idx) => {
              const isPrimary = idx === 0;
              return (
                <div
                  key={`${key}-${idx}`}
                  className={`relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group border-2 ${
                    isPrimary ? 'border-accent-500' : 'border-transparent'
                  }`}
                >
                  <StorageImage
                    keyOrUrl={key}
                    alt={`תמונה ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {isPrimary && (
                    <div className="absolute top-2 start-2 bg-accent-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      ראשית
                    </div>
                  )}
                  <div className="absolute top-2 end-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimary(idx)}
                        className="p-1.5 bg-white/95 rounded-full hover:bg-white text-accent-600"
                        title="הפוך לראשית"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1.5 bg-white/95 rounded-full hover:bg-white text-red-600"
                      title="הסר"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            <label className="aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-brand-500 hover:text-brand-700 cursor-pointer">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs">הוסף תמונות</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-xs text-gray-500">
            סה"כ {images.length} תמונות. תמונות נשמרות מיידית ל-S3.
          </p>
        </>
      )}
    </Section>
  );
}
