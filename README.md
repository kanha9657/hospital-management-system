# Hospital Appointment Prototype

This is a simple hospital appointment management prototype. It includes:

- A responsive, animated frontend (HTML/CSS/JS) in `public/`.
- A small Express server (`server.js`) exposing APIs and serving the frontend.
- A MySQL schema in `db/schema.sql` to create the `hospital_db` database with `doctors` and `appointments` tables.

Features:

- Patients can enter name, email, phone, select a concern/disease, choose a doctor, and pick date/time.
- Appointments are stored in MySQL.
- Recent appointments are listed on the page.

Prerequisites
-------------

- Node.js (16+ recommended) and npm
- MySQL server

Quick setup
-----------

1. Install Node dependencies:

```bash
cd /home/kanhaiya/hospital
npm install
```

2. Create the database and seed sample doctors. Use the MySQL CLI or your preferred client. Example using CLI:

```bash
# edit values or run this as a user with CREATE DATABASE privileges
mysql -u root -p < db/schema.sql
```

3. Copy the example env file and set DB credentials:

```bash
cp .env.example .env
# then edit .env and set DB_USER, DB_PASS, DB_HOST if needed
```

4. Start the server:

```bash
npm start
# or in development with auto-reload (if nodemon installed globally):
npm run dev


5. Open your browser at http://localhost:3000

Notes & Next steps


- This is a prototype. For production use you should add authentication, input sanitization beyond this demo, email confirmations, better date/time slot handling, and CSRF protections.
- If you don't have MySQL available, the frontend will still load and use a small client-side sample set of doctors and display offline messages when the server APIs fail.

Files changed/added
-------------------

- `server.js` — Express server and API endpoints
- `package.json` — dependencies and scripts
- `public/` — frontend assets (index.html, styles.css, app.js)
- `db/schema.sql` — SQL to create database/tables and seed doctors
- `.env.example` — example env vars

If you want, I can also:

- Add a simple admin page to manage doctors and appointments
- Add validation and unit tests
- Dockerize the stack (MySQL + Node) for easier local setup

---
Happy to continue — tell me which next step you'd like.
