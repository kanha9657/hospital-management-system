require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

async function createPool() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  return pool;
}

let poolPromise = createPool();

// API: get all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const pool = await poolPromise;
    const [rows] = await pool.query('SELECT id, name, specialization FROM doctors ORDER BY name');
    res.json({ ok: true, doctors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// API: create appointment
app.post('/api/appointments', async (req, res) => {
  const { name, email, phone, disease, doctor_id, appointment_date } = req.body;
  if (!name || !email || !phone || !disease || !appointment_date) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  // validate/convert appointment_date
  const dt = new Date(appointment_date);
  if (isNaN(dt.getTime())) {
    return res.status(400).json({ ok: false, error: 'Invalid appointment_date format' });
  }

  try {
    const pool = await poolPromise;
    // pass a JS Date object — mysql2 will convert it to DATETIME correctly
    const [result] = await pool.query(
      'INSERT INTO appointments (name, email, phone, disease, doctor_id, appointment_date) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, disease, doctor_id || null, dt]
    );
    res.json({ ok: true, appointmentId: result.insertId });
  } catch (err) {
    console.error('Insert appointment error:', err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// API: list appointments (recent)
app.get('/api/appointments', async (req, res) => {
  try {
    const pool = await poolPromise;
    const [rows] = await pool.query(`SELECT a.id, a.name, a.email, a.phone, a.disease, a.appointment_date, d.name AS doctor
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.created_at DESC
      LIMIT 100`);
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// --- admin helpers & endpoints ---
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin123';

function checkAdmin(req, res, next) {
  const token = req.get('x-admin-token') || req.query.admin_token || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

// serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Doctors - admin CRUD
app.get('/api/admin/doctors', checkAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const [rows] = await pool.query('SELECT id, name, specialization FROM doctors ORDER BY name');
    res.json({ ok: true, doctors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

app.post('/api/admin/doctors', checkAdmin, async (req, res) => {
  const { name, specialization } = req.body || {};
  if (!name || !specialization) return res.status(400).json({ ok: false, error: 'Missing fields' });
  try {
    const pool = await poolPromise;
    const [result] = await pool.query('INSERT INTO doctors (name, specialization) VALUES (?, ?)', [name, specialization]);
    res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

app.put('/api/admin/doctors/:id', checkAdmin, async (req, res) => {
  const id = req.params.id;
  const { name, specialization } = req.body || {};
  if (!name || !specialization) return res.status(400).json({ ok: false, error: 'Missing fields' });
  try {
    const pool = await poolPromise;
    await pool.query('UPDATE doctors SET name = ?, specialization = ? WHERE id = ?', [name, specialization, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

app.delete('/api/admin/doctors/:id', checkAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    // unlink appointments first
    await pool.query('UPDATE appointments SET doctor_id = NULL WHERE doctor_id = ?', [id]);
    await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// Appointments - admin
app.get('/api/admin/appointments', checkAdmin, async (req, res) => {
  try {
    const pool = await poolPromise;
    const [rows] = await pool.query(`
      SELECT a.id, a.name, a.email, a.phone, a.disease, a.appointment_date, a.doctor_id, d.name AS doctor
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC
      LIMIT 200
    `);
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

app.delete('/api/admin/appointments/:id', checkAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'DB error' });
  }
});

// Fallback to index.html for frontend routes (if any)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
