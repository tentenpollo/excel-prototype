# Vercel Deployment Guide 🚀

Complete step-by-step guide to deploy Agent Genius CRM to Vercel.

---

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Supabase project set up with data
- [ ] Git installed locally
- [ ] Code tested locally and working

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd "c:\Users\Alessandro\Documents\agentgenius\Excel\prototype"
git init
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `agentgenius-crm`)
3. **Do NOT** initialize with README (we already have one)
4. Copy the repository URL

### 1.3 Link and Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/agentgenius-crm.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Production-ready CRM"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository (`agentgenius-crm`)
   - Click "Import"

3. **Configure Build Settings**
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

   > ⚠️ **Important**: Make sure to use the exact variable names with `VITE_` prefix

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? [Your account]
# - Link to existing project? No
# - What's your project name? agentgenius-crm
# - In which directory is your code? ./
# - Want to modify settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted

# Deploy to production
vercel --prod
```

---

## Step 3: Verify Deployment

### 3.1 Check Build Logs

1. In Vercel dashboard, go to your project
2. Click on "Deployments"
3. Click on the latest deployment
4. Review build logs for any errors

### 3.2 Test Your Application

Visit your deployment URL and test:

- [ ] Map loads correctly
- [ ] Dashboard shows data
- [ ] Prospects list loads
- [ ] Can view prospect details
- [ ] Search functionality works
- [ ] Filters work on map
- [ ] Can save changes to prospects
- [ ] Data persists after refresh

### 3.3 Common Issues & Fixes

**Issue**: Environment variables not working
- **Fix**: Make sure variables start with `VITE_`
- **Fix**: Redeploy after adding variables

**Issue**: 404 on page refresh
- **Fix**: Already handled by `vercel.json` rewrites

**Issue**: Map not loading
- **Fix**: Check browser console for API errors
- **Fix**: Verify Supabase credentials are correct

**Issue**: Data not loading
- **Fix**: Check Supabase RLS policies
- **Fix**: Verify database has data

---

## Step 4: Set Up Custom Domain (Optional)

1. Go to your project in Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed by Vercel
5. Wait for SSL certificate to provision (automatic)

---

## Step 5: Enable Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Vercel will automatically build and deploy
```

### Branch Deployments

- **Main branch** → Production deployment
- **Other branches** → Preview deployments

---

## Step 6: Monitor Your Application

### Vercel Analytics (Free)

1. Go to your project → "Analytics"
2. View page views, unique visitors, performance

### Error Monitoring

1. Go to "Monitoring" tab
2. View runtime errors
3. Set up email notifications

---

## Environment Variable Reference

Required for production:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Build Optimization Tips

### 1. Enable Compression
Already handled by Vercel automatically

### 2. Optimize Images
Use Vercel Image Optimization (if adding images later)

### 3. Monitor Bundle Size
```bash
npm run build

# Check dist/ folder size
# Aim for < 1MB for optimal performance
```

---

## Rollback Procedure

If you need to rollback to a previous version:

1. Go to Vercel dashboard → "Deployments"
2. Find the working deployment
3. Click "..." → "Promote to Production"

---

## Production Checklist

Before going live:

- [ ] All features tested locally
- [ ] Database migrations run in Supabase
- [ ] Environment variables configured in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring enabled
- [ ] Performance tested (Lighthouse score > 90)
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested (Chrome, Firefox, Safari)
- [ ] Supabase RLS policies configured
- [ ] SSL certificate active (automatic on Vercel)

---

## Support & Troubleshooting

### Vercel Support
- Documentation: [vercel.com/docs](https://vercel.com/docs)
- Support: [vercel.com/support](https://vercel.com/support)

### Supabase Support
- Documentation: [supabase.com/docs](https://supabase.com/docs)
- Discord: [discord.supabase.com](https://discord.supabase.com)

---

## Next Steps After Deployment

1. **Set up monitoring alerts**
2. **Configure backup strategy for Supabase**
3. **Enable Vercel Analytics**
4. **Set up staging environment** (create a `staging` branch)
5. **Document API endpoints** (if adding backend later)

---

## Estimated Costs

- **Vercel Free Tier**: Unlimited personal projects
- **Supabase Free Tier**: 500MB database, 50k monthly active users
- **Total Cost**: $0/month for small-medium usage

Upgrade as needed when limits are reached.

---

**Deployment should take 10-15 minutes total. Good luck! 🎉**
