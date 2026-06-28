import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'assets', dest: '.' },
      ],
    }),
  ],
});
