export function sanitizeHtml(input: string): string {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input || '', 'text/html')
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null)
    const toRemove: Element[] = []
    while (walker.nextNode()) {
      const el = walker.currentNode as Element
      const tag = el.tagName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object') {
        toRemove.push(el)
        continue
      }
      // Remove on* handlers and javascript: URLs
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase()
        const value = attr.value
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name)
        }
        if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(value)) {
          el.removeAttribute(attr.name)
        }
      }
    }
    toRemove.forEach((n) => n.remove())
    return doc.body.innerHTML
  } catch {
    // Fallback: strip tags rudimentarily
    const div = document.createElement('div')
    div.innerHTML = input || ''
    return div.textContent || ''
  }
}

export function stripHtmlToText(input: string): string {
  const div = document.createElement('div')
  div.innerHTML = input || ''
  return (div.textContent || '').trim()
}

