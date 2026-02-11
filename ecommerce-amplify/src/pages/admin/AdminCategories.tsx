/**
 * Admin Categories Page
 */
export function AdminCategories() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          + Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">
          Category management - Coming soon!
        </p>
      </div>
    </div>
  );
}
