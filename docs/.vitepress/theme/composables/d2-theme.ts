import { type ColorToken, roleColor, type SemanticRole, themeColors } from './palette.ts';

/**
 * The d2 config header prepended to a diagram before `d2` renders it (see
 * plugins/markdown-d2.ts). It carries two things, resolved to solid literals
 * for one appearance (each diagram is rendered twice and toggled by `.dark`):
 *
 *   1. theme-overrides: the calm base palette. A transparent canvas over the
 *      page, a subtle container panel, and white / ink "cards" for untagged
 *      (external) nodes, joined by neutral connectors. Rounded corners and the
 *      soft shadow are layered on in CSS (D2Diagram.vue).
 *   2. classes: the semantic colour language. A node tagged `{ class: core }`
 *      wears the role's hue (soft fill + solid stroke); an edge tagged
 *      `{ class: edgeData }` colours the flow. Roles and their hues live in
 *      palette.ts (roleColor), so diagrams and every component speak the same
 *      colours.
 *
 * Base slot roles (D2 neutral theme, mapped empirically):
 *   N1 text · N2/N3 connector labels · N4-N6 structural neutrals · N7 canvas
 *   B1-B3 borders + connectors + arrowheads · B4 container panel · B5/B6 node
 *   AA/AB accent shapes (cylinders), pinned to the card so they match.
 */
export type Mode = 'light' | 'dark';

interface Surface {
	/** N1: card + title text. */
	text: string;
	/** N2/N3: connector labels (muted). */
	label: string;
	/** B1-B3: borders, connectors, arrowheads (external / default). */
	edge: string;
	/** B4: container panel, one step off the page. */
	panel: string;
	/** B5/B6 + AA/AB: external node card, lifted above the panel. */
	card: string;
	/** N4-N6: structural neutrals. */
	ramp: [string, string, string];
}

const SURFACE: Record<Mode, Surface> = {
	light: {
		text: '#1f2933',
		label: '#7b8794',
		edge: '#9aa5b1',
		panel: '#f4f6f9',
		card: '#ffffff',
		ramp: ['#cbd0d8', '#e2e5ea', '#eef0f3'],
	},
	dark: {
		text: '#e6edf3',
		label: '#9aa5b1',
		edge: '#5b6673',
		panel: '#232a33',
		card: '#2b333f',
		ramp: ['#3a3f47', '#2c313a', '#252932'],
	},
};

// Role fills and icon badges are tints of their hue. We flatten each onto the page
// background to a solid hex here rather than emit #RRGGBBAA (which d2 and SVG both
// accept): a flattened tile is the lightest rendering of the tint, and that headroom
// is what holds the opaque icon badges at their measured glyph contrast (GLYPH_INK);
// a translucent badge would let the node hue bleed through and erode it. The canvas
// is transparent, so this only has to match --vp-c-bg for the maths.
const PAGE_BG: Record<Mode, [number, number, number]> = {
	light: [255, 255, 255], // #ffffff
	dark: [27, 27, 31], //     #1b1b1f
};

function channels(hex: string): [number, number, number] {
	return [
		Number.parseInt(hex.slice(1, 3), 16),
		Number.parseInt(hex.slice(3, 5), 16),
		Number.parseInt(hex.slice(5, 7), 16),
	];
}

function toHex(rgb: number[]): string {
	return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

/** `hex` flattened at opacity `a` onto the mode's page background, as a solid hex. */
function tint(hex: string, mode: Mode, a: number): string {
	const fg = channels(hex);
	const bg = PAGE_BG[mode];
	return toHex([0, 1, 2].map((i) => a * fg[i] + (1 - a) * bg[i]));
}

/** The hue hex for a role in a mode, straight from the canonical palette. */
function hue(role: SemanticRole, mode: Mode): string {
	return themeColors[roleColor[role]][mode];
}

function overrides(mode: Mode): Record<string, string> {
	const s = SURFACE[mode];
	const [n4, n5, n6] = s.ramp;
	return {
		N1: s.text,
		N2: s.label,
		N3: s.label,
		N4: n4,
		N5: n5,
		N6: n6,
		N7: 'transparent',
		B1: s.edge,
		B2: s.edge,
		B3: s.edge,
		B4: s.panel,
		B5: s.card,
		B6: s.card,
		AA2: s.card,
		AA4: s.card,
		AA5: s.card,
		AB4: s.card,
		AB5: s.card,
	};
}

// The four coloured node roles (external stays the default card, so it needs no
// class) plus the two flow-coloured edge classes. Fills run a touch stronger on
// dark so the hue survives the darker canvas.
const NODE_ROLES: SemanticRole[] = ['core', 'data', 'security', 'output'];

function nodeClasses(mode: Mode): string {
	const a = mode === 'light' ? 0.13 : 0.2;
	return NODE_ROLES.map((role) => {
		const h = hue(role, mode);
		return `  ${role}: { style: { fill: "${tint(h, mode, a)}"; stroke: "${h}" } }`;
	}).join('\n');
}

function edgeClasses(mode: Mode): string {
	// Flow colour echoes the destination's role: the main path reads core, a
	// path into a store reads data.
	const flows: Array<[string, ColorToken]> = [
		['edgeCore', roleColor.core],
		['edgeData', roleColor.data],
	];
	return flows.map(([name, token]) => `  ${name}: { style: { stroke: "${themeColors[token][mode]}" } }`).join('\n');
}

function tierClasses(mode: Mode): string {
	// The `system` container reads faintly branded so "this is the thing being
	// documented" is legible at a glance, while other tiers keep the neutral
	// panel. Fainter than a node card so the cards inside still stand off it.
	const h = hue('core', mode);
	const fill = tint(h, mode, mode === 'light' ? 0.05 : 0.09);
	return `  system: { style: { fill: "${fill}"; stroke: "${tint(h, mode, 0.35)}" } }`;
}

/** The full d2 source header (theme-overrides + semantic classes) for `mode`. */
export function d2ThemeHeader(mode: Mode): string {
	const body = Object.entries(overrides(mode))
		.map(([slot, value]) => `      ${slot}: "${value}"`)
		.join('\n');
	const vars = `vars: {\n  d2-config: {\n    theme-overrides: {\n${body}\n    }\n  }\n}\n`;
	const classes = `classes: {\n${nodeClasses(mode)}\n${edgeClasses(mode)}\n${tierClasses(mode)}\n}\n`;
	return `${vars}${classes}`;
}

// --- node icons ------------------------------------------------------------
// Every diagram node's icon is repainted (plugins/markdown-d2.ts) into one
// visual system: a uniform, role-tinted rounded badge with the glyph inlined on
// top. Geometry is shared so icons read as one set across every diagram, and
// the glyph re-centres into the clear band below the label rather than sitting
// crammed against it. All values are in the diagram's own coordinate space.
export const ICON = { size: 52, radius: 15, glyph: 27, gap: 18, padBottom: 14 } as const;

// Role to palette token. The `system` container tier borrows the neutral
// "outside" hue so its own header icon stays quiet against the coloured
// components inside.
const ICON_TOKEN: Record<string, ColorToken> = { ...roleColor, system: 'neutral' };

// Glyph ink per role per mode. Tuned to clear WCAG non-text contrast (>=3:1) on
// the badge tile below: the raw role hue is often too light (warning) or too
// saturated to sit straight on its own tint, so light mode deepens it and dark
// mode lifts it. External nodes stay a muted neutral, matching the legend and
// letting the system's own parts lead.
const GLYPH_INK: Record<Mode, Record<string, string>> = {
	light: {
		core: '#5B21B6',
		data: '#00897B',
		security: '#A85B1B',
		output: '#0369A1',
		external: '#6B7280',
		system: '#6B7280',
	},
	dark: {
		core: '#C4B5FD',
		data: '#2DD4BF',
		security: '#FBBF24',
		output: '#7DB8FB',
		external: '#9CA3AF',
		system: '#9CA3AF',
	},
};

/** Badge fill, badge border and glyph ink for a node's role, in one appearance. */
export function iconStyle(role: string, mode: Mode): { fill: string; stroke: string; glyph: string } {
	const h = themeColors[ICON_TOKEN[role] ?? 'neutral'][mode];
	return {
		// A touch stronger than the card tint so the badge reads as a distinct tile
		// even on same-hue shapes (for example a teal store cylinder).
		fill: tint(h, mode, mode === 'light' ? 0.22 : 0.34),
		stroke: tint(h, mode, mode === 'light' ? 0.5 : 0.58),
		glyph: GLYPH_INK[mode][role] ?? GLYPH_INK[mode].external,
	};
}

// D2 marks a linked node with a white "chain" sticker in the corner, jarring on
// a dark card, and redundant with the underline VitePress already adds. Repaint
// it (plugins/markdown-d2.ts) as a quiet surface chip with an "opens a page"
// arrow, drawn in the muted label ink so it hints without shouting.
export function linkChip(mode: Mode): { disc: string; border: string; ink: string } {
	const s = SURFACE[mode];
	return { disc: s.card, border: s.ramp[0], ink: s.label };
}
