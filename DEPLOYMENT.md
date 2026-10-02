# Vercel deployment and Squarespace DNS

## Deploy

From the project directory:

```powershell
npx vercel login
npx vercel --prod
```

When Vercel asks, create a new project named `plumbers-on-call-corp` and accept the detected Next.js settings.

## Add the domains in Vercel

In the deployed project, open **Settings → Domains** and add both:

- `plumberoncallcorp.com` — set this as the primary production domain
- `www.plumberoncallcorp.com` — set this to redirect permanently to `plumberoncallcorp.com`

The application also includes a permanent host-based redirect as a second layer of protection.

## Squarespace DNS records assigned by Vercel

Open the domain's DNS settings in Squarespace. Remove the four existing Squarespace `A` records for `@` and the existing `www` CNAME. Keep mail records such as MX and TXT records intact. Add these exact records:

| Type | Host | Value | Purpose |
| --- | --- | --- | --- |
| A | `@` | `216.150.1.1` | Serves `plumberoncallcorp.com` |
| A | `@` | `216.150.16.1` | Redundant apex route |
| CNAME | `www` | `fc87a65fe8297b99.vercel-dns-016.com` | Enables the `www` redirect |

Remove these old Squarespace website records if they are present:

- `A @ 198.49.23.144`
- `A @ 198.49.23.145`
- `A @ 198.185.159.144`
- `A @ 198.185.159.145`
- `CNAME www ext-sq.squarespace.com`

After DNS verifies in Vercel, confirm that all four variants resolve as expected:

- `http://plumberoncallcorp.com` → `https://plumberoncallcorp.com`
- `https://plumberoncallcorp.com` → canonical homepage
- `http://www.plumberoncallcorp.com` → `https://plumberoncallcorp.com`
- `https://www.plumberoncallcorp.com` → `https://plumberoncallcorp.com`
