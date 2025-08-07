#!/bin/bash

# Deploy to Google Cloud Run

# CONFIGURATION - Edit these for your project
GCP_PROJECT="doogy-468314"
SERVICE_NAME="doogy-api"
REGION="us-central1"

# Load .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if GOOGLE_API_KEY is set
if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Error: GOOGLE_API_KEY not found"
    echo "Either create a .env file with GOOGLE_API_KEY=your_key"
    echo "Or run: export GOOGLE_API_KEY=your_api_key"
    exit 1
fi

# Verify project is configured
if [ -z "$GCP_PROJECT" ]; then
    echo "Error: GCP_PROJECT is not set in deploy.sh"
    exit 1
fi

echo "Deploying to GCP project: $GCP_PROJECT"

echo "Deploying $SERVICE_NAME to Cloud Run..."

gcloud run deploy $SERVICE_NAME \
    --source . \
    --project $GCP_PROJECT \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY

echo "Deployment complete!"