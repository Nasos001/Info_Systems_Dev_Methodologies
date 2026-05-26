const { Router } = require('express');
const { authenticateJWT, authorizeRole } = require('../middlewares/auth');
const {
  getAllReports,
  listTechnicians,
  createTechnician,
  assignTechnician,
} = require('../controllers/admin');

const router = Router();

router.get('/reports', authenticateJWT, authorizeRole(['admin']), getAllReports);
router.get('/technicians', authenticateJWT, authorizeRole(['admin']), listTechnicians);
router.post('/technicians', authenticateJWT, authorizeRole(['admin']), createTechnician);
router.patch('/assign', authenticateJWT, authorizeRole(['admin']), assignTechnician);

module.exports = router;
