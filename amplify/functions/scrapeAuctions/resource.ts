import { defineFunction } from '@aws-amplify/backend';

export const scrapeAuctions = defineFunction({
  name: 'scrapeAuctions',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  schedule: 'every 6h', // Run every 6 hours
});