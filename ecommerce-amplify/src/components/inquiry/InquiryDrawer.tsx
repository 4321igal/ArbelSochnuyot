import { useEffect } from 'react';
import { X } from 'lucide-react';
import { InquiryForm } from './InquiryForm';
import type { InquirySource } from '@/lib/api/inquiries';

interface Props {
  open: boolean;
  onClose: () => void;
  vehicleId?: string;
  vehicleLabel?: string;
  source?: InquirySource;
}

export function InquiryDrawer({ open, onClose, vehicleId, vehicleLabel, source }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="סגור"
      />
      <aside className="relative ms-auto w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto animate-slide-down">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 className="font-bold text-brand-900 text-lg">צור קשר</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <InquiryForm
            vehicleId={vehicleId}
            vehicleLabel={vehicleLabel}
            source={source}
          />
        </div>
      </aside>
    </div>
  );
}
