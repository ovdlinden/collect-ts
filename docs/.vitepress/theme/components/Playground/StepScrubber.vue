<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineStep } from './instrumentedCollect';

const props = defineProps<{
	steps: PipelineStep[];
	currentStep: number;
}>();

const emit = defineEmits<{
	'update:currentStep': [step: number];
}>();

const maxStep = computed(() => props.steps.length - 1);

function formatMethodName(step: PipelineStep): string {
	return `.${step.method}()`;
}
</script>

<template>
	<div v-if="steps.length > 1" class="flex items-center gap-3 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
		<!-- Step indicator -->
		<span class="text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500 min-w-[4rem]">
			Step {{ currentStep + 1 }} / {{ steps.length }}
		</span>

		<!-- Slider -->
		<div class="flex-1 flex items-center gap-2">
			<input
				type="range"
				:min="0"
				:max="maxStep"
				:value="currentStep"
				class="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer
					[&::-webkit-slider-thumb]:appearance-none
					[&::-webkit-slider-thumb]:w-3.5
					[&::-webkit-slider-thumb]:h-3.5
					[&::-webkit-slider-thumb]:bg-primary
					[&::-webkit-slider-thumb]:rounded-full
					[&::-webkit-slider-thumb]:shadow-sm
					[&::-webkit-slider-thumb]:cursor-pointer
					[&::-webkit-slider-thumb]:transition-transform
					[&::-webkit-slider-thumb]:hover:scale-110
					[&::-moz-range-thumb]:w-3.5
					[&::-moz-range-thumb]:h-3.5
					[&::-moz-range-thumb]:bg-primary
					[&::-moz-range-thumb]:rounded-full
					[&::-moz-range-thumb]:border-0
					[&::-moz-range-thumb]:cursor-pointer"
				@input="emit('update:currentStep', Number(($event.target as HTMLInputElement).value))"
			/>
		</div>

		<!-- Current method name -->
		<code class="text-xs font-medium text-primary min-w-[5rem] text-right">
			{{ formatMethodName(steps[currentStep]) }}
		</code>
	</div>
</template>
