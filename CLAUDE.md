# Claude.md - Project Guidelines

## Project Root
- When user says "root" or "project root" they mean: `/Users/cfpark00/dog`
- NOT the system root (/)
- NOT the backend root (/Users/cfpark00/dog/backend)

## Important Rules

### DO NOT RUN SERVERS
- **NEVER** run backend servers (uvicorn, npm run dev, etc.) directly in the terminal
- The user will run servers themselves in their own terminal
- Only provide commands for the user to run, don't execute them

### Backend Configuration
- Python backend uses `uv` as package manager
- Virtual environment is at `backend/.venv`
- Always use the venv: `source backend/.venv/bin/activate`
- Backend uses Gemini 2.5 Flash Lite model via LiteLLM
- API key is stored in `backend/.env` as `GOOGLE_API_KEY`

### Project Structure
- `/backend` - Python FastAPI backend with LiteLLM
- `/src` - React Native app source
- `/ios` - iOS project files
- Backend dependencies in `backend/pyproject.toml`

### Testing
- Test scripts can be created and run
- But DO NOT run long-running processes like servers