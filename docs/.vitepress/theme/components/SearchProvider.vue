<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import FastSearch from './FastSearch.vue';

const searchVisible = ref(false);

function handleKeydown(e: KeyboardEvent) {
	if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
		e.preventDefault();
		searchVisible.value = true;
	}
}

onMounted(() => {
	document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
	<FastSearch :visible="searchVisible" @close="searchVisible = false" />
</template>
