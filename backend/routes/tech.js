const { Router } = require('express');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth');
const { getMyReports, updateStatus } = require('../controllers/tech');

const router = Router();

router.get('/my-reports', authenticateJWT, authorizeRole(['technician']), getMyReports);
router.patch('/report/:id/status', authenticateJWT, authorizeRole(['technician']), updateStatus);

module.exports = router;
