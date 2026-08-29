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
  <div class="speedup-bar" role="img" :aria-label="`${speedup.toFixed(2)}x speedup`">
    <div class="bar-track">
      <div class="bar-center" />
      <div
        class="bar-fill"
        :class="{ win: isWin, loss: !isWin }"
        :style="barStyle"
      />
    </div>
  </div>
</template>

<style scoped>
.speedup-bar {
  width: 80px;
  height: 8px;
  flex-shrink: 0;
}

.bar-track {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
}

.bar-center {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--vp-c-text-3);
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.6;
}

.bar-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  transition: width var(--bench-duration-slow) var(--bench-ease-spring);
  z-index: 1;
}

.bar-fill.win {
  left: 50%;
  background: linear-gradient(90deg, var(--doc-c-success) 0%, color-mix(in srgb, var(--doc-c-success) 85%, white) 100%);
  box-shadow: 0 0 8px var(--doc-c-success-soft);
}

.bar-fill.loss {
  right: 50%;
  background: var(--doc-c-neutral);
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    transition: none;
  }
}
</style>
