import { client } from '../amplify/client';

export interface BodyType {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

function mapBodyType(b: any): BodyType {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    iconUrl: b.iconUrl ?? null,
    sortOrder: b.sortOrder ?? 0,
    isActive: b.isActive ?? true,
  };
}

export async function listBodyTypes(activeOnly = true): Promise<BodyType[]> {
  const { data } = await client.models.BodyType.list({
    filter: activeOnly ? { isActive: { eq: true } } : undefined,
    limit: 50,
  });
  return (data || [])
    .map(mapBodyType)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'he'));
}

export async function createBodyType(input: {
  name: string;
  slug: string;
  iconUrl?: string;
  sortOrder?: number;
}): Promise<BodyType> {
  const res = (await client.models.BodyType.create({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    iconUrl: input.iconUrl,
    sortOrder: input.sortOrder ?? 0,
    isActive: true,
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  if (res.errors?.length || !data) {
    throw new Error(res.errors?.[0]?.message || 'יצירת סוג רכב נכשלה');
  }
  return mapBodyType(data);
}

export async function updateBodyType(id: string, input: Partial<BodyType>): Promise<BodyType> {
  const { data, errors } = await client.models.BodyType.update({ id, ...input });
  if (errors || !data) throw new Error('עדכון סוג רכב נכשל');
  return mapBodyType(data);
}

export async function deleteBodyType(id: string): Promise<void> {
  const { errors } = await client.models.BodyType.delete({ id });
  if (errors) throw new Error('מחיקת סוג רכב נכשלה');
}
