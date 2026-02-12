import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export default function SearchBar({
  searchTerm,
  filterStatus,
  onSearchChange,
  onStatusChange,
  viewMode,
  onViewModeChange
}: SearchBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="חפש מוצר, קטגוריה..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="ready">מוכן לפרסום</option>
          <option value="pending">ממתין לניתוח</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
          >
            רשת
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'table' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100'}`}
          >
            טבלה
          </button>
        </div>
      </div>
    </div>
  );
}
