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
  <div class="hero-actions">
    <div class="actions-row">
      <div class="command-box">
        <span class="prompt">$</span>
        <code class="cmd">{{ activeCmd }}</code>
        <button
          class="copy-btn"
          :class="{ copied }"
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
      <a href="/collections/" class="docs-link">View Docs</a>
    </div>
    <div class="tabs">
      <button
        v-for="m in managers"
        :key="m.id"
        :class="['tab', { active: active === m.id }]"
        @click="select(m.id)"
      >
        {{ m.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.5rem;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.command-box {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.875rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 24px;
  transition: border-color 0.15s;
}

.command-box:hover {
  border-color: var(--vp-c-brand-1);
}

.prompt {
  color: var(--doc-c-success);
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  font-size: 0.9rem;
  user-select: none;
}

.cmd {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  background: none;
  white-space: nowrap;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: none;
  border: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s;
}

.copy-btn:hover {
  color: var(--vp-c-text-1);
}

.copy-btn.copied {
  color: var(--doc-c-success);
}

.docs-link {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: var(--vp-c-default-soft);
  border-radius: 24px;
  text-decoration: none;
  transition: background 0.15s;
}

.docs-link:hover {
  background: var(--vp-c-default-3);
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  padding: 0.2rem 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}

.tab:hover {
  color: var(--vp-c-text-2);
}

.tab.active {
  color: var(--vp-c-text-1);
}

@media (max-width: 540px) {
  .actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .command-box {
    justify-content: center;
  }

  .docs-link {
    justify-content: center;
  }

  .tabs {
    justify-content: center;
  }
}
</style>
