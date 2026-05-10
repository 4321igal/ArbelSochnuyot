import { client } from '../amplify/client';

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'CLOSED_LOST';
export type ContactMethod = 'PHONE' | 'EMAIL' | 'WHATSAPP';
export type InquirySource = 'VEHICLE_PAGE' | 'HOMEPAGE_HERO' | 'CONTACT_PAGE' | 'COMPARE_PAGE';

export interface Inquiry {
  id: string;
  vehicleId?: string | null;
  userId?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  preferredContactMethod?: ContactMethod | null;
  message?: string | null;
  interestedInTestDrive?: boolean | null;
  interestedInFinancing?: boolean | null;
  tradeInDescription?: string | null;
  status: InquiryStatus;
  assignedTo?: string | null;
  notes?: string | null;
  source?: InquirySource | null;
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string | null;
}

export interface CreateInquiryInput {
  vehicleId?: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredContactMethod?: ContactMethod;
  message?: string;
  interestedInTestDrive?: boolean;
  interestedInFinancing?: boolean;
  tradeInDescription?: string;
  source?: InquirySource;
}

function mapInquiry(i: any): Inquiry {
  return {
    id: i.id,
    vehicleId: i.vehicleId ?? null,
    userId: i.userId ?? null,
    fullName: i.fullName,
    phone: i.phone,
    email: i.email ?? null,
    preferredContactMethod: i.preferredContactMethod ?? null,
    message: i.message ?? null,
    interestedInTestDrive: i.interestedInTestDrive ?? false,
    interestedInFinancing: i.interestedInFinancing ?? false,
    tradeInDescription: i.tradeInDescription ?? null,
    status: i.status ?? 'NEW',
    assignedTo: i.assignedTo ?? null,
    notes: i.notes ?? null,
    source: i.source ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    lastContactedAt: i.lastContactedAt ?? null,
  };
}

export async function createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
  const res = (await client.mutations.createInquiryMutation({
    vehicleId: input.vehicleId,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    preferredContactMethod: input.preferredContactMethod,
    message: input.message,
    interestedInTestDrive: input.interestedInTestDrive,
    interestedInFinancing: input.interestedInFinancing,
    tradeInDescription: input.tradeInDescription,
    source: input.source,
  })) as { data?: unknown; errors?: { message?: string }[] };

  if (!res?.data) {
    const errMsg = res?.errors?.[0]?.message || 'שליחת הפנייה נכשלה';
    throw new Error(errMsg);
  }
  return mapInquiry(res.data);
}

export async function listMyInquiries(userId: string): Promise<Inquiry[]> {
  const { data } = await client.models.Inquiry.list({
    filter: { userId: { eq: userId } },
    limit: 100,
  });
  return (data || [])
    .map(mapInquiry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listAllInquiries(filters?: {
  status?: InquiryStatus | 'ALL';
  vehicleId?: string;
  search?: string;
}): Promise<Inquiry[]> {
  const filter: Record<string, unknown> = {};
  if (filters?.status && filters.status !== 'ALL') {
    filter.status = { eq: filters.status };
  }
  if (filters?.vehicleId) filter.vehicleId = { eq: filters.vehicleId };

  const { data } = await client.models.Inquiry.list({
    filter: Object.keys(filter).length ? filter : undefined,
    limit: 200,
  });
  let items = (data || []).map(mapInquiry);

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.fullName.toLowerCase().includes(q) ||
        i.phone.includes(q) ||
        i.email?.toLowerCase().includes(q),
    );
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const { data } = await client.models.Inquiry.get({ id });
  return data ? mapInquiry(data) : null;
}

export async function updateInquiry(
  id: string,
  input: Partial<Pick<Inquiry, 'status' | 'assignedTo' | 'notes' | 'lastContactedAt'>>,
): Promise<Inquiry> {
  const { data, errors } = await client.models.Inquiry.update({ id, ...input });
  if (errors || !data) throw new Error('עדכון הפנייה נכשל');
  return mapInquiry(data);
}
