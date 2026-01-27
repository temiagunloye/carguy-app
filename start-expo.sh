#!/bin/bash

# Quick Start Script for Expo Development
# This ensures the correct Node version and starts Expo

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 20
nvm use 20

# Start Expo
npx expo start --clear
