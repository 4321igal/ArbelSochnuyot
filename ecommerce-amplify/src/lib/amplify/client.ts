import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';

/**
 * Typed Amplify Data Client
 * 
 * Provides type-safe access to all GraphQL operations:
 * - client.models.Product.list()
 * - client.models.Product.get({ id })
 * - client.models.Product.create(data)
 * - etc.
 */
export const client = generateClient<Schema>();

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
