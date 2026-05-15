const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const { ensureTables } = require('./config/ensureTables');

// Middleware
const corsOriginEnv = (process.env.CORS_ORIGIN || '').trim();
const allowAllOrigins = corsOriginEnv === '*';
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // If explicitly allow all, reflect request origin (cannot use "*" with credentials)
      if (allowAllOrigins) return callback(null, true);

      // Allow localhost and any local network IP (dev use-cases)
      const isLocalhost =
        /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        );
      if (isLocalhost) return callback(null, true);

      // Allow explicit origins (recommended for production, e.g. https://domain.com)
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: !allowAllOrigins
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const routes = require('./routes/index');
app.use('/api', routes);

// Ensure required tables exist
ensureTables().catch((err) => {
  console.error('DB init failed:', err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Algoods API is running', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Algoods API running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access from other devices: http://<YOUR_IP>:${PORT}`);
});

module.exports = app;
