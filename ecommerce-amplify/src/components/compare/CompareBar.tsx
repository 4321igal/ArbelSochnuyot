import { Link } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { useCompare, COMPARE_MAX } from '@/lib/compare/CompareContext';

export function CompareBar() {
  const { vehicleIds, remove, clear } = useCompare();

  if (vehicleIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-brand-900 text-white shadow-2xl border-t border-accent-500">
      <div className="container-wide py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm shrink-0">
            <GitCompare className="w-5 h-5 text-accent-400" />
            <span className="font-medium">{vehicleIds.length} מתוך {COMPARE_MAX} להשוואה</span>
          </div>

          <div className="flex-1 flex flex-wrap gap-2">
            {vehicleIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => remove(id)}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-xs px-2 py-1 rounded"
                title="הסר"
              >
                <X className="w-3 h-3" />
                <span className="font-mono">{id.slice(-6)}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clear}
            className="text-xs text-white/70 hover:text-white"
          >
            נקה הכל
          </button>

          <Link
            to="/compare"
            className="btn-accent text-sm"
          >
            צפה בהשוואה
          </Link>
        </div>
      </div>
    </div>
  );
}
