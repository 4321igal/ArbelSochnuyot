import { useState, useCallback, useEffect } from 'react';
import ProductHeader from './ProductHeader';
import SearchBar from './SearchBar';
import StatsSection from './StatsSection';
import ProductGrid from './ProductGrid';
import ProductTable from './ProductTable';
import AddProductModal from './AddProductModal';
import AddCategoryModal from './AddCategoryModal';
import EditProductModal from './EditProductModal';
import ImportCSVModal from './ImportCSVModal';
import ErrorBoundary from './ErrorBoundary';
import { useCSVImport } from './hooks/useCSVImport';
import type { Product as ManagerProductType, CreateProductDTO, Stats } from './types';
import {
  listProducts,
  listCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product as ApiProduct,
  type Category,
} from '@/lib/api/products';
import { uploadProductImage } from '@/lib/api/storage';

const initialFormData: CreateProductDTO = {
  rawName: '',
  rawDescription: '',
  categoryId: '',
  barcode: '',
};

function mapApiToManager(api: ApiProduct, categoryName: string): ManagerProductType {
  const firstImage = api.images?.[0];
  return {
    id: api.id,
    rawName: api.title,
    rawDescription: api.description ?? undefined,
    category: categoryName,
    categoryId: api.categoryId,
    image: firstImage ?? '',
    status: api.isActive ? 'ready' : 'pending',
    confidence: api.isActive ? 1 : 0,
    createdAt: api.createdAt ?? new Date().toISOString(),
    barcode: api.sku ?? undefined,
  };
}

function ManagerProductContent() {
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ManagerProductType | null>(null);
  const [formData, setFormData] = useState<CreateProductDTO>(initialFormData);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadType, setImageUploadType] = useState<'upload' | 'url'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    csvFile,
    importPreview,
    csvHeaders,
    csvRows,
    onCSVUpload,
    selectNew,
    reset: resetCSV,
  } = useCSVImport();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        listProducts({ limit: 100 }),
        listCategories(),
      ]);
      setApiProducts(productsRes.items);
      setCategories(categoriesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינה נכשלה');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const products: ManagerProductType[] = apiProducts.map((p) =>
    mapApiToManager(p, categoryMap.get(p.categoryId) ?? p.categoryId)
  );

  const stats: Stats = {
    total: products.length,
    ready: products.filter((p) => p.status === 'ready').length,
    pending: products.filter((p) => p.status === 'pending').length,
    avgConfidence:
      products.length > 0
        ? Math.round(
            (products.reduce((s, p) => s + (p.confidence || 0), 0) / products.length) * 100
          )
        : 0,
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !searchTerm ||
      p.rawName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleRunAI = useCallback((id: string) => {
    setApiProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isActive: true } : p
      )
    );
    updateProduct(id, { isActive: true }).then(() => loadData()).catch(console.error);
  }, [loadData]);

  const handleEdit = useCallback((product: ManagerProductType) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('האם למחוק מוצר?')) return;
      try {
        await deleteProduct(id);
        await loadData();
      } catch (err) {
        console.error(err);
        alert('מחיקה נכשלה');
      }
    },
    [loadData]
  );

  const handleAddProduct = useCallback(() => {
    setFormData(initialFormData);
    setImagePreview(null);
    setImageUrl('');
    setImageUploadType('upload');
    setImageFile(null);
    setShowAddModal(true);
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  const handleImageUpload = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleAdd = useCallback(async () => {
    const name = formData.rawName.trim();
    if (!name) {
      alert('נא להזין שם מוצר.');
      return;
    }
    if (categoryOptions.length === 0) {
      alert('אין קטגוריות במערכת. נא ליצור קטגוריה קודם (אדמין → קטגוריות).');
      return;
    }
    if (!formData.categoryId) {
      alert('נא לבחור קטגוריה מהרשימה.');
      return;
    }
    setIsSaving(true);
    try {
      const images: string[] = imageUploadType === 'url' && imageUrl ? [imageUrl] : [];
      const created = await createProduct({
        title: formData.rawName,
        description: formData.rawDescription ?? undefined,
        categoryId: formData.categoryId,
        price: 0,
        currency: 'ILS',
        stockQty: 0,
        isActive: true,
        isFeatured: false,
        images: images.length ? images : undefined,
        sku: formData.barcode || undefined,
      });
      if (imageUploadType === 'upload' && imageFile) {
        const { key } = await uploadProductImage(created.id, imageFile);
        await updateProduct(created.id, { images: [key] });
      }
      setShowAddModal(false);
      setFormData(initialFormData);
      setImagePreview(null);
      setImageUrl('');
      setImageFile(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'הוספת מוצר נכשלה');
    } finally {
      setIsSaving(false);
    }
  }, [formData, imageUrl, imageUploadType, imageFile, loadData]);

  const handleUpdate = useCallback(
    async () => {
      if (!selectedProduct) return;
      setIsSaving(true);
      try {
        await updateProduct(selectedProduct.id, {
          title: selectedProduct.rawName,
          description: selectedProduct.rawDescription ?? undefined,
          categoryId: selectedProduct.categoryId ?? undefined,
          sku: selectedProduct.barcode || undefined,
        });
        setShowEditModal(false);
        setSelectedProduct(null);
        await loadData();
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : 'שמירת שינויים נכשלה');
      } finally {
        setIsSaving(false);
      }
    },
    [selectedProduct, loadData]
  );

  const handleImport = useCallback(async () => {
    if (importPreview.length === 0) return;
    setIsSaving(true);
    try {
      const categoryId = categories[0]?.id ?? formData.categoryId;
      if (!categoryId) {
        alert('נא ליצור קטגוריה קודם');
        return;
      }
      for (const item of importPreview) {
        await createProduct({
          title: item.rawName || item.name || 'ללא שם',
          description: (item.rawDescription ?? item.description) ?? undefined,
          categoryId,
          price: 0,
          currency: 'ILS',
          stockQty: 0,
          isActive: false,
          isFeatured: false,
          sku: item.barcode ?? undefined,
        });
      }
      setShowImportModal(false);
      resetCSV();
      await loadData();
    } catch (err) {
      console.error(err);
      alert('יבוא נכשל');
    } finally {
      setIsSaving(false);
    }
  }, [importPreview, categories, formData.categoryId, resetCSV, loadData]);

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <ProductHeader onAddProduct={handleAddProduct} onImportCSV={() => setShowImportModal(true)} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <StatsSection stats={stats} />
        <SearchBar
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onSearchChange={setSearchTerm}
          onStatusChange={setFilterStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        {viewMode === 'grid' ? (
          <ProductGrid
            products={filteredProducts}
            onRunAI={handleRunAI}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            onRunAI={handleRunAI}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AddProductModal
        isOpen={showAddModal}
        formData={formData}
        categories={categoryOptions}
        imagePreview={imagePreview}
        imageUrl={imageUrl}
        imageUploadType={imageUploadType}
        onFormDataChange={setFormData}
        onImagePreviewChange={(preview) => {
          setImagePreview(preview);
          if (!preview) setImageFile(null);
        }}
        onImageUrlChange={setImageUrl}
        onImageUploadTypeChange={setImageUploadType}
        onImageUpload={handleImageUpload}
        onAdd={handleAdd}
        isSaving={isSaving}
        onAddCategory={() => setShowAddCategoryModal(true)}
        onClose={() => {
          setShowAddModal(false);
          setImagePreview(null);
          setImageUrl('');
          setImageFile(null);
        }}
      />

      <AddCategoryModal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        onCreated={(categoryId) => {
          setShowAddCategoryModal(false);
          loadData().then(() => setFormData((prev) => ({ ...prev, categoryId })));
        }}
      />

      <EditProductModal
        isOpen={showEditModal}
        product={selectedProduct}
        categories={categoryOptions}
        onProductChange={(p) => setSelectedProduct(p)}
        onUpdate={handleUpdate}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onRunAI={handleRunAI}
        isSaving={isSaving}
      />

      <ImportCSVModal
        isOpen={showImportModal}
        csvFile={csvFile}
        importPreview={importPreview}
        csvHeaders={csvHeaders}
        csvRows={csvRows}
        onCSVUpload={onCSVUpload}
        onImport={handleImport}
        onClose={() => {
          setShowImportModal(false);
          resetCSV();
        }}
        onSelectNew={selectNew}
      />
    </div>
  );
}

export default function ManagerProduct() {
  return (
    <ErrorBoundary>
      <ManagerProductContent />
    </ErrorBoundary>
  );
}
