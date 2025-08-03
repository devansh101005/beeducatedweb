# Deployment Guide

## The CORS Issue Solution

The error you're seeing happens because the environment variable is being set incorrectly, causing URLs like `https://beeducated.co.in/%22%22/api/auth/login`.

## Quick Fix

### Step 1: Update Vercel Environment Variables

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. **IMPORTANT**: Delete the `VITE_API_BASE_URL` environment variable entirely
   - Don't set it to an empty string with quotes
   - Just delete it completely or leave it undefined
4. This will make the app use relative URLs in production

### Step 2: Redeploy

1. After deleting/clearing the environment variable, redeploy your app
2. Or trigger a new deployment by pushing any small change

## How it works

- **Development**: No `VITE_API_BASE_URL` → Uses `http://localhost:5000`
- **Production**: No `VITE_API_BASE_URL` → Uses relative URLs like `/api/auth/login`
- **Vercel rewrites**: `/api/*` → `https://beeducatedweb-backend.onrender.com/api/*`

## The Problem You Had

The environment variable was set to `""` (with quotes), which became `%22%22` in the URL. The new code handles this properly by:

1. Detecting quoted empty strings
2. Using relative URLs in production (Vercel)
3. Using localhost in development

## Testing

After deployment, check:
1. Network tab should show calls to `/api/auth/login` (relative URLs)
2. No more CORS errors
3. No more `%22%22` in URLs
4. Login/signup should work properly

## Alternative: Direct Backend Calls

If you prefer to call the backend directly:
- Set `VITE_API_BASE_URL=https://beeducatedweb-backend.onrender.com`
- But the proxy approach is recommended for better security and performance