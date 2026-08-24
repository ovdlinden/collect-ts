<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
const copied = ref(false)

// The raw-markdown twins of every page are emitted by vitepress-plugin-llms
// into the built site, so `<route>.md` resolves in production. In dev the
// fetch can miss; the fallback opens the URL instead of failing silently.
async function copyMarkdown() {
	const mdPath = route.path.replace(/\.html$/, '').replace(/\/$/, '') || '/index'
	const url = new URL(mdPath + '.md', window.location.origin)

	try {
		const res = await fetch(url)
		if (!res.ok) throw new Error('Failed to fetch')
		const text = await res.text()
		await navigator.clipboard.writeText(text)
		copied.value = true
		setTimeout(() => (copied.value = false), 2000)
	} catch {
		window.open(url, '_blank')
	}
}
</script>

<template>
	<button class="copy-md" :class="{ copied }" @click="copyMarkdown">
		<svg v-if="copied" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
		<svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
		<span class="label">{{ copied ? 'Copied' : 'Copy' }}</span>
	</button>
</template>

<style scoped>
.copy-md {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 8px;
	border-radius: 6px;
	background: transparent;
	border: 1px solid var(--vp-c-divider);
	cursor: pointer;
	font-size: 12px;
	color: var(--vp-c-text-2);
	transition: all 0.15s ease;
}

.copy-md:hover {
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-1);
	border-color: var(--vp-c-brand-1);
}

.copy-md.copied {
	background: var(--doc-c-success-soft);
	border-color: var(--doc-c-success);
	color: var(--doc-c-success);
}

.icon {
	width: 14px;
	height: 14px;
}

.label {
	font-weight: 500;
}
</style>
