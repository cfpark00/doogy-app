# Chat App - React Native Monorepo

A full-stack React Native chat application with AI-powered responses using Google Gemini 2.5 Flash Lite and Supabase for data persistence.

## Architecture

- **Frontend**: React Native with TypeScript
- **Backend**: Python FastAPI server
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini 2.5 Flash Lite (via LiteLLM)

## Prerequisites

- Node.js 18+ (for React Native)
- Python 3.11+
- uv (Python package manager)
- Xcode 15+ (for iOS development)
- CocoaPods
- Supabase account (optional)
- Google API key (for Gemini AI Studio)

## Setup Instructions

### 1. Environment Configuration

Create environment files:

**Frontend (.env)**:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
BACKEND_URL=http://localhost:3001
```

**Backend (backend/.env)**:
```
GOOGLE_API_KEY=your_google_api_key
PORT=3001
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the SQL migration to create the messages table:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents from `supabase_setup.sql`
   - Execute the SQL

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Setup Python backend
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
cd ..

# Install iOS dependencies
cd ios
pod install
cd ..
```

### 4. Running the Application

#### Start Backend Server
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001
```
The backend will run on http://localhost:3001

#### Run iOS App (Development)
```bash
# In a new terminal
npx react-native run-ios
```

Or open in Xcode:
```bash
open ios/TempChatApp.xcworkspace
```

### 5. Building IPA for Distribution

To create an IPA file for distribution:

```bash
./scripts/build-ios.sh
```

**Note**: Before building, update the following in the build script:
- Team ID in `scripts/build-ios.sh`
- Signing certificates in Xcode project settings

The IPA will be generated in `build_output/TempChatApp.ipa`

## Project Structure

```
.
├── App.tsx                 # Main React Native entry
├── src/                    # React Native source code
│   ├── components/         # UI components
│   ├── screens/           # Screen components
│   ├── services/          # API services
│   └── types/             # TypeScript types
├── backend/               # Python FastAPI backend
│   ├── app/
│   │   └── main.py       # FastAPI application
│   ├── .venv/            # Python virtual environment
│   └── pyproject.toml    # Python dependencies
├── ios/                   # iOS project files
├── android/               # Android project files
└── scripts/               # Build scripts
```

## Troubleshooting

### iOS Build Issues

1. Clean build folder:
```bash
cd ios
xcodebuild clean
cd ..
```

2. Clear Metro cache:
```bash
npx react-native start --reset-cache
```

3. Reinstall pods:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Backend Connection Issues

1. Ensure backend is running on port 3001
2. For physical device testing, update `BACKEND_URL` to your machine's IP address

## Development Tips

- Use `npx react-native log-ios` to view iOS logs
- Backend logs are visible in the terminal running `uvicorn`
- Supabase provides real-time database monitoring in the dashboard

## Security Notes

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment-specific configurations for production

## Deployment

### Backend (Google Cloud Run)
```bash
cd backend
export GOOGLE_API_KEY=your_api_key_here
./deploy.sh
```
Your backend will be at: `https://doogy-api-xxxxx-uc.a.run.app`

### iOS App
Build IPA in Xcode:
1. Open `ios/TempChatApp.xcworkspace`
2. Product → Archive
3. Distribute App → Custom → Export

## License

MIT