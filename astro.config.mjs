import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://southbearstudio.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    // El acceso reservado nunca aparece entre las páginas públicas indexables.
    filter: (page) => !/^\/(?:en\/)?acceso(?:\/|$)/.test(new URL(page).pathname)
  })]
});
