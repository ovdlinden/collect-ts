<script setup lang="ts">
defineProps<{
  operation: string
  speedup: number
  context: string
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-operation">{{ operation }}</div>
    <div class="stat-speedup"><span class="value">{{ speedup.toFixed(1) }}</span><span class="times">×</span></div>
    <div class="stat-context">{{ context }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-left: 3px solid var(--doc-c-success);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-align: center;
  transition: transform 0.2s var(--bench-ease-out-quint),
              box-shadow 0.2s var(--bench-ease-out-quint);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-operation {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.stat-speedup {
  font-family: var(--vp-font-family-mono);
  font-size: 2.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
  color: var(--doc-c-success);
}

.stat-speedup .value {
  /* inherits from parent */
}

.stat-speedup .times {
  font-size: 0.65em;
  font-weight: 500;
}

.stat-context {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
}

/* Dark mode adjustments */
:global(.dark) .stat-card {
  background: var(--vp-c-bg-alt);
}

:global(.dark) .stat-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

@media (max-width: 640px) {
  .stat-speedup {
    font-size: 1.75rem;
  }

  .stat-card {
    padding: 1rem 1.25rem;
  }
}
</style>
