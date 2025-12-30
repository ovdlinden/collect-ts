/**
 * Documentation Parser
 *
 * Parses Laravel collection markdown documentation into structured format
 * for comparison and synchronization.
 */

export interface CodeExample {
  code: string
  language: 'php' | 'typescript' | 'blade' | 'shell' | 'json' | 'text'
  output?: string // Expected output shown in comments
}

export interface MethodDoc {
  name: string
  anchor: string
  description: string
  examples: CodeExample[]
  notes?: string[]
  relatedMethods?: string[]
  rawMarkdown: string // Original markdown for this method
}

export interface ParsedDocs {
  introduction: string
  methods: Map<string, MethodDoc>
  rawContent: string
}

/**
 * Parse a collections.md file into structured format
 */
export function parseCollectionsDocs(markdown: string): ParsedDocs {
  const methods = new Map<string, MethodDoc>()

  // Find the introduction (everything before "## Available Methods" or first method)
  const introMatch = markdown.match(/^([\s\S]*?)(?=<a name="method-|## Available Methods|## Method Listing)/i)
  const introduction = introMatch ? introMatch[1].trim() : ''

  // Split into method sections
  // Methods are marked with <a name="method-xxx"></a> followed by #### `methodName()`
  const methodPattern = /<a name="method-([^"]+)"><\/a>\s*\n####\s*`([^`]+)\(\)`[^\n]*/g
  const methodMatches = [...markdown.matchAll(methodPattern)]

  for (let i = 0; i < methodMatches.length; i++) {
    const match = methodMatches[i]
    const anchor = match[1]
    const name = match[2]
    const startIndex = match.index!

    // Find end of this method section (start of next method or end of file)
    const endIndex = i < methodMatches.length - 1
      ? methodMatches[i + 1].index!
      : markdown.length

    const rawMarkdown = markdown.slice(startIndex, endIndex).trim()

    // Extract description (text between method header and first code block or note)
    const descriptionMatch = rawMarkdown.match(/####[^\n]+\n\n([\s\S]*?)(?=```|> \[!|<a name=|$)/)
    const description = descriptionMatch
      ? descriptionMatch[1].trim().replace(/\n+/g, ' ')
      : ''

    // Extract code examples
    const examples = extractCodeExamples(rawMarkdown)

    // Extract notes (blockquotes with [!NOTE] or [!WARNING])
    const notes = extractNotes(rawMarkdown)

    // Extract related method references
    const relatedMethods = extractRelatedMethods(rawMarkdown)

    methods.set(name, {
      name,
      anchor,
      description,
      examples,
      notes: notes.length > 0 ? notes : undefined,
      relatedMethods: relatedMethods.length > 0 ? relatedMethods : undefined,
      rawMarkdown
    })
  }

  return {
    introduction,
    methods,
    rawContent: markdown
  }
}

/**
 * Extract code examples from markdown section
 */
function extractCodeExamples(markdown: string): CodeExample[] {
  const examples: CodeExample[] = []

  // Match code blocks with optional language tag
  const codeBlockPattern = /```(php|typescript|blade|shell|bash|json|text|html)?\n([\s\S]*?)\n```/g

  let match
  while ((match = codeBlockPattern.exec(markdown)) !== null) {
    const language = (match[1] || 'php') as CodeExample['language']
    const code = match[2].trim()

    // Try to extract output from comments within the code
    const output = extractOutputFromCode(code)

    examples.push({
      code,
      language,
      output
    })
  }

  return examples
}

/**
 * Extract expected output from code comments
 */
function extractOutputFromCode(code: string): string | undefined {
  // Look for output patterns:
  // // [1, 2, 3]
  // // true
  // /* array:2 { ... } */

  // Single-line comment output at end of code
  const singleLineMatch = code.match(/\/\/\s*(.+?)\s*$/)
  if (singleLineMatch) {
    return singleLineMatch[1]
  }

  // Multi-line comment output
  const multiLineMatch = code.match(/\/\*\s*([\s\S]*?)\s*\*\/\s*$/)
  if (multiLineMatch) {
    return multiLineMatch[1].replace(/\s+/g, ' ').trim()
  }

  return undefined
}

/**
 * Extract notes (warnings, tips) from markdown
 */
function extractNotes(markdown: string): string[] {
  const notes: string[] = []

  // Match GitHub-style alerts: > [!NOTE] or > [!WARNING]
  const notePattern = />\s*\[!(NOTE|WARNING|TIP|IMPORTANT)\]\s*\n((?:>.*\n?)*)/gi

  let match
  while ((match = notePattern.exec(markdown)) !== null) {
    const content = match[2]
      .split('\n')
      .map(line => line.replace(/^>\s*/, ''))
      .join(' ')
      .trim()
    notes.push(`${match[1]}: ${content}`)
  }

  return notes
}

/**
 * Extract references to related methods
 */
function extractRelatedMethods(markdown: string): string[] {
  const related: string[] = []

  // Look for [methodName](#method-xxx) links
  const linkPattern = /\[([^\]]+)\]\(#method-([^)]+)\)/g

  let match
  while ((match = linkPattern.exec(markdown)) !== null) {
    const methodName = match[2]
    if (!related.includes(methodName)) {
      related.push(methodName)
    }
  }

  return related
}

/**
 * Compare two parsed docs and return differences
 */
export interface DocChanges {
  newMethods: MethodDoc[]
  removedMethods: string[]
  changedDescriptions: Array<{
    name: string
    oldDescription: string
    newDescription: string
  }>
  changedExamples: Array<{
    name: string
    oldExamples: CodeExample[]
    newExamples: CodeExample[]
  }>
  unchangedCount: number
}

export function compareDocumentation(
  ourDocs: ParsedDocs,
  laravelDocs: ParsedDocs
): DocChanges {
  const changes: DocChanges = {
    newMethods: [],
    removedMethods: [],
    changedDescriptions: [],
    changedExamples: [],
    unchangedCount: 0
  }

  // Find new methods in Laravel that we don't have
  for (const [name, laravelMethod] of laravelDocs.methods) {
    if (!ourDocs.methods.has(name)) {
      changes.newMethods.push(laravelMethod)
    }
  }

  // Find methods we have that Laravel removed
  for (const name of ourDocs.methods.keys()) {
    if (!laravelDocs.methods.has(name)) {
      changes.removedMethods.push(name)
    }
  }

  // Compare existing methods
  for (const [name, ourMethod] of ourDocs.methods) {
    const laravelMethod = laravelDocs.methods.get(name)
    if (!laravelMethod) continue

    let hasChanges = false

    // Compare descriptions (normalize whitespace for comparison)
    const ourDesc = normalizeText(ourMethod.description)
    const laravelDesc = normalizeText(laravelMethod.description)

    if (ourDesc !== laravelDesc) {
      changes.changedDescriptions.push({
        name,
        oldDescription: laravelMethod.description,
        newDescription: laravelMethod.description
      })
      hasChanges = true
    }

    // Compare examples (check if PHP examples changed)
    const laravelPhpExamples = laravelMethod.examples
      .filter(e => e.language === 'php')
      .map(e => normalizeCode(e.code))

    const ourPhpExamples = ourMethod.examples
      .filter(e => e.language === 'php')
      .map(e => normalizeCode(e.code))

    // If Laravel has different PHP examples, flag it
    if (JSON.stringify(laravelPhpExamples) !== JSON.stringify(ourPhpExamples)) {
      // Check if there's a meaningful difference (not just the conversion)
      // This is a heuristic - we compare the structure, not exact text
      const structurallyDifferent = laravelPhpExamples.length !== ourPhpExamples.length

      if (structurallyDifferent) {
        changes.changedExamples.push({
          name,
          oldExamples: ourMethod.examples,
          newExamples: laravelMethod.examples
        })
        hasChanges = true
      }
    }

    if (!hasChanges) {
      changes.unchangedCount++
    }
  }

  return changes
}

/**
 * Normalize text for comparison (collapse whitespace, lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize code for comparison (remove comments, collapse whitespace)
 */
function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate a hash of the parsed docs for caching
 */
export function generateDocsHash(docs: ParsedDocs): string {
  const content = Array.from(docs.methods.values())
    .map(m => `${m.name}:${m.description}:${m.examples.length}`)
    .sort()
    .join('|')

  // Simple hash function
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}
