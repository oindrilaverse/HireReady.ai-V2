import './env.js';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Request Timeout Middleware (Vercel Serverless aligned: 25s)
app.use((req, res, next) => {
  res.setTimeout(25000, () => {
    const errorMsg = `[TIMEOUT] Request timed out: ${req.method} ${req.originalUrl}\n`;
    console.error(errorMsg.trim());
    try {
      fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
    } catch (e) {}
    
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        data: null,
        error: {
          message: 'Request timed out after 25 seconds.',
          code: 'REQUEST_TIMEOUT'
        }
      });
    }
  });
  next();
});

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
    success: true,
    data: {
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    },
    error: null
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
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} | WARN | ${msg}`);
  } catch (e) {}
  
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  const errorMsg = `SERVER ERROR: ${err.stack || err.message || err}\n`;
  console.error(errorMsg.trim());
  try {
    fs.appendFileSync(logFile, `${new Date().toISOString()} | ERROR | ${errorMsg}`);
  } catch (e) {}
  
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false,
      data: null,
      error: {
        message: err.message || 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
