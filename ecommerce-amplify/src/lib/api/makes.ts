import { client } from '../amplify/client';

export interface Make {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function mapMake(m: any): Make {
  return {
    id: m.id,
    name: m.name,
    slug: m.slug,
    logoUrl: m.logoUrl ?? null,
    sortOrder: m.sortOrder ?? 0,
    isActive: m.isActive ?? true,
    createdAt: m.createdAt ?? null,
    updatedAt: m.updatedAt ?? null,
  };
}

export async function listMakes(activeOnly = true): Promise<Make[]> {
  const { data } = await client.models.Make.list({
    filter: activeOnly ? { isActive: { eq: true } } : undefined,
    limit: 200,
  });
  return (data || [])
    .map(mapMake)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'he'));
}

export async function getMake(id: string): Promise<Make | null> {
  const { data } = await client.models.Make.get({ id });
  return data ? mapMake(data) : null;
}

export async function getMakeBySlug(slug: string): Promise<Make | null> {
  const { data } = await client.models.Make.list({ filter: { slug: { eq: slug } }, limit: 1 });
  return data?.length ? mapMake(data[0]) : null;
}

export async function createMake(input: {
  name: string;
  slug: string;
  logoUrl?: string;
  sortOrder?: number;
}): Promise<Make> {
  const res = (await client.models.Make.create({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    logoUrl: input.logoUrl,
    sortOrder: input.sortOrder ?? 0,
    isActive: true,
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  if (res.errors?.length || !data) {
    throw new Error(res.errors?.[0]?.message || 'יצירת היצרן נכשלה');
  }
  return mapMake(data);
}

export async function updateMake(id: string, input: Partial<Make>): Promise<Make> {
  const { data, errors } = await client.models.Make.update({ id, ...input });
  if (errors || !data) throw new Error('עדכון היצרן נכשל');
  return mapMake(data);
}

export async function deleteMake(id: string): Promise<void> {
  const { errors } = await client.models.Make.delete({ id });
  if (errors) throw new Error('מחיקת היצרן נכשלה');
}
