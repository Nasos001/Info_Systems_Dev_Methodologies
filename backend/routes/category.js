const { Router } = require('express');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth');
const { listCategories, createCategory, deleteCategory } = require('../controllers/category');

const router = Router();

router.get('/', authenticateJWT, listCategories);
router.post('/', authenticateJWT, authorizeRole(['admin']), createCategory);
router.delete('/:id', authenticateJWT, authorizeRole(['admin']), deleteCategory);

module.exports = router;
