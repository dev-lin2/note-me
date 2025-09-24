import { marked } from 'marked'

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
  // Simple heuristics for markdown markers
  return (
    /(^|\n)\s{0,3}#{1,6}\s+/.test(input) || // headings
    /(^|\n)\s{0,3}[-*+]\s+/.test(input) || // bullets
    /(^|\n)\s{0,3}\d+\.\s+/.test(input) || // ordered list
    /```[\s\S]*?```/.test(input) || // fenced code
    /(^|\s)`[^`]+`(\s|$)/.test(input) // inline code
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

export function toHtmlFromMarkdownOrHtml(input: string): string {
  if (!input) return ''
  const tags = getHtmlTags(input)
  const looksLikeMd = hasMarkdownSyntax(input)

  if (tags.size === 0 || (looksLikeMd && onlyTrivialWrappers(tags))) {
    // Convert potential line breaks before extracting text
    const withBreaks = input
      .replace(/<br\s*\/?>(?!\n)/gi, '\n')
      .replace(/<\/(p|div)>/gi, '\n')
    const tmp = document.createElement('div')
    tmp.innerHTML = withBreaks
    const text = tmp.textContent || ''
    const out = marked.parse(text)
    return typeof out === 'string' ? out : ''
  }

  // Already meaningful HTML from the rich editor; return as-is
  return input
}
