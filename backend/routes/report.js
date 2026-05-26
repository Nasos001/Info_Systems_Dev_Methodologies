const { Router } = require('express');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { createReport, getMyReports, editReport } = require('../controllers/report');

const router = Router();

router.post('/', authenticateJWT, authorizeRole(['citizen']), upload.single('image'), createReport);
router.get('/my', authenticateJWT, authorizeRole(['citizen']), getMyReports);
router.patch('/:id', authenticateJWT, authorizeRole(['citizen']), editReport);

module.exports = router;
