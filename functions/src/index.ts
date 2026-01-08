// functions/src/index.ts
// Firebase Cloud Functions entry point

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Cloud Functions

// Legacy reconstruction functions (if still needed)
//export { requestCarReconstruction } from './reconstruction';
//export { onReconstructionComplete } from './webhooks';

// New render job pipeline functions
export { generateCarModel } from './renderJobs/generateCarModel';
export { onRenderJobCreated } from './renderJobs/onRenderJobCreated';
export { pollRenderJobs } from './renderJobs/pollRenderJobs';

