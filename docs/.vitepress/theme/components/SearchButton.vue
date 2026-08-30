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
	gap: 6px;
	margin-left: 16px;
	padding: 0 10px;
	height: 32px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg-alt);
	color: var(--vp-c-text-3);
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: border-color 0.15s, background 0.15s;
}

.search-button:hover {
	border-color: var(--vp-c-brand-1);
	background: var(--vp-c-bg-soft);
}

.search-button svg {
	width: 14px;
	height: 14px;
	flex-shrink: 0;
}

.search-button-text {
	display: none;
}

.search-button-kbd {
	display: none;
	margin-left: 4px;
	font-family: var(--vp-font-family-mono);
	font-size: 11px;
	font-weight: 500;
	color: var(--vp-c-text-3);
}

@media (min-width: 768px) {
	.search-button {
		min-width: 140px;
	}
	.search-button-text {
		display: inline;
	}
	.search-button-kbd {
		display: inline;
		margin-left: auto;
	}
}
</style>
