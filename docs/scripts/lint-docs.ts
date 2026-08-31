#!/usr/bin/env bun
// House-style linter for the docs. Enforces the checkable rules in
// .ai/illustrating.md so a violation fails the build instead of drifting back in.
// Run: bun run scripts/lint-docs.ts
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Rules. Flip a rule off here rather than deleting its code, so the house style
// stays visible as a menu and turning one back on is a one-word change.
// ---------------------------------------------------------------------------
const rules = {
	/** Ban the em-dash (U+2014) everywhere. */
	emDash: true,
	/** Ban emoji and decorative enclosed glyphs. Arrows and typographic marks stay legal. */
	emoji: true,
	/** Ban narrating comments inside code fences (the explanation belongs in a legend). */
	fenceComments: true,
	/** Ban the :::danger container; VitePress paints it red, off-palette here. */
	noDanger: true,
	/**
	 * Ban a section reference that does not resolve: `§N`, and the written-out
	 * `Section N` it used to require instead. A reader cannot click either one.
	 * Link the heading: `[the five steps](/02-restack#_2-the-five-steps)`, which
	 * `heading-links-resolve` then holds against the heading actually there.
	 */
	sectionReference: true,
	/** Require every fence to carry a language tag. */
	fenceLang: true,
	/** Require quoted alt text on every d2 fence: ```d2 [layout] "…". */
	d2Alt: true,
	/** Require a d2 fence's layout flag, when present, to be elk or dagre. */
	d2Layout: true,
	/** Require gap-free ### N.M numbering within each ## N section. */
	headingNumbers: true,
	/** Pin every :::info banner to one title, e.g. 'Framework'. null disables. */
	infoBannerTitle: null as string | null,
};

/**
 * Directories never walked. Site pages live at the root and in content
 * subdirectories. `history/` is preserved engineering history rather than a
 * source for the site: it records what was believed at the time, so a house
 * style applied to it now would be an edit to the record.
 *
 * `probes/` is here on that same ground, and it is here because it went missing.
 * The probes lived at `history/probes/` and were covered by the line above until
 * they were moved up one level; the move took them out of this set without
 * anything saying so, and `bun run lint` has been failing on 33 em-dashes in
 * `probes/README.md` ever since. Nothing in `./Taskfile check` could notice --
 * `prose_pages()` is a non-recursive glob, so the gate's own `em-dash-ban` does
 * not read the file either, and it exempts `docs/probes/` deliberately for the
 * reason stated here. Two linters disagreeing about one file is the defect; the
 * gate's reading is the right one.
 *
 * `.ai` is deliberately absent: the house style holds its own standards
 * documents, which were the worst prose in the project until they were held to
 * it. Nothing publishes from there, because VitePress's page glob skips
 * dot-directories, so linting it costs nothing at build time.
 */
const IGNORE_DIRS = new Set([
	'node_modules',
	'.vitepress',
	'.git',
	'public',
	'scripts',
	'history',
	'design',
	'probes',
	'api',
]);
/**
 * Root files that are repo documentation, not site pages. `architecture.md` is
 * the design document the tool is built from; it predates this house style and
 * is not written to it.
 *
 * `README.md` used to sit here too, exempt only because it was not clean yet.
 * Both READMEs are clean now, so the exemption is gone and the list is one file.
 */
const IGNORE_FILES = new Set(['architecture.md']);
/**
 * Fence languages whose bodies carry no lintable comment syntax. `d2` is here
 * because its own comment marker is `#` and its sources carry hex colours.
 * `console` is a captured transcript, and a `#` in one is a prompt or a real
 * line of output, never a gloss we wrote.
 */
const PASSTHROUGH_LANGS = new Set(['text', 'md', 'markdown', 'd2', 'console', '']);
/**
 * Fences holding output captured from a real run. The global bans below do not
 * apply inside one: the content is quoted rather than written, and editing a
 * transcript so it satisfies a style rule turns it into a claim about output
 * the tool does not actually produce. `git stack` itself prints an em-dash in
 * `help`, `status` and `merged`, which is what made the exemption necessary.
 *
 * Deliberately narrow. `text` is not here, so an ASCII sketch we drew is still
 * held to the rule, and neither is `d2`, so a diagram label still is.
 */
const TRANSCRIPT_LANGS = new Set(['console']);
/** Layouts markdown-d2.ts knows how to pass through to the d2 binary. */
const D2_LAYOUTS = new Set(['elk', 'dagre']);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Violation {
	file: string;
	line: number;
	msg: string;
}

const errors: Violation[] = [];
const add = (file: string, line: number, msg: string) => errors.push({ file, line, msg });

// Emoji and enclosed-glyph ranges. Arrows (U+2190..21FF) and typographic marks
// (middot, section sign, ellipsis) are deliberately NOT included: they are allowed.
const EMOJI = /[\u{2460}-\u{24FF}\u{2600}-\u{27BF}\u{1F000}-\u{1FAFF}]/u;
const EMDASH = /—/;
const FENCE = /^\s*(`{3,}|~{3,})(.*)$/;

interface FenceState {
	marker: string;
	len: number;
	lang: string;
	start: number;
}

function lintMarkdown(file: string, text: string): void {
	const lines = text.split('\n');
	let fence: FenceState | null = null;
	const majors: number[] = []; // heading-number tracking: last minor seen per major

	lines.forEach((line, i) => {
		const n = i + 1;
		const m = FENCE.exec(line);

		if (m) {
			const marker = m[1][0];
			const len = m[1].length;
			const rest = m[2].trim();
			if (!fence) {
				const lang = rest.split(/\s+/)[0] ?? '';
				if (rules.fenceLang && !lang) add(file, n, 'code fence without a language tag');
				if (lang === 'd2') checkD2Info(file, n, rest);
				fence = { marker, len, lang, start: n };
				return;
			}
			// CommonMark: only a same-marker run at least as long, with nothing
			// trailing, closes. A shorter inner fence is content, so a ````md
			// block can quote ``` examples verbatim.
			if (marker === fence.marker && len >= fence.len && rest === '') {
				fence = null;
				return;
			}
			// Falls through: an inner fence line is body content.
		}

		// Global bans, everywhere except a captured transcript.
		const quoted = fence !== null && TRANSCRIPT_LANGS.has(fence.lang);
		if (!quoted) {
			if (rules.emDash && EMDASH.test(line)) add(file, n, 'em-dash (U+2014)');
			if (rules.emoji && EMOJI.test(line)) add(file, n, 'emoji / enclosed glyph');
		}

		if (fence) {
			if (PASSTHROUGH_LANGS.has(fence.lang) || !rules.fenceComments) return;
			// Narrating comments in code fences. URLs are stripped first so a
			// https:// link in an example is not read as a // comment.
			// Allowed: // [!code ...] (VitePress transformers), // → (output markers),
			// //  ^? and // ^| (TwoSlash type queries)
			const code = line.replace(/\b[a-z][\w+.-]*:\/\/\S+/gi, '');
			if (/\/\/(?!\s*(\[!code|→|\^[?|]))/.test(code)) add(file, n, 'in-fence // comment (move to a legend)');
			else if (/(^|\s)#(?![![])/.test(code) && !/^\s*#!/.test(code))
				add(file, n, 'in-fence # comment (move to a legend)');
			return;
		}

		// Prose-only checks.
		if (rules.noDanger && /:::danger/.test(line)) add(file, n, ':::danger container (use :::warning)');
		if (rules.sectionReference && /\bSection \d|§/.test(line))
			add(file, n, 'section reference that does not resolve (link the heading)');
		if (rules.infoBannerTitle) {
			const info = /^:::\s*info\s+(.+?)\s*$/.exec(line);
			if (info && info[1] !== rules.infoBannerTitle)
				add(file, n, `info banner title "${info[1]}" (should be "${rules.infoBannerTitle}")`);
		}

		// Heading-number continuity: ### N.M must increment M within each ## N.
		if (rules.headingNumbers) {
			const major = /^##\s+(\d+)\./.exec(line);
			if (major) majors[+major[1]] = 0;
			const sub = /^###\s+(\d+)\.(\d+)\b/.exec(line);
			if (sub) {
				const maj = +sub[1];
				const min = +sub[2];
				const prev = majors[maj] ?? 0;
				if (min !== prev + 1) add(file, n, `heading ${maj}.${min} breaks numbering (expected ${maj}.${prev + 1})`);
				majors[maj] = min;
			}
		}
	});

	if (fence) add(file, (fence as FenceState).start, 'unterminated code fence');
}

/**
 * A d2 fence's info string: ```d2 [elk|dagre] "alt text". Both SVGs the plugin
 * emits are aria-hidden, so the alt text is the diagram's only accessible name.
 */
function checkD2Info(file: string, line: number, info: string): void {
	const rest = info.replace(/^d2\s*/, '');
	const quoted = /"([^"]*)"|'([^']*)'/.exec(rest);
	if (rules.d2Alt) {
		const alt = (quoted?.[1] ?? quoted?.[2] ?? '').trim();
		if (!alt) add(file, line, 'd2 fence without alt text (add: ```d2 "what it shows")');
	}
	if (rules.d2Layout) {
		const flags = rest
			.replace(/"[^"]*"|'[^']*'/g, '')
			.trim()
			.split(/\s+/)
			.filter(Boolean);
		for (const flag of flags) {
			if (!D2_LAYOUTS.has(flag)) add(file, line, `unknown d2 fence flag "${flag}" (expected elk or dagre)`);
		}
	}
}

/** Every .md page under the docs root, minus the ignore lists. */
function* markdownFiles(dir: string): Generator<string> {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (IGNORE_DIRS.has(entry.name)) continue;
			yield* markdownFiles(join(dir, entry.name));
		} else if (entry.name.endsWith('.md') && !IGNORE_FILES.has(entry.name)) {
			yield join(dir, entry.name);
		}
	}
}

let count = 0;
for (const path of markdownFiles(root)) {
	count++;
	lintMarkdown(relative(root, path), readFileSync(path, 'utf8'));
}

// config.ts: em-dashes only (nav/sidebar labels).
if (rules.emDash) {
	const cfg = readFileSync(join(root, '.vitepress/config.ts'), 'utf8').split('\n');
	cfg.forEach((line, i) => {
		if (EMDASH.test(line)) add('.vitepress/config.ts', i + 1, 'em-dash (U+2014)');
	});
}

if (errors.length) {
	console.error(`FAIL docs lint: ${errors.length} violation(s)\n`);
	for (const e of errors) console.error(`  ${e.file}:${e.line}  ${e.msg}`);
	process.exit(1);
}
console.log(`OK docs lint: clean (${count} file${count === 1 ? '' : 's'})`);
