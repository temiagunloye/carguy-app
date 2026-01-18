#!/bin/bash
# Quick automated upload using Firebase emulator or direct SDK

echo "🚀 Automated Firebase Upload"
echo ""
echo "Installing firebase-admin if needed..."

# Check if in base-models-test directory
cd /Users/temiagunloye/Desktop/carguy-app/base-models-test

# Install firebase-admin locally
npm init -y 2>/dev/null
npm install firebase-admin

echo ""
echo "📝 You need to download service account key:"
echo "1. Go to: https://console.firebase.google.com/project/carguy-app-demo/settings/serviceaccounts/adminsdk"
echo "2. Click 'Generate new private key'"
echo "3. Save as: service-account-key.json in this folder"
echo ""
echo "Once done, run: node upload-to-firebase.js"
