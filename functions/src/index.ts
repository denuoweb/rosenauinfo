import { onRequest } from 'firebase-functions/v2/https'
import { sitemapHandler } from './sitemap.js'

export const sitemap = onRequest(
  { cors: ['*'], invoker: 'public' },
  sitemapHandler
)
