<script setup lang="ts">
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
	step: PipelineStep;
	isFirst?: boolean;
	isLast?: boolean;
	isSelected?: boolean;
	isDimmed?: boolean;
}>();

const emit = defineEmits<{
	select: [step: PipelineStep];
}>();

const maxMarbles = 8;

function getMarbles(): { value: unknown; index: number }[] {
	const output = props.step.output;
	if (!Array.isArray(output)) return [];
	return output.slice(0, maxMarbles).map((value, index) => ({ value, index }));
}

function hasMore(): boolean {
	const output = props.step.output;
	return Array.isArray(output) && output.length > maxMarbles;
}

function getExtraCount(): number {
	const output = props.step.output;
	return Array.isArray(output) ? output.length - maxMarbles : 0;
}

function isTerminal(): boolean {
	return !Array.isArray(props.step.output);
}

function formatTerminalValue(): string {
	const output = props.step.output;
	if (output === undefined) return 'undefined';
	if (output === null) return 'null';
	if (typeof output === 'string') return `"${output}"`;
	if (typeof output === 'number' || typeof output === 'boolean') return String(output);
	if (Array.isArray(output)) return `[${output.length}]`;
	return JSON.stringify(output).slice(0, 20);
}

function formatArgs(): string {
	if (props.step.args.length === 0) return '';
	return props.step.args
		.map((arg) => {
			if (typeof arg === 'function') {
				const fnStr = arg.toString();
				const match = fnStr.match(/^(?:function\s*)?\(?\s*([^)=]*)\)?\s*=>\s*(.+)$/);
				if (match) return `${match[1]} => ${match[2].slice(0, 30)}`;
				return 'fn';
			}
			if (typeof arg === 'string') return `"${arg}"`;
			return JSON.stringify(arg)?.slice(0, 20) ?? String(arg);
		})
		.join(', ');
}
</script>

<template>
	<div class="flex flex-col items-center transition-opacity" :class="{ 'opacity-30': isDimmed }">
		<!-- Arrow from previous (vertical) -->
		<svg
			v-if="!isFirst"
			class="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 my-1"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
				clip-rule="evenodd"
			/>
		</svg>

		<!-- Step card -->
		<button
			type="button"
			class="group relative flex items-center gap-3 w-full px-3 py-2 rounded-lg border transition-all duration-150"
			:class="[
				isSelected
					? 'bg-primary/5 border-primary/50 ring-2 ring-primary/20 dark:bg-primary/10'
					: 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-600',
			]"
			@click="emit('select', step)"
		>
			<!-- Method name -->
			<code
				class="text-xs font-semibold flex-1 text-left"
				:class="isSelected ? 'text-primary' : 'text-zinc-700 dark:text-zinc-200'"
			>
				.{{ step.method }}(<span class="font-normal text-zinc-500 dark:text-zinc-400">{{ formatArgs() }}</span
				>)
			</code>

			<!-- Marbles or terminal value -->
			<div v-if="isTerminal()" class="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 rounded">
				<span class="text-xs font-mono text-emerald-600 dark:text-emerald-400">
					{{ formatTerminalValue() }}
				</span>
			</div>
			<div v-else class="flex items-center gap-0.5">
				<span
					v-for="marble in getMarbles()"
					:key="marble.index"
					class="w-2 h-2 rounded-full bg-gradient-to-br from-primary/80 to-primary shadow-sm"
				/>
				<span v-if="hasMore()" class="text-[10px] text-zinc-400 dark:text-zinc-500 ml-0.5">
					+{{ getExtraCount() }}
				</span>
				<span class="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
					{{ step.itemCount }}
				</span>
			</div>
		</button>
	</div>
</template>
