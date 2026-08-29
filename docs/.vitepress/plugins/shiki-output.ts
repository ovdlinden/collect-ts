import type { ShikiTransformer } from 'shiki';

/**
 * Shiki transformer that extracts output markers (// → ...) from code
 * and renders them as styled output lines below the code.
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
			const outputs: string[][] = (this as any).__outputs || [];
			if (outputs.length === 0) return;

			// The hast root contains: root -> pre -> code -> lines
			const preEl = hast.children?.find(
				(child: any) => child.type === 'element' && child.tagName === 'pre'
			) as any;

			if (!preEl) return;

			// Add has-output class to pre
			preEl.properties = preEl.properties || {};
			const existing = preEl.properties.class || '';
			preEl.properties.class = `has-output ${existing}`.trim();

			// Find the code element inside pre
			const codeEl = preEl.children?.find(
				(child: any) => child.type === 'element' && child.tagName === 'code'
			) as any;

			if (!codeEl?.children) return;

			// Add output line elements to code
			for (const outputLines of outputs) {
				for (let i = 0; i < outputLines.length; i++) {
					const isFirst = i === 0;
					const line = outputLines[i];

					codeEl.children.push({
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
										children: [{ type: 'text', value: isFirst ? '→ ' : '  ' }]
									},
									{
										type: 'element',
										tagName: 'span',
										properties: { class: 'output-value' },
										children: [{ type: 'text', value: line }]
									}
								]
							}
						]
					});
				}
			}
		}
	};
}

interface ParseResult {
	cleanCode: string;
	outputs: string[][];
}

/**
 * Parse output markers from code.
 * Supports:
 *   // → single line
 *   // → multi
 *   //   line (continuation)
 */
function parseOutputs(code: string): ParseResult {
	const lines = code.split('\n');
	const codeLines: string[] = [];
	const outputs: string[][] = [];

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

			outputs.push(outputLines);
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
