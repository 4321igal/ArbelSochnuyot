import { Package, Check, AlertCircle, TrendingUp } from 'lucide-react';
import type { Stats } from './types';

interface StatsSectionProps {
  stats: Stats;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Products */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">סך הכל מוצרים</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
          </div>
          <Package className="text-purple-600" size={32} />
        </div>
      </div>
      
      {/* Ready Products */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">מוכנים לפרסום</p>
            <p className="text-2xl font-bold text-green-600">{stats.ready || 0}</p>
          </div>
          <Check className="text-green-600" size={32} />
        </div>
      </div>

      {/* Pending Products */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">ממתינים לניתוח</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
          </div>
          <AlertCircle className="text-yellow-600" size={32} />
        </div>
      </div>

      {/* Average Confidence */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">ביטחון ממוצע</p>
            <p className="text-2xl font-bold text-blue-600">{stats.avgConfidence || 0}%</p>
          </div>
          <TrendingUp className="text-blue-600" size={32} />
        </div>
      </div>
    </div>
  );
}
