<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()
const copied = ref(false)

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
	<button
		class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-transparent border border-[var(--vp-c-divider)] cursor-pointer text-xs text-[var(--vp-c-text-2)] transition-all duration-150 hover:bg-[var(--vp-c-bg-soft)] hover:text-[var(--vp-c-text-1)] hover:border-primary"
		:class="copied && 'bg-success-soft border-success text-success'"
		@click="copyMarkdown"
	>
		<svg v-if="copied" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
		<svg v-else class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
		<span class="font-medium">{{ copied ? 'Copied' : 'Copy' }}</span>
	</button>
</template>
