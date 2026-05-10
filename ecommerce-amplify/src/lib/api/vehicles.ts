import { client, type PaginationOptions, type PaginatedResult } from '../amplify/client';

export type VehicleStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'HIDDEN';
export type VehicleCondition = 'NEW' | 'USED' | 'DEMO';
export type Transmission = 'AUTO' | 'MANUAL' | 'DSG' | 'CVT';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'PLUGIN_HYBRID' | 'LPG';
export type DriveType = 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';

export interface Vehicle {
  id: string;
  makeId: string;
  modelName: string;
  trim?: string | null;
  year: number;
  bodyTypeId?: string | null;
  price: number;
  listPrice?: number | null;
  currency: string;
  mileage?: number | null;
  transmission?: Transmission | null;
  fuelType?: FuelType | null;
  enginePower?: number | null;
  engineCapacity?: number | null;
  driveType?: DriveType | null;
  color?: string | null;
  interiorColor?: string | null;
  doors?: number | null;
  seats?: number | null;
  vin?: string | null;
  plateNumber?: string | null;
  firstRegistrationDate?: string | null;
  hand?: number | null;
  previousOwners?: number | null;
  accidentFree?: boolean | null;
  inspectionExpiryDate?: string | null;
  status: VehicleStatus;
  isFeatured: boolean;
  condition?: VehicleCondition | null;
  description?: string | null;
  features?: (string | null)[] | null;
  images?: (string | null)[] | null;
  branchLocation?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface VehicleFilters {
  makeId?: string;
  bodyTypeId?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageMax?: number;
  transmission?: Transmission;
  fuelType?: FuelType;
  hand?: number;
  accidentFree?: boolean;
  search?: string;
  status?: VehicleStatus | 'ALL';
}

export type VehicleSortBy = 'priceAsc' | 'priceDesc' | 'yearDesc' | 'yearAsc' | 'mileageAsc' | 'newest';

function mapVehicle(v: any): Vehicle {
  return {
    id: v.id,
    makeId: v.makeId,
    modelName: v.modelName,
    trim: v.trim ?? null,
    year: v.year,
    bodyTypeId: v.bodyTypeId ?? null,
    price: v.price ?? 0,
    listPrice: v.listPrice ?? null,
    currency: v.currency ?? 'ILS',
    mileage: v.mileage ?? null,
    transmission: v.transmission ?? null,
    fuelType: v.fuelType ?? null,
    enginePower: v.enginePower ?? null,
    engineCapacity: v.engineCapacity ?? null,
    driveType: v.driveType ?? null,
    color: v.color ?? null,
    interiorColor: v.interiorColor ?? null,
    doors: v.doors ?? null,
    seats: v.seats ?? null,
    vin: v.vin ?? null,
    plateNumber: v.plateNumber ?? null,
    firstRegistrationDate: v.firstRegistrationDate ?? null,
    hand: v.hand ?? null,
    previousOwners: v.previousOwners ?? null,
    accidentFree: v.accidentFree ?? null,
    inspectionExpiryDate: v.inspectionExpiryDate ?? null,
    status: v.status ?? 'AVAILABLE',
    isFeatured: v.isFeatured ?? false,
    condition: v.condition ?? null,
    description: v.description ?? null,
    features: v.features ?? null,
    images: v.images ?? null,
    branchLocation: v.branchLocation ?? null,
    createdAt: v.createdAt ?? null,
    updatedAt: v.updatedAt ?? null,
    deletedAt: v.deletedAt ?? null,
  };
}

export async function listVehicles(
  filters?: VehicleFilters & PaginationOptions & { sortBy?: VehicleSortBy },
): Promise<PaginatedResult<Vehicle>> {
  const filter: Record<string, unknown> = {};

  if (filters?.makeId) filter.makeId = { eq: filters.makeId };
  if (filters?.bodyTypeId) filter.bodyTypeId = { eq: filters.bodyTypeId };
  if (filters?.transmission) filter.transmission = { eq: filters.transmission };
  if (filters?.fuelType) filter.fuelType = { eq: filters.fuelType };
  if (filters?.hand != null) filter.hand = { eq: filters.hand };
  if (filters?.accidentFree != null) filter.accidentFree = { eq: filters.accidentFree };

  const status = filters?.status ?? 'AVAILABLE';
  if (status !== 'ALL') {
    filter.status = { eq: status };
  }

  const limit = filters?.limit || 24;

  const { data, nextToken } = await client.models.Vehicle.list({
    filter: Object.keys(filter).length ? filter : undefined,
    limit: Math.min(limit * 3, 200),
    nextToken: filters?.nextToken,
  });

  let items = (data || []).map(mapVehicle).filter((v) => v.deletedAt == null);

  if (filters?.yearFrom != null) items = items.filter((v) => v.year >= filters.yearFrom!);
  if (filters?.yearTo != null) items = items.filter((v) => v.year <= filters.yearTo!);
  if (filters?.priceFrom != null) items = items.filter((v) => v.price >= filters.priceFrom!);
  if (filters?.priceTo != null) items = items.filter((v) => v.price <= filters.priceTo!);
  if (filters?.mileageMax != null) {
    items = items.filter((v) => v.mileage == null || v.mileage <= filters.mileageMax!);
  }

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (v) =>
        v.modelName.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.trim?.toLowerCase().includes(q) ||
        v.features?.some((f) => f?.toLowerCase().includes(q)),
    );
  }

  switch (filters?.sortBy) {
    case 'priceAsc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'yearAsc':
      items.sort((a, b) => a.year - b.year);
      break;
    case 'yearDesc':
      items.sort((a, b) => b.year - a.year);
      break;
    case 'mileageAsc':
      items.sort((a, b) => (a.mileage ?? Infinity) - (b.mileage ?? Infinity));
      break;
    case 'newest':
    default:
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  return {
    items: items.slice(0, limit),
    nextToken: items.length > limit ? nextToken : undefined,
  };
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, errors } = await client.models.Vehicle.get({ id });
  if (errors || !data) return null;
  return mapVehicle(data);
}

export async function listFeaturedVehicles(limit = 8): Promise<Vehicle[]> {
  const { data } = await client.models.Vehicle.list({
    filter: { isFeatured: { eq: true }, status: { eq: 'AVAILABLE' } },
    limit,
  });
  return (data || []).map(mapVehicle).filter((v) => v.deletedAt == null);
}

export async function listVehiclesByIds(ids: string[]): Promise<Vehicle[]> {
  if (!ids.length) return [];
  const results = await Promise.all(ids.map((id) => getVehicle(id)));
  return results.filter((v): v is Vehicle => v != null);
}

export async function createVehicle(
  input: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Vehicle> {
  const res = (await client.models.Vehicle.create({
    ...input,
    images: input.images?.filter((img): img is string => img != null),
    features: input.features?.filter((f): f is string => f != null),
  })) as { data?: unknown; errors?: { message?: string }[] };
  const data = Array.isArray(res.data) ? res.data[0] : res.data;
  if (res.errors?.length || !data) {
    throw new Error(res.errors?.[0]?.message || 'יצירת הרכב נכשלה');
  }
  return mapVehicle(data);
}

export async function updateVehicle(
  id: string,
  input: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<Vehicle> {
  const { data, errors } = await client.models.Vehicle.update({
    id,
    ...input,
    images: input.images?.filter((img): img is string => img != null),
    features: input.features?.filter((f): f is string => f != null),
  });
  if (errors || !data) throw new Error('עדכון הרכב נכשל');
  return mapVehicle(data);
}

export async function deleteVehicle(id: string): Promise<void> {
  const { errors } = await client.models.Vehicle.delete({ id });
  if (errors) throw new Error('מחיקת הרכב נכשלה');
}

export async function softDeleteVehicle(id: string): Promise<Vehicle> {
  return updateVehicle(id, {
    deletedAt: new Date().toISOString(),
  } as Partial<Vehicle>) as unknown as Vehicle;
}

export interface VehicleSearchMeta {
  id: string;
  vehicleId: string;
  aiSummary?: string | null;
  aiHighlights?: (string | null)[] | null;
  aiSEO?: string | null;
  confidence?: number | null;
  language: string;
  lastEnrichedAt?: string | null;
}

export async function getVehicleSearchMeta(vehicleId: string): Promise<VehicleSearchMeta | null> {
  const { data } = await client.models.VehicleSearchMeta.list({
    filter: { vehicleId: { eq: vehicleId } },
    limit: 1,
  });
  if (!data?.length) return null;
  const m = data[0] as any;
  return {
    id: m.id,
    vehicleId: m.vehicleId,
    aiSummary: m.aiSummary ?? null,
    aiHighlights: m.aiHighlights ?? null,
    aiSEO: m.aiSEO ?? null,
    confidence: m.confidence ?? null,
    language: m.language ?? 'he',
    lastEnrichedAt: m.lastEnrichedAt ?? null,
  };
}

export async function enrichVehicle(vehicleId: string): Promise<VehicleSearchMeta | null> {
  const res = (await client.mutations.enrichVehicleMutation({ vehicleId })) as { data?: unknown };
  if (!res?.data) return null;
  const m = res.data as any;
  return {
    id: m.id,
    vehicleId: m.vehicleId,
    aiSummary: m.aiSummary ?? null,
    aiHighlights: m.aiHighlights ?? null,
    aiSEO: m.aiSEO ?? null,
    confidence: m.confidence ?? null,
    language: m.language ?? 'he',
    lastEnrichedAt: m.lastEnrichedAt ?? null,
  };
}
