import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import compress from 'astro-compress';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import m2dx from 'astro-m2dx';
import remarkDirective from 'remark-directive';
import icon from "astro-icon";

import { readingTimeRemarkPlugin } from './src/utils/frontmatter.mjs';
import remarkEmdash from './src/remark/emdash.ts';

import { SITE } from './src/config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: SITE.origin,
  base: SITE.basePathname,
  trailingSlash: SITE.trailingSlash ? 'always' : 'never',

  output: 'static',

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
    },
  },

  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    sitemap(),
    mdx({
      remarkPlugins: [
        remarkMath,
        remarkEmdash,
        remarkDirective,
        [m2dx, { componentDirectives: 'utils/directives.ts' }],
      ],
      rehypePlugins: [rehypeKatex],
    }),
    icon(),

    compress({
      css: true,
      html: {
        removeAttributeQuotes: false,
      },
      img: false,
      js: true,
      svg: false,

      logger: 1,
    }),
  ],

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});
