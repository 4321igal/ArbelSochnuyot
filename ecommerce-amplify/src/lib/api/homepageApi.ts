/**
 * Mock homepage CMS API — mirrors REST shape for future Amplify/Lambda wiring.
 * GET /api/homepage | PUT /api/homepage/draft | POST /api/homepage/publish | ...
 */

import type {
  HomePageTemplate,
  HomePageValidationResult,
  AIContentRequest,
  AIContentResponse,
  TemplateVersionSnapshot,
} from '@/homepage/types/models';
import exampleRaw from '@/data/exampleHomepageTemplate.json';
import { validateTemplate } from '@/homepage/validation/validateTemplate';
import { listSectionDefinitions } from '@/homepage/registry/sectionRegistry';
import { runAiContentGeneration, mergeAiPatchIntoSectionContent } from '@/homepage/ai/aiContentService';
const LS_KEY = 'ecommerce_homepage_cms_v1';

interface Persisted {
  draft: HomePageTemplate;
  published: HomePageTemplate | null;
  history: TemplateVersionSnapshot[];
}

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeTemplate(raw: unknown): HomePageTemplate {
  const t = raw as HomePageTemplate;
  return {
    ...t,
    metadata: {
      ...t.metadata,
      version: t.metadata?.version ?? 1,
      createdAt: t.metadata?.createdAt ?? nowIso(),
      updatedAt: t.metadata?.updatedAt ?? nowIso(),
      status: t.metadata?.status ?? t.status ?? 'draft',
      history: t.metadata?.history ?? [],
    },
  };
}

const exampleTemplate = exampleRaw as HomePageTemplate;

function defaultPersisted(): Persisted {
  const base = normalizeTemplate(exampleTemplate);
  return {
    draft: clone(base),
    published: null,
    history: [],
  };
}

function attachHistory(t: HomePageTemplate, history: TemplateVersionSnapshot[]): HomePageTemplate {
  return { ...t, metadata: { ...t.metadata, history } };
}

function readStore(): Persisted {
  if (typeof localStorage === 'undefined') return defaultPersisted();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultPersisted();
    const p = JSON.parse(raw) as Persisted;
    if (!p?.draft?.sections) return defaultPersisted();
    return {
      draft: normalizeTemplate(p.draft),
      published: p.published ? normalizeTemplate(p.published) : null,
      history: Array.isArray(p.history) ? p.history : [],
    };
  } catch {
    return defaultPersisted();
  }
}

function writeStore(p: Persisted) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(p));
}

/** GET /api/homepage — public storefront: published, else draft fallback */
export async function getHomepage(): Promise<HomePageTemplate> {
  await delay();
  const s = readStore();
  const t = s.published ?? s.draft;
  return clone(attachHistory(t, s.history));
}

/** Admin: current draft */
export async function getHomepageDraft(): Promise<HomePageTemplate> {
  await delay();
  const s = readStore();
  return clone(attachHistory(s.draft, s.history));
}

/** PUT /api/homepage/draft */
export async function saveHomepageDraft(template: HomePageTemplate, userId?: string): Promise<HomePageTemplate> {
  await delay();
  const s = readStore();
  const nextMeta = {
    ...template.metadata,
    updatedAt: nowIso(),
    createdBy: template.metadata.createdBy ?? userId,
    version: template.metadata.version,
  };
  const draft: HomePageTemplate = {
    ...template,
    status: 'draft',
    metadata: { ...nextMeta, status: 'draft', history: s.history },
  };
  s.draft = draft;
  writeStore(s);
  return clone(attachHistory(draft, s.history));
}

/** POST /api/homepage/publish */
export async function publishHomepage(userId?: string): Promise<{ published: HomePageTemplate; draft: HomePageTemplate }> {
  await delay();
  const s = readStore();
  const current = s.draft;
  const v = current.metadata.version;
  const snap: TemplateVersionSnapshot = {
    version: v,
    savedAt: nowIso(),
    savedBy: userId,
    label: `v${v}`,
    template: clone(current),
  };
  const published: HomePageTemplate = {
    ...current,
    status: 'published',
    metadata: {
      ...current.metadata,
      status: 'published',
      publishedAt: nowIso(),
      updatedAt: nowIso(),
      createdBy: current.metadata.createdBy ?? userId,
    },
  };
  const nextDraft: HomePageTemplate = {
    ...clone(published),
    status: 'draft',
    metadata: {
      ...published.metadata,
      status: 'draft',
      version: published.metadata.version + 1,
      updatedAt: nowIso(),
    },
  };

  s.history = [snap, ...s.history].slice(0, 15);
  s.published = published;
  const nextWithHistory: HomePageTemplate = {
    ...nextDraft,
    metadata: { ...nextDraft.metadata, history: s.history },
  };
  s.draft = nextWithHistory;
  writeStore(s);
  return {
    published: clone(attachHistory(published, s.history)),
    draft: clone(attachHistory(nextWithHistory, s.history)),
  };
}

/** Rollback draft to a snapshot (does not auto-publish) */
export async function rollbackHomepageDraft(version: number): Promise<HomePageTemplate> {
  await delay();
  const s = readStore();
  const snap = s.history.find((h) => h.version === version);
  if (!snap) throw new Error(`Version ${version} not found`);
  s.draft = clone(snap.template);
  writeStore(s);
  return clone(attachHistory(s.draft, s.history));
}

/** POST /api/homepage/validate */
export async function validateHomepageApi(template: HomePageTemplate): Promise<HomePageValidationResult> {
  await delay();
  return validateTemplate(template);
}

/** GET /api/homepage/section-types */
export async function getHomepageSectionTypes() {
  await delay();
  return listSectionDefinitions().map((d) => ({
    type: d.type,
    label: d.label,
    description: d.description,
    aiEnabledFields: d.aiEnabledFields,
    defaultConfig: d.defaultConfig,
    defaultContent: d.defaultContent,
  }));
}

/** POST /api/homepage/sections/:id/ai-generate */
export async function generateHomepageSectionAi(
  sectionId: string,
  body: AIContentRequest,
): Promise<AIContentResponse & { mergedContent?: Record<string, unknown> }> {
  await delay();
  const s = readStore();
  const sec = s.draft.sections.find((x) => x.id === sectionId);
  if (!sec) throw new Error('Section not found');
  const res = await runAiContentGeneration(body);
  const merged = await mergeAiPatchIntoSectionContent(
    sec.content,
    res,
    sec.aiSettings.fieldLocks,
    body.forceReplaceFields,
  );
  return { ...res, mergedContent: merged };
}

function delay(ms = 120) {
  return new Promise((r) => setTimeout(r, ms));
}
