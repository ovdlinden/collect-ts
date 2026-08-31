import type { ShikiTransformer } from 'shiki';

/**
 * Shiki transformer that extracts output markers (// → ...) from code
 * and renders them as styled output lines directly below the corresponding code line.
 */
export function transformerOutputLines(): ShikiTransformer {
	return {
		name: 'output-lines',
		preprocess(code) {
			// Extract output lines from the code BEFORE Shiki highlights it
			const { cleanCode, outputs } = parseOutputs(code);

			// Store outputs in metadata for root hook
			(this as any).__outputs = outputs;

			// Return clean code without output lines
			return cleanCode;
		},
		root(hast) {
			const outputs: PositionedOutput[] = (this as any).__outputs || [];
			if (outputs.length === 0) return;

			// The hast root contains: root -> pre -> code -> lines
			const preEl = hast.children?.find((child: any) => child.type === 'element' && child.tagName === 'pre') as any;

			if (!preEl) return;

			// Add has-output class to pre
			preEl.properties = preEl.properties || {};
			const existing = preEl.properties.class || '';
			preEl.properties.class = `has-output ${existing}`.trim();

			// Find the code element inside pre
			const codeEl = preEl.children?.find((child: any) => child.type === 'element' && child.tagName === 'code') as any;

			if (!codeEl?.children) return;

			// Find indices of actual line elements (spans with class containing 'line')
			const lineIndices: number[] = [];
			for (let i = 0; i < codeEl.children.length; i++) {
				const child = codeEl.children[i];
				if (child.type === 'element' && child.tagName === 'span') {
					const cls = child.properties?.class || '';
					if (typeof cls === 'string' && cls.includes('line')) {
						lineIndices.push(i);
					} else if (Array.isArray(cls) && cls.some((c: string) => c.includes('line'))) {
						lineIndices.push(i);
					}
				}
			}

			// Insert output lines after their corresponding code lines
			// Process in reverse order to maintain correct indices when splicing
			for (let idx = outputs.length - 1; idx >= 0; idx--) {
				const output = outputs[idx];
				const outputElements = createOutputElements(output.lines);

				// Find the actual array index for this line number
				const lineNumber = output.afterLineIndex;
				if (lineNumber >= 0 && lineNumber < lineIndices.length) {
					// Insert after the line element
					const insertPosition = lineIndices[lineNumber] + 1;
					codeEl.children.splice(insertPosition, 0, ...outputElements);
				}
			}
		},
	};
}

interface PositionedOutput {
	afterLineIndex: number; // 0-based index of the code line this output follows
	lines: string[];
}

interface ParseResult {
	cleanCode: string;
	outputs: PositionedOutput[];
}

function createOutputElements(outputLines: string[]): any[] {
	return outputLines.map((line, i) => {
		const isFirst = i === 0;
		return {
			type: 'element',
			tagName: 'span',
			properties: { class: 'line output-line' },
			children: [
				{
					type: 'element',
					tagName: 'span',
					properties: { class: 'code-output' },
					children: [
						{
							type: 'element',
							tagName: 'span',
							properties: { class: isFirst ? 'output-arrow' : 'output-indent' },
							children: [{ type: 'text', value: isFirst ? '→ ' : '  ' }],
						},
						{
							type: 'element',
							tagName: 'span',
							properties: { class: 'output-value' },
							children: [{ type: 'text', value: line }],
						},
					],
				},
			],
		};
	});
}

/**
 * Parse output markers from code.
 * Supports:
 *   // → single line
 *   // → multi
 *   //   line (continuation)
 *
 * Tracks which code line each output follows.
 */
function parseOutputs(code: string): ParseResult {
	const lines = code.split('\n');
	const codeLines: string[] = [];
	const outputs: PositionedOutput[] = [];

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

			// Record this output with its position (after the last code line)
			outputs.push({
				afterLineIndex: codeLines.length - 1,
				lines: outputLines,
			});
			i = j;
		} else {
			codeLines.push(line);
			i++;
		}
	}

	return {
		cleanCode: codeLines.join('\n'),
		outputs,
	};
}
