#!/bin/bash

# This script automates the process of building the Android App Bundle (AAB).

echo "Navigating to the android directory..."
cd android

if [ $? -ne 0 ]; then
  echo "Error: Could not find the 'android' directory. Please run this script from the project's root directory."
  exit 1
fi

echo "Now in directory: $(pwd)"
echo "Starting the build process. You may be prompted for your keystore password."

bubblewrap build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build successful!"
  echo "You can find the generated AAB file at: android/app-release.aab"
else
  echo ""
  echo "❌ Build failed. Please check the error messages above."
fi
