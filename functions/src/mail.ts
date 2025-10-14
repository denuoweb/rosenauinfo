    import type { Request, Response } from 'express'
    import * as admin from 'firebase-admin'
    import nodemailer from 'nodemailer'

    // Configure SMTP via env or functions:config
    const cfg = {
      host: process.env.SMTP_HOST || process.env.smtp?.host,
      port: Number(process.env.SMTP_PORT || process.env.smtp?.port || 587),
      user: process.env.SMTP_USER || process.env.smtp?.user,
      pass: process.env.SMTP_PASS || process.env.smtp?.pass,
      to: process.env.CONTACT_TO_EMAIL || process.env.contact?.to
    }
    const transporter = cfg.host && cfg.user && cfg.pass
      ? nodemailer.createTransport({ host: cfg.host, port: cfg.port, auth: { user: cfg.user, pass: cfg.pass } })
      : null

    export async function sendContactEmailHandler(req: Request, res: Response) {
      if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')
      const { name, email, message } = req.body || {}
      if (!name || !email || !message) return res.status(400).send('Bad Request')
      const doc = await admin.firestore().collection('contact').add({ name, email, message, ts: admin.firestore.FieldValue.serverTimestamp() })
      if (transporter && cfg.to) {
        try {
          await transporter.sendMail({ from: cfg.user, to: cfg.to, subject: `[Contact] ${name}`, text: `From: ${name} <${email}>

${message}` })
        } catch (e) { console.error('Email send failed', e) }
      }
      return res.status(200).json({ id: doc.id })
    }
