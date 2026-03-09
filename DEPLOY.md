# Deploying attahirlabs.com — 5 Minutes

This is a static site (pure HTML). Deploy it for free using **Netlify** (recommended) or Vercel.

---

## Option A: Netlify (Easiest — Drag & Drop)

1. Go to [netlify.com](https://netlify.com) and sign up for a free account (use GitHub login)
2. On your dashboard, drag and drop the **`attahirlabs-website/`** folder onto the page
3. Netlify will instantly deploy it and give you a URL like `random-name.netlify.app`
4. **To set up the custom domain `attahirlabs.com`:**
   - In Netlify: Site settings → Domain management → Add custom domain → `attahirlabs.com`
   - In your domain registrar (GoDaddy/Namecheap/etc.): Add a CNAME pointing to your Netlify subdomain, or use Netlify's nameservers
   - SSL is free and auto-configured by Netlify

**Required URL for Shopify:** `https://attahirlabs.com/privacy.html`

---

## Option B: Vercel (Also Free)

1. Install Vercel CLI: `npm i -g vercel`
2. From the `attahirlabs-website/` folder:
   ```bash
   cd /path/to/attahirlabs-website
   vercel
   ```
3. Follow prompts. Vercel detects static site automatically.
4. Add custom domain in Vercel dashboard → Domains → `attahirlabs.com`

---

## Option C: GitHub Pages (Free, No Account Needed)

1. Create a new GitHub repo: `attahirlabs-website`
2. Upload the files from `attahirlabs-website/` to the repo root
3. Repo settings → Pages → Source: Deploy from branch (main), root (/)
4. Site is live at `https://yourusername.github.io/attahirlabs-website/`
5. For custom domain: add `attahirlabs.com` in Pages settings + DNS CNAME record

---

## After Deployment — Update Shopify Toml

Once the site is live at `attahirlabs.com`, you need it for the Shopify Partner Dashboard:
- Privacy Policy URL: `https://attahirlabs.com/privacy.html`

---

## Site Structure

```
attahirlabs-website/
├── index.html     → Homepage (hero, 5 apps, about, footer)
├── privacy.html   → Privacy Policy (GDPR/CCPA compliant) ← REQUIRED for Shopify
├── terms.html     → Terms of Service
└── contact.html   → Contact page with email addresses
```

All files are self-contained (no external dependencies, no CDN, no framework).

---

_Hiro built this — March 6, 2026_
