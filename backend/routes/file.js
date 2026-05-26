const { Router } = require('express');
const path = require('path');
const fs = require('fs');

const router = Router();

router.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  res.sendFile(filePath);
});

module.exports = router;
