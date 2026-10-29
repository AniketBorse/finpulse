import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRouter from './routes/api.routes';
import { errorHandler } from './middlewares/error.middleware';
import prisma from './prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4200';

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [CLIENT_URL, 'http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please retry later.',
  },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      system: 'FinPulse Enterprise SaaS API',
      database: 'MySQL 8.0 (Connected)',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'MySQL Connection Error',
      error: error.message,
    });
  }
});

// Root Landing HTML Page
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>FinPulse Enterprise API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #F8FAFC; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 36px; max-width: 500px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
          h1 { color: #10B981; margin: 0 0 12px; font-size: 24px; font-weight: 700; }
          p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          a.btn { display: inline-block; background: #10B981; color: #022C22; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; margin-bottom: 16px; transition: background 0.2s; }
          a.btn:hover { background: #34D399; }
          .links { margin-top: 16px; font-size: 12px; }
          .links a { color: #38BDF8; text-decoration: none; margin: 0 8px; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">API Server Active (Port 5000)</div>
          <h1>FinPulse Enterprise API</h1>
          <p>The backend REST API server is running on port 5000.<br>The interactive Google Stitch web app is hosted at port 4200.</p>
          <a class="btn" href="http://localhost:4200">Open FinPulse Web App &rarr;</a>
          <div class="links">
            <a href="/api/v1">API v1 Index</a> &bull;
            <a href="/api/health">Health Check</a>
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }
  res.redirect('/api/v1');
});

// REST Routes
app.use('/api/v1', apiRouter);

// Catch-All 404 JSON Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    web_app: 'http://localhost:4200',
    available_endpoints: {
      discovery: 'GET /api/v1',
      health: 'GET /api/health',
      summary: 'GET /api/v1/finances/summary',
      monthly: 'GET /api/v1/finances/monthly',
      reports: 'GET /api/v1/reports/export?format=pdf|csv',
    },
  });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` FinPulse Enterprise B2B SaaS Backend Started`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` REST API: http://localhost:${PORT}/api/v1`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await prisma.$disconnect();
  });
});
