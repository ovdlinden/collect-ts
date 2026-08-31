<script setup lang="ts">
import { computed, inject, type Ref } from 'vue';
import type { PipelineStep } from './instrumentedCollect';
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
	steps: PipelineStep[];
	result: unknown;
}>();

const currentStepIndex = inject<Ref<number>>('currentStepIndex');

function isStepDimmed(stepIndex: number): boolean {
	if (currentStepIndex?.value === undefined) return false;
	return stepIndex > currentStepIndex.value;
}

// Get the input items (first step's input)
const inputItems = computed(() => {
	if (props.steps.length === 0) return [];
	const input = props.steps[0].input;
	return Array.isArray(input) ? input : [input];
});

// Track each input item through all stages
interface LaneCell {
	value: unknown;
	status: 'normal' | 'transformed' | 'filtered';
	prevValue?: unknown;
}

interface Lane {
	inputValue: unknown;
	inputIndex: number;
	cells: LaneCell[];
	inResult: boolean;
}

// Terminal methods that don't change items
const TERMINAL_METHODS = ['all', 'toArray', 'values', 'keys', 'entries'];

// Get a unique identifier for an item
function getItemId(item: unknown): string {
	if (item === null || item === undefined) return String(item);
	if (typeof item !== 'object') return JSON.stringify(item);
	const obj = item as Record<string, unknown>;
	// Try common id fields
	for (const key of ['id', 'key', '_id']) {
		if (key in obj) return `${key}:${obj[key]}`;
	}
	// Fall back to full JSON
	return JSON.stringify(item);
}

// Find an item in an array by content matching
function findItemInArray(item: unknown, arr: unknown[]): number {
	const itemId = getItemId(item);
	const itemJson = JSON.stringify(item);

	// First try exact match
	const exactIdx = arr.findIndex(v => JSON.stringify(v) === itemJson);
	if (exactIdx !== -1) return exactIdx;

	// Then try id-based match
	return arr.findIndex(v => getItemId(v) === itemId);
}

const lanes = computed((): Lane[] => {
	if (props.steps.length === 0 || inputItems.value.length === 0) return [];

	const result: Lane[] = [];

	// Track which output items have been "claimed" at each step
	// Key: stepIdx, Value: Map of valueJson -> count of claims
	const claimedCounts: Map<string, number>[] = props.steps.map(() => new Map());

	// For each input item, track it through all stages
	for (let inputIdx = 0; inputIdx < inputItems.value.length; inputIdx++) {
		const lane: Lane = {
			inputValue: inputItems.value[inputIdx],
			inputIndex: inputIdx,
			cells: [],
			inResult: false,
		};

		let currentValue = inputItems.value[inputIdx];
		let isFiltered = false;

		for (let stepIdx = 0; stepIdx < props.steps.length; stepIdx++) {
			const step = props.steps[stepIdx];
			const stepOutput = Array.isArray(step.output) ? step.output : [step.output];
			const claimed = claimedCounts[stepIdx];

			if (isFiltered) {
				// Already filtered out in a previous step
				lane.cells.push({ value: undefined, status: 'filtered' });
				continue;
			}

			// Terminal methods don't change anything
			if (TERMINAL_METHODS.includes(step.method)) {
				lane.cells.push({ value: currentValue, status: 'normal' });
				continue;
			}

			// Count how many times our value appears in output
			const valueJson = JSON.stringify(currentValue);
			const countInOutput = stepOutput.filter(v => JSON.stringify(v) === valueJson).length;
			const alreadyClaimed = claimed.get(valueJson) || 0;

			if (alreadyClaimed < countInOutput) {
				// There's still an unclaimed copy of our value in output
				claimed.set(valueJson, alreadyClaimed + 1);
				lane.cells.push({ value: currentValue, status: 'normal' });
			} else {
				// Not found exactly - check if it was transformed or filtered
				let foundTransformed = false;

				// Check for pluck-style transformation (object → primitive)
				if (typeof currentValue === 'object' && currentValue !== null) {
					const obj = currentValue as Record<string, unknown>;
					// Check if any field value matches an unclaimed output item
					for (const [, val] of Object.entries(obj)) {
						const valJson = JSON.stringify(val);
						const countInOutput = stepOutput.filter(v => JSON.stringify(v) === valJson).length;
						const alreadyClaimed = claimed.get(valJson) || 0;

						if (alreadyClaimed < countInOutput) {
							// Claim this transformed value
							claimed.set(valJson, alreadyClaimed + 1);
							lane.cells.push({
								value: val,
								status: 'transformed',
								prevValue: currentValue
							});
							currentValue = val;
							foundTransformed = true;
							break;
						}
					}
				}

				if (!foundTransformed) {
					// For transformation methods, check if there's a transformed version by id
					const currentId = getItemId(currentValue);
					for (const outputItem of stepOutput) {
						const outputId = getItemId(outputItem);
						const outputJson = JSON.stringify(outputItem);
						const countInOutput = stepOutput.filter(v => JSON.stringify(v) === outputJson).length;
						const alreadyClaimed = claimed.get(outputJson) || 0;

						if (outputId === currentId && outputJson !== JSON.stringify(currentValue) && alreadyClaimed < countInOutput) {
							claimed.set(outputJson, alreadyClaimed + 1);
							lane.cells.push({
								value: outputItem,
								status: 'transformed',
								prevValue: currentValue
							});
							currentValue = outputItem;
							foundTransformed = true;
							break;
						}
					}
				}

				if (!foundTransformed) {
					// Item was filtered out (either doesn't exist or all copies claimed)
					isFiltered = true;
					lane.cells.push({ value: currentValue, status: 'filtered', prevValue: currentValue });
				}
			}
		}

		// Check if this lane's final value is in the result
		if (!isFiltered) {
			const finalResult = Array.isArray(props.result) ? props.result : [props.result];
			lane.inResult = finalResult.some(v => JSON.stringify(v) === JSON.stringify(currentValue));
		}

		result.push(lane);
	}

	// Reorder lanes to match the final output order
	// Lanes still in result come first (in result order), filtered lanes come last (in original order)
	const finalOutput = props.steps.length > 0
		? (Array.isArray(props.steps[props.steps.length - 1].output)
			? props.steps[props.steps.length - 1].output as unknown[]
			: [props.steps[props.steps.length - 1].output])
		: [];

	result.sort((a, b) => {
		const aFinalValue = a.cells.length > 0 && a.cells[a.cells.length - 1].status !== 'filtered'
			? a.cells[a.cells.length - 1].value
			: null;
		const bFinalValue = b.cells.length > 0 && b.cells[b.cells.length - 1].status !== 'filtered'
			? b.cells[b.cells.length - 1].value
			: null;

		// Filtered lanes go to the bottom
		if (aFinalValue === null && bFinalValue !== null) return 1;
		if (aFinalValue !== null && bFinalValue === null) return -1;
		if (aFinalValue === null && bFinalValue === null) return a.inputIndex - b.inputIndex;

		// Find positions in final output
		const aPos = finalOutput.findIndex(v => JSON.stringify(v) === JSON.stringify(aFinalValue));
		const bPos = finalOutput.findIndex(v => JSON.stringify(v) === JSON.stringify(bFinalValue));

		// Sort by position in final output
		if (aPos !== -1 && bPos !== -1) return aPos - bPos;
		if (aPos !== -1) return -1;
		if (bPos !== -1) return 1;
		return a.inputIndex - b.inputIndex;
	});

	return result;
});

function formatValue(value: unknown, maxLen = 18): string {
	if (value === undefined) return '';
	if (value === null) return 'null';
	if (typeof value === 'string') return value.length > maxLen ? `${value.slice(0, maxLen - 1)}…` : value;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (Array.isArray(value)) return `[${value.length}]`;
	if (typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		// Try to find a meaningful display value
		for (const key of ['name', 'title', 'label', 'post', 'text', 'value', 'id', 'key']) {
			if (key in obj && obj[key] != null) {
				const v = obj[key];
				if (typeof v === 'string') return v.length > maxLen ? `${v.slice(0, maxLen - 1)}…` : v;
				if (typeof v === 'number') return String(v);
			}
		}
		return `{${Object.keys(obj).length}}`;
	}
	return String(value);
}

function formatArgs(step: PipelineStep): string {
	if (step.args.length === 0) return '';

	// Hide collect's array input - it's redundant with the Input column
	if (step.method === 'collect') return '';

	return step.args
		.map((arg) => {
			if (typeof arg === 'function') {
				const fnStr = arg.toString();
				const match = fnStr.match(/^(?:function\s*)?\(?\s*([^)=]*)\)?\s*=>\s*(.+)$/);
				if (match) {
					const params = match[1].trim();
					const body = match[2].trim().slice(0, 16);
					return `${params} => ${body}${match[2].length > 16 ? '…' : ''}`;
				}
				return 'fn';
			}
			if (typeof arg === 'string') return `"${arg}"`;
			if (typeof arg === 'number') return String(arg);
			// Hide large arrays/objects
			if (Array.isArray(arg)) return arg.length <= 3 ? JSON.stringify(arg) : `[${arg.length}]`;
			if (typeof arg === 'object') return '{…}';
			const str = JSON.stringify(arg);
			return str?.slice(0, 12) ?? String(arg);
		})
		.join(', ');
}

const currentResult = computed(() => {
	if (currentStepIndex?.value === undefined || props.steps.length === 0) {
		return props.result;
	}
	const step = props.steps[currentStepIndex.value];
	return step?.output ?? props.result;
});

function formatResult(): string {
	const r = currentResult.value;
	if (r === undefined) return 'undefined';
	if (r === null) return 'null';
	if (typeof r === 'string') return `"${r}"`;
	if (typeof r === 'number' || typeof r === 'boolean') return String(r);
	if (Array.isArray(r)) {
		if (r.length === 0) return '[]';
		const items = r.slice(0, 5).map(v => formatValue(v)).join(', ');
		return r.length > 5 ? `[${items}, …]` : `[${items}]`;
	}
	if (typeof r === 'object') {
		const entries = Object.entries(r);
		if (entries.length <= 2) {
			return entries.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : v}`).join(', ');
		}
		return `{${entries.length}}`;
	}
	return String(r);
}

function getTooltip(value: unknown): string {
	return JSON.stringify(value, null, 2);
}
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Header -->
		<div class="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
			<span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
				Data Flow
			</span>
			<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
				{{ steps.length }} {{ steps.length === 1 ? 'step' : 'steps' }}
			</span>
		</div>

		<!-- Empty state -->
		<div v-if="steps.length === 0" class="flex-1 flex items-center justify-center p-4">
			<span class="text-sm italic text-zinc-400 dark:text-zinc-500">Run code to see data flow</span>
		</div>

		<!-- Lane-based flow grid -->
		<div v-else class="flex-1 overflow-auto">
			<table class="w-full border-collapse text-sm font-mono">
				<!-- Header row: stage names -->
				<thead class="sticky top-0 bg-white dark:bg-zinc-900 z-10">
					<tr>
						<!-- Input column header -->
						<th class="px-4 py-2.5 text-left font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700 min-w-[160px]">
							Input
						</th>

						<!-- Stage headers -->
						<th
							v-for="(step, idx) in steps"
							:key="idx"
							class="px-4 py-2.5 text-center border-b border-zinc-200 dark:border-zinc-700 min-w-[160px] transition-opacity"
							:class="{ 'opacity-30': isStepDimmed(idx) }"
						>
							<a
								v-if="getMethodDocUrl(step.method)"
								:href="getMethodDocUrl(step.method)!"
								class="text-primary font-semibold hover:underline"
							>
								.{{ step.method }}()
							</a>
							<span v-else class="text-primary font-semibold">.{{ step.method }}()</span>
							<div
								v-if="formatArgs(step)"
								class="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal mt-0.5"
							>
								{{ formatArgs(step) }}
							</div>
						</th>

						<!-- Result column header -->
						<th class="px-4 py-2.5 text-center font-semibold text-emerald-600 dark:text-emerald-400 border-b border-zinc-200 dark:border-zinc-700 min-w-[180px]">
							Result
						</th>
					</tr>
				</thead>

				<!-- Data rows: one per input item -->
				<tbody>
					<tr
						v-for="(lane, laneIdx) in lanes"
						:key="laneIdx"
						class="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
					>
						<!-- Input cell -->
						<td
							class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
							:title="getTooltip(lane.inputValue)"
						>
							{{ formatValue(lane.inputValue, 24) }}
						</td>

						<!-- Stage cells -->
						<td
							v-for="(cell, cellIdx) in lane.cells"
							:key="cellIdx"
							class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-center transition-opacity"
							:class="{ 'opacity-30': isStepDimmed(cellIdx) }"
							:title="cell.value !== undefined ? getTooltip(cell.value) : ''"
						>
							<!-- Filtered -->
							<span
								v-if="cell.status === 'filtered'"
								class="inline-flex items-center gap-1.5 text-red-400 dark:text-red-500"
							>
								<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
									<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
								</svg>
								<span class="text-xs text-red-300 dark:text-red-600 line-through">{{ formatValue(cell.prevValue, 10) }}</span>
							</span>

							<!-- Transformed -->
							<span
								v-else-if="cell.status === 'transformed'"
								class="inline-block px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium"
							>
								{{ formatValue(cell.value, 24) }}
							</span>

							<!-- Normal -->
							<span v-else class="text-zinc-600 dark:text-zinc-400">
								{{ formatValue(cell.value, 24) }}
							</span>
						</td>

						<!-- Result cell (only show content in first row) -->
						<td
							v-if="laneIdx === 0"
							:rowspan="lanes.length"
							class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-center align-middle bg-emerald-50/50 dark:bg-emerald-900/10"
						>
							<div class="font-mono text-emerald-700 dark:text-emerald-300 text-sm whitespace-pre-wrap max-w-[200px]">
								{{ formatResult() }}
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>
