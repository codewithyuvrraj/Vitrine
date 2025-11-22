# Supabase to Nhost + Cloudinary Migration Guide

## Migration Steps Completed

### 1. Project Structure
- ✅ Created React/Vite setup with `src/` directory
- ✅ Added Nhost client configuration
- ✅ Created upload component with Cloudinary integration
- ✅ Updated package.json with React dependencies

### 2. Database Schema
- ✅ Created `nhost-schema.sql` with all necessary tables
- ✅ Added auto-profile creation trigger

### 3. Configuration Files
- ✅ `nhost.toml` - Nhost deployment config
- ✅ `vite.config.js` - Vite build configuration
- ✅ `.env.example` - Environment variables template

## Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Nhost Project
1. Create account at https://nhost.io
2. Create new project
3. Update subdomain and region in `src/lib/nhost.js`
4. Run the SQL schema in Nhost console

### 3. Set up Cloudinary
1. Create account at https://cloudinary.com
2. Create unsigned upload preset named `nhost_upload`
3. Update cloud name in components

### 4. Environment Variables
```bash
cp .env.example .env
# Update with your actual values
```

### 5. Development
```bash
npm run dev
```

### 6. Build & Deploy
```bash
npm run build
```

## Key Changes from Supabase

### Authentication
- Replace `supabase.auth` with `nhost.auth`
- Use `@nhost/react` hooks like `useAuthenticationStatus`

### Database
- Replace SQL queries with GraphQL mutations/queries
- Use `nhost.graphql.request()` instead of Supabase client

### File Upload
- Direct upload to Cloudinary instead of Supabase Storage
- Unsigned uploads for security

### Real-time
- Use Nhost subscriptions instead of Supabase realtime

## Migration Checklist

- [ ] Update Nhost subdomain/region
- [ ] Create Cloudinary unsigned preset
- [ ] Run database schema
- [ ] Convert existing components to React
- [ ] Replace Supabase auth with Nhost auth
- [ ] Replace SQL with GraphQL
- [ ] Test file uploads
- [ ] Deploy to production

## Deployment Options

### Option A: Nhost Frontend Hosting
- Push code to GitHub
- Connect repository in Nhost dashboard
- Automatic deployments

### Option B: Vercel/Netlify
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variables

### Option C: GitHub Pages
- Set `base: './'` in vite.config.js
- Use gh-pages action for deployment