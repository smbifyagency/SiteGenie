/**
 * Local Service Engine
 * Thin wrapper over the water-damage generator that injects category-specific
 * copy and defaults. Adding a new vertical = adding one CategoryConfig entry
 * in local-service-categories.ts — no generator changes needed.
 */

import { generateWaterDamageWebsite, WDBusinessData } from './water-damage-generator.js';
import { getCategoryConfig, CategoryConfig, CATEGORY_PLACEHOLDER_IMAGES } from './local-service-categories.js';

export type { CategoryConfig };
export { getCategoryConfig };

/** Replace {{city}}, {{state}}, {{businessName}} placeholders in a string. */
function interpolate(str: string, data: Record<string, any>): string {
  return str
    .replace(/\{\{city\}\}/g, data.city || '')
    .replace(/\{\{state\}\}/g, data.state || '')
    .replace(/\{\{businessName\}\}/g, data.businessName || '');
}

function interpolateArr(arr: string[], data: Record<string, any>): string[] {
  return arr.map(s => interpolate(s, data));
}

function createLoremParagraphs(count = 2): string[] {
  const paragraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla quis lorem ut libero malesuada feugiat.',
  ];

  return paragraphs.slice(0, count);
}

function createLoremProcessSteps(): Array<{ step: number; heading: string; body: string }> {
  return [
    {
      step: 1,
      heading: 'Lorem ipsum dolor sit amet',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    {
      step: 2,
      heading: 'Consectetur adipiscing elit',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus suscipit tortor eget felis porttitor volutpat.',
    },
    {
      step: 3,
      heading: 'Sed do eiusmod tempor',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur aliquet quam id dui posuere blandit.',
    },
  ];
}

function createLoremFaqs(): Array<{ question: string; answer: string }> {
  return [
    {
      question: 'Lorem ipsum dolor sit amet?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sollicitudin molestie malesuada.',
    },
    {
      question: 'Consectetur adipiscing elit?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ultricies ligula sed magna dictum porta.',
    },
    {
      question: 'Sed do eiusmod tempor incididunt?',
      answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui.',
    },
  ];
}

function createLoremWhyUsPoints(): Array<{ icon: string; heading: string; body: string }> {
  return [
    { icon: '✨', heading: 'Lorem ipsum dolor', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { icon: '⚡', heading: 'Sed do eiusmod', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { icon: '✅', heading: 'Praesent libero', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { icon: '🚀', heading: 'Curabitur aliquet', body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
  ];
}

function createLoremSeoBody(): string {
  return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
}

/**
 * Generate a full local-service website for any supported category.
 *
 * @param categoryId  e.g. "water-damage" | "plumbing"
 * @param rawData     business data from the editor / wizard
 * @param domain      netlify subdomain slug (e.g. "rapid-dry-restoration")
 */
export function generateLocalServiceWebsite(
  categoryId: string,
  rawData: Record<string, any>,
  domain: string
): Record<string, string> {
  const config = getCategoryConfig(categoryId);

  // Build why-us points from config if rawData doesn't already have them
  const icons = ['✨', '⚡', '✅', '🚀', '🛠️', '🔒'];
  const whyUsPoints = Array.isArray(rawData._whyUsPoints) && rawData._whyUsPoints.length > 0
    ? rawData._whyUsPoints
    : (config.copy.whyUsPoints && config.copy.whyUsPoints.length > 0
      ? config.copy.whyUsPoints.map((text, idx) => ({
          icon: icons[idx % icons.length],
          heading: text.split(' — ')[0] || text,
          body: text
        }))
      : createLoremWhyUsPoints());

  // Merge category defaults into business data
  const enriched: WDBusinessData = {
    // Defaults from category config
    primaryKeyword: config.defaultPrimaryKeyword,
    primaryColor: config.defaultPalette.primary,
    secondaryColor: config.defaultPalette.secondary,
    services: config.defaultServices,

    // Business data overrides everything
    ...rawData,

    // Inject category copy fields (prefixed with _ to avoid DB confusion)
    _categoryId: config.id,
    _heroTagline: config.copy.heroTagline,
    _heroSubheading: config.copy.heroSubheading,
    _ctaHeadline: config.copy.ctaHeadline,
    _ctaSubtext: config.copy.ctaSubtext,
    _ctaButton: config.copy.ctaButton,
    _emergencyBadge: config.copy.emergencyBadge,
    _trustBadges: config.copy.trustBadges,
    _whyUsPoints: whyUsPoints,
    _schemaType: config.seo.schemaType,
    _calculator: config.calculator,
  } as any;

  // Inject extended copy fields if defined in the category config
  const c = config.copy;
  const d = enriched as any;

  if (c.schemaDescription)      d._schemaDescription      = interpolate(c.schemaDescription, enriched);
  if (c.schemaOfferCatalogName) d._schemaOfferCatalogName = c.schemaOfferCatalogName;
  if (c.footerEmergencyText)    d._footerEmergencyText    = interpolate(c.footerEmergencyText, enriched);
  if (c.whatsappMessage)        d._whatsappMessage        = c.whatsappMessage;
  if (c.servicePageBenefits)    d._servicePageBenefits    = c.servicePageBenefits;

  // Use AI-generated content when available (set by server deploy route),
  // otherwise fall back to the template copy from the category config.
  d._introParas   = d._aiIntroParas   ?? (c.introParas && c.introParas.length > 0 ? c.introParas.map(p => interpolate(p, enriched)) : createLoremParagraphs(2));
  d._processSteps = d._aiProcessSteps ?? (c.processSteps && c.processSteps.length > 0 ? c.processSteps.map(step => ({
    step: step.step,
    heading: interpolate(step.heading, enriched),
    body: interpolate(step.body, enriched)
  })) : createLoremProcessSteps());
  d._faqs         = d._aiFaqs         ?? (c.faqs && c.faqs.length > 0 ? c.faqs.map(faq => ({
    question: interpolate(faq.question, enriched),
    answer: interpolate(faq.answer, enriched)
  })) : createLoremFaqs());
  d._seoBody      = d._aiSeoBody      ?? (c.seoBody ? interpolate(c.seoBody, enriched) : createLoremSeoBody());

  if (c.processH2) d._processH2 = c.processH2;
  if (c.faqH2)     d._faqH2     = c.faqH2;

  // Inject category-specific placeholder images so each vertical gets
  // visually relevant defaults before the user uploads their own photos.
  const categoryImages = CATEGORY_PLACEHOLDER_IMAGES[categoryId];
  if (categoryImages) d._categoryImages = categoryImages;

  return generateWaterDamageWebsite(enriched, domain) as Record<string, string>;
}

/**
 * Enrich raw business data with category config, exactly as generateLocalServiceWebsite does,
 * but without running the full website generation. Returns WDBusinessData-like object
 * that can be passed to individual page generators (generateServicePage, generateLocationPage, etc.)
 */
export function enrichBusinessDataForCategory(
  categoryId: string,
  rawData: Record<string, any>
): Record<string, any> {
  const config = getCategoryConfig(categoryId);

  const icons = ['✨', '⚡', '✅', '🚀', '🛠️', '🔒'];
  const whyUsPoints = Array.isArray(rawData._whyUsPoints) && rawData._whyUsPoints.length > 0
    ? rawData._whyUsPoints
    : (config.copy.whyUsPoints && config.copy.whyUsPoints.length > 0
      ? config.copy.whyUsPoints.map((text, idx) => ({
          icon: icons[idx % icons.length],
          heading: text.split(' — ')[0] || text,
          body: text
        }))
      : createLoremWhyUsPoints());

  const enriched: any = {
    primaryKeyword: config.defaultPrimaryKeyword,
    primaryColor: config.defaultPalette.primary,
    secondaryColor: config.defaultPalette.secondary,
    services: config.defaultServices,
    ...rawData,
    _categoryId: config.id,
    _heroTagline: config.copy.heroTagline,
    _heroSubheading: config.copy.heroSubheading,
    _ctaHeadline: config.copy.ctaHeadline,
    _ctaSubtext: config.copy.ctaSubtext,
    _ctaButton: config.copy.ctaButton,
    _emergencyBadge: config.copy.emergencyBadge,
    _trustBadges: config.copy.trustBadges,
    _whyUsPoints: whyUsPoints,
    _schemaType: config.seo.schemaType,
    _calculator: config.calculator,
  };

  const c = config.copy;
  if (c.schemaDescription)      enriched._schemaDescription      = interpolate(c.schemaDescription, enriched);
  if (c.schemaOfferCatalogName) enriched._schemaOfferCatalogName = c.schemaOfferCatalogName;
  if (c.footerEmergencyText)    enriched._footerEmergencyText    = interpolate(c.footerEmergencyText, enriched);
  if (c.whatsappMessage)        enriched._whatsappMessage        = c.whatsappMessage;
  if (c.servicePageBenefits)    enriched._servicePageBenefits    = c.servicePageBenefits;

  enriched._introParas   = enriched._aiIntroParas   ?? (c.introParas && c.introParas.length > 0 ? c.introParas.map(p => interpolate(p, enriched)) : createLoremParagraphs(2));
  enriched._processSteps = enriched._aiProcessSteps ?? (c.processSteps && c.processSteps.length > 0 ? c.processSteps.map(step => ({
    step: step.step,
    heading: interpolate(step.heading, enriched),
    body: interpolate(step.body, enriched)
  })) : createLoremProcessSteps());
  enriched._faqs         = enriched._aiFaqs         ?? (c.faqs && c.faqs.length > 0 ? c.faqs.map(faq => ({
    question: interpolate(faq.question, enriched),
    answer: interpolate(faq.answer, enriched)
  })) : createLoremFaqs());
  enriched._seoBody      = enriched._aiSeoBody      ?? (c.seoBody ? interpolate(c.seoBody, enriched) : createLoremSeoBody());

  if (c.processH2) enriched._processH2 = c.processH2;
  if (c.faqH2)     enriched._faqH2     = c.faqH2;

  const categoryImages = CATEGORY_PLACEHOLDER_IMAGES[categoryId];
  if (categoryImages) enriched._categoryImages = categoryImages;

  return enriched;
}
