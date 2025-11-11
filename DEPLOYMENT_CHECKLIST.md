# Ask AYO Backend - Railway Deployment Checklist

## ✅ Pre-Deployment (Already Done)

- [x] Railway account created
- [x] OpenAI API key obtained
- [x] Backend code prepared
- [x] Git repository initialized

---

## 🚀 Deployment Steps (Do This Now)

### Option A: Deploy via GitHub (Recommended)

1. **Create GitHub Repository**
   - [ ] Go to https://github.com/new
   - [ ] Name: `ask-ayo-backend` (or any name you want)
   - [ ] Set to **Private**
   - [ ] Click "Create repository"

2. **Push Code to GitHub**
   - [ ] Copy the commands from GitHub's "push an existing repository" section
   - [ ] Run them in the `ask_ayo_backend_deploy` folder
   - [ ] Verify code is on GitHub

3. **Connect Railway to GitHub**
   - [ ] Go to Railway dashboard
   - [ ] Click "New Project"
   - [ ] Select "Deploy from GitHub repo"
   - [ ] Choose `ask-ayo-backend` repository
   - [ ] Click "Deploy Now"

4. **Add PostgreSQL Database**
   - [ ] In Railway project, click "+ New"
   - [ ] Select "Database" → "PostgreSQL"
   - [ ] Wait for database to provision (~30 seconds)

5. **Set Environment Variables**
   - [ ] Click on your service (not database)
   - [ ] Go to "Variables" tab
   - [ ] Click "Raw Editor"
   - [ ] Paste this:
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your-openai-api-key-here
   DB_SYNC=true
   DB_ALTER=false
   ALLOWED_ORIGINS=*
   ```
   - [ ] Click "Update Variables"

6. **Generate Public URL**
   - [ ] Click on your service
   - [ ] Go to "Settings" tab
   - [ ] Scroll to "Networking" → "Public Networking"
   - [ ] Click "Generate Domain"
   - [ ] Copy the URL (e.g., `https://ask-ayo-backend-production.up.railway.app`)

7. **Test Deployment**
   - [ ] Visit `https://your-url.up.railway.app/health`
   - [ ] Should see: `{"status":"ok","timestamp":"...","uptime":...}`

---

### Option B: Deploy via Railway CLI (Alternative)

1. **Install Railway CLI**
   ```bash
   # Mac/Linux
   curl -fsSL https://railway.app/install.sh | sh
   
   # Windows
   iwr https://railway.app/install.ps1 | iex
   ```

2. **Deploy**
   ```bash
   cd ask_ayo_backend_deploy
   railway login
   railway init
   railway add --database postgresql
   railway variables set OPENAI_API_KEY="sk-proj-..."
   railway variables set NODE_ENV="production"
   railway variables set DB_SYNC="true"
   railway variables set ALLOWED_ORIGINS="*"
   railway up
   ```

---

## 📊 Post-Deployment

- [ ] Check logs for errors: Railway dashboard → Logs tab
- [ ] Test `/health` endpoint
- [ ] Test `/api/feedback/lookup` endpoint (see README.md for examples)
- [ ] Monitor database tables (Railway → PostgreSQL → Data tab)
- [ ] Save your Railway URL for extension integration

---

## 🎯 Next Steps

After successful deployment:

1. [ ] Update Chrome extension with API URL
2. [ ] Add feedback buttons to extension popup
3. [ ] Test end-to-end flow
4. [ ] Monitor OpenAI API costs

---

## 🆘 Troubleshooting

**Build fails:**
- Check Logs tab in Railway
- Ensure Node.js version is 18+
- Verify all files are committed to Git

**Database connection fails:**
- Check PostgreSQL service is running
- Verify DATABASE_URL is set automatically
- Check service logs for connection errors

**500 errors:**
- Check environment variables are set correctly
- View detailed error in Logs tab
- Test `/health` endpoint first

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Full guide: See RAILWAY_DEPLOYMENT_GUIDE.md

---

**Your OpenAI API Key:**
```
Set this in Railway environment variables - DO NOT commit to Git!
```

Good luck! 🚀
