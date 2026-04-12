import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, Eye, EyeOff, Sparkles, Save, Rocket, RotateCcw } from 'lucide-react';

import type { HomePageTemplate, HomePageSection, AIContentRequest, AIMode, LayoutSettings } from '@/homepage/types/models';
import { getSectionDefinition, listSectionDefinitions } from '@/homepage/registry/sectionRegistry';
import { createEmptySection } from '@/homepage/builder/HomePageTemplateBuilder';
import { newSectionId } from '@/homepage/utils/ids';
import { HomePageRenderer } from '@/homepage/rendering/HomePageRenderer';
import {
  getHomepageDraft,
  saveHomepageDraft,
  publishHomepage,
  validateHomepageApi,
  generateHomepageSectionAi,
  rollbackHomepageDraft,
} from '@/lib/api/homepageApi';
import { listFeaturedProducts, listTopLevelCategories, type Product, type Category } from '@/lib/api/products';
import { useAuth } from '@/lib/auth/AuthContext';

function DynamicSectionPreview({ section }: { section: HomePageSection }) {
  const Comp = getSectionDefinition(section.type).Preview;
  return <Comp section={section} compact />;
}

function SortableRow({
  section,
  selected,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  section: HomePageSection;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg border p-2 mb-2 bg-white ${
        selected ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-gray-200'
      } ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <button type="button" className="touch-none text-gray-400 hover:text-gray-600 p-1" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </button>
      <button type="button" className="flex-1 text-left min-w-0" onClick={onSelect}>
        <div className="font-medium text-gray-900 truncate">{section.title || section.type}</div>
        <div className="text-xs text-gray-500 truncate">{getSectionDefinition(section.type).label}</div>
      </button>
      <button
        type="button"
        title={section.enabled ? 'השבת' : 'הפעל'}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 text-gray-500 hover:text-gray-800"
      >
        {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button type="button" className="p-1 text-gray-500 hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
        <Copy className="w-4 h-4" />
      </button>
      <button type="button" className="p-1 text-gray-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function AdminHomePageManagement() {
  const { userAttributes, isAdmin, isLoading: authLoading } = useAuth();
  const userId = userAttributes?.email ?? userAttributes?.sub;

  const [template, setTemplate] = useState<HomePageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validation, setValidation] = useState<Awaited<ReturnType<typeof validateHomepageApi>> | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<'section' | 'full'>('section');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [aiBrief, setAiBrief] = useState('');
  const [aiMode, setAiMode] = useState<AIMode>('generate_from_brief');
  const [aiBusy, setAiBusy] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const showToast = useCallback((type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      try {
        const t = await getHomepageDraft();
        if (!c) {
          setTemplate(t);
          setSelectedId(t.sections[0]?.id ?? null);
        }
      } catch (e) {
        if (!c) showToast('err', e instanceof Error ? e.message : 'טעינה נכשלה');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [showToast]);

  useEffect(() => {
    let c = false;
    (async () => {
      setDataLoading(true);
      try {
        const [cats, prods] = await Promise.all([listTopLevelCategories(24), listFeaturedProducts(16)]);
        if (!c) {
          setCategories(cats);
          setProducts(prods);
        }
      } catch {
        if (!c) {
          setCategories([]);
          setProducts([]);
        }
      } finally {
        if (!c) setDataLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const sortedSections = useMemo(() => {
    if (!template) return [];
    return [...template.sections].sort((a, b) => a.order - b.order);
  }, [template]);

  const selected = sortedSections.find((s) => s.id === selectedId) ?? null;

  const updateSection = useCallback((id: string, next: HomePageSection) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? next : s)),
        metadata: { ...prev.metadata, updatedAt: new Date().toISOString() },
      };
    });
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    if (!template) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextOrder = arrayMove(sortedSections, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setTemplate({
      ...template,
      sections: nextOrder,
      metadata: { ...template.metadata, updatedAt: new Date().toISOString() },
    });
  };

  const saveDraft = async () => {
    if (!template) return;
    setSaving(true);
    try {
      const v = await validateHomepageApi(template);
      setValidation(v);
      if (!v.ok) {
        showToast('err', 'יש שגיאות אימות — בדקו את הרשימה');
        return;
      }
      const saved = await saveHomepageDraft(template, userId);
      setTemplate(saved);
      showToast('ok', 'טיוטה נשמרה');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'שמירה נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!template) return;
    setPublishing(true);
    try {
      const v = await validateHomepageApi(template);
      setValidation(v);
      if (!v.ok) {
        showToast('err', 'לא ניתן לפרסם — תקנו שגיאות');
        return;
      }
      await saveHomepageDraft(template, userId);
      const { draft } = await publishHomepage(userId);
      setTemplate(draft);
      setValidation(null);
      showToast('ok', 'פורסם בהצלחה');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'פרסום נכשל');
    } finally {
      setPublishing(false);
    }
  };

  const addSection = (type: HomePageSection['type']) => {
    if (!template) return;
    const id = newSectionId();
    const order = template.sections.length;
    const sec = createEmptySection(type, order, id);
    setTemplate({
      ...template,
      sections: [...template.sections, sec],
      metadata: { ...template.metadata, updatedAt: new Date().toISOString() },
    });
    setSelectedId(id);
  };

  const duplicateSection = (id: string) => {
    if (!template) return;
    const src = template.sections.find((s) => s.id === id);
    if (!src) return;
    const nid = newSectionId();
    const copy: HomePageSection = {
      ...JSON.parse(JSON.stringify(src)) as HomePageSection,
      id: nid,
      title: `${src.title} (עותק)`,
      order: template.sections.length,
    };
    setTemplate({
      ...template,
      sections: [...template.sections, copy],
      metadata: { ...template.metadata, updatedAt: new Date().toISOString() },
    });
    setSelectedId(nid);
  };

  const deleteSection = (id: string) => {
    if (!template) return;
    if (!window.confirm('למחוק מקטע?')) return;
    const next = template.sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }));
    setTemplate({ ...template, sections: next, metadata: { ...template.metadata, updatedAt: new Date().toISOString() } });
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  };

  const toggleSection = (id: string) => {
    if (!template) return;
    setTemplate({
      ...template,
      sections: template.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      metadata: { ...template.metadata, updatedAt: new Date().toISOString() },
    });
  };

  const runAi = async () => {
    if (!template || !selected) return;
    setAiBusy(true);
    try {
      const req: AIContentRequest = {
        mode: aiMode,
        sectionId: selected.id,
        sectionType: selected.type,
        businessBrief: aiBrief,
        scope: 'section',
        currentContent: selected.content,
        aiSettings: selected.aiSettings,
        locale: selected.aiSettings.primaryLocale === 'en' ? 'en' : selected.aiSettings.primaryLocale === 'both' ? 'both' : 'he',
      };
      const res = await generateHomepageSectionAi(selected.id, req);
      if (res.mergedContent) {
        setTemplate((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === selected.id ? { ...s, content: res.mergedContent as Record<string, unknown> } : s,
            ),
            metadata: { ...prev.metadata, updatedAt: new Date().toISOString() },
          };
        });
      }
      showToast('ok', res.warnings?.length ? `הושלם (הערה: ${res.warnings[0]})` : 'תוכן נוצר');
    } catch (e) {
      showToast('err', e instanceof Error ? e.message : 'AI נכשל');
    } finally {
      setAiBusy(false);
    }
  };

  const Editor = selected ? getSectionDefinition(selected.type).Editor : () => null;

  if (authLoading || loading || !template) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <p className="text-red-600">אין הרשאה</p>;
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)] min-h-[560px]">
      {toast ? (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-2 rounded shadow text-white ${toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">ניהול דף הבית</h2>
          <p className="text-sm text-gray-500">
            גרסה {template.metadata.version} · עודכן {new Date(template.metadata.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            שמור טיוטה
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={publishing}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            פרסם
          </button>
        </div>
      </div>

      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {validation.errors.map((e, i) => (
            <div key={`e-${i}`} className="text-red-700">
              {e.sectionId ? `[${e.sectionId}] ` : ''}
              {e.message}
            </div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`w-${i}`} className="text-amber-800">
              {w.sectionId ? `[${w.sectionId}] ` : ''}
              {w.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Left: list */}
        <aside className="lg:col-span-3 flex flex-col min-h-0 border border-gray-200 rounded-lg bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-800">מקטעים</span>
            <select
              className="text-sm border rounded px-2 py-1 max-w-[140px]"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as HomePageSection['type'] | '';
                e.target.value = '';
                if (v) addSection(v);
              }}
            >
              <option value="">+ הוסף</option>
              {listSectionDefinitions().map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sortedSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {sortedSections.map((s) => (
                  <SortableRow
                    key={s.id}
                    section={s}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                    onToggle={() => toggleSection(s.id)}
                    onDuplicate={() => duplicateSection(s.id)}
                    onDelete={() => deleteSection(s.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          {template.metadata.history && template.metadata.history.length > 0 ? (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="text-xs text-gray-500">שחזור גרסה</label>
              <div className="flex gap-1 mt-1">
                <select className="flex-1 text-xs border rounded px-1 py-1" id="rollback-ver">
                  {template.metadata.history.map((h) => (
                    <option key={h.version} value={h.version}>
                      {h.label ?? `v${h.version}`} — {new Date(h.savedAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="p-1 border rounded text-gray-600 hover:bg-gray-50"
                  title="שחזר טיוטה"
                  onClick={async () => {
                    const el = document.getElementById('rollback-ver') as HTMLSelectElement | null;
                    const v = Number(el?.value);
                    if (!v) return;
                    try {
                      const t = await rollbackHomepageDraft(v);
                      setTemplate(t);
                      showToast('ok', 'טיוטה שוחזרה');
                    } catch (e) {
                      showToast('err', e instanceof Error ? e.message : 'שגיאה');
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        {/* Center: editor */}
        <main className="lg:col-span-5 flex flex-col min-h-0 border border-gray-200 rounded-lg bg-white p-4 overflow-y-auto">
          {selected ? (
            <>
              <div className="flex flex-wrap gap-2 items-center mb-4">
                <input
                  className="flex-1 min-w-[200px] border rounded px-3 py-2 font-medium"
                  value={selected.title}
                  onChange={(e) => updateSection(selected.id, { ...selected, title: e.target.value })}
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selected.enabled}
                    onChange={() => toggleSection(selected.id)}
                  />
                  פעיל
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500">רוחב מיכל</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm mt-1"
                    value={selected.styling.containerMaxWidth ?? '7xl'}
                    onChange={(e) =>
                      updateSection(selected.id, {
                        ...selected,
                        styling: { ...selected.styling, containerMaxWidth: e.target.value as LayoutSettings['containerMaxWidth'] },
                      })
                    }
                  >
                    <option value="full">מלא</option>
                    <option value="7xl">7xl</option>
                    <option value="5xl">5xl</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">ריווח אנכי</label>
                  <select
                    className="w-full border rounded px-2 py-1 text-sm mt-1"
                    value={selected.styling.sectionPaddingY ?? 'md'}
                    onChange={(e) =>
                      updateSection(selected.id, {
                        ...selected,
                        styling: { ...selected.styling, sectionPaddingY: e.target.value as LayoutSettings['sectionPaddingY'] },
                      })
                    }
                  >
                    <option value="none">ללא</option>
                    <option value="sm">קטן</option>
                    <option value="md">בינוני</option>
                    <option value="lg">גדול</option>
                    <option value="xl">מלא</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <Editor section={selected} onChange={(next) => updateSection(selected.id, next)} />
              </div>

              <div className="mt-6 border border-indigo-100 rounded-lg p-3 bg-indigo-50/50">
                <div className="flex items-center gap-2 text-indigo-800 font-medium mb-2">
                  <Sparkles className="w-4 h-4" />
                  AI
                </div>
                <div className="space-y-2">
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    rows={2}
                    placeholder="תאר את העסק בקצרה (ליצירת תוכן)"
                    value={aiBrief}
                    onChange={(e) => setAiBrief(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value as AIMode)}
                    >
                      <option value="generate_from_brief">יצירה מתיאור</option>
                      <option value="rewrite">ניסוח מחדש</option>
                      <option value="seo_headline">כותרת SEO</option>
                      <option value="cta">CTA</option>
                      <option value="promotional">קידום</option>
                      <option value="tone_adapt">התאמת טון</option>
                      <option value="translate_he">תרגום לעברית</option>
                      <option value="translate_en">תרגום לאנגלית</option>
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={selected.aiSettings.primaryLocale ?? 'he'}
                      onChange={(e) =>
                        updateSection(selected.id, {
                          ...selected,
                          aiSettings: { ...selected.aiSettings, primaryLocale: e.target.value as 'he' | 'en' | 'both' },
                        })
                      }
                    >
                      <option value="he">עברית</option>
                      <option value="en">English</option>
                      <option value="both">שניהם</option>
                    </select>
                    <button
                      type="button"
                      disabled={aiBusy}
                      onClick={runAi}
                      className="bg-indigo-600 text-white text-sm px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {aiBusy ? '...' : 'הפעל'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    שדות נעולים (fieldLocks) לא יוחלפו. בפרודקשן יש לחבר מודל אמיתי.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500">בחרו מקטע מהרשימה או הוסיפו חדש.</p>
          )}
        </main>

        {/* Right: preview */}
        <section className="lg:col-span-4 flex flex-col min-h-0 border border-gray-200 rounded-lg bg-gray-50 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-800">תצוגה מקדימה</span>
            <div className="flex rounded border border-gray-200 bg-white text-xs overflow-hidden">
              <button
                type="button"
                className={`px-2 py-1 ${previewMode === 'section' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => setPreviewMode('section')}
              >
                מקטע
              </button>
              <button
                type="button"
                className={`px-2 py-1 ${previewMode === 'full' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => setPreviewMode('full')}
              >
                דף מלא
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 rounded border border-gray-200 bg-white">
            {template && (
              <div className="p-2">
                {previewMode === 'full' ? (
                  <HomePageRenderer
                    template={template}
                    context={{ categories, featuredProducts: products, isLoading: dataLoading }}
                  />
                ) : selected ? (
                  <DynamicSectionPreview section={selected} />
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
