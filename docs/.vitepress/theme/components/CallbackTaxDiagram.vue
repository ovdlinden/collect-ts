<script setup lang="ts">
// Educational diagram showing callback overhead vs direct property access
</script>

<template>
  <div class="callback-tax-diagram">
    <!-- Native Section -->
    <div class="section">
      <div class="section-label native-label">NATIVE</div>
      <div class="section-box native-box">
        <div class="flow">
          <span class="code">item</span>
          <span class="arrow">→</span>
          <span class="callback-box">callback</span>
          <span class="arrow">→</span>
          <span class="code">result</span>
          <span class="repeat">× N times</span>
        </div>
        <div class="explanation native-explanation">
          ↓ stack frame + closure capture per call
        </div>
      </div>
    </div>

    <!-- Collect-TS Section -->
    <div class="section">
      <div class="section-label collectts-label">COLLECT-TS</div>
      <div class="section-box collectts-box">
        <div class="flow">
          <span class="code"><span class="keyword">for</span> <span class="punct">(</span>item <span class="keyword">of</span> items<span class="punct">)</span> sum += item.value</span>
        </div>
        <div class="explanation collectts-explanation">
          ↓ zero function overhead
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.callback-tax-diagram {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1.5rem 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.native-label {
  color: var(--doc-c-neutral);
}

.collectts-label {
  color: var(--doc-c-success);
}

.section-box {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.collectts-box {
  background: var(--doc-c-success-soft);
  border-color: color-mix(in srgb, var(--doc-c-success) 30%, transparent);
}

.flow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
}

.code {
  color: var(--vp-c-text-1);
}

.keyword {
  color: var(--doc-c-accent);
}

.punct {
  color: var(--vp-c-text-3);
}

.arrow {
  color: var(--vp-c-text-3);
}

.callback-box {
  padding: 0.25rem 0.75rem;
  border: 1px dashed var(--doc-c-neutral);
  border-radius: 4px;
  background: var(--doc-c-neutral-soft);
  color: var(--doc-c-neutral);
  font-size: 0.85rem;
}

.repeat {
  color: var(--doc-c-neutral);
  margin-left: 0.5rem;
}

.explanation {
  font-family: var(--vp-font-family-mono);
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.native-explanation {
  color: var(--doc-c-neutral);
}

.collectts-explanation {
  color: var(--doc-c-success);
}

/* Dark mode */
:global(.dark) .section-box {
  background: var(--vp-c-bg-alt);
}

:global(.dark) .collectts-box {
  background: color-mix(in srgb, var(--doc-c-success-soft) 60%, transparent);
}
</style>
