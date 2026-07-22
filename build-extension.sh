#!/bin/bash
# Tab Out Session — Build Script
# Run this from the project root: bash build-extension.sh

set -e

echo "📦 Tab Out Session — Installing dependencies and building..."
echo ""

cd "$(dirname "$0")/extension-react"

echo "▶ npm install"
npm install

echo ""
echo "▶ npm run build"
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "To load in Chrome:"
echo "  1. Open chrome://extensions"
echo "  2. Enable Developer mode (top right)"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $(pwd)/dist"
echo ""
echo "Then open a new tab to see Tab Out Session!"
