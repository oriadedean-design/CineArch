import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// The guide reads union data from Supabase at build time, with the app's
// own settings: VITE_SUPABASE_* from the environment (Vercel) or ../.env.local.
const rootEnv = loadEnv(process.env.NODE_ENV ?? 'production', '..', 'VITE_');
process.env.SUPABASE_URL ??= process.env.VITE_SUPABASE_URL ?? rootEnv.VITE_SUPABASE_URL;
process.env.SUPABASE_ANON_KEY ??= process.env.VITE_SUPABASE_ANON_KEY ?? rootEnv.VITE_SUPABASE_ANON_KEY;

// The guide is served by the app's Vercel project under /guide (see the
// root package.json build:vercel). Set SITE_URL once a custom domain is attached.
const site = process.env.SITE_URL || 'https://cine-arch.vercel.app';

export default defineConfig({
  site,
  base: '/guide',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: page => !page.includes('/search/') && !page.includes('/404') })],
  vite: {
    // The guide imports the union engine and types from the app's services/ folder.
    server: { fs: { allow: ['..'] } },
  },
});
