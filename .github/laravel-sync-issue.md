---
title: '🔄 Laravel Collection sync: action required'
labels: laravel-sync, documentation, automated
---

## Laravel Collection Sync Check

The weekly sync check found issues that need attention.

### Check Output

<details>
<summary>Full output</summary>

```
{{ env.SYNC_OUTPUT }}
```

</details>

### Action Required

**If Laravel baseline changed:**
1. Run `pnpm docs:sync` locally to update baseline
2. Review changes with `git diff scripts/docs/baseline/`
3. Commit: `git add scripts/docs/baseline/ && git commit -m "sync: update Laravel docs baseline"`

**If methods are missing:**
1. Implement missing methods in `src/Collection.ts` or `src/LazyCollection.ts`
2. Run `pnpm docs:check` to verify

**When done:**
- [ ] Run `pnpm docs:check` - should pass with ✅
- [ ] Close this issue

---

*Automatically created by [Laravel Sync workflow]({{ env.GITHUB_SERVER_URL }}/{{ env.GITHUB_REPOSITORY }}/actions/workflows/laravel-sync.yml) on {{ date | date('YYYY-MM-DD') }}*
