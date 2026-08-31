export type ColorToken = 'primary' | 'success' | 'warning' | 'accent' | 'neutral';

interface ColorDefinition {
	light: string;
	dark: string;
	/** Solid CSS custom property, declared in style.css. */
	cssVar: string;
	/** Translucent "soft" surface variant, declared in style.css. */
	softVar: string;
}

/**
 * Canonical palette — the single source of truth for the site's colors.
 * Laravel red leads, with teal / amber / blue / gray around it.
 *
 * To rebrand: change the hexes here AND the matching literals in
 * `../style.css` (both blocks). The two files must agree; the vars are what
 * the browser paints, this table is what build-time consumers read.
 *
 * Kept free of Vue / VitePress imports so build-time consumers (the Mermaid
 * markdown plugin, the VitePress config) can use the var helpers without
 * dragging client-only APIs into the Node config bundle.
 */
export const themeColors: Record<ColorToken, ColorDefinition> = {
	primary: { light: '#FF2D20', dark: '#FF6B61', cssVar: '--doc-c-primary', softVar: '--doc-c-primary-soft' },
	success: { light: '#00A896', dark: '#2DD4BF', cssVar: '--doc-c-success', softVar: '--doc-c-success-soft' },
	warning: { light: '#F4A261', dark: '#FBBF24', cssVar: '--doc-c-warning', softVar: '--doc-c-warning-soft' },
	accent: { light: '#0077B6', dark: '#60A5FA', cssVar: '--doc-c-accent', softVar: '--doc-c-accent-soft' },
	neutral: { light: '#6B7280', dark: '#9CA3AF', cssVar: '--doc-c-neutral', softVar: '--doc-c-neutral-soft' },
};

/** `var(--doc-c-…)` reference for a token's solid color. */
export function colorVar(token: ColorToken): string {
	return `var(${themeColors[token].cssVar})`;
}

/** `var(--doc-c-…-soft)` reference for a token's translucent surface. */
export function softVar(token: ColorToken): string {
	return `var(${themeColors[token].softVar})`;
}

/**
 * Semantic roles: the site-wide colour language. A role says what KIND of thing
 * something is, and its hue is drawn from the palette above, so diagrams and
 * components speak the same colours. This is the single source of truth for
 * that mapping. Change a role's hue here and it moves everywhere at once.
 *
 * The names are deliberately structural rather than domain-specific, so they
 * transfer to any project. Rename them if your domain has better words; the
 * only rule is that a role means the same thing on every page.
 */
export type SemanticRole = 'core' | 'data' | 'security' | 'output' | 'external';

/** Role to palette hue. */
export const roleColor: Record<SemanticRole, ColorToken> = {
	core: 'primary', //     the system's own components, the subject of the docs
	data: 'success', //     stores and buffers: databases, queues, caches
	security: 'warning', // trust boundaries: auth, certificates, secrets
	output: 'accent', //    what a reader consumes: dashboards, APIs, reports
	external: 'neutral', // the outside world: clients, third parties, the host
};

/** Role to default Lucide icon name; a node's own `icon:` still overrides this. */
export const roleIcon: Record<SemanticRole, string> = {
	core: 'box',
	data: 'database',
	security: 'shield-check',
	output: 'layout-dashboard',
	external: 'globe',
};

/** Human-readable role labels, for legends and captions. */
export const roleLabel: Record<SemanticRole, string> = {
	core: 'Core component',
	data: 'Data store',
	security: 'Trust & security',
	output: 'What you read',
	external: 'Outside the system',
};
