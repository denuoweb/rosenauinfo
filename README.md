# Personal Site on Firebase (React 19 + Vite 5 + TS)
SPA with theme switching and Firebase Functions.

## Structure
- `web/`: Vite + React 19 + TypeScript SPA
- `functions/`: Firebase Functions (TypeScript)
- Hosting rewrites: `/api/contact`, `/sitemap.xml`, SPA fallback

## Quickstart
1. Replace IDs in `.firebaserc` and `firebase.json`.
2. `cd web && npm i && npm run build`
3. `cd ../functions && npm i && npm run build`
4. At repo root: `firebase deploy`

## Admin Panel
- Enable **Email/Password** sign-in in Firebase Authentication and create an admin user.
- Visit `/admin` in the deployed site (or `http://localhost:5173/admin` during development) and log in with that account.
- From there you can edit the site name, homepage blurb, manage projects, update the resume URLs, and adjust contact copy while reviewing recent contact form submissions.
- Every admin form now supports English and Japanese fields. Populate both so the language switcher (US / Japan flags) on the public site can render a complete experience in either language.
