# Brewzy — Operations Management System

A real-time operations platform for managing Brewzy coffee machines: routes,
maintenance checklists, issue tracking, team management, and machine-emptying
protocols — with a live database that syncs across every device second by second.

Rebuilt in **React + Vite**, backed by **Firebase** (Firestore + Anonymous Auth +
Hosting). The entire original design system (brand palette, light/dark themes,
components) is preserved.

---

## ✨ What it does

- **Dashboard** — KPIs, operator/technician workload, service-frequency charts, live activity feed
- **Today's Route** — each worker sees their assigned machines, due status, and one-tap Service / Issue / Maps / Empty actions
- **Machine Directory** — full inventory with search & filters, per-machine maintenance task lists
- **Issue Tracker** — report, assign, respond to and resolve machine issues, with unseen-issue badges
- **Team Management** — add operators/technicians/managers; auto-assignment to machines
- **Tasks Library** — global maintenance tasks with per-visit frequencies, pushed to machines
- **Empty-Machine Protocol** — editable step-by-step shutdown checklist + assignment + worker checklist
- **Service History** — full log with CSV export
- **Access Control** — manager toggles which pages operators/technicians can see
- **Light / Dark theme**, fully responsive, mobile-friendly

Everything is stored in Firestore, so all phones, tablets, and computers stay in
sync in real time.

---

## 🚀 First-time setup (≈10 minutes, free)

### 1. Create a free Firebase project
1. Go to <https://console.firebase.google.com> and **Add project** (any name, e.g. `brewzy-ops`). The free **Spark** plan is enough.
2. In the project, open **Build → Firestore Database → Create database** → start in **production mode** → pick a location near you.
3. Open **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
   *(The app signs each device in invisibly so only real app users can read the data — your team still logs in with username + PIN.)*

### 2. Get your web config
1. In **Project settings (⚙️) → General → Your apps**, click the **Web** icon (`</>`).
2. Register an app (nickname `brewzy-web`), then copy the `firebaseConfig` values shown.

### 3. Plug the config into the app
```bash
cp .env.example .env
```
Open `.env` and fill in the values from step 2:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
> These keys are **not secret** — they ship in every web app. Your data is protected by the Firestore security rules + anonymous auth, not by hiding them.

### 4. Run it locally
```bash
npm install
npm run dev
```
Open the URL it prints (default <http://localhost:5173>). The first time it runs it
seeds the database with the starting team and machines.

**Default logins** (change these in Team Management afterwards):

| Role | Username | Password |
|------|----------|----------|
| Manager | `OSAMAH` | `7811` |
| Operator | `liton` | `brew123` |
| Operator | `zakir` | `brew123` |
| Technician | `majharul` | `tech123` |

---

## ☁️ Deploy online (free, Firebase Hosting)

```bash
npm install -g firebase-tools     # one time
firebase login                    # one time

# point this project at your Firebase project id:
#   edit .firebaserc  →  replace REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID
firebase use --add                # or just edit .firebaserc

# publish the security rules + the built site:
firebase deploy --only firestore:rules
npm run deploy                    # builds (vite) then firebase deploy (hosting)
```
Your app goes live at `https://<your-project>.web.app`. Every future update is just
`npm run deploy`.

> Make sure the same `.env` is present when you build/deploy — the Firebase config
> is baked into the build.

---

## 🔒 Security notes

- Firestore rules (`firestore.rules`) require an authenticated (anonymous) client, so the database is not open to the public internet.
- The username/PIN model is intentionally simple for a small ops crew on shared devices. It is **not** strong authentication — anyone with a valid app build + a username/PIN can sign in. For stronger security, switch to Firebase Email/Password auth (ask and it can be added).

---

## 🧱 Project structure

```
index.html              app shell
firebase.json           hosting + rules config
firestore.rules         security rules (auth required)
.env.example            copy to .env and fill in
public/                 brand logos (favicon, login, sidebar)
src/
  main.jsx              entry
  App.jsx               layout, routing, access guards, setup/loading states
  styles.css            full Brewzy design system (verbatim) + a few utilities
  lib/
    firebase.js         Firebase init + anonymous sign-in
    seed.js             first-run seed data
    utils.js            date/due-status/frequency helpers
    nav.js              sidebar + page metadata
  context/
    AppContext.jsx      real-time Firestore sync + session + mutations + toast/confirm
  components/           Sidebar, Topbar, Modal, Toast, ConfirmDialog, and all entity modals
  pages/                Dashboard, Route, Machines, Issues, Users, Access, Tasks,
                        EmptyProtocol, EmptyRecords, EmptyChecklist, History, Login, SetupScreen
```

## 🛠️ Scripts
- `npm run dev` — local dev server with hot reload
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm run deploy` — build + deploy to Firebase Hosting
