import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MarkdownRenderer } from 'vitepress';
import { d2ThemeHeader, ICON, iconStyle, linkChip, type Mode } from '../theme/composables/d2-theme.ts';

/**
 * Renders every ```d2 fence to a <D2Diagram> (registered globally by the theme)
 * at build time. The fence source is compiled twice by the `d2` binary, once per
 * appearance, each with the project palette resolved to the solid hex D2's theme
 * slots require (see composables/d2-theme.ts). Both SVGs ride across as
 * URI-encoded props, so their markup never reaches Vue's template compiler; the
 * component inlines the pair (SSR-rendered, no client render, no WASM) and the
 * `.dark` class toggles which one shows.
 *
 * Rendering at build time means a diagram that will not compile fails the build
 * instead of shipping blank, and the same holds for a `link:` to a missing page.
 *
 * Fence syntax: ```d2 [elk|dagre] ["alt text"]
 * Diagrams lay out with dagre by default, whose organic routing reads best on
 * most graphs; `elk` opts one fence into orthogonal routing. The quoted alt text
 * becomes the figure's aria-label (the SVGs themselves are aria-hidden, since an
 * SVG's raw text nodes are not a usable alternative).
 */

const here = dirname(fileURLToPath(import.meta.url));
// .vitepress/icons, written by scripts/vendor-icons.ts.
const ICONS_DIR = resolve(here, '../icons');
// Docs root, for resolving `link:` targets to source pages.
const DOCS_ROOT = resolve(here, '../..');

/**
 * Where to find `d2`, in order of preference:
 *   1. D2_BIN, for a CI mirror or a hand-placed binary.
 *   2. node_modules/.bin/d2, installed by the terrastruct-d2-bin package, whose
 *      per-platform optional dependencies mean the package manager picks the
 *      right build. This is the normal path and needs no toolchain.
 *   3. `d2` on PATH, for anyone who would rather install it themselves than
 *      trust a third-party npm republish of the official release.
 */
function resolveD2Bin(): string {
	const fromEnv = process.env.D2_BIN;
	if (fromEnv) return fromEnv;
	const local = resolve(DOCS_ROOT, 'node_modules/.bin/d2');
	if (existsSync(local)) return local;
	return 'd2';
}

const D2_BIN = resolveD2Bin();

// A node's `link:` target. Values are bare paths (link: /guide/routing) or the
// occasional quoted string; stop at the D2 delimiters that can follow.
const LINK_REF = /link:\s*(["']?)([^\s;{}"']+)\1/g;

/**
 * Fail the build on a `link:` that points nowhere. VitePress checks markdown
 * links but never the SVG `<a href>` a diagram link becomes, so a page rename
 * would silently strand it. Only internal absolute links are checked; external
 * URLs and in-page anchors are left to the author. This extends the renderer's
 * own rule (a diagram that will not compile fails the build) to its links.
 */
function validateLinks(source: string, mdFile: string | undefined): void {
	for (const [, , target] of source.matchAll(LINK_REF)) {
		if (!target.startsWith('/')) continue;
		const rel = target.replace(/#.*$/, '').replace(/^\/+|\/+$/g, '');
		if (existsSync(resolve(DOCS_ROOT, `${rel}.md`)) || existsSync(resolve(DOCS_ROOT, rel, 'index.md'))) continue;
		const where = mdFile ? ` (in ${mdFile})` : '';
		throw new Error(
			`[docs] a d2 diagram links to "${target}"${where}, which resolves to no page: expected ${rel}.md or ${rel}/index.md under the docs root.`,
		);
	}
}

const VIEWBOX = /viewBox="[\d.eE+-]+\s+[\d.eE+-]+\s+([\d.eE+-]+)\s+([\d.eE+-]+)"/;
// `icon: @globe` shorthand to the vendored icon file.
const ICON_REF = /icon:\s*@([\w-]+)/g;

function render(source: string, layout: 'elk' | 'dagre', mode: Mode): string {
	// Resolve icon shorthands to their vendored file before handing to d2.
	const doc = `${d2ThemeHeader(mode)}${source}`.replace(
		ICON_REF,
		(_, name) => `icon: ${resolve(ICONS_DIR, `${name}.svg`)}`,
	);
	let svg: string;
	try {
		// --scale 1 makes d2 stamp the outer <svg> with its natural pixel size. Without
		// it the outer tag carries only a viewBox (the inner <svg> is the sized one) and
		// collapses to zero height; CSS `max-width:100%` then caps the stamped size.
		svg = execFileSync(D2_BIN, ['--layout', layout, '--scale', '1', '--pad', '20', '-', '-'], {
			input: doc,
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024,
		});
	} catch (error) {
		const detail =
			(error as { stderr?: Buffer | string })?.stderr?.toString() ?? (error as Error)?.message ?? String(error);
		const hint =
			(error as { code?: string })?.code === 'ENOENT'
				? `\n\n[docs] could not run d2 at "${D2_BIN}". It renders the site diagrams at build time.\n` +
					'       Run the package install (terrastruct-d2-bin provides it), install d2 on\n' +
					'       PATH, or set D2_BIN to an existing binary.\n'
				: '';
		throw new Error(`[docs] d2 failed to render a ${mode} diagram:\n${detail}${hint}\n--- source ---\n${source}`);
	}
	// Inline, not a document: drop the XML prolog.
	svg = svg.replace(/^\s*<\?xml[^>]*\?>\s*/, '');
	return paintIcons(svg, mode);
}

// The semantic roles a node can carry, plus the container tier. Keep in step
// with SemanticRole in theme/composables/palette.ts.
const ROLE_SET = new Set(['core', 'data', 'security', 'output', 'external', 'system']);

// A node's role and the offset where its group opened. D2 emits each node's
// `class: core` as the SVG group's own class, so the role is read straight off
// that rather than inferred from structure; the offset bounds the card-rect search.
function enclosingGroup(before: string): { role: string; start: number } {
	const stack: Array<{ cls: string; start: number }> = [];
	for (const g of before.matchAll(/<g\b[^>]*>|<\/g>/g)) {
		if (g[0] === '</g>') stack.pop();
		else stack.push({ cls: /class="([^"]*)"/.exec(g[0])?.[1] ?? '', start: g.index ?? 0 });
	}
	for (let i = stack.length - 1; i >= 0; i--) {
		const role = stack[i].cls.split(' ').find((c) => ROLE_SET.has(c));
		if (role) return { role, start: stack[i].start };
	}
	return { role: 'external', start: 0 };
}

/**
 * Repaint the diagram after d2 lays it out, fixing two things about its output.
 * D2 draws each node icon as an isolated <image> of the vendored glyph, which
 * cannot take the node's role colour and whose currentColor collapses to black
 * in dark mode; it also sizes that icon to the node rather than to one shared
 * metric. This rounds every card and panel to a consistent radius, then replaces
 * each icon with a uniform role-tinted badge, the glyph inlined and recoloured on
 * top, re-centred toward the lower half of the card so it clears the label.
 */
function paintIcons(svg: string, mode: Mode): string {
	// Round every card and panel corner (but not the transparent N7 canvas). D2
	// would do this natively via `**.style.border-radius`, but that glob cannot
	// coexist with the `vars` theme block, so the radius is stamped here instead.
	svg = svg.replace(/<rect\b([^>]*?)\/>/g, (full, attrs: string) =>
		/fill-N7/.test(attrs) || /\srx=/.test(attrs)
			? full
			: `<rect${attrs} rx="${/fill-B4/.test(attrs) ? 18 : 14}" ry="${/fill-B4/.test(attrs) ? 18 : 14}"/>`,
	);
	// Retheme D2's link "chain" sticker (a 32x32 white disc, jarring on a dark
	// card) into a quiet surface chip with an "opens a page" arrow.
	const chip = linkChip(mode);
	svg = svg.replace(
		/<svg width="32" height="32" viewBox="0 0 32 32"[^>]*>[\s\S]*?<\/svg>/g,
		`<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="1" y="1" width="30" height="30" rx="11" fill="${chip.disc}" stroke="${chip.border}" stroke-width="1"/><svg x="7" y="7" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${chip.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></svg>`,
	);
	return svg.replace(/<image\b([^>]*?)\/>/g, (full, attrs: string, offset: number, whole: string) => {
		const x = Number(/\bx="([\d.]+)"/.exec(attrs)?.[1]);
		const y = Number(/\by="([\d.]+)"/.exec(attrs)?.[1]);
		const w = Number(/\bwidth="([\d.]+)"/.exec(attrs)?.[1]);
		const h = Number(/\bheight="([\d.]+)"/.exec(attrs)?.[1]);
		const b64 = /href="data:image\/svg\+xml;base64,([^"]+)"/.exec(attrs)?.[1];
		if (!b64 || ![x, y, w, h].every(Number.isFinite)) return full;
		// The vendored glyph is `<svg …><g stroke="currentColor">…</g></svg>`; take
		// its body and rewrap it so the inline glyph inherits the role colour.
		const body = /<svg\b[^>]*>([\s\S]*?)<\/svg>/.exec(Buffer.from(b64, 'base64').toString('utf8'))?.[1];
		if (!body) return full;

		const { role, start } = enclosingGroup(whole.slice(0, offset));
		const s = iconStyle(role, mode);
		const cx = x + w / 2;
		// Re-centre between d2's text-clear line (the icon's own top) and the card
		// bottom, clamped to keep a real gap under the label and a bottom margin.
		// Shapes without a card rect (cylinders) keep d2's centre.
		let cy = y + h / 2;
		const cardRects = [
			...whole.slice(start, offset).matchAll(/<rect\b[^>]*\by="([\d.]+)"[^>]*\bheight="([\d.]+)"[^>]*\/>/g),
		];
		if (cardRects.length) {
			const last = cardRects[cardRects.length - 1];
			const cardBottom = Number(last[1]) + Number(last[2]);
			cy = Math.min((y + cardBottom) / 2, cardBottom - ICON.padBottom - ICON.size / 2);
			cy = Math.max(cy, y + ICON.gap + ICON.size / 2);
		}
		const badge = `<rect class="d2-badge" x="${cx - ICON.size / 2}" y="${cy - ICON.size / 2}" width="${ICON.size}" height="${ICON.size}" rx="${ICON.radius}" ry="${ICON.radius}" fill="${s.fill}" stroke="${s.stroke}" stroke-width="1.5"/>`;
		const glyph = `<svg class="d2-glyph" x="${cx - ICON.glyph / 2}" y="${cy - ICON.glyph / 2}" width="${ICON.glyph}" height="${ICON.glyph}" viewBox="0 0 24 24" fill="none" color="${s.glyph}" stroke="${s.glyph}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
		return badge + glyph;
	});
}

function ratioOf(svg: string): number | null {
	const m = VIEWBOX.exec(svg);
	if (!m) return null;
	const r = Number(m[1]) / Number(m[2]);
	return Number.isFinite(r) && r > 0 ? r : null;
}

/** Split a fence info string into its layout flag and its quoted alt text. */
function parseInfo(info: string): { layout: 'elk' | 'dagre'; alt: string } {
	const rest = info.trim().replace(/^d2\s*/, '');
	const quoted = /"([^"]*)"|'([^']*)'/.exec(rest);
	const alt = (quoted?.[1] ?? quoted?.[2] ?? '').trim();
	const flags = rest
		.replace(/"[^"]*"|'[^']*'/g, '')
		.trim()
		.split(/\s+/);
	return { layout: flags.includes('elk') ? 'elk' : 'dagre', alt };
}

export function d2FencePlugin(md: MarkdownRenderer): void {
	const fence = md.renderer.rules.fence?.bind(md.renderer.rules);
	md.renderer.rules.fence = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		const lang = token.info.trim().split(/\s+/)[0];
		if (lang !== 'd2') {
			return fence?.(tokens, idx, options, env, self) ?? '';
		}
		validateLinks(token.content, (env as { relativePath?: string })?.relativePath);
		const { layout, alt } = parseInfo(token.info);
		const light = render(token.content, layout, 'light');
		const dark = render(token.content, layout, 'dark');
		const ratio = ratioOf(light);
		const ratioAttr = ratio ? ` ratio="${ratio.toFixed(4)}"` : '';
		const altAttr = alt ? ` alt="${encodeURIComponent(alt)}"` : '';
		return `<D2Diagram light="${encodeURIComponent(light)}" dark="${encodeURIComponent(dark)}"${ratioAttr}${altAttr} />`;
	};
}
