/**
 * Types for manager product components (self-contained in this folder).
 */

export interface Product {
  id: string;
  rawName: string;
  rawDescription?: string;
  category: string;
  categoryId?: string;
  image: string;
  status: 'ready' | 'pending';
  confidence: number;
  createdAt: string;
  isOverridden?: boolean;
  barcode?: string;
  aiDescription?: string;
  aiTags?: string[];
  aiSEO?: string;
  targetAudience?: string;
}

export interface CreateProductDTO {
  rawName: string;
  rawDescription?: string;
  categoryId: string;
  barcode?: string;
}

export interface Stats {
  total: number;
  ready: number;
  pending: number;
  avgConfidence: number;
}

export interface CSVPreviewItem {
  rawName?: string;
  name?: string;
  rawDescription?: string;
  description?: string;
  category?: string;
  barcode?: string;
}
