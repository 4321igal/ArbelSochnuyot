import React from 'react';
import { Link } from 'react-router-dom';
import { X, Image, Link2, Upload, AlertCircle } from 'lucide-react';
import type { CreateProductDTO } from './types';

export interface CategoryOption {
  id: string;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  formData: CreateProductDTO;
  categories: CategoryOption[];
  imagePreview: string | null;
  imageUrl: string;
  imageUploadType: 'upload' | 'url';
  onFormDataChange: (data: CreateProductDTO) => void;
  onImagePreviewChange: (preview: string | null) => void;
  onImageUrlChange: (url: string) => void;
  onImageUploadTypeChange: (type: 'upload' | 'url') => void;
  onImageUpload: (file: File) => void;
  onAdd: () => void;
  onClose: () => void;
  isSaving?: boolean;
  onAddCategory?: () => void;
}

export default function AddProductModal({
  isOpen,
  formData,
  categories,
  imagePreview,
  imageUrl,
  imageUploadType,
  onFormDataChange,
  onImagePreviewChange,
  onImageUrlChange,
  onImageUploadTypeChange,
  onImageUpload,
  onAdd,
  onClose,
  isSaving = false,
  onAddCategory
}: AddProductModalProps) {
  if (!isOpen) return null;

  const handleImageUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">הוסף מוצר חדש</h2>
          <button
            onClick={() => {
              onClose();
              onImagePreviewChange(null);
              onImageUrlChange('');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מספר ברקוד</label>
                <input
                  type="text"
                  value={formData.barcode || ''}
                  onChange={(e) => onFormDataChange({...formData, barcode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="הזן מספר ברקוד"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם מוצר *</label>
              <input
                type="text"
                value={formData.rawName}
                onChange={(e) => onFormDataChange({...formData, rawName: e.target.value})}
                placeholder="לדוגמה: נעלי ספורט Nike"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
              <textarea
                value={formData.rawDescription}
                onChange={(e) => onFormDataChange({...formData, rawDescription: e.target.value})}
                placeholder="תיאור קצר של המוצר"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">קטגוריה *</label>
                {onAddCategory && (
                  <button
                    type="button"
                    onClick={onAddCategory}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + הוסף קטגוריה
                  </button>
                )}
              </div>
              {categories.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  אין קטגוריות במערכת.
                  {onAddCategory ? (
                    <button type="button" onClick={onAddCategory} className="underline font-medium mr-1">
                      הוסף קטגוריה חדשה
                    </button>
                  ) : (
                    <>
                      נא ליצור קטגוריה קודם ב
                      <Link to="/admin/categories" className="underline font-medium mx-1" onClick={onClose}>אדמין → קטגוריות</Link>.
                    </>
                  )}
                </div>
              ) : (
                <select 
                  value={formData.categoryId}
                  onChange={(e) => onFormDataChange({...formData, categoryId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="">בחר קטגוריה</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונת מוצר</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => onImageUploadTypeChange('upload')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    imageUploadType === 'upload'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Image size={16} className="inline ml-2" />
                  העלה תמונה
                </button>
                <button
                  type="button"
                  onClick={() => onImageUploadTypeChange('url')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    imageUploadType === 'url'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Link2 size={16} className="inline ml-2" />
                  קישור לתמונה
                </button>
              </div>

              {imageUploadType === 'upload' ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUploadChange}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="block w-full p-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-contain" />
                        <p className="text-sm text-gray-600">לחץ להחלפת תמונה</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="mx-auto text-gray-400" size={32} />
                        <p className="text-sm text-gray-600">לחץ או גרור תמונה לכאן</p>
                        <p className="text-xs text-gray-400">PNG, JPG, WEBP עד 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => onImageUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-purple-600 flex-shrink-0" size={20} />
                <div className="text-sm text-purple-900">
                  <p className="font-medium mb-1">ניתוח AI אוטומטי</p>
                  <p className="text-purple-700">לאחר השמירה, המערכת תנתח אוטומטית את המוצר ותיצור תוכן שיווקי, תגיות ו-SEO.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={onAdd}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? 'שומר...' : 'הוסף מוצר'}
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
