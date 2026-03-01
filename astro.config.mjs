import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://your-username.github.io',
  base: '/ai-daily-brief',
  integrations: [mdx()],
  output: 'static',
  outDir: './dist',
});
