---
layout: home

hero:
  name: Laravel Collection
  text: for TypeScript
  tagline: Same API. Faster than native. Zero dependencies.
  actions:
    - theme: brand
      text: Get Started
      link: /00-quickstart
    - theme: alt
      text: View on GitHub
      link: https://github.com/ovdlinden/collect-ts
---

<div class="showcase">

<div class="transformation">
  <div class="code-panel before">

```javascript
const result = users
  .filter(u => u.active)
  .map(u => u.email)
  .reduce((acc, email) => {
    if (!acc.includes(email)) acc.push(email);
    return acc;
  }, []);
```

  </div>
  <div class="arrow">→</div>
  <div class="code-panel after">

```typescript
collect(users)
  .where('active', true)
  .pluck('email')
  .unique()
  .all();
```

  </div>
</div>

<div class="benefits">
  <div class="benefit">
    <span class="benefit-value">60%</span>
    <span class="benefit-label">less code</span>
  </div>
  <div class="benefit">
    <span class="benefit-value">3×</span>
    <span class="benefit-label">faster</span>
  </div>
  <div class="benefit">
    <span class="benefit-value">0</span>
    <span class="benefit-label">dependencies</span>
  </div>
</div>

<LazySpotlight
  title="Early exit with .lazy()"
  collect-prefix="collect(items)"
  collect-suffix=".where('active', true).take(10)"
  eager-items="1,000,000 items processed"
  lazy-items="~10 items processed"
  eager-time="~17ms"
  lazy-time="~1μs"
  :speedup="33000"
/>

<div class="quick-links">
  <a href="/00-quickstart" class="quick-link">
    <span class="link-title">Quick Start</span>
    <span class="link-desc">Install in 2 minutes</span>
  </a>
  <a href="/collections/" class="quick-link">
    <span class="link-title">155+ Methods</span>
    <span class="link-desc">Full API reference</span>
  </a>
  <a href="/05-benchmarks" class="quick-link">
    <span class="link-title">Benchmarks</span>
    <span class="link-desc">Performance deep dive</span>
  </a>
</div>

</div>

<style>
.showcase {
  max-width: 880px;
  margin: 0 auto;
  padding: 0 1rem;
}

.transformation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.arrow {
  font-size: 2rem;
  color: var(--doc-c-success);
  font-weight: 300;
}

.code-panel {
  border-radius: 12px;
  overflow: hidden;
}

.code-panel.before {
  opacity: 0.5;
  border: 1px solid var(--vp-c-divider);
}

.code-panel.after {
  border: 2px solid var(--doc-c-success);
  box-shadow: 0 0 24px color-mix(in srgb, var(--doc-c-success) 20%, transparent);
}

.code-panel div[class*="language-"] {
  margin: 0 !important;
  border-radius: 0 !important;
}

.code-panel .lang {
  display: none !important;
}

.benefits {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
}

.benefit {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.benefit-value {
  font-size: 2rem;
  font-weight: 700;
  font-family: var(--vp-font-family-mono);
  color: var(--doc-c-success);
  line-height: 1;
}

.benefit-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.quick-link {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s;
}

.quick-link:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}

.link-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.link-desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  text-decoration: none !important;
}

.quick-link:hover .link-desc {
  text-decoration: none !important;
}

@media (max-width: 768px) {
  .transformation {
    grid-template-columns: 1fr;
  }
  
  .arrow {
    transform: rotate(90deg);
    justify-self: center;
  }

  .quick-links {
    grid-template-columns: 1fr;
  }
}
</style>
