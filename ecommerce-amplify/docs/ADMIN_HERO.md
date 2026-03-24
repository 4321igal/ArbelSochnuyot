# Homepage hero (admin CMS)

## What was added

- **DynamoDB (Amplify Data):** `SiteHero` model — singleton id `hero-main` (title, subtitle, ctaText, ctaLink, imageKey, updatedAt).
- **S3:** path `images/hero/*` (guest read; authenticated write; Admin full access).
- **Admin UI:** `/admin/hero` — edit fields, upload image (validate JPG/PNG/WebP, max 2MB, resize in browser), live preview, toasts.
- **Storefront:** `HomePage` loads hero via `getSiteHero()` + `resolvePublicHero()`; `PublicHeroSection` renders full-width background + gradient + left-aligned copy.

## REST-style API mapping (this project uses Amplify Data + Storage)

| Typical REST | This stack |
|--------------|------------|
| `GET /api/hero` | `getSiteHero()` → `client.models.SiteHero.get({ id: 'hero-main' })` |
| `POST /api/hero` | `saveSiteHero(input)` → `SiteHero.create` or `SiteHero.update` |
| `POST /api/upload` (presigned) | `uploadHeroImage(file, onProgress)` → Amplify `uploadData` to `images/hero/…` (managed upload; same bucket IAM rules as presigned PUT for auth users) |

Public read uses `allow.guest().to(['read'])` on `SiteHero` so the home page works without login.

## Folder structure (new / touched)

```
amplify/data/resource.ts          # SiteHero model
amplify/storage/resource.ts       # images/hero/* rules
src/lib/api/siteHero.ts           # getSiteHero, saveSiteHero, types
src/lib/api/storage.ts            # uploadHeroImage
src/lib/hero/heroImage.ts         # validate + canvas compress
src/components/hero/PublicHeroSection.tsx
src/pages/admin/AdminHeroPage.tsx
src/pages/HomePage.tsx            # uses hero + PublicHeroSection
src/routes/lazy.tsx               # AdminHeroPage
src/App.tsx                       # /admin/hero route
src/components/layout/AdminLayout.tsx  # nav link
```

## Run locally

1. From `ecommerce-amplify`, deploy or refresh backend so `SiteHero` exists:

   ```bash
   npx ampx sandbox
   ```

   (Or your usual pipeline deploy.) This regenerates `amplify_outputs.json`.

2. Ensure your admin user is in the Cognito **Admin** group (required for `/admin/hero` — same as other admin-only pages).

3. Start the app:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173/admin/hero`, sign in as admin, edit and **Save hero**. The storefront home picks up changes on refresh.

## Security

- **Edit:** Admin Cognito group only (`saveSiteHero` / Storage write).
- **Read:** Public (`getSiteHero` for home).
- **Inputs:** Validated in `saveSiteHero` (lengths, CTA path/external URL).
- **Images:** Type + size validation; client-side resize; **imageKey** stored in DB — URLs are signed at runtime only.

## Performance

- Hero image: `loading="lazy"`, optional compression to max width 1920px, CDN via S3/CloudFront when configured in Amplify Hosting.
