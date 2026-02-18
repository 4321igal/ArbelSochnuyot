import type { ProductListStatus } from '../../lib/api/products';

export interface FilterTabsProps {
  value: ProductListStatus;
  onChange: (status: ProductListStatus) => void;
  showDeletedTab: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
}

const TABS: { value: ProductListStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'all', label: 'All' },
];

export function FilterTabs({
  value,
  onChange,
  showDeletedTab,
  search = '',
  onSearchChange,
}: FilterTabsProps) {
  const tabs = showDeletedTab ? TABS : TABS.filter((t) => t.value !== 'deleted');

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              value === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {onSearchChange && (
        <input
          type="search"
          placeholder="Search by title, SKU, brand..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      )}
    </div>
  );
}
