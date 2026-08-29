import type MarkdownIt from 'markdown-it';

/**
 * Handles output markers in code blocks.
 *
 * This plugin:
 * 1. Extracts output lines (// → ...) from the code BEFORE Shiki renders it
 * 2. Lets Shiki render the clean code
 * 3. Appends styled output lines to the rendered HTML
 *
 * This is cleaner than post-processing Shiki's HTML because:
 * - We parse simple source code, not complex highlighted HTML
 * - We inject at a known point (before </code></pre>)
 * - No fragile regex on Shiki's nested spans
 */
export function outputPreprocessPlugin(md: MarkdownIt): void {
	const originalFence = md.renderer.rules.fence!;

	md.renderer.rules.fence = (tokens, idx, options, env, self) => {
		const token = tokens[idx];
		const originalCode = token.content;

		// Extract output lines from the code
		const { code, outputs } = parseOutputs(originalCode);

		// Let Shiki render the clean code (without output lines)
		token.content = code;
		let html = originalFence(tokens, idx, options, env, self);

		// If we have outputs, inject them before the closing tags
		if (outputs.length > 0) {
			const outputHtml = renderOutputs(outputs);
			// Inject before </code></pre> - this is a stable structure from Shiki
			html = html.replace(/<\/code><\/pre>/, outputHtml + '</code></pre>');
			// Add class for CSS targeting
			html = html.replace('<pre class="', '<pre class="has-output ');
		}

		return html;
	};
}

interface ParseResult {
	code: string;
	outputs: OutputBlock[];
}

interface OutputBlock {
	lines: string[];
	attachToLine: number; // Which code line this output follows
}

/**
 * Parse output markers from code.
 * Supports:
 *   // → single line
 *   // → {
 *   //     multi
 *   //     line
 *   // }
 */
function parseOutputs(code: string): ParseResult {
	const lines = code.split('\n');
	const codeLines: string[] = [];
	const outputs: OutputBlock[] = [];

	let i = 0;
	while (i < lines.length) {
		const line = lines[i];

		// Check for output start: // → content
		const outputMatch = /^\s*\/\/\s*→\s?(.*)$/.exec(line);

		if (outputMatch) {
			const outputLines: string[] = [outputMatch[1]];

			// Collect continuation lines
			let j = i + 1;
			while (j < lines.length) {
				const nextLine = lines[j];

				// Stop if this is a new output
				if (/^\s*\/\/\s*→/.test(nextLine)) break;

				// Check for continuation (// without →)
				const contMatch = /^\s*\/\/ ?(.*)$/.exec(nextLine);
				if (contMatch) {
					outputLines.push(contMatch[1]);
					j++;
				} else {
					break;
				}
			}

			outputs.push({
				lines: outputLines,
				attachToLine: codeLines.length - 1,
			});

			i = j;
		} else {
			codeLines.push(line);
			i++;
		}
	}

	return {
		code: codeLines.join('\n'),
		outputs,
	};
}

/**
 * Render output blocks as HTML line elements.
 */
function renderOutputs(outputs: OutputBlock[]): string {
	return outputs
		.flatMap((block) =>
			block.lines.map((line, idx) => {
				const isFirst = idx === 0;
				const prefix = isFirst ? '<span class="output-arrow">→ </span>' : '<span class="output-indent">  </span>';
				const value = escapeHtml(line);
				return `<span class="line output-line"><span class="code-output">${prefix}<span class="output-value">${value}</span></span></span>`;
			}),
		)
		.join('');
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
