# Environment Variables for Vercel Deployment

Copy the values from your `backend/.env` file and set them in Vercel Dashboard:

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project: **farmvoice-pro**
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. For each variable below, click **Add** and fill in:
   - **Key**: Variable name (e.g., `SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environments**: Check all three (Production, Preview, Development)
6. Click **Save**

### Method 2: Vercel CLI

Run these commands to add environment variables:

```bash
# Navigate to project
cd "c:\Users\P.SUDHAKAR BABU\Downloads\farmvoicePro"

# Add each variable
vercel env add SUPABASE_URL production
# Then paste your SUPABASE_URL value when prompted

vercel env add SUPABASE_KEY production
# Paste your SUPABASE_KEY value

vercel env add SUPABASE_SERVICE_KEY production
# Paste your SUPABASE_SERVICE_KEY value

vercel env add JWT_SECRET_KEY production
# Paste your JWT_SECRET_KEY value

vercel env add JWT_ALGORITHM production
# Enter: HS256

vercel env add CORS_ORIGINS production
# Enter: https://farmvoice-pro.vercel.app,http://localhost:3000

vercel env add GOOGLE_API_KEY production
# Paste your Google Gemini API key (required for voice assistant)
```

---

## Required Environment Variables

Copy these from your `backend/.env` file:

### 1. SUPABASE_URL

**Description**: Your Supabase project URL  
**Example**: `https://xxxxxxxxxxxxx.supabase.co`  
**Where to find**: Supabase Dashboard → Project Settings → API

### 2. SUPABASE_KEY

**Description**: Supabase Anonymous/Public Key (anon key)  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Where to find**: Supabase Dashboard → Project Settings → API → anon/public key

### 3. SUPABASE_SERVICE_KEY

**Description**: Supabase Service Role Key (secret!)  
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Where to find**: Supabase Dashboard → Project Settings → API → service_role key  
**⚠️ WARNING**: This is a secret key, never expose it publicly!

### 4. JWT_SECRET_KEY

**Description**: Secret key for JWT token generation  
**Example**: `your-super-secret-random-string-here-change-this`  
**Recommendation**: Use a long random string (32+ characters)  
**Generate one**: `openssl rand -base64 32` or use https://www.grc.com/passwords.htm

### 5. JWT_ALGORITHM

**Description**: Algorithm for JWT encoding  
**Value**: `HS256` (default, use this unless you have specific requirements)

### 6. CORS_ORIGINS

**Description**: Allowed origins for CORS  
**Value**: `https://farmvoice-pro.vercel.app,http://localhost:3000`  
**Note**: Add your custom domain if you have one

### 7. GOOGLE_API_KEY (Required for Voice Assistant)

**Description**: Google Gemini API key for AI voice responses  
**Example**: `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  
**Where to get**: https://makersuite.google.com/app/apikey  
**Note**: Voice assistant won't work without this since Ollama can't run on Vercel

---

## After Setting Environment Variables

1. **Redeploy** your application for changes to take effect:

   ```bash
   vercel --prod
   ```

2. **Test the deployment**:
   - Visit: https://farmvoice-pro.vercel.app
   - Try logging in or creating an account
   - Test voice assistant (requires GOOGLE_API_KEY)

---

## Important Notes

- ✅ All environment variables must be set before deploying
- ✅ Changes to environment variables require a new deployment
- ✅ GOOGLE_API_KEY is essential for voice queries (Ollama doesn't work on Vercel)
- ⚠️ Keep SUPABASE_SERVICE_KEY and JWT_SECRET_KEY secret
- ⚠️ Never commit `.env` files to Git
