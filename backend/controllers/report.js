const pool = require('../config/db');
const { z } = require('zod');

const createReportSchema = z.object({
  category_id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
  address: z.string().min(1, { message: 'Address is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
});

async function createReport(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required.' });
    }

    const parsed = createReportSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { category_id, address, description } = parsed.data;
    const imagePath = req.file.filename;

    await pool.execute(
      `INSERT INTO reports (user_id, category_id, address, description, status, image_path)
       VALUES (?, ?, ?, ?, 'NEW', ?)`,
      [req.user.id, category_id, address, description, imagePath],
    );

    res.status(201).json({ success: true, message: 'Report submitted successfully.' });
  } catch (err) {
    console.error('createReport error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function getMyReports(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, category_id, address, description, status, image_path, created_at
       FROM reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    res.json(rows);
  } catch (err) {
    console.error('getMyReports error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

const editReportSchema = z
  .object({
    category_id: z.preprocess((val) => parseInt(val), z.number().int().positive()).optional(),
    address: z.string().min(1, { message: 'Address is required' }).optional(),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

async function editReport(req, res) {
  try {
    const idParsed = parseInt(req.params.id);
    if (isNaN(idParsed) || idParsed <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid report ID.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, user_id, status FROM reports WHERE id = ?',
      [idParsed],
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = rows[0];

    if (report.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this report.' });
    }

    if (report.status !== 'NEW') {
      return res.status(400).json({ success: false, message: 'Only reports with status NEW can be edited.' });
    }

    const parsed = editReportSchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { category_id, address, description } = parsed.data;

    const fields = [];
    const values = [];
    if (category_id !== undefined) { fields.push('category_id = ?'); values.push(category_id); }
    if (address     !== undefined) { fields.push('address = ?');     values.push(address); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }

    values.push(idParsed);

    await pool.execute(
      `UPDATE reports SET ${fields.join(', ')} WHERE id = ?`,
      values,
    );

    res.json({ success: true, message: 'Report updated successfully.' });
  } catch (err) {
    console.error('editReport error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { createReport, getMyReports, editReport };
