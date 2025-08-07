#!/bin/bash

# iOS Build Script for generating .ipa file

set -e

echo "🚀 Starting iOS build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="TempChatApp"
SCHEME_NAME="TempChatApp"
WORKSPACE_PATH="ios/${PROJECT_NAME}.xcworkspace"
BUILD_DIR="ios/build"
OUTPUT_DIR="build_output"
ARCHIVE_PATH="${OUTPUT_DIR}/${PROJECT_NAME}.xcarchive"
IPA_PATH="${OUTPUT_DIR}/${PROJECT_NAME}.ipa"

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf ${BUILD_DIR}
rm -rf ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}

# Install dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
npm install

# Pod install
echo -e "${YELLOW}Installing iOS dependencies...${NC}"
cd ios
pod install
cd ..

# Build the archive
echo -e "${YELLOW}Building archive...${NC}"
xcodebuild -workspace ${WORKSPACE_PATH} \
  -scheme ${SCHEME_NAME} \
  -configuration Release \
  -archivePath ${ARCHIVE_PATH} \
  -allowProvisioningUpdates \
  clean archive

# Export IPA
echo -e "${YELLOW}Exporting IPA...${NC}"

# Create export options plist
cat > ${OUTPUT_DIR}/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>compileBitcode</key>
    <false/>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
  -archivePath ${ARCHIVE_PATH} \
  -exportPath ${OUTPUT_DIR} \
  -exportOptionsPlist ${OUTPUT_DIR}/ExportOptions.plist \
  -allowProvisioningUpdates

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📦 IPA file created at: ${OUTPUT_DIR}/${PROJECT_NAME}.ipa${NC}"

# Display build info
echo -e "\n${YELLOW}Build Information:${NC}"
echo "- Archive: ${ARCHIVE_PATH}"
echo "- IPA: ${OUTPUT_DIR}/${PROJECT_NAME}.ipa"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Open the IPA in Xcode or install on device using Apple Configurator"
echo "2. Or distribute via TestFlight/App Store Connect"