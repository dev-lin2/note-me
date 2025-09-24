export function debounce<P extends unknown[]>(
  fn: (...args: P) => void | Promise<void>,
  wait = 300,
) {
  let t: number | undefined
  return (...args: P) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => {
      // Fire and forget for async handlers
      void fn(...args)
    }, wait)
  }
}
