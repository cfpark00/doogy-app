# iOS Configuration Guide

## Google OAuth Client ID Setup

The Google OAuth Client ID is no longer hardcoded in the Info.plist file. Instead, it's injected at build time from environment variables.

### Setup Instructions

1. **Create the iOS .env file:**
   ```bash
   cd ios
   cp .env.example .env
   ```

2. **Add your Google iOS Client ID to the .env file:**
   ```bash
   # Edit ios/.env
   GOOGLE_IOS_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   ```

3. **Run the configuration script:**
   ```bash
   cd ios
   ./scripts/set-google-client-id.sh
   ```

   This script will:
   - Read your client ID from the .env file
   - Generate the reversed client ID format
   - Create/update the Config.xcconfig file
   - Configure the Info.plist to use these values

### Xcode Build Integration

The configuration is automatically updated before each build via the prebuild script. To manually add this to Xcode:

1. Open the project in Xcode
2. Select the Doogy target
3. Go to Build Phases
4. Add a new "Run Script Phase" before "Compile Sources"
5. Add the script: `"${SRCROOT}/scripts/xcode-prebuild.sh"`

### Files Involved

- `ios/.env` - Your local environment variables (gitignored)
- `ios/.env.example` - Template for environment variables
- `ios/scripts/set-google-client-id.sh` - Script to generate configuration
- `ios/scripts/xcode-prebuild.sh` - Xcode prebuild hook
- `ios/Doogy/Config.xcconfig` - Generated Xcode configuration (gitignored)
- `ios/Doogy/Info.plist` - Uses `$(GOOGLE_IOS_REVERSED_CLIENT_ID)` variable

### Security Notes

- The `.env` file containing your actual client ID is gitignored
- The generated `Config.xcconfig` is also gitignored
- Only the template and scripts are committed to the repository
- iOS client IDs are semi-public (they're in the app bundle) but this approach keeps them out of version control

### Troubleshooting

If you see the placeholder value in your app:
1. Ensure `ios/.env` exists with your actual client ID
2. Run `./scripts/set-google-client-id.sh` manually
3. Clean and rebuild the Xcode project