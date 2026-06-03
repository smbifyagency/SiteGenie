import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { loginSchema, registerSchema } from "../shared/schema.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Augment express-session types so routes.ts can use req.session.userId etc.
declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAuthenticated?: boolean;
    guestApiKeys?: {
      openai?: string;
      gemini?: string;
      openrouter?: string;
      netlify?: string;
      unsplash?: string;
      deepseek?: string;
    };
  }
}

// Auth secret for token signing
const AUTH_SECRET = process.env.SESSION_SECRET || "smbifyvibe-very-secure-2026";
const COOKIE_NAME = "smbify_auth";
const TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const GUEST_API_KEYS_COOKIE_NAME = "smbify_guest_api_keys";
const GUEST_API_KEYS_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const GUEST_API_KEY_PROVIDERS = ["openai", "gemini", "openrouter", "deepseek", "netlify", "unsplash"] as const;
const USE_SECURE_COOKIES = process.env.NODE_ENV === "production";

type GuestApiKeyProvider = (typeof GUEST_API_KEY_PROVIDERS)[number];
type GuestApiKeys = Partial<Record<GuestApiKeyProvider, string>>;

function sanitizeGuestApiKeys(input: unknown): GuestApiKeys {
  if (!input || typeof input !== "object") {
    return {};
  }

  const sanitized: GuestApiKeys = {};
  for (const provider of GUEST_API_KEY_PROVIDERS) {
    const value = (input as Record<string, unknown>)[provider];
    if (typeof value !== "string") {
      continue;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue.includes("•")) {
      continue;
    }

    sanitized[provider] = trimmedValue;
  }

  return sanitized;
}

function getGuestApiKeysCipherKey(): Buffer {
  return crypto.createHash("sha256").update(AUTH_SECRET).digest();
}

function encryptGuestApiKeys(guestApiKeys: GuestApiKeys): string {
  const payload = JSON.stringify({
    guestApiKeys: sanitizeGuestApiKeys(guestApiKeys),
    exp: Date.now() + GUEST_API_KEYS_EXPIRY_MS,
  });
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getGuestApiKeysCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptGuestApiKeys(token: string | undefined): GuestApiKeys {
  if (!token) {
    return {};
  }

  try {
    const [ivB64, authTagB64, encryptedB64] = token.split(".");
    if (!ivB64 || !authTagB64 || !encryptedB64) {
      return {};
    }

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getGuestApiKeysCipherKey(),
      Buffer.from(ivB64, "base64url")
    );
    decipher.setAuthTag(Buffer.from(authTagB64, "base64url"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedB64, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(decrypted) as { guestApiKeys?: GuestApiKeys; exp?: number };

    if (!payload.exp || payload.exp < Date.now()) {
      return {};
    }

    return sanitizeGuestApiKeys(payload.guestApiKeys);
  } catch {
    return {};
  }
}

// Simple signed token (HMAC-SHA256 based) — no external dependencies
function createAuthToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + TOKEN_EXPIRY_MS });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
  return `${payloadB64}.${signature}`;
}

function verifyAuthToken(token: string): string | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload.userId || null;
  } catch {
    return null;
  }
}

// Helper: set auth cookie on response
function setAuthCookie(res: Response, userId: string) {
  const token = createAuthToken(userId);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: USE_SECURE_COOKIES,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });
}

// Helper: clear auth cookie
function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: USE_SECURE_COOKIES,
    sameSite: "lax",
    path: "/",
  });
}

export function setGuestApiKeysCookie(res: Response, guestApiKeys: GuestApiKeys) {
  const sanitizedGuestApiKeys = sanitizeGuestApiKeys(guestApiKeys);
  if (Object.keys(sanitizedGuestApiKeys).length === 0) {
    res.clearCookie(GUEST_API_KEYS_COOKIE_NAME, {
      httpOnly: true,
      secure: USE_SECURE_COOKIES,
      sameSite: "lax",
      path: "/",
    });
    return;
  }

  res.cookie(GUEST_API_KEYS_COOKIE_NAME, encryptGuestApiKeys(sanitizedGuestApiKeys), {
    httpOnly: true,
    secure: USE_SECURE_COOKIES,
    sameSite: "lax",
    maxAge: GUEST_API_KEYS_EXPIRY_MS,
    path: "/",
  });
}

// Helper: parse cookies from request header (zero dependencies)
function parseCookies(req: Request): Record<string, string> {
  const cookieHeader = req.headers.cookie || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name.trim()] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

// Helper: extract userId from cookie
function getUserIdFromRequest(req: Request): string | null {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyAuthToken(token);
}

function getGuestApiKeysFromRequest(req: Request): GuestApiKeys {
  const cookies = parseCookies(req);
  return decryptGuestApiKeys(cookies[GUEST_API_KEYS_COOKIE_NAME]);
}

// Setup authentication middleware and routes
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // No external cookie-parser needed — we parse cookies manually

  // In-memory user cache to avoid querying Supabase on every single request.
  // Short TTL (2 minutes) keeps data fresh while cutting Disk IO by ~90%.
  const userCache = new Map<string, { user: any; ts: number }>();
  const USER_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  function getCachedUser(userId: string): any | undefined {
    const entry = userCache.get(userId);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > USER_CACHE_TTL) {
      userCache.delete(userId);
      return undefined;
    }
    return entry.user;
  }

  function setCachedUser(userId: string, user: any) {
    userCache.set(userId, { user, ts: Date.now() });
    // Prevent unbounded growth — evict old entries when cache gets large
    if (userCache.size > 500) {
      const cutoff = Date.now() - USER_CACHE_TTL;
      for (const [key, val] of userCache) {
        if (val.ts < cutoff) userCache.delete(key);
      }
    }
  }

  // Backward-compatibility middleware: populate req.session and req.user from JWT
  // This allows routes.ts to keep using req.session.userId etc.
  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    const userId = getUserIdFromRequest(req);
    const guestApiKeys = getGuestApiKeysFromRequest(req);
    const guestSessionUserId = Object.keys(guestApiKeys).length > 0 ? "guest" : undefined;
    (req as any).session = {
      userId: userId || guestSessionUserId,
      isAuthenticated: !!userId,
      guestApiKeys,
    };
    // Also set req.user for GET routes that check (req as any).user?.id
    if (userId) {
      if (userId === "admin") {
        (req as any).user = {
          id: "admin",
          email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
          firstName: "Admin",
          lastName: "SiteGenie",
          role: "admin",
          isActive: true,
        };
      } else {
        // Check in-memory cache first to avoid hitting Supabase on every request
        const cached = getCachedUser(userId);
        if (cached) {
          (req as any).user = cached;
        } else {
          try {
            const user = await storage.getUser(userId);
            if (user) {
              (req as any).user = user;
              setCachedUser(userId, user);
            } else {
              const minimal = {
                id: userId,
                email: null,
                firstName: null,
                lastName: null,
                role: "user",
                isActive: true,
              };
              (req as any).user = minimal;
              setCachedUser(userId, minimal);
            }
          } catch (e) {
            (req as any).user = {
              id: userId,
              email: null,
              firstName: null,
              lastName: null,
              role: "user",
              isActive: true,
            };
          }
        }
      }
    }
    next();
  });

  // Helper to ensure test users exist in storage — runs only ONCE per process
  let adminEnsured = false;
  const ensureTestUsers = async () => {
    if (adminEnsured) return; // Skip if already checked this Lambda instance
    // Admin User — requires ADMIN_EMAIL and ADMIN_PASSWORD env vars
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) { adminEnsured = true; return; }

    let admin = await storage.getUserByEmail(adminEmail);
    if (!admin) {
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        email: adminEmail,
        password: hashedAdminPassword,
        firstName: "SiteGenie",
        lastName: "Admin",
        role: "admin",
        isActive: true,
        websiteLimit: 9999
      });
    } else if (admin.role !== "admin") {
      await storage.updateUser(admin.id, { role: "admin", websiteLimit: 9999 });
    }
    adminEnsured = true;
  };

  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      await ensureTestUsers();

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Set JWT cookie
      setAuthCookie(res, user.id);

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register route
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, confirmPassword } = registerSchema.parse(req.body);

      await ensureTestUsers();

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "user",
        isActive: true,
      });

      // Set JWT cookie
      setAuthCookie(res, newUser.id);

      const { password: _, ...userWithoutPassword } = newUser;
      res.json({ user: userWithoutPassword, message: "Registration successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Supabase Auth Sync Route
  app.post("/api/auth/supabase", async (req: Request, res: Response) => {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ message: "Access token missing" });
    }

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase is not configured on the server");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: { user: sbUser }, error } = await supabase.auth.getUser(access_token);

      if (error || !sbUser || !sbUser.email) {
        console.error("Supabase verification failed", error);
        return res.status(401).json({ message: "Invalid Supabase session" });
      }

      const email = sbUser.email.toLowerCase();
      await ensureTestUsers();

      let user = await storage.getUserByEmail(email);
      if (!user) {
        const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);
        const rawName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || "Supabase User";
        const parts = rawName.split(" ");
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || "User";

        user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImageUrl: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || null,
          role: "user",
          isActive: true,
          websiteLimit: 3,
        });
      }

      // Set JWT cookie
      setAuthCookie(res, user.id);

      // Safely update last login
      storage.updateUser(user.id, { lastLoginAt: new Date() }).catch(e => console.error("Last login update error: ", e));

      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword, message: "Authentication successful" });
    } catch (error) {
      console.error("Supabase Auth Error:", error);
      res.status(500).json({ message: "Server configuration or internal error during authentication" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ message: "Logout successful" });
  });

  // Update profile
  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await ensureTestUsers();

      let user = await storage.getUser(userId);

      // If user not found in app_users, auto-create from request data
      if (!user) {
        const { firstName, lastName } = req.body;
        try {
          user = await storage.createUser({
            id: userId,
            email: `user-${userId.substring(0, 8)}@sitegenie.app`,
            password: await bcrypt.hash(crypto.randomUUID(), 10),
            firstName: firstName || null,
            lastName: lastName || null,
            role: "user",
            isActive: true,
            websiteLimit: 3,
          } as any);
        } catch (createErr) {
          console.error("Auto-create user failed:", createErr);
          return res.status(404).json({ message: "User not found" });
        }
      }

      const { firstName, lastName } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName: firstName || null,
        lastName: lastName || null,
      });

      const { password: _, ...userWithoutPassword } = (updatedUser || user) as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user route
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Return admin user if session is for admin
      if (userId === "admin") {
        const adminUser = {
          id: "admin",
          email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
          firstName: "Admin",
          lastName: "SiteGenie",
          role: "admin",
          websiteLimit: 999999,
          websitesCreated: 0,
          isActive: true,
          lastLoginAt: new Date()
        };
        return res.json(adminUser);
      }

      // Get database user
      let user = await storage.getUser(userId);
      if (!user) {
        // User not yet in app_users — try to get info from backward-compat middleware
        const reqUser = (req as any).user;
        if (reqUser && reqUser.email) {
          // Auto-create from middleware data
          try {
            user = await storage.createUser({
              id: userId,
              email: reqUser.email,
              password: await bcrypt.hash(crypto.randomUUID(), 10),
              firstName: reqUser.firstName || null,
              lastName: reqUser.lastName || null,
              role: reqUser.role || "user",
              isActive: true,
              websiteLimit: 3,
            } as any);
          } catch (e) {
            // Might fail if email conflict, that's ok
            console.error("Auto-create user in /api/auth/user failed:", e);
          }
        }

        // Still no user? Return minimal profile so frontend doesn't break
        if (!user) {
          return res.json({
            id: userId,
            email: reqUser?.email || null,
            firstName: reqUser?.firstName || null,
            lastName: reqUser?.lastName || null,
            role: "user",
            websiteLimit: 3,
            websitesCreated: 0,
            isActive: true,
            lastLoginAt: new Date()
          });
        }
      }

      if (!user.isActive) {
        clearAuthCookie(res);
        return res.status(401).json({ message: "Account is inactive" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId === "admin") {
      (req as any).user = {
        id: "admin",
        email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
        firstName: "Admin",
        lastName: "SiteGenie",
        role: "admin",
        isActive: true,
      };
      return next();
    }

    // Try to get user from storage
    let user = await storage.getUser(userId);

    if (user && !user.isActive) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!user) {
      // MemStorage resets on Vercel serverless — trust the valid JWT
      // and create a minimal user object so the request can proceed
      (req as any).user = {
        id: userId,
        email: null,
        firstName: null,
        lastName: null,
        role: "user",
        isActive: true,
      };
    } else {
      (req as any).user = user;
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user is admin
export const isAdmin: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId === "admin") {
      (req as any).user = {
        id: "admin",
        email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
        firstName: "Admin",
        lastName: "SiteGenie",
        role: "admin",
        isActive: true,
      };
      return next();
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isActive || (user.role !== "admin" && user.id !== "admin")) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("AI User authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check if user can access AI features
export const isAIUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (userId === "admin") {
      (req as any).user = {
        id: "admin",
        email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
        firstName: "Admin",
        lastName: "SiteGenie",
        role: "admin",
        isActive: true,
      };
      return next();
    }

    const user = await storage.getUser(userId);
    if (user && !user.isActive) {
      return res.status(403).json({ message: "AI features require an active account." });
    }

    (req as any).user = user || {
      id: userId,
      email: null,
      firstName: null,
      lastName: null,
      role: "user",
      isActive: true,
    };
    next();
  } catch (error) {
    console.error("AI User authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Custom middleware for website generation that allows guest access
export const allowGuestWebsiteGeneration: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existingUser = (req as any).user;
    if (existingUser?.id && existingUser.isActive !== false) {
      return next();
    }

    const userId = getUserIdFromRequest(req);

    if (!userId) {
      // Guest user (no token)
      (req as any).user = {
        id: "guest",
        email: "guest@demo.com",
        firstName: "Guest",
        lastName: "SiteGenie",
        role: "guest",
        isActive: true,
      };
      return next();
    }

    if (userId === "admin") {
      (req as any).user = {
        id: "admin",
        email: process.env.ADMIN_EMAIL || "admin@sitegenie.app",
        firstName: "Admin",
        lastName: "SiteGenie",
        role: "admin",
        isActive: true,
      };
      return next();
    }

    const user = await storage.getUser(userId);
    if (user && !user.isActive) {
      // Fall back to guest for inactive users
      (req as any).user = {
        id: "guest",
        email: "guest@demo.com",
        firstName: "Guest",
        lastName: "SiteGenie",
        role: "guest",
        isActive: true,
      };
      return next();
    }

    if (!user) {
      (req as any).user = {
        id: userId,
        email: null,
        firstName: null,
        lastName: null,
        role: "user",
        isActive: true,
      };
      return next();
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Website generation authentication error:", error);
    const existingUser = (req as any).user;
    if (existingUser?.id && existingUser.isActive !== false) {
      return next();
    }

    (req as any).user = {
      id: "guest",
      email: "guest@demo.com",
      firstName: "Guest",
      lastName: "User",
      role: "guest",
      isActive: true,
    };
    next();
  }
};