import { RefreshCw, Edit2, Trash2, Eye } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';
import type { Product } from './types';

interface ProductGridProps {
  products: Product[];
  onRunAI: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductGrid({ products, onRunAI, onEdit, onDelete }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
            <StorageImage
              keyOrUrl={product.image || null}
              alt={product.rawName}
              className="w-full h-full object-cover"
            />
            {product.isOverridden && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                נערך
              </div>
            )}
          </div>
          
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{product.rawName}</h3>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
                  {product.category}
                </span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                product.status === 'ready' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {product.status === 'ready' ? 'מוכן' : 'ממתין'}
              </div>
            </div>

            {product.confidence > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600">רמת ביטחון AI</span>
                  <span className="font-medium">{(product.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${product.confidence * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {product.status === 'pending' ? (
                <button
                  onClick={() => onRunAI(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:shadow-lg transition-all"
                >
                  <RefreshCw size={16} />
                  הרץ AI
                </button>
              ) : (
                <button
                  onClick={() => onEdit(product)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  <Eye size={16} />
                  צפה
                </button>
              )}
              
              <button
                onClick={() => onEdit(product)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Edit2 size={16} />
              </button>
              
              <button
                onClick={() => onDelete(product.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
