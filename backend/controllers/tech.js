const pool = require('../config/db');
const { z } = require('zod');

const idParamSchema = z.object({
  id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
});

const updateStatusSchema = z.object({
  status: z.enum(['NEW', 'REJECTED', 'DUPLICATE', 'ONGOING', 'COMPLETED'], {
    errorMap: () => ({ message: 'Invalid status value provided' }),
  }),
});

async function getMyReports(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, address, description, status, image_path, created_at
       FROM reports
       WHERE assigned_tech_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );
    res.json(rows);
  } catch (err) {
    console.error('tech getMyReports error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function updateStatus(req, res) {
  try {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      const errors = paramsParsed.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const bodyParsed = updateStatusSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      const errors = bodyParsed.error.issues.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { id } = paramsParsed.data;
    const { status } = bodyParsed.data;

    const [report] = await pool.execute(
      'SELECT id FROM reports WHERE id = ? AND assigned_tech_id = ?',
      [id, req.user.id],
    );
    if (report.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found or not assigned to you.' });
    }

    await pool.execute('UPDATE reports SET status = ? WHERE id = ?', [status, id]);

    res.json({ success: true, message: 'Status updated successfully.' });
  } catch (err) {
    console.error('updateStatus error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { getMyReports, updateStatus };
