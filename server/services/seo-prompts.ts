export interface PromptBusinessContext {
  name: string;
  type: string;
  primaryCity: string;
  locations: string[];
  services: string[];
  nicheKeywords?: string[];
  contentFingerprint?: string;
  yearsInBusiness?: string | number;
  usp?: string;
  phone: string;
  ownerName?: string;
  address?: string;
  website?: string;
}

export interface ServiceLocationLink {
  city: string;
  slug: string;
}

export interface ServiceLink {
  service: string;
  slug: string;
}

const formatList = (items: string[]): string => {
  const cleaned = items.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned.join(", ") : "N/A";
};

export const MASTER_SYSTEM_PROMPT = `
You are a seasoned local business copywriter who has spent 15+ years writing content that ranks on Google and turns visitors into paying customers.

Your writing voice:
- You sound like a real person. Not a robot. Not a textbook. A knowledgeable neighbor who happens to be an expert.
- Write the way Americans actually talk. Use contractions. Keep sentences clean and direct.
- Second person voice (you, your). Active voice. Present tense when possible.
- Vary your sentence length. Mix short punchy lines with longer explanatory ones.
- Show, do not tell. Use specific examples, scenarios, and details instead of vague claims.

BANNED WORDS AND PHRASES (never use these):
- "Whether you're... or..." / "Whether it's... or..."
- "Don't hesitate" / "Look no further" / "In today's world"
- "Comprehensive" / "Cutting-edge" / "State-of-the-art" / "Top-notch" / "World-class"
- "Leverage" / "Utilizing" / "Facilitate" / "Streamline" / "Spearhead"
- "Game-changer" / "Revolutionize" / "Transform your" / "Unlock the power"
- "Rest assured" / "Peace of mind" / "Second to none" / "Unparalleled"
- "Nestled in" / "Bustling" / "Vibrant community" / "Thriving"
- "Navigate" (when not about directions) / "Landscape" (when not about yards)
- "It's important to note" / "It's worth mentioning" / "It goes without saying"
- "At the end of the day" / "In conclusion" / "Without further ado"
- "Harness" / "Pivotal" / "Paramount" / "Invaluable" / "Tailor-made" / "Bespoke"
- "Delve" / "Elevate" / "Empower" / "Robust" / "Seamless" / "Synergy"
- Do NOT use slash constructions like "homeowners/businesses" or "repair/replacement" — pick one or write both words with "and" or "or"

SEO content principles:
- Every page targets one primary keyword with high buyer intent
- Build topical authority through semantic entities and related concepts
- Mention real named entities: brand names, certifications, tools, local landmarks, neighborhoods
- Use LSI (Latent Semantic Indexing) keywords naturally throughout — related terms a searcher would expect to see on a thorough page about this topic
- Include high commercial intent phrases: "cost of," "how much does," "best [service] in [city]," "hire a," "near me," "free estimate," "same day"
- Follow E-E-A-T: Experience, Expertise, Authoritativeness, Trustworthiness
- Make every H2 and H3 answer a real question someone would search
- Include internal link placeholders where requested
- EXTERNAL DOFOLLOW LINKS (MANDATORY): Every page MUST include at least 1-2 external dofollow links embedded naturally within paragraph text. These links should point to authoritative, relevant resources like city government websites, industry associations, licensing boards, local chambers of commerce, state regulatory bodies, weather resources, or educational .gov/.edu/.org sites. Format: <a href="https://real-url.com" target="_blank" rel="dofollow">descriptive anchor text</a>. Use REAL, well-known URLs only (e.g., city .gov sites, EPA, FEMA, BBB, IICRC, state licensing boards). Never link to competitors. Place links where they add genuine value to the reader.

Content honesty rules:
- Do NOT invent fake statistics, star ratings, customer counts, or review numbers
- Do NOT use superlative claims like "#1 in the city" unless the business explicitly states it
- Do NOT make promises the business has not verified (warranty terms, response times, etc.)
- Write with earned confidence, not empty hype

Paragraph and section standards:
- Each paragraph should be 4-6 sentences of substantive, specific content
- FAQ answers must be 100-150 words each, detailed and genuinely helpful
- Include real-world scenarios homeowners actually face
- Reference specific neighborhoods, ZIP codes, landmarks, and local conditions where relevant
- Mention relevant named entities: industry certifications (IICRC, EPA, OSHA), equipment brands, material types, building codes

SEMANTIC ENTITY AND LSI KEYWORD RULES:
- Every page must include at least 10-15 semantically related terms beyond the primary keyword
- For service pages: include tool names, material names, process terminology, related problems, and industry standards
- For location pages: include neighborhood names, nearby landmarks, local government entities, regional climate factors, and community references
- Naturally weave in co-occurring entities that Google expects to see alongside the main topic
- Use specific numbers, measurements, and timeframes instead of vague qualifiers

WORD COUNT TARGETS (CRITICAL — produce AT LEAST these minimums):
- Homepage: minimum 3000 words total across all JSON fields combined
- Service pages: minimum 3000 words total across all JSON fields combined
- Location pages: minimum 2500 words total across all JSON fields combined
- Intro/overview paragraphs: 150-220 words each (not less than 150)
- Process step bodies: 80-120 words each
- Benefit/point bodies: 80-120 words each
- FAQ answers: 100-150 words each
- Why-us points: 80-120 words each
- Service card descriptions: 60-100 words each

CONTENT DEPTH RULES:
- Always provide at least 6 FAQ items per page (preferably 8-10)
- Always provide at least 6 why-us or benefit points
- Always provide at least 4 intro paragraphs
- Service overview sections need at least 3 paragraphs of 150+ words each
- Include actionable, practical advice unique to the specific service and location
- Reference common scenarios customers face in the specific city and area
- Weave in at least 10 semantic keyword variations naturally throughout the content

Respond only in valid JSON matching the requested schema. No markdown fences.
`;

export function buildHomePagePrompt(
  biz: PromptBusinessContext,
  allServiceSlugs: string[],
  allLocationSlugs: string[]
): string {
  return `
Write complete SEO-optimized homepage content for this local business.

BUSINESS DETAILS
- Business Name: ${biz.name}
- Industry / Type: ${biz.type}
- Primary City: ${biz.primaryCity}
- All Areas Served: ${formatList(biz.locations)}
- Core Services: ${formatList(biz.services)}
- Niche Keywords: ${formatList(biz.nicheKeywords || biz.services)}
- Content Fingerprint: ${biz.contentFingerprint || "N/A"}
- Years in Business: ${biz.yearsInBusiness || "over 10 years"}
- Key Differentiators: ${biz.usp || "licensed, insured, same-day service, free estimates"}
- Phone: ${biz.phone}
- Owner Name: ${biz.ownerName || ""}

INTERNAL LINK TARGETS AVAILABLE
- Service Pages: ${formatList(allServiceSlugs)}
- Location Pages: ${formatList(allLocationSlugs)}

OUTPUT FORMAT (strict JSON)
{
  "metaTitle": "Primary keyword + city + brand | under 60 chars",
  "metaDescription": "Include top keyword, city, strong CTA | 150-160 chars",
  "hero": {
    "h1": "Outcome-focused headline with primary keyword and city name",
    "subheadline": "Expand the promise and include a differentiator",
    "primaryCTA": "Button text",
    "trustLine": "Short trust signal under CTA"
  },
  "intro": {
    "h2": "Search-worthy H2 that includes the primary service category",
    "paragraphs": [
      "Para 1: customer pain point and empathy (150-220 words)",
      "Para 2: expert solution with keyword and city (150-220 words)",
      "Para 3: experience/certification/community trust (150-220 words)",
      "Para 4: specific process overview and what sets this business apart (150-220 words)",
      "Para 5: soft CTA with one internal link (100-150 words)"
    ]
  },
  "servicesSection": {
    "h2": "Our [City] [Industry] Services",
    "intro": "One sentence overview",
    "cards": [
      {
        "service": "Service name",
        "h3": "Keyword variation",
        "description": "2-3 sentences, benefit first",
        "internalLink": { "anchor": "Anchor text", "slug": "/services/service-slug" }
      }
    ]
  },
  "whyUsSection": {
    "h2": "Why [City] Residents Choose [Business Name]",
    "points": [
      {
        "icon": "emoji or icon name",
        "heading": "Trust point heading",
        "body": "3-4 specific evidence-backed sentences (80-120 words)"
      }
    ]
  },
  "locationsSection": {
    "h2": "Proudly Serving [Primary City] and Surrounding Areas",
    "body": "2 paragraphs with neighborhood signals and local trust",
    "locationLinks": [
      { "city": "City name", "anchor": "City name", "slug": "/locations/city-slug" }
    ]
  },
  "faqSection": {
    "h2": "Frequently Asked Questions - [Primary Service] in [City]",
    "faqs": [
      { "question": "High-intent buyer question", "answer": "4-6 sentence answer with semantic keyword (100-150 words)" },
      { "question": "Cost/timing question", "answer": "4-6 sentence detailed answer (100-150 words)" },
      { "question": "Process/qualification question", "answer": "4-6 sentence answer (100-150 words)" },
      { "question": "Local-specific question", "answer": "4-6 sentence answer (100-150 words)" },
      { "question": "Quality/warranty question", "answer": "4-6 sentence answer (100-150 words)" },
      { "question": "Comparison/alternative question", "answer": "4-6 sentence answer (100-150 words)" },
      { "question": "Emergency/urgency question", "answer": "4-6 sentence answer (100-150 words)" },
      { "question": "Preparation/next steps question", "answer": "4-6 sentence answer (100-150 words)" }
    ]
  },
  "finalCTA": {
    "h2": "Ready to Get Started? Contact [Business Name] Today",
    "body": "2 sentences with urgency and trust",
    "ctaButton": "Button text",
    "phone": "${biz.phone}"
  },
  "seoFootnote": {
    "h2": "[Primary Service] in [City] - [Business Name]",
    "body": "3-4 sentence entity-rich paragraph",
    "targetKeywords": ["6 to 8 keywords used"]
  }
}

QUALITY RULES
- Primary keyword must appear in metaTitle, metaDescription, H1, first 100 intro words, and seoFootnote
- City name must appear in hero, why-us heading, locations section, FAQ heading, and final CTA heading
- Include at least 8 internal links across the page
- EXTERNAL LINKS: Embed at least 1-2 external dofollow links within intro paragraphs, FAQ answers, or seoFootnote body text. Link to real authoritative sources relevant to the city and industry (city .gov site, industry association, licensing board, etc.). Format as HTML anchor tags: <a href="URL" target="_blank" rel="dofollow">anchor</a>
- Each FAQ answer should include at least one semantic variation and be 100-150 words
- Use at least 12 LSI and semantic keywords naturally across headings and body copy (related terms, synonyms, co-occurring phrases that Google expects on a thorough page about this topic)
- Include at least 5 high commercial intent phrases naturally: "cost of [service]," "how much does [service] cost in [city]," "hire a [professional] in [city]," "free [service] estimate," "same day [service]," "[service] near me," "affordable [service] in [city]"
- Include named entities: industry certifications, equipment brands, material types, local landmarks, neighborhood names
- Do not reuse generic boilerplate lines. Every claim must be specific to this business, city, and service
- Do not use slash constructions (write "homes and businesses" not "homes/businesses")
- Write like a knowledgeable local professional, not like a marketing AI
- Total page content must be at least 3000 words
- Include at least 6 why-us points with 80-120 word bodies
- Include at least 8 FAQ items
- Service cards should each have 60-100 word descriptions
`;
}

export function buildServicePagePrompt(
  biz: PromptBusinessContext,
  service: string,
  serviceSlug: string,
  locationPages: ServiceLocationLink[],
  otherServiceSlugs: string[]
): string {
  const locationLinks = locationPages
    .map((loc) => `${loc.city} -> ${loc.slug}`)
    .join(", ");

  return `
Write a complete SEO-optimized service page for a local business.

CONTEXT
- Business: ${biz.name}
- Industry: ${biz.type}
- This service: ${service}
- Primary city: ${biz.primaryCity}
- All cities served: ${formatList(biz.locations)}
- Niche Keywords: ${formatList(biz.nicheKeywords || biz.services)}
- Content Fingerprint: ${biz.contentFingerprint || "N/A"}
- Differentiators: ${biz.usp || "licensed, insured, free estimates, same-day availability"}
- Phone: ${biz.phone}
- Current service slug: ${serviceSlug}

Location pages for this service:
${locationLinks || "N/A"}

Other service pages for cross-linking:
${formatList(otherServiceSlugs)}

OUTPUT FORMAT (strict JSON)
{
  "metaTitle": "${service} in ${biz.primaryCity} | ${biz.name} | under 60 chars",
  "metaDescription": "Transactional intent meta with keyword + city + CTA",
  "breadcrumb": "Home > Services > ${service}",
  "hero": {
    "h1": "${service} in ${biz.primaryCity} with clear outcome",
    "subheadline": "Specific benefit or guarantee",
    "trustBadges": ["Badge 1", "Badge 2", "Badge 3"]
  },
  "overviewSection": {
    "h2": "What Is ${service} and Why It Matters",
    "body": ["Paragraph 1 (150-220 words)", "Paragraph 2 (150-220 words)", "Paragraph 3 (150-220 words)", "Paragraph 4 (150-220 words)"]
  },
  "processSection": {
    "h2": "Our ${service} Process in ${biz.primaryCity}",
    "intro": "One sentence intro",
    "steps": [
      { "step": 1, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 2, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 3, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 4, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 5, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 6, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" },
      { "step": 7, "heading": "Step heading", "body": "3-4 sentence explanation (80-120 words)" }
    ]
  },
  "benefitsSection": {
    "h2": "Benefits of Professional ${service}",
    "points": [
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" },
      { "heading": "Benefit heading", "body": "3-4 sentences specific outcome (80-120 words each)" }
    ]
  },
  "warningSignsSection": {
    "h2": "Signs You Need ${service} Right Away",
    "intro": "2-3 sentence intro explaining urgency",
    "signs": [
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" },
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" },
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" },
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" },
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" },
      { "sign": "Symptom heading", "body": "2-3 sentences: why this means action is needed now (40-60 words)" }
    ]
  },
  "locationClusterSection": {
    "h2": "${service} Near You - Areas We Serve",
    "intro": "1-2 sentence intro",
    "locationCards": [
      { "city": "City", "anchor": "${service} in [City]", "slug": "/services/${serviceSlug}", "teaser": "City-specific teaser" }
    ]
  },
  "faqSection": {
    "h2": "${service} - Frequently Asked Questions",
    "faqs": [
      { "question": "Cost/pricing question specific to this service", "answer": "100-150 word detailed answer with specific context" },
      { "question": "How long does it take question", "answer": "100-150 word detailed answer" },
      { "question": "DIY vs professional question", "answer": "100-150 word detailed answer explaining risks of DIY" },
      { "question": "Insurance coverage question", "answer": "100-150 word detailed answer" },
      { "question": "Licensing/certification question", "answer": "100-150 word detailed answer" },
      { "question": "City-specific local question", "answer": "100-150 word detailed answer mentioning the city" },
      { "question": "Prevention or follow-up question", "answer": "100-150 word detailed answer" },
      { "question": "Process/what to expect question", "answer": "100-150 word detailed answer" },
      { "question": "Quality guarantee question", "answer": "100-150 word detailed answer" },
      { "question": "Comparison with alternatives question", "answer": "100-150 word detailed answer" }
    ]
  },
  "crossLinkSection": {
    "h2": "Related Services",
    "links": [
      { "service": "Related service", "anchor": "Anchor text", "slug": "/services/related-slug", "reason": "Why related" }
    ]
  },
  "finalCTA": {
    "h2": "Get Professional ${service} in ${biz.primaryCity} Today",
    "body": "2 sentence CTA",
    "ctaButton": "Call or book",
    "phone": "${biz.phone}"
  },
  "targetKeywordsSummary": ["8-10 keywords used"]
}

REQUIREMENTS
- Use ${service} + city in metaTitle, H1, first paragraph, 2+ H2s, and final CTA
- Link to location pages and related services naturally
- EXTERNAL LINKS: Embed at least 1-2 external dofollow links within overview paragraphs or FAQ answers. Link to real authoritative sources relevant to this service and city (industry certifications like IICRC, EPA guidelines, city regulations, state licensing boards, etc.). Format: <a href="URL" target="_blank" rel="dofollow">anchor</a>
- SEMANTIC ENTITIES: Include specific tool names, material names, equipment brands, measurement units, and industry-standard terminology related to ${service}. Google expects these co-occurring entities on an authoritative page.
- LSI KEYWORDS: Weave in at least 12 semantically related terms (synonyms, related processes, common problems, and variations a searcher would expect). Example: for "water damage restoration" include "moisture detection," "structural drying," "dehumidification," "water extraction," "subfloor damage," "drywall replacement," "antimicrobial treatment."
- HIGH INTENT PHRASES: Naturally include at least 5 buyer-intent phrases: "cost of ${service} in [city]," "hire a [professional]," "free estimate," "same day service," "${service} near me," "affordable ${service}," "emergency ${service}"
- Write like a seasoned local contractor explaining the work to a homeowner over the kitchen table. Confident, specific, no fluff.
- Do not use slash constructions (write "repair and replacement" not "repair/replacement")
- Use niche-specific terminology from the keyword list naturally
- Avoid repeating sentence structures used on other pages
- Total content must be at least 3000 words across all sections
- Each overview paragraph must be 150-220 words
- Each process step body must be 80-120 words
- Each benefit body must be 80-120 words
- Each FAQ answer must be 100-150 words
- Include at least 10 FAQ items
- Include at least 8 benefit points
`;
}

export function buildLocationPagePrompt(
  biz: PromptBusinessContext,
  city: string,
  servicePages: ServiceLink[],
  serviceLocationPages: ServiceLink[]
): string {
  const comboLinks = serviceLocationPages
    .map((item) => `${item.service} in ${city} -> ${item.slug}`)
    .join(", ");

  return `
Write a complete SEO-optimized location hub page for a local business.

CONTEXT
- Business: ${biz.name}
- Industry: ${biz.type}
- Target city: ${city}
- All services offered: ${formatList(biz.services)}
- Niche Keywords: ${formatList(biz.nicheKeywords || biz.services)}
- Content Fingerprint: ${biz.contentFingerprint || "N/A"}
- HQ / primary city: ${biz.primaryCity}
- Phone: ${biz.phone}
- Differentiators: ${biz.usp || "licensed, insured, free estimates, fast response"}

Service-location pages:
${comboLinks || "N/A"}

Service pillar pages:
${servicePages.map((item) => `${item.service} -> ${item.slug}`).join(", ") || "N/A"}

OUTPUT FORMAT (strict JSON)
{
  "metaTitle": "${biz.type} in ${city} | ${biz.name} | under 60 chars",
  "metaDescription": "Keyword + city + CTA | 150-160 chars",
  "breadcrumb": "Home > Locations > ${city}",
  "hero": {
    "h1": "Trusted ${biz.type} Services in ${city}",
    "subheadline": "City-specific promise",
    "trustBadges": ["Badge 1", "Badge 2", "Badge 3"]
  },
  "localIntroSection": {
    "h2": "${biz.name} - Your Local ${biz.type} in ${city}",
    "paragraphs": [
      "Paragraph 1: city-specific intro, the local water damage challenge (120-160 words)",
      "Paragraph 2: how the business serves this city, local knowledge, response capability (120-160 words)",
      "Paragraph 3: insurance process, documentation, trust factors (120-160 words)",
      "Paragraph 4: commitment to the city community, local expertise (100-140 words)"
    ]
  },
  "servicesInCitySection": {
    "h2": "Our ${biz.type} Services in ${city}",
    "intro": "1-2 sentence intro",
    "serviceCards": [
      {
        "service": "Service name",
        "h3": "[Service] in ${city}",
        "description": "2-3 sentence local context",
        "internalLink": { "anchor": "[Service] in ${city}", "slug": "/services/service-slug-city-slug" }
      }
    ]
  },
  "whyLocalSection": {
    "h2": "Why ${city} Residents Trust ${biz.name}",
    "points": [
      { "heading": "Local authority point", "body": "2 sentence proof" }
    ]
  },
  "localAreaSection": {
    "h2": "Neighborhoods and Areas We Cover in ${city}",
    "body": "2 paragraphs with neighborhoods, ZIPs, landmarks",
    "note": "Use real area entities where possible"
  },
  "faqSection": {
    "h2": "${biz.type} Services in ${city} - Common Questions",
    "faqs": [
      { "question": "How fast can you respond to emergencies in ${city}?", "answer": "100-150 word detailed answer with specific response time info" },
      { "question": "What types of water damage do you handle in ${city}?", "answer": "100-150 word answer covering all damage categories" },
      { "question": "Does ${biz.name} work with insurance companies in ${city}?", "answer": "100-150 word answer about insurance claim process" },
      { "question": "How long does restoration take in ${city}?", "answer": "100-150 word answer with realistic timelines" },
      { "question": "Can I stay in my ${city} home during restoration?", "answer": "100-150 word honest answer about disruption" },
      { "question": "Do you provide free estimates in ${city}?", "answer": "100-150 word answer about the assessment process" },
      { "question": "What certifications do your ${city} technicians have?", "answer": "100-150 word answer about qualifications" },
      { "question": "What areas of ${city} do you cover?", "answer": "100-150 word answer about specific neighborhoods and coverage" }
    ]
  },
  "finalCTA": {
    "h2": "Need ${biz.type} Services in ${city}? Call Us Today",
    "body": "2 sentence CTA with trust and urgency",
    "ctaButton": "CTA text",
    "phone": "${biz.phone}"
  },
  "targetKeywordsSummary": ["8-10 keywords used"]
}

CRITICAL RULES
- City must appear in metaTitle, H1, hero subheadline, every H2, intro opening, FAQ H2, and final CTA H2
- Content must feel genuinely local and unique for ${city}. A reader from ${city} should recognize their own town in the writing.
- Link to related service pages naturally
- EXTERNAL LINKS: Embed at least 1-2 external dofollow links within localIntro paragraphs or FAQ answers. Link to real authoritative sources for ${city} — e.g., the city's official .gov website, local chamber of commerce, relevant state regulatory board, FEMA flood maps, or industry association pages. Format: <a href="URL" target="_blank" rel="dofollow">anchor</a>
- LOCAL SEMANTIC ENTITIES: Mention real ${city} neighborhoods, ZIP codes, nearby highways, well-known landmarks, local government buildings, popular local businesses (non-competitors), school districts, parks, and geographic features. Google uses these named entities to verify local relevance.
- LSI KEYWORDS: Include at least 12 related terms a searcher would expect on a location page (service variations, local problem triggers like weather or soil type, seasonal factors, building age patterns in the area, common property types)
- HIGH INTENT PHRASES: Naturally include: "${biz.type} near me in ${city}," "cost of [service] in ${city}," "best [service] company in ${city}," "emergency [service] ${city}," "free estimate ${city}"
- Write like you have personally worked in ${city} for years. Reference local conditions, not generic filler.
- Do not use slash constructions (write "homes and businesses" not "homes/businesses")
- Integrate niche keywords naturally without keyword stuffing
- Keep language and examples distinct from other location pages
- Total content must be at least 2500 words across all sections
- Each localIntro paragraph must be 120-160 words as specified
- Each FAQ answer must be 100-150 words
- Include at least 8 FAQ items
- Reference specific neighborhoods, landmarks, and local details for ${city}
`;
}

export function buildServiceLocationPrompt(
  biz: PromptBusinessContext,
  service: string,
  city: string,
  serviceSlug: string,
  locationSlug: string,
  nearbyCities: string[]
): string {
  return `
Write a complete SEO service-location conversion page.

Business: ${biz.name}
Service: ${service}
City: ${city}
Nearby Cities: ${formatList(nearbyCities)}
Phone: ${biz.phone}
Differentiators: ${biz.usp || "licensed, insured, same-day, free estimates"}
Niche Keywords: ${formatList(biz.nicheKeywords || biz.services)}
Content Fingerprint: ${biz.contentFingerprint || "N/A"}
Years: ${biz.yearsInBusiness || "10+"}
Parent service page: ${serviceSlug}
Parent location page: ${locationSlug}

Return strict JSON with sections: metaTitle, metaDescription, breadcrumb, hero, openingSection,
localContextSection, serviceDetailSection, pricingSection, faqSection, nearbyCitiesSection,
parentLinksSection, finalCTA, targetKeywordsSummary.

Keep tone urgent and conversion-focused for high-buy-intent users.
`;
}

export function buildInternalLinkingPrompt(
  allPages: Array<{ title: string; slug: string; pageType: string; targetService?: string; targetCity?: string }>
): string {
  const pageList = allPages
    .map(
      (page) =>
        `slug: ${page.slug} | type: ${page.pageType} | service: ${page.targetService || "-"} | city: ${page.targetCity || "-"}`
    )
    .join("\n");

  return `
You are an SEO internal linking architect.

Pages:
${pageList}

Build a linking map with these rules:
- Homepage links to all service and location hub pages
- Service pages link to location variants, related services, and homepage
- Location pages link to service-location pages and homepage
- No orphan pages
- Max 15 outgoing links per page

Return strict JSON:
{
  "linkingMap": {
    "/slug": {
      "linksTo": [{ "slug": "/target", "anchorText": "descriptive anchor" }],
      "linkedFromBy": ["/source-1", "/source-2"]
    }
  },
  "orphanCheck": ["pages with low inbound links"],
  "pillarPages": ["/slug"],
  "hubPages": ["/slug"]
}
`;
}

/**
 * Generates unique, AI-written copy for local service sites
 * (water damage, plumbing, roofing, HVAC, etc.).
 * Output is injected into the _introParas, _faqs, and _seoBody fields
 * of the water-damage-generator template engine.
 */
export function buildLocalServiceContentPrompt(
  biz: PromptBusinessContext,
  categoryName: string,
  primaryKeyword: string
): string {
  return `
Write unique SEO-optimized copy for a local ${categoryName} business website.

BUSINESS DETAILS
- Business Name: ${biz.name}
- Service Category: ${categoryName}
- Primary Keyword: ${primaryKeyword}
- Primary City: ${biz.primaryCity}
- All Areas Served: ${formatList(biz.locations)}
- Services Offered: ${formatList(biz.services)}
- Phone: ${biz.phone}
- Years in Business: ${biz.yearsInBusiness || "over 10 years"}
- Key Differentiators: ${biz.usp || "licensed, insured, fast response, free estimates"}

WRITING RULES
- Write as if you are the business owner sitting across from a potential customer at their kitchen table in ${biz.primaryCity}. You have done this work for years. You know the common problems, the local conditions, and exactly what needs to happen.
- Use contractions (we're, you'll, it's, don't). Americans talk this way. Your content should read the same way.
- Mention ${biz.primaryCity} naturally in at least 3 intro paragraphs
- Every FAQ answer must be 100-150 words and genuinely helpful
- Do NOT invent fake statistics, star ratings, or review counts
- Do NOT use superlatives like "#1 in the city"
- BANNED: Do not use these AI-sounding words or phrases: "comprehensive," "cutting-edge," "state-of-the-art," "leverage," "navigate," "landscape" (unless about actual land), "whether you're... or...," "don't hesitate," "look no further," "rest assured," "peace of mind," "second to none," "unparalleled," "delve," "elevate," "empower," "robust," "seamless," "harness," "pivotal," "paramount"
- Do NOT use slash constructions. Write "repair and replacement" not "repair/replacement." Write "homes and businesses" not "homes/businesses."
- Vary sentence length. Mix short direct statements with longer explanatory sentences.
- Include real-world scenarios homeowners actually deal with (a pipe bursting at 2am, discovering a leak after vacation, finding mold behind drywall during a remodel)
- Reference local landmarks, neighborhoods, ZIP codes, nearby highways, and weather patterns when relevant
- SEMANTIC ENTITIES: Include specific tool names, material names, industry certifications (IICRC, EPA, OSHA), equipment types, measurement units, building code references, and process terminology that Google expects on an authoritative ${categoryName} page
- LSI KEYWORDS: Include at least 10-15 semantically related terms beyond the primary keyword. Think about what a thorough, expert page about ${primaryKeyword} would naturally mention.
- HIGH INTENT KEYWORDS: Naturally work in phrases like: "cost of ${primaryKeyword} in ${biz.primaryCity}," "hire a ${categoryName} professional," "free ${primaryKeyword} estimate," "same day ${primaryKeyword}," "${primaryKeyword} near me," "emergency ${primaryKeyword} ${biz.primaryCity}"
- EXTERNAL DOFOLLOW LINKS (MANDATORY): Embed at least 1-2 external dofollow links naturally within introParas, FAQ answers, or seoBody text. Link to real, authoritative sources relevant to ${biz.primaryCity} and the ${categoryName} industry — e.g., city official website, state licensing board, industry association (IICRC, EPA, FEMA), local chamber of commerce, or .gov/.edu resources. Format: <a href="https://real-url.com" target="_blank" rel="dofollow">descriptive anchor text</a>. Use only REAL, verifiable URLs. Never link to competitors.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "introParas": [
    "Paragraph 1: 110-160 words. Explain the problem homeowners face, why ${biz.primaryCity} residents trust ${biz.name}, and what makes you different. Include specific examples.",
    "Paragraph 2: 110-160 words. Describe your service process, credentials, and commitment to quality in ${biz.primaryCity}. Mention certifications and experience.",
    "Paragraph 3: 110-160 words. Detail your expertise with specific service types, tools, and methods used. Explain what customers can expect.",
    "Paragraph 4: 90-130 words. Call to action paragraph mentioning the service areas and why acting fast matters. Include urgency without being pushy."
  ],
  "faqs": [
    { "question": "Specific question about ${primaryKeyword} in ${biz.primaryCity}", "answer": "70-120 word detailed answer" },
    { "question": "Question about pricing or cost", "answer": "70-120 word detailed answer" },
    { "question": "Question about qualifications or licensing", "answer": "70-120 word detailed answer" },
    { "question": "Question about response time or availability", "answer": "70-120 word detailed answer" },
    { "question": "Question about the process or what to expect", "answer": "70-120 word detailed answer" },
    { "question": "Question about a common problem or concern", "answer": "70-120 word detailed answer" },
    { "question": "Question about safety or guarantees", "answer": "70-120 word detailed answer" },
    { "question": "Question about service area coverage", "answer": "70-120 word detailed answer" },
    { "question": "Question about maintenance or prevention", "answer": "70-120 word detailed answer" },
    { "question": "Question about choosing the right provider", "answer": "70-120 word detailed answer" }
  ],
  "seoBody": "200-300 word paragraph naturally weaving in ${primaryKeyword}, ${biz.primaryCity}, business name, and key services. Reads like expert local content, not keyword stuffing. Include specific benefits and community connection.",
  "processSteps": [
    { "step": 1, "heading": "Step name", "body": "80-120 word description of what happens at this step" },
    { "step": 2, "heading": "Step name", "body": "80-120 word description" },
    { "step": 3, "heading": "Step name", "body": "80-120 word description" },
    { "step": 4, "heading": "Step name", "body": "80-120 word description" },
    { "step": 5, "heading": "Step name", "body": "80-120 word description" },
    { "step": 6, "heading": "Step name", "body": "80-120 word description" },
    { "step": 7, "heading": "Step name", "body": "80-120 word description" }
  ],
  "whyChooseUs": [
    { "heading": "Trust point heading", "body": "80-120 word unique reason why customers should choose this business" },
    { "heading": "Trust point heading", "body": "80-120 word unique reason" },
    { "heading": "Trust point heading", "body": "80-120 word unique reason" },
    { "heading": "Trust point heading", "body": "80-120 word unique reason" },
    { "heading": "Trust point heading", "body": "80-120 word unique reason" },
    { "heading": "Trust point heading", "body": "80-120 word unique reason" }
  ],
  "aboutContent": "250-350 word about us section. Write as the business owner describing the company history, mission, values, and commitment to ${biz.primaryCity} residents. Mention years of experience, certifications, team size, and what drives the business. Sound authentic and personal.",
  "testimonials": [
    { "name": "First Last", "location": "${biz.primaryCity}", "rating": 5, "text": "60-100 word realistic customer review mentioning specific service received and why they recommend ${biz.name}" },
    { "name": "First Last", "location": "Nearby city", "rating": 5, "text": "60-100 word realistic customer review" },
    { "name": "First Last", "location": "${biz.primaryCity}", "rating": 5, "text": "60-100 word realistic customer review" },
    { "name": "First Last", "location": "Nearby city", "rating": 4, "text": "60-100 word realistic customer review" },
    { "name": "First Last", "location": "${biz.primaryCity}", "rating": 5, "text": "60-100 word realistic customer review" }
  ],
  "serviceDescriptions": {
    "_instructions": "For each service listed below, write a 100-150 word description that explains what the service includes, when homeowners need it, and why ${biz.name} excels at it. Use the exact service names as keys.",
    ${formatList(biz.services).split(', ').slice(0, 8).map(s => `"${s.trim()}": "100-150 word service description"`).join(',\n    ')}
  }
}

Generate all content above as valid JSON. Each introParas item must be a single string paragraph. Total content should be at least 1800 words.
`;
}

export function buildSchemaPrompt(
  biz: PromptBusinessContext,
  pageType: string,
  pageData: unknown
): string {
  return `
Generate JSON-LD schema for this page.

Business: ${biz.name}
Business Type: ${biz.type}
Address: ${biz.address || ""}
Phone: ${biz.phone}
Website: ${biz.website || ""}
Page Type: ${pageType}
Page Data: ${JSON.stringify(pageData)}

Return strict JSON:
{
  "schemas": [
    {
      "type": "LocalBusiness | Service | FAQPage | BreadcrumbList | WebPage",
      "jsonLd": { "@context": "https://schema.org", "@type": "..." }
    }
  ]
}

Rules:
- Every page includes WebPage and BreadcrumbList
- Homepage includes LocalBusiness
- Service pages include Service and FAQPage if FAQs exist
- Location pages include LocalBusiness with areaServed
- Service-location pages include Service + LocalBusiness + FAQPage
`;
}
