import fs from "fs";
import path from "path";

export interface ArticleCampaign {
  id: string;
  title: string;
  businessDetails: string;
  keywords: string[];
  dofollowLinks: { url: string; anchor: string }[];
  provider: string; // The AI provider used (gemini, openai, etc.)
  articles: Record<string, string>; // Maps provider name -> generated HTML content
  deployments: Record<string, { status: "pending" | "deploying" | "completed" | "failed"; url?: string; error?: string }>;
  createdAt: string;
}

import os from "os";

let DATA_DIR = path.join(process.cwd(), "server", "data");
let FILE_PATH = path.join(DATA_DIR, "articles.json");

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Fallback to tmp directory if Vercel serverless runtime is read-only
    DATA_DIR = os.tmpdir();
    FILE_PATH = path.join(DATA_DIR, "articles.json");
  }

  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([]));
    }
  } catch (err) {
    FILE_PATH = path.join("/tmp", "articles.json");
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([]));
    }
  }
}

export function getArticles(): ArticleCampaign[] {
  ensureFileExists();
  try {
    const content = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("[article-store] Error reading articles.json:", err);
    return [];
  }
}

export function saveArticle(article: ArticleCampaign): void {
  ensureFileExists();
  const articles = getArticles();
  const index = articles.findIndex((a) => a.id === article.id);
  if (index >= 0) {
    articles[index] = article;
  } else {
    articles.push(article);
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(articles, null, 2));
}

export function deleteArticle(id: string): boolean {
  ensureFileExists();
  const articles = getArticles();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) {
    return false;
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2));
  return true;
}
