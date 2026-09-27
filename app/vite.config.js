import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const pages = ['index', 'app', 'merci', 'mentions-legales', 'cgv', 'confidentialite'];

export default defineConfig({
  root,
  base: './',
  publicDir: resolve(root, 'public'),
  build: {
    outDir: resolve(root, 'dist'),
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(root, `${p}.html`)])),
    },
  },
  test: {
    root: resolve(root, '..'),
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
});
