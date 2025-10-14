type AnalyticsPayload = Record<string, unknown>

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: Array<Record<string, unknown>>
  }
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') return
  const data = { event, ...payload }
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, payload)
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(data)
  }
}

export function trackOutboundProjectLink(
  action: 'demo' | 'source',
  projectId: string,
  position: number,
  url: string
) {
  trackEvent('project_outbound_click', {
    action,
    projectId,
    position,
    url
  })
}
