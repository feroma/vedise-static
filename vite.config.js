import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, existsSync } from 'node:fs';

const root = import.meta.dirname;

// Rileva automaticamente tutte le pagine HTML (root + /pages)
const htmlIn = (dir) =>
    existsSync(dir)
        ? readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => resolve(dir, f))
        : [];

const input = Object.fromEntries(
    [...htmlIn(root), ...htmlIn(resolve(root, 'pages'))].map((file) => [
        file.replace(root, '').replace(/[\\/]/g, '_').replace(/^_|\.html$/g, ''),
        file,
    ])
);

export default defineConfig({
    server: { port: 5173, open: true },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input,
            output: {
                // nomi senza hash → più semplici da accodare in WordPress
                entryFileNames: 'assets/js/[name].js',
                chunkFileNames: 'assets/js/[name].js',
                assetFileNames: 'assets/[ext]/[name][extname]',
            },
        },
    },
});