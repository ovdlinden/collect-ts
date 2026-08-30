<script setup lang="ts">
</script>

<template>
  <div class="plugin-spotlight">
    <div class="header">
      <span class="badge-wrapper"><span class="badge">Plugin</span></span>
      <span class="title">Tree-shaking without import gymnastics</span>
    </div>

    <p class="subtitle">Write <code>import { collect }</code>. The bundler extracts only the methods you call.</p>

    <div class="comparison">
      <div class="panel old">
        <div class="panel-header">
          <span class="panel-label">lodash-es</span>
          <svg class="icon icon-x" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </div>
        <pre class="panel-code"><code><span class="kw">import</span> map <span class="kw">from</span> <span class="str">'lodash-es/map'</span>
<span class="kw">import</span> filter <span class="kw">from</span> <span class="str">'lodash-es/filter'</span>
<span class="kw">import</span> groupBy <span class="kw">from</span> <span class="str">'lodash-es/groupBy'</span>
<span class="kw">import</span> sortBy <span class="kw">from</span> <span class="str">'lodash-es/sortBy'</span>
<span class="kw">import</span> uniq <span class="kw">from</span> <span class="str">'lodash-es/uniq'</span></code></pre>
        <div class="panel-footer">One import per method</div>
      </div>

      <div class="vs">vs</div>

      <div class="panel new">
        <div class="panel-header">
          <span class="panel-label">collect-ts</span>
          <svg class="icon icon-check" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <pre class="panel-code"><code><span class="kw">import</span> { collect } <span class="kw">from</span> <span class="str">'collect-ts'</span>

collect(data)
  .filter(x => x.active)
  .map(x => x.name)
  .groupBy(<span class="str">'role'</span>)</code></pre>
        <div class="panel-footer success">Same bundle size, better DX</div>
      </div>
    </div>

    <div class="sizes">
      <div class="size-item">
        <span class="size-value muted">56 KB</span>
        <span class="size-label">all 155+ methods</span>
      </div>
      <div class="size-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </div>
      <div class="size-item featured">
        <span class="size-value">6 KB</span>
        <span class="size-label">with plugin</span>
      </div>
      <div class="size-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </div>
      <div class="size-item">
        <span class="size-value muted">200 B</span>
        <span class="size-label">standalone fn</span>
      </div>
    </div>

    <div class="cta-wrapper">
      <a href="/guide/tree-shaking" class="cta">
        How the plugin works
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<style scoped>
.plugin-spotlight {
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  margin: 1.5rem 0;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

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

.title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
}

.subtitle {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

.subtitle code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  background: var(--vp-c-default-soft);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

.comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1.5rem;
}

.vs {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.panel {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.panel.old {
  opacity: 0.55;
}

.panel.new {
  border-color: var(--doc-c-success);
  box-shadow: 0 0 20px color-mix(in srgb, var(--doc-c-success) 12%, transparent);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.panel-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
}

.icon {
  flex-shrink: 0;
}

.icon-x {
  color: var(--vp-c-text-3);
}

.icon-check {
  color: var(--doc-c-success);
}

.panel-code {
  flex: 1;
  margin: 0;
  padding: 0;
  background: none;
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: pre;
  overflow-x: auto;
}

.panel-code .kw {
  color: var(--vp-c-text-3);
}

.panel-code .str {
  color: var(--doc-c-success);
}

.panel-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.panel-footer.success {
  color: var(--doc-c-success);
  font-weight: 500;
}

.sizes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.size-item.featured {
  transform: scale(1.15);
}

.size-value {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--doc-c-success);
  letter-spacing: -0.02em;
}

.size-value.muted {
  color: var(--vp-c-text-3);
  font-size: 1.1rem;
}

.size-label {
  font-size: 0.7rem;
  color: var(--vp-c-text-3);
  margin-top: 0.15rem;
}

.size-arrow {
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
}

.cta-wrapper {
  text-align: center;
  margin-top: 0.25rem;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-decoration: none;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition: color 0.15s, border-color 0.15s, gap 0.15s;
}

.cta:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
  gap: 0.55rem;
}

@media (max-width: 700px) {
  .comparison {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .vs {
    justify-content: center;
    padding: 0.25rem 0;
  }

  .panel.old {
    opacity: 0.4;
  }

  .sizes {
    gap: 0.75rem;
  }

  .size-arrow svg {
    width: 16px;
    height: 16px;
  }

  .size-value {
    font-size: 1.2rem;
  }

  .size-value.muted {
    font-size: 1rem;
  }
}
</style>
