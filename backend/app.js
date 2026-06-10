require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');
const techRoutes = require('./routes/tech');
const categoryRoutes = require('./routes/category');
const fileRoutes = require('./routes/file');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tech', techRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/files', fileRoutes);

// Serve the built frontend (dist/) if it exists next to this file.
const distPath = path.join(__dirname, 'dist');
if (require('fs').existsSync(distPath)) {
  app.use(express.static(distPath));
  // Change regex to a catch-all string '*' so Vercel & React Router handle fallback correctly
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ONLY run app.listen if we are NOT on Vercel (Local / Docker environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// CRITICAL FOR VERCEL: Export the app
module.exports = app;
