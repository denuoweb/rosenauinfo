import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'
import { sendContactEmailHandler } from './mail'
import { sitemapHandler } from './sitemap'

if (!admin.apps.length) {
  admin.initializeApp()
}

export const sendContactEmail = onRequest(
  { cors: ['*'] },
  sendContactEmailHandler
)

export const sitemap = onRequest(
  { cors: ['*'], invoker: 'public' },
  sitemapHandler
)
