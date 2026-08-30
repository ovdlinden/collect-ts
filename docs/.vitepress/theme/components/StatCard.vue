<script setup lang="ts">
defineProps<{
  operation: string
  speedup: number
  context: string
}>()
</script>

<template>
  <div class="stat-card flex flex-col items-center gap-2 py-5 px-6 border border-[var(--vp-c-divider)] border-l-3 border-l-success rounded-lg bg-[var(--vp-c-bg-soft)] text-center sm:py-4 sm:px-5 dark:bg-[var(--vp-c-bg-alt)]">
    <div class="font-mono text-sm font-medium text-[var(--vp-c-text-2)]">{{ operation }}</div>
    <div class="font-mono text-4xl sm:text-3xl font-bold tabular-nums tracking-tight leading-none whitespace-nowrap text-success">
      <span>{{ speedup.toFixed(1) }}</span><span class="text-[0.65em] font-medium">×</span>
    </div>
    <div class="text-xs text-[var(--vp-c-text-3)]">{{ context }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  transition: transform 0.2s var(--ease-out-quint),
              box-shadow 0.2s var(--ease-out-quint);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:global(.dark) .stat-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}
</style>
