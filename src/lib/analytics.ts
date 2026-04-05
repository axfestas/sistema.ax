/**
 * Returns a stable analytics session ID for the current browser session.
 * Uses crypto.randomUUID() when available, falling back to a timestamp-based ID.
 * The ID is stored in sessionStorage so it persists across page navigations
 * within the same browser tab session.
 */
export function getAnalyticsSessionId(): string {
  try {
    let sid = sessionStorage.getItem('_ax_sid')
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Date.now().toString(36) + performance.now().toString(36).replace('.', '')
      sessionStorage.setItem('_ax_sid', sid)
    }
    return sid
  } catch {
    return ''
  }
}

/**
 * Records a page view by sending a POST to /api/analytics.
 * Failures are silently ignored to never impact the user experience.
 */
export function trackPageView(path: string): void {
  try {
    const sid = getAnalyticsSessionId()
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        session_id: sid || null,
      }),
    }).catch(() => {/* ignore */})
  } catch {/* ignore */}
}
