type ProxyRequest = {
  method: string
  query: Record<string, unknown>
}

type ProxyResponse = {
  set(name: string, value: string): void
  status(code: number): ProxyResponse
  send(body: unknown): void
  end(): void
}

type RemoteResponse = {
  ok: boolean
  status: number
  headers: { get(name: string): string | null }
  arrayBuffer(): Promise<ArrayBuffer>
}

type RemoteFetch = (
  input: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    redirect?: 'follow'
  }
) => Promise<RemoteResponse>

type UrlLike = {
  protocol: string
  hostname: string
  toString(): string
}

type UrlConstructor = new (input: string, base?: string) => UrlLike

const exactAllowedHosts = new Set([
  'github.com',
  'raw.githubusercontent.com',
  'opengraph.githubassets.com',
  'repository-images.githubusercontent.com',
  'avatars.githubusercontent.com',
  'user-images.githubusercontent.com',
  'private-user-images.githubusercontent.com',
  'camo.githubusercontent.com'
])

const fetchImpl = (globalThis as { fetch?: RemoteFetch }).fetch
const URLImpl = (globalThis as { URL?: UrlConstructor }).URL

function readQueryString(value: unknown) {
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

function isAllowedGitHubHost(hostname: string) {
  const normalized = hostname.toLowerCase()
  return exactAllowedHosts.has(normalized)
    || normalized.endsWith('.githubusercontent.com')
    || normalized.endsWith('.githubassets.com')
}

export async function projectCoverHandler(req: ProxyRequest, res: ProxyResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.set('Allow', 'GET, HEAD')
    res.status(405).send('Method not allowed.')
    return
  }

  if (!fetchImpl || !URLImpl) {
    res.status(500).send('Image proxy is not available.')
    return
  }

  const rawUrl = readQueryString(req.query.url)
  if (!rawUrl) {
    res.status(400).send('Missing url query parameter.')
    return
  }

  let target: UrlLike
  try {
    target = new URLImpl(rawUrl)
  } catch {
    res.status(400).send('Invalid image URL.')
    return
  }

  if ((target.protocol !== 'https:' && target.protocol !== 'http:') || !isAllowedGitHubHost(target.hostname)) {
    res.status(400).send('Unsupported image host.')
    return
  }

  const upstream = await fetchImpl(target.toString(), {
    method: req.method,
    redirect: 'follow',
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'User-Agent': 'rosenauinfo-project-cover-proxy/1.0'
    }
  })

  if (!upstream.ok) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.status(502).send(`Upstream image request failed with status ${upstream.status}.`)
    return
  }

  const contentType = upstream.headers.get('content-type')?.trim() ?? ''
  if (!contentType.startsWith('image/')) {
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
    res.status(502).send('Upstream URL did not return an image.')
    return
  }

  const contentLength = upstream.headers.get('content-length')
  const etag = upstream.headers.get('etag')
  const lastModified = upstream.headers.get('last-modified')

  res.set('Content-Type', contentType)
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  res.set('X-Robots-Tag', 'noindex')
  if (contentLength) res.set('Content-Length', contentLength)
  if (etag) res.set('ETag', etag)
  if (lastModified) res.set('Last-Modified', lastModified)

  if (req.method === 'HEAD') {
    res.status(200).end()
    return
  }

  const body = await upstream.arrayBuffer()
  res.status(200).send(Buffer.from(body))
}
