<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import FastSearch from './FastSearch.vue';

const searchVisible = ref(false);

function openSearch() {
	searchVisible.value = true;
}

function handleKeydown(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
		e.preventDefault();
		openSearch();
	}
}

onMounted(() => {
	document.addEventListener('keydown', handleKeydown);
	document.addEventListener('open-search', openSearch);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown);
	document.removeEventListener('open-search', openSearch);
});
</script>

<template>
	<FastSearch :visible="searchVisible" @close="searchVisible = false" />
</template>
