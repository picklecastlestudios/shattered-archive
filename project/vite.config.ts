import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2017',
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
});
