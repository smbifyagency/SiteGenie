import express from "express";
import { Handler } from "@netlify/functions";
import serverlessExpress from "@vendia/serverless-express";
import { registerRoutes } from "./routes.js";
import session from "express-session";
import MemoryStore from "memorystore";

// Create async function to set up the app
async function createApp() {
  const app = express();

  // Set up session middleware for Netlify
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'localsite-builder-secret-key-' + Math.random(),
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));

  // Setup routes
  await registerRoutes(app);

  return app;
}

// Create Netlify handler
let serverlessHandler: any;

export const handler: Handler = async (event, context) => {
  if (!serverlessHandler) {
    const app = await createApp();
    serverlessHandler = serverlessExpress({ app });
  }
  return serverlessHandler(event, context);
};

