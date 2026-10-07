import { defineConfig } from 'vite';
import { resolve, sep } from 'node:path';
import { readdirSync, existsSync, readFileSync } from 'node:fs';

const root = import.meta.dirname;

// Percorso pubblico del sito:
//   '/'                in locale e alla radice di un dominio
//   '/vedise-static/'  su GitHub Pages (lo passa il workflow con BASE_PATH)
//   './'               percorsi relativi: la build funziona in qualsiasi cartella
//                      (es. FTP) → npm run build:relative
const BASE = process.env.BASE_PATH || '/';

/**
 * Include HTML: nelle pagine scrivi <!-- @include nome.html --> e il contenuto
 * di partials/nome.html viene inserito al suo posto (anche annidato).
 * Nei partial e nelle pagine %BASE_URL% viene sostituito con la base del sito;
 * con base relativa ('./') diventa il percorso verso la radice ('./' o '../').
 */
function htmlIncludes() {
    let base = BASE;
    const re = /<!--\s*@include\s+([\w./-]+)\s*-->/g;
    const inject = (html, depth = 0) =>
        depth > 5
            ? html
            : html.replace(re, (_, file) =>
                  inject(readFileSync(resolve(root, 'partials', file), 'utf8'), depth + 1)
              );

    return {
        name: 'html-includes',
        configResolved(config) {
            base = config.base;
        },
        transformIndexHtml: {
            order: 'pre',
            handler: (html, ctx) => {
                let prefix = base;
                if (!base.startsWith('/')) {
                    // base relativa: risale di un livello per ogni cartella della pagina
                    const depth = ctx.path.replace(/^\//, '').split('/').length - 1;
                    prefix = depth ? '../'.repeat(depth) : './';
                }
                return inject(html).replaceAll('%BASE_URL%', prefix);
            },
        },
        // Modificando un partial il browser si ricarica
        handleHotUpdate({ file, server }) {
            if (file.includes(`${sep}partials${sep}`) || file.includes('/partials/')) {
                server.ws.send({ type: 'full-reload' });
                return [];
            }
        },
    };
}

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
    base: BASE,
    plugins: [htmlIncludes()],
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
