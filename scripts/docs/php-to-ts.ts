/**
 * PHP to TypeScript Converter
 *
 * Converts PHP code examples from Laravel documentation to TypeScript.
 * Handles common patterns and flags complex cases for manual review.
 */

export interface ConversionResult {
  code: string
  wasConverted: boolean
  needsManualReview: boolean
  reviewReasons: string[]
}

export interface MarkdownConversionResult {
  content: string
  stats: {
    totalCodeBlocks: number
    convertedBlocks: number
    flaggedForReview: number
    reviewItems: Array<{ line: number; reason: string }>
  }
}

/**
 * Converts a PHP code block to TypeScript
 */
export function convertPhpToTs(phpCode: string): ConversionResult {
  const reviewReasons: string[] = []
  let code = phpCode
  let wasConverted = false

  // Skip if it's not PHP-like code (might be shell, json, etc.)
  if (!looksLikePhp(code)) {
    return { code, wasConverted: false, needsManualReview: false, reviewReasons: [] }
  }

  // Track original for comparison
  const original = code

  // === CONVERSION RULES ===

  // 1. PHP opening/closing tags
  code = code.replace(/<\?php\s*/g, '')
  code = code.replace(/\?>/g, '')

  // 1b. PHP use statements (imports) - remove them or convert to comments
  code = code.replace(/^use\s+[\w\\]+;\s*\n?/gm, '')

  // 2. Variable declarations: $variable -> variable (with const/let)
  // Handle assignment: $var = value -> const var = value
  code = code.replace(/^\s*\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*/gm, 'const $1 = ')

  // Handle remaining $ variables (not at assignment start)
  code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1')

  // 3. Arrow operator: -> becomes .
  code = code.replace(/->/g, '.')

  // 4. Double arrow (associative arrays): => in arrays
  // ['key' => 'value'] -> { key: 'value' }
  code = convertAssociativeArrays(code)

  // 5. PHP arrow functions: fn($x) => expr -> (x) => expr
  code = code.replace(/fn\s*\(([^)]*)\)\s*=>\s*/g, (_, params) => {
    const tsParams = params.replace(/\$/g, '').trim()
    return `(${tsParams}) => `
  })

  // 6. Anonymous functions: function ($x) { ... } -> (x) => { ... }
  code = convertAnonymousFunctions(code)

  // 7. PHP concatenation: . becomes +
  // But be careful not to convert method calls
  code = convertConcatenation(code)

  // 8. PHP class instantiation: new Class() stays the same
  // But Class::method() -> Class.method()
  code = code.replace(/::(?!class)/g, '.')

  // 9. PHP array() -> []
  code = code.replace(/\barray\s*\(/g, '[')
  code = code.replace(/\)\s*(?=;|\s*$|,|\])/g, (match, offset) => {
    // Only replace ) that were part of array()
    const before = code.slice(0, offset)
    const arrayMatches = before.match(/\[/g)?.length || 0
    const closeMatches = before.match(/\]/g)?.length || 0
    if (arrayMatches > closeMatches) {
      return ']'
    }
    return match
  })

  // 10. PHP null coalescing: ?? stays the same (TS supports it)

  // 11. PHP type hints in closures - remove them
  // Handle: (int $key) -> (key), (string $value, int $key) -> (value, key)
  code = code.replace(/\(([^)]*)\)/g, (match, params) => {
    // Remove type hints from each parameter
    const cleanParams = params
      .split(',')
      .map((param: string) => {
        // Remove type hints like "int ", "string ", "?string ", "array ", etc.
        return param
          .trim()
          .replace(/^(?:int|string|bool|boolean|float|double|array|object|mixed|callable|\??\w+)\s+/, '')
          .replace(/^\$/, '') // Also remove $ if present
      })
      .filter((p: string) => p.length > 0)
      .join(', ')
    return '(' + cleanParams + ')'
  })

  // 12. Return type hints - remove them
  code = code.replace(/\)\s*:\s*(?:int|string|bool|float|array|object|mixed|void|\??\w+)\s*(?=\{|=>)/g, ') ')

  // 12b. PHP named arguments: method(name: value) -> method(value)
  // Common patterns: strict: true, key: 'name'
  code = code.replace(/,\s*\w+:\s*(true|false|null|'[^']*'|"[^"]*"|\d+)/g, ', $1')
  code = code.replace(/\(\s*\w+:\s*(true|false|null|'[^']*'|"[^"]*"|\d+)/g, '($1')

  // 13. PHP use() in closures - flag for review
  if (/function\s*\([^)]*\)\s*use\s*\(/.test(code)) {
    reviewReasons.push('Contains use() clause - variables may need adjustment')
    // Remove the use() clause
    code = code.replace(/\)\s*use\s*\([^)]*\)/g, ')')
  }

  // 14. PHP echo/print -> console.log or remove
  code = code.replace(/\becho\s+/g, 'console.log(')
  code = code.replace(/\bprint\s+/g, 'console.log(')

  // 15. collect() helper - works the same in TS
  // No change needed

  // 16. PHP comments stay the same (// and /* */)

  // 17. Semicolons - keep them for TS

  // 18. PHP class property access syntax
  // $this->property -> this.property
  code = code.replace(/\bthis\./g, 'this.')

  // 19. String interpolation: "Hello $name" -> `Hello ${name}`
  code = convertStringInterpolation(code)

  // 20. PHP specific functions that don't exist in TS
  const phpOnlyFunctions = ['var_dump', 'print_r', 'var_export', 'die', 'exit', 'dd']
  for (const fn of phpOnlyFunctions) {
    if (new RegExp(`\\b${fn}\\s*\\(`).test(code)) {
      reviewReasons.push(`Contains ${fn}() - needs manual replacement`)
    }
  }

  // 21. Class constants - Class::CONSTANT -> Class.CONSTANT
  // Already handled by :: conversion

  // 22. PHP Heredoc/Nowdoc - flag for review
  if (/<<</.test(code)) {
    reviewReasons.push('Contains heredoc/nowdoc syntax')
  }

  // Check if conversion happened
  wasConverted = code !== original

  // Determine if manual review is needed
  const needsManualReview = reviewReasons.length > 0 ||
    containsComplexPatterns(code)

  if (containsComplexPatterns(code) && !reviewReasons.length) {
    reviewReasons.push('Contains complex patterns that may need adjustment')
  }

  return {
    code: code.trim(),
    wasConverted,
    needsManualReview,
    reviewReasons
  }
}

/**
 * Check if the code looks like PHP (vs shell, JSON, etc.)
 */
function looksLikePhp(code: string): boolean {
  // PHP indicators
  const phpIndicators = [
    /\$[a-zA-Z_]/, // $ variables
    /->/, // arrow operator
    /=>/,  // double arrow
    /\bcollect\s*\(/,
    /function\s*\(/,
    /fn\s*\(/,
    /<\?php/,
    /\buse\s+/,
    /\bclass\s+/,
    /\bpublic\s+/,
    /\bprivate\s+/,
    /\bprotected\s+/,
  ]

  return phpIndicators.some(pattern => pattern.test(code))
}

/**
 * Convert PHP associative arrays to JS objects
 * ['key' => 'value', 'key2' => 'value2'] -> { key: 'value', key2: 'value2' }
 */
function convertAssociativeArrays(code: string): string {
  // This is complex because arrays can be nested
  // We'll use a state machine approach

  let result = ''
  let i = 0

  while (i < code.length) {
    // Look for [ that might be an associative array
    if (code[i] === '[') {
      const arrayContent = extractBracketContent(code, i)
      if (arrayContent && arrayContent.includes('=>')) {
        // It's an associative array, convert to object
        const converted = convertSingleAssociativeArray(arrayContent)
        result += '{ ' + converted + ' }'
        i += arrayContent.length + 2 // +2 for [ and ]
        continue
      }
    }
    result += code[i]
    i++
  }

  return result
}

/**
 * Extract content between brackets
 */
function extractBracketContent(code: string, startIndex: number): string | null {
  if (code[startIndex] !== '[') return null

  let depth = 1
  let i = startIndex + 1

  while (i < code.length && depth > 0) {
    if (code[i] === '[') depth++
    else if (code[i] === ']') depth--
    i++
  }

  if (depth === 0) {
    return code.slice(startIndex + 1, i - 1)
  }
  return null
}

/**
 * Convert a single associative array content to object syntax
 */
function convertSingleAssociativeArray(content: string): string {
  // Split by comma (but not commas inside nested structures)
  const pairs = splitByTopLevelComma(content)

  return pairs.map(pair => {
    const arrowIndex = pair.indexOf('=>')
    if (arrowIndex === -1) return pair.trim()

    let key = pair.slice(0, arrowIndex).trim()
    const value = pair.slice(arrowIndex + 2).trim()

    // Remove quotes from key if it's a valid identifier
    if (/^['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]$/.test(key)) {
      key = key.slice(1, -1)
    }

    return `${key}: ${value}`
  }).join(', ')
}

/**
 * Split string by top-level commas (not inside brackets/parens)
 */
function splitByTopLevelComma(str: string): string[] {
  const result: string[] = []
  let current = ''
  let depth = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const prevChar = str[i - 1]

    // Handle string boundaries
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
      }
    }

    // Track depth
    if (!inString) {
      if (char === '[' || char === '(' || char === '{') depth++
      else if (char === ']' || char === ')' || char === '}') depth--
    }

    // Split at top-level comma
    if (char === ',' && depth === 0 && !inString) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    result.push(current.trim())
  }

  return result
}

/**
 * Convert PHP anonymous functions to arrow functions
 */
function convertAnonymousFunctions(code: string): string {
  // Simple case: function($x) { return expr; }
  // -> ($x) => expr

  // Match function with simple return
  code = code.replace(
    /function\s*\(([^)]*)\)\s*\{\s*return\s+([^;]+);\s*\}/g,
    (_, params, returnExpr) => {
      const tsParams = params.replace(/\$/g, '').replace(/,\s*/g, ', ').trim()
      return `(${tsParams}) => ${returnExpr}`
    }
  )

  // Match function with body (keep as arrow function with body)
  code = code.replace(
    /function\s*\(([^)]*)\)\s*\{/g,
    (_, params) => {
      const tsParams = params.replace(/\$/g, '').replace(/,\s*/g, ', ').trim()
      return `(${tsParams}) => {`
    }
  )

  return code
}

/**
 * Convert PHP string concatenation (.) to TS (+)
 * Being careful not to convert method calls
 */
function convertConcatenation(code: string): string {
  // This is tricky because . is also used for method calls
  // Only convert . that's surrounded by strings or variables

  // Pattern: string . string or var . string
  code = code.replace(
    /(['"][^'"]*['"])\s*\.\s*(['"][^'"]*['"])/g,
    '$1 + $2'
  )

  code = code.replace(
    /(['"][^'"]*['"])\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)/g,
    '$1 + $2'
  )

  code = code.replace(
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*(['"][^'"]*['"])/g,
    '$1 + $2'
  )

  return code
}

/**
 * Convert PHP string interpolation to template literals
 */
function convertStringInterpolation(code: string): string {
  // "Hello $name" -> `Hello ${name}`
  // "Value: {$var->prop}" -> `Value: ${var.prop}`

  code = code.replace(
    /"([^"]*\$[^"]*)"/g,
    (match, content) => {
      // Convert $var to ${var}
      let converted = content.replace(/\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g, '${$1}')
      // Convert {$var->prop} to ${var.prop}
      converted = converted.replace(/\{\$([^}]+)\}/g, (_, expr) => {
        return '${' + expr.replace(/->/g, '.') + '}'
      })
      return '`' + converted + '`'
    }
  )

  return code
}

/**
 * Check for complex patterns that need manual review
 */
function containsComplexPatterns(code: string): boolean {
  const complexPatterns = [
    /\bnew\s+\w+\s*\(/,  // Object instantiation
    /\bclass\s+/,        // Class definition
    /\binterface\s+/,    // Interface definition
    /\btrait\s+/,        // Trait definition
    /\bnamespace\s+/,    // Namespace
    /\bextends\s+/,      // Inheritance
    /\bimplements\s+/,   // Interface implementation
    /\bstatic\s+/,       // Static methods/properties
    /\@\w+/,             // Annotations/Attributes
    /\bthrow\s+new\s+/,  // Exception throwing
    /\btry\s*\{/,        // Try-catch blocks
  ]

  return complexPatterns.some(pattern => pattern.test(code))
}

/**
 * Convert an entire markdown file, processing all PHP code blocks
 */
export function convertMarkdown(markdown: string): MarkdownConversionResult {
  const stats = {
    totalCodeBlocks: 0,
    convertedBlocks: 0,
    flaggedForReview: 0,
    reviewItems: [] as Array<{ line: number; reason: string }>
  }

  // Match PHP code blocks
  // ```php followed by content and closing ```
  // Also match ```blade and other variants for counting
  const codeBlockRegex = /```(php|blade|shell|bash|json|text|html)?\n([\s\S]*?)\n```/g

  let lineNumber = 1
  let lastIndex = 0

  const converted = markdown.replace(codeBlockRegex, (match, langTag, codeContent, offset) => {
    // Calculate line number
    const textBefore = markdown.slice(lastIndex, offset)
    lineNumber += (textBefore.match(/\n/g) || []).length
    lastIndex = offset + match.length

    stats.totalCodeBlocks++

    // Skip non-PHP blocks (blade, shell, json, etc.)
    if (langTag && langTag !== 'php' && langTag !== '') {
      return match // Return unchanged
    }

    const result = convertPhpToTs(codeContent)

    if (result.wasConverted) {
      stats.convertedBlocks++
    }

    if (result.needsManualReview) {
      stats.flaggedForReview++
      for (const reason of result.reviewReasons) {
        stats.reviewItems.push({ line: lineNumber, reason })
      }
    }

    // Change language tag to typescript if converted
    const newLangTag = result.wasConverted ? 'typescript' : 'php'

    // Add review comment if needed
    let output = '```' + newLangTag + '\n' + result.code + '\n```'

    if (result.needsManualReview) {
      output = `<!-- REVIEW: ${result.reviewReasons.join(', ')} -->\n` + output
    }

    return output
  })

  return { content: converted, stats }
}

/**
 * Batch convert multiple code blocks and report statistics
 */
export function batchConvert(codeBlocks: string[]): {
  results: ConversionResult[]
  summary: { total: number; converted: number; needsReview: number }
} {
  const results = codeBlocks.map(convertPhpToTs)

  return {
    results,
    summary: {
      total: results.length,
      converted: results.filter(r => r.wasConverted).length,
      needsReview: results.filter(r => r.needsManualReview).length
    }
  }
}

// Export for testing
export const __testing = {
  looksLikePhp,
  convertAssociativeArrays,
  convertAnonymousFunctions,
  convertConcatenation,
  convertStringInterpolation,
  containsComplexPatterns
}
