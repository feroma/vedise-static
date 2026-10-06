# VEDISE — styleguide statica

Ricostruzione in HTML/SCSS/JS del progetto grafico VEDISE, divisa per argomenti.
È la base da cui verrà sviluppato il tema WordPress.

## Requisiti

- Node.js 20.19+ (LTS consigliata)

## Avvio

```bash
npm install
npm run dev        # server di sviluppo → http://localhost:5173
```

L'SCSS **non** viene compilato da Vite: va compilato in `src/css/`.

- In PhpStorm: File Watcher SCSS (vedi sotto), compila in automatico al salvataggio.
- Senza PhpStorm: in un secondo terminale `npm run scss` (watch).

Vite rileva il CSS ricompilato e aggiorna il browser.

```bash
npm run build      # compila l'SCSS e genera la styleguide statica in dist/
npm run preview    # anteprima della build
```

La build va pubblicata alla radice di un dominio. Per una sottocartella,
imposta `BASE` in `vite.config.js` (es. `'/vedise-static/'`).

## Struttura

```
index.html              indice della styleguide
pages/                  una pagina per argomento (layout, tipografia, teaser…)
partials/               frammenti HTML condivisi: <!-- @include nome.html -->
public/                 file copiati così come sono (favicon…)
src/scss/main.scss      CSS del sito        → andrà nel tema WordPress
src/scss/styleguide.scss CSS della styleguide → NON va nel tema
src/scss/abstracts/     variabili, breakpoint, mixin, scala tipografica (@use '../abstracts' as *;)
src/scss/base/          font, reset, tipografia
src/scss/layout/        griglia, header, footer…
src/scss/components/    componenti BEM (teaser…)
src/scss/utilities/     classi di utilità (.d-none, .d-lg-block…)
src/css/                CSS compilato (versionato)
src/js/main.js          JS del sito (GSAP) → andrà nel tema
src/js/styleguide.js    JS della styleguide → NON va nel tema
src/fonts/              Material Symbols Outlined (icone), DM Sans (100–1000 + corsivo, opsz) e Noto Serif SC (200–900), woff2 variabili, subset latin (OFL)
```

## Griglia

Logica Bootstrap 4: `.container > .row > .col-*`.

| Viewport     | Colonne | Gutter | Margini esterni | Classi            |
|--------------|---------|--------|-----------------|-------------------|
| < 1024       | 4       | 16     | 16              | `.col-1 … .col-4` |
| 1024 – 1359  | 12      | 30     | 120             | `.col-lg-1 … 12`  |
| ≥ 1360       | 12      | 30     | 160             | `.col-lg-1 … 12`  |

Disponibili anche `.col`, `.col-auto`, `.offset-*`, `.offset-lg-*`, `.no-gutters`.
Gutter e margini sono anche custom properties: `var(--gutter)`, `var(--margin)`.

Nella styleguide premi **G** per mostrare/nascondere l'overlay delle colonne.

## Breakpoint

| Sigla | Da     | Uso                                   |
|-------|--------|---------------------------------------|
| xs    | 0      | smartphone                            |
| sm    | 576    | smartphone orizzontale                |
| md    | 768    | tablet verticale                      |
| lg    | 1024   | griglia 12 colonne                    |
| xl    | 1360   | tipografia del progetto grafico       |
| xxl   | 1920   | tipografia proporzionale alla larghezza |

SCSS: `@include mq-up(md)`, `mq-down(lg)`, `mq-between(md, xl)`.
Classi: `.d-md-none`, `.justify-content-xl-between`…

## Tipografia

Classi indipendenti dai tag: `.title-1…4` (Noto Serif SC) e `.body-1…6` (DM Sans),
più `.ls-tight` (-0.02em), `.ls-tighter` (-0.04em), `.ls-tightest` (-0.06em),
`.ls-wide` (0.1em) e `.text-uppercase`.

La scala è in `src/scss/abstracts/_typography.scss` (`$type-scale`): i valori del
progetto (base 1920) valgono da **xl** in su, sotto si riducono, da **xxl** crescono
in proporzione alla larghezza. Nei componenti: `@include text-style('title-4');`

## Icone

Google **Material Symbols** (stile Outlined), font variabile in `src/fonts/`
(licenza Apache 2.0, pacchetto npm `material-symbols` 0.47.6).

```html
<span class="icon" aria-hidden="true">arrow_forward</span>
<span class="icon icon--lg icon--fill icon--w300" aria-hidden="true">favorite</span>
```

Modificatori: `.icon--sm/md/lg/xl/text`, `.icon--fill`, `.icon--w100…700`,
`.icon--grad-low/high`; `.icon-text` allinea icona e testo. Funziona anche la classe
`.material-symbols-outlined` degli snippet di fonts.google.com/icons.
La pagina **Componenti → Icone** ha il catalogo completo con ricerca e copia del codice.

⚠️ Il font completo pesa ~4 MB: prima della produzione va ridotto alle sole icone usate.

## Pulsanti

```html
<a class="btn" href="#">
  <span class="btn__label">Leggi</span>
  <span class="icon" aria-hidden="true">arrow_right</span>
</a>
```

`.btn` (pieno) · `.btn--outline` · colori `.btn--red` (default), `--green`, `--blue`,
`--dark`, `--white` · `.btn--block`. Il testo va sempre in `.btn__label`: icona prima,
dopo o da sola viene riconosciuta in automatico (padding come da Figma).

## Pills

```html
<span class="pill pill--white">ICU</span>
<a class="pill pill--blue" href="#">ICU</a>
<button type="button" class="pill pill--red" aria-pressed="false">ICU</button>
```

Outline di default, `.pill--fill` per il pieno; colori come i pulsanti; `.pill--sm`.
Pieno anche con `.is-active` o `aria-pressed="true"` (filtri).

Pulsanti, pills e icone sono documentati nella pagina **Componenti**, con menu laterale.

## Colori

Palette in `src/scss/abstracts/_variables.scss` (mappa `$colors`): grigi, rosso
(brand `#CD161D`), verde e blu, ciascuno con tono `-light`, base e `-dark`, più
bianco e nero. Dalla mappa vengono generati in automatico:

- SCSS: `palette('red')`, `$color-brand`
- CSS: `var(--color-red)`, `var(--color-brand)`
- classi: `.text-red`, `.bg-blue-dark`…
- la pagina **Colori** della styleguide, con i contrasti WCAG

## Aggiungere una pagina

1. Crea `pages/nome.html` partendo da una pagina esistente.
2. Aggiungi la voce in `partials/sg-nav.html` (e una card in `index.html`).

Vite la include in build automaticamente.

## Convenzioni

- Classi BEM: `.teaser`, `.teaser__title`, `.teaser--horizontal`.
- Classi `js-*` riservate agli agganci JavaScript, mai usate per lo stile.
- Percorsi in CSS relativi (`url('../img/…')`), così funzionano anche nel tema.
- Animazioni GSAP in `src/js/modules/animations.js`, sempre dentro
  `prefers-reduced-motion: no-preference`.

## File Watcher PhpStorm

Settings → Tools → File Watchers → + → SCSS

| Campo                       | Valore |
|-----------------------------|--------|
| Scope                       | custom, limitato a `src/scss` |
| Program                     | `$ProjectFileDir$\node_modules\.bin\sass.cmd` |
| Arguments                   | `$FileName$:$ProjectFileDir$\src\css\$FileNameWithoutExtension$.css --style=expanded --source-map` |
| Output paths to refresh     | `$ProjectFileDir$\src\css\$FileNameWithoutExtension$.css:$ProjectFileDir$\src\css\$FileNameWithoutExtension$.css.map` |
| Working directory           | `$FileDir$` |
| Advanced → Track only root files | ✅ |
