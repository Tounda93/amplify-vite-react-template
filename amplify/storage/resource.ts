import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'collectiblePhotos',
  access: (allow) => ({
    'car-photos/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
    ],
    'profile-photos/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
    ],
    'documents/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});