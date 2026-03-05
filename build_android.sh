#!/bin/bash
set -e

# --- 1. Cleanup Old Build Files ---
echo "🧹 Cleaning up old build files..."
rm -rf android/.gradle android/app/build android/app/.cxx ~/android-sdk-writable
# Kill any lingering gradle daemons
pkill -f gradle || true
echo "✅ Cleanup done."

# --- 2. Find Nix SDK Path ---
# Try environment variables first
NIX_SDK_PATH="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"

# If not found, try common Nix paths
if [ -z "$NIX_SDK_PATH" ]; then
    NIX_SDK_PATH=$(ls -d /nix/store/*-androidsdk/libexec/android-sdk 2>/dev/null | head -n 1)
fi

if [ -z "$NIX_SDK_PATH" ] || [ ! -d "$NIX_SDK_PATH" ]; then
    echo "❌ Error: Could not find Android SDK in Nix store."
    exit 1
fi
echo "📍 Found Nix SDK at: $NIX_SDK_PATH"

# --- 3. Prepare Writable SDK (Lightweight Symlink Version) ---
WRITABLE_SDK_PATH="$HOME/android-sdk-writable"
echo "📂 Preparing lightweight writable SDK at: $WRITABLE_SDK_PATH"

mkdir -p "$WRITABLE_SDK_PATH"

# Create symlinks for all top-level directories/files from the original SDK
# This avoids copying huge files and saves disk space
for file in "$NIX_SDK_PATH"/*; do
    name=$(basename "$file")
    if [ "$name" != "licenses" ]; then
        ln -sf "$file" "$WRITABLE_SDK_PATH/$name"
    fi
done

# Create a real 'licenses' directory so we can write license files
mkdir -p "$WRITABLE_SDK_PATH/licenses"
chmod -R u+w "$WRITABLE_SDK_PATH/licenses"

# --- 4. Accept Licenses ---
SDK_DIR="$WRITABLE_SDK_PATH"
export ANDROID_HOME="$SDK_DIR"
export ANDROID_SDK_ROOT="$SDK_DIR"

# Copy licenses if they exist in source, otherwise create dummy ones or accept via sdkmanager
if [ -d "$NIX_SDK_PATH/licenses" ]; then
    cp -f "$NIX_SDK_PATH/licenses/"* "$WRITABLE_SDK_PATH/licenses/" 2>/dev/null || true
fi

# Try to find sdkmanager to accept licenses formally
SDKMANAGER=$(find "$NIX_SDK_PATH" -name sdkmanager -type f 2>/dev/null | head -n 1)
if [ -n "$SDKMANAGER" ]; then
    echo "📝 Accepting licenses using sdkmanager..."
    yes | "$SDKMANAGER" --licenses --sdk_root="$SDK_DIR" > /dev/null 2>&1 || true
else
    echo "⚠️ Warning: sdkmanager not found. Manually creating license files."
    # Manually create common license hashes if sdkmanager fails
    echo "8933bad161af4178b1185d1a37fbf41ea5269c55" > "$WRITABLE_SDK_PATH/licenses/android-sdk-license"
    echo "d56f5187479451eabf01fb78af6dfcb131a6481e" >> "$WRITABLE_SDK_PATH/licenses/android-sdk-license"
    echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >> "$WRITABLE_SDK_PATH/licenses/android-sdk-license"
fi

# --- 5. Android Project Setup & Build ---
PROJECT_DIR="$(cd "$(dirname "$0")"; pwd)/android"
echo "🚀 Navigating to Android project: $PROJECT_DIR"
cd "$PROJECT_DIR"

# Create local.properties
echo "⚙️  Updating local.properties..."
echo "sdk.dir=$SDK_DIR" > local.properties

# Ensure gradlew is executable
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
else
    echo "❌ Error: gradlew not found in $PROJECT_DIR"
    exit 1
fi

# Clean & Build
echo "🔨 Starting Build..."
# Increase heap size to avoid OOM
export JAVA_OPTS="-Xmx4g"
# Use --no-daemon to avoid locking issues and save memory in the long run
# Use bundleRelease to generate AAB
./gradlew clean bundleRelease --no-daemon

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build Successful!"
    echo "📦 APK/AAB location:"
    find "$PROJECT_DIR/app/build/outputs" -name "*.apk" -o -name "*.aab"
else
    echo ""
    echo "❌ Build Failed."
    exit 1
fi
