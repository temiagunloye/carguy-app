# Car Guy App Website - README

## 🚗 Overview

Premium marketing website for **Car Guy App** by ThatAppCompany. Built with Vite, vanilla HTML/CSS/JS for maximum performance and simplicity.

**Live Dev Server**: http://localhost:5173 (when running)

---

## 🎨 Design

- **Theme**: Dark "garage premium" aesthetic
- **Colors**: Charcoal backgrounds with electric blue accents
- **Typography**: Inter font family
- **Style**: Minimal, high-contrast, clean glow effects

---

## 📁 Structure

```
website/
├── index.html          # Homepage
├── pricing.html        # Pricing page ├── about.html          # About page
├── support.html        # Support/Contact
├── privacy.html        # Privacy Policy
├── terms.html          # Terms of Service
├── css/
│   ├── design-system.css   # Design tokens & variables
│   ├── components.css      # Reusable components
│   └── styles.css          # Main styles & homepage
├── js/
│   └── main.js            # Navigation, FAQ, animations
├── assets/
│   ├── images/            # App screenshots, OG image
│   ├── mockups/           # Phone mockups (if custom)
│   └── icons/             # Favicon
├── package.json
├── vite.config.js
├── DEPLOYMENT.md          # Full deployment guide
└── README.md             # This file
```

---

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

Website opens at **http://localhost:5173**

### Production Build

```bash
npm run build
```

Output in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## 🎯 Features

### Pages
- ✅ Homepage with all sections from screenshots
- ✅ Pricing (3-tier: Basic/Pro/Premium)
- ✅ About (ThatAppCompany story)
- ✅ Support/Contact
- ✅ Privacy Policy
- ✅ Terms of Service

### Components
- ✅ Sticky navigation with mobile menu
- ✅ Hero section with gradient background
- ✅ Phone mockups for app screenshots
- ✅ Feature cards
- ✅ Pricing comparison table
- ✅ FAQ accordion
- ✅ CTA banners
- ✅ Footer with social links

### Interactions
- ✅ Smooth scroll to sections
- ✅ FAQ accordion (click to expand)
- ✅ Mobile hamburger menu
- ✅ Hover effects on cards and buttons
- ✅ Fade-in animations on scroll

---

## 📱 Responsive Design

- **Mobile**: 375px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

All layouts are mobile-first and fully responsive.

---

## 🖼️ Assets

### App Screenshots
Located in `/assets/images/`:
- `app-visualizer.png` - Main visualization demo
- `app-shop-1.png`, `app-shop-2.png`, `app-shop-3.png` - Shop features
- `IMG_*.png` - Original app screenshots

### Branding
- **Favicon**: `/assets/icons/favicon.png`
- **OG Image**: `/assets/images/og-image.png` (1200x630px for social sharing)

To replace screenshots:
1. Add new images to `/assets/images/`
2. Update symlinks or references in HTML
3. Rebuild: `npm run build`

---

## 🎨 Customization

### Colors

Edit in `css/design-system.css`:

```css
:root {
  --bg-primary: #0B0F14;
  --accent-primary: #3B82F6;
  /* ... more variables */
}
```

### Typography

Change fonts in `css/styles.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
```

### Copy

All text is in HTML files. Search for specific sections and edit directly.

---

## 🔍 SEO

### Meta Tags
All pages include:
- Title tags
- Meta descriptions
- Open Graph tags (Facebook, Twitter)
- Proper heading hierarchy

### Performance
- Minified CSS/JS in production
- Lazy loading on images
- Optimized font loading
- Clean semantic HTML

---

## 🌐 Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete instructions.

**TL;DR:**
```bash
# Option 1: Vercel (easiest)
npm install -g vercel
vercel

# Option 2: Netlify
npm install -g netlify-cli
netlify deploy --prod

# Option 3: Manual
npm run build
# Upload dist/ folder to any static host
```

---

## 🔗 Domain Setup (GoDaddy)

After deploying to Vercel/Netlify:

1. Get A record and CNAME from hosting provider
2. Log into GoDaddy DNS settings
3. Add A record for `@` (root)
4. Add CNAME for `www`
5. Wait for DNS propagation (15 min - 48 hrs)

Full guide in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

---

## 🐛 Troubleshooting

### Dev server won't start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Images not loading
- Check paths are absolute: `/assets/images/...`
- Verify files exist in `/assets/` directory
- Clear browser cache

### Mobile menu not working
- Check `js/main.js` is loaded
- Open browser console for errors

### Styles not applying
- Check CSS import order in HTML
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows)

---

## 📊 Tech Stack

- **Build Tool**: Vite 5.x
- **CSS**: Vanilla CSS with CSS variables
- **JS**: Vanilla JavaScript (no frameworks)
- **Fonts**: Google Fonts (Inter)
- **Icons**: Emoji (can be replaced with icon library)

---

## 📝 Making Updates

### Update Content
1. Edit HTML files directly
2. Test: `npm run dev`
3. Build: `npm run build`
4. Deploy: `vercel --prod` or `netlify deploy --prod`

### Add New Page
1. Create `new-page.html` in root
2. Add to `vite.config.js`:
   ```js
   input: {
     // ... existing pages
     newpage: resolve(__dirname, 'new-page.html'),
   }
   ```
3. Add navigation link in all pages
4. Rebuild and deploy

---

## ✅ Checklist Before Launch

- [ ] Replace placeholder email addresses
- [ ] Update social media links
- [ ] Test all forms (if functional)
- [ ] Verify all navigation links
- [ ] Test on mobile device
- [ ] Run Lighthouse audit
- [ ] Check all images load
- [ ] Spell check all copy
- [ ] Configure domain DNS
- [ ] Enable SSL (automatic on Vercel/Netlify)
- [ ] Set up analytics (Google Analytics, Plausible, etc.)

---

## 🎯 Performance Targets

### Lighthouse Scores (Expected)
- **Performance**: 95-100
- **Accessibility**: 95-100
- **Best Practices**: 100
- **SEO**: 100

### Load Times
- **First Contentful Paint**: < 1s
- **Largest Contentful Paint**: < 2s
- **Time to Interactive**: < 3s

---

## 📧 Support

For questions or issues:
- Check **[DEPLOYMENT.md](DEPLOYMENT.md)**
- Review code comments in files
- Test in browser dev tools

---

**Built with ⚡ by Antigravity for ThatAppCompany**
