import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getProduct, 
  createProduct, 
  updateProduct, 
  listCategories,
  type Product, 
  type Category 
} from '../../lib/api/products';
import { uploadProductImages, getImageUrl } from '../../lib/api/storage';
import { client } from '../../lib/amplify/client';

/**
 * Admin Product Form - Create/Edit
 */
export function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    compareAtPrice: 0,
    categoryId: '',
    brand: '',
    sku: '',
    barcode: '',
    stockQty: 0,
    isActive: true,
    isFeatured: false,
    images: [] as string[],
    tags: [] as string[],
    attributes: {} as Record<string, string>,
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await listCategories();
        setCategories(cats);

        if (isEdit && id) {
          const product = await getProduct(id);
          if (product) {
            setFormData({
              title: product.title,
              description: product.description || '',
              price: product.price,
              compareAtPrice: product.compareAtPrice || 0,
              categoryId: product.categoryId,
              brand: product.brand || '',
              sku: product.sku || '',
              barcode: '',
              stockQty: product.stockQty,
              isActive: product.isActive,
              isFeatured: product.isFeatured,
              images: (product.images?.filter(Boolean) || []) as string[],
              tags: (product.tags?.filter(Boolean) || []) as string[],
              attributes: (product.attributes || {}) as Record<string, string>,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addAttribute = () => {
    if (newAttrKey.trim() && newAttrValue.trim()) {
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          [newAttrKey.trim()]: newAttrValue.trim(),
        },
      }));
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  const removeAttribute = (key: string) => {
    setFormData(prev => {
      const { [key]: _, ...rest } = prev.attributes;
      return { ...prev, attributes: rest };
    });
  };

  const handleAIEnrich = async () => {
    if (!id) return;

    setIsEnriching(true);
    try {
      await client.mutations.enrichProductMutation({ productId: id });
      alert('Product enriched successfully! Refresh to see AI-generated content.');
    } catch (error) {
      console.error('AI enrichment failed:', error);
      alert('AI enrichment failed. Check console for details.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.categoryId || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let images = [...formData.images];

      // Upload new images
      if (newImages.length > 0) {
        const productId = id || `temp-${Date.now()}`;
        const uploaded = await uploadProductImages(productId, newImages);
        images = [...images, ...uploaded.map(u => u.url)];
      }

      const productData = {
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price,
        compareAtPrice: formData.compareAtPrice || undefined,
        categoryId: formData.categoryId,
        brand: formData.brand || undefined,
        sku: formData.sku || undefined,
        stockQty: formData.stockQty,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        images,
        tags: formData.tags,
        attributes: Object.keys(formData.attributes).length > 0 ? formData.attributes : undefined,
        currency: 'ILS',
      };

      if (isEdit && id) {
        await updateProduct(id, productData);
      } else {
        await createProduct(productData);
      }

      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add Product'}
        </h1>
        {isEdit && (
          <button
            onClick={handleAIEnrich}
            disabled={isEnriching}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400"
          >
            {isEnriching ? 'Enriching...' : '🤖 AI Enrich'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing & Inventory</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₪) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price
              </label>
              <input
                type="number"
                name="compareAtPrice"
                value={formData.compareAtPrice || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stockQty"
                value={formData.stockQty}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">Active (visible in store)</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Images</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Existing images */}
            {formData.images.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx, false)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* New images preview */}
            {newImages.map((file, idx) => (
              <div key={`new-${idx}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx, true)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Upload button */}
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-600">
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs text-gray-500">Add Image</span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Tags</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-600">×</button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Attributes */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Attributes</h2>
          
          <div className="space-y-2 mb-4">
            {Object.entries(formData.attributes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{key}:</span>
                <span className="text-gray-600">{value}</span>
                <button
                  type="button"
                  onClick={() => removeAttribute(key)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAttrKey}
              onChange={(e) => setNewAttrKey(e.target.value)}
              placeholder="Key (e.g., Color)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              value={newAttrValue}
              onChange={(e) => setNewAttrValue(e.target.value)}
              placeholder="Value (e.g., Red)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addAttribute}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
