This repository contains a simple frontend and backend for the "Game Earn" demo.

Important: Do NOT commit any private keys or service account JSON files into this repo.

Run locally

1. Start backend

ed

backend

npm install

npm start

Backend will run on http://localhost:5000 by default.

1. Serve frontend

Open the frontend folder with a static server so fetch requests work (file:// may block requests).

Option A: use a quick Python server

cd frontend

python3 -m http.server 3000

# then open http://localhost:3000
