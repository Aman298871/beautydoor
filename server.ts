import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDatabase, db } from './backend/db/database.ts';
import { authRouter } from './backend/routes/authRoutes.ts';
import { storefrontRouter } from './backend/routes/storefrontRoutes.ts';
import { adminRouter } from './backend/routes/adminRoutes.ts';
import { faqRouter } from './backend/routes/faqRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // 1. Initialize Normalized Database Schema & Seed Data
  await initDatabase();

  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint for Render / monitoring
  app.get('/health', async (_req: Request, res: Response) => {
    let dbStatus = 'ready';
    try {
      await db.query('SELECT 1 as health_check', []);
    } catch (e: any) {
      dbStatus = 'unreachable: ' + (e.message || String(e));
    }

    const isHealthy = dbStatus === 'ready';
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      database: dbStatus,
      engine: db.isPostgres ? 'postgres' : 'sqlite',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Request logger for security monitoring
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // --- API MOUNTING ---
  app.use('/api/auth', authRouter);
  app.use('/api/storefront', storefrontRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/faq', faqRouter);
  app.use('/api/admin/faqs', faqRouter); // Convenient alias for admin FAQ management

  // Backward compatibility alias for any existing clients
  app.use('/api', storefrontRouter);

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'custom'
    });

    app.use(vite.middlewares);

    // Dynamic Host & Path Dispatcher:
    // Host `admin.beautydoor.in` OR `/admin/*` routes strictly to admin.html
    // Host `beautydoor.in` OR `/*` routes strictly to index.html (Storefront)
    app.get('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      const host = req.headers.host || '';
      const isAdminApp = host.startsWith('admin.') || url.startsWith('/admin');

      try {
        const templateFile = isAdminApp
          ? path.resolve(__dirname, 'admin.html')
          : path.resolve(__dirname, 'index.html');

        let template = fs.readFileSync(templateFile, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (req: Request, res: Response) => {
      const host = req.headers.host || '';
      const isAdminApp = host.startsWith('admin.') || req.path.startsWith('/admin');
      const file = isAdminApp
        ? path.join(distPath, 'admin.html')
        : path.join(distPath, 'index.html');

      if (fs.existsSync(file)) {
        res.sendFile(file);
      } else {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ BeautyDoor Dual-App Platform listening on port ${PORT}`);
    console.log(`   Customer Storefront: http://localhost:${PORT}/ (Domain: beautydoor.in)`);
    console.log(`   Admin Control Panel: http://localhost:${PORT}/admin (Domain: admin.beautydoor.in)`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`[Server] ${signal} signal received. Closing HTTP server and database pool...`);
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await db.close();
        console.log('[Server] Database pool successfully shut down.');
      } catch (err) {
        console.error('[Server] Error while closing database connection:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch(err => {
  console.error('Failed to start BeautyDoor server:', err);
});
