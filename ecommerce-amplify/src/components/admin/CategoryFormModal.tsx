import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import {
  createCategory,
  updateCategory,
  categorySlugExists,
  type Category,
} from '@/lib/api/products';
import { uploadCategoryImage } from '@/lib/api/storage';

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-\u0590-\u05FF]/g, '');
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingCategory: Category | null;
  allCategories: Category[];
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSaved,
  editingCategory,
  allCategories,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!editingCategory;

  const levelMap = useMemo(() => {
    const byId = new Map(allCategories.map((c) => [c.id, c]));
    const map = new Map<string, number>();
    function getLevel(id: string, visited = new Set<string>()): number {
      if (visited.has(id)) return 0;
      visited.add(id);
      const cat = byId.get(id);
      if (!cat?.parentId) return 0;
      return 1 + getLevel(cat.parentId, visited);
    }
    allCategories.forEach((c) => map.set(c.id, getLevel(c.id)));
    return map;
  }, [allCategories]);

  const descendantIds = useMemo(() => {
    if (!editingCategory) return new Set<string>();
    const set = new Set<string>();
    const byParent = new Map<string | null, Category[]>();
    allCategories.forEach((c) => {
      const p = c.parentId ?? null;
      if (!byParent.has(p)) byParent.set(p, []);
      byParent.get(p)!.push(c);
    });
    function collect(id: string) {
      set.add(id);
      for (const child of byParent.get(id) ?? []) {
        collect(child.id);
      }
    }
    for (const child of byParent.get(editingCategory.id) ?? []) {
      collect(child.id);
    }
    return set;
  }, [editingCategory, allCategories]);

  const parentOptions = useMemo(() => {
    return allCategories.filter((c) => {
      if (c.id === editingCategory?.id) return false;
      if (editingCategory && descendantIds.has(c.id)) return false;
      return true;
    });
  }, [allCategories, editingCategory, descendantIds]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setImageFile(null);
    setImagePreview(null);
    setImageMode('url');
    if (editingCategory) {
      setName(editingCategory.name);
      setSlug(editingCategory.slug);
      setDescription(editingCategory.description ?? '');
      setParentId(editingCategory.parentId ?? '');
      setImageUrl(editingCategory.imageUrl ?? '');
      setSortOrder(editingCategory.sortOrder);
      setIsActive(editingCategory.isActive);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setParentId('');
      setImageUrl('');
      setSortOrder(0);
      setIsActive(true);
    }
  }, [isOpen, editingCategory]);

  const handleNameChange = useCallback((v: string) => {
    setName(v);
    if (!isEdit) setSlug(slugFromName(v));
  }, [isEdit]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const nameTrim = name.trim();
      const slugTrim = slug.trim() || slugFromName(nameTrim);
      if (!nameTrim) {
        setError('Category name is required.');
        return;
      }
      if (!slugTrim) {
        setError('Slug is required.');
        return;
      }
      const slugExists = await categorySlugExists(slugTrim, editingCategory?.id ?? undefined);
      if (slugExists) {
        setError('This slug is already used by another category.');
        return;
      }
      setSaving(true);
      try {
        let finalImageUrl = imageMode === 'url' ? (imageUrl || undefined) : undefined;

        if (editingCategory) {
          const categoryId = editingCategory.id;
          await updateCategory(categoryId, {
            name: nameTrim,
            slug: slugTrim,
            description: description || undefined,
            parentId: parentId || undefined,
            imageUrl: finalImageUrl,
            sortOrder,
            isActive,
          });
          if (imageMode === 'upload' && imageFile) {
            const { url } = await uploadCategoryImage(categoryId, imageFile);
            await updateCategory(categoryId, { imageUrl: url });
          }
        } else {
          const created = await createCategory({
            name: nameTrim,
            slug: slugTrim,
            description: description || undefined,
            parentId: parentId || undefined,
            imageUrl: finalImageUrl,
            sortOrder,
            isActive,
          });
          if (imageMode === 'upload' && imageFile) {
            const { url } = await uploadCategoryImage(created.id, imageFile);
            await updateCategory(created.id, { imageUrl: url });
          }
        }
        onSaved();
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [
      name,
      slug,
      description,
      parentId,
      imageUrl,
      imageMode,
      imageFile,
      sortOrder,
      isActive,
      editingCategory,
      onSaved,
      onClose,
    ]
  );

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.).');
      return;
    }
    setImageFile(file);
    setImageUrl('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">URL identifier; must be unique.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">— None (root) —</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {'—'.repeat(levelMap.get(c.id) ?? 0)} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setImageMode('url');
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  imageMode === 'url'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageMode('upload');
                  setImageUrl('');
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  imageMode === 'upload'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                גרור / העלה תמונה
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-32 rounded object-contain"
                      />
                      <span className="text-sm text-gray-600">{imageFile?.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileSelect(null);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        הסר תמונה
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-2" size={36} />
                      <p className="text-sm text-gray-600">גרור תמונה לכאן או לחץ לבחירה</p>
                      <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                min={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={isActive ? 'active' : 'disabled'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
