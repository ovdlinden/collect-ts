<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, nextTick, provide, watch } from 'vue';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { examples, defaultCode, getExamplesByCategory, type Example } from './examples';
import { collectTypeDefinitions } from './collectTypes';
import { executeWithInstrumentation, type PipelineStep } from './instrumentedCollect';
import PipelineVisualizer from './PipelineVisualizer.vue';
import CardFlowView from './CardFlowView.vue';
import StepScrubber from './StepScrubber.vue';

const code = ref(defaultCode);
const output = ref<string>('');
const error = ref<string>('');
const isRunning = ref(false);
const isLoading = ref(true);
const selectedExample = ref<string>(examples[0].name);
const editorRef = ref<HTMLDivElement>();
const autoRun = ref(true);
const executionTime = ref<number | null>(null);
const copied = ref(false);
const activeTab = ref<'output' | 'pipeline' | 'flow'>('flow');
const pipelineSteps = ref<PipelineStep[]>([]);
const pipelineResult = ref<unknown>(null);
const currentStepIndex = ref(0);

provide('currentStepIndex', currentStepIndex);

watch(pipelineSteps, (steps) => {
	if (steps.length > 0) {
		currentStepIndex.value = steps.length - 1;
	} else {
		currentStepIndex.value = 0;
	}
});

let monaco: typeof Monaco | null = null;
let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
let runTimeout: ReturnType<typeof setTimeout> | null = null;

const examplesByCategory = computed(() => getExamplesByCategory());

onMounted(async () => {
	const hash = window.location.hash.slice(1);
	if (hash) {
		try {
			code.value = decodeURIComponent(atob(hash));
			selectedExample.value = '';
		} catch {
			// Invalid hash
		}
	}
	await nextTick();
	await initMonaco();
	runCode();
});

onUnmounted(() => {
	editor?.dispose();
});

async function initMonaco() {
	if (!editorRef.value) return;

	try {
		monaco = await loader.init();

		// Configure TypeScript compiler options
		monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ESNext,
			allowNonTsExtensions: true,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.ESNext,
			noEmit: true,
			strict: false,
			esModuleInterop: true,
			skipLibCheck: true,
			allowJs: true,
		});

		// Enable diagnostics for IntelliSense
		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false,
		});

		// Add collect-ts type definitions with JSDoc
		monaco.languages.typescript.typescriptDefaults.addExtraLib(
			collectTypeDefinitions,
			'file:///node_modules/@types/collect-ts/index.d.ts'
		);

		// Create editor
		editor = monaco.editor.create(editorRef.value, {
			value: code.value,
			language: 'typescript',
			theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
			minimap: { enabled: false },
			fontSize: 14,
			lineHeight: 24,
			fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
			fontLigatures: true,
			lineNumbers: 'on',
			scrollBeyondLastLine: false,
			automaticLayout: true,
			tabSize: 2,
			padding: { top: 20, bottom: 20 },
			wordWrap: 'on',
			quickSuggestions: true,
			suggestOnTriggerCharacters: true,
			parameterHints: { enabled: true },
			hover: { enabled: true },
			folding: false,
			renderLineHighlight: 'none',
			cursorBlinking: 'smooth',
			smoothScrolling: true,
			lineNumbersMinChars: 3,
			glyphMargin: true,
			lineDecorationsWidth: 16,
			overviewRulerBorder: false,
			scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
		});

		editor.onDidChangeModelContent(() => {
			code.value = editor?.getValue() ?? '';
			if (autoRun.value) debouncedRun();
		});

		const observer = new MutationObserver(() => {
			monaco?.editor.setTheme(document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs');
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		isLoading.value = false;
	} catch (e) {
		console.error('Failed to load Monaco:', e);
		error.value = 'Failed to load editor. Please refresh the page.';
		isLoading.value = false;
	}
}

function debouncedRun() {
	if (runTimeout) clearTimeout(runTimeout);
	runTimeout = setTimeout(runCode, 150);
}

async function runCode() {
	if (isLoading.value) return;

	isRunning.value = true;
	error.value = '';
	output.value = '';
	executionTime.value = null;
	pipelineSteps.value = [];
	pipelineResult.value = null;

	const startTime = performance.now();

	try {
		const { collect } = await import('../../../../../src/index.js');

		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (...args) => logs.push(args.map((a) => formatValue(a)).join(' '));

		try {
			const instrumented = executeWithInstrumentation(code.value, collect);
			console.log = originalLog;

			pipelineSteps.value = instrumented.steps;
			pipelineResult.value = instrumented.result;

			let outputStr = logs.length > 0 ? logs.join('\n') + '\n\n' : '';
			outputStr += formatValue(instrumented.result);
			output.value = outputStr;
			executionTime.value = Math.round((performance.now() - startTime) * 10) / 10;
		} catch (e: any) {
			console.log = originalLog;
			if (e.message === 'dd() called' && logs.length > 0) {
				output.value = 'dd() output:\n\n' + logs.join('\n');
			} else if (logs.length > 0) {
				output.value = logs.join('\n');
				error.value = e.message || String(e);
			} else {
				error.value = e.message || String(e);
			}
			pipelineSteps.value = [];
			pipelineResult.value = null;
		}
	} catch (e: any) {
		error.value = e.message || String(e);
		pipelineSteps.value = [];
		pipelineResult.value = null;
	} finally {
		isRunning.value = false;
	}
}

function formatValue(value: any, indent = 0): string {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) {
		if (value.length === 0) return '[]';
		const items = value.map((v) => formatValue(v, indent + 2));
		if (items.join(', ').length < 60 && !items.some((i) => i.includes('\n'))) {
			return `[${items.join(', ')}]`;
		}
		const pad = ' '.repeat(indent + 2);
		return `[\n${items.map((i) => pad + i).join(',\n')}\n${' '.repeat(indent)}]`;
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value);
		if (entries.length === 0) return '{}';
		const items = entries.map(([k, v]) => `${k}: ${formatValue(v, indent + 2)}`);
		if (items.join(', ').length < 60 && !items.some((i) => i.includes('\n'))) {
			return `{ ${items.join(', ')} }`;
		}
		const pad = ' '.repeat(indent + 2);
		return `{\n${items.map((i) => pad + i).join(',\n')}\n${' '.repeat(indent)}}`;
	}
	return String(value);
}

function selectExample(example: Example) {
	selectedExample.value = example.name;
	code.value = example.code;
	editor?.setValue(example.code);
	history.replaceState(null, '', window.location.pathname);
	runCode();
}

function shareCode() {
	const encoded = btoa(encodeURIComponent(code.value));
	navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${encoded}`);
	copied.value = true;
	setTimeout(() => (copied.value = false), 2000);
}

function copyOutput() {
	navigator.clipboard.writeText(output.value || error.value);
	copied.value = true;
	setTimeout(() => (copied.value = false), 2000);
}
</script>

<template>
	<ClientOnly>
		<!-- Container -->
		<div
			class="flex flex-col h-[calc(100vh-200px)] min-h-[500px] rounded-xl bg-white ring-1 ring-zinc-900/10 shadow-xl shadow-zinc-900/5 overflow-hidden dark:bg-zinc-900 dark:ring-white/10 dark:shadow-black/30"
		>
			<!-- Toolbar -->
			<div
				class="flex items-center justify-between gap-4 px-5 py-3.5 bg-zinc-50/50 border-b border-zinc-200/60 dark:bg-zinc-800/40 dark:border-zinc-700/40"
			>
				<!-- Left: Example selector -->
				<select
					:value="selectedExample"
					class="h-8 min-w-[150px] px-2.5 pr-8 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_4px_center] bg-no-repeat cursor-pointer transition-colors hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary dark:text-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:border-zinc-600"
					@change="(e) => {
						const ex = examples.find((ex) => ex.name === (e.target as HTMLSelectElement).value);
						if (ex) selectExample(ex);
					}"
				>
					<option value="" disabled>Select example...</option>
					<optgroup v-for="[category, exs] in examplesByCategory" :key="category" :label="category">
						<option v-for="ex in exs" :key="ex.name" :value="ex.name">{{ ex.name }}</option>
					</optgroup>
				</select>

				<!-- Right: Controls -->
				<div class="flex items-center gap-2">
					<!-- Auto-run toggle -->
					<label class="flex items-center gap-1.5 cursor-pointer select-none group">
						<button
							type="button"
							role="switch"
							:aria-checked="autoRun"
							class="relative w-8 h-[18px] rounded-full transition-colors"
							:class="autoRun ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'"
							@click="autoRun = !autoRun"
						>
							<span
								class="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform"
								:class="autoRun ? 'translate-x-3.5' : 'translate-x-0'"
							/>
						</button>
						<span class="text-xs font-medium text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300">
							Auto
						</span>
					</label>

					<!-- Run button -->
					<button
						:disabled="isRunning || isLoading"
						class="inline-flex items-center gap-1 h-8 px-3 text-sm font-semibold text-white bg-primary rounded-md transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
						@click="runCode"
					>
						<svg v-if="isRunning" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
							<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="opacity-75" />
						</svg>
						<svg v-else class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
							<path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
						</svg>
						<span>Run</span>
					</button>

					<!-- Share button -->
					<button
						class="inline-flex items-center gap-1 h-8 px-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-md transition-colors hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:text-zinc-400 dark:border-zinc-700 dark:hover:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
						@click="shareCode"
					>
						<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
							<path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.5 2.5 0 110 .792l6.733 3.367a2.5 2.5 0 11-.67 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.5 2.5 0 0113 4.5z" />
						</svg>
						<span>{{ copied ? 'Copied!' : 'Share' }}</span>
					</button>
				</div>
			</div>

			<!-- Editor + Output (horizontal split) -->
			<div class="flex flex-col flex-1 min-h-0">
				<!-- Code pane (top) -->
				<div class="flex flex-col h-[220px] min-h-[120px] shrink-0 border-b border-zinc-200 dark:border-zinc-700">
					<div class="flex items-center justify-between h-9 px-4 border-b border-zinc-100/80 dark:border-zinc-800/40">
						<span class="text-[11px] font-medium tracking-wider uppercase text-zinc-400 dark:text-zinc-500">Code</span>
					</div>
					<div ref="editorRef" class="relative flex-1 min-h-0">
						<div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900">
							<div class="w-5 h-5 border-2 border-zinc-200 border-t-primary rounded-full animate-spin dark:border-zinc-700" />
						</div>
					</div>
				</div>

				<!-- Output pane (bottom) -->
				<div class="flex flex-col flex-1 min-h-0">
					<!-- Tabs header -->
					<div class="flex items-center justify-between h-9 px-4 border-b border-zinc-100/80 dark:border-zinc-800/40">
						<div class="flex items-center gap-1">
							<button
								type="button"
								class="px-2 py-1 text-[11px] font-medium tracking-wider uppercase rounded transition-colors"
								:class="activeTab === 'output'
									? 'text-primary bg-primary/10'
									: 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'"
								@click="activeTab = 'output'"
							>
								Output
							</button>
							<button
								type="button"
								class="px-2 py-1 text-[11px] font-medium tracking-wider uppercase rounded transition-colors"
								:class="activeTab === 'flow'
									? 'text-primary bg-primary/10'
									: 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'"
								@click="activeTab = 'flow'"
							>
								Flow
								<span
									v-if="pipelineSteps.length > 0"
									class="ml-1 px-1 py-px text-[9px] rounded bg-zinc-200 dark:bg-zinc-700"
								>
									{{ pipelineSteps.length }}
								</span>
							</button>
							<button
								type="button"
								class="px-2 py-1 text-[11px] font-medium tracking-wider uppercase rounded transition-colors"
								:class="activeTab === 'pipeline'
									? 'text-primary bg-primary/10'
									: 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'"
								@click="activeTab = 'pipeline'"
							>
								Pipeline
							</button>
							<span
								v-if="executionTime !== null && activeTab === 'output'"
								class="ml-2 text-[10px] font-medium tabular-nums text-zinc-400 dark:text-zinc-500"
							>
								{{ executionTime }}ms
							</span>
						</div>
						<button
							v-if="activeTab === 'output'"
							class="flex items-center justify-center w-6 h-6 text-zinc-400 rounded hover:text-zinc-600 hover:bg-zinc-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
							title="Copy output"
							@click="copyOutput"
						>
							<svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
								<path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
								<path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
							</svg>
						</button>
					</div>

					<!-- Output view -->
					<div v-if="activeTab === 'output'" class="flex-1 p-4 overflow-auto bg-white dark:bg-zinc-900">
						<div
							v-if="error"
							class="p-2.5 text-[13px] font-mono text-red-600 bg-red-50 rounded-md dark:text-red-400 dark:bg-red-950/30"
						>
							{{ error }}
						</div>
						<pre
							v-else-if="output"
							class="text-[13px] leading-relaxed font-mono text-zinc-700 whitespace-pre-wrap break-words dark:text-zinc-300"
						>{{ output }}</pre>
						<span v-else class="text-sm italic text-zinc-400 dark:text-zinc-500">
							Run code to see output
						</span>
					</div>

					<!-- Flow view -->
					<CardFlowView
						v-else-if="activeTab === 'flow'"
						:steps="pipelineSteps"
						:result="pipelineResult"
						class="flex-1 overflow-hidden bg-white dark:bg-zinc-900"
					/>

					<!-- Pipeline view -->
					<PipelineVisualizer
						v-else-if="activeTab === 'pipeline'"
						:steps="pipelineSteps"
						:result="pipelineResult"
						class="flex-1 overflow-hidden bg-white dark:bg-zinc-900"
					/>

					<!-- Step scrubber -->
					<StepScrubber
						:steps="pipelineSteps"
						:current-step="currentStepIndex"
						@update:current-step="currentStepIndex = $event"
					/>
				</div>
			</div>
		</div>

		<!-- Fallback skeleton -->
		<template #fallback>
			<div class="h-[480px] rounded-xl bg-zinc-100 animate-pulse dark:bg-zinc-800" />
		</template>
	</ClientOnly>
</template>
