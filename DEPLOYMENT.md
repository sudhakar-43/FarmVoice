# FarmVoice Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites

- Vercel CLI installed globally: `npm install -g vercel`
- Vercel account (free tier works)

---

## Step 1: Login to Vercel

Run the following command and follow the prompts:

```bash
vercel login
```

This will open your browser for authentication.

---

## Step 2: Set Environment Variables

You have **two options** to set environment variables:

### Option A: Using Vercel Dashboard (Recommended for Security)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project (or it will be created on first deploy)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable Name          | Description               | Example Value                                      |
| ---------------------- | ------------------------- | -------------------------------------------------- |
| `SUPABASE_URL`         | Your Supabase project URL | `https://xxxxx.supabase.co`                        |
| `SUPABASE_KEY`         | Supabase anon/public key  | `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...`               |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...`               |
| `JWT_SECRET_KEY`       | Secret for JWT tokens     | `your-super-secret-jwt-key-change-this`            |
| `JWT_ALGORITHM`        | JWT algorithm             | `HS256`                                            |
| `CORS_ORIGINS`         | Allowed CORS origins      | `https://yourapp.vercel.app,http://localhost:3000` |
| `NEXT_PUBLIC_API_URL`  | Frontend API URL          | `https://yourapp.vercel.app`                       |

5. For each variable, select the environment: **Production**, **Preview**, and **Development**

---

### Option B: Using Vercel CLI

You can set environment variables during deployment:

```bash
# Navigate to project directory
cd "c:\Users\P.SUDHAKAR BABU\Downloads\farmvoicePro"

# Set environment variables (example)
vercel env add SUPABASE_URL
# Paste your Supabase URL when prompted
# Choose: Production, Preview, Development (or all)

vercel env add SUPABASE_KEY
# Paste your Supabase key

vercel env add SUPABASE_SERVICE_KEY
# Paste your service key

vercel env add JWT_SECRET_KEY
# Enter a secure random string

vercel env add JWT_ALGORITHM
# Enter: HS256

vercel env add CORS_ORIGINS
# Enter: https://yourapp.vercel.app,http://localhost:3000
```

Or add them all at once from your `.env` file:

```bash
# Read from your backend/.env and add manually
cat backend/.env
```

Then for each variable:

```bash
vercel env add VARIABLE_NAME
```

---

## Step 3: Deploy the Project

### Initial Deployment

```bash
# Navigate to project root
cd "c:\Users\P.SUDHAKAR BABU\Downloads\farmvoicePro"

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? farmvoice (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No
```

The CLI will:

1. Build your Next.js frontend
2. Package your Python backend
3. Upload to Vercel
4. Provide you with URLs for preview and production

---

### Production Deployment

After initial setup, to deploy to production:

```bash
vercel --prod
```

---

## Step 4: Update CORS Origins

After deployment, you'll get a Vercel URL like `https://farmvoice-xxxxx.vercel.app`

**Important**: Update your `CORS_ORIGINS` environment variable to include this URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `CORS_ORIGINS`
3. Add your new Vercel URL:
   ```
   https://farmvoice-xxxxx.vercel.app,http://localhost:3000
   ```
4. Redeploy:
   ```bash
   vercel --prod
   ```

---

## Step 5: Verify Deployment

### Test Frontend

Visit your Vercel URL: `https://farmvoice-xxxxx.vercel.app`

### Test Backend API

Test the health check endpoint:

```bash
curl https://farmvoice-xxxxx.vercel.app/api/health
```

Should return:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T06:41:13.123456Z"
}
```

### Test Authentication

Try registering/logging in through your deployed frontend.

---

## Troubleshooting

### Check Logs

View real-time logs:

```bash
vercel logs
```

Or view logs in the Vercel Dashboard → Your Project → Logs

### Common Issues

1. **"Module not found" error**

   - Check that all dependencies are in `package.json` (frontend) and `api/requirements.txt` (backend)
   - Redeploy: `vercel --prod`

2. **CORS errors**

   - Verify `CORS_ORIGINS` includes your Vercel URL
   - Check backend/main.py CORS configuration

3. **Environment variables not working**

   - Environment variables are only applied on new deployments
   - After adding/changing env vars, redeploy: `vercel --prod`

4. **Ollama/Voice features not working**

   - Ollama cannot run on Vercel serverless
   - Consider using Gemini API or OpenAI API instead
   - Or deploy backend separately (Railway, Render, etc.)

5. **Timeout errors**
   - Vercel free tier: 10s limit
   - Vercel Pro: 60s limit
   - Optimize slow endpoints or upgrade plan

---

## Using Environment Variables from Your .env File

If you have your environment variables in `backend/.env`, here's how to transfer them:

1. **View your .env file** (you have it open in your editor)
2. **Copy each variable** to Vercel using one of the methods above
3. **Test the deployment** to ensure everything works

**Security Note**: Never commit `.env` files to Git. They're already in `.gitignore`.

---

## Next Steps

After successful deployment:

1. ✅ Test all features (auth, crop recommendation, disease diagnosis, etc.)
2. ✅ Set up custom domain (optional) in Vercel Dashboard
3. ✅ Configure analytics (Vercel Analytics is included)
4. ✅ Set up monitoring and alerts
5. ✅ Consider backend alternatives for Ollama (if using voice features)

---

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# View environment variables
vercel env ls

# Remove project (if needed)
vercel remove farmvoice
```

---

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Python on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
