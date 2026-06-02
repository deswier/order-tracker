# Family Orders Tracker — Setup Guide

## 1. Supabase Setup

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Go to **Authentication → Providers**, enable **Google**
4. Add your OAuth credentials (Google Cloud Console)
5. Add allowed redirect URLs:
   - `http://localhost:5173/auth/callback`
   - `https://your-app.vercel.app/auth/callback`
   - For Capacitor Android: `https://your-app.vercel.app/auth/callback` (same)

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in Supabase → **Project Settings → API**.

## 3. Assign Roles

After both users sign in for the first time, run in Supabase SQL Editor:

```sql
-- Set Daughter (creator) as ADMIN
UPDATE public.profiles SET role = 'ADMIN', display_name = 'Дочь'
WHERE id = '<daughter-google-user-id>';

-- Set Mother (buyer) as BUYER  
UPDATE public.profiles SET role = 'BUYER', display_name = 'Мама'
WHERE id = '<mother-google-user-id>';
```

Find user IDs in Supabase → **Authentication → Users**.

## 4. Local Development

```bash
nvm use 22
npm install
npm run dev
```

## 5. Vercel Deployment

```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Or via CLI:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## 6. Capacitor Android Build

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize (first time only)
npx cap init "Family Orders" "com.family.orders" --web-dir dist

# Build web app and sync
npm run cap:build

# Open in Android Studio
npm run cap:android
```

Required in Android Studio:
- Build → Generate Signed Bundle/APK for release
- Or Run on connected device for testing

### Supabase Auth for Android

In Supabase → Authentication → URL Configuration, add:
```
com.family.orders://login-callback/
```

Also in `capacitor.config.ts`, the `androidScheme: 'https'` ensures
Google OAuth redirects work correctly in the WebView.

## 7. PWA Installation

- **iPhone**: Open in Safari → Share → "Add to Home Screen"
- **Android**: Open in Chrome → menu → "Install app" or "Add to Home Screen"
- **Desktop**: Click the install icon in the address bar

## Financial Logic

```
balance = sum(actual_price WHERE purchased AND NOT return_flag AND NOT is_settled)
        - sum(actual_price WHERE return_flag)  
        - sum(actual_price WHERE is_settled)

balance > 0  → Daughter owes Mother
balance < 0  → Mother owes Daughter  
balance = 0  → All settled
```

## Push Notifications (TODO)

Not implemented in MVP. To add later:
- Use Supabase Edge Functions + Database Webhooks
- Trigger on `INSERT` to orders table → notify Mother
- Trigger on `UPDATE` to orders table → notify Daughter
- Use Web Push API or Capacitor Push Notifications plugin
