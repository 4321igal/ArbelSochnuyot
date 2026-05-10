import { defineStorage } from '@aws-amplify/backend';

const IMAGES_PREFIX = 'images/';

export const storage = defineStorage({
  name: 'arbelStorage',

  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}vehicles/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}makes/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}bodyTypes/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}avatars/{entity_id}/*`]: [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read']),
    ],

    [`${IMAGES_PREFIX}temp/{entity_id}/*`]: [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}imports/*`]: [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],

    [`${IMAGES_PREFIX}hero/*`]: [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write']),
      allow.groups(['Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});
