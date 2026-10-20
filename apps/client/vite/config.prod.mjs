import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: './',
    plugins: [
        react(),
        // Service worker: повторный запуск без загрузки ассетов (ТЗ, раздел 10)
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false,
            workbox: {
                globPatterns: ['**/*.{js,css,html,png,jpg,webp,svg,json,tmj}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            },
        }),
    ],
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
            },
        },
    },
});
