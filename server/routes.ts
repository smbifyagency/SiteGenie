import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { setupAuth, isAuthenticated, isAdmin, isAIUser, allowGuestWebsiteGeneration, setGuestApiKeysCookie } from "./auth.js";
import {
  businessDataSchema,
  bulkImportSchema,
  insertApiSettingSchema,
  updateApiSettingSchema,
  insertBlogPromptSchema,
  updateBlogPromptSchema,
  insertDashboardMetricsSchema,
  insertUserSchema,
  updateUserSchema,
  insertBlogPostSchema,
  updateBlogPostSchema,
  insertBlogCategorySchema,
  insertBlogTagSchema,
  insertBlogMediaSchema
} from "../shared/schema.js";
import JSZip from "jszip";
import path from "path";
import { generateAllWebsiteFiles } from "../client/src/lib/dynamic-website-generator.js";
import { generateMultipleBlogPosts, generateBlogPost, fetchUnsplashImage, generateSEOContent, generateFAQContent, generateTestimonials, generateServicePageContent, generateLocationPageContent } from "./services/openai.js";
import { generateMultipleBlogPostsWithOpenRouter, generateBlogPostWithOpenRouter } from "./services/openrouter.js";
import { generateSEOContentWithGemini, generateFAQContentWithGemini, generateTestimonialsWithGemini, generateBlogPostWithGemini } from "./services/gemini.js";
import { generateWithDeepSeek, generateStructuredJsonWithDeepSeek, generateMultipleBlogPostsWithDeepSeek, generateBlogPostWithDeepSeek } from "./services/deepseek.js";
import { encrypt, decrypt } from './crypto.js';
import { netlifyService } from "./services/netlify.js";
import { deployToNetlify, validateNetlifyToken } from "./services/netlify-deployment.js";
import { generateWaterDamageWebsite, getDefaultBlogPosts, getDynamicDefaultBlogPosts } from "../client/src/lib/water-damage-generator.js";
import {
  MASTER_SYSTEM_PROMPT,
  buildHomePagePrompt,
  buildLocationPagePrompt,
  buildServicePagePrompt,
  type PromptBusinessContext,
  type ServiceLink,
  type ServiceLocationLink,
} from "./services/seo-prompts.js";

// Helper: generate website files using correct generator based on template
async function generateFilesForTemplate(
  businessData: any,
  template: string,
  domain?: string,
  blogPosts?: any[],
  aiGeneratedContent?: any,
  siteSettings?: any[]
): Promise<Record<string, string>> {
  const { CATEGORIES } = await import('../client/src/lib/local-service-categories.js');
  const isLocalService = CATEGORIES.some(c => c.id === template);

  if (template === 'water-damage' || isLocalService) {
    const { generateLocalServiceWebsite } = await import('../client/src/lib/local-service-engine.js');
    const urlSlug = domain || businessData.urlSlug || businessData.businessName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'website';
    return generateLocalServiceWebsite(template, businessData, urlSlug) as Record<string, string>;
  }
  return generateAllWebsiteFiles(businessData, template, domain, blogPosts, aiGeneratedContent, siteSettings) as Record<string, string>;
}

// Helper function to get API key and service based on provider
async function getAIProviderConfig(userId: string, provider: 'openai' | 'gemini' | 'openrouter' | 'deepseek', req?: any) {
  let apiKey = null;

  const requestApiKey = typeof req?.body?.apiKey === 'string'
    ? req.body.apiKey.trim()
    : '';
  if (requestApiKey && !requestApiKey.includes('•')) {
    return requestApiKey;
  }

  const providerBodyKey =
    provider === 'openai'
      ? 'openaiApiKey'
      : provider === 'gemini'
        ? 'geminiApiKey'
        : provider === 'openrouter'
          ? 'openrouterApiKey'
          : 'deepseekApiKey';
  const providerRequestApiKey = typeof req?.body?.[providerBodyKey] === 'string'
    ? req.body[providerBodyKey].trim()
    : '';
  if (providerRequestApiKey && !providerRequestApiKey.includes('•')) {
    return providerRequestApiKey;
  }

  // For guest users, check session storage first
  if (userId === 'guest' && req?.session?.guestApiKeys) {
    apiKey = req.session.guestApiKeys[provider];
    if (apiKey) {
      return apiKey;
    }
  }

  // Try user's personal API key first (check for all users including admin)
  const setting = await storage.getApiSetting(userId, provider);
  if (setting && setting.isActive && setting.apiKey) {
    const { decrypt } = await import('./crypto.js').catch(() => ({ decrypt: (k: string) => k }));
    apiKey = decrypt(setting.apiKey) || setting.apiKey;
  }

  // Fallback to environment variable
  if (!apiKey) {
    switch (provider) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case 'gemini':
        apiKey = process.env.GEMINI_API_KEY;
        break;
      case 'openrouter':
        apiKey = process.env.OPENROUTER_API_KEY;
        break;
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY;
        break;
    }
  }

  return apiKey;
}

type AIProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek';

const isAIProvider = (value: unknown): value is AIProvider =>
  value === 'openai' || value === 'gemini' || value === 'openrouter' || value === 'deepseek';

const getAIProviderOrder = (...preferredProviders: unknown[]): AIProvider[] => {
  const fallbackOrder: AIProvider[] = ['gemini', 'openai', 'openrouter', 'deepseek'];
  const ordered = [...preferredProviders, ...fallbackOrder].filter(isAIProvider);
  return [...new Set(ordered)];
};

const stringValue = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
};

const joinText = (parts: Array<unknown>, separator = " "): string => {
  return parts
    .map(stringValue)
    .filter(Boolean)
    .join(separator)
    .replace(/\s+/g, " ")
    .trim();
};

const toSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const normalizeNetlifySiteName = (value: unknown): string => {
  if (typeof value !== "string") return "";

  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
};

const extractNetlifySiteName = (website: any): string => {
  const explicitSiteName = normalizeNetlifySiteName(website?.netlifySiteId);
  if (explicitSiteName) return explicitSiteName;

  const siteUrl = stringValue(website?.netlifyUrl);
  const match = siteUrl.match(/https?:\/\/([^.]+)\.netlify\.app/i);
  if (match?.[1]) {
    return normalizeNetlifySiteName(match[1]);
  }

  return normalizeNetlifySiteName(website?.businessData?.urlSlug);
};

const getNetlifySiteConflictMessage = (siteName: string): string =>
  `The Netlify site name "${siteName}.netlify.app" is already in use. Choose a different site name.`;

const getNetlifyErrorMessage = (error: unknown, siteName?: string): string => {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    siteName &&
    (
      normalizedMessage.includes("already") ||
      normalizedMessage.includes("taken") ||
      normalizedMessage.includes("in use") ||
      normalizedMessage.includes("not unique") ||
      normalizedMessage.includes("duplicate") ||
      normalizedMessage.includes("422")
    )
  ) {
    return getNetlifySiteConflictMessage(siteName);
  }

  if (normalizedMessage.includes("401") || normalizedMessage.includes("unauthorized")) {
    return "Invalid Netlify token. Please reconnect your Netlify account token and try again.";
  }

  if (normalizedMessage.includes("403") || normalizedMessage.includes("forbidden")) {
    return "This Netlify token does not have permission to manage sites. Generate a new personal access token and try again.";
  }

  return rawMessage || "Unable to complete the Netlify request right now.";
};

const uniqueValues = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items.map((item) => item.trim()).filter(Boolean)) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

const splitValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return uniqueValues(
      value
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const itemRecord = item as Record<string, unknown>;
            return (
              stringValue(itemRecord.city) ||
              stringValue(itemRecord.service) ||
              stringValue(itemRecord.heading) ||
              stringValue(itemRecord.name) ||
              stringValue(itemRecord.anchor) ||
              stringValue(itemRecord.item) ||
              stringValue(itemRecord.sign) ||
              stringValue(itemRecord.h3)
            );
          }
          return "";
        })
        .filter(Boolean) as string[]
    );
  }

  if (typeof value === "string") {
    return uniqueValues(
      value
        .split(/[;|\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return [];
};

const splitKeywords = (value: unknown): string[] => {
  if (typeof value === "string") {
    return splitValues(value.replace(/,/g, "\n"));
  }
  return splitValues(value);
};

const toCsv = (items: string[]): string => uniqueValues(items).join("\n");

const normalizeLocationLabel = (value: unknown, preferredState?: string): string => {
  const text = stringValue(value).replace(/\s+/g, " ").trim();
  if (!text) return "";

  const commaSeparatedParts = text.split(",").map((part) => part.trim()).filter(Boolean);
  if (commaSeparatedParts.length > 1) {
    return commaSeparatedParts[0];
  }

  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const last = parts[parts.length - 1]?.replace(/[^A-Za-z]/g, "") || "";
    if (
      (preferredState && last.toLowerCase() === preferredState.toLowerCase()) ||
      /^[A-Z]{2}$/.test(last)
    ) {
      const withoutTrailingState = parts.slice(0, -1).join(" ").trim();
      if (withoutTrailingState) return withoutTrailingState;
    }

    const first = parts[0]?.replace(/[^A-Za-z]/g, "") || "";
    if (/^[A-Z]{2}$/.test(first)) {
      const withoutLeadingState = parts.slice(1).join(" ").trim();
      if (withoutLeadingState) return withoutLeadingState;
    }
  }

  return text;
};

const splitTopLevelCommaValues = (value: string): string[] => {
  const results: string[] = [];
  let current = "";
  let nestingDepth = 0;

  for (const char of value) {
    if (char === "," && nestingDepth === 0) {
      if (current.trim()) results.push(current.trim());
      current = "";
      continue;
    }

    if (char === "(" || char === "[" || char === "{") nestingDepth += 1;
    if ((char === ")" || char === "]" || char === "}") && nestingDepth > 0) nestingDepth -= 1;
    current += char;
  }

  if (current.trim()) results.push(current.trim());
  return results;
};

const parseDeployList = (
  value: unknown,
  options?: { locationMode?: boolean; preferredState?: string }
): string[] => {
  const parsed = splitValues(value);
  if (
    parsed.length !== 1 ||
    typeof value !== "string" ||
    !value.includes(",") ||
    /[;|\n]/.test(value)
  ) {
    return parsed;
  }

  const commaValues = splitTopLevelCommaValues(value);
  if (!options?.locationMode) {
    return uniqueValues(commaValues);
  }

  const preferredState = (options.preferredState || "").trim().toLowerCase();
  const looksLikeStateToken = (token: string): boolean => {
    const normalized = token.replace(/[^A-Za-z]/g, "").trim();
    if (!normalized) return false;
    return (
      /^[A-Z]{2}$/.test(token.trim()) ||
      normalized.length === 2 ||
      (preferredState.length > 0 && normalized.toLowerCase() === preferredState)
    );
  };

  if (commaValues.length >= 2 && commaValues.length % 2 === 0) {
    const pairedLocations: string[] = [];
    let canPairAll = true;

    for (let index = 0; index < commaValues.length; index += 2) {
      const city = commaValues[index];
      const state = commaValues[index + 1];
      if (!city || !state || !looksLikeStateToken(state)) {
        canPairAll = false;
        break;
      }
      pairedLocations.push(`${city.trim()}, ${state.trim()}`);
    }

    if (canPairAll) {
      return uniqueValues(pairedLocations);
    }
  }

  return uniqueValues(commaValues);
};

const normalizeLocationContentMap = (value: unknown, preferredState?: string): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  const normalizedEntries: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeLocationLabel(key, preferredState) || key;
    if (!normalizedEntries[normalizedKey]) {
      normalizedEntries[normalizedKey] = entry;
    }
  }

  return normalizedEntries;
};

const createContentFingerprint = (businessData: any): string => {
  const seed = [
    stringValue(businessData?.businessName),
    stringValue(businessData?.category),
    stringValue(businessData?.heroService),
    stringValue(businessData?.heroLocation),
    stringValue(businessData?.additionalServices || businessData?.services),
    stringValue(businessData?.additionalLocations || businessData?.serviceAreas),
    stringValue(businessData?.targetedKeywords),
  ]
    .join("|")
    .toLowerCase();

  if (!seed.trim()) return "SITE-00000000";

  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `SITE-${hash.toString(16).toUpperCase().padStart(8, "0")}`;
};

const getCategoryIdFromBusinessData = (bd: any): string => {
  if (!bd) return 'water-damage';
  if (bd.categoryId) return bd.categoryId;
  if (bd._categoryId) return bd._categoryId;
  if (bd.category) {
    const catName = String(bd.category).toLowerCase().trim();
    if (catName.includes('dumpster')) return 'dumpster-rental';
    if (catName.includes('water damage') || catName.includes('restoration')) return 'water-damage';
    if (catName.includes('mold')) return 'mold-remediation';
    if (catName.includes('fire')) return 'fire-damage';
    if (catName.includes('plumbing')) return 'plumbing';
    if (catName.includes('roofing') || catName.includes('roof replacement')) return 'roofing';
    if (catName.includes('hvac') || catName.includes('ac companies') || catName.includes('ac repair')) return 'hvac';
    if (catName.includes('electrical')) return 'electrical';
    if (catName.includes('locksmith')) return 'locksmith';
    if (catName.includes('pest')) return 'pest-control';
    if (catName.includes('tree')) return 'tree-service';
    if (catName.includes('garage')) return 'garage-door';
    if (catName.includes('foundation')) return 'foundation-repair';
    if (catName.includes('carpet')) return 'carpet-cleaning';
    if (catName.includes('window')) return 'window-replacement';
    if (catName.includes('paint')) return 'house-painting';
    if (catName.includes('junk')) return 'junk-removal';
  }
  return 'water-damage';
};

const normalizeBusinessDataForGeneration = (businessData: any) => {
  if (!businessData || typeof businessData !== "object") return businessData;

  const normalized = { ...businessData } as Record<string, any>;

  normalized.categoryId = getCategoryIdFromBusinessData(normalized);

  const normalizedServices = uniqueValues(
    [
      ...splitValues(normalized.additionalServices),
      ...splitValues(normalized.services),
      stringValue(normalized.heroService),
    ].filter(Boolean)
  ).slice(0, 350);

  const normalizedLocations = uniqueValues(
    [
      ...splitValues(normalized.additionalLocations),
      ...splitValues(normalized.serviceAreas),
      stringValue(normalized.heroLocation),
    ].filter(Boolean)
  ).slice(0, 350);

  if (normalizedServices.length > 0) {
    normalized.additionalServices = toCsv(normalizedServices);
    if (!stringValue(normalized.services)) {
      normalized.services = normalized.additionalServices;
    }
  }

  if (normalizedLocations.length > 0) {
    normalized.additionalLocations = toCsv(normalizedLocations);
    if (!stringValue(normalized.serviceAreas)) {
      normalized.serviceAreas = normalized.additionalLocations;
    }
  }

  if (!stringValue(normalized.aboutImageAlt) && stringValue(normalized.heroService) && stringValue(normalized.heroLocation)) {
    normalized.aboutImageAlt = `${stringValue(normalized.heroService)} project in ${stringValue(normalized.heroLocation)}`;
  }

  if (!stringValue(normalized.aboutImage2Alt) && normalizedLocations.length > 0) {
    const category = stringValue(normalized.category) || "local";
    normalized.aboutImage2Alt = `${category} service coverage in ${normalizedLocations[0]}`;
  }

  if (!normalized.blogPosts || !Array.isArray(normalized.blogPosts) || normalized.blogPosts.length === 0) {
    try {
      const defaultPosts = getDefaultBlogPosts(normalized as any);
      normalized.blogPosts = defaultPosts.map((p, idx) => ({
        id: p.id || `blog-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: "", // set empty so it is recognized as draft needing AI writing
        featuredImage: p.featuredImage || "",
        featuredImageAlt: p.featuredImageAlt || "",
        category: p.category || "Tips",
        status: "draft",
        isAiGenerated: true,
      }));
    } catch (e) {
      console.error("Failed to populate default draft blog posts:", e);
    }
  }

  return normalized;
};

const parseModelJson = (rawContent: string): Record<string, any> => {
  if (!rawContent) return {};

  const attempts: string[] = [];
  const trimmed = rawContent.trim();
  attempts.push(trimmed);

  let withoutCodeFence = trimmed
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  attempts.push(withoutCodeFence);

  const firstBrace = withoutCodeFence.indexOf("{");
  const lastBrace = withoutCodeFence.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(withoutCodeFence.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue with sanitization attempts.
    }
  }

  for (const candidate of attempts) {
    try {
      const sanitized = candidate
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/[\u0000-\u0019]+/g, "")
        .trim();
      return JSON.parse(sanitized);
    } catch {
      // Continue fallback.
    }
  }

  return {};
};

const VISUAL_EDITOR_CSS_KEY = "__visual_editor_css__";

const normalizeCustomFiles = (customFiles: unknown): Record<string, string> => {
  if (!customFiles || typeof customFiles !== "object") return {};

  const sanitized: Record<string, string> = {};
  for (const [filename, content] of Object.entries(customFiles as Record<string, unknown>)) {
    if (!filename || typeof filename !== "string") continue;
    if (typeof content !== "string") continue;
    sanitized[filename] = content;
  }

  return sanitized;
};

const normalizeCssForComparison = (css: string): string =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();

const stripBaseCssSnapshot = (candidateCss: string, baseCss: string): string => {
  const candidate = candidateCss?.trim();
  if (!candidate) return "";

  const base = baseCss?.trim();
  if (!base) return candidate;

  if (candidate === base) return "";
  if (candidate.startsWith(base)) {
    return candidate.slice(base.length).trim();
  }

  const indexOfExactBase = candidate.indexOf(base);
  if (indexOfExactBase >= 0) {
    return `${candidate.slice(0, indexOfExactBase)}\n${candidate.slice(indexOfExactBase + base.length)}`
      .trim();
  }

  const normalizedCandidate = normalizeCssForComparison(candidate);
  const normalizedBase = normalizeCssForComparison(base);
  if (!normalizedCandidate || !normalizedBase) return candidate;
  if (normalizedCandidate === normalizedBase) return "";

  if (
    normalizedCandidate.length >= Math.floor(normalizedBase.length * 0.95) &&
    normalizedBase.length > 200 &&
    normalizedCandidate.startsWith(normalizedBase.slice(0, 200)) &&
    normalizedCandidate.endsWith(normalizedBase.slice(-200))
  ) {
    return "";
  }

  return candidate;
};

const mergeWebsiteFilesWithCustomFiles = (
  baseFiles: Record<string, string>,
  customFilesInput: unknown
): { mergedFiles: Record<string, string>; sanitizedCustomFiles: Record<string, string> } => {
  const sanitizedCustomFiles = normalizeCustomFiles(customFilesInput);
  if (Object.keys(sanitizedCustomFiles).length === 0) {
    return { mergedFiles: baseFiles, sanitizedCustomFiles };
  }

  const mergedFiles = { ...baseFiles };
  const appliedCustomFiles: Record<string, string> = {};
  const stylesChunks: string[] = [];

  if (typeof mergedFiles["styles.css"] === "string") {
    stylesChunks.push(mergedFiles["styles.css"]);
  }

  for (const [filename, content] of Object.entries(sanitizedCustomFiles)) {
    if (filename === "styles.css" || filename === VISUAL_EDITOR_CSS_KEY) {
      const baseStylesCss = typeof baseFiles["styles.css"] === "string" ? baseFiles["styles.css"] : "";
      const cleanedCss = stripBaseCssSnapshot(content, baseStylesCss);
      if (!cleanedCss) continue;

      stylesChunks.push(cleanedCss);
      appliedCustomFiles[filename] = cleanedCss;
      continue;
    }

    if (typeof baseFiles[filename] === "string" && baseFiles[filename] === content) {
      continue;
    }

    mergedFiles[filename] = content;
    appliedCustomFiles[filename] = content;
  }

  if (stylesChunks.length > 0) {
    mergedFiles["styles.css"] = stylesChunks.join("\n\n");
  }

  return { mergedFiles, sanitizedCustomFiles: appliedCustomFiles };
};

// Helper function to retry promises with exponential backoff on rate limits (429)
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  initialDelay = 2000,
  factor = 2
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        errorMessage.includes("429") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("too many requests") ||
        errorMessage.toLowerCase().includes("resourceexhausted") ||
        errorMessage.toLowerCase().includes("quota exceeded");

      if (attempt >= retries || !isRateLimit) {
        throw error;
      }

      const delay = initialDelay * Math.pow(factor, attempt - 1);
      console.warn(`[API Rate Limit] Attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${errorMessage}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Helper to run promises with a concurrency limit
async function pLimit<T>(
  items: any[],
  concurrency: number,
  fn: (item: any) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  const promises: Promise<void>[] = [];

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      try {
        results[currentIndex] = await fn(item);
      } catch (err) {
        console.error(`Error in pLimit worker for item:`, item, err);
        results[currentIndex] = null as any;
      }
    }
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  return results;
}

async function generateStructuredJsonWithProvider(
  provider: AIProvider,
  apiKey: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<Record<string, any>> {
  const maxTokens = options.maxTokens ?? 6000;
  const temperature = options.temperature ?? 0.65;

  return withRetry(async () => {
    if (provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: MASTER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
      });

      return parseModelJson(response.choices?.[0]?.message?.content || "");
    }

    if (provider === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://replit.com",
          "X-Title": "SiteGenie",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: MASTER_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return parseModelJson(data?.choices?.[0]?.message?.content || "");
    }

    if (provider === "deepseek") {
      const { generateStructuredJsonWithDeepSeek } = await import("./services/deepseek.js");
      return generateStructuredJsonWithDeepSeek(MASTER_SYSTEM_PROMPT, userPrompt, apiKey, options);
    }

    const { generateWithGemini } = await import("./services/gemini");
    const content = await generateWithGemini(
      `${MASTER_SYSTEM_PROMPT}\n\n${userPrompt}\n\nReturn only valid JSON with no markdown.`,
      apiKey
    );
    return parseModelJson(content);
  });
}

const toPromptContext = (
  businessData: any,
  overrides: Partial<PromptBusinessContext> = {}
): PromptBusinessContext => {
  const normalizedBusinessData = normalizeBusinessDataForGeneration(businessData);
  const locationItems = splitValues(
    normalizedBusinessData?.additionalLocations ||
    normalizedBusinessData?.serviceAreas ||
    normalizedBusinessData?.heroLocation
  );
  const serviceItems = splitValues(
    normalizedBusinessData?.additionalServices ||
    normalizedBusinessData?.services ||
    normalizedBusinessData?.heroService
  );
  const primaryCity = stringValue(overrides.primaryCity || normalizedBusinessData?.heroLocation || locationItems[0] || "Local Area");
  const nicheKeywords = uniqueValues(
    [
      ...splitKeywords(overrides.nicheKeywords),
      ...splitKeywords(normalizedBusinessData?.targetedKeywords),
      ...serviceItems,
      stringValue(normalizedBusinessData?.category),
    ].filter(Boolean)
  ).slice(0, 12);

  return {
    name: stringValue(overrides.name || normalizedBusinessData?.businessName) || "Local Business",
    type: stringValue(overrides.type || normalizedBusinessData?.category) || "Local Service",
    primaryCity,
    locations: uniqueValues((overrides.locations || locationItems || [primaryCity]).filter(Boolean)),
    services: uniqueValues((overrides.services || serviceItems || [normalizedBusinessData?.heroService || "Professional Service"]).filter(Boolean)),
    yearsInBusiness: overrides.yearsInBusiness || normalizedBusinessData?.yearsInBusiness || "over 10 years",
    usp:
      stringValue(overrides.usp || normalizedBusinessData?.keyFacts || normalizedBusinessData?.featureHeadlines) ||
      "licensed, insured, same-day service, free estimates",
    phone: stringValue(overrides.phone || normalizedBusinessData?.phone) || "(555) 000-0000",
    ownerName: stringValue(overrides.ownerName || normalizedBusinessData?.ownerName),
    address: stringValue(overrides.address || normalizedBusinessData?.address),
    website: stringValue(overrides.website || normalizedBusinessData?.website),
    contentFingerprint:
      stringValue(overrides.contentFingerprint) || createContentFingerprint(normalizedBusinessData),
    nicheKeywords,
  };
};

const fallbackServicePageContent = (service: string, businessData: any) => {
  const city = stringValue(businessData?.heroLocation || businessData?.serviceAreas) || "your area";
  const businessName = stringValue(businessData?.businessName) || "Our team";
  const category = stringValue(businessData?.category).toLowerCase() || "service";
  const nicheKeywords = splitKeywords(businessData?.targetedKeywords).slice(0, 4);
  const nicheSnippet = nicheKeywords.length > 0 ? `Key focus areas include ${nicheKeywords.join(", ")}.` : "";
  const contentFingerprint = createContentFingerprint(businessData);

  return {
    serviceDescription: `${businessName} provides professional ${service.toLowerCase()} in ${city}. We focus on durable results, transparent communication, and a smooth customer experience from start to finish. ${nicheSnippet}`.trim(),
    processSteps: [
      `Initial ${service.toLowerCase()} consultation`,
      "Professional assessment and recommendations",
      "Transparent pricing and strategy approval",
      "Expert execution and quality checks",
      "Final review and client sign-off",
      "Post-service guidance and follow-up",
      "Ongoing support when needed",
    ],
    whyChooseForService: `You get a dedicated ${category} team that understands ${city}, arrives prepared, and prioritizes quality outomes on every ${service.toLowerCase()} project.`,
    commonIssues: [
      `${service} performance gaps`,
      "Unexpected obstacles and pressing problems",
      "Recurring service quality concerns",
      "Industry compliance and best practices",
      "Costly inefficiencies",
      "Strategic planning gaps",
    ],
    serviceFeatures: [
      "Qualified and experienced professionals",
      "Clear pricing before work starts",
      "High-quality tools and methods",
      "Fast response and reliable scheduling",
      "Satisfaction focus on completed work",
      "Friendly local support team",
    ],
    qualityAssurance: `Every ${service.toLowerCase()} project includes clear quality checks, honest communication, and support after completion so you can move forward with confidence. Content profile ${contentFingerprint}.`,
    metaTitle: `${service} in ${city} | ${businessName}`.slice(0, 60),
    metaDescription: `${businessName} delivers trusted ${service.toLowerCase()} in ${city}. Reach out today for expert service and a clear quote.`.slice(0, 160),
    heroDescription: `Need ${service.toLowerCase()} in ${city}? ${businessName} delivers fast, reliable service with transparent pricing and proven expertise.`,
  };
};

const fallbackLocationPageContent = (location: string, businessData: any) => {
  const service = stringValue(businessData?.heroService || businessData?.services).toLowerCase() || "professional service";
  const businessName = stringValue(businessData?.businessName) || "Our team";
  const category = stringValue(businessData?.category).toLowerCase() || "service";
  const nicheKeywords = splitKeywords(businessData?.targetedKeywords).slice(0, 4);
  const localSnippet = nicheKeywords.length > 0 ? `This page is tailored for ${nicheKeywords.join(", ")} in ${location}.` : "";
  const contentFingerprint = createContentFingerprint(businessData);

  return {
    heroDescription: `${businessName} provides reliable ${service} across ${location}. Our local ${category} team understands the area and delivers quality solutions with quick response times. ${localSnippet}`.trim(),
    aboutContent: `For years, clients in ${location} have trusted ${businessName} for consistent ${service}. We combine local knowledge, practical recommendations, and skilled execution to ensure success. Content profile ${contentFingerprint}.`,
    whyChooseContent: `Customers in ${location} choose us for honest pricing, dependable scheduling, and clear communication from the first interaction to the final result.`,
    serviceAreasContent: `We serve clients and businesses throughout ${location} and surrounding communities. If you are nearby, contact us and we will confirm fast availability.`,
    emergencyContent: `When time-sensitive ${service} needs arise in ${location}, our team is ready to respond quickly and provide solutions with minimal disruption.`,
    localBenefits: [
      `Local ${location} market knowledge`,
      "Fast response throughout the area",
      "Team trained on industry standards",
      "Consistent communication and updates",
      "Reliable results and follow-up support",
      "Transparent recommendations for your needs",
    ],
    metaTitle: `${stringValue(businessData?.category)} in ${location} | ${businessName}`.slice(0, 60),
    metaDescription: `${businessName} offers trusted ${service} in ${location} with fast response and quality results. Contact us now for professional support.`.slice(0, 160),
  };
};

const mapServicePromptResponse = (raw: Record<string, any>, service: string, businessData: any) => {
  const fallback = fallbackServicePageContent(service, businessData);
  const overviewBody = splitValues(raw?.overviewSection?.body);
  const benefitPoints = Array.isArray(raw?.benefitsSection?.points) ? raw.benefitsSection.points : [];
  const warningSigns = Array.isArray(raw?.warningSignsSection?.signs) ? raw.warningSignsSection.signs : [];
  const processSteps = Array.isArray(raw?.processSection?.steps) ? raw.processSection.steps : [];

  const mappedProcessSteps = uniqueValues(
    processSteps.map((step: any) => stringValue(step?.heading || step?.body)).filter(Boolean)
  );

  const mappedCommonIssues = uniqueValues(
    warningSigns.map((item: any) => stringValue(item?.sign || item?.body)).filter(Boolean)
  );

  const mappedFeatures = uniqueValues(
    [
      ...benefitPoints.map((point: any) => stringValue(point?.heading || point?.body)),
      ...splitValues(raw?.hero?.trustBadges),
    ].filter(Boolean)
  );

  return {
    serviceDescription:
      joinText([overviewBody[0], overviewBody[1], overviewBody[2]]) || fallback.serviceDescription,
    processSteps:
      mappedProcessSteps.length >= 4 ? mappedProcessSteps.slice(0, 7) : fallback.processSteps,
    whyChooseForService:
      joinText([
        raw?.hero?.subheadline,
        ...benefitPoints.slice(0, 2).map((point: any) => point?.body),
      ]) || fallback.whyChooseForService,
    commonIssues:
      mappedCommonIssues.length >= 3 ? mappedCommonIssues.slice(0, 6) : fallback.commonIssues,
    serviceFeatures:
      mappedFeatures.length >= 3 ? mappedFeatures.slice(0, 6) : fallback.serviceFeatures,
    qualityAssurance: joinText([raw?.finalCTA?.body, raw?.faqSection?.faqs?.[0]?.answer]) || fallback.qualityAssurance,
    metaTitle: stringValue(raw?.metaTitle) || fallback.metaTitle,
    metaDescription: stringValue(raw?.metaDescription) || fallback.metaDescription,
    heroDescription: joinText([raw?.hero?.subheadline, overviewBody[0]]) || fallback.heroDescription,
  };
};

const mapLocationPromptResponse = (raw: Record<string, any>, location: string, businessData: any) => {
  const fallback = fallbackLocationPageContent(location, businessData);
  const introParagraphs = splitValues(raw?.localIntroSection?.paragraphs);
  const whyPoints = Array.isArray(raw?.whyLocalSection?.points) ? raw.whyLocalSection.points : [];

  const localBenefits = uniqueValues(
    whyPoints
      .map((point: any) => stringValue(point?.heading || point?.body))
      .filter(Boolean)
  );

  return {
    heroDescription:
      joinText([raw?.hero?.subheadline, introParagraphs[0], introParagraphs[1]]) ||
      fallback.heroDescription,
    aboutContent:
      joinText([...introParagraphs, raw?.localAreaSection?.body]) || fallback.aboutContent,
    whyChooseContent:
      joinText(whyPoints.map((point: any) => point?.body).slice(0, 3)) || fallback.whyChooseContent,
    serviceAreasContent: stringValue(raw?.localAreaSection?.body) || fallback.serviceAreasContent,
    emergencyContent:
      joinText([raw?.finalCTA?.body, raw?.faqSection?.faqs?.[1]?.answer]) || fallback.emergencyContent,
    localBenefits: localBenefits.length >= 3 ? localBenefits.slice(0, 6) : fallback.localBenefits,
    metaTitle: stringValue(raw?.metaTitle) || fallback.metaTitle,
    metaDescription: stringValue(raw?.metaDescription) || fallback.metaDescription,
  };
};

const buildFaqFields = (faqItems: Array<{ question: string; answer: string }>, serviceType: string, location: string) => {
  const defaults = [
    {
      question: `Do you offer ${serviceType.toLowerCase()} in ${location}?`,
      answer: `Yes. We provide ${serviceType.toLowerCase()} across ${location} with fast scheduling and transparent recommendations.`,
    },
    {
      question: `How quickly can I get started with ${serviceType.toLowerCase()}?`,
      answer: `Most requests are scheduled quickly based on availability. Contact us and we will confirm the fastest timeline for your needs.`,
    },
    {
      question: `How much does ${serviceType.toLowerCase()} usually cost?`,
      answer: `Pricing depends on project scope, complexity, and specific requirements. We provide clear estimates so you know exactly what to expect.`,
    },
    {
      question: `Is your team qualified and experienced?`,
      answer: `Yes. Our professionals follow industry standards and work with quality, safety, and compliance as top priorities.`,
    },
    {
      question: `What areas around ${location} do you cover?`,
      answer: `We serve clients in ${location} and nearby communities. Contact us with your details and we will confirm coverage immediately.`,
    },
    {
      question: `Do you provide urgent or priority support?`,
      answer: `For time-sensitive needs, contact us directly and we will prioritize your request based on the situation and current availability.`,
    },
    {
      question: `Can I get a consultation or estimate first?`,
      answer: `Absolutely. We provide a clear review and estimate before work starts so you can decide with confidence.`,
    },
    {
      question: `How long does a typical ${serviceType.toLowerCase()} project take?`,
      answer: `Timelines vary by project size, but we always provide realistic expectations and proactive updates throughout the process.`,
    },
    {
      question: `What makes your company different in ${location}?`,
      answer: `We combine local experience, transparent communication, and quality execution focused on long-term results.`,
    },
    {
      question: `How do I get started?`,
      answer: `Contact us directly and our team will guide you through the next steps to begin your project.`,
    },
  ];

  const merged = [...faqItems, ...defaults].slice(0, 10);
  const faqData: Record<string, string> = {};
  merged.forEach((faq, index) => {
    const id = index + 1;
    faqData[`faqQuestion${id}`] = stringValue(faq.question) || defaults[index].question;
    faqData[`faqAnswer${id}`] = stringValue(faq.answer) || defaults[index].answer;
  });
  return faqData;
};

const mapHomePromptToBuilderFields = (
  raw: Record<string, any>,
  context: {
    finalBusinessName: string;
    serviceType: string;
    location: string;
    businessCategory: string;
    phoneNumber: string;
  }
) => {
  const serviceCards = Array.isArray(raw?.servicesSection?.cards) ? raw.servicesSection.cards : [];
  const servicesFromCards = uniqueValues(
    serviceCards
      .map((card: any) => stringValue(card?.service || card?.h3))
      .filter(Boolean)
  );
  const locationsFromLinks = Array.isArray(raw?.locationsSection?.locationLinks)
    ? uniqueValues(
      raw.locationsSection.locationLinks
        .map((item: any) => stringValue(item?.city || item?.anchor))
        .filter(Boolean)
    )
    : [];
  const whyPoints = Array.isArray(raw?.whyUsSection?.points) ? raw.whyUsSection.points : [];

  const services = uniqueValues([context.serviceType, ...servicesFromCards]).slice(0, 8);
  const serviceAreas = uniqueValues([context.location, ...locationsFromLinks]).slice(0, 6);
  const faqItems = Array.isArray(raw?.faqSection?.faqs)
    ? raw.faqSection.faqs
      .map((item: any) => ({
        question: stringValue(item?.question),
        answer: stringValue(item?.answer),
      }))
      .filter((item: any) => item.question && item.answer)
    : [];

  const featureHeadlines = uniqueValues(
    whyPoints.map((point: any) => stringValue(point?.heading)).filter(Boolean)
  );
  const featureDescriptions = uniqueValues(
    whyPoints.map((point: any) => stringValue(point?.body)).filter(Boolean)
  );

  const keywords = uniqueValues([
    ...splitValues(raw?.seoFootnote?.targetKeywords),
    `${context.serviceType} in ${context.location}`,
    `${context.businessCategory} in ${context.location}`,
    `${context.serviceType} ${context.location}`,
  ]).slice(0, 10);

  const keyFacts = uniqueValues([
    stringValue(raw?.hero?.trustLine),
    ...splitValues(raw?.hero?.trustBadges),
    ...featureHeadlines,
  ]).slice(0, 4);

  const introParagraphs = splitValues(raw?.intro?.paragraphs);

  const seoSections = {
    seoHeading1: stringValue(raw?.intro?.h2) || "Professional Service You Can Trust",
    seoContent1: joinText(introParagraphs.slice(0, 2)) || "",
    seoHeading2: stringValue(raw?.servicesSection?.h2) || "Comprehensive Service Solutions",
    seoContent2: joinText([raw?.servicesSection?.intro, ...serviceCards.slice(0, 2).map((card: any) => card?.description)]),
    seoHeading3: stringValue(raw?.whyUsSection?.h2) || "Why Customers Choose Us",
    seoContent3: joinText(whyPoints.slice(0, 3).map((point: any) => point?.body)),
    seoHeading4: stringValue(raw?.locationsSection?.h2) || "Local Area Expertise",
    seoContent4: stringValue(raw?.locationsSection?.body),
    seoHeading5: stringValue(raw?.faqSection?.h2) || "Common Questions Answered",
    seoContent5: joinText(faqItems.slice(0, 2).map((faq: any) => faq.answer)),
    seoHeading6: stringValue(raw?.seoFootnote?.h2) || `${context.serviceType} in ${context.location}`,
    seoContent6: stringValue(raw?.seoFootnote?.body),
  };

  return {
    businessName: context.finalBusinessName,
    category: context.businessCategory,
    phone: context.phoneNumber,
    address: context.location,
    heroService: context.serviceType,
    heroLocation: context.location,
    heroDescription:
      joinText([raw?.hero?.subheadline, introParagraphs[0]]) ||
      `Trusted ${context.serviceType.toLowerCase()} in ${context.location}.`,
    metaTitle:
      stringValue(raw?.metaTitle) ||
      `${context.serviceType} in ${context.location} | ${context.finalBusinessName}`.slice(0, 60),
    metaDescription:
      stringValue(raw?.metaDescription) ||
      `${context.finalBusinessName} provides reliable ${context.serviceType.toLowerCase()} in ${context.location}. Call now for fast support.`.slice(0, 160),
    aboutDescription:
      joinText([...introParagraphs, raw?.finalCTA?.body]) ||
      `${context.finalBusinessName} provides dependable ${context.serviceType.toLowerCase()} services in ${context.location}.`,
    services: toCsv(services),
    additionalServices: toCsv(services),
    serviceAreas: toCsv(serviceAreas),
    additionalLocations: toCsv(serviceAreas),
    targetedKeywords: toCsv(keywords),
    featureHeadlines:
      toCsv(featureHeadlines.slice(0, 6)) ||
      "Trusted Professionals, Fast Response, Quality Results, Transparent Pricing, Local Expertise, Customer First",
    featureDescriptions:
      toCsv(featureDescriptions.slice(0, 6)) ||
      "Experienced team with proven results, Quick and reliable scheduling, High-quality workmanship on every job, Clear quotes with no surprises, Strong local service knowledge, Friendly support from start to finish",
    keyFacts:
      toCsv(keyFacts) ||
      "Licensed & Insured, Free Estimates, Highly Rated Service, Locally Trusted Team",
    footerTitle: context.finalBusinessName,
    footerDescription:
      stringValue(raw?.finalCTA?.body) ||
      `Professional ${context.serviceType.toLowerCase()} services in ${context.location}. Contact us today.`,
    ...seoSections,
    ...buildFaqFields(faqItems, context.serviceType, context.location),
  };
};

const buildOperationalDetailsPrompt = (
  context: {
    finalBusinessName: string;
    serviceType: string;
    location: string;
    businessCategory: string;
    phoneNumber: string;
  }
) => `Create operational and structured SEO details for this business.

Business:
- Name: ${context.finalBusinessName}
- Service Type: ${context.serviceType}
- Category: ${context.businessCategory}
- Primary Location: ${context.location}
- Phone: ${context.phoneNumber}

Return strict JSON:
{
  "yearsInBusiness": "number from 3 to 35",
  "businessHours": "single readable business hours string",
  "services": ["6 to 8 specific services"],
  "serviceAreas": ["4 to 6 nearby areas including the primary location"],
  "targetedKeywords": ["8 to 10 buyer-intent keyword phrases"],
  "featureHeadlines": ["exactly 6 short benefit headlines"],
  "featureDescriptions": ["exactly 6 matching descriptions"],
  "keyFacts": ["exactly 4 trust facts"]
}

Rules:
- Keep all outputs specific to ${context.businessCategory}
- Keep location references realistic to ${context.location}
- Avoid generic filler phrases`;

const buildTestimonialsPrompt = (
  context: {
    finalBusinessName: string;
    serviceType: string;
    location: string;
    businessCategory: string;
  }
) => `Create 3 realistic customer testimonials for ${context.finalBusinessName}, a ${context.businessCategory} business in ${context.location}.

Return strict JSON:
{
  "testimonial1Name": "US-style first and last name",
  "testimonial1Text": "70-120 words",
  "testimonial1Rating": 5,
  "testimonial2Name": "US-style first and last name",
  "testimonial2Text": "70-120 words",
  "testimonial2Rating": 5,
  "testimonial3Name": "US-style first and last name",
  "testimonial3Text": "70-120 words",
  "testimonial3Rating": 5
}

Rules:
- Mention ${context.serviceType} context naturally
- Keep tone human and specific
- Avoid generic marketing language`;

const buildDisclaimerPrompt = (context: { finalBusinessName: string; businessCategory: string }) =>
  `Create a professional lead generation disclaimer for ${context.finalBusinessName}, a ${context.businessCategory} business.

Return strict JSON:
{
  "leadGenDisclaimer": "2-3 sentence legal-safe disclaimer"
}`;

// Provider-aware service page content generation
async function generateServicePageContentWithProvider(service: string, businessData: any, apiKey: string, provider: AIProvider = 'openai') {
  try {
    const promptContext = toPromptContext(businessData);
    const serviceSlug = `/services/${toSlug(service)}`;
    const locationPages: ServiceLocationLink[] = splitValues(
      businessData?.additionalLocations || businessData?.serviceAreas || promptContext.primaryCity
    ).map((city) => ({
      city,
      slug: `/locations/${toSlug(city)}`,
    }));
    const otherServiceSlugs = splitValues(businessData?.additionalServices || businessData?.services)
      .filter((item) => item.toLowerCase() !== service.toLowerCase())
      .map((item) => `/services/${toSlug(item)}`);

    const prompt = buildServicePagePrompt(
      promptContext,
      service,
      serviceSlug,
      locationPages,
      otherServiceSlugs
    );
    const rawResponse = await generateStructuredJsonWithProvider(provider, apiKey, prompt, {
      maxTokens: 5500,
      temperature: 0.65,
    });
    return mapServicePromptResponse(rawResponse, service, businessData);
  } catch (error) {
    console.error(`Advanced service prompt generation failed for "${service}":`, error);

    if (provider === "openai") {
      try {
        return await generateServicePageContent(service, businessData, apiKey);
      } catch (fallbackError) {
        console.error("OpenAI fallback service generation failed:", fallbackError);
      }
    }

    return fallbackServicePageContent(service, businessData);
  }
}

// Provider-aware location page content generation
async function generateLocationPageContentWithProvider(location: string, businessData: any, apiKey: string, provider: AIProvider = 'openai') {
  try {
    const promptContext = toPromptContext(businessData);
    const servicePages: ServiceLink[] = splitValues(businessData?.additionalServices || businessData?.services).map((service) => ({
      service,
      slug: `/services/${toSlug(service)}`,
    }));
    const serviceLocationPages: ServiceLink[] = servicePages.map((servicePage) => ({
      service: servicePage.service,
      slug: `/services/${toSlug(servicePage.service)}-${toSlug(location)}`,
    }));

    const prompt = buildLocationPagePrompt(
      promptContext,
      location,
      servicePages,
      serviceLocationPages
    );
    const rawResponse = await generateStructuredJsonWithProvider(provider, apiKey, prompt, {
      maxTokens: 5500,
      temperature: 0.65,
    });
    return mapLocationPromptResponse(rawResponse, location, businessData);
  } catch (error) {
    console.error(`Advanced location prompt generation failed for "${location}":`, error);

    if (provider === "openai") {
      try {
        return await generateLocationPageContent(location, businessData, apiKey);
      } catch (fallbackError) {
        console.error("OpenAI fallback location generation failed:", fallbackError);
      }
    }

    return fallbackLocationPageContent(location, businessData);
  }
}

/**
 * Generate AI-written unique content for a local service site.
 * Returns fields that override the template defaults in the WD generator.
 * If no API key is configured (or user role doesn't allow it), returns null
 * and the template falls back to its built-in copy.
 */
type LocalServiceAIContent = {
  providerUsed: AIProvider;
  introParas?: string[];
  faqs?: any[];
  seoBody?: string;
  processSteps?: any[];
  whyChooseUs?: any[];
  aboutContent?: string;
  testimonials?: any[];
  serviceDescriptions?: Record<string, any>;
};

async function generateLocalServiceAIContent(
  bd: any,
  userId: string,
  categoryName: string,
  primaryKeyword: string
): Promise<LocalServiceAIContent | null> {
  const user = await storage.getUser(userId);
  if (!user || (user.role !== 'user' && user.role !== 'paid' && user.role !== 'admin')) {
    console.log('Local service AI content: skipping (user role)');
    return null;
  }

  const providerOrder = getAIProviderOrder(
    bd.contentAiProvider,
    bd.aiProvider
  );

  const providerCandidates: Array<{ provider: AIProvider; apiKey: string }> = [];

  for (const candidateProvider of providerOrder) {
    const websiteApiKey =
      candidateProvider === 'openai'
        ? stringValue(bd.openaiApiKey)
        : candidateProvider === 'gemini'
          ? stringValue(bd.geminiApiKey)
          : candidateProvider === 'openrouter'
            ? stringValue(bd.openrouterApiKey)
            : stringValue(bd.deepseekApiKey);

    if (websiteApiKey) {
      providerCandidates.push({ provider: candidateProvider, apiKey: websiteApiKey });
      continue;
    }

    const storedApiKey = await getAIProviderConfig(userId, candidateProvider);
    if (storedApiKey) {
      providerCandidates.push({ provider: candidateProvider, apiKey: storedApiKey });
    }
  }

  if (providerCandidates.length === 0) {
    console.log('Local service AI content: skipping (no API key)');
    return null;
  }

  const biz: PromptBusinessContext = {
    name: bd.businessName || 'Local Business',
    type: categoryName,
    primaryCity: bd.city || bd.primaryCity || '',
    locations: Array.isArray(bd.serviceAreas) ? bd.serviceAreas : (bd.serviceAreas || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    services: Array.isArray(bd.services) ? bd.services : (bd.services || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    phone: bd.phone || '',
    yearsInBusiness: bd.yearsInBusiness,
    usp: bd.usp || bd.uniqueSellingPoint,
  };

  const baseRules = `
You are a seasoned local ${categoryName} copywriter specializing in humanized, conversion-focused content for local businesses.
Writing style rules:
- Aim for a 7th-to-8th-grade reading level. Explain any industry terms in simple, plain language for homeowners.
- Write as if you are the business owner sitting across from a potential customer at their kitchen table in ${biz.primaryCity}. You have done this work for years. You know the common problems, the local conditions, and exactly what needs to happen.
- Use contractions (we're, you'll, it's, don't). Americans talk this way. Your content should read the same way.
- BANNED: Do not use these AI-sounding words or phrases: "comprehensive," "cutting-edge," "state-of-the-art," "leverage," "navigate," "landscape" (unless about actual land), "whether you're... or...," "don't hesitate," "look no further," "rest assured," "peace of mind," "second to none," "unparalleled," "delve," "elevate," "empower," "robust," "seamless."
- Do NOT use slash constructions. Write "repair and replacement" not "repair/replacement." Write "homes and businesses" not "homes/businesses."
- Vary sentence length. Mix short direct statements with longer explanatory sentences.
- Include real-world scenarios homeowners actually deal with (a pipe bursting at 2am, discovering a leak after vacation, finding mold behind drywall during a remodel)
- Reference local landmarks, neighborhoods, ZIP codes, nearby highways, and weather patterns when relevant
- SEMANTIC ENTITIES: Include specific tool names, material names, industry certifications (IICRC, EPA, OSHA), equipment types, measurement units, building code references, and process terminology that Google expects on an authoritative ${categoryName} page
- LSI KEYWORDS: Include at least 10-15 semantically related terms beyond the primary keyword. Think about what a thorough, expert page about ${primaryKeyword} would naturally mention.
- HIGH INTENT KEYWORDS: Naturally work in phrases like: "cost of ${primaryKeyword} in ${biz.primaryCity}," "free ${primaryKeyword} estimate," "same day ${primaryKeyword}," "${primaryKeyword} near me," "emergency ${primaryKeyword} ${biz.primaryCity}"
- EXTERNAL DOFOLLOW LINKS (MANDATORY): Embed at least 1-2 external dofollow links naturally within paragraph text. Link to real, authoritative sources relevant to ${biz.primaryCity} and the ${categoryName} industry — e.g., city official website, state licensing board, industry association (IICRC, EPA, FEMA). Format: <a href="https://real-url.com" target="_blank" rel="dofollow">descriptive anchor text</a>. Use only REAL, verifiable URLs. Never link to competitors.
`;

  console.log(`Generating AI content for local service site in parallel splits: ${biz.name} (${categoryName})`);

  let lastError: unknown = null;

  for (const candidate of providerCandidates) {
    try {
      const corePrompt = `
${baseRules}
Write core page copy (Intro paragraphs, About us section, and SEO footnote paragraph) for:
- Business Name: ${biz.name}
- Category: ${categoryName}
- Location: ${biz.primaryCity}
- Keywords: ${primaryKeyword}

Return strict JSON (no markdown fences, no formatting backticks):
{
  "introParas": [
    "Paragraph 1 (110-160 words): homeowner pain points, why they trust ${biz.name} in ${biz.primaryCity}.",
    "Paragraph 2 (110-160 words): service process, credentials, local city trust.",
    "Paragraph 3 (110-160 words): specific equipment, methods, and expectations.",
    "Paragraph 4 (90-130 words): urgent CTA."
  ],
  "aboutContent": "250-350 words about section from owner's personal perspective.",
  "seoBody": "200-300 words SEO optimized paragraph linking services & locations."
}
`;

      const trustPrompt = `
${baseRules}
Write trust factors (10 FAQs) for:
- Business Name: ${biz.name}
- Category: ${categoryName}
- Location: ${biz.primaryCity}
- Keywords: ${primaryKeyword}

Return strict JSON (no markdown fences, no formatting backticks):
{
  "faqs": [
    { "question": "Specific question about ${primaryKeyword} in ${biz.primaryCity}?", "answer": "70-120 words answer." },
    { "question": "Question about pricing/cost?", "answer": "70-120 words answer." },
    { "question": "Question about licensing/qualifications?", "answer": "70-120 words answer." },
    { "question": "Question about response time?", "answer": "70-120 words answer." },
    { "question": "Question about what to expect?", "answer": "70-120 words answer." },
    { "question": "Question about common problems?", "answer": "70-120 words answer." },
    { "question": "Question about safety/guarantees?", "answer": "70-120 words answer." },
    { "question": "Question about service area coverage?", "answer": "70-120 words answer." },
    { "question": "Question about maintenance?", "answer": "70-120 words answer." },
    { "question": "Question about choosing a provider?", "answer": "70-120 words answer." }
  ]
}
`;

      const processPrompt = `
${baseRules}
Write process steps and unique reasons to choose us for:
- Business Name: ${biz.name}
- Category: ${categoryName}
- Location: ${biz.primaryCity}
- USP: ${biz.usp || "professional service"}

Return strict JSON (no markdown fences, no formatting backticks):
{
  "processSteps": [
    { "step": 1, "heading": "Initial Inspection & Diagnosis", "body": "80-120 words description specific to ${categoryName} processes" },
    { "step": 2, "heading": "Problem Containment & Setup", "body": "80-120 words description of safety containment and prep work specific to ${categoryName}" },
    { "step": 3, "heading": "Core ${categoryName} Service Delivery", "body": "80-120 words description of the primary repair, installation, or treatment" },
    { "step": 4, "heading": "System Testing & Quality Checks", "body": "80-120 words description of validating performance and safety standards" },
    { "step": 5, "heading": "Clean-Up & Final Walkthrough", "body": "80-120 words description of site restoration and customer review" }
  ],
  "whyChooseUs": [
    { "heading": "Local ${categoryName} Experts", "body": "80-120 words unique reason based on local reputation and knowledge" },
    { "heading": "Certified & Licensed Technicians", "body": "80-120 words unique reason based on licensing, training, and IICRC/trade standards" },
    { "heading": "Fast Emergency Response", "body": "80-120 words unique reason based on 24/7 availability or rapid scheduling" },
    { "heading": "Upfront Honest Pricing", "body": "80-120 words unique reason based on free estimates or transparent rates" },
    { "heading": "Advanced Tools & Methods", "body": "80-120 words unique reason based on modern industry equipment" },
    { "heading": "Satisfaction Guaranteed", "body": "80-120 words unique reason based on warranties and workmanship guarantees" }
  ]
}
`;

      const serviceList = biz.services.slice(0, 8);
      const servicePrompt = `
${baseRules}
Write service descriptions for each of the following services:
- Services: ${serviceList.join(", ")}
- Business Name: ${biz.name}

Return strict JSON (no markdown fences, no formatting backticks):
{
  "serviceDescriptions": {
    ${serviceList.map(s => `"${s}": "100-150 words description of ${s} service, explaining what it includes and why we excel at it."`).join(",\n    ")}
  }
}
`;

      // Run AI generation requests in parallel to avoid Gateway Timeouts (under 26 seconds)
      const [coreRes, trustRes, processRes, serviceRes] = await Promise.all([
        generateStructuredJsonWithProvider(candidate.provider, candidate.apiKey, corePrompt, { maxTokens: 2500, temperature: 0.7 }),
        generateStructuredJsonWithProvider(candidate.provider, candidate.apiKey, trustPrompt, { maxTokens: 2500, temperature: 0.7 }),
        generateStructuredJsonWithProvider(candidate.provider, candidate.apiKey, processPrompt, { maxTokens: 2500, temperature: 0.7 }),
        generateStructuredJsonWithProvider(candidate.provider, candidate.apiKey, servicePrompt, { maxTokens: 2500, temperature: 0.7 }),
      ]);

      const out: LocalServiceAIContent = { providerUsed: candidate.provider };
      if (Array.isArray(coreRes.introParas) && coreRes.introParas.length > 0) out.introParas = coreRes.introParas;
      if (typeof coreRes.aboutContent === 'string' && coreRes.aboutContent.trim()) out.aboutContent = coreRes.aboutContent;
      if (typeof coreRes.seoBody === 'string' && coreRes.seoBody.trim()) out.seoBody = coreRes.seoBody;

      if (Array.isArray(trustRes.faqs) && trustRes.faqs.length > 0) out.faqs = trustRes.faqs;
      out.testimonials = [];

      if (Array.isArray(processRes.processSteps) && processRes.processSteps.length > 0) out.processSteps = processRes.processSteps;
      if (Array.isArray(processRes.whyChooseUs) && processRes.whyChooseUs.length > 0) out.whyChooseUs = processRes.whyChooseUs;

      if (serviceRes.serviceDescriptions && typeof serviceRes.serviceDescriptions === 'object') {
        out.serviceDescriptions = serviceRes.serviceDescriptions;
      }

      if (!out.introParas && !out.faqs && !out.seoBody && !out.processSteps && !out.whyChooseUs && !out.aboutContent && !out.serviceDescriptions) {
        throw new Error(`Provider ${candidate.provider} returned empty structured content`);
      }

      console.log(`AI content generated successfully with parallel split prompts under ${candidate.provider}`);
      return out;
    } catch (err) {
      lastError = err;
      console.error(`Local service AI generation split failed with ${candidate.provider}. trying next...`, err);
    }
  }

  throw new Error(`AI generation failed across all configured providers. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

// Helper function to generate AI content for dynamic pages
async function generateAIContentForDynamicPages(businessData: any, userId: string, provider: 'openai' | 'gemini' | 'openrouter' | 'deepseek' = 'openai'): Promise<{ serviceContent: any[], locationContent: any[] }> {
  const aiGeneratedContent: { serviceContent: any[], locationContent: any[] } = { serviceContent: [], locationContent: [] };

  try {
    const normalizedBusinessData = normalizeBusinessDataForGeneration(businessData);

    // Check if user is AI user
    const user = await storage.getUser(userId);

    if (user?.role !== 'user' && user?.role !== 'paid' && user?.role !== 'admin') {
      console.log("User is not AI user, skipping AI content generation for dynamic pages");
      return aiGeneratedContent;
    }

    // Get API key for the selected provider
    const apiKey = await getAIProviderConfig(userId, provider);

    if (!apiKey) {
      console.log("No API key available for AI content generation");
      return aiGeneratedContent;
    }

    // Generate AI content for additional services
    const additionalServices = splitValues(
      normalizedBusinessData?.additionalServices ||
      normalizedBusinessData?.services ||
      normalizedBusinessData?.heroService
    ).slice(0, 350);

    if (additionalServices.length > 0) {
      console.log(`Generating AI content for ${additionalServices.length} service pages with concurrency...`);
      const serviceResults = await pLimit(additionalServices, 3, async (service) => {
        try {
          const content = await generateServicePageContentWithProvider(service, normalizedBusinessData, apiKey, provider);
          // Add a 500ms delay to distribute requests and be friendly to rate limits
          await new Promise((resolve) => setTimeout(resolve, 500));
          return content;
        } catch (e) {
          console.error(`AI generation failed for service: ${service}`, e);
          return null;
        }
      });
      aiGeneratedContent.serviceContent = serviceResults;
      console.log(`Generated AI content for ${aiGeneratedContent.serviceContent.length} service pages`);
    }

    // Generate AI content for additional locations
    const additionalLocations = splitValues(
      normalizedBusinessData?.additionalLocations ||
      normalizedBusinessData?.serviceAreas ||
      normalizedBusinessData?.heroLocation
    ).slice(0, 350);

    if (additionalLocations.length > 0) {
      console.log(`Generating AI content for ${additionalLocations.length} location pages with concurrency...`);
      const locationResults = await pLimit(additionalLocations, 3, async (location) => {
        try {
          const content = await generateLocationPageContentWithProvider(location, normalizedBusinessData, apiKey, provider);
          // Add a 500ms delay to distribute requests and be friendly to rate limits
          await new Promise((resolve) => setTimeout(resolve, 500));
          return content;
        } catch (e) {
          console.error(`AI generation failed for location: ${location}`, e);
          return null;
        }
      });
      aiGeneratedContent.locationContent = locationResults;
      console.log(`Generated AI content for ${aiGeneratedContent.locationContent.length} location pages`);
    }
  } catch (aiError) {
    console.error("AI content generation failed, continuing with template content:", aiError);
  }

  return aiGeneratedContent;
}

// Enhanced blog content formatting function
function formatBlogContent(content: string): string {
  if (!content) return '';

  return content
    // Headers with proper semantic structure and styling
    .replace(/^#### (.*$)/gm, '<h4 class="text-xl font-semibold mt-4 mb-2 text-gray-700">$1</h4>')
    .replace(/^### (.*$)/gm, '<h3 class="text-2xl font-bold mt-6 mb-3 text-gray-800">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-3xl font-bold mt-8 mb-4 text-gray-900 border-b-2 border-blue-500 pb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-4xl font-bold mt-8 mb-6 text-gray-900 border-b-3 border-blue-600 pb-3">$1</h1>')

    // Text formatting
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
    .replace(/__(.*?)__/g, '<u class="underline">$1</u>')

    // Code blocks and inline code
    .replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">$1</code>')

    // Lists - with proper ul/ol wrapping
    .replace(/(?:^\* .*$\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line =>
        line.replace(/^\* (.*)$/, '<li class="mb-2">$1</li>')
      ).join('');
      return `<ul class="my-4 pl-6 space-y-2">${items}</ul>`;
    })
    .replace(/(?:^- .*$\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line =>
        line.replace(/^- (.*)$/, '<li class="mb-2">$1</li>')
      ).join('');
      return `<ul class="my-4 pl-6 space-y-2">${items}</ul>`;
    })
    .replace(/(?:^\d+\. .*$\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line =>
        line.replace(/^\d+\. (.*)$/, '<li class="mb-2">$1</li>')
      ).join('');
      return `<ol class="my-4 pl-6 space-y-2 list-decimal">${items}</ol>`;
    })

    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-6 py-3 my-4 bg-blue-50 italic text-gray-700 rounded-r-lg">$1</blockquote>')

    // Links and images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="w-full max-w-2xl rounded-lg my-6 shadow-lg mx-auto block">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200">$1</a>')

    // Paragraphs and line breaks
    .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-gray-700">')
    .replace(/\n/g, '<br>');
}

// Navigation generation function for blog pages
// Helper to format phone and URLs
function getPhoneDetails(phone: string, countryCode = '+1') {
  // If phone already starts with +, use it as is for href, otherwise prepend countryCode
  const hrefPhone = phone.startsWith('+') ? phone : `${countryCode}${phone}`.replace(/[^+\d]/g, '');
  return {
    display: phone,
    href: hrefPhone
  };
}

function generateNavigation(businessData: any, currentPage?: string, isInBlogFolder = false): string {
  const additionalLocations = businessData.additionalLocations
    ?.split(',')
    .map((loc: string) => loc.trim())
    .filter((loc: string) => loc.length > 0) || [];

  const additionalServices = businessData.additionalServices
    ?.split(',')
    .map((service: string) => service.trim())
    .filter((service: string) => service.length > 0) || [];

  // Adjust paths based on whether we're in a blog subfolder
  const pathPrefix = isInBlogFolder ? '../' : '';
  const blogPath = isInBlogFolder ? 'index.html' : 'blog.html';

  const phoneDetails = getPhoneDetails(businessData.phone, businessData.countryCode);

  const brandHtml = businessData.logo
    ? `<img src="${businessData.logo}" alt="${businessData.businessName} Logo" style="height: 48px; width: auto; max-width: 200px; object-fit: contain;">
       <span class="sr-only" style="display: none;">${businessData.businessName}</span>`
    : businessData.businessName;

  // For blog pages, create a simplified navigation with only essential links
  if (currentPage === 'blog') {
    return `
    <header class="header">
        <nav class="nav">
            <div class="nav-brand">
                <a href="${pathPrefix}index.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.5rem;">
                    ${brandHtml}
                </a>
            </div>
            <!-- Mobile menu button -->
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle Menu">
                <i class="fas fa-bars"></i>
            </button> 
            <div class="nav-links" id="navLinks">
                <ul class="nav-menu">
                    <li><a href="${pathPrefix}index.html">Home</a></li>
                    <li><a href="${blogPath}" class="active">Blog</a></li>
                </ul>
                <!-- CTA Button in Navigation -->
                <div class="nav-cta">
                    <a href="tel:${phoneDetails.href}" class="cta-button cta-call">
                        <i class="fas fa-phone"></i>
                        ${phoneDetails.display}
                    </a>
                </div>
            </div>
        </nav>
    </header>`;
  }

  let nav = `
    <header class="header">
        <nav class="nav">
            <div class="nav-brand">
                <a href="${pathPrefix}index.html" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.5rem;">
                    ${brandHtml}
                </a>
            </div>
            <!-- Mobile menu button -->
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle Menu">
                <i class="fas fa-bars"></i>
            </button>
            <div class="nav-links" id="navLinks">
                <ul class="nav-menu">
                    <li><a href="${pathPrefix}index.html" class="${currentPage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="${pathPrefix}index.html#about">About</a></li>
                    <li><a href="${pathPrefix}index.html#testimonials">Reviews</a></li>
                    ${businessData.generateBlog ? `<li><a href="${blogPath}" class="${currentPage === 'blog' ? 'active' : ''}">Blog</a></li>` : ''}
                    <li><a href="${pathPrefix}index.html#contact">Contact</a></li>`;

  // Add location section if there are additional locations
  if (additionalLocations.length > 0) {
    nav += `
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">Locations <i class="fas fa-chevron-down"></i></a>
                        <ul class="dropdown-menu">`;
    additionalLocations.forEach((location: string) => {
      const filename = `location-${location.toLowerCase().replace(/\s+/g, '-')}.html`;
      nav += `
                            <li><a href="${filename}">${location}</a></li>`;
    });
    nav += `
                        </ul>
                    </li>`;
  }

  // Add services section if there are additional services
  if (additionalServices.length > 0) {
    nav += `
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">Services <i class="fas fa-chevron-down"></i></a>
                        <ul class="dropdown-menu">`;

    // Display up to 5 services in the dropdown
    const displayServices = additionalServices.slice(0, 5);
    displayServices.forEach((service: string) => {
      const filename = `service-${service.toLowerCase().replace(/\s+/g, '-')}.html`;
      nav += `
                            <li><a href="${filename}">${service}</a></li>`;
    });

    // If there are more than 5 services, add a View All link
    if (additionalServices.length > 5) {
      nav += `
                            <li style="border-top: 1px solid #eee; margin-top: 5px; padding-top: 5px;"><a href="${pathPrefix}index.html#services" style="font-weight: 600; color: var(--primary-color, #667eea);">View All Services</a></li>`;
    }

    nav += `
                        </ul>
                    </li>`;
  }

  nav += `
                </ul>
                <!-- CTA Button in Navigation -->
                <div class="nav-cta">
                    <a href="tel:${phoneDetails.href}" class="cta-button cta-call">
                        <i class="fas fa-phone"></i>
                        ${phoneDetails.display}
                    </a>
                </div>
            </div>
        </nav>
    </header>`;

  return nav;
}

// Blog generation helper functions
function generateBlogArchivePage(blogPosts: any[], businessData: any, template: string): string {
  // Generate the navigation using the same function as the main website (blog archive is not in subfolder)
  const navigationHTML = generateNavigation(businessData, 'blog', false);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - ${businessData.businessName}</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
        .hero-section { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 4rem 0 3rem; 
            text-align: center; 
        }
        .hero-section h1 { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; }
        .hero-section p { font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
        .blog-section { padding: 4rem 0; background: #f8fafc; }
        .blog-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 2rem; 
            margin: 2rem 0; 
        }
        .blog-card { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
            overflow: hidden; 
            transition: all 0.3s ease; 
            border: 1px solid #e2e8f0;
        }
        .blog-card:hover { 
            transform: translateY(-8px); 
            box-shadow: 0 8px 30px rgba(0,0,0,0.12); 
        }
        .blog-card-content { padding: 2rem; }
        .blog-title { 
            font-size: 1.5rem; 
            font-weight: 600; 
            margin-bottom: 1rem; 
            color: #1a202c;
            cursor: pointer;
            text-decoration: none;
            line-height: 1.3;
        }
        .blog-title:hover { color: #667eea; }
        .blog-excerpt { 
            color: #64748b; 
            margin-bottom: 1.5rem; 
            line-height: 1.6; 
            font-size: 0.95rem;
        }
        .blog-meta { 
            display: flex; 
            flex-direction: column;
            gap: 0.75rem;
            font-size: 0.875rem; 
        }
        .blog-keywords {
            color: #64748b;
            font-size: 0.8rem;
        }
        .blog-keywords strong { color: #374151; }
        .read-more { 
            color: #667eea; 
            text-decoration: none; 
            font-weight: 500; 
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 1px solid #667eea;
            border-radius: 6px;
            transition: all 0.2s;
            width: fit-content;
        }
        .read-more:hover { 
            background: #667eea;
            color: white;
        }
        nav {
            background: white;
            padding: 1rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-brand {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
        }
        .nav-links {
            display: flex;
            gap: 2rem;
        }
        .nav-links a {
            color: #64748b;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        .nav-links a:hover, .nav-links a.active {
            color: #667eea;
        }
        footer {
            background: #1a202c;
            color: white;
            text-align: center;
            padding: 2rem 0;
        }
        @media (max-width: 768px) {
            .hero-section h1 { font-size: 2rem; }
            .blog-grid { grid-template-columns: 1fr; }
            .nav-links { gap: 1rem; }
        }
    </style>
</head>
<body>
    ${navigationHTML}
    
    <main>
        <section class="hero-section">
            <div class="container">
                <h1><i class="fas fa-blog" style="margin-right: 1rem; opacity: 0.8;"></i>Our Blog</h1>
                <p>Expert insights, tips, and industry knowledge from ${businessData.businessName}. Stay informed with the latest trends in ${businessData.heroService}.</p>
            </div>
        </section>
        
        <section class="blog-section">
            <div class="container">
                <div class="blog-grid">
                    ${blogPosts.map(post => {
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const keywords = typeof post.keywords === 'string' ? post.keywords :
      (Array.isArray(post.keywords) ? post.keywords.slice(0, 3).join(', ') : 'SEO, Business');
    return `
                        <article class="blog-card">
                            ${post.featuredImage ? `<div class="blog-card-image" style="height: 200px; background-image: url('${post.featuredImage}'); background-size: cover; background-position: center; border-radius: 15px 15px 0 0;"></div>` : ''}
                            <div class="blog-card-content">
                                <a href="blog/${slug}.html" class="blog-title" style="text-decoration: none; display: block;">
                                    ${post.title}
                                </a>
                                <p class="blog-excerpt">${post.excerpt}</p>
                                <div class="blog-meta">
                                    <div class="blog-keywords">
                                        <strong>Keywords:</strong> ${keywords}
                                    </div>
                                    <a href="blog/${slug}.html" class="read-more">
                                        Read Full Article <i class="fas fa-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </article>
                      `;
  }).join('')}
                </div>
            </div>
        </section>
    </main>
    
    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${businessData.businessName}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;
}

function generateBlogPostPage(post: any, businessData: any, template: string): string {
  // Generate the navigation using the same function as the main website (individual posts are in blog subfolder) 
  const navigationHTML = generateNavigation(businessData, 'blog', true);
  const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const capitalizeFirst = (str: string) => {
    if (!str) return '';
    const trimmed = str.trim();
    return trimmed ? (trimmed.charAt(0).toUpperCase() + trimmed.slice(1)) : '';
  };
  const pageTitle = capitalizeFirst(post.metaTitle || post.title);
  const ogTitle = capitalizeFirst(post.title);

  // Generate comprehensive blog post schema
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featuredImage || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600`,
    "author": {
      "@type": "Organization",
      "name": businessData.businessName,
      "url": "#"
    },
    "publisher": {
      "@type": "Organization",
      "name": businessData.businessName,
      "logo": {
        "@type": "ImageObject",
        "url": businessData.logo || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400`
      }
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `#${slug}`
    },
    "keywords": Array.isArray(post.keywords) ? post.keywords.join(', ') : post.keywords,
    "articleSection": post.category || businessData.category,
    "about": {
      "@type": "Thing",
      "name": businessData.heroService
    },
    "mentions": [
      {
        "@type": "Place",
        "name": businessData.heroLocation
      },
      {
        "@type": "Service",
        "name": businessData.heroService,
        "provider": {
          "@type": "Organization",
          "name": businessData.businessName
        }
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle} - ${businessData.businessName}</title>
    <meta name="description" content="${post.metaDescription || post.excerpt}">
    <meta name="keywords" content="${Array.isArray(post.keywords) ? post.keywords.join(', ') : post.keywords}">
    
    <!-- Blog Post Schema -->
    <script type="application/ld+json">${JSON.stringify(blogSchema, null, 2)}</script>
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${post.excerpt}">
    <meta property="og:image" content="${post.featuredImage || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600`}">
    <meta property="article:author" content="${businessData.businessName}">
    <meta property="article:published_time" content="${new Date().toISOString()}">
    <meta property="article:section" content="${post.category || businessData.category}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${post.excerpt}">
    <meta name="twitter:image" content="${post.featuredImage || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600`}">
    
    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-color, #f8fafc);
            color: var(--text-color, #333333);
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 0 1rem; 
        }
        nav {
            background: white;
            padding: 1rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .nav-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav-brand {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1a202c;
        }
        .nav-links {
            display: flex;
            gap: 2rem;
        }
        .nav-links a {
            color: #64748b;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        .nav-links a:hover {
            color: #667eea;
        }
        .blog-post { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 2rem 1rem;
            background: var(--bg-color, #ffffff);
            color: var(--text-color, #333333);
        }
        .blog-header { 
            text-align: center; 
            margin-bottom: 3rem;
            background: var(--hero-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
            color: white;
            padding: 3rem 2rem;
            border-radius: 15px;
            margin: -1rem -1rem 3rem -1rem;
        }
        .blog-title { 
            font-size: 2.5rem; 
            font-weight: bold; 
            margin-bottom: 1rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .blog-meta { 
            color: rgba(255,255,255,0.9); 
            margin-bottom: 0;
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 10px;
        }
        .blog-content { 
            line-height: 1.8; 
            font-size: 1.1rem;
            color: var(--text-color, #333333);
        }
        .blog-content h2 { 
            margin: 2rem 0 1rem; 
            font-size: 1.8rem;
            color: var(--primary-color, #667eea);
            border-left: 4px solid var(--primary-color, #667eea);
            padding-left: 1rem;
        }
        .blog-content h3 { 
            margin: 1.5rem 0 0.5rem; 
            font-size: 1.4rem;
            color: var(--primary-color, #667eea);
        }
        .blog-content p { margin-bottom: 1.5rem; }
        .blog-content ul, .blog-content ol { margin-bottom: 1.5rem; padding-left: 2rem; }
        .blog-content li { margin-bottom: 0.5rem; }
        .back-to-blog { 
            display: inline-block; 
            margin-bottom: 2rem; 
            color: var(--primary-color, #667eea); 
            text-decoration: none;
            background: var(--card-bg, #f8f9fa);
            padding: 0.5rem 1rem;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        .back-to-blog:hover { 
            background: var(--primary-color, #667eea);
            color: white;
        }
        .contact-cta { 
            background: var(--hero-bg, linear-gradient(135deg, #667eea 0%, #764ba2 100%)); 
            color: white;
            padding: 2rem; 
            border-radius: 15px; 
            text-align: center; 
            margin: 3rem 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .cta-button {
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        .cta-button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        .blog-featured-image {
            border-radius: 15px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        
        /* Enhanced content formatting */
        .blog-content h1 { 
            font-size: 2.2rem;
            font-weight: bold;
            margin: 2.5rem 0 1.5rem;
            color: var(--primary-color, #667eea);
            border-bottom: 3px solid var(--primary-color, #667eea);
            padding-bottom: 0.5rem;
        }
        .blog-content h4 { 
            margin: 1.2rem 0 0.8rem; 
            font-size: 1.2rem;
            color: var(--primary-color, #667eea);
            font-weight: 600;
        }
        .blog-content blockquote {
            border-left: 4px solid var(--primary-color, #667eea);
            margin: 2rem 0;
            padding: 1.5rem;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }
        .blog-content code {
            background: #f1f5f9;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            margin: 2rem auto;
            display: block;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        .blog-content a {
            color: var(--primary-color, #667eea);
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
        }
        .blog-content a:hover {
            border-bottom-color: var(--primary-color, #667eea);
        }
        .blog-content strong {
            font-weight: 600;
            color: var(--text-color, #1a202c);
        }
        .blog-content em {
            font-style: italic;
            color: var(--text-color, #4a5568);
        }
        .blog-content ul li {
            position: relative;
            padding-left: 1.5rem;
        }
        .blog-content ul li::before {
            content: "•";
            color: var(--primary-color, #667eea);
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .blog-content ol li {
            padding-left: 0.5rem;
        }
        footer {
            background: #1a202c;
            color: white;
            text-align: center;
            padding: 2rem 0;
            margin-top: 4rem;
        }
        @media (max-width: 768px) {
            .nav-links { gap: 1rem; }
            .blog-title { font-size: 2rem; }
            .blog-header { padding: 2rem 1rem; margin: -1rem -1rem 2rem -1rem; }
        }
    </style>
</head>
<body>
    ${navigationHTML}
    
    <main class="blog-post">
        <a href="index.html" class="back-to-blog">← Back to Blog</a>
        
        <article>
            <header class="blog-header">
                <h1 class="blog-title">${post.title}</h1>
                <div class="blog-meta">
                    <p><strong>Keywords:</strong> ${Array.isArray(post.keywords) ? post.keywords.join(', ') : post.keywords || 'No keywords specified'}</p>
                </div>
            </header>
            
            <div class="blog-content">
                ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="blog-featured-image" style="width: 100%; max-width: 600px; height: auto; margin: 2rem 0; border-radius: 8px;">` : ''}
                ${formatBlogContent(post.content)}
            </div>
        </article>
        
        <div class="contact-cta">
            <h3>Need Help with ${businessData.category}?</h3>
            <p>Contact ${businessData.businessName} for professional ${businessData.heroService.toLowerCase()} services in ${businessData.heroLocation}.</p>
            <a href="tel:${businessData.phone}" class="cta-button">${businessData.phone}</a>
        </div>
    </main>
    
    <footer>
        <div class="container">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; color: white;">${businessData.businessName}</h4>
                    <p style="margin: 0; color: #94a3b8;">${businessData.heroService} in ${businessData.heroLocation}</p>
                </div>
                <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                    <a href="../index.html" style="color: #94a3b8; text-decoration: none;">Home</a>
                    <a href="index.html" style="color: #94a3b8; text-decoration: none;">Blog</a>
                    <a href="../index.html#services" style="color: #94a3b8; text-decoration: none;">Services</a>
                    <a href="../index.html#contact" style="color: #94a3b8; text-decoration: none;">Contact</a>
                </div>
                <div>
                    <a href="tel:${businessData.phone}" style="background: #667eea; color: white; padding: 0.75rem 1.5rem; border-radius: 5px; text-decoration: none; font-weight: 500;">
                        <i class="fas fa-phone"></i> ${businessData.phone}
                    </a>
                </div>
            </div>
            <hr style="border: none; border-top: 1px solid #334155; margin: 2rem 0 1rem 0;">
            <div style="text-align: center;">
                <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} ${businessData.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in setupAuth in auth.ts

  // ==================== API KEY TEST ENDPOINTS ====================
  app.post("/api/test-openai", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.ok) {
        res.json({ success: true, message: "OpenAI API key is valid!", details: "Successfully connected to OpenAI API." });
      } else {
        const data = await response.json().catch(() => null);
        res.status(400).json({ error: data?.error?.message || "Invalid API key", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  app.post("/api/test-gemini", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (response.ok) {
        res.json({ success: true, message: "Gemini API key is valid!", details: "Successfully connected to Google Gemini API." });
      } else {
        const data = await response.json().catch(() => null);
        res.status(400).json({ error: data?.error?.message || "Invalid API key", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  app.post("/api/test-openrouter", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.ok) {
        res.json({ success: true, message: "OpenRouter API key is valid!", details: "Successfully connected to OpenRouter API." });
      } else {
        res.status(400).json({ error: "Invalid API key", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  app.post("/api/test-deepseek", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch("https://api.deepseek.com/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.ok) {
        res.json({ success: true, message: "DeepSeek API key is valid!", details: "Successfully connected to DeepSeek API." });
      } else {
        res.status(400).json({ error: "Invalid API key", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  app.post("/api/test-netlify", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch("https://api.netlify.com/api/v1/sites", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (response.ok) {
        res.json({ success: true, message: "Netlify API key is valid!", details: "Successfully connected to Netlify API." });
      } else {
        res.status(400).json({ error: "Invalid Netlify token", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  app.post("/api/test-unsplash", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) return res.status(400).json({ error: "API key required" });
      const response = await fetch("https://api.unsplash.com/photos?per_page=1", {
        headers: { Authorization: `Client-ID ${apiKey}` },
      });
      if (response.ok) {
        res.json({ success: true, message: "Unsplash API key is valid!", details: "Successfully connected to Unsplash API." });
      } else {
        res.status(400).json({ error: "Invalid Unsplash access key", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Connection failed", details: error.message });
    }
  });

  // Test a stored (already saved) API key
  app.post("/api/test-stored-key/:service", isAuthenticated, async (req: any, res) => {
    try {
      const { service } = req.params;
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const setting = await storage.getApiSetting(userId, service);
      if (!setting?.apiKey) {
        return res.status(400).json({ error: "No API key stored for this service" });
      }

      // Decrypt the stored key
      let apiKey = setting.apiKey;
      try {
        const { decrypt } = await import('./crypto.js');
        apiKey = decrypt(apiKey);
      } catch {
        // If crypto module not available or key not encrypted, use as-is
      }

      // Build the test URL based on service
      let testUrl = "";
      let headers: Record<string, string> = {};

      switch (service) {
        case "openai":
          testUrl = "https://api.openai.com/v1/models";
          headers = { Authorization: `Bearer ${apiKey}` };
          break;
        case "gemini":
          testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
          break;
        case "openrouter":
          testUrl = "https://openrouter.ai/api/v1/models";
          headers = { Authorization: `Bearer ${apiKey}` };
          break;
        case "deepseek":
          testUrl = "https://api.deepseek.com/models";
          headers = { Authorization: `Bearer ${apiKey}` };
          break;
        case "netlify":
          testUrl = "https://api.netlify.com/api/v1/sites";
          headers = { Authorization: `Bearer ${apiKey}` };
          break;
        case "unsplash":
          testUrl = "https://api.unsplash.com/photos?per_page=1";
          headers = { Authorization: `Client-ID ${apiKey}` };
          break;
        default:
          return res.status(400).json({ error: "Unknown service" });
      }

      const response = await fetch(testUrl, { headers });
      if (response.ok) {
        res.json({ success: true, message: `${service.charAt(0).toUpperCase() + service.slice(1)} API key is valid!`, details: "Connection successful." });
      } else {
        res.status(400).json({ error: "API key test failed", details: `Status: ${response.status}` });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Test failed", details: error.message });
    }
  });

  app.get('/api/admin/metrics', isAdmin, async (req, res) => {
    try {
      // Use lightweight queries — no need for full JSONB blobs or password hashes
      const users = await ((storage as any).listUsersLight?.() ?? storage.listUsers());
      const websites = await ((storage as any).listWebsitesLight?.() ?? storage.listWebsites());

      const metrics = {
        totalUsers: users.length,
        activeSubscriptions: users.filter((u: any) => u.role === 'paid').length,
        sitesGenerated: websites.length,
        aiRequestsToday: 0, // Mock for now until we store logs
        monthlyRevenue: users.filter((u: any) => u.role === 'paid').length * 29, // basic estimate
        annualRunRate: users.filter((u: any) => u.role === 'paid').length * 29 * 12,
        avgRevenuePerUser: 29,
        churnRate: "0%"
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch admin metrics" });
    }
  });

  app.get('/api/admin/logs', isAdmin, async (req, res) => {
    try {
      // Use lightweight queries — only need id, userId, createdAt for logs
      const websites = await ((storage as any).listWebsitesLight?.() ?? storage.listWebsites());
      const users = await ((storage as any).listUsersLight?.() ?? storage.listUsers());
      const userMap = new Map(users.map((u: any) => [u.id, u.email]));

      const logs = websites.map((w: any, index: number) => ({
        id: `gen-${w.id.substring(0, 8)}`,
        user: userMap.get(w.userId) || 'Unknown',
        type: "Website",
        model: "Default AI",
        tokens: Math.floor(Math.random() * 5000) + 1000,
        duration: `${Math.floor(Math.random() * 20) + 5}s`,
        status: "Success",
        time: w.createdAt ? w.createdAt.toString() : new Date().toString()
      })).sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);

      res.json(logs);
    } catch (error) {
      console.error("Error fetching admin logs:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  app.get('/api/admin/prompts', isAdmin, async (req, res) => {
    try {
      let prompts = await storage.listBlogPrompts();

      // Seed default prompts if none exist
      if (prompts.length === 0) {
        const defaults = [
          { name: "Homepage Hero", displayName: "Homepage Hero Content", prompt: "Write a compelling hero section for {businessName} in {location} offering {service}.", category: "Content", isDefault: true },
          { name: "Service Description", displayName: "Service Details", prompt: "Write a detailed service description for {service} offered by {businessName}.", category: "Content", isDefault: true },
          { name: "Blog Post Generator", displayName: "SEO Blog Post", prompt: "Write an SEO-optimized blog post about {keywords} for a {category} business.", category: "Blog", isDefault: true },
          { name: "FAQ Generator", displayName: "Local Biz FAQs", prompt: "Generate 5 frequently asked questions and answers for a {category} business in {location}.", category: "Content", isDefault: true },
          { name: "Testimonial Creator", displayName: "Testimonials", prompt: "Write 3 realistic short testimonials for {businessName} praising their {service}.", category: "Content", isDefault: true },
          { name: "Dynamic Services", displayName: "Location Services", prompt: "Write unique descriptions for {service} variations offered in {location}.", category: "Content", isDefault: true },
          { name: "Location Pages", displayName: "City Specific Pages", prompt: "Write localized content targeting {location} for {businessName} providing {service}.", category: "Content", isDefault: true }
        ];

        for (const p of defaults) {
          await storage.createBlogPrompt(p);
        }
        prompts = await storage.listBlogPrompts();
      }

      res.json(prompts);
    } catch (error) {
      console.error("Error fetching admin prompts:", error);
      res.status(500).json({ message: "Failed to fetch admin prompts" });
    }
  });

  app.post('/api/admin/prompts', isAdmin, async (req, res) => {
    try {
      const { name, displayName, prompt, category } = req.body;
      if (!name || !displayName || !prompt) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const created = await storage.createBlogPrompt({ name, displayName, prompt, category: category || "Content", isDefault: false, isActive: true });
      res.json(created);
    } catch (error) {
      console.error("Error creating prompt:", error);
      res.status(500).json({ message: "Failed to create prompt" });
    }
  });

  app.put('/api/admin/prompts/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await storage.updateBlogPrompt(id, updates);
      if (!updated) return res.status(404).json({ message: "Prompt not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating prompt:", error);
      res.status(500).json({ message: "Failed to update prompt" });
    }
  });

  app.delete('/api/admin/prompts/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBlogPrompt(id);
      if (!deleted) return res.status(404).json({ message: "Prompt not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting prompt:", error);
      res.status(500).json({ message: "Failed to delete prompt" });
    }
  });

  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      res.json({
        platformName: "SiteGenie",
        platformUrl: "https://sitegenie.app",
        defaultAiProvider: "OpenAI",
        supportEmail: "support@sitegenie.app",
        smtpHost: "smtp.sendgrid.net",
        requireEmailVerification: false,
        allowSignups: true,
        maintenanceMode: false
      });
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.get('/api/users', isAdmin, async (req, res) => {
    try {
      // Use lightweight queries — just need user metadata + website counts
      const [users, allWebsites] = await Promise.all([
        (storage as any).listUsersLight?.() ?? storage.listUsers(),
        (storage as any).listWebsitesLight?.() ?? storage.listWebsites(),
      ]);
      // Count actual websites per user
      const countMap: Record<string, number> = {};
      for (const w of allWebsites as any[]) {
        if (w.userId) countMap[String(w.userId)] = (countMap[String(w.userId)] || 0) + 1;
      }
      const enriched = (users as any[]).map(u => ({
        ...u,
        websitesCreated: countMap[String(u.id)] ?? 0,
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAdmin, async (req, res) => {
    try {
      console.log('Creating user with data:', JSON.stringify(req.body, null, 2));

      // Transform expiryDate string to Date object if provided
      const requestData = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null,
      };

      const userData = insertUserSchema.parse(requestData);
      console.log('Parsed user data:', userData);

      // Enforce website limit cap of 1000 for new business users
      if (userData.websiteLimit && userData.websiteLimit > 1000) {
        return res.status(400).json({
          message: "Website limit cannot exceed 1000 for new business users"
        });
      }

      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const userToCreate = {
        ...userData,
        password: hashedPassword,
        isActive: true,
      };

      console.log('Creating user:', { email: userToCreate.email, websiteLimit: userToCreate.websiteLimit });
      const user = await storage.createUser(userToCreate);
      console.log('Created user successfully:', { id: user.id, email: user.email, websiteLimit: user.websiteLimit });

      // Test if we can retrieve the user immediately
      const retrievedUser = await storage.getUserByEmail(user.email!);
      console.log('Retrieved user:', retrievedUser ? { id: retrievedUser.id, email: retrievedUser.email } : 'null');

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ message: "User with this email already exists" });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    }
  });

  app.put('/api/users/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Transform expiryDate string to Date object if provided
      const requestData = {
        ...req.body,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : req.body.expiryDate,
      };

      const updates = updateUserSchema.parse(requestData);
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.put('/api/users/:id/role', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'paid', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be one of: user, paid, admin" });
      }

      const user = await storage.updateUser(id, { role });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Get current user's website limits
  app.get("/api/user/website-limits", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id || req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Handle hardcoded admin case
      if (userId === "admin") {
        return res.json({
          canCreate: true,
          remaining: 999999,
          limit: 999999
        });
      }

      const limitCheck = await storage.checkWebsiteLimit(userId);
      res.json(limitCheck);
    } catch (error) {
      console.error("Get website limits error:", error);
      res.status(500).json({ message: "Failed to get website limits" });
    }
  });

  // Update user website limit (admin only)
  app.patch("/api/users/:id/website-limit", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { websiteLimit } = req.body;

      if (!Number.isInteger(websiteLimit) || websiteLimit < 0) {
        return res.status(400).json({ message: "Website limit must be a non-negative integer" });
      }

      if (websiteLimit > 1000) {
        return res.status(400).json({ message: "Website limit cannot exceed 1000 for business users" });
      }

      const updatedUser = await storage.updateUser(id, { websiteLimit });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user website limit error:", error);
      res.status(500).json({ message: "Failed to update user website limit" });
    }
  });

  // ===== PERSONAL API KEY MANAGEMENT ROUTES =====

  // Get current user's personal API key status
  app.get("/api/user/personal-api-key", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id || req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Handle hardcoded admin case
      if (userId === "admin") {
        return res.json({ hasApiKey: true, isSet: true });
      }

      const apiKey = await storage.getUserPersonalApiKey(userId);
      res.json({
        hasApiKey: !!apiKey,
        isSet: !!apiKey,
        // Never return the actual API key
      });
    } catch (error) {
      console.error("Get personal API key error:", error);
      res.status(500).json({ message: "Failed to get API key status" });
    }
  });

  // Update current user's personal API key
  app.post("/api/user/personal-api-key", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id || req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Handle hardcoded admin case
      if (userId === "admin") {
        return res.json({ message: "Admin uses system OpenAI API key" });
      }

      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ message: "Valid API key is required" });
      }

      // Basic API key format validation (starts with sk-)
      if (!apiKey.startsWith('sk-')) {
        return res.status(400).json({ message: "Invalid OpenAI API key format" });
      }

      await storage.updateUserPersonalApiKey(userId, apiKey);
      res.json({ message: "Personal API key updated successfully" });
    } catch (error) {
      console.error("Update personal API key error:", error);
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  // Clear current user's personal API key
  app.delete("/api/user/personal-api-key", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id || req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Handle hardcoded admin case
      if (userId === "admin") {
        return res.status(400).json({ message: "Cannot clear admin API key" });
      }

      await storage.clearUserPersonalApiKey(userId);
      res.json({ message: "Personal API key cleared successfully" });
    } catch (error) {
      console.error("Clear personal API key error:", error);
      res.status(500).json({ message: "Failed to clear API key" });
    }
  });

  // ===== ENHANCED ADMIN USER MANAGEMENT ROUTES =====

  // Update user expiry date (admin only)
  app.patch("/api/users/:id/expiry", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { expiryDate } = req.body;

      // Validate expiry date
      let expiry = null;
      if (expiryDate) {
        expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) {
          return res.status(400).json({ message: "Invalid expiry date format" });
        }
      }

      const updatedUser = await storage.updateUser(id, { expiryDate: expiry });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user expiry error:", error);
      res.status(500).json({ message: "Failed to update user expiry date" });
    }
  });

  // Bulk update user settings (admin only)
  app.patch("/api/users/:id/settings", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role, websiteLimit, expiryDate, isActive, firstName, lastName } = req.body;

      const updates: any = {};

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      if (role && ['user', 'paid', 'admin'].includes(role)) {
        updates.role = role;
      }

      if (websiteLimit !== undefined) {
        if (!Number.isInteger(websiteLimit) || websiteLimit < 0) {
          return res.status(400).json({ message: "Website limit must be a non-negative integer" });
        }
        if (websiteLimit > 1000) {
          return res.status(400).json({ message: "Website limit cannot exceed 1000 for business users" });
        }
        updates.websiteLimit = websiteLimit;
      }

      if (expiryDate !== undefined) {
        if (expiryDate) {
          const expiry = new Date(expiryDate);
          if (isNaN(expiry.getTime())) {
            return res.status(400).json({ message: "Invalid expiry date format" });
          }
          updates.expiryDate = expiry;
        } else {
          updates.expiryDate = null;
        }
      }

      if (isActive !== undefined) {
        updates.isActive = Boolean(isActive);
      }

      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data without password
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user settings error:", error);
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // Generate website and return ZIP (with optional blog generation)
  app.post("/api/generate-website", allowGuestWebsiteGeneration, async (req, res) => {
    try {
      console.log("Generate website request body:", JSON.stringify(req.body, null, 2));

      // Auto-login guest users for demo access
      if (!req.session.isAuthenticated && !req.session.userId) {
        req.session.userId = "guest";
        req.session.isAuthenticated = true;
        console.log("Auto-authenticated guest user for website generation");
      }

      // Get user ID from session/auth
      const userId = (req as any).user?.id || req.session.userId;

      // Check if we're updating an existing website
      const websiteId = req.body.websiteId;

      // Check website creation limit (handle hardcoded admin case and guest access)
      let limitCheck;
      if (userId === "admin" || websiteId) {
        // If updating an existing site (websiteId provided) or admin, bypass creation limit
        limitCheck = {
          canCreate: true,
          remaining: 999999,
          limit: 999999
        };
      } else if (userId === "guest") {
        // Allow guest access with unlimited downloads for demo purposes
        limitCheck = {
          canCreate: true,
          remaining: 999999,
          limit: 999999
        };
      } else {
        limitCheck = await storage.checkWebsiteLimit(userId);
        if (!limitCheck.canCreate) {
          return res.status(403).json({
            message: `Website creation limit reached. You have created ${limitCheck.limit - limitCheck.remaining} websites and cannot create more. Please upgrade your plan or contact support.`,
            limit: limitCheck.limit,
            remaining: limitCheck.remaining
          });
        }
      }

      // Handle both nested and flat request formats
      let dataToValidate;
      let templateToUse;

      if (req.body.businessData) {
        // Nested format: { businessData: {...}, template: "..." }
        dataToValidate = req.body.businessData;
        templateToUse = req.body.template;
      } else {
        // Flat format: { businessName: "...", template: "..., ... }
        const { template, ...businessFields } = req.body;
        dataToValidate = businessFields;
        templateToUse = template;
      }

      // Ensure blog posts have required ID fields before validation
      if (dataToValidate.blogPosts && Array.isArray(dataToValidate.blogPosts)) {
        dataToValidate.blogPosts = dataToValidate.blogPosts.map((post: any) => ({
          ...post,
          id: post.id || `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }

      console.log("Data to validate:", JSON.stringify(dataToValidate, null, 2));

      // Validate business data
      const validatedData = businessDataSchema.parse(dataToValidate);

      // (websiteId was already extracted before the limit check)
      let website;

      if (websiteId) {
        // Update existing website
        website = await storage.updateWebsite(websiteId, {
          title: validatedData.businessName || 'Untitled Website',
          businessData: normalizeBusinessDataForGeneration(validatedData),
          template: templateToUse || 'default',
        });

        if (!website) {
          return res.status(404).json({ message: "Website not found for update" });
        }
      } else {
        // Create new website
        if (userId !== "guest") {
          website = await storage.createWebsite({
            userId: userId,
            title: validatedData.businessName || 'Untitled Website',
            businessData: normalizeBusinessDataForGeneration(validatedData),
            template: templateToUse || 'default',
          });
          // No need to increment counter — checkWebsiteLimit counts from the websites table
        }
      }

      // Check if blog posts exist (either manual or AI-generated)
      let blogPosts: any[] = [];

      // First, include any existing manual blog posts
      if (validatedData.blogPosts && validatedData.blogPosts.length > 0) {
        console.log("Found manual blog posts:", validatedData.blogPosts.length);
        blogPosts = [...validatedData.blogPosts];
      }

      console.log("Blog generation check:", {
        generateBlog: validatedData.generateBlog,
        blogPromptId: validatedData.blogPromptId,
        blogKeywords: validatedData.blogKeywords,
        blogTitles: validatedData.blogTitles,
        existingManualPosts: blogPosts.length
      });

      // Then, if AI blog generation is enabled, add AI-generated posts
      if (validatedData.generateBlog && validatedData.blogPromptId && (validatedData.blogKeywords || validatedData.blogTitles)) {
        try {
          // Get API key from database based on provider
          // For website generation, fall back to environment variable if no user-specific key
          let apiSetting;
          try {
            // Try to get user-specific API key if user is authenticated
            if ((req as any).user && (req as any).user.id !== 'guest') {
              apiSetting = await storage.getApiSetting((req as any).user.id, validatedData.blogAiProvider || 'openai');
            }
          } catch (error) {
            console.log("Could not get user-specific API setting, falling back to environment");
          }
          console.log("API setting found:", apiSetting ? { isActive: apiSetting.isActive, hasApiKey: !!apiSetting.apiKey } : 'No API setting');
          if (apiSetting && apiSetting.isActive && apiSetting.apiKey) {
            // Get the blog prompt
            const blogPrompt = await storage.getBlogPrompt(validatedData.blogPromptId);
            console.log("Blog prompt found:", blogPrompt ? { id: blogPrompt.id, hasContent: !!blogPrompt.prompt } : 'No prompt found');
            if (blogPrompt) {
              // Process blog keywords or fallback to titles (maximum 20 articles)
              let topicsArray: string[] = [];

              // Prioritize keywords over titles
              if (validatedData.blogKeywords && validatedData.blogKeywords.trim()) {
                topicsArray = validatedData.blogKeywords.split('\n').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
                console.log(`Processing ${topicsArray.length} blog keywords (max 20):`, topicsArray);
              } else if (validatedData.blogTitles && validatedData.blogTitles.trim()) {
                topicsArray = validatedData.blogTitles.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
                console.log(`Processing ${topicsArray.length} blog titles (max 20):`, topicsArray);
              } else {
                return res.status(400).json({
                  success: false,
                  error: "Blog keywords are required. Please add keywords for blog posts (one per line) to generate articles."
                });
              }

              // Enforce 20 article maximum for better quality
              if (topicsArray.length > 20) {
                return res.status(400).json({
                  success: false,
                  error: "Maximum 20 blog articles allowed. Please reduce the number of keywords."
                });
              }

              console.log("Final topics array:", topicsArray);
              if (topicsArray.length > 0) {
                // Get Unsplash API key from database
                let unsplashKey;
                try {
                  const { decrypt } = await import('./crypto.js').catch(() => ({ decrypt: (k: string) => k }));
                  let unsplashSetting;
                  if (req.user) {
                    unsplashSetting = await storage.getApiSetting((req as any).user.id, 'unsplash');
                  }
                  if (unsplashSetting && (unsplashSetting.apiKey || unsplashSetting.accessKey)) {
                    unsplashKey = decrypt(unsplashSetting.accessKey || unsplashSetting.apiKey || "");
                  }
                } catch (error) {
                  console.log("No Unsplash API key found in database, using environment variable");
                }
                // Fallback to environment variable
                if (!unsplashKey) {
                  unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
                }

                let aiGeneratedPosts: any[] = [];
                if (validatedData.blogAiProvider === 'openrouter') {
                  aiGeneratedPosts = await generateMultipleBlogPostsWithOpenRouter(
                    topicsArray,
                    blogPrompt.prompt,
                    validatedData,
                    apiSetting.apiKey,
                    validatedData.blogWordCount || 1500
                  );
                } else if (validatedData.blogAiProvider === 'deepseek') {
                  const { generateMultipleBlogPostsWithDeepSeek } = await import("./services/deepseek.js");
                  aiGeneratedPosts = await generateMultipleBlogPostsWithDeepSeek(
                    topicsArray,
                    blogPrompt.prompt,
                    validatedData,
                    apiSetting.apiKey,
                    validatedData.blogWordCount || 1500
                  );
                } else {
                  aiGeneratedPosts = await generateMultipleBlogPosts(
                    topicsArray,
                    blogPrompt.prompt,
                    validatedData,
                    apiSetting.apiKey,
                    validatedData.blogWordCount || 1500,
                    unsplashKey || undefined
                  );
                }
                console.log("Generated AI blog posts:", aiGeneratedPosts.length);

                // Combine manual and AI-generated posts
                blogPosts = [...blogPosts, ...aiGeneratedPosts];
              } else {
                console.log("No topics found for blog generation");
              }
            } else {
              console.log("No blog prompt found for ID:", validatedData.blogPromptId);
            }
          } else {
            console.log("API setting not available or inactive");
          }
        } catch (blogError) {
          console.error("Blog generation failed, continuing with website only:", blogError);
          // Continue with website generation even if blog fails
        }
      } else {
        console.log("Blog generation disabled or missing required fields");
      }

      // Generate AI content for dynamic pages using helper function
      const provider = validatedData.contentAiProvider || 'openai';
      const aiGeneratedContent = await generateAIContentForDynamicPages(validatedData, userId, provider);

      // Cache AI content in the website record so deploy doesn't need to regenerate
      if (website && website.id && (aiGeneratedContent.serviceContent.length > 0 || aiGeneratedContent.locationContent.length > 0)) {
        try {
          const updatedBD = { ...(website.businessData as any), _cachedAiContent: aiGeneratedContent };
          await storage.updateWebsite(website.id, { businessData: updatedBD });
          console.log("Cached AI content in website record for fast deploy");
        } catch (cacheErr) {
          console.log("Failed to cache AI content, deploy will regenerate:", cacheErr);
        }
      }

      // Fetch site settings for tracking codes
      const siteSettings = await storage.listSiteSettings();

      // Generate website files including dynamic pages with AI content
      let websiteFiles = generateAllWebsiteFiles(
        normalizeBusinessDataForGeneration(validatedData),
        templateToUse || 'default',
        undefined,
        blogPosts,
        aiGeneratedContent,
        siteSettings as any
      );

      // If blog posts were generated, replace the static blog page with actual posts
      if (blogPosts.length > 0) {
        console.log("Adding blog posts to website:", blogPosts.length);

        // Generate blog index page with actual posts
        const blogIndexContent = generateBlogArchivePage(blogPosts, validatedData, templateToUse || 'default');

        // Replace the static blog.html with the AI-generated blog index
        websiteFiles['blog.html'] = blogIndexContent;

        console.log("Blog integration completed");
      } else {
        console.log("No blog posts to add - using static blog page");
      }

      // If user provided visually edited files, override our generated ones
      websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, req.body.customFiles).mergedFiles;

      // Create ZIP file
      const zip = new JSZip();

      // Add all generated files (including updated blog.html if applicable)
      Object.entries(websiteFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      // If blog posts were generated, also add them to a separate blog folder
      if (blogPosts.length > 0) {
        const blogFolder = zip.folder("blog");
        blogFolder?.file("index.html", websiteFiles['blog.html']);

        // Generate individual blog post pages
        blogPosts.forEach((post: any, index: number) => {
          const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const blogPostContent = generateBlogPostPage(post, validatedData, templateToUse || 'default');
          blogFolder?.file(`${slug}.html`, blogPostContent);
        });
      }

      // Add README
      const readmeContent = `# ${validatedData.businessName} Website

This website was generated using SiteGenie.

## Files:
- index.html - Main website file
- styles.css - Stylesheet
- script.js - JavaScript functionality (if included)
${blogPosts.length > 0 ? `- blog/ - Blog section with ${blogPosts.length} AI-generated posts` : ''}

## Deployment:
You can deploy this website to any web hosting service by uploading these files.

Generated on: ${new Date().toISOString()}
${blogPosts.length > 0 ? `Blog posts generated: ${blogPosts.length}` : ''}
`;
      zip.file("README.md", readmeContent);

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Set headers for file download
      const fileName = blogPosts.length > 0
        ? `${validatedData.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-website-with-blog.zip`
        : `${validatedData.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-website.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', zipBuffer.length);

      if (website && website.id) {
        res.setHeader('X-Website-Id', website.id.toString());
        res.setHeader('Access-Control-Expose-Headers', 'X-Website-Id');
      }

      res.send(zipBuffer);

    } catch (error) {
      console.error("Website generation error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Website generation failed"
      });
    }
  });



  // Get website preview data
  app.get("/api/website/:id", async (req, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ message: "Failed to get website data" });
    }
  });

  // Enhanced AI Blog Post Generation API (public access - uses session-stored API keys)
  app.post("/api/ai/blog-post", async (req, res) => {
    try {
      const {
        businessName,
        category,
        location,
        services,
        serviceAreas,
        keyword,
        promptId,
        wordCount = 1500,
        useImages = true,
        aiProvider = 'openai'
      } = req.body;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: "Keyword is required"
        });
      }

      // Get user ID
      const userId = (req as any).user?.id || req.session.userId || "guest";

      // Get API key based on provider
      const apiKey = await getAIProviderConfig(userId, aiProvider as 'openai' | 'gemini' | 'openrouter' | 'deepseek', req);
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: `${aiProvider} API key not configured`
        });
      }

      // Get blog prompt if specified
      let prompt = `Write a comprehensive, engaging blog post that provides real value to readers. Use SEO best practices and include actionable advice.`;
      if (promptId && promptId !== "default") {
        let blogPrompt = await storage.getBlogPrompt(promptId);

        // If not found by ID, try to find by name (for backwards compatibility)
        if (!blogPrompt) {
          blogPrompt = await storage.getBlogPromptByName(promptId);
        }

        // If still not found, use default prompt
        if (!blogPrompt) {
          const allPrompts = await storage.listBlogPrompts();
          blogPrompt = allPrompts.find(p => p.isActive) || allPrompts[0];
        }

        if (blogPrompt) {
          prompt = blogPrompt.prompt;
        }
      }

      // Get Unsplash API key for images
      let unsplashKey;
      if (useImages) {
        try {
          const { decrypt } = await import('./crypto.js').catch(() => ({ decrypt: (k: string) => k }));
          const unsplashSetting = await storage.getApiSetting(userId, 'unsplash');
          if (unsplashSetting && (unsplashSetting.apiKey || unsplashSetting.accessKey)) {
            unsplashKey = decrypt(unsplashSetting.accessKey || unsplashSetting.apiKey || "");
          } else {
            unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
          }
        } catch (e) {
          console.warn("Could not get Unsplash API key, continuing without images");
        }
      }

      // Build business context
      const businessContext = {
        businessName,
        category,
        heroLocation: location,
        services,
        serviceAreas
      };

      // Generate blog post based on provider
      let blogPost;
      if (aiProvider === 'gemini') {
        // Use Gemini generation
        const { generateBlogPostWithGemini } = await import('./services/gemini');
        blogPost = await generateBlogPostWithGemini(
          keyword,
          prompt,
          businessContext,
          apiKey
        );
      } else if (aiProvider === 'openrouter') {
        // Use OpenRouter generation
        blogPost = await generateBlogPostWithOpenRouter(
          keyword,
          prompt,
          businessContext,
          apiKey
        );
      } else if (aiProvider === 'deepseek') {
        const { generateBlogPostWithDeepSeek } = await import("./services/deepseek.js");
        blogPost = await generateBlogPostWithDeepSeek(
          keyword,
          prompt,
          businessContext,
          apiKey
        );
      } else {
        // Use OpenAI generation
        blogPost = await generateBlogPost(
          keyword,
          prompt,
          businessContext,
          apiKey,
          unsplashKey
        );
      }

      res.json({
        success: true,
        blogPost,
        message: "Blog post generated successfully"
      });

    } catch (error) {
      console.error("Enhanced blog generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate blog post"
      });
    }
  });

  // Bulk generate websites from CSV data
  app.post("/api/bulk-generate", isAuthenticated, async (req, res) => {
    try {
      // Get user ID from session/auth
      const userId = (req as any).user?.id || req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { businesses, template } = req.body;

      // Validate bulk import data
      const validatedData = bulkImportSchema.parse({ businesses, template });

      // Check if user has enough remaining limit for bulk creation (handle hardcoded admin case)
      let limitCheck;
      const websitesToCreate = validatedData.businesses.length;

      if (userId === "admin") {
        limitCheck = {
          canCreate: true,
          remaining: 999999,
          limit: 999999
        };
      } else {
        limitCheck = await storage.checkWebsiteLimit(userId);

        if (!limitCheck.canCreate) {
          return res.status(403).json({
            message: `Website creation limit reached. You have created ${limitCheck.limit - limitCheck.remaining} websites and cannot create more.`,
            limit: limitCheck.limit,
            remaining: limitCheck.remaining
          });
        }

        if (limitCheck.remaining < websitesToCreate) {
          return res.status(403).json({
            message: `Cannot create ${websitesToCreate} websites. You only have ${limitCheck.remaining} websites remaining on your plan. Please upgrade or create fewer websites.`,
            requested: websitesToCreate,
            remaining: limitCheck.remaining,
            limit: limitCheck.limit
          });
        }
      }

      // Create ZIP containing all websites
      const zip = new JSZip();
      const websites: any[] = [];

      for (let i = 0; i < validatedData.businesses.length; i++) {
        const businessData = validatedData.businesses[i];

        // Store website data
        const userId = (req.user as any)?.claims?.sub || 'bulk-import';
        const website = await storage.createWebsite({
          userId: userId,
          title: businessData.businessName || 'Untitled Website',
          businessData,
          template: validatedData.template,
        });
        websites.push(website);

        // Fetch site settings for tracking codes
        const siteSettings = await storage.listSiteSettings();

        // Generate website files including dynamic pages (no AI content for bulk generation)
        const websiteFiles = generateAllWebsiteFiles(
          normalizeBusinessDataForGeneration(businessData),
          validatedData.template,
          undefined,
          undefined,
          undefined,
          siteSettings as any
        );

        // Create folder for each business
        const folderName = businessData.businessName.replace(/[^a-zA-Z0-9]/g, '-');

        // Add all generated files to business-specific folder
        Object.entries(websiteFiles).forEach(([filename, content]) => {
          zip.file(`${folderName}/${filename}`, content);
        });

        // Add business-specific README
        zip.file(`${folderName}/README.md`, `# ${businessData.businessName} Website

This website was generated using SiteGenie.

## Files:
- index.html - Main website file
- styles.css - Stylesheet
- script.js - JavaScript functionality (if included)

## Business Information:
- Business: ${businessData.businessName}
- Service: ${businessData.heroService}
- Location: ${businessData.heroLocation}
- Phone: ${businessData.phone}
- Email: ${businessData.email}

## Deployment:
You can deploy this website to any web hosting service by uploading these files.

Generated on: ${new Date().toISOString()}
`);
      }

      // Add master README with summary
      zip.file("README.md", `# Bulk Website Generation

Generated ${validatedData.businesses.length} websites using SiteGenie.

## Websites Generated:
${validatedData.businesses.map((b, i) => `${i + 1}. ${b.businessName} (${b.heroService})`).join('\n')}

## Template Used:
${validatedData.template}

## Instructions:
Each business website is in its own folder. Upload the contents of each folder to deploy the respective website.

Generated on: ${new Date().toISOString()}
Total Websites: ${validatedData.businesses.length}
`);

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="bulk-websites-${Date.now()}.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);

      // No need to increment counter — checkWebsiteLimit counts from the websites table directly

      res.send(zipBuffer);

    } catch (error) {
      console.error("Bulk generation error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Bulk generation failed"
      });
    }
  });

  // Deploy a specific website to Netlify (Note: Protected /api/websites endpoints are defined later in the file)
  app.post("/api/websites/:id/deploy", isAuthenticated, async (req: any, res) => {
    try {
      let { netlifyApiKey, siteName, customDomain } = req.body;
      const userId = req.user.id;

      // Resolve actual token — the client may send a masked placeholder
      if (!netlifyApiKey || netlifyApiKey.includes('•')) {
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (setting?.apiKey) {
          try {
            netlifyApiKey = decrypt(setting.apiKey);
          } catch {
            netlifyApiKey = setting.apiKey;
          }
        }
      }

      if (!netlifyApiKey || netlifyApiKey.includes('•')) {
        return res.status(400).json({ message: "Netlify API key is required. Please configure it in API Settings." });
      }

      const website = await storage.getWebsite(req.params.id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Store the encrypted key on the website record
      let encryptedKeyForStorage = netlifyApiKey;
      try {
        encryptedKeyForStorage = encrypt(netlifyApiKey);
      } catch {
        // fallback
      }

      // Update website status to deploying
      await storage.updateWebsite(req.params.id, {
        netlifyDeploymentStatus: "deploying",
        netlifyApiKey: encryptedKeyForStorage
      });

      // Deploy website
      // deployToNetlify is imported statically at the top

      // Determine SEO URL - use custom domain if provided, otherwise use Netlify domain
      let seoUrl;
      const cleanSiteName = (siteName || website.title).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (customDomain && customDomain.trim()) {
        seoUrl = customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim()}`;
      } else {
        seoUrl = `https://${cleanSiteName}.netlify.app`;
      }

      console.log("Using SEO URL for sitemap and robots.txt:", seoUrl);

      // Use cached AI content if available, otherwise try generating with timeout
      const cachedAi = (website.businessData as any)?._cachedAiContent;
      let aiGeneratedContent: { serviceContent: any[], locationContent: any[] } = { serviceContent: [], locationContent: [] };
      if (cachedAi && (cachedAi.serviceContent?.length > 0 || cachedAi.locationContent?.length > 0)) {
        console.log("Using cached AI content for deploy (fast path)");
        aiGeneratedContent = cachedAi;
      } else {
        try {
          const provider = (website.businessData as any).contentAiProvider || 'openai';
          const aiPromise = generateAIContentForDynamicPages(website.businessData as any, website.userId, provider);
          const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI content timeout')), 8000));
          aiGeneratedContent = await Promise.race([aiPromise, timeoutPromise]);
          // Cache for future deploys
          try {
            await storage.updateWebsite(req.params.id, { businessData: { ...(website.businessData as any), _cachedAiContent: aiGeneratedContent } });
          } catch { }
        } catch (aiErr) {
          console.log("AI content skipped during deploy (timeout or error), using template fallback:", (aiErr as Error).message);
        }
      }

      // Ensure blog posts are included in businessData
      const businessDataWithBlogs = normalizeBusinessDataForGeneration({
        ...(website.businessData as any),
        blogPosts: (website.businessData as any).blogPosts || []
      });
      let websiteFiles = generateAllWebsiteFiles(businessDataWithBlogs, website.template || website.selectedTemplate || 'professional', seoUrl, undefined, aiGeneratedContent);
      websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, website.customFiles).mergedFiles;

      const result = await deployToNetlify(websiteFiles, netlifyApiKey, siteName || website.title);

      // Update website with deployment info
      await storage.updateWebsite(req.params.id, {
        netlifyUrl: result.ssl_url || result.url,
        netlifySiteId: result.name,
        netlifyDeploymentStatus: "deployed",
        lastDeployedAt: new Date()
      });

      res.json({
        message: "Website deployed successfully",
        url: result.ssl_url || result.url,
        deployId: result.deploy_id
      });

    } catch (error) {
      // Update status to failed
      await storage.updateWebsite(req.params.id, {
        netlifyDeploymentStatus: "failed"
      });

      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to deploy website"
      });
    }
  });

  // Change website URL by creating new site
  app.post("/api/websites/:id/change-url", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { siteName } = req.body;
      const userId = req.user.id;

      // Check if website belongs to user
      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      if (!website.netlifyApiKey) {
        return res.status(400).json({ message: "No Netlify API key found for this website" });
      }

      // Decrypt the stored Netlify API key
      let decryptedNetlifyKey = website.netlifyApiKey;
      try {
        decryptedNetlifyKey = decrypt(website.netlifyApiKey);
      } catch {
        // fallback: use as-is
      }
      if (!decryptedNetlifyKey || decryptedNetlifyKey.includes('•')) {
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (setting?.apiKey) {
          try { decryptedNetlifyKey = decrypt(setting.apiKey); } catch { decryptedNetlifyKey = setting.apiKey; }
        }
      }

      if (!siteName || !siteName.trim()) {
        return res.status(400).json({ message: "Site name is required" });
      }

      // Clean the site name
      const cleanSiteName = siteName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 63); // Netlify site name limit

      // Update deployment status to deploying
      await storage.updateWebsite(id, {
        netlifyDeploymentStatus: "deploying"
      });

      try {
        if (!website.netlifySiteId) {
          return res.status(400).json({ message: "Website has no Netlify site ID" });
        }

        // Get the latest website data from database before deployment
        const latestWebsite = await storage.getWebsite(id);
        if (!latestWebsite) {
          throw new Error("Website not found during URL change");
        }

        let siteId = website.netlifySiteId;
        let newUrl = `https://${cleanSiteName}.netlify.app`;

        try {
          // Check if the site exists before trying to update it
          await netlifyService.getSite(decryptedNetlifyKey, website.netlifySiteId);

          // Site exists, try to update its name
          console.log(`Updating existing site ${website.netlifySiteId} to name: ${cleanSiteName}`);
          await netlifyService.updateSite(decryptedNetlifyKey, website.netlifySiteId, {
            name: cleanSiteName
          });

          // Deploy updated content — use cached AI content for fast deploy
          const cachedAi1 = (latestWebsite.businessData as any)?._cachedAiContent;
          let aiGeneratedContent: { serviceContent: any[], locationContent: any[] } = { serviceContent: [], locationContent: [] };
          if (cachedAi1 && (cachedAi1.serviceContent?.length > 0 || cachedAi1.locationContent?.length > 0)) {
            console.log("Using cached AI content for URL change deploy");
            aiGeneratedContent = cachedAi1;
          } else {
            try {
              const provider = (latestWebsite.businessData as any).contentAiProvider || 'openai';
              const aiPromise = generateAIContentForDynamicPages(latestWebsite.businessData as any, latestWebsite.userId, provider);
              const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI content timeout')), 8000));
              aiGeneratedContent = await Promise.race([aiPromise, timeoutPromise]);
            } catch (aiErr) {
              console.log("AI content skipped during URL change (timeout or error):", (aiErr as Error).message);
            }
          }
          // Ensure blog posts are included in businessData
          const businessDataWithBlogs = normalizeBusinessDataForGeneration({
            ...(latestWebsite.businessData as any),
            blogPosts: (latestWebsite.businessData as any).blogPosts || []
          });
          let websiteFiles = generateAllWebsiteFiles(businessDataWithBlogs, latestWebsite.selectedTemplate || latestWebsite.template, undefined, undefined, aiGeneratedContent);
          websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, latestWebsite.customFiles).mergedFiles;
          await netlifyService.deploySite(decryptedNetlifyKey, website.netlifySiteId, websiteFiles);

          // Update the URL to reflect the new name
          newUrl = `https://${cleanSiteName}.netlify.app`;

        } catch (error) {
          console.log(`Site ${website.netlifySiteId} not found or update failed, creating new site with name: ${cleanSiteName}`);

          // If site doesn't exist or update fails, create a new site with the desired name
          // deployToNetlify is imported statically at the top
          // Generate temporary site URL for initial file generation
          const tempSiteUrl = `https://${cleanSiteName}.netlify.app`;
          const cachedAi2 = (latestWebsite.businessData as any)?._cachedAiContent;
          let aiGeneratedContent2: { serviceContent: any[], locationContent: any[] } = { serviceContent: [], locationContent: [] };
          if (cachedAi2 && (cachedAi2.serviceContent?.length > 0 || cachedAi2.locationContent?.length > 0)) {
            console.log("Using cached AI content for new site creation");
            aiGeneratedContent2 = cachedAi2;
          } else {
            try {
              const provider = (latestWebsite.businessData as any).contentAiProvider || 'openai';
              const aiPromise = generateAIContentForDynamicPages(latestWebsite.businessData as any, latestWebsite.userId, provider);
              const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI content timeout')), 8000));
              aiGeneratedContent2 = await Promise.race([aiPromise, timeoutPromise]);
            } catch (aiErr) {
              console.log("AI content skipped during new site creation (timeout or error):", (aiErr as Error).message);
            }
          }
          // Ensure blog posts are included in businessData
          const businessDataWithBlogs = normalizeBusinessDataForGeneration({
            ...(latestWebsite.businessData as any),
            blogPosts: (latestWebsite.businessData as any).blogPosts || []
          });
          let websiteFiles = generateAllWebsiteFiles(businessDataWithBlogs, latestWebsite.selectedTemplate || latestWebsite.template, tempSiteUrl, undefined, aiGeneratedContent2);
          websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, latestWebsite.customFiles).mergedFiles;

          const result = await deployToNetlify(websiteFiles, decryptedNetlifyKey, cleanSiteName);
          siteId = result.name;
          newUrl = result.ssl_url || result.url;
        }

        // Update website with new URL and site ID
        const updatedWebsite = await storage.updateWebsite(id, {
          netlifyUrl: newUrl,
          netlifySiteId: siteId,
          netlifyDeploymentStatus: "deployed",
          lastDeployedAt: new Date()
        });

        res.json({
          message: "Website URL changed successfully",
          website: updatedWebsite,
          url: newUrl,
          oldUrl: website.netlifyUrl
        });

      } catch (deployError) {
        // Update deployment status to failed
        await storage.updateWebsite(id, {
          netlifyDeploymentStatus: "failed"
        });
        throw deployError;
      }

    } catch (error) {
      console.error("Error changing website URL:", error);
      res.status(500).json({
        message: "Failed to change website URL",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });


  // Blog post routes
  // List all published blog posts
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const posts = await storage.listBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog posts" });
    }
  });

  // Get a blog post by slug
  app.get("/api/blog-posts/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog post" });
    }
  });

  // Blog Management API Routes

  // Get all blog posts with pagination and filtering for admin
  app.get("/api/admin/blog-posts", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await storage.listBlogPostsWithPagination(page, limit, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog posts" });
    }
  });

  // Create a new blog post
  app.post("/api/admin/blog-posts", async (req, res) => {
    try {
      // insertBlogPostSchema is imported statically.
      const validatedData = insertBlogPostSchema.parse(req.body);

      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create blog post"
      });
    }
  });

  // Get a specific blog post by ID for editing
  app.get("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog post" });
    }
  });

  // Update a blog post
  app.put("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      // updateBlogPostSchema is imported statically.
      const validatedData = updateBlogPostSchema.parse(req.body);

      const post = await storage.updateBlogPost(req.params.id, validatedData);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update blog post"
      });
    }
  });

  // Delete a blog post  
  app.delete("/api/admin/blog-posts/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Bulk delete blog posts
  app.post("/api/admin/blog-posts/bulk-delete", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Valid IDs array is required" });
      }

      const success = await storage.bulkDeleteBlogPosts(ids);
      if (!success) {
        return res.status(400).json({ message: "No posts were deleted" });
      }
      res.json({ message: "Posts deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete posts" });
    }
  });

  // Update blog post status
  app.patch("/api/admin/blog-posts/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['draft', 'published', 'scheduled'].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }

      const post = await storage.updateBlogPostStatus(req.params.id, status);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to update post status" });
    }
  });

  // Blog Categories Routes
  app.get("/api/admin/blog-categories", async (req, res) => {
    try {
      const categories = await storage.listBlogCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.post("/api/admin/blog-categories", async (req, res) => {
    try {
      // insertBlogCategorySchema is imported statically.
      const validatedData = insertBlogCategorySchema.parse(req.body);

      const category = await storage.createBlogCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create category"
      });
    }
  });

  app.put("/api/admin/blog-categories/:id", async (req, res) => {
    try {
      // insertBlogCategorySchema is imported statically.
      const validatedData = insertBlogCategorySchema.partial().parse(req.body);

      const category = await storage.updateBlogCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update category"
      });
    }
  });

  app.delete("/api/admin/blog-categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Blog Tags Routes
  app.get("/api/admin/blog-tags", async (req, res) => {
    try {
      const tags = await storage.listBlogTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tags" });
    }
  });

  app.post("/api/admin/blog-tags", async (req, res) => {
    try {
      // insertBlogTagSchema is imported statically.
      const validatedData = insertBlogTagSchema.parse(req.body);

      const tag = await storage.createBlogTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create tag"
      });
    }
  });

  app.delete("/api/admin/blog-tags/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogTag(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Blog Media Routes
  app.get("/api/admin/blog-media", async (req, res) => {
    try {
      const media = await storage.listBlogMedia();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Failed to get media" });
    }
  });

  app.post("/api/admin/blog-media", async (req, res) => {
    try {
      // insertBlogMediaSchema is imported statically.
      const validatedData = insertBlogMediaSchema.parse(req.body);

      const media = await storage.createBlogMedia(validatedData);
      res.status(201).json(media);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create media"
      });
    }
  });

  app.delete("/api/admin/blog-media/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogMedia(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json({ message: "Media deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete media" });
    }
  });

  // Preview blog posts before generation
  app.post("/api/preview-blog-posts", isAIUser, async (req, res) => {
    try {
      const { businessData, blogAiProvider, blogPromptId, blogKeywords, blogTitles, blogWordCount } = req.body;

      // Validate required fields
      if (!businessData || !blogPromptId || (!blogKeywords && !blogTitles)) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: businessData, blogPromptId, and either blogKeywords or blogTitles are required"
        });
      }

      // Get the blog prompt to use for generation
      let blogPrompt = await storage.getBlogPrompt(blogPromptId);

      // If not found by ID, try to find by name (for backwards compatibility)
      if (!blogPrompt) {
        blogPrompt = await storage.getBlogPromptByName(blogPromptId);
      }

      // If still not found, use default prompt
      if (!blogPrompt) {
        // Get the first available active prompt as fallback
        const allPrompts = await storage.listBlogPrompts();
        blogPrompt = allPrompts.find(p => p.isActive) || allPrompts[0];
      }

      if (!blogPrompt) {
        return res.status(404).json({
          success: false,
          message: "No blog prompts available. Please add blog prompts in the admin panel."
        });
      }

      // Get API key from database based on provider - use fallback for non-authenticated users
      let apiSetting;
      if ((req as any).user && (req as any).user.id !== 'guest') {
        apiSetting = await storage.getApiSetting((req as any).user.id, blogAiProvider || 'openai');
      }
      if (!apiSetting || !apiSetting.isActive || !apiSetting.apiKey) {
        return res.status(400).json({
          success: false,
          message: `${blogAiProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key not configured. Please set up your API key in the dashboard.`
        });
      }

      // Generate blog posts using the selected AI provider
      // Process blog titles only (maximum 30 articles)
      let topicsArray: string[] = [];
      if (blogTitles && blogTitles.trim()) {
        topicsArray = blogTitles.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);

        // Enforce 30 article maximum
        if (topicsArray.length > 30) {
          return res.status(400).json({
            success: false,
            message: "Maximum 30 blog articles allowed. Please reduce the number of titles."
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Blog titles are required. Please add blog post titles (one per line) to generate articles."
        });
      }

      let blogPosts = [];
      try {
        if (blogAiProvider === 'openrouter') {
          blogPosts = await generateMultipleBlogPostsWithOpenRouter(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            blogWordCount || 1500
          );
        } else if (blogAiProvider === 'deepseek') {
          const { generateMultipleBlogPostsWithDeepSeek } = await import("./services/deepseek.js");
          blogPosts = await generateMultipleBlogPostsWithDeepSeek(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            blogWordCount || 1500
          );
        } else {
          blogPosts = await generateMultipleBlogPosts(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            blogWordCount || 1500
          );
        }

        res.json({
          success: true,
          blogPosts: blogPosts,
          message: `Successfully generated ${blogPosts.length} blog posts`
        });
      } catch (error) {
        console.error("Blog preview generation error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Failed to generate blog posts"
        });
      }
    } catch (error) {
      console.error("Blog preview error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to preview blog posts"
      });
    }
  });

  // Generate blog posts for the blog section in the form
  app.post("/api/generate-blog-posts", async (req, res) => {
    try {
      const { businessData, provider } = req.body;

      // Validate required fields
      if (!businessData || !businessData.blogPromptId || !businessData.blogTitles) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: blogPromptId and blogTitles are required"
        });
      }

      // Get the blog prompt to use for generation
      const blogPrompt = await storage.getBlogPrompt(businessData.blogPromptId);
      if (!blogPrompt) {
        return res.status(404).json({
          success: false,
          message: "Blog prompt not found"
        });
      }

      // Get API key from database based on provider
      const userId = (req as any).user?.id || req.session.userId;
      const apiSetting = await storage.getApiSetting(userId, provider || 'openai');
      if (!apiSetting || !apiSetting.isActive || !apiSetting.apiKey) {
        return res.status(400).json({
          success: false,
          message: `${provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API key not configured. Please set up your API key in the dashboard.`
        });
      }

      // Process blog titles (maximum 30 articles)
      const topicsArray = businessData.blogTitles.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);

      // Enforce 30 article maximum
      if (topicsArray.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Maximum 30 blog articles allowed. Please reduce the number of titles."
        });
      }

      // Generate blog posts using the selected AI provider
      let blogPosts = [];
      try {
        if (provider === 'openrouter') {
          blogPosts = await generateMultipleBlogPostsWithOpenRouter(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            businessData.blogWordCount || 1500
          );
        } else if (provider === 'deepseek') {
          const { generateMultipleBlogPostsWithDeepSeek } = await import("./services/deepseek.js");
          blogPosts = await generateMultipleBlogPostsWithDeepSeek(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            businessData.blogWordCount || 1500
          );
        } else {
          // Use OpenAI generation
          blogPosts = await generateMultipleBlogPosts(
            topicsArray,
            blogPrompt.prompt,
            businessData,
            apiSetting.apiKey,
            businessData.blogWordCount || 1500
          );
        }

        if (blogPosts.length === 0) {
          res.status(400).json({
            success: false,
            message: "No blog posts were successfully generated. This may be due to API credit issues or configuration problems. Please check your API key and account balance."
          });
        } else {
          res.json({
            success: true,
            blogPosts
          });
        }
      } catch (error) {
        console.error("Blog generation error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Failed to generate blog posts"
        });
      }
    } catch (error) {
      console.error("Blog generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate blog posts"
      });
    }
  });

  // Generate website with pre-approved blog posts
  app.post("/api/generate-website-with-blog", async (req, res) => {
    try {
      const { businessData, blogPosts, blogSettings } = req.body;

      if (!businessData || !blogPosts || blogPosts.length === 0) {
        return res.status(400).json({
          message: "Missing business data or blog posts"
        });
      }

      // Generate AI content for dynamic pages using helper function
      const userId = (req as any).user?.id || req.session.userId;
      const provider = businessData.contentAiProvider || 'openai';
      const aiGeneratedContent = await generateAIContentForDynamicPages(businessData, userId, provider);

      // Generate all website files with blog integration and AI content
      let websiteFiles = generateAllWebsiteFiles(
        normalizeBusinessDataForGeneration(businessData),
        'template1',
        undefined,
        blogPosts,
        aiGeneratedContent
      );

      // If user provided visually edited files, override our generated ones
      websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, req.body.customFiles).mergedFiles;

      // Create ZIP file
      const zip = new JSZip();

      // Add website files
      Object.entries(websiteFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      // Add blog files
      const blogFolder = zip.folder("blog");

      // Generate blog index page
      const blogIndexContent = generateBlogArchivePage(blogPosts, businessData, 'template1');
      blogFolder?.file("index.html", blogIndexContent);

      // Generate individual blog post pages
      blogPosts.forEach((post: any, index: number) => {
        const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const blogPostContent = generateBlogPostPage(post, businessData, 'template1');
        blogFolder?.file(`${slug}.html`, blogPostContent);
      });

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${businessData.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-website-with-blog.zip"`);
      res.setHeader('Content-Length', zipBuffer.length);

      res.send(zipBuffer);

    } catch (error) {
      console.error("Website with blog generation error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate website with blog"
      });
    }
  });

  // Deploy website directly to Netlify
  app.post("/api/deploy-website", allowGuestWebsiteGeneration, async (req, res) => {
    try {
      console.log("Deploy website request body:", JSON.stringify(req.body, null, 2));

      // Auto-login guest users for demo access
      if (!req.session.isAuthenticated && !req.session.userId) {
        req.session.userId = "guest";
        req.session.isAuthenticated = true;
        console.log("Auto-authenticated guest user for website deployment");
      }

      // Get user ID from session/auth
      const userId = (req as any).user?.id || req.session.userId;

      // Handle both nested and flat request formats to determine websiteId
      let dataToValidate;
      let templateToUse;
      let netlifyToken;
      let siteName;
      let customDomain;
      let websiteId;
      let existingWebsite: any = null;

      if (req.body.businessData) {
        // Nested format: { businessData: {...}, template: "...", netlifyToken: "...", siteName: "...", customDomain: "..." }
        dataToValidate = req.body.businessData;
        templateToUse = req.body.template;
        netlifyToken = req.body.netlifyToken;
        siteName = req.body.siteName;
        customDomain = req.body.customDomain;
        websiteId = req.body.websiteId;
      } else {
        // Flat format: { businessName: "...", template: "...", netlifyToken: "...", siteName: "...", customDomain: "...", ... }
        const { template, netlifyToken: token, siteName: name, customDomain: domain, websiteId: existingId, ...businessFields } = req.body;
        dataToValidate = businessFields;
        templateToUse = template;
        netlifyToken = token;
        siteName = name;
        customDomain = domain;
        websiteId = existingId;
      }

      // Validate website ownership when updating an existing project
      if (websiteId && userId !== "guest") {
        existingWebsite = await storage.getWebsite(websiteId);
        if (!existingWebsite || existingWebsite.userId !== userId) {
          return res.status(404).json({
            message: "Website not found"
          });
        }
      }

      // Check website creation limit (same as generate-website)
      let limitCheck;
      const isAdmin = userId === "admin" || (req as any).user?.role === "admin";

      if (isAdmin || websiteId) {
        limitCheck = {
          canCreate: true,
          remaining: 999999,
          limit: 999999
        };
      } else if (userId === "guest") {
        limitCheck = {
          canCreate: true,
          remaining: 999999,
          limit: 999999
        };
      } else {
        limitCheck = await storage.checkWebsiteLimit(userId);
        if (!limitCheck.canCreate) {
          return res.status(403).json({
            message: `Website creation limit reached. You have created ${limitCheck.limit - limitCheck.remaining} websites and cannot create more. Please upgrade your plan or contact support.`,
            limit: limitCheck.limit,
            remaining: limitCheck.remaining
          });
        }
      }

      // Resolve the actual Netlify token — the client may send a masked placeholder
      let resolvedNetlifyToken = netlifyToken;
      if (!resolvedNetlifyToken || resolvedNetlifyToken.includes('•')) {
        // Token is masked or missing — fetch the real encrypted token from user's API settings
        const userId = (req as any).user?.id || req.session.userId;
        if (userId && userId !== 'guest') {
          const setting = await storage.getApiSetting(userId, 'netlify');
          if (setting?.apiKey) {
            try {
              resolvedNetlifyToken = decrypt(setting.apiKey);
            } catch {
              resolvedNetlifyToken = setting.apiKey; // fallback if not encrypted
            }
          }
        }
        // Also check guest session
        if ((!resolvedNetlifyToken || resolvedNetlifyToken.includes('•')) && req.session?.guestApiKeys?.netlify) {
          resolvedNetlifyToken = req.session.guestApiKeys.netlify;
        }
      }

      if (!resolvedNetlifyToken || resolvedNetlifyToken.includes('•')) {
        return res.status(400).json({
          message: "Netlify access token is required for deployment. Please configure it in API Settings."
        });
      }

      // Use resolvedNetlifyToken from now on
      netlifyToken = resolvedNetlifyToken;

      // For existing projects, default to previously deployed Netlify site
      if ((!siteName || !siteName.trim()) && existingWebsite?.netlifySiteId) {
        siteName = existingWebsite.netlifySiteId;
      }

      if (!siteName) {
        return res.status(400).json({
          message: "Site name is required for deployment"
        });
      }

      // Ensure blog posts have required ID fields before validation
      if (dataToValidate.blogPosts && Array.isArray(dataToValidate.blogPosts)) {
        dataToValidate.blogPosts = dataToValidate.blogPosts.map((post: any) => ({
          ...post,
          id: post.id || `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }

      console.log("Data to validate:", JSON.stringify(dataToValidate, null, 2));

      // Validate business data
      // businessDataSchema is imported statically at the top
      const validatedData = businessDataSchema.parse(dataToValidate);

      console.log("Validated data:", JSON.stringify(validatedData, null, 2));

      // Determine domain for SEO purposes - use custom domain if provided, otherwise use Netlify domain
      let seoUrl;
      if (customDomain && customDomain.trim()) {
        // Clean custom domain and add https if not present
        seoUrl = customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim()}`;
      } else {
        // Use Netlify subdomain
        seoUrl = `https://${siteName}.netlify.app`;
      }

      console.log("Using SEO URL for sitemap and robots.txt:", seoUrl);

      // Generate website files
      // generateAllWebsiteFiles is imported statically at the top
      let files = generateAllWebsiteFiles(
        normalizeBusinessDataForGeneration(validatedData),
        templateToUse || 'template1',
        seoUrl,
        validatedData.blogPosts || []
      );

      const incomingCustomFiles = normalizeCustomFiles(req.body.customFiles);
      const storedCustomFiles = normalizeCustomFiles(existingWebsite?.customFiles);
      const hasIncomingCustomFiles = Object.keys(incomingCustomFiles).length > 0;
      const customFilesInput = hasIncomingCustomFiles ? incomingCustomFiles : storedCustomFiles;
      const { mergedFiles, sanitizedCustomFiles: mergedCustomFiles } =
        mergeWebsiteFilesWithCustomFiles(files, customFilesInput);
      files = mergedFiles;

      console.log("Generated files:", Object.keys(files));

      // Deploy to Netlify
      // deployToNetlify is imported statically at the top
      const deploymentResult = await deployToNetlify(files, netlifyToken, siteName);

      // Save website data to database if not guest
      let persistedWebsiteId: string | null = websiteId || null;
      if (userId !== "guest") {
        const websiteData: any = {
          businessData: normalizeBusinessDataForGeneration(validatedData),
          template: templateToUse || 'template1',
          selectedTemplate: templateToUse || 'template1',
          blogOptions: null,
          generatedBlogPosts: validatedData.blogPosts || null,
          netlifyApiKey: netlifyToken,
          netlifyUrl: deploymentResult.ssl_url || deploymentResult.url,
          netlifySiteId: deploymentResult.name,
          netlifyDeploymentStatus: "deployed",
          lastDeployedAt: new Date()
        };
        if (hasIncomingCustomFiles) {
          websiteData.customFiles = Object.keys(mergedCustomFiles).length > 0 ? mergedCustomFiles : null;
        } else if (Object.keys(mergedCustomFiles).length > 0) {
          websiteData.customFiles = mergedCustomFiles;
        }

        if (websiteId) {
          await storage.updateWebsite(websiteId, websiteData);
          persistedWebsiteId = websiteId;
        } else {
          const websiteDataWithRequiredFields = {
            ...websiteData,
            userId: userId,
            title: validatedData.businessName || 'Untitled Website'
          };
          const createdWebsite = await storage.createWebsite(websiteDataWithRequiredFields);
          persistedWebsiteId = createdWebsite?.id || null;
          // No need to increment counter — checkWebsiteLimit counts from the websites table
        }
      }

      res.json({
        success: true,
        message: "Website deployed successfully!",
        siteUrl: deploymentResult.ssl_url || deploymentResult.url,
        siteName: deploymentResult.name,
        deployId: deploymentResult.deploy_id,
        adminUrl: deploymentResult.admin_url,
        websiteId: persistedWebsiteId
      });

    } catch (error) {
      console.error("Deploy website error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to deploy website"
      });
    }
  });

  // Validate Netlify token
  app.post("/api/validate-netlify-token", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          valid: false,
          message: "Token is required"
        });
      }

      // validateNetlifyToken is imported statically at the top
      const isValid = await validateNetlifyToken(token);

      res.json({
        valid: isValid,
        message: isValid ? "Token is valid" : "Invalid token"
      });

    } catch (error) {
      res.status(500).json({
        valid: false,
        message: "Failed to validate token"
      });
    }
  });

  // Guest API key storage (session-based, no authentication required)
  // SECURITY: Each user gets a unique session ID stored in a PostgreSQL-backed session store.
  // API keys are stored in req.session.guestApiKeys, which is completely isolated per browser/user.
  // Different users CANNOT access each other's API keys - each session is separate and secure.
  app.post("/api/guest/save-api-key", async (req, res) => {
    try {
      const { provider, apiKey } = req.body;

      if (!provider || !apiKey) {
        return res.status(400).json({
          message: "Provider and API key are required"
        });
      }

      if (!['openai', 'gemini', 'openrouter', 'deepseek', 'netlify', 'unsplash'].includes(provider)) {
        return res.status(400).json({
          message: "Invalid provider. Must be openai, gemini, openrouter, netlify, or unsplash"
        });
      }

      // Initialize guestApiKeys object if it doesn't exist in this user's session
      if (!req.session.guestApiKeys) {
        req.session.guestApiKeys = {};
      }

      // Store API key in this user's session only (isolated from other users)
      req.session.guestApiKeys[provider as 'openai' | 'gemini' | 'openrouter' | 'deepseek' | 'netlify' | 'unsplash'] = apiKey;
      setGuestApiKeysCookie(res, req.session.guestApiKeys);

      // Mark this session as a guest user (without authenticated privileges)
      if (!req.session.userId) {
        req.session.userId = "guest";
      }

      res.json({
        success: true,
        message: "API key saved to session successfully"
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to save API key"
      });
    }
  });

  // Specific API endpoints for OpenAI and Unsplash (MUST come before generic routes)
  // Modified to support both authenticated users (database) and guest users (session)
  app.get("/api/settings/openai", async (req, res) => {
    try {
      // Check if user is authenticated
      if ((req as any).user?.id) {
        const userId = (req as any).user.id;
        const setting = await storage.getApiSetting(userId, 'openai');
        if (!setting) {
          return res.json({ name: "openai", displayName: "OpenAI API", apiKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.openai) {
        return res.json({
          name: "openai",
          displayName: "OpenAI API",
          apiKey: req.session.guestApiKeys.openai,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "openai", displayName: "OpenAI API", apiKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get OpenAI setting" });
    }
  });

  app.put("/api/settings/openai", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined;
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'openai',
        displayName: 'OpenAI API',
        apiKey,
        isActive: isActive ?? true
      });

      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update OpenAI setting:", error);
      res.status(500).json({ message: "Failed to update OpenAI setting" });
    }
  });

  app.get("/api/settings/gemini", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (req.session?.isAuthenticated && req.session?.userId && req.session.userId !== 'guest') {
        const userId = req.session.userId;
        const setting = await storage.getApiSetting(userId, 'gemini');
        if (!setting) {
          return res.json({ name: "gemini", displayName: "Gemini API", apiKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.gemini) {
        return res.json({
          name: "gemini",
          displayName: "Gemini API",
          apiKey: req.session.guestApiKeys.gemini,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "gemini", displayName: "Gemini API", apiKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Gemini setting" });
    }
  });

  app.put("/api/settings/gemini", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined;
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'gemini',
        displayName: 'Gemini API',
        apiKey,
        isActive: isActive ?? true
      });

      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update Gemini setting:", error);
      res.status(500).json({ message: "Failed to update Gemini setting" });
    }
  });

  app.get("/api/settings/unsplash", async (req, res) => {
    try {
      // Check if user is authenticated
      if ((req as any).user?.id) {
        const userId = (req as any).user.id;
        const setting = await storage.getApiSetting(userId, 'unsplash');
        if (!setting) {
          return res.json({ name: "unsplash", displayName: "Unsplash API", apiKey: "", accessKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null, accessKey: setting.accessKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.unsplash) {
        return res.json({
          name: "unsplash",
          displayName: "Unsplash API",
          apiKey: req.session.guestApiKeys.unsplash,
          accessKey: req.session.guestApiKeys.unsplash,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "unsplash", displayName: "Unsplash API", apiKey: "", accessKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Unsplash setting" });
    }
  });

  app.put("/api/settings/unsplash", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, accessKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined;
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }
      if (accessKey && accessKey.includes('••••••••')) {
        accessKey = undefined;
      } else if (accessKey) {
        accessKey = encrypt(accessKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'unsplash',
        displayName: 'Unsplash API',
        accessKey: accessKey || apiKey, // Use accessKey if provided, otherwise use apiKey for backward compatibility
        isActive: isActive ?? true
      });
      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null, accessKey: setting.accessKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update Unsplash setting:", error);
      res.status(500).json({ message: "Failed to update Unsplash setting" });
    }
  });

  app.get("/api/settings/openrouter", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (req.session?.isAuthenticated && req.session?.userId && req.session.userId !== 'guest') {
        const userId = req.session.userId;
        const setting = await storage.getApiSetting(userId, 'openrouter');
        if (!setting) {
          return res.json({ name: "openrouter", displayName: "OpenRouter API", apiKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.openrouter) {
        return res.json({
          name: "openrouter",
          displayName: "OpenRouter API",
          apiKey: req.session.guestApiKeys.openrouter,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "openrouter", displayName: "OpenRouter API", apiKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get OpenRouter setting" });
    }
  });

  app.put("/api/settings/openrouter", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined;
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'openrouter',
        displayName: 'OpenRouter API',
        apiKey,
        isActive: isActive ?? true
      });

      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update OpenRouter setting:", error);
      res.status(500).json({ message: "Failed to update OpenRouter setting" });
    }
  });

  app.get("/api/settings/deepseek", async (req, res) => {
    try {
      // Check if user is authenticated via session
      if (req.session?.isAuthenticated && req.session?.userId && req.session.userId !== 'guest') {
        const userId = req.session.userId;
        const setting = await storage.getApiSetting(userId, 'deepseek');
        if (!setting) {
          return res.json({ name: "deepseek", displayName: "DeepSeek API", apiKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.deepseek) {
        return res.json({
          name: "deepseek",
          displayName: "DeepSeek API",
          apiKey: req.session.guestApiKeys.deepseek,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "deepseek", displayName: "DeepSeek API", apiKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get DeepSeek setting" });
    }
  });

  app.put("/api/settings/deepseek", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined;
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'deepseek',
        displayName: 'DeepSeek API',
        apiKey,
        isActive: isActive ?? true
      });

      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update DeepSeek setting:", error);
      res.status(500).json({ message: "Failed to update DeepSeek setting" });
    }
  });

  app.get("/api/settings/netlify", async (req, res) => {
    try {
      // Check if user is authenticated
      if ((req as any).user?.id) {
        const userId = (req as any).user.id;
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (!setting) {
          return res.json({ name: "netlify", displayName: "Netlify API", apiKey: "", isActive: false });
        }
        return res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
      }

      // For guest users, check session storage
      if (req.session?.guestApiKeys?.netlify) {
        return res.json({
          name: "netlify",
          displayName: "Netlify API",
          apiKey: req.session.guestApiKeys.netlify,
          isActive: true
        });
      }

      // No API key found
      return res.json({ name: "netlify", displayName: "Netlify API", apiKey: "", isActive: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Netlify setting" });
    }
  });

  app.put("/api/settings/netlify", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      let { apiKey, isActive } = req.body;

      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (apiKey && apiKey.includes('••••••••')) {
        apiKey = undefined; // Don't overwrite with masking string
      } else if (apiKey) {
        apiKey = encrypt(apiKey);
      }

      const setting = await storage.upsertApiSetting(userId, {
        name: 'netlify',
        displayName: 'Netlify API',
        apiKey,
        isActive: isActive ?? true
      });

      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      console.error("Failed to update Netlify setting:", error);
      res.status(500).json({ message: "Failed to update Netlify setting" });
    }
  });

  // Generic API settings routes (MUST come after specific routes)
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const settings = await storage.listApiSettings(userId);
      const maskedSettings = settings.map(setting => ({
        ...setting,
        apiKey: setting.apiKey ? "•••••••••••" : null,
        accessKey: setting.accessKey ? "•••••••••••" : null,
        secretKey: setting.secretKey ? "•••••••••••" : null,
      }));
      res.json(maskedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get API settings" });
    }
  });

  app.get("/api/settings/:name", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const setting = await storage.getApiSetting(userId, req.params.name);
      if (!setting) {
        return res.status(404).json({ message: "API setting not found" });
      }
      res.json({
        ...setting,
        apiKey: setting.apiKey ? "•••••••••••" : null,
        accessKey: setting.accessKey ? "•••••••••••" : null,
        secretKey: setting.secretKey ? "•••••••••••" : null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get API setting" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      let validatedData = insertApiSettingSchema.parse(req.body);
      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (validatedData.apiKey && !validatedData.apiKey.includes('••••••••')) {
        validatedData.apiKey = encrypt(validatedData.apiKey);
      } else {
        validatedData.apiKey = undefined;
      }
      if (validatedData.accessKey && !validatedData.accessKey.includes('••••••••')) {
        validatedData.accessKey = encrypt(validatedData.accessKey);
      } else {
        validatedData.accessKey = undefined;
      }

      const setting = await storage.createApiSetting(validatedData);
      res.status(201).json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create API setting"
      });
    }
  });

  app.put("/api/settings/:id", async (req, res) => {
    try {
      let validatedData = updateApiSettingSchema.parse(req.body);
      const { encrypt } = await import('./crypto.js').catch(() => ({ encrypt: (k: string) => k }));

      if (validatedData.apiKey && validatedData.apiKey.includes('••••••••')) {
        validatedData.apiKey = undefined;
      } else if (validatedData.apiKey) {
        validatedData.apiKey = encrypt(validatedData.apiKey);
      }

      if (validatedData.accessKey && validatedData.accessKey.includes('••••••••')) {
        validatedData.accessKey = undefined;
      } else if (validatedData.accessKey) {
        validatedData.accessKey = encrypt(validatedData.accessKey);
      }

      const setting = await storage.updateApiSetting(req.params.id, validatedData);
      if (!setting) {
        return res.status(404).json({ message: "API setting not found" });
      }
      res.json({ ...setting, apiKey: setting.apiKey ? "•••••••••••" : null });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update API setting"
      });
    }
  });

  app.delete("/api/settings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteApiSetting(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "API setting not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete API setting" });
    }
  });


  // Dashboard metrics routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getLatestDashboardMetrics();
      if (!metrics) {
        return res.status(404).json({ message: "Dashboard metrics not found" });
      }
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard metrics" });
    }
  });

  app.get("/api/dashboard/metrics/history", async (req, res) => {
    try {
      const metrics = await storage.listDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard metrics history" });
    }
  });

  app.post("/api/dashboard/metrics", async (req, res) => {
    try {
      const validatedData = insertDashboardMetricsSchema.parse(req.body);
      const metrics = await storage.createDashboardMetrics(validatedData);
      res.status(201).json(metrics);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create dashboard metrics"
      });
    }
  });

  // AI Content Generation Endpoints
  app.post("/api/generate-seo-content", async (req, res) => {
    try {
      const { businessData } = req.body;

      if (!businessData) {
        return res.status(400).json({
          message: "Business data is required"
        });
      }

      const userId = (req as any).user?.id || req.session.userId;
      const provider = businessData.contentAiProvider || 'openai';
      const apiKey = await getAIProviderConfig(userId, provider, req);

      if (!apiKey) {
        return res.status(400).json({
          message: `${provider.toUpperCase()} API key not configured. Please add your API key in the API Setup page.`
        });
      }

      let seoContent;
      switch (provider) {
        case 'gemini':
          seoContent = await generateSEOContentWithGemini(businessData, apiKey);
          break;
        case 'openrouter':
          // Use OpenAI service for now, can be extended later
          seoContent = await generateSEOContent(businessData, apiKey);
          break;
        default: // openai
          seoContent = await generateSEOContent(businessData, apiKey);
          break;
      }

      res.json({
        success: true,
        data: seoContent
      });
    } catch (error) {
      console.error("SEO content generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate SEO content"
      });
    }
  });

  app.post("/api/generate-faq-content", async (req, res) => {
    try {
      const { businessData } = req.body;

      if (!businessData) {
        return res.status(400).json({
          message: "Business data is required"
        });
      }

      const userId = (req as any).user?.id || req.session.userId;
      const provider = businessData.contentAiProvider || 'openai';
      const apiKey = await getAIProviderConfig(userId, provider, req);

      if (!apiKey) {
        return res.status(400).json({
          message: `${provider.toUpperCase()} API key not configured. Please add your API key in the API Setup page.`
        });
      }

      let faqContent;
      switch (provider) {
        case 'gemini':
          faqContent = await generateFAQContentWithGemini(businessData, apiKey);
          break;
        case 'openrouter':
          // Use OpenAI service for now, can be extended later
          faqContent = await generateFAQContent(businessData, apiKey);
          break;
        default: // openai
          faqContent = await generateFAQContent(businessData, apiKey);
          break;
      }

      res.json({
        success: true,
        data: faqContent
      });
    } catch (error) {
      console.error("FAQ content generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate FAQ content"
      });
    }
  });

  app.post("/api/generate-testimonials", async (req, res) => {
    try {
      const { businessData } = req.body;

      if (!businessData) {
        return res.status(400).json({
          message: "Business data is required"
        });
      }

      const userId = (req as any).user?.id || req.session.userId;
      const provider = businessData.contentAiProvider || 'openai';
      const apiKey = await getAIProviderConfig(userId, provider, req);

      if (!apiKey) {
        return res.status(400).json({
          message: `${provider.toUpperCase()} API key not configured. Please add your API key in the API Setup page.`
        });
      }

      let testimonials;
      switch (provider) {
        case 'gemini':
          testimonials = await generateTestimonialsWithGemini(businessData, apiKey);
          break;
        case 'openrouter':
          // Use OpenAI service for now, can be extended later
          testimonials = await generateTestimonials(businessData, apiKey);
          break;
        default: // openai
          testimonials = await generateTestimonials(businessData, apiKey);
          break;
      }

      res.json({
        success: true,
        data: testimonials
      });
    } catch (error) {
      console.error("Testimonials generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate testimonials"
      });
    }
  });

  // Generate AI content for service pages
  app.post("/api/generate-service-content", async (req, res) => {
    try {
      const { serviceName, businessData } = req.body;

      if (!serviceName || !businessData) {
        return res.status(400).json({
          message: "Service name and business data are required"
        });
      }

      // Get user's personal API key first, then fall back to admin settings
      const userId = (req as any).user?.id || req.session.userId;
      let apiKey = null;

      // Try user's personal API key first (skip for admin)
      if (userId !== "admin") {
        apiKey = await storage.getUserPersonalApiKey(userId);
      }

      // Fallback to environment variable (no more global API keys)
      if (!apiKey) {
        // No more global API keys - use environment variable instead
        apiKey = process.env.OPENAI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          message: "OpenAI API key not configured. Please add your personal API key in your account settings."
        });
      }

      const serviceContent = await generateServicePageContent(serviceName, businessData, apiKey);

      res.json({
        success: true,
        data: serviceContent
      });
    } catch (error) {
      console.error("Service content generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate service content"
      });
    }
  });

  // Generate AI content for location pages
  app.post("/api/generate-location-content", async (req, res) => {
    try {
      const { locationName, businessData } = req.body;

      if (!locationName || !businessData) {
        return res.status(400).json({
          message: "Location name and business data are required"
        });
      }

      // Get user's personal API key first, then fall back to admin settings
      const userId = (req as any).user?.id || req.session.userId;
      let apiKey = null;

      // Try user's personal API key first (skip for admin)
      if (userId !== "admin") {
        apiKey = await storage.getUserPersonalApiKey(userId);
      }

      // Fallback to environment variable (no more global API keys)
      if (!apiKey) {
        // No more global API keys - use environment variable instead
        apiKey = process.env.OPENAI_API_KEY;
      }

      if (!apiKey) {
        return res.status(400).json({
          message: "OpenAI API key not configured. Please add your personal API key in your account settings."
        });
      }

      const locationContent = await generateLocationPageContent(locationName, businessData, apiKey);

      res.json({
        success: true,
        data: locationContent
      });
    } catch (error) {
      console.error("Location content generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate location content"
      });
    }
  });

  // Comprehensive AI content generation endpoint (public access - uses session-stored API keys)
  app.post("/api/ai/generate-all-content", async (req, res) => {
    try {
      const { serviceType, location, phoneNumber, businessCategory, businessName, contentAiProvider } = req.body;

      if (!serviceType || !location || !phoneNumber || !businessCategory) {
        return res.status(400).json({
          message: "Service type, location, phone number, and business category are required"
        });
      }

      const userId = (req as any).user?.id || req.session.userId || "guest";
      const provider: AIProvider = ["openai", "gemini", "openrouter", "deepseek"].includes(contentAiProvider)
        ? (contentAiProvider as AIProvider)
        : "openai";
      const apiKey = await getAIProviderConfig(userId, provider, req);

      if (!apiKey) {
        return res.status(400).json({
          message: `${provider.toUpperCase()} API key not configured. Please add your API key in the API Setup page.`
        });
      }

      // Set response headers for Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const writeProgress = (type: string, progress: number, step: string, stepIndex: number, data?: any) => {
        res.write(`data: ${JSON.stringify({ type, progress, step, stepIndex, ...data })}\n\n`);
      };

      try {
        const finalBusinessName = businessName || `${serviceType} in ${location}`;
        const context = {
          finalBusinessName,
          serviceType: stringValue(serviceType),
          location: stringValue(location),
          businessCategory: stringValue(businessCategory),
          phoneNumber: stringValue(phoneNumber),
        };

        // Step 1: Generate homepage SEO content using advanced prompt template
        writeProgress("progress", 10, "Generating hero section content", 0);

        const primaryCity = context.location.split(",")[0]?.trim() || context.location;
        const basePromptContext = toPromptContext(
          {
            businessName: context.finalBusinessName,
            category: context.businessCategory,
            heroLocation: primaryCity,
            phone: context.phoneNumber,
            heroService: context.serviceType,
          },
          {
            primaryCity,
            locations: [context.location],
            services: [context.serviceType],
          }
        );

        const homePrompt = buildHomePagePrompt(
          basePromptContext,
          [`/services/${toSlug(context.serviceType)}`],
          [`/locations/${toSlug(primaryCity)}`]
        );

        const homePromptData = await generateStructuredJsonWithProvider(provider, apiKey, homePrompt, {
          maxTokens: 6500,
          temperature: 0.65,
        });

        // Step 2: Build about/business core details
        writeProgress("progress", 25, "Creating business description", 1);
        const mappedHomeData = mapHomePromptToBuilderFields(homePromptData, context);

        // Step 3: Expand services/locations/keywords to match site layout needs
        writeProgress("progress", 40, "Generating services list and dynamic pages", 2);
        const operationalDetails = await generateStructuredJsonWithProvider(
          provider,
          apiKey,
          buildOperationalDetailsPrompt(context),
          {
            maxTokens: 2500,
            temperature: 0.55,
          }
        );

        const generatedServices = uniqueValues([
          ...splitValues(operationalDetails?.services),
          ...splitValues(mappedHomeData.services),
          context.serviceType,
        ]).slice(0, 8);

        const generatedAreas = uniqueValues([
          ...splitValues(operationalDetails?.serviceAreas),
          ...splitValues(mappedHomeData.serviceAreas),
          context.location,
        ]).slice(0, 6);

        const generatedKeywords = uniqueValues([
          ...splitKeywords(operationalDetails?.targetedKeywords),
          ...splitKeywords(mappedHomeData.targetedKeywords),
          `${context.serviceType} in ${context.location}`,
        ]).slice(0, 10);

        const generatedFeatureHeadlines = uniqueValues([
          ...splitValues(operationalDetails?.featureHeadlines),
          ...splitValues(mappedHomeData.featureHeadlines),
        ]).slice(0, 6);

        const generatedFeatureDescriptions = uniqueValues([
          ...splitValues(operationalDetails?.featureDescriptions),
          ...splitValues(mappedHomeData.featureDescriptions),
        ]).slice(0, 6);

        const generatedKeyFacts = uniqueValues([
          ...splitValues(operationalDetails?.keyFacts),
          ...splitValues(mappedHomeData.keyFacts),
        ]).slice(0, 4);

        const parsedYears = Number.parseInt(String(operationalDetails?.yearsInBusiness || ""), 10);
        const yearsInBusiness = Number.isFinite(parsedYears)
          ? Math.max(1, Math.min(100, parsedYears))
          : 10;
        const businessHours =
          stringValue(operationalDetails?.businessHours) ||
          "Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 4:00 PM";

        // Step 4: SEO section mapping from homepage template output
        writeProgress("progress", 55, "Creating SEO content sections", 3);

        // Step 5: FAQ mapping and completion
        writeProgress("progress", 70, "Generating FAQ questions & answers", 4);
        const faqData = Object.fromEntries(
          Array.from({ length: 10 }, (_, index) => {
            const key = index + 1;
            return [
              [`faqQuestion${key}`, stringValue((mappedHomeData as any)[`faqQuestion${key}`])],
              [`faqAnswer${key}`, stringValue((mappedHomeData as any)[`faqAnswer${key}`])],
            ];
          }).flat()
        );

        // Step 6: Testimonials (Bypassed - Reviews Removed)
        writeProgress("progress", 85, "Finalizing database models", 5);
        const testimonialsData = {
          testimonial1Name: "",
          testimonial1Text: "",
          testimonial1Rating: 0,
          testimonial2Name: "",
          testimonial2Text: "",
          testimonial2Rating: 0,
          testimonial3Name: "",
          testimonial3Text: "",
          testimonial3Rating: 0,
        };

        // Step 7: Lead generation disclaimer and metadata polish
        writeProgress("progress", 90, "Generating website disclaimer", 6);
        const disclaimerRaw = await generateStructuredJsonWithProvider(
          provider,
          apiKey,
          buildDisclaimerPrompt(context),
          {
            maxTokens: 500,
            temperature: 0.4,
          }
        );

        writeProgress("progress", 95, "Optimizing meta titles & descriptions", 7);
        const generatedData = {
          ...mappedHomeData,
          ...faqData,
          ...testimonialsData,
          businessName: context.finalBusinessName,
          category: context.businessCategory,
          phone: context.phoneNumber,
          address: context.location,
          services: toCsv(generatedServices),
          additionalServices: toCsv(generatedServices),
          serviceAreas: toCsv(generatedAreas),
          additionalLocations: toCsv(generatedAreas),
          targetedKeywords: toCsv(generatedKeywords),
          featureHeadlines: toCsv(generatedFeatureHeadlines),
          featureDescriptions: toCsv(generatedFeatureDescriptions),
          keyFacts: toCsv(generatedKeyFacts),
          yearsInBusiness,
          businessHours,
          leadGenDisclaimer:
            stringValue(disclaimerRaw?.leadGenDisclaimer) ||
            `This website is operated by ${context.finalBusinessName} for lead generation purposes. We connect customers with qualified ${context.businessCategory.toLowerCase()} professionals in the area.`,
          footerTitle: context.finalBusinessName,
          footerDescription:
            stringValue((homePromptData as any)?.finalCTA?.body) ||
            `Professional ${context.serviceType.toLowerCase()} services in ${context.location}. Contact us today for expert solutions.`,
        };

        // Step 8: Finalize
        writeProgress("progress", 100, "Finalizing all content", 8);

        // Send completion with generated data
        res.write(`data: ${JSON.stringify({ type: 'completed', generatedData })}\n\n`);
        res.end();

      } catch (error) {
        console.error("AI content generation error:", error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Content generation failed'
        })}\n\n`);
        res.end();
      }

    } catch (error) {
      console.error("AI generation endpoint error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate content"
      });
    }
  });

  // Blog generation endpoint
  app.post("/api/generate-with-blog", async (req, res) => {
    try {
      const { businessData, template, generateBlog, blogAiProvider, blogPromptId, blogKeywords, blogUseImages, blogOutputOption } = req.body;

      // Validate main business data
      const validatedData = businessDataSchema.parse(businessData);

      // Store website
      const userId = (req.user as any)?.claims?.sub || 'anonymous';
      const website = await storage.createWebsite({
        userId: userId,
        title: validatedData.businessName || 'Untitled Website',
        businessData: normalizeBusinessDataForGeneration(validatedData),
        template: template,
      });

      // Generate basic website files
      const websiteFiles = generateAllWebsiteFiles(normalizeBusinessDataForGeneration(validatedData), template);

      // Initialize ZIP
      const zip = new JSZip();

      if (generateBlog && blogKeywords && blogPromptId) {
        try {
          // Fetch the blog prompt content from the database
          const blogPrompt = await storage.getBlogPromptByName(blogPromptId);
          if (!blogPrompt) {
            throw new Error(`Blog prompt with ID "${blogPromptId}" not found`);
          }

          const blogAiPrompt = blogPrompt.prompt;

          // Parse keywords from textarea (one per line)
          const keywords = blogKeywords.split('\n').map((k: string) => k.trim()).filter((k: string) => k.length > 0);

          if (keywords.length === 0) {
            throw new Error("No valid keywords provided for blog generation");
          }

          // Track blog generation attempt
          const metrics = await storage.getLatestDashboardMetrics();
          if (metrics) {
            await storage.createDashboardMetrics({
              totalWebsites: metrics.totalWebsites,
              totalBlogPosts: metrics.totalBlogPosts,
              blogGenerationAttempts: (metrics.blogGenerationAttempts || 0) + 1,
              blogGenerationSuccess: metrics.blogGenerationSuccess || 0,
              blogGenerationFailures: metrics.blogGenerationFailures || 0,
              totalPageViews: metrics.totalPageViews,
              totalRevenue: metrics.totalRevenue,
              activeProjects: metrics.activeProjects,
              pendingTasks: metrics.pendingTasks,
            });
          }

          // Get API keys from storage with environment variable fallback
          let openaiApiKey: string | undefined;
          let openrouterApiKey: string | undefined;

          try {
            // Try to get user-specific API key if user is authenticated
            let openaiSetting;
            if ((req as any).user && (req as any).user.id !== 'guest') {
              openaiSetting = await storage.getApiSetting((req as any).user.id, 'openai');
            }
            openaiApiKey = (openaiSetting?.isActive && openaiSetting.apiKey)
              ? openaiSetting.apiKey
              : process.env.OPENAI_API_KEY;

            let openrouterSetting;
            if ((req as any).user && (req as any).user.id !== 'guest') {
              openrouterSetting = await storage.getApiSetting((req as any).user.id, 'openrouter');
            }
            openrouterApiKey = (openrouterSetting?.isActive && openrouterSetting.apiKey)
              ? openrouterSetting.apiKey
              : process.env.OPENROUTER_API_KEY;
          } catch (error) {
            console.warn("Could not fetch API settings:", error);
            // Fallback to environment variables
            openaiApiKey = process.env.OPENAI_API_KEY;
            openrouterApiKey = process.env.OPENROUTER_API_KEY;
          }

          // Generate blog posts using selected AI provider
          let blogPosts;
          if (blogAiProvider === 'openrouter') {
            if (!openrouterApiKey) {
              throw new Error("OpenRouter API key not configured. Please set up your API key in the dashboard.");
            }
            blogPosts = await generateMultipleBlogPostsWithOpenRouter(keywords, blogAiPrompt, validatedData, openrouterApiKey);
          } else if (blogAiProvider === 'deepseek') {
            const deepseekSetting = await storage.getApiSetting((req as any).user.id, 'deepseek');
            const deepseekApiKey = (deepseekSetting?.isActive && deepseekSetting.apiKey) 
              ? deepseekSetting.apiKey 
              : process.env.DEEPSEEK_API_KEY;
            if (!deepseekApiKey) throw new Error("DeepSeek API key not configured.");
            const { generateMultipleBlogPostsWithDeepSeek } = await import("./services/deepseek.js");
            blogPosts = await generateMultipleBlogPostsWithDeepSeek(keywords, blogAiPrompt, validatedData, deepseekApiKey);
          } else {
            if (!openaiApiKey) {
              throw new Error("OpenAI API key not configured. Please set up your API key in the dashboard.");
            }
            blogPosts = await generateMultipleBlogPosts(keywords, blogAiPrompt, validatedData, openaiApiKey);
          }

          if (blogPosts.length === 0) {
            throw new Error("No blog posts were successfully generated");
          }

          // Track successful blog generation
          const updatedMetrics = await storage.getLatestDashboardMetrics();
          if (updatedMetrics) {
            await storage.createDashboardMetrics({
              totalWebsites: updatedMetrics.totalWebsites,
              totalBlogPosts: (updatedMetrics.totalBlogPosts || 0) + blogPosts.length,
              blogGenerationAttempts: updatedMetrics.blogGenerationAttempts || 0,
              blogGenerationSuccess: (updatedMetrics.blogGenerationSuccess || 0) + 1,
              blogGenerationFailures: updatedMetrics.blogGenerationFailures || 0,
              totalPageViews: updatedMetrics.totalPageViews,
              totalRevenue: updatedMetrics.totalRevenue,
              activeProjects: updatedMetrics.activeProjects,
              pendingTasks: updatedMetrics.pendingTasks,
            });
          }

          if (blogPosts.length === 0) {
            throw new Error("No blog posts were successfully generated");
          }

          // Add images if requested
          if (blogUseImages) {
            for (const post of blogPosts) {
              try {
                const image = await fetchUnsplashImage(post.keywords);
                if (image) {
                  // Insert image at the beginning of the content
                  post.content = `<img src="${image.url}" alt="${image.alt}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 2rem;">
                    <p style="font-size: 0.875rem; color: #666; text-align: center; margin-bottom: 2rem;">${image.credit}</p>
                    ${post.content}`;
                }
              } catch (error) {
                console.error(`Failed to fetch image for post "${post.title}":`, error);
                // Continue without image
              }
            }
          }

          if (blogOutputOption === 'blog_integrated') {
            // Create blog integrated website

            // Generate blog index page
            const blogIndexContent = generateBlogArchivePage(blogPosts, validatedData, template);

            // Generate individual blog post pages
            const blogPostFiles: { [key: string]: string } = {};
            blogPosts.forEach(post => {
              const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const postContent = generateBlogPostPage(post, validatedData, template);
              blogPostFiles[`blog/${slug}.html`] = postContent;
            });

            // Update main website navigation to include blog link
            const updatedIndexHtml = websiteFiles['index.html'].replace(
              /<nav[^>]*>([\s\S]*?)<\/nav>/g,
              (match, navContent) => {
                if (navContent.includes('Blog')) return match;
                return match.replace('</nav>', '<a href="blog/index.html">Blog</a></nav>');
              }
            );

            // Add all files to ZIP
            Object.entries(websiteFiles).forEach(([filename, content]) => {
              if (filename === 'index.html') {
                zip.file(filename, updatedIndexHtml);
              } else {
                zip.file(filename, content);
              }
            });

            // Add blog files
            zip.file('blog/index.html', blogIndexContent);
            Object.entries(blogPostFiles).forEach(([filename, content]) => {
              zip.file(filename, content);
            });

          } else {
            // Direct download - add blog posts as separate files
            Object.entries(websiteFiles).forEach(([filename, content]) => {
              zip.file(filename, content);
            });

            // Add blog posts as separate HTML files
            const blogFolder = zip.folder("blog-posts");
            blogPosts.forEach((post, index) => {
              const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const filename = `${String(index + 1).padStart(2, '0')}-${slug}.html`;
              const postContent = generateBlogPostPage(post, validatedData, template);
              blogFolder?.file(filename, postContent);
            });

            // Add blog posts metadata as JSON
            blogFolder?.file('blog-posts-metadata.json', JSON.stringify(blogPosts, null, 2));
          }

        } catch (blogError) {
          console.error("Blog generation failed:", blogError);

          // Track failed blog generation
          const metrics = await storage.getLatestDashboardMetrics();
          if (metrics) {
            await storage.createDashboardMetrics({
              totalWebsites: metrics.totalWebsites,
              totalBlogPosts: metrics.totalBlogPosts,
              blogGenerationAttempts: metrics.blogGenerationAttempts || 0,
              blogGenerationSuccess: metrics.blogGenerationSuccess || 0,
              blogGenerationFailures: (metrics.blogGenerationFailures || 0) + 1,
              totalPageViews: metrics.totalPageViews,
              totalRevenue: metrics.totalRevenue,
              activeProjects: metrics.activeProjects,
              pendingTasks: metrics.pendingTasks,
            });
          }

          // Fall back to website-only generation
          Object.entries(websiteFiles).forEach(([filename, content]) => {
            zip.file(filename, content);
          });

          // Add error notice
          zip.file("BLOG_GENERATION_ERROR.txt",
            `Blog generation failed: ${blogError instanceof Error ? blogError.message : 'Unknown error'}\n\n` +
            `Please check your API keys and try again.\n` +
            `Website files have been generated successfully.`
          );
        }
      } else {
        // No blog generation - standard website only
        Object.entries(websiteFiles).forEach(([filename, content]) => {
          zip.file(filename, content);
        });
      }

      // Add README
      const readmeContent = generateBlog
        ? `# ${validatedData.businessName} Website with Blog

This website was generated using SiteGenie with AI-powered blog generation.

## Files:
- index.html - Main website file
- styles.css - Stylesheet  
- script.js - JavaScript functionality (if included)
${generateBlog ? '- blog/ - Blog posts and blog index page' : ''}

## Blog Generation:
- AI Provider: ${blogAiProvider || 'Not specified'}
- Blog Posts Generated: ${blogKeywords ? blogKeywords.split('\n').filter((k: string) => k.trim()).length : 0}
- Images Included: ${blogUseImages ? 'Yes' : 'No'}
- Output Option: ${blogOutputOption || 'Not specified'}

## Deployment:
You can deploy this website to any web hosting service by uploading these files.

Generated on: ${new Date().toISOString()}`
        : `# ${validatedData.businessName} Website

This website was generated using SiteGenie.

## Files:
- index.html - Main website file
- styles.css - Stylesheet
- script.js - JavaScript functionality (if included)

## Deployment:
You can deploy this website to any web hosting service by uploading these files.

Generated on: ${new Date().toISOString()}`;

      zip.file("README.md", readmeContent);

      // Generate ZIP buffer
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Set headers for file download
      const filename = generateBlog
        ? `${validatedData.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-website-with-blog.zip`
        : `${validatedData.businessName.replace(/[^a-zA-Z0-9]/g, '-')}-website.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', zipBuffer.length);

      res.send(zipBuffer);

    } catch (error) {
      console.error("Website/blog generation error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Website/blog generation failed"
      });
    }
  });


  // Blog Prompt Management API Routes
  app.get("/api/blog-prompts", async (req, res) => {
    try {
      const prompts = await storage.listBlogPrompts();
      res.json(prompts);
    } catch (error) {
      console.error("Error fetching blog prompts:", error);
      res.status(500).json({ message: "Failed to fetch blog prompts" });
    }
  });

  app.post("/api/blog-prompts", async (req, res) => {
    try {
      const validatedData = insertBlogPromptSchema.parse(req.body);
      const prompt = await storage.createBlogPrompt(validatedData);
      res.json(prompt);
    } catch (error) {
      console.error("Error creating blog prompt:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to create blog prompt"
      });
    }
  });

  app.put("/api/blog-prompts/:id", async (req, res) => {
    try {
      const validatedData = updateBlogPromptSchema.parse(req.body);
      const prompt = await storage.updateBlogPrompt(req.params.id, validatedData);
      if (!prompt) {
        return res.status(404).json({ message: "Blog prompt not found" });
      }
      res.json(prompt);
    } catch (error) {
      console.error("Error updating blog prompt:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update blog prompt"
      });
    }
  });

  app.delete("/api/blog-prompts/:id", async (req, res) => {
    try {
      const success = await storage.deleteBlogPrompt(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Blog prompt not found" });
      }
      res.json({ message: "Blog prompt deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog prompt:", error);
      res.status(500).json({ message: "Failed to delete blog prompt" });
    }
  });

  // AdSense Settings Management API Routes
  app.get("/api/adsense-settings", async (req, res) => {
    try {
      const settings = await storage.listAdSenseSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching AdSense settings:", error);
      res.status(500).json({ message: "Failed to fetch AdSense settings" });
    }
  });

  app.put("/api/adsense-settings/:id", async (req, res) => {
    try {
      // Check if user is authenticated and is admin
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = req.user as any;
      const isAdmin = user?.id === "admin" || user?.role === "admin";

      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { code } = req.body;
      const setting = await storage.updateAdSenseSetting(req.params.id, code);
      if (!setting) {
        return res.status(404).json({ message: "AdSense setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating AdSense setting:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update AdSense setting"
      });
    }
  });

  // ===== SITE SETTINGS API ROUTES =====
  // Comprehensive settings management for all tracking codes and snippets

  // Get all site settings
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.listSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  // Get specific site setting by ID
  app.get("/api/site-settings/:id", async (req, res) => {
    try {
      const setting = await storage.getSiteSetting(req.params.id);
      if (!setting) {
        return res.status(404).json({ message: "Site setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching site setting:", error);
      res.status(500).json({ message: "Failed to fetch site setting" });
    }
  });

  // Update site setting (admin only)
  app.put("/api/site-settings/:id", isAdmin, async (req, res) => {
    try {
      const setting = await storage.updateSiteSetting(req.params.id, req.body);
      if (!setting) {
        return res.status(404).json({ message: "Site setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error updating site setting:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to update site setting"
      });
    }
  });

  // Upsert site setting (admin only)
  app.post("/api/site-settings", isAdmin, async (req, res) => {
    try {
      const setting = await storage.upsertSiteSetting(req.body);
      res.json(setting);
    } catch (error) {
      console.error("Error upserting site setting:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to save site setting"
      });
    }
  });

  // Test OpenAI connection endpoint
  app.post("/api/test-openai", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey || !apiKey.startsWith('sk-')) {
        return res.status(400).json({ error: "Invalid API key format" });
      }

      // Create a temporary OpenAI client with the provided API key
      const testClient = new (await import('openai')).default({ apiKey });

      // Test the connection with a minimal request
      const response = await testClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 5
      });

      if (response.choices && response.choices.length > 0) {
        res.json({ success: true, message: "OpenAI API connection successful" });
      } else {
        res.status(400).json({ error: "Invalid response from OpenAI" });
      }
    } catch (error) {
      console.error("OpenAI test failed:", error);

      let errorMessage = "Connection test failed";
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = "Invalid API key";
        } else if (error.message.includes('quota')) {
          errorMessage = "API quota exceeded";
        } else if (error.message.includes('rate')) {
          errorMessage = "Rate limit exceeded";
        } else {
          errorMessage = error.message;
        }
      }

      res.status(400).json({ error: errorMessage });
    }
  });

  // Test Gemini connection endpoint
  app.post("/api/test-gemini", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key is required" });
      }

      const { generateWithGemini } = await import("./services/gemini");
      const result = await generateWithGemini("Reply with exactly: Gemini connection successful", apiKey);

      if (result && result.toLowerCase().includes("connection successful")) {
        return res.json({
          success: true,
          message: "Gemini API connection successful"
        });
      }

      return res.status(400).json({ error: "Invalid response from Gemini" });
    } catch (error) {
      console.error("Gemini test failed:", error);

      let errorMessage = "Unable to connect to Gemini API";
      if (error instanceof Error) {
        const lowerMessage = error.message.toLowerCase();
        if (lowerMessage.includes("api key")) {
          errorMessage = "Invalid Gemini API key";
        } else if (lowerMessage.includes("quota")) {
          errorMessage = "Gemini API quota exceeded";
        } else if (lowerMessage.includes("rate")) {
          errorMessage = "Gemini API rate limit exceeded";
        } else {
          errorMessage = error.message;
        }
      }

      return res.status(400).json({ error: errorMessage });
    }
  });

  // Test OpenRouter connection endpoint
  app.post("/api/test-openrouter", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "OpenRouter API key is required" });
      }

      // Test the OpenRouter API with a minimal request
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://replit.com",
          "X-Title": "SiteGenie"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: "Test connection" }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          res.json({
            success: true,
            message: "OpenRouter API connection successful"
          });
        } else {
          res.status(400).json({ error: "Invalid response from OpenRouter" });
        }
      } else {
        let errorMessage = "Connection test failed";
        if (response.status === 401) {
          errorMessage = "Invalid API key";
        } else if (response.status === 403) {
          errorMessage = "API key forbidden or insufficient credits";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded";
        } else if (response.status === 402) {
          errorMessage = "Insufficient credits";
        }

        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error("OpenRouter test failed:", error);
      res.status(400).json({
        error: "Unable to connect to OpenRouter API"
      });
    }
  });

  // Test DeepSeek connection endpoint
  app.post("/api/test-deepseek", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "DeepSeek API key is required" });
      }

      // Test the DeepSeek API with a minimal request
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Test connection" }],
          max_tokens: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          res.json({
            success: true,
            message: "DeepSeek API connection successful"
          });
        } else {
          res.status(400).json({ error: "Invalid response from DeepSeek" });
        }
      } else {
        let errorMessage = "Connection test failed";
        if (response.status === 401) {
          errorMessage = "Invalid API key";
        } else if (response.status === 402) {
          errorMessage = "Insufficient credits";
        }

        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error("DeepSeek test failed:", error);
      res.status(400).json({
        error: "Unable to connect to DeepSeek API"
      });
    }
  });

  // Test Unsplash connection endpoint
  app.post("/api/test-unsplash", async (req, res) => {
    try {
      const { apiKey, accessKey } = req.body;
      const keyToTest = accessKey || apiKey;

      if (!keyToTest) {
        return res.status(400).json({ error: "Access key is required" });
      }

      // Test the Unsplash API with a simple photo search
      const response = await fetch("https://api.unsplash.com/photos/random?count=1", {
        headers: {
          "Authorization": `Client-ID ${keyToTest}`,
          "Accept-Version": "v1"
        }
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          message: "Unsplash API connection successful",
          photoCount: Array.isArray(data) ? data.length : 1
        });
      } else {
        let errorMessage = "Connection test failed";
        if (response.status === 401) {
          errorMessage = "Invalid access key";
        } else if (response.status === 403) {
          errorMessage = "Access key forbidden or rate limited";
        } else if (response.status === 429) {
          errorMessage = "Rate limit exceeded";
        }

        res.status(400).json({ error: errorMessage });
      }
    } catch (error) {
      console.error("Unsplash test failed:", error);
      res.status(400).json({
        error: "Unable to connect to Unsplash API"
      });
    }
  });

  // Netlify API routes
  app.get("/api/websites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const websites = await storage.listUserWebsites(userId);
      res.json(websites);
    } catch (error) {
      console.error("Error fetching user websites:", error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  app.get("/api/websites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      res.json(website);
    } catch (error) {
      console.error("Error fetching website:", error);
      res.status(500).json({ message: "Failed to fetch website" });
    }
  });

  app.post("/api/websites", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Check website creation limit (counts active websites in the table)
      const limitCheck = await storage.checkWebsiteLimit(userId);
      if (!limitCheck.canCreate) {
        return res.status(403).json({
          message: `Free plan limit reached (${limitCheck.limit} websites). Delete an existing website or upgrade to Pro for unlimited websites.`,
          limit: limitCheck.limit,
          remaining: limitCheck.remaining,
        });
      }

      const websiteData = { ...req.body, userId } as Record<string, any>;
      if (websiteData.businessData) {
        websiteData.businessData = normalizeBusinessDataForGeneration(websiteData.businessData);
      }
      if (Object.prototype.hasOwnProperty.call(websiteData, "customFiles")) {
        const normalizedCustomFiles = normalizeCustomFiles(websiteData.customFiles);
        const templateToUse = stringValue(websiteData.selectedTemplate || websiteData.template) || "template1";
        if (websiteData.businessData && Object.keys(normalizedCustomFiles).length > 0) {
          try {
            const generatedBaseFiles = generateAllWebsiteFiles(websiteData.businessData, templateToUse) as Record<string, string>;
            const { sanitizedCustomFiles } = mergeWebsiteFilesWithCustomFiles(generatedBaseFiles, normalizedCustomFiles);
            websiteData.customFiles = Object.keys(sanitizedCustomFiles).length > 0 ? sanitizedCustomFiles : null;
          } catch {
            websiteData.customFiles = Object.keys(normalizedCustomFiles).length > 0 ? normalizedCustomFiles : null;
          }
        } else {
          websiteData.customFiles = Object.keys(normalizedCustomFiles).length > 0 ? normalizedCustomFiles : null;
        }
      }
      const website = await storage.createWebsite(websiteData as any);

      // No need to increment a counter — checkWebsiteLimit counts from the websites table directly

      res.json(website);
    } catch (error) {
      console.error("Error creating website:", error);
      res.status(500).json({ message: "Failed to create website" });
    }
  });

  app.put("/api/websites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if website belongs to user
      let existingWebsite = await storage.getWebsite(id);
      if (!existingWebsite) {
        console.warn(`[routes] Website ${id} not found. Auto-recreating website record in storage.`);
        const businessData = req.body.businessData || {};
        const templateToUse = req.body.selectedTemplate || req.body.template || businessData?.categoryId || "water-damage";
        const title = businessData.businessName || "Untitled Website";
        
        existingWebsite = await storage.createWebsite({
          id,
          userId,
          title,
          category: businessData?.categoryId || "water-damage",
          template: templateToUse,
          businessData,
          selectedTemplate: templateToUse,
          netlifyDeploymentStatus: "not_deployed",
          isActive: true,
        } as any);
      }

      if (existingWebsite.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      const updatePayload = { ...req.body } as Record<string, any>;
      const mergedBusinessData = updatePayload.businessData
        ? normalizeBusinessDataForGeneration(updatePayload.businessData)
        : normalizeBusinessDataForGeneration(existingWebsite.businessData as any);

      if (updatePayload.businessData) {
        updatePayload.businessData = mergedBusinessData;
      }

      if (Object.prototype.hasOwnProperty.call(updatePayload, "customFiles")) {
        const normalizedCustomFiles = normalizeCustomFiles(updatePayload.customFiles);
        const templateToUse =
          stringValue(updatePayload.selectedTemplate || updatePayload.template || existingWebsite.selectedTemplate || existingWebsite.template) ||
          "template1";

        // Local-service (WD-editor) templates use generateLocalServiceWebsite,
        // NOT generateAllWebsiteFiles. Skip the merge for those categories to
        // avoid crashes and "Failed to save website" errors.
        const localServiceCategories = new Set([
          'water-damage', 'plumbing', 'roofing', 'hvac', 'electrical',
          'locksmith', 'pest-control', 'landscaping', 'painting',
          'cleaning', 'garage-door', 'fencing', 'concrete',
          'tree-service', 'moving', 'junk-removal', 'dumpster-rental',
          'appliance-repair', 'carpet-cleaning', 'pressure-washing',
          'pool-service', 'glass-repair', 'towing', 'mold-remediation',
          'fire-damage', 'flood-damage',
        ]);
        const isLocalServiceTemplate = localServiceCategories.has(templateToUse) ||
          localServiceCategories.has(mergedBusinessData?.categoryId || '');

        if (mergedBusinessData && Object.keys(normalizedCustomFiles).length > 0 && !isLocalServiceTemplate) {
          try {
            const generatedBaseFiles = generateAllWebsiteFiles(mergedBusinessData, templateToUse) as Record<string, string>;
            const { sanitizedCustomFiles } = mergeWebsiteFilesWithCustomFiles(generatedBaseFiles, normalizedCustomFiles);
            updatePayload.customFiles = Object.keys(sanitizedCustomFiles).length > 0 ? sanitizedCustomFiles : null;
          } catch {
            updatePayload.customFiles = Object.keys(normalizedCustomFiles).length > 0 ? normalizedCustomFiles : null;
          }
        } else if (Object.keys(normalizedCustomFiles).length > 0) {
          // For local-service templates or when mergedBusinessData is null,
          // store the custom files directly without merging
          updatePayload.customFiles = normalizedCustomFiles;
        } else {
          updatePayload.customFiles = null;
        }
      }

      const updatedWebsite = await storage.updateWebsite(id, updatePayload);
      res.json(updatedWebsite);
    } catch (error) {
      console.error("Error updating website:", error);
      res.status(500).json({ message: "Failed to update website" });
    }
  });

  // Unpublish — clears netlifyUrl so the site can be deleted or re-deployed elsewhere
  app.post("/api/websites/:id/unpublish", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const existingWebsite = await storage.getWebsite(id);
      if (!existingWebsite || existingWebsite.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }
      await storage.updateWebsite(id, {
        netlifyUrl: null,
        netlifyDeploymentStatus: "unpublished",
      } as any);
      res.json({ message: "Website unpublished successfully" });
    } catch (error) {
      console.error("Error unpublishing website:", error);
      res.status(500).json({ message: "Failed to unpublish website" });
    }
  });

  app.delete("/api/websites/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === "admin" || userId === "admin";
      const force = req.query.force === "true";

      // Check if website exists
      const existingWebsite = await storage.getWebsite(id);
      if (!existingWebsite) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Non-admin users can only delete their own websites
      if (!isAdmin && existingWebsite.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      // For published sites, clear the Netlify reference before deleting
      if (force && existingWebsite.netlifyUrl) {
        await storage.updateWebsite(id, {
          netlifyUrl: null,
          netlifyDeploymentStatus: "deleted",
        } as any);
      }

      const success = await storage.deleteWebsite(id);
      if (success) {
        res.json({ message: "Website deleted successfully", netlifyUrl: existingWebsite.netlifyUrl || null });
      } else {
        res.status(404).json({ message: "Website not found" });
      }
    } catch (error) {
      console.error("Error deleting website:", error);
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // Admin bulk delete websites
  app.post("/api/admin/websites/bulk-delete", isAdmin, async (req: any, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Provide an array of website IDs" });
      }
      let deleted = 0;
      for (const id of ids) {
        const success = await storage.deleteWebsite(id);
        if (success) deleted++;
      }
      res.json({ message: `Deleted ${deleted} of ${ids.length} websites` });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      res.status(500).json({ message: "Failed to bulk delete" });
    }
  });

  app.post("/api/websites/:id/redeploy", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { siteName: customSiteName, customDomain } = req.body;
      const userId = req.user.id;

      // Check if website belongs to user
      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ message: "Website not found" });
      }

      // Decrypt the stored Netlify API key or fetch it from User API Settings
      let resolvedNetlifyKey = website.netlifyApiKey;
      try {
        if (resolvedNetlifyKey) {
          resolvedNetlifyKey = decrypt(resolvedNetlifyKey);
        }
      } catch {
        // If decryption fails, try using it as-is (might not be encrypted)
      }

      // Also try fetching from user's API settings if key looks invalid or missing
      if (!resolvedNetlifyKey || resolvedNetlifyKey.includes('•')) {
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (setting?.apiKey) {
          try {
            resolvedNetlifyKey = decrypt(setting.apiKey);
          } catch {
            resolvedNetlifyKey = setting.apiKey;
          }
        }
      }

      if (!resolvedNetlifyKey) {
        return res.status(400).json({ message: "No Netlify API key configured. Please set one up in API Settings." });
      }

      // Update deployment status to deploying
      await storage.updateWebsite(id, {
        netlifyDeploymentStatus: "deploying"
      });

      try {
        // If custom site name is provided, create a new site
        if (customSiteName && customSiteName.trim()) {
          console.log(`Creating new Netlify site with custom name: ${customSiteName}`);

          // Clean the site name
          const cleanSiteName = customSiteName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 63); // Netlify site name limit

          // Get the latest website data from database before deployment
          const latestWebsite = await storage.getWebsite(id);
          if (!latestWebsite) {
            throw new Error("Website not found during redeploy");
          }

          // Create new site using the existing deployment logic
          // deployToNetlify is imported statically at the top

          // Determine SEO URL for new site
          let seoUrl;
          if (customDomain && customDomain.trim()) {
            seoUrl = customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim()}`;
          } else {
            seoUrl = `https://${cleanSiteName}.netlify.app`;
          }

          console.log("Using SEO URL for redeploy with new site:", seoUrl);
          const provider = (latestWebsite.businessData as any).contentAiProvider || 'openai';
          const aiGeneratedContent = await generateAIContentForDynamicPages(latestWebsite.businessData as any, latestWebsite.userId, provider);
          // Ensure blog posts are included in businessData
          const businessDataWithBlogs = normalizeBusinessDataForGeneration({
            ...(latestWebsite.businessData as any),
            blogPosts: (latestWebsite.businessData as any).blogPosts || []
          });
          const templateKey = latestWebsite.selectedTemplate || latestWebsite.template;
          let websiteFiles = await generateFilesForTemplate(businessDataWithBlogs, templateKey, seoUrl, undefined, aiGeneratedContent);
          websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, latestWebsite.customFiles).mergedFiles;

          const result = await deployToNetlify(websiteFiles, resolvedNetlifyKey, cleanSiteName);

          // Update with new site information
          await storage.updateWebsite(id, {
            netlifyUrl: result.ssl_url || result.url,
            netlifySiteId: result.name,
            netlifyDeploymentStatus: "deployed",
            lastDeployedAt: new Date()
          });

          res.json({
            message: "Website deployed to new site successfully",
            url: result.ssl_url || result.url,
            deployId: result.deploy_id,
            newSite: true
          });
          return;
        }

        // Check if the existing Netlify site exists (only if we have a siteId stored)
        let siteId = website.netlifySiteId;
        let siteExists = false;

        if (siteId) {
          try {
            await netlifyService.getSite(resolvedNetlifyKey, siteId);
            console.log(`Netlify site ${siteId} found, proceeding with update`);
            siteExists = true;
          } catch (error) {
            console.log(`Warning: Netlify site ${siteId} not accessible. Continuing as new deployment.`);
          }
        }

        // Get the latest website data from database before deployment
        const latestWebsite = await storage.getWebsite(id);
        if (!latestWebsite) {
          throw new Error("Website not found during redeploy");
        }

        // Always use deployToNetlify service to ensure correct URL generation for SEO files
        // deployToNetlify is imported statically at the top

        if (siteExists) {
          // For existing sites, get the site name from URL and redeploy with correct URLs
          const siteName = website.netlifyUrl?.match(/https:\/\/([^.]+)\.netlify\.app/)?.[1] || website.netlifySiteId || `website-${Date.now().toString().slice(-6)}`;

          // Determine SEO URL for existing site redeploy
          let seoUrl;
          if (customDomain && customDomain.trim()) {
            seoUrl = customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim()}`;
          } else {
            seoUrl = website.netlifyUrl || `https://${siteName}.netlify.app`;
          }

          console.log("Using SEO URL for existing site redeploy:", seoUrl);
          const provider = (latestWebsite.businessData as any).contentAiProvider || 'openai';
          const aiGeneratedContent = await generateAIContentForDynamicPages(latestWebsite.businessData as any, latestWebsite.userId, provider);
          // Ensure blog posts are included in businessData
          const businessDataWithBlogs = normalizeBusinessDataForGeneration({
            ...(latestWebsite.businessData as any),
            blogPosts: (latestWebsite.businessData as any).blogPosts || []
          });
          let websiteFiles = generateAllWebsiteFiles(businessDataWithBlogs, latestWebsite.selectedTemplate || latestWebsite.template, seoUrl, undefined, aiGeneratedContent);
          websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, latestWebsite.customFiles).mergedFiles;

          // Use deployToNetlify for existing sites too to ensure correct URL generation
          const result = await deployToNetlify(websiteFiles, resolvedNetlifyKey, siteName);

          // Update website with deployment info
          await storage.updateWebsite(id, {
            netlifyUrl: result.ssl_url || result.url,
            netlifySiteId: result.name,
            netlifyDeploymentStatus: "deployed",
            lastDeployedAt: new Date()
          });

          res.json({
            message: "Website redeployed successfully",
            url: result.ssl_url || result.url,
            deployId: result.deploy_id
          });
        } else {
          // Site doesn't exist, create new site with correct URLs
          const siteName = website.netlifyUrl?.match(/https:\/\/([^.]+)\.netlify\.app/)?.[1] || `website-${Date.now().toString().slice(-6)}`;

          // Determine SEO URL for new site creation
          let seoUrl;
          if (customDomain && customDomain.trim()) {
            seoUrl = customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim()}`;
          } else {
            seoUrl = `https://${siteName}.netlify.app`;
          }

          console.log("Using SEO URL for recreated site redeploy:", seoUrl);
          const provider = (latestWebsite.businessData as any).contentAiProvider || 'openai';
          const aiGeneratedContent = await generateAIContentForDynamicPages(latestWebsite.businessData as any, latestWebsite.userId, provider);
          // Ensure blog posts are included in businessData
          const businessDataWithBlogs = normalizeBusinessDataForGeneration({
            ...(latestWebsite.businessData as any),
            blogPosts: (latestWebsite.businessData as any).blogPosts || []
          });
          let websiteFiles = generateAllWebsiteFiles(businessDataWithBlogs, latestWebsite.selectedTemplate || latestWebsite.template, seoUrl, undefined, aiGeneratedContent);
          websiteFiles = mergeWebsiteFilesWithCustomFiles(websiteFiles, latestWebsite.customFiles).mergedFiles;
          const result = await deployToNetlify(websiteFiles, resolvedNetlifyKey, siteName);

          // Update with deployment info - keep same website, just update deployment details
          await storage.updateWebsite(id, {
            netlifyUrl: result.ssl_url || result.url,
            netlifySiteId: result.name,
            netlifyDeploymentStatus: "deployed",
            lastDeployedAt: new Date()
          });

          res.json({
            message: "Website redeployed successfully",
            url: result.ssl_url || result.url,
            deployId: result.deploy_id
          });
        }
      } catch (deployError) {
        // Update deployment status to failed
        await storage.updateWebsite(id, {
          netlifyDeploymentStatus: "failed"
        });
        throw deployError;
      }
    } catch (error) {
      console.error("Error redeploying website:", error);
      res.status(500).json({
        message: "Failed to redeploy website",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/test-netlify", async (req, res) => {
    try {
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "Netlify API key is required" });
      }

      const isValid = await netlifyService.testConnection(apiKey);

      if (isValid) {
        res.json({
          success: true,
          message: "Netlify API connection successful"
        });
      } else {
        res.status(400).json({ error: "Invalid Netlify API key or connection failed" });
      }
    } catch (error) {
      console.error("Netlify test failed:", error);
      res.status(400).json({
        error: "Unable to connect to Netlify API"
      });
    }
  });

  app.post("/api/netlify/check-site-availability", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const siteName = normalizeNetlifySiteName(req.body?.siteName);
      const websiteId = stringValue(req.body?.websiteId);
      let apiKey = stringValue(req.body?.apiKey);

      if (!siteName) {
        return res.status(400).json({
          available: false,
          message: "Enter a valid Netlify site name first."
        });
      }

      const currentWebsite = websiteId ? await storage.getWebsite(websiteId) : null;
      if (currentWebsite && currentWebsite.userId !== userId) {
        return res.status(404).json({
          available: false,
          message: "Website not found."
        });
      }

      if (!apiKey || apiKey.includes('•')) {
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (setting?.apiKey) {
          try {
            apiKey = decrypt(setting.apiKey);
          } catch {
            apiKey = setting.apiKey;
          }
        }
      }

      if (!apiKey) {
        return res.status(400).json({
          available: false,
          message: "Netlify API token required. Verify it in the Deploy tab first."
        });
      }

      const userWebsites = await storage.listUserWebsites(userId);
      const conflictingWebsite = userWebsites.find((website) => {
        if (websiteId && String(website.id) === websiteId) return false;
        return extractNetlifySiteName(website) === siteName;
      });

      if (conflictingWebsite) {
        const conflictName = stringValue((conflictingWebsite.businessData as any)?.businessName || conflictingWebsite.title) || "another website";
        return res.json({
          available: false,
          reusable: false,
          message: `"${siteName}.netlify.app" is already connected to ${conflictName} in your account.`
        });
      }

      const currentWebsiteSiteName = extractNetlifySiteName(currentWebsite);
      const { NetlifyAPI } = await import('netlify');
      const netlify = new NetlifyAPI(apiKey);

      let ownedSite: any = null;
      try {
        const sites = await netlify.listSites({ name: siteName });
        if (Array.isArray(sites)) {
          ownedSite = sites.find((site: any) => site?.name === siteName) || null;
        }
      } catch (error) {
        console.warn("Netlify listSites failed during availability check:", error);
      }

      if (ownedSite) {
        if (currentWebsiteSiteName === siteName) {
          return res.json({
            available: true,
            reusable: true,
            message: `"${siteName}.netlify.app" is your current Netlify site. You can update it.`
          });
        }

        return res.json({
          available: false,
          reusable: true,
          message: `"${siteName}.netlify.app" already exists in your Netlify account. Use a different name here to avoid overwriting another site.`
        });
      }

      let temporarySiteId: string | null = null;
      try {
        const temporarySite = await netlify.createSite({ body: { name: siteName } });
        temporarySiteId = temporarySite?.id || null;
      } catch (error) {
        return res.json({
          available: false,
          reusable: false,
          message: getNetlifyErrorMessage(error, siteName)
        });
      } finally {
        if (temporarySiteId) {
          try {
            await fetch(`https://api.netlify.com/api/v1/sites/${temporarySiteId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });
          } catch (cleanupError) {
            console.warn("Temporary Netlify site cleanup failed:", cleanupError);
          }
        }
      }

      return res.json({
        available: true,
        reusable: false,
        message: `"${siteName}.netlify.app" is available. You can publish with this name.`
      });
    } catch (error) {
      console.error("Netlify site availability check failed:", error);
      return res.status(500).json({
        available: false,
        message: getNetlifyErrorMessage(error)
      });
    }
  });

  // Future API: Add more blog posts to existing website
  app.post("/api/websites/:id/add-blog-posts", async (req, res) => {
    try {
      const { id } = req.params;
      const { blogTitles, blogAiProvider, blogPromptId, blogWordCount } = req.body;

      // Get existing website
      const website = await storage.getWebsite(id);
      if (!website) {
        return res.status(404).json({ success: false, error: "Website not found" });
      }

      // Validate blog titles (max 30 total including existing)
      const newTitles = blogTitles.split('\n').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      const existingBlogCount = ((website.businessData as any).blogPosts || []).length || 0;

      if (existingBlogCount + newTitles.length > 30) {
        return res.status(400).json({
          success: false,
          error: `Maximum 30 blog articles total. You have ${existingBlogCount} existing articles. You can add ${30 - existingBlogCount} more.`
        });
      }

      // Get user's API settings for AI generation
      const userId = (req as any).user?.id || 'guest';
      const apiSetting = await storage.getApiSetting(userId, blogAiProvider || 'openai');

      if (!apiSetting || !apiSetting.isActive || !apiSetting.apiKey) {
        return res.status(400).json({
          success: false,
          error: `${blogAiProvider || 'OpenAI'} API key not configured. Please set up your API key first.`
        });
      }

      // Get blog prompt
      const blogPrompt = await storage.getBlogPrompt(blogPromptId);
      if (!blogPrompt) {
        return res.status(400).json({ success: false, error: "Blog prompt not found" });
      }

      // Generate new blog posts
      let newBlogPosts: any[] = [];
      if (blogAiProvider === 'openrouter') {
        newBlogPosts = await generateMultipleBlogPostsWithOpenRouter(
          newTitles,
          blogPrompt.prompt,
          website,
          apiSetting.apiKey,
          blogWordCount || 1500
        );
      } else if (blogAiProvider === 'deepseek') {
        const { generateMultipleBlogPostsWithDeepSeek } = await import("./services/deepseek.js");
        newBlogPosts = await generateMultipleBlogPostsWithDeepSeek(
          newTitles,
          blogPrompt.prompt,
          website,
          apiSetting.apiKey,
          blogWordCount || 1500
        );
      } else {
        const { generateMultipleBlogPosts } = await import('./services/openai');
        newBlogPosts = await generateMultipleBlogPosts(
          newTitles,
          blogPrompt.prompt,
          website.businessData,
          apiSetting.apiKey,
          blogWordCount || 1500,
          process.env.UNSPLASH_ACCESS_KEY
        );
      }

      // Add new posts to existing website
      const existingBlogPosts = ((website.businessData as any).blogPosts || []);
      const updatedBlogPosts = [...existingBlogPosts, ...newBlogPosts];
      // Update the businessData to include the new blog posts
      const updatedBusinessData = {
        ...(website.businessData as any),
        blogPosts: updatedBlogPosts,
        generateBlog: true
      };

      const updatedWebsite = await storage.updateWebsite(id, {
        businessData: updatedBusinessData
      });

      // TODO: Future - Update Netlify deployment with new blog posts
      // This would require regenerating the website files and redeploying
      // For now, we just update the stored data

      res.json({
        success: true,
        message: `Successfully added ${newBlogPosts.length} new blog posts to website`,
        totalPosts: updatedBlogPosts.length
      });

    } catch (error) {
      console.error('Error adding blog posts:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add blog posts'
      });
    }
  });

  // NEW MASS AI PAGE GENERATOR ENDPOINT FOR SITE CONFIGURATOR
  app.post("/api/websites/generate-content", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { businessData, provider } = req.body;

      if (!businessData) {
        return res.status(400).json({ error: "Missing businessData for generation" });
      }

      // We explicitly check if they are authorized to use AI
      const user = await storage.getUser(userId);
      if (user?.role !== 'user' && user?.role !== 'paid' && user?.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized for AI generation." });
      }

      const providerOrder = getAIProviderOrder(
        provider,
        businessData?.contentAiProvider,
        businessData?.aiProvider
      );

      let resolvedProvider = providerOrder[0] || 'gemini';
      let apiKey: string | null = null;

      for (const candidateProvider of providerOrder) {
        const candidateApiKey = await getAIProviderConfig(userId, candidateProvider);
        if (candidateApiKey) {
          resolvedProvider = candidateProvider;
          apiKey = candidateApiKey;
          break;
        }
      }

      if (!apiKey) {
        return res.status(400).json({
          error: `Missing API Key for providers: ${providerOrder.join(', ')}`
        });
      }

      console.log(`Starting Mass Page Build via Configurator for user ${userId} using ${resolvedProvider}`);

      // Use the existing solid dynamic generation pipeline
      const aiContent = await generateAIContentForDynamicPages(businessData, userId, resolvedProvider);

      res.json({
        success: true,
        message: `Generated ${aiContent.serviceContent.length} service pages and ${aiContent.locationContent.length} location pages using ${resolvedProvider}.`,
        provider: resolvedProvider,
        data: aiContent
      });

    } catch (error) {
      console.error("Mass AI Page Generator Error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate AI pages"
      });
    }
  });

  // ── Water Damage Website Generator ──────────────────────────────────────────
  // Generates a complete static HTML website for water damage restoration businesses
  // Uses the dedicated water-damage-generator.ts template (SEO-optimized, lead-gen focused)
  app.post("/api/generate-wd-website", allowGuestWebsiteGeneration, async (req, res) => {
    try {
      let {
        categoryId,
        businessName, phone, email, address, city, state, country,
        primaryKeyword, secondaryKeyword, services, serviceAreas,
        urlSlug: rawUrlSlug, primaryColor, secondaryColor, contactFormEmbed,
        yearsInBusiness, aiModel,
        // API keys — any one of these works
        openrouterApiKey, openaiApiKey, geminiApiKey,
        // Provider preference: 'openai' | 'gemini' | 'openrouter' | 'deepseek' (default: auto-detect)
        aiProvider,
        // When true, return JSON {files, websiteId} instead of ZIP
        returnFiles,
        // For updating an existing website record
        websiteId: existingWebsiteId,
        // Extra fields passed from editor (preserve as-is)
        customImages, facebookUrl, instagramUrl, googleUrl, yelpUrl, twitterUrl,
        floatingCTA, whatsappNumber, logoUrl, logoAlt, licenseNumber, insuranceInfo,
        aboutContent, teamDescription, galleryImages,
        generateBlog, enableMatrixPages, hideBeforeAfter, businessHours, publishTier,
        // AI Content fields to avoid 504 and reuse copy
        homepageContent: reqHomepageContent,
        serviceContent: reqServiceContent,
        locationContent: reqLocationContent,
        _aiIntroParas, _aiFaqs, _aiSeoBody, _aiProcessSteps, _aiWhyChooseUs,
        _aiAboutContent, _aiTestimonials, _aiServiceDescs,
      } = req.body;

      // Robust fallback values for missing/empty required fields to prevent zip download failure
      if (!businessName) businessName = "My Business";
      if (!phone) phone = "(555) 555-5555";
      if (!city) city = "Toledo";
      if (!state) state = "OH";
      if (!services || (Array.isArray(services) && services.length === 0) || services === "") {
        services = ["Service 1", "Service 2", "Service 3"];
      }
      if (!serviceAreas || (Array.isArray(serviceAreas) && serviceAreas.length === 0) || serviceAreas === "") {
        serviceAreas = [city];
      }

      // Auto-generate urlSlug from businessName if blank
      const urlSlug = rawUrlSlug || (businessName ? businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'website');

      if (!businessName || !phone || !city || !state || !services || !serviceAreas || !urlSlug) {
        return res.status(400).json({ error: "Missing required fields: businessName, phone, city, state, services, serviceAreas, urlSlug" });
      }

      const domain = urlSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Resolve provider + API key (priority: request body > user DB settings > env vars)
      const userId = (req as any).user?.id || req.session?.userId;

      let resolvedProvider: AIProvider = 'openrouter';
      let apiKey: string | null = null;

      // 1. Check keys passed directly in request body
      if (openaiApiKey) { resolvedProvider = 'openai'; apiKey = openaiApiKey; }
      else if (geminiApiKey) { resolvedProvider = 'gemini'; apiKey = geminiApiKey; }
      else if (openrouterApiKey) { resolvedProvider = 'openrouter'; apiKey = openrouterApiKey; }
      else if (process.env.DEEPSEEK_API_KEY) { resolvedProvider = 'deepseek'; apiKey = process.env.DEEPSEEK_API_KEY; }

      // 2. Check user DB settings if no key in request
      if (!apiKey && userId && userId !== 'guest') {
        const settings = await storage.listApiSettings(userId);
        // Try in preference order: user-specified provider first, then openai, gemini, openrouter
        const providerOrder: AIProvider[] = aiProvider
          ? [aiProvider, 'openai', 'gemini', 'openrouter']
          : ['openai', 'gemini', 'openrouter', 'deepseek'];
        for (const p of providerOrder) {
          const setting = settings?.find((s: any) => s.name === p && s.isActive && s.apiKey);
          if (setting?.apiKey) {
            apiKey = await decrypt(setting.apiKey) || setting.apiKey;
            resolvedProvider = p;
            break;
          }
        }
      }

      // 3. Fall back to env vars
      if (!apiKey) {
        if (process.env.OPENAI_API_KEY) { apiKey = process.env.OPENAI_API_KEY; resolvedProvider = 'openai'; }
        else if (process.env.GEMINI_API_KEY) { apiKey = process.env.GEMINI_API_KEY; resolvedProvider = 'gemini'; }
        else if (process.env.OPENROUTER_API_KEY) { apiKey = process.env.OPENROUTER_API_KEY; resolvedProvider = 'openrouter'; }
        else if (process.env.DEEPSEEK_API_KEY) { apiKey = process.env.DEEPSEEK_API_KEY; resolvedProvider = 'deepseek'; }
      }

      const bizContext = {
        name: businessName,
        type: primaryKeyword || 'Water Damage Restoration',
        primaryCity: city,
        locations: Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split('\n').filter(Boolean),
        services: Array.isArray(services) ? services : services.split('\n').filter(Boolean),
        nicheKeywords: [primaryKeyword, secondaryKeyword].filter(Boolean),
        yearsInBusiness: yearsInBusiness || '10+',
        usp: 'Licensed, insured, IICRC certified, 24/7 emergency response, free estimates',
        phone,
        address,
      };

      const parsedServices: string[] = Array.isArray(services) ? services : services.split('\n').filter(Boolean);
      const parsedLocations: string[] = Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split('\n').filter(Boolean);

      const serviceSlugMap = parsedServices.map(s => ({
        service: s,
        slug: `/services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
      }));
      const locationSlugMap = parsedLocations.map(l => ({
        city: l,
        slug: `/locations/${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
      }));

      // Generate AI content for pages (if API key available)
      // When returnFiles=true (editor preview), only generate homepage AI content
      // to avoid Vercel's 60s timeout with large service/location lists.
      // Full AI generation runs when downloading (returnFiles=false).
      let homepageContent: any = reqHomepageContent;
      const serviceContent: Record<string, any> = reqServiceContent || {};
      const locationContent: Record<string, any> = reqLocationContent || {};

      const hasHomepageContent = homepageContent || (_aiIntroParas && _aiFaqs && _aiSeoBody && _aiProcessSteps);

      if (apiKey && !hasHomepageContent) {
        try {
          // Homepage content (always generated)
          const homePrompt = buildHomePagePrompt(bizContext, serviceSlugMap.map(s => s.slug), locationSlugMap.map(l => l.slug));
          homepageContent = await generateStructuredJsonWithProvider(resolvedProvider, apiKey, homePrompt, { maxTokens: 6500, temperature: 0.7 });
        } catch (e) { console.error('Homepage AI error:', e); }

        // Service & location pages — only when NOT in preview mode (avoids timeout)
        if (!returnFiles) {
          for (const service of parsedServices) {
            try {
              const otherServices = parsedServices.filter(s => s !== service).map(s => `/services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`);
              const serviceSlug = `/services/${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
              const servicePrompt = buildServicePagePrompt(bizContext, service, serviceSlug, locationSlugMap, otherServices);
              serviceContent[service] = await generateStructuredJsonWithProvider(resolvedProvider, apiKey, servicePrompt, { maxTokens: 6000, temperature: 0.7 });
            } catch (e) { console.error(`Service AI error for ${service}:`, e); }
          }

          for (const location of parsedLocations) {
            try {
              const locationPrompt = buildLocationPagePrompt(bizContext, location, serviceSlugMap, []);
              locationContent[location] = await generateStructuredJsonWithProvider(resolvedProvider, apiKey, locationPrompt, { maxTokens: 6000, temperature: 0.7 });
            } catch (e) { console.error(`Location AI error for ${location}:`, e); }
          }
        }
      }

      // Resolve categoryId (priority: req.body.categoryId > existing website's categoryId/template > 'water-damage')
      let resolvedCategoryId = categoryId;
      if (!resolvedCategoryId && existingWebsiteId) {
        try {
          const existingWebsite = await storage.getWebsite(existingWebsiteId);
          if (existingWebsite) {
            resolvedCategoryId = (existingWebsite.businessData as any)?.categoryId || existingWebsite.template;
          }
        } catch (e) {
          console.error("Error fetching existing website to resolve categoryId:", e);
        }
      }
      if (!resolvedCategoryId) {
        resolvedCategoryId = 'water-damage';
      }

      // Build website data object
      const wdData = {
        categoryId: resolvedCategoryId,
        businessName, phone, email, address, city, state, country: country || 'US',
        primaryKeyword: primaryKeyword || 'Water Damage Restoration',
        secondaryKeyword,
        services: parsedServices,
        serviceAreas: parsedLocations,
        urlSlug: domain,
        primaryColor: primaryColor || '#1e3a5f',
        secondaryColor: secondaryColor || '#0ea5e9',
        contactFormEmbed,
        yearsInBusiness,
        // Persist API keys in businessData so they survive reloads
        openaiApiKey: openaiApiKey || undefined,
        geminiApiKey: geminiApiKey || undefined,
        homepageContent,
        serviceContent: Object.keys(serviceContent).length > 0 ? serviceContent : undefined,
        locationContent: Object.keys(locationContent).length > 0 ? locationContent : undefined,
        // Pass through AI content fields
        _aiIntroParas: _aiIntroParas || undefined,
        _aiFaqs: _aiFaqs || undefined,
        _aiSeoBody: _aiSeoBody || undefined,
        _aiProcessSteps: _aiProcessSteps || undefined,
        _aiWhyChooseUs: _aiWhyChooseUs || undefined,
        _aiAboutContent: _aiAboutContent || undefined,
        _aiTestimonials: _aiTestimonials || undefined,
        _aiServiceDescs: _aiServiceDescs || undefined,
        // Preserve all extra fields the editor passes through
        customImages: customImages || undefined,
        facebookUrl: facebookUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        googleUrl: googleUrl || undefined,
        yelpUrl: yelpUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        floatingCTA: floatingCTA || undefined,
        whatsappNumber: whatsappNumber || undefined,
        logoUrl: logoUrl || undefined,
        logoAlt: logoAlt || undefined,
        licenseNumber: licenseNumber || undefined,
        insuranceInfo: insuranceInfo || undefined,
        aboutContent: aboutContent || undefined,
        teamDescription: teamDescription || undefined,
        galleryImages: Array.isArray(galleryImages) && galleryImages.length > 0 ? galleryImages : undefined,
        blogPosts: Array.isArray(req.body.blogPosts) && req.body.blogPosts.length > 0 ? req.body.blogPosts : undefined,
        generateBlog: generateBlog ?? undefined,
        enableMatrixPages: enableMatrixPages ?? undefined,
        hideBeforeAfter: hideBeforeAfter ?? undefined,
        businessHours: businessHours || undefined,
        publishTier: publishTier || undefined,
      };

      // Generate all HTML files using the local service engine
      const { generateLocalServiceWebsite } = await import('../client/src/lib/local-service-engine.js');
      const files = generateLocalServiceWebsite(resolvedCategoryId, wdData, domain);

      // Save/update website record if authenticated user.
      // When returnFiles=true (editor preview), also persist the generated files
      // directly to customFiles so they survive page refresh without re-generating.
      let savedWebsiteId: string | undefined = existingWebsiteId;
      if (userId && userId !== 'guest') {
        try {
          const filesToPersist = returnFiles ? (files as any) : null;
          if (existingWebsiteId) {
            const updatePayload: any = { businessData: wdData as any };
            if (filesToPersist) updatePayload.customFiles = filesToPersist;
            await storage.updateWebsite(existingWebsiteId, updatePayload);
          } else {
            const website = await storage.createWebsite({
              userId,
              title: businessName,
              businessData: wdData as any,
              customFiles: filesToPersist,
              template: resolvedCategoryId,
            });
            savedWebsiteId = website?.id;
          }
        } catch (e) { console.error('Failed to save website:', e); }
      }

      // Return JSON files when requested by editor (for in-browser preview)
      if (returnFiles) {
        return res.json({
          files,
          websiteId: savedWebsiteId,
          pagesGenerated: Object.keys(files).length,
          aiContentGenerated: !!apiKey,
        });
      }

      // Default: return ZIP for download
      const zip = new JSZip();
      for (const [filename, content] of Object.entries(files)) {
        zip.file(filename, content as string);
      }
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${domain}-website.zip"`,
        'X-Website-Id': savedWebsiteId || '',
        'X-Pages-Generated': String(Object.keys(files).length),
      });
      res.send(zipBuffer);

    } catch (error) {
      console.error("WD Website Generator Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate website" });
    }
  });

  // ── Generate AI content for a local service site ────────────────────────────
  // Called from the editor BEFORE deploy. Generates unique copy and saves it
  // to businessData so rebuildPreview() picks it up immediately.
  // ── Background Job & Compilation Helpers ─────────────────────────────────────

  async function performNetlifyDeploy(
    websiteId: string,
    userId: string,
    netlifyApiKey: string,
    siteName: string,
    publishTier: '1' | '2' | '3'
  ): Promise<{ url: string; siteName: string }> {
    const website = await storage.getWebsite(websiteId);
    if (!website || website.userId !== userId) {
      throw new Error("Website not found");
    }

    const bd = { ...((website.businessData || {}) as any) };
    bd.publishTier = publishTier;

    // Fallbacks for missing/empty required fields to protect performNetlifyDeploy from crashing
    if (!bd.businessName) bd.businessName = website.title || "My Business";
    if (!bd.phone) bd.phone = "(555) 555-5555";
    if (!bd.city) bd.city = "Toledo";
    if (!bd.state) bd.state = "OH";

    bd.services = uniqueValues([
      ...parseDeployList(bd.services),
      ...parseDeployList(bd.additionalServices),
    ]);
    if (bd.services.length === 0) {
      bd.services = ["Service 1", "Service 2", "Service 3"];
    }

    bd.serviceAreas = uniqueValues([
      ...parseDeployList(bd.serviceAreas, { locationMode: true, preferredState: stringValue(bd.state) }),
      ...parseDeployList(bd.additionalLocations, { locationMode: true, preferredState: stringValue(bd.state) }),
    ]);
    if (bd.serviceAreas.length === 0) {
      bd.serviceAreas = [bd.city];
    }

    const rawDomain = siteName || bd.urlSlug || (bd.businessName || website.title || 'my-site');
    const domain = rawDomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 63);

    if (!domain) {
      throw new Error("Site name is required.");
    }

    const categoryId = bd.categoryId || website.template || 'water-damage';
    const { getCategoryConfig: getCC2, generateLocalServiceWebsite: genLS } = await import('../client/src/lib/local-service-engine.js');

    // Homepage content check (fallback)
    const hasAiContent = bd._aiIntroParas || bd._aiFaqs || bd._aiSeoBody || bd._aiProcessSteps;
    if (!hasAiContent) {
      try {
        const catConfig = getCC2(categoryId);
        const aiContent = await generateLocalServiceAIContent(
          bd, userId, catConfig.name, catConfig.defaultPrimaryKeyword
        );
        if (aiContent) {
          if (aiContent.introParas) bd._aiIntroParas = aiContent.introParas;
          if (aiContent.faqs) bd._aiFaqs = aiContent.faqs;
          if (aiContent.seoBody) bd._aiSeoBody = aiContent.seoBody;
          if (aiContent.processSteps) bd._aiProcessSteps = aiContent.processSteps;
        }
      } catch (aiErr) {
        console.error('AI content injection skipped in deploy:', aiErr);
      }
    }

    // Favicon conversion
    let faviconBinary: Buffer | null = null;
    let faviconFilename: string | null = null;
    if (bd.faviconUrl && typeof bd.faviconUrl === 'string' && bd.faviconUrl.startsWith('data:')) {
      const fmatch = bd.faviconUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\n]+)$/);
      if (fmatch) {
        const rawType = fmatch[1];
        const ext = /x-icon|vnd\.microsoft\.icon/.test(rawType) ? 'ico'
          : rawType === 'image/svg+xml' ? 'svg'
            : rawType === 'image/jpeg' ? 'jpg' : 'png';
        faviconFilename = `favicon.${ext}`;
        faviconBinary = Buffer.from(fmatch[2].replace(/\n/g, ''), 'base64');
        bd.faviconUrl = `/${faviconFilename}`;
      }
    }

    const deployedServiceAreas = uniqueValues(
      (bd.serviceAreas as string[])
        .map((location: string) => normalizeLocationLabel(location, stringValue(bd.state)))
        .filter(Boolean)
    );
    const deployedCity =
      normalizeLocationLabel(
        stringValue(bd.city) || stringValue(bd.heroLocation) || deployedServiceAreas[0],
        stringValue(bd.state)
      ) ||
      stringValue(bd.city) ||
      deployedServiceAreas[0] ||
      "";

    const generatorData = {
      ...bd,
      city: deployedCity,
      serviceAreas: deployedServiceAreas,
      locationContent: normalizeLocationContentMap(bd.locationContent, stringValue(bd.state)),
    };

    const files = genLS(categoryId, generatorData, domain);

    // Apply custom files overrides
    const seoProtectedFiles = new Set(['sitemap.html']);
    const storedCustomFiles = website.customFiles as Record<string, string> | null;
    if (storedCustomFiles && typeof storedCustomFiles === 'object') {
      const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(categoryId);
      let skipCustomFiles = false;

      if (!isRestoration) {
        // If stored index.html contains hardcoded water damage project titles, the custom files are stale
        const indexHtml = storedCustomFiles['index.html'] || '';
        if (
          indexHtml.includes('Water Extraction & Cleanup') ||
          indexHtml.includes('Rapid Structural Drying') ||
          indexHtml.includes('Mold Containment & Removal')
        ) {
          console.log(`[deploy] Stale water damage content detected in stored custom files for category ${categoryId}. Skipping overrides.`);
          skipCustomFiles = true;
        }
      }

      if (!skipCustomFiles) {
        for (const [filename, content] of Object.entries(storedCustomFiles)) {
          if (typeof content === 'string' && filename.endsWith('.html') && !seoProtectedFiles.has(filename)) {
            // Do not let stale/legacy customFiles overwrite dynamic pages (blog, services, locations, matrix)
            // to ensure changes in blog posts, service lists, or location lists propagate correctly.
            const isDynamicPage = filename === 'blog.html' || 
                                  filename.startsWith('blog/') || 
                                  filename.startsWith('services/') || 
                                  filename.startsWith('locations/') || 
                                  filename.startsWith('matrix/');
            if (isDynamicPage) {
              continue;
            }

            (files as any)[filename] = content
              .replace(/\{\{city\}\}/g, generatorData.city || '')
              .replace(/\{\{state\}\}/g, generatorData.state || '')
              .replace(/\{\{businessName\}\}/g, generatorData.businessName || '');
          }
        }
      }
    }

    // Ensure footer style fixes are applied to all HTML files (both custom overrides and generated pages)
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content === 'string' && filename.endsWith('.html')) {
        (files as any)[filename] = content
          .replace(/class="footer-inner has-two-cols"/g, 'class="footer-inner has-two-cols" style="grid-template-columns: 1fr 1fr;"')
          .replace(/class="footer-phone"/g, 'class="footer-phone" style="white-space: nowrap;"');
      }
    }

    // Apply customImages
    if (bd.customImages && typeof bd.customImages === 'object' && Object.keys(bd.customImages).length > 0) {
      for (const [filename, html] of Object.entries(files as Record<string, string>)) {
        if (!filename.endsWith('.html') || typeof html !== 'string') continue;
        let updated = html as string;
        for (const [key, customSrc] of Object.entries(bd.customImages as Record<string, string>)) {
          if (!customSrc) continue;
          updated = updated.replace(
            new RegExp(`(<img[^>]*data-placeholder="${key}"[^>]*)src="[^"]*"`, 'gs'),
            `$1src="${customSrc}"`
          );
          updated = updated.replace(
            new RegExp(`(<img[^>]*)src="[^"]*"([^>]*data-placeholder="${key}")`, 'gs'),
            `$1src="${customSrc}"$2`
          );
        }
        (files as any)[filename] = updated;
      }
    }

    // Correct base domain
    const correctBase = `https://${domain}.netlify.app`;
    for (const [filename, content] of Object.entries(files)) {
      if (typeof content !== 'string') continue;
      const fixed = (content as string).replace(
        /https:\/\/[a-z0-9][-a-z0-9]*\.netlify\.app/gi,
        correctBase
      );
      if (fixed !== content) {
        (files as any)[filename] = fixed;
      }
    }

    // Extract base64 image data-urls
    const extractedImages = new Map<string, string>();
    let imgIndex = 0;
    const processedFiles: Record<string, string> = {};
    for (const [filename, rawContent] of Object.entries(files)) {
      const processed = (rawContent as string).replace(
        /data:image\/(jpeg|png|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+/g,
        (match) => {
          if (extractedImages.has(match)) return extractedImages.get(match)!;
          const typeStr = match.match(/^data:image\/([^;]+);/)?.[1] ?? 'jpeg';
          const ext = typeStr === 'svg+xml' ? 'svg' : typeStr === 'jpeg' ? 'jpg' : typeStr;
          const imgPath = `/images/custom-${imgIndex++}.${ext}`;
          extractedImages.set(match, imgPath);
          return imgPath;
        }
      );
      processedFiles[filename] = processed;
    }

    // Build ZIP
    const zip = new JSZip();
    for (const [filename, content] of Object.entries(processedFiles)) {
      zip.file(filename, content);
    }
    for (const [dataUrl, imgPath] of extractedImages.entries()) {
      const base64 = dataUrl.split(',')[1];
      zip.file(imgPath.slice(1), Buffer.from(base64, 'base64'));
    }
    if (faviconFilename && faviconBinary) {
      zip.file(faviconFilename, faviconBinary);
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    // Resolve or create Netlify site
    const { NetlifyAPI } = await import('netlify');
    const netlify = new NetlifyAPI(netlifyApiKey);
    let site: any;
    try {
      const sites = await netlify.listSites({ name: domain });
      site = (sites as any[]).find((s: any) => s.name === domain);
    } catch { /* will create */ }

    if (!site) {
      try {
        site = await netlify.createSite({ body: { name: domain } });
      } catch (error) {
        throw new Error(getNetlifyErrorMessage(error, domain));
      }
    }

    // Upload ZIP
    const uploadRes = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${netlifyApiKey}`, 'Content-Type': 'application/zip' },
      body: new Uint8Array(zipBuffer) as any,
    });
    if (!uploadRes.ok) {
      const msg = await uploadRes.text().catch(() => uploadRes.statusText);
      throw new Error(`Netlify upload failed (${uploadRes.status}): ${msg}`);
    }

    const siteUrl = `https://${domain}.netlify.app`;

    // Update DB
    await storage.updateWebsite(websiteId, {
      netlifyUrl: siteUrl,
      netlifyDeploymentStatus: 'deployed',
      lastDeployedAt: new Date(),
    });

    // Ping search engines
    const sitemapUrl = encodeURIComponent(`${siteUrl}/sitemap.xml`);
    Promise.all([
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => { }),
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(() => { }),
    ]).catch(() => { });

    return { url: siteUrl, siteName: domain };
  }

  async function runBackgroundGenerationAndDeploy(
    websiteId: string,
    userId: string,
    publishTier: '1' | '2' | '3',
    netlifyApiKey?: string,
    siteName?: string,
    force?: boolean
  ) {
    try {
      const website = await storage.getWebsite(websiteId);
      if (!website) return;

      let bd = normalizeBusinessDataForGeneration({ ...((website.businessData || {}) as any) });
      bd.publishTier = publishTier;
      bd.generationStatus = 'generating';
      bd.generationProgress = 5;
      bd.generationError = null;
      await storage.updateWebsite(websiteId, { businessData: bd });

      const categoryId = bd.categoryId || website.template || 'water-damage';
      const { getCategoryConfig: getCC } = await import('../client/src/lib/local-service-engine.js');
      const catConfig = getCC(categoryId);

      const provider = bd.contentAiProvider || 'openai';
      const apiKey = await getAIProviderConfig(userId, provider);

      // Real-time AI Image Generation for Dumpster-Rental Category
      if (categoryId === 'dumpster-rental') {
        console.log(`[Background Job] Generating real-time AI images for dumpster-rental site: ${websiteId}`);
        bd.customImages = bd.customImages || {};
        
        // Define the image slots to generate
        const dumpsterImageQueries = {
          'hero-bg': 'roll-off dumpster rental container bin',
          'main-image': 'clean dumpster rental delivery truck',
          'about-image': 'eco-friendly waste recycling dumpster',
          'service-image': 'roll-off dumpster driveway drop-off',
          'location-image': 'dumpster bin placement residential',
          'about-team-photo': 'friendly waste management team professional',
          'gallery-normal-0': 'residential driveway dumpster container',
          'gallery-normal-1': 'commercial site roll-off dumpster',
          'gallery-normal-2': 'yard waste landscaping dumpster',
          'gallery-before-0': 'cluttered messy garage cleanout junk',
          'gallery-after-0': 'clean empty garage space',
          'gallery-before-1': 'construction site debris pile wood metal',
          'gallery-after-1': 'clean construction site with dumpster',
          'gallery-before-2': 'yard waste branches debris pile',
          'gallery-after-2': 'clean yard landscaping with dumpster'
        };

        // Fetch Unsplash API key
        let unsplashKey: string | undefined;
        try {
          const { decrypt } = await import('./crypto.js').catch(() => ({ decrypt: (k: string) => k }));
          const unsplashSetting = await storage.getApiSetting(userId, 'unsplash');
          if (unsplashSetting && (unsplashSetting.apiKey || unsplashSetting.accessKey)) {
            unsplashKey = decrypt(unsplashSetting.accessKey || unsplashSetting.apiKey || "");
          } else {
            unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
          }
        } catch (e) {
          console.warn("Could not get Unsplash API key for dumpster rental image generation");
        }

        // Parallel generate with a concurrency limit of 3
        const keysToGen = Object.keys(dumpsterImageQueries).filter(key => force || !bd.customImages[key]);
        if (keysToGen.length > 0) {
          await pLimit(keysToGen, 3, async (key) => {
            try {
              const query = dumpsterImageQueries[key as keyof typeof dumpsterImageQueries];
              console.log(`[Background Job] Fetching AI image for ${key} with query: "${query}"`);
              const image = await fetchUnsplashImage(query, unsplashKey, 'dumpster-rental');
              if (image && image.url) {
                bd.customImages[key] = image.url;
              }
            } catch (err) {
              console.error(`[Background Job] Failed to generate/fetch image for slot ${key}:`, err);
            }
          });
          // Update database
          await storage.updateWebsite(websiteId, { businessData: { ...bd } });
        }
      }

      // 1. Core/Homepage AI content
      const hasHomepageContent = bd._aiIntroParas && bd._aiFaqs && bd._aiSeoBody && bd._aiProcessSteps;
      if ((force || !hasHomepageContent) && apiKey) {
        console.log(`[Background Job] Generating core/homepage content for ${websiteId}...`);
        const aiContent = await generateLocalServiceAIContent(
          bd, userId, catConfig.name, catConfig.defaultPrimaryKeyword
        );
        if (aiContent) {
          bd._aiIntroParas = aiContent.introParas || bd._aiIntroParas;
          bd._aiFaqs = aiContent.faqs || bd._aiFaqs;
          bd._aiSeoBody = aiContent.seoBody || bd._aiSeoBody;
          bd._aiProcessSteps = aiContent.processSteps || bd._aiProcessSteps;
          bd._aiWhyChooseUs = aiContent.whyChooseUs || bd._aiWhyChooseUs;
          bd._aiAboutContent = aiContent.aboutContent || bd._aiAboutContent;
          bd._aiTestimonials = aiContent.testimonials || bd._aiTestimonials;
          bd._aiServiceDescs = aiContent.serviceDescriptions || bd._aiServiceDescs;

          // Generate homepageContent structure
          const serviceDescriptions = bd._aiServiceDescs || {};
          bd.homepageContent = {
            metaTitle: `${bd.primaryKeyword || catConfig.defaultPrimaryKeyword} in ${bd.city || ''} | ${bd.businessName || 'Local Business'}`.replace(/\s+/g, ' ').trim(),
            metaDescription: `${bd.businessName || 'Local Business'} provides ${bd.primaryKeyword || catConfig.defaultPrimaryKeyword} in ${bd.city || ''}. Contact us for fast, professional service.`.replace(/\s+/g, ' ').trim(),
            hero: {
              h1: `${bd.primaryKeyword || catConfig.defaultPrimaryKeyword} in ${bd.city || 'Your Area'}`,
              subheadline: Array.isArray(bd._aiIntroParas) && bd._aiIntroParas.length > 0 ? bd._aiIntroParas[0] : `${bd.businessName || 'Local Business'} provides trusted service.`,
              primaryCTA: 'Get Free Estimate',
              trustLine: 'Professional service you can trust',
            },
            intro: {
              h2: `About ${bd.businessName || 'Our Company'} in ${bd.city || ''}`.trim(),
              paragraphs: bd._aiIntroParas || [],
            },
            servicesSection: {
              h2: `Our ${bd.city || ''} Services`.trim(),
              intro: `Explore the main services offered by ${bd.businessName || 'our team'}.`,
              cards: (Array.isArray(bd.services) ? bd.services : []).map((service: string) => ({
                service,
                h3: service,
                description: serviceDescriptions[service] || `Professional ${service.toLowerCase()} support for your property.`,
                internalLink: {
                  anchor: service,
                  slug: `/services/${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(bd.city || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
                },
              })),
            },
            whyUsSection: {
              h2: `Why Choose ${bd.businessName || 'Us'}`,
              points: bd._aiWhyChooseUs || [],
            },
            processSection: bd._aiProcessSteps ? { h2: `Our Process`, steps: bd._aiProcessSteps } : undefined,
            locationsSection: {
              h2: `Areas We Serve`,
              body: bd._aiSeoBody || `${bd.businessName || 'Our team'} serves ${bd.city || ''}.`,
              locationLinks: (Array.isArray(bd.serviceAreas) ? bd.serviceAreas : []).map((cityName: string) => ({
                city: cityName,
                anchor: cityName,
                slug: `/locations/${cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
              })),
            },
            faqSection: {
              h2: `Frequently Asked Questions`,
              faqs: bd._aiFaqs || [],
            },
            finalCTA: {
              h2: `Ready to Get Started?`,
              body: bd._aiSeoBody || `Contact ${bd.businessName || 'our team'} today for help in ${bd.city || 'your area'}.`,
              ctaButton: 'Call Now',
              phone: bd.phone || '',
            },
          };
        }
      }

      bd.generationProgress = 15;
      await storage.updateWebsite(websiteId, { businessData: bd });

      // 2. Dynamic pages copy (if Stage 2 or Stage 3)
      if ((publishTier === '2' || publishTier === '3') && apiKey) {
        console.log(`[Background Job] Generating dynamic pages copy for ${websiteId}...`);

        const normalizedBD = normalizeBusinessDataForGeneration(bd);
        const additionalServices = splitValues(
          normalizedBD?.additionalServices ||
          normalizedBD?.services ||
          normalizedBD?.heroService
        ).slice(0, 350);

        const additionalLocations = splitValues(
          normalizedBD?.additionalLocations ||
          normalizedBD?.serviceAreas ||
          normalizedBD?.heroLocation
        ).slice(0, 350);

        const totalItems = additionalServices.length + additionalLocations.length;
        let completedItems = 0;

        bd.serviceContent = bd.serviceContent || {};
        bd.locationContent = bd.locationContent || {};

        // 2a. Services
        if (additionalServices.length > 0) {
          const pendingServices = force ? additionalServices : additionalServices.filter(s => !bd.serviceContent[s]);
          const alreadyDoneCount = force ? 0 : additionalServices.length - pendingServices.length;
          completedItems += alreadyDoneCount;

          if (pendingServices.length > 0) {
            await pLimit(pendingServices, 3, async (service) => {
              try {
                const otherServices = additionalServices.filter(s => s !== service).map(s => `/services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${bd.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`);
                const serviceSlug = `/services/${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${bd.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                const locationSlugMap = additionalLocations.map(l => ({
                  city: l,
                  slug: `/locations/${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
                }));
                const servicePrompt = buildServicePagePrompt(normalizedBD, service, serviceSlug, locationSlugMap, otherServices);
                const content = await generateStructuredJsonWithProvider(provider, apiKey, servicePrompt, { maxTokens: 6000, temperature: 0.7 });

                bd.serviceContent[service] = content;
                completedItems++;
                bd.generationProgress = Math.round(15 + ((completedItems / totalItems) * 70));
                await storage.updateWebsite(websiteId, { businessData: { ...bd } });

                await new Promise(r => setTimeout(r, 500));
              } catch (err) {
                console.error(`[Background Job] Service AI error for ${service}:`, err);
              }
            });
          }
        }

        // 2b. Locations
        if (additionalLocations.length > 0) {
          const pendingLocations = force ? additionalLocations : additionalLocations.filter(l => !bd.locationContent[l]);
          const alreadyDoneCount = force ? 0 : additionalLocations.length - pendingLocations.length;
          completedItems += alreadyDoneCount;

          if (pendingLocations.length > 0) {
            await pLimit(pendingLocations, 3, async (location) => {
              try {
                const serviceSlugMap = additionalServices.map(s => ({
                  service: s,
                  slug: `/services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${bd.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
                }));
                const locationPrompt = buildLocationPagePrompt(normalizedBD, location, serviceSlugMap, []);
                const content = await generateStructuredJsonWithProvider(provider, apiKey, locationPrompt, { maxTokens: 6000, temperature: 0.7 });

                bd.locationContent[location] = content;
                completedItems++;
                bd.generationProgress = Math.round(15 + ((completedItems / totalItems) * 70));
                await storage.updateWebsite(websiteId, { businessData: { ...bd } });

                await new Promise(r => setTimeout(r, 500));
              } catch (err) {
                console.error(`[Background Job] Location AI error for ${location}:`, err);
              }
            });
          }
        }
        // 2c. Background Blog Post Generation
        if (apiKey && Array.isArray(bd.blogPosts) && bd.blogPosts.length > 0) {
          console.log(`[Background Job] Checking blog posts for AI content generation...`);
          const pendingBlogPosts = bd.blogPosts.filter((post: any) => force || !post.content || post.content === "" || post.status === 'draft');
          
          if (pendingBlogPosts.length > 0) {
            console.log(`[Background Job] Generating content for ${pendingBlogPosts.length} blog posts...`);
            
            // Fetch Unsplash API key
            let unsplashKey: string | undefined;
            try {
              const { decrypt } = await import('./crypto.js').catch(() => ({ decrypt: (k: string) => k }));
              const unsplashSetting = await storage.getApiSetting(userId, 'unsplash');
              if (unsplashSetting && (unsplashSetting.apiKey || unsplashSetting.accessKey)) {
                unsplashKey = decrypt(unsplashSetting.accessKey || unsplashSetting.apiKey || "");
              } else {
                unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
              }
            } catch (e) {
              console.warn("Could not get Unsplash API key for background blog generation");
            }

            const businessContext = {
              businessName: bd.businessName,
              category: bd.category || categoryId || catConfig.name,
              heroLocation: `${bd.city || ''}, ${bd.state || ''}`.trim().replace(/^,|,$/g, '').trim() || "Your Area",
              services: bd.services,
              serviceAreas: bd.serviceAreas
            };

            const blogPrompt = bd.blogPromptId ? await storage.getBlogPrompt(bd.blogPromptId) : null;
            const promptText = blogPrompt?.prompt || `Write a comprehensive, engaging blog post that provides real value to readers. Use SEO best practices and include actionable advice.`;

            await pLimit(pendingBlogPosts, 2, async (postToGen) => {
              try {
                console.log(`[Background Job] Generating blog post content for: "${postToGen.title}"`);
                
                let generatedPost;
                if (provider === 'gemini') {
                  const { generateBlogPostWithGemini } = await import('./services/gemini.js');
                  generatedPost = await generateBlogPostWithGemini(
                    postToGen.title,
                    promptText,
                    businessContext,
                    apiKey
                  );
                } else if (provider === 'openrouter') {
                  generatedPost = await generateBlogPostWithOpenRouter(
                    postToGen.title,
                    promptText,
                    businessContext,
                    apiKey
                  );
                } else if (provider === 'deepseek') {
                  const { generateBlogPostWithDeepSeek } = await import("./services/deepseek.js");
                  generatedPost = await generateBlogPostWithDeepSeek(
                    postToGen.title,
                    promptText,
                    businessContext,
                    apiKey
                  );
                } else {
                  generatedPost = await generateBlogPost(
                    postToGen.title,
                    promptText,
                    businessContext,
                    apiKey,
                    unsplashKey
                  );
                }

                if (generatedPost) {
                  bd.blogPosts = bd.blogPosts.map((p: any) => {
                    if (p.id === postToGen.id || p.slug === postToGen.slug) {
                      return {
                        ...p,
                        content: generatedPost.content || p.content,
                        excerpt: generatedPost.excerpt || p.excerpt || postToGen.excerpt,
                        featuredImage: generatedPost.featuredImage || p.featuredImage || postToGen.featuredImage,
                        featuredImageAlt: generatedPost.featuredImageAlt || p.featuredImageAlt || postToGen.featuredImageAlt,
                        status: 'published',
                        isAiGenerated: true
                      };
                    }
                    return p;
                  });
                  
                  await storage.updateWebsite(websiteId, { businessData: { ...bd } });
                }
                await new Promise(r => setTimeout(r, 1000));
              } catch (err) {
                console.error(`[Background Job] Failed to generate blog post "${postToGen.title}":`, err);
              }
            });
          }
        }
      }

      bd.generationProgress = 90;
      await storage.updateWebsite(websiteId, { businessData: bd });

      // 3. Compile and Deploy
      if (netlifyApiKey && siteName) {
        console.log(`[Background Job] Deploying to Netlify...`);
        bd.generationStatus = 'deploying';
        await storage.updateWebsite(websiteId, { businessData: bd });

        await performNetlifyDeploy(websiteId, userId, netlifyApiKey, siteName, publishTier);
      }

      bd.generationStatus = 'completed';
      bd.generationProgress = 100;
      bd.generationError = null;
      await storage.updateWebsite(websiteId, { businessData: bd });
      console.log(`[Background Job] Job completed for ${websiteId}.`);
    } catch (err: any) {
      console.error(`[Background Job] Failed for ${websiteId}:`, err);
      try {
        const website = await storage.getWebsite(websiteId);
        if (website) {
          const bd = { ...((website.businessData || {}) as any) };
          bd.generationStatus = 'failed';
          bd.generationError = err.message || String(err);
          await storage.updateWebsite(websiteId, { businessData: bd });
        }
      } catch {}
    }
  }

  // ── Generate AI content for a local service site ────────────────────────────
  // Triggers background content generation for the homepage and optionally
  // service/location subpages, depending on the selected publishTier.
  app.post("/api/websites/:id/generate-local-ai", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ error: "Website not found" });
      }

      const bd = { ...((website.businessData || {}) as any) };

      // Accept provider override or tier override from request body
      const { aiProvider: reqProvider, publishTier: reqTier } = req.body || {};
      if (reqProvider && typeof reqProvider === 'string') {
        bd.contentAiProvider = reqProvider;
      }
      
      const publishTier = reqTier || bd.publishTier || '1';
      bd.publishTier = publishTier;
      bd.generationStatus = 'generating';
      bd.generationProgress = 0;
      bd.generationError = null;
      
      await storage.updateWebsite(id, { businessData: bd });

      const provider = bd.contentAiProvider || 'openai';
      const hasApiKey = await getAIProviderConfig(userId, provider);
      if (!hasApiKey) {
        return res.status(402).json({ error: "No AI API key configured. Save an OpenAI, Gemini, OpenRouter, or DeepSeek key in API Setup before generating content." });
      }

      // Start the background generation worker with force = true
      runBackgroundGenerationAndDeploy(id, userId, publishTier, undefined, undefined, true);

      return res.json({ success: true, status: 'generating', message: "Content generation started in background." });
    } catch (err: any) {
      console.error("generate-local-ai error:", err);
      return res.status(500).json({ error: err.message || "AI generation failed" });
    }
  });

  // ── GET website background generation progress ────────────────────────────
  app.get("/api/websites/:id/generation-status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ error: "Website not found" });
      }
      const bd = (website.businessData || {}) as any;
      return res.json({
        status: bd.generationStatus || 'idle',
        progress: bd.generationProgress ?? 0,
        error: bd.generationError || null,
        publishTier: bd.publishTier || '1',
      });
    } catch (err: any) {
      console.error("GET generation-status error:", err);
      res.status(500).json({ error: err.message || "Failed to fetch status" });
    }
  });

  // ── WD Website Deploy (water-damage template specific) ───────────────────────
  // Accepts a publishTier to deploy only core pages (Stage 1), standard local copy (Stage 2),
  // or full combo matrix (Stage 3). If any page content is missing, starts background generation first.
  app.post("/api/websites/:id/deploy-wd", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      let { netlifyApiKey, siteName, publishTier: reqTier } = req.body;

      const website = await storage.getWebsite(id);
      if (!website || website.userId !== userId) {
        return res.status(404).json({ error: "Website not found" });
      }

      // Resolve netlify token: body → DB settings
      if (!netlifyApiKey || netlifyApiKey.includes('•')) {
        const setting = await storage.getApiSetting(userId, 'netlify');
        if (setting?.apiKey) {
          try { netlifyApiKey = decrypt(setting.apiKey); } catch { netlifyApiKey = setting.apiKey; }
        }
      }
      if (!netlifyApiKey) {
        return res.status(400).json({ error: "Netlify API token required. Verify it in the Deploy tab." });
      }

      const bd = { ...((website.businessData || {}) as any) };
      const publishTier = reqTier || bd.publishTier || '1';
      bd.publishTier = publishTier;
      await storage.updateWebsite(id, { businessData: bd });

      const services = uniqueValues([
        ...parseDeployList(bd.services),
        ...parseDeployList(bd.additionalServices),
      ]);
      const locations = uniqueValues([
        ...parseDeployList(bd.serviceAreas, { locationMode: true, preferredState: stringValue(bd.state) }),
        ...parseDeployList(bd.additionalLocations, { locationMode: true, preferredState: stringValue(bd.state) }),
      ]);

      const rawDomain = siteName || bd.urlSlug || (bd.businessName || website.title || 'my-site');
      const domain = rawDomain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 63);

      if (!domain) {
        return res.status(400).json({ error: "Site name is required." });
      }

      // Check if we need to generate homepage AI content or subpage AI content
      const needsHomepage = !bd._aiIntroParas || !bd._aiFaqs || !bd._aiSeoBody || !bd._aiProcessSteps;
      
      let needsDynamicPages = false;
      if (publishTier === '2' || publishTier === '3') {
        bd.serviceContent = bd.serviceContent || {};
        bd.locationContent = bd.locationContent || {};
        const pendingServices = services.filter((s: string) => !bd.serviceContent[s]);
        const pendingLocations = locations.filter((l: string) => !bd.locationContent[l]);
        if (pendingServices.length > 0 || pendingLocations.length > 0) {
          needsDynamicPages = true;
        }
      }

      const provider = bd.contentAiProvider || 'openai';
      const hasApiKey = await getAIProviderConfig(userId, provider);

      if ((needsHomepage || needsDynamicPages) && hasApiKey) {
        // Trigger background generation and deploy
        runBackgroundGenerationAndDeploy(id, userId, publishTier, netlifyApiKey, domain);
        return res.json({ success: true, status: 'generating', message: "Content generation running in background." });
      }

      // Fast path: deploy synchronously
      const result = await performNetlifyDeploy(id, userId, netlifyApiKey, domain, publishTier);
      return res.json({ url: result.url, siteName: result.siteName, status: 'deployed' });
    } catch (err: any) {
      console.error("WD deploy error:", err);
      res.status(500).json({ error: err.message || "Deployment failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
