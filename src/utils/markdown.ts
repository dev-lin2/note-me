import { marked } from 'marked'

// Configure marked for better line break handling
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
})

function getHtmlTags(input: string): Set<string> {
  const tags = new Set<string>()
  const re = /<([a-z][\w-]*)\b[^>]*>/gi
  for (const m of input.matchAll(re)) {
    const tag = m[1]?.toLowerCase()
    if (tag) tags.add(tag)
  }
  return tags
}

function hasMarkdownSyntax(input: string): boolean {
  // Heuristics for markdown markers
  return (
    /(^|\n)\s{0,3}#{1,6}\s+/.test(input) || // headings
    /(^|\n)\s{0,3}[-*+]\s+/.test(input) || // bullets
    /(^|\n)\s{0,3}\d+\.\s+/.test(input) || // ordered list
    /```[\s\S]*?```/.test(input) || // fenced code
    /(^|\s)`[^`]+`(\s|$)/.test(input) || // inline code
    /\[.+?\]\(.+?\)/.test(input) || // links
    /!\[.*?\]\(.+?\)/.test(input) || // images
    /(^|\n)\s*>\s+/.test(input) || // blockquotes
    /\*\*[^*]+\*\*/.test(input) || // bold
    /__[^_]+__/.test(input) || // bold alt
    /(?<!\*)\*[^*]+\*(?!\*)/.test(input) || // italic
    /(?<!_)_[^_]+_(?!_)/.test(input) || // italic alt
    /~~[^~]+~~/.test(input) || // strikethrough
    /(^|\n)\s*[-*_]{3,}\s*($|\n)/.test(input) || // horizontal rule
    /(^|\n)\|.+\|/.test(input) // tables
  )
}

function onlyTrivialWrappers(tags: Set<string>): boolean {
  // If tags are only generic wrappers, treat as markdown source
  const allowed = new Set(['p', 'div', 'br', 'span'])
  for (const t of tags) {
    if (!allowed.has(t)) return false
  }
  return true
}

/**
 * Extract text from HTML while preserving line breaks
 */
function htmlToText(html: string): string {
  // First, normalize line breaks in the source
  const text = html
    // Convert <br> tags to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert block-level closing tags to double newlines (paragraph breaks)
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    // Convert block-level opening tags (with potential whitespace after)
    .replace(/<(p|div|h[1-6]|li|blockquote)[^>]*>/gi, '')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Normalize multiple newlines (more than 2) to just 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing whitespace
    .trim()

  return text
}

export function toHtmlFromMarkdownOrHtml(input: string): string {
  if (!input) return ''

  const tags = getHtmlTags(input)
  const looksLikeMd = hasMarkdownSyntax(input)

  // If it has no HTML tags, or looks like markdown with only trivial wrappers
  if (tags.size === 0 || (looksLikeMd && onlyTrivialWrappers(tags))) {
    // Extract text while preserving line breaks
    const text = tags.size === 0 ? input : htmlToText(input)
    const out = marked.parse(text)
    return typeof out === 'string' ? out : ''
  }

  // Already meaningful HTML from the rich editor; return as-is
  return input
}
