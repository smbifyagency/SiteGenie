import { BusinessData } from "../../../shared/schema.js";
import { templates, Template } from "./templates.js";
import {
  WEBSITE_LAYOUT_CONFIG,
  getFeaturesGridColumns,
  getContactCardsGridColumns,
  getAboutGridColumns,
  getResponsiveBreakpoint
} from "./website-layout-config.js";

/** Truncate a string to maxLen at word boundary. */
function truncateText(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen - 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? truncated.slice(0, lastSpace) : truncated).trimEnd() + '…';
}
function seoTitle(t: string): string { return truncateText(t, 60); }
function seoDescription(d: string): string { return truncateText(d, 160); }

// Site settings interface for tracking codes
interface SiteSetting {
  id: string;
  category: string;
  name: string;
  displayName: string;
  description?: string;
  code: string;
  isActive: boolean;
  placement: string;
}

// Helper function to inject tracking codes based on placement
function injectTrackingCodes(siteSettings: SiteSetting[] | undefined, placement: string): string {
  if (!siteSettings || siteSettings.length === 0) return '';

  return siteSettings
    .filter(setting => setting.isActive && setting.placement === placement && setting.code && setting.code.trim())
    .map(setting => `\n    <!-- ${setting.displayName} -->\n    ${setting.code}`)
    .join('\n');
}

// Default icons for features
const defaultIcons = [
  "fas fa-star",
  "fas fa-shield-alt",
  "fas fa-clock",
  "fas fa-thumbs-up",
  "fas fa-award",
  "fas fa-users"
];

// Helper functions for generating random trust indicators
function generateRandomRating(): number {
  // Generate random rating between 4.3 and 4.9
  return Math.round((Math.random() * (4.9 - 4.3) + 4.3) * 10) / 10;
}

function generateRandomReviewCount(): number {
  // Generate random review count between 45 and 280
  return Math.floor(Math.random() * (280 - 45) + 45);
}

function generateRandomCustomerCount(): number {
  // Generate random customer count between 200 and 2500
  return Math.floor(Math.random() * (2500 - 200) + 200);
}

function formatCustomerCount(count: number): string {
  if (count >= 1000) {
    return Math.floor(count / 100) * 100 / 1000 + 'K+';
  }
  return Math.floor(count / 50) * 50 + '+';
}

// Deterministic functions for consistent ratings across all pages
function generateDeterministicRating(businessName: string): number {
  let hash = 0;
  for (let i = 0; i < businessName.length; i++) {
    hash = ((hash << 5) - hash) + businessName.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const normalized = Math.abs(hash) / Math.pow(2, 31);
  return Math.round((normalized * (4.9 - 4.3) + 4.3) * 10) / 10;
}

function generateDeterministicReviewCount(businessName: string): number {
  let hash = 0;
  for (let i = 0; i < businessName.length; i++) {
    hash = ((hash << 7) - hash) + businessName.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash) / Math.pow(2, 31);
  return Math.floor(normalized * (280 - 45) + 45);
}

function generateDeterministicCustomerCount(businessName: string): number {
  let hash = 0;
  for (let i = 0; i < businessName.length; i++) {
    hash = ((hash << 3) - hash) + businessName.charCodeAt(i);
    hash = hash & hash;
  }
  const normalized = Math.abs(hash) / Math.pow(2, 31);
  return Math.floor(normalized * (2500 - 200) + 200);
}

// Generate proper alt text for images
function generateCategoryImageAlt(data: BusinessData, context: 'team' | 'equipment' | 'results'): string {
  const service = data.heroService || data.category;
  const business = data.businessName;
  const location = data.heroLocation;

  switch (context) {
    case 'team':
      return `Professional ${service} team at ${business} in ${location}`;
    case 'equipment':
      return `${service} equipment and tools used by ${business} in ${location}`;
    case 'results':
      return `Quality ${service} results and workmanship by ${business} in ${location}`;
    default:
      return `${service} services by ${business} in ${location}`;
  }
}

// Helper to safely parse markdown text (like links/bold) in user-provided or AI content
function parseMarkdownText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    // Parse links: [Link text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3b82f6; text-decoration: underline;">$1</a>')
    // Parse bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

// Generate category-appropriate terms for different business types
function getCategorySpecificTerms(category: string): {
  urgentTerm: string;
  availabilityTerm: string;
  processTerm: string;
  deliveryTerm: string;
  maintenanceTerm: string;
  projectTerm: string;
  consultationTerm: string;
} {
  const cat = category.toLowerCase();

  // Legal & Professional Services
  if (cat.includes('attorney') || cat.includes('lawyer') || cat.includes('legal')) {
    return {
      urgentTerm: 'urgent legal consultation',
      availabilityTerm: 'flexible scheduling including evenings',
      processTerm: 'legal strategy development',
      deliveryTerm: 'case resolution',
      maintenanceTerm: 'ongoing legal support',
      projectTerm: 'legal matter',
      consultationTerm: 'Free Consultation'
    };
  }

  // Financial Services
  if (cat.includes('accounting') || cat.includes('tax') || cat.includes('financial') || cat.includes('bookkeeping')) {
    return {
      urgentTerm: 'rush tax preparation',
      availabilityTerm: 'extended hours during tax season',
      processTerm: 'financial analysis',
      deliveryTerm: 'accurate financial reporting',
      maintenanceTerm: 'ongoing financial management',
      projectTerm: 'financial project',
      consultationTerm: 'Free Assessment'
    };
  }

  // Healthcare Services
  if (cat.includes('dental') || cat.includes('medical') || cat.includes('health') || cat.includes('doctor') || cat.includes('clinic')) {
    return {
      urgentTerm: 'same-day appointments',
      availabilityTerm: 'flexible scheduling options',
      processTerm: 'comprehensive examination',
      deliveryTerm: 'personalized treatment',
      maintenanceTerm: 'preventive care',
      projectTerm: 'treatment plan',
      consultationTerm: 'Schedule Appointment'
    };
  }

  // Marketing & Creative Services
  if (cat.includes('marketing') || cat.includes('advertising') || cat.includes('design') || cat.includes('web') || cat.includes('digital')) {
    return {
      urgentTerm: 'rush project delivery',
      availabilityTerm: 'flexible meeting schedules',
      processTerm: 'creative development',
      deliveryTerm: 'campaign launch',
      maintenanceTerm: 'ongoing optimization',
      projectTerm: 'marketing campaign',
      consultationTerm: 'Free Strategy Session'
    };
  }

  // Real Estate
  if (cat.includes('real estate') || cat.includes('realtor') || cat.includes('property')) {
    return {
      urgentTerm: 'immediate property viewing',
      availabilityTerm: 'weekend and evening showings',
      processTerm: 'market analysis',
      deliveryTerm: 'successful transaction',
      maintenanceTerm: 'ongoing market updates',
      projectTerm: 'property transaction',
      consultationTerm: 'Free Market Analysis'
    };
  }

  // Consulting & Business Services
  if (cat.includes('consulting') || cat.includes('business') || cat.includes('management') || cat.includes('coach')) {
    return {
      urgentTerm: 'priority consultation',
      availabilityTerm: 'flexible meeting arrangements',
      processTerm: 'strategic analysis',
      deliveryTerm: 'business growth',
      maintenanceTerm: 'ongoing support',
      projectTerm: 'business initiative',
      consultationTerm: 'Free Business Review'
    };
  }

  // Default for technical/trade services
  return {
    urgentTerm: 'emergency service',
    availabilityTerm: '24/7 availability',
    processTerm: 'technical diagnosis',
    deliveryTerm: 'quality installation',
    maintenanceTerm: 'preventive maintenance',
    projectTerm: 'service project',
    consultationTerm: 'Free Estimates'
  };
}

// Helper function for consistent pseudo-random selection based on string
function getSpinIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % max;
}

// Generate location-specific content for unique page experiences
function generateLocationSpecificContent(data: BusinessData, locationName: string): {
  heroDescription: string;
  aboutContent: string;
  whyChooseContent: string;
  serviceAreasContent: string;
  emergencyContent: string;
  localBenefits: string[];
} {
  const service = data.heroService.toLowerCase();
  const category = data.category.toLowerCase();
  const businessName = data.businessName;
  const yearsExp = data.yearsInBusiness;
  const terms = getCategorySpecificTerms(category);
  const v = getSpinIndex(locationName, 3);

  const heroDescriptions = [
    `Looking for reliable ${service} services in ${locationName}? ${businessName} provides comprehensive ${service} solutions throughout the ${locationName} area. Our local ${category} professionals are equipped to handle everything from routine consultations to ${terms.urgentTerm}, ensuring residents and businesses in ${locationName} receive prompt, quality service when they need it most.`,
    `When you need top-tier ${service} in ${locationName}, ${businessName} is your trusted choice. We deliver dedicated ${service} to the entire ${locationName} region. From standard projects to ${terms.urgentTerm}, our ${category} specialists focus on delivering reliable, swift results that our community deserves.`,
    `${businessName} offers professional ${service} tailored to the unique needs of ${locationName}. Whether you require everyday support or ${terms.urgentTerm}, our experienced ${category} team is ready to respond. We pride ourselves on offering outstanding service and commitment across all of ${locationName}.`
  ];

  const aboutContents = [
    `At ${businessName}, we understand the unique needs of ${locationName} residents and businesses. Having served the ${locationName} community for ${yearsExp}+ years, we've built our reputation on delivering exceptional ${service} services with a personal touch. Our team of experienced ${category} professionals knows the local market conditions, regulations, and specific challenges faced by ${locationName} clients. Whether you need immediate assistance or are planning a major ${terms.projectTerm}, our local expertise ensures you get the right solution the first time.`,
    `Serving ${locationName} for over ${yearsExp} years, ${businessName} has established a strong foundation of trust and excellence in ${service}. Our ${category} experts are deeply familiar with ${locationName}'s environment, requirements, and community preferences. No matter if you are tackling a minor task or embarking on a complex ${terms.projectTerm}, we tailor our approach to fit your exact situation with proven, localized strategies.`,
    `For ${yearsExp}+ years, ${businessName} has been the go-to resource for ${service} across ${locationName}. We blend modern ${category} methods with a deep understanding of local nuances. Because we live and work alongside our ${locationName} clients, we understand the importance of quality, integrity, and swift resolution. Let our team guide you seamlessly through your next ${terms.projectTerm}.`
  ];

  const whyChooseContents = [
    `What sets us apart in ${locationName} is our commitment to the community we serve. We're not just another ${category} company – we're your neighbors who take pride in helping ${locationName} residents and businesses succeed. Our ${service} specialists maintain extensive knowledge of local regulations, market conditions, and the specific challenges that come with serving the ${locationName} area. This local expertise, combined with our ${yearsExp}+ years of experience, means faster response times, accurate assessments, and solutions that are tailored to our local environment.`,
    `Clients in ${locationName} consistently choose us because we prioritize transparent communication and flawless execution. As a premier ${category} provider in the area, we hold ourselves to the highest standards. We pair ${yearsExp}+ years of practical expertise with an intrinsic knowledge of ${locationName}'s specific demands, guaranteeing that every part of your ${service} goes smoothly and successfully.`,
    `Choosing ${businessName} means partnering with a ${category} team that genuinely cares about ${locationName}. We stand out by combining rapid response times, tailored methodologies, and an unwavering commitment to client satisfaction. With ${yearsExp} years of hands-on experience, our crew delivers long-term ${service} solutions crafted to thrive in ${locationName}'s exact conditions.`
  ];

  const serviceAreasContents = [
    `We proudly serve all neighborhoods throughout ${locationName}, including residential areas, commercial districts, and business zones. Our ${category} professionals are familiar with the area's unique characteristics, local preferences, and optimal service approaches, which means we can provide you with personalized ${service} services. From established neighborhoods with traditional needs to new developments with modern requirements, we have the experience to handle the full spectrum of ${service} challenges in ${locationName}.`,
    `Our service coverage spans the entire ${locationName} boundary, reaching residential clients, corporate offices, and local storefronts. By understanding the distinct layout and community nuances of ${locationName}, our ${category} team provides highly responsive ${service}. No matter where you are located within the community, you can rely on our prompt and courteous support.`,
    `${businessName} is fully equipped to deploy across any section of ${locationName}. We regularly service historic districts, suburban quarters, and active commercial centers alike. This broad accessibility means that outstanding ${service} and premier ${category} solutions are always just a call away for anyone living or working in ${locationName}.`
  ];

  const emergencyContents = [
    `${locationName} clients know they can count on us when they need ${terms.urgentTerm}. We understand that important ${service} needs don't always happen during regular business hours, which is why we offer ${terms.availabilityTerm} throughout the ${locationName} area. Our local presence means quicker response times and our familiarity with ${locationName}'s unique characteristics helps us address your needs efficiently and effectively.`,
    `When circumstances demand a ${terms.urgentTerm}, ${businessName} stands ready to help ${locationName} without hesitation. Offering proactive ${terms.availabilityTerm}, our team responds quickly to minimize stress and downtime. Because we are locally based, we reach you faster and resolve critical ${service} matters effectively.`,
    `Urgent situations require a steady, responsive hand. If you encounter a ${terms.urgentTerm} in ${locationName}, our specialists are on standby. We provide ${terms.availabilityTerm} to ensure you are never left waiting. Our close proximity and intimate knowledge of ${locationName} routes allow us to deliver swift, dependable ${service} relief.`
  ];

  const localBenefits = [
    [
      `Local ${locationName} expertise with ${yearsExp}+ years serving the community`,
      `Familiar with ${locationName} regulations and local requirements`,
      `Quick response times throughout all ${locationName} neighborhoods`,
      `Understanding of local market and common ${locationName} client needs`,
      `Established relationships with local partners for comprehensive service`,
      `Community reputation built on trust and quality results`
    ],
    [
      `Deeply rooted in the ${locationName} area with ${yearsExp} years of service`,
      `Expert navigation of ${locationName} guidelines and codes`,
      `Rapid dispatch and arrival times across ${locationName}`,
      `Customized strategies specifically for ${locationName} environments`,
      `Strong network of regional ${category} resources`,
      `Proven track record of 5-star customer satisfaction`
    ],
    [
      `Over ${yearsExp} years of focused experience operating in ${locationName}`,
      `Fully compliant with all regional and local mandates`,
      `Prioritized scheduling available for ${locationName} addresses`,
      `Tailored ${service} that matches local lifestyle and business needs`,
      `Collaborative local partnerships to enhance project delivery`,
      `Hundreds of successful projects completed locally`
    ]
  ];

  return {
    heroDescription: heroDescriptions[v],
    aboutContent: aboutContents[v],
    whyChooseContent: whyChooseContents[v],
    serviceAreasContent: serviceAreasContents[v],
    emergencyContent: emergencyContents[v],
    localBenefits: localBenefits[v]
  };
}

// Generate service-specific content for comprehensive service pages
function generateServiceSpecificContent(data: BusinessData, serviceName: string): {
  serviceDescription: string;
  processSteps: string[];
  whyChooseForService: string;
  commonIssues: string[];
  serviceFeatures: string[];
  qualityAssurance: string;
} {
  const location = data.heroLocation;
  const businessName = data.businessName;
  const yearsExp = data.yearsInBusiness;
  const service = serviceName.toLowerCase();
  const category = data.category.toLowerCase();
  const terms = getCategorySpecificTerms(category);
  const v = getSpinIndex(serviceName, 3);

  const serviceDescriptions = [
    `Our ${service} services in ${location} are designed to meet the highest standards of quality and customer satisfaction. At ${businessName}, we've specialized in ${service} for ${yearsExp}+ years, developing proven methods and best practices that ensure reliable, long-lasting results. Our experienced professionals use industry-best approaches and quality resources to deliver ${service} solutions that exceed industry standards and customer expectations.`,
    `Delivering top-notch ${service} is at the core of what we do in ${location}. ${businessName} brings ${yearsExp}+ years of dedicated experience to every project. We handle all ${service} needs with precision, using the latest tools and established techniques. Our goal is to provide results that speak for themselves, maintaining the high quality our ${category} brand is known for.`,
    `When you need expert ${service} in ${location}, ${businessName} is ready to help. Our seasoned specialists bring over ${yearsExp} years of hands-on ${category} knowledge to ensure your project is completed flawlessly. Focusing on both efficiency and durability, our comprehensive ${service} methodologies guarantee outcomes that stand the test of time.`
  ];

  const processStepsLists = [
    [
      `Initial consultation and ${service} assessment`,
      `Detailed analysis and comprehensive evaluation`,
      `Transparent pricing with no hidden fees`,
      `Professional ${terms.processTerm} and implementation`,
      `Quality verification and ${terms.deliveryTerm}`,
      `Project completion and client review`,
      `Follow-up support and satisfaction guarantee`
    ],
    [
      `In-depth discovery session and scope outline`,
      `Customized ${service} strategy formulation`,
      `Clear, upfront cost estimation`,
      `Dedicated execution of ${terms.processTerm}`,
      `Rigorous quality control checks`,
      `Final walk-through and approval`,
      `Ongoing ${terms.maintenanceTerm}`
    ],
    [
      `Preliminary site visit and requirement gathering`,
      `Strategic planning for optimal ${service} results`,
      `Detailed proposal and timeline creation`,
      `Seamless integration and ${terms.processTerm}`,
      `Thorough testing and ${terms.deliveryTerm}`,
      `Client handover and training (if applicable)`,
      `Extended reliability guarantee`
    ]
  ];

  const whyChooseForServices = [
    `When you choose ${businessName} for ${service} services, you're choosing a team that specializes in this exact type of work. Our ${service} specialists undergo continuous training to stay current with the latest industry standards, best practices, and regulatory requirements. We invest in quality tools and resources that allow us to work efficiently and deliver superior results. This focused expertise, combined with our ${yearsExp}+ years of experience in ${location}, means you get the benefit of proven methods and local knowledge.`,
    `Our extensive focus on ${service} makes ${businessName} the optimal choice. We believe in getting the job done right the first time. By equipping our technicians with leading-edge resources and continual training, we ensure that every detail meets precise ${category} standards. Leveraging ${yearsExp}+ years of experience within ${location}, we confidently address complexities that other providers might miss.`,
    `Trusting ${businessName} with your ${service} needs guarantees peace of mind. We refuse to cut corners, emphasizing safety, quality, and industry compliance on every assignment. Because our team lives and breathes ${category} solutions, we've perfected our approach over ${yearsExp} years in ${location}. Our deep expertise transforms a potentially stressful process into a seamless, positive experience.`
  ];

  const commonIssuesLists = [
    [
      `${terms.urgentTerm.charAt(0).toUpperCase() + terms.urgentTerm.slice(1)} and priority requests`,
      `${terms.maintenanceTerm.charAt(0).toUpperCase() + terms.maintenanceTerm.slice(1)} and regular check-ups`,
      `${service.charAt(0).toUpperCase() + service.slice(1)} improvements and updates`,
      `Compliance and regulatory requirements`,
      `Efficient ${service} solutions and optimization`,
      `Both commercial and residential ${service} needs`
    ],
    [
      `Rapid response for ${terms.urgentTerm}`,
      `Preventative ${terms.maintenanceTerm} routines`,
      `Modernization and ${service} upgrades`,
      `Safety inspections and certifications`,
      `Custom ${service} design and implementation`,
      `Scaleable solutions for varied project sizes`
    ],
    [
      `Immediate mitigation of ${terms.urgentTerm}`,
      `Scheduled ${terms.maintenanceTerm} adjustments`,
      `Overhaul of outdated ${service} installations`,
      `Adherence to local ${location} codes`,
      `Streamlined ${service} workflow enhancements`,
      `Specialized care for delicate or complex systems`
    ]
  ];

  const serviceFeaturesLists = [
    [
      `Licensed and insured ${category} professionals`,
      `${terms.availabilityTerm.charAt(0).toUpperCase() + terms.availabilityTerm.slice(1)} when you need us`,
      `Free consultations and transparent pricing`,
      `Quality resources and professional-grade approach`,
      `Comprehensive guarantees on all ${service} work`,
      `Professional, efficient service with minimal disruption`
    ],
    [
      `Vetted, experienced ${category} experts`,
      `Flexible scheduling, including ${terms.availabilityTerm}`,
      `Upfront estimates with zero surprises`,
      `Premium materials and advanced diagnostics`,
      `Robust warranty backing on all labor`,
      `Clean workspaces and respectful conduct`
    ],
    [
      `Highly trained and certified specialists`,
      `Punctual arrivals and reliable ${terms.availabilityTerm}`,
      `Clear communication from start to finish`,
      `State-of-the-art methodology for ${service}`,
      `Long-term reliability and satisfaction guarantee`,
      `Rapid project turnaround times`
    ]
  ];

  const qualityAssurances = [
    `Every ${service} project we complete comes with our comprehensive satisfaction guarantee. We stand behind our work with strong warranties and follow up to ensure your complete satisfaction. Our commitment to excellence in ${service} services has earned us the trust of ${location} clients for ${yearsExp}+ years, and we maintain this reputation through consistent, reliable service delivery and ongoing customer support.`,
    `We don't consider a ${service} job complete until you are fully satisfied. ${businessName} provides outstanding post-project support and solid warranties on our craftsmanship. It is this unwavering dedication to ${category} excellence that has solidified our ${yearsExp}-year reputation throughout the ${location} region.`,
    `Quality isn't just a promise; it's our standard protocol. All ${service} tasks performed by ${businessName} are strictly verified for reliability and safety. By providing robust guarantees and attentive follow-up care, we uphold the elite standards that ${location} residents have come to expect over our ${yearsExp}+ years of service.`
  ];

  return {
    serviceDescription: serviceDescriptions[v],
    processSteps: processStepsLists[v],
    whyChooseForService: whyChooseForServices[v],
    commonIssues: commonIssuesLists[v],
    serviceFeatures: serviceFeaturesLists[v],
    qualityAssurance: qualityAssurances[v]
  };
}

// Generate optimized meta description with 150-160 character limit
function generateOptimizedMetaDescription(data: BusinessData, pageType: string = 'home', specificService?: string): string {
  let baseDescription = '';

  if (pageType === 'home') {
    baseDescription = `Professional ${data.heroService.toLowerCase()} services in ${data.heroLocation}. ${data.heroDescription} Trusted & verified with ${data.yearsInBusiness}+ years experience. Call ${data.phone} for free estimates!`;
  } else if (pageType === 'service' && specificService) {
    baseDescription = `Expert ${specificService.toLowerCase()} services in ${data.heroLocation} by ${data.businessName}. Quality ${specificService.toLowerCase()} solutions with ${data.yearsInBusiness}+ years experience. Call ${data.phone} today!`;
  } else if (pageType === 'location') {
    const location = specificService || data.heroLocation;
    baseDescription = `Top-rated ${data.heroService.toLowerCase()} services in ${location}. Trusted ${data.businessName} professionals serving ${location} with quality results. Call ${data.phone} for immediate service!`;
  } else if (pageType === 'blog') {
    baseDescription = `Expert insights and tips about ${data.category.toLowerCase()} from ${data.businessName}. Professional advice from ${data.heroLocation}'s trusted ${data.category.toLowerCase()} experts with ${data.yearsInBusiness}+ years experience.`;
  }

  // Ensure description is between 150-160 characters
  if (baseDescription.length > 160) {
    baseDescription = baseDescription.substring(0, 157) + '...';
  } else if (baseDescription.length < 150) {
    // Add more keywords if too short
    const keywords = data.targetedKeywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length > 0) {
      const remainingChars = 160 - baseDescription.length;
      const additionalKeywords = keywords.slice(0, 2).join(', ');
      if (additionalKeywords.length <= remainingChars - 2) {
        baseDescription += ` ${additionalKeywords}.`;
      }
    }
  }

  return baseDescription;
}

// Generate SEO-friendly URLs with proper handling of special characters, diacritics, and readability
function generateSEOUrl(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize Unicode characters to NFD (decomposed form) for proper diacritic handling
    .normalize('NFD')
    // Remove diacritics/accents while preserving base characters
    .replace(/[\u0300-\u036f]/g, '')
    // Handle common replacements first
    .replace(/&/g, 'and')
    .replace(/%/g, 'percent')
    .replace(/\+/g, 'plus')
    .replace(/@/g, 'at')
    // Remove articles and common words that don't add SEO value
    .replace(/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/g, '')
    // Convert spaces and common separators to hyphens
    .replace(/[\s_.,;:|!\/\\\(\)\[\]{}'"` ~]/g, '-')
    // Remove all other special characters (keeping letters, numbers, and hyphens)
    .replace(/[^a-z0-9-]/g, '')
    // Clean up multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Ensure it's not empty
    || 'page';
}

// Generate clean, readable URLs specifically for services using the unified SEO slug function
function generateServiceUrl(serviceName: string, location: string): string {
  const serviceSlug = generateSEOUrl(serviceName) || 'service';
  const locationSlug = generateSEOUrl(location) || 'location';

  return `${serviceSlug}-services-${locationSlug}.html`;
}

// Generate clean, readable URLs specifically for locations using the unified SEO slug function
function generateLocationUrl(locationName: string, category: string): string {
  const locationSlug = generateSEOUrl(locationName) || 'location';
  const categorySlug = generateSEOUrl(category) || 'business';

  return `${locationSlug}-${categorySlug}.html`;
}

// Generate visual breadcrumb navigation
function generateBreadcrumbNavigation(data: BusinessData, currentPage: string, currentPageTitle?: string): string {
  const breadcrumbs = [
    { name: 'Home', url: 'index.html' }
  ];

  if (currentPage !== 'home') {
    if (currentPage === 'blog') {
      breadcrumbs.push({ name: 'Blog', url: 'blog.html' });
    } else if (currentPage === 'blog-post') {
      breadcrumbs.push({ name: 'Blog', url: 'blog.html' });
      breadcrumbs.push({ name: currentPageTitle || 'Blog Post', url: '#' });
    } else if (currentPage === 'service' || currentPage.startsWith('service-')) {
      const serviceName = currentPageTitle || currentPage.replace('service-', '').replace(/-/g, ' ');
      breadcrumbs.push({ name: 'Services', url: 'index.html#services' });
      breadcrumbs.push({ name: serviceName, url: '#' });
    } else if (currentPage === 'location' || currentPage.startsWith('location-')) {
      const locationName = currentPageTitle || currentPage.replace('location-', '').replace(/-/g, ' ');
      breadcrumbs.push({ name: 'Service Areas', url: 'index.html#contact' });
      breadcrumbs.push({ name: locationName, url: '#' });
    }
  }

  return `
    <nav class="breadcrumb-nav" style="background: #f8fafc; padding: 1rem 0; border-bottom: 1px solid #e2e8f0;" aria-label="Breadcrumb">
      <div class="container">
        <ol class="breadcrumb" style="display: flex; align-items: center; gap: 0.5rem; list-style: none; margin: 0; padding: 0; font-size: 0.9rem;">
          ${breadcrumbs.map((crumb, index) => `
            <li style="display: flex; align-items: center;">
              ${index < breadcrumbs.length - 1 ?
      `<a href="${crumb.url}" style="color: #6366f1; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${crumb.name}</a>` :
      `<span style="color: #64748b; font-weight: 500;">${crumb.name}</span>`
    }
              ${index < breadcrumbs.length - 1 ? '<i class="fas fa-chevron-right" style="color: #cbd5e1; margin-left: 0.5rem; font-size: 0.75rem;"></i>' : ''}
            </li>
          `).join('')}
        </ol>
      </div>
    </nav>
  `;
}

// Generate optimized alt text for images with keywords
function generateOptimizedImageAlt(data: BusinessData, imageType: string, context?: string): string {
  const businessName = data.businessName;
  const service = data.heroService.toLowerCase();
  const location = data.heroLocation;
  const category = data.category.toLowerCase();

  switch (imageType) {
    case 'hero':
      return `${businessName} providing professional ${service} services in ${location} - trusted and verified ${category} specialists with ${data.yearsInBusiness}+ years experience`;
    case 'team':
      return `Professional ${category} service team from ${businessName} using modern tools and equipment for quality ${service} work in ${location} area`;
    case 'equipment':
      return `Modern professional tools and equipment used by ${businessName} for ${service} services in ${location} showcasing quality craftsmanship and precision`;
    case 'results':
      return `Satisfied customer receiving quality ${service} from ${businessName} in ${location} with professional results and excellent customer service`;
    case 'logo':
      return `${businessName} logo - Professional ${service} services in ${location}`;
    case 'service':
      const serviceName = context || service;
      return `${businessName} providing expert ${serviceName} services in ${location} with professional quality, trusted technicians, and reliable service`;
    case 'location':
      const locationName = context || location;
      return `${businessName} ${category} service coverage area in ${locationName} - professional ${service} solutions with emergency availability`;
    default:
      return `${businessName} - Professional ${service} services in ${location} and surrounding service areas`;
  }
}

function generateBlogImageAlt(blogTitle: string): string {
  return blogTitle;
}

function parseDynamicPageValues(...sources: Array<unknown>): string[] {
  const items = sources
    .flatMap((source) => {
      if (!source) return [];
      if (Array.isArray(source)) return source.map((item) => String(item));
      if (typeof source === "string") {
        return source
          .split(/[,|\n]/)
          .map((part) => part.trim())
          .filter(Boolean);
      }
      return [];
    })
    .map((item) => item.trim())
    .filter(Boolean);

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped.slice(0, 25);
}



// Generate JSON-LD structured data for local business
function generateLocalBusinessSchema(data: BusinessData, pageTitle?: string, pageDescription?: string, domain?: string, consistentRating?: number, consistentReviewCount?: number): string {
  const baseUrl = domain || '';

  // Parse services into an array
  const services = data.services.split(',').map(service => service.trim()).filter(service => service.length > 0);

  // Parse service areas into an array
  const serviceAreas = data.serviceAreas.split(',').map(area => area.trim()).filter(area => area.length > 0);

  // Generate schema for main business
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": data.businessName,
    "description": pageDescription || data.heroDescription,
    "url": baseUrl,
    "telephone": data.phone,
    "email": data.email || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address,
      "addressLocality": data.heroLocation,
      "addressRegion": data.heroLocation,
      "addressCountry": "US"
    },
    // geo coordinates will be populated via geocoding API based on address
    "openingHours": data.businessHours ? data.businessHours.split(',').map(hours => hours.trim()) : [],
    "priceRange": "$$",
    "areaServed": serviceAreas.map(area => ({
      "@type": "Place",
      "name": area
    })),
    "serviceType": services,
    "foundingDate": new Date().getFullYear() - (data.yearsInBusiness || 1),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${data.businessName} Services`,
      "itemListElement": services.map((service, index) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service,
          "description": `Professional ${service.toLowerCase()} services in ${data.heroLocation}`
        }
      }))
    }
  };

  // Clean up undefined values
  const cleanedSchema = JSON.parse(JSON.stringify(businessSchema, (key, value) => {
    return value === undefined ? null : value;
  }));

  return `<script type="application/ld+json">${JSON.stringify(cleanedSchema, null, 2)}</script>`;
}

// Generate Organization schema for enhanced SEO

// Generate FAQ schema if FAQ data exists
function generateFAQSchema(data: BusinessData): string {
  const faqs = [];

  // Collect all FAQ pairs that have both question and answer
  for (let i = 1; i <= 10; i++) {
    const question = data[`faqQuestion${i}` as keyof BusinessData] as string;
    const answer = data[`faqAnswer${i}` as keyof BusinessData] as string;

    if (question && answer && question.trim() && answer.trim()) {
      faqs.push({
        "@type": "Question",
        "name": question.trim(),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": answer.trim()
        }
      });
    }
  }

  if (faqs.length === 0) return '';

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs
  };

  return `<script type="application/ld+json">${JSON.stringify(faqSchema, null, 2)}</script>`;
}

// Generate Organization schema for brand authority
function generateOrganizationSchema(data: BusinessData, domain?: string): string {
  const services = data.services.split(',').map(service => service.trim()).filter(service => service.length > 0);
  const baseUrl = domain || '';

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.businessName,
    "description": data.aboutDescription,
    "url": baseUrl,
    "logo": data.logo || undefined,
    "telephone": data.phone,
    "email": data.email || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": data.address,
      "addressLocality": data.heroLocation,
      "addressRegion": data.heroLocation,
      "addressCountry": "US"
    },
    "sameAs": [
      data.facebookUrl,
      data.twitterUrl,
      data.linkedinUrl,
      data.pinterestUrl
    ].filter(url => url && url.trim()),
    "foundingDate": new Date().getFullYear() - (data.yearsInBusiness || 1),
    "numberOfEmployees": "1-10",
    "serviceArea": data.serviceAreas.split(',').map(area => area.trim()),
    "knowsAbout": services
  };

  // Clean up undefined values
  const cleanedSchema = JSON.parse(JSON.stringify(organizationSchema, (key, value) => {
    return value === undefined ? null : value;
  }));

  return `<script type="application/ld+json">${JSON.stringify(cleanedSchema, null, 2)}</script>`;
}

// Generate Service schema for each main service
function generateServiceSchema(data: BusinessData, specificService?: string): string {
  const services = data.services.split(',').map(service => service.trim()).filter(service => service.length > 0);
  const serviceAreas = data.serviceAreas.split(',').map(area => area.trim()).filter(area => area.length > 0);

  const targetService = specificService || services[0];

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `${targetService} Services`,
    "description": `Professional ${targetService.toLowerCase()} services in ${data.heroLocation}. ${data.heroDescription}`,
    "provider": {
      "@type": "LocalBusiness",
      "name": data.businessName,
      "telephone": data.phone,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": data.address,
        "addressLocality": data.heroLocation,
        "addressRegion": data.heroLocation,
        "addressCountry": "US"
      }
    },
    "areaServed": serviceAreas.map(area => ({
      "@type": "Place",
      "name": area
    })),
    "serviceType": targetService,
    "category": data.category
  };

  return `<script type="application/ld+json">${JSON.stringify(serviceSchema, null, 2)}</script>`;
}

// Generate testimonials HTML
function generateTestimonials(data: BusinessData): string {
  console.log('Generating testimonials with data:', {
    t1: data.testimonial1Name,
    t2: data.testimonial2Name,
    t3: data.testimonial3Name
  });

  const testimonials = [
    { name: data.testimonial1Name, text: data.testimonial1Text, rating: data.testimonial1Rating },
    { name: data.testimonial2Name, text: data.testimonial2Text, rating: data.testimonial2Rating },
    { name: data.testimonial3Name, text: data.testimonial3Text, rating: data.testimonial3Rating }
  ].filter(t => t.name && t.text);

  console.log('Filtered testimonials:', testimonials);

  // Always show testimonials - either custom ones or default ones
  const testimonialsToShow = testimonials.length > 0 ? testimonials : [
    {
      name: "Sarah Johnson",
      text: `Excellent service! Professional, reliable, and great results. Highly recommend ${data.businessName} for anyone needing quality work.`,
      rating: 5
    },
    {
      name: "Mike Chen",
      text: "Outstanding work from start to finish. The team was punctual, professional, and delivered exactly what they promised. Will definitely use again!",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      text: "Fast, reliable service with honest pricing. They explained everything clearly and completed the work efficiently. Couldn't be happier!",
      rating: 5
    }
  ];

  const html = testimonialsToShow.map((testimonial) => `
    <div class="testimonial-card">
      <div class="testimonial-content">
        <div class="testimonial-stars">
          ${Array.from({ length: testimonial.rating || 5 }, () => '<i class="fas fa-star"></i>').join('')}
        </div>
        <p class="testimonial-text">"${testimonial.text}"</p>
        <div class="testimonial-author">
          <div class="author-info">
            <h4>${testimonial.name}</h4>
            <p>Verified Customer</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  console.log('Generated testimonials HTML length:', html.length);
  return html;
}

// Generate professional testimonials with better styling
function generateProfessionalTestimonials(data: BusinessData): string {
  const testimonials = [
    {
      name: "Emily Johnson",
      location: data.heroLocation.split(',')[0],
      text: `I recently had my ${data.category.toLowerCase()} work done by ${data.businessName} and I couldn't be happier! From the initial consultation to the final installation, their professionalism stood out. The team was responsive to my questions and the attention to detail was impressive.`,
      rating: 5,
      service: data.heroService
    },
    {
      name: "Michael Rodriguez",
      location: data.serviceAreas.split(',')[1]?.trim() || data.heroLocation.split(',')[0],
      text: `${data.businessName} did a fantastic job on our ${data.category.toLowerCase()} project. Their expertise showed when they faced some unexpected challenges. They communicated effectively throughout the process and offered affordable solutions. I would definitely recommend their services.`,
      rating: 5,
      service: data.heroService
    },
    {
      name: "Sarah Thompson",
      location: data.serviceAreas.split(',')[2]?.trim() || data.heroLocation.split(',')[0],
      text: `Professional and efficient work from ${data.businessName}. The team was incredibly friendly and demonstrated great problem-solving skills. They took the time to explain everything to me, which I appreciated. The results exceeded my expectations!`,
      rating: 5,
      service: data.heroService
    }
  ];

  const html = testimonials.map((testimonial, index) => `
    <div class="testimonial-card professional">
      <div class="testimonial-stars">
        ${Array.from({ length: testimonial.rating }, () => '<i class="fas fa-star"></i>').join('')}
        <span class="testimonial-rating">(${testimonial.rating}/5)</span>
      </div>
      <blockquote class="testimonial-text">"${testimonial.text}"</blockquote>
      <div class="testimonial-author">
        <div class="author-avatar">
          <span>${testimonial.name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <div class="author-info">
          <h4>${testimonial.name}</h4>
          <p>${testimonial.location}</p>
          <span class="service-type">${testimonial.service}</span>
        </div>
      </div>
    </div>
  `).join('');

  return html;
}

// Generate breadcrumb schema for better navigation
function generateBreadcrumbSchema(data: BusinessData, currentPage: string = 'home', domain?: string, pagePath?: string): string {
  const baseUrl = domain ? domain.replace(/\/+$/, '') : ''; // Remove trailing slashes
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": baseUrl
    }
  ];

  if (currentPage !== 'home' && pagePath) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 2,
      "name": currentPage,
      "item": baseUrl ? `${baseUrl}/${pagePath}` : `/${pagePath}`
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };

  return `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema, null, 2)}</script>`;
}

// Generate WebPage schema for better SEO
function generateWebPageSchema(data: BusinessData, pageTitle: string, pageDescription: string, domain?: string, pagePath?: string): string {
  const baseUrl = domain ? domain.replace(/\/+$/, '') : ''; // Remove trailing slashes

  // Build full page URL that matches canonical URL
  let pageUrl = baseUrl;
  if (pagePath && pagePath !== '/' && pagePath !== 'index.html') {
    const cleanPath = pagePath.replace(/^\/+/, '');
    pageUrl = baseUrl ? `${baseUrl}/${cleanPath}` : `/${cleanPath}`;
  }

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": pageUrl,
    "mainEntity": {
      "@type": "LocalBusiness",
      "@id": `${baseUrl}#business`
    },
    "about": {
      "@type": "Thing",
      "name": data.category,
      "description": `${data.category} services in ${data.heroLocation}`
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "@id": `${baseUrl}#breadcrumb`
    },
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${baseUrl}#website`
    }
  };

  return `<script type="application/ld+json">${JSON.stringify(webPageSchema, null, 2)}</script>`;
}



// Generate optimized meta tags for local SEO with enhanced indexing support
function generateSEOMetaTags(data: BusinessData, pageTitle?: string, pageDescription?: string, pageType: string = 'home', domain?: string, pagePath?: string): string {
  const title = seoTitle(pageTitle || `${data.businessName} - ${data.heroService} in ${data.heroLocation}`);
  const description = seoDescription(pageDescription || data.heroDescription);
  const keywords = `${data.heroService}, ${data.heroLocation}, ${data.targetedKeywords}, ${data.businessName}, ${data.category.toLowerCase()}`;
  const themeColor = templates[0]?.colors?.primary || '#667eea';

  // Build proper canonical URL — strip .html extension for Netlify Pretty URLs
  let canonicalUrl = '';
  if (domain) {
    const cleanDomain = domain.replace(/\/+$/, ''); // Remove trailing slashes
    if (pagePath && pagePath !== '/' && pagePath !== 'index.html') {
      const cleanPath = pagePath.replace(/^\/+/, '').replace(/\.html$/, '');
      canonicalUrl = `${cleanDomain}/${cleanPath}`;
    } else {
      canonicalUrl = cleanDomain;
    }
  }

  // Enhanced robots directives for better indexing
  const robotsContent = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return `
    <!-- Critical SEO Meta Tags for Indexing -->
    <meta name="robots" content="${robotsContent}">
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ''}
    
    <!-- Mobile & App Optimization -->
    <meta name="format-detection" content="telephone=yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    
    <!-- Language & Author -->
    <meta http-equiv="Content-Language" content="en">
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="${data.businessName}">
    
    <!-- Enhanced Open Graph / Social Media -->
    <meta property="og:type" content="business.business">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${data.logo || getCategoryImage(data.category)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${data.businessName} - ${data.heroService}">
    <meta property="og:image:type" content="image/jpeg">
    ${canonicalUrl ? `<meta property="og:url" content="${canonicalUrl}">` : ''}
    <meta property="og:site_name" content="${data.businessName}">
    <meta property="og:locale" content="en_US">
    <meta property="business:contact_data:street_address" content="${data.address}">
    <meta property="business:contact_data:locality" content="${data.heroLocation}">
    <meta property="business:contact_data:phone_number" content="${data.phone}">
    ${data.email ? `<meta property="business:contact_data:email" content="${data.email}">` : ''}
    
    <!-- Enhanced Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${data.logo || getCategoryImage(data.category)}">
    <meta name="twitter:image:alt" content="${data.businessName} - ${data.heroService}">
    <meta name="twitter:site" content="@${data.businessName.toLowerCase().replace(/\s+/g, '')}">
    <meta name="twitter:creator" content="@${data.businessName.toLowerCase().replace(/\s+/g, '')}">
    
    <!-- Local Business & Geographic Info -->
    <meta name="geo.region" content="US">
    <meta name="geo.placename" content="${data.heroLocation}">
    
    <!-- Theme & Branding -->
    <meta name="theme-color" content="${themeColor}">
    <meta name="msapplication-TileColor" content="${themeColor}">
    <meta name="application-name" content="${data.businessName}">
  `;
}

function generateCTAButtons(data: BusinessData): string {
  const buttons = [];

  // Call button (using regular phone number if enabled)
  if (data.ctaCallButton && data.phone) {
    buttons.push(`
      <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
        <i class="fas fa-phone"></i> ${data.phone}
      </a>
    `);
  }

  // WhatsApp button (if WhatsApp number provided)
  if (data.ctaWhatsappNumber && data.ctaWhatsappNumber.trim()) {
    const whatsappNumber = data.ctaWhatsappNumber.replace(/\D/g, ''); // Remove non-digits
    buttons.push(`
      <a href="https://wa.me/${whatsappNumber}" target="_blank" class="cta-button cta-whatsapp">
        <i class="fab fa-whatsapp"></i> WhatsApp
      </a>
    `);
  }

  // Custom CTA button (if both text and URL provided)
  if (data.ctaCustomText && data.ctaCustomText.trim() && data.ctaCustomUrl && data.ctaCustomUrl.trim()) {
    // Ensure URL has protocol if it doesn't already
    let url = data.ctaCustomUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    buttons.push(`
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="cta-button cta-custom">
        <i class="fas fa-link"></i> ${data.ctaCustomText}
      </a>
    `);
  }

  return buttons.join('');
}

function getCategoryImage(category: string, type: 'team' | 'equipment' | 'results' = 'team'): string {
  const categoryImages: { [key: string]: { [key: string]: string } } = {
    "Plumbing": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "HVAC (Heating & Cooling)": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "HVAC": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Electrical": {
      team: "https://images.unsplash.com/photo-1595342006654-b6134b3f8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Electrical Repair": {
      team: "https://images.unsplash.com/photo-1595342006654-b6134b3f8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Handyman": {
      team: "https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Handyman Services": {
      team: "https://images.unsplash.com/photo-1504148455328-c376907d081c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roofing": {
      team: "https://images.unsplash.com/photo-1632759145351-1d592919f522?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1635424685267-bd8a3f0cde18?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roofing Replacement": {
      team: "https://images.unsplash.com/photo-1632759145351-1d592919f522?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1635424685267-bd8a3f0cde18?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Landscaping & Lawn Care": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Landscaping": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Landscapers": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Lawn Care": {
      team: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Lawn Mowing": {
      team: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1582032382959-7c5d2e4b4b6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Lawn Aeration": {
      team: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1582032382959-7c5d2e4b4b6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Painting Services": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "House Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Interior Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Exterior Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Commercial Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Cabinet Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Faux Painting": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Home Cleaning / Maid Services": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Cleaning Services": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "House Cleaning Services": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Maid Service": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Carpet Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Marketing Agency": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Legal Services (e.g., Family Law, Immigration, DUI Defense)": {
      team: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Additional major categories
    "AC Companies": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "AC Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Heating Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Furnace Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Boiler Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Heat Pump": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Air Duct Cleaning": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Emergency Plumbing": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Drain Cleaning": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Leak Detection": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Construction & Remodeling
    "Kitchen Remodeling": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Bathroom Remodeling": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Bathroom and Kitchen Remodeling": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Basement Remodeling": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Home Builders": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Custom Home Builders": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "General Contractors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Flooring
    "Hardwood Floors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Laminate Flooring": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Epoxy Flooring": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Countertops
    "Granite Countertops": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Concrete Countertops": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Laminate Countertops": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Concrete & Paving
    "Concrete Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Concrete Pavers": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Brick Pavers": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Asphalt Paving": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Driveway Paving": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Fencing & Outdoor
    "Fence Installation": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Fences": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Deck Builder": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Deck Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Hardscape": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Backyard Design": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Artificial Grass": {
      team: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1582032382959-7c5d2e4b4b6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Doors & Windows
    "Entry Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Exterior Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Front Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "French Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Iron Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Door Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Garage Door Repair": {
      team: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1534430480872-3498386e7856?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Appliance Services
    "Appliance Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Dryer Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Dryer Vent Cleaning": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Pest Control
    "Bed Bug Exterminator": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Fumigation": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Solar & Energy
    "Solar Panel Installation": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1588247185117-206775b84c6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Home Energy Audit": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Waterproofing & Foundation
    "Basement Waterproofing": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Foundation Repair": {
      team: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Gutters & Roofing Accessories
    "Gutter Cleaning": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Gutters": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Copper Gutters": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Metal Roofing": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Foam Roof": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Insulation & Attic
    "Insulation": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Attic Insulation": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Attic Fan": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Humidifier": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Drywall & Interior
    "Drywall Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Ceiling Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Ceiling Fan Repair": {
      team: "https://images.unsplash.com/photo-1595342006654-b6134b3f8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Crown Molding": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Specialty Services
    "Locksmith": {
      team: "https://images.unsplash.com/photo-1582139329536-e7284fece509?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1562113530-57ba467cea38?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558002038-1055907df827?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Junk Removal": {
      team: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Moving Help": {
      team: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Demolition": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Chimney Sweeping": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Fireplace Repair": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Mold Removal": {
      team: "https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Grout Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Furniture Restoration": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Bathtub Refinishing": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Jacuzzi Repair": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Professional Services
    "Real Estate Agents": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Financial Advisors & Tax Prep": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Home Inspection": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Land Surveyor": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Interior Designer": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Closet Design": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Custom Closet": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Metal Fabrication": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Home Security Systems": {
      team: "https://images.unsplash.com/photo-1595342006654-b6134b3f8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Exterior Accessories
    "Awnings": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // SEO/Marketing Services
    "SEO Agency": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Local SEO Agency": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Website Designer": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // High-value services
    "Insurance": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Towing": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Weight Loss": {
      team: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Pool & Spa Services
    "Pool Cleaning": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Pool Installation": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Pool Repair": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Spa Repair": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Septic Services
    "Septic Pumping": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Septic Repair": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Septic Service": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Septic Tank Cleaning": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Roofing Variations
    "Roof Cleaning": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roof Coating": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roof Inspection": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roof Repair": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roof Replacement": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roof Tiles": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Roofing Contractors": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Window Services
    "Window Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Window Glass Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Window Installation": {
      team: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Window Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Window Replacement": {
      team: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Shower Doors": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Sliding Glass Door Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Skylight Repairs": {
      team: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Appliance Repairs
    "Oven Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Refrigerator Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Washing Machine Repair": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Tree Services
    "Tree Removal": {
      team: "https://images.unsplash.com/photo-1598300056393-4aac492f4344?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1564419320406-aad99b1e6b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Tree Trimming": {
      team: "https://images.unsplash.com/photo-1598300056393-4aac492f4344?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1564419320406-aad99b1e6b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Water Services
    "Water Damage": {
      team: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1525438160292-a4a860951216?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Water Heater Repair": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Tankless Water Heater": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Sump Pump Installation": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Walk-In Tubs": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Pest Control Services
    "Pest Control": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Organic Pest Control": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Termite Control": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Termite Inspection": {
      team: "https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Poison Ivy Removal": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Specialty Cleaning
    "Pressure Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Oriental Rug Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Rug Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586105251261-72a756497a11?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Upholstery Cleaning": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Masonry & Structural
    "Masonry & Brickwork": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Structural Engineering & Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Retaining Walls": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Stone Pavers": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Stair Builders": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Specialty Contracting
    "Custom Carpentry": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Welding": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Soundproofing": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Spray Foam Insulation": {
      team: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Additional Surfaces & Installation
    "Tile Installation": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Quartz Countertops": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Pea Gravel": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Flooring Installation & Repair": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Irrigation & Outdoor Systems
    "Sprinkler Repair": {
      team: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Patio Covers": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Sunroom": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Siding & Exterior
    "Siding & Exterior Work": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Vinyl Siding": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Wallpaper Removal": {
      team: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Popcorn Ceiling Removal": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Smart Home & Technology
    "Smart Home Installation": {
      team: "https://images.unsplash.com/photo-1595342006654-b6134b3f8464?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Heavy Construction
    "Excavation & Demolition": {
      team: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Fire & Disaster Restoration
    "Fire Damage Restoration": {
      team: "https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1542621334-a254cf47733d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Mold Remediation": {
      team: "https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Hoarding Clean-Up Services": {
      team: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Personal & Beauty Services
    "Med Spa / Aesthetics Clinics": {
      team: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Hair Salons & Barbers": {
      team: "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1522335269606-8669e5d80cd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Nail Salons": {
      team: "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1522335269606-8669e5d80cd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Massage Therapists": {
      team: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Personal Trainers / Fitness Coaches": {
      team: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Pet Services
    "Dog Grooming": {
      team: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Dog Training": {
      team: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Pet Boarding / Pet Sitting": {
      team: "https://images.unsplash.com/photo-1557318041-1ce374d55ebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1557318041-1ce374d55ebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Mobile Vet Services": {
      team: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Professional Services
    "Legal Services": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Insurance Agents": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Notary Services": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Wedding & Event Planners": {
      team: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1519167758481-83f29c97544c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1519167758481-83f29c97544c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    // Plumbing Variations
    "Plumbing Repair": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    },
    "Plumbing Service": {
      team: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      equipment: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      results: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
    }
  };

  const fallback = {
    team: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    equipment: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    results: "https://images.unsplash.com/photo-1494526585095-c41746248156?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
  };

  return categoryImages[category]?.[type] || fallback[type];
}

function getCategoryIcon(category: string): string {
  const categoryIcons: { [key: string]: string } = {
    "Plumbing": "fas fa-wrench",
    "HVAC (Heating & Cooling)": "fas fa-thermometer-half",
    "Electrical": "fas fa-bolt",
    "Handyman": "fas fa-tools",
    "Roofing": "fas fa-home",
    "Landscaping & Lawn Care": "fas fa-seedling",
    "Painting Services": "fas fa-paint-roller",
    "Home Cleaning / Maid Services": "fas fa-spray-can",
    "Marketing Agency": "fas fa-chart-line",
    "Legal Services (e.g., Family Law, Immigration, DUI Defense)": "fas fa-balance-scale",
    "Real Estate Agents": "fas fa-key",
    "Financial Advisors & Tax Prep": "fas fa-calculator"
  };

  return categoryIcons[category] || "fas fa-tools";
}

export interface GeneratedWebsiteFiles {
  [filename: string]: string;
}

// Sitemap generation removed - not needed for unique deployment URLs

// Generate enhanced .htaccess with better SEO directives
function generateEnhancedHtaccess(): string {
  return `# Enhanced SEO and Performance .htaccess
RewriteEngine On

# Force HTTPS (recommended for SEO)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove trailing slashes for better SEO
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)/$ /$1 [R=301,L]

# Remove .html extension from URLs
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^([^.]+)$ $1.html [NC,L]

# Remove .html from displayed URLs
RewriteCond %{THE_REQUEST} /([^.]+)\.html [NC]
RewriteRule ^ /%1 [NC,L,R=301]

# Enhanced caching for better performance
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/html "access plus 1 hour"
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 year"
ExpiresByType image/webp "access plus 1 year"
ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Compression for better performance
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/plain
AddOutputFilterByType DEFLATE text/html
AddOutputFilterByType DEFLATE text/xml
AddOutputFilterByType DEFLATE text/css
AddOutputFilterByType DEFLATE application/xml
AddOutputFilterByType DEFLATE application/xhtml+xml
AddOutputFilterByType DEFLATE application/rss+xml
AddOutputFilterByType DEFLATE application/javascript
AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security headers for better SEO ranking
<IfModule mod_headers.c>
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Prevent access to sensitive files
<Files "*.md">
Order Allow,Deny
Deny from all
</Files>`;
}

// Generate web app manifest for better SEO and PWA support
function generateWebManifest(data: BusinessData): string {
  const manifest = {
    "name": data.businessName,
    "short_name": data.businessName.length > 12 ? data.businessName.substring(0, 12) : data.businessName,
    "description": data.heroDescription,
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#3B82F6",
    "orientation": "portrait-primary",
    "categories": ["business", "local", data.category.toLowerCase()],
    "lang": "en-US",
    "dir": "ltr",
    "icons": [
      {
        "src": "/favicon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/favicon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  };

  return JSON.stringify(manifest, null, 2);
}

// Generate humans.txt for better SEO signals
function generateHumansTxt(data: BusinessData): string {
  return `/* TEAM */
Business Owner: ${data.businessName}
Contact: ${data.phone}
${data.email ? `Email: ${data.email}` : ''}
Location: ${data.address}

/* SITE */
Last update: ${new Date().toISOString().split('T')[0]}
Standards: HTML5, CSS3, JavaScript ES6+
Components: Responsive Design, SEO Optimized
Software: Professional Website Builder

/* SERVICES */
Category: ${data.category}
Main Service: ${data.heroService}
Service Areas: ${data.serviceAreas}
Years in Business: ${data.yearsInBusiness}+

Thank you for visiting ${data.businessName}!`;
}

// Note: robots.txt generation removed for Netlify subdomains
// Netlify handles robots.txt automatically and custom files can cause indexing issues

// Note: sitemap.xml generation removed for Netlify subdomains
// Netlify automatically generates sitemaps and custom sitemap.xml files can cause indexing conflicts

// Generate .htaccess file for Apache servers (shared hosting)
function generateHtaccess(): string {
  return `# SEO-friendly URLs and security
RewriteEngine On

# Force HTTPS (if SSL is available)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Remove .html extension from URLs
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^([^.]+)$ $1.html [NC,L]

# Remove trailing slash
RewriteRule ^(.*)\/(\?.*)?$ $1$2 [R=301,L]

# Caching headers for better performance
<IfModule mod_expires.c>
ExpiresActive on
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
ExpiresByType image/webp "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/plain
AddOutputFilterByType DEFLATE text/html
AddOutputFilterByType DEFLATE text/xml
AddOutputFilterByType DEFLATE text/css
AddOutputFilterByType DEFLATE application/xml
AddOutputFilterByType DEFLATE application/xhtml+xml
AddOutputFilterByType DEFLATE application/rss+xml
AddOutputFilterByType DEFLATE application/javascript
AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>`;
}

// Generate robots.txt file to allow proper search engine indexing
function generateRobotsTxt(domain?: string): string {
  const baseUrl = domain || 'https://yourdomain.com';

  return `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Block access to any admin or private directories if they exist
Disallow: /admin/
Disallow: /private/
Disallow: /_netlify/
Disallow: /.well-known/

# Allow critical resources for rendering
Allow: /styles.css
Allow: /script.js

# LLM / AI Crawlers — allow for visibility
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
Allow: /

User-agent: Bytespider
Allow: /`;
}

// Generate sitemap.xml file with all website pages
function generateSitemapXml(businessData: BusinessData, domain?: string, additionalLocations?: string[], additionalServices?: string[]): string {
  const baseUrl = domain || 'https://yourdomain.com';
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Start with main pages
  const urls = [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '1.0'
    },
    {
      loc: `${baseUrl}/blog`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    }
  ];

  // Add blog post pages if they exist
  if (businessData.blogPosts && businessData.blogPosts.length > 0) {
    businessData.blogPosts.forEach((post: any) => {
      const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      urls.push({
        loc: `${baseUrl}/blog-${slug}`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.6'
      });
    });
  }

  // Add location pages
  if (additionalLocations && additionalLocations.length > 0) {
    additionalLocations.forEach(location => {
      const filename = generateLocationUrl(location, businessData.category).replace(/\.html$/, '');
      urls.push({
        loc: `${baseUrl}/${filename}`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.7'
      });
    });
  }

  // Add service pages
  if (additionalServices && additionalServices.length > 0) {
    additionalServices.forEach(service => {
      const filename = generateServiceUrl(service, businessData.heroLocation).replace(/\.html$/, '');
      urls.push({
        loc: `${baseUrl}/${filename}`,
        lastmod: currentDate,
        changefreq: 'monthly',
        priority: '0.7'
      });
    });
  }

  // Generate XML sitemap
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemapXml;
}

// Generate llms.txt for AI/LLM crawlers
function generateLlmsTxt(businessData: BusinessData, domain?: string, additionalLocations?: string[], additionalServices?: string[]): string {
  const baseUrl = domain || 'https://yourdomain.com';
  const biz = businessData.businessName || 'Business';
  const service = businessData.heroService || businessData.category || 'Professional Services';
  const city = businessData.heroLocation || 'Local Area';
  const phone = businessData.phone || '';

  let txt = `# ${biz}
> ${service} in ${city}

## About
${biz} provides professional ${service.toLowerCase()} services in ${city} and surrounding areas.
${businessData.aboutDescription || ''}

## Contact
- Phone: ${phone}
- Email: ${businessData.email || ''}
- Address: ${businessData.address || ''}

## Pages
- Homepage: ${baseUrl}/
- Blog: ${baseUrl}/blog.html
- Sitemap: ${baseUrl}/sitemap.xml
`;

  if (additionalServices && additionalServices.length > 0) {
    txt += `\n## Services\n`;
    additionalServices.forEach(s => {
      const url = generateServiceUrl(s, businessData.heroLocation);
      txt += `- ${s}: ${baseUrl}/${url}\n`;
    });
  }

  if (additionalLocations && additionalLocations.length > 0) {
    txt += `\n## Service Areas\n`;
    additionalLocations.forEach(l => {
      const url = generateLocationUrl(l, businessData.category);
      txt += `- ${l}: ${baseUrl}/${url}\n`;
    });
  }

  if (businessData.blogPosts && businessData.blogPosts.length > 0) {
    txt += `\n## Blog Posts\n`;
    businessData.blogPosts.forEach((post: any) => {
      const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      txt += `- ${post.title}: ${baseUrl}/blog-${slug}.html\n`;
    });
  }

  return txt;
}

// Generate HTML sitemap page for user navigation
function generateHtmlSitemapPage(businessData: BusinessData, template: Template, domain?: string, additionalLocations?: string[], additionalServices?: string[], siteSettings?: SiteSetting[]): string {
  const baseUrl = domain || '';
  const biz = businessData.businessName || 'Business';
  const primaryColor = template.colors.primary || '#667eea';

  let sections = `
    <div class="sitemap-section">
      <h2>Main Pages</h2>
      <ul>
        <li><a href="index.html">Home</a></li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="sitemap.html">Sitemap</a></li>
      </ul>
    </div>`;

  if (additionalServices && additionalServices.length > 0) {
    sections += `
    <div class="sitemap-section">
      <h2>Services</h2>
      <ul>
        ${additionalServices.map(s => {
          const url = generateServiceUrl(s, businessData.heroLocation);
          return `<li><a href="${url}">${s}</a></li>`;
        }).join('\n        ')}
      </ul>
    </div>`;
  }

  if (additionalLocations && additionalLocations.length > 0) {
    sections += `
    <div class="sitemap-section">
      <h2>Service Areas</h2>
      <ul>
        ${additionalLocations.map(l => {
          const url = generateLocationUrl(l, businessData.category);
          return `<li><a href="${url}">${businessData.heroService || businessData.category} in ${l}</a></li>`;
        }).join('\n        ')}
      </ul>
    </div>`;
  }

  if (businessData.blogPosts && businessData.blogPosts.length > 0) {
    sections += `
    <div class="sitemap-section">
      <h2>Blog Posts</h2>
      <ul>
        ${businessData.blogPosts.map((post: any) => {
          const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return `<li><a href="blog-${slug}.html">${post.title}</a></li>`;
        }).join('\n        ')}
      </ul>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sitemap - ${biz}</title>
  <meta name="description" content="Complete sitemap for ${biz}. Browse all pages, services, locations, and blog posts.">
  <meta name="robots" content="noindex, follow">
  <link rel="stylesheet" href="styles.css">
  <style>
    .sitemap-container { max-width: 900px; margin: 3rem auto; padding: 0 1.5rem; }
    .sitemap-container h1 { font-size: 2rem; color: ${primaryColor}; margin-bottom: 2rem; }
    .sitemap-section { margin-bottom: 2.5rem; }
    .sitemap-section h2 { font-size: 1.25rem; color: ${primaryColor}; margin-bottom: 1rem; padding-bottom: .5rem; border-bottom: 2px solid ${primaryColor}22; }
    .sitemap-section ul { list-style: none; padding: 0; }
    .sitemap-section li { padding: .4rem 0; }
    .sitemap-section a { color: #334155; text-decoration: none; transition: color .2s; }
    .sitemap-section a:hover { color: ${primaryColor}; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="sitemap-container">
    <h1>Sitemap</h1>
    <p style="color:#64748b;margin-bottom:2rem;">Browse all pages on ${biz}'s website.</p>
    ${sections}
  </div>
</body>
</html>`;
}

// Note: _redirects generation removed to prevent Netlify deployment issues

// Generate _headers file for Netlify
function generateNetlifyHeaders(): string {
  return `# Security and SEO headers for all pages
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdnjs.cloudflare.com fonts.googleapis.com maps.googleapis.com *.googletagmanager.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com maps.googleapis.com; font-src 'self' fonts.gstatic.com cdnjs.cloudflare.com; img-src 'self' data: images.unsplash.com *.googleapis.com maps.gstatic.com *.google.com *.googleusercontent.com; frame-src 'self' maps.google.com www.google.com; connect-src 'self' maps.googleapis.com *.google.com;
  Cache-Control: public, max-age=0, must-revalidate
  
# Cache control for static assets
/styles.css
  Cache-Control: public, max-age=0, must-revalidate
  
/script.js  
  Cache-Control: public, max-age=0, must-revalidate

# Keep SEO support files fresh but cacheable briefly
/sitemap.xml
  Cache-Control: public, max-age=300, must-revalidate

/robots.txt
  Cache-Control: public, max-age=300, must-revalidate`;
}

export function generateAllWebsiteFiles(businessData: BusinessData, templateId: string, domain?: string, blogPosts?: any[], aiGeneratedContent?: { serviceContent?: any[], locationContent?: any[] }, siteSettings?: SiteSetting[]): GeneratedWebsiteFiles {
  const template = templates.find(t => t.id === templateId) || templates[0];
  const files: GeneratedWebsiteFiles = {};

  // Formatted phone number for text replacement inside html generators
  const formattedData = { ...businessData };
  if (formattedData.phone) {
    const code = formattedData.countryCode || '+1';
    const digits = formattedData.phone.replace(/\D/g, '');
    if ((code === '+1' || !formattedData.countryCode) && digits.length === 10) {
      formattedData.phone = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
  }

  // Generate main files
  files['index.html'] = generateMainHTML(formattedData, template, domain, siteSettings);
  files['styles.css'] = generateCSS(template);
  files['script.js'] = generateJS(formattedData);

  // SEO files removed - not needed for unique deployment URLs

  // Generate hosting platform specific files
  files['.htaccess'] = generateEnhancedHtaccess();
  files['_headers'] = generateNetlifyHeaders();

  // Generate additional SEO files
  files['manifest.json'] = generateWebManifest(businessData);
  files['humans.txt'] = generateHumansTxt(businessData);
  // SEO files will be generated after location and service arrays are created

  // Note: _redirects file removed to prevent deployment issues
  // Static websites work best without complex redirect rules

  // Generate location pages with improved URL structure and AI content
  const additionalLocations = parseDynamicPageValues(
    businessData.additionalLocations,
    businessData.serviceAreas,
    businessData.heroLocation
  );

  additionalLocations.forEach((location, index) => {
    const filename = generateLocationUrl(location, businessData.category);
    // Use AI-generated content if available
    const aiContent = aiGeneratedContent?.locationContent?.[index];
    files[filename] = generateLocationHTML(formattedData, template, location, domain, aiContent, siteSettings);
  });

  // Generate service pages with improved URL structure and AI content
  const additionalServices = parseDynamicPageValues(
    businessData.additionalServices,
    businessData.services,
    businessData.heroService
  );

  additionalServices.forEach((service, index) => {
    const filename = generateServiceUrl(service, businessData.heroLocation);
    // Use AI-generated content if available
    const aiContent = aiGeneratedContent?.serviceContent?.[index];
    files[filename] = generateServiceHTML(formattedData, template, service, domain, aiContent, siteSettings);
  });

  // Generate blog pages with actual posts if available
  files['blog.html'] = generateBlogArchivePage(formattedData, template, domain, siteSettings);

  // Generate individual blog post pages if blog posts exist
  if (businessData.blogPosts && businessData.blogPosts.length > 0) {
    businessData.blogPosts.forEach((post: any) => {
      const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      files[`blog-${slug}.html`] = generateBlogPostPageFromData(businessData, template, post, domain, siteSettings);
    });
  }

  // Blog navigation is now handled directly in generateNavigation function

  // Generate essential SEO files for proper search engine indexing (after all page arrays are created)
  files['robots.txt'] = generateRobotsTxt(domain);
  files['sitemap.xml'] = generateSitemapXml(businessData, domain, additionalLocations, additionalServices);
  files['llms.txt'] = generateLlmsTxt(businessData, domain, additionalLocations, additionalServices);
  files['sitemap.html'] = generateHtmlSitemapPage(businessData, template, domain, additionalLocations, additionalServices, siteSettings);

  // Replace tel: links with country code in all html files
  if (businessData.phone) {
    const code = businessData.countryCode || '+1';
    const hrefPhone = businessData.phone.startsWith('+') ? businessData.phone : `${code}${businessData.phone}`.replace(/[^+\d]/g, '');
    Object.keys(files).forEach(filename => {
      if (filename.endsWith('.html') && typeof files[filename] === 'string') {
        files[filename] = (files[filename] as string).replace(new RegExp(`href="tel:${formattedData.phone.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`, 'g'), `href="tel:${hrefPhone}"`);
        files[filename] = (files[filename] as string).replace(new RegExp(`href="tel:${businessData.phone.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`, 'g'), `href="tel:${hrefPhone}"`);
      }
    });
  }

  return files;
}

// Function to generate specific blog posts when requested
export function generateBlogPosts(businessData: BusinessData, template: Template, postTypes: string[], siteSettings?: SiteSetting[]): { [filename: string]: string } {
  const blogFiles: { [filename: string]: string } = {};

  postTypes.forEach(postType => {
    switch (postType) {
      case 'hvac-maintenance':
        blogFiles['blog-post-hvac-maintenance.html'] = generateBlogPostPage(businessData, template, 'hvac-maintenance', undefined, siteSettings);
        break;
      case 'solar-installation':
        blogFiles['blog-post-solar-installation.html'] = generateBlogPostPage(businessData, template, 'solar-installation', undefined, siteSettings);
        break;
      case 'kitchen-remodeling':
        blogFiles['blog-post-kitchen-remodeling.html'] = generateBlogPostPage(businessData, template, 'kitchen-remodeling', undefined, siteSettings);
        break;
    }
  });

  return blogFiles;
}

// Generate custom blog post based on user-provided title and prompt
function generateCustomBlogPost(businessData: BusinessData, template: Template, title: string, slug: string, prompt: string): string {
  // For now, we'll generate a placeholder post structure

  const content = `
    <h2>Introduction</h2>
    <p>This comprehensive guide covers everything you need to know about ${title.toLowerCase()}. Our expert team at ${businessData.businessName} has prepared this detailed information to help ${businessData.heroLocation} residents make informed decisions.</p>
    
    <h2>Key Benefits</h2>
    <p>Understanding the benefits of proper ${businessData.heroService.toLowerCase()} is crucial for homeowners. Here's what you need to know:</p>
    <ul>
      <li>Improved efficiency and performance</li>
      <li>Cost savings over time</li>
      <li>Enhanced safety and reliability</li>
      <li>Increased property value</li>
    </ul>
    
    <h2>Professional Approach</h2>
    <p>At ${businessData.businessName}, we follow industry best practices to ensure the highest quality results. Our experienced team has been serving ${businessData.heroLocation} for ${businessData.yearsInBusiness || 5}+ years.</p>
    
    <h2>Common Considerations</h2>
    <p>When it comes to ${businessData.heroService.toLowerCase()}, there are several important factors to consider. Our team can help you navigate these decisions to find the best solution for your needs.</p>
    
    <h2>Why Choose Professional Service</h2>
    <p>While some tasks might seem simple, professional ${businessData.heroService.toLowerCase()} ensures proper installation, compliance with local codes, and long-term reliability.</p>
    
    <h2>Get Expert Help</h2>
    <p>Ready to get started? Contact ${businessData.businessName} today for a consultation. We're proud to serve the ${businessData.heroLocation} community with reliable, professional service.</p>
  `;

  const excerpt = `Everything you need to know about ${title.toLowerCase()}. Expert insights from ${businessData.businessName} serving ${businessData.heroLocation}.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle(`${title} - ${businessData.businessName}`)}</title>
  <meta name="description" content="${excerpt}">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
  ${generateNavigation(businessData, 'blog')}
  
  <main>
    <article class="blog-post" style="max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
      
      <!-- Back to Blog -->
      <div style="margin-bottom: 2rem;">
        <a href="blog.html" style="color: ${template.colors.primary}; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-arrow-left"></i> Back to Blog
        </a>
      </div>

      <!-- Post Header -->
      <header style="margin-bottom: 3rem;">
        <div class="post-meta" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; color: #666; font-size: 0.9rem;">
          <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span><i class="fas fa-clock"></i> 5 min read</span>
        </div>
        
        <h1 style="color: ${template.colors.primary}; font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem;">${title}</h1>
        
        <p style="font-size: 1.2rem; color: #666; line-height: 1.6; margin-bottom: 2rem;">${excerpt}</p>
        
        <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop" alt="${title}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 2rem;">
      </header>

      <!-- Post Content -->
      <div class="post-content" style="line-height: 1.8; color: #333;">
        ${content}
      </div>

      <!-- Call to Action -->
      <div class="post-cta" style="background: linear-gradient(135deg, ${template.colors.primary}15, ${template.colors.secondary}15); padding: 2rem; border-radius: 12px; margin-top: 3rem; text-align: center;">
        <h3 style="color: ${template.colors.primary}; margin-bottom: 1rem;">Ready to Get Started?</h3>
        <p style="margin-bottom: 2rem; color: #666;">Contact us today to learn more about our ${businessData.heroService.toLowerCase()} services in ${businessData.heroLocation}.</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="tel:${businessData.phone}" class="cta-btn" style="background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            <i class="fas fa-phone"></i> Call Now
          </a>
          <a href="mailto:${businessData.email}" class="cta-btn" style="background: ${template.colors.secondary}; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            <i class="fas fa-envelope"></i> Get Quote
          </a>
        </div>
      </div>

    </article>
  </main>

  <!-- Footer -->
  <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
    <div class="container">
      <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
        <div class="footer-main">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
            </div>
            <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${businessData.businessName}</h3>
          </div>
          <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${businessData.footerDescription || `Professional ${businessData.category.toLowerCase()} services in ${businessData.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
          <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
            <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${businessData.phone}" style="color: white; text-decoration: none;">${businessData.phone}</a></span></p>
            ${businessData.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${businessData.email}" style="color: white; text-decoration: none;">${businessData.email}</a></span></p>` : ''}
            <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${businessData.address}</span></p>
            <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${businessData.businessHours}</span></p>
          </div>
        </div>
        
        <div class="footer-services">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
          <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
            <li style="margin-bottom: 0.75rem;"><a href="index.html#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${businessData.heroService}</a></li>
            ${businessData.additionalServices ? businessData.additionalServices.split(',').slice(0, 5).map(service => `
            <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), businessData.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
            `).join('') : ''}
            <li style="margin-bottom: 0.75rem;"><a href="index.html#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(businessData.category).consultationTerm}</a></li>
            <li style="margin-bottom: 0.75rem;"><a href="index.html#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(businessData.category).urgentTerm.charAt(0).toUpperCase() + getCategorySpecificTerms(businessData.category).urgentTerm.slice(1)}</a></li>
          </ul>
        </div>
        
        <div class="footer-areas">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
          <div style="color: #cbd5e1; line-height: 1.8;">
            ${businessData.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaLink = businessData.additionalLocations && businessData.additionalLocations.split(',').map(loc => loc.trim()).includes(area.trim())
      ? generateLocationUrl(area.trim(), businessData.category)
      : 'index.html#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${area.trim()}</a></div>`;
  }).join('')}
            ${businessData.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="index.html#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
          </div>
        </div>
        
        <div class="footer-info">
          <h4 style="color: white; font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.75rem; display: inline-block; text-align: left;">Why Choose Us</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${businessData.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 1rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 1.1rem; text-align: left; line-height: 1.6;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0; font-size: 1rem;"></i><span>${fact.trim()}</span></li>`).join('')}
          </ul>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <a href="tel:${businessData.phone}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
              <i class="fas fa-phone"></i>
              Call Now
            </a>
          </div>
        </div>
        
        <div class="footer-social">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
          <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
            ${businessData.facebookUrl ? `<a href="${businessData.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${businessData.twitterUrl ? `<a href="${businessData.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>` : ''}
            ${businessData.linkedinUrl ? `<a href="${businessData.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>` : ''}
            ${businessData.pinterestUrl ? `<a href="${businessData.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
        <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${businessData.businessName}. All rights reserved. | Trusted Professional ${businessData.category} Services</p>
        ${businessData.leadGenDisclaimer && businessData.leadGenDisclaimer.trim() ? `
        <div class="disclaimer-section" style="margin-top: 1rem;">
          <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${businessData.leadGenDisclaimer}</p>
        </div>
        ` : ''}
      </div>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;
}

function generateFillerBlogTopics(businessData: BusinessData): Array<{title: string; excerpt: string; keywords: string; slug: string}> {
  const service = businessData.heroService;
  const location = businessData.heroLocation;
  const category = businessData.category;
  const business = businessData.businessName;
  const areas = businessData.serviceAreas ? businessData.serviceAreas.split(',').map(a => a.trim()) : [location];
  const services = businessData.additionalServices ? businessData.additionalServices.split(',').map(s => s.trim()) : [service];

  const topics: Array<{title: string; excerpt: string; keywords: string; slug: string}> = [
    { title: `Top 10 ${service} Tips Every Homeowner in ${location} Should Know`, excerpt: `Discover essential ${service.toLowerCase()} tips that can save you time and money. Our ${location} experts share their professional insights and practical advice for homeowners.`, keywords: `${service}, ${location}, tips, homeowner guide`, slug: `top-10-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tips-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `How to Choose the Best ${category} Company in ${location}`, excerpt: `Finding a reliable ${category.toLowerCase()} company can be challenging. Learn what to look for, questions to ask, and red flags to avoid when hiring ${category.toLowerCase()} professionals.`, keywords: `${category}, ${location}, hiring guide, best company`, slug: `how-to-choose-best-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-company-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `${service} Cost Guide ${new Date().getFullYear()}: What to Expect in ${location}`, excerpt: `Wondering how much ${service.toLowerCase()} costs? Our comprehensive pricing guide covers average costs, factors that affect pricing, and tips to get the best value in ${location}.`, keywords: `${service} cost, pricing guide, ${location}, estimates`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cost-guide-${new Date().getFullYear()}` },
    { title: `5 Warning Signs You Need Professional ${service} Services`, excerpt: `Don't ignore these critical warning signs that indicate you need professional ${service.toLowerCase()} services. Early detection can prevent costly repairs and ensure your safety.`, keywords: `${service}, warning signs, professional services, prevention`, slug: `5-warning-signs-need-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-services` },
    { title: `The Complete ${service} Maintenance Checklist for ${location} Residents`, excerpt: `Keep your property in top condition with our seasonal ${service.toLowerCase()} maintenance checklist. Designed specifically for ${location} climate and conditions.`, keywords: `${service} maintenance, checklist, ${location}, seasonal care`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-maintenance-checklist-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `Why ${location} Trusts ${business} for ${category} Services`, excerpt: `Learn about our commitment to quality, customer satisfaction, and community values that make ${business} the preferred ${category.toLowerCase()} provider in ${location}.`, keywords: `${business}, ${category}, ${location}, trusted provider`, slug: `why-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-trusts-${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `DIY vs Professional ${service}: When to Call the Experts`, excerpt: `Some ${service.toLowerCase()} tasks are perfect for DIY, while others require professional expertise. Learn where to draw the line and when to call in the pros.`, keywords: `DIY vs professional, ${service}, expert advice, home improvement`, slug: `diy-vs-professional-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `Seasonal ${category} Tips for ${location} Properties`, excerpt: `Each season brings unique ${category.toLowerCase()} challenges for ${location} property owners. Get ahead with our expert seasonal preparation and maintenance tips.`, keywords: `seasonal tips, ${category}, ${location}, property maintenance`, slug: `seasonal-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tips-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `The Ultimate Guide to ${service} Safety in ${location}`, excerpt: `Safety should always come first. This comprehensive guide covers essential ${service.toLowerCase()} safety practices, regulations, and best practices for ${location} residents.`, keywords: `${service} safety, guide, ${location}, regulations`, slug: `ultimate-guide-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-safety` },
    { title: `${category} Industry Trends in ${new Date().getFullYear()}: What's New`, excerpt: `Stay informed about the latest ${category.toLowerCase()} industry trends, new technologies, and innovations that are transforming how services are delivered in ${location}.`, keywords: `${category} trends, ${new Date().getFullYear()}, innovation, technology`, slug: `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-industry-trends-${new Date().getFullYear()}` },
    { title: `How ${business} Delivers Excellence in ${service}`, excerpt: `Behind every great ${service.toLowerCase()} job is a team of dedicated professionals. Discover our process, quality standards, and commitment to delivering exceptional results.`, keywords: `${business}, excellence, ${service}, quality standards`, slug: `how-${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-delivers-excellence` },
    { title: `Common ${service} Mistakes and How to Avoid Them`, excerpt: `Even well-intentioned ${service.toLowerCase()} projects can go wrong. Learn about the most common mistakes and how our professional team helps you avoid costly errors.`, keywords: `${service} mistakes, avoid errors, professional tips`, slug: `common-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-mistakes-avoid` },
    { title: `Energy Efficiency Tips: How ${service} Can Save You Money`, excerpt: `Discover how professional ${service.toLowerCase()} services can improve your property's energy efficiency, reduce utility bills, and increase comfort in your ${location} home.`, keywords: `energy efficiency, ${service}, save money, utility bills`, slug: `energy-efficiency-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-save-money` },
    { title: `${service} Emergency? Here's What to Do First`, excerpt: `When a ${service.toLowerCase()} emergency strikes, knowing what to do can prevent further damage. Follow these essential first steps while you wait for professional help.`, keywords: `${service} emergency, first steps, damage prevention`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-emergency-what-to-do` },
    { title: `Customer Spotlight: ${service} Success Stories from ${location}`, excerpt: `Read real success stories from our satisfied customers in ${location}. See how our ${service.toLowerCase()} solutions transformed their properties and exceeded expectations.`, keywords: `customer stories, ${service}, ${location}, testimonials`, slug: `customer-spotlight-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `The Environmental Impact of Modern ${category} Practices`, excerpt: `Learn how modern ${category.toLowerCase()} practices are becoming more environmentally friendly. Discover green solutions and sustainable approaches we use at ${business}.`, keywords: `environmental impact, ${category}, green solutions, sustainable`, slug: `environmental-impact-modern-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `Preparing Your ${location} Home for ${service}: A Step-by-Step Guide`, excerpt: `Proper preparation ensures the best results for your ${service.toLowerCase()} project. Follow our detailed step-by-step guide to get your home ready for professional service.`, keywords: `preparation guide, ${service}, step-by-step, ${location}`, slug: `preparing-home-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-guide` },
    { title: `${service} Innovations That Are Changing the Industry`, excerpt: `Technology is revolutionizing ${service.toLowerCase()} services. Explore the latest innovations, tools, and techniques that deliver better results faster and more efficiently.`, keywords: `${service} innovations, technology, industry changes`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-innovations-changing-industry` },
    { title: `How to Budget for ${service} Projects in ${location}`, excerpt: `Smart budgeting ensures your ${service.toLowerCase()} project stays on track. Learn about cost factors, financing options, and money-saving tips for ${location} homeowners.`, keywords: `budget, ${service} projects, ${location}, financing`, slug: `budget-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-projects-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `What Makes a Licensed ${category} Professional Different?`, excerpt: `Not all ${category.toLowerCase()} providers are created equal. Learn why choosing licensed, insured professionals matters and how it protects your investment and property.`, keywords: `licensed professional, ${category}, insurance, certification`, slug: `licensed-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-professional-difference` },
    { title: `${service} FAQ: Your Top Questions Answered by Experts`, excerpt: `Our ${service.toLowerCase()} experts answer the most frequently asked questions from ${location} customers. Get clear, honest answers to help you make informed decisions.`, keywords: `${service} FAQ, questions answered, expert advice`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-faq-questions-answered` },
    { title: `Before and After: Amazing ${service} Transformations in ${location}`, excerpt: `See stunning before-and-after transformations from our ${service.toLowerCase()} projects in ${location}. These real examples showcase the quality of work you can expect.`, keywords: `before after, ${service}, transformations, ${location}`, slug: `before-after-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transformations` },
    { title: `${location} Building Codes and ${service}: What You Need to Know`, excerpt: `Understanding local building codes is essential for any ${service.toLowerCase()} project in ${location}. Learn about permits, regulations, and compliance requirements.`, keywords: `building codes, ${service}, ${location}, permits, regulations`, slug: `${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-building-codes-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `The Benefits of Regular ${service} Inspections`, excerpt: `Regular inspections can catch small problems before they become expensive repairs. Learn how scheduled ${service.toLowerCase()} inspections protect your property and wallet.`, keywords: `${service} inspections, preventive maintenance, benefits`, slug: `benefits-regular-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-inspections` },
    { title: `How Weather Affects ${service} in ${location}`, excerpt: `${location}'s climate presents unique challenges for ${service.toLowerCase()}. Understand how seasonal weather patterns impact your property and what preventive measures to take.`, keywords: `weather effects, ${service}, ${location}, climate challenges`, slug: `weather-affects-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `Choosing Quality Materials for Your ${service} Project`, excerpt: `Material quality directly impacts the longevity and performance of your ${service.toLowerCase()} project. Learn how ${business} selects premium materials for lasting results.`, keywords: `quality materials, ${service}, project durability`, slug: `choosing-quality-materials-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` },
    { title: `${business}'s Commitment to ${location} Community`, excerpt: `As a locally owned ${category.toLowerCase()} business, ${business} is deeply committed to the ${location} community. Discover our local partnerships, events, and community involvement.`, keywords: `${business}, community, ${location}, local business`, slug: `${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-commitment-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-community` },
    { title: `Insurance and ${service}: Protecting Your Investment`, excerpt: `Understanding how insurance relates to ${service.toLowerCase()} projects can save you thousands. Learn about coverage options, claim processes, and how to work with insurance providers.`, keywords: `insurance, ${service}, coverage, claims, investment protection`, slug: `insurance-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-protecting-investment` },
    { title: `The Future of ${category}: Technology and Trends for ${new Date().getFullYear() + 1}`, excerpt: `What does the future hold for the ${category.toLowerCase()} industry? Explore emerging technologies, sustainability trends, and innovations coming to ${location}.`, keywords: `future, ${category}, technology trends, ${new Date().getFullYear() + 1}`, slug: `future-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-technology-trends` },
    { title: `Why Preventive ${service} Saves You Money Long-Term`, excerpt: `Investing in preventive ${service.toLowerCase()} today can save you significant money on emergency repairs tomorrow. Learn the math behind proactive maintenance and care.`, keywords: `preventive ${service}, cost savings, long-term investment`, slug: `preventive-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-saves-money` },
    { title: `Hiring ${category} Professionals: Red Flags to Watch For`, excerpt: `Protect yourself from unqualified contractors. Learn the warning signs of unprofessional ${category.toLowerCase()} providers and how to verify credentials before hiring.`, keywords: `hiring tips, ${category} professionals, red flags, verification`, slug: `hiring-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-professionals-red-flags` },
    { title: `Expert ${service} Solutions for Commercial Properties in ${location}`, excerpt: `Commercial properties have unique ${service.toLowerCase()} needs. Discover our specialized commercial services, maintenance programs, and business-friendly scheduling in ${location}.`, keywords: `commercial ${service}, ${location}, business properties, maintenance`, slug: `expert-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-commercial-properties` },
    { title: `Understanding ${service} Warranties and Guarantees`, excerpt: `A strong warranty shows confidence in workmanship. Learn about ${business}'s satisfaction guarantee, warranty coverage, and what to expect from professional ${service.toLowerCase()} warranties.`, keywords: `${service} warranty, guarantee, workmanship, satisfaction`, slug: `understanding-${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-warranties-guarantees` },
    { title: `${service} for New Homeowners: Essential First Steps`, excerpt: `Just bought a home in ${location}? Here's your essential ${service.toLowerCase()} guide covering inspections, maintenance schedules, and important upgrades for new homeowners.`, keywords: `new homeowner, ${service}, first steps, ${location} guide`, slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-new-homeowners-first-steps` },
    { title: `How ${business} Maintains the Highest ${category} Standards`, excerpt: `Quality is non-negotiable at ${business}. Explore our rigorous training, certification processes, quality control measures, and commitment to industry-leading standards.`, keywords: `${business}, quality standards, ${category}, certifications`, slug: `${business.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-highest-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-standards` },
  ];

  // Add service-specific topics
  services.slice(0, 5).forEach((svc, i) => {
    if (svc.toLowerCase() !== service.toLowerCase()) {
      topics.push({
        title: `Complete Guide to ${svc} Services in ${location}`,
        excerpt: `Everything you need to know about professional ${svc.toLowerCase()} services. From understanding the process to choosing the right provider in ${location}, we cover it all.`,
        keywords: `${svc}, ${location}, guide, professional services`,
        slug: `complete-guide-${svc.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-services-${location.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
    }
  });

  // Add area-specific topics
  areas.slice(0, 5).forEach((area, i) => {
    if (area.toLowerCase() !== location.toLowerCase()) {
      topics.push({
        title: `${service} Services in ${area}: Local Expert Guide`,
        excerpt: `Looking for reliable ${service.toLowerCase()} services in ${area}? ${business} provides expert ${category.toLowerCase()} solutions serving ${area} and surrounding communities.`,
        keywords: `${service}, ${area}, local services, expert guide`,
        slug: `${service.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-services-${area.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
    }
  });

  return topics;
}

function generateBlogArchivePage(businessData: BusinessData, template: Template, domain?: string, siteSettings?: SiteSetting[]): string {
  // Blog archive page with actual blog posts or static content
  const blogPosts = businessData.blogPosts || [];

  // Generate filler blog topics to ensure at least 30 posts on archive
  const fillerTopics = generateFillerBlogTopics(businessData);
  const existingSlugs = new Set(blogPosts.map((p: any) => p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
  const fillerPosts = fillerTopics.filter(t => !existingSlugs.has(t.slug));
  const neededFillers = Math.max(0, 30 - blogPosts.length);
  const displayFillers = fillerPosts.slice(0, neededFillers);

  // Generate optimized meta data for blog page
  const optimizedTitle = `Expert ${businessData.category} Blog & Tips | ${businessData.businessName} | ${businessData.heroLocation}`;
  const optimizedDescription = generateOptimizedMetaDescription(businessData, 'blog');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
  <title>${seoTitle(optimizedTitle)}</title>
  <meta name="description" content="${seoDescription(optimizedDescription)}">
  ${businessData.logo ? `<link rel="icon" type="image/png" href="${businessData.logo}">` : ''}
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  ${generateSEOMetaTags(businessData, optimizedTitle, optimizedDescription, 'blog', domain, 'blog.html')}
  
  <!-- Blog Page Schema Markup -->
  ${generateWebPageSchema(businessData, optimizedTitle, optimizedDescription, domain, 'blog.html')}
  ${generateBreadcrumbSchema(businessData, 'blog', domain, 'blog.html')}
  ${generateOrganizationSchema(businessData, domain)}${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
  ${generateNavigation(businessData, 'blog')}
  ${generateBreadcrumbNavigation(businessData, 'blog')}
  
  <main>
    <!-- Blog Header -->
    <section class="blog-header" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); position: relative; overflow: hidden; padding: 5rem 0 3rem;">
      <!-- Floating gradient orbs -->
      <div style="position: absolute; top: -60px; right: -60px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); border-radius: 50%; animation: float 6s ease-in-out infinite; z-index: 1;"></div>
      <div style="position: absolute; bottom: -40px; left: -40px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; animation: float 8s ease-in-out infinite reverse; z-index: 1;"></div>
      <div style="position: absolute; top: 50%; left: 60%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); border-radius: 50%; animation: float 7s ease-in-out infinite 1s; z-index: 1;"></div>
      <div class="container" style="position: relative; z-index: 2;">
        <div style="max-width: 700px;">
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.25); padding: 0.5rem 1.25rem; border-radius: 50px; margin-bottom: 1.5rem; color: white; font-size: 0.875rem; font-weight: 600;">
            <i class="fas fa-blog"></i> Expert Articles & Insights
          </div>
          <h1 style="color: white; font-size: clamp(2.5rem, 5vw, 3.5rem); margin-bottom: 1rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">Expert ${businessData.category} Tips & Insights</h1>
          <p style="font-size: 1.25rem; color: rgba(255,255,255,0.9); max-width: 600px; line-height: 1.7;">
            Discover insights, tips, and industry expertise from our team of professionals. 
            Stay informed with the latest trends and best practices in ${businessData.heroService}.
          </p>
          <div style="display: flex; gap: 1.5rem; margin-top: 2rem; flex-wrap: wrap;">
            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.25rem; border-radius: 12px; color: white; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-newspaper"></i> ${blogPosts.length + displayFillers.length}+ Articles</div>
            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.25rem; border-radius: 12px; color: white; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-lightbulb"></i> Expert Tips</div>
            <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.25rem; border-radius: 12px; color: white; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-sync-alt"></i> Updated Regularly</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Blog Posts -->
    <section class="blog-posts" style="padding: 4rem 0; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
      <div class="container">
        <div class="blog-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem;">
          
          ${blogPosts.length > 0 ? blogPosts.map((post: any) => {
    const slug = post.slug || post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const keywords = typeof post.keywords === 'string' ? post.keywords :
      (Array.isArray(post.keywords) ? post.keywords.slice(0, 3).join(', ') : 'SEO, Business');
    return `
              <article class="blog-card" style="background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; transition: all 0.4s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(255,255,255,0.6);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0,0,0,0.08)';">
                ${post.featuredImage ? `<div class="blog-card-image" style="height: 200px; background-image: url('${post.featuredImage}'); background-size: cover; background-position: center; position: relative;"><div style="position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: linear-gradient(transparent, rgba(0,0,0,0.3));"></div></div>` : `<div style="height: 8px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 16px 16px 0 0;"></div>`}
                <div class="blog-card-content" style="padding: 2rem;">
                  <a href="blog-${slug}.html" class="blog-title" style="text-decoration: none; display: block; font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem; color: #1a202c; line-height: 1.3; transition: color 0.3s;" onmouseover="this.style.color='${template.colors.primary}'" onmouseout="this.style.color='#1a202c'">
                    ${post.title}
                  </a>
                  <p class="blog-excerpt" style="color: #64748b; margin-bottom: 1.5rem; line-height: 1.7; font-size: 0.95rem;">${post.excerpt}</p>
                  <div class="blog-meta" style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
                    <div class="blog-keywords" style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                      ${(typeof keywords === 'string' ? keywords.split(',') : [keywords]).slice(0, 3).map((kw: string) => `<span style="background: ${template.colors.primary}12; color: ${template.colors.primary}; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">${(kw || '').trim()}</span>`).join('')}
                    </div>
                    <a href="blog-${slug}.html" class="read-more" style="color: white; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; border-radius: 8px; transition: all 0.3s; width: fit-content; font-size: 0.875rem; box-shadow: 0 4px 12px ${template.colors.primary}33;" onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 6px 20px ${template.colors.primary}55';" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 4px 12px ${template.colors.primary}33';">
                      Read Full Article <i class="fas fa-arrow-right"></i>
                    </a>
                  </div>
                </div>
              </article>
            `;
  }).join('') : ''}${displayFillers.map((filler) => `
              <article class="blog-card" style="background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.08); overflow: hidden; transition: all 0.4s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(255,255,255,0.6);" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0,0,0,0.08)';">
                <div style="height: 8px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 16px 16px 0 0;"></div>
                <div class="blog-card-content" style="padding: 2rem;">
                  <div class="blog-title" style="display: block; font-size: 1.4rem; font-weight: 700; margin-bottom: 1rem; color: #1a202c; line-height: 1.3;">
                    ${filler.title}
                  </div>
                  <p class="blog-excerpt" style="color: #64748b; margin-bottom: 1.5rem; line-height: 1.7; font-size: 0.95rem;">${filler.excerpt}</p>
                  <div class="blog-meta" style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
                    <div class="blog-keywords" style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                      ${filler.keywords.split(',').slice(0, 3).map(kw => `<span style="background: ${template.colors.primary}12; color: ${template.colors.primary}; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 500;">${kw.trim()}</span>`).join('')}
                    </div>
                    <a href="index.html#contact" class="read-more" style="color: white; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; border-radius: 8px; transition: all 0.3s; width: fit-content; font-size: 0.875rem; box-shadow: 0 4px 12px ${template.colors.primary}33;">
                      Coming Soon <i class="fas fa-clock"></i>
                    </a>
                  </div>
                </div>
              </article>
          `).join('')}

          ${blogPosts.length === 0 && displayFillers.length === 0 ? `
          <!-- Empty state - no blog posts -->
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
            <div style="max-width: 500px; margin: 0 auto;">
              <i class="fas fa-blog" style="font-size: 4rem; color: ${template.colors.primary}; margin-bottom: 2rem; opacity: 0.3;"></i>
              <h3 style="color: ${template.colors.primary}; font-size: 1.8rem; margin-bottom: 1rem;">Coming Soon</h3>
              <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
                We're working on some great content to share with you. Check back soon for helpful tips, 
                industry insights, and expert advice about ${businessData.heroService}.
              </p>
            </div>
          </div>
          ` : ''}

        </div>
      </div>
    </section>

    <!-- Call to Action Section -->
    <section class="blog-cta" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); padding: 4rem 0; text-align: center;">
      <div class="container">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: white; font-size: 2.5rem; margin-bottom: 1.5rem;">Ready to Get Started?</h2>
          <p style="color: white; font-size: 1.25rem; margin-bottom: 2.5rem; opacity: 0.9;">
            Contact us today for professional ${businessData.heroService} services in ${businessData.heroLocation}. 
            Get your free consultation and see why customers trust us for quality work.
          </p>
          <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
            <a href="tel:${businessData.phone}" style="background: white; color: ${template.colors.primary}; padding: 1.25rem 2.5rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.3s ease;">
              <i class="fas fa-phone"></i> Call ${businessData.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
    <div class="container">
      <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
        <div class="footer-main">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
            </div>
            <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${businessData.businessName}</h3>
          </div>
          <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${businessData.footerDescription || `Professional ${businessData.category.toLowerCase()} services in ${businessData.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
          <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
            <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${businessData.phone}" style="color: white; text-decoration: none;">${businessData.phone}</a></span></p>
            ${businessData.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${businessData.email}" style="color: white; text-decoration: none;">${businessData.email}</a></span></p>` : ''}
            <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${businessData.address}</span></p>
            <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${businessData.businessHours}</span></p>
          </div>
        </div>
        
        <div class="footer-services">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
          <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
            <li style="margin-bottom: 0.75rem;"><a href="#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${businessData.heroService}</a></li>
            ${businessData.additionalServices ? businessData.additionalServices.split(',').slice(0, 5).map(service => `
            <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), businessData.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
            `).join('') : ''}
            <li style="margin-bottom: 0.75rem;"><a href="#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Free Estimates</a></li>
            <li style="margin-bottom: 0.75rem;"><a href="#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Emergency Service</a></li>
          </ul>
        </div>
        
        <div class="footer-areas">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
          <div style="color: #cbd5e1; line-height: 1.8;">
            ${businessData.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaLink = businessData.additionalLocations && businessData.additionalLocations.split(',').map(loc => loc.trim()).includes(area.trim())
      ? generateLocationUrl(area.trim(), businessData.category)
      : '#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${area.trim()}</a></div>`;
  }).join('')}
            ${businessData.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
          </div>
        </div>
        
        <div class="footer-info">
          <h4 style="color: white; font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.75rem; display: inline-block; text-align: left;">Why Choose Us</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${businessData.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 1rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 1.1rem; text-align: left; line-height: 1.6;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0; font-size: 1rem;"></i><span>${fact.trim()}</span></li>`).join('')}
          </ul>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <a href="tel:${businessData.phone}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
              <i class="fas fa-phone"></i>
              Call Now
            </a>
          </div>
        </div>
        
        <div class="footer-social">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
          <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
            ${businessData.facebookUrl ? `<a href="${businessData.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${businessData.twitterUrl ? `<a href="${businessData.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>` : ''}
            ${businessData.linkedinUrl ? `<a href="${businessData.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>` : ''}
            ${businessData.pinterestUrl ? `<a href="${businessData.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
        <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${businessData.businessName}. All rights reserved. | Trusted Professional ${businessData.category} Services</p>
        ${businessData.leadGenDisclaimer && businessData.leadGenDisclaimer.trim() ? `
        <div class="disclaimer-section" style="margin-top: 1rem;">
          <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${businessData.leadGenDisclaimer}</p>
        </div>
        ` : ''}
      </div>
    </div>
  </footer>

  <script src="script.js"></script>${injectTrackingCodes(siteSettings, 'body_end')}
</body>
</html>`;
}

function generateBlogPostPageFromData(businessData: BusinessData, template: Template, post: any, domain?: string, siteSettings?: SiteSetting[]): string {
  // Generate blog post page from actual blog post data
  const optimizedTitle = `${post.metaTitle || post.title} | ${businessData.businessName}`;
  const optimizedDescription = post.metaDescription || post.excerpt;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
  <title>${seoTitle(optimizedTitle)}</title>
  <meta name="description" content="${seoDescription(optimizedDescription)}">
  <meta name="keywords" content="${Array.isArray(post.keywords) ? post.keywords.join(', ') : post.keywords || post.title}">
  ${businessData.logo ? `<link rel="icon" type="image/png" href="${businessData.logo}">` : ''}
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  ${generateSEOMetaTags(businessData, optimizedTitle, optimizedDescription, 'blog-post', domain, `blog-${post.slug}.html`)}
  
  <!-- Blog Post Schema Markup -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${post.title}",
    "description": "${post.excerpt}",
    "image": "${post.featuredImage || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600`}",
    "author": {
      "@type": "Organization",
      "name": "${businessData.businessName}",
      "url": "${domain || '#'}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "${businessData.businessName}",
      "logo": {
        "@type": "ImageObject",
        "url": "${businessData.logo || `https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400`}"
      }
    },
    "datePublished": "${new Date().toISOString()}",
    "dateModified": "${new Date().toISOString()}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "${domain || '#'}"
    },
    "keywords": "${Array.isArray(post.keywords) ? post.keywords.join(', ') : post.keywords || post.title}",
    "articleSection": "${post.category || businessData.category}",
    "about": {
      "@type": "Thing",
      "name": "${businessData.heroService}"
    }
  }
  </script>
  
  ${generateWebPageSchema(businessData, optimizedTitle, optimizedDescription, domain, `blog-${post.slug}.html`)}
  ${generateBreadcrumbSchema(businessData, 'blog', domain, `blog-${post.slug}.html`)}
  ${generateOrganizationSchema(businessData, domain)}${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
  ${generateNavigation(businessData, 'blog')}
  ${generateBreadcrumbNavigation(businessData, 'blog')}
  
  <main>
    <!-- Blog Post Header -->
    <article class="blog-post">
      <header class="blog-header" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); position: relative; overflow: hidden; padding: 5rem 0 3rem;">
        <!-- Floating gradient orbs -->
        <div style="position: absolute; top: -50px; right: -50px; width: 220px; height: 220px; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); border-radius: 50%; animation: float 6s ease-in-out infinite; z-index: 1;"></div>
        <div style="position: absolute; bottom: -30px; left: -30px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; animation: float 8s ease-in-out infinite reverse; z-index: 1;"></div>
        <div class="container" style="position: relative; z-index: 2;">
          <div style="max-width: 800px; margin: 0 auto; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.25); padding: 0.5rem 1.25rem; border-radius: 50px; margin-bottom: 1.5rem; color: white; font-size: 0.875rem; font-weight: 600;">
              <i class="fas fa-bookmark"></i> ${post.category || businessData.category}
            </div>
            <h1 style="color: white; font-size: clamp(2rem, 5vw, 3rem); margin-bottom: 1.5rem; line-height: 1.2; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${post.title}</h1>
            <p style="font-size: 1.25rem; color: rgba(255,255,255,0.9); margin-bottom: 2rem; line-height: 1.7;">${post.excerpt}</p>
            <div style="display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap;">
              <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 1.25rem; border-radius: 10px; color: white; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</div>
              <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 1.25rem; border-radius: 10px; color: white; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-user"></i> ${post.authorName || businessData.businessName}</div>
              <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); padding: 0.6rem 1.25rem; border-radius: 10px; color: white; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-tag"></i> ${post.category || businessData.category}</div>
            </div>
          </div>
        </div>
      </header>

      <!-- Featured Image -->
      ${post.featuredImage ? `
      <section style="padding: 2rem 0;">
        <div class="container">
          <div style="max-width: 800px; margin: 0 auto;">
            <img src="${post.featuredImage}" alt="${post.featuredImageAlt || post.title}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.12);">
          </div>
        </div>
      </section>
      ` : ''}

      <!-- Blog Content -->
      <section class="blog-content" style="padding: 3rem 0 4rem; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);">
        <div class="container">
          <div style="max-width: 800px; margin: 0 auto;">
            <div class="blog-text" style="font-size: 1.1rem; line-height: 1.8; color: #333; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6); border-radius: 20px; padding: 3rem; box-shadow: 0 8px 32px rgba(0,0,0,0.06);">
              ${formatMarkdownContent(post.content)}
            </div>
            
            <!-- Tags -->
            ${post.tags && post.tags.length > 0 ? `
            <div style="margin-top: 2rem; padding: 2rem; background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: ${template.colors.primary}; font-weight: 600;">Tags:</h3>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${post.tags.map((tag: string) => `
                  <span style="background: linear-gradient(135deg, ${template.colors.primary}18, ${template.colors.secondary}18); color: ${template.colors.primary}; padding: 0.35rem 1rem; border-radius: 25px; font-size: 0.85rem; font-weight: 500; border: 1px solid ${template.colors.primary}20; transition: all 0.3s;">${tag}</span>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </section>
    </article>

    <!-- Call to Action -->
    <section class="blog-cta" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); padding: 4rem 0; text-align: center;">
      <div class="container">
        <div style="max-width: 600px; margin: 0 auto;">
          <h2 style="color: white; font-size: 2.5rem; margin-bottom: 1.5rem;">Need Professional ${businessData.heroService}?</h2>
          <p style="color: white; font-size: 1.25rem; margin-bottom: 2.5rem; opacity: 0.9;">
            Contact ${businessData.businessName} today for expert ${businessData.heroService} services in ${businessData.heroLocation}. 
            Get your free consultation and see why customers trust us for quality work.
          </p>
          <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
            <a href="tel:${businessData.phone}" style="background: white; color: ${template.colors.primary}; padding: 1.25rem 2.5rem; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: transform 0.3s ease;">
              <i class="fas fa-phone"></i> Call ${businessData.phone}
            </a>
            <a href="../index.html" style="background: transparent; color: white; padding: 1.25rem 2.5rem; border: 2px solid white; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 1.1rem; display: inline-flex; align-items: center; gap: 0.75rem; transition: all 0.3s ease;">
              <i class="fas fa-home"></i> Back to Home
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
    <div class="container">
      <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
        <div class="footer-main">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
            </div>
            <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${businessData.businessName}</h3>
          </div>
          <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${businessData.footerDescription || `Professional ${businessData.category.toLowerCase()} services in ${businessData.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
          <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
            <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${businessData.phone}" style="color: white; text-decoration: none;">${businessData.phone}</a></span></p>
            ${businessData.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${businessData.email}" style="color: white; text-decoration: none;">${businessData.email}</a></span></p>` : ''}
            <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${businessData.address}</span></p>
            <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${businessData.businessHours}</span></p>
          </div>
        </div>
        
        <div class="footer-services">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
          <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
            <li style="margin-bottom: 0.75rem;"><a href="../index.html#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${businessData.heroService}</a></li>
            ${businessData.additionalServices ? businessData.additionalServices.split(',').slice(0, 5).map(service => `
            <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), businessData.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
            `).join('') : ''}
            <li style="margin-bottom: 0.75rem;"><a href="../index.html#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Free Estimates</a></li>
            <li style="margin-bottom: 0.75rem;"><a href="../index.html#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Emergency Service</a></li>
          </ul>
        </div>
        
        <div class="footer-areas">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
          <div style="color: #cbd5e1; line-height: 1.8;">
            ${businessData.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaLink = businessData.additionalLocations && businessData.additionalLocations.split(',').map(loc => loc.trim()).includes(area.trim())
      ? generateLocationUrl(area.trim(), businessData.category)
      : '../index.html#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${area.trim()}</a></div>`;
  }).join('')}
            ${businessData.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="../index.html#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
          </div>
        </div>
        
        <div class="footer-info">
          <h4 style="color: white; font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.75rem; display: inline-block; text-align: left;">Why Choose Us</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${businessData.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 1rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 1.1rem; text-align: left; line-height: 1.6;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0; font-size: 1rem;"></i><span>${fact.trim()}</span></li>`).join('')}
          </ul>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <a href="tel:${businessData.phone}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
              <i class="fas fa-phone"></i>
              Call Now
            </a>
          </div>
        </div>
        
        <div class="footer-social">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
          <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
            ${businessData.facebookUrl ? `<a href="${businessData.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${businessData.twitterUrl ? `<a href="${businessData.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>` : ''}
            ${businessData.linkedinUrl ? `<a href="${businessData.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>` : ''}
            ${businessData.pinterestUrl ? `<a href="${businessData.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
        <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${businessData.businessName}. All rights reserved. | Trusted Professional ${businessData.category} Services</p>
        ${businessData.leadGenDisclaimer && businessData.leadGenDisclaimer.trim() ? `
        <div class="disclaimer-section" style="margin-top: 1rem;">
          <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${businessData.leadGenDisclaimer}</p>
        </div>
        ` : ''}
      </div>
    </div>
  </footer>

  <script src="script.js"></script>${injectTrackingCodes(siteSettings, 'body_end')}
</body>
</html>`;
}

function formatMarkdownContent(content: string): string {
  // Simple markdown to HTML conversion
  return content
    .replace(/^## (.*$)/gim, '<h2 style="color: #1a202c; font-size: 1.8rem; margin: 2rem 0 1rem; font-weight: 600;">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 style="color: #1a202c; font-size: 1.5rem; margin: 1.5rem 0 1rem; font-weight: 600;">$1</h3>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 0.5rem;">$1</li>')
    .replace(/(<li.*<\/li>)/gim, '<ul style="margin: 1rem 0; padding-left: 2rem;">$1</ul>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 1.5rem;">')
    .replace(/^(?!<[h|u|l])(.+)$/gim, '<p style="margin-bottom: 1.5rem;">$1</p>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function generateBlogPostPage(businessData: BusinessData, template: Template, postSlug: string, domain?: string, siteSettings?: SiteSetting[]): string {
  const posts = {
    'hvac-maintenance': {
      title: '10 Essential Tips for Maintaining Your Home\'s HVAC System',
      excerpt: 'Keep your heating and cooling system running efficiently year-round with these professional maintenance tips that can save you money and extend your system\'s lifespan.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop',
      date: 'January 25, 2025',
      readTime: '5 min read',
      content: `
        <h2>Why HVAC Maintenance Matters</h2>
        <p>Your home's HVAC system is one of the most important investments you'll make. Regular maintenance not only ensures comfort year-round but can significantly reduce energy costs and prevent costly repairs.</p>
        
        <h2>1. Change Your Air Filters Regularly</h2>
        <p>The most important maintenance task is changing your air filters every 1-3 months. Clean filters improve air quality, reduce strain on your system, and lower energy bills by up to 15%.</p>
        
        <h2>2. Keep Your Outdoor Unit Clean</h2>
        <p>Remove debris, leaves, and dirt from around your outdoor condenser unit. Maintain at least 2 feet of clearance on all sides for proper airflow.</p>
        
        <h2>3. Schedule Professional Inspections</h2>
        <p>Have a qualified technician inspect your system twice a year - once before heating season and once before cooling season. This preventive measure can catch problems early.</p>
        
        <h2>4. Check and Clean Your Vents</h2>
        <p>Ensure all vents and registers are unobstructed and clean. Blocked vents force your system to work harder and can lead to uneven temperatures throughout your home.</p>
        
        <h2>5. Monitor Your Thermostat</h2>
        <p>Consider upgrading to a programmable or smart thermostat. These devices can reduce energy consumption by automatically adjusting temperatures when you're away.</p>
        
        <h2>Conclusion</h2>
        <p>Regular HVAC maintenance is an investment in your home's comfort and efficiency. By following these tips and working with qualified professionals, you can extend your system's life and save money on energy costs.</p>
      `
    },
    'solar-installation': {
      title: 'The Complete Guide to Solar Panel Installation for Homeowners',
      excerpt: 'Everything you need to know about installing solar panels on your home, from initial assessment to system activation and long-term maintenance.',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=400&fit=crop',
      date: 'January 20, 2025',
      readTime: '8 min read',
      content: `
        <h2>Why Choose Solar Energy?</h2>
        <p>Solar energy offers homeowners a sustainable way to reduce electricity bills while increasing property value. With federal tax incentives and improving technology, there's never been a better time to go solar.</p>
        
        <h2>Pre-Installation Assessment</h2>
        <p>Before installation, our team conducts a comprehensive assessment of your home's solar potential, including roof condition, orientation, shading analysis, and electrical system evaluation.</p>
        
        <h2>The Installation Process</h2>
        <p>Professional solar installation typically takes 1-3 days and involves mounting panels, installing inverters, connecting electrical components, and setting up monitoring systems.</p>
        
        <h2>Permits and Inspections</h2>
        <p>We handle all necessary permits and coordinate inspections with local authorities to ensure your system meets all safety and building codes.</p>
        
        <h2>System Monitoring and Maintenance</h2>
        <p>Modern solar systems include monitoring capabilities that let you track energy production. Most systems require minimal maintenance - mainly keeping panels clean and checking connections annually.</p>
        
        <h2>Financing Options</h2>
        <p>Explore various financing options including cash purchases, solar loans, and leasing programs. Federal tax credits can reduce installation costs by up to 30%.</p>
      `
    },
    'kitchen-remodeling': {
      title: 'Kitchen Remodeling Trends That Add Value to Your Home',
      excerpt: 'Discover the latest kitchen remodeling trends that not only create beautiful spaces but also significantly increase your home\'s market value.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
      date: 'January 15, 2025',
      readTime: '6 min read',
      content: `
        <h2>Smart Kitchen Technology</h2>
        <p>Integration of smart appliances, voice-controlled lighting, and automated systems are becoming standard in modern kitchen remodels. These features offer convenience while appealing to tech-savvy buyers.</p>
        
        <h2>Sustainable Materials</h2>
        <p>Eco-friendly materials like bamboo cabinets, recycled glass countertops, and energy-efficient appliances are increasingly popular among environmentally conscious homeowners.</p>
        
        <h2>Open Concept Layouts</h2>
        <p>Removing walls to create open-concept kitchen-living spaces continues to be a top trend, making homes feel larger and more conducive to entertaining.</p>
        
        <h2>Bold Color Choices</h2>
        <p>While white kitchens remain classic, we're seeing more homeowners embrace bold colors like navy blue, forest green, and even black for cabinets and accents.</p>
        
        <h2>Multi-Functional Islands</h2>
        <p>Kitchen islands are evolving beyond prep space to include seating, storage, and even charging stations for devices. They're becoming the true heart of the kitchen.</p>
        
        <h2>Return on Investment</h2>
        <p>Kitchen remodels typically return 60-80% of their cost in added home value. Focus on quality materials and timeless design elements for the best ROI.</p>
      `
    }
  };

  const post = posts[postSlug as keyof typeof posts];
  if (!post) return '';

  // Optimize blog post meta data
  const optimizedTitle = `${post.title} | ${businessData.businessName} ${businessData.category} Tips`;
  const optimizedDescription = generateOptimizedMetaDescription(businessData, 'blog-post', post.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
  <title>${seoTitle(optimizedTitle)}</title>
  <meta name="description" content="${seoDescription(optimizedDescription)}">
  ${businessData.logo ? `<link rel="icon" type="image/png" href="${businessData.logo}">` : ''}
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  ${generateSEOMetaTags(businessData, optimizedTitle, optimizedDescription, 'blog-post', domain, `blog-post-${postSlug}.html`)}
  
  <!-- Blog Post Schema Markup -->
  ${generateWebPageSchema(businessData, optimizedTitle, optimizedDescription, domain, `blog-post-${postSlug}.html`)}
  ${generateBreadcrumbSchema(businessData, 'blog-post', domain, `blog-post-${postSlug}.html`)}
  ${generateOrganizationSchema(businessData, domain)}${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
  ${generateNavigation(businessData)}
  ${generateBreadcrumbNavigation(businessData, 'blog-post', post.title)}
  
  <main>
    <article class="blog-post" style="max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
      
      <!-- Back to Blog -->
      <div style="margin-bottom: 2rem;">
        <a href="blog.html" style="color: ${template.colors.primary}; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
          <i class="fas fa-arrow-left"></i> Back to Blog
        </a>
      </div>

      <!-- Post Header -->
      <header style="margin-bottom: 3rem;">
        <div class="post-meta" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; color: #666; font-size: 0.9rem;">
          <span><i class="fas fa-calendar"></i> ${post.date}</span>
          <span><i class="fas fa-clock"></i> ${post.readTime}</span>
        </div>
        
        <h1 style="color: ${template.colors.primary}; font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem;">${post.title}</h1>
        
        <p style="font-size: 1.2rem; color: #666; line-height: 1.6; margin-bottom: 2rem;">${post.excerpt}</p>
        
        <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 2rem;">
      </header>

      <!-- Post Content -->
      <div class="post-content" style="line-height: 1.8; color: #333;">
        ${post.content}
      </div>

      <!-- Call to Action -->
      <div class="post-cta" style="background: linear-gradient(135deg, ${template.colors.primary}15, ${template.colors.secondary}15); padding: 2rem; border-radius: 12px; margin-top: 3rem; text-align: center;">
        <h3 style="color: ${template.colors.primary}; margin-bottom: 1rem;">Ready to Get Started?</h3>
        <p style="margin-bottom: 2rem; color: #666;">Contact us today to learn more about our services and how we can help your business grow.</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="tel:${businessData.phone}" class="cta-btn" style="background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            <i class="fas fa-phone"></i> Call Now
          </a>
          <a href="mailto:${businessData.email}" class="cta-btn" style="background: ${template.colors.secondary}; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">
            <i class="fas fa-envelope"></i> Get Quote
          </a>
        </div>
      </div>

    </article>
  </main>

  <!-- Footer -->
  <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
    <div class="container">
      <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
        <div class="footer-main">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
            </div>
            <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${businessData.businessName}</h3>
          </div>
          <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${businessData.footerDescription || `Professional ${businessData.category.toLowerCase()} services in ${businessData.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
          <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
            <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${businessData.phone}" style="color: white; text-decoration: none;">${businessData.phone}</a></span></p>
            ${businessData.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${businessData.email}" style="color: white; text-decoration: none;">${businessData.email}</a></span></p>` : ''}
            <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${businessData.address}</span></p>
            <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${businessData.businessHours}</span></p>
          </div>
        </div>
        
        <div class="footer-services">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
          <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
            <li style="margin-bottom: 0.75rem;"><a href="index.html#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${businessData.heroService}</a></li>
            ${businessData.additionalServices ? businessData.additionalServices.split(',').slice(0, 5).map(service => `
            <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), businessData.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
            `).join('') : ''}
            <li style="margin-bottom: 0.75rem;"><a href="index.html#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(businessData.category).consultationTerm}</a></li>
            <li style="margin-bottom: 0.75rem;"><a href="index.html#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(businessData.category).urgentTerm.charAt(0).toUpperCase() + getCategorySpecificTerms(businessData.category).urgentTerm.slice(1)}</a></li>
          </ul>
        </div>
        
        <div class="footer-areas">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
          <div style="color: #cbd5e1; line-height: 1.8;">
            ${businessData.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaLink = businessData.additionalLocations && businessData.additionalLocations.split(',').map(loc => loc.trim()).includes(area.trim())
      ? generateLocationUrl(area.trim(), businessData.category)
      : 'index.html#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${area.trim()}</a></div>`;
  }).join('')}
            ${businessData.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="index.html#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
          </div>
        </div>
        
        <div class="footer-info">
          <h4 style="color: white; font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.75rem; display: inline-block; text-align: left;">Why Choose Us</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${businessData.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 1rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 1.1rem; text-align: left; line-height: 1.6;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0; font-size: 1rem;"></i><span>${fact.trim()}</span></li>`).join('')}
          </ul>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <a href="tel:${businessData.phone}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
              <i class="fas fa-phone"></i>
              Call Now
            </a>
          </div>
        </div>
        
        <div class="footer-social">
          <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
          <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
            ${businessData.facebookUrl ? `<a href="${businessData.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${businessData.twitterUrl ? `<a href="${businessData.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>` : ''}
            ${businessData.linkedinUrl ? `<a href="${businessData.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>` : ''}
            ${businessData.pinterestUrl ? `<a href="${businessData.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
        <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${businessData.businessName}. All rights reserved. | Trusted Professional ${businessData.category} Services</p>
        ${businessData.leadGenDisclaimer && businessData.leadGenDisclaimer.trim() ? `
        <div class="disclaimer-section" style="margin-top: 1rem;">
          <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${businessData.leadGenDisclaimer}</p>
        </div>
        ` : ''}
      </div>
    </div>
  </footer>

  <script src="script.js"></script>${injectTrackingCodes(siteSettings, 'body_end')}
</body>
</html>`;
}

function generateNavigation(businessData: BusinessData, currentPage?: string): string {
  const additionalLocations = parseDynamicPageValues(
    businessData.additionalLocations,
    businessData.serviceAreas,
    businessData.heroLocation
  );

  const additionalServices = parseDynamicPageValues(
    businessData.additionalServices,
    businessData.services,
    businessData.heroService
  );

  let nav = `
    <header class="header">
        <nav class="nav">
            <div class="nav-brand">
                <a href="index.html" style="text-decoration: none; display: flex; align-items: center; gap: 0.75rem;">
                    ${businessData.logo ? `<img src="${businessData.logo}" alt="${businessData.businessName} Logo" class="nav-logo" />` : ''}
                    ${(!businessData.logo || businessData.logo === '') ? `<span style="font-weight: 700; font-size: 1.25rem; color: #1a202c;">${businessData.businessName || 'Your Business'}</span>` : ''}
                </a>
            </div>
            <!-- Mobile menu button -->
            <button class="mobile-menu-btn" onclick="toggleMobileMenu()">
                <i class="fas fa-bars"></i>
            </button>
            <div class="nav-links" id="navLinks">
                <ul class="nav-menu">
                    <li><a href="index.html" class="${currentPage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="#about">About</a></li>
                    ${businessData.generateBlog ? `<li><a href="blog.html" class="${currentPage === 'blog' ? 'active' : ''}">Blog</a></li>` : ''}
                    <li><a href="#contact">Contact</a></li>`;

  // Add location section if there are additional locations
  if (additionalLocations.length > 0) {
    nav += `
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">Locations <i class="fas fa-chevron-down"></i></a>
                        <ul class="dropdown-menu">`;
    additionalLocations.forEach(location => {
      const filename = generateLocationUrl(location, businessData.category);
      nav += `
                            <li><a href="${filename}">${location}</a></li>`;
    });
    nav += `
                        </ul>
                    </li>`;

    // Add mobile-specific location section
    nav += `
                    <li class="mobile-section-header mobile-only">Locations</li>`;
    additionalLocations.forEach(location => {
      const filename = generateLocationUrl(location, businessData.category);
      nav += `
                    <li class="mobile-section-items mobile-only"><a href="${filename}">${location}</a></li>`;
    });

    // Add spacer if we have services too
    if (additionalServices.length > 0) {
      nav += `<li class="mobile-menu-spacer mobile-only"></li>`;
    }
  }

  // Add services section if there are additional services
  if (additionalServices.length > 0) {
    nav += `
                    <li class="dropdown">
                        <a href="#" class="dropdown-toggle">Services <i class="fas fa-chevron-down"></i></a>
                        <ul class="dropdown-menu">`;
    const displayServices = additionalServices.slice(0, 5);
    displayServices.forEach(service => {
      const filename = generateServiceUrl(service, businessData.heroLocation);
      nav += `
                            <li><a href="${filename}">${service}</a></li>`;
    });
    
    if (additionalServices.length > 5) {
      nav += `
                            <li style="border-top: 1px solid #eee; margin-top: 5px; padding-top: 5px;"><a href="index.html#services" style="font-weight: 600; color: #3b82f6;">View All Services</a></li>`;
    }
    
    nav += `
                        </ul>
                    </li>`;

    // Add mobile-specific services section
    nav += `
                    <li class="mobile-section-header mobile-only">Services</li>`;
    displayServices.forEach(service => {
      const filename = generateServiceUrl(service, businessData.heroLocation);
      nav += `
                    <li class="mobile-section-items mobile-only"><a href="${filename}">${service}</a></li>`;
    });
    
    if (additionalServices.length > 5) {
      nav += `
                    <li class="mobile-section-items mobile-only" style="border-top: 1px solid #eee; margin-top: 5px; padding-top: 5px;"><a href="index.html#services" style="font-weight: 600; color: #3b82f6;">View All Services</a></li>`;
    }
  }

  nav += `
                </ul>
            </div>
            <div class="nav-contact">
                <a href="tel:${businessData.phone}" class="phone-btn">
                    <i class="fas fa-phone"></i> ${businessData.phone}
                </a>
            </div>
        </nav>
    </header>`;

  return nav;
}

function generateMainHTML(data: BusinessData, template: Template, domain?: string, siteSettings?: SiteSetting[]): string {
  const features = data.featureHeadlines.split(',').map(h => h.trim());
  const featureDescriptions = data.featureDescriptions.split(',').map(d => d.trim());

  // Generate consistent values once to use throughout the entire website
  const consistentRating = generateDeterministicRating(data.businessName);
  const consistentReviewCount = generateDeterministicReviewCount(data.businessName);
  const consistentCustomerCount = generateDeterministicCustomerCount(data.businessName);
  const formattedCustomerCount = formatCustomerCount(consistentCustomerCount);

  // Use custom meta data if provided, otherwise use auto-generated with optimal length
  const optimizedTitle = data.metaTitle || `${data.heroService} in ${data.heroLocation} | ${data.businessName} | ${data.yearsInBusiness}+ Years Experience`;
  const optimizedDescription = data.metaDescription || generateOptimizedMetaDescription(data, 'home');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
    <title>${seoTitle(optimizedTitle)}</title>
    <meta name="description" content="${seoDescription(optimizedDescription)}">
    ${data.logo ? `<link rel="icon" type="image/png" href="${data.logo}">` : ''}
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    ${generateSEOMetaTags(data, optimizedTitle, optimizedDescription, 'home', domain, '/')}
    
    <!-- Enhanced Schema Markup for Better SEO -->
    ${generateLocalBusinessSchema(data, optimizedTitle, optimizedDescription, domain, consistentRating, consistentReviewCount)}
    ${generateOrganizationSchema(data, domain)}
    ${generateServiceSchema(data)}
    ${generateWebPageSchema(data, optimizedTitle, optimizedDescription, domain)}
    ${generateBreadcrumbSchema(data, 'home', domain)}
    ${generateFAQSchema(data)}
    ${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
    ${generateNavigation(data, 'home')}
    ${generateBreadcrumbNavigation(data, 'home')}

    <!-- Hero Section -->
    <section class="hero" style="background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary}DD 100%); background-size: 200% 200%; animation: gradientShift 12s ease infinite; position: relative; overflow: hidden;">
        <div class="hero-overlay"></div>
        
        <!-- Hero Background Pattern - Mesh gradient -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.08; z-index: 1;">
            <div style="background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.15%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E'); background-size: 60px 60px; width: 100%; height: 100%;"></div>
        </div>
        
        <!-- Floating gradient orbs -->
        <div style="position: absolute; top: 10%; right: 15%; width: 300px; height: 300px; background: radial-gradient(circle, ${template.colors.accent}30 0%, transparent 70%); border-radius: 50%; z-index: 1; animation: float 8s ease-in-out infinite;"></div>
        <div style="position: absolute; bottom: 10%; left: 10%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; z-index: 1; animation: float 10s ease-in-out infinite reverse;"></div>
        
        <div class="container" style="position: relative; z-index: 2;">
            <!-- Available Badge -->
            <div style="text-align: center; margin-bottom: 2rem; animation: fadeInDown 0.6s ease-out;">
                <span style="display: inline-block; background: rgba(255, 255, 255, 0.15); color: white; padding: 0.6rem 1.8rem; border-radius: 50px; font-size: 0.9rem; font-weight: 600; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.25); letter-spacing: 1px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
                    <i class="fas fa-clock" style="margin-right: 0.5rem;"></i> AVAILABLE 24/7
                </span>
            </div>
            
            <div class="hero-layout" style="display: grid; grid-template-columns: 1fr 400px; gap: 4rem; align-items: center; min-height: 70vh;">
                <!-- Left Side - Main Content -->
                <div class="hero-main">
                    <h1 class="hero-title" style="font-size: 3.5rem; font-weight: 700; color: white; margin-bottom: 1rem; line-height: 1.1;">
                        ${data.heroService}<br>
                        <span style="color: rgba(255, 255, 255, 0.8);">in ${data.heroLocation}</span>
                    </h1>
                    
                    <h2 style="font-size: 1.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem;">
                        ${data.businessName}
                    </h2>
                    
                    <p style="font-size: 1.2rem; color: rgba(255, 255, 255, 0.85); margin-bottom: 3rem; line-height: 1.6;">
                        ${parseMarkdownText(data.heroDescription)}
                    </p>
                    
                    <!-- CTA Buttons -->
                    ${generateCtaButtons(data, template)}
                    
                    <!-- Trust Indicators -->
                    <div style="display: flex; align-items: center; gap: 2rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; flex-wrap: wrap;">
                        <span><i class="fas fa-shield-alt"></i> Trusted & Verified</span>
                        <span><i class="fas fa-medal"></i> ${data.yearsInBusiness}+ Years</span>
                        <span><i class="fas fa-star"></i> ${consistentRating}/5 Rating</span>
                    </div>
                </div>
                
                <!-- Right Side - Stats Card -->
                <div class="hero-stats-card" style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 24px; padding: 2rem; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2);">
                    <!-- Star Rating -->
                    <div style="margin-bottom: 2rem;">
                        <div class="hero-rating-stars" style="display: flex !important; justify-content: center; gap: 0.25rem; margin-bottom: 0.5rem; flex-direction: row !important; align-items: center !important;">
                            <i class="fas fa-star" style="color: ${template.colors.accent}; font-size: 1.2rem;"></i>
                            <i class="fas fa-star" style="color: ${template.colors.accent}; font-size: 1.2rem;"></i>
                            <i class="fas fa-star" style="color: ${template.colors.accent}; font-size: 1.2rem;"></i>
                            <i class="fas fa-star" style="color: ${template.colors.accent}; font-size: 1.2rem;"></i>
                            <i class="fas fa-star" style="color: ${template.colors.accent}; font-size: 1.2rem;"></i>
                        </div>
                        <p style="color: white; font-weight: 500; margin: 0;">${consistentRating}/5 from ${consistentReviewCount}+ customers</p>
                    </div>
                    
                    <!-- Stats Grid -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                        <div>
                            <div style="font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem;">${data.yearsInBusiness}+</div>
                            <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px;">YEARS<br>EXPERIENCE</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem;">${formattedCustomerCount}</div>
                            <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px;">HAPPY<br>CUSTOMERS</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem;">24/7</div>
                            <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); text-transform: uppercase; letter-spacing: 0.5px;">EMERGENCY<br>SERVICE</div>
                        </div>
                    </div>
                    
                    <!-- Get Free Estimate Box -->
                    <div style="background: rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">
                        <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 600;">Get Free Estimate</h3>
                        <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; font-size: 0.9rem;">Professional service with transparent pricing</p>
                        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: block; background: white; color: ${template.colors.primary}; padding: 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
                            <i class="fas fa-phone"></i> ${data.phone}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    
    <!-- Features Section -->
    <section class="features" id="services">
        <div class="container">
            <h2 class="section-title">Why Choose ${data.businessName}?</h2>
            <div class="features-grid" style="display: grid; grid-template-columns: ${getFeaturesGridColumns()}; gap: ${WEBSITE_LAYOUT_CONFIG.featuresGap}; margin-top: 3rem;">
                ${features.slice(0, 4).map((feature, index) => `
                <div class="feature-card" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); padding: 2.5rem 2rem; border-radius: 20px; text-align: center; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255, 255, 255, 0.5); position: relative; overflow: hidden; height: 100%;">
                    <div class="feature-icon" style="width: 70px; height: 70px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; box-shadow: 0 8px 25px ${template.colors.primary}40; transition: all 0.4s ease;">
                        <i class="${defaultIcons[index % defaultIcons.length]}"></i>
                    </div>
                    <h3 class="feature-title" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: #1a202c; line-height: 1.3;">${feature}</h3>
                    <p class="feature-description" style="color: #4a5568; line-height: 1.6; font-size: 1rem;">${featureDescriptions[index] || 'Quality service you can trust with professional results every time.'}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Professional Service Excellence Section -->
    <section class="excellence" style="background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #eef2ff 100%); padding: 5rem 0; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, ${template.colors.primary}10 0%, transparent 70%); border-radius: 50%;"></div>
        <div class="container">
            <div class="section-header" style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1rem;">Our Service Excellence</h2>
                <p style="color: #6b7280; font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                    Discover what makes our ${data.category.toLowerCase()} services exceptional and trusted by customers
                </p>
            </div>
            <div class="excellence-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div class="excellence-item" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 24px; padding: 2.5rem 2rem; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-align: center; border: 1px solid rgba(255, 255, 255, 0.5);" 
                     onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 48px rgba(0, 0, 0, 0.12)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 24px rgba(0, 0, 0, 0.06)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 22px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px ${template.colors.primary}40;">
                        <i class="fas fa-users" style="font-size: 2rem; color: white;"></i>
                    </div>
                    <h3 style="font-weight: 600; margin-bottom: 1rem; color: #1a202c;">Professional Team</h3>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0;">Expert ${data.category.toLowerCase()} professionals with years of experience and proven expertise</p>
                </div>
                <div class="excellence-item" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 24px; padding: 2.5rem 2rem; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-align: center; border: 1px solid rgba(255, 255, 255, 0.5);" 
                     onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 48px rgba(0, 0, 0, 0.12)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 24px rgba(0, 0, 0, 0.06)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 22px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px ${template.colors.primary}40;">
                        <i class="fas fa-tools" style="font-size: 2rem; color: white;"></i>
                    </div>
                    <h3 style="font-weight: 600; margin-bottom: 1rem; color: #1a202c;">Modern Equipment</h3>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0;">State-of-the-art tools and equipment for efficient, professional ${data.category.toLowerCase()} services</p>
                </div>
                <div class="excellence-item" style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 24px; padding: 2.5rem 2rem; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06); transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-align: center; border: 1px solid rgba(255, 255, 255, 0.5);" 
                     onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 48px rgba(0, 0, 0, 0.12)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 24px rgba(0, 0, 0, 0.06)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 22px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px ${template.colors.primary}40;">
                        <i class="fas fa-medal" style="font-size: 2rem; color: white;"></i>
                    </div>
                    <h3 style="font-weight: 600; margin-bottom: 1rem; color: #1a202c;">Quality Commitment</h3>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0;">Unwavering commitment to quality results that exceed expectations and build lasting trust</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 3rem;">
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white; padding: 1rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
                    <i class="fas fa-phone"></i>
${data.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about" id="about" style="padding: 1rem 0; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #eef2ff 100%); position: relative; overflow: hidden;">
        <div style="position: absolute; bottom: -80px; left: -80px; width: 250px; height: 250px; background: radial-gradient(circle, ${template.colors.primary}08 0%, transparent 70%); border-radius: 50%;"></div>
        <div class="container">
            <div class="section-header" style="text-align: center; margin-bottom: 1rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1rem;">About ${data.businessName}</h2>
            </div>
            
            <div class="about-content" style="max-width: 1200px; margin: 0 auto;">
                <!-- Single column about description (fixed text split issue) -->
                <div class="about-description" style="font-size: 1.125rem; line-height: 1.8; color: #4a5568; margin-bottom: 1rem; text-align: center; max-width: 800px; margin-left: auto; margin-right: auto;">
                    ${data.aboutDescription}
                </div>
                
                <!-- Balanced layout: 3 columns with stats on right -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: center;">
                    <!-- Left side: 2x3 grid of feature cards -->
                    <div class="about-features" style="display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 1rem;">
                        <div class="feature-point" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-handshake" style="color: white; font-size: 1.1rem;"></i>
                            </div>
                            <div style="text-align: left;">
                                <h4 style="margin: 0 0 0.15rem 0; color: #1a202c; font-weight: 600; font-size: 0.95rem;">Customer-First Approach</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 0.8rem;">Your satisfaction is our priority</p>
                            </div>
                        </div>
                        
                        <div class="feature-point" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-dollar-sign" style="color: white; font-size: 1.1rem;"></i>
                            </div>
                            <div style="text-align: left;">
                                <h4 style="margin: 0 0 0.15rem 0; color: #1a202c; font-weight: 600; font-size: 0.95rem;">Transparent Pricing</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 0.8rem;">No hidden fees or surprises</p>
                            </div>
                        </div>
                        
                        <div class="feature-point" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-tools" style="color: white; font-size: 1.1rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 0.15rem 0; color: #1a202c; font-weight: 600; font-size: 0.95rem;">Quality Workmanship</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 0.8rem;">Professional standards</p>
                            </div>
                        </div>
                        
                        
                        <div class="feature-point" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                            <div style="width: 45px; height: 45px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-award" style="color: white; font-size: 1.1rem;"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 0.15rem 0; color: #1a202c; font-weight: 600; font-size: 0.95rem;">Guaranteed Satisfaction</h4>
                                <p style="margin: 0; color: #6b7280; font-size: 0.8rem;">Quality guarantee</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right side: Expanded stats box -->
                    <div class="about-stats" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); text-align: center; color: white; height: 100%; width: 100%; max-width: 280px; display: flex; flex-direction: column; justify-content: center; align-self: start; margin-top: -2px;">
                        <h3 style="color: white; margin-bottom: 24px; font-size: 20px; font-weight: 700;">Why Choose Us?</h3>
                        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 16px;">
                            <div class="stat-item" style="text-align: center;">
                                <span class="stat-number" style="display: block; font-size: 28px; font-weight: 700; color: white; margin-bottom: 4px;">${data.yearsInBusiness}+</span>
                                <span class="stat-label" style="color: rgba(255,255,255,0.9); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Years</span>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <span class="stat-number" style="display: block; font-size: 28px; font-weight: 700; color: white; margin-bottom: 4px;">${formattedCustomerCount}</span>
                                <span class="stat-label" style="color: rgba(255,255,255,0.9); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Customers</span>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <span class="stat-number" style="display: block; font-size: 28px; font-weight: 700; color: white; margin-bottom: 4px;">${consistentRating}</span>
                                <span class="stat-label" style="color: rgba(255,255,255,0.9); font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Rating</span>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SEO Content Sections -->
    <section class="seo-sections">
        <div class="container">
            <div class="seo-grid">
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading1}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent1)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading2}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent2)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading3}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent3)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading4}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent4)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading5}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent5)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading6}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent6)}</p>
                </div>
            </div>
            <div class="section-cta">
                <p>Ready to get started?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
                    <i class="fas fa-phone"></i>
                    ${data.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- Service Areas Section Removed - Duplicate with Service Locations -->
    


    <!-- Our Locations & Services Section -->
    ${generateLocationServiceSections(data, template)}

    <!-- Final CTA Section -->
    <section class="final-cta" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); padding: 6rem 0; position: relative; overflow: hidden;">
        <div class="container">
            <div class="cta-content" style="text-align: center; max-width: 800px; margin: 0 auto; position: relative; z-index: 2;">
                <h2 style="font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.2;">
                    Ready to Get Professional ${data.category} Service?
                </h2>
                <p style="font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 3rem; line-height: 1.6;">
                    Join hundreds of satisfied customers who trust ${data.businessName} for reliable, professional service
                </p>
                <div class="cta-buttons" style="margin-bottom: 2rem;">
                    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button" style="display: inline-flex; align-items: center; gap: 0.75rem; background: white; color: ${template.colors.primary}; padding: 1.25rem 2.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1.2rem; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(0,0,0,0.2); white-space: nowrap;">
                        <i class="fas fa-phone"></i>
                        ${data.phone}
                    </a>
                </div>
                <div class="cta-trust" style="color: rgba(255, 255, 255, 0.8); font-size: 1rem; font-weight: 500; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                    <span><i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #10b981;"></i>Free Estimates</span>
                    <span><i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #10b981;"></i>Trusted & Verified</span>
                    <span><i class="fas fa-check-circle" style="margin-right: 0.5rem; color: #10b981;"></i>${data.yearsInBusiness}+ Years Experience</span>
                </div>
            </div>
        </div>
        <div style="position: absolute; top: -50%; right: -20%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%); border-radius: 50%; z-index: 1; animation: float 10s ease-in-out infinite;"></div>
        <div style="position: absolute; bottom: -30%; left: -10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%); border-radius: 50%; z-index: 1; animation: float 12s ease-in-out infinite reverse;"></div>
    </section>
    
    <!-- SEO Internal Links Section -->
    <section class="internal-links" style="padding: 4rem 0; background: #f8fafc; border-top: 1px solid #e2e8f0;">
        <div class="container">
            <div class="internal-links-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                ${data.additionalServices && data.additionalServices.trim() ? `
                <div class="links-column">
                    <h3 style="color: ${template.colors.primary}; font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid ${template.colors.primary};">Professional Services</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.additionalServices.split(',').map(service => service.trim()).filter(s => s).map(service => `
                        <li style="margin-bottom: 0.75rem;">
                            <a href="${generateServiceUrl(service, data.heroLocation)}" 
                               style="color: #4a5568; text-decoration: none; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" 
                               onmouseover="this.style.color='${template.colors.primary}'" 
                               onmouseout="this.style.color='#4a5568'">
                                <i class="fas fa-cogs" style="color: ${template.colors.accent}; font-size: 0.9rem;"></i>
                                ${service} in ${data.heroLocation}
                            </a>
                        </li>`).join('')}
                    </ul>
                </div>` : ''}
                
                ${data.additionalLocations && data.additionalLocations.trim() ? `
                <div class="links-column">
                    <h3 style="color: ${template.colors.primary}; font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid ${template.colors.primary};">Service Areas</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.additionalLocations.split(',').map(location => location.trim()).filter(l => l).map(location => `
                        <li style="margin-bottom: 0.75rem;">
                            <a href="${generateLocationUrl(location, data.category)}" 
                               style="color: #4a5568; text-decoration: none; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" 
                               onmouseover="this.style.color='${template.colors.primary}'" 
                               onmouseout="this.style.color='#4a5568'">
                                <i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; font-size: 0.9rem;"></i>
                                ${data.category} Services in ${location}
                            </a>
                        </li>`).join('')}
                    </ul>
                </div>` : ''}
                
                <div class="links-column">
                    <h3 style="color: ${template.colors.primary}; font-size: 1.4rem; font-weight: 600; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid ${template.colors.primary};">Quick Links</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 0.75rem;">
                            <a href="blog.html" 
                               style="color: #4a5568; text-decoration: none; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" 
                               onmouseover="this.style.color='${template.colors.primary}'" 
                               onmouseout="this.style.color='#4a5568'">
                                <i class="fas fa-blog" style="color: ${template.colors.accent}; font-size: 0.9rem;"></i>
                                ${data.category} Tips & Insights
                            </a>
                        </li>
                        <li style="margin-bottom: 0.75rem;">
                            <a href="#about" 
                               style="color: #4a5568; text-decoration: none; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" 
                               onmouseover="this.style.color='${template.colors.primary}'" 
                               onmouseout="this.style.color='#4a5568'">
                                <i class="fas fa-info-circle" style="color: ${template.colors.accent}; font-size: 0.9rem;"></i>
                                About ${data.businessName}
                            </a>
                        </li>
                        <li style="margin-bottom: 0.75rem;">
                            <a href="#contact" 
                               style="color: #4a5568; text-decoration: none; font-weight: 500; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" 
                               onmouseover="this.style.color='${template.colors.primary}'" 
                               onmouseout="this.style.color='#4a5568'">
                                <i class="fas fa-phone" style="color: ${template.colors.accent}; font-size: 0.9rem;"></i>
                                Get Free Estimate
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Contact Section -->
    <section class="contact" id="contact" style="padding: 5rem 0; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});">
        <div class="container">
            <div class="section-header" style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 1rem;">Contact ${data.businessName}</h2>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                    Get your ${data.category.toLowerCase()} needs handled by professionals. We're here to help 24/7.
                </p>
            </div>
            
            <div class="contact-cards" style="display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto;">
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-phone" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Call Us</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Speak directly with our professional team for immediate assistance</p>
                    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 1.5rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; word-break: break-all; font-size: 0.9rem;">
                        ${data.phone}
                    </a>
                </div>
                
                ${data.email ? `
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-envelope" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Email Us</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Send us your questions and we'll respond promptly</p>
                    <a href="mailto:${data.email}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
                        ${data.email}
                    </a>
                </div>
                ` : ''}
                
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-map-marker-alt" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Visit Us</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Come to our location for in-person consultations</p>
                    <div style="background: ${template.colors.primary}; padding: 1rem 2rem; border-radius: 10px; color: white; font-weight: 600;">
                        ${data.address || data.heroLocation}
                    </div>
                </div>
                

            </div>
        </div>
    </section>

    <!-- Location Map Section -->
    <section class="location-map">
        <div class="container">
            <h2 class="section-title">Find Us</h2>
            <div class="map-container">
                <iframe 
                    src="https://maps.google.com/maps?q=${encodeURIComponent(data.address + ', Pakistan')}&output=embed&z=15"
                    width="100%" 
                    height="400" 
                    style="border:0; border-radius: 10px;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Location of ${data.businessName}"
                    onerror="this.style.display='none'; document.getElementById('map-fallback').style.display='block';">
                </iframe>
                <div id="map-fallback" style="display: none; padding: 40px; text-align: center; background: #f5f5f5; border-radius: 10px;">
                    <i class="fas fa-map-marker-alt" style="font-size: 48px; color: #666; margin-bottom: 16px;"></i>
                    <p style="margin-bottom: 20px; color: #666;">Unable to load interactive map</p>
                    <a href="https://maps.google.com/maps?q=${encodeURIComponent(data.address + ', Pakistan')}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="directions-btn">
                        <i class="fas fa-directions"></i>
                        Open in Google Maps
                    </a>
                </div>
            </div>
            <div class="map-info">
                <div class="map-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>${data.address}</p>
                </div>
                <a href="https://maps.google.com/maps?q=${encodeURIComponent(data.address + ', Pakistan')}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="directions-btn">
                    <i class="fas fa-directions"></i>
                    Get Directions
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
        <div class="container">
            <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                <div class="footer-main">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
                        </div>
                        <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${data.businessName}</h3>
                    </div>
                    <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${data.footerDescription || `Professional ${data.category.toLowerCase()} services in ${data.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
                    <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
                        <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="color: white; text-decoration: none;">${data.phone}</a></span></p>
                        ${data.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${data.email}" style="color: white; text-decoration: none;">${data.email}</a></span></p>` : ''}
                        <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${data.address}</span></p>
                        <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${data.businessHours}</span></p>
                    </div>
                </div>
                
                <div class="footer-services">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
                        <li style="margin-bottom: 0.75rem;"><a href="#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${data.heroService}</a></li>
                        ${data.additionalServices ? data.additionalServices.split(',').slice(0, 5).map(service => `
                        <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), data.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
                        `).join('') : ''}
                        <li style="margin-bottom: 0.75rem;"><a href="#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Free Estimates</a></li>
                        <li style="margin-bottom: 0.75rem;"><a href="#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>Emergency Service</a></li>
                    </ul>
                </div>
                
                <div class="footer-areas">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
                    <div style="color: #cbd5e1; line-height: 1.8;">
                        ${data.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaLink = data.additionalLocations && data.additionalLocations.split(',').map(loc => loc.trim()).includes(area.trim())
      ? generateLocationUrl(area.trim(), data.category)
      : '#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${area.trim()}</a></div>`;
  }).join('')}
                        ${data.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
                    </div>
                </div>
                
                <div class="footer-info">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: inline-block; text-align: left;">Why Choose Us</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 0.75rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.95rem; text-align: left;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0;"></i><span>${fact.trim()}</span></li>`).join('')}
                    </ul>
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
                            <i class="fas fa-phone"></i>
                            Call Now
                        </a>
                    </div>
                </div>
                
                <div class="footer-social">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
                    <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
                        ${data.facebookUrl ? `<a href="${data.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>` : ''}
                        ${data.twitterUrl ? `<a href="${data.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>` : ''}
                        ${data.linkedinUrl ? `<a href="${data.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>` : ''}
                        ${data.pinterestUrl ? `<a href="${data.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>` : ''}
                    </div>
                </div>
            </div>
            <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
                <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${data.businessName}. All rights reserved. | Trusted Professional ${data.category} Services</p>
                ${data.leadGenDisclaimer && data.leadGenDisclaimer.trim() ? `
                <div class="disclaimer-section" style="margin-top: 1rem;">
                    <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${data.leadGenDisclaimer}</p>
                </div>
                ` : ''}
            </div>
        </div>
    </footer>

    <!-- Floating Phone Button -->
    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="floating-phone-btn" title="Call ${data.phone}" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white; padding: 16px; border-radius: 50%; text-decoration: none; box-shadow: 0 8px 25px rgba(0,0,0,0.3); transition: all 0.3s ease; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
      <i class="fas fa-phone" style="font-size: 20px;"></i>
    </a>

    <script>
    // Dropdown functionality
    document.addEventListener('DOMContentLoaded', function() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            let hideTimeout;
            
            // Show dropdown on mouseenter
            dropdown.addEventListener('mouseenter', function() {
                clearTimeout(hideTimeout);
                dropdown.classList.add('show');
                if (menu) menu.classList.add('show');
            });
            
            // Hide dropdown on mouseleave with delay
            dropdown.addEventListener('mouseleave', function() {
                hideTimeout = setTimeout(function() {
                    dropdown.classList.remove('show');
                    if (menu) menu.classList.remove('show');
                }, 150); // 150ms delay for smooth UX
            });
            
            // Keep dropdown visible when hovering over menu items
            if (menu) {
                menu.addEventListener('mouseenter', function() {
                    clearTimeout(hideTimeout);
                    dropdown.classList.add('show');
                    menu.classList.add('show');
                });
                
                menu.addEventListener('mouseleave', function() {
                    hideTimeout = setTimeout(function() {
                        dropdown.classList.remove('show');
                        menu.classList.remove('show');
                    }, 150);
                });
            }
        });
    });
    </script>
    <script src="script.js"></script>
</body>
</html>`;
}

function generateLocationServiceSections(data: BusinessData, template: Template): string {
  const additionalLocations = parseDynamicPageValues(
    data.additionalLocations,
    data.serviceAreas,
    data.heroLocation
  );
  const additionalServices = parseDynamicPageValues(
    data.additionalServices,
    data.services,
    data.heroService
  );

  if (additionalLocations.length === 0 && additionalServices.length === 0) {
    return '';
  }

  return `
    <!-- Locations & Services Section -->
    <section class="locations-services" style="background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%); padding: 4rem 0;">
        <div class="container">
            ${additionalLocations.length > 0 ? `
            <!-- Our Locations Section -->
            <div class="locations-section" style="margin-bottom: 4rem;">
                <div class="section-header" style="text-align: center; margin-bottom: 3rem;">
                    <h2 class="section-title" style="background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1rem;">Our Service Locations</h2>
                    <p style="color: #6b7280; font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                        We proudly serve multiple locations across the area with the same quality service and dedication.
                    </p>
                </div>
                
                <div class="locations-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    ${additionalLocations.map(location => {
    const filename = generateLocationUrl(location, data.category);

    return `
                    <a href="${filename}" class="location-card" style="background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px ${template.colors.primary}26; text-align: left; transition: all 0.3s ease; text-decoration: none; display: flex; align-items: center; cursor: pointer; border: 1px solid ${template.colors.primary}1A;"
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px ${template.colors.primary}40'; this.style.borderColor='${template.colors.primary}4D'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px ${template.colors.primary}26'; this.style.borderColor='${template.colors.primary}1A'">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                            <i class="fas fa-map-marker-alt" style="color: white; font-size: 1rem;"></i>
                        </div>
                        <h3 style="color: #1e293b; margin: 0; font-size: 1rem; font-weight: 600; transition: color 0.3s ease; line-height: 1.4;" 
                            onmouseover="this.style.color='${template.colors.primary}'" 
                            onmouseout="this.style.color='#1e293b'">${data.category} Service in ${location}</h3>
                    </a>
                      `;
  }).join('')}
                </div>
            </div>
            ` : ''}
            
            ${additionalServices.length > 0 ? `
            <!-- Our Services Section -->
            <div class="services-section">
                <div class="section-header" style="text-align: center; margin-bottom: 3rem;">
                    <h2 class="section-title" style="background: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 1rem;">Our Services</h2>
                    <p style="color: #6b7280; font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                        Comprehensive service offerings designed to meet all your needs with professional excellence.
                    </p>
                </div>
                
                <div class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${additionalServices.map(service => {
    const filename = generateServiceUrl(service, data.heroLocation);
    const mainCity = data.address.split(',')[1]?.trim() || data.address.split(',')[0]?.trim();

    return `
                    <a href="${filename}" class="service-card" style="background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px ${template.colors.secondary}26; text-align: left; transition: all 0.3s ease; text-decoration: none; display: flex; align-items: center; cursor: pointer; border: 1px solid ${template.colors.secondary}1A;"
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px ${template.colors.secondary}40'; this.style.borderColor='${template.colors.secondary}4D'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px ${template.colors.secondary}26'; this.style.borderColor='${template.colors.secondary}1A'">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary}); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                            <i class="fas fa-wrench" style="color: white; font-size: 1rem;"></i>
                        </div>
                        <h3 style="color: #1e293b; margin: 0; font-size: 1rem; font-weight: 600; transition: color 0.3s ease; line-height: 1.4;" 
                            onmouseover="this.style.color='${template.colors.secondary}'" 
                            onmouseout="this.style.color='#1e293b'">${service} in ${mainCity}</h3>
                    </a>
                      `;
  }).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    </section>`;
}

function generateLocationHTML(data: BusinessData, template: Template, locationName: string, domain?: string, aiContent?: any, siteSettings?: SiteSetting[]): string {
  const features = data.featureHeadlines.split(',').map(h => h.trim());
  const featureDescriptions = data.featureDescriptions.split(',').map(d => d.trim());

  // Generate consistent values once to use throughout the location page
  const consistentRating = generateDeterministicRating(data.businessName);
  const consistentReviewCount = generateDeterministicReviewCount(data.businessName);
  const consistentCustomerCount = generateDeterministicCustomerCount(data.businessName);
  const formattedCustomerCount = formatCustomerCount(consistentCustomerCount);

  // Generate location-specific content - use AI content if available, fallback to template
  const locationContent = aiContent || generateLocationSpecificContent(data, locationName);

  // Location-specific SEO optimization
  const locationTitle = aiContent?.metaTitle || `${data.heroService} in ${locationName} | Local ${data.category} | ${data.businessName}`;
  const locationDescription = aiContent?.metaDescription || generateOptimizedMetaDescription(data, 'location', locationName);
  const locationImage =
    data.aboutImage2 ||
    data.aboutImage ||
    getCategoryImage(data.category, 'results');
  const locationImageAlt =
    data.aboutImage2Alt ||
    data.aboutImageAlt ||
    generateOptimizedImageAlt(data, 'location', locationName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
    <title>${seoTitle(locationTitle)}</title>
    <meta name="description" content="${seoDescription(locationDescription)}">
    ${data.logo ? `<link rel="icon" type="image/png" href="${data.logo}">` : ''}
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    ${generateSEOMetaTags(data, locationTitle, locationDescription, 'location', domain, generateLocationUrl(locationName, data.category))}
    
    <!-- Schema Markup for Location Page -->
    ${generateLocalBusinessSchema(data, locationTitle, locationDescription, domain, consistentRating, consistentReviewCount)}
    ${generateServiceSchema(data)}
    ${generateBreadcrumbSchema(data, locationName, domain, generateLocationUrl(locationName, data.category))}
    ${generateWebPageSchema(data, locationTitle, locationDescription, domain, generateLocationUrl(locationName, data.category))}${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
    ${generateNavigation(data)}
    ${generateBreadcrumbNavigation(data, 'location', locationName)}

    <!-- Hero Section -->
    <section class="hero" style="background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary}DD 100%); background-size: 200% 200%; position: relative; overflow: hidden; padding: 5rem 1rem; text-align: center; min-height: 80vh; display: flex; align-items: center;">
        <div class="hero-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.06); z-index: 1;"></div>
        
        <!-- Floating orbs -->
        <div style="position: absolute; top: 15%; right: 10%; width: 200px; height: 200px; background: radial-gradient(circle, ${template.colors.accent}20 0%, transparent 70%); border-radius: 50%; z-index: 1; animation: float 9s ease-in-out infinite;"></div>
        
        <!-- Hero Background Pattern -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.06; z-index: 1;">
            <div style="background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.15%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E'); background-size: 60px 60px; width: 100%; height: 100%;"></div>
        </div>
        
        <div class="container" style="position: relative; z-index: 2; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
            <div class="hero-content" style="max-width: 800px; margin: 0 auto;">
                <div class="hero-badge" style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.25); padding: 0.75rem 1.5rem; border-radius: 50px; margin-bottom: 2rem; color: white; font-size: 0.875rem; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);">
                    <i class="fas fa-star" style="color: #fbbf24;"></i>
                    <span>${data.yearsInBusiness}+ Years Experience</span>
                </div>
                
                <h1 class="hero-title" style="font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.1; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); text-align: center;">
                    <span class="hero-service" style="display: block;">${data.heroService}</span>
                    <span class="hero-location" style="display: block; background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">in ${locationName}</span>
                </h1>
                
                <p class="hero-description" style="font-size: clamp(1.125rem, 2.5vw, 1.375rem); color: rgba(255, 255, 255, 0.95); margin-bottom: 3rem; max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.6; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); text-align: center;">${locationContent.heroDescription}</p>
                
                <div class="hero-features" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 3rem; max-width: 900px; margin-left: auto; margin-right: auto;">
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 16px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center;">
                        <i class="fas fa-shield-alt" style="color: #10b981; font-size: 1.2rem;"></i>
                        <span>Trusted & Verified</span>
                    </div>
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 12px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center;">
                        <i class="fas fa-clock" style="color: #f59e0b; font-size: 1.2rem;"></i>
                        <span>24/7 Emergency Service</span>
                    </div>
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 12px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center;">
                        <i class="fas fa-thumbs-up" style="color: #3b82f6; font-size: 1.2rem;"></i>
                        <span>Professional Service Commitment</span>
                    </div>
                </div>
                
                <div class="hero-cta" style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; align-items: center;">
                    ${generateCtaButtons(data, template)}
                </div>
            </div>
        </div>
    </section>

    <!-- Location Photo Section -->
    <section style="padding: 3rem 1rem; background: #ffffff;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);">
                <img src="${locationImage}" alt="${locationImageAlt}" loading="lazy" style="width: 100%; height: min(48vw, 360px); object-fit: cover; display: block;">
                <div style="padding: 1.25rem 1.5rem; color: #374151; font-size: 0.95rem; line-height: 1.6;">
                    Serving <strong>${locationName}</strong> with professional ${data.heroService.toLowerCase()} solutions tailored to local needs.
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="services">
        <div class="container">
            <h2 class="section-title">Why Choose Us in ${locationName}?</h2>
            <div class="features-grid" style="display: grid; grid-template-columns: ${getFeaturesGridColumns()}; gap: ${WEBSITE_LAYOUT_CONFIG.featuresGap}; margin-top: 3rem;">
                ${features.slice(0, 4).map((feature, index) => `
                <div class="feature-card" style="background: white; padding: 2.5rem 2rem; border-radius: 15px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); transition: all 0.3s ease; border: 1px solid #e5e7eb; position: relative; overflow: hidden; height: 100%;">
                    <div class="feature-icon" style="width: 70px; height: 70px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; box-shadow: 0 8px 20px ${template.colors.primary}4D;">
                        <i class="${defaultIcons[index % defaultIcons.length]}"></i>
                    </div>
                    <h3 class="feature-title" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: #1a202c; line-height: 1.3;">${feature}</h3>
                    <p class="feature-description" style="color: #4a5568; line-height: 1.6; font-size: 1rem;">${featureDescriptions[index] || 'Quality service you can trust with professional results every time.'}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>


    <!-- Location-Specific Content Sections -->
    <section class="location-content" style="padding: 4rem 0; background: #f8fafc;">
        <div class="container">
            <div class="content-grid" style="display: grid; grid-template-columns: 1fr; gap: 3rem; margin-bottom: 4rem;">
                <div class="content-section" style="background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);">
                    <h2 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; margin-bottom: 1.5rem; color: #1a202c; text-align: center;">Service Areas in ${locationName}</h2>
                    <p style="font-size: 1.125rem; line-height: 1.7; color: #4a5568; margin-bottom: 2rem; text-align: center; max-width: 500px; margin-left: auto; margin-right: auto;">${locationContent.serviceAreasContent}</p>
                    <div class="benefits-list">
                        ${locationContent.localBenefits.map((benefit: string) => `
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                                <div style="width: 8px; height: 8px; background: ${template.colors.primary}; border-radius: 50%; flex-shrink: 0;"></div>
                                <span style="color: #374151; line-height: 1.5;">${benefit}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="content-section" style="background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);">
                    <h2 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; margin-bottom: 1.5rem; color: #1a202c; text-align: center;">Emergency Services in ${locationName}</h2>
                    <p style="font-size: 1.125rem; line-height: 1.7; color: #4a5568; margin-bottom: 2rem; text-align: center; max-width: 500px; margin-left: auto; margin-right: auto;">${locationContent.emergencyContent}</p>
                    <div class="emergency-features" style="background: linear-gradient(135deg, #fef3e7 0%, #fdf2f8 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary};">
                        <h3 style="font-size: 1.25rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem;">24/7 Emergency Response</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #4a5568;">
                                <i class="fas fa-clock" style="color: ${template.colors.primary}; width: 16px;"></i>
                                <span>Rapid response within 60-90 minutes</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #4a5568;">
                                <i class="fas fa-tools" style="color: ${template.colors.primary}; width: 16px;"></i>
                                <span>Fully equipped service vehicles</span>
                            </li>
                            <li style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: #4a5568;">
                                <i class="fas fa-phone" style="color: ${template.colors.primary}; width: 16px;"></i>
                                <span>Direct contact with local technicians</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="section-cta" style="text-align: center; padding: 3rem 2rem; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);">
                <h3 style="font-size: 1.75rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem;">Ready for Service in ${locationName}?</h3>
                <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem;">Contact our local ${data.category.toLowerCase()} professionals today for immediate assistance.</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call" style="display: inline-flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white; padding: 1rem 2rem; border-radius: 12px; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
                    <i class="fas fa-phone"></i>
                    Call ${data.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- SEO Content Sections -->
    <section class="seo-sections">
        <div class="container">
            <div class="seo-grid">
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading1.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent1).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading2.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent2).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading3.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent3).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading4.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent4).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading5.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent5).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
                <div class="seo-section">
                    <h3 class="seo-heading">${data.seoHeading6.replace(/in [^,]+/, `in ${locationName}`)}</h3>
                    <p class="seo-content">${parseMarkdownText(data.seoContent6).replace(/in [^.,]+/g, `in ${locationName}`)}</p>
                </div>
            </div>
            <div class="section-cta">
                <p>Ready to get started in ${locationName}?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
                    <i class="fas fa-phone"></i>
                    Call Now
                </a>
            </div>
        </div>
    </section>



    <!-- Contact Section -->
    <section class="contact" id="contact" style="padding: 5rem 0; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});">
        <div class="container">
            <div class="section-header" style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 1rem;">Contact ${data.businessName}</h2>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                    Get your ${data.heroService.toLowerCase()} needs handled by professionals in ${locationName}. We're here to help 24/7.
                </p>
            </div>
            
            <div class="contact-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto;">
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div>
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-phone" style="color: white; font-size: 2rem;"></i>
                        </div>
                        <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Call Us</h3>
                        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Speak directly with our professional team for immediate assistance</p>
                    </div>
                    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 1.5rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; word-break: break-all; font-size: 0.9rem;">
                        ${data.phone}
                    </a>
                </div>
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div>
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-envelope" style="color: white; font-size: 2rem;"></i>
                        </div>
                        <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Email Us</h3>
                        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Send us a message and we'll respond as soon as possible</p>
                    </div>
                    <a href="mailto:${data.email || 'info@example.com'}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; white-space: nowrap;">
                        ${data.email || 'info@example.com'}
                    </a>
                </div>
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; min-height: 280px; display: flex; flex-direction: column; justify-content: space-between;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div>
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-map-marker-alt" style="color: white; font-size: 2rem;"></i>
                        </div>
                        <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Service Area</h3>
                        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">We proudly serve ${locationName} and surrounding areas with professional service</p>
                    </div>
                    <div style="background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 10px; font-weight: 600; line-height: 1.4;">${locationName}</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
        <div class="container">
            <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                <div class="footer-main">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
                        </div>
                        <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${data.businessName}</h3>
                    </div>
                    <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${data.footerDescription || `Professional ${data.category.toLowerCase()} services in ${locationName}. Trusted, verified, and committed to excellence.`}</p>
                    <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
                        <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="color: white; text-decoration: none;">${data.phone}</a></span></p>
                        ${data.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${data.email}" style="color: white; text-decoration: none;">${data.email}</a></span></p>` : ''}
                        <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${data.address}</span></p>
                        <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${data.businessHours}</span></p>
                    </div>
                </div>
                
                <div class="footer-services">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${data.heroService}</a></li>
                        ${data.additionalServices ? data.additionalServices.split(',').slice(0, 5).map(service => `
                        <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), data.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
                        `).join('') : ''}
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(data.category).consultationTerm}</a></li>
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(data.category).urgentTerm.charAt(0).toUpperCase() + getCategorySpecificTerms(data.category).urgentTerm.slice(1)}</a></li>
                    </ul>
                </div>
                
                <div class="footer-areas">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
                    <div style="color: #cbd5e1; line-height: 1.8;">
                        <div style="margin-bottom: 0.75rem;"><a href="#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${locationName}</a></div>
                        ${data.serviceAreas.split(',').slice(0, 5).map(area => {
    const areaName = area.trim();
    if (areaName === locationName) return '';
    const areaLink = data.additionalLocations && data.additionalLocations.split(',').map(loc => loc.trim()).includes(areaName)
      ? generateLocationUrl(areaName, data.category)
      : 'index.html#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${areaName}</a></div>`;
  }).join('')}
                        ${data.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="index.html#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
                    </div>
                </div>
                
                <div class="footer-info">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: inline-block; text-align: left;">Why Choose Us</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 0.75rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.95rem; text-align: left;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0;"></i><span>${fact.trim()}</span></li>`).join('')}
                    </ul>
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
                            <i class="fas fa-phone"></i>
                            Call Now
                        </a>
                    </div>
                </div>
                
                <div class="footer-social">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Follow Us</h4>
                    <div class="social-icons" style="display: flex; flex-direction: column; gap: 1rem;">
                        <a href="${data.facebookUrl || 'https://facebook.com/yourbusiness'}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-facebook-f"></i></a>
                        <a href="${data.twitterUrl || 'https://twitter.com/yourbusiness'}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-twitter"></i></a>
                        <a href="${data.linkedinUrl || 'https://linkedin.com/company/yourbusiness'}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-linkedin-in"></i></a>
                        <a href="${data.pinterestUrl || 'https://pinterest.com/yourbusiness'}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest" style="width: 45px; height: 45px; background: ${template.colors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.3s ease; font-size: 1.2rem;" onmouseover="this.style.background='${template.colors.secondary}'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.background='${template.colors.primary}'; this.style.transform='translateY(0)'; this.style.boxShadow='none';"><i class="fab fa-pinterest-p"></i></a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
                <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${data.businessName}. All rights reserved. | Trusted Professional ${data.category} Services in ${locationName}</p>
                ${data.leadGenDisclaimer && data.leadGenDisclaimer.trim() ? `
                <div class="disclaimer-section" style="margin-top: 1rem;">
                    <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${data.leadGenDisclaimer}</p>
                </div>
                ` : ''}
            </div>
        </div>
    </footer>

    <script>
    // Dropdown functionality
    document.addEventListener('DOMContentLoaded', function() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            let hideTimeout;
            
            // Show dropdown on mouseenter
            dropdown.addEventListener('mouseenter', function() {
                clearTimeout(hideTimeout);
                dropdown.classList.add('show');
                if (menu) menu.classList.add('show');
            });
            
            // Hide dropdown on mouseleave with delay
            dropdown.addEventListener('mouseleave', function() {
                hideTimeout = setTimeout(function() {
                    dropdown.classList.remove('show');
                    if (menu) menu.classList.remove('show');
                }, 150); // 150ms delay for smooth UX
            });
            
            // Keep dropdown visible when hovering over menu items
            if (menu) {
                menu.addEventListener('mouseenter', function() {
                    clearTimeout(hideTimeout);
                    dropdown.classList.add('show');
                    menu.classList.add('show');
                });
                
                menu.addEventListener('mouseleave', function() {
                    hideTimeout = setTimeout(function() {
                        dropdown.classList.remove('show');
                        menu.classList.remove('show');
                    }, 150);
                });
            }
        });
    });
    </script>${injectTrackingCodes(siteSettings, 'body_end')}
    <script src="script.js"></script>
</body>
</html>`;
}

function generateServiceHTML(data: BusinessData, template: Template, serviceName: string, domain?: string, aiContent?: any, siteSettings?: SiteSetting[]): string {
  const features = data.featureHeadlines.split(',').map(h => h.trim());
  const featureDescriptions = data.featureDescriptions.split(',').map(d => d.trim());

  // Generate consistent values once to use throughout the service page
  const consistentRating = generateDeterministicRating(data.businessName);
  const consistentReviewCount = generateDeterministicReviewCount(data.businessName);
  const consistentCustomerCount = generateDeterministicCustomerCount(data.businessName);
  const formattedCustomerCount = formatCustomerCount(consistentCustomerCount);

  // Generate service-specific content - use AI content if available, fallback to template
  const serviceContent = aiContent || generateServiceSpecificContent(data, serviceName);

  // Service-specific SEO optimization  
  const serviceTitle = aiContent?.metaTitle || `${serviceName} Services in ${data.heroLocation} | Professional ${serviceName} | ${data.businessName}`;
  const serviceDescription = aiContent?.metaDescription || generateOptimizedMetaDescription(data, 'service', serviceName);
  const serviceImage =
    data.aboutImage ||
    data.aboutImage2 ||
    getCategoryImage(data.category, 'equipment');
  const serviceImageAlt =
    data.aboutImageAlt ||
    data.aboutImage2Alt ||
    generateOptimizedImageAlt(data, 'service', serviceName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">
    <title>${seoTitle(serviceTitle)}</title>
    <meta name="description" content="${seoDescription(serviceDescription)}">
    ${data.logo ? `<link rel="icon" type="image/png" href="${data.logo}">` : ''}
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    ${generateSEOMetaTags(data, serviceTitle, serviceDescription, 'service', domain, generateServiceUrl(serviceName, data.heroLocation))}
    
    <!-- Schema Markup for Service Page -->
    ${generateLocalBusinessSchema(data, serviceTitle, serviceDescription, domain, consistentRating, consistentReviewCount)}
    ${generateServiceSchema(data, serviceName)}
    ${generateBreadcrumbSchema(data, serviceName, domain, generateServiceUrl(serviceName, data.heroLocation))}
    ${generateWebPageSchema(data, serviceTitle, serviceDescription, domain, generateServiceUrl(serviceName, data.heroLocation))}${injectTrackingCodes(siteSettings, 'head')}
</head>
<body>${injectTrackingCodes(siteSettings, 'body_start')}
    ${generateNavigation(data)}
    ${generateBreadcrumbNavigation(data, 'service', serviceName)}

    <!-- Hero Section -->
    <section class="hero" style="background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%); position: relative; overflow: hidden; padding: 5rem 1rem; text-align: center; min-height: 80vh; display: flex; align-items: center;">
        <div class="hero-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.1); z-index: 1;"></div>
        
        <!-- Animated Floating Gradient Orbs -->
        <div style="position: absolute; top: -80px; right: -80px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%); border-radius: 50%; animation: float 6s ease-in-out infinite; z-index: 1;"></div>
        <div style="position: absolute; bottom: -60px; left: -60px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%); border-radius: 50%; animation: float 8s ease-in-out infinite reverse; z-index: 1;"></div>
        <div style="position: absolute; top: 40%; left: 10%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%); border-radius: 50%; animation: float 7s ease-in-out infinite 2s; z-index: 1;"></div>
        <div style="position: absolute; top: 20%; right: 20%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%; animation: float 9s ease-in-out infinite 1s; z-index: 1;"></div>
        
        <!-- Hero Background Pattern -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.06; z-index: 1; background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E'); background-size: 60px 60px;"></div>
        
        <div class="container" style="position: relative; z-index: 2; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem;">
            <div class="hero-content" style="max-width: 800px; margin: 0 auto;">
                <div class="hero-badge" style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.25); padding: 0.75rem 1.5rem; border-radius: 50px; margin-bottom: 2rem; color: white; font-size: 0.875rem; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); animation: fadeInDown 0.6s ease-out;">
                    <i class="fas fa-star" style="color: #fbbf24;"></i>
                    <span>${data.yearsInBusiness}+ Years Experience</span>
                </div>
                
                <h1 class="hero-title" style="font-size: clamp(2.5rem, 6vw, 4.5rem); font-weight: 700; color: white; margin-bottom: 1.5rem; line-height: 1.1; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); text-align: center; animation: fadeInUp 0.8s ease-out;">
                    <span class="hero-service" style="display: block;">${serviceName} Services</span>
                    <span class="hero-location" style="display: block; background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">in ${data.heroLocation}</span>
                </h1>
                
                <p class="hero-description" style="font-size: clamp(1.125rem, 2.5vw, 1.375rem); color: rgba(255, 255, 255, 0.95); margin-bottom: 3rem; max-width: 700px; margin-left: auto; margin-right: auto; line-height: 1.6; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); text-align: center; animation: fadeInUp 1s ease-out;">${serviceContent.serviceDescription}</p>
                
                <div class="hero-features" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 3rem; max-width: 900px; margin-left: auto; margin-right: auto;">
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 14px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center; transition: all 0.3s ease; animation: fadeInUp 1.1s ease-out;" onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)';" onmouseout="this.style.background='rgba(255,255,255,0.12)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-shield-alt" style="color: #10b981; font-size: 1.2rem;"></i>
                        <span>Trusted & Verified</span>
                    </div>
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 14px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center; transition: all 0.3s ease; animation: fadeInUp 1.2s ease-out;" onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)';" onmouseout="this.style.background='rgba(255,255,255,0.12)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-clock" style="color: #f59e0b; font-size: 1.2rem;"></i>
                        <span>24/7 Emergency Service</span>
                    </div>
                    <div class="hero-feature" style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: 14px; color: white; font-size: 0.9rem; font-weight: 500; text-align: center; transition: all 0.3s ease; animation: fadeInUp 1.3s ease-out;" onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)';" onmouseout="this.style.background='rgba(255,255,255,0.12)'; this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <i class="fas fa-thumbs-up" style="color: #3b82f6; font-size: 1.2rem;"></i>
                        <span>Professional Service Commitment</span>
                    </div>
                </div>
                
                <div class="hero-cta" style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; align-items: center; animation: fadeInUp 1.4s ease-out;">
                    ${generateCtaButtons(data, template)}
                </div>
            </div>
        </div>
    </section>

    <!-- Service Photo Section -->
    <section style="padding: 3rem 1rem; background: #ffffff;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 28px rgba(0, 0, 0, 0.08);">
                <img src="${serviceImage}" alt="${serviceImageAlt}" loading="lazy" style="width: 100%; height: min(48vw, 360px); object-fit: cover; display: block;">
                <div style="padding: 1.25rem 1.5rem; color: #374151; font-size: 0.95rem; line-height: 1.6;">
                    Real project context for <strong>${serviceName}</strong> services in ${data.heroLocation}.
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="services">
        <div class="container">
            <h2 class="section-title">Why Choose Our ${serviceName} Services?</h2>
            <div class="features-grid" style="display: grid; grid-template-columns: ${getFeaturesGridColumns()}; gap: ${WEBSITE_LAYOUT_CONFIG.featuresGap}; margin-top: 3rem;">
                ${features.slice(0, 4).map((feature, index) => `
                <div class="feature-card" style="background: white; padding: 2.5rem 2rem; border-radius: 15px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); transition: all 0.3s ease; border: 1px solid #e5e7eb; position: relative; overflow: hidden; height: 100%;">
                    <div class="feature-icon" style="width: 70px; height: 70px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; box-shadow: 0 8px 20px ${template.colors.primary}4D;">
                        <i class="${defaultIcons[index % defaultIcons.length]}"></i>
                    </div>
                    <h3 class="feature-title" style="font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem; color: #1a202c; line-height: 1.3;">${feature}</h3>
                    <p class="feature-description" style="color: #4a5568; line-height: 1.6; font-size: 1rem;">${featureDescriptions[index] || 'Quality service you can trust with professional results every time.'}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>


    <!-- Service-Specific Content Sections -->
    <section class="service-content" style="padding: 4rem 0; background: #f8fafc;">
        <div class="container">
            <div class="content-grid" style="display: grid; grid-template-columns: 1fr; gap: 3rem; margin-bottom: 4rem; align-items: start;">
                <div class="content-section" style="background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);">
                    <h2 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; margin-bottom: 1.5rem; color: #1a202c; text-align: center;">Common ${serviceName} Services</h2>
                    <p style="font-size: 1.125rem; line-height: 1.7; color: #4a5568; margin-bottom: 2rem; text-align: center; max-width: 500px; margin-left: auto; margin-right: auto;">We handle a wide range of ${serviceName.toLowerCase()} needs to ensure your complete satisfaction.</p>
                    <div class="services-list">
                        ${serviceContent.commonIssues.map((issue: string) => `
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                                <div style="width: 8px; height: 8px; background: ${template.colors.primary}; border-radius: 50%; flex-shrink: 0;"></div>
                                <span style="color: #374151; line-height: 1.5; font-weight: 500;">${issue}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="content-section" style="background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);">
                    <h2 style="font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; margin-bottom: 1.5rem; color: #1a202c; text-align: center;">Service Features & Benefits</h2>
                    <p style="font-size: 1.125rem; line-height: 1.7; color: #4a5568; margin-bottom: 2rem; text-align: center; max-width: 500px; margin-left: auto; margin-right: auto;">What makes our ${serviceName.toLowerCase()} services stand out from the competition.</p>
                    <div class="features-grid">
                        ${serviceContent.serviceFeatures.map((feature: string) => `
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #fef3e7 0%, #fdf2f8 100%); border-radius: 10px; border-left: 4px solid ${template.colors.primary};">
                                <i class="fas fa-check-circle" style="color: ${template.colors.primary}; font-size: 1.1rem; margin-top: 0.125rem; flex-shrink: 0;"></i>
                                <span style="color: #374151; line-height: 1.5; font-weight: 500; font-size: 0.95rem; text-align: left;">${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="section-cta" style="text-align: center; padding: 3rem 2rem; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);">
                <h3 style="font-size: 1.75rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem;">Need Expert ${serviceName} Services?</h3>
                <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem;">Contact our ${serviceName.toLowerCase()} specialists today for professional service you can trust.</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call" style="display: inline-flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white; padding: 1rem 2rem; border-radius: 12px; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
                    <i class="fas fa-phone"></i>
                    Call ${data.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- SEO Content Sections -->
    <section style="padding: 4rem 0; background: white;">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading1}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent1)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading2}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent2)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading3}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent3)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading4}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent4)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading5}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent5)}</p>
                </div>
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); padding: 2rem; border-radius: 15px; border-left: 4px solid ${template.colors.primary}; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                    <h3 style="font-size: 1.5rem; font-weight: 600; color: #1a202c; margin-bottom: 1rem; text-align: left;">${serviceName} - ${data.seoHeading6}</h3>
                    <p style="color: #4a5568; line-height: 1.7; text-align: left; margin: 0;">${parseMarkdownText(data.seoContent6)}</p>
                </div>
            </div>
            <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%); border-radius: 15px;">
                <p style="font-size: 1.25rem; color: #4a5568; margin-bottom: 1.5rem;">Ready to get started with ${serviceName}?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); color: white; padding: 1rem 2rem; border-radius: 12px; text-decoration: none; font-weight: 600; transition: all 0.3s ease;">
                    <i class="fas fa-phone"></i>
                    Call Now
                </a>
            </div>
        </div>
    </section>

    <!-- Internal Links Section -->
    <section class="internal-links" style="background: linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%); padding: 4rem 0;">
        <div class="container">
            <h2 class="section-title" style="text-align: center; margin-bottom: 3rem;">Explore Our Other Services & Locations</h2>
            <div class="internal-links-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                
                <!-- Homepage Link -->
                <div class="internal-link-card" style="background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); text-align: center; transition: all 0.3s ease;">
                    <div class="link-icon" style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                        <i class="fas fa-home" style="color: white; font-size: 1.5rem;"></i>
                    </div>
                    <h3 style="color: #1f2937; margin-bottom: 0.5rem;">Main Office</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">Learn more about ${data.businessName}</p>
                    <a href="index.html" class="internal-link-btn" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 500; transition: all 0.3s ease;">Visit Homepage</a>
                </div>
            </div>
        </div>
    </section>


    <!-- Contact Section -->
    <section class="contact" id="contact" style="padding: 5rem 0; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});">
        <div class="container">
            <div class="section-header" style="text-align: center; margin-bottom: 4rem;">
                <h2 style="font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 1rem;">Contact ${data.businessName}</h2>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.125rem; max-width: 600px; margin: 0 auto;">
                    Get your ${serviceName.toLowerCase()} needs handled by professionals. We're here to help 24/7.
                </p>
            </div>
            
            <div class="contact-cards" style="display: grid; grid-template-columns: 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto;">
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-phone" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Call Us</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Speak directly with our professional team for immediate assistance</p>
                    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 1.5rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; word-break: break-all; font-size: 0.9rem;">
                        ${data.phone}
                    </a>
                </div>
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-envelope" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Email Us</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Send us a message and we'll respond as soon as possible</p>
                    <a href="mailto:${data.email || 'info@example.com'}" style="display: inline-block; background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; white-space: nowrap;">
                        ${data.email || 'info@example.com'}
                    </a>
                </div>
                <div class="contact-card" style="background: white; padding: 2.5rem; border-radius: 20px; text-align: center; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); transition: all 0.3s ease; max-width: 400px; margin: 0 auto;" 
                     onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 20px 45px rgba(0, 0, 0, 0.2)'"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 15px 35px rgba(0, 0, 0, 0.15)'">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 20px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-map-marker-alt" style="color: white; font-size: 2rem;"></i>
                    </div>
                    <h3 style="color: #1a202c; font-size: 1.3rem; font-weight: 600; margin-bottom: 1rem;">Service Areas</h3>
                    <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">We proudly serve the following areas</p>
                    <div style="background: ${template.colors.primary}; color: white; padding: 1rem 2rem; border-radius: 10px; font-weight: 600; line-height: 1.4;">${data.serviceAreas}</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 3rem 0 1.5rem; color: white;">
        <div class="container">
            <div class="footer-content" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
                <div class="footer-main">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}); border-radius: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas fa-tools" style="color: white; font-size: 1.7rem;"></i>
                        </div>
                        <h3 style="color: white; font-size: 1.7rem; font-weight: 700; margin: 0; text-align: left;">${data.businessName}</h3>
                    </div>
                    <p style="color: #cbd5e1; margin-bottom: 2rem; line-height: 1.7; font-size: 1.1rem; text-align: left;">${data.footerDescription || `Professional ${data.category.toLowerCase()} services in ${data.heroLocation}. Trusted, verified, and committed to excellence.`}</p>
                    <div class="footer-contact" style="color: #cbd5e1; line-height: 2; text-align: left;">
                        <p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-phone" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Phone:</strong> <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="color: white; text-decoration: none;">${data.phone}</a></span></p>
                        ${data.email ? `<p style="margin-bottom: 1rem; display: flex; align-items: center;"><i class="fas fa-envelope" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Email:</strong> <a href="mailto:${data.email}" style="color: white; text-decoration: none;">${data.email}</a></span></p>` : ''}
                        <p style="margin-bottom: 1rem; display: flex; align-items: flex-start;"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px; margin-top: 2px;"></i><span><strong>Address:</strong> ${data.address}</span></p>
                        <p style="margin-bottom: 0; display: flex; align-items: center;"><i class="fas fa-clock" style="color: ${template.colors.accent}; margin-right: 0.75rem; width: 16px;"></i><span><strong>Hours:</strong> ${data.businessHours}</span></p>
                    </div>
                </div>
                
                <div class="footer-services">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Our Services</h4>
                    <ul style="list-style: none; padding: 0; margin: 0; text-align: left;">
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#services" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${serviceName}</a></li>
                        ${data.additionalServices ? data.additionalServices.split(',').slice(0, 5).map(service => `
                        <li style="margin-bottom: 0.75rem;"><a href="${generateServiceUrl(service.trim(), data.heroLocation)}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${service.trim()}</a></li>
                        `).join('') : ''}
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#about" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(data.category).consultationTerm}</a></li>
                        <li style="margin-bottom: 0.75rem;"><a href="index.html#contact" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-arrow-right" style="font-size: 0.8rem;"></i>${getCategorySpecificTerms(data.category).urgentTerm.charAt(0).toUpperCase() + getCategorySpecificTerms(data.category).urgentTerm.slice(1)}</a></li>
                    </ul>
                </div>
                
                <div class="footer-areas">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: block; text-align: left;">Service Areas</h4>
                    <div style="color: #cbd5e1; line-height: 1.8;">
                        ${data.serviceAreas.split(',').slice(0, 6).map(area => {
    const areaName = area.trim();
    const areaLink = data.additionalLocations && data.additionalLocations.split(',').map(loc => loc.trim()).includes(areaName)
      ? generateLocationUrl(areaName, data.category)
      : 'index.html#contact';
    return `<div style="margin-bottom: 0.75rem;"><a href="${areaLink}" style="color: #cbd5e1; text-decoration: none; transition: color 0.3s ease; display: flex; align-items: center; gap: 0.5rem;" onmouseover="this.style.color='${template.colors.accent}'" onmouseout="this.style.color='#cbd5e1'"><i class="fas fa-map-marker-alt" style="color: ${template.colors.accent}; width: 12px; flex-shrink: 0;"></i>${areaName}</a></div>`;
  }).join('')}
                        ${data.serviceAreas.split(',').length > 6 ? `<div style="margin-top: 1rem;"><a href="index.html#contact" style="color: ${template.colors.accent}; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-plus" style="font-size: 0.8rem;"></i>View All Areas</a></div>` : ''}
                    </div>
                </div>
                
                <div class="footer-info">
                    <h4 style="color: white; font-size: 1.3rem; font-weight: 600; margin-bottom: 1.5rem; border-bottom: 2px solid ${template.colors.primary}; padding-bottom: 0.5rem; display: inline-block; text-align: left;">Why Choose Us</h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${data.keyFacts.split(',').slice(0, 5).map(fact => `<li style="margin-bottom: 0.75rem; color: #cbd5e1; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.95rem; text-align: left;"><i class="fas fa-check-circle" style="color: ${template.colors.accent}; margin-top: 0.25rem; flex-shrink: 0;"></i><span>${fact.trim()}</span></li>`).join('')}
                    </ul>
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; gap: 0.75rem; background: ${template.colors.primary}; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: all 0.3s ease; font-size: 0.95rem;">
                            <i class="fas fa-phone"></i>
                            Call Now
                        </a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem; text-align: center;">
                <p style="color: #94a3b8; margin-bottom: 1rem;">&copy; 2025 ${data.businessName}. All rights reserved. | Professional ${serviceName} Services</p>
                ${data.leadGenDisclaimer && data.leadGenDisclaimer.trim() ? `
                <div class="disclaimer-section" style="margin-top: 1rem;">
                    <p class="disclaimer-text" style="color: #64748b; font-size: 0.9rem; max-width: 800px; margin: 0 auto; line-height: 1.4;">${data.leadGenDisclaimer}</p>
                </div>
                ` : ''}
            </div>
        </div>
    </footer>

    <script>
    // Dropdown functionality
    document.addEventListener('DOMContentLoaded', function() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            let hideTimeout;
            
            // Show dropdown on mouseenter
            dropdown.addEventListener('mouseenter', function() {
                clearTimeout(hideTimeout);
                dropdown.classList.add('show');
                if (menu) menu.classList.add('show');
            });
            
            // Hide dropdown on mouseleave with delay
            dropdown.addEventListener('mouseleave', function() {
                hideTimeout = setTimeout(function() {
                    dropdown.classList.remove('show');
                    if (menu) menu.classList.remove('show');
                }, 150); // 150ms delay for smooth UX
            });
            
            // Keep dropdown visible when hovering over menu items
            if (menu) {
                menu.addEventListener('mouseenter', function() {
                    clearTimeout(hideTimeout);
                    dropdown.classList.add('show');
                    menu.classList.add('show');
                });
                
                menu.addEventListener('mouseleave', function() {
                    hideTimeout = setTimeout(function() {
                        dropdown.classList.remove('show');
                        menu.classList.remove('show');
                    }, 150);
                });
            }
        });
    });
    </script>${injectTrackingCodes(siteSettings, 'body_end')}
    <script src="script.js"></script>
</body>
</html>`;
}

function generateCSS(template: Template): string {
  return `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #ffffff;
    overflow-x: hidden;
}

/* === ANIMATION KEYFRAMES === */
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
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 15px ${template.colors.primary}40; }
    50% { box-shadow: 0 0 30px ${template.colors.primary}60, 0 0 60px ${template.colors.primary}20; }
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes countUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInBounce {
    0% { opacity: 0; transform: translateY(30px); }
    60% { transform: translateY(-5px); }
    100% { opacity: 1; transform: translateY(0); }
}

/* Scroll-triggered animation classes */
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-on-scroll.animated {
    opacity: 1;
    transform: translateY(0);
}

.container {
    max-width: 1300px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header and Navigation */
.header {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 1px 30px rgba(0, 0, 0, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    height: 80px;
    overflow: visible;
    transition: all 0.3s ease;
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    height: 80px;
    position: relative;
    overflow: visible;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.nav-logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 8px;
}

.nav-brand h1 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1e3a8a;
}

.nav-brand a {
    text-decoration: none;
}

.nav-links {
    display: flex;
    align-items: center;
    position: relative;
}

.nav-links .nav-menu {
    display: flex;
    list-style: none;
    align-items: center;
    gap: 2rem;
    position: relative;
    overflow: visible;
    flex-direction: row;
    background: transparent;
    box-shadow: none;
    padding: 0;
    border-radius: 0;
    max-height: none;
    height: auto;
}

.nav-menu li {
    position: relative;
    display: flex;
    align-items: center;
}

.nav-menu a {
    text-decoration: none;
    color: #4a5568;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.nav-menu a:hover,
.nav-menu a.active {
    color: ${template.colors.primary};
    background: ${template.colors.primary}1A;
}


/* Remove any gaps - overlap slightly */
.dropdown {
    position: relative;
    overflow: visible;
}

.dropdown > a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 10001;
}

.dropdown-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dropdown-menu {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    background: #ffffff !important;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border: 1px solid #e5e7eb;
    display: none !important;
    opacity: 0;
    transform: translateY(-5px);
    transition: all 0.2s ease;
    min-width: 180px;
    z-index: 10000 !important;
    overflow: hidden;
    padding: 8px 0;
    max-height: 250px;
    overflow-y: auto;
    white-space: nowrap;
    margin-top: -1px;
    padding-top: 9px;
}

/* Ensure dropdown is hidden by default */
.dropdown-menu {
    visibility: hidden !important;
    display: none !important;
}

/* Show dropdown with .show class (controlled by JavaScript) */
.dropdown.show .dropdown-menu,
.dropdown-menu.show {
    visibility: visible !important;
    display: block !important;
    opacity: 1 !important;
    transform: translateY(0) !important;
}

/* Fallback CSS hover for basic functionality */
.dropdown:hover .dropdown-menu {
    visibility: visible !important;
    display: block !important;
    opacity: 1 !important;
    transform: translateY(0) !important;
}

/* Prevent mobile sections from showing on desktop */
.mobile-only {
    display: none !important;
}

@media (min-width: ${getResponsiveBreakpoint()}) {
    .contact-cards {
        grid-template-columns: ${getContactCardsGridColumns()} !important;
        gap: ${WEBSITE_LAYOUT_CONFIG.contactCardsGap} !important;
    }
    
    .about-content-wrapper {
        grid-template-columns: 2fr 1fr !important;
        align-items: start !important;
        gap: ${WEBSITE_LAYOUT_CONFIG.aboutSectionGap} !important;
    }
    
    .about-features {
        grid-template-columns: ${getFeaturesGridColumns()} !important;
        gap: 1.5rem !important;
    }
    
    .content-grid {
        grid-template-columns: ${WEBSITE_LAYOUT_CONFIG.contentGridColumns} !important;
        gap: ${WEBSITE_LAYOUT_CONFIG.generalGridGap} !important;
    }
    
    .about-content {
        grid-template-columns: ${getAboutGridColumns()} !important;
        align-items: center !important;
        gap: ${WEBSITE_LAYOUT_CONFIG.aboutSectionGap} !important;
    }
    
    .about-text {
        text-align: left !important;
    }
    
    .about-stats-wrapper {
        display: flex !important;
        justify-content: center !important;
    }
}

@media (min-width: 769px) {
    .mobile-only {
        display: none !important;
    }
}

.dropdown-menu li {
    padding: 0;
    background: #ffffff;
    list-style: none;
}

.dropdown-menu a {
    display: block;
    padding: 12px 16px;
    color: #374151 !important;
    text-decoration: none;
    border-radius: 0;
    background: #ffffff;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;
    border: none;
}

.dropdown-menu a:hover {
    background: ${template.colors.primary}1A !important;
    color: ${template.colors.primary} !important;
    transform: translateX(2px);
}

/* Mobile menu button */
.mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #333;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
}

.mobile-menu-btn:hover {
    color: ${template.colors.primary};
}

/* Hide mobile-only sections on desktop */
.mobile-only {
    display: none;
}

.phone-btn {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
    font-size: 1rem;
}

.phone-btn:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
}

/* Hero Section */
.hero {
    position: relative;
    min-height: 85vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: left;
    color: white;
    overflow: hidden;
    padding: 2rem 0;
    animation: fadeInDown 0.8s ease-out;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${template.colors.primary}E6, ${template.colors.secondary}CC);
    z-index: 1;
}

.hero-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(0, 0, 0, 0.2), transparent 70%);
    z-index: 1;
}

.hero-overlay::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 30% 70%, ${template.colors.accent}20 0%, transparent 40%),
                radial-gradient(circle at 70% 30%, ${template.colors.primary}15 0%, transparent 40%);
    animation: float 15s ease-in-out infinite;
    z-index: 1;
}

.hero-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 4rem;
    align-items: center;
    min-height: 70vh;
}

.hero-stats-card {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 24px;
    padding: 2rem;
    text-align: center;
    animation: fadeInRight 1s ease-out 0.3s both;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    line-height: 1.1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-badges {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.hero-badge {
    background: rgba(239, 68, 68, 0.9);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hero-badge.emergency {
    background: rgba(239, 68, 68, 0.9);
}

.hero-badge.available {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-description {
    font-size: clamp(1.125rem, 2vw, 1.25rem);
    margin-bottom: 2.5rem;
    opacity: 0.95;
    line-height: 1.6;
    color: #bfdbfe;
    max-width: 800px;
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-top: 2rem;
    text-align: center;
}

.hero-stat {
    padding: 1rem;
}

.hero-stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.5rem;
}

.hero-stat-label {
    font-size: 0.9rem;
    color: #bfdbfe;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}

.cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1.125rem 2.25rem;
    border-radius: 9999px;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.125rem;
    line-height: 1.2;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: none;
    cursor: pointer;
    text-align: center;
}

.cta-primary {
    background: #ffffff;
    color: ${template.colors.primary};
}

.cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.cta-secondary {
    background: ${template.colors.secondary};
    color: white;
    border: 2px solid ${template.colors.accent};
}

.cta-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

/* CTA Button Variants */
.cta-call {
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
}

.cta-call:hover {
    background: linear-gradient(135deg, ${template.colors.secondary}, ${template.colors.primary});
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px ${template.colors.primary}66, 0 4px 6px -2px ${template.colors.primary}40;
}

.cta-whatsapp {
    background: linear-gradient(135deg, #25d366, #128c7e);
    color: white;
}

.cta-whatsapp:hover {
    background: linear-gradient(135deg, #128c7e, #075e54);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.4);
}

.cta-custom {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
}

.cta-custom:hover {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
}

/* Section CTAs */
.section-cta {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem 0;
}

.section-cta p {
    font-size: 1.2rem;
    color: #4a5568;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.cta-button.large {
    font-size: 1.2rem;
    padding: 1.2rem 2.5rem;
}

/* Contact Main CTA */
.contact-main-cta {
    text-align: center;
    margin-bottom: 3rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.contact-main-cta p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    opacity: 0.95;
    font-weight: 500;
}

/* Trust Indicators Section */
.trust-indicators {
    padding: 4rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
}

.trust-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    max-width: 1000px;
    margin: 0 auto;
}

.trust-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px) saturate(150%);
    -webkit-backdrop-filter: blur(16px) saturate(150%);
    border-radius: 18px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.trust-item:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px ${template.colors.primary}15;
    border-color: ${template.colors.accent}40;
}

.trust-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    color: white;
    flex-shrink: 0;
    box-shadow: 0 6px 15px ${template.colors.primary}40;
}

.trust-text h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: #1a202c;
}

.trust-text p {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
}

/* Features Section */
.features {
    padding: 6rem 0;
    background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%);
    position: relative;
}

.features::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at 20% 50%, ${template.colors.primary}08 0%, transparent 50%),
                radial-gradient(ellipse at 80% 50%, ${template.colors.secondary}08 0%, transparent 50%);
    pointer-events: none;
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 4rem;
    color: #1f2937;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.3;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.section-subtitle {
    text-align: center;
    font-size: 1.25rem;
    color: #6b7280;
    max-width: 600px;
    margin: -2rem auto 4rem auto;
    line-height: 1.6;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2.5rem;
}

.feature-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.6);
    position: relative;
    overflow: hidden;
}

.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.accent}, ${template.colors.secondary});
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.4s ease;
}

.feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px ${template.colors.primary}15;
    border-color: ${template.colors.accent}40;
}

.feature-card:hover::before {
    opacity: 1;
    animation: shimmer 2s linear infinite;
}

.feature-icon {
    width: 70px;
    height: 70px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    color: white;
    box-shadow: 0 8px 25px ${template.colors.primary}40;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-card:hover .feature-icon {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 12px 30px ${template.colors.primary}50;
}

.feature-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.2rem;
    color: #1a202c;
}

.feature-description {
    color: #4a5568;
    line-height: 1.7;
    font-size: 1.1rem;
}

/* About Section */
.about {
    padding: 6rem 0;
    background: white;
}

.about-content {
    display: grid;
    grid-template-columns: calc(30% - 20px) calc(70% + 20px);
    gap: 4rem;
    align-items: center;
}

.about-text h2 {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.3;
}

.about-text p {
    font-size: 1.25rem;
    line-height: 1.8;
    color: #4a5568;
    margin-bottom: 2.5rem;
}

.about-stats {
    display: flex;
    gap: 2rem;
    margin-top: 2rem;
}

.stat-item {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: ${template.colors.primary};
}

.stat-label {
    color: #4a5568;
    font-weight: 500;
}

.about-image img {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* About Section Flipped Layout */
.about-flipped {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.about-flipped .about-content {
    grid-template-columns: calc(70% + 20px) calc(30% - 20px);
}

.services-list {
    list-style: none;
    margin-top: 2rem;
}

.services-list li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
}

.services-list li:last-child {
    border-bottom: none;
}

.services-list i {
    color: ${template.colors.primary};
    font-weight: bold;
}

/* SEO Sections */
.seo-sections {
    padding: 6rem 0;
    background: linear-gradient(135deg, #f0f4ff 0%, #e8ecf4 50%, #f0f4ff 100%);
    position: relative;
}

.seo-sections::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 10% 20%, ${template.colors.primary}06 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, ${template.colors.secondary}06 0%, transparent 40%);
    pointer-events: none;
}

.seo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    position: relative;
    z-index: 1;
}

.seo-section {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px) saturate(150%);
    -webkit-backdrop-filter: blur(16px) saturate(150%);
    padding: 2.5rem;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.seo-section:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: ${template.colors.accent}30;
}

.seo-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
}

.seo-heading {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #1a202c;
    position: relative;
}

.seo-heading::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    border-radius: 2px;
}

.seo-content {
    color: #4a5568;
    line-height: 1.8;
    font-size: 1.15rem;
}

/* SEO Section with Image */
.seo-section-with-image {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.seo-image {
    margin-top: 1.5rem;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.seo-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
}

.seo-image img:hover {
    transform: scale(1.05);
}

/* Testimonials Section */
.testimonials {
    padding: 100px 0;
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f4ff 100%);
    position: relative;
    overflow: hidden;
}

.testimonials::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 30%, ${template.colors.primary}0D 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, ${template.colors.secondary}0D 0%, transparent 50%);
    pointer-events: none;
}

.testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto 3rem;
}

.testimonial-card {
    opacity: 1;
    transform: translateX(0);
    transition: all 0.3s ease;
}

.testimonial-card:hover {
    transform: translateY(-5px);
}

.testimonial-content {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    padding: 3rem;
    border-radius: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    border: 1px solid rgba(255,255,255,0.6);
    text-align: center;
    position: relative;
    margin: 1rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.testimonial-content:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(0,0,0,0.12);
    border-color: ${template.colors.accent}30;
}
}

.testimonial-content::before {
    content: '"';
    position: absolute;
    top: -10px;
    left: 30px;
    font-size: 4rem;
    color: ${template.colors.primary};
    opacity: 0.3;
    font-family: Georgia, serif;
    line-height: 1;
}

.testimonial-stars {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.testimonial-stars i {
    color: #fbbf24;
    font-size: 1.2rem;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.testimonial-text {
    font-size: 1.2rem;
    line-height: 1.7;
    color: #374151;
    margin-bottom: 2rem;
    font-style: italic;
    position: relative;
}

.testimonial-author {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}

.author-info h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
}

.author-info p {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0;
}

.testimonials-cta {
    text-align: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    max-width: 600px;
    margin: 0 auto;
}

.testimonials-cta p {
    font-size: 1.2rem;
    color: #4a5568;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

/* FAQ Section */
.faq {
    padding: 6rem 0;
    background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
}

.faq-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    max-width: 1000px;
    margin: 0 auto;
}

.faq-cta {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-radius: 20px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.faq-cta p {
    font-size: 1.2rem;
    color: #4a5568;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.faq-item {
    margin-bottom: 1rem;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.faq-item:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border-color: ${template.colors.accent}40;
    transform: translateY(-2px);
}

.faq-question {
    width: 100%;
    padding: 2rem;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: none;
    text-align: left;
    font-size: 1.3rem;
    font-weight: 600;
    color: #1a202c;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;
}

.faq-question:hover {
    background: linear-gradient(135deg, #e2e8f0, #cbd5e0);
}

.faq-question.active {
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
}

.faq-icon {
    transition: transform 0.3s ease;
}

.faq-question.active .faq-icon {
    transform: rotate(180deg);
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.faq-answer.active {
    max-height: 500px;
}

.faq-answer p {
    padding: 2rem;
    color: #4a5568;
    line-height: 1.7;
    margin: 0;
    font-size: 1.1rem;
}

/* Contact Section */
.contact {
    padding: 6rem 0;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
    position: relative;
    overflow: hidden;
}

.contact::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.05) 75%, transparent 75%);
    background-size: 60px 60px;
    animation: gradientShift 20s ease infinite;
    z-index: 1;
}

.contact .container {
    position: relative;
    z-index: 2;
}

.contact .section-title {
    color: white;
    -webkit-text-fill-color: white;
}

.contact-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 18px;
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.contact-item:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.18);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.contact-icon {
    font-size: 1.5rem;
    color: white;
}

.contact-item h3 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.contact-item p {
    opacity: 0.9;
}

.contact-item a {
    color: white;
    text-decoration: none;
}

.contact-item a:hover {
    text-decoration: underline;
}

/* Location Map Section */
.location-map {
    padding: 6rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.location-map .section-title {
    color: #1a202c;
}

.map-container {
    margin: 3rem 0;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    height: 400px;
}

.map-container iframe {
    width: 100%;
    height: 100%;
    max-width: 100%;
    border: none;
    filter: saturate(1.1) contrast(1.05);
}

.map-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 2rem;
    padding: 2rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.map-address {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.map-address i {
    font-size: 1.5rem;
    color: ${template.colors.primary};
    background: ${template.colors.primary}1A;
    padding: 0.75rem;
    border-radius: 50%;
}

.map-address p {
    font-size: 1.1rem;
    color: #4a5568;
    margin: 0;
    font-weight: 500;
}

.directions-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
    text-decoration: none;
    border-radius: 50px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px ${template.colors.primary}4D;
}

.directions-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px ${template.colors.primary}66;
    text-decoration: none;
    color: white;
}

.directions-btn i {
    font-size: 1rem;
}

/* Footer */
.footer {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    padding: 3rem 0 1rem;
    position: relative;
    overflow: hidden;
}

.footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${template.colors.primary}, ${template.colors.accent}, ${template.colors.secondary});
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-main h3 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: white !important;
}

.footer-main p {
    color: #cbd5e0;
    line-height: 1.6;
    margin-bottom: 1rem;
}

.footer-contact p {
    color: #cbd5e0;
    margin-bottom: 0.5rem;
}

.footer-contact a {
    color: white;
    text-decoration: none;
}

.footer-contact a:hover {
    text-decoration: underline;
}

.footer-info h4,
.footer-areas h4 {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: white;
}

.footer-info ul {
    list-style: none;
}

.footer-info li {
    color: #cbd5e0;
    margin-bottom: 0.5rem;
    padding-left: 1rem;
    position: relative;
}

.footer-info li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${template.colors.primary};
    font-weight: bold;
}

.footer-areas p {
    color: #cbd5e0;
    line-height: 1.6;
}

.footer-bottom {
    border-top: 1px solid #4a5568;
    padding-top: 2rem;
    text-align: center;
    color: #cbd5e0;
}

.disclaimer-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #4a5568;
}

.disclaimer-text {
    font-size: 0.875rem;
    color: #a0aec0;
    line-height: 1.5;
    max-width: 800px;
    margin: 0 auto;
}

/* Service Areas Section */
.service-areas {
    padding: 6rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);
}

.areas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin: 3rem 0;
}

.area-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 2rem 1.5rem;
    border-radius: 18px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.area-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: ${template.colors.accent}40;
}

.area-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-size: 1rem;
    color: white;
    box-shadow: 0 4px 15px ${template.colors.primary}40;
}

.area-card h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a202c;
    margin: 0;
}

.area-cta {
    text-align: center;
    margin-top: 3rem;
}

/* Final CTA Section */
.final-cta {
    padding: 6rem 0;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
    color: white;
    position: relative;
    overflow: hidden;
}

.final-cta::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.08), transparent 60%);
    z-index: 1;
}

.cta-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
}

.cta-content h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: white;
    line-height: 1.3;
}

.cta-content p {
    font-size: 1.3rem;
    margin-bottom: 3rem;
    opacity: 0.95;
    line-height: 1.6;
}

.cta-buttons {
    margin-bottom: 2rem;
}

.cta-trust {
    font-size: 1.1rem;
    opacity: 0.9;
    font-weight: 500;
}

/* Floating Phone Button */
.floating-phone-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
    padding: 1rem;
    border-radius: 50px;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 25px ${template.colors.primary}66;
    transition: all 0.3s ease;
    font-weight: 600;
    min-width: 60px;
    justify-content: center;
    animation: pulse-glow 2s ease-in-out infinite;
}

.floating-phone-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px ${template.colors.primary}80;
    text-decoration: none;
    color: white;
}

.phone-text {
    display: none;
}

@media (min-width: 768px) {
    .phone-text {
        display: inline;
    }
    
    .floating-phone-btn {
        border-radius: 25px;
        padding: 0.75rem 1.5rem;
    }
}

/* Testimonials Rating */
.testimonials-rating {
    text-align: center;
    margin: 3rem 0;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    backdrop-filter: blur(10px);
}

.overall-rating {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-direction: row;
}

.rating-stars {
    display: flex !important;
    gap: 0.25rem;
    flex-direction: row !important;
    align-items: center;
    justify-content: center;
}

.rating-stars i {
    color: #fbbf24;
    font-size: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.rating-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${template.colors.primary};
}

.testimonials-rating p {
    color: #6b7280;
    font-size: 1.1rem;
    margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
    /* Remove sticky header on mobile and tablets */
    .header {
        position: static;
    }
    
    /* Touch-friendly navigation */
    .nav-links a {
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }
}

@media (max-width: 992px) and (min-width: 769px) {
    /* Hero CTA buttons - keep 3 columns on tablets */
    .hero-cta-buttons {
        grid-template-columns: 1fr 1fr 1fr !important;
        max-width: 800px !important;
        gap: 0.8rem !important;
    }
}

@media (max-width: 768px) {
    .nav {
        flex-wrap: wrap;
        padding: 1rem;
    }
    
    /* Global mobile section padding */
    section {
        padding: 4rem 1rem !important;
    }

    /* Hero Section Mobile Responsiveness */
    .hero {
        padding: 5rem 1rem 3rem !important;
        text-align: center !important;
        min-height: auto !important;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .hero-content {
        padding: 0 !important;
        max-width: 100% !important;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    .hero-layout {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
        text-align: center !important;
        min-height: auto !important;
    }
    
    .hero-main {
        max-width: 100% !important;
        text-align: center !important;
    }
    
    .hero-title {
        font-size: clamp(2rem, 8vw, 2.75rem) !important;
        line-height: 1.2 !important;
        margin-bottom: 1rem !important;
        text-align: center !important;
    }
    
    .hero-service,
    .hero-location {
        font-size: inherit !important;
    }
    
    .hero-description {
        font-size: 1.125rem !important;
        line-height: 1.6 !important;
        margin-bottom: 2rem !important;
        padding: 0 0.5rem !important;
        text-align: center !important;
    }
    
    /* Hero features - stack vertically on mobile */
    .hero-features {
        grid-template-columns: 1fr !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 1rem !important;
        margin-bottom: 2.5rem !important;
        width: 100%;
        max-width: 400px;
    }
    
    .hero-feature {
        width: 100% !important;
        max-width: 100% !important;
        justify-content: center !important;
        padding: 1rem 1.5rem !important;
    }
    
    .hero-stats-card {
        margin: 0 auto !important;
        max-width: 350px !important;
        padding: 1.5rem !important;
    }
    
    /* Hero CTA buttons responsive - single column on mobile */
    .hero-cta-buttons {
        grid-template-columns: 1fr !important;
        max-width: 100% !important;
        gap: 1rem !important;
        padding: 0 1rem !important;
        justify-items: center !important;
    }
    
    /* Fix CTA button centering */
    .hero-cta,
    .cta-buttons {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        width: 100% !important;
        max-width: 400px !important;
        margin: 0 auto !important;
    }
    
    .cta-button,
    .cta-primary {
        width: 100% !important;
        max-width: none !important;
        justify-content: center !important;
        margin: 0 !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 1.125rem 1.5rem !important;
        font-size: 1.125rem !important;
        border-radius: 9999px !important;
    }
    
    /* About Section Mobile Responsiveness */
    .about-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
        padding: 0 1rem !important;
    }
    
    /* About section grid fixes */
    .about-content > div[style*="grid-template-columns"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
    }
    
    /* About text section */
    .about-text {
        max-width: 100% !important;
        padding: 0 1.5rem !important;
    }
    
    .about-text h2 {
        font-size: 1.75rem !important;
        text-align: center !important;
    }
    
    .about-text p {
        font-size: 1rem !important;
        text-align: center !important;
        max-width: 350px !important;
        margin-left: auto !important;
        margin-right: auto !important;
    }
    
    /* About features grid - make responsive */
    .about-text > div[style*="grid-template-columns: repeat(2, 1fr)"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 1rem !important;
    }
    
    .about-feature p {
        margin-left: 0 !important;
        text-align: center !important;
    }
    
    /* About stats box mobile adjustments */
    .about-stats {
        margin-top: 0 !important;
        padding: 1.5rem !important;
        align-self: stretch !important;
        width: 100% !important;
    }
    
    /* Features Section Mobile Responsiveness */
    .features-grid {
        grid-template-columns: 1fr !important;
        gap: 1.5rem !important;
        padding: 0 1rem !important;
    }
    
    .feature-card {
        padding: 2rem 1.5rem !important;
        margin: 0 auto !important;
        max-width: 350px !important;
    }
    
    .feature-icon {
        width: 60px !important;
        height: 60px !important;
        font-size: 1.5rem !important;
    }
    
    .feature-title {
        font-size: 1.2rem !important;
    }
    
    /* Section titles mobile responsive */
    .section-title {
        font-size: 1.75rem !important;
        text-align: center !important;
        padding: 0 1rem !important;
    }
    
    /* Force all grid sections into single column on mobile */
    .seo-grid,
    .testimonials-grid,
    .faq-grid,
    .areas-grid,
    .trust-grid,
    .contact-cards,
    .internal-links-grid,
    .blog-grid,
    .locations-grid,
    .services-grid,
    .excellence-grid {
        grid-template-columns: 1fr !important;
        gap: 1.5rem !important;
        padding: 0 1rem !important;
    }

    /* Keep items inside cards contained */
    .seo-section,
    .testimonial-content,
    .trust-item,
    .faq-item,
    .area-card,
    .contact-card,
    .excellence-item,
    .blog-card,
    .service-card,
    .location-card {
        margin: 0 auto !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        width: 100% !important;
        padding: 1.5rem !important; /* Standardize mobile card padding */
    }
    
    /* Service area cards mobile responsive */
    .service-area-card {
        width: 100% !important;
        max-width: 300px !important;
        margin: 0 auto !important;
        padding: 2rem 1.5rem !important;
        min-height: 200px !important;
    }
    
    .service-area-card h3 {
        font-size: 1.2rem !important;
        text-align: center !important;
    }
    
    .service-area-card p {
        font-size: 1rem !important;
        text-align: center !important;
    }
    
    .service-area-card .cta-button {
        width: 100% !important;
        max-width: 200px !important;
        margin: 0 auto !important;
        padding: 0.8rem 1.2rem !important;
    }
    
    /* Footer Mobile Responsiveness */
    .footer-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 2rem !important;
        margin-bottom: 2rem !important;
    }
    
    /* Footer sections mobile adjustments */
    .footer-main h3 {
        font-size: 1.4rem !important;
    }
    
    .footer-services h4,
    .footer-areas h4,
    .footer-info h4 {
        font-size: 1.1rem !important;
        margin-bottom: 1rem !important;
    }
    
    .mobile-menu-btn {
        display: block;
        order: 2;
    }
    
    .nav-contact {
        order: 3;
        margin-left: auto;
    }
    
    .nav-links {
        order: 4;
        width: 100%;
        display: none;
        margin-top: 1rem;
    }
    
    .nav-links.active {
        display: block;
    }
    
    .nav-links .nav-menu {
        flex-direction: column;
        gap: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        padding: 0;
    }
    
    .nav-menu li {
        border-bottom: 1px solid #e2e8f0;
    }
    
    .nav-menu > li:first-child {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }
    
    .nav-menu > li:last-child {
        border-bottom: none;
        border-bottom-left-radius: 8px;
        border-bottom-right-radius: 8px;
    }
    
    .nav-menu a {
        display: block;
        padding: 1rem 1.5rem;
        border-radius: 0;
    }
    
    /* Mobile menu section headers */
    .mobile-section-header {
        background: #f8fafc;
        color: #4a5568;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0.75rem 1.5rem;
        border-bottom: 2px solid #e2e8f0;
        margin: 0;
    }
    
    .mobile-section-items {
        background: white;
    }
    
    .mobile-section-items li {
        border-left: 3px solid transparent;
    }
    
    .mobile-section-items a {
        padding-left: 2rem;
        color: #718096;
        font-size: 0.95rem;
    }
    
    .mobile-section-items a:hover {
        background: #f7fafc;
        border-left-color: ${template.colors.primary};
        color: ${template.colors.primary};
    }
    
    .mobile-menu-spacer {
        height: 0.75rem;
        background: #f1f5f9;
        border-top: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
    }
    
    /* Hide desktop dropdown functionality in mobile, show mobile sections */
    .dropdown .dropdown-menu {
        display: none !important;
    }
    
    .dropdown-toggle::after {
        display: none !important;
    }
    
    .mobile-only {
        display: block !important;
    }
    
    /* Mobile section styling */
    .mobile-section-header {
        background: #f8fafc !important;
        color: #4a5568 !important;
        font-weight: 600 !important;
        font-size: 0.875rem !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        padding: 0.75rem 1.5rem !important;
        border-bottom: 2px solid #e2e8f0 !important;
        margin: 0 !important;
    }
    
    .mobile-section-items a {
        color: #718096 !important;
        font-size: 0.95rem !important;
        padding: 0.75rem 2rem !important;
        display: block !important;
        text-decoration: none !important;
        border-bottom: 1px solid #e2e8f0 !important;
    }
    
    .mobile-section-items a:hover {
        background: #f7fafc !important;
        color: #3182ce !important;
    }
    
    .nav-brand h1 {
        font-size: 1.5rem;
    }
    
    .phone-btn {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    .hero {
        padding: 4rem 0 3rem;
        text-align: center;
    }
    
    .hero-layout {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
        text-align: center;
    }
    
    .hero-stats-card {
        margin: 0 auto;
        max-width: 350px;
    }
    
    /* Force stars to be horizontal on mobile */
    .hero-stats-card div[style*="display: flex"] {
        flex-direction: row !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    .hero-title {
        font-size: 2.5rem !important;
        line-height: 1.2;
    }
    
    .hero-description {
        font-size: 1.1rem;
    }
    
    /* Mobile-specific hero styles */
    .hero h2 {
        font-size: 1.3rem !important;
    }
    
    .hero p {
        font-size: 1rem !important;
        margin-bottom: 2rem !important;
    }
    
    .hero div[style*="display: flex"] {
        flex-direction: column !important;
        gap: 1rem !important;
        align-items: center !important;
    }
    
    .hero a[style*="display: inline-flex"] {
        width: 100% !important;
        max-width: 280px !important;
        justify-content: center !important;
    }
    
    /* Additional mobile section adjustments */
    .section-header h2 {
        font-size: 2rem !important;
    }
    
    .about-description {
        font-size: 1rem !important;
        padding: 0 1rem !important;
        text-align: left !important;
    }
    
    /* Feature point cards mobile */
    .feature-point {
        padding: 0.75rem !important;
    }
    
    .feature-point h4 {
        font-size: 0.9rem !important;
    }
    
    .feature-point p {
        font-size: 0.75rem !important;
    }
    
    /* Footer contact spacing on mobile */
    .footer-contact p {
        margin-bottom: 0.75rem !important;
        font-size: 0.9rem !important;
    }
    
    /* Footer social icons mobile */
    .footer-social h4 {
        font-size: 1.1rem !important;
        margin-bottom: 1rem !important;
    }
    
    .social-icons {
        flex-direction: row !important;
        justify-content: center !important;
        gap: 1rem !important;
    }
    
    /* General Mobile Layout Fixes */
    .cta-button {
        width: 100%;
        max-width: 280px;
        justify-content: center;
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }
    
    .section-title {
        font-size: 2.2rem !important;
        margin-bottom: 2.5rem !important;
        text-align: center !important;
    }
    
    .features-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .feature-card {
        padding: 2rem 1.5rem !important;
    }
    
    .feature-icon {
        width: 70px !important;
        height: 70px !important;
        font-size: 1.5rem !important;
    }
    
    /* About Section Mobile */
    .about-content {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
        text-align: center !important;
    }
    
    .about-text {
        text-align: center !important;
    }
    
    .about h2 {
        font-size: 2.2rem !important;
    }
    
    .about-stats {
        flex-direction: column !important;
        gap: 1.5rem !important;
    }
    
    .about-image img {
        height: 250px !important;
        max-width: 100% !important;
    }
    
    /* Contact Section Mobile */
    .contact-info,
    .contact-cards {
        grid-template-columns: 1fr !important;
        gap: 1.5rem !important;
    }
    
    .contact-card {
        margin: 0 auto !important;
        max-width: 350px !important;
    }
    
    .contact-card a {
        white-space: normal !important;
        word-break: break-all !important;
        text-align: center !important;
    }
    
    .map-info {
        flex-direction: column !important;
        text-align: center !important;
        gap: 1rem !important;
    }
    
    .map-container {
        height: 300px !important;
    }
    
    /* FAQ Mobile */
    .faq-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
    }
    
    .faq-question {
        font-size: 1.1rem !important;
        padding: 1.5rem !important;
    }
    
    .faq-answer p {
        padding: 1.5rem !important;
        font-size: 1rem !important;
    }
    
    /* CTA Sections Mobile */
    .cta-button.large {
        font-size: 1.1rem !important;
        padding: 1.1rem 2rem !important;
    }
    
    .section-cta p,
    .faq-cta p,
    .contact-main-cta p {
        font-size: 1.1rem !important;
    }
    
    .contact-main-cta {
        padding: 1.5rem !important;
    }
    
    .faq-cta {
        padding: 1.5rem !important;
        margin-top: 2rem !important;
    }
    
    /* Blog Page Mobile Specific */
    .blog-header {
        padding: 3rem 0 2rem !important;
        text-align: center !important;
    }
    
    .blog-header h1 {
        font-size: 2.5rem !important;
        margin-bottom: 1rem !important;
    }
    
    .blog-header p {
        font-size: 1.1rem !important;
        padding: 0 1rem !important;
    }
    
    .blog-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .blog-card {
        margin: 0 auto !important;
        max-width: 400px !important;
    }
    
    .blog-post-header {
        padding: 2rem 0 1.5rem !important;
    }
    
    .blog-post h1 {
        font-size: 2.2rem !important;
        margin-bottom: 1rem !important;
    }
    
    .blog-meta {
        flex-direction: column !important;
        gap: 0.5rem !important;
        align-items: center !important;
    }
    
    .blog-content {
        padding: 0 1rem !important;
    }
    
    .blog-content h2 {
        font-size: 1.8rem !important;
    }
    
    .blog-content h3 {
        font-size: 1.5rem !important;
    }
    
    /* Location & Service Pages Mobile */
    .location-hero,
    .service-hero {
        padding: 3rem 0 2rem !important;
        text-align: center !important;
    }
    
    .location-hero h1,
    .service-hero h1 {
        font-size: 2.5rem !important;
        margin-bottom: 1rem !important;
    }
    
    .location-hero p,
    .service-hero p {
        font-size: 1.1rem !important;
        padding: 0 1rem !important;
    }
    
    .breadcrumb-nav {
        padding: 1rem !important;
        font-size: 0.9rem !important;
    }
    
    .breadcrumb-nav a {
        padding: 0.25rem !important;
    }
    
    /* Internal Links Section Mobile */
    .internal-links-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .links-column h3 {
        font-size: 1.3rem !important;
        margin-bottom: 1.5rem !important;
    }
    
    .links-column ul li {
        margin-bottom: 1rem !important;
    }
    
    .links-column a {
        font-size: 0.95rem !important;
        padding: 0.5rem 0 !important;
    }
    
    /* Floating Phone Button Mobile */
    .floating-phone-btn {
        bottom: 15px !important;
        left: 15px !important;
        padding: 12px 16px !important;
        font-size: 13px !important;
    }
    
    .phone-text {
        display: none !important;
    }
    
    /* Hero Mobile Improvements */
    .hero {
        padding: 3rem 0 2rem !important;
        min-height: auto !important;
    }
    
    .hero-content {
        padding: 0 1rem !important;
    }
    
    .hero-title {
        font-size: 2.2rem !important;
        line-height: 1.2 !important;
        margin-bottom: 1rem !important;
    }
    
    .hero-subtitle {
        font-size: 1.4rem !important;
        margin-bottom: 1rem !important;
    }
    
    .hero-description {
        font-size: 1.1rem !important;
        padding: 0 0.5rem !important;
        margin-bottom: 2rem !important;
    }
    
    /* Hero rating stars fix */
    .hero-rating {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        margin-bottom: 1.5rem !important;
    }
    
    .hero-rating .stars {
        display: flex !important;
        flex-direction: row !important;
        gap: 0.2rem !important;
    }
    
    /* Rating stars throughout site */
    .rating-stars,
    .testimonial-stars {
        display: flex !important;
        flex-direction: row !important;
        gap: 0.25rem !important;
        align-items: center !important;
    }
    
    .overall-rating {
        flex-direction: row !important;
        gap: 0.75rem !important;
        text-align: center !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    /* Force stars to be horizontal with higher specificity */
    .testimonials-rating .rating-stars,
    .rating-stars {
        display: flex !important;
        flex-direction: row !important;
        gap: 0.25rem !important;
        justify-content: center !important;
        align-items: center !important;
    }
    
    .testimonials-rating .overall-rating,
    .overall-rating {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 1rem !important;
    }
    
    /* Fix testimonial stars specifically */
    .testimonial-card .testimonial-stars,
    .testimonial-stars {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 0.3rem !important;
    }
    
    .testimonial-stars i {
        display: inline-block !important;
    }
    
    /* Trust Grid Mobile */
    .trust-grid {
        grid-template-columns: 1fr !important;
        gap: 1rem !important;
    }
    
    .trust-item {
        padding: 1rem !important;
    }
    
    /* Areas Grid Mobile */
    .areas-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
        gap: 1rem !important;
    }
    
    /* Hero Testimonial Mobile */
    .hero-testimonial {
        margin: 1.5rem 0 !important;
        padding: 1rem !important;
    }
    
    /* Final CTA Mobile */
    .cta-content h2 {
        font-size: 2rem !important;
    }
    
    .cta-content p {
        font-size: 1.1rem !important;
    }
    
    /* Testimonials Grid Mobile */
    .testimonials-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
    }
    
    .testimonial-card {
        max-width: none !important;
        margin: 0 !important;
    }
    
    /* Service Areas Mobile */
    .service-areas {
        padding: 4rem 0 !important;
    }
    
    /* Trust Indicators Mobile */
    .trust-indicators {
        padding: 3rem 0 !important;
    }
    
    /* Hero Section Mobile - All Pages */
    .hero-content h1,
    .location-hero h1,
    .service-hero h1,
    .blog-post h1 {
        font-size: 2.2rem !important;
        line-height: 1.2 !important;
        margin-bottom: 1rem !important;
        padding: 0 1rem !important;
    }
    
    .hero-content p,
    .location-hero p,
    .service-hero p {
        font-size: 1.1rem !important;
        padding: 0 1rem !important;
        margin-bottom: 2rem !important;
    }
    
    /* Fix stats cards on mobile */
    .hero-stats-card,
    .about-stats {
        padding: 1.5rem !important;
        margin: 1rem auto !important;
        max-width: 100% !important;
    }
    
    /* Hero trust points mobile */
    .hero-trust,
    .cta-trust {
        flex-direction: column !important;
        gap: 1rem !important;
        text-align: center !important;
    }
    
    .cta-trust span {
        display: block !important;
        margin-bottom: 0.5rem !important;
    }
    
    /* Fix container padding on mobile */
    .container {
        padding: 0 1rem !important;
    }
    
    /* Mobile navigation improvements */
    .mobile-menu-btn {
        background: none !important;
        border: none !important;
        color: #333 !important;
        font-size: 1.5rem !important;
        padding: 0.5rem !important;
        cursor: pointer !important;
    }
    
    .nav-links.active {
        display: block !important;
        position: absolute !important;
        top: 100% !important;
        left: 0 !important;
        right: 0 !important;
        background: white !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        z-index: 1000 !important;
        border-radius: 0 0 8px 8px !important;
    }
    
    .nav-menu {
        flex-direction: column !important;
        gap: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    .nav-menu > li {
        border-bottom: 1px solid #e2e8f0 !important;
    }
    
    .nav-menu > li:last-child {
        border-bottom: none !important;
    }
    
    .nav-menu a {
        display: block !important;
        padding: 1rem 1.5rem !important;
        color: #4a5568 !important;
        text-decoration: none !important;
        border-radius: 0 !important;
        transition: all 0.3s ease !important;
    }
    
    .nav-menu a:hover,
    .nav-menu a.active {
        background: #f7fafc !important;
        color: #3182ce !important;
    }
    
    /* Footer Mobile Responsiveness */
    .footer-content {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
        text-align: center !important;
    }
    
    .footer-social .social-icons {
        justify-content: center !important;
        flex-direction: row !important;
        gap: 1rem !important;
    }
    
    /* Testimonials Mobile */
    .testimonials-grid {
        grid-template-columns: 1fr !important;
        gap: 1.5rem !important;
    }
    
    .testimonial-card.professional {
        max-width: none !important;
        padding: 1.5rem !important;
    }
    
    /* About stats mobile */
    .about-stats {
        flex-direction: column !important;
        gap: 1.5rem !important;
    }
    
    .stat-item {
        text-align: center !important;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .section-title {
        font-size: 1.8rem;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
    
    .feature-card {
        padding: 1.5rem;
    }
    
    /* Ensure hero rating stars stay horizontal on mobile */
    .hero-rating-stars {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 0.25rem !important;
    }
    
    .features-grid {
        grid-template-columns: 1fr !important;
    }
    
    /* Force hero stars horizontal on small mobile */
    .hero-rating-stars {
        display: flex !important;
        flex-direction: row !important;
        justify-content: center !important;
        align-items: center !important;
        gap: 0.25rem !important;
    }
}

/* Floating Phone Button */
.floating-phone-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: ${template.colors.primary};
  color: white;
  padding: 15px 20px;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  font-weight: bold;
  font-size: 14px;
}

.floating-phone-btn:hover {
  background: ${template.colors.secondary};
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  color: white;
  text-decoration: none;
}

.floating-phone-btn i {
  font-size: 16px;
}

.phone-text {
  font-weight: 600;
}



/* Fixed Hero Section Styles */
.hero {
  min-height: 600px;
  display: flex;
  align-items: center;
  position: relative;
  padding: 4rem 0;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.hero-rating .stars {
  display: flex;
  gap: 0.2rem;
}

.hero-rating .stars i {
  color: #fbbf24;
  font-size: 1.1rem;
  filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.hero-rating .rating-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.9rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 1.5rem;
}

.hero-description {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2.5rem;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.hero-trust {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 1rem;
  margin: 0;
}

.cta-primary {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1.2rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  font-size: 1.2rem;
}

.cta-primary:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
  color: white;
  text-decoration: none;
}



/* Trust Indicators Section */
.trust-indicators {
  padding: 4rem 0;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.trust-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.trust-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trust-icon i {
  font-size: 1.5rem;
  color: white;
}

.trust-text h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.trust-text p {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Service Areas Section */
.service-areas {
  padding: 6rem 0;
  background: white;
}

.section-subtitle {
  text-align: center;
  font-size: 1.2rem;
  color: #6b7280;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.area-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.area-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.area-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.area-icon i {
  color: white;
  font-size: 1.2rem;
}

.area-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.area-cta {
  text-align: center;
}

/* Fixed Professional Testimonials */
.testimonial-card.professional {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  max-width: 400px;
  margin: 0 auto;
}

.testimonial-card.professional:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.testimonial-stars {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.testimonial-stars i {
  color: #fbbf24;
  font-size: 1.1rem;
  filter: drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3));
}

.testimonial-rating {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.testimonial-text {
  font-size: 1rem;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 2rem;
  font-style: italic;
  quotes: '"' '"' ''' ''';
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.author-info {
  flex-grow: 1;
}

.author-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
}

.author-info p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 0.25rem 0;
}

.service-type {
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}



.testimonials-rating {
  text-align: center;
  margin: 3rem 0;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.overall-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-direction: row;
}

.rating-stars {
  display: flex !important;
  gap: 0.25rem;
  flex-direction: row !important;
  align-items: center;
  justify-content: center;
}

.rating-stars i {
  color: #fbbf24;
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.rating-number {
  font-size: 2rem;
  font-weight: 700;
  color: ${template.colors.primary};
}

.testimonials-rating p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

/* Final CTA Section */
.final-cta {
  padding: 6rem 0;
  background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%);
  color: white;
  text-align: center;
}

.cta-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.cta-content p {
  font-size: 1.3rem;
  margin-bottom: 2.5rem;
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  margin-bottom: 2rem;
}

.cta-trust {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 1.1rem;
}

`;
}

function generateJS(data: BusinessData): string {
  return `// Mobile Menu Toggle
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const menuIcon = menuBtn.querySelector('i');
    
    navLinks.classList.toggle('active');
    
    if (navLinks.classList.contains('active')) {
        menuIcon.classList.remove('fa-bars');
        menuIcon.classList.add('fa-times');
    } else {
        menuIcon.classList.remove('fa-times');
        menuIcon.classList.add('fa-bars');
    }
}

// FAQ Toggle Functionality
function toggleFAQ(button) {
    const faqItem = button.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = button.querySelector('.faq-icon');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.querySelector('.faq-question').classList.remove('active');
            item.querySelector('.faq-answer').classList.remove('active');
        }
    });
    
    // Toggle current FAQ item
    button.classList.toggle('active');
    answer.classList.toggle('active');
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu functionality
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuBtn = document.querySelector('.mobile-menu-btn i');
    
    if (navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        menuBtn.className = 'fas fa-bars';
    } else {
        navLinks.classList.add('active');
        menuBtn.className = 'fas fa-times';
    }
}

// Testimonials display as simple grid layout - no carousel functionality needed

// Handle navigation and mobile menu
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded for ${data.businessName}');
    console.log('Setting up navigation handlers...');
    
    // Handle all navigation links that end with .html
    const allNavLinks = document.querySelectorAll('a[href$=".html"]');
    console.log('Found navigation links:', allNavLinks.length);
    
    allNavLinks.forEach((link, index) => {
        console.log(\`Link \${index + 1}: \${link.href} - Text: \${link.textContent}\`);
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            console.log('Navigation clicked:', href);
            
            if (href && href.endsWith('.html')) {
                e.preventDefault();
                
                // Close mobile menu if open
                const navLinksContainer = document.getElementById('navLinks');
                const menuBtn = document.querySelector('.mobile-menu-btn i');
                if (navLinksContainer) {
                    navLinksContainer.classList.remove('active');
                }
                if (menuBtn) {
                    menuBtn.className = 'fas fa-bars';
                }
                
                // Check if we're in an iframe and send message to parent
                if (window.parent !== window) {
                    console.log('Sending navigation message to parent:', href);
                    window.parent.postMessage({ type: 'navigate', page: href }, '*');
                } else {
                    // Regular navigation for downloaded websites
                    console.log('Regular navigation to:', href);
                    window.location.href = href;
                }
            }
        });
    });
    
    // Add click-based dropdown functionality for better mobile support
    window.toggleDropdown = function(toggle) {
        const dropdown = toggle.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        const icon = toggle.querySelector('i');
        
        // Toggle this dropdown
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        } else {
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                m.style.display = 'none';
                const otherIcon = m.parentElement.querySelector('.dropdown-toggle i');
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            });
            menu.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        }
    };
    
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            window.toggleDropdown(this);
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
    
    // Handle navigation links for proper page navigation in generated preview
    const navLinks = document.querySelectorAll('a[href$=".html"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            console.log('Navigating to:', href);
            // Allow normal navigation to work
        });
    });
});

// Add animation on scroll (optional)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger animation delay for items in the same section
            const parent = entry.target.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];
            const idx = siblings.indexOf(entry.target);
            const delay = idx * 0.1;
            
            entry.target.style.transitionDelay = delay + 's';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

// Observe elements for scroll-triggered animations
document.querySelectorAll('.feature-card, .seo-section, .excellence-item, .testimonial-card, .trust-item, .area-card, .contact-card, .faq-item, .links-column').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(el);
});

// Animate section titles
document.querySelectorAll('.section-title, .section-subtitle, .section-header').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
});

// Counter animation for stat numbers
function animateCounter(element, target) {
    const duration = 2000;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        const current = eased * target;
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString() + '+';
        } else {
            element.textContent = Math.floor(current) + '+';
        }
        
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// Observe stat numbers for counter animation
const statObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const text = entry.target.textContent.replace(/[^0-9.]/g, '');
            const num = parseFloat(text);
            if (!isNaN(num) && num > 0) {
                animateCounter(entry.target, num);
            }
            statObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => {
    statObserver.observe(el);
});`;
}

// Helper function to generate conditional CTA buttons with dynamic grid layout
function generateCtaButtons(data: BusinessData, template: Template): string {
  const buttons = [];
  let buttonCount = 1; // Always show phone button

  // Always add phone button
  buttons.push(`<a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; background: white; color: ${template.colors.primary}; padding: 1.25rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1.1rem; transition: all 0.3s ease; border: none; box-shadow: 0 8px 25px rgba(0,0,0,0.2); white-space: nowrap; text-align: center;" 
           onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0,0,0,0.25)'"
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.2)'">
        <i class="fas fa-phone"></i>
        Call Now
    </a>`);

  // Add WhatsApp button only if WhatsApp number is provided
  if (data.ctaWhatsappNumber && data.ctaWhatsappNumber.trim()) {
    buttons.push(`<a href="https://wa.me/${data.ctaWhatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; background: #25D366; color: white; padding: 1.25rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1.1rem; transition: all 0.3s ease; border: none; box-shadow: 0 8px 25px rgba(37, 211, 102, 0.3); white-space: nowrap; text-align: center;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#128C7E'; this.style.boxShadow='0 12px 35px rgba(37, 211, 102, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.background='#25D366'; this.style.boxShadow='0 8px 25px rgba(37, 211, 102, 0.3)'">
            <i class="fab fa-whatsapp"></i>
            WhatsApp
        </a>`);
    buttonCount++;
  }

  // Add custom URL button only if both URL and text are provided
  if (data.ctaCustomUrl && data.ctaCustomUrl.trim() && data.ctaCustomText && data.ctaCustomText.trim()) {
    buttons.push(`<a href="${data.ctaCustomUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; background: #8B5CF6; color: white; padding: 1.25rem 1.5rem; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1.1rem; transition: all 0.3s ease; border: none; box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3); white-space: nowrap; text-align: center;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.background='#7C3AED'; this.style.boxShadow='0 12px 35px rgba(139, 92, 246, 0.4)'"
               onmouseout="this.style.transform='translateY(0)'; this.style.background='#8B5CF6'; this.style.boxShadow='0 8px 25px rgba(139, 92, 246, 0.3)'">
            <i class="fas fa-external-link-alt"></i>
            ${data.ctaCustomText}
        </a>`);
    buttonCount++;
  }

  // Determine grid columns based on button count
  const gridColumns = buttonCount === 1 ? '1fr' : buttonCount === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  return `<div class="hero-cta-buttons" style="display: grid; grid-template-columns: ${gridColumns}; gap: 1rem; margin-bottom: 2rem; max-width: 900px; margin-left: auto; margin-right: auto;">
        ${buttons.join('')}
    </div>`;
}
