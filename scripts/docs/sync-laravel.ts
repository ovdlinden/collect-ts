#!/usr/bin/env tsx
/**
 * Laravel Documentation Sync Script
 *
 * Fetches the latest collections.md from Laravel's docs repository,
 * converts PHP examples to TypeScript, and outputs to docs/collections.md
 *
 * Usage: pnpm docs:sync
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { convertMarkdown } from './php-to-ts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')
const DOCS_DIR = join(ROOT_DIR, 'docs')
const OUTPUT_FILE = join(DOCS_DIR, 'collections.md')

// Laravel docs source
const LARAVEL_DOCS_URL = 'https://raw.githubusercontent.com/laravel/docs/12.x/collections.md'
const LARAVEL_VERSION = '12.x'

interface SyncResult {
  success: boolean
  message: string
  stats?: {
    totalCodeBlocks: number
    convertedBlocks: number
    flaggedForReview: number
    reviewItems: Array<{ line: number; reason: string }>
  }
  diff?: {
    linesAdded: number
    linesRemoved: number
    methodsChanged: string[]
  }
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
 * Add VitePress frontmatter to the converted markdown
 */
function addFrontmatter(content: string): string {
  const frontmatter = `---
outline: deep
---

# Collections

`

  // Remove the existing title if present
  content = content.replace(/^#\s+Collections?\s*\n/, '')

  return frontmatter + content
}

/**
 * Add TypeScript-specific notes and adjustments
 */
function addTypeScriptNotes(content: string): string {
  // Add a note after the introduction
  const tsNote = `
::: tip TypeScript Port
This documentation is automatically synced from [Laravel's official documentation](https://laravel.com/docs/${LARAVEL_VERSION}/collections) with PHP examples converted to TypeScript. Some methods may have TypeScript-specific behavior noted below.
:::

`

  // Insert after the first paragraph
  const firstParaEnd = content.indexOf('\n\n', content.indexOf('# Collections'))
  if (firstParaEnd !== -1) {
    content = content.slice(0, firstParaEnd) + '\n' + tsNote + content.slice(firstParaEnd)
  }

  return content
}

/**
 * Fix Laravel-specific markdown syntax for VitePress
 */
function fixMarkdownSyntax(content: string): string {
  // Remove Laravel-specific class attributes like {.collection-method}
  content = content.replace(/\s*\{\.collection-method\}/g, '')
  content = content.replace(/\s*\{#[^}]+\}/g, '')

  // Convert Laravel note blocks to VitePress custom containers
  content = content.replace(
    /> \*\*Note\*\*\s*\n>(.*?)(?=\n\n|\n[^>]|$)/gs,
    (_, noteContent) => {
      const cleanContent = noteContent.replace(/^>\s*/gm, '').trim()
      return `::: info Note\n${cleanContent}\n:::`
    }
  )

  content = content.replace(
    /> \*\*Warning\*\*\s*\n>(.*?)(?=\n\n|\n[^>]|$)/gs,
    (_, noteContent) => {
      const cleanContent = noteContent.replace(/^>\s*/gm, '').trim()
      return `::: warning\n${cleanContent}\n:::`
    }
  )

  // Convert {tip} blocks
  content = content.replace(
    /\{tip\}(.*?)(?=\n\n)/gs,
    '::: tip\n$1\n:::'
  )

  // Fix internal links to work with our docs structure
  content = content.replace(
    /\[([^\]]+)\]\(\/docs\/[^)]+\/collections#([^)]+)\)/g,
    '[$1](#$2)'
  )

  // Fix links to other Laravel docs pages (make them external)
  content = content.replace(
    /\[([^\]]+)\]\(\/docs\/[^)]+\)/g,
    '[$1](https://laravel.com/docs/' + LARAVEL_VERSION + '/$2)'
  )

  return content
}

/**
 * Compare with existing file and detect changes
 */
function detectChanges(newContent: string, existingContent: string): {
  linesAdded: number
  linesRemoved: number
  methodsChanged: string[]
} {
  const newLines = newContent.split('\n')
  const existingLines = existingContent.split('\n')

  const linesAdded = newLines.filter(l => !existingLines.includes(l)).length
  const linesRemoved = existingLines.filter(l => !newLines.includes(l)).length

  // Find method headers that changed
  const methodRegex = /^####?\s+`(\w+)\(\)`/
  const newMethods = new Set(newLines.filter(l => methodRegex.test(l)).map(l => l.match(methodRegex)?.[1]))
  const existingMethods = new Set(existingLines.filter(l => methodRegex.test(l)).map(l => l.match(methodRegex)?.[1]))

  const methodsChanged: string[] = []
  for (const method of newMethods) {
    if (method && !existingMethods.has(method)) {
      methodsChanged.push(`+ ${method}()`)
    }
  }
  for (const method of existingMethods) {
    if (method && !newMethods.has(method)) {
      methodsChanged.push(`- ${method}()`)
    }
  }

  return { linesAdded, linesRemoved, methodsChanged }
}

/**
 * Main sync function
 */
async function sync(): Promise<SyncResult> {
  try {
    // Ensure docs directory exists
    if (!existsSync(DOCS_DIR)) {
      mkdirSync(DOCS_DIR, { recursive: true })
    }

    // Fetch Laravel docs
    const laravelDocs = await fetchLaravelDocs()
    console.log(`✅ Fetched ${laravelDocs.length.toLocaleString()} characters\n`)

    // Convert PHP to TypeScript
    console.log('🔄 Converting PHP code blocks to TypeScript...\n')
    const { content: converted, stats } = convertMarkdown(laravelDocs)

    // Add VitePress-specific content
    let finalContent = addFrontmatter(converted)
    finalContent = addTypeScriptNotes(finalContent)
    finalContent = fixMarkdownSyntax(finalContent)

    // Check for existing file and detect changes
    let diff = undefined
    if (existsSync(OUTPUT_FILE)) {
      const existing = readFileSync(OUTPUT_FILE, 'utf-8')
      diff = detectChanges(finalContent, existing)
    }

    // Write output
    writeFileSync(OUTPUT_FILE, finalContent, 'utf-8')

    console.log('📊 Conversion Statistics:')
    console.log(`   Total code blocks: ${stats.totalCodeBlocks}`)
    console.log(`   Converted: ${stats.convertedBlocks}`)
    console.log(`   Flagged for review: ${stats.flaggedForReview}`)

    if (stats.reviewItems.length > 0) {
      console.log('\n⚠️  Items needing manual review:')
      for (const item of stats.reviewItems.slice(0, 10)) {
        console.log(`   Line ${item.line}: ${item.reason}`)
      }
      if (stats.reviewItems.length > 10) {
        console.log(`   ... and ${stats.reviewItems.length - 10} more`)
      }
    }

    if (diff) {
      console.log('\n📝 Changes detected:')
      console.log(`   Lines added: ${diff.linesAdded}`)
      console.log(`   Lines removed: ${diff.linesRemoved}`)
      if (diff.methodsChanged.length > 0) {
        console.log('   Methods changed:')
        for (const method of diff.methodsChanged) {
          console.log(`     ${method}`)
        }
      }
    }

    console.log(`\n✅ Output written to: ${OUTPUT_FILE}\n`)

    return {
      success: true,
      message: 'Documentation synced successfully',
      stats,
      diff
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    return {
      success: false,
      message
    }
  }
}

// Run if executed directly
sync().then(result => {
  if (!result.success) {
    process.exit(1)
  }
})

export { sync, fetchLaravelDocs, addFrontmatter, addTypeScriptNotes, fixMarkdownSyntax }
