import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import geeRoutes from './routes/geeRoutes.js';
import { initGEE } from './gee.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));
app.use('/', geeRoutes);

app.use((err, req, res, next) => {
  console.error('Global error handler', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

(async () => {
  try {
    console.log('Initializing Google Earth Engine');
    await initGEE();
    console.log('GEE initialized successfully');
  } catch (err) {
    console.error('Unable to initialize GEE in startup', err.message || err);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free the port or set PORT in .env to another value.`);
    } else {
      console.error('Server error', err);
    }
    process.exit(1);
  });
})();
