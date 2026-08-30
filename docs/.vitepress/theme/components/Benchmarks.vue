<script setup lang="ts">
import { computed, ref } from 'vue'
import benchmarkResults from '../data/benchmark-results.json'
import CallbackTaxDiagram from './CallbackTaxDiagram.vue'
import LazySpotlight from './LazySpotlight.vue'
import SpeedupBar from './SpeedupBar.vue'
import StatCard from './StatCard.vue'

const sizes = ['10K', '100K', '1M'] as const
type Size = typeof sizes[number]

const selectedSize = ref<Size>('100K')
const expandedOp = ref<string | null>(null)

interface BenchmarkOps {
  name: string
  native: { ops: string }
  collectTs: { ops: string }
  speedup: string
}

interface LazyBenchmarkResult {
  name: string
  rawLoop: { ops: string; hz: number }
  nativeArray: { ops: string; hz: number }
  nativeGenerator: { ops: string; hz: number }
  collectionEager: { ops: string; hz: number }
  lazyCollection: { ops: string; hz: number }
}

const codeExamples: Record<string, { native: string; collectTs: string }> = {
  sum: {
    native: 'items.reduce((s, x) => s + x.value, 0)',
    collectTs: "collect(items).sum('value')",
  },
  avg: {
    native: 'items.reduce(...) / items.length',
    collectTs: "collect(items).avg('value')",
  },
  'filter → map → reduce': {
    native: 'items.filter(...).map(...).reduce(...)',
    collectTs: "collect(items).where(...).pluck(...).sum()",
  },
  filter: {
    native: 'items.filter(x => x.active)',
    collectTs: "collect(items).where('active', true)",
  },
  pluck: {
    native: 'items.map(x => x.value)',
    collectTs: "collect(items).pluck('value')",
  },
  unique: {
    native: '[...new Set(items.map(...))]',
    collectTs: "collect(items).unique('category')",
  },
  find: {
    native: 'items.find(x => x.id === 42)',
    collectTs: "collect(items).firstWhere('id', 42)",
  },
  groupBy: {
    native: 'items.reduce((acc, x) => {...}, {})',
    collectTs: "collect(items).groupBy('category')",
  },
}

const results = benchmarkResults as Record<Size, BenchmarkOps[]> & { lazy?: LazyBenchmarkResult[] }

// Format hz (ops/s) to human-readable time per operation
function formatTime(hz: number): string {
  const ms = 1000 / hz
  if (ms >= 1) return `~${ms.toFixed(0)}ms`
  if (ms >= 0.001) return `~${(ms * 1000).toFixed(0)}μs`
  return `~${(ms * 1000000).toFixed(0)}ns`
}

// Hero metrics from selected array size
const heroMetrics = computed(() => {
  const data = results[selectedSize.value] || []
  const heroOps = ['sum', 'filter → map → reduce', 'pluck']
  return heroOps.map(name => {
    const bench = data.find(b => b.name === name)
    if (!bench) return null
    const speedup = parseFloat(bench.speedup) || 1
    return {
      operation: name === 'filter → map → reduce' ? 'chained ops' : `${name}('key')`,
      speedup,
      context: `faster at ${selectedSize.value} items`
    }
  }).filter(Boolean) as { operation: string; speedup: number; context: string }[]
})

// Early exit spotlight data
const earlyExitData = computed(() => {
  const lazy = results.lazy || []
  const earlyExit = lazy.find(l => l.name.includes('Early exit'))
  if (!earlyExit) return null

  const speedup = Math.round(earlyExit.lazyCollection.hz / earlyExit.collectionEager.hz)

  return {
    title: 'Taking 10 active items from 1 million',
    collectPrefix: 'collect(items)',
    collectSuffix: ".where('active', true).take(10)",
    eagerItems: '1,000,000 items',
    lazyItems: '~10 items',
    eagerTime: formatTime(earlyExit.collectionEager.hz),
    lazyTime: formatTime(earlyExit.lazyCollection.hz),
    speedup,
  }
})

const benchmarks = computed(() => {
  const sizeData = results[selectedSize.value] || []
  return sizeData.map((item) => {
    const speedupNum = parseFloat(item.speedup) || 0
    const isFaster = speedupNum >= 1

    return {
      ...item,
      speedupNum,
      isFaster,
      code: codeExamples[item.name] || { native: '', collectTs: '' },
    }
  })
})

function toggleExpand(name: string) {
  expandedOp.value = expandedOp.value === name ? null : name
}

const decisionMatrix = [
  { scenario: 'Aggregations (sum, avg, max)', choice: 'collect()', reason: 'String keys skip callback overhead' },
  { scenario: 'First N from large dataset', choice: '.lazy()', reason: 'Stops after N items' },
  { scenario: 'Chained transforms', choice: 'Either', reason: 'No intermediate arrays' },
  { scenario: 'One-off filter or map', choice: 'Native', reason: 'No wrapper' },
  { scenario: 'Hot loop', choice: 'for', reason: 'Zero abstraction' },
]
</script>

<template>
  <div class="text-[0.9375rem]">
    <!-- Act I: The Callback Tax -->
    <section class="mb-10">
      <p class="text-base leading-[1.7] text-[var(--vp-c-text-2)] mb-6">
        Every time you write <code class="font-mono text-[0.9em] px-1.5 py-0.5 bg-[var(--vp-c-default-soft)] rounded">.reduce((acc, x) => ...)</code>, you pay a toll. V8 can't inline
        that arrow function — it builds a stack frame, captures closure variables, and invokes your
        callback for every single element.
      </p>
      <CallbackTaxDiagram />
      <p class="text-[0.95rem] text-success font-medium mt-4">
        <code class="font-mono text-[0.9em] px-1.5 py-0.5 bg-[var(--vp-c-default-soft)] rounded">sum('value')</code> avoids 10,000 function calls. That's the entire speedup.
      </p>
    </section>

    <!-- Act II: String Keys Beat Callbacks -->
    <section class="mb-16">
      <h3 class="text-2xl font-bold mb-7 text-[var(--vp-c-text-1)]">String Keys Beat Callbacks</h3>

      <!-- Hero Stats -->
      <div v-if="heroMetrics.length" class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5 mb-10 max-sm:grid-cols-1">
        <StatCard
          v-for="metric in heroMetrics"
          :key="metric.operation"
          :operation="metric.operation"
          :speedup="metric.speedup"
          :context="metric.context"
        />
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-2.5 mb-6 text-[0.8125rem] text-[var(--vp-c-text-3)] max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2">
        <span>Array size</span>
        <div class="inline-flex border border-[var(--vp-c-divider)] rounded-md overflow-hidden">
          <button
            v-for="size in sizes"
            :key="size"
            :class="['font-mono text-[0.6875rem] py-1.5 px-2 border-none cursor-pointer size-btn', { active: selectedSize === size }]"
            @click="selectedSize = size"
          >{{ size }}</button>
        </div>
      </div>

      <!-- Full Comparison Table -->
      <table>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Native</th>
            <th>collect-ts</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="bench in benchmarks" :key="bench.name">
            <tr class="data-row" @click="toggleExpand(bench.name)">
              <td class="font-mono font-medium text-sm">{{ bench.name }}</td>
              <td class="font-mono text-[0.8125rem] text-right text-[var(--vp-c-text-2)] whitespace-nowrap">{{ bench.native.ops }}</td>
              <td class="font-mono text-[0.8125rem] text-right text-[var(--vp-c-text-2)] whitespace-nowrap">{{ bench.collectTs.ops }}</td>
              <td class="text-right">
                <span :class="['font-mono font-semibold tabular-nums inline-flex items-center gap-2.5', bench.isFaster ? 'text-success' : 'text-neutral']">
                  <SpeedupBar :speedup="bench.speedupNum" />
                  <span class="w-12 text-right text-[0.9375rem]">{{ bench.speedupNum.toFixed(1) }}×</span>
                </span>
              </td>
            </tr>
            <tr v-if="expandedOp === bench.name" class="code-row">
              <td colspan="4">
                <div class="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
                  <div class="bg-[var(--vp-c-bg-soft)] rounded-md py-2 px-2.5 text-xs">
                    <div class="text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--vp-c-text-3)] mb-1">Native</div>
                    <code class="font-mono text-[var(--vp-c-text-2)] whitespace-nowrap">{{ bench.code.native }}</code>
                  </div>
                  <div class="bg-[var(--vp-c-bg-soft)] rounded-md py-2 px-2.5 text-xs">
                    <div class="text-[0.5625rem] font-semibold uppercase tracking-wide text-[var(--vp-c-text-3)] mb-1">collect-ts</div>
                    <code class="font-mono text-[var(--vp-c-text-2)] whitespace-nowrap">{{ bench.code.collectTs }}</code>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="mt-5 pt-3 text-xs text-[var(--vp-c-text-3)] flex justify-between">
        <span>Click row for code</span>
        <span>Vitest · Node v22 · <code class="font-mono text-[0.6875rem] px-1.5 py-0.5 bg-[var(--vp-c-bg-soft)] rounded">pnpm bench:docs</code></span>
      </div>
    </section>

    <!-- Act III: When Lazy Changes Everything -->
    <section v-if="earlyExitData" class="mb-16 pt-8 border-t border-[var(--vp-c-divider)]">
      <h3 class="text-2xl font-bold mb-7 text-[var(--vp-c-text-1)]">When Lazy Changes Everything</h3>

      <LazySpotlight
        :title="earlyExitData.title"
        :collect-prefix="earlyExitData.collectPrefix"
        :collect-suffix="earlyExitData.collectSuffix"
        :eager-items="earlyExitData.eagerItems"
        :lazy-items="earlyExitData.lazyItems"
        :eager-time="earlyExitData.eagerTime"
        :lazy-time="earlyExitData.lazyTime"
        :speedup="earlyExitData.speedup"
      />

      <div class="mt-5 text-[0.9375rem] text-[var(--vp-c-text-2)] p-4 bg-[var(--vp-c-bg-soft)] rounded-lg leading-relaxed">
        LazyCollection uses <code class="font-mono text-[0.9em] px-1.5 py-0.5 bg-[var(--vp-c-default-soft)] rounded">function*</code> under the hood. Same performance as
        hand-written generators, less code. Zero dependencies.
      </div>
    </section>

    <!-- Act IV: Choosing Your Tool -->
    <section class="mb-16 pt-8 border-t border-[var(--vp-c-divider)]">
      <h3 class="text-2xl font-bold mb-7 text-[var(--vp-c-text-1)]">Choosing Your Tool</h3>

      <table class="decision-matrix">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Best Choice</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in decisionMatrix" :key="row.scenario">
            <td>{{ row.scenario }}</td>
            <td class="choice"><code>{{ row.choice }}</code></td>
            <td class="reason">{{ row.reason }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
/* Table base styles */
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
thead { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vp-c-text-3); }
th { font-weight: 500; text-align: left; padding: 0.625rem 1rem; border-bottom: 1px solid var(--vp-c-divider); white-space: nowrap; }
th:first-child { width: 100%; }
th:nth-child(2), th:nth-child(3) { text-align: right; }
th:last-child { text-align: right; }
td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--vp-c-divider); vertical-align: middle; }
td:first-child { width: 100%; }

/* Interactive row */
.data-row {
  cursor: pointer;
  transition: background var(--bench-duration-fast) ease, box-shadow var(--bench-duration-fast) ease;
}
.data-row:hover {
  background: var(--vp-c-bg-soft);
  box-shadow: inset 3px 0 0 var(--doc-c-success);
}

/* Size button states */
.size-btn {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  border-right: 1px solid var(--vp-c-divider);
  transition: background var(--bench-duration-fast) ease, color var(--bench-duration-fast) ease;
}
.size-btn:last-child { border-right: none; }
.size-btn:hover { color: var(--vp-c-text-1); }
.size-btn.active { background: var(--vp-c-text-1); color: var(--vp-c-bg); }

/* Code row cell override */
.code-row td {
  padding: 0 0 0.625rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

/* Decision matrix overrides */
.decision-matrix th:first-child, .decision-matrix td:first-child { width: auto; }
.decision-matrix th { white-space: nowrap; }
.decision-matrix td { vertical-align: top; }
.decision-matrix td:first-child { min-width: 200px; }
.decision-matrix .choice { white-space: nowrap; }
.decision-matrix .choice code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  padding: 0.15em 0.4em;
  background: var(--doc-c-success-soft);
  color: var(--doc-c-success);
  border-radius: 4px;
  font-weight: 500;
}
.decision-matrix .reason { color: var(--vp-c-text-2); font-size: 0.85rem; min-width: 140px; }
</style>
