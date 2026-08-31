import type MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';

export function outputContainerPlugin(md: MarkdownIt): void {
	md.use(container, 'output', {
		render(tokens: any[], idx: number) {
			if (tokens[idx].nesting === 1) {
				return '<div class="code-output-block"><span class="code-output-arrow">→</span>';
			}
			return '</div>\n';
		},
	});
}
