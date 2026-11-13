# Plumbers on Call CORP — website

Marketing site for Plumbers on Call CORP (residential & commercial plumbing, Greater Boston, 24/7).
Next.js 16 App Router · React 19 · TypeScript · CSS Modules. No UI or animation libraries.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (must pass before deploying)
npx tsc --noEmit     # typecheck
npm run lint
node --test lib/inquiry.test.ts   # inquiry validation tests (Node 22.6+/24)
```

## Where things live

| Path | What |
| --- | --- |
| `content/company.ts` | **Single source of business facts** — name, phone, email, owner, region, `bookingUrl`, `reviewUrl`, `license`. Fields left `null` are hidden in the UI until filled. |
| `content/services.ts` | Copy for the six service pages (title, intro, project types, considerations, FAQs, SEO). |
| `content/projects.ts` | Completed projects — **genuine photos only**. Empty today. Adding an entry creates `/work/<slug>`, lists it on `/work` and Home, and adds it to the sitemap. |
| `content/testimonials.ts` | Verified public reviews, copied word for word with a source link. The Home section stays hidden while empty. |
| `content/scopes.ts` | "Kinds of work we take on" shown while there are no projects. |
| `content/images.ts` | Every image with alt text and provenance. All current images are illustrative and are labeled on the page. |
| `app/` | Routes (see below), `sitemap.ts`, `robots.ts`, `api/inquiry/route.ts`. |
| `components/site` | Header (desktop nav + `<dialog>` mobile menu), Footer, MobileCallBar, Wordmark. |
| `components/home` | Home sections: Hero, PocStandard, ServicesShowcase, WorkPreview, WhyPoc, AboutBridge, AreaPreview, Testimonials. |
| `components/ui` | Shared primitives: PageHero, CtaBand, SiteImage, TrackedLink, Icon, JsonLd, RevealObserver. |
| `components/forms` | InquiryForm (client). |
| `lib/` | `inquiry.ts` (validation/spam/email formatting, shared by client and server), `seo.ts` (metadata + JSON-LD), `analytics.ts`. |
| `app/globals.css` | Design tokens (palette, type scale, spacing, motion) and global primitives (`.btn`, `.eyebrow`, `.display-*`, `.container`, `[data-reveal]`). |
| `public/brand` | Approved wordmark renditions, hero stone, stone texture. |
| `public/images` | `illustrative/` (generated scenes from the phase1 project) and `stock/` (Unsplash). |
| `scripts/prepare-brand-assets.mjs` | Regenerates `public/brand`, illustrative crops and `og.jpg` from the phase1 approved artwork. |

## Routes

`/` · `/services` · `/services/{boilers-heating, water-heaters, bathroom-plumbing, residential-plumbing, commercial-plumbing, emergency-plumbing}` · `/work` · `/work/[slug]` (real projects only) · `/about` · `/service-areas` · `/contact` (`?service=<slug>` preselects the service) · `/privacy` · 404.

## Brand assets

The wordmark is the owner-approved v6 artwork (`Documents/ChatGPT/3d WEB/plumbers-on-call-phase1`). It is never redrawn:
- `wordmark.webp` — the unaltered crop, used only on the hero stone it came from.
- `wordmark-alpha.webp` — the same pixels made transparent by colour-to-alpha against the original stone, for header, footer and menu.

## Motion

CSS only, plus one IntersectionObserver (`RevealObserver`). Content is server-rendered visible; an inline head script adds `html.js` so unseen `[data-reveal]` elements start hidden and fade in. If JS fails, a 3.5 s safety net removes the class. Image drift uses CSS scroll-driven animations (progressive enhancement, desktop only). Route crossfades use React `<ViewTransition>`. `prefers-reduced-motion` disables all of it.

## Contact form and booking

- The form renders **only** when both `RESEND_API_KEY` and `INQUIRY_TO_EMAIL` are set (see `.env.example`). Without them, `/contact` shows phone + email instead, so the site never shows a form that cannot deliver.
- Delivery: `POST /api/inquiry` → validation (same rules as the client) → honeypot + minimum fill time → Resend REST API. Logs never contain customer details. Rate limit is best-effort, per server instance.
- Works without JavaScript: the browser posts the form and is redirected back to `/contact?status=…`.
- To enable: create a Resend account, verify the sending domain (`plumberoncallcorp.com`), then set in Vercel → Settings → Environment Variables:
  - `RESEND_API_KEY`
  - `INQUIRY_TO_EMAIL` (where requests should arrive)
  - `INQUIRY_FROM_EMAIL` (e.g. `Website <requests@plumberoncallcorp.com>`).
- **Housecall Pro:** paste the verified online-booking URL into `company.bookingUrl`. "Book online" buttons appear automatically (closing CTA and contact page).

## Analytics

`lib/analytics.ts` forwards `phone_click`, `request_service_click`, `booking_click`, `inquiry_submitted` and `inquiry_failed` to `window.dataLayer` / Vercel Analytics **if** either is installed. Nothing is loaded today. If you add an analytics tool, update `/privacy` first.

## SEO

Per-page titles, descriptions, canonicals and Open Graph (`lib/seo.ts`). JSON-LD: `Plumber` on every page (verified facts only, no street address), plus `Service` and `BreadcrumbList` on service pages. `sitemap.xml` and `robots.txt` are generated from content. No thin city pages: add confirmed towns to `app/service-areas/page.tsx`.

## Deploy (Vercel)

Production is the existing Vercel project serving `plumberoncallcorp.com` (see `DEPLOYMENT.md` for domains/DNS — **no DNS changes are needed** for this redesign).

1. Push the branch and open a pull request → Vercel builds a **preview** URL (if the project is Git-connected; otherwise `npx vercel` from the branch creates a preview).
2. Review the preview on desktop and phone.
3. Set the environment variables above if the form should go live.
4. Merge to `main` (or `npx vercel --prod`) to publish.
