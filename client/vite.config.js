import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(dirname, './src'),
            '@modules': path.resolve(dirname, './src/modules'),
            '@shared': path.resolve(dirname, './src/shared'),
            '@legacy': path.resolve(dirname, './src/legacy'),
            '@api': path.resolve(dirname, './src/api'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        sourcemap: false,
    },
});
