import { onRequest } from 'firebase-functions/v2/https'
import { sitemapHandler } from './sitemap.js'
import { resumeHtmlHandler, resumePdfHandler } from './resume.js'

export const sitemap = onRequest(
  { cors: ['*'], invoker: 'public' },
  sitemapHandler
)

export const resumeHtml = onRequest(
  { cors: ['*'], invoker: 'public' },
  resumeHtmlHandler
)

export const resumePdf = onRequest(
  { cors: ['*'], invoker: 'public' },
  resumePdfHandler
)
