# Firebase Web Config: How to get each value

This project reads the Firebase Web SDK config from `web/.env` as Vite variables:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Fastest path via the Firebase Console

1) Open **Project settings**  
   - Go to https://console.firebase.google.com/  
   - Select your project.  
   - Click the **gear icon → Project settings**.

2) Create or select a **Web app**  
   - On the **General** tab, scroll to **Your apps**.  
   - If you see a Web app already, click it. If not, click **</>** (Web) to **Register app**. The name can be anything. You do **not** need Hosting here.

3) Copy the **Firebase SDK snippet (Config)**  
   - In the Web app panel, find the **SDK setup and configuration** section.  
   - Choose **Config**. You will see an object like:

```js
const firebaseConfig = {
  apiKey: "…",
  authDomain: "your-project.web.app",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

4) Map each field to your `.env` file values  
   - `apiKey` → `VITE_FIREBASE_API_KEY`  
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`  
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`  
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`  
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`  
   - `appId` → `VITE_FIREBASE_APP_ID`

5) Create `web/.env` and paste the values

```
VITE_FIREBASE_API_KEY=apiKeyFromConsole
VITE_FIREBASE_AUTH_DOMAIN=authDomainFromConsole
VITE_FIREBASE_PROJECT_ID=projectIdFromConsole
VITE_FIREBASE_STORAGE_BUCKET=storageBucketFromConsole
VITE_FIREBASE_MESSAGING_SENDER_ID=messagingSenderIdFromConsole
VITE_FIREBASE_APP_ID=appIdFromConsole
```

> Do not commit `.env`. `.gitignore` is already configured to exclude it.

## Where each value comes from, exactly

- **VITE_FIREBASE_API_KEY**: The `apiKey` field in the Web SDK config shown in **Project settings → General → Your apps → [Your Web App] → SDK setup and configuration → Config**.

- **VITE_FIREBASE_AUTH_DOMAIN**: The `authDomain` field in the same config panel. Usually `PROJECT_ID.web.app` or `PROJECT_ID.firebaseapp.com`.

- **VITE_FIREBASE_PROJECT_ID**: The `projectId` field in the same config. It also appears at the top of **Project settings** as **Project ID**.

- **VITE_FIREBASE_STORAGE_BUCKET**: The `storageBucket` field in the same config. Usually `PROJECT_ID.appspot.com`.

- **VITE_FIREBASE_MESSAGING_SENDER_ID**: The `messagingSenderId` field in the same config. A numeric string used by Firebase Cloud Messaging.

- **VITE_FIREBASE_APP_ID**: The `appId` field in the same config. It looks like `1:##########:web:##########`.

## Optional: Firebase CLI method

1) Install and authenticate the CLI:
```bash
npm i -g firebase-tools
firebase login
firebase use <your-project-id>
```

2) List apps in the project and identify the Web app:
```bash
firebase apps:list
```

3) Print the Web SDK config for that Web app (replace `APP_ID` with the Web app's App ID from the list):
```bash
firebase apps:sdkconfig web APP_ID
```

4) Copy the fields as shown above into `web/.env`.

---

If you rotate keys or create another Web app, repeat the steps and update `web/.env` accordingly.
