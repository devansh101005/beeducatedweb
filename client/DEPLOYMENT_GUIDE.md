# Deployment Guide

## The CORS Issue Solution

The error you're seeing happens because your frontend is trying to call `https://www.beeducated.co.in/api/*` which gets redirected instead of properly proxied to your backend.

## Quick Fix

### Step 1: Update Vercel Environment Variables

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Set `VITE_API_BASE_URL` to an **empty string**: `""`
   - This makes your app use relative URLs like `/api/auth/login`
   - Vercel rewrites will then proxy these to your Render backend

### Step 2: Redeploy

1. After updating the environment variable, redeploy your app
2. Or trigger a new deployment by pushing any small change

## How it works

- **Development**: `VITE_API_BASE_URL=""` → Falls back to `http://localhost:5000`
- **Production**: `VITE_API_BASE_URL=""` → Uses relative URLs like `/api/auth/login`
- **Vercel rewrites**: `/api/*` → `https://beeducatedweb-backend.onrender.com/api/*`

## Alternative: Direct Backend Calls

If you prefer to call the backend directly (not recommended):
- Set `VITE_API_BASE_URL=https://beeducatedweb-backend.onrender.com`
- Make sure your backend CORS allows your frontend domain

## Testing

After deployment, check:
1. Network tab should show calls to `/api/auth/login` (relative)
2. No more CORS errors
3. Login/signup should work properly