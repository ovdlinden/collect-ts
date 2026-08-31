<script setup lang="ts">
import bundleSizes from '../data/bundle-sizes.json';

const props = defineProps<{
	type?: 'full' | 'treeshaken' | 'standalone';
}>();

const size = props.type === 'standalone'
	? bundleSizes.standalone.formatted
	: props.type === 'treeshaken'
		? bundleSizes.treeshaken.formatted
		: bundleSizes.full.formatted;
</script>

<template>
	<span class="bundle-size">{{ size }}</span>
</template>
