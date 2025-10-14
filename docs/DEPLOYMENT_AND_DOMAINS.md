# Production Deployment & Squarespace Domain Setup

This guide covers two workflows:

1. Building and deploying the site to Firebase Hosting
2. Connecting a Squarespace-managed domain (e.g., `rosenau.info`) to Firebase Hosting

Use it as a checklist when you’re ready to launch or redeploy.

---

## 1. Build & Deploy the Site

### Prerequisites
- Node.js 18 (or newer) and npm installed locally
- Firebase CLI installed globally (`npm i -g firebase-tools`)
- Logged into the Firebase CLI (`firebase login`)
- Firebase project already created and matching config values in `web/.env`

### Build the Web App
```bash
cd web
npm install        # first-time only
npm run build      # outputs production bundle to web/dist
```

### Deploy Static Assets & Rules
From the repository root:

```bash
firebase use <PROJECT_ID>                      # once per machine/project
firebase deploy --only hosting,firestore,storage
```

- `hosting` pushes the compiled app in `web/dist`
- `firestore` publishes the latest `firestore.rules`
- `storage` publishes `storage.rules` (required for resume uploads)

> If you change Cloud Functions, run `npm install && npm run build` inside `functions/` before `firebase deploy --only functions`.

---

## 2. Point Squarespace Domain to Firebase Hosting

### A. Get Firebase Hosting Verification Records
1. `firebase hosting:sites:list` (optional) to confirm the site ID.
2. `firebase hosting:channel:create prod --site <SITE_ID>` (optional) or use primary site.
3. In the Firebase Console → Hosting → “Add custom domain”, enter `rosenau.info`.
4. Firebase presents DNS records (TXT for verification, A/AAAA for pointing).

### B. Update Squarespace DNS
1. Log into Squarespace → **Domains** → select `rosenau.info` → DNS Settings.
2. Add/Update records exactly as Firebase provided:
   - **TXT** record for domain verification.
   - **A** records (typically 4 entries) pointing to Firebase edge IPs.
   - **AAAA** records (IPv6) if supplied.
3. Squarespace enforces unique hostnames per record. If duplicates exist, edit or remove the old ones before adding Firebase’s values.

### C. Verify & Activate
1. Back in Firebase Hosting, click **Verify**. DNS propagation can take 15–60 minutes (sometimes longer).
2. Once verified, Firebase automatically provisions SSL certificates.
3. The custom domain will appear under the Hosting site’s domain list. Traffic to `https://rosenau.info` now serves your Firebase-deployed app.

### D. Keep DNS in Sync
Whenever Firebase updates IPs (rare), you’ll receive a notice. Update the Squarespace DNS records accordingly.

---

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| `firebase deploy` fails with Node version errors | Upgrade local Node (`nvm install 20 && nvm use 20`) before building. |
| Storage uploads throw `storage/unauthorized` | Ensure `storage.rules` allow authenticated writes to `resumes/` and you’re logged in on the admin UI. Redeploy storage rules if needed. |
| Domain verification pending | Recheck TXT and A/AAAA records in Squarespace. Use `dig` or DNS checker to confirm they match Firebase instructions. |
| HTTPS certificate stuck provisioning | Wait up to 24 hours. If it persists, remove/re-add the custom domain or contact Firebase support. |

---

## Quick Commands Summary

```bash
# Build web app
cd web
npm run build

# Deploy hosting + rules
cd ..
firebase deploy --only hosting,firestore,storage

# (Optional) Deploy functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

With DNS pointed to Firebase, deployments are instant: rebuild, `firebase deploy`, and the Squarespace domain serves the latest version.
