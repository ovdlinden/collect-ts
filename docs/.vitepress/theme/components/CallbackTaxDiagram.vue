<script setup lang="ts">
// Educational diagram showing callback overhead vs direct property access
</script>

<template>
  <div class="flex flex-col gap-4 my-6">
    <!-- Native Section -->
    <div class="flex flex-col gap-2">
      <div class="font-mono text-xs font-semibold tracking-wide text-neutral">NATIVE</div>
      <div class="section-box native-box p-4 rounded-lg border border-[var(--vp-c-divider)] bg-[var(--vp-c-bg-soft)] dark:bg-[var(--vp-c-bg-alt)]">
        <div class="flex items-center gap-2 flex-wrap font-mono text-[0.9rem] text-[var(--vp-c-text-1)]">
          <span>item</span>
          <span class="text-[var(--vp-c-text-3)]">→</span>
          <span class="callback-box py-1 px-3 border border-dashed border-neutral rounded bg-neutral-soft text-neutral text-[0.85rem]">callback</span>
          <span class="text-[var(--vp-c-text-3)]">→</span>
          <span>result</span>
          <span class="text-neutral ml-2">× N times</span>
        </div>
        <div class="font-mono text-xs mt-2 text-neutral">
          ↓ stack frame + closure capture per call
        </div>
      </div>
    </div>

    <!-- Collect-TS Section -->
    <div class="flex flex-col gap-2">
      <div class="font-mono text-xs font-semibold tracking-wide text-success">COLLECT-TS</div>
      <div class="collectts-box p-4 rounded-lg border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)] bg-success-soft dark:bg-[color-mix(in_srgb,var(--color-success-soft)_60%,transparent)]">
        <div class="flex items-center gap-2 flex-wrap font-mono text-[0.9rem] text-[var(--vp-c-text-1)]">
          <span><span class="text-accent">for</span> <span class="text-[var(--vp-c-text-3)]">(</span>item <span class="text-accent">of</span> items<span class="text-[var(--vp-c-text-3)]">)</span> sum += item.value</span>
        </div>
        <div class="font-mono text-xs mt-2 text-success">
          ↓ zero function overhead
        </div>
      </div>
    </div>
  </div>
</template>
