#!/bin/bash

# Activate virtual environment
source .venv/bin/activate

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001