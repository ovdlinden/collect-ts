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
  <div class="rounded-md p-5 bg-[var(--vp-c-bg-soft)] my-5">
    <div class="text-base font-semibold mb-4">{{ title }}</div>

    <div class="flex flex-col gap-0">
      <div class="flex flex-col gap-1 py-3 px-4 border-l-2 border-l-[var(--vp-c-divider)] bg-transparent">
        <span class="text-xs text-[var(--vp-c-text-3)]">Without <span class="font-mono text-success">.lazy()</span></span>
        <span class="font-mono text-sm text-[var(--vp-c-text-2)]">{{ collectPrefix }}{{ collectSuffix }}</span>
        <span class="text-xs text-[var(--vp-c-text-3)]"><strong class="font-semibold text-[var(--vp-c-text-2)]">{{ eagerItems }}</strong> · {{ eagerTime }}</span>
      </div>

      <div class="flex justify-center py-2">
        <span class="text-xs font-medium text-success">↓ add <span class="lazy-badge font-mono font-bold bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] px-1.5 py-0.5 rounded-sm">.lazy()</span></span>
      </div>

      <div class="winner flex flex-col gap-1 py-3 px-4 border-l-2 border-l-success bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)]">
        <span class="text-xs text-[var(--vp-c-text-3)]">With <span class="font-mono text-success">.lazy()</span></span>
        <span class="font-mono text-sm text-[var(--vp-c-text-2)]">{{ collectPrefix }}<strong class="text-success font-bold">.lazy()</strong>{{ collectSuffix }}</span>
        <span class="text-xs text-success"><strong class="font-semibold">{{ lazyItems }}</strong> · {{ lazyTime }}</span>
      </div>
    </div>

    <div
      class="flex items-baseline justify-center gap-1.5 mt-4 pt-3 border-t border-t-[var(--vp-c-divider)] transition-opacity duration-300 motion-reduce:transition-none"
      :class="isVisible ? 'opacity-100' : 'opacity-0'"
    >
      <span class="font-mono text-3xl font-bold text-success tracking-tight">{{ speedup.toLocaleString() }}<span class="text-[0.6em] font-medium">×</span></span>
      <span class="text-sm text-[var(--vp-c-text-3)]">faster</span>
    </div>
  </div>
</template>
