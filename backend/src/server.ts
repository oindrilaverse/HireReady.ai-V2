import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import analyzeRouter from './routes/analyze.js';
import jobsRouter from './routes/jobs.js';
import usersRouter from './routes/users.js';
import chatRouter from './routes/chat.js';

const logFile = path.join(__dirname, '../debug.log');

// Ensure log file exists
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '--- Backend Log Started ---\n');
}

// Process-level error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} | FATAL | Unhandled Rejection: ${reason}\n`);
  } catch (e) {}
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} | FATAL | Uncaught Exception: ${err.message}\n`);
  } catch (e) {}
  // Give time for logging before exiting
  setTimeout(() => process.exit(1), 1000);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Temporarily allow all origins to bypass deployment strictness
app.use(cors({ origin: '*' }));

// Detailed Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]\n`;
    fs.appendFileSync(logFile, msg);
    console.log(msg.trim());
  });
  
  const incoming = `Incoming: ${req.method} ${req.originalUrl} | Content-Type: ${req.headers['content-type']}\n`;
  fs.appendFileSync(logFile, incoming);
  console.log(incoming.trim());
  next();
});

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);

// 404 Handler
app.use((req, res) => {
  const msg = `[404] ${req.method} ${req.originalUrl}\n`;
  console.warn(msg.trim());
  fs.appendFileSync(logFile, `${new Date().toISOString()} | WARN | ${msg}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  const errorMsg = `SERVER ERROR: ${err.stack || err.message || err}\n`;
  console.error(errorMsg.trim());
  fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
  
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message || 'An unexpected error occurred' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
