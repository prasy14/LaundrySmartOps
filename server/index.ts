import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { SyncScheduler } from "./services/scheduler";
import { fileURLToPath } from 'url';
import path from "path";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Set trust proxy before session middleware
app.set("trust proxy", 1);

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
const SessionStore = MemoryStore(session);
app.use(
  session({
    name: 'smartops.sid',
    cookie: {
      maxAge: 86400000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/',
      httpOnly: true
    },
    store: new SessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "development_secret",
  })
);

// Initialize Passport and session handling
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Add session debug logging
  if (path.startsWith('/api/auth')) {
    log(`Session ID: ${req.sessionID}, User: ${req.user?.username}`, 'session');
    log(`Cookie Headers: ${req.headers.cookie}`, 'session');
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Register API routes first
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Initialize sync scheduler with API key
    const apiKey = process.env.SQ_INSIGHTS_API_KEY;
    if (apiKey) {
      const syncScheduler = new SyncScheduler(apiKey);
      syncScheduler.start();
      log('Sync scheduler initialized and started', 'scheduler');
    } else {
      log('Warning: SQ_INSIGHTS_API_KEY not provided, sync scheduler not started', 'scheduler');
    }
   app.use(express.static(path.join(process.cwd(), "public"))); 
    // Setup Vite or serve static files last
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      // Production: serve /public assets
    
      serveStatic(app);
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Server startup error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'server');
    process.exit(1);
  }
})();