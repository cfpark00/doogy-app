# Backend Deployment

## Deploy to Google Cloud Run

```bash
# Just run (reads .env automatically)
./deploy.sh
```

After deployment, update frontend `.env`:
```
BACKEND_URL=https://doogy-api-xxxxx-uc.a.run.app
```