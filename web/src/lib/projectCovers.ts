const exactGitHubHosts = new Set([
  'github.com',
  'raw.githubusercontent.com',
  'opengraph.githubassets.com',
  'repository-images.githubusercontent.com',
  'avatars.githubusercontent.com',
  'user-images.githubusercontent.com',
  'private-user-images.githubusercontent.com',
  'camo.githubusercontent.com'
])

function isGitHubAssetHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  return exactGitHubHosts.has(normalized)
    || normalized.endsWith('.githubusercontent.com')
    || normalized.endsWith('.githubassets.com')
}

export function isGitHubHostedCover(url?: string) {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return isGitHubAssetHost(parsed.hostname)
  } catch {
    return false
  }
}

export function getProjectCoverSrc(url?: string) {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  if (!trimmed) return undefined

  if (import.meta.env.PROD && isGitHubHostedCover(trimmed)) {
    return `/api/project-cover?url=${encodeURIComponent(trimmed)}`
  }

  return trimmed
}
