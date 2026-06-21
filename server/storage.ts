import {
  type Website,
  type InsertWebsite,
  type UpdateWebsite,
  type BlogPost,
  type InsertBlogPost,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogTag,
  type InsertBlogTag,
  type BlogMedia,
  type InsertBlogMedia,
  type BlogPrompt,
  type InsertBlogPrompt,
  type UpdateBlogPrompt,
  type ApiSetting,
  type InsertApiSetting,
  type UpdateApiSetting,
  type AdSenseSetting,
  type InsertAdSenseSetting,
  type UpdateAdSenseSetting,
  type SiteSetting,
  type InsertSiteSetting,
  type UpdateSiteSetting,
  type DashboardMetrics,
  type InsertDashboardMetrics,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser
} from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  createWebsite(website: any): Promise<Website>;
  getWebsite(id: string): Promise<Website | undefined>;
  listWebsites(): Promise<Website[]>;
  listUserWebsites(userId: string): Promise<Website[]>; // Add method for user-specific websites
  updateWebsite(id: string, updates: UpdateWebsite): Promise<Website | undefined>; // Add update method
  deleteWebsite(id: string): Promise<boolean>; // Add delete method
  createBulkWebsites(websites: InsertWebsite[]): Promise<Website[]>;

  // Blog post methods
  createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  listBlogPosts(status?: string): Promise<BlogPost[]>;
  listBlogPostsWithPagination(page: number, limit: number, status?: string): Promise<{ posts: BlogPost[], total: number }>;
  updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;
  bulkDeleteBlogPosts(ids: string[]): Promise<boolean>;
  updateBlogPostStatus(id: string, status: string): Promise<BlogPost | undefined>;

  // Blog category methods
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  getBlogCategory(id: string): Promise<BlogCategory | undefined>;
  getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined>;
  listBlogCategories(): Promise<BlogCategory[]>;
  updateBlogCategory(id: string, updates: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined>;
  deleteBlogCategory(id: string): Promise<boolean>;

  // Blog tag methods
  createBlogTag(tag: InsertBlogTag): Promise<BlogTag>;
  getBlogTag(id: string): Promise<BlogTag | undefined>;
  getBlogTagBySlug(slug: string): Promise<BlogTag | undefined>;
  listBlogTags(): Promise<BlogTag[]>;
  updateBlogTag(id: string, updates: Partial<InsertBlogTag>): Promise<BlogTag | undefined>;
  deleteBlogTag(id: string): Promise<boolean>;

  // Blog media methods
  createBlogMedia(media: InsertBlogMedia): Promise<BlogMedia>;
  getBlogMedia(id: string): Promise<BlogMedia | undefined>;
  listBlogMedia(): Promise<BlogMedia[]>;
  deleteBlogMedia(id: string): Promise<boolean>;

  // API Settings methods
  createApiSetting(apiSetting: InsertApiSetting): Promise<ApiSetting>;
  getApiSetting(userId: string, name: string): Promise<ApiSetting | undefined>;
  listApiSettings(userId: string): Promise<ApiSetting[]>;
  updateApiSetting(id: string, updates: UpdateApiSetting): Promise<ApiSetting | undefined>;
  deleteApiSetting(id: string): Promise<boolean>;
  upsertApiSetting(userId: string, data: { name: string; displayName: string; apiKey?: string; accessKey?: string; secretKey?: string; isActive: boolean }): Promise<ApiSetting>;

  // Blog Prompt methods
  createBlogPrompt(blogPrompt: InsertBlogPrompt): Promise<BlogPrompt>;
  getBlogPrompt(id: string): Promise<BlogPrompt | undefined>;
  getBlogPromptByName(name: string): Promise<BlogPrompt | undefined>;
  listBlogPrompts(): Promise<BlogPrompt[]>;
  updateBlogPrompt(id: string, updates: UpdateBlogPrompt): Promise<BlogPrompt | undefined>;
  deleteBlogPrompt(id: string): Promise<boolean>;

  // AdSense Settings methods
  listAdSenseSettings(): Promise<AdSenseSetting[]>;
  updateAdSenseSetting(id: string, code: string): Promise<AdSenseSetting | undefined>;

  // Site Settings methods
  listSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(id: string): Promise<SiteSetting | undefined>;
  updateSiteSetting(id: string, updates: UpdateSiteSetting): Promise<SiteSetting | undefined>;
  upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting>;

  // Dashboard metrics methods
  createDashboardMetrics(metrics: InsertDashboardMetrics): Promise<DashboardMetrics>;
  getLatestDashboardMetrics(): Promise<DashboardMetrics | undefined>;
  listDashboardMetrics(): Promise<DashboardMetrics[]>;

  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  listUsers(): Promise<User[]>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;

  // Website limit operations
  checkWebsiteLimit(userId: string): Promise<{ canCreate: boolean, remaining: number, limit: number }>;
  incrementWebsiteCount(userId: string): Promise<User | undefined>;

  // Personal API Key operations (for individual users)
  updateUserPersonalApiKey(userId: string, apiKey: string): Promise<User | undefined>;
  clearUserPersonalApiKey(userId: string): Promise<User | undefined>;
  getUserPersonalApiKey(userId: string): Promise<string | null>;
}

export class MemStorage implements IStorage {
  private websites: Map<string, Website>;
  private blogPosts: Map<string, BlogPost>;
  private blogCategories: Map<string, BlogCategory>;
  private blogTags: Map<string, BlogTag>;
  private blogMedia: Map<string, BlogMedia>;
  private blogPrompts: Map<string, BlogPrompt>;
  private apiSettings: Map<string, ApiSetting>;
  private dashboardMetrics: Map<string, DashboardMetrics>;
  private users: Map<string, User>;
  private adsenseSettings: Map<string, AdSenseSetting>;
  private siteSettings: Map<string, SiteSetting>;

  constructor() {
    this.websites = new Map();
    this.blogPosts = new Map();
    this.blogCategories = new Map();
    this.blogTags = new Map();
    this.blogMedia = new Map();
    this.blogPrompts = new Map();
    this.apiSettings = new Map();
    this.dashboardMetrics = new Map();
    this.users = new Map();
    this.adsenseSettings = new Map();
    this.siteSettings = new Map();

    // Initialize with some default data (synchronously)
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize default API settings synchronously
    const defaultSettings = [
      {
        name: "openai",
        displayName: "OpenAI API",
        apiKey: null,
        accessKey: null,
        secretKey: null,
        isActive: false,
        userId: "default", // Add default userId
      },
      {
        name: "unsplash",
        displayName: "Unsplash API",
        apiKey: null,
        accessKey: null,
        secretKey: null,
        isActive: false,
        userId: "default", // Add default userId
      },
      {
        name: "openrouter",
        displayName: "OpenRouter API",
        apiKey: null,
        accessKey: null,
        secretKey: null,
        isActive: false,
        userId: "default", // Add default userId
      }
    ];

    for (const setting of defaultSettings) {
      const id = randomUUID();
      const now = new Date();
      const apiSetting: ApiSetting = {
        ...setting,
        id,
        createdAt: now,
        updatedAt: now,
      };
      this.apiSettings.set(id, apiSetting);
    }

    // Initialize default AdSense settings
    const adsenseDefaults = [
      { id: "header", name: "Header Banner", description: "728x90 leaderboard at top of page", code: "" },
      { id: "sidebar", name: "Sidebar Banner", description: "300x600 half-page ad in sidebar", code: "" },
      { id: "footer", name: "Footer Banner", description: "728x90 leaderboard at bottom", code: "" },
      { id: "in_content", name: "In-Content Banner", description: "336x280 rectangle within content", code: "" }
    ];

    for (const setting of adsenseDefaults) {
      const now = new Date();
      this.adsenseSettings.set(setting.id, { ...setting, createdAt: now, updatedAt: now });
    }

    // Initialize default site settings
    const siteSettingsDefaults = [
      // Analytics
      { id: "google-analytics", category: "analytics", name: "google_analytics", displayName: "Google Analytics", description: "Track website traffic and user behavior with Google Analytics", code: "", isActive: true, placement: "head" },
      { id: "facebook-pixel", category: "analytics", name: "facebook_pixel", displayName: "Facebook Pixel", description: "Track conversions and build audiences for Facebook ads", code: "", isActive: true, placement: "head" },
      // Verification
      { id: "google-search-console", category: "verification", name: "google_search_console", displayName: "Google Search Console", description: "Verify site ownership with Google Search Console", code: "", isActive: true, placement: "head" },
      { id: "ahrefs", category: "verification", name: "ahrefs", displayName: "Ahrefs", description: "Verify site ownership with Ahrefs Site Audit", code: "", isActive: true, placement: "head" },
      // Ads
      { id: "adsense-header", category: "ads", name: "adsense_header", displayName: "AdSense Header", description: "Display ads at the top of your pages", code: "", isActive: true, placement: "header" },
      { id: "adsense-sidebar", category: "ads", name: "adsense_sidebar", displayName: "AdSense Sidebar", description: "Display ads in the sidebar", code: "", isActive: true, placement: "body_start" },
      { id: "adsense-footer", category: "ads", name: "adsense_footer", displayName: "AdSense Footer", description: "Display ads at the bottom of your pages", code: "", isActive: true, placement: "footer" },
      { id: "google-ads", category: "ads", name: "google_ads", displayName: "Google Ads", description: "Track conversions and retargeting with Google Ads", code: "", isActive: true, placement: "head" },
      // Custom
      { id: "custom-head-scripts", category: "custom", name: "custom_head_scripts", displayName: "Custom Head Scripts", description: "Add custom scripts to the <head> section", code: "", isActive: true, placement: "head" },
      { id: "custom-footer-scripts", category: "custom", name: "custom_footer_scripts", displayName: "Custom Footer Scripts", description: "Add custom scripts before closing </body> tag", code: "", isActive: true, placement: "body_end" },
    ];

    for (const setting of siteSettingsDefaults) {
      const now = new Date();
      this.siteSettings.set(setting.id, { ...setting, createdAt: now, updatedAt: now });
    }

    this.initializeDefaultBlogPrompts();
  }

  private initializeDefaultBlogPrompts() {
    const defaultPrompts = [
      {
        name: "professional",
        displayName: "Professional & Informative",
        prompt: "Write a professional, informative blog post that establishes expertise and builds trust with potential customers. Focus on practical advice, industry insights, and actionable tips. Use a formal yet approachable tone that demonstrates authority while remaining accessible to the target audience.",
        isDefault: true,
        category: "professional",
        isActive: true,
      },
      {
        name: "local_seo",
        displayName: "Local SEO Focused",
        prompt: "Create a blog post optimized for local search with strong local keywords and location-specific content. Include mentions of the local area, nearby landmarks, and community references. Focus on how the service benefits the local community and why choosing a local business matters.",
        isDefault: false,
        category: "seo",
        isActive: true,
      },
      {
        name: "conversational",
        displayName: "Conversational & Friendly",
        prompt: "Write in a warm, conversational tone that feels like talking to a knowledgeable friend. Use simple language, personal anecdotes where appropriate, and make complex topics easy to understand. Include questions to engage readers and encourage them to take action.",
        isDefault: false,
        category: "conversational",
        isActive: true,
      },
      {
        name: "technical",
        displayName: "Technical & Detailed",
        prompt: "Provide in-depth technical information with detailed explanations, step-by-step processes, and industry terminology. Target readers who want comprehensive understanding and are comfortable with technical details. Include specific methods, tools, and best practices.",
        isDefault: false,
        category: "technical",
        isActive: true,
      }
    ];

    for (const prompt of defaultPrompts) {
      const id = randomUUID();
      const now = new Date();
      const blogPrompt: BlogPrompt = {
        ...prompt,
        id,
        createdAt: now,
        updatedAt: now,
        category: prompt.category ?? null,
        isActive: prompt.isActive ?? null,
        isDefault: prompt.isDefault ?? null,
      };
      this.blogPrompts.set(id, blogPrompt);
    }
  }


  // API Settings methods implementation
  async createApiSetting(insertApiSetting: InsertApiSetting): Promise<ApiSetting> {
    const id = randomUUID();
    const now = new Date();
    const apiSetting: ApiSetting = {
      ...insertApiSetting,
      id,
      createdAt: now,
      updatedAt: now,
      apiKey: insertApiSetting.apiKey ?? null,
      accessKey: insertApiSetting.accessKey ?? null,
      secretKey: insertApiSetting.secretKey ?? null,
      isActive: insertApiSetting.isActive ?? null,
    };
    this.apiSettings.set(id, apiSetting);
    return apiSetting;
  }

  async getApiSetting(userId: string, name: string): Promise<ApiSetting | undefined> {
    const settings = Array.from(this.apiSettings.values());
    return settings.find(setting => setting.userId === userId && setting.name === name);
  }

  async listApiSettings(userId: string): Promise<ApiSetting[]> {
    return Array.from(this.apiSettings.values())
      .filter(setting => setting.userId === userId)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async updateApiSetting(id: string, updates: UpdateApiSetting): Promise<ApiSetting | undefined> {
    const existingSetting = this.apiSettings.get(id);
    if (!existingSetting) return undefined;

    const updatedSetting: ApiSetting = {
      ...existingSetting,
      ...updates,
      updatedAt: new Date()
    };
    this.apiSettings.set(id, updatedSetting);
    return updatedSetting;
  }

  async deleteApiSetting(id: string): Promise<boolean> {
    return this.apiSettings.delete(id);
  }

  async upsertApiSetting(userId: string, data: { name: string; displayName: string; apiKey?: string; accessKey?: string; secretKey?: string; isActive: boolean }): Promise<ApiSetting> {
    const existing = await this.getApiSetting(userId, data.name);

    if (existing) {
      const updatedSetting = await this.updateApiSetting(existing.id, {
        apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
        accessKey: data.accessKey !== undefined ? data.accessKey : existing.accessKey,
        secretKey: data.secretKey !== undefined ? data.secretKey : existing.secretKey,
        isActive: data.isActive
      });
      if (!updatedSetting) {
        throw new Error('Failed to update API setting');
      }
      return updatedSetting;
    } else {
      return await this.createApiSetting({
        userId: userId,
        name: data.name,
        displayName: data.displayName,
        apiKey: data.apiKey || null,
        accessKey: data.accessKey || null,
        secretKey: data.secretKey || null,
        isActive: data.isActive
      });
    }
  }

  // Blog Prompt methods implementation
  async createBlogPrompt(insertBlogPrompt: InsertBlogPrompt): Promise<BlogPrompt> {
    const id = randomUUID();
    const now = new Date();
    const blogPrompt: BlogPrompt = {
      ...insertBlogPrompt,
      id,
      createdAt: now,
      updatedAt: now,
      category: insertBlogPrompt.category ?? null,
      isActive: insertBlogPrompt.isActive ?? null,
      isDefault: insertBlogPrompt.isDefault ?? null,
    };
    this.blogPrompts.set(id, blogPrompt);
    return blogPrompt;
  }

  async getBlogPrompt(id: string): Promise<BlogPrompt | undefined> {
    return this.blogPrompts.get(id);
  }

  async getBlogPromptByName(name: string): Promise<BlogPrompt | undefined> {
    const prompts = Array.from(this.blogPrompts.values());
    return prompts.find(prompt => prompt.name === name);
  }

  async listBlogPrompts(): Promise<BlogPrompt[]> {
    return Array.from(this.blogPrompts.values())
      .filter(prompt => prompt.isActive)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async updateBlogPrompt(id: string, updates: UpdateBlogPrompt): Promise<BlogPrompt | undefined> {
    const existingPrompt = this.blogPrompts.get(id);
    if (!existingPrompt) return undefined;

    const updatedPrompt: BlogPrompt = {
      ...existingPrompt,
      ...updates,
      updatedAt: new Date()
    };
    this.blogPrompts.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async deleteBlogPrompt(id: string): Promise<boolean> {
    return this.blogPrompts.delete(id);
  }

  // AdSense Settings methods implementation
  async listAdSenseSettings(): Promise<AdSenseSetting[]> {
    return Array.from(this.adsenseSettings.values());
  }

  async updateAdSenseSetting(id: string, code: string): Promise<AdSenseSetting | undefined> {
    const setting = this.adsenseSettings.get(id);
    if (!setting) return undefined;

    const updated: AdSenseSetting = { ...setting, code, updatedAt: new Date() };
    this.adsenseSettings.set(id, updated);
    return updated;
  }

  // Site Settings methods implementation
  async listSiteSettings(): Promise<SiteSetting[]> {
    return Array.from(this.siteSettings.values());
  }

  async getSiteSetting(id: string): Promise<SiteSetting | undefined> {
    return this.siteSettings.get(id);
  }

  async updateSiteSetting(id: string, updates: UpdateSiteSetting): Promise<SiteSetting | undefined> {
    const existingSetting = this.siteSettings.get(id);
    if (!existingSetting) return undefined;

    const updatedSetting: SiteSetting = {
      ...existingSetting,
      ...updates,
      updatedAt: new Date()
    };
    this.siteSettings.set(id, updatedSetting);
    return updatedSetting;
  }

  async upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting> {
    const id = (data as any).id || randomUUID();
    const existingSetting = this.siteSettings.get(id);

    if (existingSetting) {
      const updatedSetting: SiteSetting = {
        ...existingSetting,
        ...data,
        id: existingSetting.id,
        updatedAt: new Date()
      };
      this.siteSettings.set(id, updatedSetting);
      return updatedSetting;
    } else {
      const now = new Date();
      const newSetting: SiteSetting = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now
      } as SiteSetting;
      this.siteSettings.set(id, newSetting);
      return newSetting;
    }
  }

  // Dashboard metrics methods implementation
  async createDashboardMetrics(insertDashboardMetrics: InsertDashboardMetrics): Promise<DashboardMetrics> {
    const id = randomUUID();
    const now = new Date();
    const dashboardMetrics: DashboardMetrics = {
      ...insertDashboardMetrics,
      id,
      recordedAt: now,
      totalWebsites: insertDashboardMetrics.totalWebsites ?? null,
      totalBlogPosts: insertDashboardMetrics.totalBlogPosts ?? null,
      blogGenerationAttempts: insertDashboardMetrics.blogGenerationAttempts ?? null,
      blogGenerationSuccess: insertDashboardMetrics.blogGenerationSuccess ?? null,
      blogGenerationFailures: insertDashboardMetrics.blogGenerationFailures ?? null,
      totalPageViews: insertDashboardMetrics.totalPageViews ?? null,
      totalRevenue: insertDashboardMetrics.totalRevenue ?? null,
      activeProjects: insertDashboardMetrics.activeProjects ?? null,
      pendingTasks: insertDashboardMetrics.pendingTasks ?? null,
    };
    this.dashboardMetrics.set(id, dashboardMetrics);
    return dashboardMetrics;
  }

  async getLatestDashboardMetrics(): Promise<DashboardMetrics | undefined> {
    // Calculate real-time metrics from actual data
    const websites = await this.listWebsites();
    const blogPosts = await this.listBlogPosts();

    // Calculate website template distribution
    const templateUsage = websites.reduce((acc, website) => {
      const template = website.selectedTemplate || 'template1';
      acc[template] = (acc[template] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Real metrics based on actual website builder functionality
    const realMetrics: DashboardMetrics = {
      id: "real-time",
      totalWebsites: websites.length,
      totalBlogPosts: blogPosts.length,
      blogGenerationAttempts: blogPosts.filter(p => p.isAiGenerated).length,
      blogGenerationSuccess: blogPosts.filter(p => p.isAiGenerated && p.status === 'published').length,
      blogGenerationFailures: blogPosts.filter(p => p.isAiGenerated && p.status === 'draft').length,
      totalPageViews: websites.length * 5, // Estimated based on websites created
      totalRevenue: 0, // Not applicable for this app
      activeProjects: websites.length, // All created websites
      pendingTasks: 0, // Not applicable for this app
      recordedAt: new Date(),
    };

    return realMetrics;
  }

  async listDashboardMetrics(): Promise<DashboardMetrics[]> {
    return Array.from(this.dashboardMetrics.values())
      .sort((a, b) => new Date(b.recordedAt || "").getTime() - new Date(a.recordedAt || "").getTime());
  }

  // User operations implementation
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(user => user.email === email);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);

    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        email: userData.email ?? existingUser.email,
        firstName: userData.firstName ?? existingUser.firstName,
        lastName: userData.lastName ?? existingUser.lastName,
        profileImageUrl: userData.profileImageUrl ?? existingUser.profileImageUrl,
        role: userData.role ?? existingUser.role,
        websiteLimit: userData.websiteLimit ?? existingUser.websiteLimit,
        websitesCreated: userData.websitesCreated ?? existingUser.websitesCreated,
        isActive: userData.isActive ?? existingUser.isActive,
        lastLoginAt: userData.lastLoginAt ?? existingUser.lastLoginAt,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id,
        email: userData.email ?? null,
        password: userData.password ?? "",
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "user",
        websiteLimit: userData.websiteLimit ?? 10,
        websitesCreated: userData.websitesCreated ?? 0,
        isActive: userData.isActive ?? true,
        expiryDate: userData.expiryDate ?? null,
        personalApiKey: userData.personalApiKey ?? null,
        lastLoginAt: userData.lastLoginAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      email: userData.email ?? null,
      password: userData.password,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      role: userData.role ?? "user",
      websiteLimit: userData.websiteLimit ?? 10,
      websitesCreated: userData.websitesCreated ?? 0,
      isActive: userData.isActive ?? true,
      expiryDate: userData.expiryDate ?? null,
      personalApiKey: userData.personalApiKey ?? null,
      lastLoginAt: userData.lastLoginAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    // Note: Password handling is done by Replit Auth, this is just for interface compliance
    const user = this.users.get(id);
    if (!user) return undefined;
    return user;
  }

  // Website limit operations
  async checkWebsiteLimit(userId: string): Promise<{ canCreate: boolean, remaining: number, limit: number }> {
    let user = this.users.get(userId);

    // Handle hardcoded users (tufail, admin, guest)
    if (!user && (userId === "tufail" || userId === "admin" || userId === "guest")) {
      return {
        canCreate: true,
        remaining: 999999,
        limit: 999999
      };
    }

    if (!user) {
      return { canCreate: false, remaining: 0, limit: 0 };
    }

    // Paid and admin users have unlimited website creation
    if (user.role === 'paid' || user.role === 'admin') {
      return {
        canCreate: true,
        remaining: 999999,
        limit: 999999
      };
    }

    // Free users: hard cap at 3 (override any legacy DB value > 3)
    const limit = Math.min(user.websiteLimit ?? 3, 3);
    const created = user.websitesCreated ?? 0;
    const remaining = limit - created;
    return {
      canCreate: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: limit
    };
  }

  async incrementWebsiteCount(userId: string): Promise<User | undefined> {
    // Skip incrementing for hardcoded users (they have unlimited access)
    if (userId === "tufail" || userId === "admin" || userId === "guest") {
      return undefined;
    }

    const user = this.users.get(userId);
    if (!user) return undefined;

    const currentCreated = user.websitesCreated ?? 0;
    const updatedUser: User = {
      ...user,
      websitesCreated: currentCreated + 1,
      updatedAt: new Date(),
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Personal API Key operations
  async updateUserPersonalApiKey(userId: string, apiKey: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      personalApiKey: apiKey,
      updatedAt: new Date(),
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async clearUserPersonalApiKey(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      personalApiKey: null,
      updatedAt: new Date(),
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUserPersonalApiKey(userId: string): Promise<string | null> {
    const user = this.users.get(userId);
    return user?.personalApiKey ?? null;
  }

  // Blog post methods implementation
  async createBlogPost(insertBlogPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const blogPost: BlogPost = {
      ...insertBlogPost,
      id,
      publishedAt: now,
      updatedAt: now,
      featuredImage: insertBlogPost.featuredImage ?? null,
      metaTitle: insertBlogPost.metaTitle ?? null,
      metaDescription: insertBlogPost.metaDescription ?? null,
      tags: insertBlogPost.tags ?? null,
      category: insertBlogPost.category ?? null,
      status: insertBlogPost.status ?? null,
      authorName: insertBlogPost.authorName ?? null,
      authorEmail: insertBlogPost.authorEmail ?? null,
      scheduledAt: insertBlogPost.scheduledAt ?? null,
      isPublished: insertBlogPost.isPublished ?? null,
      readingTime: insertBlogPost.readingTime ?? null,
      viewCount: insertBlogPost.viewCount ?? null,
      websiteId: insertBlogPost.websiteId ?? null,
      featuredImageAlt: insertBlogPost.featuredImageAlt ?? null,
      aiPrompt: insertBlogPost.aiPrompt ?? null,
      keywords: insertBlogPost.keywords ?? null,
      isAiGenerated: insertBlogPost.isAiGenerated ?? null,
    };
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const posts = Array.from(this.blogPosts.values());
    return posts.find(post => post.slug === slug);
  }

  async listBlogPosts(status?: string): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());

    if (status) {
      posts = posts.filter(post => post.status === status);
    } else {
      posts = posts.filter(post => post.isPublished === "true");
    }

    return posts.sort((a, b) => new Date(b.publishedAt || "").getTime() - new Date(a.publishedAt || "").getTime());
  }

  async listBlogPostsWithPagination(page: number, limit: number, status?: string): Promise<{ posts: BlogPost[], total: number }> {
    const allPosts = await this.listBlogPosts(status);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      posts: allPosts.slice(startIndex, endIndex),
      total: allPosts.length
    };
  }

  async bulkDeleteBlogPosts(ids: string[]): Promise<boolean> {
    let deletedCount = 0;
    for (const id of ids) {
      if (this.blogPosts.delete(id)) {
        deletedCount++;
      }
    }
    return deletedCount > 0;
  }

  async updateBlogPostStatus(id: string, status: string): Promise<BlogPost | undefined> {
    return this.updateBlogPost(id, { status });
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;

    const updatedPost: BlogPost = {
      ...existingPost,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  // Blog category methods implementation
  async createBlogCategory(insertCategory: InsertBlogCategory): Promise<BlogCategory> {
    const id = randomUUID();
    const now = new Date();
    const category: BlogCategory = {
      ...insertCategory,
      id,
      createdAt: now,
      description: insertCategory.description ?? null,
      color: insertCategory.color ?? null,
    };
    this.blogCategories.set(id, category);
    return category;
  }

  async getBlogCategory(id: string): Promise<BlogCategory | undefined> {
    return this.blogCategories.get(id);
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const categories = Array.from(this.blogCategories.values());
    return categories.find(category => category.slug === slug);
  }

  async listBlogCategories(): Promise<BlogCategory[]> {
    return Array.from(this.blogCategories.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateBlogCategory(id: string, updates: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const existingCategory = this.blogCategories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory: BlogCategory = {
      ...existingCategory,
      ...updates
    };
    this.blogCategories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteBlogCategory(id: string): Promise<boolean> {
    return this.blogCategories.delete(id);
  }

  // Blog tag methods implementation
  async createBlogTag(insertTag: InsertBlogTag): Promise<BlogTag> {
    const id = randomUUID();
    const now = new Date();
    const tag: BlogTag = {
      ...insertTag,
      id,
      createdAt: now
    };
    this.blogTags.set(id, tag);
    return tag;
  }

  async getBlogTag(id: string): Promise<BlogTag | undefined> {
    return this.blogTags.get(id);
  }

  async getBlogTagBySlug(slug: string): Promise<BlogTag | undefined> {
    const tags = Array.from(this.blogTags.values());
    return tags.find(tag => tag.slug === slug);
  }

  async listBlogTags(): Promise<BlogTag[]> {
    return Array.from(this.blogTags.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateBlogTag(id: string, updates: Partial<InsertBlogTag>): Promise<BlogTag | undefined> {
    const existingTag = this.blogTags.get(id);
    if (!existingTag) return undefined;

    const updatedTag: BlogTag = {
      ...existingTag,
      ...updates
    };
    this.blogTags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteBlogTag(id: string): Promise<boolean> {
    return this.blogTags.delete(id);
  }

  // Blog media methods implementation
  async createBlogMedia(insertMedia: InsertBlogMedia): Promise<BlogMedia> {
    const id = randomUUID();
    const now = new Date();
    const media: BlogMedia = {
      ...insertMedia,
      id,
      uploadedAt: now,
      altText: insertMedia.altText ?? null,
      caption: insertMedia.caption ?? null,
      websiteId: insertMedia.websiteId ?? null, // Handle optional websiteId
    };
    this.blogMedia.set(id, media);
    return media;
  }

  async getBlogMedia(id: string): Promise<BlogMedia | undefined> {
    return this.blogMedia.get(id);
  }

  async listBlogMedia(): Promise<BlogMedia[]> {
    return Array.from(this.blogMedia.values())
      .sort((a, b) => new Date(b.uploadedAt || "").getTime() - new Date(a.uploadedAt || "").getTime());
  }

  async deleteBlogMedia(id: string): Promise<boolean> {
    return this.blogMedia.delete(id);
  }

  async createWebsite(insertWebsite: any): Promise<Website> {
    const id = insertWebsite.id || randomUUID();
    const now = new Date();
    const website: Website = {
      ...insertWebsite,
      id,
      createdAt: now,
      updatedAt: now,
      selectedTemplate: insertWebsite.selectedTemplate ?? null,
      blogOptions: insertWebsite.blogOptions ?? null,
      generatedBlogPosts: insertWebsite.generatedBlogPosts ?? null,
      blogPosts: insertWebsite.blogPosts ?? null,
      // Netlify fields with defaults
      netlifyApiKey: insertWebsite.netlifyApiKey ?? null,
      netlifyUrl: insertWebsite.netlifyUrl ?? null,
      netlifySiteId: insertWebsite.netlifySiteId ?? null,
      netlifyDeploymentStatus: insertWebsite.netlifyDeploymentStatus ?? "not_deployed",
      lastDeployedAt: insertWebsite.lastDeployedAt ?? null,
      // CMS fields with defaults
      description: insertWebsite.description ?? null,
      isActive: insertWebsite.isActive ?? true,
      customFiles: insertWebsite.customFiles ?? null,
    };
    this.websites.set(id, website);
    return website;
  }

  async getWebsite(id: string): Promise<Website | undefined> {
    return this.websites.get(id);
  }

  async listWebsites(): Promise<Website[]> {
    return Array.from(this.websites.values());
  }

  async listUserWebsites(userId: string): Promise<Website[]> {
    return Array.from(this.websites.values())
      .filter(website => website.userId === userId)
      .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
  }

  async updateWebsite(id: string, updates: UpdateWebsite): Promise<Website | undefined> {
    const existingWebsite = this.websites.get(id);
    if (!existingWebsite) return undefined;

    const updatedWebsite: Website = {
      ...existingWebsite,
      ...updates,
      updatedAt: new Date(),
    };
    this.websites.set(id, updatedWebsite);
    return updatedWebsite;
  }

  async deleteWebsite(id: string): Promise<boolean> {
    return this.websites.delete(id);
  }

  async createBulkWebsites(insertWebsites: InsertWebsite[]): Promise<Website[]> {
    const websites: Website[] = [];
    for (const insertWebsite of insertWebsites) {
      const website = await this.createWebsite(insertWebsite);
      websites.push(website);
    }
    return websites;
  }


}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');

    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email ?? null,
        password: userData.password ?? "",
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "user",
        websiteLimit: userData.websiteLimit ?? 10,
        websitesCreated: userData.websitesCreated ?? 0,
        isActive: userData.isActive ?? true,
        lastLoginAt: userData.lastLoginAt ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
          role: userData.role ?? "user",
          websiteLimit: userData.websiteLimit ?? 10,
          websitesCreated: userData.websitesCreated ?? 0,
          isActive: userData.isActive ?? true,
          lastLoginAt: userData.lastLoginAt ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');

    const [user] = await db
      .insert(users)
      .values({
        email: userData.email ?? null,
        password: userData.password,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        role: userData.role ?? "user",
        websiteLimit: userData.websiteLimit ?? 10,
        websitesCreated: userData.websitesCreated ?? 0,
        isActive: userData.isActive ?? true,
        lastLoginAt: userData.lastLoginAt ?? null,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async listUsers(): Promise<User[]> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { desc } = await import('drizzle-orm');

    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    // Password handling is done by Replit Auth
    return this.getUser(id);
  }

  // Website limit operations
  async checkWebsiteLimit(userId: string): Promise<{ canCreate: boolean, remaining: number, limit: number }> {
    let user = await this.getUser(userId);

    // Handle hardcoded users (tufail, admin, guest)
    if (!user && (userId === "tufail" || userId === "admin" || userId === "guest")) {
      return {
        canCreate: true,
        remaining: 999999,
        limit: 999999
      };
    }

    if (!user) {
      return { canCreate: false, remaining: 0, limit: 0 };
    }

    // Paid and admin users have unlimited website creation
    if (user.role === 'paid' || user.role === 'admin') {
      return {
        canCreate: true,
        remaining: 999999,
        limit: 999999
      };
    }

    // Fetch actual current count instead of lifetime created count
    const { eq } = await import('drizzle-orm');
    const { websites } = await import('@shared/schema');
    const { db } = await import('./db');

    // We count the number of websites that belong to this userId
    const currentWebsites = await db.select().from(websites).where(eq(websites.userId, userId));
    const currentCount = currentWebsites.length;

    // Free users: hard cap at 3 (override any legacy DB value > 3)
    const limit = Math.min(user.websiteLimit ?? 3, 3);
    const remaining = limit - currentCount;
    return {
      canCreate: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: limit
    };
  }

  async incrementWebsiteCount(userId: string): Promise<User | undefined> {
    // Skip incrementing for hardcoded users (they have unlimited access)
    if (userId === "tufail" || userId === "admin" || userId === "guest") {
      return undefined;
    }

    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const user = await this.getUser(userId);
    if (!user) return undefined;

    const currentCreated = user.websitesCreated ?? 0;
    const [updatedUser] = await db
      .update(users)
      .set({
        websitesCreated: currentCreated + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }


  // Website operations
  async createWebsite(website: any): Promise<Website> {
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');

    const [newWebsite] = await db.insert(websites).values(website).returning();
    return newWebsite;
  }

  async getWebsite(id: string): Promise<Website | undefined> {
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [website] = await db.select().from(websites).where(eq(websites.id, id));
    return website;
  }

  async listWebsites(): Promise<Website[]> {
    // SECURITY: This method should not be used in production as it returns all websites
    // Use listUserWebsites(userId) instead to ensure proper data isolation
    console.warn('WARNING: listWebsites() called - this returns ALL websites. Use listUserWebsites(userId) instead.');
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');

    return db.select().from(websites);
  }

  async listUserWebsites(userId: string): Promise<Website[]> {
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    return db.select().from(websites).where(eq(websites.userId, userId));
  }

  async updateWebsite(id: string, updates: UpdateWebsite): Promise<Website | undefined> {
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [updated] = await db
      .update(websites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(websites.id, id))
      .returning();
    return updated;
  }

  async deleteWebsite(id: string): Promise<boolean> {
    const { db } = await import('./db');
    const { websites } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const result = await db.delete(websites).where(eq(websites.id, id)).returning();
    return result.length > 0;
  }

  async createBulkWebsites(websites: InsertWebsite[]): Promise<Website[]> {
    const { db } = await import('./db');
    const { websites: websitesTable } = await import('@shared/schema');

    return db.insert(websitesTable).values(websites).returning();
  }

  // Delegate blog and other methods to MemStorage for now
  private memStorage = new MemStorage();

  // Delegate all other methods to MemStorage for now
  async createBlogPost(blogPost: InsertBlogPost): Promise<BlogPost> {
    return this.memStorage.createBlogPost(blogPost);
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.memStorage.getBlogPost(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return this.memStorage.getBlogPostBySlug(slug);
  }

  async listBlogPosts(status?: string): Promise<BlogPost[]> {
    return this.memStorage.listBlogPosts(status);
  }

  async listBlogPostsWithPagination(page: number, limit: number, status?: string): Promise<{ posts: BlogPost[], total: number }> {
    return this.memStorage.listBlogPostsWithPagination(page, limit, status);
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    return this.memStorage.updateBlogPost(id, updates);
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.memStorage.deleteBlogPost(id);
  }

  async bulkDeleteBlogPosts(ids: string[]): Promise<boolean> {
    return this.memStorage.bulkDeleteBlogPosts(ids);
  }

  async updateBlogPostStatus(id: string, status: string): Promise<BlogPost | undefined> {
    return this.memStorage.updateBlogPostStatus(id, status);
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    return this.memStorage.createBlogCategory(category);
  }

  async getBlogCategory(id: string): Promise<BlogCategory | undefined> {
    return this.memStorage.getBlogCategory(id);
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    return this.memStorage.getBlogCategoryBySlug(slug);
  }

  async listBlogCategories(): Promise<BlogCategory[]> {
    return this.memStorage.listBlogCategories();
  }

  async updateBlogCategory(id: string, updates: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    return this.memStorage.updateBlogCategory(id, updates);
  }

  async deleteBlogCategory(id: string): Promise<boolean> {
    return this.memStorage.deleteBlogCategory(id);
  }

  async createBlogTag(tag: InsertBlogTag): Promise<BlogTag> {
    return this.memStorage.createBlogTag(tag);
  }

  async getBlogTag(id: string): Promise<BlogTag | undefined> {
    return this.memStorage.getBlogTag(id);
  }

  async getBlogTagBySlug(slug: string): Promise<BlogTag | undefined> {
    return this.memStorage.getBlogTagBySlug(slug);
  }

  async listBlogTags(): Promise<BlogTag[]> {
    return this.memStorage.listBlogTags();
  }

  async updateBlogTag(id: string, updates: Partial<InsertBlogTag>): Promise<BlogTag | undefined> {
    return this.memStorage.updateBlogTag(id, updates);
  }

  async deleteBlogTag(id: string): Promise<boolean> {
    return this.memStorage.deleteBlogTag(id);
  }

  async createBlogMedia(media: InsertBlogMedia): Promise<BlogMedia> {
    return this.memStorage.createBlogMedia(media);
  }

  async getBlogMedia(id: string): Promise<BlogMedia | undefined> {
    return this.memStorage.getBlogMedia(id);
  }

  async listBlogMedia(): Promise<BlogMedia[]> {
    return this.memStorage.listBlogMedia();
  }

  async deleteBlogMedia(id: string): Promise<boolean> {
    return this.memStorage.deleteBlogMedia(id);
  }

  async createApiSetting(apiSetting: InsertApiSetting): Promise<ApiSetting> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');

    const [created] = await db.insert(apiSettings).values(apiSetting).returning();
    return created;
  }

  async getApiSetting(userId: string, name: string): Promise<ApiSetting | undefined> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const [setting] = await db
      .select()
      .from(apiSettings)
      .where(and(eq(apiSettings.userId, userId), eq(apiSettings.name, name)));
    return setting;
  }

  async listApiSettings(userId: string): Promise<ApiSetting[]> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    return db.select().from(apiSettings).where(eq(apiSettings.userId, userId));
  }

  async updateApiSetting(id: string, updates: UpdateApiSetting): Promise<ApiSetting | undefined> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [updated] = await db
      .update(apiSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(apiSettings.id, id))
      .returning();
    return updated;
  }

  async deleteApiSetting(id: string): Promise<boolean> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const result = await db.delete(apiSettings).where(eq(apiSettings.id, id)).returning();
    return result.length > 0;
  }

  async upsertApiSetting(userId: string, data: { name: string; displayName: string; apiKey?: string; accessKey?: string; secretKey?: string; isActive: boolean }): Promise<ApiSetting> {
    const { db } = await import('./db');
    const { apiSettings } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const existing = await this.getApiSetting(userId, data.name);

    if (existing) {
      const [updated] = await db
        .update(apiSettings)
        .set({
          displayName: data.displayName,
          apiKey: data.apiKey ?? existing.apiKey,
          accessKey: data.accessKey ?? existing.accessKey,
          secretKey: data.secretKey ?? existing.secretKey,
          isActive: data.isActive,
          updatedAt: new Date(),
        })
        .where(eq(apiSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(apiSettings)
      .values({
        userId,
        name: data.name,
        displayName: data.displayName,
        apiKey: data.apiKey,
        accessKey: data.accessKey,
        secretKey: data.secretKey,
        isActive: data.isActive,
      })
      .returning();
    return created;
  }

  async createBlogPrompt(blogPrompt: InsertBlogPrompt): Promise<BlogPrompt> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    const [created] = await db.insert(blogPrompts).values(blogPrompt).returning();
    return created;
  }

  async getBlogPrompt(id: string): Promise<BlogPrompt | undefined> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [prompt] = await db.select().from(blogPrompts).where(eq(blogPrompts.id, id));
    return prompt;
  }

  async getBlogPromptByName(name: string): Promise<BlogPrompt | undefined> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [prompt] = await db.select().from(blogPrompts).where(eq(blogPrompts.name, name));
    return prompt;
  }

  async listBlogPrompts(): Promise<BlogPrompt[]> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    return db.select().from(blogPrompts);
  }

  async updateBlogPrompt(id: string, updates: UpdateBlogPrompt): Promise<BlogPrompt | undefined> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [updated] = await db
      .update(blogPrompts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPrompts.id, id))
      .returning();
    return updated;
  }

  async deleteBlogPrompt(id: string): Promise<boolean> {
    const { db } = await import('./db');
    const { blogPrompts } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(blogPrompts).where(eq(blogPrompts.id, id)).returning();
    return result.length > 0;
  }

  // AdSense Settings methods
  async listAdSenseSettings(): Promise<AdSenseSetting[]> {
    return this.memStorage.listAdSenseSettings();
  }

  async updateAdSenseSetting(id: string, code: string): Promise<AdSenseSetting | undefined> {
    return this.memStorage.updateAdSenseSetting(id, code);
  }

  // Site Settings methods
  async listSiteSettings(): Promise<SiteSetting[]> {
    return this.memStorage.listSiteSettings();
  }

  async getSiteSetting(id: string): Promise<SiteSetting | undefined> {
    return this.memStorage.getSiteSetting(id);
  }

  async updateSiteSetting(id: string, updates: UpdateSiteSetting): Promise<SiteSetting | undefined> {
    return this.memStorage.updateSiteSetting(id, updates);
  }

  async upsertSiteSetting(data: InsertSiteSetting): Promise<SiteSetting> {
    return this.memStorage.upsertSiteSetting(data);
  }

  async createDashboardMetrics(metrics: InsertDashboardMetrics): Promise<DashboardMetrics> {
    return this.memStorage.createDashboardMetrics(metrics);
  }

  async getLatestDashboardMetrics(): Promise<DashboardMetrics | undefined> {
    return this.memStorage.getLatestDashboardMetrics();
  }

  async listDashboardMetrics(): Promise<DashboardMetrics[]> {
    return this.memStorage.listDashboardMetrics();
  }

  // Personal API Key operations
  async updateUserPersonalApiKey(userId: string, apiKey: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db
      .update(users)
      .set({
        personalApiKey: apiKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async clearUserPersonalApiKey(userId: string): Promise<User | undefined> {
    const { db } = await import('./db');
    const { users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const [user] = await db
      .update(users)
      .set({
        personalApiKey: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserPersonalApiKey(userId: string): Promise<string | null> {
    const user = await this.getUser(userId);
    return user?.personalApiKey ?? null;
  }
}

// ============================================================
// Storage: Supabase in production, MemStorage as local dev fallback
// If Supabase env vars are not set, falls back to in-memory storage.
// MemStorage data is lost on server restart — dev/testing only.
// ============================================================

import { supabaseStorage } from "./supabase-storage.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = !!(supabaseUrl && supabaseServerKey);

if (supabaseUrl && !supabaseServerKey) {
  const message = "[storage] Supabase URL is set but no server-side secret key was provided. Set SUPABASE_SECRET_KEY (preferred) or SUPABASE_SERVICE_ROLE_KEY.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`${message} Falling back to in-memory storage for local development.`);
}

if (hasSupabase) {
  console.log("[storage] Using Supabase storage");
} else {
  console.log("[storage] ⚠️  Supabase env vars not set — using in-memory storage (data resets on restart)");
}

export const storage: IStorage = hasSupabase ? (supabaseStorage as any) : new MemStorage();
