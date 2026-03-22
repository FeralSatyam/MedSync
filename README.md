# MedSync

QR-based medicine management MVP for Nepal (MERN stack): patient mobile-friendly web app and a public pharmacist read-only view.

## Structure

- `server/` — Express REST API, MongoDB (Mongoose), JWT auth, Cloudinary uploads, daily stock cron (23:59 Nepal time → 18:14 UTC).
- `client/` — React 18 (Vite), Tailwind CSS, Zustand, React Router, Axios.

## Prerequisites

- Node.js 18+
- MongoDB Atlas URI (or local MongoDB)
- Cloudinary account (for prescription images/PDFs)

## Setup

### 1. Server

```bash
cd server
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET (32+ chars), Cloudinary keys, CLIENT_URL
npm install
npm run dev
```

API listens on `http://localhost:5000` by default.

### 2. Client

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Vite dev server proxies `/api` to the backend so JWT cookies and `VITE_API_BASE_URL=/api` work on one origin (`http://localhost:5173`).

### 3. First run

1. Register an account.
2. Under **Family profiles**, create a patient (4-digit pharmacy PIN for pharmacist dispense).
3. Open **Dashboard**, add medicines (optional prescription upload).
4. Use **Show QR** for the public pharmacist URL (`/pharmacist/:qrToken`).

## Production notes

- Set `CLIENT_URL` to your deployed frontend origin for CORS.
- Set `VITE_API_BASE_URL` to your public API base (e.g. `https://api.example.com/api`).
- Use HTTPS; set `NODE_ENV=production` and `secure` cookies where appropriate.

## Scripts

| Location | Command    | Purpose        |
|----------|------------|----------------|
| server   | `npm run dev`  | Nodemon + API  |
| server   | `npm start`    | Production     |
| client   | `npm run dev`  | Vite dev       |
| client   | `npm run build`| Production build |

---

MedSync MVP — browser-based prototype for safer medicine purchasing.
