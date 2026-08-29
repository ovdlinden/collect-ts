<script setup lang="ts">
function openSearch() {
	document.dispatchEvent(new CustomEvent('open-search'));
}
</script>

<template>
	<button class="search-button" type="button" aria-label="Search" @click="openSearch">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.35-4.35" />
		</svg>
		<span class="search-button-text">Search</span>
		<kbd class="search-button-kbd">⌘K</kbd>
	</button>
</template>

<style scoped>
.search-button {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 12px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-2);
	font-size: 14px;
	cursor: pointer;
	transition: border-color 0.2s, color 0.2s;
}

.search-button:hover {
	border-color: var(--vp-c-brand-1);
	color: var(--vp-c-text-1);
}

.search-button-text {
	display: none;
}

.search-button-kbd {
	display: none;
	padding: 2px 6px;
	border-radius: 4px;
	background: var(--vp-c-bg);
	border: 1px solid var(--vp-c-divider);
	font-family: inherit;
	font-size: 12px;
}

@media (min-width: 768px) {
	.search-button-text {
		display: inline;
	}
	.search-button-kbd {
		display: inline;
	}
}
</style>
