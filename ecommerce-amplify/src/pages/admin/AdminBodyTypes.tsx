import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Edit2, Save, X } from 'lucide-react';
import { listBodyTypes, createBodyType, updateBodyType, deleteBodyType, type BodyType } from '@/lib/api/bodyTypes';

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-֐-׿]/g, '');
}

export function AdminBodyTypes() {
  const [items, setItems] = useState<BodyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listBodyTypes(false));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = () => {
    setEditingId(null);
    setAdding(false);
    setName('');
    setSlug('');
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const finalSlug = slug.trim() || slugify(name);
      if (editingId) {
        await updateBodyType(editingId, { name: name.trim(), slug: finalSlug });
      } else {
        await createBodyType({ name: name.trim(), slug: finalSlug });
      }
      cancel();
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'שמירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (b: BodyType) => {
    if (!confirm(`למחוק את "${b.name}"?`)) return;
    setBusy(true);
    try {
      await deleteBodyType(b.id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'מחיקה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-gray-500">{items.length} סוגי רכב</h2>
        {!adding && !editingId && (
          <button type="button" onClick={() => { setAdding(true); setName(''); setSlug(''); }} className="btn-accent">
            <Plus className="w-4 h-4" />
            הוסף סוג
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600">
        סוגי רכב משמשים לפילטור (סדאן, ג'יפון, האצ'בק, קופה, מסחרית, קומבי וכו').
      </p>

      {(adding || editingId) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">שם</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingId && (!slug || slug === slugify(name))) setSlug(slugify(e.target.value));
              }}
              autoFocus
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="label">Slug</label>
            <input type="text" className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleSave} disabled={busy} className="btn-accent">
              <Save className="w-4 h-4" />
              שמור
            </button>
            <button type="button" onClick={cancel} className="btn-secondary">
              <X className="w-4 h-4" />
              ביטול
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand-700" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-10">עדיין לא הוספו סוגי רכב</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 font-medium">שם</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-brand-900">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{b.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditingId(b.id); setName(b.name); setSlug(b.slug); }}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
