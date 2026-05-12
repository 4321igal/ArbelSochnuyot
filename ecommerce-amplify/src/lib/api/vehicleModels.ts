import { client } from '../amplify/client';

export interface VehicleModel {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const HE_MAP: Record<string, string> = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'ch',
  ט: 't', י: 'y', כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n',
  ן: 'n', ס: 's', ע: 'a', פ: 'p', ף: 'p', צ: 'tz', ץ: 'tz', ק: 'q',
  ר: 'r', ש: 'sh', ת: 't',
  "'": '', '"': '', '׳': '', '״': '',
};

export function toModelSlug(input: string): string {
  const trimmed = String(input ?? '').trim().toLowerCase();
  const transliterated = Array.from(trimmed)
    .map((ch) => (HE_MAP[ch] !== undefined ? HE_MAP[ch] : ch))
    .join('');
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function mapModel(m: any): VehicleModel {
  return {
    id: m.id,
    makeId: m.makeId,
    name: m.name,
    slug: m.slug,
    sortOrder: m.sortOrder ?? 0,
    isActive: m.isActive ?? true,
    createdAt: m.createdAt ?? null,
    updatedAt: m.updatedAt ?? null,
  };
}

export async function listModelsByMake(
  makeId: string,
  activeOnly = true,
): Promise<VehicleModel[]> {
  if (!makeId) return [];
  const filter: Record<string, unknown> = { makeId: { eq: makeId } };
  if (activeOnly) filter.isActive = { eq: true };

  const { data } = await client.models.VehicleModel.list({ filter, limit: 500 });
  return (data || [])
    .map(mapModel)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'he'));
}

export async function listAllModels(): Promise<VehicleModel[]> {
  const items: VehicleModel[] = [];
  let nextToken: string | undefined;
  do {
    const { data, nextToken: nt } = await client.models.VehicleModel.list({
      limit: 500,
      nextToken,
    });
    items.push(...(data || []).map(mapModel));
    nextToken = nt ?? undefined;
  } while (nextToken);
  return items;
}

export async function createVehicleModel(input: {
  makeId: string;
  name: string;
  sortOrder?: number;
}): Promise<VehicleModel> {
  const name = input.name.trim();
  if (!name) throw new Error('שם הדגם חסר');
  if (!input.makeId) throw new Error('יצרן חסר');

  const slug = toModelSlug(name);
  const res = (await client.models.VehicleModel.create({
    makeId: input.makeId,
    name,
    slug,
    sortOrder: input.sortOrder ?? 0,
    isActive: true,
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  if (res.errors?.length || !data) {
    throw new Error(res.errors?.[0]?.message || 'יצירת הדגם נכשלה');
  }
  return mapModel(data);
}

export async function updateVehicleModel(
  id: string,
  input: Partial<Omit<VehicleModel, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<VehicleModel> {
  const { data, errors } = await client.models.VehicleModel.update({ id, ...input });
  if (errors || !data) throw new Error('עדכון הדגם נכשל');
  return mapModel(data);
}

export async function deleteVehicleModel(id: string): Promise<void> {
  const { errors } = await client.models.VehicleModel.delete({ id });
  if (errors) throw new Error('מחיקת הדגם נכשלה');
}
