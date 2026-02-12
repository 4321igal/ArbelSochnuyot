// This file is deprecated - use ProductManagementPage.tsx instead
export default function ProductManagement() {
  return null;
}

    setAiRunning(true);
    setTimeout(() => {
      setProducts(products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            status: 'ready',
            aiDescription: `תיאור שיווקי מעודכן עבור ${p.rawName}`,
            aiTags: ['עדכני', 'מומלץ', p.category],
            aiSEO: `${p.rawName} | מוצר חדש`,
            confidence: 0.85 + Math.random() * 0.15,
            targetAudience: 'קהל כללי'
          };
        }
        return p;
      }));
      setAiRunning(false);
    }, 2000);
  };

  const deleteProduct = (id) => {
    if (confirm('האם למחוק מוצר?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ניהול מוצרים</h1>
              <p className="text-sm text-gray-500 mt-1">נהל את קטלוג המוצרים שלך עם AI</p>
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
              <Plus size={20} />
              הוסף מוצר
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סך הכל מוצרים</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="text-purple-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">מוכנים לפרסום</p>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              </div>
              <Check className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ממתינים לניתוח</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ביטחון ממוצע</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgConfidence}%</p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חפש מוצר, קטגוריה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="ready">מוכן לפרסום</option>
              <option value="pending">ממתין לניתוח</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.rawName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300/cccccc/ffffff?text=No+Image';
                  }}
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
                      onClick={() => runAI(product.id)}
                      disabled={aiRunning}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={aiRunning ? 'animate-spin' : ''} />
                      הרץ AI
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowEditModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                    >
                      <Eye size={16} />
                      צפה
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowEditModal(true);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showEditModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded-lg max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
                <h2 className="text-xl font-bold">עריכת מוצר: {selectedProduct.rawName}</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedProduct(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">נתונים בגולמיים</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">תמונת מוצר</label>
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={selectedProduct.image} 
                          alt={selectedProduct.rawName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">שם מוצר</label>
                      <input
                        type="text"
                        value={selectedProduct.rawName}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בגולמי</label>
                      <textarea
                        value={selectedProduct.rawDescription}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="3"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="font-bold text-lg">תוצרי AI</h3>
                      {selectedProduct.confidence > 0 && (
                        <span className="text-sm text-gray-600">
                          ביטחון: {(selectedProduct.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {selectedProduct.status === 'pending' ? (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
                        <p className="text-gray-600 mb-4">המוצר טרם נותח</p>
                        <button
                          onClick={() => runAI(selectedProduct.id)}
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
                            value={selectedProduct.aiDescription}
                            className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                            rows="4"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">תגיות</label>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.aiTags.map((tag, idx) => (
                              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t mt-6">
                  <button 
                    onClick={() => {
                      alert('שינויים נשמרו!');
                      setShowEditModal(false);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    שמור שינויים
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedProduct(null);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}