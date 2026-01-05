// functions/index.js
// Main entry point for Firebase Cloud Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
const { requestCarReconstruction } = require('./src/reconstruction');
const { onReconstructionComplete } = require('./src/webhooks');

// Import Phase 3 function (TypeScript - needs to be compiled)
// If using TypeScript, run: cd functions && npm run build
const { generateCarModel } = require('./lib/generateCarModel');

// Export Cloud Functions
exports.requestCarReconstruction = requestCarReconstruction;
exports.onReconstructionComplete = onReconstructionComplete;
exports.generateCarModel = generateCarModel;
