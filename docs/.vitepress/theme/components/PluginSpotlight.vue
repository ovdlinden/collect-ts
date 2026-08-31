<script setup lang="ts">
import bundleSizes from '../data/bundle-sizes.json';
</script>

<template>
  <div class="rounded-xl p-6 bg-[var(--vp-c-bg-soft)] my-6">
    <div class="flex items-center gap-3 mb-2">
      <span class="badge-wrapper"><span class="badge">Plugin</span></span>
      <span class="text-[1.1rem] font-semibold text-[var(--vp-c-text-1)] m-0">Tree-shaking without import gymnastics</span>
    </div>

    <p class="text-[0.9rem] text-[var(--vp-c-text-2)] m-0 mb-5 leading-relaxed">Write <code class="font-mono text-[0.85em] bg-[var(--vp-c-default-soft)] px-1.5 py-0.5 rounded">import { collect }</code>. The bundler extracts only the methods you call.</p>

    <div class="comparison grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-6 max-[700px]:grid-cols-1 max-[700px]:gap-2">
      <div class="panel old flex flex-col p-4 rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg)] opacity-55 max-[700px]:opacity-40">
        <div class="flex justify-between items-center mb-3">
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--vp-c-text-3)]">lodash-es</span>
          <svg class="shrink-0 text-[var(--vp-c-text-3)]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </div>
        <pre class="panel-code flex-1 m-0 p-0 bg-transparent font-mono text-[0.78rem] leading-relaxed text-[var(--vp-c-text-2)] whitespace-pre overflow-x-auto"><code><span class="text-[var(--vp-c-text-3)]">import</span> map <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'lodash-es/map'</span>
<span class="text-[var(--vp-c-text-3)]">import</span> filter <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'lodash-es/filter'</span>
<span class="text-[var(--vp-c-text-3)]">import</span> groupBy <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'lodash-es/groupBy'</span>
<span class="text-[var(--vp-c-text-3)]">import</span> sortBy <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'lodash-es/sortBy'</span>
<span class="text-[var(--vp-c-text-3)]">import</span> uniq <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'lodash-es/uniq'</span></code></pre>
        <div class="mt-3 pt-3 border-t border-t-[var(--vp-c-divider)] text-xs text-[var(--vp-c-text-3)]">One import per method</div>
      </div>

      <div class="flex items-center text-xs font-semibold text-[var(--vp-c-text-3)] uppercase tracking-wide max-[700px]:justify-center max-[700px]:py-1">vs</div>

      <div class="panel new flex flex-col p-4 rounded-lg border border-success bg-[var(--vp-c-bg)] shadow-[0_0_20px_color-mix(in_srgb,var(--color-success)_12%,transparent)]">
        <div class="flex justify-between items-center mb-3">
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-[var(--vp-c-text-3)]">collect-ts</span>
          <svg class="shrink-0 text-success" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <pre class="panel-code flex-1 m-0 p-0 bg-transparent font-mono text-[0.78rem] leading-relaxed text-[var(--vp-c-text-2)] whitespace-pre overflow-x-auto"><code><span class="text-[var(--vp-c-text-3)]">import</span> { collect } <span class="text-[var(--vp-c-text-3)]">from</span> <span class="text-success">'collect-ts'</span>

collect(data)
  .filter(x => x.active)
  .map(x => x.name)
  .groupBy(<span class="text-success">'role'</span>)</code></pre>
        <div class="mt-3 pt-3 border-t border-t-[var(--vp-c-divider)] text-xs text-success font-medium">Same bundle size, better DX</div>
      </div>
    </div>

    <div class="flex items-center justify-center gap-5 py-4 mb-4 max-[700px]:gap-3">
      <div class="flex flex-col items-center text-center">
        <span class="font-mono text-[1.1rem] font-bold text-[var(--vp-c-text-3)] tracking-tight max-[700px]:text-base">{{ bundleSizes.full.formatted }}</span>
        <span class="text-[0.7rem] text-[var(--vp-c-text-3)] mt-0.5">all {{ bundleSizes.methodCount }}+ methods</span>
      </div>
      <div class="text-[var(--vp-c-text-3)] flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="max-[700px]:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </div>
      <div class="flex flex-col items-center text-center scale-115">
        <span class="font-mono text-2xl font-bold text-success tracking-tight max-[700px]:text-xl">{{ bundleSizes.treeshaken.formatted }}</span>
        <span class="text-[0.7rem] text-[var(--vp-c-text-3)] mt-0.5">with plugin</span>
      </div>
      <div class="text-[var(--vp-c-text-3)] flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="max-[700px]:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="font-mono text-[1.1rem] font-bold text-[var(--vp-c-text-3)] tracking-tight max-[700px]:text-base">{{ bundleSizes.standalone.formatted }}</span>
        <span class="text-[0.7rem] text-[var(--vp-c-text-3)] mt-0.5">standalone fn</span>
      </div>
    </div>
    <p class="text-[0.65rem] text-center text-[var(--vp-c-text-3)] -mt-2 mb-4 opacity-70">gzip compressed</p>

    <div class="text-center mt-1">
      <a href="/guide/tree-shaking" class="cta inline-flex items-center gap-1.5 py-2 px-4 text-xs font-medium text-[var(--vp-c-text-2)] no-underline bg-[var(--vp-c-bg)] border border-[var(--vp-c-divider)] rounded-md transition-all duration-150 hover:text-[var(--vp-c-text-1)] hover:border-[var(--vp-c-text-3)] hover:gap-2">
        How the plugin works
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<style scoped>
.badge-wrapper {
  position: relative;
  display: inline-flex;
  padding: 1px;
  border-radius: 6px;
  background: linear-gradient(135deg, #bd34fe, #41d1ff, #bd34fe);
  background-size: 300% 300%;
  animation: border-flow 4s ease infinite;
  flex-shrink: 0;
}

.badge-wrapper::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 9px;
  background: inherit;
  background-size: inherit;
  animation: inherit;
  filter: blur(10px);
  opacity: 0.4;
  z-index: -1;
}

.badge {
  display: block;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.4em 0.75em;
  border-radius: 5px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

@keyframes border-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>
