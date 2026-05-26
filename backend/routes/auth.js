const { Router } = require('express');
const { authenticateJWT, requireGuest } = require('../middlewares/auth');
const { register, login } = require('../controllers/auth');

const router = Router();

router.post('/register', authenticateJWT, requireGuest, register);
router.post('/login', authenticateJWT, requireGuest, login);

module.exports = router;
