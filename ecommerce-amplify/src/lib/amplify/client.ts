import { generateClient } from 'aws-amplify/data';

/**
 * Typed Amplify Data Client
 * 
 * Provides type-safe access to all GraphQL operations:
 * - client.models.Product.list()
 * - client.models.Product.get({ id })
 * - client.models.Product.create(data)
 * - etc.
 */
// Using `any` here to avoid coupling the frontend build to backend
// `amplify/*/resource.ts` types, which are meant for backend synthesis.
export const client = generateClient<any>();

/**
 * Pagination helper
 */
export interface PaginationOptions {
  limit?: number;
  nextToken?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextToken?: string | null;
}
