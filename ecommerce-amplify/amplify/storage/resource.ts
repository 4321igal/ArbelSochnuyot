import { defineStorage } from '@aws-amplify/backend';

/**
 * Amplify Storage Configuration
 *
 * Bucket path: images/
 *
 * S3 bucket for:
 * - Product images: images/products/{productId}/{filename}
 * - Category images: images/categories/{categoryId}/{filename}
 * - User avatars: images/avatars/{userId}/{filename}
 *
 * Access Rules:
 * - Admin: full access to all paths
 * - Authenticated users: read products/categories, write own avatar
 * - Guest: read products/categories only
 */
const IMAGES_PREFIX = 'images/';

export const storage = defineStorage({
  name: 'ecommerceStorage',

  access: (allow) => ({
    // When using accessLevel: 'guest', Amplify uses prefix "public/" in S3.
    // Grant authenticated users write so they can upload product/category images.
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    // Product images - authenticated write, everyone read (path under public/)
    [`${IMAGES_PREFIX}products/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    // Category images - authenticated write, everyone read
    [`${IMAGES_PREFIX}categories/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    // User avatars - owner only
    [`${IMAGES_PREFIX}avatars/{entity_id}/*`]: [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read']),
    ],

    // Temp uploads - for processing
    [`${IMAGES_PREFIX}temp/{entity_id}/*`]: [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],

    // Admin CSV imports - upload then edit/add products
    [`${IMAGES_PREFIX}imports/*`]: [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});
