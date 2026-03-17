import { X, AlertCircle } from 'lucide-react';
import { StorageImage } from '@/components/StorageImage';
import type { Product } from './types';
import type { CategoryOption } from './AddProductModal';

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: CategoryOption[];
  onProductChange: (product: Product) => void;
  onUpdate: () => void;
  onClose: () => void;
  onRunAI: (id: string) => void;
  isSaving?: boolean;
}

export default function EditProductModal({
  isOpen,
  product,
  categories,
  onProductChange,
  onUpdate,
  onClose,
  onRunAI,
  isSaving = false
}: EditProductModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
          <h2 className="text-xl font-bold">עריכת מוצר: {product.rawName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2">נתונים בולמיים</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תמונת מוצר</label>
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <StorageImage
                    keyOrUrl={product.image || null}
                    alt={product.rawName}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר ברקוד</label>
                <input
                  type="text"
                  value={product.barcode || ''}
                  onChange={(e) => onProductChange({...product, barcode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="הזן מספר ברקוד"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם מוצר</label>
                <input
                  type="text"
                  value={product.rawName}
                  onChange={(e) => onProductChange({...product, rawName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בולמי</label>
                <textarea
                  value={product.rawDescription}
                  onChange={(e) => onProductChange({...product, rawDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                <select 
                  value={product.categoryId ?? ''}
                  onChange={(e) => {
                    const catId = e.target.value;
                    const catName = categories.find(c => c.id === catId)?.name ?? product.category;
                    onProductChange({...product, categoryId: catId, category: catName});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-lg">תוצרי AI</h3>
                {product.confidence > 0 && (
                  <span className="text-sm text-gray-600">
                    ביטחון: {(product.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {product.status === 'pending' ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
                  <p className="text-gray-600 mb-4">המוצר טרם נותח</p>
                  <button
                    onClick={() => onRunAI(product.id)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg"
                  >
                    הרץ ניתוח AI
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור שיווקי</label>
                    <textarea
                      value={product.aiDescription}
                      onChange={(e) => onProductChange({...product, aiDescription: e.target.value})}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תגיות</label>
                    <div className="flex flex-wrap gap-2">
                      {product.aiTags?.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SEO</label>
                    <input
                      type="text"
                      value={product.aiSEO}
                      onChange={(e) => onProductChange({...product, aiSEO: e.target.value})}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קהל יעד</label>
                    <input
                      type="text"
                      value={product.targetAudience}
                      onChange={(e) => onProductChange({...product, targetAudience: e.target.value})}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-white pb-6">
            <button 
              onClick={onUpdate}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
