const pool = require('../config/db');
const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1).max(50, { message: 'Category name must be between 1 and 50 characters' }),
});

const idParamSchema = z.object({
  id: z.preprocess((val) => parseInt(val), z.number().int().positive()),
});

async function listCategories(req, res) {
  try {
    const [rows] = await pool.execute('SELECT id, name FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('listCategories error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function createCategory(req, res) {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { name } = parsed.data;
    await pool.execute('INSERT INTO categories (name) VALUES (?)', [name]);

    res.status(201).json({ success: true, message: 'Category created successfully.' });
  } catch (err) {
    console.error('createCategory error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function deleteCategory(req, res) {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const { id } = parsed.data;
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('deleteCategory error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { listCategories, createCategory, deleteCategory };
