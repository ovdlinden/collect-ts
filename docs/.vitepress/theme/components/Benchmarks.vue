<script setup lang="ts">
import { computed, ref } from 'vue'
import benchmarkResults from '../data/benchmark-results.json'

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

const lazyBenchmarks = computed(() => {
  return (results.lazy || []).map((item) => {
    const generatorVsLazy = item.nativeGenerator.hz / item.lazyCollection.hz
    const lazyVsArray = item.lazyCollection.hz / (item.nativeArray.hz || 1)
    return {
      ...item,
      generatorVsLazy: generatorVsLazy.toFixed(1) + 'x',
      lazyVsArray: item.nativeArray.hz > 0 ? lazyVsArray.toFixed(0) + 'x' : 'N/A',
      lazyWins: item.lazyCollection.hz > item.nativeArray.hz,
    }
  })
})

const benchmarks = computed(() => {
  const sizeData = results[selectedSize.value] || []
  return sizeData.map((item) => {
    const speedupNum = parseFloat(item.speedup) || 0
    const isFaster = speedupNum >= 1
    const logValue = Math.log2(speedupNum || 1)
    const clampedLog = Math.max(-2, Math.min(2, logValue))
    const barWidth = Math.abs(clampedLog) / 2 * 50

    return {
      ...item,
      speedupNum,
      isFaster,
      barWidth,
      code: codeExamples[item.name] || { native: '', collectTs: '' },
    }
  })
})

function toggleExpand(name: string) {
  expandedOp.value = expandedOp.value === name ? null : name
}
</script>

<template>
  <div class="benchmarks">
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
                <span class="bar">
                  <span
                    :class="['bar-fill', bench.isFaster ? 'win' : 'lose']"
                    :style="{ width: bench.barWidth + '%' }"
                  ></span>
                </span>
                <span class="speedup-num">{{ bench.speedup }}</span>
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

    <!-- Lazy Benchmarks Section -->
    <div v-if="lazyBenchmarks.length > 0" class="lazy-section">
      <h3>LazyCollection vs Native Generators</h3>
      <p class="lazy-intro">
        When should you use <code>.lazy()</code>? Compare against hand-rolled <code>function*</code> pipelines.
      </p>

      <table class="lazy-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Native Generator</th>
            <th>LazyCollection</th>
            <th>Overhead</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bench in lazyBenchmarks" :key="bench.name">
            <td class="op">{{ bench.name }}</td>
            <td class="ops">{{ bench.nativeGenerator.ops }}</td>
            <td class="ops">{{ bench.lazyCollection.ops }}</td>
            <td class="overhead">{{ bench.generatorVsLazy }}</td>
          </tr>
        </tbody>
      </table>

      <div class="lazy-insight">
        <strong>Key insight:</strong> LazyCollection adds overhead vs hand-rolled generators,
        but provides a clean fluent API and full type safety. Both crush Native Array
        for early termination (1M+ times faster when exiting early).
      </div>
    </div>
  </div>
</template>

<style scoped>
.benchmarks {
  font-size: 0.9375rem;
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
}

.data-row:hover {
  background: var(--vp-c-bg-soft);
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
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.speedup.win {
  color: #059669;
}

.speedup.lose {
  color: #a1a1aa;
}

:global(.dark) .speedup.win {
  color: #34d399;
}

:global(.dark) .speedup.lose {
  color: #71717a;
}

.speedup-num {
  width: 2.5rem;
  text-align: right;
}

/* Bar visualization */
.bar {
  width: 32px;
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 2px;
  transition: width 0.2s;
}

.bar-fill.win {
  left: 50%;
  background: #059669;
}

.bar-fill.lose {
  right: 50%;
  background: #a1a1aa;
}

:global(.dark) .bar-fill.win {
  background: #34d399;
}

:global(.dark) .bar-fill.lose {
  background: #71717a;
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

@media (max-width: 480px) {
  .code-grid {
    grid-template-columns: 1fr;
  }

  .bar {
    display: none;
  }
}

/* Lazy Benchmarks Section */
.lazy-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.lazy-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.lazy-intro {
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.lazy-intro code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  padding: 0.125rem 0.375rem;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
}

.lazy-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.lazy-table thead {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
}

.lazy-table th {
  font-weight: 500;
  text-align: left;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.lazy-table th:first-child {
  width: 100%;
}

.lazy-table th:nth-child(2),
.lazy-table th:nth-child(3),
.lazy-table th:nth-child(4) {
  text-align: right;
}

.lazy-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.lazy-table .overhead {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8125rem;
  text-align: right;
  color: var(--vp-c-text-3);
}

.lazy-insight {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  line-height: 1.6;
}

.lazy-insight strong {
  color: var(--vp-c-text-1);
}
</style>
