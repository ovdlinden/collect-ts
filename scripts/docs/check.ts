#!/usr/bin/env tsx
/**
 * Documentation Change Detection Script
 *
 * Compares our TypeScript documentation with Laravel's PHP documentation
 * to detect new methods, removed methods, and changes.
 *
 * Usage: pnpm docs:check
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCollectionsDocs, compareDocumentation, generateDocsHash, type DocChanges } from './parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')
const DOCS_DIR = join(ROOT_DIR, 'docs')
const CACHE_DIR = join(__dirname, 'cache')
const OUR_DOCS_FILE = join(DOCS_DIR, 'collections.md')
const CACHE_FILE = join(CACHE_DIR, 'laravel-hash.json')

// Laravel docs source
const LARAVEL_DOCS_URL = 'https://raw.githubusercontent.com/laravel/docs/12.x/collections.md'
const LARAVEL_VERSION = '12.x'

interface CacheData {
  hash: string
  checkedAt: string
  laravelVersion: string
}

interface CheckResult {
  hasChanges: boolean
  changes: DocChanges
  laravelHash: string
  ourHash: string
  cacheHit: boolean
}

/**
 * Fetch the Laravel documentation from GitHub
 */
async function fetchLaravelDocs(): Promise<string> {
  console.log(`\n📥 Fetching Laravel ${LARAVEL_VERSION} documentation...`)
  console.log(`   Source: ${LARAVEL_DOCS_URL}\n`)

  const response = await fetch(LARAVEL_DOCS_URL)

  if (!response.ok) {
    throw new Error(`Failed to fetch documentation: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

/**
 * Load cached hash data
 */
function loadCache(): CacheData | null {
  if (!existsSync(CACHE_FILE)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
  } catch {
    return null
  }
}

/**
 * Save hash data to cache
 */
function saveCache(data: CacheData): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }
  writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2))
}

/**
 * Format a diff preview for description changes
 */
function formatDiffPreview(oldText: string, newText: string, maxLen = 80): string {
  const oldPreview = oldText.length > maxLen ? oldText.slice(0, maxLen) + '...' : oldText
  const newPreview = newText.length > maxLen ? newText.slice(0, maxLen) + '...' : newText

  if (oldPreview === newPreview) {
    return '(whitespace/formatting changes)'
  }

  return `\n      - "${oldPreview}"\n      + "${newPreview}"`
}

/**
 * Print the check results in a nice format
 */
function printResults(result: CheckResult): void {
  const { changes, hasChanges, cacheHit } = result

  console.log('\n' + '='.repeat(60))
  console.log('📊 Documentation Sync Check Results')
  console.log('='.repeat(60))

  if (cacheHit) {
    console.log('\n💾 Using cached Laravel docs hash (no changes since last check)')
  }

  // Summary stats
  const totalChanges =
    changes.newMethods.length +
    changes.removedMethods.length +
    changes.changedDescriptions.length +
    changes.changedExamples.length

  console.log(`\n✅ ${changes.unchangedCount} methods unchanged`)

  if (!hasChanges) {
    console.log('\n🎉 Documentation is in sync with Laravel!')
    console.log('='.repeat(60) + '\n')
    return
  }

  console.log(`⚠️  ${totalChanges} change(s) detected\n`)

  // New methods
  if (changes.newMethods.length > 0) {
    console.log(`\n🆕 New in Laravel (${changes.newMethods.length}):`)
    for (const method of changes.newMethods) {
      const desc = method.description.length > 60
        ? method.description.slice(0, 60) + '...'
        : method.description
      console.log(`   • ${method.name}() - "${desc}"`)
    }
  }

  // Removed methods
  if (changes.removedMethods.length > 0) {
    console.log(`\n🗑️  Removed from Laravel (${changes.removedMethods.length}):`)
    for (const name of changes.removedMethods) {
      console.log(`   • ${name}()`)
    }
  }

  // Changed descriptions
  if (changes.changedDescriptions.length > 0) {
    console.log(`\n📝 Descriptions changed (${changes.changedDescriptions.length}):`)
    for (const change of changes.changedDescriptions) {
      console.log(`   • ${change.name}()${formatDiffPreview(change.oldDescription, change.newDescription)}`)
    }
  }

  // Changed examples
  if (changes.changedExamples.length > 0) {
    console.log(`\n💻 Examples changed (${changes.changedExamples.length}):`)
    for (const change of changes.changedExamples) {
      const oldCount = change.oldExamples.filter(e => e.language === 'php').length
      const newCount = change.newExamples.filter(e => e.language === 'php').length
      console.log(`   • ${change.name}() - PHP examples: ${oldCount} → ${newCount}`)
    }
  }

  console.log('\n' + '-'.repeat(60))
  console.log('💡 Run `pnpm docs:update` to apply these changes with Claude')
  console.log('='.repeat(60) + '\n')
}

/**
 * Main check function
 */
async function check(): Promise<CheckResult> {
  try {
    // Check if our docs exist
    if (!existsSync(OUR_DOCS_FILE)) {
      console.log('\n⚠️  Our documentation does not exist yet.')
      console.log('   Run `pnpm docs:convert` first to create initial TypeScript docs.\n')

      // Still fetch and parse Laravel docs to show what we'd need
      const laravelMarkdown = await fetchLaravelDocs()
      const laravelDocs = parseCollectionsDocs(laravelMarkdown)

      console.log(`📊 Laravel has ${laravelDocs.methods.size} documented methods`)

      return {
        hasChanges: true,
        changes: {
          newMethods: Array.from(laravelDocs.methods.values()),
          removedMethods: [],
          changedDescriptions: [],
          changedExamples: [],
          unchangedCount: 0
        },
        laravelHash: generateDocsHash(laravelDocs),
        ourHash: '',
        cacheHit: false
      }
    }

    // Load our docs
    console.log('📖 Loading our TypeScript documentation...')
    const ourMarkdown = readFileSync(OUR_DOCS_FILE, 'utf-8')
    const ourDocs = parseCollectionsDocs(ourMarkdown)
    const ourHash = generateDocsHash(ourDocs)
    console.log(`   Found ${ourDocs.methods.size} methods\n`)

    // Check cache to see if Laravel docs changed
    const cache = loadCache()

    // Fetch Laravel docs
    const laravelMarkdown = await fetchLaravelDocs()
    const laravelDocs = parseCollectionsDocs(laravelMarkdown)
    const laravelHash = generateDocsHash(laravelDocs)
    console.log(`✅ Found ${laravelDocs.methods.size} methods in Laravel docs\n`)

    // Check if Laravel docs are unchanged since last check
    const cacheHit = cache?.hash === laravelHash && cache?.laravelVersion === LARAVEL_VERSION

    if (cacheHit) {
      console.log('💾 Laravel docs unchanged since last check')
    }

    // Compare documentation
    console.log('🔍 Comparing documentation...')
    const changes = compareDocumentation(ourDocs, laravelDocs)

    const hasChanges =
      changes.newMethods.length > 0 ||
      changes.removedMethods.length > 0 ||
      changes.changedDescriptions.length > 0 ||
      changes.changedExamples.length > 0

    // Update cache
    saveCache({
      hash: laravelHash,
      checkedAt: new Date().toISOString(),
      laravelVersion: LARAVEL_VERSION
    })

    const result: CheckResult = {
      hasChanges,
      changes,
      laravelHash,
      ourHash,
      cacheHit
    }

    printResults(result)

    return result

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    throw error
  }
}

// Export for programmatic use
export { check, fetchLaravelDocs, type CheckResult }

// Run if executed directly
check().catch(() => {
  process.exit(1)
})
