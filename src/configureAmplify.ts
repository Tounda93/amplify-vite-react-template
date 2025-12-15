import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

declare global {
  // eslint-disable-next-line no-var
  var __AMPLIFY_CONFIGURED: boolean | undefined;
}

if (!globalThis.__AMPLIFY_CONFIGURED) {
  Amplify.configure(outputs);
  globalThis.__AMPLIFY_CONFIGURED = true;
}

export {};
