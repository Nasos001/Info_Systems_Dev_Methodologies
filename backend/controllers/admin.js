const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { z } = require('zod');

const createTechnicianSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  full_name: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
});

const assignTechnicianSchema = z.object({
  report_id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
  technician_id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
});

async function getAllReports(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, category_id, address, description, status, image_path, assigned_tech_id, created_at
       FROM reports
       ORDER BY created_at DESC`,
    );
    res.json(rows);
  } catch (err) {
    console.error('getAllReports error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function listTechnicians(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, full_name, email FROM users WHERE role = ?',
      ['technician'],
    );
    res.json(rows);
  } catch (err) {
    console.error('listTechnicians error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function createTechnician(req, res) {
  try {
    const parsed = createTechnicianSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { email, password, full_name } = parsed.data;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)',
      [email, hash, 'technician', full_name],
    );

    res.status(201).json({ success: true, message: 'Technician created successfully.' });
  } catch (err) {
    console.error('createTechnician error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function assignTechnician(req, res) {
  try {
    const parsed = assignTechnicianSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { report_id, technician_id } = parsed.data;

    const [tech] = await pool.execute('SELECT id FROM users WHERE id = ? AND role = ?', [technician_id, 'technician']);
    if (tech.length === 0) {
      return res.status(404).json({ success: false, message: 'Technician not found.' });
    }

    const [report] = await pool.execute('SELECT id FROM reports WHERE id = ?', [report_id]);
    if (report.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    await pool.execute('UPDATE reports SET assigned_tech_id = ? WHERE id = ?', [technician_id, report_id]);

    res.json({ success: true, message: 'Technician assigned successfully.' });
  } catch (err) {
    console.error('assignTechnician error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { getAllReports, listTechnicians, createTechnician, assignTechnician };
