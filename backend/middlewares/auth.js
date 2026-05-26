const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = { role: 'guest' };
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
  } catch {
    req.user = { role: 'guest' };
  }
  next();
}

function requireGuest(req, res, next) {
  if (req.user.role !== 'guest') {
    return res.status(403).json({ success: false, message: 'You are already logged in.' });
  }
  next();
}

function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticateJWT, requireGuest, authorizeRole };
