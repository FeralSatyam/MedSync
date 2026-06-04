# MedSync — Claude Assistant Guide

This repository (MedSync) is a MERN app for managing medicines, patients, pharmacists, and orders. This `CLAUDE.md` provides quick context, run commands, key files, environment variables, and example prompts so Claude can help you effectively with this project.

Project overview
- Full-stack MERN app with a `client/` (Vite + React) frontend and `server/` (Node.js + Express) backend.
- Key features: medicine inventory, patient profiles, pharmacist invitations, orders, notifications, camera/QR utilities.

## Architecture Overview
Note : This repo is for patient-facing app (Website A)

There is also MedSync Pharmacy , which is a pharmacist portal (Website B) that **shares a MongoDB database** with a separate patient-facing app (Website A). This dual-app architecture is the most important concept in the codebase:

- **Read-only collections** (written by Website A): `Patient`, `Medicine`, `User` — located in `server/models/shared/`
- **Read/write collections** (owned by Website B): `Pharmacist`, `Offer`, `PatientLink`, `Notification`, `PendingPharmacistRegistration`, `PharmacistInvitation`, `PharmacistLink`
Note : This repo is for patient-facing app (Website A)

## Backend (`server/`)

- **Framework**: Express 5 with ES modules (`import/export`)
- **Database**: MongoDB + Mongoose 9
- **Entry point**: `server/server.js`

Quick start (local)
- Backend:
  - Install and run:
    - `cd server`
    - `npm install`
    - `npm run dev` or `node index.js` (use your dev script if present)
- Frontend:
  - Install and run:
    - `cd client`
    - `npm install`
    - `npm run dev`

Important environment variables
- `MONGODB_URI` or `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JSON Web Token secret
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Email/SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (or provider-specific vars)
- Any other env keys referenced in `server/config/*.js` or `server/config/*.cjs`

Key server-side files and folders
- `server/index.js` — server entrypoint
- `server/config/db.js` — DB connection
- `server/config/cloudinary.js` — image upload config
- `server/controllers/` — route handlers (auth, medicines, patients, pharmacists)
- `server/models/` — Mongoose models: `User.js`, `Medicine.js`, `Patient.js`, etc.
- `server/routes/` — route definitions
- `server/middleware/` — auth, error handling, upload middleware

Key client-side files and folders
- `client/src/main.jsx` — React entrypoint
- `client/src/App.jsx` — app layout and routes
- `client/src/api/` — Axios wrappers for backend endpoints (authApi.js, medicineApi.js, etc.)
- `client/src/pages/` and `client/src/components/` — UI and pages
- `client/src/store/` — app state stores

Common tasks and tips for Claude
- When asked to modify or add code, mention the target file path (for example: `server/controllers/medicineController.js`).
- Provide the exact problem, error text, and steps to reproduce where possible.
- When requesting new routes or API changes, state HTTP method, route path, request body shape, and expected response.
- When debugging, include stack traces and the lines/files referenced in the trace.

Example prompts to use with Claude
- "Add validation to the `POST /api/medicines` endpoint in `server/controllers/medicineController.js`. Validate `name`, `expiryDate`, and `stock` and return 400 for invalid input."
- "Refactor `client/src/components/MedicineCard.jsx` to extract a small `QuantityBadge` component and update all usages." 
- "I get this error when starting the server: [paste stack trace]. Show me the most likely cause and a patch to fix it."
- "Create an endpoint `GET /api/patients/:id/medicines` that returns a patient's medicines with pagination. Update router, controller, and add necessary service code."

How to request code patches
- Ask for a patch with unified diff format and specify the exact repo-relative file(s) to edit.
- If you want tests, mention the framework and where tests should live.

Notes about repository conventions
- Routes are organized under `server/routes/` and call corresponding controllers in `server/controllers/`.
- Data models are Mongoose schemas in `server/models/`.
- Frontend interacts with the backend using `client/src/api/*` Axios wrappers.

When to run and what to test locally
- Start the backend first (ensures API is available), then frontend.
- Use Postman or the frontend UI to exercise auth flows, medicine creation, and order flows.

If you want this file customized further
- Tell Claude which additional details you want: deployment steps, CI, common troubleshooting logs, or example curl commands.

---
Generated for the MedSync repository to make future Claude-assisted development faster and more precise.
