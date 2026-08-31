<script setup lang="ts">
import { ref, computed, inject, watch, type Ref } from 'vue';
import type { PipelineStep } from './instrumentedCollect';
import PipelineStepComponent from './PipelineStep.vue';

const props = defineProps<{
	steps: PipelineStep[];
	result: unknown;
}>();

const emit = defineEmits<{
	selectStep: [step: PipelineStep | null];
}>();

const currentStepIndex = inject<Ref<number>>('currentStepIndex');
const selectedStepIndex = ref<number | null>(null);

watch(() => currentStepIndex?.value, (newIndex) => {
	if (newIndex !== undefined) {
		selectedStepIndex.value = newIndex;
	}
});

function isStepDimmed(stepIndex: number): boolean {
	if (currentStepIndex?.value === undefined) return false;
	return stepIndex > currentStepIndex.value;
}

const selectedStep = computed(() => {
	if (selectedStepIndex.value === null) return null;
	return props.steps[selectedStepIndex.value] ?? null;
});

function selectStep(step: PipelineStep) {
	const index = props.steps.indexOf(step);
	if (selectedStepIndex.value === index) {
		selectedStepIndex.value = null;
		emit('selectStep', null);
	} else {
		selectedStepIndex.value = index;
		emit('selectStep', step);
	}
}

function formatResult(): string {
	const r = props.result;
	if (r === undefined) return 'undefined';
	if (r === null) return 'null';
	if (typeof r === 'string') return JSON.stringify(r);
	if (typeof r === 'number' || typeof r === 'boolean') return String(r);
	if (Array.isArray(r)) {
		if (r.length <= 3) return JSON.stringify(r);
		return `[${r.slice(0, 3).map((v) => JSON.stringify(v)).join(', ')}, ...]`;
	}
	const str = JSON.stringify(r);
	return str.length > 40 ? str.slice(0, 40) + '...' : str;
}
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Pipeline header -->
		<div class="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
			<span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
				Pipeline
			</span>
			<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
				{{ steps.length }} {{ steps.length === 1 ? 'step' : 'steps' }}
			</span>
		</div>

		<!-- Empty state -->
		<div v-if="steps.length === 0" class="flex-1 flex items-center justify-center p-4">
			<span class="text-sm italic text-zinc-400 dark:text-zinc-500"> Run code to see pipeline </span>
		</div>

		<!-- Pipeline visualization (vertical stack) -->
		<div v-else class="flex-1 overflow-y-auto overflow-x-hidden">
			<div class="flex flex-col p-4 gap-0">
				<!-- Steps -->
				<PipelineStepComponent
					v-for="(step, index) in steps"
					:key="index"
					:step="step"
					:is-first="index === 0"
					:is-last="index === steps.length - 1"
					:is-selected="selectedStepIndex === index"
					:is-dimmed="isStepDimmed(index)"
					@select="selectStep"
				/>

				<!-- Final result arrow -->
				<svg
					v-if="steps.length > 0"
					class="w-4 h-4 shrink-0 text-zinc-300 dark:text-zinc-600 my-1 mx-auto"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
						clip-rule="evenodd"
					/>
				</svg>

				<!-- Result card -->
				<div
					class="flex items-center justify-between gap-3 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-800/40"
				>
					<span class="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70">
						Result
					</span>
					<code class="text-xs font-mono text-emerald-700 dark:text-emerald-300 truncate max-w-[200px]">
						{{ formatResult() }}
					</code>
				</div>
			</div>
		</div>

		<!-- Selected step detail -->
		<div
			v-if="selectedStep"
			class="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 shrink-0"
		>
			<div class="p-3">
				<div class="flex items-center justify-between mb-2">
					<div class="flex items-center gap-2">
						<code class="text-sm font-semibold text-primary">.{{ selectedStep.method }}()</code>
						<span class="text-[10px] text-zinc-400">{{ selectedStep.duration }}ms</span>
					</div>
					<button
						type="button"
						class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
						@click="selectedStepIndex = null"
					>
						<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
							<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
						</svg>
					</button>
				</div>
				<div class="flex gap-2 text-xs">
					<!-- Input -->
					<div class="flex-1 min-w-0">
						<span class="block mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
							In ({{ Array.isArray(selectedStep.input) ? selectedStep.input.length : 1 }})
						</span>
						<pre
							class="p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 overflow-auto max-h-20 font-mono text-[11px] text-zinc-600 dark:text-zinc-300"
						>{{ JSON.stringify(selectedStep.input, null, 2) }}</pre>
					</div>
					<!-- Arrow -->
					<div class="flex items-center text-zinc-300 dark:text-zinc-600">
						<svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
						</svg>
					</div>
					<!-- Output -->
					<div class="flex-1 min-w-0">
						<span class="block mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
							Out ({{ selectedStep.itemCount }})
						</span>
						<pre
							class="p-2 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700 overflow-auto max-h-20 font-mono text-[11px] text-zinc-600 dark:text-zinc-300"
						>{{ JSON.stringify(selectedStep.output, null, 2) }}</pre>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
