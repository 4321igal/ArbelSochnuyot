import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

export interface Vehicle {
  id: string;
  makeId: string;
  modelName: string;
  trim?: string;
  year: number;
  bodyTypeId?: string;
  price: number;
  listPrice?: number;
  currency?: string;
  mileage?: number;
  transmission?: string;
  fuelType?: string;
  enginePower?: number;
  engineCapacity?: number;
  driveType?: string;
  color?: string;
  interiorColor?: string;
  doors?: number;
  seats?: number;
  hand?: number;
  previousOwners?: number;
  accidentFree?: boolean;
  status?: string;
  isFeatured?: boolean;
  condition?: string;
  description?: string;
  features?: string[];
  images?: string[];
  branchLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Make {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface VehicleSearchMeta {
  id: string;
  vehicleId: string;
  aiSummary?: string;
  aiHighlights?: string[];
  aiSEO?: string;
  confidence?: number;
  language: string;
  lastEnrichedAt?: string;
  enrichmentVersion: number;
  createdAt?: string;
  updatedAt: string;
}

export interface Inquiry {
  id: string;
  vehicleId?: string;
  userId?: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredContactMethod?: string;
  message?: string;
  interestedInTestDrive?: boolean;
  interestedInFinancing?: boolean;
  tradeInDescription?: string;
  status: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

const getTableName = (model: string): string => {
  return process.env[`${model.toUpperCase()}_TABLE_NAME`] || model;
};

export function createDynamoDBClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({});
  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

export async function getVehicle(
  client: DynamoDBDocumentClient,
  vehicleId: string,
): Promise<Vehicle | null> {
  const result = await client.send(
    new GetCommand({ TableName: getTableName('Vehicle'), Key: { id: vehicleId } }),
  );
  return (result.Item as Vehicle) || null;
}

export async function getMake(
  client: DynamoDBDocumentClient,
  makeId: string,
): Promise<Make | null> {
  const result = await client.send(
    new GetCommand({ TableName: getTableName('Make'), Key: { id: makeId } }),
  );
  return (result.Item as Make) || null;
}

export async function upsertVehicleSearchMeta(
  client: DynamoDBDocumentClient,
  meta: VehicleSearchMeta,
): Promise<VehicleSearchMeta> {
  await client.send(
    new PutCommand({
      TableName: getTableName('VehicleSearchMeta'),
      Item: { ...meta, createdAt: meta.createdAt || new Date().toISOString() },
    }),
  );
  return meta;
}

export async function putInquiry(
  client: DynamoDBDocumentClient,
  inquiry: Inquiry,
): Promise<Inquiry> {
  await client.send(
    new PutCommand({ TableName: getTableName('Inquiry'), Item: inquiry }),
  );
  return inquiry;
}
