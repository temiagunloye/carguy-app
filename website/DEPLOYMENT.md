# Car Guy App Website - Deployment Guide

## 🚀 Quick Start (Local Development)

The website is ready to run locally:

```bash
cd /Users/temiagunloye/Desktop/carguy-app/website
npm install
npm run dev
```

The site will be available at **http://localhost:5173**

---

## 📦 Build for Production

To create a production-ready build:

```bash
npm run build
```

This creates an optimized bundle in the `dist/` folder.

To preview the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

**Why Vercel:**
- Automatic SSL
- Global CDN
- Zero configuration
- Free tier available
- Perfect for static sites

**Steps:**

1. **Install Vercel CLI** (one-time):
   ```bash
   npm install -g vercel
   ```

2. **Deploy from website directory**:
   ```bash
   cd /Users/temiagunloye/Desktop/carguy-app/website
   vercel
   ```

3. **Follow prompts**:
   - Link to your account (creates one if needed)
   - Confirm project settings
   - Deploy!

4. **Get deployment URL**: Vercel gives you a URL like `your-project.vercel.app`

5. **Connect custom domain** (next section)

---

### Option 2: Netlify

**Steps:**

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   cd /Users/temiagunloye/Desktop/carguy-app/website
   netlify deploy --prod
   ```

3. **Point to dist folder** when prompted

4. **Get deployment URL**

---

### Option 3: GitHub Pages

**Steps:**

1. **Create a GitHub repo** for the website

2. **Add deployment script** to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

---

## 🔗 Connecting Your GoDaddy Domain

### Step 1: Deploy to Vercel/Netlify First

Complete deployment to Vercel or Netlify to get your hosting target.

### Step 2: Get DNS Records from Your Host

**For Vercel:**
After adding your domain in Vercel dashboard, you'll get:
- **A Record**: `76.76.21.21` (example - use Vercel's actual IP)
- **CNAME**: `cname.vercel-dns.com` (example - use Vercel's actual value)

**For Netlify:**
- **A Record**: Netlify's load balancer IP
- **CNAME for www**: `your-site.netlify.app`

### Step 3: Configure GoDaddy DNS

1. **Log into GoDaddy**
2. **Go to**: My Products → Domains → [Your Domain] → DNS
3. **Delete conflicting records**:
   - Remove existing A records pointing to GoDaddy parking
   - Remove existing CNAME for www (if any)

4. **Add new records**:

   **A Record (for root domain)**:
   ```
   Type: A
   Name: @
   Value: [Your hosting provider's IP from Step 2]
   TTL: 600 seconds (10 minutes)
   ```

   **CNAME Record (for www)**:
   ```
   Type: CNAME
   Name: www
   Value: [Your hosting provider's CNAME from Step 2]
   TTL: 1 Hour
   ```

5. **Save all records**

### Step 4: Verify Domain in Hosting Platform

- **Vercel**: Go to Project Settings → Domains → Add your domain
- **Netlify**: Go to Domain Settings → Add custom domain

### Step 5: Enable SSL (Automatic)

Both Vercel and Netlify automatically provision SSL certificates via Let's Encrypt.

- **Vercel**: SSL enabled within minutes
- **Netlify**: SSL enabled within minutes

### Step 6: Configure Redirects

**Root to www (or vice versa):**

Both platforms handle this automatically. In your platform dashboard:
- Vercel: Add both `example.com` and `www.example.com`, set primary
- Netlify: Add both domains, configure redirect in settings

**Force HTTPS:**
- Automatically enforced by both platforms

---

## ⏱️ DNS Propagation

- **Typical time**: 15 minutes to 48 hours
- **Check status**: https://dnschecker.org

**What to expect:**
1. First 15 min: May not work
2. After 1 hour: Usually works in most locations
3. After 24 hours: Fully propagated globally

---

## ✅ Post-Deployment Checklist

After DNS propagation:

- [ ] Visit `https://yourdomain.com` - loads correctly
- [ ] Visit `https://www.yourdomain.com` - redirects to root (or vice versa)
- [ ] HTTP redirects to HTTPS automatically
- [ ] All pages load (Home, Pricing, About, Support, Privacy, Terms)
- [ ] All navigation links work
- [ ] Mobile responsive (test on phone)
- [ ] FAQ accordion works
- [ ] Contact form (if functional) works
- [ ] Social links work

---

## 🔧 Troubleshooting

### "DNS_PROBE_FINISHED_NXDOMAIN" Error
- **Cause**: DNS not propagated yet or wrong A record
- **Fix**: Wait longer, verify A record points to correct IP

### "This site can't provide a secure connection"
- **Cause**: SSL not provisioned yet
- **Fix**: Wait 10-15 minutes, refresh. Clear browser cache.

### "404 Not Found" on subpages
- **Cause**: Server not configured for client-side routing
- **Fix**: Both Vercel and  Netlify handle this automatically. If using another host, add redirect rules.

### www not redirecting
- **Cause**: CNAME not configured or redirect not set
- **Fix**: Verify CNAME record, check platform redirect settings

### Images not loading
- **Cause**: Incorrect paths after build
- **Fix**: All paths in HTML are absolute (`/assets/...`), should work automatically

---

## 📊 Performance Optimization (Already Implemented)

✅ Minified CSS/JS
✅ Optimized images
✅ Lazy loading attributes
✅ Efficient font loading (Google Fonts with display=swap)
✅ Minimal JavaScript
✅ Responsive images

**Expected Lighthouse Score:**
- Performance: 95-100
- Accessibility: 95-100
- SEO: 100

---

## 🔄 Making Updates

### Update Website Content

1. **Edit files** in `/website/` directory
2. **Test locally**:
   ```bash
   npm run dev
   ```
3. **Build**:
   ```bash
   npm run build
   ```
4. **Deploy**:
   ```bash
   vercel --prod
   # or
   netlify deploy --prod
   ```

### Update Screenshots

Replace files in `/website/assets/images/`:
- `app-visualizer.png` - Main value prop phone mockup
- `app-shop-1.png`, `app-shop-2.png`, `app-shop-3.png` - B2B section
- Add new screenshots as needed

Then rebuild and redeploy.

---

## 📝 Environment Variables (If Needed Later)

If you add a contact form backend or analytics:

**Vercel:**
```bash
vercel env add CONTACT_FORM_API_KEY
```

**Netlify:**
Add in Site Settings → Environment Variables

---

## 🎯 Next Steps

1. ✅ Website built and ready
2. Choose hosting: Vercel (recommended) or Netlify
3. Deploy using commands above
4. Configure GoDaddy DNS
5. Wait for DNS propagation
6. Verify everything works
7. Launch! 🚀

---

## 📧 Support Contacts

If you need help:
- **Vercel Support**: https://vercel.com/support
- **Netlify Support**: https://answers.netlify.com
- **GoDaddy Support**: https://www.godaddy.com/help

---

## 🎨 Design Assets Locations

- **Favicon**: `/website/assets/icons/favicon.png`
- **OG Image**: `/website/assets/images/og-image.png`
- **App Screenshots**: `/website/assets/images/IMG_*.png`
- **Symlinks**: `app-visualizer.png`, `app-shop-*.png`

---

**The website is production-ready and follows all best practices for modern web deployment!**
