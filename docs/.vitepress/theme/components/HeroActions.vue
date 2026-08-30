<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const managers = [
  { id: 'bun', label: 'bun', cmd: 'bun add collect-ts' },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add collect-ts' },
  { id: 'npm', label: 'npm', cmd: 'npm install collect-ts' },
  { id: 'yarn', label: 'yarn', cmd: 'yarn add collect-ts' },
  { id: 'jsr', label: 'jsr', cmd: 'npx jsr add @ovdlinden/collect-ts' },
]

const STORAGE_KEY = 'collect-ts-pkg-manager'
const active = ref('bun')
const copied = ref(false)

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && managers.some(m => m.id === saved)) {
      active.value = saved
    }
  } catch {}
})

function select(id: string) {
  active.value = id
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

async function copy() {
  const cmd = managers.find(m => m.id === active.value)?.cmd
  if (cmd) {
    await navigator.clipboard.writeText(cmd)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
}

const activeCmd = computed(() => managers.find(m => m.id === active.value)?.cmd ?? '')
</script>

<template>
  <div class="flex flex-col gap-2.5 mt-6">
    <div class="flex items-center gap-3 flex-wrap max-sm:flex-col max-sm:items-stretch">
      <div class="command-box inline-flex items-center gap-2 py-2.5 px-3.5 bg-[var(--vp-c-bg-soft)] border border-[var(--vp-c-divider)] rounded-full transition-colors duration-150 hover:border-primary max-sm:justify-center">
        <span class="text-success font-mono font-semibold text-[0.9rem] select-none">$</span>
        <code class="font-mono text-[0.9rem] text-[var(--vp-c-text-1)] bg-transparent whitespace-nowrap">{{ activeCmd }}</code>
        <button
          class="flex items-center justify-center size-6.5 bg-transparent border-none text-[var(--vp-c-text-3)] cursor-pointer rounded transition-colors duration-150 hover:text-[var(--vp-c-text-1)]"
          :class="copied && 'text-success'"
          @click="copy"
          :aria-label="copied ? 'Copied!' : 'Copy'"
        >
          <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </button>
      </div>
      <a href="/collections/" class="inline-flex items-center py-2.5 px-5 text-[0.9rem] font-medium text-[var(--vp-c-text-1)] bg-[var(--vp-c-default-soft)] rounded-full no-underline transition-colors duration-150 hover:bg-[var(--vp-c-default-3)] max-sm:justify-center">
        View Docs
      </a>
    </div>
    <div class="flex gap-2 max-sm:justify-center">
      <button
        v-for="m in managers"
        :key="m.id"
        class="py-0.5 px-0 text-xs font-medium bg-transparent border-none cursor-pointer transition-colors duration-150"
        :class="active === m.id ? 'text-[var(--vp-c-text-1)]' : 'text-[var(--vp-c-text-3)] hover:text-[var(--vp-c-text-2)]'"
        @click="select(m.id)"
      >
        {{ m.label }}
      </button>
    </div>
  </div>
</template>
