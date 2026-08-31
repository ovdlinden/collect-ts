<script setup lang="ts">
import benchmarkData from '../data/benchmark-results.json';

// Find the best speedup across all benchmarks (excluding lazy which is a different category)
function getBestSpeedup(): string {
  let best = 0;

  for (const [size, benchmarks] of Object.entries(benchmarkData)) {
    if (size === 'lazy') continue;

    for (const bench of benchmarks as Array<{ speedup: string }>) {
      const speedup = parseFloat(bench.speedup);
      if (speedup > best) {
        best = speedup;
      }
    }
  }

  // Round to one decimal place
  return best.toFixed(1).replace(/\.0$/, '');
}

const speedup = getBestSpeedup();
</script>

<template>
  <span>{{ speedup }}×</span>
</template>
