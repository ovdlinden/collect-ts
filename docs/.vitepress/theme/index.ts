import mediumZoom from 'medium-zoom';
import type { Theme } from 'vitepress';
import { useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h, nextTick, onMounted, watch } from 'vue';

import 'virtual:group-icons.css';
import './style.css';

import Benchmarks from './components/Benchmarks.vue';
import CopyAsMarkdown from './components/CopyAsMarkdown.vue';
import D2Diagram from './components/D2Diagram.vue';

export default {
	extends: DefaultTheme,
	enhanceApp({ app }) {
		app.component('D2Diagram', D2Diagram);
		app.component('Benchmarks', Benchmarks);
	},
	Layout() {
		return h(DefaultTheme.Layout, null, {
			'doc-before': () => h('div', { class: 'doc-header-actions' }, [h(CopyAsMarkdown)]),
		});
	},
	setup() {
		const route = useRoute();
		const initZoom = () => {
			mediumZoom('.vp-doc img:not(.no-zoom)', { background: 'var(--vp-c-bg)' });
		};

		const initCopyFilter = () => {
			// Intercept copy button clicks to exclude output lines
			document.querySelectorAll('.vp-doc div[class*="language-"] button.copy').forEach((btn) => {
				btn.addEventListener('click', (e) => {
					const codeBlock = btn.closest('div[class*="language-"]');
					if (!codeBlock) return;

					const code = codeBlock.querySelector('pre code');
					if (!code) return;

					// Get text from all lines EXCEPT output lines
					const lines = code.querySelectorAll('.line:not(.output-line)');
					const text = Array.from(lines)
						.map((line) => line.textContent || '')
						.join('\n');

					// Override clipboard
					navigator.clipboard.writeText(text);
					e.stopPropagation();
					e.preventDefault();
				});
			});
		};

		onMounted(() => {
			initZoom();
			initCopyFilter();
		});
		watch(
			() => route.path,
			() =>
				nextTick(() => {
					initZoom();
					initCopyFilter();
				}),
		);
	},
} satisfies Theme;
