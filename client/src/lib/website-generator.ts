import { BusinessData } from "@shared/schema";
import { templates, Template } from "./templates";
import { 
  WEBSITE_LAYOUT_CONFIG, 
  getFeaturesGridColumns, 
  getContactCardsGridColumns, 
  getAboutGridColumns, 
  getResponsiveBreakpoint 
} from "./website-layout-config";

// Generate JSON-LD structured data for local business
function generateLocalBusinessSchema(data: BusinessData, pageTitle?: string, pageDescription?: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
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
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "37.7749", // Default coordinates - should be updated with actual business location
      "longitude": "-122.4194"
    },
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
function generateOrganizationSchema(data: BusinessData): string {
  const services = data.services.split(',').map(service => service.trim()).filter(service => service.length > 0);
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": data.businessName,
    "description": data.aboutDescription,
    "url": typeof window !== 'undefined' ? window.location.origin : '',
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
      data.twitterUrl
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

// Generate breadcrumb schema for better navigation
function generateBreadcrumbSchema(data: BusinessData, currentPage: string = 'home'): string {
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": typeof window !== 'undefined' ? window.location.origin : ''
    }
  ];
  
  if (currentPage !== 'home') {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 2,
      "name": currentPage,
      "item": `${typeof window !== 'undefined' ? window.location.origin : ''}/${currentPage.toLowerCase().replace(/\s+/g, '-')}`
    });
  }
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };
  
  return `<script type="application/ld+json">${JSON.stringify(breadcrumbSchema, null, 2)}</script>`;
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

// Generate optimized meta tags for local SEO
function generateSEOMetaTags(data: BusinessData, pageTitle?: string, pageDescription?: string, pageType: string = 'home'): string {
  const title = pageTitle || `${data.businessName} - ${data.heroService} in ${data.heroLocation}`;
  const description = pageDescription || data.heroDescription;
  const keywords = `${data.heroService}, ${data.heroLocation}, ${data.targetedKeywords}, ${data.businessName}`;
  
  return `
    <!-- SEO Meta Tags -->
    <meta name="keywords" content="${keywords}">
    <meta name="author" content="${data.businessName}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
    <meta name="googlebot" content="index, follow">
    <link rel="canonical" href="${typeof window !== 'undefined' ? window.location.href : ''}">
    
    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${data.logo || getCategoryImage(data.category)}">
    <meta property="og:url" content="${typeof window !== 'undefined' ? window.location.href : ''}">
    <meta property="og:site_name" content="${data.businessName}">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${data.logo || getCategoryImage(data.category)}">
    
    <!-- Local Business Info -->
    <meta name="geo.region" content="US">
    <meta name="geo.placename" content="${data.heroLocation}">
    <meta name="geo.position" content="37.7749;-122.4194">
    <meta name="ICBM" content="37.7749, -122.4194">
    
    <!-- Mobile Optimization -->
    <meta name="format-detection" content="telephone=${data.phone}">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  `;
}

function getCategoryImage(category: string): string {
  const categoryImages: { [key: string]: string } = {
    "Plumbing": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&h=600&fit=crop&crop=center",
    "HVAC (Heating & Cooling)": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop&crop=center",
    "Electrical": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop&crop=center",
    "Handyman": "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop&crop=center",
    "Roofing": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center",
    "Landscaping & Lawn Care": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&crop=center",
    "Painting Services": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&crop=center",
    "Home Cleaning / Maid Services": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center",
    "Local SEO Agency": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center",
    "SEO agency": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center",
    "Marketing Agency": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&crop=center",
    "Website Designer": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=600&fit=crop&crop=center",
    "Legal Services (e.g., Family Law, Immigration, DUI Defense)": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop&crop=center",
    "Real Estate Agents": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=center",
    "Financial Advisors & Tax Prep": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&crop=center",
    "Med Spa / Aesthetics Clinics": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=600&fit=crop&crop=center",
    "Hair Salons & Barbers": "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop&crop=center",
    "Dog Grooming": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop&crop=center",
    "Personal Trainers / Fitness Coaches": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center"
  };
  
  return categoryImages[category] || "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop&crop=center";
}

export interface GeneratedWebsite {
  html: string;
  css: string;
  js?: string;
}

export function generateWebsiteFiles(businessData: BusinessData, templateId: string): GeneratedWebsite {
  const template = templates.find(t => t.id === templateId) || templates[0];
  
  // Format phone number
  const formattedData = { ...businessData };
  if (formattedData.phone) {
    const code = formattedData.countryCode || '+1';
    const digits = formattedData.phone.replace(/\D/g, '');
    if ((code === '+1' || !formattedData.countryCode) && digits.length === 10) {
      formattedData.phone = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
  }

  const html = generateHTML(formattedData, template);
  let finalHtml = html;
  
  // Replace tel: links with country code
  if (businessData.phone) {
    const code = businessData.countryCode || '+1';
    const hrefPhone = businessData.phone.startsWith('+') ? businessData.phone : `${code}${businessData.phone}`.replace(/[^+\d]/g, '');
    finalHtml = finalHtml.replace(new RegExp(`href="tel:${formattedData.phone.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`, 'g'), `href="tel:${hrefPhone}"`);
    finalHtml = finalHtml.replace(new RegExp(`href="tel:${businessData.phone.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`, 'g'), `href="tel:${hrefPhone}"`);
  }
  
  const css = generateCSS(template);
  const js = generateJS(formattedData);

  return { html: finalHtml, css, js };
}

function generateHTML(data: BusinessData, template: Template): string {
  const features = data.featureHeadlines.split(',').map(h => h.trim());
  const featureDescriptions = data.featureDescriptions.split(',').map(d => d.trim());
  
  // Use custom meta data if provided, otherwise use auto-generated
  const optimizedTitle = data.metaTitle || `${data.heroService} in ${data.heroLocation} | ${data.businessName} | ${data.yearsInBusiness}+ Years Experience`;
  const optimizedDescription = data.metaDescription || `Professional ${data.heroService.toLowerCase()} services in ${data.heroLocation}. ${data.heroDescription} Call ${data.phone} for free estimates. Serving ${data.serviceAreas}.`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${optimizedTitle}</title>
    <meta name="description" content="${optimizedDescription}">
    ${data.logo ? `<link rel="icon" type="image/png" href="${data.logo}">` : ''}
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    ${generateSEOMetaTags(data, optimizedTitle, optimizedDescription, 'home')}
    
    <!-- Schema Markup -->
    ${generateLocalBusinessSchema(data, optimizedTitle, optimizedDescription)}
    ${generateOrganizationSchema(data)}
    ${generateServiceSchema(data)}
    ${generateBreadcrumbSchema(data, 'home')}
    ${generateFAQSchema(data)}
</head>
<body>
    <!-- Scroll Progress Indicator -->
    <div class="scroll-indicator" id="scrollProgress"></div>
    
    <!-- Location Header -->
    ${(data.primaryZipCode || data.secondaryZipCode || data.specificServices) ? `
    <div class="location-header">
        <div class="container">
            <div class="location-content">
                ${data.primaryZipCode || data.secondaryZipCode ? `
                <span class="location-zips">
                    ${data.primaryZipCode ? `${data.heroLocation} ${data.primaryZipCode}` : ''}
                    ${data.primaryZipCode && data.secondaryZipCode ? ' • ' : ''}
                    ${data.secondaryZipCode ? `${data.heroLocation} ${data.secondaryZipCode}` : ''}
                </span>
                ` : ''}
                ${(data.primaryZipCode || data.secondaryZipCode) && data.specificServices ? ' | ' : ''}
                ${data.specificServices ? `<span class="location-services">${data.specificServices}</span>` : ''}
            </div>
        </div>
    </div>
    ` : ''}

    <!-- Header -->
    <header class="header">
        <nav class="nav">
            <div class="nav-brand">
                ${(data.logo || data.logoUrl) ? `<img src="${data.logo || data.logoUrl}" alt="${data.heroService} in ${data.heroLocation}" class="nav-logo" />` : ''}
            </div>
            <div class="nav-links">
                <ul class="nav-menu">
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>
            <div class="nav-contact">
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="phone-btn">
                    <i class="fas fa-phone"></i> ${data.phone}
                </a>
            </div>
        </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero">
        <div class="hero-background">
            <div class="hero-overlay"></div>
        </div>
        <div class="hero-content">
            <div class="hero-badge">
                <i class="fas fa-star"></i>
                <span>${data.yearsInBusiness}+ Years Experience</span>
            </div>
            <h1 class="hero-title">
                <span class="hero-service">${data.heroService}</span>
                <span class="hero-location">in ${data.heroLocation}</span>
            </h1>
            <p class="hero-description">${data.heroDescription}</p>
            <div class="hero-features">
                <div class="hero-feature">
                    <i class="fas fa-shield-alt"></i>
                    <span>Licensed & Insured</span>
                </div>
                <div class="hero-feature">
                    <i class="fas fa-clock"></i>
                    <span>24/7 Emergency Service</span>
                </div>
                <div class="hero-feature">
                    <i class="fas fa-thumbs-up"></i>
                    <span>100% Satisfaction Guaranteed</span>
                </div>
            </div>
            <div class="hero-cta">
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button primary pulse">
                    <i class="fas fa-phone"></i> Call Now
                </a>
                ${data.ctaWhatsappNumber ? `
                <a href="https://wa.me/${data.ctaWhatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="cta-button whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
                ` : ''}
                ${data.ctaCustomUrl && data.ctaCustomText ? `
                <a href="${data.ctaCustomUrl}" target="_blank" rel="noopener noreferrer" class="cta-button custom">
                    <i class="fas fa-external-link-alt"></i> ${data.ctaCustomText}
                </a>
                ` : ''}
                <a href="#contact" class="cta-button secondary">
                    <i class="fas fa-calendar-alt"></i> Get Free Quote
                </a>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features">
        <div class="container">
            <h2 class="section-title">Why Choose ${data.businessName}?</h2>
            <div class="features-grid">
                ${features.map((feature, index) => `
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>${feature}</h3>
                    <p>${featureDescriptions[index] || feature}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section class="about">
        <div class="container">
            <div class="about-content">
                <div class="about-text">
                    <h2>About ${data.businessName}</h2>
                    <p>${data.aboutDescription}</p>
                    <div class="about-stats">
                        <div class="stat">
                            <span class="stat-number">${data.yearsInBusiness}+</span>
                            <span class="stat-label">Years Experience</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">Professional</span>
                            <span class="stat-label">Service</span>
                        </div>
                    </div>
                </div>
                <div class="about-image">
                    <img src="${data.aboutImage || getCategoryImage(data.category)}" alt="${data.heroService} in ${data.heroLocation}" class="category-image">
                </div>
            </div>
            <div class="section-cta">
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
                    <i class="fas fa-phone"></i>
                    Call ${data.businessName}
                </a>
            </div>
        </div>
    </section>

    <!-- About Section 2 (Flipped Layout) -->
    <section class="about about-flipped">
        <div class="container">
            <div class="about-content">
                <div class="about-image">
                    <img src="${data.aboutImage2 || getCategoryImage(data.category)}" alt="${data.heroService} in ${data.heroLocation}" class="category-image">
                </div>
                <div class="about-text">
                    <h2>Trusted ${data.category} Professionals</h2>
                    <p>Our dedication to excellence and customer satisfaction has made us the preferred choice for ${data.category.toLowerCase()} services in ${data.heroLocation}. We combine years of experience with modern techniques to deliver outstanding results.</p>
                    <div class="about-stats">
                        <div class="stat">
                            <span class="stat-number">Quality</span>
                            <span class="stat-label">Guaranteed</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">Expert</span>
                            <span class="stat-label">Service</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="section-cta">
                <p>Ready to get started?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
                    <i class="fas fa-phone"></i>
                    Call Now
                </a>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="services" id="services">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <div class="services-grid">
                ${data.services.split(',').map(service => `
                <div class="service-card">
                    <i class="fas fa-tools"></i>
                    <h3>${service.trim()}</h3>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- SEO Content Section -->
    <section class="seo-content">
        <div class="container">
            <div class="seo-sections">
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading1}</h2>
                    <p class="seo-text">${data.seoContent1}</p>
                </div>
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading2}</h2>
                    <p class="seo-text">${data.seoContent2}</p>
                </div>
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading3}</h2>
                    <p class="seo-text">${data.seoContent3}</p>
                </div>
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading4}</h2>
                    <p class="seo-text">${data.seoContent4}</p>
                </div>
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading5}</h2>
                    <p class="seo-text">${data.seoContent5}</p>
                </div>
                <div class="seo-section">
                    <h2 class="seo-heading">${data.seoHeading6}</h2>
                    <p class="seo-text">${data.seoContent6}</p>
                </div>
            </div>
            <div class="section-cta">
                <p>Need professional help?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call large">
                    <i class="fas fa-phone"></i>
                    Call ${data.phone}
                </a>
            </div>
        </div>
    </section>


    <!-- FAQ Section -->
    <section class="faq">
        <div class="container">
            <h2 class="section-title">Frequently Asked Questions</h2>
            <div class="faq-grid">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                <div class="faq-item">
                    <button class="faq-question" onclick="toggleFaq(this)">
                        <span>${(data as any)[`faqQuestion${num}`]}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="faq-answer">
                        <p>${(data as any)[`faqAnswer${num}`]}</p>
                    </div>
                </div>
                `).join('')}
            </div>
            <div class="faq-cta">
                <p>Have more questions?</p>
                <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call">
                    <i class="fas fa-phone"></i>
                    Call Now: ${data.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="contact" id="contact">
        <div class="container">
            <h2 class="section-title">${data.footerTitle}</h2>
            <p class="contact-description">${data.footerDescription}</p>
            <div class="contact-main-cta">
                <p>Ready to start your project? Get in touch today!</p>
                <div class="cta-group">
                    <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}" class="cta-button cta-call large">
                        <i class="fas fa-phone"></i>
                        Call Now: ${data.phone}
                    </a>
                    ${data.ctaWhatsappNumber ? `
                    <a href="https://wa.me/${data.ctaWhatsappNumber.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener noreferrer" class="cta-button whatsapp large">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </a>
                    ` : ''}
                    ${data.ctaCustomUrl && data.ctaCustomText ? `
                    <a href="${data.ctaCustomUrl}" target="_blank" rel="noopener noreferrer" class="cta-button custom large">
                        <i class="fas fa-external-link-alt"></i>
                        ${data.ctaCustomText}
                    </a>
                    ` : ''}
                </div>
            </div>
            <div class="contact-info">
                <div class="contact-card">
                    <i class="fas fa-phone"></i>
                    <h3>Call Us</h3>
                    <p><a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}">${data.phone}</a></p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-envelope"></i>
                    <h3>Email Us</h3>
                    <p><a href="mailto:${data.email}">${data.email}</a></p>
                </div>
                <div class="contact-card">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Visit Us</h3>
                    <p>${data.address}</p>
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
                    src="https://maps.google.com/maps?q=${encodeURIComponent(data.address)}&output=embed&z=15"
                    width="100%" 
                    height="400" 
                    style="border:0; border-radius: 10px;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Location of ${data.businessName}">
                </iframe>
            </div>
            <div class="map-info">
                <div class="map-address">
                    <i class="fas fa-map-marker-alt"></i>
                    <p>${data.address}</p>
                </div>
                <a href="https://maps.google.com/maps?q=${encodeURIComponent(data.address)}" 
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
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-info">
                    <h3>${data.businessName}</h3>
                    <p>${data.keyFacts}</p>
                    <div class="footer-contact">
                        <p><strong>Phone:</strong> <a href="tel:${data.countryCode || '+1'}${data.phone.replace(/\\D/g, '')}">${data.phone}</a></p>
                        ${data.email ? `<p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : ''}
                        <p><strong>Address:</strong> ${data.address}</p>
                        <p><strong>Hours:</strong> ${data.businessHours}</p>
                    </div>
                </div>
                <div class="footer-social">
                    <h4>Follow Us</h4>
                    <div class="social-icons">
                        ${data.facebookUrl ? `<a href="${data.facebookUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Facebook"><i class="fab fa-facebook-f"></i></a>` : ''}
                        ${data.twitterUrl ? `<a href="${data.twitterUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Twitter"><i class="fab fa-twitter"></i></a>` : ''}
                        ${data.linkedinUrl ? `<a href="${data.linkedinUrl}" target="_blank" rel="noopener noreferrer" title="Connect with us on LinkedIn"><i class="fab fa-linkedin-in"></i></a>` : ''}
                        ${data.pinterestUrl ? `<a href="${data.pinterestUrl}" target="_blank" rel="noopener noreferrer" title="Follow us on Pinterest"><i class="fab fa-pinterest-p"></i></a>` : ''}
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} ${data.businessName}. All rights reserved.</p>
            </div>
        </div>
    </footer>

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
    font-family: 'Inter', sans-serif;
    line-height: 1.6;
    color: ${template.colors.text};
    background-color: ${template.colors.background};
    overflow-x: hidden;
}

html {
    scroll-behavior: smooth;
}

/* Modern Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeInRight {
    from {
        opacity: 0;
        transform: translateX(30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

/* Scroll Animation Classes */
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.animate-on-scroll.animated {
    opacity: 1;
    transform: translateY(0);
}

.animate-left {
    transform: translateX(-30px);
}

.animate-left.animated {
    transform: translateX(0);
}

.animate-right {
    transform: translateX(30px);
}

.animate-right.animated {
    transform: translateX(0);
}

/* Loading States */
.loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Location Header Styles */
.location-header {
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary});
    color: white;
    padding: 8px 0;
    font-size: 0.9rem;
    text-align: center;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
}

.location-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

.location-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    position: relative;
    z-index: 1;
}

.location-zips {
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.location-services {
    font-weight: 500;
    opacity: 0.95;
}

/* Header */ 
.header {
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    position: fixed;
    top: 40px;
    left: 0;
    right: 0;
    z-index: 1000;
    border-bottom: 1px solid rgba(255,255,255,0.2);
}

.nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
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
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               radial-gradient(circle at 50% 0%, ${template.colors.secondary}30 0%, transparent 70%);
    background-size: 100% 100%, 200px 100px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.025em;
}

.nav-links {
    display: flex;
    align-items: center;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    margin: 0;
    padding: 0;
}

.nav-menu a {
    text-decoration: none;
    color: #4a5568;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.nav-menu a:hover {
    color: ${template.colors.primary};
    background: ${template.colors.primary}1A;
}

.phone-btn {
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               radial-gradient(circle at 30% 70%, ${template.colors.secondary}40 0%, transparent 50%);
    background-size: 100% 100%, 80px 80px;
    color: white;
    padding: 1rem 2rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.phone-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    filter: brightness(1.1);
}

/* Hero Section */
.hero {
    color: white;
    padding: 160px 0 120px;
    text-align: center;
    margin-top: 120px;
    position: relative;
    overflow: hidden;
    min-height: 80vh;
    display: flex;
    align-items: center;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               radial-gradient(circle at 30% 70%, ${template.colors.secondary}40 0%, transparent 50%),
               conic-gradient(from 0deg at 80% 20%, ${template.colors.accent}30, transparent),
               repeating-linear-gradient(45deg, transparent 0px, transparent 2px, ${template.colors.primary}10 2px, ${template.colors.primary}10 4px);
    animation: backgroundShift 20s ease-in-out infinite alternate;
}

@keyframes backgroundShift {
    0% {
        background-position: 0% 50%, 30% 70%, 80% 20%, 0 0;
    }
    100% {
        background-position: 100% 50%, 70% 30%, 20% 80%, 100% 100%;
    }
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%);
    backdrop-filter: blur(1px);
}

.hero::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
    pointer-events: none;
}

.hero-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
    position: relative;
    z-index: 2;
    animation: heroFadeIn 1.5s ease-out;
}

@keyframes heroFadeIn {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    padding: 8px 20px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    animation: badgePulse 3s ease-in-out infinite;
}

@keyframes badgePulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    }
}

.hero-badge i {
    color: #ffd700;
    font-size: 1rem;
}

.hero-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    text-shadow: 0 4px 20px rgba(0,0,0,0.2);
    letter-spacing: -0.025em;
}

.hero-description {
    font-size: 1.25rem;
    margin-bottom: 2.5rem;
    opacity: 0.95;
    line-height: 1.6;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;
}

.hero-features {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 40px;
}

.hero-feature {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 25px;
    padding: 10px 16px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.hero-feature:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.hero-feature i {
    color: #4ade80;
    font-size: 1rem;
}

.hero-cta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    justify-content: center;
    max-width: 1000px;
    margin: 0 auto;
}

.cta-button {
    padding: 1.25rem 2.5rem;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    letter-spacing: 0.025em;
}

.cta-button.primary {
    background: white;
    color: ${template.colors.primary};
    box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    position: relative;
    overflow: hidden;
}

.cta-button.primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.cta-button.primary:hover::before {
    left: 100%;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 0 0 0 20px rgba(255, 255, 255, 0);
    }
}

.pulse {
    animation: pulse 2s infinite;
}

.cta-button.secondary {
    background: rgba(255,255,255,0.15);
    color: white;
    border: 2px solid rgba(255,255,255,0.8);
    backdrop-filter: blur(10px);
}

.cta-button:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.25);
}

.cta-button.primary:hover {
    background: #f8fafc;
    transform: translateY(-4px) scale(1.05);
}

.cta-button.secondary:hover {
    background: rgba(255,255,255,0.25);
    border-color: white;
}

.cta-button.whatsapp {
    background: #25D366;
    color: white;
    border: none;
    box-shadow: 0 8px 30px rgba(37, 211, 102, 0.3);
}

.cta-button.whatsapp:hover {
    background: #128C7E;
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 15px 40px rgba(37, 211, 102, 0.4);
}

.cta-button.custom {
    background: #8B5CF6;
    color: white;
    border: none;
    box-shadow: 0 8px 30px rgba(139, 92, 246, 0.3);
}

.cta-button.custom:hover {
    background: #7C3AED;
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
}

/* Section CTAs */
.section-cta {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem 0;
}

.cta-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
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
    transition: all 0.3s ease;
}

.contact-main-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(0,0,0,0.15);
}

/* Enhanced Micro-Interactions */
.feature-card, .contact-card {
    position: relative;
    cursor: pointer;
}

.feature-card::after, .contact-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${template.colors.primary}10 0%, ${template.colors.secondary}10 50%, ${template.colors.primary}05 100%),
               linear-gradient(45deg, ${template.colors.primary}08 0%, transparent 70%),
               linear-gradient(-45deg, ${template.colors.secondary}08 0%, transparent 70%);
    background-size: 100% 100%, 60px 60px, 60px 60px;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.feature-card:hover::after, .contact-card:hover::after {
    opacity: 1;
}

.feature-card:active, .contact-card:active {
    transform: scale(0.98);
}

/* Button Enhancements */
.cta-button {
    position: relative;
    overflow: hidden;
}

.cta-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease;
    border-radius: 50%;
    pointer-events: none;
}

.cta-button:active::before {
    width: 200px;
    height: 200px;
}

/* Loading State */
.cta-button.loading {
    pointer-events: none;
    opacity: 0.7;
}

.cta-button.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Improved Typography */
.hero-title, .section-title {
    letter-spacing: -0.02em;
    text-rendering: optimizeLegibility;
}

/* Better Focus States */
.cta-button:focus,
.faq-question:focus {
    outline: 2px solid ${template.colors.primary};
    outline-offset: 2px;
}

/* Performance Optimizations */
.feature-card, .contact-card, .cta-button {
    will-change: transform;
}

/* Scroll Indicators */
.scroll-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               linear-gradient(180deg, ${template.colors.primary}30 0%, transparent 100%);
    background-size: 100% 100%, 100% 50%;
    z-index: 9999;
    transition: width 0.1s ease;
}

/* Testimonials Section */
.testimonials {
    padding: 100px 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    position: relative;
}

.testimonials::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 30%, ${template.colors.primary}0A 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, ${template.colors.secondary}0A 0%, transparent 50%);
    pointer-events: none;
}

.testimonials-carousel {
    position: relative;
    max-width: 800px;
    margin: 0 auto 3rem;
    overflow: hidden;
    border-radius: 20px;
}

.testimonials-track {
    display: flex;
    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
}

.testimonial-card {
    flex: 0 0 100%;
    opacity: 0;
    transform: translateX(20px);
    transition: all 0.5s ease;
}

.testimonial-card.active {
    opacity: 1;
    transform: translateX(0);
}

.testimonial-content {
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
    backdrop-filter: blur(20px);
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    position: relative;
    z-index: 2;
}

.testimonial-stars {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
}

.testimonial-stars i {
    color: #fbbf24;
    font-size: 1.2rem;
    filter: drop-shadow(0 2px 4px rgba(251, 191, 36, 0.3));
}

.testimonial-text {
    font-size: 1.3rem;
    line-height: 1.7;
    color: #374151;
    margin-bottom: 2rem;
    font-style: italic;
    position: relative;
}

.testimonial-text::before,
.testimonial-text::after {
    content: '"';
    font-size: 3rem;
    color: ${template.colors.primary};
    opacity: 0.3;
    font-family: serif;
    position: absolute;
    line-height: 1;
}

.testimonial-text::before {
    top: -0.5rem;
    left: -1rem;
}

.testimonial-text::after {
    bottom: -1.5rem;
    right: -1rem;
}

.testimonial-author {
    display: flex;
    align-items: center;
    justify-content: center;
}

.author-info h4 {
    font-size: 1.1rem;
    font-weight: 600;
    color: ${template.colors.primary};
    margin-bottom: 0.25rem;
}

.author-info p {
    font-size: 0.9rem;
    color: #6b7280;
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
    font-size: 1.3rem;
    margin-bottom: 1.5rem;
    color: #374151;
    font-weight: 500;
}

/* Loading skeleton for images */
.loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Enhanced button loading states */
.cta-button.loading {
    position: relative;
    color: transparent;
    pointer-events: none;
}

.cta-button.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Enhanced contrast for better accessibility */
.section-title {
    color: #1f2937;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.feature-card h3,
.contact-card h3 {
    color: #111827;
    font-weight: 600;
}

/* Improved mobile typography */
@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
        line-height: 1.2;
        margin-bottom: 1rem;
    }
    
    .hero p {
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
    }
    
    .section-title {
        font-size: 2rem;
        margin-bottom: 2rem;
    }
    
    .feature-card,
    .contact-card {
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .testimonial-content {
        padding: 2rem 1.5rem;
    }
    
    .testimonial-text {
        font-size: 1.1rem;
    }
    
    .testimonials-nav {
        gap: 1rem;
    }
    
    .testimonial-nav-btn {
        width: 40px;
        height: 40px;
        font-size: 1rem;
    }
}

/* Enhanced animations for better user experience */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInScale {
    from {
        opacity: 0; 
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.animate-slide-up {
    animation: slideInUp 0.6s ease-out forwards;
}

.animate-fade-scale {
    animation: fadeInScale 0.5s ease-out forwards;
}

/* Performance optimizations */
* {
    box-sizing: border-box;
}

img {
    max-width: 100%;
    height: auto;
    transition: opacity 0.3s ease;
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Additional mobile responsive improvements */
@media (max-width: 480px) {
    .hero {
        padding: 60px 0;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero p {
        font-size: 1rem;
    }
    
    .container {
        padding: 0 1rem;
    }
    
    .feature-grid,
    .faq-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .testimonials {
        padding: 60px 0;
    }
    
    .testimonial-content {
        padding: 1.5rem;
    }
    
    .testimonial-text::before,
    .testimonial-text::after {
        display: none; /* Hide decorative quotes on small screens */
    }
}

/* Enhanced focus states for better accessibility */
button:focus-visible,
a:focus-visible {
    outline: 2px solid ${template.colors.primary};
    outline-offset: 2px;
    border-radius: 4px;
}

/* Improved color contrast ratios */
.hero-subtitle {
    color: #374151; /* Improved contrast */
}

.feature-card p,
.about-text {
    color: #4b5563; /* Better readability */
}

/* Performance: GPU acceleration for animated elements */
.feature-card,
.testimonial-card,
.cta-button,
.nav-menu {
    transform: translateZ(0); /* Force GPU acceleration */
    backface-visibility: hidden;
}

/* Enhanced loading states */
.page-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f4f6;
    border-top: 4px solid ${template.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* Improved visual hierarchy */
.section-subtitle {
    font-size: 1.25rem;
    color: #6b7280;
    margin-bottom: 3rem;
    text-align: center;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Enhanced button variants */
.cta-button.large {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    min-width: 200px;
}

.cta-button.small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

/* Better spacing for content sections */
.content-section {
    margin-bottom: 4rem;
}

.content-section:last-child {
    margin-bottom: 0;
}

.contact-main-cta p {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    opacity: 0.95;
    font-weight: 500;
}

/* Features Section */
.features {
    padding: 100px 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    position: relative;
}

.features::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 10% 20%, ${template.colors.primary}0D 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, ${template.colors.secondary}0D 0%, transparent 50%);
    pointer-events: none;
}

.section-title {
    text-align: center;
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 3rem;
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               conic-gradient(from 45deg at 50% 50%, ${template.colors.primary}30 0deg, transparent 60deg, ${template.colors.secondary}30 120deg, transparent 180deg);
    background-size: 100% 100%, 150px 150px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
    position: relative;
    z-index: 2;
}

.features-grid {
    display: grid;
    grid-template-columns: ${getFeaturesGridColumns()};
    gap: ${WEBSITE_LAYOUT_CONFIG.featuresGap};
    position: relative;
    z-index: 2;
}

.feature-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
    backdrop-filter: blur(20px);
    padding: 2.5rem;
    border-radius: 1.5rem;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    transition: all 0.4s ease;
    border: 1px solid rgba(255,255,255,0.2);
    position: relative;
    overflow: hidden;
}

.feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${template.colors.primary}0D 0%, ${template.colors.secondary}0D 50%, ${template.colors.primary}0A 100%),
               linear-gradient(45deg, ${template.colors.primary}06 25%, transparent 25%, transparent 75%, ${template.colors.secondary}06 75%),
               linear-gradient(-45deg, ${template.colors.secondary}06 25%, transparent 25%, transparent 75%, ${template.colors.primary}06 75%);
    background-size: 100% 100%, 30px 30px, 30px 30px;
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
}

.feature-card:hover::before {
    opacity: 1;
}

.feature-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    border-color: ${template.colors.primary}4D;
}

.feature-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 2rem;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    position: relative;
    z-index: 2;
}

.feature-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: ${template.colors.text};
    position: relative;
    z-index: 2;
}

.feature-card p {
    position: relative;
    z-index: 2;
    line-height: 1.6;
    color: #64748b;
}

/* About Section */
.about {
    padding: 100px 0;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    position: relative;
}

.about::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 30% 20%, ${template.colors.primary}08 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, ${template.colors.secondary}08 0%, transparent 50%);
    pointer-events: none;
}

.about-content {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: calc(40% - 20px) calc(60% + 20px);
    gap: 4rem;
    align-items: center;
    position: relative;
    z-index: 2;
}

.about-text {
    text-align: left;
}

.about-flipped .about-content {
    grid-template-columns: calc(60% + 20px) calc(40% - 20px);
}

.about h2 {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               conic-gradient(from 45deg at 50% 50%, ${template.colors.primary}30 0deg, transparent 60deg, ${template.colors.secondary}30 120deg, transparent 180deg);
    background-size: 100% 100%, 150px 150px;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.025em;
}

.about p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    color: #64748b;
}

.about-image {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    width: 100%;
    height: 100%;
}

.category-image {
    width: 100%;
    height: 400px;
    object-fit: cover;
    transition: transform 0.3s ease;
    display: block;
}

.category-image:hover {
    transform: scale(1.05);
}

.about-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 3rem;
}

.stat {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: ${template.colors.primary};
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* About Section Flipped Layout */
.about-flipped {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Services Section */
.services {
    padding: 80px 0;
    background: #f8fafc;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.service-card {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.service-card:hover {
    transform: translateY(-3px);
}

.service-card i {
    font-size: 2rem;
    color: ${template.colors.primary};
    margin-bottom: 1rem;
}

.service-card h3 {
    font-weight: 600;
    color: ${template.colors.text};
}

/* SEO Content Section */
.seo-content {
    padding: 80px 0;
    background: #f8fafc;
}

.seo-sections {
    display: grid;
    gap: 3rem;
    max-width: 800px;
    margin: 0 auto;
}

.seo-section {
    text-align: center;
    padding: 2rem;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.seo-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.seo-heading {
    font-size: 1.875rem;
    font-weight: 700;
    color: ${template.colors.text};
    margin-bottom: 1rem;
    position: relative;
}

.seo-heading::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: ${template.colors.primary};
    border-radius: 2px;
}

.seo-text {
    font-size: 1.125rem;
    line-height: 1.7;
    color: #64748b;
    margin: 0;
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

@media (min-width: 768px) {
    .seo-sections {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }
    
    .seo-section {
        text-align: left;
    }
    
    .seo-heading::after {
        left: 0;
        transform: none;
    }
}

/* Contact Section */
.contact {
    padding: 80px 0;
    background: ${template.colors.primary};
    color: white;
    text-align: center;
}

.contact .section-title {
    color: white !important;
    background: none !important;
    -webkit-background-clip: unset !important;
    -webkit-text-fill-color: white !important;
}

.contact-description {
    font-size: 1.125rem;
    margin-bottom: 3rem;
    opacity: 0.9;
}

.contact-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.contact-card {
    background: rgba(255,255,255,0.1);
    padding: 2rem;
    border-radius: 1rem;
    backdrop-filter: blur(10px);
}

.contact-card i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.contact-card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.contact-card a {
    color: white;
    text-decoration: none;
}

.contact-card a:hover {
    text-decoration: underline;
}

.business-hours {
    background: rgba(255,255,255,0.1);
    padding: 2rem;
    border-radius: 1rem;
    max-width: 400px;
    margin: 0 auto;
}

.business-hours h3 {
    margin-bottom: 1rem;
}

.business-hours pre {
    font-family: inherit;
    white-space: pre-line;
    font-size: 0.875rem;
}

/* Location Map Section */
.location-map {
    padding: 6rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.location-map .section-title {
    color: #1a202c !important;
    background: linear-gradient(135deg, ${template.colors.primary}, ${template.colors.secondary}) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
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
    background: linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 50%, ${template.colors.primary} 100%),
               radial-gradient(circle at 30% 70%, ${template.colors.secondary}40 0%, transparent 50%),
               radial-gradient(circle at 70% 30%, ${template.colors.primary}40 0%, transparent 50%);
    background-size: 100% 100%, 120px 120px, 120px 120px;
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
    background: #1e293b;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.footer-info h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.footer-contact {
    margin-top: 1rem;
}

.footer-contact p {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.footer-contact a {
    color: white;
    text-decoration: none;
}

.footer-contact a:hover {
    text-decoration: underline;
}

.footer-social {
    text-align: left;
}

.footer-social h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: white;
}

.social-icons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.footer-social .social-icons a {
    width: 45px;
    height: 45px;
    background: ${template.colors.primary};
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 1.2rem;
}

.footer-social .social-icons a:hover {
    background: ${template.colors.secondary};
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.footer-bottom {
    border-top: 1px solid #334155;
    padding-top: 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: #94a3b8;
}

/* FAQ Section */
.faq {
    padding: 100px 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    position: relative;
}

.faq::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
        radial-gradient(circle at 20% 30%, ${template.colors.secondary}0D 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, ${template.colors.primary}0D 0%, transparent 50%);
    pointer-events: none;
}

.faq-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
}

.faq-cta {
    text-align: center;
    margin-top: 3rem;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
    border-radius: 20px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.2);
    position: relative;
    z-index: 2;
}

.faq-cta p {
    font-size: 1.2rem;
    color: #4a5568;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.faq-item {
    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
    backdrop-filter: blur(20px);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid rgba(255,255,255,0.2);
}

.faq-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.faq-question {
    width: 100%;
    padding: 2rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${template.colors.text};
    transition: all 0.3s ease;
    position: relative;
}

.faq-question::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, ${template.colors.primary}0D 0%, ${template.colors.secondary}0D 50%, ${template.colors.primary}0A 100%),
               linear-gradient(45deg, ${template.colors.primary}06 25%, transparent 25%, transparent 75%, ${template.colors.secondary}06 75%),
               linear-gradient(-45deg, ${template.colors.secondary}06 25%, transparent 25%, transparent 75%, ${template.colors.primary}06 75%);
    background-size: 100% 100%, 30px 30px, 30px 30px;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.faq-question:hover::before {
    opacity: 1;
}

.faq-question i {
    color: ${template.colors.primary};
    font-size: 1.3rem;
    transition: transform 0.3s ease;
}

.faq-question.active i {
    transform: rotate(45deg);
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: all 0.4s ease;
    padding: 0 2rem;
}

.faq-answer.active {
    max-height: 250px;
    padding: 0 2rem 2rem;
}

.faq-answer p {
    padding-top: 0.5rem;
    color: #64748b;
    line-height: 1.7;
    font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 992px) and (min-width: 769px) {
    .hero-cta {
        grid-template-columns: ${getFeaturesGridColumns()};
        gap: 0.8rem;
        max-width: 800px;
    }
    
    .cta-button {
        padding: 1rem 1.5rem;
        font-size: 0.95rem;
    }
}

@media (max-width: 768px) {
    .nav {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    
    .nav-brand h1 {
        font-size: 1.5rem;
    }
    
    .hero {
        padding: 120px 0 60px;
    }
    
    .hero-title {
        font-size: 2.5rem;
        line-height: 1.2;
    }
    
    .hero-description {
        font-size: 1.1rem;
    }
    
    .hero-cta {
        grid-template-columns: 1fr;
        gap: 1rem;
        max-width: 320px;
    }
    
    .cta-button {
        width: 100%;
        justify-content: center;
        padding: 1rem 1.5rem;
        font-size: 1rem;
    }
    
    .section-title {
        font-size: 2.2rem;
        margin-bottom: 2.5rem;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .feature-card {
        padding: 2rem 1.5rem;
    }
    
    .feature-icon {
        width: 70px;
        height: 70px;
        font-size: 1.5rem;
    }
    
    .about h2 {
        font-size: 2.2rem;
    }
    
    .about-content {
        grid-template-columns: 1fr;
        gap: 2rem;
        text-align: center;
    }
    
    .about-text {
        text-align: center;
    }
    
    .about-flipped .about-content {
        grid-template-columns: 1fr;
    }
    
    .about-stats {
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .about-image {
        order: -1;
    }
    
    .about-flipped .about-image {
        order: 0;
    }
    
    .category-image {
        height: 250px;
        max-width: 100%;
    }
    
    .seo-sections {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .seo-section {
        text-align: center;
    }
    
    .seo-heading {
        font-size: 1.5rem;
    }
    
    .seo-heading::after {
        left: 50%;
        transform: translateX(-50%);
    }
    
    .contact-info {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    
    .map-info {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .map-container {
        height: 300px;
    }
    
    .faq-question {
        padding: 1.5rem;
        font-size: 1.1rem;
    }
    
    .faq-answer {
        padding: 0 1.5rem;
    }
    
    .faq-answer.active {
        padding: 0 1.5rem 1.5rem;
    }
    
    .footer-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }
    
    /* FAQ Grid Mobile */
    .faq-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    /* CTA Buttons Mobile */
    .cta-button.large {
        font-size: 1.1rem;
        padding: 1.1rem 2rem;
    }
    
    .section-cta p,
    .faq-cta p,
    .contact-main-cta p {
        font-size: 1.1rem;
    }
    
    .contact-main-cta {
        padding: 1.5rem;
    }
    
    .faq-cta {
        padding: 1.5rem;
        margin-top: 2rem;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .section-title {
        font-size: 1.8rem;
    }
    
    .feature-card {
        padding: 1.5rem;
    }
    
    .faq-question {
        padding: 1.25rem;
        font-size: 1rem;
    }
    
    .phone-btn {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
    }
}`;
}

function generateJS(data: BusinessData): string {
  return `// Enhanced Website Interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize all animations and interactions
    initScrollAnimations();
    initSmoothScrolling();
    initHeaderEffects();
    initScrollProgress();
    initFormEnhancements();
    initFAQFunctionality();
    initTestimonialsCarousel();
    initAnalytics();
    initImageOptimization();
    
    // Modern scroll-triggered animations
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const scrollObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    
                    // Add staggered animation for grid items
                    if (entry.target.parentElement.classList.contains('features-grid')) {
                        const index = Array.from(entry.target.parentElement.children).indexOf(entry.target);
                        entry.target.style.animationDelay = \`\${index * 0.1}s\`;
                    }
                }
            });
        }, observerOptions);

        // Apply to all animatable elements
        const animateElements = document.querySelectorAll('.feature-card, .contact-card, .seo-section, .faq-item');
        animateElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            scrollObserver.observe(el);
        });
    }

    // Smooth scrolling for navigation
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Enhanced header scroll effects
    function initHeaderEffects() {
        let ticking = false;
        
        function updateHeader() {
            const header = document.querySelector('.header');
            const scrolled = window.scrollY > 50;
            
            if (scrolled) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(20px)';
                header.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
            } else {
                header.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)';
                header.style.backdropFilter = 'blur(20px)';
                header.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
            }
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        });
    }

    // Scroll progress indicator
    function initScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (progressBar) {
            window.addEventListener('scroll', function() {
                const scrollTop = window.scrollY;
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                progressBar.style.width = scrollPercent + '%';
            });
        }
    }

    // Enhanced form interactions
    function initFormEnhancements() {
        // Add loading states to buttons
        const buttons = document.querySelectorAll('.cta-button');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                if (this.href && (this.href.startsWith('tel:') || this.href.startsWith('mailto:'))) {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                }
            });
        });

        // Add hover effects for interactive elements
        const interactiveElements = document.querySelectorAll('.feature-card, .contact-card, .cta-button');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', function() {
                this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
        });
    }

    // Enhanced FAQ functionality with animations
    function initFAQFunctionality() {
        window.toggleFaq = function(button) {
            const faqItem = button.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const icon = button.querySelector('i');
            const isActive = button.classList.contains('active');
            
            // Close all other FAQ items with animation
            document.querySelectorAll('.faq-question.active').forEach(activeButton => {
                if (activeButton !== button) {
                    const activeItem = activeButton.closest('.faq-item');
                    const activeAnswer = activeItem.querySelector('.faq-answer');
                    const activeIcon = activeButton.querySelector('i');
                    
                    activeButton.classList.remove('active');
                    activeAnswer.classList.remove('active');
                    activeIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current FAQ item with enhanced animation
            if (isActive) {
                button.classList.remove('active');
                answer.classList.remove('active');
                icon.style.transform = 'rotate(0deg)';
            } else {
                button.classList.add('active');
                answer.classList.add('active');
                icon.style.transform = 'rotate(180deg)';
                
                // Smooth scroll to FAQ item if needed
                setTimeout(() => {
                    const rect = faqItem.getBoundingClientRect();
                    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                    if (!isVisible) {
                        faqItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 200);
            }
        };
    }

    // Analytics and user interaction tracking
    function initAnalytics() {
        // Track contact interactions
        document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach(link => {
            link.addEventListener('click', function() {
                const action = this.href.startsWith('tel:') ? 'phone_call' : 'email_click';
                console.log('Contact interaction:', { action, value: this.href });
                
                // Add visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });

        // Track scroll depth for engagement
        let maxScroll = 0;
        const trackScrollDepth = () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                    console.log('Scroll depth:', maxScroll + '%');
                }
            }
        };

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScrollDepth, 100);
        });
    }

    // Add floating animation to key elements
    function addFloatingAnimation() {
        const floatingElements = document.querySelectorAll('.feature-icon');
        floatingElements.forEach((el, index) => {
            el.style.animation = \`float 3s ease-in-out infinite \${index * 0.5}s\`;
        });
    }

    // Initialize after a short delay for better performance
    setTimeout(addFloatingAnimation, 1000);

    // Testimonials no longer use carousel - displaying as simple grid

    // Image optimization and lazy loading
    function initImageOptimization() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            }, { rootMargin: '50px' });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
            
            // Add loading state for all images
            document.querySelectorAll('img').forEach(img => {
                if (!img.complete) {
                    img.classList.add('loading-skeleton');
                    img.addEventListener('load', () => {
                        img.classList.remove('loading-skeleton');
                        img.style.opacity = '1';
                    });
                }
            });
        }
    }

    // Enhanced form validation with visual feedback
    function initFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                const button = form.querySelector('button[type="submit"]');
                if (button) {
                    button.classList.add('loading');
                    button.disabled = true;
                    
                    // Re-enable after 3 seconds (in case of errors)
                    setTimeout(() => {
                        button.classList.remove('loading');
                        button.disabled = false;
                    }, 3000);
                }
            });
        });
    }

    // Initialize form validation
    initFormValidation();
});`;
}
