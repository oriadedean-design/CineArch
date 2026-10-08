import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// The guide reads union data from Supabase at build time. Locally that uses
// the app's ../.env.local; in CI / Vercel set SUPABASE_URL and SUPABASE_ANON_KEY.
const rootEnv = loadEnv(process.env.NODE_ENV ?? 'production', '..', 'VITE_');
process.env.SUPABASE_URL ??= rootEnv.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY ??= rootEnv.VITE_SUPABASE_ANON_KEY;

// Canonical origin of the public site. Set SITE_URL in Vercel once the
// custom domain is attached (e.g. https://cinearch.ca).
const site = process.env.SITE_URL || 'https://cinearch-guide.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: page => !page.includes('/search/') && !page.includes('/404') })],
  vite: {
    // The guide imports the union engine and types from the app's services/ folder.
    server: { fs: { allow: ['..'] } },
  },
});
