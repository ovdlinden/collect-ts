/**
 * Vendors the Lucide icons the diagrams use into .vitepress/icons/, so a
 * build-time D2 render can embed one for each node (see plugins/markdown-d2.ts,
 * which resolves `icon: @name` to `<name>.svg`).
 *
 * One file per icon, not one per appearance: the plugin inlines each glyph's
 * body and recolours it per role and per theme, so the vendored file's own
 * colour is never shown (except in the fallback where that repaint is skipped).
 *
 * The icons are derived from the installed @iconify-json/lucide package, so they
 * need no network. Output is git-ignored and rebuilt on `dev` / `build`.
 * Add a name to ICONS when a diagram references a new @icon.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import lucide from '@iconify-json/lucide/icons.json' with { type: 'json' };

// Kept in sync with the `icon: @name` tokens across the docs, plus the per-role
// defaults in theme/composables/palette.ts (roleIcon).
const ICONS = [
	// role defaults
	'box',
	'database',
	'shield-check',
	'layout-dashboard',
	'globe',
	// general purpose
	'server',
	'terminal',
	'network',
	'lock',
	'key-round',
	'file-code',
	'file-cog',
	'activity',
	'container',
	'mail',
	'arrow-left-right',
	'split',
	'binary',
	'scan-search',
	'signpost',
	'radar',
	'radio-tower',
	'smartphone',
	// git stack's own vocabulary
	'git-branch',
	'git-commit-horizontal',
	'git-merge',
	'git-pull-request',
	'layers',
	'undo-2',
	'check-check',
	'hand',
];

// Fallback stroke, shown only if the plugin's per-role repaint is ever skipped.
// A neutral reads on either background, since one file serves both themes.
const STROKE = '#6b7280';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../.vitepress/icons');

const set = lucide as unknown as {
	width?: number;
	height?: number;
	icons: Record<string, { body: string; width?: number; height?: number }>;
};

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const missing: string[] = [];
let written = 0;
for (const name of ICONS) {
	const icon = set.icons[name];
	if (!icon) {
		missing.push(name);
		continue;
	}
	const w = icon.width ?? set.width ?? 24;
	const h = icon.height ?? set.height ?? 24;
	// Lucide bodies wrap their paths in <g stroke="currentColor">, so a root stroke
	// alone fails (currentColor falls back to black inside an <image>); set color
	// too so currentColor resolves. The plugin recolours the inlined glyph per role.
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" color="${STROKE}" stroke="${STROKE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>`;
	writeFileSync(resolve(outDir, `${name}.svg`), svg);
	written++;
}

if (missing.length) {
	throw new Error(`[docs] vendor-icons: not in @iconify-json/lucide: ${missing.join(', ')}`);
}
console.log(`[docs] vendored ${written} icons to .vitepress/icons`);
