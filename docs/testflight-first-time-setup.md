# TestFlight First-Time Setup Guide

This guide covers the complete setup process for deploying your app to TestFlight for the first time.

## Prerequisites

- **Apple Developer Account** ($99/year) - Required
- **Xcode** installed and signed in with your Apple ID
- **App icons** generated (see Icon Setup section)
- **Unique Bundle ID** (e.g., `com.doogy.doogy-app`)

## Step 1: App Naming and Configuration

### Rename App (if needed)
If your app has a temp name (like TempChatApp), rename it first:

1. **Update configuration files:**
   - `app.json` - name and displayName
   - `package.json` - name field
   - iOS `Info.plist` - CFBundleDisplayName
   - Android `strings.xml` - app_name

2. **Update iOS files:**
   ```bash
   # Rename directories
   mv ios/TempChatApp ios/Doogy
   mv ios/TempChatApp.xcodeproj ios/Doogy.xcodeproj
   mv ios/TempChatApp.xcworkspace ios/Doogy.xcworkspace
   mv ios/Doogy.xcodeproj/xcshareddata/xcschemes/TempChatApp.xcscheme ios/Doogy.xcodeproj/xcshareddata/xcschemes/Doogy.xcscheme
   ```

3. **Update Podfile target:**
   - Change `target 'TempChatApp'` to `target 'Doogy'`

4. **Reinstall Pods:**
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

### Icon Setup

1. **Create app icons from source image (1024x1024):**
   ```bash
   # Generate all required sizes
   for size in 20 29 40 58 60 76 80 87 120 152 167 180 1024; do 
     sips -z $size $size icon.png --out "ios/Doogy/Images.xcassets/AppIcon.appiconset/icon-${size}.png"
   done
   ```

2. **Update `Contents.json` in AppIcon.appiconset** with proper filenames

## Step 2: App Store Connect Setup

1. **Go to [App Store Connect](https://appstoreconnect.apple.com)**

2. **Create New App:**
   - Click "+" → "New App"
   - Platform: iOS
   - Name: Doogy
   - Primary Language: English (US)
   - Bundle ID: Select or create `com.doogy.doogy-app`
   - SKU: doogy-app-2024 (or any unique identifier)
   - User Access: Full Access

3. **Initial App Information:**
   - Fill in basic app description
   - Select category
   - Add temporary screenshots (can update later)

## Step 3: Xcode Configuration

1. **Open project:**
   ```bash
   open ios/Doogy.xcworkspace
   ```

2. **Configure Signing & Capabilities:**
   - Select "Doogy" project in navigator
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Team: Select your Apple Developer account
   - Bundle Identifier: `com.doogy.doogy-app`

3. **Set Version and Build:**
   - Under "General" tab:
   - Version: 1.0.0
   - Build: 1

## Step 4: Build and Archive

1. **Select Device:**
   - In Xcode toolbar, click device selector
   - Choose "Any iOS Device (arm64)"
   - NOT a simulator

2. **Clean Build (optional but recommended):**
   - Product → Clean Build Folder (Shift+Cmd+K)

3. **Archive:**
   - Product → Archive
   - Wait for build to complete (2-5 minutes)

4. **Handle Xcode Prompts:**
   - Cloud Signing: Choose "Get Started" or "Workflow Default"
   - GitHub Access: Select "Select Repositories" (only give access to this repo)

## Step 5: Upload to TestFlight

1. **In Organizer Window (opens after archive):**
   - Click "Distribute App"
   - Choose "TestFlight Internal Testing Only"
   - Next through all screens
   - **Upload Symbols Warning**: Can safely ignore Hermes warning

2. **Wait for Upload:**
   - Takes 1-2 minutes
   - Shows "Uploaded to Apple" when complete

## Step 6: Configure TestFlight

1. **In App Store Connect:**
   - Go to My Apps → Doogy → TestFlight tab
   - Wait 10-15 minutes for "Processing" to complete

2. **Handle Export Compliance:**
   - Click "Manage" next to "Missing Compliance"
   - Select "None of the algorithms mentioned above"
   - Save

3. **Create Internal Testing Group:**
   - Go to "Internal Testing" in sidebar
   - Click "+" or "Create Group"
   - Name: "Design Team" or "Internal Team"
   - Add Testers (must be in Users and Access first):
     - Your email
     - Designer's email
   - Add Build: Select your build
   - Save

## Step 7: Install and Test

1. **On iPhone:**
   - Download TestFlight app from App Store
   - Check email for invite
   - Tap "View in TestFlight"
   - Tap "Install"

2. **App appears on home screen:**
   - Yellow/orange dot indicates beta version
   - Test all functionality

## Common Issues and Solutions

### "Could not load shared scheme"
- Rename xcscheme file to match new app name
- Run `pod deintegrate && pod install`

### Missing Pods configuration
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Bundle ID conflicts
- Ensure Bundle ID is unique across your Apple Developer account
- Format: com.yourcompany.appname

### Archive option grayed out
- Must select real device target, not simulator
- Check scheme is set correctly (not "Pods")

### Upload symbols failed (Hermes)
- Safe to ignore for TestFlight
- Only affects JavaScript crash symbolication

## Next Steps

- Test app thoroughly
- Gather feedback via TestFlight feedback feature
- For updates, see [TestFlight Update Guide](./testflight-updates.md)

## Notes

- Internal testing: Up to 100 testers, no review needed
- Builds expire after 90 days
- TestFlight app shows yellow dot on beta apps
- Testers must have TestFlight app installed