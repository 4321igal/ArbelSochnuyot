import type { ProductListStatus } from '../../lib/api/products';

export interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  status: ProductListStatus;
  isAdmin: boolean;
  onBulkSoftDelete: () => void;
  onBulkRestore: () => void;
  onBulkHardDelete: () => void;
  loading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  status,
  isAdmin,
  onBulkSoftDelete,
  onBulkRestore,
  onBulkHardDelete,
  loading = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const inDeletedView = status === 'deleted';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <span className="font-medium text-indigo-900">{selectedCount} selected</span>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-sm text-indigo-600 hover:text-indigo-800"
      >
        Clear
      </button>
      <span className="text-gray-400">|</span>
      {!inDeletedView && (
        <button
          type="button"
          onClick={onBulkSoftDelete}
          disabled={loading}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Soft delete'}
        </button>
      )}
      {inDeletedView && isAdmin && (
        <>
          <button
            type="button"
            onClick={onBulkRestore}
            disabled={loading}
            className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Restoring…' : 'Restore'}
          </button>
          <button
            type="button"
            onClick={onBulkHardDelete}
            disabled={loading}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting…' : 'Permanent delete'}
          </button>
        </>
      )}
    </div>
  );
}
