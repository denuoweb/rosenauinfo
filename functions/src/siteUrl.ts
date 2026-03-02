import type { Request } from 'express'

export const DEFAULT_SITE_URL = 'https://rosenau.info'

function pick(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function firstToken(value: string) {
  return value.split(',')[0]?.trim() || ''
}

function isPlaceholderHostname(hostname: string) {
  const normalized = hostname.toLowerCase()
  return normalized === 'your-domain' ||
    normalized.includes('your-domain') ||
    normalized === 'yourdomain' ||
    /(^|\.)example\.(com|org|net)$/i.test(normalized)
}

function normalizeOrigin(raw: string, rejectPlaceholders: boolean) {
  if (!raw) return ''
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return ''
    }
    if (rejectPlaceholders && isPlaceholderHostname(parsed.hostname)) {
      return ''
    }
    return parsed.origin
  } catch {
    return ''
  }
}

export function resolveSiteUrl(req: Request) {
  const configured = normalizeOrigin(pick(process.env.SITE_URL), true)
  if (configured) {
    return configured
  }

  const host = pick(req.get('x-forwarded-host')) || pick(req.get('host'))
  const forwardedProto = firstToken(pick(req.get('x-forwarded-proto'))).toLowerCase()
  const protocol = forwardedProto === 'http' ? 'http' : 'https'
  const requestOrigin = normalizeOrigin(host ? `${protocol}://${host}` : '', false)
  return requestOrigin || DEFAULT_SITE_URL
}
