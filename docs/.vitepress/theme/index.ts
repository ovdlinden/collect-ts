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
		// Target of the ```d2 fence renderer in plugins/markdown-d2.ts. Registered
		// eagerly, not async: the component's whole job is to inline SVG that was
		// rendered at build time, so it has to be present during SSR.
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
		// Zoomable images. Diagrams enlarge too, but medium-zoom only handles
		// <img> — D2Diagram.vue ships its own <dialog> lightbox for SVGs.
		const initZoom = () => {
			mediumZoom('.vp-doc img:not(.no-zoom)', { background: 'var(--vp-c-bg)' });
		};
		onMounted(initZoom);
		watch(
			() => route.path,
			() => nextTick(initZoom),
		);
	},
} satisfies Theme;
