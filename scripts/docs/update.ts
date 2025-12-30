#!/usr/bin/env tsx
/**
 * Documentation Update Script
 *
 * Applies detected changes from Laravel docs to our TypeScript documentation
 * using Claude API for intelligent updates.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-xxx pnpm docs:update
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --yes        Auto-confirm all changes (non-interactive)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { parseCollectionsDocs, compareDocumentation, type MethodDoc, type DocChanges } from './parser.js'
import { check, fetchLaravelDocs, type CheckResult } from './check.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')
const DOCS_DIR = join(ROOT_DIR, 'docs')
const OUTPUT_FILE = join(DOCS_DIR, 'collections.md')

// API configuration
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

interface UpdateResult {
  method: string
  type: 'new' | 'description' | 'examples' | 'removed'
  applied: boolean
  preview?: string
}

/**
 * Call Claude API
 */
async function callClaudeAPI(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error: ${response.status} - ${error}`)
  }

  const data = await response.json() as { content: Array<{ text: string }> }
  return data.content[0].text
}

/**
 * Prompt user for confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(`${message} (y/n) `, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Convert a new Laravel method to TypeScript
 */
async function convertNewMethod(method: MethodDoc, dryRun: boolean): Promise<string> {
  if (dryRun) {
    return `[DRY RUN] Would convert ${method.name}()`
  }

  const prompt = `Convert this new Laravel Collection method documentation to TypeScript.

Method: ${method.name}()
Anchor: ${method.anchor}

Full Documentation:
${method.rawMarkdown}

Rules:
1. Keep the same markdown structure (anchor, heading, description)
2. Convert PHP code blocks to TypeScript:
   - collect() → new Collection()
   - -> to .
   - fn($x) => $x → (x) => x
   - Remove $ from variables
   - Convert PHP arrays to JS arrays/objects
3. Convert output comments: /* array:2 {...} */ → // [...]
4. Add appropriate TypeScript types where clear

Return the complete method documentation in markdown format, ready to insert.`

  return await callClaudeAPI(prompt)
}

/**
 * Update a method's description based on Laravel changes
 */
async function updateDescription(
  methodName: string,
  ourMarkdown: string,
  newDescription: string,
  dryRun: boolean
): Promise<string> {
  if (dryRun) {
    return ourMarkdown // Return unchanged for dry run
  }

  const prompt = `Update this TypeScript documentation to reflect Laravel's updated description.

Method: ${methodName}()

Current TypeScript documentation:
${ourMarkdown}

Laravel's new description:
"${newDescription}"

Rules:
1. Only update the description text, keep code examples unchanged
2. Adapt the wording if needed for TypeScript context
3. Keep the markdown structure intact

Return the complete updated method documentation.`

  return await callClaudeAPI(prompt)
}

/**
 * Update a method's examples based on Laravel changes
 */
async function updateExamples(
  methodName: string,
  ourMarkdown: string,
  laravelMarkdown: string,
  dryRun: boolean
): Promise<string> {
  if (dryRun) {
    return ourMarkdown
  }

  const prompt = `Update the code examples in this TypeScript documentation based on Laravel's changes.

Method: ${methodName}()

Current TypeScript documentation:
${ourMarkdown}

Laravel's updated PHP documentation:
${laravelMarkdown}

Rules:
1. Convert any new PHP examples to TypeScript
2. Remove examples that Laravel removed
3. Update examples that changed
4. Keep the markdown structure
5. Apply TypeScript conversion rules:
   - collect() → new Collection()
   - -> to .
   - fn($x) => $x → (x) => x
   - PHP arrays to JS arrays/objects
   - Output comments: /* array:2 {...} */ → // [...]

Return the complete updated method documentation.`

  return await callClaudeAPI(prompt)
}

/**
 * Find method section in markdown
 */
function findMethodSection(markdown: string, methodName: string): { start: number; end: number } | null {
  const anchorPattern = new RegExp(`<a name="method-${methodName}"></a>`, 'i')
  const match = markdown.match(anchorPattern)

  if (!match || match.index === undefined) {
    return null
  }

  const start = match.index

  // Find the next method anchor or end of file
  const nextAnchor = markdown.indexOf('<a name="method-', start + 1)
  const end = nextAnchor !== -1 ? nextAnchor : markdown.length

  return { start, end }
}

/**
 * Apply updates to the documentation file
 */
async function applyUpdates(
  changes: DocChanges,
  dryRun: boolean,
  autoConfirm: boolean
): Promise<UpdateResult[]> {
  const results: UpdateResult[] = []

  if (!existsSync(OUTPUT_FILE)) {
    console.error('❌ Documentation file not found. Run `pnpm docs:convert` first.')
    process.exit(1)
  }

  let markdown = readFileSync(OUTPUT_FILE, 'utf-8')
  let modified = false

  // Handle new methods
  if (changes.newMethods.length > 0) {
    console.log('\n📝 Processing new methods...\n')

    for (const method of changes.newMethods) {
      console.log(`   🆕 ${method.name}()`)

      const shouldApply = autoConfirm || await confirm(`   Add ${method.name}()?`)

      if (shouldApply) {
        const converted = await convertNewMethod(method, dryRun)

        if (!dryRun) {
          // Insert before the closing of the document
          // Find the last method and insert after it
          const insertPoint = markdown.lastIndexOf('\n\n')
          markdown = markdown.slice(0, insertPoint) + '\n\n' + converted + markdown.slice(insertPoint)
          modified = true
        }

        results.push({
          method: method.name,
          type: 'new',
          applied: true,
          preview: converted.slice(0, 200) + '...'
        })
        console.log(`      ✅ Added`)
      } else {
        results.push({ method: method.name, type: 'new', applied: false })
        console.log(`      ⏭️  Skipped`)
      }
    }
  }

  // Handle removed methods
  if (changes.removedMethods.length > 0) {
    console.log('\n🗑️  Processing removed methods...\n')

    for (const methodName of changes.removedMethods) {
      console.log(`   🗑️  ${methodName}()`)

      const shouldRemove = autoConfirm || await confirm(`   Remove ${methodName}()?`)

      if (shouldRemove && !dryRun) {
        const section = findMethodSection(markdown, methodName)
        if (section) {
          markdown = markdown.slice(0, section.start) + markdown.slice(section.end)
          modified = true
          results.push({ method: methodName, type: 'removed', applied: true })
          console.log(`      ✅ Removed`)
        }
      } else {
        results.push({ method: methodName, type: 'removed', applied: false })
        console.log(`      ⏭️  Skipped`)
      }
    }
  }

  // Handle description changes
  if (changes.changedDescriptions.length > 0) {
    console.log('\n📝 Processing description changes...\n')

    for (const change of changes.changedDescriptions) {
      console.log(`   📝 ${change.name}()`)
      console.log(`      Old: "${change.oldDescription.slice(0, 60)}..."`)
      console.log(`      New: "${change.newDescription.slice(0, 60)}..."`)

      const shouldUpdate = autoConfirm || await confirm(`   Update ${change.name}() description?`)

      if (shouldUpdate) {
        const section = findMethodSection(markdown, change.name)
        if (section) {
          const currentSection = markdown.slice(section.start, section.end)
          const updated = await updateDescription(
            change.name,
            currentSection,
            change.newDescription,
            dryRun
          )

          if (!dryRun) {
            markdown = markdown.slice(0, section.start) + updated + markdown.slice(section.end)
            modified = true
          }

          results.push({ method: change.name, type: 'description', applied: true })
          console.log(`      ✅ Updated`)
        }
      } else {
        results.push({ method: change.name, type: 'description', applied: false })
        console.log(`      ⏭️  Skipped`)
      }
    }
  }

  // Handle example changes
  if (changes.changedExamples.length > 0) {
    console.log('\n💻 Processing example changes...\n')

    // Fetch Laravel docs once for reference
    const laravelMarkdown = await fetchLaravelDocs()
    const laravelDocs = parseCollectionsDocs(laravelMarkdown)

    for (const change of changes.changedExamples) {
      console.log(`   💻 ${change.name}()`)
      console.log(`      Examples: ${change.oldExamples.length} → ${change.newExamples.length}`)

      const shouldUpdate = autoConfirm || await confirm(`   Update ${change.name}() examples?`)

      if (shouldUpdate) {
        const section = findMethodSection(markdown, change.name)
        const laravelMethod = laravelDocs.methods.get(change.name)

        if (section && laravelMethod) {
          const currentSection = markdown.slice(section.start, section.end)
          const updated = await updateExamples(
            change.name,
            currentSection,
            laravelMethod.rawMarkdown,
            dryRun
          )

          if (!dryRun) {
            markdown = markdown.slice(0, section.start) + updated + markdown.slice(section.end)
            modified = true
          }

          results.push({ method: change.name, type: 'examples', applied: true })
          console.log(`      ✅ Updated`)
        }
      } else {
        results.push({ method: change.name, type: 'examples', applied: false })
        console.log(`      ⏭️  Skipped`)
      }
    }
  }

  // Write changes
  if (modified && !dryRun) {
    writeFileSync(OUTPUT_FILE, markdown, 'utf-8')
    console.log(`\n✅ Changes written to: ${OUTPUT_FILE}`)
  }

  return results
}

/**
 * Main update function
 */
async function update(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const autoConfirm = args.includes('--yes')

  console.log('\n🔄 Laravel Documentation Update\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  if (autoConfirm) {
    console.log('✅ AUTO-CONFIRM MODE - All changes will be applied\n')
  }

  try {
    // Run check to get changes
    console.log('Running documentation check...\n')
    const checkResult = await check()

    if (!checkResult.hasChanges) {
      console.log('\n🎉 No changes to apply. Documentation is in sync!\n')
      return
    }

    // Apply updates
    const results = await applyUpdates(checkResult.changes, dryRun, autoConfirm)

    // Summary
    const applied = results.filter(r => r.applied).length
    const skipped = results.filter(r => !r.applied).length

    console.log('\n' + '='.repeat(60))
    console.log('📊 Update Summary')
    console.log('='.repeat(60))
    console.log(`   Applied: ${applied}`)
    console.log(`   Skipped: ${skipped}`)

    if (dryRun) {
      console.log('\n💡 Run without --dry-run to apply changes')
    }

    console.log('')

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Error: ${message}\n`)
    process.exit(1)
  }
}

// Run if executed directly
update()

export { update, applyUpdates }
