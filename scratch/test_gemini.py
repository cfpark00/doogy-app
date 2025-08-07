#!/usr/bin/env python3
import os
import litellm
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up API key
os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_API_KEY", "")

print(f"API Key configured: {'Yes' if os.getenv('GOOGLE_API_KEY') else 'No'}")
print(f"Testing Gemini 2.5 Flash Lite...\n")

# Test different model formats
models = [
    "gemini/models/gemini-2.5-flash-lite",  # AI Studio format
    "gemini/gemini-2.5-flash-lite",         # Alternative format
]

for model in models:
    print(f"\nTrying model: {model}")
    try:
        response = litellm.completion(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": "Say 'Hello from Gemini 2.5 Flash Lite!' in exactly 5 words"
                }
            ],
            max_tokens=100,
            temperature=0.7
        )
        print(f"✅ Success with {model}")
        print(f"Response: {response.choices[0].message.content}")
        break
    except Exception as e:
        print(f"❌ Failed with {model}: {str(e)[:100]}...")