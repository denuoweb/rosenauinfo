import { onRequest } from 'firebase-functions/v2/https'
import { sitemapHandler } from './sitemap'

export const sitemap = onRequest(
  { cors: ['*'], invoker: 'public' },
  sitemapHandler
)
