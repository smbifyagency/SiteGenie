/**
 * Water Damage Restoration - Dedicated HTML Template Generator
 * Single-niche, SEO-optimized, lead-generation focused
 *
 * Pages generated:
 * - index.html            Homepage (AI, 2000+ words)
 * - about.html            About Us (AI)
 * - contact.html          Contact (template)
 * - faq.html              FAQ (AI, 30+ questions)
 * - calculator.html       Cost/Drying/Mold/Insurance/Dehumidifier/Restoration calculators
 * - blog.html             Blog archive (template)
 * - gallery.html          Before/After + project gallery (template)
 * - privacy.html          Privacy Policy (template)
 * - terms.html            Terms of Service (template)
 * - services/[slug].html  Per service (AI, 2000-2500 words)
 * - locations/[slug].html Per location (AI, 2000-2500 words)
 * - robots.txt, sitemap.xml
 */

export type WDFontFamily = 'inter' | 'poppins' | 'montserrat' | 'merriweather';

/** Darken a hex color by multiplying each channel by `factor` (0–1). */
function darkenHex(hex: string, factor: number): string {
  try {
    const c = hex.replace('#', '');
    const r = Math.round(parseInt(c.slice(0, 2), 16) * factor);
    const g = Math.round(parseInt(c.slice(2, 4), 16) * factor);
    const b = Math.round(parseInt(c.slice(4, 6), 16) * factor);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch { return '#0f2244'; }
}

/** Convert hex to "r, g, b" string for use inside rgba(). */
function hexToRgb(hex: string): string {
  try {
    const c = hex.replace('#', '');
    return `${parseInt(c.slice(0,2),16)}, ${parseInt(c.slice(2,4),16)}, ${parseInt(c.slice(4,6),16)}`;
  } catch { return '15, 34, 68'; }
}

/** Capitalize the first letter of each word except common prepositions/conjunctions. */
export function capitalizeHeading(str: string): string {
  if (!str) return "";
  const lowercasePrepositions = [
    'in', 'and', 'for', 'of', 'to', 'a', 'an', 'the', 'at', 'by', 'from', 'on', 'with', 'about', 'as', 'into', 'like', 'through', 'over', 'under'
  ];
  return str
    .split(/\s+/)
    .map((word, index) => {
      const cleanedWord = word.replace(/[^a-zA-Z]/g, '');
      const lowerClean = cleanedWord.toLowerCase();
      if (index > 0 && lowercasePrepositions.includes(lowerClean)) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Check if the address already contains the city and state, and format nicely without duplicates. */
export function formatDisplayAddress(address: string, city: string = "", state: string = ""): string {
  if (!address) return "";
  const cleanedAddress = address.trim();
  const cleanedCity = city.trim();
  const cleanedState = state.trim();
  const addressLower = cleanedAddress.toLowerCase();

  const containsCity = cleanedCity && addressLower.includes(cleanedCity.toLowerCase());
  const containsState = cleanedState && addressLower.includes(cleanedState.toLowerCase());

  if (containsCity && containsState) {
    return cleanedAddress;
  }

  const parts = [cleanedAddress];
  const cityStateParts = [];
  if (cleanedCity && !containsCity) {
    cityStateParts.push(cleanedCity);
  }
  if (cleanedState && !containsState) {
    cityStateParts.push(cleanedState);
  }
  if (cityStateParts.length > 0) {
    parts.push(cityStateParts.join(', '));
  }
  return parts.join(', ');
}

/** Format address specifically for contact block and footer, splitting street and city/state on a new line. */
export function formatFooterAddress(address: string, city: string = "", state: string = ""): string {
  if (!address) return "";
  const cleanedAddress = address.trim();
  const cleanedCity = city.trim();
  const cleanedState = state.trim();
  const addressLower = cleanedAddress.toLowerCase();

  const containsCity = cleanedCity && addressLower.includes(cleanedCity.toLowerCase());
  const containsState = cleanedState && addressLower.includes(cleanedState.toLowerCase());

  if (containsCity) {
    const cityIndex = addressLower.indexOf(cleanedCity.toLowerCase());
    if (cityIndex > 0) {
      const partBeforeCity = cleanedAddress.substring(0, cityIndex).trim();
      const partFromCity = cleanedAddress.substring(cityIndex).trim();
      const streetPart = partBeforeCity.replace(/,\s*$/, '').trim();
      return `${streetPart}<br>${partFromCity}`;
    }
    return cleanedAddress;
  }

  const streetPart = cleanedAddress;
  const cityStateParts = [];
  if (cleanedCity) cityStateParts.push(cleanedCity);
  if (cleanedState) cityStateParts.push(cleanedState);

  if (cityStateParts.length > 0) {
    return `${streetPart}<br>${cityStateParts.join(', ')}`;
  }
  return streetPart;
}

export interface WDTheme {
  primaryColor: string;    // header, buttons, headings
  secondaryColor: string;  // links, accents, hover
  accentColor: string;     // emergency CTA (default red)
  fontFamily: WDFontFamily;
  heroImageUrl?: string;   // optional custom hero background
}

export interface WDBusinessData {
  businessName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  countryCode?: string;
  primaryKeyword: string;
  secondaryKeyword?: string;
  services: string[];
  serviceAreas: string[];
  urlSlug: string;
  // SEO & Analytics
  googleVerificationCode?: string;
  googleAnalyticsId?: string;
  customHeadCode?: string;
  // Theme
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: WDFontFamily;
  // Media
  logoUrl?: string;
  logoAlt?: string;
  faviconUrl?: string;
  // Business details
  contactFormEmbed?: string;
  yearsInBusiness?: string;
  licenseNumber?: string;
  insuranceInfo?: string;
  // About page data
  aboutContent?: string;
  teamDescription?: string;
  // Custom images: placeholder key → data URL or hosted URL
  customImages?: Record<string, string>;
  // Social media
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  googleUrl?: string;
  googleMapsUrl?: string;
  yelpUrl?: string;
  twitterUrl?: string;
  // Floating CTA: 'call' (default) | 'whatsapp' | 'none'
  floatingCTA?: 'call' | 'whatsapp' | 'none';
  whatsappNumber?: string;
  // Matrix pages: service × location cross-product
  enableMatrixPages?: boolean;
  hideBeforeAfter?: boolean;
  businessHours?: string;
  // Publishing tier (Stage 1, 2, or 3)
  publishTier?: '1' | '2' | '3';
  customDomain?: string;
  // Gallery images (uploaded by user, hosted on Netlify after publish)
  galleryImages?: WDGalleryImage[];
  // Blog posts
  blogPosts?: WDBlogPost[];
  generateBlog?: boolean;
  // AI-generated content
  homepageContent?: WDHomepageContent;
  serviceContent?: Record<string, WDServiceContent>;
  locationContent?: Record<string, WDLocationContent>;
  faqContent?: WDFAQPageContent;
  // Multi-category support — injected by generateLocalServiceWebsite()
  _categoryId?: string;
  _heroTagline?: string;
  _heroSubheading?: string;
  _ctaHeadline?: string;
  _ctaSubtext?: string;
  _ctaButton?: string;
  _emergencyBadge?: string;
  _trustBadges?: string[];
  _whyUsPoints?: Array<{ icon: string; heading: string; body: string }>;
  _schemaType?: string;
  _schemaDescription?: string;
  _schemaOfferCatalogName?: string;
  _footerEmergencyText?: string;
  _whatsappMessage?: string;
  _introH2?: string;
  _introParas?: string[];
  _servicesH2?: string;
  _servicesIntro?: string;
  _processH2?: string;
  _processSteps?: Array<{ step: number; heading: string; body: string }>;
  _locationsBody?: string;
  _faqH2?: string;
  _faqs?: Array<{ question: string; answer: string }>;
  _seoBody?: string;
  _calcPageH1?: string;
  _metaDescription?: string;
  _servicePageBenefitsH2?: string;
  _servicePageBenefits?: Array<{ heading: string; body: string }>;
}

export interface WDGalleryImage {
  src: string;         // URL (placeholder or uploaded)
  alt: string;
  type: 'before' | 'after' | 'normal';
  pairId?: string;     // for before/after pairs
  caption?: string;
}

const LOREM_PLACEHOLDER = {
  title: 'Lorem ipsum dolor sit amet',
  subtitle: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  paragraph:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  paragraphAlt:
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
};

const loremParagraphs = (count: number): string[] =>
  Array.from({ length: count }, (_, i) =>
    i % 2 === 0 ? LOREM_PLACEHOLDER.paragraph : LOREM_PLACEHOLDER.paragraphAlt
  );

export interface WDBlogPost {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  date?: string;
  category?: string;
  keywords?: string;
  status?: string;
  isAiGenerated?: boolean;
}

export interface WDFAQPageContent {
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
  intro?: string;
  categories?: Array<{
    heading: string;
    faqs: Array<{ question: string; answer: string }>;
  }>;
}

export interface WDHomepageContent {
  metaTitle: string;
  metaDescription: string;
  hero: {
    h1: string;
    subheadline: string;
    primaryCTA: string;
    trustLine: string;
  };
  intro: {
    h2: string;
    paragraphs: string[];
  };
  servicesSection: {
    h2: string;
    intro: string;
    cards: Array<{
      service: string;
      icon?: string;
      h3: string;
      description: string;
      internalLink: { anchor: string; slug: string };
    }>;
  };
  whyUsSection: {
    h2: string;
    points: Array<{
      icon: string;
      heading: string;
      body: string;
    }>;
  };
  processSection?: {
    h2: string;
    steps: Array<{ step: number; heading: string; body: string }>;
  };
  locationsSection: {
    h2: string;
    body: string;
    locationLinks: Array<{ city: string; anchor: string; slug: string }>;
  };
  faqSection: {
    h2: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  finalCTA: {
    h2: string;
    body: string;
    ctaButton: string;
    phone: string;
  };
  seoFootnote?: {
    h2: string;
    body: string;
    targetKeywords: string[];
  };
}

export interface WDServiceContent {
  metaTitle: string;
  metaDescription: string;
  breadcrumb: string;
  hero: {
    h1: string;
    subheadline: string;
    trustBadges: string[];
  };
  overviewSection: {
    h2: string;
    body: string[];
  };
  processSection: {
    h2: string;
    intro: string;
    steps: Array<{ step: number; heading: string; body: string }>;
  };
  benefitsSection: {
    h2: string;
    points: Array<{ heading: string; body: string }>;
  };
  warningSignsSection: {
    h2: string;
    intro: string;
    signs: Array<{ sign: string; body: string }>;
  };
  locationClusterSection: {
    h2: string;
    intro: string;
    locationCards: Array<{ city: string; anchor: string; slug: string; teaser: string }>;
  };
  faqSection: {
    h2: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  crossLinkSection: {
    h2: string;
    links: Array<{ service: string; anchor: string; slug: string; reason: string }>;
  };
  finalCTA: {
    h2: string;
    body: string;
    ctaButton: string;
    phone: string;
  };
  targetKeywordsSummary: string[];
}

export interface WDLocationContent {
  metaTitle: string;
  metaDescription: string;
  breadcrumb: string;
  hero: {
    h1: string;
    subheadline: string;
    trustBadges: string[];
  };
  localIntroSection: {
    h2: string;
    paragraphs: string[];
  };
  servicesInCitySection: {
    h2: string;
    intro: string;
    serviceCards: Array<{
      service: string;
      icon?: string;
      h3: string;
      description: string;
      internalLink: { anchor: string; slug: string };
    }>;
  };
  whyLocalSection: {
    h2: string;
    points: Array<{ heading: string; body: string }>;
  };
  localAreaSection: {
    h2: string;
    body: string;
  };
  faqSection: {
    h2: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  finalCTA: {
    h2: string;
    body: string;
    ctaButton: string;
    phone: string;
  };
  targetKeywordsSummary: string[];
}

// ─── Theme / Font System ───────────────────────────────────────────────────

const FONT_URLS: Record<WDFontFamily, string> = {
  inter: '',
  poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
  merriweather: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Inter:wght@400;500;600;700&display=swap',
};

const FONT_STACKS: Record<WDFontFamily, string> = {
  inter: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, sans-serif',
  poppins: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
  montserrat: '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
  merriweather: '"Merriweather", Georgia, "Times New Roman", serif',
};

export function getSiteHost(data: WDBusinessData, domain: string): string {
  if (data.customDomain && data.customDomain.trim()) {
    const cd = data.customDomain.trim();
    return cd.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }
  const host = domain.includes('.netlify.app') ? domain : `${domain}.netlify.app`;
  return host;
}

export function getSiteUrl(data: WDBusinessData, domain: string): string {
  const host = getSiteHost(data, domain);
  return `https://${host}`;
}

function resolveTheme(data: WDBusinessData): WDTheme {
  return {
    primaryColor: data.primaryColor || '#1e3a5f',
    secondaryColor: data.secondaryColor || '#0ea5e9',
    accentColor: data.accentColor || '#dc2626',
    fontFamily: data.fontFamily || 'inter',
    heroImageUrl: data.customImages?.['hero-bg'] || (data as any)._categoryImages?.['hero'],
  };
}

// ─── Placeholder Images ────────────────────────────────────────────────────

// Placeholder image URLs for water damage niche - user replaces after generation
const WD_PLACEHOLDER_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1525438160292-a4a860951216?w=1200&q=80',     // water damage / flood scene
  team: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',      // professional restoration team
  equipment: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // industrial drying equipment
  mold: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',      // mold inspection
  flooding: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80',     // flooding scene
  drying: 'https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?w=800&q=80',    // restoration work in progress
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Truncate a string to maxLen characters, breaking at the last word boundary and appending ellipsis if needed. */
function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd() + '…';
}

/** Ensure SEO title is ≤ 60 characters. */
function seoTitle(title: string): string {
  if (!title) return '';
  const trimmed = title.trim();
  const capitalized = trimmed ? (trimmed.charAt(0).toUpperCase() + trimmed.slice(1)) : '';
  return truncateText(capitalized, 60);
}
/** Ensure SEO meta description is ≤ 160 characters. */
function seoDescription(desc: string): string { return truncateText(desc, 160); }
/** Ensure image alt text is ≤ 100 characters. */
function seoAlt(alt: string): string { return truncateText(alt, 100); }

function buildServiceSlug(service: string, city: string): string {
  return `services/${slugify(service)}-${slugify(city)}.html`;
}

/**
 * Strip trailing "Services"/"services" from a keyword to avoid double-word bugs.
 * E.g. "Plumbing Services" → "Plumbing" so `${kw} Services` won't produce "Plumbing Services Services".
 */
function kwBase(keyword: string): string {
  return keyword.replace(/\s+services$/i, '').trim();
}

// ─── Icon name → emoji (AI returns names like "shield", "clock") ────────────
/** Generate a professional inline SVG icon. Falls back to a checkmark. */
function iconToSVG(icon: string, color: string = 'currentColor'): string {
  const s = (d: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  if (!icon) return s('<path d="M20 6L9 17l-5-5"/>');
  const key = icon.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^\x00-\x7F]/g, '');
  const map: Record<string, string> = {
    'shield':       s('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
    'shield-check': s('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'),
    'clock':        s('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    'time':         s('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    'timer':        s('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    'check-circle': s('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
    'check':        s('<path d="M20 6L9 17l-5-5"/>'),
    'checkmark':    s('<path d="M20 6L9 17l-5-5"/>'),
    'star':         s('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
    'award':        s('<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>'),
    'trophy':       s('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'),
    'phone':        s('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    'call':         s('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    'home':         s('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    'house':        s('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    'heart':        s('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    'love':         s('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
    'users':        s('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    'team':         s('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    'people':       s('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    'tool':         s('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    'wrench':       s('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
    'settings':     s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    'zap':          s('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    'lightning':    s('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    'fast':         s('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    'alert':        s('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    'warning':      s('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    'emergency':    s('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
    'map-pin':      s('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    'mappin':       s('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    'map':          s('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    'location':     s('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
    'mail':         s('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    'email':        s('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
    'dollar':       s('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    'money':        s('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    'price':        s('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    'file':         s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    'clipboard':    s('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>'),
    'document':     s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'),
    'water':        s('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
    'droplet':      s('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
    'drop':         s('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
    'mold':         s('<circle cx="12" cy="12" r="4"/><circle cx="4" cy="8" r="2"/><circle cx="20" cy="8" r="2"/><circle cx="4" cy="16" r="2"/><circle cx="20" cy="16" r="2"/><path d="M8.5 9.5L10 11"/><path d="M15.5 9.5L14 11"/><path d="M8.5 14.5L10 13"/><path d="M15.5 14.5L14 13"/>'),
    'bacteria':     s('<circle cx="12" cy="12" r="4"/><circle cx="4" cy="8" r="2"/><circle cx="20" cy="8" r="2"/><circle cx="4" cy="16" r="2"/><circle cx="20" cy="16" r="2"/><path d="M8.5 9.5L10 11"/><path d="M15.5 9.5L14 11"/><path d="M8.5 14.5L10 13"/><path d="M15.5 14.5L14 13"/>'),
    'calendar':     s('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    'date':         s('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    'camera':       s('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    'photo':        s('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
    'search':       s('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    'magnify':      s('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    'lock':         s('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    'secure':       s('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    'truck':        s('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
    'van':          s('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
    'vehicle':      s('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),
    'certified':    s('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5"/>'),
    'certificate':  s('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5"/>'),
    'license':      s('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 6 3 6 3s3 0 6-3v-5"/>'),
    'insurance':    s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
    'paper':        s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
    'thumbs-up':    s('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
    'like':         s('<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>'),
    'smile':        s('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
    'happy':        s('<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'),
    'hammer':       s('<path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V6.5L14.5 2.5 12 5l2 2-1.5 1.5L14 10l2-1.5L17.5 10 17.64 15z"/>'),
  };
  // If icon is already an emoji (non-ASCII), wrap it in the icon container
  if (/[^\x00-\x7F]/.test(icon)) return s('<path d="M20 6L9 17l-5-5"/>');
  return map[key] || map[key.split('-')[0]] || s('<path d="M20 6L9 17l-5-5"/>');
}

function buildLocationSlug(city: string): string {
  return `locations/${slugify(city)}.html`;
}

// ─── SHARED: Google Map Embed (no API key needed) ──────────────────────────

function generateGoogleMap(data: WDBusinessData, focusCity?: string): string {
  // Always query and display the business's physical address (address, city, state)
  // to avoid citation discrepancies (NAP violation).
  const addressQuery = encodeURIComponent([data.address, data.city, data.state].filter(Boolean).join(', '));
  const fallbackSrc = `https://www.google.com/maps?q=${addressQuery}&output=embed`;

  const rawMapInput = (data.googleMapsUrl || '').trim();
  let mapSrc = fallbackSrc;

  if (rawMapInput) {
    if (rawMapInput.includes('<iframe')) {
      const srcMatch = rawMapInput.match(/src=["']([^"']+)["']/i);
      mapSrc = srcMatch?.[1] || fallbackSrc;
    } else {
      mapSrc = rawMapInput;
    }
  }

  if (!/^https?:\/\//i.test(mapSrc)) {
    mapSrc = fallbackSrc;
  }

  const hasEmbedFormat = /output=embed|\/maps\/embed|pb=!/i.test(mapSrc);
  if (!hasEmbedFormat) {
    mapSrc = fallbackSrc;
  }

  const directionsUrl = data.googleMapsUrl && /^https?:\/\//i.test(data.googleMapsUrl) && !data.googleMapsUrl.includes('<iframe')
    ? data.googleMapsUrl
    : `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;

  return `<div style="border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);margin-top:1rem;">
    <iframe
      src="${mapSrc}"
      width="100%" height="350" style="border:0;display:block;" loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="Map showing ${formatDisplayAddress(data.address, data.city, data.state)}"
      allowfullscreen></iframe>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:1.25rem;padding:1rem;background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);align-items:center;justify-content:space-between;">
    <div style="display:flex;flex-wrap:wrap;gap:1.5rem;flex:1;">
      <div style="min-width:180px;">
        <strong style="font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b;">Address</strong>
        <p style="margin:.25rem 0 0;color:#1e293b;">${formatDisplayAddress(data.address, data.city, data.state)}</p>
      </div>
      <div style="min-width:140px;">
        <strong style="font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b;">Phone</strong>
        <p style="margin:.25rem 0 0;"><a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" style="color:#1e293b;font-weight:600;text-decoration:none;">${data.phone}</a></p>
      </div>
      ${data.email ? `<div style="min-width:140px;">
        <strong style="font-size:.85rem;text-transform:uppercase;letter-spacing:.04em;color:#64748b;">Email</strong>
        <p style="margin:.25rem 0 0;"><a href="mailto:${data.email}" style="color:#1e293b;text-decoration:none;">${data.email}</a></p>
      </div>` : ''}
    </div>
    <div style="margin-top:0.5rem;">
      <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.5rem;background:#2563eb;color:#fff;padding:0.6rem 1.2rem;border-radius:6px;text-decoration:none;font-size:0.875rem;font-weight:600;transition:background 0.2s;" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
        Get Directions
      </a>
    </div>
  </div>`;
}

// ─── SHARED: Navigation ────────────────────────────────────────────────────

function generateNav(data: WDBusinessData, currentPath: string = ''): string {
  const prefix = currentPath.includes('/') ? '../' : '';
  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';
  const showBlog = (tier === '2' || tier === '3') && (data.generateBlog !== undefined ? data.generateBlog : (data.blogPosts && data.blogPosts.length > 0));

  const serviceLinks = data.services
    .slice(0, 8)
    .map(s => `<li><a href="${prefix}services/${slugify(s)}-${slugify(data.city)}.html">${s}</a></li>`)
    .join('');
  const locationLinks = data.serviceAreas
    .slice(0, 8)
    .map(l => `<li><a href="${prefix}locations/${slugify(l)}.html">${l}</a></li>`)
    .join('');

  const genericLogoSvg = `<svg class="generic-logo" viewBox="0 0 44 44" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><path d="M22 11l-9 8.5h3.5V31h4.5v-6h2v6h4.5V19.5H31L22 11z" fill="#fff" opacity="0.9"/><circle cx="22" cy="14" r="2" fill="#fff" opacity="0.7"/></svg>`;

  const logoHtml = data.logoUrl
    ? `<a href="${prefix}index.html" aria-label="${data.businessName} - Home">
          <img src="${data.logoUrl}" alt="${data.logoAlt || data.businessName + ' logo'}" class="header-logo" width="160" height="48" loading="eager">
        </a>`
    : `<a href="${prefix}index.html" class="brand-logo-link" aria-label="Home">${genericLogoSvg}</a>`;

  return `
  <header class="site-header" role="banner">
    <div class="header-inner">
      <div class="header-brand">
        ${logoHtml}
      </div>

      <nav class="main-nav" role="navigation" aria-label="Main navigation">
        <ul class="nav-list">
          <li><a href="${prefix}index.html">Home</a></li>
          ${showServicesLocations ? `
          <li class="has-dropdown">
            <a href="#" aria-haspopup="true" aria-expanded="false">Services ▾</a>
            <ul class="dropdown" role="menu">
              ${serviceLinks}
            </ul>
          </li>
          <li class="has-dropdown">
            <a href="#" aria-haspopup="true" aria-expanded="false">Areas ▾</a>
            <ul class="dropdown" role="menu">
              ${locationLinks}
            </ul>
          </li>
          ` : ''}
          <li><a href="${prefix}about.html">About</a></li>
          <li><a href="${prefix}gallery.html">Gallery</a></li>
          <li><a href="${prefix}faq.html">FAQ</a></li>
          <li class="has-dropdown">
            <a href="${prefix}calculator.html" aria-haspopup="true" aria-expanded="false">Calculators ▾</a>
            <ul class="dropdown" role="menu">
              <li><a href="${prefix}calculators/cost-estimator.html">Cost Estimator</a></li>
              <li><a href="${prefix}calculators/drying-time.html">Drying Time</a></li>
              <li><a href="${prefix}calculators/mold-risk.html">Mold Risk</a></li>
              <li><a href="${prefix}calculators/insurance-estimator.html">Insurance</a></li>
              <li><a href="${prefix}calculators/dehumidifier-sizing.html">Dehumidifier</a></li>
              <li><a href="${prefix}calculators/restore-vs-replace.html">Restore vs Replace</a></li>
            </ul>
          </li>
          ${showBlog ? `<li><a href="${prefix}blog.html">Blog</a></li>` : ''}
          <li><a href="${prefix}contact.html">Contact</a></li>
        </ul>
      </nav>

      <div class="header-cta">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-emergency" aria-label="Call us now">
          ${data.phone}
        </a>
      </div>

      <button class="mobile-menu-toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </header>`;
}

// ─── SHARED: Footer ────────────────────────────────────────────────────────

function generateFooter(data: WDBusinessData, currentPath: string = ''): string {
  data = sanitizeBusinessData(data);
  const prefix = currentPath.includes('/') ? '../' : '';
  const theme = resolveTheme(data);
  const primaryColor = theme.primaryColor || '#1e3a5f';
  const accentColor = theme.accentColor || '#dc2626';
  const secondaryColor = theme.secondaryColor || '#0ea5e9';
  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';

  const serviceLinks = data.services
    .slice(0, 5)
    .map(s => `<li><a href="${prefix}services/${slugify(s)}-${slugify(data.city)}.html">${s}</a></li>`)
    .join('');
  const locationLinks = data.serviceAreas
    .slice(0, 5)
    .map(l => `<li><a href="${prefix}locations/${slugify(l)}.html">${l}</a></li>`)
    .join('');
  const year = new Date().getFullYear();

  const footerGenericLogo = `<svg class="generic-logo-footer" viewBox="0 0 44 44" width="44" height="44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/><path d="M22 11l-9 8.5h3.5V31h4.5v-6h2v6h4.5V19.5H31L22 11z" fill="#fff" opacity="0.7"/><circle cx="22" cy="14" r="2" fill="#fff" opacity="0.5"/></svg>`;

  const brandBlock = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${data.logoAlt || data.businessName + ' logo'}" class="footer-logo" width="140" height="42" loading="lazy">
        <p style="margin-top:0.75rem;">${data.businessName}</p>`
    : `<div class="footer-brand-icon">${footerGenericLogo}</div>`;

  // Social media SVG icons
  const socialSVGs: Record<string, string> = {
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`,
    google: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
    yelp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.936-4.313c.258-.38.784-.456 1.14-.166l3.032 2.47c.496.404.368 1.12-.122 1.41l-.815.476v.32zM16.758 17.12l-1.383-5.023c-.267-.97 1.035-1.572 1.57-.726l2.787 4.406c.244.386.08.916-.35 1.1l-3.66 1.558c-.596.254-1.184-.32-.964-.915v-.4zM11.08 20.73c-.06.44-.512.706-.926.546l-3.524-1.36c-.31-.12-.48-.44-.39-.764l1.385-5.024c.268-.97 1.632-.59 1.642.458l.054 5.464c0 .23-.08.45-.24.62v.06zM6.876 12.47L11.4 10.1c.876-.46.404-1.776-.57-1.585L5.83 9.484c-.446.088-.74.52-.624.958l.988 3.724c.162.61.87.74 1.2.198l.482-.794v-.1zM10.12 2.64v5.32c0 1.008-1.45 1.21-1.748.244L6.086 2.01c-.136-.44.092-.92.504-1.082l3.508-1.38c.574-.226 1.156.27 1.07.87l-.05.22v2z"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
  };

  const socialLinksHTML = (() => {
    const pairs: Array<{url: string; key: string; label: string}> = [];
    if (data.facebookUrl) pairs.push({ url: data.facebookUrl, key: 'facebook', label: 'Facebook' });
    if (data.instagramUrl) pairs.push({ url: data.instagramUrl, key: 'instagram', label: 'Instagram' });
    if (data.googleUrl) pairs.push({ url: data.googleUrl, key: 'google', label: 'Google' });
    if (data.yelpUrl) pairs.push({ url: data.yelpUrl, key: 'yelp', label: 'Yelp' });
    if (data.twitterUrl) pairs.push({ url: data.twitterUrl, key: 'x', label: 'X' });
    if (pairs.length === 0) return '';
    return `<div class="footer-social">${pairs.map(p =>
      `<a href="${p.url}" target="_blank" rel="noopener noreferrer" aria-label="${p.label}">${socialSVGs[p.key] || ''}</a>`
    ).join('')}</div>`;
  })();

  const showMap = currentPath !== 'contact.html';
  const mapSection = showMap ? `
  <section class="footer-map-section reveal" style="width: 100%; margin: 0; padding: 0;" aria-label="Our Location Map">
    ${generateGoogleMap(data)}
  </section>
  ` : '';

  return `
  ${mapSection}
  <footer class="site-footer" role="contentinfo">
    <div class="footer-inner ${showServicesLocations ? 'has-four-cols' : 'has-two-cols'}">
      <div class="footer-brand">
        ${brandBlock}
        <p class="footer-brand-desc">${data.businessName} provides professional ${kwBase(data.primaryKeyword).toLowerCase()} services in ${data.city}, ${data.state} and surrounding areas.</p>
        ${socialLinksHTML}
        <div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.35rem 0.75rem;">
          <a href="${prefix}about.html" style="color:#94a3b8;font-size:.85rem;">About</a>
          <a href="${prefix}faq.html" style="color:#94a3b8;font-size:.85rem;">FAQ</a>
          <a href="${prefix}gallery.html" style="color:#94a3b8;font-size:.85rem;">Gallery</a>
          <a href="${prefix}calculator.html" style="color:#94a3b8;font-size:.85rem;">Calculators</a>
          <a href="${prefix}contact.html" style="color:#94a3b8;font-size:.85rem;">Contact</a>
          <a href="${prefix}privacy.html" style="color:#94a3b8;font-size:.85rem;">Privacy</a>
          <a href="${prefix}terms.html" style="color:#94a3b8;font-size:.85rem;">Terms</a>
        </div>
      </div>

      ${showServicesLocations ? `
      <div class="footer-links">
        <h3>Our Services</h3>
        <ul>${serviceLinks}</ul>
      </div>

      <div class="footer-links">
        <h3>Service Areas</h3>
        <ul>${locationLinks}</ul>
      </div>
      ` : ''}

      <div class="footer-contact">
        <h3>Contact Us</h3>
        <div class="footer-contact-item">
          <span class="footer-contact-icon">${iconToSVG('phone', primaryColor)}</span>
          <div>
            <div class="footer-contact-label">Phone</div>
            <div class="footer-contact-value"><a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="footer-phone">${data.phone}</a></div>
          </div>
        </div>
        ${data.email ? `
        <div class="footer-contact-item">
          <span class="footer-contact-icon">${iconToSVG('mail', primaryColor)}</span>
          <div>
            <div class="footer-contact-label">Email</div>
            <div class="footer-contact-value"><a href="mailto:${data.email}">${data.email}</a></div>
          </div>
        </div>` : ''}
        <div class="footer-contact-item">
          <span class="footer-contact-icon">${iconToSVG('mapPin', primaryColor)}</span>
          <div>
            <div class="footer-contact-label">Address</div>
            <div class="footer-contact-value">${formatFooterAddress(data.address, data.city, data.state)}</div>
          </div>
        </div>
        <div class="footer-contact-item">
          <span class="footer-contact-icon">${iconToSVG('clock', primaryColor)}</span>
          <div>
            <div class="footer-contact-label">Hours</div>
            <div class="footer-contact-value">${data.businessHours ? data.businessHours.split(',').map(h => h.trim()).join('<br>') : (data._footerEmergencyText || 'Available 24/7').replace(/\{\{city\}\}/g, data.city || '')}</div>
          </div>
        </div>
        ${data.licenseNumber ? `<p style="font-size:.8rem;color:#64748b;margin-top:.5rem;">License: ${data.licenseNumber}</p>` : ''}
      </div>
    </div>

    <div class="footer-bottom">
      <p>© ${year} ${data.businessName}. All rights reserved.</p>
      <p>Serving ${data.city}, ${data.state} and surrounding areas.</p>
    </div>
  </footer>`;
}

// ─── SHARED: Schema Markup ─────────────────────────────────────────────────

function generateLocalBusinessSchema(data: WDBusinessData, domain: string): string {
  const host = getSiteHost(data, domain);
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://${host}/#organization`,
    "name": data.businessName,
    "description": data._schemaDescription || `Professional ${kwBase(data.primaryKeyword || 'restoration').toLowerCase()} services in ${data.city}, ${data.state}. 24/7 emergency response. Call ${data.phone}.`,
    "telephone": data.phone,
    "email": data.email || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address,
      "addressLocality": data.city,
      "addressRegion": data.state,
      "addressCountry": data.country || "US"
    },
    "url": `https://${host}`,
    "areaServed": data.serviceAreas.map(area => ({
      "@type": "City",
      "name": area
    })),
    "openingHours": "Mo-Su 00:00-24:00",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": data._schemaOfferCatalogName || `${kwBase(data.primaryKeyword || 'Professional')} Services`,
      "itemListElement": data.services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      }))
    }
  };
  return JSON.stringify(schema, null, 2);
}

function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  return JSON.stringify(schema, null, 2);
}

function generateWebSiteSchema(data: WDBusinessData, domain: string): string {
  const host = getSiteHost(data, domain);
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": data.businessName,
    "url": `https://${host}/`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `https://${host}/?s={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
  return JSON.stringify(schema, null, 2);
}

function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  };
  return JSON.stringify(schema, null, 2);
}

function generateOrganizationSchema(data: WDBusinessData, domain: string): string {
  const host = getSiteHost(data, domain);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.businessName,
    "url": `https://${host}`,
    "telephone": data.phone,
    "email": data.email || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address,
      "addressLocality": data.city,
      "addressRegion": data.state,
      "addressCountry": data.country || "US"
    },
    "sameAs": [
      data.facebookUrl, data.instagramUrl, data.linkedinUrl, data.twitterUrl, data.yelpUrl, data.googleMapsUrl
    ].filter(Boolean),
    "areaServed": data.serviceAreas.map(area => ({ "@type": "City", "name": area })),
    "knowsAbout": data.services,
  };
  return JSON.stringify(schema, null, 2);
}

function generateServiceSchema(data: WDBusinessData, domain: string): string {
  const host = getSiteHost(data, domain);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": data.primaryKeyword || "Professional Services",
    "provider": {
      "@type": "LocalBusiness",
      "name": data.businessName,
      "telephone": data.phone,
      "url": `https://${host}`
    },
    "areaServed": data.serviceAreas.map(area => ({ "@type": "City", "name": area })),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${data.businessName} Services`,
      "itemListElement": data.services.map(service => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": service }
      }))
    }
  };
  return JSON.stringify(schema, null, 2);
}


function generateBlogPostingSchema(data: WDBusinessData, post: { title: string; slug: string; excerpt: string; content?: string; date?: string; featuredImage?: string; category?: string; keywords?: string }, domain: string): string {
  const publishDate = getSafeBlogDate(post.date);
  const featuredImage = data.customImages?.[`blog-img-${post.slug}`] || post.featuredImage;
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": publishDate,
    "dateModified": publishDate,
    "author": { "@type": "Organization", "name": data.businessName },
    "publisher": {
      "@type": "Organization",
      "name": data.businessName,
      "url": `https://${domain}`
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://${domain}/blog/${slugify(post.slug || post.title)}`
    },
    "articleSection": post.category || data.primaryKeyword || "Blog",
    "keywords": post.keywords || data.primaryKeyword || ""
  };
  if (featuredImage) schema["image"] = featuredImage;
  if (post.content) schema["wordCount"] = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return JSON.stringify(schema, null, 2);
}

function getSafeBlogDate(date?: string): string {
  if (!date) return new Date().toISOString();
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : date;
}

function formatBlogDate(date?: string): string {
  return new Date(getSafeBlogDate(date)).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ─── SHARED: CSS ───────────────────────────────────────────────────────────

function generateCSS(theme: WDTheme): string {
  const { primaryColor, secondaryColor, accentColor, fontFamily } = theme;
  const fontStack = FONT_STACKS[fontFamily];
  return `
/* ── Reset & Base ─────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; font-size: 16px; }

body {
  font-family: ${fontStack};
  color: #1e293b;
  line-height: 1.7;
  background: #f8fafc;
  background-image:
    radial-gradient(ellipse at 15% 20%, ${primaryColor}06 0%, transparent 55%),
    radial-gradient(ellipse at 85% 25%, ${secondaryColor}06 0%, transparent 55%),
    radial-gradient(ellipse at 50% 80%, ${primaryColor}04 0%, transparent 50%);
  background-attachment: fixed;
}

a { color: ${secondaryColor}; text-decoration: none; transition: color .2s; }
a:hover { text-decoration: underline; }

img { max-width: 100%; height: auto; display: block; }

h1, h2, h3, h4 {
  font-weight: 700;
  line-height: 1.3;
  color: ${primaryColor};
}

h1 { font-size: clamp(1.75rem, 4vw, 2.8rem); }
h2 { font-size: clamp(1.4rem, 3vw, 2rem); }
h3 { font-size: clamp(1.1rem, 2vw, 1.4rem); }

p { margin-bottom: 1rem; }
p:last-child { margin-bottom: 0; }

ul { list-style: none; }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

section { padding: 4.5rem 0; }
section:nth-child(even):not(.cta-section):not(.page-hero):not(.hero-section):not(.hero) { background: #ffffff; }

/* ── Animation Keyframes ──────────────────────── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInRight {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 15px ${primaryColor}30; }
  50% { box-shadow: 0 0 30px ${primaryColor}50, 0 0 60px ${primaryColor}15; }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ── Scroll Reveal ─────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(35px);
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.reveal-left {
  opacity: 0;
  transform: translateX(-40px);
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal-left.visible { opacity: 1; transform: translateX(0); }

.reveal-right {
  opacity: 0;
  transform: translateX(40px);
  transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal-right.visible { opacity: 1; transform: translateX(0); }

.reveal-scale {
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal-scale.visible { opacity: 1; transform: scale(1); }

/* Staggered children animation */
.stagger-children .reveal { transition-delay: calc(var(--i, 0) * 0.1s); }

/* ── Header ───────────────────────────────────── */
.site-header {
  background: rgba(${hexToRgb(primaryColor)}, 0.95);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 20px rgba(0,0,0,.12);
  transition: all 0.3s ease;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  gap: 1rem;
}

.brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.generic-logo {
  display: block;
  transition: transform 0.3s ease, filter 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
}

.brand-logo-link:hover .generic-logo {
  transform: scale(1.08);
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.25));
}

.footer-brand-icon {
  margin-bottom: 0.75rem;
}

.generic-logo-footer {
  display: block;
  opacity: 0.85;
  transition: opacity 0.3s;
}

.generic-logo-footer:hover { opacity: 1; }

.header-logo {
  height: 48px;
  width: auto;
  display: block;
  object-fit: contain;
}

.footer-logo {
  height: 42px;
  width: auto;
  display: block;
  object-fit: contain;
  opacity: 0.9;
}

.main-nav { display: flex; }

.nav-list {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-list a {
  color: rgba(255,255,255,0.88);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background .15s, color .15s;
  white-space: nowrap;
}

.nav-list a:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
  text-decoration: none;
}

.has-dropdown { position: relative; }

.dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  min-width: 220px;
  padding: 0.5rem;
  z-index: 200;
}

.has-dropdown:hover .dropdown { display: block; }

.dropdown li a {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1e293b;
  transition: background .15s, color .15s;
}
.dropdown li a:hover {
  background: ${primaryColor}11;
  color: ${primaryColor};
}

.btn-emergency {
  background: ${accentColor};
  color: #fff !important;
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background .15s;
  text-decoration: none !important;
}

.btn-emergency:hover { background: ${accentColor}dd; }

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
}

.mobile-menu-toggle span {
  display: block;
  width: 24px;
  height: 2px;
  background: #fff;
  border-radius: 2px;
}

/* ── Hero ──────────────────────────────────────── */
.hero {
  position: relative;
  background: linear-gradient(135deg, ${primaryColor} 0%, ${darkenHex(primaryColor, 0.35)} 50%, ${darkenHex(primaryColor, 0.5)} 100%);
  background-size: 200% 200%;
  animation: gradientShift 12s ease infinite;
  color: #fff;
  padding: 5.5rem 0 4.5rem;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('${theme.heroImageUrl || WD_PLACEHOLDER_IMAGES.hero}') center/cover no-repeat;
  opacity: 0.35;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(${hexToRgb(darkenHex(primaryColor,0.35))},0.72) 0%, rgba(${hexToRgb(darkenHex(primaryColor,0.3))},0.52) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 3rem;
  align-items: center;
}

.hero-badge {
  display: inline-block;
  background: ${accentColor};
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.35rem 0.9rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-transform: uppercase;
  animation: fadeInDown 0.6s ease-out;
}

.hero h1 {
  color: #fff;
  margin-bottom: 1rem;
  animation: fadeInUp 0.7s ease-out 0.1s both;
}

.hero-sub {
  font-size: 1.1rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
  max-width: 560px;
  animation: fadeInUp 0.7s ease-out 0.2s both;
}

.hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; animation: fadeInUp 0.7s ease-out 0.3s both; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${accentColor};
  color: #fff;
  padding: 0.9rem 1.75rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0,0,0,.15);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s;
}

.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,.2); text-decoration: none; }
.btn-primary:hover::before { opacity: 1; }
.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,.08);
  backdrop-filter: blur(8px);
  color: #fff;
  border: 2px solid rgba(255,255,255,.3);
  padding: 0.9rem 1.75rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

.btn-secondary:hover { border-color: #fff; background: rgba(255,255,255,.18); transform: translateY(-2px); text-decoration: none; }

.hero-trust {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-top: 1rem;
}

/* Hero CTA Card */
.hero-cta-card {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.1) inset;
  color: #1e293b;
  animation: fadeInRight 0.8s ease-out 0.3s both;
}

.hero-cta-card h3 {
  font-size: 1.1rem;
  margin-bottom: 1.25rem;
  text-align: center;
  color: ${primaryColor};
}

.hero-cta-phone {
  display: block;
  background: #dc2626;
  color: #fff;
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
  text-decoration: none;
  transition: background .15s;
}

.hero-cta-phone:hover { background: #b91c1c; text-decoration: none; }

.hero-cta-divider {
  text-align: center;
  color: #94a3b8;
  font-size: 0.8rem;
  margin: 0.75rem 0;
}

.hero-cta-form-btn {
  display: block;
  background: ${primaryColor};
  color: #fff;
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: background .15s;
}

.hero-cta-form-btn:hover { background: ${darkenHex(primaryColor, 0.7)}; text-decoration: none; }

/* ── Credential Bar (below hero) ────────────────── */
.credential-bar {
  background: #fff;
  border-bottom: 1px solid rgba(226,232,240,0.5);
  padding: 1rem 0;
  position: relative;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.credential-bar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.credential-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
.credential-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
  color: ${secondaryColor};
  flex-shrink: 0;
}
.credential-icon svg { width: 18px; height: 18px; }
@media (max-width: 768px) { .credential-bar-inner { gap: 1rem; } .credential-item { font-size: 0.78rem; } }
@media (max-width: 480px) { .credential-item span:not(.credential-icon) { display: none; } }

/* ── Services Grid ─────────────────────────────── */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.service-card {
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 14px;
  padding: 1.75rem;
  transition: all .35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7);
}

.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor});
  opacity: 0;
  transition: opacity .3s;
}

.service-card:hover {
  box-shadow: 0 12px 30px rgba(0,0,0,.1);
  transform: translateY(-4px);
  border-color: transparent;
}

.service-card:hover::before { opacity: 1; }

.service-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${primaryColor}12, ${secondaryColor}15);
  color: ${secondaryColor};
  margin-bottom: 1rem;
  transition: all .35s;
}

.service-card:hover .service-card-icon {
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: #fff;
  transform: scale(1.08);
  box-shadow: 0 6px 16px ${secondaryColor}30;
}

.service-card-icon svg { width: 28px; height: 28px; }

.service-card h3 {
  margin-bottom: 0.75rem;
  color: ${primaryColor};
}

.service-card p { color: #475569; font-size: 0.95rem; margin-bottom: 1rem; }

.service-card-link {
  color: ${secondaryColor};
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: gap .2s;
}

.service-card-link:hover { gap: 0.5rem; text-decoration: none; }

/* ── Intro Grid ────────────────────────────────── */
.intro-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  align-items: center;
}

/* ── Why Us ────────────────────────────────────── */
.why-us-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.why-us-item {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  padding: 1.75rem;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.4);
  transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7);
}

.why-us-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, ${secondaryColor}, ${primaryColor});
  opacity: 0;
  transition: opacity .3s;
}

.why-us-item:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,.08);
  transform: translateY(-3px);
  border-color: ${secondaryColor}30;
}

.why-us-item:hover::after { opacity: 1; }

.why-us-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, ${primaryColor}, ${darkenHex(primaryColor, 0.7)});
  color: #fff;
  box-shadow: 0 4px 12px ${primaryColor}30;
  transition: all .35s;
}

.why-us-item:hover .why-us-icon {
  background: linear-gradient(135deg, ${secondaryColor}, ${primaryColor});
  transform: scale(1.08) rotate(-3deg);
  box-shadow: 0 6px 18px ${secondaryColor}35;
}

.why-us-icon svg { width: 26px; height: 26px; }

.why-us-item h3 { margin-bottom: 0.35rem; font-size: 1rem; }
.why-us-item p { color: #475569; font-size: 0.9rem; margin: 0; }

/* ── Process Steps ─────────────────────────────── */
.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  counter-reset: step-counter;
  position: relative;
}

.process-steps::before {
  content: '';
  position: absolute;
  top: 28px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, ${secondaryColor}20, ${secondaryColor}60, ${secondaryColor}20);
  border-radius: 2px;
}

.process-step {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 14px;
  padding: 2.5rem 1.5rem 1.5rem;
  position: relative;
  counter-increment: step-counter;
  transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7);
}

.process-step:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,.08);
  transform: translateY(-4px);
}

.process-step::before {
  content: counter(step-counter);
  position: absolute;
  top: -18px;
  left: 1.5rem;
  background: linear-gradient(135deg, ${secondaryColor}, ${primaryColor});
  color: #fff;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
  box-shadow: 0 4px 14px ${secondaryColor}40;
  border: 3px solid #fff;
}

.process-step::after {
  content: '';
  position: absolute;
  top: -2px;
  left: calc(1.5rem + 18px);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid ${secondaryColor}40;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity .3s;
}

.process-step:hover::after { opacity: 1; }

@media (max-width: 768px) { .process-steps::before { display: none; } }

.process-step h3 { margin-top: 0.5rem; margin-bottom: 0.5rem; font-size: 1rem; }
.process-step p { color: #475569; font-size: 0.9rem; margin: 0; }

/* ── Locations ─────────────────────────────────── */
.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.location-link {
  display: block;
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(8px) saturate(130%);
  -webkit-backdrop-filter: blur(8px) saturate(130%);
  border: 1px solid rgba(255,255,255,0.4);
  padding: 0.85rem 1rem;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${primaryColor};
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
}

.location-link:hover {
  background: ${primaryColor};
  color: #fff;
  border-color: ${primaryColor};
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px ${primaryColor}30;
}

/* ── FAQ ───────────────────────────────────────── */
.faq-list { max-width: 800px; margin: 2rem auto 0; }

.faq-item {
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 0.75rem;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  overflow: hidden;
  transition: all .25s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6);
}

.faq-item.open { border-color: ${secondaryColor}30; box-shadow: 0 4px 12px rgba(0,0,0,.04); }

.faq-question {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: ${primaryColor};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  transition: color .2s;
}

.faq-question:hover { color: ${secondaryColor}; }

.faq-question::after {
  content: '+';
  font-size: 1.5rem;
  font-weight: 400;
  flex-shrink: 0;
  transition: transform .3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${primaryColor}08;
}

.faq-item.open .faq-question::after { transform: rotate(45deg); background: ${secondaryColor}15; color: ${secondaryColor}; }

.faq-answer {
  display: none;
  padding: 0 1.5rem 1.25rem;
  color: #475569;
  line-height: 1.7;
}

.faq-item.open .faq-answer { display: block; animation: fadeInUp 0.3s ease-out; }

/* ── CTA Section ───────────────────────────────── */
.cta-section {
  background: linear-gradient(135deg, ${primaryColor} 0%, ${darkenHex(primaryColor, 0.4)} 50%, ${darkenHex(primaryColor, 0.55)} 100%);
  background-size: 200% 200%;
  animation: gradientShift 10s ease infinite;
  color: #fff;
  text-align: center;
  padding: 3.5rem 0;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none;
}

.cta-section h2 { color: #fff; margin-bottom: 1rem; }
.cta-section p { color: #cbd5e1; max-width: 600px; margin: 0 auto 2rem; }

.cta-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* ── Testimonials ──────────────────────────────── */
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.testimonial-card {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px) saturate(140%);
  -webkit-backdrop-filter: blur(12px) saturate(140%);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255,255,255,0.4);
  position: relative;
  transition: all .35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7);
}

.testimonial-card::before {
  content: '\\201C';
  position: absolute;
  top: 0.75rem;
  right: 1.25rem;
  font-size: 5rem;
  line-height: 1;
  color: ${secondaryColor}12;
  font-family: Georgia, serif;
  pointer-events: none;
}

.testimonial-card:hover {
  box-shadow: 0 12px 36px rgba(0,0,0,.08);
  transform: translateY(-4px);
  border-color: ${secondaryColor}30;
}

.testimonial-stars {
  color: #f59e0b;
  font-size: 1.1rem;
  letter-spacing: 2px;
  margin-bottom: 0.75rem;
}

.testimonial-text {
  color: #374151;
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid rgba(226,232,240,0.6);
  padding-top: 1rem;
}

.testimonial-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.testimonial-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

.testimonial-location {
  font-size: 0.82rem;
  color: #64748b;
}

/* ── Breadcrumb ────────────────────────────────── */
.breadcrumb {
  padding: 0.75rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.breadcrumb a { color: ${secondaryColor}; }
.breadcrumb span { margin: 0 0.5rem; }

/* ── Content Page Hero ─────────────────────────── */
.page-hero {
  background: linear-gradient(135deg, ${primaryColor} 0%, ${darkenHex(primaryColor, 0.4)} 50%, ${darkenHex(primaryColor, 0.55)} 100%);
  background-size: 200% 200%;
  animation: gradientShift 12s ease infinite;
  color: #fff;
  padding: 4rem 0 3.5rem;
  position: relative;
  overflow: hidden;
}

.page-hero::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%);
  pointer-events: none;
}

.page-hero h1 { color: #fff; margin-bottom: 0.75rem; animation: fadeInUp 0.6s ease-out; }
.page-hero p { color: #cbd5e1; font-size: 1.05rem; max-width: 680px; animation: fadeInUp 0.6s ease-out 0.1s both; }

.trust-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.trust-badge {
  background: rgba(255,255,255,.1);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(255,255,255,.18);
  transition: background .2s;
}

.trust-badge:hover { background: rgba(255,255,255,.18); }

/* ── Overview / Content Sections ──────────────── */
.content-section { padding: 4.5rem 0; }
.content-section h2 { margin-bottom: 1.5rem; }
.content-section p { color: #475569; }

/* ── Benefits Grid ─────────────────────────────── */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.benefit-item {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
  border-left: 4px solid ${secondaryColor};
  padding: 1.25rem 1.5rem;
  border-radius: 0 12px 12px 0;
  transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.6);
}

.benefit-item:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
  transform: translateX(4px);
}

.benefit-item h3 { font-size: 1rem; margin-bottom: 0.4rem; }
.benefit-item p { color: #475569; font-size: 0.9rem; margin: 0; }

/* ── Warning Signs ─────────────────────────────── */
.warnings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.warning-item {
  background: rgba(255,249,249,0.65);
  backdrop-filter: blur(10px) saturate(130%);
  -webkit-backdrop-filter: blur(10px) saturate(130%);
  border: 1px solid rgba(254,202,202,0.5);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all .25s;
  box-shadow: 0 2px 12px rgba(220,38,38,0.03), inset 0 1px 0 rgba(255,255,255,0.5);
}

.warning-item:hover { box-shadow: 0 4px 12px rgba(220,38,38,.08); transform: translateY(-2px); }

.warning-item h3 {
  font-size: 1rem;
  color: #dc2626;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.25rem;
  border-left: 3px solid #dc2626;
  padding-left: 0.75rem;
}
.warning-item p { color: #475569; font-size: 0.9rem; margin: 0; }

/* ── Related Services ──────────────────────────── */
.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.related-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
}

.related-card h3 { font-size: 1rem; margin-bottom: 0.4rem; }
.related-card p { color: #475569; font-size: 0.875rem; margin-bottom: 0.75rem; }

/* ── Contact Form Area ─────────────────────────── */
.contact-section { padding: 4rem 0; }
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

.contact-info h3 { margin-bottom: 1rem; }
.contact-info p { color: #475569; }

.contact-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.contact-icon { font-size: 1.25rem; flex-shrink: 0; }

/* ── Image with Alt Placeholder ────────────────── */
.placeholder-img {
  width: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.img-caption {
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
  margin-top: 0.4rem;
  font-style: italic;
}

/* ── Footer ────────────────────────────────────── */
.site-footer {
  background: ${darkenHex(primaryColor, 0.15)};
  color: #cbd5e1;
  padding: 4.5rem 0 2rem;
  position: relative;
}

.site-footer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 100%);
  pointer-events: none;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr; /* Fallback for legacy customFiles */
  gap: 2.5rem;
  position: relative;
}

.footer-inner.has-four-cols {
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
}

.footer-inner.has-two-cols {
  grid-template-columns: 1fr 1fr;
}

.footer-biz-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.75rem;
}

.footer-brand p {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.footer-links h3, .footer-contact h3 {
  color: #fff;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.footer-links h3::after, .footer-contact h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30px;
  height: 2px;
  background: ${secondaryColor};
  border-radius: 1px;
}

.footer-links li { margin-bottom: 0.4rem; }
.footer-links a { color: #94a3b8; font-size: 0.9rem; transition: color .2s, padding-left .2s; }
.footer-links a:hover { color: #fff; text-decoration: none; padding-left: 4px; }

.footer-contact-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.footer-contact-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  color: ${primaryColor};
  flex-shrink: 0;
}

.footer-contact-icon svg { width: 18px; height: 18px; }

.footer-contact-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-contact-value {
  color: #e2e8f0;
  font-size: 0.95rem;
}

.footer-contact-value a { color: #e2e8f0; text-decoration: none; }
.footer-contact-value a:hover { color: #fff; }

.footer-phone {
  display: block;
  color: #fbbf24;
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  white-space: nowrap;
}

.footer-social {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.footer-social a {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  color: #94a3b8;
  transition: all .25s;
  text-decoration: none;
}

.footer-social a:hover {
  background: ${secondaryColor};
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px ${secondaryColor}30;
}

.footer-social svg { width: 18px; height: 18px; }

.footer-bottom {
  max-width: 1200px;
  margin: 2.5rem auto 0;
  padding: 1.5rem 1.5rem 0;
  border-top: 1px solid rgba(255,255,255,.1);
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #94a3b8;
  flex-wrap: wrap;
  gap: 0.5rem;
  position: relative;
}

/* ── Utility ───────────────────────────────────── */
.section-intro {
  max-width: 700px;
  color: #475569;
  margin-bottom: 0.5rem;
}

.section-header { margin-bottom: 0.25rem; }

.text-center { text-align: center; }

/* ── Responsive ────────────────────────────────── */
@media (max-width: 1024px) {
  .hero-inner { grid-template-columns: 1fr; }
  .hero-cta-card { max-width: 500px; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .contact-grid { grid-template-columns: 1fr; }
  .intro-grid { grid-template-columns: 1fr; gap: 2rem; }
}

@media (max-width: 768px) {
  .main-nav { display: none; }
  .main-nav.open { display: block; position: absolute; top: 72px; left: 0; right: 0; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 1rem; z-index: 999; }
  .main-nav.open .nav-list { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .main-nav.open .nav-list a { color: #1e293b !important; display: block; width: 100%; padding: 0.75rem 1rem; }
  .main-nav.open .nav-list a:hover { background: #f1f5f9; color: #0f172a !important; }
  .main-nav.open .has-dropdown { flex-direction: column; align-items: flex-start; }
  .main-nav.open .dropdown { position: static; box-shadow: none; border: none; padding: 0.5rem 0 0.5rem 1.5rem; background: transparent; width: 100%; }
  .main-nav.open .dropdown li a { color: #475569 !important; }
  .mobile-menu-toggle { display: flex; }
  .hero { padding: 3rem 0 2.5rem; }
  section { padding: 3rem 0; }
  .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
  .footer-bottom { flex-direction: column; }
}

@media (max-width: 480px) {
  h1 { font-size: 1.6rem; }
  h2 { font-size: 1.3rem; }
  .hero-actions { flex-direction: column; }
  .cta-actions { flex-direction: column; align-items: center; }
}

/* ── Social Links ──────────────────────────────── */
.social-links { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.75rem; }
.social-link {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.35rem 0.75rem; border-radius: 20px;
  background: rgba(255,255,255,0.08); color: #94a3b8;
  font-size: 0.8rem; text-decoration: none; transition: all .25s;
}
.social-link:hover { background: rgba(255,255,255,0.15); color: #fff; text-decoration: none; transform: translateY(-1px); }

/* ── Inline SVG Icon Helpers ───────────────────── */
.btn-icon { display: inline-flex; align-items: center; }
.btn-icon svg { width: 18px; height: 18px; }
.cta-icon { display: inline-flex; align-items: center; vertical-align: middle; margin-right: 0.25rem; }
.cta-icon svg { width: 22px; height: 22px; }
.contact-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; background: ${primaryColor}10; color: ${secondaryColor}; flex-shrink: 0; }
.contact-icon svg { width: 20px; height: 20px; }
.img-caption { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 0.6rem; font-style: italic; justify-content: center; }
.img-caption svg { width: 16px; height: 16px; flex-shrink: 0; }

/* ── Floating CTA Button ───────────────────────── */
.floating-cta {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 1.4rem; border-radius: 50px;
  font-weight: 700; font-size: 1rem; color: #fff;
  text-decoration: none; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.35);
  animation: ctaPulse 2.5s ease-in-out infinite;
}
.floating-cta--call { background: ${accentColor}; }
.floating-cta--whatsapp { background: #25D366; }
@keyframes ctaPulse {
  0%,100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,0,0,0.35); }
  50%      { transform: scale(1.04); box-shadow: 0 6px 28px rgba(0,0,0,0.45); }
}
@media (max-width: 480px) { .floating-cta { bottom: 1rem; right: 1rem; font-size: 0.9rem; padding: 0.75rem 1.1rem; } }`;
}

// ─── Social Links HTML ──────────────────────────────────────────────────────
function generateSocialLinks(data: WDBusinessData): string {
  const links: Array<{ url: string; label: string; icon: string }> = [];
  if (data.facebookUrl)  links.push({ url: data.facebookUrl,  label: 'Facebook',  icon: '<i class="fab fa-facebook-f"></i>' });
  if (data.instagramUrl) links.push({ url: data.instagramUrl, label: 'Instagram', icon: '<i class="fab fa-instagram"></i>' });
  if (data.googleUrl)    links.push({ url: data.googleUrl,    label: 'Google',    icon: '<i class="fab fa-google"></i>' });
  if (data.yelpUrl)      links.push({ url: data.yelpUrl,      label: 'Yelp',      icon: '<i class="fab fa-yelp"></i>' });
  if (data.twitterUrl)   links.push({ url: data.twitterUrl,   label: 'X',         icon: '<i class="fab fa-x-twitter"></i>' });
  if (links.length === 0) return '';
  return `<div class="social-links">${links.map(l =>
    `<a href="${l.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${l.label}">${l.icon} ${l.label}</a>`
  ).join('')}</div>`;
}

// ─── Floating CTA HTML ──────────────────────────────────────────────────────
function generateFloatingCTA(data: WDBusinessData): string {
  const cta = data.floatingCTA ?? 'call';
  if (cta === 'none') return '';
  if (cta === 'whatsapp') {
    const num = (data.whatsappNumber || data.phone).replace(/\D/g, '');
    const msg = encodeURIComponent(data._whatsappMessage || `Hi, I need help!`);
    return `<a href="https://wa.me/${num}?text=${msg}" class="floating-cta floating-cta--whatsapp" aria-label="WhatsApp us">WhatsApp Us</a>`;
  }
  // default: call
  const tel = data.phone.replace(/\D/g, '');
  return `<a href="tel:${data.countryCode || '+1'}${tel}" class="floating-cta floating-cta--call" aria-label="Call us now">Call Now</a>`;
}

// ─── SHARED: JS ────────────────────────────────────────────────────────────

function generateJS(): string {
  return `
// Mobile menu toggle
const toggleBtn = document.querySelector('.mobile-menu-toggle');
const nav = document.querySelector('.main-nav');
if (toggleBtn && nav) {
  toggleBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
  });
}

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    // Toggle clicked
    if (!isOpen) item.classList.add('open');
  });
});

// Scroll Reveal Animation (IntersectionObserver)
(function() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!elements.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach((el, i) => {
    el.style.transitionDelay = (i % 6) * 0.08 + 's';
    observer.observe(el);
  });
  // Backup timeout to show elements in nested editor iframes where intersection observer might fail
  setTimeout(() => {
    elements.forEach(el => {
      if (!el.classList.contains('visible')) {
        el.classList.add('visible');
      }
    });
  }, 800);
})();

// Sticky header scroll effect
const header = document.querySelector('.site-header');
if (header) {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 80) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,.15)';
    } else {
      header.style.boxShadow = '0 1px 20px rgba(0,0,0,.12)';
    }
    lastScroll = y;
  }, { passive: true });
}

// Parallax subtle effect for hero
const hero = document.querySelector('.hero, .page-hero');
if (hero) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) {
      hero.style.backgroundPositionY = y * 0.3 + 'px';
    }
  }, { passive: true });
}
`;
}

// ─── SHARED: HTML Shell ────────────────────────────────────────────────────

function htmlShell(params: {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  theme: WDTheme;
  schemaBlocks: string[];
  bodyContent: string;
  extraJs?: string;
  extraCSS?: string;
  ogImage?: string;
  businessName?: string;
  googleVerification?: string;
  googleAnalyticsId?: string;
  faviconUrl?: string;
  customHeadCode?: string;
}): string {
  const title = seoTitle(params.metaTitle);
  const description = seoDescription(params.metaDescription);

  const schemas = params.schemaBlocks
    .map(s => `<script type="application/ld+json">\n${s}\n</script>`)
    .join('\n  ');

  const fontUrl = FONT_URLS[params.theme.fontFamily];
  const fontLink = fontUrl
    ? `\n  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  // OG image: prefer explicit, fall back to favicon/logo, then omit
  const ogImg = params.ogImage || params.faviconUrl || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${params.canonicalUrl}">
  ${params.faviconUrl ? `<link rel="icon" type="image/png" href="${params.faviconUrl}">
  <link rel="shortcut icon" href="${params.faviconUrl}">` : ''}${fontLink}

  <!-- SEO -->
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  ${params.googleVerification ? `<meta name="google-site-verification" content="${params.googleVerification}">` : ''}
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${params.canonicalUrl}">
  <meta property="og:locale" content="en_US">
  ${params.businessName ? `<meta property="og:site_name" content="${params.businessName}">` : ''}
  ${ogImg ? `<meta property="og:image" content="${ogImg}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">` : ''}
  <meta name="twitter:card" content="${ogImg ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  ${ogImg ? `<meta name="twitter:image" content="${ogImg}">` : ''}

  <!-- Schema.org -->
  ${schemas}

  ${params.googleAnalyticsId ? `<!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${params.googleAnalyticsId}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${params.googleAnalyticsId}');</script>` : ''}

  ${params.customHeadCode ? `<!-- Custom Head Code -->\n  ${params.customHeadCode.trim()}` : ''}

  <style>
    ${generateCSS(params.theme)}
    ${params.extraCSS || ''}
  </style>
</head>
<body>
  ${params.bodyContent}

  <script>
    ${generateJS()}
    ${params.extraJs || ''}
  </script>
</body>
</html>`;
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(/\s+/)
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .filter(Boolean)
    .join(' ');
}

function sanitizeBusinessData(data: WDBusinessData): WDBusinessData {
  if (!data) return data;
  const clean = { ...data };

  if (clean.primaryKeyword) {
    clean.primaryKeyword = toTitleCase(clean.primaryKeyword);
  }

  if (typeof clean.services === 'string') {
    clean.services = (clean.services as string)
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(clean.services)) {
    clean.services = clean.services.map(s => toTitleCase(s));
  } else {
    clean.services = [];
  }

  if (clean.city) {
    clean.city = clean.city.trim().replace(/,+/g, ',').trim();
    while (clean.city.endsWith(',')) {
      clean.city = clean.city.slice(0, -1).trim();
    }
    if (clean.state) {
      const stateClean = clean.state.trim();
      const stateRegex = new RegExp(`,\\s*${stateClean}\\s*$`, 'i');
      if (stateRegex.test(clean.city)) {
        clean.city = clean.city.replace(stateRegex, '').trim();
      }
    }
  }

  if (clean.state) {
    clean.state = clean.state.trim().replace(/,+/g, ',').trim();
    while (clean.state.startsWith(',')) {
      clean.state = clean.state.slice(1).trim();
    }
    while (clean.state.endsWith(',')) {
      clean.state = clean.state.slice(0, -1).trim();
    }
  }

  if (typeof clean.serviceAreas === 'string') {
    clean.serviceAreas = (clean.serviceAreas as string)
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(clean.serviceAreas)) {
    clean.serviceAreas = clean.serviceAreas.map(loc => {
      let l = loc.trim().replace(/,+/g, ',').trim();
      while (l.endsWith(',')) l = l.slice(0, -1).trim();
      if (clean.state) {
        const stateClean = clean.state.trim();
        const stateRegex = new RegExp(`,\\s*${stateClean}\\s*$`, 'i');
        if (stateRegex.test(l)) {
          l = l.replace(stateRegex, '').trim();
        }
      }
      return l;
    });
  } else {
    clean.serviceAreas = [];
  }

  return clean;
}

// ─── HOMEPAGE ──────────────────────────────────────────────────────────────

export function generateHomepage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const content = data.homepageContent;
  const prefix = '';
  const { primaryColor, secondaryColor, accentColor } = resolveTheme(data);

  // Fallback content if AI content not yet generated
  const h1 = content?.hero?.h1 || `${data.primaryKeyword} in ${data.city}, ${data.state}`;
  const heroSub = content?.hero?.subheadline || data._heroSubheading || `Professional ${data.primaryKeyword.toLowerCase()} services in ${data.city} and surrounding areas. Available 24/7 for emergency dispatch.`;
  const introH2 = content?.intro?.h2 || data._introH2 || `About ${data.businessName}`;
  const introParas = content?.intro?.paragraphs || data._introParas || [`Professional ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state} and surrounding areas. We provide fast response, licensed technicians, and upfront pricing.`];

  const servH2 = content?.servicesSection?.h2 || data._servicesH2 || `Our Professional Services`;
  const servIntro = content?.servicesSection?.intro || data._servicesIntro || `We offer a complete range of ${data.primaryKeyword.toLowerCase()} and cleanup services to homeowners and businesses throughout ${data.city}, ${data.state}.`;
  const serviceCards = content?.servicesSection?.cards?.length
    ? content.servicesSection.cards
    : (data.services?.length ? data.services : ['Water Damage Restoration', 'Mold Remediation', 'Fire Damage Restoration']).map(s => {
        const aiServiceDesc = (data as any)._aiServiceDescs?.[s] || data.serviceContent?.[s]?.overviewSection?.body?.[0];
        const description = aiServiceDesc || `${s} services in ${data.city}, ${data.state} by the professionals at ${data.businessName}. We deliver reliable, high-quality solutions to meet your needs.`;
        return {
          service: s,
          icon: s.toLowerCase().includes('mold') ? 'alert' : (s.toLowerCase().includes('fire') ? 'zap' : 'tool'),
          h3: s,
          description: description,
          internalLink: { anchor: s, slug: `services/${slugify(s)}-${slugify(data.city)}.html` },
        };
      });

  const whyH2 = content?.whyUsSection?.h2 || `Why Choose ${data.businessName}`;
  const defaultWhyPoints = data._whyUsPoints || [
    { icon: 'alert', heading: '24/7 Emergency Service', body: `We are available around the clock to respond to ${data.primaryKeyword.toLowerCase()} emergencies in ${data.city}.` },
    { icon: 'certified', heading: 'Licensed & Certified', body: 'All work is performed by trained and certified restoration professionals.' },
    { icon: 'home', heading: 'Locally Owned & Operated', body: `Proudly serving the ${data.city} community with honest, reliable service.` },
    { icon: 'zap', heading: 'Fast Response Times', body: 'Our crews arrive quickly to extract water and begin drying before mold can form.' }
  ];  // AI-generated why-choose-us overrides category defaults
  const aiWhyUs = (data as any)._aiWhyChooseUs;
  const whyPoints = content?.whyUsSection?.points || (Array.isArray(aiWhyUs) && aiWhyUs.length > 0
    ? aiWhyUs.map((pt: any, i: number) => ({
        icon: ['alert','certified','home','zap','search','clipboard'][i] || 'check',
        heading: pt.heading,
        body: pt.body,
      }))
    : defaultWhyPoints);

  const processH2 = content?.processSection?.h2 || data._processH2 || `Our Working Process`;
  const processSteps = content?.processSection?.steps || data._processSteps || [
    { step: 1, heading: 'Emergency Contact', body: `Call ${data.phone} for immediate assistance. Our dispatcher confirms your details and dispatches a crew.` },
    { step: 2, heading: 'On-Site Inspection', body: `We assess the damage, determine the class and category of water loss, and create a custom plan.` },
    { step: 3, heading: 'Water Extraction', body: 'We use industrial pumps and extractors to remove standing water quickly, preventing further damage.' },
    { step: 4, heading: 'Structural Drying', body: 'We position high-velocity air movers and low-grain dehumidifiers to dry wet walls, ceilings, and floors.' },
    { step: 5, heading: 'Monitoring', body: 'We monitor moisture levels daily to verify that target dry standards are met.' },
    { step: 6, heading: 'Sanitization & Cleanup', body: 'We clean and sanitize all affected areas with EPA-registered antimicrobials to prevent mold.' },
    { step: 7, heading: 'Reconstruction', body: 'We repair or rebuild damaged walls, flooring, and ceilings to restore your property to pre-loss condition.' },
  ];

  const locH2 = content?.locationsSection?.h2 || `Areas We Serve`;
  const locBody = content?.locationsSection?.body || data._locationsBody || `We proudly serve homeowners and businesses throughout ${data.city}, ${data.state} and the surrounding communities.`;

  const locationLinks = content?.locationsSection?.locationLinks?.length
    ? content.locationsSection.locationLinks
    : (data.serviceAreas?.length ? data.serviceAreas : [data.city]).map(l => ({ city: l, anchor: l, slug: `locations/${slugify(l)}.html` }));

  const faqH2 = content?.faqSection?.h2 || data._faqH2 || `Frequently Asked Questions`;
  const isRestoration = data._categoryId === 'water-damage' || data._categoryId === 'mold-remediation' || data._categoryId === 'fire-damage';
  const defaultFaqs = isRestoration
    ? [
        { question: `How fast can you respond in ${data.city}?`, answer: `We are available 24/7 and typically arrive on-site within 60 minutes for water damage emergencies.` },
        { question: `Does insurance cover water damage restoration?`, answer: 'Most standard homeowners policies cover sudden and accidental water damage. We work directly with your insurer.' },
        { question: `How long does the structural drying process take?`, answer: 'Most drying projects take between 3 and 5 days, depending on the materials and extent of saturation.' },
        { question: `What should I do before the restoration crew arrives?`, answer: 'If safe, shut off the main water valve, turn off electricity to wet areas, and move valuable items out of the water.' },
        { question: `Are your technicians certified?`, answer: 'Yes, our restoration technicians are IICRC-certified and fully trained in modern drying protocols.' }
      ]
    : [
        { question: `How can I schedule a service?`, answer: `You can call us directly at ${data.phone} or send us a message through our contact form. We will schedule a convenient time for your service.` },
        { question: `Do you provide free estimates?`, answer: `Yes, we offer free on-site assessments and written estimates with no obligation.` },
        { question: `Are you licensed and insured?`, answer: `Yes, we are fully licensed and insured to perform professional ${data.primaryKeyword.toLowerCase()} services in your area.` }
      ];
  const faqs = content?.faqSection?.faqs || data._faqs || defaultFaqs;
  const ctaH2 = content?.finalCTA?.h2 || data._ctaHeadline || `Ready to Get Started?`;
  const ctaBody = content?.finalCTA?.body || data._ctaSubtext || `Contact ${data.businessName} today for professional, certified services. Available 24/7 for emergencies.`;
  const ctaBtn = content?.finalCTA?.ctaButton || data._ctaButton || `Call Now: ${data.phone}`;

  const seoH2 = content?.seoFootnote?.h2 || `Your Trusted Partner for ${data.primaryKeyword} in ${data.city}, ${data.state}`;
  const seoBody = content?.seoFootnote?.body || data._seoBody || `We provide high-quality ${data.primaryKeyword.toLowerCase()} and structural drying services to protect your property. Contact us today.`;

  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';

  const servicesCardsHTML = serviceCards.map(card => {
    const cardLink = showServicesLocations
      ? `${prefix}${card.internalLink.slug}`
      : `${prefix}contact.html`;
    const anchorText = showServicesLocations ? card.internalLink.anchor : 'Learn More';
    return `
      <article class="service-card" data-placeholder-section="service-${slugify(card.service)}">
        <div class="service-card-icon" aria-hidden="true">${iconToSVG(card.icon || 'tool', secondaryColor)}</div>
        <h3>${card.h3}</h3>
        <p>${card.description}</p>
        <a href="${cardLink}" class="service-card-link">${anchorText} →</a>
      </article>`;
  }).join('');

  const whyPointsHTML = whyPoints.map(pt => `
      <div class="why-us-item">
        <span class="why-us-icon" aria-hidden="true">${iconToSVG(pt.icon, '#fff')}</span>
        <div>
          <h3>${pt.heading}</h3>
          <p>${pt.body}</p>
        </div>
      </div>`).join('');

  const processStepsHTML = processSteps.map(step => `
      <div class="process-step">
        <h3>${step.heading}</h3>
        <p>${step.body}</p>
      </div>`).join('');

  const locationLinksHTML = locationLinks.map(loc => `
      <a href="${prefix}${loc.slug}" class="location-link">${loc.anchor}</a>`).join('');

  const faqsHTML = faqs.map(faq => `
      <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
        <button class="faq-question" itemprop="name">${faq.question}</button>
        <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
          <span itemprop="text">${faq.answer}</span>
        </div>
      </div>`).join('');

  const recentProjects = getCategoryProjects(data);
  const recentProjectsHTML = recentProjects.map((project, idx) => {
    const imgSrc = data.customImages?.[`gallery-normal-${idx}`] || project.defaultImg;
    return `
        <div style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02); border: 1px solid #f1f5f9;">
          <img
            src="${imgSrc}"
            alt="${project.alt}"
            style="width: 100%; height: 220px; object-fit: cover;"
            data-placeholder="gallery-normal-${idx}"
            loading="lazy"
            width="400"
            height="220"
          >
          <div style="padding: 1.25rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: ${primaryColor};">${project.title}</h3>
            <p style="font-size: 0.9rem; color: #475569; margin: 0; line-height: 1.5;">${project.desc}</p>
          </div>
        </div>`;
  }).join('\n');

  const introParagraphsHTML = introParas.map(p => `<p>${p}</p>`).join('');

  const contactSection = data.contactFormEmbed
    ? `<section class="contact-section reveal" id="contact">
        <div class="container">
          <h2>Contact ${data.businessName}</h2>
          <div class="contact-grid">
            <div class="contact-info">
              <h3>Get in Touch</h3>
              <p>For emergencies, call us immediately. For non-urgent inquiries, fill out the form and we'll respond promptly.</p>
              <div class="contact-item">
                <span class="contact-icon">${iconToSVG('phone', secondaryColor)}</span>
                <div>
                  <strong>Phone (24/7)</strong><br>
                  <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}">${data.phone}</a>
                </div>
              </div>
              <div class="contact-item">
                <span class="contact-icon">${iconToSVG('map-pin', secondaryColor)}</span>
                <div>
                  <strong>Address</strong><br>
                  ${formatDisplayAddress(data.address, data.city, data.state)}
                </div>
              </div>
              ${data.email ? `<div class="contact-item"><span class="contact-icon">${iconToSVG('file', secondaryColor)}</span><div><strong>Email</strong><br><a href="mailto:${data.email}">${data.email}</a></div></div>` : ''}
            </div>
            <div class="contact-form-embed">
              ${data.contactFormEmbed}
            </div>
          </div>
        </div>
      </section>`
    : '';

  const body = `
  ${generateNav(data)}

  <!-- ── Hero ─────────────────────────────────────────── -->
  <section class="hero" role="banner">
    <div class="hero-inner">
      <div class="hero-content">
        ${data._emergencyBadge || data._categoryId ? `<span class="hero-badge">${data._emergencyBadge || '24/7 Emergency Response'}</span>` : '<span class="hero-badge">24/7 Emergency Response</span>'}
        <h1>${capitalizeHeading(h1)}</h1>
        <p class="hero-sub">${heroSub}</p>
        <div class="hero-actions">
          <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
          <a href="#contact" class="btn-secondary">Get Free Estimate</a>
        </div>
        <p class="hero-trust">${(data._trustBadges || ['Licensed', 'Insured', 'Certified']).join(' • ')}</p>
      </div>
      <div class="hero-cta-card" aria-label="Emergency contact">
        <h3><span class="cta-icon">${iconToSVG('alert', accentColor)}</span> ${data._ctaHeadline || `${data.primaryKeyword} Emergency?`}</h3>
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="hero-cta-phone">${data.phone}</a>
        <p class="hero-cta-divider">or</p>
        <a href="#contact" class="hero-cta-form-btn">Request a Callback</a>
      </div>
    </div>
  </section>

  <!-- ── Credential Bar ───────────────────────────────── -->
  <div class="credential-bar" role="complementary" aria-label="Credentials">
    <div class="credential-bar-inner">
      <div class="credential-item">
        <span class="credential-icon">${iconToSVG('shield', secondaryColor)}</span>
        <span>Licensed &amp; Insured</span>
      </div>
      <div class="credential-item">
        <span class="credential-icon">${iconToSVG('star', secondaryColor)}</span>
        <span>5-Star Rated</span>
      </div>
      <div class="credential-item">
        <span class="credential-icon">${iconToSVG('clock', secondaryColor)}</span>
        <span>${data._emergencyBadge || '24/7 Available'}</span>
      </div>
      <div class="credential-item">
        <span class="credential-icon">${iconToSVG('check', secondaryColor)}</span>
        <span>Certified Experts</span>
      </div>
      <div class="credential-item">
        <span class="credential-icon">${iconToSVG('award', secondaryColor)}</span>
        <span>Satisfaction Guaranteed</span>
      </div>
    </div>
  </div>

  <!-- ── Intro ─────────────────────────────────────────── -->
  <section id="about" aria-labelledby="intro-heading" class="reveal">
    <div class="container intro-grid">
      <div>
        <h2 id="intro-heading">${introH2}</h2>
        ${introParagraphsHTML}
      </div>
      <div>
        <img
          src="${data.customImages?.['about-image'] || (data as any)._categoryImages?.['about-image'] || WD_PLACEHOLDER_IMAGES.team}"
          alt="${data.primaryKeyword || 'Services'} - ${data.businessName || 'Our Team'} - ${data.city || 'Your Area'}"
          class="placeholder-img"
          data-placeholder="about-image"
          style="border-radius: 12px; object-fit: cover; max-height: 380px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.04);"
          loading="lazy"
          width="600"
          height="380"
        >
        <p class="img-caption" style="margin-top: 0.5rem; text-align: center;">${iconToSVG('camera', '#94a3b8')} Replace this placeholder with a photo of your team or office</p>
      </div>
    </div>
  </section>

  <!-- ── Services ──────────────────────────────────────── -->
  <section id="services" aria-labelledby="services-heading" class="reveal">
    <div class="container">
      <h2 id="services-heading">${servH2}</h2>
      <p class="section-intro">${servIntro}</p>
      <div class="services-grid stagger-children">
        ${servicesCardsHTML}
      </div>
    </div>
  </section>

  <!-- ── Why Us ─────────────────────────────────────────── -->
  <section aria-labelledby="why-heading" class="reveal">
    <div class="container">
      <h2 id="why-heading">${whyH2}</h2>
      <div class="why-us-grid stagger-children">
        ${whyPointsHTML}
      </div>
    </div>
  </section>

  <!-- ── Process ───────────────────────────────────────── -->
  <section aria-labelledby="process-heading" class="reveal">
    <div class="container">
      <h2 id="process-heading">${processH2}</h2>
      <p class="section-intro">Here's exactly what happens when you call ${data.businessName} for ${data.primaryKeyword.toLowerCase()} in ${data.city}.</p>
      <div class="process-steps stagger-children">
        ${processStepsHTML}
      </div>
    </div>
  </section>

  <!-- ── Our Recent Projects Gallery Teaser ────────────── -->
  <section aria-labelledby="gallery-teaser-heading" class="reveal" style="background: #f8fafc;">
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 id="gallery-teaser-heading" style="margin-bottom: 0.5rem;">Our Recent Projects</h2>
          <p style="color: #64748b; margin: 0;">See real examples of our professional restoration and cleanup work in ${data.city}.</p>
        </div>
        <a href="gallery.html" class="btn-secondary" style="margin-top: 0;">View Full Gallery →</a>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
        ${recentProjectsHTML}
      </div>
    </div>
  </section>

  <!-- ── Service Areas ─────────────────────────────────── -->
  ${showServicesLocations ? `
  <section id="locations" aria-labelledby="locations-heading" class="reveal">
    <div class="container">
      <h2 id="locations-heading">${locH2}</h2>
      <p>${locBody}</p>
      <div class="locations-grid stagger-children">
        ${locationLinksHTML}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- ── FAQ ───────────────────────────────────────────── -->
  <section id="faq" aria-labelledby="faq-heading" class="reveal">
    <div class="container">
      <h2 id="faq-heading" class="text-center">${faqH2}</h2>
      <div class="faq-list" role="list">
        ${faqsHTML}
      </div>
    </div>
  </section>

  <!-- ── SEO Footnote ───────────────────────────────────── -->
  <section aria-label="About our services" class="reveal">
    <div class="container">
      <h2>${seoH2}</h2>
      <p style="color:#475569;">${seoBody}</p>
    </div>
  </section>


  <!-- ── CTA ───────────────────────────────────────────── -->
  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container reveal">
      <h2 id="cta-heading">${ctaH2}</h2>
      <p>${ctaBody}</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> ${ctaBtn}</a>
        <a href="#contact" class="btn-secondary">Send Us a Message</a>
      </div>
    </div>
  </section>

  ${contactSection}

  ${generateFooter(data, '')}`;

  const canonicalUrl = `${getSiteUrl(data, domain)}/`;

  return htmlShell({
    metaTitle: content?.metaTitle || `${data.primaryKeyword} in ${data.city} | ${data.businessName}`,
    metaDescription: content?.metaDescription || `${data.businessName} provides professional ${kwBase(data.primaryKeyword).toLowerCase()} services in ${data.city}, ${data.state}. Available 24/7 for emergencies. Call ${data.phone}.`,
    canonicalUrl,
    theme: resolveTheme(data),
    schemaBlocks: [
      generateLocalBusinessSchema(data, `${domain}.netlify.app`),
      generateOrganizationSchema(data, `${domain}.netlify.app`),
      generateServiceSchema(data, `${domain}.netlify.app`),
      generateWebSiteSchema(data, domain),
      generateFAQSchema(faqs),
    ],
    bodyContent: body,
    businessName: data.businessName,
    ogImage: data.logoUrl || undefined,
    googleVerification: data.googleVerificationCode || undefined,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
  });
}

// ─── SERVICE PAGE ──────────────────────────────────────────────────────────

export function generateServicePage(
  data: WDBusinessData,
  service: string,
  domain: string
): string {
  data = sanitizeBusinessData(data);
  const slug = slugify(service);
  const citySlug = slugify(data.city);
  const content = data.serviceContent?.[service];
  const prefix = '../';
  const { secondaryColor, accentColor } = resolveTheme(data);

  const h1 = content?.hero?.h1 || `${service} in ${data.city}, ${data.state}`;
  const heroSub = content?.hero?.subheadline || `Professional ${service.toLowerCase()} services for homeowners and businesses in ${data.city} and surrounding areas. Call now for a free estimate.`;
  const trustBadges = content?.hero?.trustBadges || data._trustBadges || ['Licensed & Insured', 'Free Estimates', 'Available 24/7', 'Certified Technicians'];

  const overviewH2 = content?.overviewSection?.h2 || `Expert ${service} in ${data.city}`;
  // Use AI-generated service description if available for this service
  const aiServiceDesc = (data as any)._aiServiceDescs?.[service];
  const isWaterDamage = data._categoryId === 'water-damage';
  
  const defaultOverviewParas = isWaterDamage
    ? [
        `When you need professional ${service.toLowerCase()} in ${data.city}, ${data.state}, the team at ${data.businessName} is ready to help. We provide prompt response, certified technicians, and upfront estimates before starting any work.`,
        `Our process is designed to handle all aspects of ${service.toLowerCase()} from initial water extraction through structural drying and final cleanup. We use advanced moisture-detection tools to ensure no hidden moisture is left behind.`,
        `We understand that water damage is stressful. That's why we keep you informed at every step of the process and work directly with all major insurance carriers when applicable.`
      ]
    : [
        `When you need professional ${service.toLowerCase()} in ${data.city}, ${data.state}, the team at ${data.businessName} is ready to help. We provide prompt response, qualified professionals, and upfront pricing before starting any work.`,
        `Our team is dedicated to delivering high-quality ${service.toLowerCase()} services tailored to the specific needs of your property. We use the right tools and techniques to ensure the job is done safely, efficiently, and correctly the first time.`,
        `We understand that completing your project on time and within budget is important. That's why we keep you informed at every step of the process and deliver reliable, hassle-free results.`
      ];

  const defaultOverviewParasWithDesc = isWaterDamage
    ? [
        aiServiceDesc,
        `Our crew arrives fully equipped to handle ${service.toLowerCase()} quickly and professionally. We prioritize minimal disruption and thorough drying.`,
        `We work with you to ensure the cleanup and restoration process is documented correctly. Contact ${data.businessName} today.`
      ]
    : [
        aiServiceDesc,
        `Our crew arrives fully equipped to handle your ${service.toLowerCase()} needs quickly and professionally. We prioritize safety, efficiency, and cleanliness on every job.`,
        `We work closely with you to ensure your project is completed exactly to your specifications. Contact ${data.businessName} today to get started.`
      ];

  const overviewParas = content?.overviewSection?.body || (aiServiceDesc ? defaultOverviewParasWithDesc : defaultOverviewParas);

  const processH2 = content?.processSection?.h2 || `Our ${service} Process`;
  const processIntro = content?.processSection?.intro || `We follow a detailed, step-by-step process to ensure your ${service.toLowerCase()} is completed to the highest standards.`;
  const processSteps = content?.processSection?.steps || data._processSteps || [
    { step: 1, heading: 'Emergency Contact', body: `Call ${data.phone} for immediate assistance. Our dispatcher confirms your details and dispatches a crew.` },
    { step: 2, heading: 'On-Site Inspection', body: `We assess the damage, determine the class and category of water loss, and create a custom plan.` },
    { step: 3, heading: 'Water Extraction', body: 'We use industrial pumps and extractors to remove standing water quickly, preventing further damage.' },
    { step: 4, heading: 'Structural Drying', body: 'We position high-velocity air movers and low-grain dehumidifiers to dry wet walls, ceilings, and floors.' },
    { step: 5, heading: 'Monitoring', body: 'We monitor moisture levels daily to verify that target dry standards are met.' },
    { step: 6, heading: 'Sanitization & Cleanup', body: 'We clean and sanitize all affected areas with EPA-registered antimicrobials to prevent mold.' },
    { step: 7, heading: 'Reconstruction', body: 'We repair or rebuild damaged walls, flooring, and ceilings to restore your property to pre-loss condition.' },
  ];

  const benefitsH2 = content?.benefitsSection?.h2 || data._servicePageBenefitsH2 || `Why Choose Us for ${service}`;
  const aiWhyChooseUsPoints = Array.isArray((data as any)._aiWhyChooseUs) ? (data as any)._aiWhyChooseUs : [];
  const benefitPoints = content?.benefitsSection?.points || (aiWhyChooseUsPoints.length > 0
    ? aiWhyChooseUsPoints.slice(0, 6).map((pt: any) => ({
        heading: pt.heading,
        body: pt.body,
      }))
    : null) || data._servicePageBenefits || [
    { heading: 'Fast Response', body: `Our team is available 24/7 to respond to ${service.toLowerCase()} emergencies in ${data.city}.` },
    { heading: 'Certified Technicians', body: 'All restoration work is carried out by trained and licensed professionals.' },
    { heading: 'Insurance Direct Billing', body: 'We work with all major insurance carriers and provide detailed documentation for claims.' },
    { heading: 'Advanced Equipment', body: 'We use industrial water extraction and structural drying equipment for the best results.' },
    { heading: 'Upfront Pricing', body: 'Clear, itemized estimates with no hidden fees before we begin any work.' },
    { heading: 'Complete Restoration', body: 'From initial water extraction to final reconstruction, we handle it all.' },
  ];

  const warningsH2 = content?.warningSignsSection?.h2 || `Signs You Need Professional ${service}`;
  const warningsIntro = content?.warningSignsSection?.intro || `If you notice any of these warning signs in your property, contact a professional immediately to prevent further structural damage or mold growth.`;
  const warningSigns = content?.warningSignsSection?.signs || [
    { sign: 'Visible Standing Water', body: 'Standing water can quickly seep into subflooring and drywall, causing structural weakness.' },
    { sign: 'Musty Odors', body: 'A persistent musty smell is a strong indicator of hidden moisture accumulation and potential mold growth.' },
    { sign: 'Peeling Paint or Wallpaper', body: 'Moisture inside wall cavities causes paint and wallpaper to bubble, crack, or peel away.' },
    { sign: 'Discolored Drywall', body: 'Dark or yellowish stains on walls and ceilings indicate active water leaks or dampness.' },
    { sign: 'Warped Flooring', body: 'Wood, laminate, or tile floors that buckle, warp, or lift are severely affected by underlying moisture.' },
    { sign: 'Increased Humidity', body: 'Excessive indoor humidity or condensation on windows suggests unresolved moisture issues.' },
  ];

  const showWarnings = data._categoryId === 'water-damage' || data._categoryId === 'mold-remediation' || data._categoryId === 'fire-damage';

  const locationClusterH2 = content?.locationClusterSection?.h2 || `Serving ${data.city} and Surrounding Areas`;
  const locationClusterIntro = content?.locationClusterSection?.intro || `We provide prompt ${service.toLowerCase()} services to homeowners and businesses throughout the following communities:`;
  const locationCards = content?.locationClusterSection?.locationCards?.length
    ? content.locationClusterSection.locationCards
    : (data.serviceAreas?.length ? data.serviceAreas : [data.city]).map(loc => ({
        city: loc,
        anchor: `${service} in ${loc}`,
        slug: `../locations/${slugify(loc)}.html`,
        teaser: `Professional ${service.toLowerCase()} services available for homes and businesses in ${loc}.`,
      }));

  const faqH2 = content?.faqSection?.h2 || `Frequently Asked Questions About ${service}`;
  const isRestoration = data._categoryId === 'water-damage' || data._categoryId === 'mold-remediation' || data._categoryId === 'fire-damage';
  const certificationText = isRestoration 
    ? `in accordance with <a href="https://www.iicrc.org" target="_blank" rel="dofollow">IICRC S500 standards</a>` 
    : `in accordance with industry standards`;

  const faqs = content?.faqSection?.faqs || data._faqs || [
    { question: `Do you provide ${service.toLowerCase()} near me in ${data.city}?`, answer: `Yes, ${data.businessName} serves all of ${data.city} and surrounding areas with professional ${service.toLowerCase()} services.` },
    { question: `How long does the ${service.toLowerCase()} process take?`, answer: `Typically, drying and mitigation take 3 to 5 days. Reconstruction or repairs may take longer depending on the extent of the damage.` },
    { question: `Does insurance cover ${service.toLowerCase()}?`, answer: `Most homeowner's policies cover sudden and accidental damage. We document everything to help you file a successful claim.` },
    { question: `Are your technicians certified for ${service.toLowerCase()}?`, answer: `Yes, all our technicians are fully trained and qualified, and our work is performed ${certificationText}.` },
    { question: `What should I do first?`, answer: `Contact us immediately. We will answer your questions and guide you through the process step-by-step.` }
  ];

  const crossH2 = content?.crossLinkSection?.h2 || `Other Professional Services We Offer`;
  const crossLinks = content?.crossLinkSection?.links?.length
    ? content.crossLinkSection.links
    : data.services
        .filter(s => s !== service)
        .slice(0, 4)
        .map(s => ({
          service: s,
          anchor: s,
          slug: `../services/${slugify(s)}-${citySlug}.html`,
          reason: (data as any)._aiServiceDescs?.[s] || `Professional ${s.toLowerCase()} services to safeguard your property and restore your space.`,
        }));

  const ctaH2 = content?.finalCTA?.h2 || `Need Professional ${service} in ${data.city}?`;
  const ctaBody = content?.finalCTA?.body || data._ctaSubtext || `Contact ${data.businessName} today for a free on-site assessment and clear written estimate. Available 24/7 for emergencies.`;

  // Build HTML sections
  const overviewHTML = overviewParas.map(p => `<p>${p}</p>`).join('');

  const processStepsHTML = processSteps.map(step => `
    <div class="process-step">
      <h3>${step.heading}</h3>
      <p>${step.body}</p>
    </div>`).join('');

  const benefitsHTML = benefitPoints.map((pt: any) => `
    <div class="benefit-item">
      <h3>${pt.heading}</h3>
      <p>${pt.body}</p>
    </div>`).join('');

  const warningsHTML = warningSigns.map(w => `
    <div class="warning-item">
      <h3>${w.sign}</h3>
      <p>${w.body}</p>
    </div>`).join('');

  const locationCardsHTML = locationCards.map(loc => `
    <a href="${loc.slug}" class="location-link">${loc.city}</a>`).join('');

  const faqsHTML = faqs.map(faq => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <button class="faq-question" itemprop="name">${faq.question}</button>
      <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <span itemprop="text">${faq.answer}</span>
      </div>
    </div>`).join('');

  const crossLinksHTML = crossLinks.map(link => `
    <div class="related-card">
      <h3><a href="${link.slug}">${link.anchor}</a></h3>
      <p>${link.reason}</p>
    </div>`).join('');

  const trustBadgesHTML = trustBadges.map(b => `<span class="trust-badge">${b}</span>`).join('');

  const canonicalUrl = `${getSiteUrl(data, domain)}/services/${slug}-${citySlug}`;

  const body = `
  ${generateNav(data, `services/`)}

  <div class="breadcrumb container">
    <a href="../index.html">Home</a>
    <span>›</span>
    <a href="../index.html#services">Services</a>
    <span>›</span>
    <span aria-current="page">${capitalizeHeading(service)}</span>
  </div>

  <!-- ── Page Hero ──────────────────────────────── -->
  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(h1)}</h1>
      <p>${heroSub}</p>
      <div class="trust-badges">${trustBadgesHTML}</div>
      <div style="margin-top:1.5rem; display:flex; gap:1rem; flex-wrap:wrap;">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="../index.html#contact" class="btn-secondary">Get Free Estimate</a>
      </div>
    </div>
  </section>

  <!-- ── Overview ───────────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="overview-heading">
    <div class="container">
      <h2 id="overview-heading">${overviewH2}</h2>
      ${overviewHTML}
    </div>
  </section>

  <!-- ── Placeholder Image ─────────────────────── -->
  <div class="container reveal-scale" style="padding-bottom:2rem;">
    <img
      src="${data.customImages?.['service-image-' + slug] || data.customImages?.['service-image'] || (data as any)._categoryImages?.['service-image'] || WD_PLACEHOLDER_IMAGES.equipment}"
      alt="${service} project by ${data.businessName || 'Our Team'} in ${data.city || 'Your Area'}"
      class="placeholder-img"
      data-placeholder="service-image-${slug}"
      style="max-height:380px; object-fit:cover; border-radius:16px;"
      loading="lazy"
      width="1200"
      height="380"
    >
    <p class="img-caption">${iconToSVG('camera', '#94a3b8')} Replace this with a real photo of your ${service.toLowerCase()} work</p>
  </div>

  <!-- ── Process ────────────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="process-heading" style="background:#f8fafc;">
    <div class="container">
      <h2 id="process-heading">${processH2}</h2>
      <p class="section-intro">${processIntro}</p>
      <div class="process-steps stagger-children">
        ${processStepsHTML}
      </div>
    </div>
  </section>

  <!-- ── Benefits ───────────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="benefits-heading">
    <div class="container">
      <h2 id="benefits-heading">${benefitsH2}</h2>
      <div class="benefits-grid stagger-children">
        ${benefitsHTML}
      </div>
    </div>
  </section>

  ${showWarnings ? `
  <!-- ── Warning Signs ─────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="warnings-heading" style="background:#f8fafc;">
    <div class="container">
      <h2 id="warnings-heading">${warningsH2}</h2>
      <p class="section-intro">${warningsIntro}</p>
      <div class="warnings-grid stagger-children">
        ${warningsHTML}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- ── Service Areas ─────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="cluster-heading">
    <div class="container">
      <h2 id="cluster-heading">${locationClusterH2}</h2>
      <p>${locationClusterIntro}</p>
      <div class="locations-grid stagger-children">
        ${locationCardsHTML}
      </div>
    </div>
  </section>

  <!-- ── FAQ ────────────────────────────────────── -->
  <section class="content-section reveal" id="faq" aria-labelledby="faq-heading" style="background:#f8fafc;">
    <div class="container">
      <h2 id="faq-heading" class="text-center">${faqH2}</h2>
      <div class="faq-list">
        ${faqsHTML}
      </div>
    </div>
  </section>

  <!-- ── Related Services ──────────────────────── -->
  <section class="content-section reveal" aria-labelledby="related-heading">
    <div class="container">
      <h2 id="related-heading">${crossH2}</h2>
      <div class="related-grid stagger-children">
        ${crossLinksHTML}
      </div>
    </div>
  </section>

  <!-- ── CTA ────────────────────────────────────── -->
  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">${ctaH2}</h2>
      <p>${ctaBody}</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call Now</a>
        <a href="../index.html#contact" class="btn-secondary">Send a Message</a>
      </div>
    </div>
  </section>

  ${generateFooter(data, 'services/')}`;

  return htmlShell({
    metaTitle: content?.metaTitle || `${service} in ${data.city} | ${data.businessName}`,
    metaDescription: content?.metaDescription || `${data.businessName} provides professional ${service.toLowerCase()} in ${data.city}, ${data.state}. ${(data._trustBadges || ['Licensed & Insured'])[0]}. Free estimates — call ${data.phone} today.`,
    canonicalUrl,
    theme: resolveTheme(data),
    businessName: data.businessName,
    ogImage: data.logoUrl || undefined,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [
      generateFAQSchema(faqs),
      generateServiceSchema(data, getSiteHost(data, domain)),
      generateBreadcrumbSchema([
        { name: 'Home', url: `${getSiteUrl(data, domain)}/` },
        { name: 'Services', url: `${getSiteUrl(data, domain)}/#services` },
        { name: service, url: canonicalUrl },
      ]),
    ],
    bodyContent: body,
  });
}

// ─── LOCATION PAGE ─────────────────────────────────────────────────────────

export function generateLocationPage(
  data: WDBusinessData,
  city: string,
  domain: string
): string {
  data = sanitizeBusinessData(data);
  city = city.trim().replace(/,+/g, ',').trim();
  while (city.endsWith(',')) city = city.slice(0, -1).trim();
  if (data.state) {
    const stateClean = data.state.trim();
    const stateRegex = new RegExp(`,\\s*${stateClean}\\s*$`, 'i');
    if (stateRegex.test(city)) {
      city = city.replace(stateRegex, '').trim();
    }
  }
  const citySlug = slugify(city);
  const content = data.locationContent?.[city];
  const prefix = '../';
  const { secondaryColor, accentColor } = resolveTheme(data);

  const h1 = content?.hero?.h1 || `${data.primaryKeyword} in ${city}, ${data.state}`;
  const heroSub = content?.hero?.subheadline || `${data.businessName} provides fast, professional ${kwBase(data.primaryKeyword).toLowerCase()} services in ${city}. Call now for a free estimate.`;
  const trustBadges = content?.hero?.trustBadges || data._trustBadges || ['Licensed & Insured', 'Free Estimates', 'Upfront Pricing', '24/7 Available'];

  const introH2 = content?.localIntroSection?.h2 || `${data.businessName} — ${data.primaryKeyword} Experts in ${city}`;
  const aiIntroForCity = Array.isArray((data as any)._aiIntroParas) && (data as any)._aiIntroParas.length > 0
    ? (data as any)._aiIntroParas.slice(0, 3).map((p: string) =>
        (data.city && city && data.city !== city)
          ? p.replace(new RegExp(data.city, 'gi'), city)
          : p
      )
    : null;
  const introParas = content?.localIntroSection?.paragraphs || aiIntroForCity || [
    `When you need ${data.primaryKeyword.toLowerCase()} in ${city}, fast professional response makes the difference. ${data.businessName} serves homeowners and businesses throughout ${city} with expert service, licensed technicians, and upfront pricing.`,
    `Our team knows ${city} — the local properties, common issues, and what it takes to get the job done right. This local expertise means faster service and better results for your specific situation.`,
    `${data.businessName} works with all major insurance providers when applicable and can guide you through the process from start to finish. We document everything to support your claim and keep you informed every step of the way.`,
  ];

  const servCityH2 = content?.servicesInCitySection?.h2 || `Our ${kwBase(data.primaryKeyword)} Services in ${city}`;
  const servCityIntro = content?.servicesInCitySection?.intro || data._seoBody || `${data.businessName} provides a full range of professional ${kwBase(data.primaryKeyword).toLowerCase()} services to homeowners and businesses throughout ${city} and surrounding areas.`;
  const aiWhyChooseUsPoints = Array.isArray((data as any)._aiWhyChooseUs) ? (data as any)._aiWhyChooseUs : [];
  const serviceCards = content?.servicesInCitySection?.serviceCards?.length
    ? content.servicesInCitySection.serviceCards
    : data.services.map(s => ({
        service: s,
        icon: 'tool',
        h3: `${s} in ${city}`,
        description: (data as any)._aiServiceDescs?.[s] || `Professional ${s.toLowerCase()} for ${city} homeowners and businesses. Fast response, certified technicians.`,
        internalLink: { anchor: `${s} in ${city}`, slug: data.enableMatrixPages
          ? `../matrix/${slugify(s)}-in-${slugify(city)}.html`
          : `../services/${slugify(s)}-${slugify(data.city)}.html` },
      }));

  const whyLocalH2 = content?.whyLocalSection?.h2 || `Why ${city} Residents Trust ${data.businessName}`;
  const whyLocalPoints = content?.whyLocalSection?.points || (aiWhyChooseUsPoints.length > 0
    ? aiWhyChooseUsPoints.slice(0, 4).map((pt: any) => ({
        heading: pt.heading,
        body: pt.body,
      }))
    : null) || [
    { heading: `Local ${city} Knowledge`, body: `We understand the specific needs of ${city} properties and deliver service that's tailored to local conditions and requirements.` },
    { heading: 'Rapid Response Time', body: `Our crews are positioned to reach ${city} properties quickly — because fast service often means better outcomes.` },
    { heading: 'Community Reputation', body: `${data.businessName} has earned the trust of ${city} homeowners through honest assessments, upfront pricing, and professional results.` },
    { heading: 'Complete Service', body: `We handle every phase of the job in-house — no subcontracting — so you deal with one team from start to finish.` },
  ];

  const areasH2 = content?.localAreaSection?.h2 || `Areas and Neighborhoods We Serve in ${city}`;
  const areasBody = content?.localAreaSection?.body || `${data.businessName} serves all neighborhoods and districts within ${city}. Our response coverage includes the greater ${city} area, surrounding communities, and neighboring ZIP codes. If you are unsure whether we cover your location, call us at ${data.phone} — we will give you an honest answer.`;

  const faqH2 = content?.faqSection?.h2 || `${data.primaryKeyword} in ${city} — Common Questions`;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');
  let rawFaqs = content?.faqSection?.faqs || data._faqs || [
    { question: `How fast can you respond in ${city}?`, answer: `Our ${city} team is available around the clock. Response times depend on your location and current demand — we will give you an honest ETA when you call.` },
    { question: `Do you serve all of ${city}?`, answer: `Yes. We serve all areas within ${city} as well as surrounding communities. If you are unsure whether we cover your specific location, just call us and we will confirm immediately.` },
    ...(isRestoration ? [
      { question: `Does ${data.businessName} work with insurance companies?`, answer: `Yes. We work with all major insurance carriers. We provide complete documentation to support your claim, aligned with FEMA guidelines, and can communicate directly with your adjuster if you prefer.` }
    ] : [
      { question: `What are your rates in ${city}?`, answer: `Pricing depends on the specific service and project size. We provide free, upfront, and transparent estimates before starting any work so you know exactly what to expect.` }
    ]),
    { question: `How long will the job take in my ${city} property?`, answer: `Timelines depend on the scope of the work. We provide a realistic estimate during our initial assessment and keep you updated throughout the process.` },
    { question: `Do you provide free estimates in ${city}?`, answer: `Yes. We offer free on-site assessments with no obligation. A technician will inspect the situation and provide a written estimate before any work begins.` },
    { question: `Are you licensed and insured in ${data.state}?`, answer: `Yes. ${data.businessName} is fully licensed and insured in ${data.state}. All work is performed by qualified professionals following applicable codes and industry standards` + (isRestoration ? `, including those defined by the <a href="https://www.iicrc.org" target="_blank" rel="dofollow">IICRC</a>.` : '.') },
  ];

  // Replace references to home city with current city in FAQs
  const faqs = rawFaqs.map(faq => {
    let q = faq.question;
    let a = faq.answer;
    if (data.city && city && data.city !== city) {
      q = q.replace(new RegExp(data.city, 'gi'), city);
      a = a.replace(new RegExp(data.city, 'gi'), city);
    }
    return { question: q, answer: a };
  });

  const ctaH2 = content?.finalCTA?.h2 || `Need ${data.primaryKeyword} in ${city}? Contact Us Now`;
  const ctaBody = content?.finalCTA?.body || data._ctaSubtext || `${data.businessName} is ready to help ${city} homeowners and businesses with professional ${data.primaryKeyword.toLowerCase()}. Call now or submit a request and we will follow up promptly.`;

  // Build HTML sections
  const introParagraphsHTML = introParas.map((p: any) => `<p>${p}</p>`).join('');

  const serviceCardsHTML = serviceCards.map(card => `
    <article class="service-card">
      <div class="service-card-icon" aria-hidden="true">${iconToSVG(card.icon || 'tool', secondaryColor)}</div>
      <h3>${card.h3}</h3>
      <p>${card.description}</p>
      <a href="${card.internalLink.slug}" class="service-card-link">${card.internalLink.anchor} →</a>
    </article>`).join('');

  const whyLocalHTML = whyLocalPoints.map((pt: any) => `
    <div class="benefit-item">
      <h3>${pt.heading}</h3>
      <p>${pt.body}</p>
    </div>`).join('');

  const faqsHTML = faqs.map(faq => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <button class="faq-question" itemprop="name">${faq.question}</button>
      <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <span itemprop="text">${faq.answer}</span>
      </div>
    </div>`).join('');

  const trustBadgesHTML = trustBadges.map(b => `<span class="trust-badge">${b}</span>`).join('');

  const nearbyLocationsHTML = data.serviceAreas
    .filter(l => l.toLowerCase() !== city.toLowerCase())
    .slice(0, 8)
    .map(l => `<a href="${prefix}locations/${slugify(l)}.html" class="location-link">${l}</a>`)
    .join('');

  const canonicalUrl = `${getSiteUrl(data, domain)}/locations/${citySlug}`;

  const body = `
  ${generateNav(data, `locations/`)}

  <div class="breadcrumb container">
    <a href="../index.html">Home</a>
    <span>›</span>
    <span>Service Areas</span>
    <span>›</span>
    <span aria-current="page">${capitalizeHeading(city)}</span>
  </div>

  <!-- ── Page Hero ──────────────────────────────── -->
  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(h1)}</h1>
      <p>${heroSub}</p>
      <div class="trust-badges">${trustBadgesHTML}</div>
      <div style="margin-top:1.5rem; display:flex; gap:1rem; flex-wrap:wrap;">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="../index.html#contact" class="btn-secondary">Get Free Estimate</a>
      </div>
    </div>
  </section>

  <!-- ── Local Intro ────────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="intro-heading">
    <div class="container">
      <h2 id="intro-heading">${introH2}</h2>
      ${introParagraphsHTML}
    </div>
  </section>

  <!-- ── Placeholder Image ─────────────────────── -->
  <div class="container reveal-scale" style="padding-bottom:2rem;">
    <img
      src="${data.customImages?.['location-image-' + citySlug] || data.customImages?.['location-image'] || (data as any)._categoryImages?.['location-image'] || WD_PLACEHOLDER_IMAGES.drying}"
      alt="${data.primaryKeyword || 'Services'} project by ${data.businessName || 'Our Team'} in ${city}"
      class="placeholder-img"
      data-placeholder="location-image-${citySlug}"
      style="max-height:360px; object-fit:cover; border-radius:16px;"
      loading="lazy"
      width="1200"
      height="360"
    >
    <p class="img-caption">${iconToSVG('camera', '#94a3b8')} Replace this with a real photo from your ${city} work</p>
  </div>

  <!-- ── Services in City ───────────────────────── -->
  <section class="content-section reveal" style="background:#f8fafc;" aria-labelledby="serv-city-heading">
    <div class="container">
      <h2 id="serv-city-heading">${servCityH2}</h2>
      <p class="section-intro">${servCityIntro}</p>
      <div class="services-grid stagger-children">
        ${serviceCardsHTML}
      </div>
    </div>
  </section>

  <!-- ── Why Local ──────────────────────────────── -->
  <section class="content-section reveal" aria-labelledby="why-local-heading">
    <div class="container">
      <h2 id="why-local-heading">${whyLocalH2}</h2>
      <div class="benefits-grid stagger-children">
        ${whyLocalHTML}
      </div>
    </div>
  </section>

  <!-- ── Areas Covered ─────────────────────────── -->
  <section class="content-section reveal" style="background:#f8fafc;" aria-labelledby="areas-heading">
    <div class="container">
      <h2 id="areas-heading">${areasH2}</h2>
      <p style="color:#475569;">${areasBody}</p>
      ${nearbyLocationsHTML ? `<div class="locations-grid stagger-children" style="margin-top:1.5rem;">${nearbyLocationsHTML}</div>` : ''}
    </div>
  </section>

  <!-- ── FAQ ────────────────────────────────────── -->
  <section class="content-section reveal" id="faq" aria-labelledby="faq-heading">
    <div class="container">
      <h2 id="faq-heading" class="text-center">${faqH2}</h2>
      <div class="faq-list">
        ${faqsHTML}
      </div>
    </div>
  </section>

  <!-- ── CTA ────────────────────────────────────── -->
  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">${ctaH2}</h2>
      <p>${ctaBody}</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call Now</a>
        <a href="../index.html#contact" class="btn-secondary">Send a Message</a>
      </div>
    </div>
  </section>

  ${generateFooter(data, 'locations/')}`;

  return htmlShell({
    metaTitle: content?.metaTitle || `${data.primaryKeyword} in ${city} | ${data.businessName}`,
    metaDescription: content?.metaDescription || `Professional ${data.primaryKeyword.toLowerCase()} in ${city}, ${data.state}. ${data.businessName} — licensed & insured, free estimates. Call ${data.phone}.`,
    canonicalUrl,
    theme: resolveTheme(data),
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [
      generateFAQSchema(faqs),
      generateLocalBusinessSchema(data, getSiteHost(data, domain)),
      generateBreadcrumbSchema([
        { name: 'Home', url: `${getSiteUrl(data, domain)}/` },
        { name: 'Service Areas', url: `${getSiteUrl(data, domain)}/#locations` },
        { name: city, url: canonicalUrl },
      ]),
    ],
    bodyContent: body,
  });
}

// ─── MATRIX PAGE (Service × Location) ──────────────────────────────────────

export function generateServiceLocationMatrixPage(
  data: WDBusinessData,
  service: string,
  city: string,
  domain: string
): string {
  data = sanitizeBusinessData(data);
  city = city.trim().replace(/,+/g, ',').trim();
  while (city.endsWith(',')) city = city.slice(0, -1).trim();
  if (data.state) {
    const stateClean = data.state.trim();
    const stateRegex = new RegExp(`,\\s*${stateClean}\\s*$`, 'i');
    if (stateRegex.test(city)) {
      city = city.replace(stateRegex, '').trim();
    }
  }

  const svcSlug = slugify(service);
  const citySlug = slugify(city);
  const { secondaryColor, accentColor } = resolveTheme(data);
  const prefix = '../';
  const canonicalUrl = `${getSiteUrl(data, domain)}/matrix/${svcSlug}-in-${citySlug}`;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');

  // Use AI service description if available
  const aiDesc = (data as any)._aiServiceDescs?.[service];

  const h1 = `${service} in ${city}, ${data.state}`;
  const heroSub = `Looking for professional ${service.toLowerCase()} in ${city}? ${data.businessName} provides fast, reliable service — licensed, insured, and trusted by local homeowners.`;

  const overviewParas = aiDesc ? [
    aiDesc,
    `Homeowners and businesses in ${city} rely on ${data.businessName} for ${service.toLowerCase()} because we combine local knowledge with professional expertise. Our technicians know the common issues in ${city} properties and arrive prepared with the right tools.`,
    `Every job starts with a free on-site assessment. We document the situation thoroughly, provide a written estimate, and never begin work without your approval.`,
  ] : [
    `When you need ${service.toLowerCase()} in ${city}, you need a team that responds quickly and does the job right the first time. ${data.businessName} has been serving ${city} homeowners and businesses with professional ${service.toLowerCase()} — delivering honest assessments, upfront pricing, and certified work.`,
    `Our ${city} technicians are specifically trained in ${service.toLowerCase()} and understand the unique challenges that local properties face. Whether it's an emergency or a planned project, we handle it completely.`,
    isRestoration 
      ? `${data.businessName} works with all major insurance carriers when applicable and provides complete documentation to support your claim. Call ${data.phone} for a free estimate.`
      : `We deliver professional, reliable services tailored to your specific project needs. Call ${data.phone} for a free estimate.`,
  ];

  const processSteps: Array<{ step: number; heading: string; body: string }> = (data as any)._aiProcessSteps || [
    { step: 1, heading: 'Contact Us', body: `Call ${data.phone} or submit a request online. Our ${city} dispatcher will confirm your appointment.` },
    { step: 2, heading: 'Free Assessment', body: `A licensed technician inspects your ${city} property, documents the situation, and explains what needs to be done.` },
    { step: 3, heading: 'Written Estimate', body: 'You receive a clear, itemized estimate with no hidden fees — we never start work without your approval.' },
    { step: 4, heading: 'Professional Service', body: `We complete the ${service.toLowerCase()} using professional tools and industry-standard methods, following all applicable codes.` },
    { step: 5, heading: 'Final Walkthrough', body: 'We inspect the completed work with you, answer questions, and ensure your complete satisfaction before we leave.' },
  ];

  const faqs = [
    { question: `How much does ${service.toLowerCase()} cost in ${city}?`, answer: `Costs vary depending on the scope of work. ${data.businessName} provides free on-site assessments and detailed written estimates before any work begins. Call ${data.phone} for a no-obligation quote.` },
    { question: `How quickly can you get to ${city}?`, answer: `Our crews are positioned to serve ${city} and surrounding areas. We offer same-day service for most requests and rapid response for emergencies.` },
    { question: `Is ${data.businessName} licensed for ${service.toLowerCase()} in ${data.state}?`, answer: `Yes. We are fully licensed and insured in ${data.state}. All technicians are trained and certified for ${service.toLowerCase()} work in accordance with ` + (isRestoration ? `<a href="https://www.iicrc.org" target="_blank" rel="dofollow">IICRC standards</a>.` : `industry standards.`) },
    { question: `Do you offer free estimates for ${service.toLowerCase()} in ${city}?`, answer: `Absolutely. We provide free on-site assessments with no obligation. A technician will inspect the situation and give you a written estimate before any work begins.` },
  ];

  const otherServices = data.services.filter(s => s !== service).slice(0, 4);
  const otherLocations = data.serviceAreas.filter(l => l !== city).slice(0, 4);

  const body = `
  ${generateNav(data, 'matrix/')}

  <div class="breadcrumb container">
    <a href="${prefix}index.html">Home</a>
    <span>›</span>
    <a href="${prefix}services/${svcSlug}-${slugify(data.city)}.html">${capitalizeHeading(service)}</a>
    <span>›</span>
    <span aria-current="page">${capitalizeHeading(service)} in ${capitalizeHeading(city)}</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(h1)}</h1>
      <p>${heroSub}</p>
      <div class="trust-badges">
        ${(data._trustBadges || ['Licensed & Insured', '24/7 Available', 'Free Estimates']).map(b => `<span class="trust-badge">${b}</span>`).join('')}
      </div>
      <div style="margin-top:1.5rem; display:flex; gap:1rem; flex-wrap:wrap;">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="${prefix}index.html#contact" class="btn-secondary">Get Free Estimate</a>
      </div>
    </div>
  </section>

  <section class="content-section reveal" aria-labelledby="overview-heading">
    <div class="container">
      <h2 id="overview-heading">Professional ${service} in ${city}</h2>
      ${overviewParas.map(p => `<p>${p}</p>`).join('')}
    </div>
  </section>

  <section class="content-section reveal" style="background:${secondaryColor || '#f8fafc'};" aria-labelledby="process-heading">
    <div class="container">
      <h2 id="process-heading">Our ${service} Process in ${city}</h2>
      <div class="process-steps stagger-children">
        ${processSteps.map(s => `
        <div class="process-step">
          <h3>${s.heading}</h3>
          <p>${s.body}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="content-section reveal" id="faq" aria-labelledby="faq-heading">
    <div class="container">
      <h2 id="faq-heading" class="text-center">${service} in ${city} — Common Questions</h2>
      <div class="faq-list">
        ${faqs.map(faq => `
        <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <button class="faq-question" itemprop="name">${faq.question}</button>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text">${faq.answer}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  ${otherServices.length > 0 ? `
  <section class="content-section reveal" aria-labelledby="other-services-heading">
    <div class="container">
      <h2 id="other-services-heading">Other Services in ${city}</h2>
      <div class="locations-grid stagger-children">
        ${otherServices.map(s => `<a href="${prefix}matrix/${slugify(s)}-in-${citySlug}.html" class="location-link">${s} in ${city}</a>`).join('')}
      </div>
    </div>
  </section>` : ''}

  ${otherLocations.length > 0 ? `
  <section class="content-section reveal" style="background:${secondaryColor || '#f8fafc'};" aria-labelledby="other-locations-heading">
    <div class="container">
      <h2 id="other-locations-heading">${service} in Other Areas</h2>
      <div class="locations-grid stagger-children">
        ${otherLocations.map(l => `<a href="${prefix}matrix/${svcSlug}-in-${slugify(l)}.html" class="location-link">${service} in ${l}</a>`).join('')}
      </div>
    </div>
  </section>` : ''}

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container reveal">
      <h2 id="cta-heading">Need ${service} in ${city}? Call Now</h2>
      <p>${data.businessName} is ready for your ${service.toLowerCase()} needs in ${city}. Contact us today for a free estimate.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call Now</a>
        <a href="${prefix}index.html#contact" class="btn-secondary">Send a Message</a>
      </div>
    </div>
  </section>

  ${generateFooter(data, 'matrix/')}`;

  return htmlShell({
    metaTitle: `${service} in ${city}, ${data.state} | ${data.businessName}`,
    metaDescription: `Professional ${service.toLowerCase()} in ${city}, ${data.state}. ${data.businessName} — licensed, insured, free estimates. Call ${data.phone}.`,
    canonicalUrl,
    theme: resolveTheme(data),
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [
      generateFAQSchema(faqs),
      generateServiceSchema(data, getSiteHost(data, domain)),
      generateBreadcrumbSchema([
        { name: 'Home', url: `${getSiteUrl(data, domain)}/` },
        { name: service, url: `${getSiteUrl(data, domain)}/services/${svcSlug}-${slugify(data.city)}` },
        { name: `${service} in ${city}`, url: canonicalUrl },
      ]),
    ],
    bodyContent: body,
  });
}

// ─── ABOUT PAGE ────────────────────────────────────────────────────────────

export function generateAboutPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const { secondaryColor, accentColor } = theme;
  const canonicalUrl = `${getSiteUrl(data, domain)}/about`;
  const yearsText = data.yearsInBusiness ? `With ${data.yearsInBusiness} years of experience` : 'With years of experience';

  const aboutText: string = (data as any)._aiAboutContent || data.aboutContent ||
    `${data.businessName} was founded to give homeowners and businesses in ${data.city} a ${data.primaryKeyword.toLowerCase()} company they could genuinely trust. Too many property owners have been let down by contractors who cut corners, gave vague estimates, or disappeared after collecting payment.

We built this company differently. Every technician we hire is properly licensed and trained before they set foot on a customer's property. Every project is documented thoroughly so you always know exactly what was done and why.

${data.businessName} serves all of ${data.city} and surrounding communities. We handle everything from first call to final walkthrough — delivering professional results and honest service every time.`;

  const teamText = data.teamDescription ||
    `Our team is made up of licensed professionals, not day laborers or subcontractors. Every person on our crew has been trained to the highest standards in their field. When you call ${data.businessName}, you get people who know what they are doing and take your property seriously.`;

  const body = `
  ${generateNav(data)}

  <div class="breadcrumb container">
    <a href="index.html">Home</a>
    <span>›</span>
    <span aria-current="page">About Us</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>About ${data.businessName}</h1>
      <p>${data.primaryKeyword} — built on certified expertise, honest assessments, and thorough results.</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:start;">
      <div>
        <h2>Our Story</h2>
        ${aboutText.split('\n\n').map(p => `<p style="color:#475569;">${p.trim()}</p>`).join('')}
      </div>
      <div>
        <img
          src="${data.customImages?.['about-team-photo'] || data.customImages?.['about-image'] || (data as any)._categoryImages?.['about-team-photo'] || WD_PLACEHOLDER_IMAGES.team}"
          alt="Our professional team at ${data.businessName || 'Our Company'} in ${data.city || 'Your Area'}"
          class="placeholder-img"
          data-placeholder="about-team-photo"
          style="border-radius:10px;"
          loading="lazy"
          width="600"
          height="420"
        >
        <p class="img-caption">${iconToSVG('camera', '#94a3b8')} Replace with a real photo of your team</p>
      </div>
    </div>
  </section>

  <section class="content-section" style="background:#f8fafc;">
    <div class="container">
      <h2>Our Team</h2>
      <p style="color:#475569;max-width:760px;">${teamText}</p>
      <div class="why-us-grid" style="margin-top:2rem;">
        <div class="why-us-item">
          <span class="why-us-icon">${iconToSVG('certified', secondaryColor)}</span>
          <div>
            <h3>Licensed &amp; Trained Technicians</h3>
            <p>All field technicians hold proper licenses and certifications for ${data.primaryKeyword.toLowerCase()} work in ${data.state}.</p>
          </div>
        </div>
        <div class="why-us-item">
          <span class="why-us-icon">${iconToSVG('clipboard', secondaryColor)}</span>
          <div>
            <h3>Licensed &amp; Insured</h3>
            <p>Fully licensed to operate in ${data.state} and carrying full liability insurance on every project.${data.licenseNumber ? ` License: ${data.licenseNumber}.` : ''}</p>
          </div>
        </div>
        <div class="why-us-item">
          <span class="why-us-icon">${iconToSVG('trophy', secondaryColor)}</span>
          <div>
            <h3>${yearsText}</h3>
            <p>Hundreds of ${data.city} jobs completed. Our experience means fewer surprises and better outcomes for every customer.</p>
          </div>
        </div>
        <div class="why-us-item">
          <span class="why-us-icon">${iconToSVG('users', secondaryColor)}</span>
          <div>
            <h3>Insurance Claim Experts</h3>
            <p>We work directly with adjusters from all major carriers, providing complete documentation that supports your claim from day one.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section">
    <div class="container">
      <h2>Our Certifications &amp; Standards</h2>
      <p style="color:#475569;max-width:760px;">${data.primaryKeyword} requires specialized knowledge, proper licensing, and adherence to industry standards. Our certifications and training ensure that every job is approached with the technical rigor and professionalism it requires.</p>
      <div class="benefits-grid" style="margin-top:1.5rem;">
        <div class="benefit-item">
          <h3>State Licensed &amp; Insured</h3>
          <p>Fully licensed to operate in ${data.state} with full liability and workers' compensation insurance on every project.${data.licenseNumber ? ` License #${data.licenseNumber}.` : ''}</p>
        </div>
        <div class="benefit-item">
          <h3>Industry Certified</h3>
          <p>Our technicians hold relevant industry certifications and complete ongoing training to stay current with best practices and code requirements.</p>
        </div>
        <div class="benefit-item">
          <h3>Code Compliant</h3>
          <p>All work follows applicable local, state, and national codes and standards. Permits are pulled when required, providing proper documentation for your records.</p>
        </div>
        <div class="benefit-item">
          <h3>Background Checked</h3>
          <p>Every technician is background-checked before joining our team. You can trust the professionals we send to your home or business.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section" style="background:#f8fafc;">
    <div class="container">
      <h2>Service Area: ${data.city} and Surrounding Communities</h2>
      <p style="color:#475569;">We provide ${kwBase(data.primaryKeyword).toLowerCase()} services throughout ${data.city}, ${data.state} and the surrounding region. Our crews are positioned for fast response across our full service area.</p>
      <div class="locations-grid" style="margin-top:1.5rem;">
        ${data.serviceAreas.map(l => `<a href="locations/${slugify(l)}.html" class="location-link">${l}</a>`).join('')}
      </div>
    </div>
  </section>

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">Ready to Work With a Team You Can Trust?</h2>
      <p>Call ${data.businessName} for immediate help or to schedule a free assessment.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="contact.html" class="btn-secondary">Contact Us</a>
      </div>
    </div>
  </section>

  ${generateFooter(data)}`;

  return htmlShell({
    metaTitle: `About ${data.businessName} | ${data.primaryKeyword} in ${data.city}`,
    metaDescription: `Learn about ${data.businessName} — licensed ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state}. ${yearsText} serving homeowners and businesses.`,
    canonicalUrl,
    theme,
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [generateLocalBusinessSchema(data, `${domain}.netlify.app`)],
    bodyContent: body,
  });
}

// ─── CONTACT PAGE ──────────────────────────────────────────────────────────

export function generateContactPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const { secondaryColor, accentColor } = theme;
  const canonicalUrl = `${getSiteUrl(data, domain)}/contact`;

  const formSection = data.contactFormEmbed
    ? data.contactFormEmbed
    : `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:2rem;text-align:center;">
        <p style="color:#475569;margin-bottom:1rem;">Contact form will appear here after setup.</p>
        <p style="color:#64748b;font-size:.9rem;">To add a form, paste your embed code (Typeform, JotForm, Gravity Forms, etc.) in the dashboard editor.</p>
      </div>`;

  const body = `
  ${generateNav(data)}

  <div class="breadcrumb container">
    <a href="index.html">Home</a>
    <span>›</span>
    <span aria-current="page">Contact</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>Contact ${data.businessName}</h1>
      <p>For emergencies, call us immediately — we are available 24/7. For non-urgent inquiries, use the form below.</p>
    </div>
  </section>

  <!-- Emergency Banner -->
  <div style="background:#dc2626;color:#fff;padding:1.25rem 0;text-align:center;">
    <div class="container">
      <strong>${iconToSVG('alert', accentColor)} ${data._emergencyBadge || data.primaryKeyword + ' Emergency'}?</strong> Don't wait — call us now:
      <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" style="color:#fff;font-size:1.2rem;font-weight:800;margin-left:.75rem;">${data.phone}</a>
    </div>
  </div>

  <section class="contact-section">
    <div class="container">
      <div class="contact-grid">
        <div class="contact-info">
          <h2>Get in Touch</h2>
          <p style="color:#475569;">We respond promptly to all inquiries. For emergencies, please call — do not wait for an email response.</p>

          <div class="contact-item" style="margin-top:1.5rem;">
            <span class="contact-icon">${iconToSVG('phone', secondaryColor)}</span>
            <div>
              <strong>Phone (24/7 Emergency)</strong><br>
              <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" style="font-size:1.2rem;font-weight:700;">${data.phone}</a>
            </div>
          </div>

          ${data.email ? `<div class="contact-item">
            <span class="contact-icon">${iconToSVG('file', secondaryColor)}</span>
            <div>
              <strong>Email</strong><br>
              <a href="mailto:${data.email}">${data.email}</a>
            </div>
          </div>` : ''}

          <div class="contact-item">
            <span class="contact-icon">${iconToSVG('map-pin', secondaryColor)}</span>
            <div>
              <strong>Address</strong><br>
              ${formatFooterAddress(data.address, data.city, data.state)}
            </div>
          </div>

          <div class="contact-item">
            <span class="contact-icon">${iconToSVG('clock', secondaryColor)}</span>
            <div>
              <strong>Hours</strong><br>
              ${(data.businessHours || "Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 4:00 PM, Sunday: Emergency Only")
                .split(',')
                .map(h => h.trim())
                .join('<br>')}
            </div>
          </div>

          ${data.licenseNumber ? `<div class="contact-item">
            <span class="contact-icon">${iconToSVG('clipboard', secondaryColor)}</span>
            <div>
              <strong>License</strong><br>
              ${data.licenseNumber}
            </div>
          </div>` : ''}

          <div style="margin-top:2rem;padding:1.25rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
            <strong style="color:#166534;">Service Areas</strong>
            <p style="color:#475569;font-size:.9rem;margin-top:.4rem;">We serve ${data.city} and: ${data.serviceAreas.slice(0, 8).join(', ')}${data.serviceAreas.length > 8 ? ' and more.' : '.'}</p>
          </div>
        </div>

        <div>
          <h2>Send Us a Message</h2>
          ${formSection}

          <!-- Map -->
          ${generateGoogleMap(data)}
        </div>
      </div>
    </div>
  </section>

  <section class="content-section" style="background:#f8fafc;">
    <div class="container">
      <h2 style="text-align:center;">What to Expect When You Call</h2>
      <div class="process-steps" style="margin-top:2rem;">
        <div class="process-step">
          <h3>1. Immediate Answer</h3>
          <p>A live team member answers your call 24/7 — no voicemail for emergencies.</p>
        </div>
        <div class="process-step">
          <h3>2. Fast Dispatch</h3>
          <p>We route the nearest available crew to your ${data.city} property and give you an honest ETA.</p>
        </div>
        <div class="process-step">
          <h3>3. Free Assessment</h3>
          <p>On arrival, technicians inspect and document the damage before any work begins. No surprise charges.</p>
        </div>
        <div class="process-step">
          <h3>4. Written Estimate</h3>
          <p>You receive a written scope of work and cost estimate before we start restoration.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">${data.primaryKeyword} Cannot Wait</h2>
      <p>Every hour of delay increases risk. Call now for immediate response.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
      </div>
    </div>
  </section>

  ${generateFooter(data, 'contact.html')}`;

  return htmlShell({
    metaTitle: `Contact ${data.businessName} | ${data.primaryKeyword} ${data.city}`,
    metaDescription: `Contact ${data.businessName} for ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state}. Available 24/7 for emergencies. Call ${data.phone} or use our contact form.`,
    canonicalUrl,
    theme,
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [generateLocalBusinessSchema(data, `${domain}.netlify.app`)],
    bodyContent: body,
  });
}

// ─── FAQ PAGE ──────────────────────────────────────────────────────────────

export function generateFAQPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/faq`;
  const content = data.faqContent;

  const isRestoration = data._categoryId === 'water-damage' || data._categoryId === 'mold-remediation' || data._categoryId === 'fire-damage';

  const defaultCategories = isRestoration
    ? [
        {
          heading: 'Emergency Response',
          faqs: [
            { question: `How fast can you respond to water damage in ${data.city}?`, answer: `Our ${data.city} team is available 24 hours a day, 7 days a week. We typically arrive within 60 minutes of your call for most locations in our service area. When you call, we will give you an honest estimated arrival time based on current crew availability.` },
            { question: 'What should I do while waiting for your crew to arrive?', answer: 'If it is safe to do so: shut off the water source if possible, turn off electricity in affected areas, move valuables and furniture off wet floors, and take photos of the damage for your insurance claim. Do not use a regular vacuum on standing water and avoid entering rooms where ceilings are sagging.' },
            { question: 'Do you respond to water damage 24 hours a day?', answer: `Yes. Water damage does not follow business hours and neither do we. Our emergency dispatch is staffed around the clock, every day of the year including holidays. Call ${data.phone} at any time for immediate assistance in ${data.city} and surrounding areas.` },
            { question: 'What counts as a water damage emergency?', answer: `Any active water intrusion, burst pipe, appliance flood, sewage backup, or storm-related flooding qualifies as an emergency requiring immediate response. Even a slow leak that has been ongoing warrants prompt professional assessment, as moisture accumulates in hidden areas and mold can begin within 24 to 48 hours (per <a href="https://www.epa.gov/mold" target="_blank" rel="dofollow">EPA Mold Guidelines</a>).` },
          ]
        },
        {
          heading: 'The Restoration Process',
          faqs: [
            { question: 'What is the difference between water mitigation and restoration?', answer: 'Water mitigation covers all emergency actions taken to stop damage from getting worse — water extraction, structural drying, antimicrobial application, and content protection. Water restoration is the rebuild phase that follows: replacing drywall, flooring, cabinets, and other materials damaged beyond salvage. We handle both phases.' },
            { question: 'How long does structural drying take?', answer: 'Most residential drying projects reach IICRC target moisture levels within 3 to 5 days. Larger losses, concrete subfloors, or heavily saturated wall systems may require additional time. We monitor moisture readings daily and will not remove equipment until levels are verified at or below acceptable thresholds.' },
            { question: 'Do you use IICRC standards?', answer: `Yes. Every water damage restoration project we perform follows <a href="https://www.iicrc.org" target="_blank" rel="dofollow">IICRC S500 standards</a>, which define best practices for water extraction, structural drying, and moisture documentation. Our technicians are IICRC-certified, which means they have been trained and tested on the science behind effective water damage restoration — not just the physical tasks.` },
            { question: 'Will you move my furniture and belongings?', answer: 'Yes. Content manipulation is part of our standard service. We move furniture, area rugs, and personal items to protect them during the drying process. For significant losses, we can perform a structured pack-out of contents to a secure facility for drying and cleaning, then return them after restoration is complete.' },
            { question: 'How do I know all the moisture has been removed?', answer: `We use calibrated moisture meters and thermal imaging cameras to locate and measure moisture in structural materials — including inside walls, under flooring, and above ceilings. You will receive a drying documentation report showing daily moisture readings from initial setup through final clearance, confirming the structure is dry per <a href="https://www.iicrc.org" target="_blank" rel="dofollow">IICRC standards</a>.` },
          ]
        },
        {
          heading: 'Insurance and Claims',
          faqs: [
            { question: 'Will my homeowner\'s insurance cover water damage?', answer: 'Most standard homeowner\'s insurance policies cover sudden and accidental water damage — burst pipes, appliance failures, HVAC leaks, and roof leaks from storms. Gradual leaks, flooding from external sources, and maintenance-related damage are typically excluded. We recommend calling your insurance company to open a claim immediately after a water event, and we can work alongside your adjuster.' },
            { question: 'Do you work directly with insurance companies?', answer: `Yes. We work with all major insurance carriers and communicate directly with adjusters on your behalf if you choose. We provide complete documentation — moisture logs, equipment records, photo reports, and scopes of work — formatted to meet adjuster requirements. Our goal is to make the claims process as smooth as possible for you.` },
            { question: 'Do I need to get multiple estimates before starting work?', answer: 'Your insurance policy may or may not require multiple estimates — check with your adjuster. In emergency situations, most insurers understand that work must begin immediately to prevent further damage. We document everything thoroughly so the adjuster has full visibility into what was done and why, even if work began before the adjuster arrived on site.' },
            { question: 'What if my insurance claim is denied?', answer: 'A denial is not always final. You have the right to appeal and to hire a public adjuster to represent your interests. We can provide our documentation to support your appeal. We also offer private-pay restoration services and can work with you on payment options if insurance coverage is limited or unavailable.' },
          ]
        },
        {
          heading: 'Mold and Health',
          faqs: [
            { question: 'Can mold grow after water damage?', answer: 'Yes. Mold spores are present in virtually every indoor environment. Given moisture, a food source (any organic material including drywall paper, wood framing, and carpet backing), and the right temperature, mold can begin to establish within 24 to 48 hours after a water event. This is why rapid response and thorough structural drying are critical — not cosmetic.' },
            { question: 'How do you prevent mold after water damage?', answer: 'Preventing mold requires removing the moisture that mold needs to grow. We apply EPA-registered antimicrobial treatments to affected surfaces and use industrial drying equipment to bring structural materials to target moisture levels as quickly as possible. We also physically remove materials that cannot be dried to acceptable levels, such as heavily saturated drywall or flooring.' },
            { question: 'Do I need a separate mold test after water damage?', answer: 'In most cases, if water damage is addressed promptly and thoroughly by a certified restorer, a post-remediation mold test is not necessary for standard insurance claims. However, if you have health concerns, visible mold growth, or a persistent musty odor after restoration, an air quality test by a certified industrial hygienist may be appropriate. We can refer you to qualified testing professionals.' },
            { question: 'Is Category 3 water dangerous?', answer: 'Yes. Category 3 (black water) includes sewage backups, flooding from rivers or streams, and standing water that has been contaminated by pathogens. Contact with Category 3 water poses serious health risks. All materials that cannot be effectively disinfected must be removed and disposed of. Our technicians use full personal protective equipment when handling Category 3 losses.' },
          ]
        },
        {
          heading: 'Costs and Pricing',
          faqs: [
            { question: 'How much does water damage restoration cost?', answer: `Water damage restoration costs vary widely depending on the severity of the loss, the square footage affected, the category of water involved, and the extent of structural damage. Minor incidents involving a small area of clean water may cost a few hundred dollars. Larger losses involving multiple rooms, Category 2 or 3 water, or significant structural damage can run into the thousands. We provide free on-site assessments with written estimates before work begins.` },
            { question: 'Do you charge for the initial assessment?', answer: `No. We provide free on-site assessments for water damage in ${data.city} and surrounding areas. A certified technician will inspect the affected areas, document the damage with moisture readings and photos, and provide a written estimate. There is no obligation to proceed with us after the assessment.` },
            { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, checks, and bank transfers. For insurance claims, we can often bill the insurance company directly after your claim is approved. We are transparent about costs throughout the project and will notify you of any changes to the scope before proceeding with additional work.' },
          ]
        },
        {
          heading: 'After Restoration',
          faqs: [
            { question: 'Do you handle the full rebuild after drying?', answer: 'Yes. ${data.businessName} provides complete restoration services — from emergency extraction through final repairs. Once drying is complete, we can replace drywall, flooring, insulation, cabinets, trim, and paint to restore your property to pre-loss condition. You work with one company through the entire process.' },
            { question: 'Will my home look the same after restoration?', answer: 'Our goal is always to return your property to pre-loss condition or better. For matching materials, we use the same or equivalent products to your existing finishes wherever possible. In some cases, discontinued products may require a partial update to an adjacent area for a consistent appearance — we discuss this with you before proceeding.' },
            { question: 'How do I prevent water damage in the future?', answer: 'Regular home maintenance is your best defense. Key steps: inspect your roof and gutters annually, check washing machine and dishwasher hoses for cracks or bulging, maintain your water heater (most fail after 10 to 15 years), know where your main water shutoff is located, install water leak detectors near appliances and under sinks, and keep your sump pump tested and functioning if you have one.' },
          ]
        },
      ]
    : [
        {
          heading: `${data.primaryKeyword} Frequently Asked Questions`,
          faqs: Array.isArray(data._faqs) && data._faqs.length > 0
            ? data._faqs
            : [
                { question: `What services do you offer in ${data.city}?`, answer: `${data.businessName} provides professional ${data.primaryKeyword.toLowerCase()} services in ${data.city} and surrounding areas.` },
                { question: `How can I contact you?`, answer: `You can call us at ${data.phone} or send us a message through our Contact page. We are ready to assist you.` }
              ]
        }
      ];

  const categories = content?.categories || defaultCategories;
  const h1 = content?.h1 || `${data.primaryKeyword} — Frequently Asked Questions`;
  const intro = content?.intro || `Everything you need to know about ${data.primaryKeyword.toLowerCase()}, the service process, and what to expect when you call ${data.businessName} in ${data.city}.`;

  // Build all FAQs flat list for schema
  const allFaqs = categories.flatMap(cat => cat.faqs);

  const categoriesHTML = categories.map(cat => `
    <div style="margin-bottom:2.5rem;">
      <h2 style="margin-bottom:1rem;">${cat.heading}</h2>
      <div class="faq-list" role="list">
        ${cat.faqs.map(faq => `
        <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <button class="faq-question" itemprop="name">${faq.question}</button>
          <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text">${faq.answer}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>`).join('');

  const body = `
  ${generateNav(data)}

  <div class="breadcrumb container">
    <a href="index.html">Home</a>
    <span>›</span>
    <span aria-current="page">FAQ</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(h1)}</h1>
      <p>${intro}</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container" style="max-width:860px;">
      ${categoriesHTML}
    </div>
  </section>

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">Still Have Questions? Call Us Directly</h2>
      <p>Our team is available 24/7 to answer any questions and dispatch help when you need it.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="contact.html" class="btn-secondary">Send a Message</a>
      </div>
    </div>
  </section>

  ${generateFooter(data)}`;

  return htmlShell({
    metaTitle: content?.metaTitle || `${data.primaryKeyword} FAQ | ${data.businessName} — ${data.city}`,
    metaDescription: content?.metaDescription || `Common questions about ${data.primaryKeyword.toLowerCase()} answered by ${data.businessName} in ${data.city}, ${data.state}. Get expert answers and call for help.`,
    canonicalUrl,
    theme,
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [generateFAQSchema(allFaqs)],
    bodyContent: body,
  });
}

// ─── CALCULATOR PAGES ───────────────────────────────────────────────────────

const CALCULATORS = [
  { slug: 'cost-estimator',      title: 'Cost Estimator',         icon: 'dollar', desc: 'Estimate water damage restoration costs based on area size, water category, and severity of damage.' },
  { slug: 'drying-time',         title: 'Drying Time',            icon: 'clock',  desc: 'Calculate how many days structural drying will take based on material type, humidity, and area size.' },
  { slug: 'mold-risk',           title: 'Mold Risk Assessment',   icon: 'mold', desc: 'Assess the risk of mold growth based on time since damage, humidity levels, and temperature.' },
  { slug: 'insurance-estimator', title: 'Insurance Estimator',    icon: 'insurance', desc: 'Estimate your expected insurance claim payout based on damage type, total cost, and deductible.' },
  { slug: 'dehumidifier-sizing', title: 'Dehumidifier Sizing',    icon: 'water', desc: 'Find the right dehumidifier capacity (pints/day) for your water-damaged space.' },
  { slug: 'restore-vs-replace',  title: 'Restore vs Replace',     icon: 'hammer', desc: 'Determine whether damaged flooring, drywall, or other materials should be restored or replaced.' },
];

export function generateCalculatorPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/calculator`;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');
  const calc = (data as any)._calculator;

  if (!isRestoration && calc && calc.enabled) {
    const activeTabs = calc.tabs || [];
    
    // Tab buttons
    const tabBtnsHTML = activeTabs.length > 1 ? `
      <div class="calc-tabs" role="tablist">
        ${activeTabs.map((tab: any, idx: number) => `
          <button class="calc-tab-btn ${idx === 0 ? 'active' : ''}" role="tab" aria-selected="${idx === 0}" data-tab="${tab.id}">
            ${tab.label}
          </button>
        `).join('')}
      </div>
    ` : '';

    // Tab forms
    const tabContentsHTML = activeTabs.map((tab: any, tabIdx: number) => `
      <div class="calc-tab-content ${tabIdx === 0 ? 'active' : ''}" id="tab-content-${tab.id}" data-tab="${tab.id}">
        <form class="calc-form" id="form-${tab.id}" onsubmit="return false;">
          <input type="hidden" name="baseMin" value="${tab.baseMin}">
          <input type="hidden" name="baseMax" value="${tab.baseMax}">
          
          ${tab.fields.map((field: any) => `
            <div class="form-group">
              ${field.type === 'checkbox' ? `
                <label class="checkbox-label">
                  <input type="checkbox" name="${field.id}" data-adder="${field.adder || 0}">
                  <span class="checkbox-text">${field.label}</span>
                </label>
              ` : `
                <label for="${tab.id}-${field.id}">${field.label}</label>
                ${field.type === 'select' ? `
                  <select name="${field.id}" id="${tab.id}-${field.id}">
                    ${field.options ? field.options.map((opt: any) => `
                      <option value="${opt.value}">${opt.label}</option>
                    `).join('') : ''}
                  </select>
                ` : `
                  <input type="number" name="${field.id}" id="${tab.id}-${field.id}" min="1" value="1">
                `}
              `}
            </div>
          `).join('')}
          
          <div class="calc-result-box">
            <div class="calc-result-title">${tab.resultLabel || 'Estimated Cost'}</div>
            <div class="calc-result-value" id="result-${tab.id}">
              $${tab.baseMin} - $${tab.baseMax}
            </div>
            <p class="calc-result-disclaimer">*This is a rough estimate. For an exact quote, request a free assessment.</p>
          </div>
        </form>
      </div>
    `).join('');

    const body = `
    ${generateNav(data)}

    <div class="breadcrumb container">
      <a href="index.html">Home</a>
      <span>›</span>
      <span aria-current="page">Calculators</span>
    </div>

    <section class="page-hero" role="banner">
      <div class="container">
        <h1>${capitalizeHeading(calc.title || data.primaryKeyword + ' Cost Estimator')}</h1>
        <p>Get a quick, upfront price estimate for your project. Choose options below to see estimated pricing ranges based on your needs.</p>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        ${tabBtnsHTML}
        ${tabContentsHTML}
      </div>
    </section>

    <section style="background:#f8fafc;padding:3rem 0;">
      <div class="container" style="text-align:center;">
        <h2>Need an Accurate Assessment?</h2>
        <p style="color:#475569;max-width:600px;margin:0 auto 1.5rem;">Estimators provide a starting range. For a precise and binding project quote, contact ${data.businessName}. Free on-site evaluations in ${data.city}.</p>
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
      </div>
    </section>

    ${generateFooter(data)}`;

    const calcJSFunctions = `
      // Tab switching
      const tabBtns = document.querySelectorAll('.calc-tab-btn');
      const tabContents = document.querySelectorAll('.calc-tab-content');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          
          tabBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          tabContents.forEach(c => c.classList.remove('active'));
          
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          const activeContent = document.getElementById('tab-content-' + tabId);
          if (activeContent) {
            activeContent.classList.add('active');
          }
        });
      });
      
      // Calculation engine
      const forms = document.querySelectorAll('.calc-form');
      
      function calculateForm(form) {
        const tabContent = form.closest('.calc-tab-content');
        if (!tabContent) return;
        const tabId = tabContent.getAttribute('data-tab');
        const baseMin = parseFloat(form.querySelector('input[name="baseMin"]').value) || 0;
        const baseMax = parseFloat(form.querySelector('input[name="baseMax"]').value) || 0;
        
        let min = baseMin;
        let max = baseMax;
        
        // Select fields (multipliers)
        form.querySelectorAll('select').forEach(select => {
          const val = parseFloat(select.value) || 1.0;
          min *= val;
          max *= val;
        });
        
        // Checkbox fields (adders)
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
          const adder = parseFloat(checkbox.getAttribute('data-adder')) || 0;
          min += adder;
          max += adder;
        });
        
        // Number fields (multipliers)
        form.querySelectorAll('input[type="number"]').forEach(numInput => {
          const val = parseFloat(numInput.value) || 1.0;
          min *= val;
          max *= val;
        });
        
        const resultEl = document.getElementById('result-' + tabId);
        if (resultEl) {
          const labelEl = resultEl.previousElementSibling;
          const isTime = labelEl && (labelEl.textContent.toLowerCase().includes('time') || labelEl.textContent.toLowerCase().includes('day'));
          if (isTime) {
            resultEl.textContent = Math.round(min) + ' - ' + Math.round(max) + ' Days';
          } else {
            resultEl.textContent = '$' + Math.round(min).toLocaleString() + ' - $' + Math.round(max).toLocaleString();
          }
        }
      }
      
      forms.forEach(form => {
        form.addEventListener('input', () => calculateForm(form));
        form.addEventListener('change', () => calculateForm(form));
        calculateForm(form);
      });
    `;

    const calcCSS = `
    .calc-tabs { display: flex; justify-content: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
    .calc-tab-btn { background: none; border: none; font-family: inherit; font-size: 1.1rem; font-weight: 600; color: #64748b; padding: 0.5rem 1rem; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .calc-tab-btn.active { color: ${theme.primaryColor}; background: ${theme.primaryColor}10; }
    .calc-tab-btn:hover:not(.active) { color: #334155; background: #f1f5f9; }
    .calc-tab-content { display: none; }
    .calc-tab-content.active { display: block; animation: calcFadeIn 0.3s ease-in-out; }
    @keyframes calcFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .calc-form { max-width: 600px; margin: 0 auto; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: #334155; }
    .form-group select, .form-group input[type="number"] { width: 100%; padding: 0.75rem; border-radius: 8px; border: 1.5px solid #cbd5e1; font-family: inherit; font-size: 1rem; color: #1e293b; outline: none; transition: border-color 0.2s; }
    .form-group select:focus, .form-group input[type="number"]:focus { border-color: ${theme.primaryColor}; }
    .checkbox-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
    .checkbox-label input[type="checkbox"] { width: 1.2rem; height: 1.2rem; accent-color: ${theme.primaryColor}; cursor: pointer; }
    .checkbox-text { font-weight: 600; color: #334155; }
    .calc-result-box { margin-top: 2.5rem; background: linear-gradient(135deg, ${theme.primaryColor}08, ${theme.secondaryColor}0c); border: 1px solid ${theme.primaryColor}15; border-radius: 12px; padding: 2rem; text-align: center; }
    .calc-result-title { font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
    .calc-result-value { font-size: 2.25rem; font-weight: 800; color: ${theme.primaryColor}; margin-bottom: 0.5rem; }
    .calc-result-disclaimer { font-size: 0.8rem; color: #64748b; }
    `;

    return htmlShell({
      metaTitle: `${calc.title || data.primaryKeyword + ' Cost Estimator'} | ${data.businessName}`,
      metaDescription: `Get an instant price estimate for ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state} with our online estimator tool.`,
      canonicalUrl,
      theme,
      googleAnalyticsId: data.googleAnalyticsId || undefined,
      faviconUrl: data.faviconUrl || undefined,
      customHeadCode: data.customHeadCode || undefined,
      schemaBlocks: [generateLocalBusinessSchema(data, `${domain}.netlify.app`)],
      bodyContent: body,
      extraJs: calcJSFunctions,
      extraCSS: calcCSS,
    });
  } else {
    // Generate standard water damage calculators (the existing code)
    const cardsHTML = CALCULATORS.map(c => `
      <a href="calculators/${c.slug}.html" class="calc-card">
        <div class="calc-card-icon">${iconToSVG(c.icon, theme.secondaryColor)}</div>
        <h2 class="calc-card-title">${c.title}</h2>
        <p class="calc-card-desc">${c.desc}</p>
        <span class="calc-card-link">Open Calculator →</span>
      </a>`).join('');

    const body = `
    ${generateNav(data)}

    <div class="breadcrumb container">
      <a href="index.html">Home</a>
      <span>›</span>
      <span aria-current="page">Calculators</span>
    </div>

    <section class="page-hero" role="banner">
      <div class="container">
        <h1>${capitalizeHeading(data._calcPageH1 || 'Free ' + (data.primaryKeyword || 'Water Damage') + ' Calculators')}</h1>
        <p>Estimate costs, drying time, mold risk, insurance payouts, and more. These tools give you a starting point — for exact figures, call us for a free on-site assessment.</p>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="calc-cards-grid">
          ${cardsHTML}
        </div>
      </div>
    </section>

    <section style="background:#f8fafc;padding:3rem 0;">
      <div class="container" style="text-align:center;">
        <h2>Need an Accurate Assessment?</h2>
        <p style="color:#475569;max-width:600px;margin:0 auto 1.5rem;">Calculators provide estimates only. For a precise assessment and written estimate, contact ${data.businessName}. Free on-site evaluations in ${data.city}.</p>
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
      </div>
    </section>

    ${generateFooter(data)}`;

    return htmlShell({
      metaTitle: `Free ${data.primaryKeyword || 'Water Damage'} Calculators | ${data.businessName}`,
      metaDescription: `Free ${data.primaryKeyword?.toLowerCase() || 'water damage'} calculators for ${data.city} homeowners — cost estimator, drying time, mold risk, insurance, dehumidifier sizing, and more.`,
      canonicalUrl,
      theme,
      googleAnalyticsId: data.googleAnalyticsId || undefined,
      faviconUrl: data.faviconUrl || undefined,
      customHeadCode: data.customHeadCode || undefined,
      schemaBlocks: [generateLocalBusinessSchema(data, `${domain}.netlify.app`)],
      bodyContent: body,
      extraCSS: `
  .calc-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  .calc-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 2rem 1.75rem;
    text-decoration: none;
    color: inherit;
    transition: transform .2s, box-shadow .2s, border-color .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
  }
  .calc-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,.1);
    border-color: ${theme.primaryColor};
  }
  .calc-card-icon { margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, ${theme.primaryColor}12, ${theme.secondaryColor}15); }
  .calc-card-icon svg { width: 28px; height: 28px; }
  .calc-card-title { font-size: 1.2rem; font-weight: 700; color: ${theme.primaryColor}; margin: 0 0 .5rem; }
  .calc-card-desc { color: #475569; font-size: .9rem; line-height: 1.6; flex: 1; }
  .calc-card-link {
    display: inline-block;
    margin-top: 1rem;
    font-size: .85rem;
    font-weight: 700;
    color: ${theme.secondaryColor};
  }
  @media (max-width: 640px) {
    .calc-cards-grid { grid-template-columns: 1fr; }
  }`,
    });
  }
}

// Individual calculator page generator
function generateSingleCalculatorPage(data: WDBusinessData, calcIndex: number, domain: string): string {
  const theme = resolveTheme(data);
  const calc = CALCULATORS[calcIndex];
  const canonicalUrl = `${getSiteUrl(data, domain)}/calculators/${calc.slug}`;
  const prefix = '../';

  // Navigation links for other calculators
  const otherCalcsHTML = CALCULATORS.filter((_, i) => i !== calcIndex).map(c => `
    <a href="${c.slug}.html" class="other-calc-card">
      <span class="other-calc-icon">${iconToSVG(c.icon, theme.secondaryColor)}</span>
      <span class="other-calc-name">${c.title}</span>
    </a>`).join('');

  // Per-calculator form HTML
  const formHTML = [
    // 0: Cost Estimator
    `<div class="calc-field">
      <label for="cost-sqft">Affected Area (sq ft)</label>
      <input type="number" id="cost-sqft" placeholder="e.g. 200" min="1">
    </div>
    <div class="calc-field">
      <label for="cost-category">Water Category</label>
      <select id="cost-category">
        <option value="1">Category 1 — Clean water (burst pipe, appliance)</option>
        <option value="2">Category 2 — Gray water (washing machine, dishwasher)</option>
        <option value="3">Category 3 — Black water (sewage, flooding)</option>
      </select>
    </div>
    <div class="calc-field calc-check">
      <label><input type="checkbox" id="cost-structural"> Structural damage present (wet drywall, flooring, framing)</label>
    </div>
    <div class="calc-field calc-check">
      <label><input type="checkbox" id="cost-mold"> Mold growth visible or suspected</label>
    </div>
    <button class="calc-btn" onclick="calculate()">Calculate Estimate</button>`,

    // 1: Drying Time
    `<div class="calc-field">
      <label for="dry-sqft">Affected Area (sq ft)</label>
      <input type="number" id="dry-sqft" placeholder="e.g. 300" min="1">
    </div>
    <div class="calc-field">
      <label for="dry-material">Primary Material Affected</label>
      <select id="dry-material">
        <option value="drywall">Drywall / Gypsum board</option>
        <option value="wood">Wood framing / Hardwood floors</option>
        <option value="concrete">Concrete slab / Block</option>
        <option value="carpet">Carpet / Pad</option>
      </select>
    </div>
    <div class="calc-field">
      <label for="dry-humidity">Current Indoor Humidity (%)</label>
      <input type="number" id="dry-humidity" placeholder="e.g. 65" min="20" max="100">
    </div>
    <button class="calc-btn" onclick="calculate()">Calculate Drying Time</button>`,

    // 2: Mold Risk
    `<div class="calc-field">
      <label for="mold-hours">Hours Since Water Damage Occurred</label>
      <input type="number" id="mold-hours" placeholder="e.g. 18" min="0">
    </div>
    <div class="calc-field">
      <label for="mold-humidity">Current Humidity in Affected Area (%)</label>
      <input type="number" id="mold-humidity" placeholder="e.g. 75" min="0" max="100">
    </div>
    <div class="calc-field">
      <label for="mold-temp">Temperature in Affected Area (°F)</label>
      <input type="number" id="mold-temp" placeholder="e.g. 72" min="32" max="110">
    </div>
    <button class="calc-btn" onclick="calculate()">Assess Mold Risk</button>`,

    // 3: Insurance Estimator
    `<div class="calc-field">
      <label for="ins-covered">Type of Water Damage</label>
      <select id="ins-covered">
        <option value="yes">Sudden/accidental — burst pipe, appliance, storm leak</option>
        <option value="no">Flood water from outside (river, storm surge)</option>
        <option value="maybe">Gradual leak or seepage</option>
      </select>
    </div>
    <div class="calc-field">
      <label for="ins-total">Total Estimated Damage ($)</label>
      <input type="number" id="ins-total" placeholder="e.g. 8000" min="0">
    </div>
    <div class="calc-field">
      <label for="ins-deductible">Your Policy Deductible ($)</label>
      <input type="number" id="ins-deductible" placeholder="e.g. 1000" min="0">
    </div>
    <button class="calc-btn" onclick="calculate()">Estimate Payout</button>`,

    // 4: Dehumidifier Sizing
    `<div class="calc-field">
      <label for="dh-sqft">Area to Dehumidify (sq ft)</label>
      <input type="number" id="dh-sqft" placeholder="e.g. 400" min="1">
    </div>
    <div class="calc-field">
      <label for="dh-level">Current Moisture Level</label>
      <select id="dh-level">
        <option value="slightly">Slightly damp — visible moisture, no standing water</option>
        <option value="moderately">Moderately wet — soaked materials, some standing water</option>
        <option value="very">Extremely wet — significant flooding, saturated structure</option>
      </select>
    </div>
    <div class="calc-field calc-check">
      <label><input type="checkbox" id="dh-basement"> Basement or below-grade space</label>
    </div>
    <button class="calc-btn" onclick="calculate()">Calculate Capacity</button>`,

    // 5: Restore vs Replace
    `<div class="calc-field">
      <label for="rv-material">Material Type</label>
      <select id="rv-material">
        <option value="hardwood">Hardwood flooring</option>
        <option value="carpet">Carpet</option>
        <option value="laminate">Laminate flooring</option>
        <option value="drywall">Drywall</option>
        <option value="tile">Tile flooring</option>
        <option value="subfloor">Subfloor / OSB</option>
      </select>
    </div>
    <div class="calc-field">
      <label for="rv-damage">Estimated Damage (%)</label>
      <input type="number" id="rv-damage" placeholder="e.g. 40" min="0" max="100">
    </div>
    <div class="calc-field">
      <label for="rv-age">Material Age (years)</label>
      <input type="number" id="rv-age" placeholder="e.g. 8" min="0">
    </div>
    <button class="calc-btn" onclick="calculate()">Get Recommendation</button>`,
  ][calcIndex];

  // Per-calculator info paragraph
  const infoParagraphs = [
    `<p>Understanding restoration costs upfront helps you budget, negotiate with insurance adjusters, and avoid surprises. Actual costs depend on local labor rates, extent of hidden damage, and drying time required. Category 1 (clean water) is the least expensive, while Category 3 (sewage or flood) requires specialized hazmat protocols that increase costs significantly.</p>
    <h3>What Affects Cost?</h3>
    <ul>
      <li><strong>Water category</strong> — Clean water is cheapest; sewage requires hazmat procedures</li>
      <li><strong>Area size</strong> — Larger areas need more equipment and labor hours</li>
      <li><strong>Structural damage</strong> — Wet drywall, warped framing, or compromised subfloor adds 30–40% to costs</li>
      <li><strong>Mold presence</strong> — Active mold growth requires containment and remediation, adding 25–35%</li>
      <li><strong>Access difficulty</strong> — Crawlspaces, multi-story, or hard-to-reach areas increase labor</li>
    </ul>`,

    `<p>Structural drying time determines how long equipment stays in your property and directly affects restoration costs and inconvenience. IICRC standards require drying to equilibrium moisture content (EMC) before any reconstruction begins.</p>
    <h3>Factors That Affect Drying Time</h3>
    <ul>
      <li><strong>Material type</strong> — Concrete absorbs deeply and dries slowest; carpet dries fastest</li>
      <li><strong>Humidity</strong> — High ambient humidity slows evaporation significantly</li>
      <li><strong>Air movement</strong> — Industrial air movers are 4–5× more effective than household fans</li>
      <li><strong>Temperature</strong> — Warmer conditions accelerate drying</li>
      <li><strong>Equipment count</strong> — Professional setups use 1 air mover per 10–16 linear feet of wall</li>
    </ul>`,

    `<p>Mold can begin colonizing within 24–48 hours of water intrusion. Understanding risk factors helps you act before visible growth appears. The three conditions mold needs are moisture, warmth (60–90°F), and organic material (wood, drywall, carpet).</p>
    <h3>Risk Levels Explained</h3>
    <ul>
      <li><strong>Low risk</strong> — Damage caught early, low humidity, or cold temperatures slow growth</li>
      <li><strong>Moderate risk</strong> — Conditions favor growth; professional drying should begin immediately</li>
      <li><strong>High risk</strong> — Mold spores likely active; antimicrobial treatment recommended</li>
      <li><strong>Critical</strong> — Mold may already be established; containment and remediation required</li>
    </ul>`,

    `<p>Insurance claims for water damage can be complex. Standard homeowner policies typically cover sudden and accidental damage (burst pipes, appliance failures) but exclude flood damage, which requires separate flood insurance. Gradual leaks may or may not be covered depending on your policy.</p>
    <h3>Tips for Maximizing Your Claim</h3>
    <ul>
      <li><strong>Document everything</strong> — Photos, videos, inventory of damaged items</li>
      <li><strong>Don't throw anything away</strong> — Until the adjuster has documented it</li>
      <li><strong>Start mitigation immediately</strong> — Insurance requires you to prevent further damage</li>
      <li><strong>Get a professional estimate</strong> — Independent estimates strengthen your claim</li>
      <li><strong>Keep all receipts</strong> — Emergency hotel, meals, and temporary expenses</li>
    </ul>`,

    `<p>Proper dehumidification is critical for structural drying. Consumer-grade dehumidifiers (30–70 pints/day) are useful for maintenance but inadequate for water damage restoration. Professionals use industrial LGR (Low Grain Refrigerant) dehumidifiers rated at 70–200+ pints/day, paired with air movers for optimal evaporation.</p>
    <h3>Sizing Guidelines</h3>
    <ul>
      <li><strong>Light dampness</strong> — 0.1 pints per sq ft/day baseline</li>
      <li><strong>Moderate saturation</strong> — 0.14 pints per sq ft/day baseline</li>
      <li><strong>Heavy flooding</strong> — 0.2+ pints per sq ft/day baseline</li>
      <li><strong>Basement spaces</strong> — Add 20% capacity for below-grade moisture</li>
      <li><strong>HVAC integration</strong> — Use return air ducts to improve air circulation</li>
    </ul>`,

    `<p>The restore-vs-replace decision depends on material type, damage extent, and material age. Restoring is usually cheaper if damage is under 30% and the material is in good condition. Older or heavily damaged materials should be replaced to prevent future problems like warping, delamination, or mold recurrence.</p>
    <h3>Material-Specific Notes</h3>
    <ul>
      <li><strong>Hardwood</strong> — Often restorable if caught early; professional sanding and refinishing can save floors</li>
      <li><strong>Carpet</strong> — Pad almost always needs replacement; carpet itself can sometimes be cleaned and dried</li>
      <li><strong>Laminate</strong> — Usually must be replaced as it cannot be re-dried without warping</li>
      <li><strong>Drywall</strong> — If saturated above 2 feet, replacement is standard practice</li>
      <li><strong>Tile</strong> — Tile itself survives well; concern is usually subfloor and grout integrity</li>
    </ul>`,
  ][calcIndex];

  // Per-calculator JS
  const calcJSFunctions = [
    // Cost
    `function calculate() {
  const sqft = parseFloat(document.getElementById('cost-sqft').value) || 0;
  const cat = parseInt(document.getElementById('cost-category').value) || 1;
  const str = document.getElementById('cost-structural').checked;
  const mld = document.getElementById('cost-mold').checked;
  let base = sqft * (cat === 1 ? 3.5 : cat === 2 ? 5.5 : 8);
  if (str) base *= 1.4;
  if (mld) base *= 1.35;
  const lo = Math.round(base * 0.8 / 50) * 50;
  const hi = Math.round(base * 1.3 / 50) * 50;
  document.getElementById('calc-result').innerHTML =
    '<strong>Estimated Range: $' + lo.toLocaleString() + ' – $' + hi.toLocaleString() + '</strong>' +
    '<p style="margin-top:.5rem;font-size:.85rem;color:#64748b;">This is a rough estimate. Actual costs depend on local rates, hidden damage, and materials. Call for a free on-site assessment.</p>';
}`,
    // Drying
    `function calculate() {
  const sqft = parseFloat(document.getElementById('dry-sqft').value) || 0;
  const mat = document.getElementById('dry-material').value;
  const hum = parseFloat(document.getElementById('dry-humidity').value) || 50;
  let base = mat === 'drywall' ? 3.5 : mat === 'concrete' ? 5 : mat === 'wood' ? 4.5 : 3;
  if (hum > 70) base += 1.5; else if (hum > 55) base += 0.5;
  if (sqft > 500) base += 1;
  if (sqft > 1000) base += 1;
  const lo = Math.max(2, Math.floor(base));
  const hi = Math.ceil(base + 2);
  document.getElementById('calc-result').innerHTML =
    '<strong>Estimated Drying Time: ' + lo + '–' + hi + ' days</strong>' +
    '<p style="margin-top:.5rem;font-size:.85rem;color:#64748b;">Actual drying time depends on equipment, airflow, and initial moisture levels. We measure daily and remove equipment only when targets are met.</p>';
}`,
    // Mold
    `function calculate() {
  const hrs = parseFloat(document.getElementById('mold-hours').value) || 0;
  const hum = parseFloat(document.getElementById('mold-humidity').value) || 50;
  const tmp = parseFloat(document.getElementById('mold-temp').value) || 70;
  let s = 0;
  if (hrs > 48) s += 3; else if (hrs > 24) s += 2; else if (hrs > 12) s += 1;
  if (hum > 80) s += 3; else if (hum > 65) s += 2; else if (hum > 55) s += 1;
  if (tmp >= 70 && tmp <= 90) s += 2; else if (tmp >= 60) s += 1;
  let lv, cl, ad;
  if (s <= 2) { lv='Low'; cl='#16a34a'; ad='Mold growth unlikely if drying begins promptly.'; }
  else if (s <= 4) { lv='Moderate'; cl='#d97706'; ad='Conditions favor mold. Professional drying with antimicrobial treatment recommended.'; }
  else if (s <= 6) { lv='High'; cl='#dc2626'; ad='Significant mold risk. Immediate professional response strongly advised.'; }
  else { lv='Critical'; cl='#7c3aed'; ad='Mold may already be present. Immediate remediation required.'; }
  document.getElementById('calc-result').innerHTML =
    '<strong style="color:'+cl+'">Mold Risk: '+lv+'</strong><p style="margin-top:.5rem;font-size:.85rem;color:#475569;">'+ad+'</p>';
}`,
    // Insurance
    `function calculate() {
  const tot = parseFloat(document.getElementById('ins-total').value) || 0;
  const ded = parseFloat(document.getElementById('ins-deductible').value) || 0;
  const cov = document.getElementById('ins-covered').value;
  if (cov === 'no') {
    document.getElementById('calc-result').innerHTML = '<strong>Flood damage typically requires separate flood insurance and is not covered by standard homeowner policies.</strong>';
    return;
  }
  const pay = Math.max(0, tot - ded);
  document.getElementById('calc-result').innerHTML =
    '<strong>Estimated Insurance Payout: $'+pay.toLocaleString()+'</strong>' +
    '<p style="margin-top:.5rem;font-size:.85rem;color:#64748b;">After your $'+ded.toLocaleString()+' deductible. Actual payout depends on policy terms and adjuster assessment.</p>';
}`,
    // Dehumidifier
    `function calculate() {
  const sqft = parseFloat(document.getElementById('dh-sqft').value) || 0;
  const lev = document.getElementById('dh-level').value;
  const bsmt = document.getElementById('dh-basement').checked;
  let ppd = sqft * (lev === 'slightly' ? 0.1 : lev === 'moderately' ? 0.14 : 0.2);
  if (bsmt) ppd *= 1.2;
  const lo = Math.ceil(ppd / 10) * 10;
  const hi = lo + 20;
  document.getElementById('calc-result').innerHTML =
    '<strong>Recommended Capacity: '+lo+'–'+hi+' pints/day</strong>' +
    '<p style="margin-top:.5rem;font-size:.85rem;color:#64748b;">Consumer units max ~70 pints/day. Water damage restoration uses industrial LGR dehumidifiers (70–200+ pints/day).</p>';
}`,
    // Restore vs Replace
    `function calculate() {
  const mat = document.getElementById('rv-material').value;
  const dmg = parseInt(document.getElementById('rv-damage').value) || 0;
  const age = parseInt(document.getElementById('rv-age').value) || 0;
  let sc = 0;
  if (dmg < 30) sc += 3; else if (dmg < 60) sc += 1;
  if (age < 5) sc += 2; else if (age < 15) sc += 1;
  if (mat === 'hardwood') sc += 2; else if (mat === 'tile') sc += 1;
  let rec, reason;
  if (sc >= 5) { rec='Restore'; reason='Low damage, younger material, and material type support restoration.'; }
  else if (sc >= 3) { rec='Restore (Borderline)'; reason='Restoration may be viable. A professional assessment is recommended.'; }
  else { rec='Replace'; reason='High damage, older material, or type that does not dry well makes replacement more practical.'; }
  document.getElementById('calc-result').innerHTML =
    '<strong>Recommendation: '+rec+'</strong><p style="margin-top:.5rem;font-size:.85rem;color:#475569;">'+reason+'</p>';
}`,
  ][calcIndex];

  const body = `
  ${generateNav(data, 'calculators/' + calc.slug)}

  <div class="breadcrumb container">
    <a href="${prefix}index.html">Home</a>
    <span>›</span>
    <a href="${prefix}calculator.html">Calculators</a>
    <span>›</span>
    <span aria-current="page">${capitalizeHeading(calc.title)}</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <div style="margin-bottom:.75rem;color:#fff;opacity:.85;">${iconToSVG(calc.icon, '#fff')}</div>
      <h1>${capitalizeHeading(calc.title)} Calculator</h1>
      <p>${calc.desc}</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container" style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:start;">
      <div>
        <div class="calc-form">
          ${formHTML}
          <div class="calc-result" id="calc-result"></div>
        </div>
      </div>
      <div class="calc-info">
        <h2>How This Calculator Works</h2>
        ${infoParagraphs}
        <div style="margin-top:1.5rem;padding:1rem 1.25rem;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
          <p style="font-size:.85rem;color:#0c4a6e;margin:0;">This calculator provides estimates only. For an accurate, free on-site assessment, call <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" style="color:${theme.primaryColor};font-weight:700;">${data.phone}</a>.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section" style="background:#f8fafc;">
    <div class="container">
      <h2 style="text-align:center;margin-bottom:1.5rem;">Other Calculators</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;">
        ${otherCalcsHTML}
      </div>
    </div>
  </section>

  <section class="cta-section">
    <div class="container" style="text-align:center;">
      <h2>Get a Free On-Site Assessment</h2>
      <p>For an accurate estimate tailored to your property, call ${data.businessName}.</p>
      <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary" style="margin-top:1rem;display:inline-block;"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
    </div>
  </section>

  ${generateFooter(data, 'calculators/')}`;

  const calcCSS = `
.calc-form {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
  padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
.calc-field { margin-bottom: 1.25rem; }
.calc-field label { display: block; font-weight: 600; margin-bottom: .4rem; font-size: .9rem; color: #334155; }
.calc-field input, .calc-field select {
  width: 100%; padding: .65rem .9rem; border: 1.5px solid #cbd5e1;
  border-radius: 8px; font-size: 1rem; font-family: inherit;
  background: #f8fafc; transition: border-color .15s; box-sizing: border-box;
}
.calc-field input:focus, .calc-field select:focus { outline: none; border-color: ${theme.primaryColor}; background: #fff; }
.calc-check label { display: flex; align-items: center; gap: .6rem; font-weight: 500; cursor: pointer; color: #475569; }
.calc-check input[type=checkbox] { width: 1.1rem; height: 1.1rem; accent-color: ${theme.primaryColor}; }
.calc-btn {
  background: ${theme.primaryColor}; color: #fff; border: none;
  padding: .8rem 2rem; border-radius: 8px; font-size: 1rem;
  font-weight: 700; cursor: pointer; margin-top: .5rem;
  transition: background .15s, transform .1s;
}
.calc-btn:hover { background: ${theme.secondaryColor}; transform: translateY(-1px); }
.calc-result {
  margin-top: 1.5rem; padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1.5px solid #bae6fd; border-radius: 10px;
  min-height: 3rem; font-size: 1rem; color: #0c4a6e;
}
.calc-info h2 { font-size: 1.35rem; color: ${theme.primaryColor}; margin-bottom: 1rem; }
.calc-info h3 { font-size: 1.05rem; color: #1e293b; margin: 1.25rem 0 .5rem; }
.calc-info p { color: #475569; line-height: 1.7; margin-bottom: .75rem; }
.calc-info ul { padding-left: 1.25rem; margin-bottom: 1rem; }
.calc-info li { color: #475569; line-height: 1.7; margin-bottom: .4rem; }
.other-calc-card {
  display: flex; align-items: center; gap: .75rem;
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: .75rem 1rem; text-decoration: none; color: #1e293b;
  transition: border-color .2s, transform .15s;
}
.other-calc-card:hover { border-color: ${theme.primaryColor}; transform: translateY(-2px); }
.other-calc-icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex-shrink: 0; }
.other-calc-icon svg { width: 22px; height: 22px; }
.other-calc-name { font-weight: 600; font-size: .875rem; }
@media (max-width: 768px) {
  .content-section > .container { grid-template-columns: 1fr !important; }
}`;

  const fullTheme = resolveTheme(data);
  const fontUrl = FONT_URLS[fullTheme.fontFamily];
  const fontLink = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  const schemas = [generateLocalBusinessSchema(data, `${domain}.netlify.app`)]
    .map(s => `<script type="application/ld+json">\n${s}\n</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle(`${calc.title} Calculator | ${data.businessName} — ${data.city}`)}</title>
  <meta name="description" content="${seoDescription(`Free ${calc.title.toLowerCase()} calculator for ${data.city} homeowners. ${calc.desc}`)}">
  <link rel="canonical" href="${canonicalUrl}">
  ${data.faviconUrl ? `<link rel="icon" type="image/png" href="${data.faviconUrl}">
  <link rel="shortcut icon" href="${data.faviconUrl}">` : ''}
  ${fontLink}
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:title" content="${seoTitle(`${calc.title} Calculator | ${data.businessName}`)}">
  <meta property="og:description" content="${seoDescription(`Free ${calc.title.toLowerCase()} calculator for ${data.city} homeowners. ${calc.desc}`)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${data.businessName}">
  ${data.logoUrl || data.faviconUrl ? `<meta property="og:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  <meta name="twitter:card" content="${data.logoUrl || data.faviconUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${seoTitle(`${calc.title} Calculator | ${data.businessName}`)}">
  <meta name="twitter:description" content="${seoDescription(`Free ${calc.title.toLowerCase()} calculator for ${data.city} homeowners. ${calc.desc}`)}">
  ${data.logoUrl || data.faviconUrl ? `<meta name="twitter:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  ${schemas}
  ${data.googleAnalyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${data.googleAnalyticsId}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.googleAnalyticsId}');</script>` : ''}
  ${data.customHeadCode ? data.customHeadCode.trim() : ''}
  <style>
    ${generateCSS(fullTheme)}
    ${calcCSS}
  </style>
</head>
<body>
  ${body}
  <script>
    ${generateJS()}
    ${calcJSFunctions}
  </script>
</body>
</html>`;
}

// ─── GALLERY PAGE ──────────────────────────────────────────────────────────

export function generateGalleryPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/gallery`;
  const showBeforeAfter = !(data as any).hideBeforeAfter;

  const images = data.galleryImages || [];
  const beforeAfterPairs: Array<{ before: WDGalleryImage; after: WDGalleryImage }> = [];
  const normalImages: WDGalleryImage[] = [];

  // Pair before/after images by pairId
  const beforeMap = new Map<string, WDGalleryImage>();
  const afterMap = new Map<string, WDGalleryImage>();
  images.forEach(img => {
    if (img.type === 'before' && img.pairId) beforeMap.set(img.pairId, img);
    else if (img.type === 'after' && img.pairId) afterMap.set(img.pairId, img);
    else if (img.type === 'normal' && img.src) normalImages.push(img);
  });
  beforeMap.forEach((before, id) => {
    const after = afterMap.get(id);
    // Only include pair if BOTH images have actual uploaded sources (not empty)
    if (after && before.src && after.src) beforeAfterPairs.push({ before, after });
  });

  // Default placeholder before/after pairs if none provided
  const defaultPairs = getCategoryBeforeAfterPairs(data);

  const displayPairs = beforeAfterPairs.length > 0 ? beforeAfterPairs : defaultPairs;

  const defaultNormal: WDGalleryImage[] = getCategoryGalleryPhotos(data);

  const displayNormal = normalImages.length > 0 ? normalImages : defaultNormal;

  const beforeAfterHTML = displayPairs.map((pair, i) => `
    <div class="ba-item">
      <div class="ba-slider" data-pair="${i}">
        <div class="ba-after">
          <img src="${pair.after.src}" alt="${pair.after.alt}" loading="lazy" data-placeholder="gallery-after-${i}">
        </div>
        <div class="ba-before">
          <img src="${pair.before.src}" alt="${pair.before.alt}" loading="lazy" data-placeholder="gallery-before-${i}">
        </div>
        <div class="ba-handle" aria-label="Drag to compare before and after">
          <div class="ba-handle-line"></div>
          <div class="ba-handle-circle">◀▶</div>
          <div class="ba-handle-line"></div>
        </div>
      </div>
      <div class="ba-labels">
        <span class="ba-label-before">Before</span>
        <span class="ba-label-after">After</span>
      </div>
      ${pair.before.caption ? `<p class="img-caption">${pair.before.caption}</p>` : ''}
    </div>`).join('');

  const normalGridHTML = displayNormal.map((img, i) => `
    <div class="gallery-item">
      <img
        src="${img.src}"
        alt="${img.alt}"
        loading="lazy"
        data-placeholder="gallery-normal-${i}"
        onclick="openLightbox(this)"
        style="cursor:pointer;"
      >
      ${img.caption ? `<p class="img-caption">${img.caption}</p>` : ''}
    </div>`).join('');

  const galleryJS = showBeforeAfter ? `
// Before/After Slider
document.querySelectorAll('.ba-slider').forEach(slider => {
  const before = slider.querySelector('.ba-before');
  const handle = slider.querySelector('.ba-handle');
  let isDragging = false;

  function setPos(x) {
    const rect = slider.getBoundingClientRect();
    let pct = Math.min(Math.max((x - rect.left) / rect.width * 100, 0), 100);
    before.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
    handle.style.left = pct + '%';
  }

  // Initialise at 50%
  before.style.clipPath = 'inset(0 50% 0 0)';
  handle.style.left = '50%';

  handle.addEventListener('mousedown', e => { isDragging = true; e.preventDefault(); });
  handle.addEventListener('touchstart', e => { isDragging = true; }, { passive: true });
  document.addEventListener('mousemove', e => { if (isDragging) setPos(e.clientX); });
  document.addEventListener('touchmove', e => { if (isDragging) setPos(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('mouseup', () => { isDragging = false; });
  document.addEventListener('touchend', () => { isDragging = false; });
  slider.addEventListener('mousedown', e => { if (e.target !== handle && !handle.contains(e.target)) { isDragging = true; setPos(e.clientX); } });
  slider.addEventListener('click', e => setPos(e.clientX));
});

// Lightbox
function openLightbox(img) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-img').alt = img.alt;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', () => { lb.style.display = 'none'; document.body.style.overflow = ''; });
  }
});
` : `
// Lightbox
function openLightbox(img) {
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-img').src = img.src;
  document.getElementById('lb-img').alt = img.alt;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', () => { lb.style.display = 'none'; document.body.style.overflow = ''; });
  }
});
`;

  const galleryCSS = `
.ba-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 2rem; margin-top: 2rem; }
.ba-item {}
.ba-slider { position: relative; overflow: hidden; border-radius: 10px; cursor: ew-resize; user-select: none; aspect-ratio: 4/3; }
.ba-after, .ba-before { position: absolute; inset: 0; }
.ba-after img, .ba-before img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ba-before { clip-path: inset(0 50% 0 0); }
.ba-handle { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: all; cursor: ew-resize; }
.ba-handle-line { flex: 1; width: 2px; background: #fff; }
.ba-handle-circle { background: #fff; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: .65rem; color: #334155; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,.3); flex-shrink: 0; }
.ba-labels { display: flex; justify-content: space-between; margin-top: .5rem; }
.ba-label-before, .ba-label-after { font-size: .8rem; font-weight: 700; color: #64748b; }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 2rem; }
.gallery-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; transition: transform .2s; }
.gallery-item img:hover { transform: scale(1.02); }
#lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.9); z-index: 9999; align-items: center; justify-content: center; }
#lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
`;

  const fullTheme = resolveTheme(data);
  const fontUrl = FONT_URLS[fullTheme.fontFamily];
  const fontLink = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  const body = `
  ${generateNav(data)}

  <div class="breadcrumb container">
    <a href="index.html">Home</a>
    <span>›</span>
    <span aria-current="page">Gallery</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(data.primaryKeyword)} Gallery</h1>
      <p>Real before-and-after photos from ${data.primaryKeyword.toLowerCase()} projects in ${data.city} and surrounding areas. Replace placeholder images with your own work photos in the editor.</p>
    </div>
  </section>

  ${showBeforeAfter ? `
  <section class="content-section">
    <div class="container">
      <h2>Before &amp; After Comparisons</h2>
      <p class="section-intro">Drag the slider to compare before and after. <em>Replace placeholder images with real project photos in the editor.</em></p>
      <div class="ba-grid">
        ${beforeAfterHTML}
      </div>
    </div>
  </section>
  ` : ''}

  <section class="content-section" style="background:#f8fafc;">
    <div class="container">
      <h2>Project Photos</h2>
      <p class="section-intro">Photos from recent ${data.primaryKeyword.toLowerCase()} projects in ${data.city}. <em>Replace placeholder images with real photos in the editor.</em></p>
      <div class="gallery-grid">
        ${normalGridHTML}
      </div>
    </div>
  </section>

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">Need ${data.primaryKeyword} in ${data.city}?</h2>
      <p>Our team is ready to respond. Call now or request a free assessment.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="contact.html" class="btn-secondary">Get Free Estimate</a>
      </div>
    </div>
  </section>

  <!-- Lightbox -->
  <div id="lightbox" role="dialog" aria-label="Image viewer">
    <img id="lb-img" src="" alt="">
  </div>

  ${generateFooter(data)}`;

  const schemas = [generateLocalBusinessSchema(data, `${domain}.netlify.app`)]
    .map(s => `<script type="application/ld+json">\n${s}\n</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle(`${data.primaryKeyword} Gallery | ${data.businessName} — ${data.city}`)}</title>
  <meta name="description" content="${seoDescription(`Before and after ${data.primaryKeyword.toLowerCase()} photos from ${data.businessName} in ${data.city}, ${data.state}. See our work and results.`)}">
  <link rel="canonical" href="${canonicalUrl}">
  ${fontLink}
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:title" content="${seoTitle(`${data.primaryKeyword} Gallery | ${data.businessName} — ${data.city}`)}">
  <meta property="og:description" content="${seoDescription(`Before and after ${data.primaryKeyword.toLowerCase()} photos from ${data.businessName} in ${data.city}, ${data.state}. See our work and results.`)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${data.businessName}">
  ${data.logoUrl || data.faviconUrl ? `<meta property="og:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  <meta name="twitter:card" content="${data.logoUrl || data.faviconUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${seoTitle(`${data.primaryKeyword} Gallery | ${data.businessName} — ${data.city}`)}">
  <meta name="twitter:description" content="${seoDescription(`Before and after ${data.primaryKeyword.toLowerCase()} photos from ${data.businessName} in ${data.city}, ${data.state}. See our work and results.`)}">
  ${data.logoUrl || data.faviconUrl ? `<meta name="twitter:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  ${schemas}
  <style>
    ${generateCSS(fullTheme)}
    ${galleryCSS}
  </style>
</head>
<body>
  ${body}
  <script>
    ${generateJS()}
    ${galleryJS}
  </script>
</body>
</html>`;
}

// ─── BLOG ARCHIVE PAGE ─────────────────────────────────────────────────────

interface ProjectItem {
  title: string;
  desc: string;
  defaultImg: string;
  placeholderKey: string;
  alt: string;
}

function getCategoryProjects(data: WDBusinessData): ProjectItem[] {
  const categoryId = (data as any)._categoryId || (data as any).categoryId || 'water-damage';
  const city = data.city || 'your area';
  const categoryImages = (data as any)._categoryImages;
  const bizName = data.businessName || 'Our Team';

  switch (categoryId) {
    case 'dumpster-rental':
      return [
        {
          title: 'Residential Cleanout Dumpster',
          desc: `Delivered a 15-yard roll-off dumpster for a residential estate cleanout and garage purging project in ${city}.`,
          defaultImg: categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80',
          placeholderKey: 'gallery-normal-0',
          alt: `Residential cleanout dumpster delivery in ${city} by ${bizName}`
        },
        {
          title: 'Commercial Construction Waste Removal',
          desc: `Provided ongoing 30-yard dumpster rentals for drywall, wood, and metal disposal at a commercial renovation site in ${city}.`,
          defaultImg: categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',
          placeholderKey: 'gallery-normal-1',
          alt: `Commercial roll-off dumpster provided by ${bizName} in ${city}`
        },
        {
          title: 'Yard Waste & Demolition Dumpster',
          desc: `Delivered a 20-yard dumpster for landscaping debris, soil, and old decking removal for a backyard remodel in ${city}.`,
          defaultImg: categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
          placeholderKey: 'gallery-normal-2',
          alt: `Yard waste dumpster rental project in ${city} by ${bizName}`
        }
      ];
    case 'plumbing':
      return [
        {
          title: 'Emergency Pipe Repair',
          desc: `Replaced a burst copper main pipe in a residential basement, preventing major flooding and water damage in ${city}.`,
          defaultImg: categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
          placeholderKey: 'gallery-normal-0',
          alt: `Emergency plumbing and pipe repair in ${city} by ${bizName}`
        },
        {
          title: 'Tankless Water Heater Installation',
          desc: `Installed a high-efficiency energy-saving tankless water heater for continuous hot water in a ${city} home.`,
          defaultImg: categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
          placeholderKey: 'gallery-normal-1',
          alt: `Tankless water heater installation by ${bizName} in ${city}`
        },
        {
          title: 'Drain Cleaning & Hydro-Jetting',
          desc: `Cleared a severe main sewer line blockage using high-pressure hydro-jetting equipment, restoring full flow in ${city}.`,
          defaultImg: categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
          placeholderKey: 'gallery-normal-2',
          alt: `Professional sewer drain cleaning in ${city} by ${bizName}`
        }
      ];
    case 'roofing':
      return [
        {
          title: 'Complete Roof Replacement',
          desc: `Installed a new architectural asphalt shingle roof with leak barriers and ventilation upgrades in ${city}.`,
          defaultImg: categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80',
          placeholderKey: 'gallery-normal-0',
          alt: `Architectural shingle roof replacement in ${city} by ${bizName}`
        },
        {
          title: 'Storm Damage Roof Repair',
          desc: `Repaired wind-damaged shingles and sealed leaking chimney flashings during an emergency service call in ${city}.`,
          defaultImg: categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
          placeholderKey: 'gallery-normal-1',
          alt: `Emergency storm roof repair by ${bizName} in ${city}`
        },
        {
          title: 'Commercial Flat Roof Coating',
          desc: `Applied a premium silicone reflective coating over a commercial flat roof, extending life and lowering cooling bills in ${city}.`,
          defaultImg: categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
          placeholderKey: 'gallery-normal-2',
          alt: `Commercial flat roof coating installation in ${city} by ${bizName}`
        }
      ];
    default:
      const primaryKw = data.primaryKeyword || 'Services';
      const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(categoryId);
      if (isRestoration) {
        return [
          {
            title: 'Water Extraction & Cleanup',
            desc: `Emergency water removal, structural dehumidification, and damage assessment completed in ${city}.`,
            defaultImg: WD_PLACEHOLDER_IMAGES.flooding,
            placeholderKey: 'gallery-normal-0',
            alt: `Water damage cleanup project in ${city} by ${bizName}`
          },
          {
            title: 'Rapid Structural Drying',
            desc: `Industrial air movers and LGR dehumidifiers placed to extract moisture from framing and drywalls.`,
            defaultImg: WD_PLACEHOLDER_IMAGES.equipment,
            placeholderKey: 'gallery-normal-1',
            alt: `Rapid structural drying by ${bizName} in ${city}`
          },
          {
            title: 'Mold Containment & Removal',
            desc: `Detailed mold testing, containment barriers, HEPA vacuuming, and sanitization in subfloors.`,
            defaultImg: WD_PLACEHOLDER_IMAGES.mold,
            placeholderKey: 'gallery-normal-2',
            alt: `Mold containment and removal in ${city} by ${bizName}`
          }
        ];
      }
      return [
        {
          title: `Residential ${primaryKw} Service`,
          desc: `Completed a comprehensive residential ${primaryKw.toLowerCase()} project, ensuring safety and compliance in ${city}.`,
          defaultImg: categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80',
          placeholderKey: 'gallery-normal-0',
          alt: `Residential ${primaryKw.toLowerCase()} project in ${city} by ${bizName}`
        },
        {
          title: `Emergency ${primaryKw} Support`,
          desc: `Responded to an urgent service call, diagnosing and resolving issues promptly for a property in ${city}.`,
          defaultImg: categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
          placeholderKey: 'gallery-normal-1',
          alt: `Emergency ${primaryKw.toLowerCase()} service by ${bizName} in ${city}`
        },
        {
          title: `Commercial ${primaryKw} Project`,
          desc: `Executed large-scale commercial ${primaryKw.toLowerCase()} installation and testing with minimal business disruption in ${city}.`,
          defaultImg: categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
          placeholderKey: 'gallery-normal-2',
          alt: `Commercial ${primaryKw.toLowerCase()} project in ${city} by ${bizName}`
        }
      ];
  }
}

function getCategoryBeforeAfterPairs(data: WDBusinessData): Array<{ before: WDGalleryImage; after: WDGalleryImage }> {
  const categoryId = (data as any)._categoryId || (data as any).categoryId || 'water-damage';
  const categoryImages = (data as any)._categoryImages;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(categoryId);
  const bizName = data.businessName || 'Our Team';

  let before1 = data.customImages?.['gallery-before-0'] || categoryImages?.['gallery-before-0'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.flooding : 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80');
  let after1 = data.customImages?.['gallery-after-0'] || categoryImages?.['gallery-after-0'] || categoryImages?.['main-image'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.drying : 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80');
  let cap1Before = isRestoration ? 'Before: Damage discovered' : 'Before: Work area prepped';
  let cap1After = isRestoration ? 'After: Fully restored' : 'After: Project completed';

  let before2 = data.customImages?.['gallery-before-1'] || categoryImages?.['gallery-before-1'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.mold : 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80');
  let after2 = data.customImages?.['gallery-after-1'] || categoryImages?.['gallery-after-1'] || categoryImages?.['service-image'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.team : 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80');
  let cap2Before = isRestoration ? 'Before: Mold remediation project' : 'Before: Prior setup / old equipment';
  let cap2After = isRestoration ? 'After: Mold removed, area treated' : 'After: New professional installation';

  let before3 = data.customImages?.['gallery-before-2'] || categoryImages?.['gallery-before-2'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.equipment : 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80');
  let after3 = data.customImages?.['gallery-after-2'] || categoryImages?.['gallery-after-2'] || categoryImages?.['location-image'] || (isRestoration ? WD_PLACEHOLDER_IMAGES.hero : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80');
  let cap3Before = isRestoration ? 'Before: Flooded basement' : 'Before: Initial inspection / site survey';
  let cap3After = isRestoration ? 'After: Dried and restored' : 'After: Final walkthrough and cleanup';

  if (categoryId === 'dumpster-rental') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80';
    after1 = data.customImages?.['gallery-after-0'] || data.customImages?.['main-image'] || categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80';
    cap1Before = 'Before: Attic cleanout accumulation';
    cap1After = `After: Cleanly sorted and hauled away by ${bizName}`;

    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80';
    after2 = data.customImages?.['gallery-after-1'] || data.customImages?.['service-image'] || categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';
    cap2Before = 'Before: Demolition debris piled up';
    cap2After = `After: Dumpster filled and site cleared by ${bizName}`;

    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80';
    after3 = data.customImages?.['gallery-after-2'] || data.customImages?.['location-image'] || categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80';
    cap3Before = 'Before: Driveway placement prep';
    cap3After = `After: Dumpster placed safely on protective boards by ${bizName}`;
  } else if (categoryId === 'plumbing') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80';
    cap1Before = 'Before: Leaky pipe damage';
    cap1After = 'After: Pipe replaced and area clean';

    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80';
    cap2Before = 'Before: Old inefficient water heater';
    cap2After = 'After: Brand new system installed';
  } else if (categoryId === 'roofing') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80';
    cap1Before = 'Before: Damaged and missing shingles';
    cap1After = 'After: Beautiful new shingle roof';

    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80';
    cap2Before = 'Before: Leaking chimney flashing';
    cap2After = 'After: Sealed and repaired flashing';
  } else if (categoryId === 'hvac') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80';
    cap1Before = 'Before: Aging, noisy AC unit';
    cap1After = 'After: Modern central AC system';

    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80';
    cap2Before = 'Before: Dirty furnace filter & clogged blower';
    cap2After = 'After: Cleaned, serviced, and tuned heating unit';
  } else if (categoryId === 'carpet-cleaning') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80';
    cap1Before = 'Before: Stained and high-traffic carpet';
    cap1After = 'After: Steam-cleaned and stain-free carpet';
  } else if (categoryId === 'house-painting') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80';
    cap1Before = 'Before: Peeling, faded exterior paint';
    cap1After = 'After: Freshly painted exterior';
  } else if (categoryId === 'electrical') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';
    cap1Before = 'Before: Outdated electrical fuse panel';
    cap1After = 'After: Clean modern 200-Amp electrical panel';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    cap2Before = 'Before: Unfinished garage wall (no EV charging)';
    cap2After = 'After: Level 2 EV charging station installed';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80';
    cap3Before = 'Before: Outdated single bulb ceiling lighting';
    cap3After = 'After: Sleek, energy-efficient recessed LED lights';
  } else if (categoryId === 'locksmith') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80';
    cap1Before = 'Before: Worn out, insecure entry door lock';
    cap1After = 'After: Modern touchscreen smart lock installed';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1509721148489-4b444214f3f2?w=800&q=80';
    cap2Before = 'Before: Multiple keys required for home entry';
    cap2After = 'After: Lock cylinders rekeyed to a single master key';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80';
    cap3Before = 'Before: Damaged commercial door locking bar';
    cap3After = 'After: Secure, commercial-grade panic hardware';
  } else if (categoryId === 'pest-control') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80';
    cap1Before = 'Before: Active pest nesting area under siding';
    cap1After = 'After: Treated, cleaned, and pest-free exterior perimeter';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    cap2Before = 'Before: Open foundation vent allowing rodent access';
    cap2After = 'After: Heavy-duty mesh screen exclusion installed';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80';
    cap3Before = 'Before: Termite damaged structural wood framing';
    cap3After = 'After: Treated framing with protective termite barrier';
  } else if (categoryId === 'tree-service') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80';
    cap1Before = 'Before: Decayed pine tree leaning dangerously over roof';
    cap1After = 'After: Tree safely removed, structure protected';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80';
    cap2Before = 'Before: Overgrown oak branches blocking sunlight';
    cap2After = 'After: Pruned and elevated canopy for light and wind safety';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80';
    cap3Before = 'Before: Large hardwood stump in front lawn';
    cap3After = 'After: Stump ground down, backfilled with topsoil';
  } else if (categoryId === 'garage-door') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';
    cap1Before = 'Before: Dented, non-insulated wood garage door';
    cap1After = 'After: Modern R-value insulated steel carriage door';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80';
    cap2Before = 'Before: Broken heavy-duty garage torsion spring';
    cap2After = 'After: High-cycle replacement spring installed';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80';
    cap3Before = 'Before: Noisy, outdated chain-drive opener';
    cap3After = 'After: Ultra-quiet belt-drive smart opener with camera';
  } else if (categoryId === 'foundation-repair') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80';
    cap1Before = 'Before: Expanding crack in exterior brick foundation wall';
    cap1After = 'After: Foundation lifted with piers, brick crack closed';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80';
    cap2Before = 'Before: Water leaking through basement foundation crack';
    cap2After = 'After: Sealed with high-pressure polyurethane injection';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&q=80';
    cap3Before = 'Before: Damp, moldy crawl space dirt floor';
    cap3After = 'After: Heavy 20-mil vapor barrier encapsulation';
  } else if (categoryId === 'window-replacement') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    cap1Before = 'Before: Drafty, single-pane wooden window';
    cap1After = 'After: Energy-efficient double-pane vinyl window';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80';
    cap2Before = 'Before: Sticky, outdated sliding glass door';
    cap2After = 'After: Premium low-E sliding glass door installed';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
    cap3Before = 'Before: Simple double-hung window group';
    cap3After = 'After: Custom wood-framed bay window configuration';
  } else if (categoryId === 'junk-removal') {
    before1 = data.customImages?.['gallery-before-0'] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80';
    cap1Before = 'Before: Basement filled with years of accumulated junk';
    cap1After = 'After: Basement completely cleared, swept, and cleaned';
    before2 = data.customImages?.['gallery-before-1'] || 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80';
    cap2Before = 'Before: Remodeling debris and drywalls piled in backyard';
    cap2After = 'After: Yard cleared and debris hauled for recycling';
    before3 = data.customImages?.['gallery-before-2'] || 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80';
    cap3Before = 'Before: Heavy, broken sectional sofa on front porch';
    cap3After = 'After: Bulk furniture removed, restoring porch space';
  }

  return [
    {
      before: { src: before1, alt: `${cap1Before} - ${bizName}`, type: 'before', pairId: 'p1', caption: cap1Before },
      after: { src: after1, alt: `${cap1After} - ${bizName}`, type: 'after', pairId: 'p1', caption: cap1After }
    },
    {
      before: { src: before2, alt: `${cap2Before} - ${bizName}`, type: 'before', pairId: 'p2', caption: cap2Before },
      after: { src: after2, alt: `${cap2After} - ${bizName}`, type: 'after', pairId: 'p2', caption: cap2After }
    },
    {
      before: { src: before3, alt: `${cap3Before} - ${bizName}`, type: 'before', pairId: 'p3', caption: cap3Before },
      after: { src: after3, alt: `${cap3After} - ${bizName}`, type: 'after', pairId: 'p3', caption: cap3After }
    }
  ];
}

function getCategoryGalleryPhotos(data: WDBusinessData): WDGalleryImage[] {
  const categoryId = (data as any)._categoryId || (data as any).categoryId || 'water-damage';
  const categoryImages = (data as any)._categoryImages;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(categoryId);
  const bizName = data.businessName || 'Our Team';

  if (isRestoration) {
    return [
      { src: data.customImages?.['gallery-normal-0'] || WD_PLACEHOLDER_IMAGES.equipment, alt: `Industrial drying equipment in use by ${bizName}`, type: 'normal' },
      { src: data.customImages?.['gallery-normal-1'] || WD_PLACEHOLDER_IMAGES.team, alt: `Restoration team from ${bizName} at work`, type: 'normal' },
      { src: data.customImages?.['gallery-normal-2'] || WD_PLACEHOLDER_IMAGES.drying, alt: `Structural drying in progress by ${bizName}`, type: 'normal' },
      { src: data.customImages?.['about-team-photo'] || WD_PLACEHOLDER_IMAGES.team, alt: `Our professional restoration team at ${bizName}`, type: 'normal' },
      { src: data.customImages?.['hero-bg'] || WD_PLACEHOLDER_IMAGES.hero, alt: `Completed property restoration project by ${bizName}`, type: 'normal' },
      { src: data.customImages?.['main-image'] || WD_PLACEHOLDER_IMAGES.flooding, alt: `Water extraction process completed by ${bizName}`, type: 'normal' },
    ];
  }

  const mainImg = data.customImages?.['main-image'] || categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80';
  const serviceImg = data.customImages?.['service-image'] || categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80';
  const locationImg = data.customImages?.['location-image'] || categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80';
  const teamImg = data.customImages?.['about-team-photo'] || categoryImages?.['about-team-photo'] || 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80';
  const heroImg = data.customImages?.['hero-bg'] || data.customImages?.['hero'] || categoryImages?.['hero'] || 'https://images.unsplash.com/photo-1618090584126-129cd1f3fbaa?w=800&q=80';

  const norm0 = data.customImages?.['gallery-normal-0'] || mainImg;
  const norm1 = data.customImages?.['gallery-normal-1'] || serviceImg;
  const norm2 = data.customImages?.['gallery-normal-2'] || locationImg;
  const norm3 = data.customImages?.['about-team-photo'] || teamImg;
  const norm4 = data.customImages?.['hero-bg'] || heroImg;
  const norm5 = data.customImages?.['main-image'] || mainImg;

  if (categoryId === 'dumpster-rental') {
    return [
      { src: norm0, alt: `Roll-off dumpster rental project completed by ${bizName}`, type: 'normal' },
      { src: norm1, alt: `Safe driveway dumpster delivery by ${bizName}`, type: 'normal' },
      { src: norm2, alt: `Local waste management and recycling job by ${bizName}`, type: 'normal' },
      { src: norm3, alt: `Our dedicated dumpster rental team at ${bizName}`, type: 'normal' },
      { src: norm4, alt: `Commercial waste management dumpster site by ${bizName}`, type: 'normal' },
      { src: norm5, alt: `Residential cleanout dumpster project by ${bizName}`, type: 'normal' },
    ];
  }

  const primaryKw = data.primaryKeyword || 'Services';
  return [
    { src: norm0, alt: `Professional ${primaryKw.toLowerCase()} project completed by ${bizName}`, type: 'normal' },
    { src: norm1, alt: `Specialized ${primaryKw.toLowerCase()} equipment utilized by ${bizName}`, type: 'normal' },
    { src: norm2, alt: `Service delivery in our local area by ${bizName}`, type: 'normal' },
    { src: norm3, alt: `Our expert ${primaryKw.toLowerCase()} crew at ${bizName}`, type: 'normal' },
    { src: norm4, alt: `Commercial ${primaryKw.toLowerCase()} project by ${bizName}`, type: 'normal' },
    { src: norm5, alt: `Residential ${primaryKw.toLowerCase()} work completed by ${bizName}`, type: 'normal' },
  ];
}

// ─── DEFAULT BLOG POSTS (used when no AI posts are generated) ──────────────

export function getDefaultBlogPosts(data: WDBusinessData): WDBlogPost[] {
  const categoryId = (data as any)._categoryId || (data as any).categoryId || 'water-damage';
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(categoryId);
  if (!isRestoration) {
    return getDynamicDefaultBlogPosts(data);
  }

  const today = new Date().toISOString().split('T')[0];
  const city = data.city || 'Your Area';
  const state = data.state || '';
  const bizName = data.businessName || 'Our Restoration Team';

  const posts = [
    {
      slug: 'what-to-do-after-water-damage',
      title: `What to Do Immediately After Water Damage in Your ${city} Home`,
      excerpt: `The first 24 hours after water damage in ${city} are critical. Learn the steps to take to protect your property and support your insurance claim before ${bizName} arrives.`,
      content: `<h2>Act Fast — The First 24 Hours Matter Most in ${city}</h2><p>When water damage strikes your home in ${city}, ${state}, every minute counts. The actions you take in the first 24 hours can mean the difference between a quick recovery and months of costly repairs. Water moves fast — it seeps into walls, floors, and furniture, and mold can begin growing within 24-48 hours.</p><h2>Step 1: Ensure Safety First</h2><p>Before doing anything else, make sure your family is safe. Turn off electricity to affected areas if you can do so safely. Avoid standing water that could be contaminated or electrically charged. Wear protective footwear and gloves if you must enter the area.</p><h2>Step 2: Stop the Water Source</h2><p>If the damage is from a burst pipe or appliance failure, shut off the water supply immediately. Know where your main water shutoff valve is located before emergencies happen. If the water is from outside flooding, focus on protecting yourself and wait for the water to recede.</p><h2>Step 3: Document Everything</h2><p>Take photos and videos of all damage before moving or cleaning anything. This documentation is critical for your insurance claim. Make a detailed list of damaged items, including their approximate value and age. Keep all receipts for emergency expenses.</p><h2>Step 4: Call a Professional Restoration Company like ${bizName}</h2><p>Contact a certified water damage restoration company like ${bizName} as soon as possible. Professional teams have industrial-grade equipment that can extract water and dry your ${city} home far more effectively than household fans and dehumidifiers. Look for IICRC-certified professionals who offer 24/7 emergency response.</p><h2>Step 5: Begin Basic Mitigation</h2><p>While waiting for professionals, you can take some basic steps: remove standing water with a wet/dry vacuum if available, move furniture away from wet areas, place aluminum foil under furniture legs to prevent staining, and open windows for ventilation if weather permits.</p>`,
      date: today,
      category: 'Emergency Tips',
      featuredImage: WD_PLACEHOLDER_IMAGES.flooding,
      featuredImageAlt: `Water damage in a ${city} home requiring immediate action`
    },
    {
      slug: 'signs-of-hidden-water-damage',
      title: `7 Signs of Hidden Water Damage in ${city} You Should Never Ignore`,
      excerpt: `Water damage is not always visible. Discover the warning signs that moisture is lurking behind your walls, under your floors, or above your ceilings in ${city}.`,
      content: `<h2>Why Hidden Water Damage Is So Dangerous for ${city} Homes</h2><p>The most destructive water damage is often the kind you cannot see. Behind walls, under floors, and above ceilings, water can silently destroy your ${city} home's structure while creating the perfect conditions for mold growth. By the time visible signs appear, significant damage may have already occurred.</p><h2>1. Musty or Earthy Odors</h2><p>A persistent musty smell is one of the earliest indicators of hidden moisture. If you notice an earthy or damp smell in your ${city} property that does not go away with ventilation, there may be water trapped behind walls or under flooring. This odor often indicates mold is already growing.</p><h2>2. Unexplained Stains on Walls or Ceilings</h2><p>Water stains appear as yellowish-brown discoloration, often with irregular edges. They may appear on ceilings below bathrooms, around windows, or along baseboards. Even small stains can indicate a larger problem hidden behind the surface.</p><h2>3. Peeling or Bubbling Paint and Wallpaper</h2><p>When moisture gets behind paint or wallpaper, it causes the adhesion to fail. Look for bubbles, cracks, or areas where paint is flaking away. This is a clear sign that water is present within the wall itself.</p><h2>4. Warped or Buckled Flooring</h2><p>Hardwood floors that buckle, tile that becomes loose, or laminate that swells at the seams all indicate moisture underneath. Check for soft spots in the floor that feel spongy when you walk on them.</p><h2>5. Increased Water Bills</h2><p>A sudden spike in your water bill without a change in usage patterns could indicate a hidden leak. Even small leaks in pipes within walls or under the foundation can waste thousands of gallons and cause extensive damage over time.</p><h2>6. Visible Mold Growth</h2><p>Any visible mold — even small patches — usually indicates a much larger moisture problem. Mold on walls, in corners, or around windows means there is enough sustained moisture for colonies to thrive. Professional testing by ${bizName} can help determine the extent of the problem.</p><h2>7. Sounds of Running Water</h2><p>If you hear water running when no fixtures are in use, you may have a hidden leak. Listen carefully near walls, especially around bathrooms and kitchens. A hissing or dripping sound behind walls requires immediate professional investigation from ${bizName}.</p>`,
      date: today,
      category: 'Home Maintenance',
      featuredImage: WD_PLACEHOLDER_IMAGES.equipment,
      featuredImageAlt: `Moisture detection equipment for finding hidden water damage in ${city}`
    },
    {
      slug: 'water-damage-insurance-claims',
      title: `How to File a Water Damage Insurance Claim in ${city} Successfully`,
      excerpt: `A step-by-step guide to navigating the insurance claims process for water damage in ${city} — what to document, what to say, and how ${bizName} can help.`,
      content: `<h2>Understanding Your Insurance Coverage</h2><p>Before a water damage event occurs, it is essential to understand what your homeowner's insurance covers. Most standard policies cover "sudden and accidental" water damage — like a burst pipe or appliance overflow. However, they typically do not cover damage from flooding, gradual leaks, or lack of maintenance in ${city}.</p><h2>Step 1: Mitigate Further Damage</h2><p>Your insurance policy requires you to take reasonable steps to prevent additional damage. This includes shutting off the water source, removing standing water, and starting the drying process. Keep all receipts for mitigation expenses — ${bizName} can provide detailed invoicing that your insurance should reimburse.</p><h2>Step 2: Document Everything Thoroughly</h2><p>Take extensive photos and videos before cleanup begins. Document every room, every item, and every surface affected by water. Create a detailed inventory of damaged personal property with descriptions, approximate values, and purchase dates. This documentation is the foundation of your claim.</p><h2>Step 3: Contact Your Insurance Company Promptly</h2><p>File your claim as soon as possible. Most policies require prompt notification of damage. Have your policy number ready and provide a clear description of what happened. Ask for a claim number and the name of your assigned adjuster.</p><h2>Step 4: Get Professional Estimates</h2><p>Obtain estimates from licensed restoration companies like ${bizName} before the adjuster visits. Having professional documentation of the damage scope and estimated repair costs strengthens your claim. ${bizName} can also work directly with your insurance company to streamline the process.</p><h2>Common Mistakes to Avoid</h2><p>Do not throw away damaged items before the adjuster sees them. Do not make permanent repairs before approval. Do not accept the first settlement offer without reviewing it carefully — you can negotiate. Keep copies of all correspondence with your insurance company.</p>`,
      date: today,
      category: 'Insurance',
      featuredImage: WD_PLACEHOLDER_IMAGES.team,
      featuredImageAlt: `Insurance claim discussion for water damage in ${city}`
    },
    {
      slug: 'mold-after-water-damage',
      title: `How to Prevent Mold After Water Damage in ${city}, ${state}`,
      excerpt: `Mold can begin growing within 24 hours of water intrusion. Learn what conditions mold needs and the steps ${bizName} takes to prevent it from taking hold in ${city}.`,
      content: `<h2>The Timeline of Mold Growth in ${city}</h2><p>Mold spores are everywhere — in the air, on surfaces, and in dust. They only need three things to grow: moisture, organic material (like wood, drywall, or carpet), and time. After water damage, mold can begin colonizing surfaces within 24 to 48 hours. Within a week, it can spread throughout wall cavities and HVAC systems.</p><h2>Why Professional Drying Is Critical</h2><p>Consumer-grade fans and dehumidifiers simply cannot achieve the drying rates required to prevent mold. Professional restoration companies like ${bizName} use industrial air movers, commercial dehumidifiers, and moisture monitoring equipment to dry structures to safe levels quickly. We use specialized moisture meters to verify that hidden areas — inside walls, under floors — are completely dry.</p><h2>The Professional Mold Prevention Process</h2><p>Professional restoration by ${bizName} begins with water extraction using truck-mounted or portable extractors. Next, technicians set up a strategic drying system with air movers and dehumidifiers, calibrated based on the size of the affected area and types of materials involved. We monitor moisture levels daily, adjusting equipment as needed until all materials reach acceptable moisture content.</p><h2>What You Can Do Immediately</h2><p>While waiting for professionals, increase air circulation by opening windows (if weather permits) and running fans. Remove wet materials that can be safely handled — area rugs, clothing, and removable items. Lift furniture off wet carpet using foil or blocks. Do not turn on the HVAC system if ductwork may be contaminated.</p><h2>When Mold Is Already Present</h2><p>If you see or smell mold, do not disturb it. Attempting DIY mold removal can release millions of spores into the air, potentially spreading contamination throughout your ${city} home. Professional mold remediation involves containment, air filtration, safe removal, and post-remediation verification to ensure the problem is fully resolved.</p>`,
      date: today,
      category: 'Mold Prevention',
      featuredImage: WD_PLACEHOLDER_IMAGES.mold,
      featuredImageAlt: `Professional mold inspection after water damage in ${city}`
    },
    {
      slug: 'water-damage-categories-explained',
      title: `Water Damage Categories 1, 2, and 3: What They Mean for Your ${city} Restoration`,
      excerpt: `Not all water damage is the same. Understanding the category of water involved determines the cleanup protocol, safety requirements, and restoration approach used by ${bizName} in ${city}.`,
      content: `<h2>Why Water Category Matters for ${city} Properties</h2><p>The Institute of Inspection Cleaning and Restoration Certification (IICRC) classifies water damage into three categories based on the level of contamination. This classification determines the safety precautions, cleanup methods, and restoration procedures required. Using the wrong approach for the water category can put your family's health at risk.</p><h2>Category 1: Clean Water</h2><p>Category 1 water originates from a sanitary source and poses no substantial health risk. Common sources include broken water supply lines, tub or sink overflows with no contaminants, appliance malfunctions involving water supply lines, and rainwater entry. While Category 1 water starts clean, it can deteriorate to Category 2 or 3 if left untreated for too long (typically 48-72 hours) or if it contacts contaminated surfaces.</p><h2>Category 2: Gray Water</h2><p>Category 2 water contains significant contamination that could cause illness if ingested or exposed to skin. Sources include dishwasher or washing machine overflows, toilet overflows with urine but no feces, sump pump failures, and aquarium or waterbed leaks. Gray water requires additional safety precautions including personal protective equipment and antimicrobial treatments during cleanup by ${bizName}.</p><h2>Category 3: Black Water</h2><p>Category 3 water is grossly contaminated and contains pathogenic agents that can cause severe illness or death. Sources include sewage backup, flooding from rivers or streams, toilet overflow with feces, and stagnant water that has begun to support microbial growth. Black water restoration requires specialized equipment, full personal protective gear, and often involves removal and disposal of contaminated porous materials. ${bizName} is fully equipped for safe Category 3 cleanup.</p><h2>How Professionals Handle Each Category</h2><p>Certified restoration professionals begin every job by assessing the water category. This determines the scope of work, safety protocols, and whether materials can be salvaged or must be removed. Category 1 damage may allow materials to be dried in place, while Category 3 often requires complete removal of affected porous materials like drywall, carpet, and padding.</p>`,
      date: today,
      category: 'Education',
      featuredImage: WD_PLACEHOLDER_IMAGES.drying,
      featuredImageAlt: `Water damage assessment and categorization in ${city}`
    },
    {
      slug: 'diy-vs-professional-water-damage',
      title: `DIY vs. Professional Water Damage Restoration in ${city}: What You Need to Know`,
      excerpt: `Consumer fans and dehumidifiers cannot achieve the drying rates required by IICRC standards. Learn why ${bizName}'s professional equipment and certification matter in ${city}.`,
      content: `<h2>The DIY Temptation</h2><p>When water damage occurs, it is tempting to handle cleanup yourself to save money. For very minor incidents — a small spill quickly cleaned up — DIY may be sufficient. However, for any water damage in ${city} that has affected walls, flooring, or has been present for more than a few hours, professional restoration is strongly recommended.</p><h2>Why Consumer Equipment Falls Short</h2><p>A household fan moves approximately 1,000 cubic feet of air per minute. A professional air mover moves 2,500+ CFM with focused, directional airflow designed to pull moisture from building materials. Similarly, a consumer dehumidifier removes 30-50 pints per day, while commercial units remove 100-250 pints daily. This difference means DIY drying takes dramatically longer — often too long to prevent mold growth.</p><h2>The Hidden Damage You Cannot See</h2><p>Water follows gravity and wicks through porous materials. What appears to be a small area of damage on the surface often extends much further behind walls and under floors. Professional technicians from ${bizName} use thermal imaging cameras and penetrating moisture meters to map the full extent of water migration — areas that look dry on the surface may retain dangerous moisture levels inside.</p><h2>When DIY Is Acceptable</h2><p>Minor water incidents that are caught immediately, affect only non-porous surfaces, involve clean water (Category 1), and cover a small area may be handled without professional help. Clean up immediately, dry thoroughly, and monitor for any signs of mold in the following weeks.</p><h2>When to Call Professionals</h2><p>Call a professional restoration company like ${bizName} when water has affected drywall, carpet, or wood flooring; when the source is contaminated water; when damage has been present for more than 24 hours; when you notice any musty odors; or when the affected area is larger than roughly 10 square feet. The cost of professional restoration is almost always less than the cost of dealing with mold, structural damage, or health problems from inadequate drying.</p>`,
      date: today,
      category: 'Education',
      featuredImage: WD_PLACEHOLDER_IMAGES.hero,
      featuredImageAlt: `Professional restoration equipment vs DIY tools in ${city}`
    }
  ];
  return posts.slice(0, 5);
}

export function getDynamicDefaultBlogPosts(data: WDBusinessData): WDBlogPost[] {
  const categoryId = (data as any)._categoryId || (data as any).categoryId || 'water-damage';
  const today = new Date().toISOString().split('T')[0];
  const city = data.city || 'Your Area';
  const bizName = data.businessName || 'Our Team';
  const primaryKw = data.primaryKeyword || 'Services';
  const categoryImages = (data as any)._categoryImages;

  const mainImg = data.customImages?.['main-image'] || categoryImages?.['main-image'] || 'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80';
  const serviceImg = data.customImages?.['service-image'] || categoryImages?.['service-image'] || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80';
  const locationImg = data.customImages?.['location-image'] || categoryImages?.['location-image'] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80';

  if (categoryId === 'dumpster-rental') {
    return [
      {
        slug: 'choosing-right-dumpster-size',
        title: `How to Choose the Right Dumpster Size for Your Project in ${city}`,
        excerpt: `Selecting the right dumpster size prevents extra costs and keeps your project on track. Learn how to choose between 10, 15, 20, 30, and 40-yard roll-off bins in ${city}.`,
        content: `<h2>Finding the Perfect Dumpster Fit</h2><p>Whether you are cleaning out a cluttered garage, tackling a kitchen renovation, or managing a large construction site in ${city}, having the right size dumpster is key. Underestimating your debris volume can lead to scheduling additional pickups, while overestimating means paying for more space than you need.</p><h2>10 & 15-Yard Dumpsters: Minor Projects</h2><p>These smaller bins are perfect for minor cleanouts, small landscaping projects, and attic decluttering. They fit comfortably in most residential driveways and have a lower profile for easy loading.</p><h2>20-Yard Dumpsters: Medium Renovations</h2><p>The 20-yard dumpster is the most popular choice for kitchen or bathroom remodeling, carpet tear-outs, and deck removals. It offers ample volume for bulky household items.</p><h2>30 & 40-Yard Dumpsters: Construction & Demolition</h2><p>For whole-home renovations, commercial cleanouts, or major construction debris, these large-capacity roll-off dumpsters are essential. They handle high-weight materials and bulky waste easily.</p>`,
        date: today,
        category: 'Dumpster Guide',
        featuredImage: mainImg,
        featuredImageAlt: `Choosing the right dumpster rental size in ${city}`
      },
      {
        slug: 'items-prohibited-in-dumpsters',
        title: `Prohibited Items: What You Cannot Put in a Roll-Off Dumpster in ${city}`,
        excerpt: `Avoid compliance issues and extra fees. Discover the key items that local regulations prohibit from being disposed of in temporary roll-off dumpsters in ${city}.`,
        content: `<h2>Understanding Disposal Regulations</h2><p>Renting a dumpster makes disposing of large volumes of waste quick and easy. However, for environmental safety and landfill compliance in ${city}, certain materials are strictly prohibited from entering roll-off containers. Putting forbidden items in your dumpster can result in additional handling fees or refusal of pickup.</p><h2>1. Hazardous Waste and Chemicals</h2><p>Wet paint, solvents, motor oil, fuels, pesticides, and other household chemical wastes must never be thrown into a standard dumpster. These pose serious fire hazards and can contaminate local soil and groundwater.</p><h2>2. Batteries, Tires, and Large Appliances</h2><p>Car batteries contain lead-acid and must be recycled at designated centers. Tires are generally banned from municipal landfills and require specialized recycling. Large appliances containing freon (like refrigerators or AC units) must be evacuated before disposal.</p><h2>3. Propane Tanks and Pressurized Cylinders</h2><p>Pressurized tanks present a significant risk of explosion when compressed by sorting machinery or landfills. Ensure all tanks are returned to licensed exchange facilities instead.</p>`,
        date: today,
        category: 'Disposal Rules',
        featuredImage: serviceImg,
        featuredImageAlt: `Prohibited dumpster rental items list`
      },
      {
        slug: 'preparing-driveway-for-dumpster',
        title: `How to Prepare Your Driveway for a Dumpster Delivery in ${city}`,
        excerpt: `Protect your driveway asphalt or concrete from scratches and cracks. Follow these simple prep steps before your dumpster rental arrives.`,
        content: `<h2>Safe Placement for Peace of Mind</h2><p>When renting a roll-off dumpster from ${bizName} for your project in ${city}, ensuring a safe delivery spot protects both our drivers and your property. While dumpsters are designed to sit securely on flat surfaces, the weight of a loaded bin can sometimes cause scratches or stress cracks on driveway pavement.</p><h2>1. Select a Flat, Clear Spot</h2><p>Choose a level location with at least 60 feet of straight-line clearance for the delivery truck. Ensure there are no low-hanging branches or overhead wires directly above the drop zone.</p><h2>2. Use Protective Wood Boards</h2><p>We recommend placing two-by-four or plywood boards on the driveway where the dumpster wheels will rest. This distributes the weight and prevents the metal rollers from scratching asphalt or concrete.</p><h2>3. Remove Obstructions</h2><p>Ensure all personal vehicles, kids' toys, and trash bins are cleared from the path. Keep pets and children indoors during delivery to ensure a safe drop-off process.</p>`,
        date: today,
        category: 'Delivery Tips',
        featuredImage: locationImg,
        featuredImageAlt: `Driveway protection for dumpster delivery in ${city}`
      },
      {
        slug: 'dumpster-rental-cost-factors',
        title: `Understanding Dumpster Rental Costs and Pricing Factors in ${city}`,
        excerpt: `Demystify dumpster rental pricing. Learn about flat-rate vs. variable pricing, weight limits, disposal fees, and how to avoid hidden costs in ${city}.`,
        content: `<h2>How Much Does a Dumpster Rental Cost?</h2><p>Renting a dumpster in ${city} doesn't have to be complicated or full of surprises. Understanding how pricing is calculated helps you budget accurately for your cleanup or renovation project. Most rental companies, like ${bizName}, offer flat-rate pricing, but several factors can influence the final cost.</p><h2>1. Dumpster Size and Volume</h2><p>Naturally, larger dumpsters cost more to rent than smaller ones. A 10-yard bin has lower base rates compared to a massive 40-yard construction dumpster. Choose a size that closely matches your debris volume to avoid paying for empty space.</p><h2>2. Debris Weight and Landfill Fees</h2><p>Every dumpster comes with a designated weight limit (in tons). If your debris exceeds this limit, landfills charge disposal fees per additional ton. Bulky materials like brick, concrete, or dirt are extremely heavy and can quickly exceed weight limits.</p><h2>3. Rental Duration</h2><p>Standard rental periods typically range from 7 to 10 days. If you need to keep the dumpster longer, most companies charge a reasonable daily or weekly extension rate. Make sure to schedule your pickup as soon as you are finished to avoid extra charges.</p>`,
        date: today,
        category: 'Pricing Guide',
        featuredImage: mainImg,
        featuredImageAlt: `Dumpster rental pricing and cost factors in ${city}`
      },
      {
        slug: 'residential-vs-commercial-dumpster',
        title: `Residential vs. Commercial Dumpsters: Which Do You Need in ${city}?`,
        excerpt: `Discover the differences between residential roll-off bins and commercial front-load dumpsters. Learn which style fits your project in ${city}.`,
        content: `<h2>Understanding Your Dumpster Options</h2><p>If you are planning a cleanout or managing a business in ${city}, you might wonder whether a residential roll-off dumpster or a commercial dumpster is the right fit. While both serve to dispose of waste, they are designed for very different scenarios, durations, and volumes.</p><h2>Residential Roll-Off Dumpsters</h2><p>Roll-off dumpsters are temporary containers delivered for residential cleanup, remodeling, or landscaping. They are open-topped, range from 10 to 40 yards, and are hauled away once your project is complete. They are ideal for one-off projects.</p><h2>Commercial Front-Load Dumpsters</h2><p>Commercial dumpsters are permanent fixtures for businesses, restaurants, and apartment complexes. They are smaller (typically 2 to 8 yards), have lids, and are emptied on a regular scheduled basis (weekly or bi-weekly). They are designed for daily waste generation.</p><h2>Which Option is Right for You?</h2><p>Choose a roll-off dumpster if you have a short-term project with a large volume of waste, such as a roof replacement or estate cleanout. Choose a commercial contract if you need ongoing waste management for your local property or business.</p>`,
        date: today,
        category: 'Dumpster Guide',
        featuredImage: serviceImg,
        featuredImageAlt: `Residential roll-off dumpster vs commercial dumpster comparison`
      }
    ];
  }

  return [
    {
      slug: 'how-to-choose-the-right-professional',
      title: `How to Choose the Right ${primaryKw} Professional in ${city}`,
      excerpt: `Finding a reliable local contractor is key to a successful project. Here are the top questions to ask before hiring a ${primaryKw.toLowerCase()} specialist in ${city}.`,
      content: `<h2>Hiring with Confidence</h2><p>When you need professional ${primaryKw.toLowerCase()} services in ${city}, choosing the right contractor can make all the difference. Outlining your project scope, requesting license and insurance verifications, and reading local client reviews ensures you receive reliable, high-quality results from a contractor like ${bizName}.</p><h2>1. Verify License and Insurance</h2><p>Ensure the contractor is fully licensed and carries general liability and workers' compensation coverage to protect you from liability.</p><h2>2. Ask for a Clear Written Estimate</h2><p>A reputable company will provide an upfront, written flat-rate or itemized estimate before beginning any work.</p><h2>3. Read Client Testimonials</h2><p>Look for companies with a proven track record of responsive customer service and quality craftsmanship in the ${city} area.</p>`,
      date: today,
      category: 'Hiring Tips',
      featuredImage: mainImg,
      featuredImageAlt: `Hiring a professional ${primaryKw.toLowerCase()} contractor in ${city}`
    },
    {
      slug: 'routine-maintenance-to-save-money',
      title: `Top Maintenance Tips to Save Money on ${primaryKw} in ${city}`,
      excerpt: `Prevent expensive repairs before they happen. Discover key routine maintenance tasks that prolong your systems' lifespan and save you money.`,
      content: `<h2>Proactive Care Pays Off</h2><p>Many major ${primaryKw.toLowerCase()} failures can be prevented through simple, regular maintenance. Taking proactive steps not only keeps your property operating efficiently but also delays the need for full system replacements, saving you thousands over time.</p><h2>1. Schedule Regular Inspections</h2><p>Having a professional perform periodic checkups catches minor wear and tear before it turns into a major breakdown.</p><h2>2. Address Small Issues Early</h2><p>Don't ignore warning signs like slow drainage, minor drips, or unusual sounds — addressing them immediately is far cheaper than dealing with emergency repairs.</p><h2>3. Keep Surfaces and Systems Clean</h2><p>Clean systems run more efficiently and experience less mechanical strain, ensuring they last for years to come.</p>`,
      date: today,
      category: 'Maintenance',
      featuredImage: serviceImg,
      featuredImageAlt: `Routine maintenance tips for ${primaryKw.toLowerCase()}`
    },
    {
      slug: 'signs-you-need-professional-service',
      title: `5 Warning Signs You Need Professional ${primaryKw} Services in ${city}`,
      excerpt: `Don't wait for a breakdown. Learn the top warning signs that your systems require immediate attention from a professional ${primaryKw.toLowerCase()} team.`,
      content: `<h2>Recognizing Warning Signs</h2><p>Recognizing the early warning signs of system failure protects your property from damage and ensures your systems remain safe. If you notice any of these signs in your ${city} home or business, it is time to contact ${bizName} for a professional assessment.</p><h2>1. Unusual Sounds or Odors</h2><p>Persistent hums, squeals, or damp odors are clear signs of underlying mechanical or structural wear.</p><h2>2. Decreased Performance</h2><p>If your systems are running longer or producing poorer results, they are working too hard and consuming excess energy.</p><h2>3. Widespread Minor Problems</h2><p>Multiple small failures occurring simultaneously suggest a systemic issue that needs a comprehensive professional fix.</p>`,
      date: today,
      category: 'Expert Advice',
      featuredImage: locationImg,
      featuredImageAlt: `Signs you need professional ${primaryKw.toLowerCase()} service`
    },
    {
      slug: 'diy-vs-professional-service',
      title: `DIY vs. Professional ${primaryKw}: When to Hire an Expert in ${city}`,
      excerpt: `Torn between tackling a project yourself or hiring a pro? Read this honest comparison of DIY versus professional ${primaryKw.toLowerCase()} services in ${city}.`,
      content: `<h2>Evaluating Your Project Options</h2><p>When property issues arise in ${city}, the temptation to save money by doing it yourself is strong. While simple fixes can be satisfying DIY projects, major tasks involving ${primaryKw.toLowerCase()} require professional tools, specialized training, and safety compliance.</p><h2>1. Safety Risks and Hazards</h2><p>Many home maintenance projects carry safety risks, particularly electrical, roofing, or structural work. Professional teams are fully trained in safety protocols and carry liability insurance to protect your property and family.</p><h2>2. Tooling and Equipment Cost</h2><p>Specialized tasks require expensive, professional-grade equipment. Buying or renting these tools for a single job often costs more than hiring a contractor like ${bizName} who already owns the equipment.</p><h2>3. Quality and Longevity of Results</h2><p>Professional work comes with warranties and is built to code. DIY repairs may fail prematurely, leading to even more expensive repairs down the road. When in doubt, call in a certified specialist.</p>`,
      date: today,
      category: 'Expert Advice',
      featuredImage: mainImg,
      featuredImageAlt: `DIY vs professional ${primaryKw.toLowerCase()} services comparison`
    },
    {
      slug: 'preparing-for-service-delivery',
      title: `How to Prepare Your Property for ${primaryKw} Services in ${city}`,
      excerpt: `Ensure a smooth, efficient service appointment. Follow this checklist to prepare your ${city} home or business before our technicians arrive.`,
      content: `<h2>Ensuring a Successful Service Visit</h2><p>Preparing your property for a scheduled service from ${bizName} helps our technicians work efficiently and protects your belongings. A little preparation goes a long way in ensuring a summary, hassle-free appointment in ${city}.</p><h2>1. Clear Access to the Work Area</h2><p>Ensure there is a clear path to the utility panel, basement, attic, or specific room where work will take place. Remove fragile items, furniture, and clutter from the area.</p><h2>2. Keep Pets and Children Safe</h2><p>Work sites can have loud noises, open panels, and heavy equipment. For their safety and to let our crew work without distraction, keep pets and children in a separate area of the house.</p><h2>3. Be Ready to Discuss Details</h2><p>Have your paperwork, notes about the issue, and any questions ready for our team. Clear communication at the start of the visit ensures we meet your expectations.</p>`,
      date: today,
      category: 'Home Tips',
      featuredImage: serviceImg,
      featuredImageAlt: `Preparing property for ${primaryKw.toLowerCase()} service visit`
    }
  ];
}

export function generateBlogArchivePage(data: WDBusinessData, domain: string): string {
  const theme = resolveTheme(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/blog`;

  const posts = data.blogPosts || [];

  const displayPosts = posts.length > 0 ? posts : getDefaultBlogPosts(data);

  const postsHTML = displayPosts.map(post => {
    const postSlug = slugify(post.slug || post.title);
    const featuredImage = data.customImages?.[`blog-img-${post.slug}`] || post.featuredImage;
    const publishDate = getSafeBlogDate(post.date);

    return `
    <article class="blog-card">
      ${featuredImage ? `<a href="blog/${postSlug}.html">
        <img src="${featuredImage}" alt="${post.featuredImageAlt || post.title}" loading="lazy" class="blog-card-img" data-placeholder="blog-img-${post.slug}">
      </a>` : ''}
      <div class="blog-card-body">
        ${post.category ? `<span class="blog-category">${post.category}</span>` : ''}
        <h2 class="blog-card-title"><a href="blog/${postSlug}.html">${post.title}</a></h2>
        <p class="blog-card-excerpt">${post.excerpt}</p>
        <div class="blog-card-meta">
          <time datetime="${publishDate}">${formatBlogDate(post.date)}</time>
          <a href="blog/${postSlug}.html" class="service-card-link">Read More →</a>
        </div>
      </div>
    </article>`;
  }).join('');

  const blogCSS = `
.blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; margin-top: 2rem; }
.blog-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; transition: box-shadow .2s; }
.blog-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.blog-card-img { width: 100%; height: 200px; object-fit: cover; display: block; }
.blog-card-body { padding: 1.5rem; }
.blog-category { display: inline-block; background: ${theme.secondaryColor}22; color: ${theme.secondaryColor}; font-size: .75rem; font-weight: 700; padding: .25rem .6rem; border-radius: 4px; margin-bottom: .75rem; text-transform: uppercase; letter-spacing: .04em; }
.blog-card-title { font-size: 1.1rem; margin-bottom: .6rem; }
.blog-card-title a { color: ${theme.primaryColor}; }
.blog-card-excerpt { color: #475569; font-size: .9rem; margin-bottom: 1rem; }
.blog-card-meta { display: flex; justify-content: space-between; align-items: center; font-size: .85rem; color: #64748b; }
`;

  const fullTheme = resolveTheme(data);
  const fontUrl = FONT_URLS[fullTheme.fontFamily];
  const fontLink = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  const body = `
  ${generateNav(data)}

  <div class="breadcrumb container">
    <a href="index.html">Home</a>
    <span>›</span>
    <span aria-current="page">Blog</span>
  </div>

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>${capitalizeHeading(data.primaryKeyword)} Blog</h1>
      <p>Expert tips, guides, and information about ${data.primaryKeyword.toLowerCase()}, prevention, and protecting your ${data.city} property.</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container">
      <div class="blog-grid">
        ${postsHTML}
      </div>
    </div>
  </section>

  <section class="cta-section" aria-labelledby="cta-heading">
    <div class="container">
      <h2 id="cta-heading">Water Damage Emergency in ${data.city}?</h2>
      <p>Don't rely on articles when you need real help. Call us for immediate response, 24/7.</p>
      <div class="cta-actions">
        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\D/g, '')}" class="btn-primary"><span class="btn-icon">${iconToSVG('phone', '#fff')}</span> Call ${data.phone}</a>
        <a href="contact.html" class="btn-secondary">Get Free Estimate</a>
      </div>
    </div>
  </section>

  ${generateFooter(data)}`;

  const schemas = [generateLocalBusinessSchema(data, `${domain}.netlify.app`)]
    .map(s => `<script type="application/ld+json">\n${s}\n</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle(`${data.primaryKeyword} Blog | ${data.businessName} — ${data.city}`)}</title>
  <meta name="description" content="${seoDescription(`${data.primaryKeyword} tips, guides, and expert advice from ${data.businessName} in ${data.city}, ${data.state}. Learn about mold prevention, insurance claims, and restoration.`)}">
  <link rel="canonical" href="${canonicalUrl}">
  ${fontLink}
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:title" content="${seoTitle(`${data.primaryKeyword} Blog | ${data.businessName} — ${data.city}`)}">
  <meta property="og:description" content="${seoDescription(`${data.primaryKeyword} tips, guides, and expert advice from ${data.businessName} in ${data.city}, ${data.state}.`)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${data.businessName}">
  ${data.logoUrl || data.faviconUrl ? `<meta property="og:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  <meta name="twitter:card" content="${data.logoUrl || data.faviconUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${seoTitle(`${data.primaryKeyword} Blog | ${data.businessName} — ${data.city}`)}">
  <meta name="twitter:description" content="${seoDescription(`${data.primaryKeyword} tips, guides, and expert advice from ${data.businessName} in ${data.city}, ${data.state}.`)}">
  ${data.logoUrl || data.faviconUrl ? `<meta name="twitter:image" content="${data.logoUrl || data.faviconUrl}">` : ''}
  ${schemas}
  <style>
    ${generateCSS(fullTheme)}
    ${blogCSS}
  </style>
</head>
<body>
  ${body}
  <script>${generateJS()}</script>
</body>
</html>`;
}

// ─── INDIVIDUAL BLOG POST PAGE ─────────────────────────────────────────────

export function generateBlogPostPage(data: WDBusinessData, post: WDBlogPost, domain: string): string {
  const theme = resolveTheme(data);
  const postSlug = slugify(post.slug || post.title);
  const canonicalUrl = `${getSiteUrl(data, domain)}/blog/${postSlug}`;
  const featuredImage = data.customImages?.[`blog-img-${post.slug}`] || post.featuredImage;
  const publishDate = getSafeBlogDate(post.date);
  const fullTheme = resolveTheme(data);
  const fontUrl = FONT_URLS[fullTheme.fontFamily];
  const fontLink = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  // Format content — if markdown, do simple conversion
  const formatContent = (content: string): string => {
    return content
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul style="padding-left:1.5rem;margin:1rem 0;">$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hulo])(.*)/gm, (match) => match.trim() ? `<p>${match}</p>` : '')
      .replace(/<p><\/p>/g, '');
  };

  const articleContent = post.content ? formatContent(post.content) : `<p>${post.excerpt}</p>`;

  const body = `
  ${generateNav(data, 'blog/' + postSlug)}

  <div class="breadcrumb container">
    <a href="../index.html">Home</a>
    <span>›</span>
    <a href="../blog.html">Blog</a>
    <span>›</span>
    <span aria-current="page">${post.title}</span>
  </div>

  <article class="content-section" style="padding-top:2rem;">
    <div class="container" style="max-width:800px;">
      ${featuredImage ? `<img src="${featuredImage}" alt="${post.featuredImageAlt || post.title}" style="width:100%;height:360px;object-fit:cover;border-radius:12px;margin-bottom:2rem;" loading="lazy" data-placeholder="blog-img-${post.slug}">` : ''}
      ${post.category ? `<span style="display:inline-block;background:${theme.secondaryColor}22;color:${theme.secondaryColor};font-size:.75rem;font-weight:700;padding:.25rem .6rem;border-radius:4px;margin-bottom:1rem;text-transform:uppercase;letter-spacing:.04em;">${post.category}</span>` : ''}
      <h1 style="font-size:2rem;color:${theme.primaryColor};margin-bottom:1rem;line-height:1.3;">${post.title}</h1>
      <div style="display:flex;gap:1.5rem;color:#64748b;font-size:.875rem;margin-bottom:2rem;flex-wrap:wrap;">
        <span><i class="fas fa-calendar" style="margin-right:.4rem;"></i>${formatBlogDate(post.date)}</span>
        <span><i class="fas fa-user" style="margin-right:.4rem;"></i>${data.businessName}</span>
      </div>
      <div class="blog-post-content" style="font-size:1.05rem;line-height:1.8;color:#334155;">
        ${articleContent}
      </div>

      <div style="margin-top:3rem;padding:2rem;background:linear-gradient(135deg,${theme.primaryColor},${theme.secondaryColor});border-radius:12px;text-align:center;">
        <h3 style="color:#fff;font-size:1.5rem;margin-bottom:1rem;">Need Professional Help?</h3>
        <p style="color:rgba(255,255,255,.9);margin-bottom:1.5rem;">Contact ${data.businessName} for expert ${kwBase(data.primaryKeyword || 'restoration').toLowerCase()} services in ${data.city}.</p>
        <a href="tel:${data.phone}" style="display:inline-flex;align-items:center;gap:.5rem;background:#fff;color:${theme.primaryColor};padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;">
          <i class="fas fa-phone"></i> Call ${data.phone}
        </a>
      </div>
    </div>
  </article>

  ${generateFooter(data, 'blog/' + postSlug)}`;

  const schemas = [
    generateLocalBusinessSchema(data, getSiteHost(data, domain)),
    generateBlogPostingSchema(data, post, getSiteHost(data, domain)),
  ]
    .map(s => `<script type="application/ld+json">\n${s}\n</script>`)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle(`${post.title} | ${data.businessName} Blog`)}</title>
  <meta name="description" content="${seoDescription(post.excerpt)}">
  <link rel="canonical" href="${canonicalUrl}">
  ${fontLink}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${seoTitle(post.title)}">
  <meta property="og:description" content="${seoDescription(post.excerpt)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="${data.businessName}">
  ${featuredImage ? `<meta property="og:image" content="${featuredImage}">` : (data.logoUrl || data.faviconUrl ? `<meta property="og:image" content="${data.logoUrl || data.faviconUrl}">` : '')}
  <meta name="twitter:card" content="${featuredImage || data.logoUrl || data.faviconUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${seoTitle(post.title)}">
  <meta name="twitter:description" content="${seoDescription(post.excerpt)}">
  ${featuredImage ? `<meta name="twitter:image" content="${featuredImage}">` : (data.logoUrl || data.faviconUrl ? `<meta name="twitter:image" content="${data.logoUrl || data.faviconUrl}">` : '')}
  ${schemas}
  <style>
    ${generateCSS(fullTheme)}
    .blog-post-content h2 { font-size: 1.5rem; color: ${theme.primaryColor}; margin: 2rem 0 1rem; font-weight: 700; }
    .blog-post-content h3 { font-size: 1.25rem; color: ${theme.primaryColor}; margin: 1.5rem 0 .75rem; font-weight: 600; }
    .blog-post-content h4 { font-size: 1.1rem; color: #1e293b; margin: 1.25rem 0 .5rem; font-weight: 600; }
    .blog-post-content ul, .blog-post-content ol { padding-left: 1.5rem; margin: 1rem 0; }
    .blog-post-content li { margin-bottom: .5rem; }
    .blog-post-content p { margin-bottom: 1.25rem; }
  </style>
</head>
<body>
  ${body}
  <script>${generateJS()}</script>
</body>
</html>`;
}

// ─── PRIVACY POLICY PAGE ───────────────────────────────────────────────────

export function generatePrivacyPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/privacy`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const year = new Date().getFullYear();
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');

  const body = `
  ${generateNav(data)}

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>Privacy Policy</h1>
      <p>Last updated: ${today}</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container" style="max-width:800px;">

      <p style="color:#475569;">This Privacy Policy describes how ${data.businessName} ("we," "us," or "our") collects, uses, and protects your personal information when you visit our website or contact us for services.</p>

      <h2 style="margin-top:2rem;">Information We Collect</h2>
      <p style="color:#475569;">We may collect the following types of information:</p>
      <ul style="color:#475569;padding-left:1.5rem;margin-bottom:1rem;list-style:disc;">
        <li style="margin-bottom:.5rem;"><strong>Contact information</strong> — name, phone number, email address, and property address when you contact us for services or submit a form.</li>
        <li style="margin-bottom:.5rem;"><strong>Property/Project information</strong> — details about your property and the nature of the ${isRestoration ? 'damage' : 'project'} you describe.</li>
        <li style="margin-bottom:.5rem;"><strong>Usage data</strong> — pages visited, time spent on the site, referral source, and browser type (collected anonymously via analytics).</li>
        <li style="margin-bottom:.5rem;"><strong>Communications</strong> — records of calls, emails, and messages exchanged with our team.</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p style="color:#475569;">We use your information to:</p>
      <ul style="color:#475569;padding-left:1.5rem;margin-bottom:1rem;list-style:disc;">
        <li style="margin-bottom:.5rem;">Respond to service inquiries and dispatch ${isRestoration ? 'emergency response crews' : 'our team'}</li>
        <li style="margin-bottom:.5rem;">Provide ${data.primaryKeyword.toLowerCase()} and related services</li>
        <li style="margin-bottom:.5rem;">Communicate about your project and follow up after completion</li>
        <li style="margin-bottom:.5rem;">Improve our website and customer experience</li>
        <li style="margin-bottom:.5rem;">Comply with legal ${isRestoration ? 'and insurance ' : ''}documentation requirements</li>
      </ul>

      <h2>Information Sharing</h2>
      <p style="color:#475569;">We do not sell your personal information to third parties. We may share information with:</p>
      <ul style="color:#475569;padding-left:1.5rem;margin-bottom:1rem;list-style:disc;">
        ${isRestoration ? `
        <li style="margin-bottom:.5rem;"><strong>Insurance companies</strong> — when processing claims on your behalf with your authorization</li>
        ` : ''}
        <li style="margin-bottom:.5rem;"><strong>Service partners</strong> — subcontractors and suppliers involved in your ${isRestoration ? 'restoration ' : ''}project, limited to what is necessary</li>
        <li style="margin-bottom:.5rem;"><strong>Legal requirements</strong> — when required by law, court order, or government authority</li>
      </ul>

      <h2>Data Security</h2>
      <p style="color:#475569;">We implement reasonable technical and administrative measures to protect your personal information. However, no method of electronic transmission or storage is 100% secure. We encourage you to contact us directly by phone for sensitive or urgent communications.</p>

      <h2>Cookies and Analytics</h2>
      <p style="color:#475569;">Our website may use cookies and third-party analytics tools (such as Google Analytics) to understand how visitors use the site. These tools collect anonymized data and do not identify individual users. You can disable cookies in your browser settings, though some site features may not function correctly.</p>

      <h2>Your Rights</h2>
      <p style="color:#475569;">You may request access to, correction of, or deletion of your personal information at any time by contacting us at the information below. We will respond to verified requests within a reasonable time.</p>

      <h2>Children's Privacy</h2>
      <p style="color:#475569;">Our website and services are not directed at children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.</p>

      <h2>Changes to This Policy</h2>
      <p style="color:#475569;">We may update this Privacy Policy periodically. The date at the top of this page reflects the most recent revision. Continued use of our website constitutes acceptance of any changes.</p>

      <h2>Contact Us</h2>
      <p style="color:#475569;">For questions about this Privacy Policy or your personal information, contact:</p>
      <p style="color:#475569;">
        <strong>${data.businessName}</strong><br>
        ${formatDisplayAddress(data.address, data.city, data.state)}<br>
        ${data.phone}<br>
        ${data.email ? `${data.email}` : ''}
      </p>

      <p style="color:#94a3b8;font-size:.85rem;margin-top:2rem;">© ${year} ${data.businessName}. All rights reserved.</p>
    </div>
  </section>

  ${generateFooter(data)}`;;

  return htmlShell({
    metaTitle: `Privacy Policy | ${data.businessName}`,
    metaDescription: `Privacy Policy for ${data.businessName} — ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state}.`,
    canonicalUrl,
    theme,
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [],
    bodyContent: body,
  });
}

// ─── TERMS OF SERVICE PAGE ─────────────────────────────────────────────────

export function generateTermsPage(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const canonicalUrl = `${getSiteUrl(data, domain)}/terms`;
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const year = new Date().getFullYear();
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');

  const body = `
  ${generateNav(data)}

  <section class="page-hero" role="banner">
    <div class="container">
      <h1>Terms of Service</h1>
      <p>Last updated: ${today}</p>
    </div>
  </section>

  <section class="content-section">
    <div class="container" style="max-width:800px;">

      <p style="color:#475569;">These Terms of Service govern your use of the ${data.businessName} website and your engagement with our ${kwBase(data.primaryKeyword).toLowerCase()} services. By using this website or engaging our services, you agree to these terms.</p>

      <h2 style="margin-top:2rem;">Services</h2>
      <p style="color:#475569;">${data.businessName} provides ${data.primaryKeyword.toLowerCase()} and related professional services in ${data.city}, ${data.state} and surrounding areas. All services are performed by licensed and insured technicians following industry standards.</p>

      <h2>Estimates and Scope of Work</h2>
      <p style="color:#475569;">Written estimates are provided prior to work commencement. Estimates are based on visible and measurable conditions at the time of assessment. Hidden or concealed damage discovered during the ${isRestoration ? 'restoration' : 'work'} process may require a revised scope of work and updated pricing. We will notify you before proceeding with any work beyond the original estimate.</p>

      ${isRestoration ? `
      <h2>Emergency Services</h2>
      <p style="color:#475569;">In emergency situations involving active water intrusion, we may begin mitigation work (water extraction, equipment placement) to prevent further damage. A written authorization and estimate will be provided as soon as practicable after emergency services commence.</p>

      <h2>Insurance Claims</h2>
      <p style="color:#475569;">When work is to be billed through insurance, you are responsible for authorizing the claim and cooperating with your insurance company. ${data.businessName} provides full documentation to support your claim but cannot guarantee claim approval or the amount your insurance company will pay. You are ultimately responsible for payment of services rendered.</p>
      ` : `
      <h2>Service Calls & Appointments</h2>
      <p style="color:#475569;">For service requests and scheduled appointments, we make every effort to respond promptly. Travel fees or assessment rates may apply, which will be disclosed prior to scheduling.</p>
      `}

      <h2>Payment</h2>
      <p style="color:#475569;">Payment is due upon completion of each phase of work unless otherwise agreed in writing. ${isRestoration ? 'For insurance claims, we may accept assignment of benefits with your authorization. ' : ''}Interest may accrue on overdue balances. We reserve the right to place a lien on the property for unpaid services in accordance with applicable state law.</p>

      <h2>Liability</h2>
      <p style="color:#475569;">${data.businessName} carries general liability insurance. Our liability for services rendered is limited to the value of the services provided. We are not responsible for pre-existing conditions, hidden defects, or damage that was not accessible or visible at the time of our assessment. We are not liable for indirect, incidental, or consequential damages.</p>

      <h2>Warranty</h2>
      <p style="color:#475569;">We warrant that services will be performed in a professional and workmanlike manner in accordance with ${isRestoration ? 'IICRC standards. Written warranties on specific restoration work' : 'industry standards. Written warranties on specific work'} will be provided separately when applicable. This warranty does not cover damage from subsequent events, acts of nature, or conditions outside our control.</p>

      <h2>Website Use</h2>
      <p style="color:#475569;">The content on this website is provided for informational purposes only. Calculators and estimates on this site are general guidelines and do not constitute professional assessments. We make no representations about the accuracy or completeness of website content. Use of this website is at your own risk.</p>

      <h2>Governing Law</h2>
      <p style="color:#475569;">These Terms are governed by the laws of the State of ${data.state}. Any disputes arising from these Terms or our services shall be resolved in the courts of ${data.state}.</p>

      <h2>Changes to These Terms</h2>
      <p style="color:#475569;">We may update these Terms at any time. The date shown at the top of this page reflects the most recent update. Continued engagement with our services constitutes acceptance of any changes.</p>

      <h2>Contact</h2>
      <p style="color:#475569;">
        <strong>${data.businessName}</strong><br>
        ${formatDisplayAddress(data.address, data.city, data.state)}<br>
        ${data.phone}<br>
        ${data.email ? data.email : ''}
      </p>

      <p style="color:#94a3b8;font-size:.85rem;margin-top:2rem;">© ${year} ${data.businessName}. All rights reserved.</p>
    </div>
  </section>

  ${generateFooter(data)}`;;

  return htmlShell({
    metaTitle: `Terms of Service | ${data.businessName}`,
    metaDescription: `Terms of Service for ${data.businessName} — ${data.primaryKeyword.toLowerCase()} in ${data.city}, ${data.state}.`,
    canonicalUrl,
    theme,
    businessName: data.businessName,
    googleAnalyticsId: data.googleAnalyticsId || undefined,
    faviconUrl: data.faviconUrl || undefined,
    customHeadCode: data.customHeadCode || undefined,
    schemaBlocks: [],
    bodyContent: body,
  });
}

// ─── SITEMAP ───────────────────────────────────────────────────────────────

export function generateSitemap(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const base = getSiteUrl(data, domain);
  const today = new Date().toISOString().split('T')[0];
  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';
  const showBlog = (tier === '2' || tier === '3') && (data.generateBlog !== undefined ? data.generateBlog : (data.blogPosts && data.blogPosts.length > 0));

  const sitemapBlogPosts = showBlog ? ((data.blogPosts && data.blogPosts.length > 0) ? data.blogPosts : getDefaultBlogPosts(data)) : [];
  const staticPagesList = ['about', 'contact', 'faq', 'calculator', 'gallery', 'privacy', 'terms'];
  if (showBlog && sitemapBlogPosts.length > 0) staticPagesList.push('blog');

  const staticPages = staticPagesList
    .map(page => `  <url>
    <loc>${base}/${page}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('\n');

  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');
  const calculatorUrls = isRestoration ? CALCULATORS
    .map(c => `  <url>
    <loc>${base}/calculators/${c.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`)
    .join('\n') : '';

  const serviceUrls = showServicesLocations ? data.services
    .map(s => `  <url>
    <loc>${base}/services/${slugify(s)}-${slugify(data.city)}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`)
    .join('\n') : '';

  const locationUrls = showServicesLocations ? data.serviceAreas
    .map(l => `  <url>
    <loc>${base}/locations/${slugify(l)}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('\n') : '';

  const blogPostUrls = sitemapBlogPosts
    .map(post => `  <url>
    <loc>${base}/blog/${slugify(post.slug || post.title)}.html</loc>
    <lastmod>${post.date || today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('\n');

  const matrixUrls = (tier === '3' && data.enableMatrixPages) ? data.services.flatMap(s =>
    data.serviceAreas.map(l => `  <url>
    <loc>${base}/matrix/${slugify(s)}-in-${slugify(l)}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`)
  ).join('\n') : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${staticPages}
${calculatorUrls ? calculatorUrls + '\n' : ''}${serviceUrls ? '\n' + serviceUrls : ''}
${locationUrls ? '\n' + locationUrls : ''}
${blogPostUrls ? '\n' + blogPostUrls : ''}
${matrixUrls ? '\n' + matrixUrls : ''}
</urlset>`;
}

// ─── ROBOTS.TXT ────────────────────────────────────────────────────────────

export function generateRobots(data: WDBusinessData, domain: string): string {
  const base = getSiteUrl(data, domain);
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: ${base}/sitemap.xml

# LLM access
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /`;
}

// ─── LLMS.TXT ──────────────────────────────────────────────────────────────

export function generateLLMsTxt(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const base = getSiteUrl(data, domain);
  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';
  const showBlog = (tier === '2' || tier === '3') && (data.generateBlog !== undefined ? data.generateBlog : (data.blogPosts && data.blogPosts.length > 0));
  const llmBlogPosts = showBlog ? ((data.blogPosts && data.blogPosts.length > 0) ? data.blogPosts : getDefaultBlogPosts(data)) : [];
  const hasBlog = llmBlogPosts.length > 0;
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');

  const servicesList = showServicesLocations ? data.services.map(s => `- [${s}](${base}/services/${slugify(s)}-${slugify(data.city)}.html)`).join('\n') : '';
  const areasList = showServicesLocations ? data.serviceAreas.map(a => `- [${a}](${base}/locations/${slugify(a)}.html)`).join('\n') : '';
  const blogList = hasBlog
    ? llmBlogPosts.map(p => `- [${p.title}](${base}/blog/${slugify(p.slug || p.title)}.html)`).join('\n')
    : '';

  const matrixList = (tier === '3' && data.enableMatrixPages) ? data.services.flatMap(s =>
    data.serviceAreas.map(l => `- [${s} in ${l}](${base}/matrix/${slugify(s)}-in-${slugify(l)}.html)`)
  ).join('\n') : '';

  const individualCalcsList = isRestoration
    ? CALCULATORS.map(c => `- [${c.title} Calculator](${base}/calculators/${c.slug}.html)`).join('\n')
    : '';

  return `# ${data.businessName}

> ${data._metaDescription || `Professional ${data.services[0] || 'restoration'} services in ${data.city}, ${data.state}.`}

## Contact
- Phone: ${data.phone}
${data.email ? `- Email: ${data.email}` : ''}
- Address: ${formatDisplayAddress(data.address, data.city, data.state)}

## Pages
- [Home](${base}/)
- [About](${base}/about.html)
- [Contact](${base}/contact.html)
- [FAQ](${base}/faq.html)
- [Gallery](${base}/gallery.html)
- [Calculators](${base}/calculator.html)
${individualCalcsList ? individualCalcsList + '\n' : ''}${hasBlog ? `- [Blog](${base}/blog.html)` : ''}
${showServicesLocations ? `\n## Services\n${servicesList}\n\n## Service Areas\n${areasList}` : ''}
${hasBlog ? `\n## Blog Posts\n${blogList}` : ''}
${matrixList ? `\n## Combination Pages\n${matrixList}` : ''}

## Sitemap
- [XML Sitemap](${base}/sitemap.xml)
- [HTML Sitemap](${base}/sitemap.html)
`;
}

// ─── HTML SITEMAP ──────────────────────────────────────────────────────────

export function generateHTMLSitemap(data: WDBusinessData, domain: string): string {
  data = sanitizeBusinessData(data);
  const theme = resolveTheme(data);
  const base = getSiteUrl(data, domain);
  const tier = data.publishTier || '1';
  const showServicesLocations = tier === '2' || tier === '3';
  const showBlog = (tier === '2' || tier === '3') && (data.generateBlog !== undefined ? data.generateBlog : (data.blogPosts && data.blogPosts.length > 0));
  const htmlBlogPosts = showBlog ? ((data.blogPosts && data.blogPosts.length > 0) ? data.blogPosts : getDefaultBlogPosts(data)) : [];
  const hasBlog = htmlBlogPosts.length > 0;
  const fullTheme = resolveTheme(data);
  const fontUrl = FONT_URLS[fullTheme.fontFamily];
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');
  const fontLink = fontUrl
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">`
    : '';

  const serviceLinks = data.services.map(s =>
    `<li><a href="services/${slugify(s)}-${slugify(data.city)}.html">${s} — ${data.city}</a></li>`
  ).join('\n            ');

  const locationLinks = data.serviceAreas.map(a =>
    `<li><a href="locations/${slugify(a)}.html">${a}</a></li>`
  ).join('\n            ');

  const blogLinks = hasBlog
    ? htmlBlogPosts.map(p =>
        `<li><a href="blog/${slugify(p.slug || p.title)}.html">${p.title}</a></li>`
      ).join('\n            ')
    : '';

  const matrixLinks = (tier === '3' && data.enableMatrixPages) ? data.services.flatMap(s =>
    data.serviceAreas.map(l => `<li><a href="matrix/${slugify(s)}-in-${slugify(l)}.html">${s} in ${l}</a></li>`)
  ).join('\n            ') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitemap — ${data.businessName}</title>
  <meta name="description" content="Complete sitemap for ${data.businessName}. Browse all pages, services, locations${hasBlog ? ', and blog posts' : ''}.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${base}/sitemap">
  ${fontLink}
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:${theme.fontFamily},sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7}
    .container{max-width:900px;margin:0 auto;padding:2rem 1.5rem}
    h1{color:${theme.primaryColor};font-size:2rem;margin-bottom:.5rem}
    .subtitle{color:#64748b;margin-bottom:2.5rem}
    .sitemap-section{margin-bottom:2.5rem;background:#fff;border-radius:12px;padding:1.5rem 2rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
    .sitemap-section h2{color:${theme.primaryColor};font-size:1.25rem;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:2px solid ${theme.primaryColor}22}
    .sitemap-section ul{list-style:none;columns:2;column-gap:2rem}
    .sitemap-section li{padding:.35rem 0;break-inside:avoid}
    .sitemap-section a{color:#334155;text-decoration:none;transition:color .2s}
    .sitemap-section a:hover{color:${theme.secondaryColor};text-decoration:underline}
    @media(max-width:640px){.sitemap-section ul{columns:1}}
  </style>
</head>
<body>
  ${generateNav(data)}
  <div class="container">
    <h1>Sitemap</h1>
    <p class="subtitle">All pages on ${data.businessName}</p>

    <div class="sitemap-section">
      <h2>Main Pages</h2>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="about">About Us</a></li>
        <li><a href="contact">Contact</a></li>
        <li><a href="faq">FAQ</a></li>
        <li><a href="gallery">Gallery</a></li>
        <li><a href="calculator">Calculators</a></li>
        ${hasBlog ? '<li><a href="blog">Blog</a></li>' : ''}
        <li><a href="privacy">Privacy Policy</a></li>
        <li><a href="terms">Terms of Service</a></li>
      </ul>
    </div>

    ${isRestoration ? `
    <div class="sitemap-section">
      <h2>Calculators</h2>
      <ul>
        ${CALCULATORS.map(c => `<li><a href="calculators/${c.slug}">${c.title}</a></li>`).join('\n        ')}
      </ul>
    </div>
    ` : ''}

    ${showServicesLocations ? `
    <div class="sitemap-section">
      <h2>Services</h2>
      <ul>
            ${serviceLinks}
      </ul>
    </div>

    <div class="sitemap-section">
      <h2>Service Areas</h2>
      <ul>
            ${locationLinks}
      </ul>
    </div>
    ` : ''}

    ${matrixLinks ? `
    <div class="sitemap-section">
      <h2>Local Service Combinations</h2>
      <ul>
            ${matrixLinks}
      </ul>
    </div>
    ` : ''}

    ${hasBlog ? `<div class="sitemap-section">
      <h2>Blog Posts</h2>
      <ul>
            ${blogLinks}
      </ul>
    </div>` : ''}
  </div>
  ${generateFooter(data)}
</body>
</html>`;
}

// ─── MAIN EXPORT: Generate All Files ──────────────────────────────────────

export interface WDGeneratedFiles {
  [filename: string]: string;
}

export function generateWaterDamageWebsite(
  data: WDBusinessData,
  domain: string
): WDGeneratedFiles {
  const files: WDGeneratedFiles = {};

  // Core pages
  files['index.html']      = generateHomepage(data, domain);
  files['about.html']      = generateAboutPage(data, domain);
  files['contact.html']    = generateContactPage(data, domain);
  files['faq.html']        = generateFAQPage(data, domain);
  files['calculator.html'] = generateCalculatorPage(data, domain);

  // Individual calculator pages - only for restoration categories
  const isRestoration = ['water-damage', 'mold-remediation', 'fire-damage'].includes(data._categoryId || 'water-damage');
  if (isRestoration) {
    for (let i = 0; i < CALCULATORS.length; i++) {
      files[`calculators/${CALCULATORS[i].slug}.html`] = generateSingleCalculatorPage(data, i, domain);
    }
  }
  files['gallery.html']    = generateGalleryPage(data, domain);
  const tier = data.publishTier || '1';

  const showBlog = (tier === '2' || tier === '3') && (data.generateBlog !== undefined ? data.generateBlog : (data.blogPosts && data.blogPosts.length > 0));
  if (showBlog) {
    files['blog.html'] = generateBlogArchivePage(data, domain);
    const displayPosts = data.blogPosts && data.blogPosts.length > 0 ? data.blogPosts : getDefaultBlogPosts(data);
    for (const post of displayPosts) {
      const filename = `blog/${slugify(post.slug || post.title)}.html`;
      files[filename] = generateBlogPostPage(data, post, domain);
    }
  }

  files['privacy.html']    = generatePrivacyPage(data, domain);
  files['terms.html']      = generateTermsPage(data, domain);

  // Service pages
  if (tier === '2' || tier === '3') {
    for (const service of data.services) {
      const filename = `services/${slugify(service)}-${slugify(data.city)}.html`;
      files[filename] = generateServicePage(data, service, domain);
    }

    // Location pages
    for (const location of data.serviceAreas) {
      const filename = `locations/${slugify(location)}.html`;
      files[filename] = generateLocationPage(data, location, domain);
    }
  }

  // Matrix pages: service × location cross-product
  if (tier === '3' && data.enableMatrixPages) {
    for (const service of data.services) {
      for (const location of data.serviceAreas) {
        const filename = `matrix/${slugify(service)}-in-${slugify(location)}.html`;
        files[filename] = generateServiceLocationMatrixPage(data, service, location, domain);
      }
    }
  }

  // Inject floating CTA button into all HTML pages
  const floatingCTAHtml = generateFloatingCTA(data);
  if (floatingCTAHtml) {
    for (const filename of Object.keys(files)) {
      if (filename.endsWith('.html') && typeof files[filename] === 'string') {
        files[filename] = (files[filename] as string).replace('</body>', `  ${floatingCTAHtml}\n</body>`);
      }
    }
  }

  // Inject custom images uploaded by user (replaces Unsplash placeholders) and update alt attributes
  if (data.customImages && Object.keys(data.customImages).length > 0) {
    for (const [filename, html] of Object.entries(files)) {
      if (!filename.endsWith('.html') || typeof html !== 'string') continue;
      let updated = html;
      for (const [key, customSrc] of Object.entries(data.customImages)) {
        if (!customSrc) continue;
        // Locate all <img> tags, then process the ones matching data-placeholder="${key}"
        updated = updated.replace(/<img([^>]+)>/gs, (match, attrs) => {
          if (attrs.includes(`data-placeholder="${key}"`)) {
            // Replace src
            let newAttrs = attrs.replace(/src="[^"]*"/g, `src="${customSrc}"`);
            
            // Replace alt if it starts with PLACEHOLDER: or contains placeholder
            const altText = `${data.primaryKeyword} - ${data.businessName} - ${data.city}`;
            if (newAttrs.includes('alt="')) {
              newAttrs = newAttrs.replace(/alt="PLACEHOLDER:[^"]*"/gi, `alt="${altText}"`);
              newAttrs = newAttrs.replace(/alt="[^"]*placeholder[^"]*"/gi, `alt="${altText}"`);
            } else {
              newAttrs += ` alt="${altText}"`;
            }
            return `<img${newAttrs}>`;
          }
          return match;
        });
      }
      files[filename] = updated;
    }
  }

  // SEO files
  files['sitemap.xml']      = generateSitemap(data, domain);
  files['sitemap.html']     = generateHTMLSitemap(data, domain);
  files['robots.txt']       = generateRobots(data, domain);
  files['llms.txt']         = generateLLMsTxt(data, domain);

  // Netlify headers for performance + indexing
  files['_headers'] = `/*
  Cache-Control: public, max-age=3600
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-Robots-Tag: index, follow

/*.html
  Cache-Control: public, max-age=3600
  X-Robots-Tag: index, follow

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=86400

/robots.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=86400

/llms.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=86400

/sitemap.html
  Cache-Control: public, max-age=3600
  X-Robots-Tag: index, follow`;

  return files;
}
