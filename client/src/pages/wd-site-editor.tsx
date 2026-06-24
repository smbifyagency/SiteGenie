/**
 * Water Damage Site Editor
 * Post-generation editor: edit content, replace placeholder images, deploy to Netlify.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Save, Rocket, Image as ImageIcon, RefreshCw,
  Loader2, ExternalLink, CheckCircle2, ChevronDown, ChevronUp,
  Globe, Phone, MapPin, FileText, Layers, Edit3, Sparkles, Wand2, Trash2,
  Eye, X as XIcon, ImagePlus, PenSquare, Plus, UploadCloud, Download, Crown
} from "lucide-react";
import { generateLocalServiceWebsite, enrichBusinessDataForCategory } from "../lib/local-service-engine";
import { getCategoryConfig } from "../lib/local-service-categories";
import {
  generateServicePage,
  generateLocationPage,
  generateServiceLocationMatrixPage,
  generateBlogPostPage,
  generateBlogArchivePage,
  generateHomepage,
  generateSitemap,
  generateHTMLSitemap,
  generateLLMsTxt,
  generateRobots,
} from "../lib/water-damage-generator";
import { VisualEditor } from "@/components/visual-editor";
import { PublishWebsiteModal } from "@/components/publish-website-modal";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type AIProvider = "openai" | "gemini" | "openrouter" | "deepseek";

const isAIProvider = (value: unknown): value is AIProvider =>
  value === "openai" || value === "gemini" || value === "openrouter" || value === "deepseek";

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    // If it's an SVG, don't try to draw it to canvas since it's already tiny and text-based
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(""); // safe fallback
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string); // Fallback to raw base64 on error
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(""); // safe fallback
    reader.readAsDataURL(file);
  });
};

// ── Premade color palettes for non-tech users ─────────────────────────────
const COLOR_PALETTES = [
  { name: "Ocean Blue",    primary: "#1e3a5f", secondary: "#0ea5e9" },
  { name: "Forest Green",  primary: "#14532d", secondary: "#22c55e" },
  { name: "Sunset Fire",   primary: "#7c2d12", secondary: "#f97316" },
  { name: "Royal Purple",  primary: "#3b0764", secondary: "#a855f7" },
  { name: "Navy Elite",    primary: "#172554", secondary: "#3b82f6" },
  { name: "Cherry Red",    primary: "#7f1d1d", secondary: "#ef4444" },
  { name: "Teal Modern",   primary: "#134e4a", secondary: "#14b8a6" },
  { name: "Golden Pro",    primary: "#713f12", secondary: "#eab308" },
  { name: "Rose Pink",     primary: "#881337", secondary: "#f43f5e" },
  { name: "Emerald",       primary: "#064e3b", secondary: "#059669" },
  { name: "Slate Gray",    primary: "#1e293b", secondary: "#64748b" },
  { name: "Copper",        primary: "#431407", secondary: "#c2410c" },
  { name: "Indigo",        primary: "#1e1b4b", secondary: "#6366f1" },
  { name: "Cyan Fresh",    primary: "#083344", secondary: "#06b6d4" },
  { name: "Midnight",      primary: "#0f172a", secondary: "#475569" },
  { name: "Charcoal",      primary: "#111827", secondary: "#9ca3af" },
] as const;

interface WDSiteData {
  id?: string;
  categoryId?: string;
  businessName: string;
  countryCode?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  primaryKeyword: string;
  services: string[];
  serviceAreas: string[];
  urlSlug: string;
  primaryColor: string;
  secondaryColor: string;
  contactFormEmbed?: string;
  googleMapsUrl?: string;
  // AI Content
  homepageContent?: any;
  serviceContent?: Record<string, any>;
  locationContent?: Record<string, any>;
  // AI Keys (stored per-website so they survive deployments)
  openaiApiKey?: string;
  geminiApiKey?: string;
  contentAiProvider?: AIProvider;
  // Custom images: placeholder key → data URL or hosted URL
  customImages?: Record<string, string>;
  publishChecklist?: Record<string, boolean>;
  // Social media
  facebookUrl?: string;
  instagramUrl?: string;
  googleUrl?: string;
  yelpUrl?: string;
  twitterUrl?: string;
  // Floating CTA
  floatingCTA?: 'call' | 'whatsapp' | 'none';
  whatsappNumber?: string;
  // Gallery images: before/after pairs + normal gallery photos
  galleryImages?: Array<{src: string; alt: string; type: 'before' | 'after' | 'normal'; pairId?: string; caption?: string}>;
  // Blog posts
  blogPosts?: Array<{id: string; title: string; slug: string; excerpt: string; content: string; featuredImage?: string; featuredImageAlt?: string; metaTitle?: string; metaDescription?: string; category?: string; tags?: string[]; keywords?: string; date?: string; isAiGenerated?: boolean}>;
  // Deployment
  netlifyUrl?: string;
  netlifyApiKey?: string;
  deploymentStatus?: string;
  googleAnalyticsId?: string;
  customHeadCode?: string;
  logoUrl?: string;
  faviconUrl?: string;
  businessHours?: string;
  publishTier?: '1' | '2' | '3';
  generateBlog?: boolean;
  enableMatrixPages?: boolean;
  hideBeforeAfter?: boolean;
  generationStatus?: 'idle' | 'generating' | 'deploying' | 'completed' | 'failed';
  generationProgress?: number;
  generationError?: string | null;
}

function buildAddressMapEmbedUrl(address?: string, city?: string, state?: string): string {
  const composed = [address, city, state].map((part) => (part || '').trim()).filter(Boolean).join(', ');
  if (!composed) return '';
  return `https://www.google.com/maps?q=${encodeURIComponent(composed)}&output=embed`;
}

interface PublishChecklistItem {
  id: string;
  title: string;
  description: string;
  targetTab: string;
  autoReady: (data: WDSiteData) => boolean;
}

const PUBLISH_CHECKLIST_ITEMS: PublishChecklistItem[] = [
  {
    id: "business-details",
    title: "Business details are correct",
    description: "Confirm your business name, phone, address, and Google Maps iframe URL for the contact page map.",
    targetTab: "business",
    autoReady: (data) => Boolean(
      data.businessName?.trim() &&
      data.phone?.trim() &&
      (data.address?.trim() || data.city?.trim()) &&
      data.googleMapsUrl?.trim()
    ),
  },
  {
    id: "logo-uploaded",
    title: "Logo uploaded",
    description: "Replace the default branding with your real logo before launch.",
    targetTab: "images",
    autoReady: (data) => Boolean(data.logoUrl),
  },
  {
    id: "services-locations",
    title: "Services and locations reviewed",
    description: "Make sure your service list and city/location pages are final.",
    targetTab: "business",
    autoReady: (data) => data.services.length > 0 && data.serviceAreas.length > 0,
  },
  {
    id: "ai-content",
    title: "AI content reviewed",
    description: "Generate or refine the homepage, service, and location content before publishing.",
    targetTab: "content",
    autoReady: (data) => Boolean(
      data.homepageContent ||
      (data as any)._aiAboutContent ||
      (Array.isArray((data as any)._aiIntroParas) && (data as any)._aiIntroParas.length > 0) ||
      (Array.isArray((data as any)._aiTestimonials) && (data as any)._aiTestimonials.length > 0) ||
      (data.serviceContent && Object.keys(data.serviceContent).length > 0) ||
      (data.locationContent && Object.keys(data.locationContent).length > 0)
    ),
  },
  {
    id: "main-images",
    title: "Main site images replaced",
    description: "Swap placeholder hero and section images with real business photos.",
    targetTab: "images",
    autoReady: (data) => Object.keys(data.customImages || {}).some((key) => ["hero-bg", "main-image", "about-image", "service-image", "location-image"].includes(key)),
  },
  {
    id: "gallery-reviewed",
    title: "Gallery reviewed",
    description: "Add or confirm before/after and gallery images so the site looks complete.",
    targetTab: "images",
    autoReady: (data) => Array.isArray(data.galleryImages) && data.galleryImages.some((image) => Boolean(image?.src)),
  },
  {
    id: "blog-reviewed",
    title: "Blog posts reviewed or intentionally skipped",
    description: "Check blog titles and images, or mark this done if you are launching without blog content.",
    targetTab: "blog",
    autoReady: (data) => Array.isArray(data.blogPosts) && data.blogPosts.length > 0,
  },
  {
    id: "gsc-code",
    title: "Google Search Console code added",
    description: "Paste your verification meta tag into Custom Head Code.",
    targetTab: "deploy",
    autoReady: (data) => /google-site-verification/i.test(data.customHeadCode || ""),
  },
  {
    id: "analytics",
    title: "Analytics or tracking code added",
    description: "Add your GA4 Measurement ID and any head scripts you need.",
    targetTab: "deploy",
    autoReady: (data) => Boolean(data.googleAnalyticsId?.trim()) || /googletagmanager|gtag\(|google-analytics/i.test(data.customHeadCode || ""),
  },
  {
    id: "final-preview",
    title: "Final preview checked",
    description: "Open the key pages in preview and make sure the final output looks ready to ship.",
    targetTab: "deploy",
    autoReady: () => false,
  },
];

function getChecklistItemStates(data?: WDSiteData | null) {
  return PUBLISH_CHECKLIST_ITEMS.map((item) => {
    const manualValue = data?.publishChecklist?.[item.id];
    const autoReady = data ? item.autoReady(data) : false;
    return {
      ...item,
      autoReady,
      checked: typeof manualValue === "boolean" ? manualValue : autoReady,
      isManual: typeof manualValue === "boolean",
    };
  });
}

function getChecklistMetrics(data?: WDSiteData | null) {
  const items = getChecklistItemStates(data);
  const completedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    completedCount,
    totalCount,
    percent,
    incompleteItems: items.filter((item) => !item.checked).map((item) => item.title),
  };
}

// All placeholder image slots in the WD template
const WD_IMAGE_SLOTS = [
  {
    key: "hero-bg",
    label: "Hero Background (Homepage Banner)",
    page: "Homepage",
    defaultSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    hint: "Appears as the large background banner image at the top of the homepage."
  },
  {
    key: "main-image",
    label: "Team / Work Photo (Homepage Body)",
    page: "Homepage",
    defaultSrc: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    hint: "Appears in the 'About Our Services' body section on the homepage."
  },
  {
    key: "about-image",
    label: "About Us Photo (Our Story Section)",
    page: "About Us",
    defaultSrc: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    hint: "Appears next to your business bio on the About page."
  },
  {
    key: "service-image",
    label: "Service Page Banner Photo",
    page: "Service Pages",
    defaultSrc: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80",
    hint: "Standard representative banner image displayed on all service pages."
  },
  {
    key: "location-image",
    label: "Location Page Banner Photo",
    page: "Location Pages",
    defaultSrc: "https://images.unsplash.com/photo-1601760562234-9814eea6663a?w=800&q=80",
    hint: "Standard representative banner image displayed on all city/area pages."
  }
];

// Sample data for each category — used only by the "Fill sample" button during testing.
// Never persisted automatically; AI still generates all actual content.
function getSampleData(catId: string): Partial<WDSiteData> {
  const config = getCategoryConfig(catId);
  const bizName = `Austin ${config.name}`;
  const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    businessName: bizName,
    phone: '(512) 555-0182',
    email: `info@${slug}.com`,
    address: '4821 Oak Hollow Drive',
    city: 'Austin',
    state: 'TX',
    primaryKeyword: config.defaultPrimaryKeyword,
    services: config.defaultServices.slice(0, 8),
    serviceAreas: ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville'],
    urlSlug: slug,
    primaryColor: config.defaultPalette.primary,
    secondaryColor: config.defaultPalette.secondary,
    googleMapsUrl: buildAddressMapEmbedUrl('4821 Oak Hollow Drive', 'Austin', 'TX'),
  };
}

// Script injected into every preview page so images become click-to-upload
const PREVIEW_CLICK_SCRIPT = `
<style>
.wd-img-wrap{position:relative;display:inline-block;}
.wd-img-wrap img{display:block;width:100%;}
.wd-img-overlay{position:absolute;inset:0;background:rgba(0,0,0,.48);color:#fff;font-size:13px;font-weight:700;font-family:sans-serif;display:flex;align-items:center;justify-content:center;gap:6px;opacity:0;transition:opacity .18s;cursor:pointer;border-radius:4px;}
.wd-img-wrap:hover .wd-img-overlay{opacity:1;}
.wd-hero-btn{position:absolute;top:12px;left:12px;z-index:200;background:rgba(255,255,255,.92);color:#1e3a5f;border:none;padding:7px 14px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);}
.wd-hero-btn:hover{background:#fff;}
</style>
<script>
(function(){
  document.querySelectorAll('img[data-placeholder]').forEach(function(img){
    var key=img.getAttribute('data-placeholder');
    var parent=img.parentElement;
    var wrap=document.createElement('div');
    wrap.className='wd-img-wrap';
    parent.insertBefore(wrap,img);
    wrap.appendChild(img);
    var ov=document.createElement('div');
    ov.className='wd-img-overlay';
    ov.innerHTML='<span>📷</span><span>Click to replace</span>';

    function triggerUpload(event){
      if(event){
        event.preventDefault();
        event.stopPropagation();
      }
      window.parent.postMessage({type:'wd-img-click',key:key},'*');
    }

    wrap.style.cursor='pointer';
    img.style.cursor='pointer';
    wrap.onclick=triggerUpload;
    img.onclick=triggerUpload;
    ov.onclick=triggerUpload;
    wrap.appendChild(ov);
  });
  var hero=document.querySelector('.hero');
  if(hero){
    var btn=document.createElement('button');
    btn.className='wd-hero-btn';
    btn.textContent='📷 Change Background';
    btn.onclick=function(){window.parent.postMessage({type:'wd-img-click',key:'hero-bg'},'*');};
    hero.style.position='relative';
    hero.appendChild(btn);
  }
})();
</script>`;

// Convert WDSiteData → the shape the generator expects
function siteDataToWDData(data: WDSiteData): Record<string, any> {
  return {
    categoryId: data.categoryId,
    businessName: data.businessName,
    countryCode: data.countryCode,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    businessHours: data.businessHours,
    primaryKeyword: data.primaryKeyword,
    services: data.services,
    serviceAreas: data.serviceAreas,
    urlSlug: data.urlSlug || (data.businessName ? data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'website'),
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    customImages: data.customImages,
    logoUrl: (data as any).logoUrl,
    faviconUrl: (data as any).faviconUrl,
    customHeadCode: (data as any).customHeadCode,
    googleMapsUrl: data.googleMapsUrl,
    facebookUrl: data.facebookUrl,
    instagramUrl: data.instagramUrl,
    googleUrl: data.googleUrl,
    yelpUrl: data.yelpUrl,
    twitterUrl: data.twitterUrl,
    floatingCTA: data.floatingCTA,
    whatsappNumber: data.whatsappNumber,
    homepageContent: data.homepageContent,
    serviceContent: data.serviceContent,
    locationContent: data.locationContent,
    contentAiProvider: data.contentAiProvider,
    galleryImages: data.galleryImages,
    _aiIntroParas: (data as any)._aiIntroParas,
    _aiFaqs: (data as any)._aiFaqs,
    _aiSeoBody: (data as any)._aiSeoBody,
    _aiProcessSteps: (data as any)._aiProcessSteps,
    _aiWhyChooseUs: (data as any)._aiWhyChooseUs,
    _aiAboutContent: (data as any)._aiAboutContent,
    _aiTestimonials: (data as any)._aiTestimonials,
    _aiServiceDescs: (data as any)._aiServiceDescs,
    enableMatrixPages: (data as any).enableMatrixPages,
    hideBeforeAfter: (data as any).hideBeforeAfter,
    publishTier: data.publishTier || '1',
    generationStatus: data.generationStatus || 'idle',
    generationProgress: data.generationProgress ?? 0,
    generationError: data.generationError || null,
    blogPosts: data.blogPosts || [],
    generateBlog: data.generateBlog ?? false,
  } as any;
}

function stripBase64Images(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === "string") {
    if (obj.startsWith("data:image/")) {
      return "";
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => stripBase64Images(item));
  }
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (key === "logoUrl" || key === "faviconUrl") {
        cleaned[key] = val;
      } else if (typeof val === "string" && val.startsWith("data:image/")) {
        cleaned[key] = "";
      } else {
        cleaned[key] = stripBase64Images(val);
      }
    }
    return cleaned;
  }
  return obj;
}

function downloadBase64Image(base64DataUrl: string, defaultName = "image.jpg") {
  const link = document.createElement("a");
  link.href = base64DataUrl;
  link.download = defaultName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Strip deployment-only fields before storing businessData — these live in
 *  their own DB columns (deployed_url, status) and must not pollute businessData. */
function stripDeploymentFields(data: WDSiteData) {
  const { netlifyUrl: _a, deploymentStatus: _b, netlifyApiKey: _c, ...rest } = data as any;
  const copy = { ...rest };
  if (copy.customImages) {
    copy.customImages = stripBase64Images(copy.customImages);
  }
  if (copy.galleryImages) {
    copy.galleryImages = stripBase64Images(copy.galleryImages);
  }
  return copy;
}

// ─── Blog Writer Section ────────────────────────────────────────────────────

interface BlogWriterSectionProps {
  siteData: WDSiteData;
  onPostsChange: (posts: WDSiteData['blogPosts']) => void;
  onRebuildPreview?: (data: WDSiteData) => void;
}

function BlogWriterSection({ siteData, onPostsChange, onRebuildPreview }: BlogWriterSectionProps) {
  const [keywords, setKeywords] = useState('');
  const [wordCount, setWordCount] = useState(1500);
  const [aiProvider, setAiProvider] = useState<AIProvider>(siteData.contentAiProvider || 'openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const blogImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const posts = siteData.blogPosts || [];
  const keywordLines = keywords.split('\n').map(k => k.trim()).filter(k => k.length > 0);

  // Generate 30+ SEO keyword suggestions based on business info
  const suggestedKeywords = (() => {
    const biz = siteData.businessName || 'business';
    const city = siteData.city || 'your city';
    const state = siteData.state || '';
    const loc = state ? `${city}, ${state}` : city;
    const keyword = siteData.primaryKeyword || 'services';
    const services = siteData.services || [];
    const areas = siteData.serviceAreas || [];

    const suggestions: string[] = [];

    // Service-based keywords
    services.slice(0, 8).forEach(s => {
      suggestions.push(`${s} in ${loc}`);
      suggestions.push(`best ${s.toLowerCase()} tips`);
      suggestions.push(`how to choose ${s.toLowerCase()} company`);
    });

    // Location-based keywords
    areas.slice(0, 5).forEach(a => {
      suggestions.push(`${keyword} in ${a}`);
      suggestions.push(`best ${keyword.toLowerCase()} company in ${a}`);
    });

    // General SEO keywords
    suggestions.push(
      `${keyword} cost guide ${new Date().getFullYear()}`,
      `how much does ${keyword.toLowerCase()} cost`,
      `${keyword} vs DIY - when to call a pro`,
      `signs you need ${keyword.toLowerCase()}`,
      `${keyword.toLowerCase()} checklist for homeowners`,
      `top 10 ${keyword.toLowerCase()} mistakes to avoid`,
      `${keyword.toLowerCase()} insurance claims guide`,
      `emergency ${keyword.toLowerCase()} what to do first`,
      `${keyword.toLowerCase()} maintenance tips`,
      `how to find the best ${keyword.toLowerCase()} company`,
      `${keyword.toLowerCase()} before and after guide`,
      `seasonal ${keyword.toLowerCase()} tips for ${loc}`,
      `commercial vs residential ${keyword.toLowerCase()}`,
      `${keyword.toLowerCase()} FAQs answered`,
      `why ${keyword.toLowerCase()} is important for your home`,
      `${keyword.toLowerCase()} safety tips`,
      `how long does ${keyword.toLowerCase()} take`,
      `${keyword.toLowerCase()} warranties explained`,
    );

    // Dedupe and return
    return [...new Set(suggestions)].slice(0, 35);
  })();

  async function generateBlogs() {
    if (keywordLines.length === 0) {
      toast({ title: "No keywords", description: "Add at least one keyword (one per line).", variant: "destructive" });
      return;
    }
    if (keywordLines.length > 30) {
      toast({ title: "Too many keywords", description: "Maximum 30 keywords allowed at a time.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setErrors([]);
    setProgress({ current: 0, total: keywordLines.length });

    const newPosts: NonNullable<WDSiteData['blogPosts']> = [...posts];

    for (let i = 0; i < keywordLines.length; i++) {
      const keyword = keywordLines[i];
      setCurrentKeyword(keyword);
      setProgress({ current: i + 1, total: keywordLines.length });

      try {
        const res = await fetch('/api/ai/blog-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            businessName: siteData.businessName,
            category: siteData.primaryKeyword,
            location: `${siteData.city}, ${siteData.state}`,
            services: siteData.services?.join(', ') || '',
            serviceAreas: siteData.serviceAreas?.join(', ') || '',
            keyword,
            wordCount,
            useImages: true,
            aiProvider,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 504) {
            throw new Error('Timeout — try Gemini or OpenRouter (faster)');
          }
          throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.success && data.blogPost) {
          newPosts.push({
            ...data.blogPost,
            id: data.blogPost.id || `blog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            isAiGenerated: true,
            date: new Date().toISOString().split('T')[0],
          });
          // Update in real-time so user sees progress
          onPostsChange([...newPosts]);
        } else {
          throw new Error(data.message || 'Unknown error');
        }
      } catch (err) {
        const msg = `"${keyword}": ${err instanceof Error ? err.message : String(err)}`;
        setErrors(prev => [...prev, msg]);
      }
    }

    setIsGenerating(false);
    setCurrentKeyword('');
    setKeywords(''); // Clear input after generation
    toast({
      title: "Blog generation complete",
      description: `Generated ${newPosts.length - posts.length} of ${keywordLines.length} posts.`,
    });
  }

  function removePost(id: string) {
    onPostsChange(posts.filter(p => p.id !== id));
  }

  function removeAllPosts() {
    onPostsChange([]);
  }

  function updatePost(id: string, updates: Partial<NonNullable<WDSiteData['blogPosts']>[number]>) {
    onPostsChange(posts.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  function startEditImage(post: NonNullable<WDSiteData['blogPosts']>[number]) {
    setEditingImageId(post.id);
    setTempImageUrl(post.featuredImage || '');
  }

  function saveImage(id: string) {
    updatePost(id, { featuredImage: tempImageUrl });
    setEditingImageId(null);
    setTempImageUrl('');
    toast({ title: "Featured image updated" });
  }

  // Build blog post preview HTML
  function buildBlogPreviewHtml(post: NonNullable<WDSiteData['blogPosts']>[number]): string {
    const primaryColor = siteData.primaryColor || '#1e3a5f';
    const secondaryColor = siteData.secondaryColor || '#0ea5e9';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${post.title ? post.title.charAt(0).toUpperCase() + post.title.slice(1) : ''}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#334155;}
.container{max-width:800px;margin:0 auto;padding:0 1rem;}
.blog-header{background:linear-gradient(135deg,${primaryColor},${secondaryColor});color:#fff;padding:3rem 2rem;text-align:center;margin-bottom:2rem;}
.blog-header h1{font-size:2.2rem;font-weight:800;margin-bottom:1rem;text-shadow:0 2px 4px rgba(0,0,0,.2);}
.blog-meta{display:flex;gap:1.5rem;justify-content:center;color:rgba(255,255,255,.85);font-size:.875rem;flex-wrap:wrap;}
.blog-img{width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-bottom:2rem;box-shadow:0 4px 20px rgba(0,0,0,.1);}
.blog-body{padding:2rem 0;font-size:1.05rem;line-height:1.85;}
.blog-body h2{font-size:1.5rem;color:${primaryColor};margin:2rem 0 1rem;font-weight:700;border-left:4px solid ${secondaryColor};padding-left:1rem;}
.blog-body h3{font-size:1.25rem;color:${primaryColor};margin:1.5rem 0 .75rem;font-weight:600;}
.blog-body p{margin-bottom:1.25rem;}
.blog-body ul,.blog-body ol{padding-left:1.5rem;margin:1rem 0;}
.blog-body li{margin-bottom:.5rem;}
.blog-body strong{color:#1e293b;}
.blog-body blockquote{border-left:4px solid ${secondaryColor};padding:.75rem 1rem;margin:1.5rem 0;background:${secondaryColor}0a;border-radius:0 8px 8px 0;font-style:italic;color:#475569;}
.category-badge{display:inline-block;background:${secondaryColor}22;color:${secondaryColor};font-size:.75rem;font-weight:700;padding:.25rem .6rem;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:1rem;}
.tags{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:2rem;padding-top:1.5rem;border-top:1px solid #e2e8f0;}
.tag{background:#f1f5f9;color:#64748b;font-size:.75rem;padding:.25rem .6rem;border-radius:4px;}
.cta-box{background:linear-gradient(135deg,${primaryColor},${secondaryColor});color:#fff;padding:2rem;border-radius:12px;text-align:center;margin:3rem 0;}
.cta-box h3{font-size:1.5rem;margin-bottom:1rem;}
.cta-box p{color:rgba(255,255,255,.9);margin-bottom:1.5rem;}
.cta-btn{display:inline-flex;align-items:center;gap:.5rem;background:#fff;color:${primaryColor};padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;}
</style></head><body>
<div class="blog-header">
  <div class="container">
    ${post.category ? `<span class="category-badge" style="background:rgba(255,255,255,.15);color:#fff;">${post.category}</span>` : ''}
    <h1>${post.title}</h1>
    <div class="blog-meta">
      <span><i class="fas fa-calendar" style="margin-right:.4rem;"></i>${new Date(post.date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      <span><i class="fas fa-user" style="margin-right:.4rem;"></i>${siteData.businessName || 'Author'}</span>
      ${post.keywords ? `<span><i class="fas fa-tag" style="margin-right:.4rem;"></i>${post.keywords}</span>` : ''}
    </div>
  </div>
</div>
<div class="container">
  ${post.featuredImage ? `<img class="blog-img" src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}">` : ''}
  <div class="blog-body">${post.content || `<p>${post.excerpt}</p>`}</div>
  ${(post.tags && post.tags.length > 0) ? `<div class="tags">${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
  <div class="cta-box">
    <h3>Need Professional Help?</h3>
    <p>Contact ${siteData.businessName || 'us'} for expert services in ${siteData.city || 'your area'}.</p>
    <a href="tel:${siteData.phone || ''}" class="cta-btn"><i class="fas fa-phone"></i> Call ${siteData.phone || 'Now'}</a>
  </div>
</div>
</body></html>`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-300">Blog Writer</h3>
        {posts.length > 0 && (
          <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded-full font-medium">
            {posts.length} post{posts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Enter keywords line by line. Each keyword generates a separate blog post with its own AI call (no token limit issues).
      </p>

      {/* Keyword Input */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Keywords (one per line)</Label>
        <textarea
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition resize-none"
          rows={6}
          placeholder={`water damage restoration tips\nmold prevention guide\nflood cleanup process\nemergency water removal\nhow to dry water damage`}
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          disabled={isGenerating}
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{keywordLines.length} keyword{keywordLines.length !== 1 ? 's' : ''} entered</span>
          <span>Max 30 per batch</span>
        </div>

        {/* Suggested Keywords */}
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-xs text-[#7C3AED] hover:text-[#9333EA] flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          {showSuggestions ? 'Hide' : 'Show'} suggested keywords ({suggestedKeywords.length})
        </button>

        {showSuggestions && (
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 space-y-2 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">Click to add keywords</p>
              <button
                type="button"
                onClick={() => {
                  const remaining = suggestedKeywords.filter(s => !keywordLines.includes(s));
                  const toAdd = remaining.slice(0, 30 - keywordLines.length);
                  if (toAdd.length === 0) return;
                  setKeywords(prev => (prev.trim() ? prev.trim() + '\n' : '') + toAdd.join('\n'));
                  toast({ title: `Added ${toAdd.length} keywords` });
                }}
                className="text-xs text-[#7C3AED] hover:underline"
              >
                Add all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedKeywords.map((s, i) => {
                const isAdded = keywordLines.includes(s);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={isAdded}
                    onClick={() => {
                      if (keywordLines.length >= 30) {
                        toast({ title: "Max 30 keywords", variant: "destructive" });
                        return;
                      }
                      setKeywords(prev => (prev.trim() ? prev.trim() + '\n' : '') + s);
                    }}
                    className={`text-xs px-2 py-1 rounded-full border transition ${isAdded ? 'border-green-800 bg-green-950/40 text-green-500 cursor-default' : 'border-gray-600 bg-gray-900 text-gray-300 hover:border-[#7C3AED] hover:text-[#7C3AED]'}`}
                  >
                    {isAdded ? '✓ ' : '+ '}{s}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Word Count</Label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200"
            value={wordCount}
            onChange={e => setWordCount(Number(e.target.value))}
            disabled={isGenerating}
          >
            <option value={500}>Short (500w)</option>
            <option value={800}>Medium (800w)</option>
            <option value={1200}>Long (1200w)</option>
            <option value={1500}>Extended (1500w)</option>
            <option value={2000}>Full (2000w)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">AI Provider</Label>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-gray-200"
            value={aiProvider}
            onChange={e => setAiProvider(e.target.value as AIProvider)}
            disabled={isGenerating}
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="openrouter">OpenRouter</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateBlogs}
        disabled={isGenerating || keywordLines.length === 0}
        className="w-full bg-[#7C3AED] hover:bg-[#99CC00] text-gray-900 font-semibold"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Writing post {progress.current}/{progress.total}...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Generate {keywordLines.length || ''} Blog Post{keywordLines.length !== 1 ? 's' : ''}
          </span>
        )}
      </Button>

      {/* Progress */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-[#7C3AED] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Writing: "{currentKeyword}"
          </p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-red-400">Failed ({errors.length}):</p>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-300">{err}</p>
          ))}
        </div>
      )}

      {/* Generated Posts List */}
      {posts.length > 0 && (
        <div className="space-y-2 border-t border-gray-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Generated Posts</h4>
            <button
              onClick={removeAllPosts}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
              disabled={isGenerating}
            >
              Remove All
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {posts.map((post, idx) => (
              <div key={post.id} className="bg-gray-800/70 border border-gray-700 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="text-sm text-gray-200 font-medium truncate">{post.title}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{post.keywords || post.category}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">#{idx + 1}</span>
                    <button
                      onClick={e => { e.stopPropagation(); removePost(post.id); }}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="Remove post"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {expandedPost === post.id ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                  </div>
                </div>
                {expandedPost === post.id && (
                  <div className="border-t border-gray-700 p-3 space-y-3">
                    {/* Featured Image Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Featured Image</span>
                        <button
                          onClick={e => { e.stopPropagation(); startEditImage(post); }}
                          className="text-xs text-[#7C3AED] hover:text-[#9333EA] flex items-center gap-1"
                        >
                          <ImagePlus className="w-3 h-3" />
                          {post.featuredImage ? 'Change' : 'Add Image'}
                        </button>
                      </div>
                      {editingImageId === post.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={tempImageUrl}
                              onChange={e => setTempImageUrl(e.target.value)}
                              placeholder="Paste image URL..."
                              className="bg-gray-900 border-gray-600 text-sm text-gray-200 h-8 flex-1"
                            />
                            <label className="cursor-pointer flex items-center gap-1 px-2 h-8 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-md border border-gray-600 transition whitespace-nowrap">
                              <ImagePlus className="w-3 h-3" /> Upload
                              <input
                                ref={blogImageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const url = await compressImage(file, 800, 600, 0.85);
                                    setTempImageUrl(url);
                                  } catch (err) {
                                    toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                                  }
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                          {tempImageUrl && (
                            <img
                              src={tempImageUrl}
                              alt="Preview"
                              className="w-full h-28 object-cover rounded-md border border-gray-600"
                              onError={e => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7 text-xs bg-[#7C3AED] hover:bg-[#99CC00] text-gray-900" onClick={() => saveImage(post.id)}>
                              <Save className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400" onClick={() => setEditingImageId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : post.featuredImage ? (
                        <img src={post.featuredImage} alt={post.featuredImageAlt || ''} className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition" onClick={e => { e.stopPropagation(); startEditImage(post); }} />
                      ) : (
                        <div
                          className="w-full h-24 border-2 border-dashed border-gray-700 rounded-md flex items-center justify-center cursor-pointer hover:border-[#7C3AED] transition"
                          onClick={e => { e.stopPropagation(); startEditImage(post); }}
                        >
                          <span className="text-xs text-gray-500">Click to add featured image</span>
                        </div>
                      )}
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs text-gray-400">{post.excerpt}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {post.tags?.map((tag, ti) => (
                        <span key={ti} className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>

                    {/* Info + Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <p className="text-[10px] text-gray-600">{post.content?.length || 0} chars</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); setPreviewPostId(post.id); }}
                          className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded transition"
                          title="Preview blog post"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setEditPostId(post.id); }}
                          className="flex items-center gap-1 text-xs bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#7C3AED] px-2 py-1 rounded transition"
                          title="Edit in visual editor"
                        >
                          <PenSquare className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mt-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <Sparkles className="w-3 h-3 inline mr-1 text-[#7C3AED]" />
          Each keyword triggers a separate AI API call with full 1000-1500 word generation. Blog posts are automatically included in the website preview and deploy.
        </p>
      </div>

      {/* Blog Post Preview Modal */}
      {previewPostId && (() => {
        const post = posts.find(p => p.id === previewPostId);
        if (!post) return null;
        return (
          <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewPostId(null)}>
            <div className="bg-white rounded-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-100 border-b">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[400px]">{post.title}</span>
                </div>
                <button onClick={() => setPreviewPostId(null)} className="p-1 hover:bg-gray-200 rounded transition">
                  <XIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <iframe
                srcDoc={buildBlogPreviewHtml(post)}
                className="flex-1 w-full border-0"
                title="Blog Post Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        );
      })()}

      {/* Blog Post Visual Editor */}
      {editPostId && (() => {
        const post = posts.find(p => p.id === editPostId);
        if (!post) return null;
        return (
          <VisualEditor
            initialHtml={`<div class="blog-content" style="font-family:Inter,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#334155;line-height:1.8;">
              ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:12px;margin-bottom:2rem;">` : ''}
              <h1 style="font-size:2rem;color:${siteData.primaryColor || '#1e3a5f'};margin-bottom:1rem;">${post.title}</h1>
              <p style="color:#64748b;font-size:1.1rem;margin-bottom:2rem;font-style:italic;">${post.excerpt}</p>
              <div class="post-body">${post.content || ''}</div>
            </div>`}
            globalCss={`
              .blog-content h2 { font-size:1.5rem; color:${siteData.primaryColor || '#1e3a5f'}; margin:2rem 0 1rem; font-weight:700; }
              .blog-content h3 { font-size:1.25rem; color:${siteData.primaryColor || '#1e3a5f'}; margin:1.5rem 0 .75rem; font-weight:600; }
              .blog-content p { margin-bottom:1.25rem; }
              .blog-content ul,.blog-content ol { padding-left:1.5rem; margin:1rem 0; }
              .blog-content li { margin-bottom:.5rem; }
              .blog-content blockquote { border-left:4px solid ${siteData.secondaryColor || '#0ea5e9'}; padding:.75rem 1rem; margin:1.5rem 0; background:#f1f5f9; border-radius:0 8px 8px 0; }
              .blog-content img { max-width:100%; border-radius:8px; }
            `}
            isOpen={true}
            onClose={() => setEditPostId(null)}
            onSave={(html) => {
              // Extract content from the edited HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const titleEl = doc.querySelector('h1');
              const excerptEl = doc.querySelector('p[style*="italic"]');
              const bodyEl = doc.querySelector('.post-body');
              const imgEl = doc.querySelector('img');

              const updates: Partial<NonNullable<WDSiteData['blogPosts']>[number]> = {};
              if (titleEl) updates.title = titleEl.textContent || post.title;
              if (excerptEl) updates.excerpt = excerptEl.textContent || post.excerpt;
              if (bodyEl) updates.content = bodyEl.innerHTML;
              if (imgEl) updates.featuredImage = imgEl.getAttribute('src') || post.featuredImage;

              updatePost(post.id, updates);
              setEditPostId(null);
              toast({ title: "Blog post updated" });
            }}
          />
        );
      })()}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function WDSiteEditor() {
  const [location, setLocation] = useLocation();
  const websiteId = location.split("/dashboard/wd-editor/")[1]?.split("/")[0] || null;
  const { toast } = useToast();
  const { user } = useAuth();
  const isPaid = user?.role === "paid" || user?.role === "admin" || user?.id === "admin";
  const [showImageMemoryDialog, setShowImageMemoryDialog] = useState(false);
  const [lastUploadedImageSrc, setLastUploadedImageSrc] = useState<string>("");
  const [lastUploadedImageName, setLastUploadedImageName] = useState<string>("");

  const [siteData, setSiteData] = useState<WDSiteData | null>(null);
  const [categoryId, setCategoryId] = useState("water-damage");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'deploying' | 'completed' | 'failed'>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAutoGeneratingBlogs, setIsAutoGeneratingBlogs] = useState(false);
  const [autoBlogProgress, setAutoBlogProgress] = useState({ current: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("business");
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [previewPage, setPreviewPage] = useState("index.html");
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [netlifyToken, setNetlifyToken] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [desiredSlug, setDesiredSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatusMessage, setSlugStatusMessage] = useState("");
  const [apiStatus, setApiStatus] = useState<"checking" | "ready" | "none">("checking");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [skipDomainCheck, setSkipDomainCheck] = useState(false);
  const [visualEditorOverrides, setVisualEditorOverrides] = useState<Record<string, string>>({});
  const [aiProvider, setAiProvider] = useState<AIProvider>("gemini");
  const [availableAIProviders, setAvailableAIProviders] = useState<AIProvider[]>([]);
  const [lastAIGenerationAt, setLastAIGenerationAt] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoadRef = useRef(true);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadKeyRef = useRef<string | null>(null);
  const siteDataRef = useRef<WDSiteData | null>(null);
  const checklistItems = getChecklistItemStates(siteData);
  const checklistMetrics = getChecklistMetrics(siteData);
  const hasGeneratedAIContent = Boolean(
    siteData && (
      siteData.homepageContent ||
      (siteData as any)._aiAboutContent ||
      (Array.isArray((siteData as any)._aiIntroParas) && (siteData as any)._aiIntroParas.length > 0) ||
      (Array.isArray((siteData as any)._aiTestimonials) && (siteData as any)._aiTestimonials.length > 0) ||
      (Array.isArray((siteData as any)._aiFaqs) && (siteData as any)._aiFaqs.length > 0) ||
      (Array.isArray((siteData as any)._aiProcessSteps) && (siteData as any)._aiProcessSteps.length > 0) ||
      (Array.isArray((siteData as any)._aiWhyChooseUs) && (siteData as any)._aiWhyChooseUs.length > 0) ||
      Boolean((siteData as any)._aiSeoBody) ||
      Boolean((siteData as any)._aiServiceDescs)
    )
  );

  async function persistCurrentWebsiteState(
    data: WDSiteData,
    options?: { includeCustomFiles?: boolean }
  ) {
    if (!websiteId) {
      console.warn("[persistCurrentWebsiteState] No websiteId provided.");
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const payload: Record<string, unknown> = {
      businessData: stripDeploymentFields(data),
    };

    // Only include customFiles when there are actual overrides. Sending an empty
    // object triggers the server's generateAllWebsiteFiles path which is
    // incompatible with local-service (WD) templates and causes save failures.
    if (options?.includeCustomFiles && Object.keys(visualEditorOverrides).length > 0) {
      payload.customFiles = visualEditorOverrides;
    }

    console.log("[persistCurrentWebsiteState] Sending PUT request to save website...");
    const res = await fetch(`/api/websites/${websiteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    console.log("[persistCurrentWebsiteState] Save response status:", res.status);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[persistCurrentWebsiteState] Save error details:", errData);
      throw new Error(errData.message || errData.error || "Failed to save website");
    }

    console.log("[persistCurrentWebsiteState] Website saved successfully.");
    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus("idle"), 2000);
  }

  function toggleChecklistItem(itemId: string, checked: boolean) {
    setSiteData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        publishChecklist: {
          ...(prev.publishChecklist || {}),
          [itemId]: checked,
        },
      };
    });
  }

  // ── Auto-save when siteData changes ──────────────────────────────────

  useEffect(() => {
    // Skip auto-save on initial load
    if (isFirstLoadRef.current) {
      if (siteData !== null) isFirstLoadRef.current = false;
      return;
    }
    if (!siteData || !websiteId) return;

    // Debounce: save 3 seconds after last change
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("saving");
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await persistCurrentWebsiteState(siteData);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 3000);
  }, [siteData]);

  // Keep a ref of siteData so callbacks (postMessage handler) get the latest value
  useEffect(() => { siteDataRef.current = siteData; }, [siteData]);

  // ── Click-to-upload: listen for postMessage from preview iframe ───────

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'wd-img-click' || !e.data.key) return;
      pendingUploadKeyRef.current = e.data.key;
      hiddenFileInputRef.current?.click();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ── Polling & Status Check ─────────────────────────────────────────
  const startPollingGenerationStatus = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    setGenerationStatus('generating');
    setIsGeneratingAI(true);
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!websiteId) return;
      try {
        const res = await fetch(`/api/websites/${websiteId}/generation-status`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        
        setGenerationStatus(data.status || 'idle');
        setGenerationProgress(data.progress || 0);
        setGenerationError(data.error || null);
        
        if (data.status === 'completed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setIsGeneratingAI(false);
          setGenerationStatus('completed');
          toast({ title: "Content generation completed!", description: "Unique website copy generated successfully." });
          // Reload website data from server
          await loadWebsite();
        } else if (data.status === 'failed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setIsGeneratingAI(false);
          setGenerationStatus('failed');
          toast({
            title: "AI Generation Failed",
            description: data.error || "An error occurred during content generation.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error polling generation status in editor:", err);
      }
    }, 2000);
  }, [websiteId, toast]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // ── Load website data ─────────────────────────────────────────────────

  useEffect(() => {
    if (!websiteId) {
      setIsLoading(false);
      return;
    }
    loadWebsite();
  }, [websiteId]);

  async function loadWebsite() {
    try {
      const res = await fetch(`/api/websites/${websiteId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load website");
      const data = await res.json();

      const bd = data.businessData || {};

      // Load saved images from sessionStorage
      let savedImages: any = null;
      try {
        const stored = sessionStorage.getItem(`site-images-${websiteId}`);
        if (stored) {
          savedImages = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to parse sessionStorage images:", e);
      }

      // Merge customImages:
      const mergedCustomImages = { ...(bd.customImages || {}) };
      if (savedImages?.customImages) {
        for (const [k, v] of Object.entries(savedImages.customImages)) {
          if (v) mergedCustomImages[k] = v as string;
        }
      }

      // Merge galleryImages:
      const mergedGalleryImages = (Array.isArray(bd.galleryImages) ? bd.galleryImages : []).map((img: any) => {
        if (img.pairId && img.type && savedImages?.galleryImages) {
          const match = savedImages.galleryImages.find((sImg: any) => sImg.pairId === img.pairId && sImg.type === img.type);
          if (match?.src) {
            return { ...img, src: match.src };
          }
        }
        if (img.type === 'normal' && savedImages?.galleryImages) {
          const dbNormals = (bd.galleryImages as any[]).filter(dbImg => dbImg.type === 'normal');
          const normals = (savedImages.galleryImages as any[]).filter(sImg => sImg.type === 'normal');
          const normalIdx = dbNormals.indexOf(img);
          if (normalIdx !== -1 && normals[normalIdx]?.src) {
            return { ...img, src: normals[normalIdx].src };
          }
        }
        return img;
      });

      const loadedSiteData: WDSiteData = {
        id: data.id,
        categoryId: bd.categoryId || data.template || "water-damage",
        businessName: bd.businessName || data.title || "",
        phone: bd.phone || "",
        email: bd.email || "",
        address: bd.address || "",
        city: bd.city || "",
        state: bd.state || "",
        primaryKeyword: bd.primaryKeyword || bd.categoryId && getCategoryConfig(bd.categoryId).defaultPrimaryKeyword || "Water Damage Restoration",
        services: Array.isArray(bd.services) ? bd.services : bd.services ? String(bd.services).split(/[\n;]/).map((s: string) => s.trim()).filter(Boolean) : [],
        serviceAreas: Array.isArray(bd.serviceAreas) ? bd.serviceAreas : bd.serviceAreas ? String(bd.serviceAreas).split(/[\n;]/).map((s: string) => s.trim()).filter(Boolean) : [],
        urlSlug: bd.urlSlug || "",
        primaryColor: bd.primaryColor || "#1e3a5f",
        secondaryColor: bd.secondaryColor || "#0ea5e9",
        contactFormEmbed: bd.contactFormEmbed || "",
        googleMapsUrl: bd.googleMapsUrl || buildAddressMapEmbedUrl(bd.address || "", bd.city || "", bd.state || ""),
        openaiApiKey: bd.openaiApiKey || "",
        geminiApiKey: bd.geminiApiKey || "",
        contentAiProvider: isAIProvider(bd.contentAiProvider)
          ? bd.contentAiProvider
          : bd.geminiApiKey
            ? "gemini"
            : bd.openaiApiKey
              ? "openai"
              : "gemini",
        homepageContent: bd.homepageContent,
        serviceContent: bd.serviceContent,
        locationContent: bd.locationContent,
        customImages: mergedCustomImages,
        publishChecklist: bd.publishChecklist || {},
        facebookUrl: bd.facebookUrl || "",
        instagramUrl: bd.instagramUrl || "",
        googleUrl: bd.googleUrl || "",
        yelpUrl: bd.yelpUrl || "",
        twitterUrl: bd.twitterUrl || "",
        floatingCTA: bd.floatingCTA || "call",
        whatsappNumber: bd.whatsappNumber || "",
        businessHours: bd.businessHours || "",
        galleryImages: mergedGalleryImages,
        blogPosts: Array.isArray(bd.blogPosts) ? bd.blogPosts : [],
        generateBlog: bd.generateBlog ?? (Array.isArray(bd.blogPosts) && bd.blogPosts.length > 0),
        logoUrl: bd.logoUrl,
        faviconUrl: bd.faviconUrl,
        googleAnalyticsId: bd.googleAnalyticsId || "",
        customHeadCode: bd.customHeadCode || "",
        _aiIntroParas: bd._aiIntroParas,
        _aiFaqs: bd._aiFaqs,
        _aiSeoBody: bd._aiSeoBody,
        _aiProcessSteps: bd._aiProcessSteps,
        _aiWhyChooseUs: bd._aiWhyChooseUs,
        _aiAboutContent: bd._aiAboutContent,
        _aiTestimonials: bd._aiTestimonials,
        _aiServiceDescs: bd._aiServiceDescs,
        enableMatrixPages: bd.enableMatrixPages ?? false,
        hideBeforeAfter: bd.hideBeforeAfter ?? false,
        publishTier: (!isPaid && bd.publishTier !== '1') ? '1' : (bd.publishTier || '1'),
        generationStatus: bd.generationStatus || 'idle',
        generationProgress: bd.generationProgress ?? 0,
        generationError: bd.generationError || null,
        netlifyUrl: data.netlifyUrl,
        deploymentStatus: data.netlifyDeploymentStatus,
      } as any;
      setSiteData(loadedSiteData);
      if (loadedSiteData.contentAiProvider) setAiProvider(loadedSiteData.contentAiProvider as AIProvider);
      if (data.netlifyUrl) setDeployedUrl(data.netlifyUrl);
      if (data.template) setCategoryId(data.template);

      // Load saved Netlify token if available — mark as connected immediately
      // (token was already verified when saved, no need to re-verify on every load)
      fetch("/api/settings/netlify", { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(s => {
          // API returns masked "•••••••••••" when token exists — that's fine,
          // server resolves the real token during deploy. Just mark as connected.
          if (s?.apiKey) {
            setNetlifyToken(s.apiKey);
            setTokenValid(true);
          }
        })
        .catch(() => {});

      // Check if any AI API key is configured (for status indicator)
      Promise.all([
        fetch("/api/settings/openai", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/settings/gemini", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/settings/openrouter", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/settings/deepseek", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]).then(([openai, gemini, openrouter, deepseek]) => {
        const available: AIProvider[] = [];
        if (openai?.apiKey || bd.openaiApiKey) available.push('openai');
        if (gemini?.apiKey || bd.geminiApiKey) available.push('gemini');
        if (openrouter?.apiKey) available.push('openrouter');
        if (deepseek?.apiKey || bd.deepseekApiKey) available.push('deepseek');
        
        setAvailableAIProviders(available);
        const hasKey = available.length > 0;
        setApiStatus(hasKey ? "ready" : "none");
        
        // Set aiProvider to first available or keep current if available
        if (hasKey && !available.includes(aiProvider)) {
          setAiProvider(available[0]);
        }
      });

      // Try to load pre-generated files (stored as customFiles in DB)
      if (data.customFiles && typeof data.customFiles === "object" && Object.keys(data.customFiles).length > 0) {
        const catId = (data.template as string) || "water-damage";
        const isRestoration = ["water-damage", "mold-remediation", "fire-damage"].includes(catId);
        let isStale = false;
        
        if (!isRestoration) {
          const indexHtml = (data.customFiles as Record<string, string>)["index.html"] || "";
          if (
            indexHtml.includes("Water Extraction & Cleanup") ||
            indexHtml.includes("Rapid Structural Drying") ||
            indexHtml.includes("Mold Containment & Removal")
          ) {
            console.warn(`[editor] Stale water damage content detected in custom files for category ${catId}. Re-generating fresh files.`);
            isStale = true;
          }
        }

        if (isStale) {
          try {
            const domain = (loadedSiteData as any).urlSlug || ((loadedSiteData.businessName || 'my-site').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            const autoFiles = generateLocalServiceWebsite(catId, siteDataToWDData(loadedSiteData as any), domain);
            setGeneratedFiles(autoFiles);
          } catch (e) {
            console.error('Auto-generate preview failed after stale detection:', e);
            setGeneratedFiles(data.customFiles);
          }
        } else {
          // Generate fresh base files first to ensure dynamic pages (blog, services, locations, matrix) are up to date
          let baseFiles: Record<string, string> = {};
          try {
            const domain = (loadedSiteData as any).urlSlug || ((loadedSiteData.businessName || 'my-site').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
            baseFiles = generateLocalServiceWebsite(catId, siteDataToWDData(loadedSiteData as any), domain);
          } catch (e) {
            console.error('Failed to generate base files client-side:', e);
          }

          const processed: Record<string, string> = { ...baseFiles };
          if (data.customFiles) {
            for (const [filename, content] of Object.entries(data.customFiles)) {
              if (typeof content === 'string' && filename.endsWith('.html')) {
                // Skip overwriting dynamic pages with legacy/stale custom files
                const isDynamicPage = filename === 'blog.html' || 
                                      filename.startsWith('blog/') || 
                                      filename.startsWith('services/') || 
                                      filename.startsWith('locations/') || 
                                      filename.startsWith('matrix/');
                if (isDynamicPage) {
                  continue;
                }

                processed[filename] = content
                  .replace(/\{\{city\}\}/g, loadedSiteData.city || '')
                  .replace(/\{\{state\}\}/g, loadedSiteData.state || '')
                  .replace(/\{\{businessName\}\}/g, loadedSiteData.businessName || '')
                  .replace(/class="footer-inner has-two-cols"/g, 'class="footer-inner has-two-cols" style="grid-template-columns: 1fr 1fr;"')
                  .replace(/class="footer-phone"/g, 'class="footer-phone" style="white-space: nowrap;"');
              } else if (!processed[filename]) {
                processed[filename] = content as string;
              }
            }
          }
          setGeneratedFiles(processed);
        }
        // Do NOT set visualEditorOverrides from customFiles — generatedFiles already contains
        // them and overrides should only be set during live Visual Editor edits this session.
        // Setting overrides here would prevent image uploads from refreshing the preview.
      } else {
        // No saved files — auto-generate client-side so preview & Visual Editor work immediately
        try {
          const domain = (loadedSiteData as any).urlSlug || ((loadedSiteData.businessName || 'my-site').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          const catId = (data.template as string) || 'water-damage';
          const autoFiles = generateLocalServiceWebsite(catId, siteDataToWDData(loadedSiteData as any), domain);
          setGeneratedFiles(autoFiles);
        } catch (e) {
          console.error('Auto-generate preview failed:', e);
        }
      }

      // Auto-resume polling if generation is active
      if (bd.generationStatus === 'generating' || bd.generationStatus === 'deploying') {
        startPollingGenerationStatus();
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not load website data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Regenerate website files ──────────────────────────────────────────

  async function regenerateFiles() {
    if (!siteData) return;
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/generate-wd-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...stripDeploymentFields(siteData),
          categoryId: categoryId,
          websiteId: websiteId,
          returnFiles: true,  // ask server to return JSON files, not ZIP
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      // Check if response is JSON (files) or ZIP
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const data = await res.json();
        const files = data.files || {};
        setGeneratedFiles(files);
        setVisualEditorOverrides({});
        setApiStatus("ready");
        // Files + businessData are already persisted by the server in the same request.
        // No extra PUT needed here.

        toast({ title: "Regenerated", description: "Website saved and ready to preview." });
      } else {
        // ZIP fallback - prompt download
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${siteData.urlSlug}-website.zip`; a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded", description: "Website ZIP downloaded." });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setIsRegenerating(false);
    }
  }

  // ── AI Content Generation ─────────────────────────────────────────────

  async function generateAIContent() {
    if (!websiteId || !siteData) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/generate-local-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ aiProvider, publishTier: siteData.publishTier || '1' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          toast({ title: "No AI API key", description: "Add or save an OpenAI, Gemini, OpenRouter, or DeepSeek key first.", variant: "destructive" });
        } else if (res.status === 504) {
          toast({
            title: "Generation timed out",
            description: errData.error || "Current provider took too long. Please retry or switch provider.",
            variant: "destructive"
          });
        } else {
          throw new Error(errData.error || `Server error ${res.status}`);
        }
        setIsGeneratingAI(false);
        return;
      }
      const data = await res.json();
      if (data.status === 'generating') {
        toast({ title: "Content generation started!", description: "AI content is writing in the background." });
        startPollingGenerationStatus();
      }
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "destructive" });
      setIsGeneratingAI(false);
    }
  }

  // ── Auto-generate blog posts (triggered after AI content) ─────────

  async function autoGenerateBlogPosts(currentData: WDSiteData) {
    // Build 5 keywords from services + city
    const services = currentData.services || [];
    const city = currentData.city || '';
    const keyword = currentData.primaryKeyword || '';
    const areas = currentData.serviceAreas || [];

    const blogKeywords: string[] = [];
    // Service + city combinations
    for (const svc of services.slice(0, 3)) {
      blogKeywords.push(`${svc} in ${city}`);
    }
    // Add a tips article
    if (keyword) blogKeywords.push(`${keyword} tips for homeowners in ${city}`);
    // Add a location-based article
    if (areas.length > 0) blogKeywords.push(`how to choose a ${keyword.toLowerCase()} company in ${city}`);

    // Ensure exactly 5
    while (blogKeywords.length < 5 && keyword) {
      const extras = [
        `cost of ${keyword.toLowerCase()} in ${city}`,
        `signs you need ${keyword.toLowerCase()}`,
        `${keyword.toLowerCase()} FAQs answered by experts`,
        `emergency ${keyword.toLowerCase()} guide for ${city}`,
        `${keyword.toLowerCase()} vs DIY - what ${city} homeowners should know`,
      ];
      for (const ex of extras) {
        if (blogKeywords.length >= 5) break;
        if (!blogKeywords.includes(ex)) blogKeywords.push(ex);
      }
    }

    const finalKeywords = blogKeywords.slice(0, 5);
    if (finalKeywords.length === 0) return;

    setIsAutoGeneratingBlogs(true);
    setAutoBlogProgress({ current: 0, total: finalKeywords.length });

    const newPosts: NonNullable<WDSiteData['blogPosts']> = [];

    for (let i = 0; i < finalKeywords.length; i++) {
      setAutoBlogProgress({ current: i + 1, total: finalKeywords.length });

      try {
        const res = await fetch('/api/ai/blog-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            businessName: currentData.businessName,
            category: currentData.primaryKeyword,
            location: `${currentData.city}, ${currentData.state}`,
            services: currentData.services?.join(', ') || '',
            serviceAreas: currentData.serviceAreas?.join(', ') || '',
            keyword: finalKeywords[i],
            wordCount: 1200,
            useImages: true,
            aiProvider,
          }),
        });

        if (!res.ok) continue;

        const data = await res.json();
        if (data.success && data.blogPost) {
          newPosts.push({
            ...data.blogPost,
            id: data.blogPost.id || `blog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            isAiGenerated: true,
            date: new Date().toISOString().split('T')[0],
          });
          // Update in real-time
          setSiteData(prev => {
            if (!prev) return prev;
            const updated = { ...prev, blogPosts: [...newPosts] };
            rebuildPreview(updated);
            return updated;
          });
        }
      } catch {
        // Skip failed posts silently
      }
    }

    setIsAutoGeneratingBlogs(false);
    if (newPosts.length > 0) {
      toast({ title: `${newPosts.length} blog posts generated!`, description: "Blog page and individual posts are now in your website." });
    }
  }

  // ── Save changes to DB ────────────────────────────────────────────────

  async function saveChanges() {
    if (!siteData || !websiteId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessData: stripDeploymentFields(siteData) }),
      });
      if (!res.ok) throw new Error("Save failed");
      if (siteData.openaiApiKey || siteData.geminiApiKey) setApiStatus("ready");
      toast({ title: "Saved", description: "Changes saved successfully." });
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function downloadZip() {
    if (!siteData) return;
    try {
      // First save changes so DB has latest content
      const saveRes = await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessData: stripDeploymentFields(siteData) }),
      });
      if (!saveRes.ok) throw new Error("Failed to save changes before download");
      if (siteData.openaiApiKey || siteData.geminiApiKey) setApiStatus("ready");

      const res = await fetch("/api/generate-wd-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...siteDataToWDData(siteData),
          categoryId: categoryId,
          websiteId: websiteId,
          returnFiles: false,  // download ZIP
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${siteData.urlSlug || 'website'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Website ZIP downloaded successfully." });
    } catch (err) {
      toast({ title: "Download Failed", description: String(err), variant: "destructive" });
    }
  }

  // ── Deploy to Netlify ─────────────────────────────────────────────────

  async function deployToNetlify() {
    if (!siteData) return;
    if (!netlifyToken) {
      toast({ title: "Netlify Token Required", description: "Verify your Netlify token in the Deploy tab first.", variant: "destructive" });
      return;
    }

    if (slugAvailable !== true) {
      toast({ title: "Check Site Name First", description: "Run the Netlify site name check before publishing so we can confirm the URL is available.", variant: "destructive" });
      return;
    }

    // Show animation immediately so user knows the button was clicked
    setIsDeploying(true);

    const slug = (desiredSlug || siteData.urlSlug || "").trim();

    // Guard: check if another website in this account already uses the same slug
    try {
      const dbRes = await fetch("/api/websites", { credentials: "include" });
      if (dbRes.ok) {
        const allSites = await dbRes.json();
        const conflict = allSites.find((s: any) => {
          if (String(s.id) === String(websiteId)) return false;
          const siteUrl: string = s.netlifyUrl || s.businessData?.urlSlug || "";
          return siteUrl.toLowerCase().includes(slug.toLowerCase());
        });
        if (conflict) {
          const conflictName = (conflict.businessData as any)?.businessName || conflict.title || "Another site";
          const proceed = window.confirm(
            `⚠️ WARNING: "${conflictName}" is already deployed to a URL that contains "${slug}".\n\nDeploying will OVERWRITE that site's content on Netlify.\n\nAre you sure you want to continue?`
          );
          if (!proceed) {
            setIsDeploying(false);
            return;
          }
        }
      }
    } catch { /* non-blocking — let deploy proceed if the check fails */ }

    try {
      // Save latest changes (including logo) to DB before reading on server
      await fetch(`/api/websites/${websiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessData: stripDeploymentFields(siteData) }),
      });

      const res = await fetch(`/api/websites/${websiteId}/deploy-wd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          netlifyApiKey: netlifyToken,
          siteName: slug,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Server error ${res.status}`);
      }
      const data = await res.json();
      const url = data.url || `https://${slug}.netlify.app`;
      setDeployedUrl(url);
      toast({ title: "🚀 Deploying!", description: `Your site will be live at ${url} in ~30 seconds.` });
    } catch (err) {
      toast({
        title: "Deploy Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  }

  // ── Unpublish site ────────────────────────────────────────────────────
  async function unpublishSite() {
    if (!websiteId) return;
    const confirmed = window.confirm(
      "Unpublish this site?\n\nThe live Netlify URL will stop working and you'll be able to delete this website. This cannot be undone from here."
    );
    if (!confirmed) return;
    setIsUnpublishing(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/unpublish`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unpublish");
      setDeployedUrl("");
      toast({ title: "Unpublished", description: "The site has been unpublished. You can now delete it if needed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUnpublishing(false);
    }
  }

  // ── Verify Netlify token ──────────────────────────────────────────────
  async function verifyNetlifyToken() {
    if (!netlifyToken.trim()) return;
    setIsVerifyingToken(true);
    setTokenValid(null);
    setSlugAvailable(null);
    setSlugStatusMessage("");
    try {
      const res = await fetch("https://api.netlify.com/api/v1/user", {
        headers: { Authorization: `Bearer ${netlifyToken}` }
      });
      setTokenValid(res.ok);
      if (res.ok) {
        const userData = await res.json();
        // Persist token globally so it survives page reloads
        fetch("/api/settings/netlify", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ apiKey: netlifyToken, isActive: true })
        }).catch(() => {});
        toast({ title: "Token Valid", description: `Connected as ${userData.email || userData.slug || "Netlify user"}` });
      } else {
        toast({ title: "Invalid Token", description: "Check your Netlify personal access token.", variant: "destructive" });
      }
    } catch {
      setTokenValid(false);
      toast({ title: "Error", description: "Could not connect to Netlify.", variant: "destructive" });
    } finally {
      setIsVerifyingToken(false);
    }
  }

  // ── Check domain availability ─────────────────────────────────────────
  async function checkSlugAvailability() {
    if (!siteData) return;

    const slug = (desiredSlug || siteData.urlSlug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .trim();

    if (!netlifyToken.trim()) return;
    if (!slug) {
      setSlugAvailable(null);
      setSlugStatusMessage("Enter a site name first.");
      toast({ title: "Site Name Required", description: "Enter a Netlify site name before checking availability.", variant: "destructive" });
      return;
    }

    setIsCheckingSlug(true);
    setSlugAvailable(null);
    setSlugStatusMessage("");
    try {
      setDesiredSlug(slug);

      const res = await fetch("/api/netlify/check-site-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          apiKey: netlifyToken,
          siteName: slug,
          websiteId,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Could not verify availability.");
      }

      setSlugAvailable(Boolean(data?.available));
      setSlugStatusMessage(
        data?.message ||
        (data?.available
          ? `"${slug}.netlify.app" is available. You can publish with this name.`
          : `"${slug}.netlify.app" is not available. Choose a different site name.`)
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not verify availability.";
      setSlugAvailable(null);
      setSlugStatusMessage(message);
      toast({ title: "Check failed", description: message, variant: "destructive" });
    } finally {
      setIsCheckingSlug(false);
    }
  }

  // ── Image upload ──────────────────────────────────────────────────────

  // Rebuild the preview files client-side (pure template, no AI, instant)
  function rebuildPreview(data: WDSiteData) {
    try {
      const domain = data.urlSlug || data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newFiles = generateLocalServiceWebsite(categoryId, siteDataToWDData(data), domain);
      setGeneratedFiles(newFiles);
      // Clear visual editor overrides so the freshly generated HTML (with new images) is shown
      setVisualEditorOverrides({});
    } catch (e) {
      console.error('Preview rebuild failed:', e);
    }
  }

  // Helper to slugify strings the same way as the generator
  const toSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const getBlogImageSlugFromKey = (key: string): string | null => {
    const prefix = 'blog-img-';
    if (!key.startsWith(prefix)) return null;

    const slug = key.slice(prefix.length).trim();
    return slug || null;
  };

  /**
   * Incremental page generation — only generate pages that don't already exist.
   * Merges new pages into the existing generatedFiles without regenerating everything.
   * Also updates homepage (for nav/service cards), sitemap, and blog archive.
   *
   * @param mode  Which type of pages to add: 'services' | 'locations' | 'matrix' | 'blog'
   */
  function generateIncrementalPages(mode: 'services' | 'locations' | 'matrix' | 'blog') {
    if (!siteData) return;
    const data = siteData;
    const domain = data.urlSlug || data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const wdData = enrichBusinessDataForCategory(categoryId, siteDataToWDData(data)) as any;
    const existing = { ...generatedFiles };
    let newCount = 0;

    if (mode === 'services') {
      const citySlug = toSlug(data.city || '');
      for (const svc of (data.services || [])) {
        const filename = `services/${toSlug(svc)}-${citySlug}.html`;
        if (!existing[filename]) {
          existing[filename] = generateServicePage(wdData, svc, domain);
          newCount++;
        }
      }
    }

    if (mode === 'locations') {
      for (const loc of (data.serviceAreas || [])) {
        const filename = `locations/${toSlug(loc)}.html`;
        if (!existing[filename]) {
          existing[filename] = generateLocationPage(wdData, loc, domain);
          newCount++;
        }
      }
    }

    if (mode === 'matrix') {
      for (const svc of (data.services || [])) {
        for (const loc of (data.serviceAreas || [])) {
          const filename = `matrix/${toSlug(svc)}-in-${toSlug(loc)}.html`;
          if (!existing[filename]) {
            existing[filename] = generateServiceLocationMatrixPage(wdData, svc, loc, domain);
            newCount++;
          }
        }
      }
    }

    if (mode === 'blog') {
      const posts = data.blogPosts || [];
      for (const post of posts) {
        const filename = `blog/${post.slug}.html`;
        if (!existing[filename]) {
          existing[filename] = generateBlogPostPage(wdData, {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt || '',
            content: post.content,
            featuredImage: post.featuredImage,
            date: new Date().toISOString().split('T')[0],
            category: post.category,
          }, domain);
          newCount++;
        }
      }
      // Always update blog archive so new posts appear
      existing['blog.html'] = generateBlogArchivePage(wdData, domain);
    }

    // Update homepage (service cards, nav, locations links change with new pages)
    existing['index.html'] = generateHomepage(wdData, domain);

    // Update sitemaps
    existing['sitemap.xml'] = generateSitemap(wdData, domain);
    existing['sitemap.html'] = generateHTMLSitemap(wdData, domain);
    existing['robots.txt'] = generateRobots(wdData, domain);
    existing['llms.txt'] = generateLLMsTxt(wdData, domain);

    setGeneratedFiles(existing);

    const labels: Record<string, string> = {
      services: 'service', locations: 'location', matrix: 'matrix', blog: 'blog'
    };
    toast({
      title: newCount > 0
        ? `${newCount} new ${labels[mode]} page${newCount > 1 ? 's' : ''} generated`
        : `All ${labels[mode]} pages already exist`,
      description: newCount > 0 ? 'Merged into existing site — no full rebuild needed' : undefined,
    });
  }

  function saveImagesToSession(id: string | null, data: WDSiteData) {
    if (!id) return;
    try {
      sessionStorage.setItem(`site-images-${id}`, JSON.stringify({
        customImages: data.customImages || {},
        galleryImages: data.galleryImages || []
      }));
    } catch (e) {
      console.warn("sessionStorage quota exceeded or error saving:", e);
    }
  }

  async function handleCustomImageUpload(key: string, file: File) {
    try {
      const dataUrl = await compressImage(file, 1000, 1000, 0.75);
      const current = siteDataRef.current || siteData;
      const updatedImages = { ...(current?.customImages || {}), [key]: dataUrl };
      const blogSlug = getBlogImageSlugFromKey(key);
      const nextData = current
        ? {
            ...current,
            customImages: updatedImages,
            blogPosts: blogSlug
              ? (current.blogPosts || []).map(post =>
                  post.slug === blogSlug
                    ? { ...post, featuredImage: dataUrl }
                    : post
                )
              : current.blogPosts,
          }
        : current;

      setSiteData(nextData);
      if (nextData) {
        saveImagesToSession(websiteId, nextData);
        rebuildPreview(nextData);
      }
      setLastUploadedImageSrc(dataUrl);
      setLastUploadedImageName(file.name || `${key}.jpg`);
      setShowImageMemoryDialog(true);
      toast({ title: "Image stored in session", description: "This image is kept in session memory and will be deployed to Netlify." });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    }
  }

  function removeCustomImage(key: string) {
    setSiteData(prev => {
      if (!prev?.customImages) return prev;
      const updated = { ...prev.customImages };
      delete updated[key];
      const next = { ...prev, customImages: updated };
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      return next;
    });
  }

  // ── Gallery management ────────────────────────────────────────────────

  function getGalleryPairs(data: WDSiteData) {
    const images = data.galleryImages || [];
    const pairIds = Array.from(new Set(images.filter(i => i.pairId).map(i => i.pairId!)));
    return pairIds.map(id => ({
      id,
      before: images.find(i => i.pairId === id && i.type === 'before'),
      after:  images.find(i => i.pairId === id && i.type === 'after'),
    }));
  }

  function getGalleryNormal(data: WDSiteData) {
    return (data.galleryImages || []).filter(i => i.type === 'normal');
  }

  function addBeforeAfterPair() {
    const current = siteDataRef.current || siteData;
    if (!current) return;
    const pairs = getGalleryPairs(current);
    if (pairs.length >= 20) { toast({ title: "Max 20 pairs reached" }); return; }
    const pairId = `pair-${Date.now()}`;
    const next = {
      ...current,
      galleryImages: [
        ...(current.galleryImages || []),
        { src: '', alt: 'Before photo', type: 'before' as const, pairId, caption: '' },
        { src: '', alt: 'After photo',  type: 'after'  as const, pairId, caption: '' },
      ],
    };
    setSiteData(next);
  }

  function removeBeforeAfterPair(pairId: string) {
    setSiteData(prev => {
      if (!prev) return prev;
      const next = { ...prev, galleryImages: (prev.galleryImages || []).filter(i => i.pairId !== pairId) };
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      return next;
    });
  }

  async function uploadPairImage(pairId: string, type: 'before' | 'after', file: File) {
    try {
      const src = await compressImage(file, 1000, 1000, 0.75);
      const current = siteDataRef.current || siteData;
      if (!current) return;
      const next = {
        ...current,
        galleryImages: (current.galleryImages || []).map(img =>
          img.pairId === pairId && img.type === type ? { ...img, src } : img
        ),
      };
      setSiteData(next);
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      setLastUploadedImageSrc(src);
      setLastUploadedImageName(file.name || `${type}.jpg`);
      setShowImageMemoryDialog(true);
      toast({ title: "Image stored in session", description: "This image is kept in session memory and will be deployed to Netlify." });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    }
  }

  function addGalleryPhoto() {
    const current = siteDataRef.current || siteData;
    if (!current) return;
    const normal = getGalleryNormal(current);
    if (normal.length >= 50) { toast({ title: "Max 50 gallery photos reached" }); return; }
    const next = {
      ...current,
      galleryImages: [
        ...(current.galleryImages || []),
        { src: '', alt: 'Gallery photo', type: 'normal' as const },
      ],
    };
    setSiteData(next);
  }

  function removeGalleryPhoto(index: number) {
    setSiteData(prev => {
      if (!prev) return prev;
      const normals = (prev.galleryImages || []).filter(i => i.type === 'normal');
      const toRemove = normals[index];
      if (!toRemove) return prev;
      const next = { ...prev, galleryImages: (prev.galleryImages || []).filter(i => i !== toRemove) };
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      return next;
    });
  }

  function clearAllGalleryPhotos() {
    setSiteData(prev => {
      if (!prev) return prev;
      const next = { ...prev, galleryImages: (prev.galleryImages || []).filter(i => i.type !== 'normal') };
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      toast({ title: "Cleared all gallery photos" });
      return next;
    });
  }

  async function uploadGalleryPhoto(index: number, file: File) {
    try {
      const src = await compressImage(file, 1000, 1000, 0.75);
      const current = siteDataRef.current || siteData;
      if (!current) return;
      const normals = (current.galleryImages || []).filter(i => i.type === 'normal');
      const target = normals[index];
      if (!target) return;
      const next = {
        ...current,
        galleryImages: (current.galleryImages || []).map(img =>
          img === target ? { ...img, src } : img
        ),
      };
      setSiteData(next);
      saveImagesToSession(websiteId, next);
      rebuildPreview(next);
      setLastUploadedImageSrc(src);
      setLastUploadedImageName(file.name || `gallery-${index}.jpg`);
      setShowImageMemoryDialog(true);
      toast({ title: "Image stored in session", description: "This image is kept in session memory and will be deployed to Netlify." });
    } catch (err) {
      toast({ title: "Upload failed", description: String(err), variant: "destructive" });
    }
  }

  async function uploadGalleryPhotosBulk(files: FileList) {
    const current = siteDataRef.current || siteData;
    if (!current) return;

    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;

    let loadedCount = 0;
    const nextImages = [...(current.galleryImages || [])];

    for (const file of filesArray) {
      try {
        const src = await compressImage(file, 1000, 1000, 0.75);
        nextImages.push({ src, alt: 'Gallery photo', type: 'normal' });
      } catch (err) {
        console.error("Bulk upload image compression error:", err);
      }
      loadedCount++;

      if (loadedCount === filesArray.length) {
        const next = {
          ...current,
          galleryImages: nextImages.slice(0, 50),
        };
        setSiteData(next);
        saveImagesToSession(websiteId, next);
        rebuildPreview(next);
        toast({ title: "Images stored in session", description: `Successfully uploaded ${filesArray.length} gallery photos to session memory.` });
      }
    }
  }

  // ── Update site data fields ───────────────────────────────────────────

  function updateField(path: string, value: any) {
    setSiteData(prev => {
      if (!prev) return prev;
      const copy = { ...prev };
      const parts = path.split(".");
      let obj: any = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  // ── Reset preview page if no longer generated (e.g. tier changed) ────
  useEffect(() => {
    if (Object.keys(generatedFiles).length > 0 && previewPage !== 'index.html' && !generatedFiles[previewPage]) {
      setPreviewPage('index.html');
    }
  }, [generatedFiles, previewPage]);

  // ── Preview blob URL for iframe (blob avoids data: URL size limits with large images) ──

  useEffect(() => {
    if (Object.keys(generatedFiles).length === 0) {
      setPreviewBlobUrl(null);
      return;
    }
    const html = visualEditorOverrides[previewPage] || generatedFiles[previewPage] || generatedFiles['index.html'] || '';
    const withScript = html.replace('</body>', PREVIEW_CLICK_SCRIPT + '</body>');
    const blob = new Blob([withScript], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [generatedFiles, previewPage, visualEditorOverrides]);

  // ── Visual Editor helpers ─────────────────────────────────────────────

  function mergeBodyIntoDocument(baseHtml: string, bodyHtml: string, css?: string): string {
    if (!bodyHtml?.trim()) return baseHtml;
    const bodyTagMatch = baseHtml.match(/<body[^>]*>/i);
    if (!bodyTagMatch) return bodyHtml;
    const bodyOpenTag = bodyTagMatch[0];

    // Extract all <script> tags from original body to prevent visual editor from stripping them
    const bodyMatch = baseHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let originalScripts = '';
    if (bodyMatch) {
      const originalBodyContent = bodyMatch[1];
      const scriptRegex = /<script[\s\S]*?<\/script>/gi;
      const scripts = originalBodyContent.match(scriptRegex) || [];
      originalScripts = scripts.join('\n');
    }

    let finalBodyContent = bodyHtml;
    if (css && css.trim()) {
      finalBodyContent += `\n<style data-gjs-styles="true">${css}</style>`;
    }
    if (originalScripts) {
      finalBodyContent += `\n${originalScripts}`;
    }

    return baseHtml.replace(/<body[^>]*>[\s\S]*<\/body>/i, `${bodyOpenTag}\n${finalBodyContent}\n</body>`);
  }

  function getCurrentPageHtml(): string {
    return visualEditorOverrides[previewPage] || generatedFiles[previewPage] || generatedFiles['index.html'] || '';
  }

  async function handleVisualEditorSave(bodyHtml: string, css: string) {
    const baseHtml = generatedFiles[previewPage] || generatedFiles['index.html'] || '';
    const mergedHtml = mergeBodyIntoDocument(baseHtml, bodyHtml, css);
    const newOverrides = { ...visualEditorOverrides, [previewPage]: mergedHtml };
    setVisualEditorOverrides(newOverrides);
    setShowVisualEditor(false);

    if (websiteId) {
      try {
        await fetch(`/api/websites/${websiteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ customFiles: newOverrides }),
        });
      } catch { /* silent */ }
    }
    toast({ title: "Visual edits saved", description: "Changes applied to preview." });
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7C3AED' }} />
      </div>
    );
  }

  if (!siteData) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', color: 'white' }}>
        <div className="text-center">
          <p className="text-lg mb-4">Website not found.</p>
          <Button onClick={() => setLocation("/dashboard/websites")}>Back to Websites</Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#030712', color: 'white', overflow: 'hidden' }}>

      {/* ── Top Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard/websites")} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="font-bold text-white text-sm">{siteData.businessName}</h1>
            <p className="text-xs text-gray-400">{siteData.city}, {siteData.state} • {getCategoryConfig(categoryId).name}</p>
          </div>
          {siteData.deploymentStatus === "deployed" && (
            <Badge variant="outline" className="text-green-400 border-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Live
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* API Status Badge */}
          {apiStatus === "none" && (
            <button onClick={() => setActiveTab("business")}
              className="text-xs px-2 py-1 rounded-md bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/60 transition-colors whitespace-nowrap">
              ⚠ No AI Key — click to add
            </button>
          )}
          {apiStatus === "ready" && (
            <span className="text-xs px-2 py-1 rounded-md bg-green-900/30 border border-green-700/40 text-green-400 whitespace-nowrap">
              ✓ AI Ready
            </span>
          )}
          <Button variant="outline" size="sm" onClick={regenerateFiles} disabled={isRegenerating} className="border-amber-600 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 hover:text-amber-300 font-medium">
            {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Regenerate
          </Button>
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-gray-500 whitespace-nowrap">Saving...</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-green-500 whitespace-nowrap">✓ Saved</span>
          )}
          <Button variant="outline" size="sm" onClick={saveChanges} disabled={isSaving} className="border-blue-600 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 font-medium">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
          {deployedUrl && (
            <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-green-700 text-green-400 hover:text-green-300">
                <ExternalLink className="w-4 h-4 mr-1" /> View Live
              </Button>
            </a>
          )}
          {deployedUrl ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  setSkipDomainCheck(true);
                  setShowPublishModal(true);
                }}
                disabled={isDeploying}
                className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-md"
              >
                {isDeploying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Rocket className="w-4 h-4 mr-1" />}
                {isDeploying ? "Deploying..." : "Update Website"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSkipDomainCheck(false);
                  setShowPublishModal(true);
                }}
                disabled={isDeploying}
                className="border-[#7C3AED] text-[#7C3AED] hover:bg-[#7C3AED]/10 font-bold shadow-md"
              >
                <Plus className="w-4 h-4 mr-1" />
                Fresh Deployment
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                setSkipDomainCheck(false);
                setShowPublishModal(true);
              }}
              disabled={isDeploying}
              className="bg-[#7C3AED] hover:bg-[#9333EA] text-black font-bold shadow-md"
            >
              {isDeploying ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Rocket className="w-4 h-4 mr-1" />}
              {isDeploying ? "Deploying..." : "Publish Website"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left Sidebar: Editor */}
        <div className="w-96 flex-shrink-0 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b border-gray-800 bg-gray-900 p-0 h-auto flex-wrap">
              <TabsTrigger value="business" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <Phone className="w-3 h-3 mr-1" />Business
              </TabsTrigger>
              <TabsTrigger value="content" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <Sparkles className="w-3 h-3 mr-1" />AI Content
              </TabsTrigger>
              <TabsTrigger value="images" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <ImageIcon className="w-3 h-3 mr-1" />Images
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <Edit3 className="w-3 h-3 mr-1" />Blog
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />Checklist
              </TabsTrigger>
              <TabsTrigger value="deploy" className="flex-1 rounded-none text-xs py-3 data-[state=active]:bg-gray-800">
                <Rocket className="w-3 h-3 mr-1" />Deploy
              </TabsTrigger>
            </TabsList>

            {/* ── Business Info Tab ───────────────────────────────────── */}
            <TabsContent value="business" className="p-4 space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-300">Business Information</h3>
                <button
                  type="button"
                  title="Fill form with sample data for testing"
                  onClick={() => {
                    const sample = getSampleData(categoryId);
                    const next = { ...siteData, ...sample } as WDSiteData;
                    setSiteData(next);
                    rebuildPreview(next);
                  }}
                  className="text-[10px] px-2 py-1 rounded bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                >
                  Fill sample data
                </button>
              </div>

              <div className="space-y-3">
                {/* Color Theme — shown first so it's easy to find */}
                <div>
                  <Label className="text-xs text-gray-400">Color Theme</Label>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {COLOR_PALETTES.map(palette => {
                      const isActive =
                        siteData.primaryColor === palette.primary &&
                        siteData.secondaryColor === palette.secondary;
                      return (
                        <button
                          key={palette.name}
                          title={palette.name}
                          onClick={() => {
                            const next = { ...siteData, primaryColor: palette.primary, secondaryColor: palette.secondary };
                            setSiteData(next as any);
                            rebuildPreview(next as any);
                          }}
                          className={`rounded overflow-hidden text-left transition-transform hover:scale-105 focus:outline-none ${
                            isActive ? "ring-2 ring-[#7C3AED] ring-offset-1 ring-offset-gray-900" : "ring-1 ring-white/10"
                          }`}
                        >
                          <div className="flex h-6">
                            <div className="w-3/5" style={{ backgroundColor: palette.primary }} />
                            <div className="w-2/5" style={{ backgroundColor: palette.secondary }} />
                          </div>
                          <div className="bg-gray-800 px-1 py-0.5">
                            <span className="text-[9px] text-gray-300 leading-none block truncate">{palette.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Business Name</Label>
                  <Input value={siteData.businessName} onChange={e => updateField("businessName", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Phone (24/7 Emergency)</Label>
                  <div className="flex gap-2 mt-1">
                    <select
                      value={siteData.countryCode || "+1"}
                      onChange={e => updateField("countryCode", e.target.value)}
                      className="w-[100px] h-[36px] px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-white text-sm focus:border-[#7C3AED]/50 outline-none"
                    >
                      <option value="+1" className="bg-gray-900">🇺🇸/🇨🇦 +1</option>
                      <option value="+44" className="bg-gray-900">🇬🇧 +44</option>
                      <option value="+61" className="bg-gray-900">🇦🇺 +61</option>
                      <option value="+64" className="bg-gray-900">🇳🇿 +64</option>
                      <option value="+27" className="bg-gray-900">🇿🇦 +27</option>
                      <option value="+91" className="bg-gray-900">🇮🇳 +91</option>
                    </select>
                    <Input value={siteData.phone} onChange={e => updateField("phone", e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white h-[36px] text-sm" placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Email</Label>
                  <Input value={siteData.email || ""} onChange={e => updateField("email", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Business Address</Label>
                  <Input value={siteData.address} onChange={e => updateField("address", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">City</Label>
                    <Input value={siteData.city} onChange={e => updateField("city", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">State</Label>
                    <Input value={siteData.state} onChange={e => updateField("state", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Business Hours</Label>
                  <Input value={siteData.businessHours || ""} onChange={e => updateField("businessHours", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" placeholder="Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 4:00 PM, Sunday: Emergency Only" />
                  <p className="text-[10px] text-gray-500 mt-1">Separate different days with commas.</p>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-gray-500">Google Maps Iframe URL (required for Contact page map)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] border-gray-700 text-gray-300"
                      onClick={() => updateField("googleMapsUrl", buildAddressMapEmbedUrl(siteData.address, siteData.city, siteData.state))}
                    >
                      Auto-fill from address
                    </Button>
                  </div>
                  <Input
                    value={siteData.googleMapsUrl || ""}
                    onChange={e => updateField("googleMapsUrl", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                    placeholder="https://www.google.com/maps?q=Your+Address&output=embed"
                  />
                  {!siteData.googleMapsUrl?.trim() && (
                    <p className="text-[10px] text-amber-400 mt-1">Map iframe URL is required for accurate address map display on Contact page.</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Primary Keyword</Label>
                  <Input value={siteData.primaryKeyword} onChange={e => updateField("primaryKeyword", e.target.value)} className="bg-gray-800 border-gray-700 text-white mt-1 text-sm" />
                </div>

                {/* ── Services (dynamic add/remove) ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-gray-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Services
                    </Label>
                    <span className="text-[10px] text-[#7C3AED] font-mono">{(siteData.services || []).length} services → {(siteData.services || []).length} pages</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(Array.isArray(siteData.services) ? siteData.services : []).map((svc: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 group">
                        <span className="text-[10px] text-gray-600 font-mono w-4 text-right shrink-0">{i + 1}</span>
                        <Input
                          value={svc}
                          onChange={e => {
                            const updated = [...(siteData.services || [])];
                            updated[i] = e.target.value;
                            updateField("services", updated);
                          }}
                          className="bg-gray-800 border-gray-700 text-white text-sm h-8 flex-1"
                          placeholder="Service name..."
                        />
                        <button
                          onClick={() => {
                            const updated = (siteData.services || []).filter((_: string, idx: number) => idx !== i);
                            updateField("services", updated);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1 shrink-0"
                          title="Remove service"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => updateField("services", [...(siteData.services || []), ""])}
                      className="flex-1 flex items-center gap-1 text-xs text-[#7C3AED] hover:text-[#c8ff00] transition-colors justify-center py-1.5 border border-dashed border-gray-700 hover:border-[#7C3AED]/40 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Add Service
                    </button>
                    {(() => {
                      const citySlug = (siteData.city || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      const newSvcs = (siteData.services || []).filter(s => s && !generatedFiles[`services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${citySlug}.html`]);
                      if (newSvcs.length === 0 || Object.keys(generatedFiles).length === 0) return null;
                      return (
                        <button
                          onClick={() => generateIncrementalPages('services')}
                          className="flex items-center gap-1 text-[10px] bg-[#7C3AED]/15 text-[#7C3AED] hover:bg-[#7C3AED]/25 px-2.5 py-1.5 rounded-md transition-colors font-medium whitespace-nowrap"
                          title={`Generate ${newSvcs.length} new service page(s) without full rebuild`}
                        >
                          <Sparkles className="w-3 h-3" /> +{newSvcs.length} New
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* ── Service Areas / Locations (dynamic add/remove) ── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Service Areas (Locations)
                    </Label>
                    <span className="text-[10px] text-[#7C3AED] font-mono">{(siteData.serviceAreas || []).length} cities → {(siteData.serviceAreas || []).length} pages</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(Array.isArray(siteData.serviceAreas) ? siteData.serviceAreas : []).map((area: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 group">
                        <span className="text-[10px] text-gray-600 font-mono w-4 text-right shrink-0">{i + 1}</span>
                        <Input
                          value={area}
                          onChange={e => {
                            const updated = [...(siteData.serviceAreas || [])];
                            updated[i] = e.target.value;
                            updateField("serviceAreas", updated);
                          }}
                          className="bg-gray-800 border-gray-700 text-white text-sm h-8 flex-1"
                          placeholder="City name..."
                        />
                        <button
                          onClick={() => {
                            const updated = (siteData.serviceAreas || []).filter((_: string, idx: number) => idx !== i);
                            updateField("serviceAreas", updated);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity p-1 shrink-0"
                          title="Remove location"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => updateField("serviceAreas", [...(siteData.serviceAreas || []), ""])}
                      className="flex-1 flex items-center gap-1 text-xs text-[#7C3AED] hover:text-[#c8ff00] transition-colors justify-center py-1.5 border border-dashed border-gray-700 hover:border-[#7C3AED]/40 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Add Location
                    </button>
                    {(() => {
                      const newLocs = (siteData.serviceAreas || []).filter(l => l && !generatedFiles[`locations/${l.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.html`]);
                      if (newLocs.length === 0 || Object.keys(generatedFiles).length === 0) return null;
                      return (
                        <button
                          onClick={() => generateIncrementalPages('locations')}
                          className="flex items-center gap-1 text-[10px] bg-[#7C3AED]/15 text-[#7C3AED] hover:bg-[#7C3AED]/25 px-2.5 py-1.5 rounded-md transition-colors font-medium whitespace-nowrap"
                          title={`Generate ${newLocs.length} new location page(s) without full rebuild`}
                        >
                          <Sparkles className="w-3 h-3" /> +{newLocs.length} New
                        </button>
                      );
                    })()}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">Each city = separate SEO location page</p>
                </div>

                {/* Matrix Pages Toggle */}
                <div className="rounded-lg border border-dashed border-gray-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Matrix Pages (Service × City)
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Creates a unique page for every service in every city
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const nextVal = !(siteData as any).enableMatrixPages;
                        updateField("enableMatrixPages", nextVal);
                        if (siteData) {
                          rebuildPreview({ ...siteData, enableMatrixPages: nextVal });
                        }
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        (siteData as any).enableMatrixPages ? 'bg-[#7C3AED]' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        (siteData as any).enableMatrixPages ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                  {(siteData as any).enableMatrixPages && (() => {
                    const svcCount = siteData.services?.length || 0;
                    const locCount = siteData.serviceAreas?.length || 0;
                    const matrixCount = svcCount * locCount;
                    return (
                      <div className="bg-gray-800/50 rounded-md p-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{svcCount} services × {locCount} cities</span>
                          <span className="font-bold text-[#7C3AED] font-mono">{matrixCount} pages</span>
                        </div>
                        <div className="text-[10px] text-gray-500 leading-relaxed">
                          Example: <span className="text-gray-400">{siteData.services?.[0] || 'Service'} in {siteData.serviceAreas?.[0] || 'City'}</span>
                          {matrixCount > 0 && <span className="text-gray-600"> + {matrixCount - 1} more</span>}
                        </div>
                        {(() => {
                          if (Object.keys(generatedFiles).length === 0) return null;
                          const newMatrix = (siteData.services || []).flatMap(sv =>
                            (siteData.serviceAreas || []).filter(lo => {
                              const f = `matrix/${sv.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-in-${lo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.html`;
                              return sv && lo && !generatedFiles[f];
                            })
                          );
                          if (newMatrix.length === 0) return null;
                          return (
                            <button
                              onClick={() => generateIncrementalPages('matrix')}
                              className="w-full mt-1.5 flex items-center justify-center gap-1 text-[10px] bg-[#7C3AED]/15 text-[#7C3AED] hover:bg-[#7C3AED]/25 px-2.5 py-1.5 rounded-md transition-colors font-medium"
                              title={`Generate ${newMatrix.length} new matrix page(s) without full rebuild`}
                            >
                              <Sparkles className="w-3 h-3" /> Generate {newMatrix.length} New Matrix Pages
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Contact Form Embed Code (optional)</Label>
                  <Textarea
                    value={siteData.contactFormEmbed || ""}
                    onChange={e => updateField("contactFormEmbed", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white text-sm font-mono"
                    rows={4}
                    placeholder="Paste JotForm, Typeform, or other embed code..."
                  />
                </div>
              </div>

              {/* Branding & Page Images */}
              <ContentSection title="Branding & Page Images">
                <div className="space-y-4">
                  {/* Logo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Logo (Header/Footer)</Label>
                    <div className="flex items-center gap-3">
                      {siteData.logoUrl ? (
                        <div className="relative w-10 h-10 bg-gray-800 rounded flex items-center justify-center overflow-hidden border border-gray-700">
                          <img src={siteData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setSiteData(prev => prev ? { ...prev, logoUrl: undefined } as any : prev)}
                            className="absolute -top-0.5 -right-0.5 bg-red-800 text-white rounded text-[10px] w-4 h-4 flex items-center justify-center leading-none"
                            title="Remove logo"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center border border-dashed border-gray-650 text-gray-500 text-[10px] text-center leading-tight">
                          No logo
                        </div>
                      )}
                      <label className="cursor-pointer flex-1">
                        <div className="flex items-center justify-center gap-2 border border-dashed border-gray-600 hover:border-blue-500 hover:text-blue-400 rounded-md py-2 px-3 text-xs text-gray-400 transition-colors">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {siteData.logoUrl ? "Replace logo..." : "Upload logo (PNG/SVG)..."}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await compressImage(file, 600, 300, 0.85);
                            setSiteData(prev => prev ? { ...prev, logoUrl: url } as any : prev);
                            toast({ title: "Logo updated", description: "Save to apply." });
                          } catch (err) {
                            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                          }
                          e.target.value = "";
                        }} />
                      </label>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-400">Favicon (Browser Tab Icon)</Label>
                    <div className="flex items-center gap-3">
                      {siteData.faviconUrl ? (
                        <div className="relative w-10 h-10 bg-gray-800 rounded flex items-center justify-center overflow-hidden border border-gray-700">
                          <img src={siteData.faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setSiteData(prev => prev ? { ...prev, faviconUrl: undefined } as any : prev)}
                            className="absolute -top-0.5 -right-0.5 bg-red-800 text-white rounded text-[10px] w-4 h-4 flex items-center justify-center leading-none"
                            title="Remove favicon"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center border border-dashed border-gray-650 text-gray-500 text-[10px] text-center leading-tight">
                          No icon
                        </div>
                      )}
                      <label className="cursor-pointer flex-1">
                        <div className="flex items-center justify-center gap-2 border border-dashed border-gray-600 hover:border-blue-500 hover:text-blue-400 rounded-md py-2 px-3 text-xs text-gray-400 transition-colors">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {siteData.faviconUrl ? "Replace favicon..." : "Upload favicon (ICO/PNG)..."}
                        </div>
                        <input type="file" accept="image/*,.ico" className="hidden" onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await compressImage(file, 128, 128, 0.8);
                            setSiteData(prev => prev ? { ...prev, faviconUrl: url } as any : prev);
                            toast({ title: "Favicon updated", description: "Save to apply." });
                          } catch (err) {
                            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                          }
                          e.target.value = "";
                        }} />
                      </label>
                    </div>
                  </div>

                  {/* Core Template Images */}
                  <div className="space-y-3 border-t border-gray-700/60 pt-3">
                    <p className="text-xs font-medium text-gray-400">Core Page Images</p>
                    {WD_IMAGE_SLOTS.map(slot => {
                      const customSrc = siteData?.customImages?.[slot.key];
                      const displaySrc = customSrc || slot.defaultSrc;
                      const isCustom = !!customSrc;
                      return (
                        <div key={slot.key} className="space-y-1 bg-gray-900/40 p-2.5 rounded-lg border border-gray-805">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-semibold text-gray-300">{slot.label}</span>
                            <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded uppercase">{slot.page}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 block leading-tight mb-1.5">{slot.hint}</span>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-8 rounded bg-gray-800 border border-gray-700 overflow-hidden shrink-0">
                              <img src={displaySrc} alt={slot.label} className="w-full h-full object-cover" />
                            </div>
                            <label className="cursor-pointer flex-1">
                              <div className="flex items-center justify-center gap-1.5 border border-dashed border-gray-650 hover:border-blue-500 hover:text-blue-400 rounded py-1.5 text-[10px] text-gray-400 transition-colors">
                                <ImageIcon className="w-3 h-3" />
                                {isCustom ? "Replace..." : "Upload..."}
                              </div>
                              <input type="file" accept="image/*" className="hidden"
                                onChange={e => { if (e.target.files?.[0]) handleCustomImageUpload(slot.key, e.target.files[0]); }} />
                            </label>
                            {isCustom && (
                              <button
                                type="button"
                                onClick={() => removeCustomImage(slot.key)}
                                className="text-[10px] px-2 py-1.5 rounded bg-red-950/60 border border-red-900/40 text-red-400 hover:bg-red-900/30"
                                title="Reset to default placeholder"
                              >Reset</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ContentSection>

              {/* Social Media */}
              <div className="rounded-lg border border-dashed border-gray-700 p-3 space-y-2">
                <p className="text-xs font-medium text-gray-400">Social Media Links (optional)</p>
                {[
                  { field: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/yourbusiness" },
                  { field: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/yourbusiness" },
                  { field: "googleUrl", label: "Google Business", placeholder: "https://g.page/yourbusiness" },
                  { field: "yelpUrl", label: "Yelp", placeholder: "https://yelp.com/biz/yourbusiness" },
                  { field: "twitterUrl", label: "X / Twitter", placeholder: "https://x.com/yourbusiness" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      value={(siteData as any)[field] || ""}
                      onChange={e => updateField(field, e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              {/* Floating CTA */}
              <div className="rounded-lg border border-dashed border-gray-700 p-3 space-y-2">
                <p className="text-xs font-medium text-gray-400">Floating Call Button</p>
                <p className="text-xs text-gray-600">A sticky button shown on all pages to drive calls/leads.</p>
                <div className="flex gap-2">
                  {[
                    { value: "call", label: "📞 Call Button" },
                    { value: "whatsapp", label: "💬 WhatsApp" },
                    { value: "none", label: "None" },
                  ].map(opt => (
                    <button key={opt.value}
                      onClick={() => updateField("floatingCTA", opt.value)}
                      className={`flex-1 py-1.5 text-xs rounded-md border transition-colors ${
                        (siteData.floatingCTA || "call") === opt.value
                          ? "bg-blue-900/40 border-blue-600 text-blue-300"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {(siteData.floatingCTA || "call") === "whatsapp" && (
                  <div>
                    <Label className="text-xs text-gray-500">WhatsApp Number (with country code)</Label>
                    <Input
                      value={siteData.whatsappNumber || ""}
                      onChange={e => updateField("whatsappNumber", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                      placeholder="+15125558900"
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Content Tab ─────────────────────────────────────────── */}
            <TabsContent value="content" className="p-4 space-y-5 mt-0">
              {/* ── AI Content Generator ──────────────────────────────── */}
              <div className="rounded-lg border border-gray-700 bg-gray-800/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                    AI Content Generator
                  </h3>
                  {lastAIGenerationAt && (
                    <Badge variant="outline" className="border-green-700/60 bg-green-950/40 text-green-300 text-[11px]">
                      Updated {lastAIGenerationAt}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={regenerateFiles} disabled={isRegenerating} className="border-amber-600 bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 text-xs font-medium">
                    {isRegenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Re-generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  One click writes unique content for your <strong className="text-gray-400">entire website</strong> — all pages listed below.
                </p>
                <p className="text-[11px] text-gray-500">
                  Template copy is shown as lorem ipsum placeholders until AI content is generated.
                </p>

                {/* Publish Scope (Tier) Selector */}
                <div className="space-y-2 mb-3">
                  <Label className="text-xs text-gray-400 font-medium">Publish Scope (Deployment Stage)</Label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: '1', label: 'Core Pages Only', desc: 'Home, About, Contact, Gallery, FAQ. Dropdowns and subpages hidden.' },
                      { id: '2', label: 'Complete Site', desc: 'Core + Service & Location pages.' },
                      { id: '3', label: 'Matrix Pages', desc: 'Core + Service × Location pages.' }
                    ].map(t => {
                      const isSelected = (siteData.publishTier || '1') === t.id;
                      const isDisabled = !isPaid && t.id !== '1';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            if (isDisabled) return;
                            updateField("publishTier", t.id);
                          }}
                          className={`flex flex-col text-left p-2.5 rounded-lg border transition-all duration-200 ${
                            isSelected
                              ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white'
                              : isDisabled
                              ? 'border-gray-905 bg-gray-950/40 text-gray-600 cursor-not-allowed opacity-50'
                              : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold">{t.label}</span>
                              {isDisabled && (
                                <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-gray-600'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-500 leading-normal mt-0.5">{t.desc}</span>
                          {isDisabled && (
                            <span className="text-[9px] text-amber-400 mt-1">Upgrade to Pro required</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Provider selector + Generate button */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400">AI Provider {aiProvider && <span className="text-green-400 text-xs ml-1">• Using {aiProvider === 'openai' ? 'OpenAI' : aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'}</span>}</Label>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white mt-1 disabled:opacity-50"
                      value={aiProvider}
                      onChange={e => { setAiProvider(e.target.value as AIProvider); updateField("contentAiProvider", e.target.value); }}
                      disabled={availableAIProviders.length === 0}
                    >
                      {availableAIProviders.length === 0 && <option value="">No AI providers configured</option>}
                      {availableAIProviders.includes('openai') && <option value="openai">OpenAI {aiProvider === 'openai' && '✓'}</option>}
                      {availableAIProviders.includes('gemini') && <option value="gemini">Gemini {aiProvider === 'gemini' && '✓'}</option>}
                      {availableAIProviders.includes('openrouter') && <option value="openrouter">OpenRouter {aiProvider === 'openrouter' && '✓'}</option>}
                      {availableAIProviders.includes('deepseek') && <option value="deepseek">DeepSeek {aiProvider === 'deepseek' && '✓'}</option>}
                    </select>
                  </div>
                  <Button
                    onClick={generateAIContent}
                    disabled={isGeneratingAI || apiStatus === "none"}
                    className="bg-[#7C3AED] hover:bg-[#9333EA] text-black font-bold h-[38px] px-4"
                  >
                    {isGeneratingAI ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-1" />Generating...</>
                    ) : (siteData as any)._aiIntroParas ? (
                      <><Wand2 className="w-4 h-4 mr-1" />Regenerate</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-1" />Generate</>
                    )}
                  </Button>
                </div>

                {apiStatus === "none" && (
                  <p className="text-xs text-yellow-400">No AI API key configured. Go to <strong>Settings → API Keys</strong> to add one.</p>
                )}

                {generationStatus === 'generating' && (
                  <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="flex items-center gap-1.5 font-medium text-[#7C3AED]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI Generation in Progress
                      </span>
                      <span className="font-semibold text-white">{generationProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#7C3AED] transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Writing and optimization tasks are running in a rate-limited background queue. You can keep editing other fields in the meantime.
                    </p>
                  </div>
                )}

                {/* Status badges */}
                {((siteData as any)._aiIntroParas || (siteData as any)._aiFaqs || (siteData as any)._aiSeoBody || (siteData as any)._aiProcessSteps || (siteData as any)._aiWhyChooseUs || (siteData as any)._aiAboutContent || (siteData as any)._aiTestimonials || (siteData as any)._aiServiceDescs) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(siteData as any)._aiIntroParas && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/40 border border-green-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Intro ({((siteData as any)._aiIntroParas as string[]).length})
                      </span>
                    )}
                    {(siteData as any)._aiProcessSteps && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/40 border border-green-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Steps ({((siteData as any)._aiProcessSteps as any[]).length})
                      </span>
                    )}
                    {(siteData as any)._aiFaqs && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/40 border border-green-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> FAQs ({((siteData as any)._aiFaqs as any[]).length})
                      </span>
                    )}
                    {(siteData as any)._aiSeoBody && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/40 border border-green-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> SEO body
                      </span>
                    )}
                    {(siteData as any)._aiWhyChooseUs && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-950/40 border border-blue-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Why Us ({((siteData as any)._aiWhyChooseUs as any[]).length})
                      </span>
                    )}
                    {(siteData as any)._aiAboutContent && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-950/40 border border-blue-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> About
                      </span>
                    )}
                    {(siteData as any)._aiTestimonials && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-950/40 border border-purple-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Reviews ({((siteData as any)._aiTestimonials as any[]).length})
                      </span>
                    )}
                    {(siteData as any)._aiServiceDescs && (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-950/40 border border-purple-800 rounded px-2 py-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Services ({Object.keys((siteData as any)._aiServiceDescs).length})
                      </span>
                    )}
                  </div>
                )}

                {/* Auto blog generation progress */}
                {isAutoGeneratingBlogs && (
                  <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">
                        Auto-generating blog posts... ({autoBlogProgress.current}/{autoBlogProgress.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${autoBlogProgress.total > 0 ? (autoBlogProgress.current / autoBlogProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500">5 SEO blog posts (1000-1500 words each) are being written by AI...</p>
                  </div>
                )}

                {/* Blog posts count badge */}
                {siteData.blogPosts && siteData.blogPosts.length > 0 && !isAutoGeneratingBlogs && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded px-2 py-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Blog Posts ({siteData.blogPosts.length})
                    </span>
                    <span className="text-[10px] text-gray-600">View in Blog tab</span>
                  </div>
                )}

                {/* ── Generated Pages Summary ──────────────────────────── */}
                {Object.keys(generatedFiles).length > 0 && (() => {
                  const files = Object.keys(generatedFiles).filter(f => f.endsWith('.html'));
                  const corePages = files.filter(f =>
                    !f.startsWith('services/') && !f.startsWith('locations/') &&
                    !f.startsWith('matrix/') && !f.startsWith('blog/')
                  );
                  const servicePages = files.filter(f => f.startsWith('services/'));
                  const locationPages = files.filter(f => f.startsWith('locations/'));
                  const matrixPages = files.filter(f => f.startsWith('matrix/'));
                  const blogPages = files.filter(f => f.startsWith('blog/'));
                  const totalPages = files.length;

                  return (
                    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#7C3AED]" />
                          Generated Pages
                        </span>
                        <span className="text-xs font-bold text-white bg-[#7C3AED]/20 text-[#7C3AED] px-2 py-0.5 rounded-full">
                          {totalPages} total
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {corePages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            Core Pages
                            <span className="ml-auto font-semibold text-gray-300">{corePages.length}</span>
                          </div>
                        )}
                        {servicePages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                            Service Pages
                            <span className="ml-auto font-semibold text-gray-300">{servicePages.length}</span>
                          </div>
                        )}
                        {locationPages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                            Location Pages
                            <span className="ml-auto font-semibold text-gray-300">{locationPages.length}</span>
                          </div>
                        )}
                        {matrixPages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                            Matrix Pages
                            <span className="ml-auto font-semibold text-gray-300">{matrixPages.length}</span>
                          </div>
                        )}
                        {blogPages.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                            Blog Pages
                            <span className="ml-auto font-semibold text-gray-300">{blogPages.length}</span>
                          </div>
                        )}
                      </div>
                      {siteData.publishTier === '3' && matrixPages.length === 0 && (
                        <p className="text-[10px] text-gray-500 italic">
                          Matrix pages will be compiled during publish (services × locations = {(siteData.services?.length || 0) * (siteData.serviceAreas?.length || 0)} pages).
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Homepage Hero */}
              {siteData.homepageContent?.hero && (
                <ContentSection title="Homepage Hero">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">H1 Headline</Label>
                      <Input
                        value={siteData.homepageContent.hero.h1 || ""}
                        onChange={e => updateField("homepageContent.hero.h1", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Subheadline</Label>
                      <Textarea
                        value={siteData.homepageContent.hero.subheadline || ""}
                        onChange={e => updateField("homepageContent.hero.subheadline", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                        rows={2}
                      />
                    </div>
                  </div>
                </ContentSection>
              )}

              {/* Homepage Intro */}
              {siteData.homepageContent?.intro && (
                <ContentSection title="Homepage Intro Section">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">H2 Heading</Label>
                      <Input
                        value={siteData.homepageContent.intro.h2 || ""}
                        onChange={e => updateField("homepageContent.intro.h2", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                      />
                    </div>
                    {(siteData.homepageContent.intro.paragraphs || []).map((para: string, idx: number) => (
                      <div key={idx}>
                        <Label className="text-xs text-gray-500">Paragraph {idx + 1}</Label>
                        <Textarea
                          value={para}
                          onChange={e => {
                            const updated = [...siteData.homepageContent.intro.paragraphs];
                            updated[idx] = e.target.value;
                            updateField("homepageContent.intro.paragraphs", updated);
                          }}
                          className="bg-gray-800 border-gray-700 text-white mt-1 text-sm"
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>
                </ContentSection>
              )}

              {/* FAQ Preview */}
              {siteData.homepageContent?.faqSection && (
                <ContentSection title={`FAQ (${siteData.homepageContent.faqSection.faqs?.length || 0} questions)`}>
                  <p className="text-xs text-gray-500 italic">FAQ content is AI-generated. Use "Re-generate" to refresh, or edit the JSON directly in your website files.</p>
                  <div className="text-xs text-gray-400 mt-2">
                    {(siteData.homepageContent.faqSection.faqs || []).slice(0, 3).map((faq: any, i: number) => (
                      <p key={i} className="truncate py-1 border-b border-gray-800">Q: {faq.question}</p>
                    ))}
                    {(siteData.homepageContent.faqSection.faqs?.length || 0) > 3 && (
                      <p className="text-gray-600 py-1">+ {(siteData.homepageContent.faqSection.faqs.length - 3)} more questions</p>
                    )}
                  </div>
                </ContentSection>
              )}

              {/* Local-service AI content — editable */}
              {!siteData.homepageContent && ((siteData as any)._aiIntroParas || (siteData as any)._aiFaqs || (siteData as any)._aiSeoBody || (siteData as any)._aiProcessSteps) && (
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-700/50">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-gray-300">AI Content Generated — Used Across All Pages</span>
                  </div>

                  {/* Intro Paragraphs */}
                  {(siteData as any)._aiIntroParas && (
                    <div className="rounded-lg border border-gray-700 p-3 space-y-2">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Intro Paragraphs ({((siteData as any)._aiIntroParas as string[]).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage intro section</p>
                      {((siteData as any)._aiIntroParas as string[]).map((p: string, i: number) => (
                        <Textarea
                          key={i}
                          value={p}
                          onChange={e => {
                            const updated = [...(siteData as any)._aiIntroParas];
                            updated[i] = e.target.value;
                            setSiteData({ ...siteData, _aiIntroParas: updated } as any);
                          }}
                          className="bg-gray-800 border-gray-700 text-white text-xs"
                          rows={3}
                        />
                      ))}
                    </div>
                  )}

                  {/* Process Steps */}
                  {(siteData as any)._aiProcessSteps && (
                    <div className="rounded-lg border border-gray-700 p-3 space-y-2">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Process Steps ({((siteData as any)._aiProcessSteps as any[]).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage "Our Process" section + Service pages</p>
                      {((siteData as any)._aiProcessSteps as any[]).map((step: any, i: number) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="text-xs text-[#7C3AED] font-bold mt-2 w-4 flex-shrink-0">{i + 1}.</span>
                          <div className="flex-1 space-y-1">
                            <Input
                              value={step.title || step.step || ''}
                              onChange={e => {
                                const updated = [...(siteData as any)._aiProcessSteps];
                                updated[i] = { ...updated[i], title: e.target.value, step: e.target.value };
                                setSiteData({ ...siteData, _aiProcessSteps: updated } as any);
                              }}
                              className="bg-gray-800 border-gray-700 text-white text-xs h-8"
                              placeholder="Step title"
                            />
                            <Input
                              value={step.description || step.desc || ''}
                              onChange={e => {
                                const updated = [...(siteData as any)._aiProcessSteps];
                                updated[i] = { ...updated[i], description: e.target.value, desc: e.target.value };
                                setSiteData({ ...siteData, _aiProcessSteps: updated } as any);
                              }}
                              className="bg-gray-800 border-gray-700 text-white text-xs h-8"
                              placeholder="Description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FAQs */}
                  {(siteData as any)._aiFaqs && (
                    <div className="rounded-lg border border-gray-700 p-3 space-y-2">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> FAQs ({((siteData as any)._aiFaqs as any[]).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage FAQ section + FAQ page</p>
                      {((siteData as any)._aiFaqs as any[]).map((faq: any, i: number) => (
                        <div key={i} className="space-y-1 border-b border-gray-800 pb-2 last:border-0">
                          <Input
                            value={faq.question || ''}
                            onChange={e => {
                              const updated = [...(siteData as any)._aiFaqs];
                              updated[i] = { ...updated[i], question: e.target.value };
                              setSiteData({ ...siteData, _aiFaqs: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs h-8"
                            placeholder="Question"
                          />
                          <Textarea
                            value={faq.answer || ''}
                            onChange={e => {
                              const updated = [...(siteData as any)._aiFaqs];
                              updated[i] = { ...updated[i], answer: e.target.value };
                              setSiteData({ ...siteData, _aiFaqs: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SEO Body */}
                  {(siteData as any)._aiSeoBody && (
                    <div className="rounded-lg border border-gray-700 p-3 space-y-2">
                      <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SEO Body Text
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage footer SEO section</p>
                      <Textarea
                        value={(siteData as any)._aiSeoBody}
                        onChange={e => setSiteData({ ...siteData, _aiSeoBody: e.target.value } as any)}
                        className="bg-gray-800 border-gray-700 text-white text-xs"
                        rows={6}
                      />
                    </div>
                  )}

                  {/* Why Choose Us */}
                  {(siteData as any)._aiWhyChooseUs && (
                    <div className="rounded-lg border border-blue-900/50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Why Choose Us ({((siteData as any)._aiWhyChooseUs as any[]).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage "Why Choose Us" section</p>
                      {((siteData as any)._aiWhyChooseUs as any[]).map((item: any, i: number) => (
                        <div key={i} className="space-y-1 border-b border-gray-800 pb-2 last:border-0">
                          <Input
                            value={item.heading || ''}
                            onChange={e => {
                              const updated = [...(siteData as any)._aiWhyChooseUs];
                              updated[i] = { ...updated[i], heading: e.target.value };
                              setSiteData({ ...siteData, _aiWhyChooseUs: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs h-8"
                            placeholder="Heading"
                          />
                          <Textarea
                            value={item.body || ''}
                            onChange={e => {
                              const updated = [...(siteData as any)._aiWhyChooseUs];
                              updated[i] = { ...updated[i], body: e.target.value };
                              setSiteData({ ...siteData, _aiWhyChooseUs: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* About Content */}
                  {(siteData as any)._aiAboutContent && (
                    <div className="rounded-lg border border-blue-900/50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> About Us Content
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ About page main content</p>
                      <Textarea
                        value={(siteData as any)._aiAboutContent}
                        onChange={e => setSiteData({ ...siteData, _aiAboutContent: e.target.value } as any)}
                        className="bg-gray-800 border-gray-700 text-white text-xs"
                        rows={6}
                      />
                    </div>
                  )}

                  {/* Testimonials */}
                  {(siteData as any)._aiTestimonials && (
                    <div className="rounded-lg border border-purple-900/50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Customer Reviews ({((siteData as any)._aiTestimonials as any[]).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Homepage testimonials section</p>
                      {((siteData as any)._aiTestimonials as any[]).map((review: any, i: number) => (
                        <div key={i} className="space-y-1 border-b border-gray-800 pb-2 last:border-0">
                          <div className="flex gap-2">
                            <Input
                              value={review.name || ''}
                              onChange={e => {
                                const updated = [...(siteData as any)._aiTestimonials];
                                updated[i] = { ...updated[i], name: e.target.value };
                                setSiteData({ ...siteData, _aiTestimonials: updated } as any);
                              }}
                              className="bg-gray-800 border-gray-700 text-white text-xs h-8 flex-1"
                              placeholder="Name"
                            />
                            <Input
                              value={review.location || ''}
                              onChange={e => {
                                const updated = [...(siteData as any)._aiTestimonials];
                                updated[i] = { ...updated[i], location: e.target.value };
                                setSiteData({ ...siteData, _aiTestimonials: updated } as any);
                              }}
                              className="bg-gray-800 border-gray-700 text-white text-xs h-8 w-28"
                              placeholder="Location"
                            />
                          </div>
                          <Textarea
                            value={review.text || ''}
                            onChange={e => {
                              const updated = [...(siteData as any)._aiTestimonials];
                              updated[i] = { ...updated[i], text: e.target.value };
                              setSiteData({ ...siteData, _aiTestimonials: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs"
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service Descriptions */}
                  {(siteData as any)._aiServiceDescs && (
                    <div className="rounded-lg border border-purple-900/50 p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Service Descriptions ({Object.keys((siteData as any)._aiServiceDescs).length})
                      </p>
                      <p className="text-[10px] text-gray-500 -mt-1">→ Each service page intro paragraph</p>
                      {Object.entries((siteData as any)._aiServiceDescs).map(([svc, desc]: [string, any], i: number) => (
                        <div key={i} className="space-y-1 border-b border-gray-800 pb-2 last:border-0">
                          <Label className="text-xs text-gray-400">{svc}</Label>
                          <Textarea
                            value={desc || ''}
                            onChange={e => {
                              const updated = { ...(siteData as any)._aiServiceDescs, [svc]: e.target.value };
                              setSiteData({ ...siteData, _aiServiceDescs: updated } as any);
                            }}
                            className="bg-gray-800 border-gray-700 text-white text-xs"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!hasGeneratedAIContent ? (
                <div className="rounded-lg border border-dashed border-gray-700 p-4 space-y-3">
                  <div className="text-center">
                    <Sparkles className="w-7 h-7 text-gray-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-400 font-medium">Template preview is using placeholder lorem ipsum content</p>
                    <p className="text-xs text-gray-600 mt-0.5">Click <strong className="text-[#7C3AED]">Generate</strong> to replace placeholders with semantic AI content:</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { page: 'Homepage', items: 'Lorem ipsum intro, why-us, process, SEO body, testimonials' },
                      { page: 'About Page', items: 'Lorem ipsum company story, mission, and values' },
                      { page: 'FAQ Page', items: 'Lorem ipsum Q&A placeholders for common questions' },
                      { page: 'Service Pages', items: `Lorem ipsum service-page descriptions (${siteData.services?.length || 0} pages)` },
                      { page: 'Location Pages', items: `Lorem ipsum local SEO copy (${siteData.serviceAreas?.length || 0} pages)` },
                      ...((siteData as any).enableMatrixPages ? [{ page: 'Matrix Pages', items: `${(siteData.services?.length || 0)} services × ${(siteData.serviceAreas?.length || 0)} cities = ${(siteData.services?.length || 0) * (siteData.serviceAreas?.length || 0)} lorem ipsum pages` }] : []),
                      { page: 'Blog', items: 'Lorem ipsum SEO blog drafts generated with AI' },
                      { page: 'Contact Page', items: 'Lorem ipsum contact form, map embed, business hours' },
                      { page: 'All Pages', items: 'Schema markup, meta tags, sitemap, robots.txt, llms.txt' },
                    ].map(({ page, items }) => (
                      <div key={page} className="bg-gray-800/50 rounded-md px-2.5 py-2 border border-gray-700/50">
                        <p className="font-medium text-gray-300">{page}</p>
                        <p className="text-gray-500 mt-0.5 leading-relaxed">{items}</p>
                      </div>
                    ))}
                  </div>

                  {/* Estimated word count & token usage */}
                  {(() => {
                    const svcCount = siteData.services?.length || 0;
                    const locCount = siteData.serviceAreas?.length || 0;
                    const blogCount = 5;
                    const matrixEnabled = (siteData as any).enableMatrixPages;
                    const matrixCount = matrixEnabled ? svcCount * locCount : 0;
                    const approxWords = 1200 + (svcCount * 180) + (locCount * 140) + (blogCount * 900) + (matrixCount * 140) + 400;
                    const approxTokens = Math.round(approxWords * 1.35);
                    return (
                      <div className="rounded-md border border-purple-900/40 bg-purple-950/20 p-3 text-[11px] text-purple-100/90">
                        <p className="font-medium mb-1">Estimated AI output</p>
                        <p className="text-purple-200/80">~{approxWords.toLocaleString()} words • ~{approxTokens.toLocaleString()} tokens across the whole website</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-4 space-y-3">
                  <div className="text-center">
                    <CheckCircle2 className="w-7 h-7 text-green-400 mx-auto mb-1" />
                    <p className="text-sm text-green-300 font-medium">AI content generated and applied</p>
                    <p className="text-xs text-green-200/70 mt-0.5">The preview is now using AI-generated semantic SEO content{lastAIGenerationAt ? ` • Updated ${lastAIGenerationAt}` : ''}.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Images Tab ──────────────────────────────────────────── */}
            <TabsContent value="images" className="p-4 space-y-4 mt-0">

              {/* ── Logo & Favicon ─────────────────────────────────────── */}
              <div className="rounded-lg border border-gray-700 p-3 space-y-3">
                <h3 className="font-semibold text-sm text-gray-300">Logo &amp; Favicon</h3>

                {/* Logo */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Site Logo</Label>
                  <div className="flex items-center gap-3">
                    {(siteData as any).logoUrl ? (
                      <div className="relative w-20 h-12 bg-gray-800 rounded flex items-center justify-center overflow-hidden border border-gray-700">
                        <img src={(siteData as any).logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        <button
                          onClick={() => {
                            setSiteData(prev => prev ? { ...prev, logoUrl: undefined } as any : prev);
                          }}
                          className="absolute top-0.5 right-0.5 bg-red-800 text-white rounded text-[10px] w-4 h-4 flex items-center justify-center leading-none"
                          title="Remove logo"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="w-20 h-12 bg-gray-800 rounded flex items-center justify-center border border-dashed border-gray-600 text-gray-500 text-xs">
                        No logo
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <div className="flex items-center justify-center gap-2 border border-dashed border-gray-600 rounded-md py-2 px-3 text-xs text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                        <ImageIcon className="w-3 h-3" />
                        {(siteData as any).logoUrl ? "Replace logo..." : "Upload logo (PNG/SVG)..."}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await compressImage(file, 600, 300, 0.85);
                          setSiteData(prev => prev ? { ...prev, logoUrl: url } as any : prev);
                          toast({ title: "Logo updated", description: "Save to apply." });
                        } catch (err) {
                          toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                        }
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">Appears in the site header and footer. PNG or SVG recommended. Will be embedded in the generated site.</p>
                </div>

                {/* Favicon */}
                <div className="space-y-2 border-t border-gray-700 pt-3">
                  <Label className="text-xs text-gray-400">Favicon (Browser Tab Icon)</Label>
                  <div className="flex items-center gap-3">
                    {(siteData as any).faviconUrl ? (
                      <div className="relative w-10 h-10 bg-gray-800 rounded flex items-center justify-center overflow-hidden border border-gray-700">
                        <img src={(siteData as any).faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                        <button
                          onClick={() => {
                            setSiteData(prev => prev ? { ...prev, faviconUrl: undefined } as any : prev);
                          }}
                          className="absolute -top-0.5 -right-0.5 bg-red-800 text-white rounded text-[10px] w-4 h-4 flex items-center justify-center leading-none"
                          title="Remove favicon"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center border border-dashed border-gray-600 text-gray-500 text-[10px] text-center leading-tight">
                        No icon
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <div className="flex items-center justify-center gap-2 border border-dashed border-gray-600 rounded-md py-2 px-3 text-xs text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                        <ImageIcon className="w-3 h-3" />
                        {(siteData as any).faviconUrl ? "Replace favicon..." : "Upload favicon (ICO/PNG/SVG)..."}
                      </div>
                      <input type="file" accept="image/*,.ico" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await compressImage(file, 128, 128, 0.8);
                          setSiteData(prev => prev ? { ...prev, faviconUrl: url } as any : prev);
                          toast({ title: "Favicon updated", description: "Save to apply." });
                        } catch (err) {
                          toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                        }
                        e.target.value = "";
                      }} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600">Shows in the browser tab. 32×32 or 64×64 PNG/ICO/SVG recommended.</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-300 mb-1">Page Images</h3>
                <p className="text-xs text-gray-500">Upload real photos for each section. Click Save after uploading, then Regenerate to apply.</p>
              </div>

              {WD_IMAGE_SLOTS.map(slot => {
                const customSrc = siteData?.customImages?.[slot.key];
                const displaySrc = customSrc || slot.defaultSrc;
                const isCustom = !!customSrc;
                return (
                  <div key={slot.key} className="rounded-lg border border-gray-700 overflow-hidden">
                    <div className="relative bg-gray-800">
                      <img src={displaySrc} alt={slot.label} className="w-full h-32 object-cover" />
                      <div className="absolute top-2 left-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-black/60 text-gray-300">{slot.page}</span>
                      </div>
                      {isCustom ? (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge className="bg-green-700 text-xs">✓ Custom</Badge>
                          <button onClick={() => removeCustomImage(slot.key)}
                            className="text-xs px-1.5 py-0.5 rounded bg-red-900/80 text-red-300 hover:bg-red-800">✕</button>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-end justify-start p-2">
                          <span className="text-xs bg-yellow-700/80 text-yellow-200 px-2 py-0.5 rounded">📷 Placeholder</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <p className="text-xs font-medium text-white">{slot.label}</p>
                      <p className="text-xs text-gray-500">{slot.hint}</p>
                      <label className="cursor-pointer block">
                        <div className="flex items-center justify-center gap-2 border border-dashed border-gray-600 rounded-md py-2 px-3 text-xs text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                          <ImageIcon className="w-3 h-3" />
                          {isCustom ? "Replace photo..." : "Upload photo..."}
                        </div>
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => { if (e.target.files?.[0]) handleCustomImageUpload(slot.key, e.target.files[0]); }} />
                      </label>
                    </div>
                  </div>
                );
              })}

              <p className="text-xs text-gray-500 italic">
                Tip: You can also click any image directly in the preview on the right to replace it instantly.
              </p>

              {/* ── Hide Before/After Toggle ── */}
              <div className="rounded-lg border border-gray-700 p-3 flex items-center justify-between bg-gray-800/20">
                <div>
                  <p className="text-xs font-medium text-gray-300">Hide Before/After Sliders</p>
                  <p className="text-[10px] text-gray-500">Hide the before/after slider section entirely from the Gallery page</p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !(siteData as any).hideBeforeAfter;
                    updateField("hideBeforeAfter", nextVal);
                    if (siteData) {
                      rebuildPreview({ ...siteData, hideBeforeAfter: nextVal });
                    }
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    (siteData as any).hideBeforeAfter ? 'bg-[#7C3AED]' : 'bg-gray-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    (siteData as any).hideBeforeAfter ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* ── Before/After Gallery Pairs (Advanced) ───────────────── */}
              <ContentSection title="Before/After Slider (Advanced &amp; Optional)" defaultOpen={false}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-gray-400">
                      If left blank, the site automatically uses high-quality water damage restoration sliders.
                    </p>
                    <button
                      type="button"
                      onClick={addBeforeAfterPair}
                      disabled={(getGalleryPairs(siteData).length) >= 20}
                      className="text-[10px] px-2 py-1 rounded bg-blue-900/60 border border-blue-700 text-blue-200 hover:bg-blue-800 disabled:opacity-40"
                    >
                      + Add Pair
                    </button>
                  </div>

                  {getGalleryPairs(siteData).length === 0 && (
                    <p className="text-[11px] text-gray-500 italic text-center py-2.5 border border-dashed border-gray-750 rounded-lg">
                      No custom pairs uploaded. Fallback placeholders will be used.
                    </p>
                  )}

                  {getGalleryPairs(siteData).map((pair, idx) => (
                    <div key={pair.id} className="rounded-lg border border-gray-800 p-2.5 space-y-2 bg-gray-950/40">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-gray-400">Pair {idx + 1}</span>
                        <button type="button" onClick={() => removeBeforeAfterPair(pair.id)} className="text-[10px] text-red-400 hover:text-red-300">✕ Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Before */}
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">BEFORE</p>
                          <div className="relative bg-gray-800 rounded aspect-video overflow-hidden">
                            {pair.before?.src
                              ? <img src={pair.before.src} alt="Before" className="w-full h-full object-cover" />
                              : <div className="flex items-center justify-center h-full text-gray-600 text-[10px]">No image</div>
                            }
                          </div>
                          <label className="cursor-pointer block mt-1">
                            <div className="flex items-center justify-center gap-1 border border-dashed border-gray-700 rounded py-1 text-[10px] text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                              <ImageIcon className="w-3 h-3" />{pair.before?.src ? "Replace" : "Upload"}
                            </div>
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { if (e.target.files?.[0]) uploadPairImage(pair.id, 'before', e.target.files[0]); e.target.value = ''; }} />
                          </label>
                        </div>
                        {/* After */}
                        <div>
                          <p className="text-[10px] text-gray-500 mb-1">AFTER</p>
                          <div className="relative bg-gray-800 rounded aspect-video overflow-hidden">
                            {pair.after?.src
                              ? <img src={pair.after.src} alt="After" className="w-full h-full object-cover" />
                              : <div className="flex items-center justify-center h-full text-gray-600 text-[10px]">No image</div>
                            }
                          </div>
                          <label className="cursor-pointer block mt-1">
                            <div className="flex items-center justify-center gap-1 border border-dashed border-gray-700 rounded py-1 text-[10px] text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                              <ImageIcon className="w-3 h-3" />{pair.after?.src ? "Replace" : "Upload"}
                            </div>
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { if (e.target.files?.[0]) uploadPairImage(pair.id, 'after', e.target.files[0]); e.target.value = ''; }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ContentSection>

              {/* ── Gallery Photos ────────────────────────────────────────── */}
              <div className="border-t border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-300">Gallery Photos</h3>
                    <p className="text-[11px] text-gray-500">General project photos shown in gallery grid (max 50).</p>
                  </div>
                  {getGalleryNormal(siteData).length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllGalleryPhotos}
                      className="text-[10px] px-2 py-1 rounded bg-red-950/60 border border-red-900/40 text-red-400 hover:bg-red-900/40 transition-colors"
                    >
                      Clear All ({getGalleryNormal(siteData).length})
                    </button>
                  )}
                </div>

                {/* Bulk Upload Dropzone */}
                <label
                  onDragOver={e => { e.preventDefault(); setIsDraggingGallery(true); }}
                  onDragLeave={() => setIsDraggingGallery(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDraggingGallery(false);
                    if (e.dataTransfer.files) {
                      uploadGalleryPhotosBulk(e.dataTransfer.files);
                    }
                  }}
                  className={`relative cursor-pointer flex flex-col items-center justify-center border border-dashed rounded-lg p-5 text-center transition-all ${
                    isDraggingGallery
                      ? "border-[#7C3AED] bg-[#7C3AED]/10 text-white"
                      : "border-gray-700 bg-gray-800/40 hover:border-gray-500 hover:bg-gray-800/60 text-gray-400"
                  }`}
                >
                  <UploadCloud className="w-8 h-8 mb-2 text-gray-500 animate-pulse" />
                  <p className="text-xs font-semibold">Bulk Upload Gallery Photos</p>
                  <p className="text-[10px] text-gray-500 mt-1">Drag &amp; drop multiple images here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files) {
                        uploadGalleryPhotosBulk(e.target.files);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>

                {getGalleryNormal(siteData).length === 0 ? (
                  <p className="text-xs text-gray-600 italic text-center py-4 border border-dashed border-gray-800 rounded-lg">
                    No custom photos yet — standard placeholder images will be used on the live site.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {getGalleryNormal(siteData).map((photo, idx) => (
                      <div key={idx} className="relative group aspect-square rounded bg-gray-850 border border-gray-800 overflow-hidden">
                        {photo.src ? (
                          <img src={photo.src} alt={`Gallery ${idx+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-200" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-600 text-[10px]">Empty</div>
                        )}
                        {/* Hover Overlay with Delete Button */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeGalleryPhoto(idx)}
                            className="bg-red-800 hover:bg-red-750 text-white rounded p-1 shadow text-[10px] flex items-center gap-1 font-medium transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Blog Writer Tab ─────────────────────────────────────── */}
            <TabsContent value="blog" className="p-4 space-y-4 mt-0">
              {/* ── Enable Blog Toggle ── */}
              <div className="rounded-lg border border-gray-700 p-3 flex items-center justify-between bg-gray-800/20">
                <div>
                  <p className="text-xs font-medium text-gray-300">Enable Blog Page</p>
                  <p className="text-[10px] text-gray-500">Show the Blog link in the navigation menu and generate blog pages</p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !siteData?.generateBlog;
                    updateField("generateBlog", nextVal);
                    if (siteData) {
                      rebuildPreview({ ...siteData, generateBlog: nextVal });
                    }
                  }}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    siteData?.generateBlog ? 'bg-[#7C3AED]' : 'bg-gray-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    siteData?.generateBlog ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {siteData?.generateBlog && (
                <>
                  {/* Incremental blog generation button */}
                  {(() => {
                    if (!siteData || Object.keys(generatedFiles).length === 0) return null;
                    const newBlogPosts = (siteData.blogPosts || []).filter(p => p.slug && !generatedFiles[`blog/${p.slug}.html`]);
                    if (newBlogPosts.length === 0) return null;
                    return (
                      <button
                        onClick={() => generateIncrementalPages('blog')}
                        className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#7C3AED]/15 text-[#7C3AED] hover:bg-[#7C3AED]/25 px-3 py-2 rounded-lg transition-colors font-medium border border-[#7C3AED]/20"
                        title={`Generate ${newBlogPosts.length} new blog page(s) without full rebuild`}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate {newBlogPosts.length} New Blog Post Page{newBlogPosts.length > 1 ? 's' : ''} (incremental)
                      </button>
                    );
                  })()}
                  <BlogWriterSection
                    siteData={siteData!}
                    onPostsChange={(posts) => {
                      setSiteData(prev => {
                        if (!prev) return prev;
                        const next = { ...prev, blogPosts: posts };
                        // Auto-rebuild preview so blog pages appear instantly
                        setTimeout(() => rebuildPreview(next), 0);
                        return next;
                      });
                    }}
                    onRebuildPreview={rebuildPreview}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="p-4 space-y-4 mt-0">
              <div className="rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Pre-Publish Checklist</p>
                    <p className="text-xs text-gray-400">Track the launch tasks that are easiest to miss before pushing the site live.</p>
                  </div>
                  <div className="rounded-full border border-[#7C3AED]/30 bg-black/20 px-3 py-1 text-xs font-semibold text-[#C084FC]">
                    {checklistMetrics.percent}% complete
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Checklist progress</span>
                    <span>{checklistMetrics.completedCount}/{checklistMetrics.totalCount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-300" style={{ width: `${checklistMetrics.percent}%` }} />
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  You can still publish before this reaches 100%, but the publish popup will remind you about the remaining items.
                </p>
              </div>

              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                        className="mt-1 border-gray-600 data-[state=checked]:border-[#7C3AED] data-[state=checked]:bg-[#7C3AED] data-[state=checked]:text-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-gray-400">{item.description}</p>
                          </div>
                          <button
                            onClick={() => setActiveTab(item.targetTab)}
                            className="shrink-0 rounded-md border border-gray-600 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/60 hover:text-white"
                          >
                            Open
                          </button>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-[11px]">
                          {item.checked ? (
                            <span className="rounded-full border border-green-700/40 bg-green-900/30 px-2 py-0.5 text-green-300">
                              Complete
                            </span>
                          ) : (
                            <span className="rounded-full border border-gray-700 px-2 py-0.5 text-gray-400">
                              Pending
                            </span>
                          )}
                          {item.autoReady && !item.isManual && (
                            <span className="rounded-full border border-sky-700/40 bg-sky-900/30 px-2 py-0.5 text-sky-300">
                              Auto-ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Deploy Tab ──────────────────────────────────────────── */}
            <TabsContent value="deploy" className="p-4 space-y-4 mt-0">
              <h3 className="font-semibold text-sm text-gray-300">{deployedUrl ? "Update on Netlify" : "Publish to Netlify"}</h3>
              <p className="text-xs text-gray-500">{deployedUrl ? "Push your latest changes to the live site." : "Complete your website first (Business + Content tabs), then publish here."}</p>

              <div className="rounded-lg border border-sky-900/60 bg-sky-950/25 p-4 space-y-3">
                <p className="text-sm font-semibold text-sky-200">Recommended Deploy Process</p>
                <ol className="list-decimal space-y-2 pl-4 text-xs text-sky-100/90">
                  <li>After finalizing your website, find your Netlify site name first and check its availability.</li>
                  <li>If the URL is available, add that final URL to Google Search Console as a property.</li>
                  <li>Copy the verification meta tag from Search Console and paste it in <strong className="text-sky-100">Custom Head Code</strong> below.</li>
                  <li>Add this website to Google Analytics, paste the required tracking script in Custom Head Code, and enter your GA4 Measurement ID in the dedicated field.</li>
                  <li>Then deploy so that both verification and analytics go live in a single deployment.</li>
                </ol>
                <p className="text-[11px] text-sky-200/80">You can paste multiple meta, script, and link tags in Custom Head Code. There is no hard length limit on the editor side.</p>
              </div>

              {deployedUrl && (
                <div className="rounded-lg bg-green-900/30 border border-green-800 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Live Site
                    </div>
                    <button
                      onClick={unpublishSite}
                      disabled={isUnpublishing}
                      className="text-xs px-2 py-1 rounded bg-red-900/40 border border-red-800/60 text-red-400 hover:bg-red-900/70 hover:text-red-300 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isUnpublishing ? "Unpublishing..." : "Unpublish"}
                    </button>
                  </div>
                  <a href={deployedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300 underline break-all">
                    {deployedUrl}
                  </a>
                  <p className="text-xs text-gray-500 mt-1.5">Unpublish to remove this site from Netlify and enable deletion.</p>
                </div>
              )}

              {/* Netlify API Token */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Netlify API Token</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={netlifyToken}
                    onChange={e => {
                      setNetlifyToken(e.target.value);
                      setTokenValid(null);
                      setSlugAvailable(null);
                      setSlugStatusMessage("");
                    }}
                    className="bg-gray-800 border-gray-700 text-white text-sm flex-1"
                    placeholder="nfp_xxxxxxxxxxxxxxxxxx"
                  />
                  <Button size="sm" variant="outline" onClick={verifyNetlifyToken} disabled={isVerifyingToken || !netlifyToken}
                    className={`border-gray-700 bg-gray-900 text-xs whitespace-nowrap hover:bg-gray-800 ${tokenValid === true ? 'border-green-600 text-green-400' : tokenValid === false ? 'border-red-600 text-red-400' : 'text-gray-300'}`}>
                    {isVerifyingToken ? <Loader2 className="w-3 h-3 animate-spin" /> : tokenValid === true ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Connected</> : tokenValid === false ? "✗ Invalid" : "Connect"}
                  </Button>
                </div>
                <p className="text-xs text-gray-600">Get yours: Netlify → Avatar → User Settings → Personal access tokens</p>
              </div>

              {/* Site Name + Domain Check (shown after token verified) */}
              {tokenValid && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Site Name (your domain on Netlify)</Label>
                  <div className="flex items-center gap-0">
                    <Input
                      value={desiredSlug || siteData.urlSlug}
                      onChange={e => {
                        setDesiredSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                        setSlugAvailable(null);
                        setSlugStatusMessage("");
                      }}
                      className="bg-gray-800 border-gray-700 text-white text-sm rounded-r-none border-r-0 flex-1"
                      placeholder={siteData.urlSlug || "rapid-dry-restoration"}
                    />
                    <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-2 h-9 flex items-center">.netlify.app</span>
                    <Button size="sm" variant="outline" onClick={checkSlugAvailability} disabled={isCheckingSlug || !netlifyToken}
                      className={`rounded-l-none border-l-0 bg-gray-900 text-xs h-9 whitespace-nowrap hover:bg-gray-800 ${slugAvailable === true ? 'border-green-600 text-green-400' : slugAvailable === false ? 'border-red-600 text-red-400' : 'border-gray-700 text-gray-300'}`}>
                      {isCheckingSlug ? <Loader2 className="w-3 h-3 animate-spin" /> : slugAvailable === true ? "✓ Free" : slugAvailable === false ? "✗ Taken" : "Check"}
                    </Button>
                  </div>
                  {slugStatusMessage && (
                    <p className={`text-xs ${slugAvailable === true ? 'text-green-400' : 'text-red-400'}`}>
                      {slugStatusMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Publish Button */}
              <Button
                onClick={() => {
                  if (desiredSlug) updateField("urlSlug", desiredSlug);
                  setSkipDomainCheck(false);
                  setShowPublishModal(true);
                }}
                disabled={isDeploying || !netlifyToken || !tokenValid}
                className="w-full bg-[#7C3AED] hover:bg-[#9333EA] disabled:opacity-50"
              >
                {isDeploying ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deploying...</>
                ) : (
                  <><Rocket className="w-4 h-4 mr-2" /> {deployedUrl ? "Configure / Redeploy" : "Publish to Netlify"}</>
                )}
              </Button>
              {!netlifyToken && <p className="text-xs text-center text-gray-600">Enter and verify your Netlify token to publish</p>}
              {netlifyToken && tokenValid && slugAvailable === null && <p className="text-xs text-center text-yellow-500">Check domain availability before publishing</p>}

              {/* Google Analytics */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Google Analytics 4 ID <span className="text-gray-600">(optional)</span></Label>
                <Input
                  value={(siteData as any).googleAnalyticsId || ""}
                  onChange={e => updateField("googleAnalyticsId", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-sm"
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="text-xs text-gray-600">Go to Google Analytics → Admin → Data Streams to find your Measurement ID (starts with G-) and enter it here. If Google provides a complete site tag or script, paste that in Custom Head Code instead.</p>
              </div>

              {/* Custom Head Code */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">
                  Custom Head Code <span className="text-gray-600">(optional)</span>
                </Label>
                <Textarea
                  value={(siteData as any).customHeadCode || ""}
                  onChange={e => updateField("customHeadCode", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-xs font-mono min-h-[220px] resize-y"
                  placeholder={`<!-- Paste Google Search Console verification here -->\n<meta name="google-site-verification" content="...">\n\n<!-- Paste Google Analytics / gtag snippet here if needed -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-XXXXXXXXXX');\n</script>\n\n<!-- You can also paste Bing, Pinterest, Meta Pixel, or any other head tags -->`}
                  spellCheck={false}
                  rows={10}
                />
                <p className="text-xs text-gray-600">Paste your Google Search Console verification meta tag, Google Analytics tracking code, and any third-party scripts here (Bing verification, Pinterest tags, Meta Pixel, etc.). This code will be injected into the &lt;head&gt; of every page.</p>
              </div>

              <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-300">Checklist Progress</p>
                    <p className="text-[11px] text-gray-500">{checklistMetrics.completedCount} of {checklistMetrics.totalCount} items completed</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("checklist")}
                    className="rounded-md border border-gray-600 px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-700/60 hover:text-white"
                  >
                    Open checklist
                  </button>
                </div>

                <div className="h-2 rounded-full bg-gray-900 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] transition-all duration-300" style={{ width: `${checklistMetrics.percent}%` }} />
                </div>

                {checklistMetrics.incompleteItems.length > 0 ? (
                  <div className="space-y-1">
                    {checklistMetrics.incompleteItems.slice(0, 3).map((item) => (
                      <p key={item} className="text-xs text-gray-500">• {item}</p>
                    ))}
                    {checklistMetrics.incompleteItems.length > 3 && (
                      <p className="text-xs text-gray-600">+{checklistMetrics.incompleteItems.length - 3} more checklist items pending</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-400">Checklist is complete. You're ready to publish.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden">
          {/* Preview toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">Preview:</span>

            {/* Page selector */}
            <select
              value={previewPage}
              onChange={e => setPreviewPage(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1"
            >
              <optgroup label="Core Pages">
                <option value="index.html">Homepage</option>
                <option value="about.html">About Us</option>
                <option value="contact.html">Contact</option>
                <option value="faq.html">FAQ</option>
                <option value="gallery.html">Gallery</option>
                {(siteData.publishTier === '2' || siteData.publishTier === '3') && (
                  <option value="blog.html">Blog</option>
                )}
                <option value="calculator.html">Calculators</option>
              </optgroup>
              <optgroup label="Calculator Pages">
                <option value="calculators/cost-estimator.html">Cost Estimator</option>
                <option value="calculators/drying-time.html">Drying Time</option>
                <option value="calculators/mold-risk.html">Mold Risk</option>
                <option value="calculators/insurance-estimator.html">Insurance Estimator</option>
                <option value="calculators/dehumidifier-sizing.html">Dehumidifier Sizing</option>
                <option value="calculators/restore-vs-replace.html">Restore vs Replace</option>
              </optgroup>
              {(siteData.publishTier === '2' || siteData.publishTier === '3') && Array.isArray(siteData.services) && siteData.services.length > 0 && (
                <optgroup label="Service Pages">
                  {siteData.services.map(s => {
                    const slug = `services/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${(siteData.city || "").toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                    return <option key={s} value={slug}>{s}</option>;
                  })}
                </optgroup>
              )}
              {(siteData.publishTier === '2' || siteData.publishTier === '3') && Array.isArray(siteData.serviceAreas) && siteData.serviceAreas.length > 0 && (
                <optgroup label="Location Pages">
                  {siteData.serviceAreas.map(l => {
                    const slug = `locations/${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                    return <option key={l} value={slug}>{l}</option>;
                  })}
                </optgroup>
              )}
              {(siteData.publishTier === '2' || siteData.publishTier === '3') && Array.isArray(siteData.blogPosts) && siteData.blogPosts.length > 0 && (
                <optgroup label="Blog Posts">
                  {siteData.blogPosts.map(p => {
                    const slug = `blog/${(p.slug || p.title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                    return <option key={p.id} value={slug}>{p.title}</option>;
                  })}
                </optgroup>
              )}
              {siteData.publishTier === '3' && (siteData as any).enableMatrixPages && Array.isArray(siteData.services) && siteData.services.length > 0 && Array.isArray(siteData.serviceAreas) && siteData.serviceAreas.length > 0 && (
                <optgroup label="Matrix Pages (Service × City)">
                  {siteData.services.flatMap(s =>
                    siteData.serviceAreas.map(l => {
                      const slug = `matrix/${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-in-${l.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                      return <option key={`${s}-${l}`} value={slug}>{s} in {l}</option>;
                    })
                  )}
                </optgroup>
              )}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisualEditor(true)}
              disabled={Object.keys(generatedFiles).length === 0}
              className="ml-auto border-[#7C3AED]/60 bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 font-medium text-xs h-7 px-2"
            >
              <Edit3 className="w-3 h-3 mr-1" /> Visual Editor
            </Button>

            {deployedUrl && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live: {deployedUrl}
              </span>
            )}
          </div>

          {/* Hidden file input for click-to-upload */}
          <input
            type="file"
            ref={hiddenFileInputRef}
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              const key = pendingUploadKeyRef.current;
              if (file && key) handleCustomImageUpload(key, file);
              e.target.value = '';
              pendingUploadKeyRef.current = null;
            }}
          />

          {/* Preview iframe or placeholder */}
          <div className="flex-1 overflow-hidden bg-white">
            {previewBlobUrl ? (
              <iframe
                ref={iframeRef}
                src={previewBlobUrl}
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-950 text-gray-500">
                <Globe className="w-16 h-16 mb-4 text-gray-700" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Preview Yet</h3>
                <p className="text-sm text-center max-w-sm mb-6">
                  Your website has been generated. Click "Regenerate" to build the preview, or go straight to "Publish to Netlify".
                </p>
                <Button onClick={regenerateFiles} disabled={isRegenerating} className="bg-blue-600 hover:bg-blue-700">
                  {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Generate Preview
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Editor Modal */}
      <VisualEditor
        initialHtml={getCurrentPageHtml()}
        globalCss={''}
        isOpen={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onSave={handleVisualEditorSave}
      />

      {/* Publish Website Modal */}
      <PublishWebsiteModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onOpenDeployTab={() => setActiveTab("deploy")}
        websiteId={websiteId || ""}
        defaultSlug={desiredSlug || siteData.urlSlug || ""}
        deployedUrl={deployedUrl}
        currentSiteName={desiredSlug || siteData.urlSlug || ""}
        netlifyToken={netlifyToken}
        tokenVerified={tokenValid === true}
        checklistCompletion={checklistMetrics}
        onReviewChecklist={() => setActiveTab("checklist")}
        publishTier={siteData.publishTier || '1'}
        onChangePublishTier={(tier) => updateField("publishTier", tier)}
        onDownloadZip={downloadZip}
        customImages={siteData.customImages}
        galleryImages={siteData.galleryImages}
        skipDomainCheck={skipDomainCheck}
        onBeforeDeploy={async () => {
          const currentSiteData = siteDataRef.current;
          if (!currentSiteData) {
            throw new Error("Website data is not ready yet.");
          }

          setAutoSaveStatus("saving");
          await persistCurrentWebsiteState(currentSiteData, { includeCustomFiles: true });
        }}
        onDeploySuccess={(url, siteName) => {
          setDeployedUrl(url);
          setDesiredSlug(siteName);
          updateField("urlSlug", siteName);
        }}
      />

      {/* Image Session Memory Warning Dialog */}
      <Dialog open={showImageMemoryDialog} onOpenChange={setShowImageMemoryDialog}>
        <DialogContent className="sm:max-w-md bg-gray-950 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="w-5 h-5 text-[#7C3AED]" />
              Image Stored in Session Memory
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs mt-2 leading-relaxed">
              To optimize database performance and space, custom uploaded images (excluding logo and favicon) are stored in your browser session memory.
              <br /><br />
              These images will be bundled when you publish to Netlify or download the ZIP, but they will not be saved permanently in the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between items-center gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (lastUploadedImageSrc) {
                  downloadBase64Image(lastUploadedImageSrc, lastUploadedImageName);
                }
              }}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 text-xs flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Save Image Only
            </Button>
            <Button
              type="button"
              onClick={() => setShowImageMemoryDialog(false)}
              className="bg-[#7C3AED] hover:bg-[#9333EA] text-white text-xs px-4"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper: Collapsible Section ───────────────────────────────────────────

function ContentSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 text-left text-xs font-medium text-gray-300 hover:bg-gray-750 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && <div className="p-3 bg-gray-900 space-y-2">{children}</div>}
    </div>
  );
}
