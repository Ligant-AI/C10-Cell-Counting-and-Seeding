import { defineConfig } from 'vite';
export default defineConfig({
    base: './',
    build: { modulePreload: { polyfill: false }, target: 'es2022' },
    server: { port: 5179, strictPort: true },
});
