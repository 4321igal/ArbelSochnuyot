import { defineStorage } from '@aws-amplify/backend';

/**
 * Amplify Storage Configuration
 * 
 * S3 bucket for:
 * - Product images: products/{productId}/{filename}
 * - Category images: categories/{categoryId}/{filename}
 * - User avatars: avatars/{userId}/{filename}
 * 
 * Access Rules:
 * - Admin: full access to all paths
 * - Authenticated users: read products/categories, write own avatar
 * - Guest: read products/categories only
 */
export const storage = defineStorage({
  name: 'ecommerceStorage',
  
  access: (allow) => ({
    // Product images - Admin write, everyone read
    'products/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    // Category images - Admin write, everyone read
    'categories/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    // User avatars - owner only
    'avatars/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read']),
    ],

    // Temp uploads - for processing
    'temp/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
