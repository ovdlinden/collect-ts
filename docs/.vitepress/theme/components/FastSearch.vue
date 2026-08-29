<script setup lang="ts">
import { collect } from '../../../../src/Collection';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vitepress';

interface SearchResult {
	id: string;
	title: string;
	titles: string[];
	text: string;
}

interface ProcessedResult extends SearchResult {
	highlightedTitle: string;
	breadcrumb: string;
}

const props = defineProps<{
	visible: boolean;
}>();

const emit = defineEmits<{
	close: [];
}>();

const query = ref('');
const inputRef = ref<HTMLInputElement>();
const listRef = ref<HTMLUListElement>();
const selectedIndex = ref(0);
const searchIndex = ref<SearchResult[]>([]);
const isLoading = ref(true);
const announceText = ref('');

const router = useRouter();

// Load search index on mount
onMounted(async () => {
	try {
		const indexModule = await import('../data/search-index.json');
		searchIndex.value = indexModule.default;
	} catch {
		console.warn('Search index not found');
	}
	isLoading.value = false;
});

// Focus input and announce when visible
watch(
	() => props.visible,
	(visible) => {
		if (visible) {
			selectedIndex.value = 0;
			query.value = '';
			nextTick(() => {
				inputRef.value?.focus();
				announceText.value = 'Search dialog opened. Type to search documentation.';
			});
		}
	},
);

// Fast search using collect-ts lazy evaluation
const results = computed<ProcessedResult[]>(() => {
	const q = query.value.toLowerCase().trim();
	if (!q || q.length < 2) return [];

	const terms = q.split(/\s+/);

	// Use collect().lazy() for fast, early-terminating search
	return collect(searchIndex.value)
		.lazy()
		.filter((item) => {
			const searchText = `${item.title} ${item.titles.join(' ')} ${item.text}`.toLowerCase();
			return terms.every((term) => searchText.includes(term));
		})
		.take(12)
		.map((item) => ({
			...item,
			highlightedTitle: highlightTerms(item.title, terms),
			breadcrumb: item.titles.slice(0, -1).join(' › '),
		}))
		.all();
});

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
		case 'Escape':
			e.preventDefault();
			emit('close');
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

function handleBackdropClick(e: MouseEvent) {
	if (e.target === e.currentTarget) {
		emit('close');
	}
}

function getResultId(index: number): string {
	return `search-result-${index}`;
}
</script>

<template>
	<Teleport to="body">
		<Transition name="search-fade">
			<div
				v-if="visible"
				class="fast-search-overlay"
				role="presentation"
				@click="handleBackdropClick"
				@keydown.stop
			>
				<div
					class="fast-search-modal"
					role="dialog"
					aria-modal="true"
					aria-labelledby="search-title"
					@keydown="handleKeydown"
				>
					<h2 id="search-title" class="visually-hidden">Search documentation</h2>

					<!-- Live region for screen reader announcements -->
					<div aria-live="polite" aria-atomic="true" class="visually-hidden">
						{{ announceText }}
					</div>

					<div class="fast-search-input-wrapper">
						<svg
							class="fast-search-icon"
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
							placeholder="Search docs..."
							class="fast-search-input"
							autocomplete="off"
							aria-label="Search documentation"
							aria-controls="search-results"
							aria-expanded="true"
							:aria-activedescendant="results.length > 0 ? getResultId(selectedIndex) : undefined"
						/>
						<kbd class="fast-search-kbd" aria-hidden="true">ESC</kbd>
					</div>

					<div v-if="isLoading" class="fast-search-loading" role="status">
						<span class="visually-hidden">Loading</span>
						Loading search index...
					</div>

					<ul
						v-else-if="results.length > 0"
						id="search-results"
						ref="listRef"
						class="fast-search-results"
						role="listbox"
						aria-label="Search results"
					>
						<li
							v-for="(result, i) in results"
							:id="getResultId(i)"
							:key="result.id"
							role="option"
							:aria-selected="i === selectedIndex"
							class="fast-search-result"
							:class="{ selected: i === selectedIndex }"
							@click="navigate(result)"
							@mouseenter="selectedIndex = i"
						>
							<span v-if="result.breadcrumb" class="fast-search-result-breadcrumb" aria-hidden="true">
								{{ result.breadcrumb }}
							</span>
							<span class="fast-search-result-title" v-html="result.highlightedTitle" />
							<span class="visually-hidden">
								{{ result.breadcrumb ? `in ${result.breadcrumb}` : '' }}
							</span>
						</li>
					</ul>

					<div v-else-if="query.length >= 2" class="fast-search-empty" role="status">
						No results for "{{ query }}"
					</div>

					<div v-else class="fast-search-hint" role="status">Type at least 2 characters to search</div>

					<div class="fast-search-footer" aria-hidden="true">
						<span><kbd>↑↓</kbd> Navigate</span>
						<span><kbd>↵</kbd> Select</span>
						<span><kbd>Esc</kbd> Close</span>
						<span class="fast-search-powered">
							Powered by <strong>collect-ts</strong>
						</span>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.visually-hidden {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}

.search-fade-enter-active,
.search-fade-leave-active {
	transition: opacity 150ms ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
	opacity: 0;
}

.fast-search-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 200;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	padding-top: 10vh;
}

@media (prefers-reduced-motion: reduce) {
	.search-fade-enter-active,
	.search-fade-leave-active {
		transition: none;
	}
}

.fast-search-modal {
	background: var(--vp-c-bg);
	border-radius: 12px;
	width: min(600px, 90vw);
	max-height: 70vh;
	overflow: hidden;
	box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	display: flex;
	flex-direction: column;
}

.fast-search-input-wrapper {
	display: flex;
	align-items: center;
	padding: 16px;
	border-bottom: 1px solid var(--vp-c-divider);
	gap: 12px;
}

.fast-search-icon {
	width: 20px;
	height: 20px;
	color: var(--vp-c-text-3);
	flex-shrink: 0;
}

.fast-search-input {
	flex: 1;
	border: none;
	background: transparent;
	font-size: 16px;
	color: var(--vp-c-text-1);
	outline: none;
}

.fast-search-input::placeholder {
	color: var(--vp-c-text-3);
}

.fast-search-input::-webkit-search-cancel-button {
	display: none;
}

.fast-search-kbd {
	font-size: 12px;
	padding: 2px 6px;
	border-radius: 4px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-3);
	border: 1px solid var(--vp-c-divider);
	font-family: inherit;
}

.fast-search-results {
	overflow-y: auto;
	max-height: 400px;
	list-style: none;
	margin: 0;
	padding: 0;
}

.fast-search-result {
	display: flex;
	flex-direction: column;
	width: 100%;
	padding: 12px 16px;
	text-align: left;
	background: transparent;
	border: none;
	cursor: pointer;
	border-bottom: 1px solid var(--vp-c-divider);
}

.fast-search-result:last-child {
	border-bottom: none;
}

.fast-search-result.selected,
.fast-search-result:focus {
	background: var(--vp-c-bg-soft);
	outline: none;
}

.fast-search-result:focus-visible {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: -2px;
}

.fast-search-result-breadcrumb {
	font-size: 12px;
	color: var(--vp-c-text-3);
	margin-bottom: 2px;
}

.fast-search-result-title {
	font-size: 14px;
	color: var(--vp-c-text-1);
}

.fast-search-result-title :deep(mark) {
	background: var(--vp-c-brand-soft);
	color: var(--vp-c-brand-1);
	border-radius: 2px;
	padding: 0 2px;
}

.fast-search-loading,
.fast-search-empty,
.fast-search-hint {
	padding: 32px;
	text-align: center;
	color: var(--vp-c-text-3);
}

.fast-search-footer {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	padding: 12px 16px;
	border-top: 1px solid var(--vp-c-divider);
	font-size: 12px;
	color: var(--vp-c-text-3);
}

.fast-search-footer kbd {
	font-size: 11px;
	padding: 1px 4px;
	border-radius: 3px;
	background: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	margin-right: 4px;
	font-family: inherit;
}

.fast-search-powered {
	margin-left: auto;
}

.fast-search-powered strong {
	color: var(--vp-c-brand-1);
}

/* High contrast mode support */
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
