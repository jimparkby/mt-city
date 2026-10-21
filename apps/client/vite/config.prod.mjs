import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export default defineConfig({
    base: './',
    plugins: [
        react(),
        // Service worker: повторный запуск без загрузки ассетов (ТЗ, раздел 10)
        VitePWA({
            registerType: 'autoUpdate',
            manifest: false,
            workbox: {
                skipWaiting: true,
                clientsClaim: true,
                globPatterns: ['**/*.{js,css,html,png,jpg,webp,svg,json,tmj}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                // Отдельная игра — своя страница, не подменять её банковским index.html
                navigateFallbackDenylist: [/^\/game/],
            },
        }),
    ],
    logLevel: 'warning',
    build: {
        rollupOptions: {
            // Две страницы: Moby с игрой внутри и отдельная игра для браузера
            input: {
                main: resolve(import.meta.dirname, '../index.html'),
                game: resolve(import.meta.dirname, '../game.html'),
            },
            output: {
                manualChunks: (id) => (id.includes('node_modules/phaser') ? 'phaser' : undefined),
            },
        },
    },
});
