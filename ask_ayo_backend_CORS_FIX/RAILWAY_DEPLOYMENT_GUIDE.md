# Ask AYO Backend - Railway Deployment Guide

## Quick Setup (5 minutes)

### Step 1: Create New Project in Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. If you haven't connected GitHub yet, click **"Configure GitHub App"**
5. Select your repository (or create a new one - see below)

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will automatically create the database and set environment variables

### Step 3: Configure Environment Variables

In your Railway project settings, go to **"Variables"** and add these:

**Required Variables:**
```
NODE_ENV=production
OPENAI_API_KEY=your-openai-api-key-here
DB_SYNC=true
DB_ALTER=false
ALLOWED_ORIGINS=*
```

**Note:** Railway automatically sets these database variables:
- `DATABASE_URL` (full connection string)
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

Your backend code will use these automatically!

### Step 4: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Or click **"Deploy Now"** in the Railway dashboard
3. Wait 2-3 minutes for build to complete
4. Check the **"Deployments"** tab for status

### Step 5: Get Your API URL

1. In Railway project, click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Domains"**
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `https://ask-ayo-backend-production.up.railway.app`)

### Step 6: Test the API

Open your browser and visit:
```
https://your-railway-url.up.railway.app/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-11-11T12:00:00.000Z",
  "uptime": 123.456
}
```

---

## Alternative: Deploy Without GitHub

If you don't want to use GitHub, you can use Railway CLI:

### Install Railway CLI

**Mac/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

**Windows:**
```powershell
iwr https://railway.app/install.ps1 | iex
```

### Deploy with CLI

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project or create new one
railway link

# Add PostgreSQL database
railway add --database postgresql

# Set environment variables
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set NODE_ENV="production"
railway variables set DB_SYNC="true"
railway variables set ALLOWED_ORIGINS="*"

# Deploy
railway up
```

---

## Database Setup

Railway's PostgreSQL will automatically create the database. Your Sequelize models will create the tables on first run because `DB_SYNC=true`.

**Tables created automatically:**
- `users`
- `term_lookups`
- `feedback`
- `ai_rewrites`
- `missing_terms`
- `analytics_daily`

---

## Monitoring

### View Logs
1. Go to Railway project
2. Click on your service
3. Click **"Logs"** tab
4. See real-time logs

### Check Database
1. Click on PostgreSQL service
2. Click **"Data"** tab
3. Browse tables and data

---

## Cost Estimate

**Railway Free Tier:**
- $5 free credit per month
- 500 execution hours per month
- 1GB RAM
- 1GB storage

**Estimated usage:**
- Backend API: ~$3/month (if running 24/7)
- PostgreSQL: Included
- **Total: FREE** (within $5 credit)

**OpenAI API:**
- GPT-3.5-turbo: ~$0.50/month (estimated)

---

## Troubleshooting

### Build fails
- Check **"Logs"** tab for error messages
- Ensure all dependencies are in `package.json`
- Verify Node.js version (18+)

### Database connection fails
- Check that PostgreSQL service is running
- Verify `DATABASE_URL` is set automatically
- Check logs for connection errors

### API returns 500 errors
- Check **"Logs"** for error details
- Verify environment variables are set
- Test `/health` endpoint first

---

## Next Steps

After deployment:

1. ✅ Test all API endpoints
2. ✅ Update Chrome extension with live API URL
3. ✅ Monitor logs for errors
4. ✅ Track OpenAI API costs
5. ✅ Set up alerts (optional)

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Ask AYO Support: (your email)

---

Made with 💚 by Ask AYO
