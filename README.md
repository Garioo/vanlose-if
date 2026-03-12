## Vanløse IF Web

Next.js 16 app with public site pages, Supabase-backed content/admin, form inbox, and production-baseline observability.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Environment Variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_PASSWORD=
ADMIN_JWT_SECRET=

NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
NEXT_PUBLIC_PLAUSIBLE_API_HOST= # optional, defaults to https://plausible.io

NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN= # optional if server-side DSN differs
```

## Useful Scripts

```bash
npm run lint
npm run build
npm run test:api
npm run test:e2e
```

`test:api` and `test:e2e` run Playwright against a production server (`next start`) after build.

## Notes

- Dedicated compliance pages: `/privatlivspolitik` and `/cookiepolitik`
- SEO routes: `/sitemap.xml` and `/robots.txt`
- Admin inbox supports filtering, search, “kun nye”, and bulk status updates

## Deployment

Deploy on Vercel or any Node.js host that supports Next.js 16.

Remember to set all environment variables above in your deployment environment.
