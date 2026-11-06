import { defineConfig } from 'vite';
import markets from './api/markets.js';

// On Vercel, /api/markets runs as a serverless function. This serves the same handler
// from the local dev and preview servers so the live markets panel works locally too.
function localApi() {
  const mount = (server) => {
    server.middlewares.use('/api/markets', (req, res) => {
      Promise.resolve(markets(req, res)).catch(() => {
        res.statusCode = 500;
        res.end('{}');
      });
    });
  };
  return { name: 'local-api', configureServer: mount, configurePreviewServer: mount };
}

// Social previews need absolute image URLs. Vercel exposes the production domain at build time.
function siteUrl() {
  return {
    name: 'site-url',
    transformIndexHtml(html) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
      return html.replaceAll('__SITE_URL__', host ? `https://${host}` : '');
    },
  };
}

export default defineConfig({
  plugins: [localApi(), siteUrl()],
});
