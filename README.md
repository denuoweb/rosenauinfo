# Personal Site on Firebase (React 19 + Vite 8 + TS)
SPA with theme switching and Firebase Functions.

## Structure
- `web/`: Vite + React 19 + TypeScript SPA
- `functions/`: Firebase Functions (TypeScript)
- Hosting rewrites: `/resume`, `/resume.pdf`, `/sitemap.xml`, then SPA fallback

## Quickstart
1. Replace IDs in `.firebaserc` and `firebase.json`.
2. `cd web && npm i && npm run build`
3. `cd ../functions && nvm use && npm i && npm run build`
4. At repo root: `firebase deploy`

> The root `.nvmrc` pins Node 24 for the Vite app. `functions/.nvmrc` pins Node 22 to match the Firebase Functions runtime in `firebase.json` and `functions/package.json`. Run `nvm use` after `cd` into each directory so installs/builds use the expected engine and avoid `EBADENGINE` warnings.

## Admin Panel
- Enable **Email/Password** sign-in in Firebase Authentication and create an admin user.
- Visit `/admin` in the deployed site (or `http://localhost:5173/admin` during development) and log in with that account.
- From there you can edit the site name, homepage blurb, manage projects, and update the resume URLs.
- Every admin form now supports English and Japanese fields. Populate both so the language switcher (US / Japan flags) on the public site can render a complete experience in either language.
- Lock down writes by setting an admin UID or custom claim in `firestore.rules` and `storage.rules` (replace `REPLACE_WITH_ADMIN_UID`).

## Resume Surface
- Canonical HTML resume endpoint: `/resume` (also available at `/resume.html`).
- Canonical PDF endpoint: `/resume.pdf` (stable URL that redirects to the current uploaded file).
- Both endpoints are server-rendered/function-backed so they work without client-side JavaScript.
