<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  title: string
  collectPrefix: string
  collectSuffix: string
  eagerItems: string
  lazyItems: string
  eagerTime: string
  lazyTime: string
  speedup: number
}>()

const isVisible = ref(false)

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) {
    isVisible.value = true
  } else {
    requestAnimationFrame(() => {
      isVisible.value = true
    })
  }
})
</script>

<template>
  <div class="lazy-spotlight">
    <div class="title">{{ title }}</div>

    <div class="rows">
      <div class="row">
        <span class="label">Without <span class="mono">.lazy()</span></span>
        <span class="code">{{ collectPrefix }}{{ collectSuffix }}</span>
        <span class="stats"><strong>{{ eagerItems }}</strong> · {{ eagerTime }}</span>
      </div>

      <div class="divider">
        <span class="divider-text">↓ add <span class="lazy-badge">.lazy()</span></span>
      </div>

      <div class="row winner">
        <span class="label">With <span class="mono">.lazy()</span></span>
        <span class="code">{{ collectPrefix }}<strong class="lazy-insert">.lazy()</strong>{{ collectSuffix }}</span>
        <span class="stats"><strong>{{ lazyItems }}</strong> · {{ lazyTime }}</span>
      </div>
    </div>

    <div class="result" :class="{ visible: isVisible }">
      <span class="number">{{ speedup.toLocaleString() }}<span class="mult">×</span></span>
      <span class="label">faster</span>
    </div>
  </div>
</template>

<style scoped>
.lazy-spotlight {
  border-radius: 6px;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  margin: 1.25rem 0;
}

.title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-left: 2px solid var(--vp-c-divider);
  background: transparent;
}

.row.winner {
  border-left-color: var(--doc-c-success);
  background: color-mix(in srgb, var(--doc-c-success) 8%, transparent);
}

.row .label {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.row .mono {
  font-family: var(--vp-font-family-mono);
  color: var(--doc-c-success);
}

.row .code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.row .lazy-insert {
  color: var(--doc-c-success);
  font-weight: 700;
}

.row .stats {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

.row .stats strong {
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.row.winner .stats,
.row.winner .stats strong {
  color: var(--doc-c-success);
}

.divider {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.divider-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--doc-c-success);
}

.lazy-badge {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  background: color-mix(in srgb, var(--doc-c-success) 15%, transparent);
  padding: 0.1em 0.3em;
  border-radius: 3px;
}

.result {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--vp-c-divider);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.result.visible {
  opacity: 1;
}

.result .number {
  font-family: var(--vp-font-family-mono);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--doc-c-success);
  letter-spacing: -0.02em;
}

.result .mult {
  font-size: 0.6em;
  font-weight: 500;
}

.result .label {
  font-size: 0.875rem;
  color: var(--vp-c-text-3);
}

@media (prefers-reduced-motion: reduce) {
  .result {
    transition: none;
    opacity: 1;
  }
}
</style>
