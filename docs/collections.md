---
outline: false
---

# Collections

::: tip Page Moved
The Collection API reference has been reorganized for easier navigation.

**[Go to the new API Reference →](/api/)**
:::

## Quick Links

- [Collection](/api/classes/Collection): All Collection methods
- [LazyCollection](/api/classes/LazyCollection): Lazy evaluation for large datasets
- [AsyncLazyCollection](/api/classes/AsyncLazyCollection): Async iteration support

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

onMounted(() => {
  const router = useRouter()
  // Auto-redirect after 3 seconds
  setTimeout(() => {
    router.go('/api/')
  }, 3000)
})
</script>
