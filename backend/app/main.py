from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import litellm
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Chat Backend API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure LiteLLM for Gemini
os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_API_KEY", "")

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"status": "Chat Backend API is running"}

@app.get("/health")
async def health_check():
    return {"status": "OK", "service": "chat-backend"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Check if API key is configured
        if not os.getenv("GOOGLE_API_KEY"):
            logger.warning("No valid Google API key found, using mock response")
            return ChatResponse(
                response=f"Mock response: I received your message '{request.message}'. Please configure a real Google API key."
            )
        
        # Make real API call to Gemini using LiteLLM
        logger.info(f"Sending request to Gemini for message: {request.message[:50]}...")
        
        # Use Gemini 2.5 Flash Lite via AI Studio
        models_to_try = [
            "gemini/gemini-2.5-flash-lite",  # Correct AI Studio format
        ]
        
        response = None
        last_error = None
        
        for model in models_to_try:
            try:
                logger.info(f"Trying model: {model}")
                response = litellm.completion(
                    model=model,
                    messages=[
                        {
                            "role": "user",  # Gemini doesn't use system role
                            "content": f"You are a helpful, friendly assistant. Keep responses concise but informative.\n\nUser: {request.message}"
                        }
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                logger.info(f"Successfully used model: {model}")
                break
            except Exception as e:
                last_error = e
                logger.warning(f"Failed with {model}: {str(e)}")
                continue
        
        if not response:
            raise last_error or Exception("Failed to get response from any model")
        
        response_text = response.choices[0].message.content
        logger.info("Successfully received response from Gemini")
        
        return ChatResponse(response=response_text)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        if "api_key" in str(e).lower():
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key is invalid or not configured properly"
            )
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)