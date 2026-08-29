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
  <div class="performance-story">
    <!-- Act I: The Callback Tax -->
    <section class="story-section callback-tax">
      <p class="intro-text">
        Every time you write <code>.reduce((acc, x) => ...)</code>, you pay a toll. V8 can't inline
        that arrow function — it builds a stack frame, captures closure variables, and invokes your
        callback for every single element.
      </p>
      <CallbackTaxDiagram />
      <p class="insight-text">
        <code>sum('value')</code> avoids 10,000 function calls. That's the entire speedup.
      </p>
    </section>

    <!-- Act II: String Keys Beat Callbacks -->
    <section class="story-section eager-benchmarks">
      <h3>String Keys Beat Callbacks</h3>

      <!-- Hero Stats -->
      <div v-if="heroMetrics.length" class="hero-stats">
        <StatCard
          v-for="metric in heroMetrics"
          :key="metric.operation"
          :operation="metric.operation"
          :speedup="metric.speedup"
          :context="metric.context"
        />
      </div>

      <!-- Controls -->
      <div class="controls">
        <span class="label">Array size</span>
        <div class="size-toggle">
          <button
            v-for="size in sizes"
            :key="size"
            :class="['size-btn', { active: selectedSize === size }]"
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
              <td class="op">{{ bench.name }}</td>
              <td class="ops">{{ bench.native.ops }}</td>
              <td class="ops">{{ bench.collectTs.ops }}</td>
              <td class="speedup-cell">
                <span :class="['speedup', bench.isFaster ? 'win' : 'lose']">
                  <SpeedupBar :speedup="bench.speedupNum" />
                  <span class="speedup-num">{{ bench.speedupNum.toFixed(1) }}×</span>
                </span>
              </td>
            </tr>
            <tr v-if="expandedOp === bench.name" class="code-row">
              <td colspan="4">
                <div class="code-grid">
                  <div class="code-block">
                    <div class="code-label">Native</div>
                    <code>{{ bench.code.native }}</code>
                  </div>
                  <div class="code-block">
                    <div class="code-label">collect-ts</div>
                    <code>{{ bench.code.collectTs }}</code>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="footer">
        <span>Click row for code</span>
        <span>Vitest · Node v22 · <code>pnpm bench:docs</code></span>
      </div>
    </section>

    <!-- Act III: When Lazy Changes Everything -->
    <section v-if="earlyExitData" class="story-section lazy-benchmarks">
      <h3>When Lazy Changes Everything</h3>

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

      <div class="lazy-insight">
        LazyCollection uses <code>function*</code> under the hood. Same performance as
        hand-written generators, less code. Zero dependencies.
      </div>
    </section>

    <!-- Act IV: Choosing Your Tool -->
    <section class="story-section decision-guide">
      <h3>Choosing Your Tool</h3>

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
.performance-story {
  font-size: 0.9375rem;
}

/* Story sections */
.story-section {
  margin-bottom: 4rem;
}

.story-section h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.75rem;
  color: var(--vp-c-text-1);
}

/* Act I: Callback Tax */
.callback-tax {
  margin-bottom: 2.5rem;
}

.intro-text {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.intro-text code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: var(--vp-c-default-soft);
  border-radius: 4px;
}

.insight-text {
  font-size: 0.95rem;
  color: var(--doc-c-success);
  font-weight: 500;
  margin-top: 1rem;
}

.insight-text code {
  font-family: var(--vp-font-family-mono);
  background: var(--doc-c-success-soft);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

/* Hero Stats */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2.5rem;
}

/* Controls */
.controls {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-bottom: 1.5rem;
  font-size: 0.8125rem;
  color: var(--vp-c-text-3);
}

.size-toggle {
  display: inline-flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}

.size-btn {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  padding: 0.375rem 0.5rem;
  border: none;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-right: 1px solid var(--vp-c-divider);
  transition: background var(--bench-duration-fast) ease,
              color var(--bench-duration-fast) ease;
}

.size-btn:last-child {
  border-right: none;
}

.size-btn:hover {
  color: var(--vp-c-text-1);
}

.size-btn.active {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
}

/* Table */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

thead {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

th {
  font-weight: 500;
  text-align: left;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

th:first-child {
  width: 100%;
}

th:nth-child(2),
th:nth-child(3) {
  text-align: right;
}

th:last-child {
  text-align: right;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

td:first-child {
  width: 100%;
}

.data-row {
  cursor: pointer;
  transition: background var(--bench-duration-fast) ease,
              box-shadow var(--bench-duration-fast) ease;
}

.data-row:hover {
  background: var(--vp-c-bg-soft);
  box-shadow: inset 3px 0 0 var(--doc-c-success);
}

.op {
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  font-size: 0.875rem;
}

.ops {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  text-align: right;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.speedup-cell {
  text-align: right;
}

.speedup {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
}

.speedup.win {
  color: var(--doc-c-success);
}

.speedup.lose {
  color: var(--doc-c-neutral);
}

.speedup-num {
  width: 3rem;
  text-align: right;
  font-size: 0.9375rem;
}

/* Code row */
.code-row td {
  padding: 0 0 0.625rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.code-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.code-block {
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
}

.code-label {
  font-size: 0.5625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin-bottom: 0.25rem;
}

.code-block code {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

/* Footer */
.footer {
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  display: flex;
  justify-content: space-between;
}

.footer code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

/* Lazy Section */
.lazy-benchmarks {
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.lazy-insight {
  margin-top: 1.25rem;
  font-size: 0.9375rem;
  color: var(--vp-c-text-2);
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  line-height: 1.6;
}

.lazy-insight code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg-alt);
  border-radius: 4px;
}

/* Decision Matrix */
.decision-guide {
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

/* Override generic table styles for decision matrix - needs balanced columns */
.decision-matrix th:first-child,
.decision-matrix td:first-child {
  width: auto;
}

.decision-matrix th {
  white-space: nowrap;
}

.decision-matrix td {
  vertical-align: top;
}

.decision-matrix td:first-child {
  min-width: 200px;
}

.decision-matrix .choice {
  white-space: nowrap;
}

.decision-matrix .choice code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85em;
  padding: 0.15em 0.4em;
  background: var(--doc-c-success-soft);
  color: var(--doc-c-success);
  border-radius: 4px;
  font-weight: 500;
}

.decision-matrix .reason {
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  min-width: 140px;
}

/* Responsive */
@media (max-width: 640px) {
  .hero-stats {
    grid-template-columns: 1fr;
  }

  .code-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
