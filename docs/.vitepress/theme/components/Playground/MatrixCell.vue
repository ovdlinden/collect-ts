<script setup lang="ts">
const props = defineProps<{
	value: unknown;
	status: 'value' | 'filtered' | 'unchanged' | 'new';
	prevValue?: unknown;
}>();

function formatValue(value: unknown): string {
	if (value === undefined) return '—';
	if (value === null) return 'null';

	if (typeof value === 'string') {
		return value.length > 12 ? `"${value.slice(0, 10)}…"` : `"${value}"`;
	}

	if (typeof value === 'number') {
		if (Math.abs(value) >= 10000) return value.toLocaleString('en', { notation: 'compact' });
		if (!Number.isInteger(value)) return value.toFixed(2);
		return String(value);
	}

	if (typeof value === 'boolean') return value ? 'true' : 'false';

	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		if (value.length <= 2) return `[${value.map(v => formatPrimitive(v)).join(', ')}]`;
		return `[${value.length}]`;
	}

	if (typeof value === 'object') {
		return formatObject(value as Record<string, unknown>);
	}

	return String(value);
}

function formatPrimitive(value: unknown): string {
	if (value === null) return 'null';
	if (typeof value === 'string') return value.length > 8 ? `"${value.slice(0, 6)}…"` : `"${value}"`;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return '…';
}

function formatObject(obj: Record<string, unknown>): string {
	const keys = Object.keys(obj);
	if (keys.length === 0) return '{}';

	// Try to find a "name" or "id" or first string/number property
	const nameKey = keys.find(k => k === 'name' || k === 'title' || k === 'id');
	const firstKey = nameKey || keys[0];
	const firstVal = obj[firstKey];

	if (typeof firstVal === 'string') {
		const display = firstVal.length > 10 ? `${firstVal.slice(0, 8)}…` : firstVal;
		// If there's a second meaningful property, show it
		const secondKey = keys.find(k => k !== firstKey && (k === 'role' || k === 'type' || k === 'status'));
		if (secondKey && typeof obj[secondKey] === 'string') {
			return `${display} (${obj[secondKey]})`;
		}
		return display;
	}

	if (typeof firstVal === 'number') {
		return `${firstKey}:${firstVal}`;
	}

	return `{${keys.length}}`;
}

function getTooltip(): string {
	if (props.status === 'filtered') {
		return `Filtered out:\n${JSON.stringify(props.prevValue, null, 2)}`;
	}
	if (props.status === 'unchanged') {
		return `Unchanged:\n${JSON.stringify(props.value, null, 2)}`;
	}
	if (props.prevValue !== undefined && props.prevValue !== props.value) {
		return `Before:\n${JSON.stringify(props.prevValue, null, 2)}\n\nAfter:\n${JSON.stringify(props.value, null, 2)}`;
	}
	return JSON.stringify(props.value, null, 2);
}
</script>

<template>
	<span
		class="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md text-xs font-mono transition-colors cursor-default"
		:class="{
			'text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800': status === 'value',
			'opacity-20': status === 'filtered',
			'text-zinc-400 dark:text-zinc-500': status === 'unchanged',
			'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30 font-medium': status === 'new',
		}"
		:title="getTooltip()"
	>
		{{ formatValue(status === 'filtered' ? prevValue : value) }}
	</span>
</template>
