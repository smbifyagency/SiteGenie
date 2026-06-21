/**
 * Supabase-backed persistent storage for ALL app data.
 * Replaces MemStorage so everything survives Vercel serverless cold starts.
 * 
 * Stack: Vercel (hosting) + Supabase (database + auth) + Netlify (site deployment)
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// ============================================================
// Supabase Client
// ============================================================

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (_client) return _client;
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set for server-side storage");
    }
    console.log("Creating supabase client...");
    _client = createClient(url, key);
    console.log("Supabase client created. Type:", typeof _client, "Is null:", _client === null, "Is undefined:", _client === undefined);
    return _client;
}

// ============================================================
// Helper: convert snake_case DB row → camelCase app object
// ============================================================

function toCamel(row: any): any {
    if (!row) return row;
    const result: any = {};
    for (const [key, val] of Object.entries(row)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = val instanceof Date ? val : (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val) ? new Date(val) : val);
    }
    return result;
}

function toSnake(obj: any): any {
    if (!obj) return obj;
    const result: any = {};
    for (const [key, val] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        result[snakeKey] = val;
    }
    return result;
}

// ============================================================
// Users Storage
// ============================================================

export class SupabaseUsersStorage {
    async getUser(id: string) {
        const { data } = await getClient().from("app_users").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }

    async getUserByEmail(email: string) {
        const { data, error } = await getClient().from("app_users").select("*").eq("email", email).maybeSingle();
        if (error) {
            console.error("getUserByEmail Error:", error);
        }
        return data ? toCamel(data) : undefined;
    }

    async createUser(user: any) {
        const id = user.id || randomUUID();
        const now = new Date().toISOString();
        const row = {
            id,
            email: user.email,
            password: user.password || "",
            first_name: user.firstName || null,
            last_name: user.lastName || null,
            profile_image_url: user.profileImageUrl || null,
            role: user.role || "user",
            website_limit: user.websiteLimit ?? 3,
            websites_created: user.websitesCreated ?? 0,
            is_active: user.isActive ?? true,
            expiry_date: user.expiryDate || null,
            personal_api_key: user.personalApiKey || null,
            last_login_at: user.lastLoginAt || now,
            created_at: now,
            updated_at: now,
        };
        const { data, error } = await getClient().from("app_users").insert(row).select().single();
        if (error) {
            console.error("createUser error:", error);
            throw new Error(`Failed to create user: ${error.message}`);
        }
        return toCamel(data);
    }

    async upsertUser(user: any) {
        const existing = user.id ? await this.getUser(user.id) : (user.email ? await this.getUserByEmail(user.email) : null);
        if (existing) {
            return (await this.updateUser(existing.id, user)) || existing;
        }
        return this.createUser(user);
    }

    async updateUser(id: string, updates: any) {
        const row: any = { updated_at: new Date().toISOString() };
        if (updates.email !== undefined) row.email = updates.email;
        if (updates.password !== undefined) row.password = updates.password;
        if (updates.firstName !== undefined) row.first_name = updates.firstName;
        if (updates.lastName !== undefined) row.last_name = updates.lastName;
        if (updates.profileImageUrl !== undefined) row.profile_image_url = updates.profileImageUrl;
        if (updates.role !== undefined) row.role = updates.role;
        if (updates.websiteLimit !== undefined) row.website_limit = updates.websiteLimit;
        if (updates.websitesCreated !== undefined) row.websites_created = updates.websitesCreated;
        if (updates.isActive !== undefined) row.is_active = updates.isActive;
        if (updates.expiryDate !== undefined) row.expiry_date = updates.expiryDate;
        if (updates.personalApiKey !== undefined) row.personal_api_key = updates.personalApiKey;
        if (updates.lastLoginAt !== undefined) row.last_login_at = updates.lastLoginAt;

        const { data, error } = await getClient().from("app_users").update(row).eq("id", id).select().single();
        if (error) return undefined;
        return toCamel(data);
    }

    async deleteUser(id: string) {
        const { error } = await getClient().from("app_users").delete().eq("id", id);
        return !error;
    }

    async listUsers() {
        const { data } = await getClient().from("app_users").select("*").order("created_at", { ascending: false });
        return (data || []).map(toCamel);
    }

    // Lightweight listing — excludes password hash to reduce payload
    async listUsersLight() {
        const { data } = await getClient().from("app_users")
            .select("id, email, first_name, last_name, role, is_active, website_limit, websites_created, created_at, last_login_at")
            .order("created_at", { ascending: false });
        return (data || []).map(toCamel);
    }

    async updateUserPassword(id: string, password: string) {
        return this.updateUser(id, { password });
    }

    async checkWebsiteLimit(userId: string) {
        const user = await this.getUser(userId);
        if (!user) return { canCreate: true, remaining: 3, limit: 3 };

        // Paid and admin users get unlimited
        if (user.role === "paid" || user.role === "admin" || userId === "admin") {
            return { canCreate: true, remaining: 999999, limit: 999999 };
        }

        // Free users: hard cap at 3 (override any legacy DB value > 3)
        const limit = Math.min(user.websiteLimit ?? 3, 3);

        // Fetch actual current count from websites table instead of lifetime created count
        const { count, error } = await getClient()
            .from("app_websites")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId);

        const currentCount = count ?? 0;

        return { canCreate: currentCount < limit, remaining: Math.max(limit - currentCount, 0), limit };
    }

    async incrementWebsiteCount(userId: string) {
        const user = await this.getUser(userId);
        if (!user) return undefined;
        return this.updateUser(userId, { websitesCreated: (user.websitesCreated || 0) + 1 });
    }

    async updateUserPersonalApiKey(userId: string, apiKey: string) {
        return this.updateUser(userId, { personalApiKey: apiKey });
    }

    async clearUserPersonalApiKey(userId: string) {
        return this.updateUser(userId, { personalApiKey: null });
    }

    async getUserPersonalApiKey(userId: string) {
        const user = await this.getUser(userId);
        return user?.personalApiKey ?? null;
    }
}

// ============================================================
// Websites Storage
// ============================================================

/**
 * Convert a raw DB row from app_websites into the app schema shape.
 *
 * The DB was created with older column names.  This mapping keeps the
 * storage layer in sync with the current shared/schema.ts definitions:
 *
 *  DB column          → app schema field
 *  business_name      → title  (primary display name)
 *  deployed_url       → netlifyUrl
 *  status             → netlifyDeploymentStatus
 *  generated_html     → customFiles  (stored as JSON string)
 *
 * Fields that have no dedicated DB column (description, selectedTemplate,
 * blogOptions, netlifyApiKey, lastDeployedAt, …) are serialised into the
 * business_data JSONB column so they round-trip without a migration.
 */
function websiteFromDB(row: any): any {
    if (!row) return row;
    const base = toCamel(row);

    // Primary name mapping: DB's business_name column holds the "title"
    base.title = base.businessName || "";

    // Deployment field mappings
    base.netlifyUrl = base.deployedUrl || null;
    base.netlifyDeploymentStatus = base.status || "not_deployed";

    // customFiles are stored as a JSON string in the generated_html column
    if (base.generatedHtml) {
        try {
            base.customFiles = typeof base.generatedHtml === "string"
                ? JSON.parse(base.generatedHtml)
                : base.generatedHtml;
        } catch {
            base.customFiles = null;
        }
    }

    // Lift extra schema fields that were folded into business_data
    const bd = base.businessData || {};
    if (bd._description !== undefined) base.description = bd._description;
    if (bd._selectedTemplate !== undefined) base.selectedTemplate = bd._selectedTemplate;
    if (bd._netlifyApiKey !== undefined) base.netlifyApiKey = bd._netlifyApiKey;
    if (bd._lastDeployedAt !== undefined) base.lastDeployedAt = bd._lastDeployedAt;
    if (bd._blogOptions !== undefined) base.blogOptions = bd._blogOptions;
    if (bd._generatedBlogPosts !== undefined) base.generatedBlogPosts = bd._generatedBlogPosts;
    if (bd._blogPosts !== undefined) base.blogPosts = bd._blogPosts;
    if (bd._isActive !== undefined) base.isActive = bd._isActive;

    return base;
}

/**
 * Build the DB row object from the app schema fields accepted by
 * createWebsite / updateWebsite.
 */
function websiteToDB(website: any): any {
    const row: any = {};

    // title → business_name (primary column)
    if (website.title !== undefined) row.business_name = website.title;
    // Fallback: if caller used the old businessName field accept it too
    if (website.businessName !== undefined && row.business_name === undefined) {
        row.business_name = website.businessName;
    }

    if (website.category !== undefined) row.category = website.category;
    if (website.template !== undefined) row.template = website.template;
    if (website.netlifySiteId !== undefined) row.netlify_site_id = website.netlifySiteId;
    if (website.customDomain !== undefined) row.custom_domain = website.customDomain;
    if (website.userId !== undefined) row.user_id = website.userId;

    // netlifyUrl → deployed_url
    if (website.netlifyUrl !== undefined) row.deployed_url = website.netlifyUrl;
    // Fallback: old callers may still use deployedUrl
    if (website.deployedUrl !== undefined && row.deployed_url === undefined) {
        row.deployed_url = website.deployedUrl;
    }

    // netlifyDeploymentStatus → status
    if (website.netlifyDeploymentStatus !== undefined) row.status = website.netlifyDeploymentStatus;
    // Fallback
    if (website.status !== undefined && row.status === undefined) row.status = website.status;

    // customFiles → stored as JSON string in generated_html column
    if (website.customFiles !== undefined) {
        row.generated_html = website.customFiles
            ? (typeof website.customFiles === "string" ? website.customFiles : JSON.stringify(website.customFiles))
            : null;
    } else if (website.generatedHtml !== undefined) {
        row.generated_html = website.generatedHtml;
    }

    // Merge business_data; fold in schema fields that have no dedicated column
    const existingBD: any = website.businessData || {};
    const extras: Record<string, any> = {};
    if (website.description !== undefined) extras._description = website.description;
    if (website.selectedTemplate !== undefined) extras._selectedTemplate = website.selectedTemplate;
    if (website.netlifyApiKey !== undefined) extras._netlifyApiKey = website.netlifyApiKey;
    if (website.lastDeployedAt !== undefined) extras._lastDeployedAt = website.lastDeployedAt;
    if (website.blogOptions !== undefined) extras._blogOptions = website.blogOptions;
    if (website.generatedBlogPosts !== undefined) extras._generatedBlogPosts = website.generatedBlogPosts;
    if (website.blogPosts !== undefined) extras._blogPosts = website.blogPosts;
    if (website.isActive !== undefined) extras._isActive = website.isActive;

    if (website.businessData !== undefined || Object.keys(extras).length > 0) {
        row.business_data = { ...existingBD, ...extras };
    }

    return row;
}

export class SupabaseWebsitesStorage {
    async createWebsite(website: any) {
        const id = website.id || randomUUID();
        const now = new Date().toISOString();
        const mapped = websiteToDB(website);
        const row = {
            id,
            user_id: mapped.user_id || website.userId || null,
            business_name: mapped.business_name || "",
            category: mapped.category || "",
            template: mapped.template || "modern",
            business_data: mapped.business_data || {},
            generated_html: mapped.generated_html || null,
            deployed_url: mapped.deployed_url || null,
            netlify_site_id: mapped.netlify_site_id || null,
            status: mapped.status || "draft",
            custom_domain: mapped.custom_domain || null,
            created_at: now,
            updated_at: now,
        };
        const { data, error } = await getClient().from("app_websites").insert(row).select().single();
        if (error) {
            console.error("createWebsite error:", error);
            throw new Error(`Failed to create website: ${error.message}`);
        }
        return websiteFromDB(data);
    }

    async getWebsite(id: string) {
        const { data } = await getClient().from("app_websites").select("*").eq("id", id).maybeSingle();
        return data ? websiteFromDB(data) : undefined;
    }

    async listWebsites() {
        const { data } = await getClient().from("app_websites").select("*").order("created_at", { ascending: false });
        return (data || []).map(websiteFromDB);
    }

    // Lightweight listing — returns only metadata, no heavy JSONB blobs
    async listWebsitesLight() {
        const { data } = await getClient().from("app_websites")
            .select("id, name, template, status, user_id, custom_domain, netlify_site_id, netlify_url, created_at, updated_at")
            .order("created_at", { ascending: false });
        return (data || []).map(websiteFromDB);
    }

    async listUserWebsites(userId: string) {
        const { data } = await getClient().from("app_websites").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        return (data || []).map(websiteFromDB);
    }

    async updateWebsite(id: string, updates: any) {
        const mapped = websiteToDB(updates);
        const row: any = { updated_at: new Date().toISOString(), ...mapped };

        const { data, error } = await getClient().from("app_websites").update(row).eq("id", id).select().single();
        if (error) {
            console.error("updateWebsite error:", error);
            return undefined;
        }
        return websiteFromDB(data);
    }

    async deleteWebsite(id: string) {
        const { error } = await getClient().from("app_websites").delete().eq("id", id);
        return !error;
    }

    async createBulkWebsites(websites: any[]) {
        const results = [];
        for (const w of websites) {
            results.push(await this.createWebsite(w));
        }
        return results;
    }
}

// ============================================================
// API Settings Storage (already exists, keeping for completeness)
// ============================================================

export class SupabaseApiSettingsStorage {
    async getApiSetting(userId: string, name: string) {
        const { data } = await getClient().from("user_api_settings").select("*").eq("user_id", userId).eq("name", name).maybeSingle();
        return data ? toCamel(data) : undefined;
    }

    async listApiSettings(userId: string) {
        const { data } = await getClient().from("user_api_settings").select("*").eq("user_id", userId).order("display_name");
        return (data || []).map(toCamel);
    }

    async createApiSetting(setting: any) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const { data, error } = await getClient().from("user_api_settings").insert({
            id,
            user_id: setting.userId,
            name: setting.name,
            display_name: setting.displayName,
            api_key: setting.apiKey || null,
            access_key: setting.accessKey || null,
            secret_key: setting.secretKey || null,
            is_active: setting.isActive ?? true,
            created_at: now,
            updated_at: now,
        }).select().single();
        if (error) { console.error("createApiSetting error:", error); throw new Error("Failed to create API setting"); }
        return toCamel(data);
    }

    async updateApiSetting(id: string, updates: any) {
        const row: any = { updated_at: new Date().toISOString() };
        if (updates.apiKey !== undefined) row.api_key = updates.apiKey;
        if (updates.accessKey !== undefined) row.access_key = updates.accessKey;
        if (updates.secretKey !== undefined) row.secret_key = updates.secretKey;
        if (updates.isActive !== undefined) row.is_active = updates.isActive;
        const { data, error } = await getClient().from("user_api_settings").update(row).eq("id", id).select().single();
        if (error) return undefined;
        return toCamel(data);
    }

    async deleteApiSetting(id: string) {
        const { error } = await getClient().from("user_api_settings").delete().eq("id", id);
        return !error;
    }

    async upsertApiSetting(userId: string, data: any) {
        const existing = await this.getApiSetting(userId, data.name);
        if (existing) {
            const updated = await this.updateApiSetting(existing.id, {
                apiKey: data.apiKey !== undefined ? data.apiKey : existing.apiKey,
                accessKey: data.accessKey !== undefined ? data.accessKey : existing.accessKey,
                secretKey: data.secretKey !== undefined ? data.secretKey : existing.secretKey,
                isActive: data.isActive,
            });
            if (!updated) throw new Error("Failed to update API setting");
            return updated;
        }
        return this.createApiSetting({ userId, ...data });
    }
}

// ============================================================
// Blog Posts Storage
// ============================================================

export class SupabaseBlogPostsStorage {
    async createBlogPost(post: any) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const row = {
            id,
            website_id: post.websiteId || null,
            title: post.title || "",
            slug: post.slug || "",
            excerpt: post.excerpt || "",
            content: post.content || "",
            featured_image: post.featuredImage || null,
            featured_image_alt: post.featuredImageAlt || null,
            meta_title: post.metaTitle || null,
            meta_description: post.metaDescription || null,
            category: post.category || null,
            tags: post.tags || [],
            status: post.status || "draft",
            author_name: post.authorName || "Admin",
            is_ai_generated: post.isAiGenerated ?? false,
            word_count: post.wordCount || 0,
            published_at: now,
            updated_at: now,
        };
        const { data, error } = await getClient().from("app_blog_posts").insert(row).select().single();
        if (error) { console.error("createBlogPost error:", error); throw new Error("Failed to create blog post"); }
        return toCamel(data);
    }

    async getBlogPost(id: string) {
        const { data } = await getClient().from("app_blog_posts").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }

    async getBlogPostBySlug(slug: string) {
        const { data } = await getClient().from("app_blog_posts").select("*").eq("slug", slug).maybeSingle();
        return data ? toCamel(data) : undefined;
    }

    async listBlogPosts(status?: string) {
        let q = getClient().from("app_blog_posts").select("*").order("published_at", { ascending: false });
        if (status) q = q.eq("status", status);
        const { data } = await q;
        return (data || []).map(toCamel);
    }

    async listBlogPostsWithPagination(page: number, limit: number, status?: string) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let q = getClient().from("app_blog_posts").select("*", { count: "exact" }).order("published_at", { ascending: false }).range(from, to);
        if (status) q = q.eq("status", status);
        const { data, count } = await q;
        return { posts: (data || []).map(toCamel), total: count || 0 };
    }

    async updateBlogPost(id: string, updates: any) {
        const row: any = { updated_at: new Date().toISOString() };
        const fieldMap: Record<string, string> = {
            title: "title", slug: "slug", excerpt: "excerpt", content: "content",
            featuredImage: "featured_image", featuredImageAlt: "featured_image_alt",
            metaTitle: "meta_title", metaDescription: "meta_description",
            category: "category", tags: "tags", status: "status",
            authorName: "author_name", isAiGenerated: "is_ai_generated", wordCount: "word_count",
        };
        for (const [camel, snake] of Object.entries(fieldMap)) {
            if (updates[camel] !== undefined) row[snake] = updates[camel];
        }
        const { data, error } = await getClient().from("app_blog_posts").update(row).eq("id", id).select().single();
        if (error) return undefined;
        return toCamel(data);
    }

    async deleteBlogPost(id: string) {
        const { error } = await getClient().from("app_blog_posts").delete().eq("id", id);
        return !error;
    }

    async bulkDeleteBlogPosts(ids: string[]) {
        const { error } = await getClient().from("app_blog_posts").delete().in("id", ids);
        return !error;
    }

    async updateBlogPostStatus(id: string, status: string) {
        return this.updateBlogPost(id, { status });
    }
}

// ============================================================
// Blog Categories Storage
// ============================================================

export class SupabaseBlogCategoriesStorage {
    async createBlogCategory(cat: any) {
        const id = randomUUID();
        const { data, error } = await getClient().from("app_blog_categories").insert({
            id, name: cat.name, slug: cat.slug, description: cat.description || null,
            color: cat.color || "#3b82f6", created_at: new Date().toISOString(),
        }).select().single();
        if (error) throw new Error("Failed to create blog category");
        return toCamel(data);
    }
    async getBlogCategory(id: string) {
        const { data } = await getClient().from("app_blog_categories").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async getBlogCategoryBySlug(slug: string) {
        const { data } = await getClient().from("app_blog_categories").select("*").eq("slug", slug).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async listBlogCategories() {
        const { data } = await getClient().from("app_blog_categories").select("*").order("name");
        return (data || []).map(toCamel);
    }
    async updateBlogCategory(id: string, updates: any) {
        const row: any = {};
        if (updates.name !== undefined) row.name = updates.name;
        if (updates.slug !== undefined) row.slug = updates.slug;
        if (updates.description !== undefined) row.description = updates.description;
        if (updates.color !== undefined) row.color = updates.color;
        const { data } = await getClient().from("app_blog_categories").update(row).eq("id", id).select().single();
        return data ? toCamel(data) : undefined;
    }
    async deleteBlogCategory(id: string) {
        const { error } = await getClient().from("app_blog_categories").delete().eq("id", id);
        return !error;
    }
}

// ============================================================
// Blog Tags Storage
// ============================================================

export class SupabaseBlogTagsStorage {
    async createBlogTag(tag: any) {
        const id = randomUUID();
        const { data, error } = await getClient().from("app_blog_tags").insert({
            id, name: tag.name, slug: tag.slug, created_at: new Date().toISOString(),
        }).select().single();
        if (error) throw new Error("Failed to create blog tag");
        return toCamel(data);
    }
    async getBlogTag(id: string) {
        const { data } = await getClient().from("app_blog_tags").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async getBlogTagBySlug(slug: string) {
        const { data } = await getClient().from("app_blog_tags").select("*").eq("slug", slug).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async listBlogTags() {
        const { data } = await getClient().from("app_blog_tags").select("*").order("name");
        return (data || []).map(toCamel);
    }
    async updateBlogTag(id: string, updates: any) {
        const row: any = {};
        if (updates.name !== undefined) row.name = updates.name;
        if (updates.slug !== undefined) row.slug = updates.slug;
        const { data } = await getClient().from("app_blog_tags").update(row).eq("id", id).select().single();
        return data ? toCamel(data) : undefined;
    }
    async deleteBlogTag(id: string) {
        const { error } = await getClient().from("app_blog_tags").delete().eq("id", id);
        return !error;
    }
}

// ============================================================
// Blog Media Storage
// ============================================================

export class SupabaseBlogMediaStorage {
    async createBlogMedia(media: any) {
        const id = randomUUID();
        const { data, error } = await getClient().from("app_blog_media").insert({
            id, user_id: media.userId, website_id: media.websiteId || null,
            file_name: media.fileName, original_name: media.originalName,
            mime_type: media.mimeType, size: media.size, url: media.url,
            alt_text: media.altText || null, caption: media.caption || null,
            uploaded_at: new Date().toISOString(),
        }).select().single();
        if (error) throw new Error("Failed to create blog media");
        return toCamel(data);
    }
    async getBlogMedia(id: string) {
        const { data } = await getClient().from("app_blog_media").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async listBlogMedia() {
        const { data } = await getClient().from("app_blog_media").select("*").order("uploaded_at", { ascending: false });
        return (data || []).map(toCamel);
    }
    async deleteBlogMedia(id: string) {
        const { error } = await getClient().from("app_blog_media").delete().eq("id", id);
        return !error;
    }
}

// ============================================================
// Blog Prompts Storage
// ============================================================

export class SupabaseBlogPromptsStorage {
    async createBlogPrompt(prompt: any) {
        const id = randomUUID();
        const now = new Date().toISOString();
        const { data, error } = await getClient().from("app_blog_prompts").insert({
            id, name: prompt.name, display_name: prompt.displayName,
            prompt: prompt.prompt, is_default: prompt.isDefault ?? false,
            category: prompt.category || null, is_active: prompt.isActive ?? true,
            created_at: now, updated_at: now,
        }).select().single();
        if (error) throw new Error("Failed to create blog prompt");
        return toCamel(data);
    }
    async getBlogPrompt(id: string) {
        const { data } = await getClient().from("app_blog_prompts").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async getBlogPromptByName(name: string) {
        const { data } = await getClient().from("app_blog_prompts").select("*").eq("name", name).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async listBlogPrompts() {
        const { data } = await getClient().from("app_blog_prompts").select("*").order("display_name");
        return (data || []).map(toCamel);
    }
    async updateBlogPrompt(id: string, updates: any) {
        const row: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) row.name = updates.name;
        if (updates.displayName !== undefined) row.display_name = updates.displayName;
        if (updates.prompt !== undefined) row.prompt = updates.prompt;
        if (updates.isDefault !== undefined) row.is_default = updates.isDefault;
        if (updates.category !== undefined) row.category = updates.category;
        if (updates.isActive !== undefined) row.is_active = updates.isActive;
        const { data } = await getClient().from("app_blog_prompts").update(row).eq("id", id).select().single();
        return data ? toCamel(data) : undefined;
    }
    async deleteBlogPrompt(id: string) {
        const { error } = await getClient().from("app_blog_prompts").delete().eq("id", id);
        return !error;
    }
}

// ============================================================
// Dashboard Metrics Storage
// ============================================================

export class SupabaseDashboardMetricsStorage {
    async createDashboardMetrics(metrics: any) {
        const id = randomUUID();
        const { data, error } = await getClient().from("app_dashboard_metrics").insert({
            id, total_websites: metrics.totalWebsites || 0, total_blog_posts: metrics.totalBlogPosts || 0,
            blog_generation_attempts: metrics.blogGenerationAttempts || 0, blog_generation_success: metrics.blogGenerationSuccess || 0,
            blog_generation_failures: metrics.blogGenerationFailures || 0, total_page_views: metrics.totalPageViews || 0,
            total_revenue: metrics.totalRevenue || 0, active_projects: metrics.activeProjects || 0,
            pending_tasks: metrics.pendingTasks || 0, recorded_at: new Date().toISOString(),
        }).select().single();
        if (error) throw new Error("Failed to create dashboard metrics");
        return toCamel(data);
    }
    async getLatestDashboardMetrics() {
        const { data } = await getClient().from("app_dashboard_metrics").select("*").order("recorded_at", { ascending: false }).limit(1).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async listDashboardMetrics() {
        const { data } = await getClient().from("app_dashboard_metrics").select("*").order("recorded_at", { ascending: false });
        return (data || []).map(toCamel);
    }
}

// ============================================================
// AdSense Settings Storage
// ============================================================

export class SupabaseAdSenseStorage {
    async listAdSenseSettings() {
        const { data } = await getClient().from("app_adsense_settings").select("*");
        return (data || []).map(toCamel);
    }
    async updateAdSenseSetting(id: string, code: string) {
        const { data } = await getClient().from("app_adsense_settings").update({ code, updated_at: new Date().toISOString() }).eq("id", id).select().single();
        return data ? toCamel(data) : undefined;
    }
}

// ============================================================
// Site Settings Storage
// ============================================================

export class SupabaseSiteSettingsStorage {
    async listSiteSettings() {
        const { data } = await getClient().from("app_site_settings").select("*");
        return (data || []).map(toCamel);
    }
    async getSiteSetting(id: string) {
        const { data } = await getClient().from("app_site_settings").select("*").eq("id", id).maybeSingle();
        return data ? toCamel(data) : undefined;
    }
    async updateSiteSetting(id: string, updates: any) {
        const row: any = { updated_at: new Date().toISOString() };
        if (updates.code !== undefined) row.code = updates.code;
        if (updates.isActive !== undefined) row.is_active = updates.isActive;
        if (updates.displayName !== undefined) row.display_name = updates.displayName;
        if (updates.description !== undefined) row.description = updates.description;
        if (updates.placement !== undefined) row.placement = updates.placement;
        const { data } = await getClient().from("app_site_settings").update(row).eq("id", id).select().single();
        return data ? toCamel(data) : undefined;
    }
    async upsertSiteSetting(setting: any) {
        const existing = await this.getSiteSetting(setting.id);
        if (existing) {
            return (await this.updateSiteSetting(setting.id, setting)) || existing;
        }
        const { data, error } = await getClient().from("app_site_settings").insert({
            id: setting.id, category: setting.category, name: setting.name,
            display_name: setting.displayName, description: setting.description || null,
            code: setting.code || "", is_active: setting.isActive ?? true,
            placement: setting.placement || null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).select().single();
        if (error) throw new Error("Failed to create site setting");
        return toCamel(data);
    }
}

// ============================================================
// Export combined storage singleton
// ============================================================

const users = new SupabaseUsersStorage();
const websites = new SupabaseWebsitesStorage();
const apiSettings = new SupabaseApiSettingsStorage();
const blogPosts = new SupabaseBlogPostsStorage();
const blogCategories = new SupabaseBlogCategoriesStorage();
const blogTags = new SupabaseBlogTagsStorage();
const blogMedia = new SupabaseBlogMediaStorage();
const blogPrompts = new SupabaseBlogPromptsStorage();
const dashboardMetrics = new SupabaseDashboardMetricsStorage();
const adsenseSettings = new SupabaseAdSenseStorage();
const siteSettings = new SupabaseSiteSettingsStorage();

export const supabaseStorage = {
    // Users
    getUser: (id: string) => users.getUser(id),
    getUserByEmail: (email: string) => users.getUserByEmail(email),
    createUser: (user: any) => users.createUser(user),
    upsertUser: (user: any) => users.upsertUser(user),
    updateUser: (id: string, updates: any) => users.updateUser(id, updates),
    deleteUser: (id: string) => users.deleteUser(id),
    listUsers: () => users.listUsers(),
    listUsersLight: () => users.listUsersLight(),
    updateUserPassword: (id: string, pw: string) => users.updateUserPassword(id, pw),
    checkWebsiteLimit: (userId: string) => users.checkWebsiteLimit(userId),
    incrementWebsiteCount: (userId: string) => users.incrementWebsiteCount(userId),
    updateUserPersonalApiKey: (userId: string, key: string) => users.updateUserPersonalApiKey(userId, key),
    clearUserPersonalApiKey: (userId: string) => users.clearUserPersonalApiKey(userId),
    getUserPersonalApiKey: (userId: string) => users.getUserPersonalApiKey(userId),

    // Websites
    createWebsite: (w: any) => websites.createWebsite(w),
    getWebsite: (id: string) => websites.getWebsite(id),
    listWebsites: () => websites.listWebsites(),
    listWebsitesLight: () => websites.listWebsitesLight(),
    listUserWebsites: (userId: string) => websites.listUserWebsites(userId),
    updateWebsite: (id: string, updates: any) => websites.updateWebsite(id, updates),
    deleteWebsite: (id: string) => websites.deleteWebsite(id),
    createBulkWebsites: (ws: any[]) => websites.createBulkWebsites(ws),

    // API Settings
    getApiSetting: (userId: string, name: string) => apiSettings.getApiSetting(userId, name),
    listApiSettings: (userId: string) => apiSettings.listApiSettings(userId),
    createApiSetting: (s: any) => apiSettings.createApiSetting(s),
    updateApiSetting: (id: string, updates: any) => apiSettings.updateApiSetting(id, updates),
    deleteApiSetting: (id: string) => apiSettings.deleteApiSetting(id),
    upsertApiSetting: (userId: string, data: any) => apiSettings.upsertApiSetting(userId, data),

    // Blog Posts
    createBlogPost: (p: any) => blogPosts.createBlogPost(p),
    getBlogPost: (id: string) => blogPosts.getBlogPost(id),
    getBlogPostBySlug: (slug: string) => blogPosts.getBlogPostBySlug(slug),
    listBlogPosts: (status?: string) => blogPosts.listBlogPosts(status),
    listBlogPostsWithPagination: (page: number, limit: number, status?: string) => blogPosts.listBlogPostsWithPagination(page, limit, status),
    updateBlogPost: (id: string, updates: any) => blogPosts.updateBlogPost(id, updates),
    deleteBlogPost: (id: string) => blogPosts.deleteBlogPost(id),
    bulkDeleteBlogPosts: (ids: string[]) => blogPosts.bulkDeleteBlogPosts(ids),
    updateBlogPostStatus: (id: string, status: string) => blogPosts.updateBlogPostStatus(id, status),

    // Blog Categories
    createBlogCategory: (c: any) => blogCategories.createBlogCategory(c),
    getBlogCategory: (id: string) => blogCategories.getBlogCategory(id),
    getBlogCategoryBySlug: (slug: string) => blogCategories.getBlogCategoryBySlug(slug),
    listBlogCategories: () => blogCategories.listBlogCategories(),
    updateBlogCategory: (id: string, updates: any) => blogCategories.updateBlogCategory(id, updates),
    deleteBlogCategory: (id: string) => blogCategories.deleteBlogCategory(id),

    // Blog Tags
    createBlogTag: (t: any) => blogTags.createBlogTag(t),
    getBlogTag: (id: string) => blogTags.getBlogTag(id),
    getBlogTagBySlug: (slug: string) => blogTags.getBlogTagBySlug(slug),
    listBlogTags: () => blogTags.listBlogTags(),
    updateBlogTag: (id: string, updates: any) => blogTags.updateBlogTag(id, updates),
    deleteBlogTag: (id: string) => blogTags.deleteBlogTag(id),

    // Blog Media
    createBlogMedia: (m: any) => blogMedia.createBlogMedia(m),
    getBlogMedia: (id: string) => blogMedia.getBlogMedia(id),
    listBlogMedia: () => blogMedia.listBlogMedia(),
    deleteBlogMedia: (id: string) => blogMedia.deleteBlogMedia(id),

    // Blog Prompts
    createBlogPrompt: (p: any) => blogPrompts.createBlogPrompt(p),
    getBlogPrompt: (id: string) => blogPrompts.getBlogPrompt(id),
    getBlogPromptByName: (name: string) => blogPrompts.getBlogPromptByName(name),
    listBlogPrompts: () => blogPrompts.listBlogPrompts(),
    updateBlogPrompt: (id: string, updates: any) => blogPrompts.updateBlogPrompt(id, updates),
    deleteBlogPrompt: (id: string) => blogPrompts.deleteBlogPrompt(id),

    // Dashboard Metrics
    createDashboardMetrics: (m: any) => dashboardMetrics.createDashboardMetrics(m),
    getLatestDashboardMetrics: () => dashboardMetrics.getLatestDashboardMetrics(),
    listDashboardMetrics: () => dashboardMetrics.listDashboardMetrics(),

    // AdSense
    listAdSenseSettings: () => adsenseSettings.listAdSenseSettings(),
    updateAdSenseSetting: (id: string, code: string) => adsenseSettings.updateAdSenseSetting(id, code),

    // Site Settings
    listSiteSettings: () => siteSettings.listSiteSettings(),
    getSiteSetting: (id: string) => siteSettings.getSiteSetting(id),
    updateSiteSetting: (id: string, updates: any) => siteSettings.updateSiteSetting(id, updates),
    upsertSiteSetting: (data: any) => siteSettings.upsertSiteSetting(data),
};
