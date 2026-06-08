# Game-earn-new

This repository contains a simple frontend and backend for the "Game Earn" demo.

Important: Do NOT commit any private keys or service account JSON files into this repo.

Run locally

1. Start backend

```bash
cd backend
npm install
npm start
```

Backend will run on http://localhost:5000 by default.

2. Serve frontend

Open the frontend folder with a static server so fetch requests work (file:// may block requests).

Option A: use a quick Python server

```bash
cd frontend
python3 -m http.server 3000
# then open http://localhost:3000
```

Option B: use npm package `serve`

```bash
npx serve frontend
```

Notes

- The frontend defaults to talk to http://localhost:5000. Set `window.API_URL` in the browser console before loading the page to change it (for example when deploying).
- If you plan to deploy a backend that uses Firebase admin SDK, do NOT store `serviceAccountKey.json` in the repo; use environment variables/secrets provided by your hosting provider.
