<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
	item: unknown;
	status?: 'normal' | 'filtered' | 'transformed' | 'new';
	prevItem?: unknown;
	compact?: boolean;
}>();

const expanded = ref(false);

interface DisplayFields {
	primary: { key: string; value: unknown } | null;
	secondary: { key: string; value: unknown } | null;
}

const PRIMARY_KEYS = ['name', 'title', 'label', 'id', 'key', 'email', 'username'];
const SECONDARY_KEYS = ['status', 'type', 'role', 'category', 'state', 'active'];

function detectDisplayFields(item: unknown): DisplayFields {
	if (item === null || item === undefined || typeof item !== 'object' || Array.isArray(item)) {
		return { primary: null, secondary: null };
	}

	const obj = item as Record<string, unknown>;
	const keys = Object.keys(obj);

	let primary: DisplayFields['primary'] = null;
	let secondary: DisplayFields['secondary'] = null;

	for (const key of PRIMARY_KEYS) {
		if (key in obj && obj[key] !== undefined && obj[key] !== null) {
			primary = { key, value: obj[key] };
			break;
		}
	}

	for (const key of SECONDARY_KEYS) {
		if (key in obj && obj[key] !== undefined && obj[key] !== null) {
			secondary = { key, value: obj[key] };
			break;
		}
	}

	if (!primary && keys.length > 0) {
		const firstKey = keys[0];
		primary = { key: firstKey, value: obj[firstKey] };
	}

	return { primary, secondary };
}

const displayFields = computed(() => detectDisplayFields(props.item));

const isPrimitive = computed(() => {
	return props.item === null || typeof props.item !== 'object';
});

function formatPrimitive(value: unknown): string {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return value.length > 20 ? `${value.slice(0, 18)}…` : value;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return String(value);
}

function formatPrimaryValue(value: unknown): string {
	if (typeof value === 'string') return value.length > 16 ? `${value.slice(0, 14)}…` : value;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return String(value);
}

function formatSecondaryValue(value: unknown): string {
	if (typeof value === 'boolean') return value ? 'active' : 'inactive';
	if (typeof value === 'string') return value.length > 10 ? `${value.slice(0, 8)}…` : value;
	return String(value);
}

function getTooltip(): string {
	return JSON.stringify(props.item, null, 2);
}

const statusClass = computed(() => {
	switch (props.status) {
		case 'filtered':
			return 'opacity-40 border-dashed bg-red-50/50 dark:bg-red-900/10';
		case 'transformed':
			return 'ring-2 ring-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10';
		case 'new':
			return 'ring-2 ring-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-900/10';
		default:
			return 'bg-white dark:bg-zinc-800';
	}
});
</script>

<template>
	<div
		class="group relative rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md"
		:class="[statusClass, compact ? 'px-2 py-1.5' : 'px-3 py-2']"
		:title="getTooltip()"
		@click="expanded = !expanded"
	>
		<!-- Primitive value -->
		<div v-if="isPrimitive" class="font-mono text-sm text-zinc-700 dark:text-zinc-200">
			{{ formatPrimitive(item) }}
		</div>

		<!-- Object value -->
		<div v-else class="flex flex-col gap-1">
			<!-- Primary field -->
			<div
				v-if="displayFields.primary"
				class="font-medium text-sm text-zinc-800 dark:text-zinc-100 truncate"
			>
				{{ formatPrimaryValue(displayFields.primary.value) }}
			</div>

			<!-- Secondary badge -->
			<div
				v-if="displayFields.secondary"
				class="inline-flex items-center self-start px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded"
				:class="{
					'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400':
						displayFields.secondary.value === true || displayFields.secondary.value === 'active' || displayFields.secondary.value === 'completed',
					'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400':
						displayFields.secondary.value === 'pending' || displayFields.secondary.value === 'processing',
					'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400':
						displayFields.secondary.value === false || displayFields.secondary.value === 'inactive' || displayFields.secondary.value === 'cancelled',
					'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300':
						typeof displayFields.secondary.value === 'string' &&
						!['active', 'completed', 'pending', 'processing', 'inactive', 'cancelled'].includes(displayFields.secondary.value)
				}"
			>
				{{ formatSecondaryValue(displayFields.secondary.value) }}
			</div>

			<!-- Filtered indicator -->
			<div
				v-if="status === 'filtered'"
				class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
			>
				<svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
		</div>

		<!-- Expansion panel -->
		<div
			v-if="expanded && !isPrimitive"
			class="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-600"
		>
			<pre class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 overflow-auto max-h-32 whitespace-pre-wrap">{{ JSON.stringify(item, null, 2) }}</pre>
		</div>
	</div>
</template>
