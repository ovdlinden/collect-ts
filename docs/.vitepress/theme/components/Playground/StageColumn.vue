<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineStep } from './instrumentedCollect';
import ItemCard from './ItemCard.vue';
import methodsData from '../../data/methods.json';

const methodCategories = new Map(
	(methodsData as { name: string; category: string }[]).map(m => [m.name, m.category])
);

function getMethodDocUrl(methodName: string): string | null {
	if (methodName === 'collect') return '/collections/creating#collect';
	const category = methodCategories.get(methodName);
	return category ? `/collections/${category}#${methodName.toLowerCase()}` : null;
}

const props = defineProps<{
	step: PipelineStep;
	prevStep: PipelineStep | null;
	isDimmed?: boolean;
	isFirst?: boolean;
	isCurrent?: boolean;
}>();

interface ItemWithStatus {
	item: unknown;
	status: 'normal' | 'filtered' | 'transformed' | 'new';
	prevItem?: unknown;
}

function itemsEqual(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

const items = computed((): ItemWithStatus[] => {
	const output = props.step.output;
	const prevOutput = props.prevStep
		? Array.isArray(props.prevStep.output)
			? props.prevStep.output
			: [props.prevStep.output]
		: Array.isArray(props.step.input)
			? props.step.input
			: [props.step.input];

	if (!Array.isArray(output)) {
		return [{ item: output, status: 'normal' }];
	}

	// Track which output items we've matched to prev items
	const outputMatched = new Map<number, { prevIndex: number; status: 'normal' | 'transformed' }>();
	const prevMatched = new Set<number>();

	// First pass: find exact matches
	for (let outIdx = 0; outIdx < output.length; outIdx++) {
		for (let prevIdx = 0; prevIdx < prevOutput.length; prevIdx++) {
			if (prevMatched.has(prevIdx)) continue;
			if (itemsEqual(output[outIdx], prevOutput[prevIdx])) {
				outputMatched.set(outIdx, { prevIndex: prevIdx, status: 'normal' });
				prevMatched.add(prevIdx);
				break;
			}
		}
	}

	// Second pass: find transformed items by id/key
	for (let outIdx = 0; outIdx < output.length; outIdx++) {
		if (outputMatched.has(outIdx)) continue;

		const current = output[outIdx];
		const itemObj = typeof current === 'object' && current !== null ? current as Record<string, unknown> : null;
		const idKey = itemObj && ('id' in itemObj ? 'id' : 'key' in itemObj ? 'key' : null);

		if (idKey && itemObj) {
			for (let prevIdx = 0; prevIdx < prevOutput.length; prevIdx++) {
				if (prevMatched.has(prevIdx)) continue;
				const prevObj = typeof prevOutput[prevIdx] === 'object' && prevOutput[prevIdx] !== null
					? prevOutput[prevIdx] as Record<string, unknown>
					: null;
				if (prevObj && prevObj[idKey] === itemObj[idKey]) {
					outputMatched.set(outIdx, { prevIndex: prevIdx, status: 'transformed' });
					prevMatched.add(prevIdx);
					break;
				}
			}
		}
	}

	// Build result maintaining prev order for continuity, with new items at the end
	const result: ItemWithStatus[] = [];

	// First: items from prevOutput in order (matched or filtered)
	for (let prevIdx = 0; prevIdx < prevOutput.length; prevIdx++) {
		if (prevMatched.has(prevIdx)) {
			// Find which output item matched this
			for (const [outIdx, match] of outputMatched) {
				if (match.prevIndex === prevIdx) {
					result.push({
						item: output[outIdx],
						status: match.status,
						prevItem: match.status === 'transformed' ? prevOutput[prevIdx] : undefined,
					});
					break;
				}
			}
		} else {
			// This item was filtered
			result.push({ item: prevOutput[prevIdx], status: 'filtered' });
		}
	}

	// Then: new items (in output but not matched to any prev)
	for (let outIdx = 0; outIdx < output.length; outIdx++) {
		if (!outputMatched.has(outIdx)) {
			result.push({ item: output[outIdx], status: 'new' });
		}
	}

	return result;
});

const isAggregation = computed(() => {
	return !Array.isArray(props.step.output);
});

function formatArgs(): string {
	if (props.step.args.length === 0) return '';
	return props.step.args
		.map((arg) => {
			if (typeof arg === 'function') {
				const fnStr = arg.toString();
				const match = fnStr.match(/^(?:function\s*)?\(?\s*([^)=]*)\)?\s*=>\s*(.+)$/);
				if (match) {
					const body = match[2].slice(0, 16);
					return `${match[1]} => ${body}${match[2].length > 16 ? '…' : ''}`;
				}
				return 'fn';
			}
			if (typeof arg === 'string') return `"${arg}"`;
			return JSON.stringify(arg)?.slice(0, 12) ?? String(arg);
		})
		.join(', ');
}

function formatAggregation(value: unknown): string {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'string') return `"${value}"`;
	if (typeof value === 'object') {
		const entries = Object.entries(value);
		if (entries.length <= 3) {
			return entries.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : v}`).join(', ');
		}
		return `{${entries.length} groups}`;
	}
	return JSON.stringify(value);
}
</script>

<template>
	<div
		class="flex flex-col shrink-0 w-48 transition-all duration-200 rounded-xl px-1"
		:class="{
			'opacity-30': isDimmed,
			'bg-primary/5 ring-2 ring-primary/20': isCurrent && !isDimmed,
		}"
	>
		<!-- Stage header -->
		<div class="flex flex-col items-center gap-1 pb-3">
			<a
				v-if="getMethodDocUrl(step.method)"
				:href="getMethodDocUrl(step.method)!"
				class="text-sm font-semibold text-primary hover:underline"
				@click.stop
			>
				.{{ step.method }}()
			</a>
			<span v-else class="text-sm font-semibold text-primary">.{{ step.method }}()</span>
			<span
				v-if="formatArgs()"
				class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate max-w-full px-2"
				:title="formatArgs()"
			>
				{{ formatArgs() }}
			</span>
		</div>

		<!-- Items container -->
		<div class="flex-1 flex flex-col gap-2 px-2">
			<!-- Aggregation result -->
			<div
				v-if="isAggregation"
				class="flex items-center justify-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
			>
				<span class="text-sm font-mono text-amber-700 dark:text-amber-400">
					{{ formatAggregation(step.output) }}
				</span>
			</div>

			<!-- Item cards -->
			<template v-else>
				<ItemCard
					v-for="(itemData, index) in items"
					:key="index"
					:item="itemData.item"
					:status="itemData.status"
					:prev-item="itemData.prevItem"
					compact
				/>
			</template>
		</div>

		<!-- Stage footer -->
		<div class="flex items-center justify-center pt-3">
			<span class="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums">
				{{ step.itemCount }} {{ step.itemCount === 1 ? 'item' : 'items' }}
			</span>
		</div>
	</div>
</template>
