# TestFlight Update Guide

This guide covers how to push updates to TestFlight after initial setup is complete.

## Quick Update Process (5-10 minutes)

### Step 1: Update Build Number

**In Xcode:**
1. Open project:
   ```bash
   open ios/Doogy.xcworkspace
   ```

2. Select project → General tab
3. **Keep Version the same** (e.g., 1.0.0)
4. **Increment Build Number** (1 → 2 → 3 → 4...)
   - Each upload MUST have unique build number
   - Can't reuse numbers, even if you delete old builds

### Step 2: Archive and Upload

1. **Select Device:**
   - Choose "Any iOS Device (arm64)" from device selector
   - NOT a simulator

2. **Archive:**
   - Product → Archive
   - Wait 2-5 minutes for completion

3. **Upload:**
   - In Organizer window: "Distribute App"
   - Choose "TestFlight Internal Testing Only"
   - Click through all screens
   - Ignore Hermes symbols warning if it appears

### Step 3: App Store Connect

1. **Wait for Processing:**
   - Go to App Store Connect → My Apps → Doogy → TestFlight
   - New build appears with "Processing" status
   - Takes ~10-15 minutes

2. **Export Compliance (per build):**
   - Click "Manage" if shows "Missing Compliance"
   - Select "None of the algorithms mentioned above"
   - Save

3. **Automatic Distribution:**
   - Build automatically goes to existing test groups
   - Testers get notification in TestFlight app
   - No need to re-add testers

## What You DON'T Need to Do

❌ **Don't recreate app record**
❌ **Don't reconfigure signing** (stays saved)
❌ **Don't re-add testers** (they stay in groups)
❌ **Don't change Bundle ID**
❌ **Don't run pod install** (unless adding new packages)
❌ **Don't update version** (only build number)

## Build Numbering Best Practices

### Manual Approach (Recommended for small teams):
- Simple increment: 1, 2, 3, 4...
- Easy to track and remember

### Automated Timestamp (Optional):
```bash
# Generates build like: 20240107143022
CURRENT_PROJECT_VERSION = $(date +%YYmmddHHMMSS)
```

### Semantic Versioning:
- Version: Major.Minor.Patch (1.0.0)
- Build: Integer increment (1, 2, 3...)
- Change version only for significant releases

## Tester Experience

When you push an update:

1. **Automatic Notification:**
   - Testers get push notification from TestFlight
   - Shows "Update Available" in TestFlight app

2. **One-Tap Update:**
   - Open TestFlight
   - Tap "Update" button
   - App updates in place (keeps data)

3. **Release Notes:**
   - Can add "What to Test" notes in App Store Connect
   - Appears in TestFlight for testers

## Common Update Scenarios

### After Code Changes Only
```bash
# Just increment build and upload
# No other steps needed
```

### After Adding NPM Package
```bash
npm install new-package
cd ios && pod install && cd ..
# Then archive and upload
```

### After Changing Native Code
```bash
cd ios
# Clean build folder in Xcode (Shift+Cmd+K)
# Then archive and upload
```

### Multiple Updates Same Day
- Just keep incrementing build number
- No limit on daily uploads
- Each must have unique build number

## Troubleshooting Updates

### "Build already exists" Error
- Increment build number again
- Can't reuse numbers, even deleted builds

### Changes Not Appearing
1. Verify build number was incremented
2. Check correct build is selected in test group
3. Have tester delete and reinstall app

### TestFlight Not Updating
1. Pull down to refresh in TestFlight app
2. Check if using correct Apple ID
3. Verify tester is still in group

## Pro Tips

1. **Test Locally First:**
   ```bash
   npx react-native run-ios
   ```

2. **Keep a Build Log:**
   ```
   Build 1: Initial release
   Build 2: Fixed login bug
   Build 3: Added new chat features
   ```

3. **Batch Small Changes:**
   - Don't upload for every tiny fix
   - Group related changes together

4. **Use "What to Test":**
   - In App Store Connect, add notes for testers
   - Highlights what's new/fixed

5. **Clean Periodically:**
   - Every 10-15 builds, do a clean build
   - Product → Clean Build Folder

## Quick Commands Reference

```bash
# Open project
open ios/Doogy.xcworkspace

# Run locally first
npx react-native run-ios

# If needed: clean and reinstall
cd ios
pod deintegrate && pod install
cd ..
```

## Build Checklist

- [ ] Code changes committed to git
- [ ] Tested locally on simulator
- [ ] Build number incremented
- [ ] Archive created
- [ ] Uploaded to TestFlight
- [ ] Export compliance answered
- [ ] Testers notified (automatic)

## Timeline

- **Archive & Upload:** 5 minutes
- **Processing:** 10-15 minutes
- **Available to testers:** Immediate after processing
- **Total time:** ~20 minutes from code to tester's device