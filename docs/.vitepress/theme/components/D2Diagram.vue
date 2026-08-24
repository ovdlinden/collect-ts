<template>
	<figure class="d2-figure" :aria-label="altText || undefined" @click="open">
		<!-- Both appearances ship in the SSR HTML; .dark picks one (see the CSS
		     below), so the theme toggle costs no re-render and never flashes. Both
		     are aria-hidden: an SVG's raw text nodes are not a usable alternative,
		     so the figure carries the alt text from the fence info string instead
		     (```d2 "…"), and the surrounding prose carries the same content. -->
		<div class="d2 d2-light" aria-hidden="true" v-html="lightSvg"></div>
		<div class="d2 d2-dark" aria-hidden="true" v-html="darkSvg"></div>
		<!-- The real enlarge affordance: a focusable button for keyboard and AT,
		     revealed on hover/focus. Mouse users can also click the figure body
		     (the @click above); a click on an in-diagram link still navigates. -->
		<button class="d2-enlarge" type="button" aria-label="Enlarge diagram">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
			</svg>
		</button>
	</figure>
	<!-- Native dialog: Esc, focus handling and top-layer come for free.
	     medium-zoom (used for the site's images) silently ignores inline SVGs,
	     so diagrams get this dependency-free pan/zoom viewer: wheel (or pinch)
	     zooms toward the cursor, drag pans, double-click resets, +/−/0/arrows
	     mirror it for the keyboard, backdrop closes. -->
	<dialog
		ref="lightbox"
		class="d2-lightbox"
		@close="onClose"
		@click="onLightboxClick"
		@dblclick.prevent="onDblClick"
		@wheel.prevent="onWheel"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointercancel="onPointerUp"
		@keydown="onKeydown"
	>
		<!-- Rendered only while open (v-if), so the third copy of every diagram's
		     markup stays out of the SSR HTML on every page. -->
		<div
			v-if="isOpen"
			class="d2-stage"
			:class="{ 'is-animated': animate, 'is-panning': panning }"
			:style="stageStyle"
			v-html="activeSvg"
		></div>
		<button class="d2-lightbox-close" type="button" aria-label="Close" @click.stop="close">✕</button>
		<p class="d2-lightbox-hint" aria-hidden="true">scroll to zoom · drag to pan · double-click to reset</p>
	</dialog>
</template>

<script setup lang="ts">
import { useData } from 'vitepress'
import { computed, nextTick, onUnmounted, ref } from 'vue'

// The two pre-rendered SVGs arrive URI-encoded (see plugins/markdown-d2.ts) so
// their markup never reaches Vue's template compiler; `ratio` is the build-time
// aspect ratio for the lightbox fit.
const props = defineProps<{ light: string; dark: string; ratio?: string; alt?: string }>()

const { isDark } = useData()
const lightSvg = computed(() => decodeURIComponent(props.light))
const darkSvg = computed(() => decodeURIComponent(props.dark))
// The figure's accessible name. Both SVGs are aria-hidden, so without this a
// diagram is invisible to assistive tech; the linter requires it per fence.
const altText = computed(() => (props.alt ? decodeURIComponent(props.alt) : ''))
const activeSvg = computed(() => (isDark.value ? darkSvg.value : lightSvg.value))

const VIEWBOX = /viewBox="[\d.eE+-]+\s+[\d.eE+-]+\s+([\d.eE+-]+)\s+([\d.eE+-]+)"/
// Prefer the build-time ratio; fall back to reading the viewBox off the SVG.
const ratio = computed<number | null>(() => {
	const passed = props.ratio ? Number(props.ratio) : Number.NaN
	if (Number.isFinite(passed) && passed > 0) return passed
	const m = VIEWBOX.exec(lightSvg.value)
	if (!m) return null
	const r = Number(m[1]) / Number(m[2])
	return Number.isFinite(r) && r > 0 ? r : null
})

// --- lightbox pan/zoom -----------------------------------------------------
// The stage opens at fit (scale 1) and wheel zooms toward the cursor up to 8×,
// dragging pans. `animate` is on only for programmatic jumps (reset, keyboard,
// double-click) — continuous input runs untransitioned so it tracks the hand.
const lightbox = ref<HTMLDialogElement>()
// Drives the v-if on the lightbox stage: false at SSR (no third copy shipped),
// true only while the dialog is open.
const isOpen = ref(false)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const animate = ref(false)
const panning = ref(false)
const MIN_SCALE = 1
const MAX_SCALE = 8
let pointer: { id: number; x: number; y: number; moved: boolean } | null = null
let suppressClick = false

// The fit is computed, not CSS'd: the SVG carries a viewBox but its aspect
// ratios span ~1 to ~6 here, so no single width-/height-driven rule fits them
// all without letterboxing. The stage is sized to the exact contained fit box
// from the diagram's own ratio and the SVG fills it 100%×100%, so scale 1 opens
// every diagram filling the frame.
const fitW = ref(0)
const fitH = ref(0)
// Matches the .d2-lightbox `padding: 4vmin`, so the fit box lands inside it.
const FIT_PAD_VMIN = 0.04
const MAX_FIT_WIDTH = 1400

const stageStyle = computed(() => ({
	width: fitW.value ? `${fitW.value}px` : undefined,
	height: fitH.value ? `${fitH.value}px` : undefined,
	transform: `translate(${tx.value}px, ${ty.value}px) scale(${scale.value})`,
}))

// Largest ratio-preserving box that fits the padded viewport, width-capped so
// diagrams don't stretch edge-to-edge on very wide screens. Derived from the
// window (the dialog is 100vw×100vh) so it's callable before showModal.
function computeFit(): void {
	const vw = window.innerWidth
	const vh = window.innerHeight
	const pad = FIT_PAD_VMIN * Math.min(vw, vh)
	const availW = Math.max(0, vw - 2 * pad)
	const availH = Math.max(0, vh - 2 * pad)
	const r = ratio.value
	if (!r || !Number.isFinite(r)) {
		fitW.value = Math.min(MAX_FIT_WIDTH, availW)
		fitH.value = availH
		return
	}
	const w = Math.min(MAX_FIT_WIDTH, availW, availH * r)
	fitW.value = Math.round(w)
	fitH.value = Math.round(w / r)
}

// Re-fit on viewport change, but only while untouched — once the user has
// zoomed or panned, leave their view alone rather than yanking the base box.
function onResize(): void {
	if (scale.value === 1 && tx.value === 0 && ty.value === 0) computeFit()
}

function resetView(): void {
	animate.value = false
	panning.value = false
	pointer = null
	scale.value = 1
	tx.value = 0
	ty.value = 0
}

const open = async (event?: Event) => {
	// Nodes can carry `link:` to a doc section; a click on one of those should
	// navigate, not open the zoom lightbox. Everything else zooms.
	if (event && (event.target as Element | null)?.closest?.('a')) return
	// Guard re-entry: a fast double-click, or the enlarge button's click bubbling
	// up to the figure, would otherwise call showModal twice (which throws).
	if (lightbox.value?.open) return
	resetView()
	computeFit()
	// Mount the stage (v-if) before showing, so the dialog never flashes empty.
	isOpen.value = true
	await nextTick()
	lightbox.value?.showModal()
	window.addEventListener('resize', onResize)
}
const close = () => lightbox.value?.close()

function onClose(): void {
	isOpen.value = false
	resetView()
	window.removeEventListener('resize', onResize)
}

/** Zoom by `factor` keeping the viewport point (cx, cy) fixed. */
function zoomAt(cx: number, cy: number, factor: number, animated = false): void {
	const box = lightbox.value?.getBoundingClientRect()
	if (!box) return
	// Cursor relative to the viewport centre, where the stage's origin sits.
	const qx = cx - box.left - box.width / 2
	const qy = cy - box.top - box.height / 2
	const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor))
	const rel = next / scale.value
	animate.value = animated
	tx.value = qx - rel * (qx - tx.value)
	ty.value = qy - rel * (qy - ty.value)
	scale.value = next
}

function jumpTo(nextScale: number, nextTx = 0, nextTy = 0): void {
	animate.value = true
	scale.value = nextScale
	tx.value = nextTx
	ty.value = nextTy
}

function onWheel(event: WheelEvent): void {
	// Trackpad pinch arrives as ctrlKey+wheel with small deltas — give it a
	// stronger response so a pinch feels like a pinch.
	zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.002)))
}

function onDblClick(event: MouseEvent): void {
	if (scale.value > 1.01) jumpTo(1)
	else zoomAt(event.clientX, event.clientY, 2.5, true)
}

function onPointerDown(event: PointerEvent): void {
	if (event.button !== 0) return
	pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
	lightbox.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
	if (!pointer || event.pointerId !== pointer.id) return
	const dx = event.clientX - pointer.x
	const dy = event.clientY - pointer.y
	if (!pointer.moved && Math.hypot(dx, dy) < 4) return
	pointer.moved = true
	panning.value = true
	animate.value = false
	tx.value += dx
	ty.value += dy
	pointer.x = event.clientX
	pointer.y = event.clientY
}

function onPointerUp(event: PointerEvent): void {
	if (!pointer || event.pointerId !== pointer.id) return
	// A drag's trailing click must not close the dialog. Only a real pointerup is
	// followed by a click; a pointercancel is not, so it clears the flag rather
	// than leaving it set to swallow the next click.
	suppressClick = event.type === 'pointerup' && pointer.moved
	pointer = null
	panning.value = false
}

function onLightboxClick(event: MouseEvent): void {
	if (suppressClick) {
		suppressClick = false
		return
	}
	// Backdrop only — clicks on the diagram are for dblclick zooming.
	if (event.target === lightbox.value) close()
}

function onKeydown(event: KeyboardEvent): void {
	const box = lightbox.value?.getBoundingClientRect()
	if (!box) return
	const cx = box.left + box.width / 2
	const cy = box.top + box.height / 2
	const pan = 72
	if (event.key === '+' || event.key === '=') zoomAt(cx, cy, 1.3, true)
	else if (event.key === '-' || event.key === '_') zoomAt(cx, cy, 1 / 1.3, true)
	else if (event.key === '0') jumpTo(1)
	else if (event.key === 'ArrowLeft') (animate.value = false), (tx.value += pan)
	else if (event.key === 'ArrowRight') (animate.value = false), (tx.value -= pan)
	else if (event.key === 'ArrowUp') (animate.value = false), (ty.value += pan)
	else if (event.key === 'ArrowDown') (animate.value = false), (ty.value -= pan)
	else return
	event.preventDefault()
}

onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
/* The figure holds both appearances; the theme class shows one. Wide screens
   let diagrams breathe past the prose measure (64px a side stays clear of the
   outline aside and buys squeezed diagrams room). */
.d2-figure {
	position: relative;
	display: flex;
	justify-content: center;
	margin: 1.25rem 0;
	cursor: zoom-in;
}

@media (min-width: 1440px) {
	.d2-figure {
		margin-inline: -64px;
	}
}

html.dark .d2-light,
html:not(.dark) .d2-dark {
	display: none;
}

/* D2 renders text with its own Source Sans subset and computes layout against
   those metrics, so its typography is left untouched — d2's own `.text*` rules
   carry the embedded families, and a font-family here would be inert anyway. */
.d2 :deep(svg),
.d2-stage :deep(svg) {
	display: block;
}

/* Linked nodes are wrapped in an SVG <a>, which VitePress underlines. The
   plugin's corner arrow (see markdown-d2.ts, linkChip) is the affordance now, so
   drop the underline to keep the diagram labels clean. */
.d2 :deep(svg a),
.d2 :deep(svg a text),
.d2-stage :deep(svg a),
.d2-stage :deep(svg a text) {
	text-decoration: none;
}

.d2 :deep(svg) {
	max-width: 100%;
	height: auto;
}

/* Lift the node cards off their container panel with a soft shadow. Corner
   radius is baked into the SVG by the plugin (paintIcons), so this is shadow
   only. D2 emits default nodes as fill-B5/B6 and a role-coloured node as a
   class-less rect with an inline fill, so shadow those; the icon badges carry a
   class (d2-badge) and are skipped, and container panels (fill-B4) stay flat.
   Themed per appearance — each SVG only ever shows under its own class. */
.d2-light :deep(svg) rect.fill-B5,
.d2-light :deep(svg) rect.fill-B6,
.d2-light :deep(svg) rect:not([class]) {
	filter: drop-shadow(0 2px 3px rgba(15, 23, 42, 0.14));
}

.d2-dark :deep(svg) rect.fill-B5,
.d2-dark :deep(svg) rect.fill-B6,
.d2-dark :deep(svg) rect:not([class]) {
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

/* Enlarge affordance: a real focusable button, shown as a corner chip on
   hover/focus so the zoom-in cursor isn't the only hint the lightbox exists.
   Absolutely positioned — never part of diagram layout. */
.d2-enlarge {
	position: absolute;
	top: 6px;
	right: 6px;
	display: grid;
	place-items: center;
	width: 30px;
	height: 30px;
	padding: 0;
	border-radius: 8px;
	background: var(--vp-c-bg-soft);
	border: 1px solid var(--vp-c-divider);
	color: var(--vp-c-text-2);
	cursor: zoom-in;
	opacity: 0;
	transition: opacity 0.15s ease;
}

.d2-enlarge svg {
	width: 16px;
	height: 16px;
}

.d2-figure:hover .d2-enlarge,
.d2-enlarge:focus-visible {
	opacity: 1;
}

.d2-enlarge:focus-visible {
	outline: 2px solid var(--vp-c-brand-1);
	outline-offset: 2px;
}

.d2-lightbox {
	width: 100vw;
	height: 100vh;
	max-width: none;
	max-height: none;
	border: none;
	outline: none;
	margin: 0;
	padding: 4vmin;
	display: none;
	overflow: hidden;
	background: var(--vp-c-bg);
	cursor: zoom-out;
	touch-action: none;
}

.d2-lightbox[open] {
	display: grid;
	place-items: center;
}

.d2-stage {
	will-change: transform;
	cursor: grab;
	user-select: none;
	-webkit-user-select: none;
}

.d2-stage.is-animated {
	transition: transform 0.25s ease;
}

.d2-stage.is-panning {
	cursor: grabbing;
}

/* The stage is sized to the contained fit box in JS (see computeFit); the SVG
   fills it exactly. !important overrides the natural width stamped by the
   plugin so a diagram narrower than the fit box still scales up to fill. */
.d2-stage :deep(svg) {
	width: 100% !important;
	height: 100% !important;
	max-width: none !important;
	max-height: none !important;
}

/* Carry the card shadow into the lightbox (radius is baked into the SVG). The
   stage shows the active appearance's SVG, so the shadow keys off .dark. */
html:not(.dark) .d2-stage :deep(svg) rect.fill-B5,
html:not(.dark) .d2-stage :deep(svg) rect.fill-B6,
html:not(.dark) .d2-stage :deep(svg) rect:not([class]) {
	filter: drop-shadow(0 2px 3px rgba(15, 23, 42, 0.14));
}

html.dark .d2-stage :deep(svg) rect.fill-B5,
html.dark .d2-stage :deep(svg) rect.fill-B6,
html.dark .d2-stage :deep(svg) rect:not([class]) {
	filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.d2-lightbox-close {
	position: fixed;
	top: 16px;
	right: 16px;
	width: 36px;
	height: 36px;
	display: grid;
	place-items: center;
	border-radius: 8px;
	border: 1px solid var(--vp-c-divider);
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-2);
	font-size: 14px;
	cursor: pointer;
	transition:
		color 0.15s ease,
		border-color 0.15s ease;
}

.d2-lightbox-close:hover {
	color: var(--vp-c-text-1);
	border-color: var(--vp-c-text-3);
}

.d2-lightbox-hint {
	position: fixed;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	margin: 0;
	padding: 6px 14px;
	border-radius: 999px;
	background: var(--vp-c-bg-soft);
	color: var(--vp-c-text-2);
	font-size: 12.5px;
	pointer-events: none;
	opacity: 0;
}

.d2-lightbox[open] .d2-lightbox-hint {
	animation: d2-hint 4s ease forwards;
}

@keyframes d2-hint {
	0%,
	60% {
		opacity: 1;
	}
	100% {
		opacity: 0;
	}
}

@media (prefers-reduced-motion: reduce) {
	.d2-stage.is-animated {
		transition: none;
	}

	.d2-lightbox[open] .d2-lightbox-hint {
		animation: none;
		opacity: 1;
	}
}
</style>
