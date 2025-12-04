import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { scrapeAuctions } from './functions/scrapeAuctions/resource';

defineBackend({
  auth,
  data,
  storage,
  scrapeAuctions,
});