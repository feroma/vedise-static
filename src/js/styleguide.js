// =============================================================================
// JS della sola styleguide — NON va portato nel tema WordPress.
// =============================================================================

// Voce di menu attiva
const here = location.pathname.replace(/index\.html$/, '');
document.querySelectorAll('.sg-nav a').forEach((a) => {
    const path = new URL(a.href).pathname.replace(/index\.html$/, '');
    if (path === here) a.classList.add('is-active');
});

// Overlay griglia: tasto "G"
const overlay = document.createElement('div');
overlay.className = 'grid-overlay';
overlay.setAttribute('aria-hidden', 'true');
overlay.innerHTML = `<div class="container"><div class="row">${'<div class="col-1 col-lg-1"></div>'.repeat(12)}</div></div>`;
document.body.append(overlay);

const STORAGE_KEY = 'sg-grid-overlay';
try {
    if (localStorage.getItem(STORAGE_KEY) === '1') overlay.classList.add('is-visible');
} catch {}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'g' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const on = overlay.classList.toggle('is-visible');
    try {
        localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {}
});

// Breakpoint (letti dal CSS: un'unica fonte, $breakpoints in SCSS)
const rootStyle = getComputedStyle(document.documentElement);
const cssString = (name) => rootStyle.getPropertyValue(name).trim().replace(/^['"]|['"]$/g, '');
const breakpoints = cssString('--sg-bp-list')
    .split(',')
    .filter(Boolean)
    .map((pair) => {
        const [name, min] = pair.split(':');
        return { name, min: Number(min) };
    });
const currentBp = () => getComputedStyle(document.documentElement).getPropertyValue('--sg-bp').trim().replace(/['"]/g, '');

// Indicatore larghezza viewport / breakpoint / griglia
const bp = document.createElement('div');
bp.className = 'sg-bp';
document.body.append(bp);

const onResize = () => {
    const w = window.innerWidth;
    const name = currentBp();
    const grid = w >= 1360 ? '12 col · m160' : w >= 1024 ? '12 col · m120' : '4 col · m16';
    bp.textContent = `${w}px · ${name} · ${grid}`;

    // Evidenzia la riga/colonna del breakpoint corrente nelle tabelle
    document.querySelectorAll('[data-bp]').forEach((el) => {
        el.classList.toggle('is-current', el.dataset.bp === name);
    });

    updateTypeSpecimens();
};

// Specimen tipografici: valori calcolati in questo momento
function updateTypeSpecimens() {
    document.querySelectorAll('.sg-type').forEach((el) => {
        const sample = el.querySelector('.sg-type__sample');
        const now = el.querySelector('.sg-type__now');
        if (!sample || !now) return;
        const cs = getComputedStyle(sample);
        const size = parseFloat(cs.fontSize);
        const lh = parseFloat(cs.lineHeight);
        now.textContent = `ora: ${+size.toFixed(1)} / ${+lh.toFixed(1)} px`;
    });
}

// Tabella della scala tipografica, ricavata dalle regole CSS compilate
function buildTypeTable(table) {
    const styles = table.dataset.styles.split(',');
    const values = {}; // values[style][bp] = { size, lh }

    const bpFromMedia = (media) => {
        if (!media) return 'xs';
        const m = media.match(/min-width:\s*([\d.]+)px/);
        if (!m) return null;
        return breakpoints.find((b) => b.min === Number(m[1]))?.name ?? null;
    };

    const walk = (rules, media) => {
        for (const rule of rules) {
            if (rule instanceof CSSMediaRule) {
                walk(rule.cssRules, rule.conditionText);
            } else if (rule instanceof CSSStyleRule) {
                const selectors = rule.selectorText.split(',').map((x) => x.trim());
                const fs = rule.style.fontSize;
                if (!fs) continue;
                for (const style of styles) {
                    if (!selectors.includes(`.${style}`)) continue;
                    const b = bpFromMedia(media);
                    if (!b) continue;
                    values[style] ??= {};
                    values[style][b] = { fs, lh: rule.style.lineHeight };
                }
            }
        }
    };
    for (const sheet of document.styleSheets) {
        try {
            walk(sheet.cssRules, null);
        } catch {}
    }

    const cols = breakpoints.filter((b) => Object.values(values).some((v) => v[b.name]));
    const format = (v, b) => {
        if (!v) return '<span style="opacity:.35">—</span>';
        if (v.fs.includes('vw')) {
            const vw = parseFloat(v.fs.replace(/^[^\d.]*/, ''));
            return `<code>${+vw.toFixed(3)}vw</code> <span style="opacity:.6">(proporzionale)</span>`;
        }
        const size = parseFloat(v.fs);
        const lh = v.lh ? Math.round(parseFloat(v.lh) * size) : '';
        return `<code>${size} / ${lh}</code>`;
    };

    table.innerHTML = `
        <thead><tr><th>Classe</th>${cols.map((b) => `<th data-bp="${b.name}">${b.name} ≥ ${b.min}</th>`).join('')}</tr></thead>
        <tbody>${styles
            .map(
                (s) => `<tr><td><code>.${s}</code></td>${cols
                    .map((b) => `<td data-bp="${b.name}">${format(values[s]?.[b.name], b)}</td>`)
                    .join('')}</tr>`
            )
            .join('')}</tbody>`;
}

document.querySelectorAll('.sg-table[data-styles]').forEach(buildTypeTable);
onResize();
window.addEventListener('resize', onResize);

// Campioni colore: leggono il valore dalle custom properties (--color-*)
const hexToRgb = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const luminance = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
};
const badge = (label, ratio) => {
    const cls = ratio >= 4.5 ? 'pass' : ratio >= 3 ? 'large' : 'fail';
    const txt = ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA grande' : 'no';
    return `<span class="sg-badge sg-badge--${cls}">${label} ${ratio.toFixed(2)} · ${txt}</span>`;
};

document.querySelectorAll('.sg-swatch[data-color]').forEach((el) => {
    const name = el.dataset.color;
    const hex = rootStyle.getPropertyValue(`--color-${name}`).trim().toUpperCase();
    if (!hex) return;
    const rgb = hexToRgb(hex);
    const onWhite = contrast(rgb, [255, 255, 255]);
    const onBlack = contrast(rgb, [0, 0, 0]);
    const best = onWhite >= onBlack ? '#fff' : '#000';

    el.innerHTML = `
        <div class="sg-swatch__chip" style="background:var(--color-${name});color:${best}">
            <span>Aa</span><span>${hex}</span>
        </div>
        <div class="sg-swatch__body">
            <p class="sg-swatch__name">${name}</p>
            <p class="sg-swatch__meta">
                <code>palette('${name}')</code><br>
                <code>var(--color-${name})</code><br>
                <code>.text-${name}</code> <code>.bg-${name}</code><br>
                rgb(${rgb.join(', ')})
            </p>
            <div class="sg-swatch__contrast">
                ${badge('su bianco', onWhite)}
                ${badge('su nero', onBlack)}
            </div>
        </div>`;
});

// Click su un codice → copia negli appunti
document.addEventListener('click', (e) => {
    const code = e.target.closest('.sg-swatch code');
    if (!code || !navigator.clipboard) return;
    navigator.clipboard.writeText(code.textContent).then(() => {
        const old = code.textContent;
        code.textContent = 'copiato ✓';
        setTimeout(() => (code.textContent = old), 900);
    });
});

// Catalogo icone (solo nella pagina Icone: la lista viene caricata a parte)
const iconsGrid = document.getElementById('sg-icons');
if (iconsGrid) {
    import('./data/material-symbols.json').then(({ default: names }) => {
        const search = document.getElementById('sg-icon-search');
        const fill = document.getElementById('sg-icon-fill');
        const weight = document.getElementById('sg-icon-weight');
        const size = document.getElementById('sg-icon-size');
        const count = document.getElementById('sg-icon-count');

        iconsGrid.innerHTML = names
            .map(
                (n) =>
                    `<button type="button" class="sg-icon" data-name="${n}" title="${n}"><span class="icon" aria-hidden="true">${n}</span><span class="sg-icon__name">${n}</span></button>`
            )
            .join('');
        const buttons = [...iconsGrid.children];

        const modifiers = () =>
            [
                size.value && `icon--${size.value}`,
                fill.checked && 'icon--fill',
                weight.value !== '400' && `icon--w${weight.value}`,
            ].filter(Boolean);

        const applyStyle = () => {
            const cls = ['icon', ...modifiers()].join(' ');
            buttons.forEach((b) => (b.firstElementChild.className = cls));
        };

        const applyFilter = () => {
            const q = search.value.trim().toLowerCase().replace(/\s+/g, '_');
            let visible = 0;
            buttons.forEach((b) => {
                const show = !q || b.dataset.name.includes(q);
                b.hidden = !show;
                if (show) visible++;
            });
            count.textContent = `${visible} / ${names.length} icone`;
        };

        search.addEventListener('input', applyFilter);
        [fill, weight, size].forEach((el) => el.addEventListener('change', applyStyle));

        iconsGrid.addEventListener('click', (e) => {
            const b = e.target.closest('.sg-icon');
            if (!b) return;
            const code = `<span class="${['icon', ...modifiers()].join(' ')}" aria-hidden="true">${b.dataset.name}</span>`;
            navigator.clipboard?.writeText(code).then(() => {
                const label = b.lastElementChild;
                b.classList.add('is-copied');
                label.textContent = 'copiato ✓';
                setTimeout(() => {
                    b.classList.remove('is-copied');
                    label.textContent = b.dataset.name;
                }, 900);
            });
        });

        applyFilter();
    });
}

// Menu laterale: evidenzia la sezione visibile
const sideLinks = [...document.querySelectorAll('.sg-sidenav a[href^="#"]')];
if (sideLinks.length) {
    const groups = sideLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const setActive = (id) => sideLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    const onScroll = () => {
        const line = window.innerHeight * 0.3;
        let current = groups[0];
        groups.forEach((g) => {
            if (g.getBoundingClientRect().top <= line) current = g;
        });
        setActive(current.id);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// Demo filtri: le pill con aria-pressed si attivano/disattivano al clic
document.querySelectorAll('.sg-group button.pill[aria-pressed]').forEach((pill) => {
    pill.addEventListener('click', () => {
        pill.setAttribute('aria-pressed', pill.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
});

// Demo paginatore: clic su un item → diventa attivo
document.querySelectorAll('.sg-pager-demo .pager').forEach((pager) => {
    pager.addEventListener('click', (e) => {
        const item = e.target.closest('.pager__item');
        if (!item) return;
        pager.querySelectorAll('.pager__item').forEach((i) => i.removeAttribute('aria-current'));
        item.setAttribute('aria-current', 'true');
    });
});

// Guida baseline: misura la prima riga con un elemento invisibile allineato alla baseline
const drawBaselines = () => {
    document.querySelectorAll('.sg-baseline').forEach((box) => {
        const text = box.querySelector('.pretitle');
        if (!text) return;
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        text.prepend(probe);
        const y = probe.getBoundingClientRect().top - box.getBoundingClientRect().top;
        probe.remove();
        let line = box.querySelector('.sg-baseline__line');
        if (!line) {
            line = document.createElement('div');
            line.className = 'sg-baseline__line';
            box.append(line);
        }
        line.style.top = `${y}px`;
    });
};
if (document.querySelector('.sg-baseline')) {
    document.fonts.ready.then(drawBaselines);
    window.addEventListener('resize', drawBaselines);
}

// Teaser: selettore dello sfondo (aggiunge la classe --bg-* al teaser del gruppo)
document.querySelectorAll('.sg-bg-switch').forEach((sw) => {
    sw.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-bg]');
        if (!btn) return;
        const teaser = sw.closest('.sg-group')?.querySelector('.teaser-card, .teaser-banner, .person-card');
        if (!teaser) return;
        const block = ['teaser-banner', 'person-card'].find((c) => teaser.classList.contains(c)) || 'teaser-card';
        [...teaser.classList].filter((c) => c.startsWith(`${block}--bg-`)).forEach((c) => teaser.classList.remove(c));
        teaser.classList.add(`${block}--bg-${btn.dataset.bg}`);
        sw.querySelectorAll('[data-bg]').forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    });
});
