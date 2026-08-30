<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  speedup: number
  animate?: boolean
}>(), {
  animate: true
})

const mounted = ref(false)

const isWin = computed(() => props.speedup >= 1)

const barWidthPercent = computed(() => {
  if (props.speedup <= 0) return 0
  const log2Value = Math.log2(props.speedup)
  const normalized = Math.abs(log2Value) / 2
  return Math.min(normalized * 50, 50)
})

const barStyle = computed(() => {
  const width = props.animate && !mounted.value ? 0 : barWidthPercent.value
  return {
    width: `${width}%`
  }
})

onMounted(() => {
  if (props.animate) {
    requestAnimationFrame(() => {
      mounted.value = true
    })
  } else {
    mounted.value = true
  }
})
</script>

<template>
  <div class="w-20 h-2 shrink-0" role="img" :aria-label="`${speedup.toFixed(2)}x speedup`">
    <div class="relative w-full h-full bg-[var(--vp-c-divider)] rounded overflow-hidden">
      <div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--vp-c-text-3)] -translate-x-1/2 z-[2] opacity-60" />
      <div
        class="bar-fill absolute top-0 h-full rounded z-[1] motion-reduce:transition-none"
        :class="isWin ? 'win left-1/2' : 'loss right-1/2'"
        :style="barStyle"
      />
    </div>
  </div>
</template>

<style scoped>
.bar-fill {
  transition: width var(--duration-slow) var(--ease-spring);
}

.bar-fill.win {
  background: linear-gradient(90deg, var(--color-success) 0%, color-mix(in srgb, var(--color-success) 85%, white) 100%);
  box-shadow: 0 0 8px var(--color-success-soft);
}

.bar-fill.loss {
  background: var(--color-neutral);
}
</style>
