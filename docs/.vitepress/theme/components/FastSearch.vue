<script setup lang="ts">
import MiniSearch, { type SearchResult as MiniSearchResult } from 'minisearch';
import { collect } from '../../../../src/Collection';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vitepress';

interface SearchEntry {
	id: string;
	title: string;
	titles: string[];
	text: string;
	signature?: string;
}

interface ProcessedResult extends SearchEntry {
	highlightedTitle: string;
	breadcrumb: string;
	snippet: string;
}

const props = defineProps<{
	visible: boolean;
}>();

const emit = defineEmits<{
	close: [];
}>();

const query = ref('');
const dialogRef = ref<HTMLDialogElement>();
const inputRef = ref<HTMLInputElement>();
const listRef = ref<HTMLUListElement>();
const selectedIndex = ref(0);
const miniSearch = ref<MiniSearch<SearchEntry> | null>(null);
const isLoading = ref(true);
const announceText = ref('');

const router = useRouter();

// Load pre-built MiniSearch index
onMounted(async () => {
	try {
		const indexData = await import('../data/search-index.json');
		miniSearch.value = MiniSearch.loadJSON<SearchEntry>(JSON.stringify(indexData.default), {
			idField: '_id',
			fields: ['title', 'text', 'signature'],
			storeFields: ['id', 'title', 'titles', 'text', 'signature'],
		});
	} catch {
		console.warn('Search index not found');
	}
	isLoading.value = false;
});


// Open/close dialog when visible prop changes
watch(
	() => props.visible,
	(visible) => {
		if (visible) {
			dialogRef.value?.showModal();
			selectedIndex.value = 0;
			nextTick(() => {
				inputRef.value?.focus();
				inputRef.value?.select();
				announceText.value = query.value
					? 'Search dialog opened with previous search.'
					: 'Search dialog opened. Type to search methods.';
			});
		} else {
			dialogRef.value?.close();
		}
	},
);

// Handle native dialog close event (ESC key, etc.)
function handleDialogClose() {
	emit('close');
}

// Handle backdrop click (click on ::backdrop)
function handleDialogClick(e: MouseEvent) {
	if (e.target === dialogRef.value) {
		emit('close');
	}
}

// Search using MiniSearch with collect-ts post-processing
const results = computed<ProcessedResult[]>(() => {
	const q = query.value.trim();
	if (!miniSearch.value || !q || q.length < 2) return [];

	const searchOpts = { fuzzy: 0.15, prefix: true };

	const raw = miniSearch.value.search(q, searchOpts) as (MiniSearchResult & SearchEntry)[];

	// Use collect-ts lazy evaluation for post-processing
	return collect(raw)
		.lazy()
		.take(12)
		.map((item) => ({
			id: item.id,
			title: item.title,
			titles: item.titles,
			text: item.text,
			signature: item.signature,
			highlightedTitle: highlightTerms(item.title, q.split(/\s+/)),
			breadcrumb: item.titles.slice(0, -1).join(' › '),
			snippet: getSnippet(item.text, q),
		}))
		.all();
});

function getSnippet(text: string, query: string): string {
	// Clean up markdown artifacts from text
	const cleanText = text
		.replace(/\/collections\/\w+#\w+/g, '') // Remove internal links
		.replace(/\s+/g, ' ') // Normalize whitespace
		.replace(/[→←↑↓]/g, '') // Remove arrows
		.replace(/---/g, '') // Remove separators
		.trim();

	// Find the first matching term
	const terms = query.toLowerCase().split(/\s+/);
	const lowerText = cleanText.toLowerCase();
	let idx = -1;
	for (const term of terms) {
		idx = lowerText.indexOf(term);
		if (idx !== -1) break;
	}
	if (idx === -1) return '';

	// Extract ~60 chars around the match
	const start = Math.max(0, idx - 30);
	const end = Math.min(cleanText.length, idx + 50);
	let snippet = cleanText.slice(start, end).trim();

	if (start > 0) snippet = '...' + snippet;
	if (end < cleanText.length) snippet = snippet + '...';

	return highlightTerms(snippet, terms);
}


// Announce result count for screen readers
watch(
	() => results.value.length,
	(count) => {
		if (query.value.length >= 2) {
			announceText.value = count > 0 ? `${count} results found. Use arrow keys to navigate.` : 'No results found.';
		}
	},
);

function highlightTerms(text: string, terms: string[]): string {
	let result = text;
	for (const term of terms) {
		if (term.length < 2) continue;
		const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
		result = result.replace(regex, '<mark>$1</mark>');
	}
	return result;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function navigate(result: ProcessedResult) {
	router.go(result.id);
	emit('close');
}

function scrollSelectedIntoView() {
	nextTick(() => {
		const selectedEl = listRef.value?.querySelector('[aria-selected="true"]');
		selectedEl?.scrollIntoView({ block: 'nearest' });
	});
}

function handleKeydown(e: KeyboardEvent) {
	switch (e.key) {
		case 'ArrowDown':
			e.preventDefault();
			selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1);
			scrollSelectedIntoView();
			break;
		case 'ArrowUp':
			e.preventDefault();
			selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
			scrollSelectedIntoView();
			break;
		case 'Enter':
			e.preventDefault();
			if (results.value[selectedIndex.value]) {
				navigate(results.value[selectedIndex.value]);
			}
			break;
		case 'Home':
			if (results.value.length > 0) {
				e.preventDefault();
				selectedIndex.value = 0;
				scrollSelectedIntoView();
			}
			break;
		case 'End':
			if (results.value.length > 0) {
				e.preventDefault();
				selectedIndex.value = results.value.length - 1;
				scrollSelectedIntoView();
			}
			break;
	}
}

function getResultId(index: number): string {
	return `search-result-${index}`;
}
</script>

<template>
	<Teleport to="body">
		<dialog
			ref="dialogRef"
			class="fast-search-dialog"
			aria-labelledby="search-title"
			@close="handleDialogClose"
			@click="handleDialogClick"
			@keydown="handleKeydown"
		>
			<div class="flex flex-col overflow-hidden rounded-xl shadow-2xl bg-(--vp-c-bg) w-[min(600px,90vw)] max-h-[70vh]">
				<h2 id="search-title" class="sr-only">Search documentation</h2>

				<!-- Live region for screen reader announcements -->
				<div aria-live="polite" aria-atomic="true" class="sr-only">
					{{ announceText }}
				</div>

				<div class="flex items-center gap-3 p-4 border-b border-(--vp-c-divider)">
					<svg
						class="w-5 h-5 shrink-0 text-(--vp-c-text-3)"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
					<input
						ref="inputRef"
						v-model="query"
						type="search"
						placeholder="Search methods..."
						class="fast-search-input flex-1 border-none bg-transparent text-base outline-none text-(--vp-c-text-1) placeholder:text-(--vp-c-text-3)"
						autocomplete="off"
						aria-label="Search documentation"
						aria-controls="search-results"
						aria-expanded="true"
						:aria-activedescendant="results.length > 0 ? getResultId(selectedIndex) : undefined"
					/>
					<kbd class="text-xs px-1.5 py-0.5 rounded border font-[inherit] bg-(--vp-c-bg-soft) text-(--vp-c-text-3) border-(--vp-c-divider)" aria-hidden="true">ESC</kbd>
				</div>

				<div v-if="isLoading" class="p-8 text-center text-(--vp-c-text-3)" role="status">
					<span class="sr-only">Loading</span>
					Loading search index...
				</div>

				<ul
					v-else-if="results.length > 0"
					id="search-results"
					ref="listRef"
					class="overflow-y-auto max-h-[400px] list-none m-0 p-0"
					role="listbox"
					aria-label="Search results"
				>
					<li
						v-for="(result, i) in results"
						:id="getResultId(i)"
						:key="result.id"
						role="option"
						:aria-selected="i === selectedIndex"
						class="fast-search-result flex flex-col w-full py-3 px-4 text-left bg-transparent cursor-pointer border-b border-(--vp-c-divider) last:border-b-0"
						:class="{ selected: i === selectedIndex }"
						@click="navigate(result)"
						@mouseenter="selectedIndex = i"
					>
						<span v-if="result.breadcrumb" class="text-xs mb-0.5 text-(--vp-c-text-3)" aria-hidden="true">
							{{ result.breadcrumb }}
						</span>
						<span class="fast-search-result-title text-sm text-(--vp-c-text-1)" v-html="result.highlightedTitle" />
						<span v-if="result.snippet" class="fast-search-result-snippet text-[13px] mt-1.5 leading-relaxed line-clamp-2 text-(--vp-c-text-2)" v-html="result.snippet" />
						<span class="sr-only">
							{{ result.breadcrumb ? `in ${result.breadcrumb}` : '' }}
						</span>
					</li>
				</ul>

				<div v-else-if="query.length >= 2" class="p-8 text-center text-(--vp-c-text-3)" role="status">
					No results for "{{ query }}"
				</div>

				<div v-else class="p-8 text-center text-(--vp-c-text-3)" role="status">Type at least 2 characters to search</div>

				<div class="flex flex-wrap gap-3 py-3 px-4 border-t text-xs border-(--vp-c-divider) text-(--vp-c-text-3)" aria-hidden="true">
					<span><kbd class="text-[11px] px-1 py-px rounded-sm mr-1 border font-[inherit] bg-(--vp-c-bg-soft) border-(--vp-c-divider)">↑↓</kbd> Navigate</span>
					<span><kbd class="text-[11px] px-1 py-px rounded-sm mr-1 border font-[inherit] bg-(--vp-c-bg-soft) border-(--vp-c-divider)">↵</kbd> Select</span>
					<span><kbd class="text-[11px] px-1 py-px rounded-sm mr-1 border font-[inherit] bg-(--vp-c-bg-soft) border-(--vp-c-divider)">Esc</kbd> Close</span>
					<span class="ml-auto">
						Powered by <strong class="text-(--vp-c-brand-1)">collect-ts</strong>
					</span>
				</div>
			</div>
		</dialog>
	</Teleport>
</template>

<style scoped>
/* Dialog positioning and backdrop */
.fast-search-dialog {
	padding: 0;
	border: none;
	background: transparent;
	max-width: none;
	max-height: none;
	overflow: visible;
	margin: 10vh auto auto;
}

.fast-search-dialog::backdrop {
	background: rgba(0, 0, 0, 0.5);
}

/* Animations */
@media (prefers-reduced-motion: no-preference) {
	.fast-search-dialog[open] {
		animation: dialog-fade-in 150ms ease;
	}

	.fast-search-dialog::backdrop {
		animation: backdrop-fade-in 150ms ease;
	}
}

@keyframes dialog-fade-in {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes backdrop-fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

/* Selected/focus state */
.fast-search-result.selected,
.fast-search-result:focus {
	background: var(--vp-c-brand-soft);
	border-left: 3px solid var(--vp-c-brand-1);
	padding-left: 13px;
	outline: none;
}

.fast-search-result:focus-visible {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: -2px;
}

/* Deep selectors for highlighted marks */
.fast-search-result-title :deep(mark),
.fast-search-result-snippet :deep(mark) {
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
	border-radius: 2px;
	padding: 0 2px;
}

/* Webkit search cancel button */
.fast-search-input::-webkit-search-cancel-button {
	display: none;
}

/* High contrast mode */
@media (forced-colors: active) {
	.fast-search-result.selected {
		outline: 2px solid CanvasText;
	}

	.fast-search-result-title :deep(mark) {
		background: Mark;
		color: MarkText;
	}
}
</style>
