<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue';
import type { PipelineStep } from './instrumentedCollect';
import MatrixCell from './MatrixCell.vue';
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

const emit = defineEmits<{
	highlightLine: [lineIndex: number | null];
}>();

const currentStepIndex = inject<Ref<number>>('currentStepIndex');
const expandedRowIndex = ref<number | null>(null);

function isStepDimmed(stepIndex: number): boolean {
	if (currentStepIndex?.value === undefined) return false;
	return stepIndex > currentStepIndex.value;
}

function toggleRowExpansion(index: number): void {
	expandedRowIndex.value = expandedRowIndex.value === index ? null : index;
}

const currentResult = computed(() => {
	if (currentStepIndex?.value === undefined || props.steps.length === 0) {
		return props.result;
	}
	const step = props.steps[currentStepIndex.value];
	return step?.output ?? props.result;
});

const maxColumns = 12;

const columnCount = computed(() => {
	if (props.steps.length === 0) return 0;
	const maxItems = Math.max(...props.steps.map((s) => (Array.isArray(s.output) ? s.output.length : 1)));
	return Math.min(maxItems, maxColumns);
});

const hasMoreColumns = computed(() => {
	if (props.steps.length === 0) return false;
	const maxItems = Math.max(...props.steps.map((s) => (Array.isArray(s.output) ? s.output.length : 1)));
	return maxItems > maxColumns;
});

interface CellData {
	value: unknown;
	status: 'value' | 'filtered' | 'unchanged' | 'new';
	prevValue?: unknown;
}

interface RowData {
	isAggregation: boolean;
	aggregationValue?: unknown;
	cells: CellData[];
}

function getRowData(step: PipelineStep, stepIndex: number): RowData {
	const output = step.output;
	const input = Array.isArray(step.input) ? step.input : [step.input];
	const prevStep = stepIndex > 0 ? props.steps[stepIndex - 1] : null;
	const prevOutput = prevStep ? (Array.isArray(prevStep.output) ? prevStep.output : [prevStep.output]) : input;

	// Check if this is an aggregation (non-array output)
	if (!Array.isArray(output)) {
		return {
			isAggregation: true,
			aggregationValue: output,
			cells: [],
		};
	}

	const cells: CellData[] = [];
	for (let i = 0; i < columnCount.value; i++) {
		const value = output[i];
		const prevValue = prevOutput[i];

		let status: CellData['status'] = 'value';

		if (i >= output.length && i < prevOutput.length) {
			status = 'filtered';
			cells.push({ value: undefined, status, prevValue });
		} else if (value === prevValue) {
			status = 'unchanged';
			cells.push({ value, status, prevValue });
		} else if (prevValue === undefined) {
			status = 'new';
			cells.push({ value, status });
		} else {
			cells.push({ value, status: 'value', prevValue });
		}
	}

	return { isAggregation: false, cells };
}

function formatAggregation(value: unknown): string {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'number') return String(value);
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	if (typeof value === 'string') return `"${value}"`;
	if (Array.isArray(value)) {
		return `[${value.length} items]`;
	}
	if (typeof value === 'object') {
		// For grouped objects, show key: count summary
		const entries = Object.entries(value);
		if (entries.length === 0) return '{}';
		if (entries.length <= 4) {
			return entries.map(([key, val]) => {
				if (Array.isArray(val)) return `${key}: ${val.length}`;
				return `${key}: 1`;
			}).join(', ');
		}
		return `{${entries.length} groups}`;
	}
	return JSON.stringify(value);
}

function getAggregationTooltip(value: unknown): string {
	return JSON.stringify(value, null, 2);
}

function formatResult(): string {
	const r = currentResult.value;
	if (r === undefined) return 'undefined';
	if (r === null) return 'null';
	if (typeof r === 'string') return `"${r}"`;
	if (typeof r === 'number' || typeof r === 'boolean') return String(r);
	if (Array.isArray(r)) {
		if (r.length === 0) return '[]';
		if (r.length <= 5 && r.every(item => typeof item !== 'object')) {
			return `[${r.join(', ')}]`;
		}
		return `[${r.length} items]`;
	}
	if (typeof r === 'object') {
		const entries = Object.entries(r);
		if (entries.length === 0) return '{}';
		if (entries.length <= 4) {
			return entries.map(([key, val]) => {
				if (Array.isArray(val)) return `${key}: ${val.length}`;
				return `${key}: 1`;
			}).join(', ');
		}
		return `{${entries.length} keys}`;
	}
	return String(r);
}

function formatArgs(step: PipelineStep): string {
	if (step.args.length === 0) return '';
	return step.args
		.map((arg) => {
			if (typeof arg === 'function') {
				const fnStr = arg.toString();
				const match = fnStr.match(/^(?:function\s*)?\(?\s*([^)=]*)\)?\s*=>\s*(.+)$/);
				if (match) {
					const body = match[2].slice(0, 20);
					return `${match[1]} => ${body}${match[2].length > 20 ? '…' : ''}`;
				}
				return 'fn';
			}
			if (typeof arg === 'string') return `"${arg}"`;
			return JSON.stringify(arg)?.slice(0, 15) ?? String(arg);
		})
		.join(', ');
}
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Empty state -->
		<div v-if="steps.length === 0" class="flex-1 flex items-center justify-center p-4">
			<span class="text-sm italic text-zinc-400 dark:text-zinc-500">Run code to see matrix</span>
		</div>

		<!-- Matrix table -->
		<div v-else class="flex-1 overflow-auto p-4">
			<table class="w-full text-sm font-mono border-collapse">
				<!-- Header row with column indices -->
				<thead class="sticky top-0 bg-white dark:bg-zinc-900 z-10">
					<tr>
						<th
							class="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700"
						>
						</th>
						<th
							v-for="i in columnCount"
							:key="i"
							class="px-3 py-3 text-center font-normal text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 min-w-[4rem]"
						>
							[{{ i - 1 }}]
						</th>
						<th
							v-if="hasMoreColumns"
							class="px-3 py-3 text-center text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-700"
						>
							…
						</th>
						<th
							class="px-4 py-3 text-right font-normal text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 w-12"
						>
							#
						</th>
					</tr>
				</thead>

				<!-- Data rows -->
				<tbody>
					<template v-for="(step, rowIndex) in steps" :key="rowIndex">
						<tr
							class="group transition-colors cursor-pointer"
							:class="[
								isStepDimmed(rowIndex)
									? 'opacity-30'
									: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
								expandedRowIndex === rowIndex ? 'bg-primary/5 dark:bg-primary/10' : ''
							]"
							@click="toggleRowExpansion(rowIndex)"
							@mouseenter="emit('highlightLine', rowIndex)"
							@mouseleave="emit('highlightLine', null)"
						>
							<td class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60">
								<a
									v-if="getMethodDocUrl(step.method)"
									:href="getMethodDocUrl(step.method)!"
									class="text-primary font-semibold hover:underline"
									title="View documentation"
									@click.stop
								>
									.{{ step.method }}
								</a>
								<span v-else class="text-primary font-semibold">.{{ step.method }}</span>
								<span class="text-zinc-400 dark:text-zinc-500 ml-0.5">({{ formatArgs(step) }})</span>
							</td>
							<!-- Aggregation: span all columns -->
							<template v-if="getRowData(step, rowIndex).isAggregation">
								<td
									:colspan="columnCount + (hasMoreColumns ? 2 : 1)"
									class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-amber-50/30 dark:bg-amber-900/10"
									:title="getAggregationTooltip(getRowData(step, rowIndex).aggregationValue)"
								>
									<span class="inline-flex items-center gap-2 font-mono text-sm text-amber-700 dark:text-amber-400">
										<span class="text-amber-500 dark:text-amber-500">→</span>
										{{ formatAggregation(getRowData(step, rowIndex).aggregationValue) }}
									</span>
								</td>
							</template>
							<!-- Array: show cells -->
							<template v-else>
								<td
									v-for="(cell, colIndex) in getRowData(step, rowIndex).cells"
									:key="colIndex"
									class="px-3 py-3 text-center border-b border-zinc-100 dark:border-zinc-800/60"
								>
									<MatrixCell :value="cell.value" :status="cell.status" :prev-value="cell.prevValue" />
								</td>
								<td
									v-if="hasMoreColumns"
									class="px-3 py-3 text-center text-zinc-300 dark:text-zinc-600 border-b border-zinc-100 dark:border-zinc-800/60"
								>
									…
								</td>
								<td
									class="px-4 py-3 text-right tabular-nums text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/60"
								>
									{{ step.itemCount }}
								</td>
							</template>
						</tr>
						<!-- Expansion panel -->
						<tr v-if="expandedRowIndex === rowIndex">
							<td :colspan="columnCount + (hasMoreColumns ? 3 : 2)" class="p-0 border-b border-zinc-100 dark:border-zinc-800/60">
								<div class="flex gap-6 p-4 bg-zinc-50/50 dark:bg-zinc-800/30">
									<div class="flex-1 min-w-0">
										<div class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Input ({{ Array.isArray(step.input) ? step.input.length : 1 }} items)</div>
										<pre class="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-auto max-h-40 font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{{ JSON.stringify(step.input, null, 2) }}</pre>
									</div>
									<div class="flex items-center text-zinc-300 dark:text-zinc-600 text-xl">→</div>
									<div class="flex-1 min-w-0">
										<div class="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Output ({{ step.itemCount }} items)</div>
										<pre class="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-auto max-h-40 font-mono text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{{ JSON.stringify(step.output, null, 2) }}</pre>
									</div>
								</div>
							</td>
						</tr>
					</template>
				</tbody>

				<!-- Result row -->
				<tfoot>
					<tr class="bg-emerald-50/50 dark:bg-emerald-900/10">
						<td class="px-4 py-4 font-semibold text-emerald-600 dark:text-emerald-400">Result</td>
						<td
							:colspan="columnCount + (hasMoreColumns ? 2 : 1)"
							class="px-4 py-4 font-mono text-emerald-700 dark:text-emerald-300"
							:title="getAggregationTooltip(currentResult)"
						>
							{{ formatResult() }}
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</template>
