import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Canonical origin of the public site. Set SITE_URL in Vercel once the
// custom domain is attached (e.g. https://cinearch.ca).
const site = process.env.SITE_URL || 'https://cinearch-guide.vercel.app';

export default defineConfig({
  site,
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap({ filter: page => !page.includes('/search/') && !page.includes('/404') })],
  vite: {
    // The guide reads union data from the app's config/ and services/ folders.
    server: { fs: { allow: ['..'] } },
  },
});
