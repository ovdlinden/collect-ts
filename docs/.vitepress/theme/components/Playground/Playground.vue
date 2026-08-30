<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { examples, defaultCode, getExamplesByCategory, type Example } from './examples';

const code = ref(defaultCode);
const output = ref<string>('');
const error = ref<string>('');
const isRunning = ref(false);
const isLoading = ref(true);
const selectedExample = ref<string>(examples[0].name);
const editorRef = ref<HTMLDivElement>();
const autoRun = ref(true);

let editor: any = null;
let monaco: any = null;
let runTimeout: ReturnType<typeof setTimeout> | null = null;

const examplesByCategory = computed(() => getExamplesByCategory());

onMounted(async () => {
	// Load code from URL hash
	const hash = window.location.hash.slice(1);
	if (hash) {
		try {
			code.value = decodeURIComponent(atob(hash));
			selectedExample.value = '';
		} catch {
			// Invalid hash, use default
		}
	}

	await initMonaco();
	runCode();
});

onUnmounted(() => {
	if (editor) {
		editor.dispose();
	}
});

async function initMonaco() {
	if (!editorRef.value) return;

	try {
		// Use the loader to properly initialize Monaco
		const loader = await import('@monaco-editor/loader');
		monaco = await loader.default.init();

		// Configure TypeScript
		monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			target: monaco.languages.typescript.ScriptTarget.ESNext,
			moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
			module: monaco.languages.typescript.ModuleKind.ESNext,
			strict: true,
			esModuleInterop: true,
			skipLibCheck: true,
			lib: ['esnext', 'dom'],
		});

		// Add collect-ts type definitions
		monaco.languages.typescript.typescriptDefaults.addExtraLib(
			`
declare function collect<T>(items?: T[] | Record<string, T>): Collection<T>;

interface Collection<T> {
  all(): T[];
  avg(key?: string | ((item: T) => number)): number;
  chunk(size: number): Collection<Collection<T>>;
  collapse(): Collection<T>;
  concat(...items: (T | T[])[]): Collection<T>;
  contains(key: string | T | ((item: T) => boolean), value?: any): boolean;
  count(): number;
  countBy(key?: string | ((item: T) => string)): Collection<number>;
  each(callback: (item: T, key: number) => void | false): Collection<T>;
  every(callback: (item: T) => boolean): boolean;
  filter(callback?: (item: T, key: number) => boolean): Collection<T>;
  first(callback?: (item: T) => boolean, defaultValue?: T): T | undefined;
  flatMap<U>(callback: (item: T) => U[]): Collection<U>;
  flatten(depth?: number): Collection<any>;
  flip(): Collection<T>;
  groupBy(key: string | ((item: T) => string)): Collection<Collection<T>>;
  has(key: string | number): boolean;
  isEmpty(): boolean;
  isNotEmpty(): boolean;
  join(glue?: string, finalGlue?: string): string;
  keyBy(key: string | ((item: T) => string)): Collection<T>;
  keys(): Collection<string>;
  last(callback?: (item: T) => boolean, defaultValue?: T): T | undefined;
  map<U>(callback: (item: T, key: number) => U): Collection<U>;
  max(key?: string | ((item: T) => number)): number;
  merge(...items: (T[] | Record<string, T>)[]): Collection<T>;
  min(key?: string | ((item: T) => number)): number;
  only(keys: string[]): Collection<T>;
  partition(callback: (item: T) => boolean): Collection<Collection<T>>;
  pluck<K extends keyof T>(key: K): Collection<T[K]>;
  pluck(key: string): Collection<any>;
  reduce<U>(callback: (carry: U, item: T, key: number) => U, initial: U): U;
  reject(callback: (item: T) => boolean): Collection<T>;
  reverse(): Collection<T>;
  shuffle(): Collection<T>;
  skip(count: number): Collection<T>;
  slice(start: number, length?: number): Collection<T>;
  some(callback: (item: T) => boolean): boolean;
  sort(callback?: (a: T, b: T) => number): Collection<T>;
  sortBy(key: string | ((item: T) => any)): Collection<T>;
  sortByDesc(key: string | ((item: T) => any)): Collection<T>;
  sum(key?: string | ((item: T) => number)): number;
  take(count: number): Collection<T>;
  tap(callback: (collection: Collection<T>) => void): Collection<T>;
  toArray(): T[];
  toJson(): string;
  unique(key?: string | ((item: T) => any)): Collection<T>;
  values(): Collection<T>;
  when(condition: boolean, callback: (c: Collection<T>) => Collection<T>): Collection<T>;
  where(key: string, value: any): Collection<T>;
  where(key: string, operator: string, value: any): Collection<T>;
  whereIn(key: string, values: any[]): Collection<T>;
  whereNotIn(key: string, values: any[]): Collection<T>;
  whereBetween(key: string, values: [any, any]): Collection<T>;
  whereNull(key: string): Collection<T>;
  whereNotNull(key: string): Collection<T>;
}
`,
			'collect-ts.d.ts'
		);

		// Create editor
		editor = monaco.editor.create(editorRef.value, {
			value: code.value,
			language: 'typescript',
			theme: document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs',
			minimap: { enabled: false },
			fontSize: 14,
			lineNumbers: 'on',
			scrollBeyondLastLine: false,
			automaticLayout: true,
			tabSize: 2,
			padding: { top: 16, bottom: 16 },
			wordWrap: 'on',
		});

		// Listen for changes
		editor.onDidChangeModelContent(() => {
			code.value = editor.getValue();
			if (autoRun.value) {
				debouncedRun();
			}
		});

		// Watch for theme changes
		const observer = new MutationObserver(() => {
			const isDark = document.documentElement.classList.contains('dark');
			monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
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
	runTimeout = setTimeout(runCode, 500);
}

async function runCode() {
	if (isLoading.value) return;

	isRunning.value = true;
	error.value = '';
	output.value = '';

	try {
		// Dynamically import collect-ts
		const { collect } = await import('../../../../../src/index.js');

		// Create a sandboxed function
		const fn = new Function('collect', `
			"use strict";
			${code.value}
		`);

		// Capture console.log
		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (...args) => {
			logs.push(args.map(a => formatValue(a)).join(' '));
		};

		try {
			const result = fn(collect);
			console.log = originalLog;

			let outputStr = '';
			if (logs.length > 0) {
				outputStr += logs.join('\n') + '\n\n';
			}
			outputStr += formatValue(result);
			output.value = outputStr;
		} catch (e) {
			console.log = originalLog;
			throw e;
		}
	} catch (e: any) {
		error.value = e.message || String(e);
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
		const items = value.map(v => formatValue(v, indent + 2));
		if (items.join(', ').length < 60 && !items.some(i => i.includes('\n'))) {
			return `[${items.join(', ')}]`;
		}
		const pad = ' '.repeat(indent + 2);
		return `[\n${items.map(i => pad + i).join(',\n')}\n${' '.repeat(indent)}]`;
	}
	if (typeof value === 'object') {
		const entries = Object.entries(value);
		if (entries.length === 0) return '{}';
		const items = entries.map(([k, v]) => `${k}: ${formatValue(v, indent + 2)}`);
		if (items.join(', ').length < 60 && !items.some(i => i.includes('\n'))) {
			return `{ ${items.join(', ')} }`;
		}
		const pad = ' '.repeat(indent + 2);
		return `{\n${items.map(i => pad + i).join(',\n')}\n${' '.repeat(indent)}}`;
	}
	return String(value);
}

function selectExample(example: Example) {
	selectedExample.value = example.name;
	code.value = example.code;
	if (editor) {
		editor.setValue(example.code);
	}
	// Clear URL hash when selecting example
	history.replaceState(null, '', window.location.pathname);
	runCode();
}

function shareCode() {
	const encoded = btoa(encodeURIComponent(code.value));
	const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
	navigator.clipboard.writeText(url);
	alert('Link copied to clipboard!');
}

function copyOutput() {
	navigator.clipboard.writeText(output.value || error.value);
}
</script>

<template>
	<ClientOnly>
		<div class="playground">
			<header class="playground-header">
				<div class="header-left">
					<select
						class="example-select"
						:value="selectedExample"
						@change="(e) => {
							const name = (e.target as HTMLSelectElement).value;
							const ex = examples.find(ex => ex.name === name);
							if (ex) selectExample(ex);
						}"
					>
						<option value="" disabled>Select an example...</option>
						<optgroup v-for="[category, exs] in examplesByCategory" :key="category" :label="category">
							<option v-for="ex in exs" :key="ex.name" :value="ex.name">
								{{ ex.name }}
							</option>
						</optgroup>
					</select>
				</div>
				<div class="header-right">
					<label class="auto-run">
						<input type="checkbox" v-model="autoRun" />
						Auto-run
					</label>
					<button class="btn" @click="runCode" :disabled="isRunning || isLoading">
						{{ isRunning ? 'Running...' : '▶ Run' }}
					</button>
					<button class="btn btn-secondary" @click="shareCode">
						Share
					</button>
				</div>
			</header>

			<div class="playground-content">
				<div class="editor-pane">
					<div class="pane-header">
						<span>TypeScript</span>
					</div>
					<div ref="editorRef" class="editor">
						<div v-if="isLoading" class="editor-loading">
							Loading editor...
						</div>
					</div>
				</div>

				<div class="output-pane">
					<div class="pane-header">
						<span>Output</span>
						<button class="copy-btn" @click="copyOutput" title="Copy output">
							📋
						</button>
					</div>
					<div class="output">
						<pre v-if="error" class="error">{{ error }}</pre>
						<pre v-else class="result">{{ output || '// Run code to see output' }}</pre>
					</div>
				</div>
			</div>
		</div>
		<template #fallback>
			<div class="playground-fallback">
				Loading playground...
			</div>
		</template>
	</ClientOnly>
</template>

<style scoped>
.playground {
	display: flex;
	flex-direction: column;
	height: calc(100vh - 200px);
	min-height: 500px;
	max-height: 800px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	overflow: hidden;
	background: var(--vp-c-bg);
}

.playground-fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 500px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-2);
}

.playground-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	background: var(--vp-c-bg-soft);
	border-bottom: 1px solid var(--vp-c-divider);
	gap: 12px;
	flex-wrap: wrap;
}

.header-left {
	display: flex;
	gap: 12px;
	align-items: center;
}

.header-right {
	display: flex;
	gap: 8px;
	align-items: center;
}

.example-select {
	padding: 6px 12px;
	border: 1px solid var(--vp-c-divider);
	border-radius: 6px;
	background: var(--vp-c-bg);
	color: var(--vp-c-text-1);
	font-size: 14px;
	min-width: 200px;
}

.auto-run {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 13px;
	color: var(--vp-c-text-2);
	cursor: pointer;
}

.btn {
	padding: 6px 14px;
	border: none;
	border-radius: 6px;
	background: var(--vp-c-brand-1);
	color: white;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: opacity 0.2s;
}

.btn:hover {
	opacity: 0.9;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.btn-secondary {
	background: var(--vp-c-default-soft);
	color: var(--vp-c-text-1);
}

.playground-content {
	display: flex;
	flex: 1;
	min-height: 0;
}

.editor-pane,
.output-pane {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.editor-pane {
	border-right: 1px solid var(--vp-c-divider);
}

.pane-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 16px;
	background: var(--vp-c-bg-soft);
	border-bottom: 1px solid var(--vp-c-divider);
	font-size: 12px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--vp-c-text-2);
}

.copy-btn {
	background: none;
	border: none;
	cursor: pointer;
	font-size: 14px;
	opacity: 0.6;
	transition: opacity 0.2s;
}

.copy-btn:hover {
	opacity: 1;
}

.editor {
	flex: 1;
	min-height: 300px;
	position: relative;
}

.editor-loading {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--vp-c-bg);
	color: var(--vp-c-text-2);
}

.output {
	flex: 1;
	padding: 16px;
	overflow: auto;
	background: var(--vp-c-bg);
}

.output pre {
	margin: 0;
	font-family: var(--vp-font-family-mono);
	font-size: 13px;
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: break-word;
}

.output .result {
	color: var(--vp-c-text-1);
}

.output .error {
	color: var(--vp-c-danger-1);
}

@media (max-width: 768px) {
	.playground {
		height: auto;
		max-height: none;
	}

	.playground-content {
		flex-direction: column;
	}

	.editor-pane {
		border-right: none;
		border-bottom: 1px solid var(--vp-c-divider);
	}

	.editor {
		min-height: 250px;
	}

	.output {
		min-height: 200px;
	}
}
</style>
