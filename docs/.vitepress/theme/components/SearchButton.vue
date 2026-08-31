<script setup lang="ts">
function openSearch() {
	document.dispatchEvent(new CustomEvent('open-search'));
}
</script>

<template>
	<button
		type="button"
		aria-label="Search"
		class="flex items-center gap-1.5 ml-4 px-2.5 h-8 border border-[var(--vp-c-divider)] rounded-md bg-[var(--vp-c-bg-alt)] text-[var(--vp-c-text-3)] text-[13px] font-medium cursor-pointer transition-all duration-150 hover:border-primary hover:bg-[var(--vp-c-bg-soft)] md:min-w-[140px]"
		@click="openSearch"
	>
		<svg class="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
		<span class="hidden md:inline">Search</span>
		<kbd class="hidden md:inline ml-auto font-mono text-[11px] font-medium text-[var(--vp-c-text-3)]">⌘K</kbd>
	</button>
</template>
