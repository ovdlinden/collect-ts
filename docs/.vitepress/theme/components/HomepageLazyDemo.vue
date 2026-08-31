<script setup lang="ts">
import { computed } from 'vue'
import benchmarkResults from '../data/benchmark-results.json'
import LazySpotlight from './LazySpotlight.vue'

interface LazyBenchmarkResult {
  name: string
  collectionEager: { ops: string; hz: number }
  lazyCollection: { ops: string; hz: number }
}

const results = benchmarkResults as { lazy?: LazyBenchmarkResult[] }

const earlyExitData = computed(() => {
  const lazy = results.lazy || []
  const earlyExit = lazy.find(l => l.name.includes('Early exit'))
  if (!earlyExit) return null

  const speedup = Math.round(earlyExit.lazyCollection.hz / earlyExit.collectionEager.hz)

  const formatTime = (hz: number) => {
    const ms = 1000 / hz
    if (ms < 0.001) return `~${(ms * 1000).toFixed(0)}μs`
    if (ms < 1) return `~${ms.toFixed(2)}ms`
    return `~${ms.toFixed(0)}ms`
  }

  return {
    title: 'Early exit with .lazy()',
    collectPrefix: 'collect(items)',
    collectSuffix: ".where('active', true).take(10)",
    eagerItems: '1,000,000 items processed',
    lazyItems: '~10 items processed',
    eagerTime: formatTime(earlyExit.collectionEager.hz),
    lazyTime: formatTime(earlyExit.lazyCollection.hz),
    speedup,
  }
})
</script>

<template>
  <LazySpotlight
    v-if="earlyExitData"
    :title="earlyExitData.title"
    :collect-prefix="earlyExitData.collectPrefix"
    :collect-suffix="earlyExitData.collectSuffix"
    :eager-items="earlyExitData.eagerItems"
    :lazy-items="earlyExitData.lazyItems"
    :eager-time="earlyExitData.eagerTime"
    :lazy-time="earlyExitData.lazyTime"
    :speedup="earlyExitData.speedup"
  />
</template>
