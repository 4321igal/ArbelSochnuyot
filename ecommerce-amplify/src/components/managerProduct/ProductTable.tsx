import { RefreshCw, Edit2, Trash2 } from 'lucide-react';
import type { Product } from './types';

interface ProductTableProps {
  products: Product[];
  onRunAI: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({ products, onRunAI, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קטגוריה</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ביטחון</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map(product => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={product.image} 
                    alt={product.rawName}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48/cccccc/ffffff?text=?'}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{product.rawName}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
                  {product.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  product.status === 'ready' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {product.status === 'ready' ? 'מוכן' : 'ממתין'}
                </span>
              </td>
              <td className="px-6 py-4">
                {product.confidence > 0 ? (
                  <span className="text-sm font-medium">{(product.confidence * 100).toFixed(0)}%</span>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(product.createdAt).toLocaleDateString('he-IL')}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {product.status === 'pending' && (
                    <button
                      onClick={() => onRunAI(product.id)}
                      className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
