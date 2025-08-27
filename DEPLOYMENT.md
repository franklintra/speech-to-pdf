# Deployment Guide

## Architecture Overview
- **Frontend**: Next.js app deployed on Vercel at `speech.tranie.org`
- **Backend**: FastAPI app deployed on Fly.io at `api.speech.tranie.org`
- **Database**: PostgreSQL hosted on Fly.io (internal connection)

## Frontend Deployment (Vercel)

### Initial Setup
1. Frontend is configured to connect to backend via environment variable:
   - `.env.local`: `NEXT_PUBLIC_API_URL=https://api.speech.tranie.org`
   - `.env.production`: Same configuration for production

2. Deploy to Vercel:
   ```bash
   cd frontend
   vercel --prod
   ```

3. Add custom domain in Vercel dashboard:
   - Go to project settings → Domains
   - Add `speech.tranie.org`
   - Configure DNS records as provided by Vercel

### Updating Frontend
```bash
cd frontend

# Make your changes, then:
git add .
git commit -m "Your update message"
git push

# Vercel auto-deploys on push to main branch
# OR manually deploy:
vercel --prod
```

## Backend Deployment (Fly.io)

### Configuration Files
1. **fly.toml**: Fly.io app configuration
   - App name: `speech-to-pdf-api`
   - Region: `ams` (Amsterdam, EU)
   - Persistent volume for file storage
   
2. **Dockerfile**: Container configuration
   - Python 3.11 with FastAPI
   - PostgreSQL client
   - Auto-fixes postgres:// URLs for SQLAlchemy compatibility
   - Runs database migrations on startup

### Environment Variables (Secrets)
Set via Fly.io:
- `DATABASE_URL`: Automatically set by Fly when Postgres attached
- `SECRET_KEY`: JWT secret (generated)
- `DEEPGRAM_API_KEY`: For speech-to-text
- `CORS_ORIGINS`: Allows frontend domain

### Updating Backend
```bash
cd backend

# Make your changes, then deploy:
fly deploy

# Check deployment status:
fly status

# View logs:
fly logs

# If app is stopped (auto-stop enabled):
fly machine list  # Get machine ID
fly machine start [MACHINE_ID]
```

### Database Management
```bash
# Connect to Postgres directly:
fly postgres connect -a speech-to-pdf-db

# Access backend shell:
fly ssh console -a speech-to-pdf-api

# Run database migrations:
fly ssh console -a speech-to-pdf-api -C "python init_db.py"
```

## DNS Configuration

### Frontend (speech.tranie.org)
Add to DNS provider:
```
CNAME  speech  →  cname.vercel-dns.com
```

### Backend (api.speech.tranie.org)
Add to DNS provider (choose one):
```
A     api  →  66.241.124.41
AAAA  api  →  2a09:8280:1::93:fa04:0
```
OR
```
CNAME  api  →  speech-to-pdf-api.fly.dev
```

## Monitoring & Debugging

### Frontend (Vercel)
- Dashboard: https://vercel.com/dashboard
- View function logs in Vercel dashboard
- Check build logs for deployment issues

### Backend (Fly.io)
```bash
# Check app status:
fly status -a speech-to-pdf-api

# View recent logs:
fly logs -a speech-to-pdf-api

# Monitor in real-time:
fly logs -a speech-to-pdf-api  # (streams continuously)

# Check certificate status:
fly certs show api.speech.tranie.org

# View secrets (names only):
fly secrets list -a speech-to-pdf-api

# Update a secret:
fly secrets set KEY=value -a speech-to-pdf-api

# SSH into the container:
fly ssh console -a speech-to-pdf-api
```

## Common Issues & Solutions

### Backend not responding
1. Check if machine is running:
   ```bash
   fly status -a speech-to-pdf-api
   ```
2. If stopped, start it:
   ```bash
   fly machine start [MACHINE_ID] -a speech-to-pdf-api
   ```

### Database connection issues
- The postgres:// URL is automatically converted to postgresql:// in the app
- Database is only accessible internally via `speech-to-pdf-db.flycast`

### CORS errors
Update CORS_ORIGINS secret:
```bash
fly secrets set CORS_ORIGINS="https://speech.tranie.org,http://localhost:3000" -a speech-to-pdf-api
```

### Certificate issues
Check and re-issue if needed:
```bash
fly certs show api.speech.tranie.org
fly certs add api.speech.tranie.org
```

## Scaling

### Frontend
- Vercel automatically scales
- No action needed

### Backend
```bash
# Scale horizontally (add more machines):
fly scale count 2 -a speech-to-pdf-api

# Scale vertically (increase resources):
fly scale vm shared-cpu-2x -a speech-to-pdf-api

# Scale database storage:
fly volumes extend [VOLUME_ID] -s 10  # Extend to 10GB
```

## Rollback

### Frontend
- Use Vercel dashboard to redeploy previous deployment

### Backend
```bash
# List deployments:
fly releases -a speech-to-pdf-api

# Rollback to previous version:
fly deploy --image [PREVIOUS_IMAGE] -a speech-to-pdf-api
```