/**
 * Local Service Category Configs
 * Each category drives: wizard defaults, generator copy, calculator tabs, SEO schema.
 * Add a new vertical by adding one more CategoryConfig entry to CATEGORIES.
 */

export interface CalculatorTab {
  id: string;
  label: string;
  fields: CalculatorField[];
  resultLabel: string;
  baseMin: number;
  baseMax: number;
}

export interface CalculatorField {
  id: string;
  label: string;
  type: 'select' | 'number' | 'checkbox';
  options?: { label: string; value: number }[];  // for select — multiplier or adder
  adder?: number;   // for checkbox — flat add
}

export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;              // emoji for wizard card
  tagline: string;           // short description for wizard card
  isEmergency: boolean;
  defaultPrimaryKeyword: string;
  defaultPalette: { primary: string; secondary: string };
  defaultServices: string[];

  copy: {
    heroTagline: string;
    heroSubheading: string;
    ctaHeadline: string;
    ctaSubtext: string;
    ctaButton: string;
    trustBadges: string[];       // 3 badges shown in hero/header
    whyUsPoints: string[];       // 4 points in "Why Choose Us" section
    emergencyBadge?: string;     // e.g. "24/7 Emergency Service"
    // Service page benefit cards (6 items)
    servicePageBenefits?: Array<{ heading: string; body: string }>;
    // Homepage section overrides
    schemaDescription?: string;
    schemaOfferCatalogName?: string;
    footerEmergencyText?: string;
    whatsappMessage?: string;
    introParas?: string[];
    processH2?: string;
    processSteps?: Array<{ step: number; heading: string; body: string }>;
    faqH2?: string;
    faqs?: Array<{ question: string; answer: string }>;
    seoBody?: string;
  };

  seo: {
    schemaType: string;
    metaDescriptionTemplate: string;  // uses {{city}}, {{keyword}}, {{businessName}}
  };

  calculator: {
    enabled: boolean;
    title: string;
    tabs: CalculatorTab[];
  };
}

// ─── Water Damage ─────────────────────────────────────────────────────────────

const waterDamageConfig: CategoryConfig = {
  id: 'water-damage',
  name: 'Water Damage Restoration',
  icon: '💧',
  tagline: 'Emergency restoration & drying',
  isEmergency: true,
  defaultPrimaryKeyword: 'Water Damage Restoration',
  defaultPalette: { primary: '#1e3a5f', secondary: '#0ea5e9' },
  defaultServices: [
    'Water Damage Restoration',
    'Residential Water Damage Restoration',
    'Commercial Water Damage Restoration',
    'Emergency Water Extraction',
    'Flood Cleanup & Flood Damage Repair',
    'Structural Drying & Dehumidification',
    'Crawl Space Water Damage',
    'Basement Flooding Cleanup',
    'Sewage Cleanup & Biohazard Removal',
    'Mold Remediation & Prevention',
    'Fire & Smoke Damage Restoration',
    'Storm Damage Restoration',
  ],
  copy: {
    heroTagline: 'Fast Response. Certified Experts.',
    heroSubheading: '24/7 emergency water damage restoration — we arrive fast, dry thoroughly, and restore completely.',
    ctaHeadline: 'Water Damage Emergency?',
    ctaSubtext: 'Every minute counts. Standing water causes mold within 24–48 hours. Call now for immediate response.',
    ctaButton: 'Call Now — Free Inspection',
    emergencyBadge: '24/7 Emergency Response',
    servicePageBenefits: [
      { heading: 'IICRC-Certified Restoration', body: 'Every technician holds current IICRC certifications — ensuring your property is restored to industry-recognized standards, not guesswork.' },
      { heading: 'Stops Damage from Spreading', body: 'Fast professional response limits how far water migrates into walls, floors, and structural cavities — reducing total repair scope and cost.' },
      { heading: 'Prevents Mold Growth', body: 'Thorough structural drying to IICRC moisture targets eliminates the conditions mold needs to establish — protecting your family\'s health.' },
      { heading: 'Full Insurance Documentation', body: 'We provide complete moisture logs, equipment records, and photos your adjuster needs — streamlining your claim from day one.' },
      { heading: 'Industrial Equipment', body: 'Truck-mounted extractors and professional-grade drying systems work dramatically faster than consumer equipment, shortening your disruption.' },
      { heading: 'Single Point of Contact', body: 'We manage the entire project in-house — from emergency extraction through final repairs — so you never have to coordinate multiple contractors.' },
    ],
    trustBadges: ['IICRC Certified', 'Licensed & Insured', '24/7 Response'],
    whyUsPoints: [
      'IICRC-certified technicians on every job',
      '60-minute emergency response time',
      'Full insurance claim assistance',
      'Advanced drying equipment & moisture tracking',
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate:
      'Professional {{keyword}} in {{city}}. Licensed & insured. 24/7 emergency response. Call {{businessName}} for fast, certified restoration.',
  },
  calculator: {
    enabled: true,
    title: 'Water Damage Cost Estimator',
    tabs: [
      {
        id: 'restoration',
        label: 'Restoration Cost',
        resultLabel: 'Estimated Restoration Cost',
        baseMin: 1200,
        baseMax: 2500,
        fields: [
          {
            id: 'area',
            label: 'Affected Area',
            type: 'select',
            options: [
              { label: 'Single room (< 200 sq ft)', value: 1 },
              { label: 'Multiple rooms (200–600 sq ft)', value: 2.2 },
              { label: 'Large area (600–1500 sq ft)', value: 4 },
              { label: 'Whole floor / basement', value: 6.5 },
            ],
          },
          {
            id: 'category',
            label: 'Water Category',
            type: 'select',
            options: [
              { label: 'Clean water (burst pipe, appliance)', value: 1 },
              { label: 'Grey water (washing machine, dishwasher)', value: 1.5 },
              { label: 'Black water (sewage, flood)', value: 2.2 },
            ],
          },
          {
            id: 'mold',
            label: 'Mold present?',
            type: 'checkbox',
            adder: 800,
          },
        ],
      },
      {
        id: 'drying',
        label: 'Drying Time',
        resultLabel: 'Estimated Drying Time (days)',
        baseMin: 3,
        baseMax: 5,
        fields: [
          {
            id: 'material',
            label: 'Primary material affected',
            type: 'select',
            options: [
              { label: 'Hardwood floors', value: 1.8 },
              { label: 'Carpet & padding', value: 1.2 },
              { label: 'Drywall & insulation', value: 1.5 },
              { label: 'Concrete slab', value: 2 },
            ],
          },
          {
            id: 'depth',
            label: 'Water depth at peak',
            type: 'select',
            options: [
              { label: 'Surface moisture only', value: 0.7 },
              { label: 'Up to 1 inch', value: 1 },
              { label: '1–6 inches', value: 1.4 },
              { label: 'Over 6 inches', value: 2 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Plumbing ─────────────────────────────────────────────────────────────────

const plumbingConfig: CategoryConfig = {
  id: 'plumbing',
  name: 'Plumbing Services',
  icon: '🔧',
  tagline: 'Residential & commercial plumbing',
  isEmergency: true,
  defaultPrimaryKeyword: 'Plumbing Services',
  defaultPalette: { primary: '#1e3a5f', secondary: '#2563eb' },
  defaultServices: [
    'Emergency Plumbing Services',
    'Drain Cleaning & Unclogging',
    'Pipe Repair & Replacement',
    'Water Heater Installation & Repair',
    'Leak Detection & Repair',
    'Sewer Line Repair & Replacement',
    'Toilet Repair & Installation',
    'Faucet & Fixture Installation',
    'Gas Line Services',
    'Bathroom & Kitchen Plumbing',
    'Repiping Services',
    'Hydro Jetting',
  ],
  copy: {
    heroTagline: 'Licensed Plumbers. Fast Arrival.',
    heroSubheading: 'From burst pipes to clogged drains — certified plumbers ready to fix it fast, any time of day.',
    ctaHeadline: 'Plumbing Emergency?',
    ctaSubtext: 'Burst pipes and major leaks can cause thousands in damage within hours. Call now for immediate response.',
    ctaButton: 'Call Now — Fast Response',
    emergencyBadge: '24/7 Emergency Plumbing',
    servicePageBenefits: [
      { heading: 'State-Licensed Plumbers', body: 'Every plumber is state-licensed and background-checked — legally qualified to handle the work and accountable for the results.' },
      { heading: 'Fixed-Price Estimates', body: 'You get a written flat-rate estimate before work begins. No hourly surprises, no price changes after the fact.' },
      { heading: 'Same-Day Service Available', body: 'Most plumbing jobs can be scheduled same-day. Emergency calls are prioritized and dispatched immediately, 24/7.' },
      { heading: 'Prevents Costly Water Damage', body: 'Leaks and pipe failures cause thousands in property damage fast. Professional repair stops the problem at the source before it escalates.' },
      { heading: 'All Major Brands & Systems', body: 'We service all pipe materials, fixture brands, and water heater types — no need to call a specialist for each component.' },
      { heading: '100% Satisfaction Guarantee', body: 'Our work is backed by a satisfaction guarantee. If the problem returns or something isn\'t right, we come back and fix it.' },
    ],
    trustBadges: ['Licensed & Bonded', 'Upfront Pricing', 'Same-Day Service'],
    whyUsPoints: [
      'State-licensed, background-checked plumbers',
      'Upfront flat-rate pricing — no hidden fees',
      'Same-day & emergency service available',
      '100% satisfaction guarantee on all work',
    ],
    schemaDescription: `Professional plumbing services in {{city}}, {{state}}. Licensed & bonded plumbers available 24/7 for drain cleaning, pipe repair, water heaters, and more.`,
    schemaOfferCatalogName: 'Plumbing Services',
    footerEmergencyText: 'Available around the clock for plumbing emergencies.',
    whatsappMessage: 'Hi, I need a plumber!',
    introParas: [
      `When a plumbing problem hits your {{city}} home or business, fast action prevents costly damage. Whether it's a burst pipe, stubborn clog, or failing water heater, {{businessName}} dispatches licensed plumbers who arrive equipped and ready to fix the problem right the first time.`,
      `Our certified plumbers use the latest diagnostic tools to pinpoint issues quickly — saving you time and money. From routine maintenance to full repipes, we handle every job with upfront pricing and no hidden fees.`,
      `{{businessName}} has earned a trusted reputation throughout {{city}} for honest service, expert workmanship, and lasting results. We back every job with a 100% satisfaction guarantee.`,
    ],
    processH2: 'Our Plumbing Service Process',
    processSteps: [
      { step: 1, heading: 'Call & Schedule', body: 'Call anytime — our dispatchers are available 24/7 to take your call and get a plumber on the way.' },
      { step: 2, heading: 'Diagnosis & Estimate', body: 'Our licensed plumber inspects the issue, explains the problem clearly, and provides an upfront written estimate before any work begins.' },
      { step: 3, heading: 'Expert Repair', body: 'We fix the problem using quality parts and proven techniques — done right the first time to prevent repeat issues.' },
      { step: 4, heading: 'Cleanup & Inspection', body: 'We clean up our work area completely and run a final check to make sure everything is working perfectly before we leave.' },
      { step: 5, heading: 'Satisfaction Guarantee', body: 'All our work is backed by a 100% satisfaction guarantee. If you have any concerns after the job, we make it right.' },
    ],
    faqH2: 'Frequently Asked Questions About Plumbing Services',
    faqs: [
      { question: 'Do you offer 24/7 emergency plumbing?', answer: 'Yes. Our licensed plumbers are on call 24 hours a day, 7 days a week — including weekends and holidays. Burst pipes and serious leaks cannot wait, and neither do we.' },
      { question: 'How much does a plumber cost?', answer: 'Costs vary depending on the type of job. Simple repairs like unclogging a drain may start around $100–$200, while larger jobs like water heater replacement or repiping cost more. We always provide a written upfront estimate before starting any work — no surprise charges.' },
      { question: 'Are your plumbers licensed and insured?', answer: 'Yes. Every plumber on our team is state-licensed, background-checked, and fully insured. We follow all local building codes on every job.' },
      { question: 'How quickly can you arrive for a plumbing emergency?', answer: 'We aim to arrive as fast as possible — often within 60 minutes for emergencies in our service area. Call us and our dispatcher will give you an accurate ETA based on your location.' },
      { question: 'Do you offer upfront pricing?', answer: 'Yes. We provide written flat-rate estimates before any work begins. You approve the price first — we never start work without your agreement.' },
      { question: 'What plumbing services do you offer?', answer: 'We handle drain cleaning, pipe repair and replacement, water heater installation and repair, leak detection, toilet and faucet repair, sewer line work, repiping, hydro jetting, and more. If it involves plumbing, we can help.' },
      { question: 'Can a slow drip cause serious damage?', answer: 'Yes. Even a small leak can cause significant water damage, mold growth, and structural issues over time. It can also waste thousands of gallons of water and raise your utility bills. We recommend addressing leaks promptly.' },
      { question: 'How do I know if I need to repipe my home?', answer: 'Signs you may need repiping include frequent leaks, rusty or discolored water, low water pressure throughout the home, or pipes that are over 50 years old. Our plumbers can inspect your system and advise you on the best solution.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted plumbing company. We provide comprehensive plumbing services including drain cleaning, pipe repair, water heater installation, leak detection, and emergency plumbing. Our licensed, bonded plumbers serve homeowners and businesses throughout {{city}} and the surrounding region. When a plumbing problem strikes, we respond fast with upfront pricing and expert workmanship.`,
  },
  seo: {
    schemaType: 'Plumber',
    metaDescriptionTemplate:
      'Licensed plumber in {{city}}. {{keyword}}, drain cleaning, water heaters & more. Same-day service. Call {{businessName}} now.',
  },
  calculator: {
    enabled: true,
    title: 'Plumbing Cost Estimator',
    tabs: [
      {
        id: 'drain',
        label: 'Drain Cleaning',
        resultLabel: 'Estimated Drain Cleaning Cost',
        baseMin: 150,
        baseMax: 300,
        fields: [
          {
            id: 'type',
            label: 'Drain type',
            type: 'select',
            options: [
              { label: 'Kitchen sink', value: 1 },
              { label: 'Bathroom sink / tub', value: 0.9 },
              { label: 'Toilet', value: 1.1 },
              { label: 'Main sewer line', value: 3.5 },
              { label: 'Floor drain', value: 1.3 },
            ],
          },
          {
            id: 'method',
            label: 'Cleaning method needed',
            type: 'select',
            options: [
              { label: 'Standard snake / auger', value: 1 },
              { label: 'Hydro jetting', value: 2.8 },
              { label: 'Camera inspection + cleaning', value: 2.2 },
            ],
          },
          {
            id: 'emergency',
            label: 'Emergency / after-hours?',
            type: 'checkbox',
            adder: 100,
          },
        ],
      },
      {
        id: 'water-heater',
        label: 'Water Heater',
        resultLabel: 'Estimated Water Heater Cost',
        baseMin: 800,
        baseMax: 1400,
        fields: [
          {
            id: 'type',
            label: 'Heater type',
            type: 'select',
            options: [
              { label: 'Standard tank (40 gal)', value: 1 },
              { label: 'Standard tank (50–75 gal)', value: 1.3 },
              { label: 'Tankless / on-demand', value: 2.4 },
              { label: 'Heat pump water heater', value: 2.8 },
            ],
          },
          {
            id: 'work',
            label: 'Work needed',
            type: 'select',
            options: [
              { label: 'Repair only', value: 0.35 },
              { label: 'Replacement (like-for-like)', value: 1 },
              { label: 'Upgrade / new installation', value: 1.5 },
            ],
          },
        ],
      },
      {
        id: 'pipe-repair',
        label: 'Pipe Repair',
        resultLabel: 'Estimated Pipe Repair Cost',
        baseMin: 250,
        baseMax: 600,
        fields: [
          {
            id: 'type',
            label: 'Pipe issue',
            type: 'select',
            options: [
              { label: 'Minor leak / pinhole', value: 1 },
              { label: 'Burst pipe section', value: 2.5 },
              { label: 'Corroded pipe replacement', value: 3 },
              { label: 'Full repipe (whole home)', value: 18 },
            ],
          },
          {
            id: 'access',
            label: 'Pipe accessibility',
            type: 'select',
            options: [
              { label: 'Exposed / easy access', value: 1 },
              { label: 'Inside wall (drywall cut needed)', value: 1.8 },
              { label: 'Under slab / foundation', value: 3.5 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Roofing ──────────────────────────────────────────────────────────────────

const roofingConfig: CategoryConfig = {
  id: 'roofing',
  name: 'Roofing Services',
  icon: '🏠',
  tagline: 'Roof repair, replacement & inspection',
  isEmergency: true,
  defaultPrimaryKeyword: 'Roofing Services',
  defaultPalette: { primary: '#7f1d1d', secondary: '#dc2626' },
  defaultServices: [
    'Roof Repair',
    'Roof Replacement',
    'Roof Inspection',
    'Storm Damage Repair',
    'Emergency Roof Tarping',
    'Shingle Replacement',
    'Flat Roof Repair & Replacement',
    'Metal Roofing Installation',
    'Gutter Installation & Repair',
    'Skylight Installation & Repair',
    'Roof Leak Detection & Repair',
    'Insurance Claim Assistance',
  ],
  copy: {
    heroTagline: 'Licensed Roofers. Storm Ready.',
    heroSubheading: 'From emergency repairs to full replacements — certified roofers protecting your home, any time of year.',
    ctaHeadline: 'Roof Damaged or Leaking?',
    ctaSubtext: 'A damaged roof can lead to water intrusion, mold, and structural damage within days. Call now for a free inspection.',
    ctaButton: 'Call Now — Free Roof Inspection',
    emergencyBadge: '24/7 Emergency Roof Repair',
    servicePageBenefits: [
      { heading: 'Licensed Roofing Contractors', body: 'All roofing work is performed by state-licensed contractors carrying full liability and workers\' compensation insurance — protecting you throughout the job.' },
      { heading: 'Free Roof Inspection', body: 'Every job starts with a thorough free inspection and detailed written report. No obligation, no pressure — just honest findings.' },
      { heading: 'Manufacturer Warranties', body: 'We install materials from leading manufacturers and provide both product warranties and our own workmanship guarantee on every project.' },
      { heading: 'Insurance Claim Experts', body: 'We document all damage in the format insurance adjusters require and can communicate directly with your carrier to maximize your claim.' },
      { heading: 'Protects Your Entire Home', body: 'A properly repaired or replaced roof protects everything beneath it — insulation, structure, walls, and belongings — from water intrusion and weather damage.' },
      { heading: 'Clean Job Sites', body: 'We protect your landscaping, clean up all roofing debris, and use magnetic rollers to collect stray nails before we leave your property.' },
    ],
    trustBadges: ['Licensed & Insured', 'Free Inspections', 'Insurance Claims Help'],
    whyUsPoints: [
      'State-licensed, fully insured roofing contractors',
      'Free roof inspections with no-obligation estimates',
      'Insurance claim assistance from start to finish',
      '100% satisfaction guarantee on all roofing work',
    ],
    schemaDescription: `Professional roofing services in {{city}}, {{state}}. Licensed & insured roofers for roof repair, replacement, storm damage, and inspections. Free estimates.`,
    schemaOfferCatalogName: 'Roofing Services',
    footerEmergencyText: 'Available around the clock for emergency roof repairs.',
    whatsappMessage: 'Hi, I need a roofer!',
    introParas: [
      `Your roof is your home's first line of defense against the elements. When it's damaged — whether from a storm, age, or wear — fast professional repair is essential to prevent water intrusion, mold, and costly structural damage. {{businessName}} provides expert roofing services throughout {{city}} with licensed, insured crews who get the job done right.`,
      `We use premium materials and proven installation techniques on every project. From a simple shingle repair to a complete roof replacement, our team delivers lasting results backed by manufacturer warranties and our own workmanship guarantee.`,
      `{{businessName}} has earned a trusted reputation throughout {{city}} for transparent pricing, clean job sites, and standing behind our work. We also work directly with insurance companies to help you maximize your storm damage claim.`,
    ],
    processH2: 'Our Roofing Service Process',
    processSteps: [
      { step: 1, heading: 'Free Inspection', body: 'We perform a thorough roof inspection at no charge, documenting all damage with photos and a detailed written report.' },
      { step: 2, heading: 'Honest Estimate', body: 'We provide a clear, itemized written estimate with no hidden fees. We explain exactly what needs to be done and why.' },
      { step: 3, heading: 'Insurance Coordination', body: 'If your damage is storm-related, we work directly with your insurance adjuster and handle the documentation to support your claim.' },
      { step: 4, heading: 'Expert Installation', body: 'Our licensed crews complete the work using quality materials, following manufacturer specs and local building codes.' },
      { step: 5, heading: 'Final Walkthrough', body: 'We inspect the completed work with you, clean up all debris, and walk you through the warranty before we leave.' },
    ],
    faqH2: 'Frequently Asked Questions About Roofing Services',
    faqs: [
      { question: 'How do I know if my roof needs to be replaced or just repaired?', answer: 'A repair is usually sufficient for isolated damage — a few missing shingles, a small leak, or minor storm damage. Replacement is recommended when the roof is over 20–25 years old, has widespread shingle failure, significant storm damage, or recurring leaks. Our free inspection will give you an honest assessment with no pressure.' },
      { question: 'Do you offer free roof inspections?', answer: 'Yes. We provide free roof inspections with a detailed written report and photo documentation. There is no obligation to hire us after the inspection.' },
      { question: 'Does homeowner\'s insurance cover roof damage?', answer: 'Most standard homeowner\'s insurance policies cover sudden and accidental roof damage caused by storms, hail, wind, and falling objects. Damage from normal wear and age is typically not covered. We work directly with your insurance company and can help document the damage for your claim.' },
      { question: 'How long does a roof replacement take?', answer: 'Most residential roof replacements are completed in 1–2 days. Larger or more complex roofs may take 2–3 days. We work efficiently to minimize disruption and always clean up thoroughly at the end of each day.' },
      { question: 'What roofing materials do you work with?', answer: 'We install and repair all major roofing types including asphalt shingles, architectural shingles, metal roofing, flat/TPO roofing, and more. We\'ll recommend the best material for your home, budget, and local climate.' },
      { question: 'How long will my new roof last?', answer: 'Lifespan depends on the material. Standard 3-tab asphalt shingles last 15–20 years, architectural shingles 25–30 years, and metal roofing 40–70 years. Proper installation and periodic maintenance significantly extend any roof\'s lifespan.' },
      { question: 'Do you offer emergency roof repair?', answer: 'Yes. We offer 24/7 emergency roof repair and tarping services for situations where immediate action is needed to prevent further interior damage — such as after a severe storm or sudden structural failure.' },
      { question: 'Are you licensed and insured?', answer: 'Yes. We are fully licensed and insured in the state of {{state}}. We carry general liability and workers\' compensation coverage, protecting you and your property throughout the job.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted roofing contractor. We provide comprehensive roofing services including roof repair, full roof replacement, storm damage repair, emergency tarping, gutter installation, and insurance claim assistance. Our licensed, insured roofing crews serve homeowners and businesses throughout {{city}} and the surrounding region. Whether you need a quick repair or a complete new roof, we deliver quality workmanship and lasting results.`,
  },
  seo: {
    schemaType: 'RoofingContractor',
    metaDescriptionTemplate:
      'Licensed roofing contractor in {{city}}. {{keyword}}, storm damage repair, inspections & more. Free estimates. Call {{businessName}} today.',
  },
  calculator: {
    enabled: true,
    title: 'Roofing Cost Estimator',
    tabs: [
      {
        id: 'repair',
        label: 'Roof Repair',
        resultLabel: 'Estimated Repair Cost',
        baseMin: 300,
        baseMax: 800,
        fields: [
          {
            id: 'type',
            label: 'Type of damage',
            type: 'select',
            options: [
              { label: 'Missing / damaged shingles (small area)', value: 1 },
              { label: 'Flashing repair (chimney, vents)', value: 1.4 },
              { label: 'Roof leak repair', value: 1.6 },
              { label: 'Storm damage (large area)', value: 3.5 },
            ],
          },
          {
            id: 'pitch',
            label: 'Roof pitch / steepness',
            type: 'select',
            options: [
              { label: 'Low pitch (walkable)', value: 1 },
              { label: 'Moderate pitch', value: 1.2 },
              { label: 'Steep pitch', value: 1.5 },
            ],
          },
          {
            id: 'emergency',
            label: 'Emergency / same-day service?',
            type: 'checkbox',
            adder: 200,
          },
        ],
      },
      {
        id: 'replacement',
        label: 'Roof Replacement',
        resultLabel: 'Estimated Replacement Cost',
        baseMin: 5000,
        baseMax: 10000,
        fields: [
          {
            id: 'size',
            label: 'Home size',
            type: 'select',
            options: [
              { label: 'Small (under 1,200 sq ft)', value: 0.7 },
              { label: 'Medium (1,200–2,000 sq ft)', value: 1 },
              { label: 'Large (2,000–3,000 sq ft)', value: 1.5 },
              { label: 'Extra large (3,000+ sq ft)', value: 2.2 },
            ],
          },
          {
            id: 'material',
            label: 'Roofing material',
            type: 'select',
            options: [
              { label: 'Architectural asphalt shingles', value: 1 },
              { label: 'Impact-resistant shingles', value: 1.3 },
              { label: 'Metal roofing (standing seam)', value: 2.2 },
              { label: 'Flat / TPO membrane', value: 1.4 },
            ],
          },
          {
            id: 'layers',
            label: 'Layers to tear off',
            type: 'select',
            options: [
              { label: 'One layer (standard)', value: 1 },
              { label: 'Two layers', value: 1.15 },
              { label: 'Three or more layers', value: 1.3 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── HVAC ─────────────────────────────────────────────────────────────────────

const hvacConfig: CategoryConfig = {
  id: 'hvac',
  name: 'HVAC Services',
  icon: '❄️',
  tagline: 'Heating, cooling & air quality',
  isEmergency: true,
  defaultPrimaryKeyword: 'HVAC Services',
  defaultPalette: { primary: '#0c4a6e', secondary: '#0284c7' },
  defaultServices: [
    'AC Repair & Installation',
    'Furnace Repair & Replacement',
    'Heat Pump Services',
    'Emergency HVAC Repair',
    'Air Duct Cleaning',
    'Indoor Air Quality Testing',
    'Thermostat Installation & Programming',
    'HVAC Maintenance & Tune-Up',
    'Mini-Split Installation',
    'Commercial HVAC Services',
    'Boiler Repair & Replacement',
    'Ventilation & Exhaust Services',
  ],
  copy: {
    heroTagline: 'Certified HVAC Technicians. Fast Service.',
    heroSubheading: 'From AC breakdowns to furnace failures — licensed HVAC pros ready to restore your comfort, any season.',
    ctaHeadline: 'HVAC System Not Working?',
    ctaSubtext: 'No heat in winter or no AC in summer can be dangerous. Call now for fast, same-day HVAC service.',
    ctaButton: 'Call Now — Same-Day Service',
    emergencyBadge: '24/7 Emergency HVAC Service',
    servicePageBenefits: [
      { heading: 'NATE-Certified Technicians', body: 'Our technicians hold NATE certifications — the most respected credential in the HVAC industry — ensuring your system is serviced to the highest standard.' },
      { heading: 'All Brands Serviced', body: 'We service and install all major HVAC brands. Our trucks carry common parts for faster same-day repairs without waiting on orders.' },
      { heading: 'Lower Energy Bills', body: 'A properly serviced HVAC system runs more efficiently — reducing energy consumption and lowering your monthly utility costs noticeably.' },
      { heading: 'Extends System Lifespan', body: 'Professional maintenance and correct repairs extend your equipment\'s lifespan significantly, delaying the cost of full system replacement.' },
      { heading: 'Upfront Flat-Rate Pricing', body: 'We quote the full price before starting. No hourly billing surprises — you approve the cost first, every time.' },
      { heading: 'Comfort Guaranteed', body: 'If your system isn\'t working correctly after our service, we return and make it right. Your comfort is our commitment.' },
    ],
    trustBadges: ['NATE Certified', 'Licensed & Insured', 'Same-Day Service'],
    whyUsPoints: [
      'NATE-certified technicians on every job',
      'Upfront flat-rate pricing — no hidden fees',
      'Same-day and emergency service available',
      'All major brands serviced and repaired',
    ],
    schemaDescription: `Professional HVAC services in {{city}}, {{state}}. Licensed & insured technicians for AC repair, furnace replacement, heat pumps, and more. Same-day service available.`,
    schemaOfferCatalogName: 'HVAC Services',
    footerEmergencyText: 'Available around the clock for heating and cooling emergencies.',
    whatsappMessage: 'Hi, I need HVAC help!',
    introParas: [
      `When your heating or cooling system fails, comfort and safety are on the line. {{businessName}} provides fast, reliable HVAC services throughout {{city}} — from emergency AC repairs in the heat of summer to furnace replacements in the dead of winter.`,
      `Our NATE-certified technicians diagnose problems quickly and explain your options clearly before any work begins. We service all major HVAC brands and stock common parts on our trucks for faster repairs.`,
      `{{businessName}} is {{city}}'s trusted HVAC company — known for honest assessments, fair pricing, and work that lasts. We back every job with a satisfaction guarantee.`,
    ],
    processH2: 'Our HVAC Service Process',
    processSteps: [
      { step: 1, heading: 'Call & Schedule', body: 'Call anytime — we offer same-day appointments and 24/7 emergency service for heating and cooling failures.' },
      { step: 2, heading: 'Diagnosis', body: 'Our certified technician performs a thorough system inspection, identifies the root cause, and explains it in plain language.' },
      { step: 3, heading: 'Upfront Estimate', body: 'You receive a written flat-rate estimate before any work begins. We never start without your approval.' },
      { step: 4, heading: 'Expert Repair or Installation', body: 'We complete the work using quality parts and proper techniques, following manufacturer specs and local codes.' },
      { step: 5, heading: 'System Test & Walkthrough', body: 'We test the full system before leaving and walk you through any maintenance tips to keep it running efficiently.' },
    ],
    faqH2: 'Frequently Asked Questions About HVAC Services',
    faqs: [
      { question: 'How often should I have my HVAC system serviced?', answer: 'We recommend a tune-up twice per year — once in spring before cooling season and once in fall before heating season. Regular maintenance extends system life, improves efficiency, and catches small problems before they become expensive failures.' },
      { question: 'Why is my AC blowing warm air?', answer: 'Common causes include a refrigerant leak, dirty air filter, frozen evaporator coil, or a failed compressor. Our technicians can diagnose the issue quickly. Many AC problems are minor and can be repaired the same day.' },
      { question: 'Should I repair or replace my HVAC system?', answer: 'A general rule of thumb: if the repair cost exceeds 50% of the system replacement cost, or the system is over 10–15 years old, replacement is usually the better long-term investment. We provide honest, no-pressure recommendations based on your specific situation.' },
      { question: 'How long does an HVAC installation take?', answer: 'A standard residential HVAC replacement typically takes 4–8 hours. More complex installations involving ductwork modifications may take a full day. We work efficiently and clean up completely before leaving.' },
      { question: 'Do you offer financing for HVAC replacement?', answer: 'Yes. We offer financing options for qualified customers to help make system replacement more affordable. Call us for current financing plans and rates.' },
      { question: 'What HVAC brands do you service?', answer: 'We service and install all major brands including Carrier, Trane, Lennox, Rheem, York, Goodman, American Standard, and more. Our trucks are stocked with common parts for faster same-day repairs.' },
      { question: 'Why is my energy bill so high?', answer: 'An aging or poorly maintained HVAC system is one of the most common causes of high energy bills. Dirty filters, refrigerant leaks, and inefficient equipment can significantly increase energy usage. A tune-up or system upgrade can often reduce bills noticeably.' },
      { question: 'Are you licensed and insured?', answer: 'Yes. {{businessName}} is fully licensed and insured. All our technicians hold proper certifications and we carry full liability and workers\' compensation coverage.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted HVAC company. We provide comprehensive heating and cooling services including AC repair and installation, furnace replacement, heat pump services, air duct cleaning, and emergency HVAC repair. Our NATE-certified technicians serve homeowners and businesses throughout {{city}} and the surrounding region with same-day service and upfront pricing.`,
  },
  seo: {
    schemaType: 'HVACBusiness',
    metaDescriptionTemplate:
      'Licensed HVAC company in {{city}}. {{keyword}}, AC repair, furnace replacement & more. Same-day service. Call {{businessName}} now.',
  },
  calculator: {
    enabled: true,
    title: 'HVAC Cost Estimator',
    tabs: [
      {
        id: 'ac-repair',
        label: 'AC Repair',
        resultLabel: 'Estimated AC Repair Cost',
        baseMin: 150,
        baseMax: 500,
        fields: [
          {
            id: 'issue',
            label: 'Issue type',
            type: 'select',
            options: [
              { label: 'Refrigerant recharge', value: 1.5 },
              { label: 'Capacitor / contactor replacement', value: 1 },
              { label: 'Fan motor replacement', value: 1.8 },
              { label: 'Compressor replacement', value: 5 },
              { label: 'Thermostat / control board', value: 1.3 },
            ],
          },
          {
            id: 'emergency',
            label: 'Emergency / after-hours?',
            type: 'checkbox',
            adder: 150,
          },
        ],
      },
      {
        id: 'system-replace',
        label: 'System Replacement',
        resultLabel: 'Estimated Replacement Cost',
        baseMin: 3500,
        baseMax: 7000,
        fields: [
          {
            id: 'type',
            label: 'System type',
            type: 'select',
            options: [
              { label: 'Central AC only', value: 0.7 },
              { label: 'Gas furnace only', value: 0.6 },
              { label: 'AC + furnace (full system)', value: 1 },
              { label: 'Heat pump system', value: 1.2 },
              { label: 'Mini-split (single zone)', value: 0.5 },
            ],
          },
          {
            id: 'size',
            label: 'Home size',
            type: 'select',
            options: [
              { label: 'Small (under 1,200 sq ft)', value: 0.8 },
              { label: 'Medium (1,200–2,500 sq ft)', value: 1 },
              { label: 'Large (2,500–4,000 sq ft)', value: 1.4 },
              { label: 'Extra large (4,000+ sq ft)', value: 1.9 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Electrical ───────────────────────────────────────────────────────────────

const electricalConfig: CategoryConfig = {
  id: 'electrical',
  name: 'Electrical Services',
  icon: '⚡',
  tagline: 'Residential & commercial electrical',
  isEmergency: true,
  defaultPrimaryKeyword: 'Electrical Services',
  defaultPalette: { primary: '#713f12', secondary: '#d97706' },
  defaultServices: [
    'Electrical Panel Upgrade',
    'Wiring & Rewiring',
    'Outlet & Switch Installation',
    'Circuit Breaker Repair & Replacement',
    'Emergency Electrical Repair',
    'EV Charger Installation',
    'Ceiling Fan & Light Fixture Installation',
    'Generator Installation & Repair',
    'Smoke & Carbon Monoxide Detector Installation',
    'Surge Protection Installation',
    'Outdoor & Landscape Lighting',
    'Commercial Electrical Services',
  ],
  copy: {
    heroTagline: 'Licensed Electricians. Code Compliant.',
    heroSubheading: 'From panel upgrades to emergency repairs — certified electricians keeping your home safe and powered.',
    ctaHeadline: 'Electrical Problem?',
    ctaSubtext: 'Electrical issues are a leading cause of house fires. Don\'t wait — call a licensed electrician now for a safe, fast fix.',
    ctaButton: 'Call Now — Licensed Electrician',
    emergencyBadge: '24/7 Emergency Electrical Service',
    servicePageBenefits: [
      { heading: 'State-Licensed Electricians', body: 'All work is performed by state-licensed electricians — legally qualified, fully insured, and accountable for safe, code-compliant results.' },
      { heading: 'Eliminates Fire & Safety Risk', body: 'Faulty wiring is a leading cause of residential fires. Professional electrical work eliminates hazards and keeps your home and family safe.' },
      { heading: 'Code Compliant — Permits Pulled', body: 'We pull permits when required and ensure all work passes inspection — protecting your home\'s value and your insurance coverage.' },
      { heading: 'Accurate Diagnosis', body: 'Electrical problems are often symptoms of deeper issues. We trace problems to the source and fix them correctly rather than just treating the surface symptom.' },
      { heading: 'Upfront Written Estimates', body: 'You receive a flat-rate written estimate before any work begins. No hourly billing, no guesswork on the final invoice.' },
      { heading: 'Future-Proofed Work', body: 'We install to current NEC standards, giving your electrical system capacity for modern demands like EV chargers, home offices, and smart home devices.' },
    ],
    trustBadges: ['Licensed Electrician', 'Code Compliant', 'Upfront Pricing'],
    whyUsPoints: [
      'State-licensed, fully insured electricians',
      'All work meets local electrical codes',
      'Upfront pricing — no surprises on your bill',
      'Safety-first approach on every job',
    ],
    schemaDescription: `Licensed electrical services in {{city}}, {{state}}. Residential and commercial electricians for panel upgrades, wiring, EV chargers, and emergency electrical repair.`,
    schemaOfferCatalogName: 'Electrical Services',
    footerEmergencyText: 'Available around the clock for electrical emergencies.',
    whatsappMessage: 'Hi, I need an electrician!',
    introParas: [
      `Electrical problems are not something to put off — faulty wiring and overloaded panels are a leading cause of residential fires. {{businessName}} provides licensed electrical services throughout {{city}}, from simple outlet repairs to full panel upgrades and home rewiring.`,
      `Every job is completed by a state-licensed electrician who follows current electrical codes and safety standards. We pull permits when required, ensuring your work is inspected and your home's value is protected.`,
      `{{businessName}} is known throughout {{city}} for honest pricing, clean workmanship, and going the extra mile to explain what we find and what we recommend — without pressure.`,
    ],
    processH2: 'Our Electrical Service Process',
    processSteps: [
      { step: 1, heading: 'Call & Schedule', body: 'Call anytime — same-day appointments available for most jobs, and 24/7 emergency service for urgent electrical issues.' },
      { step: 2, heading: 'Safety Inspection', body: 'Our licensed electrician assesses the issue, checks for related safety concerns, and documents findings.' },
      { step: 3, heading: 'Upfront Estimate', body: 'We explain the problem clearly and provide a written flat-rate estimate before any work begins. No surprises.' },
      { step: 4, heading: 'Code-Compliant Work', body: 'All electrical work is completed to current NEC and local code standards. Permits are pulled when required.' },
      { step: 5, heading: 'Final Test & Sign-Off', body: 'We test all circuits, verify safety, and walk you through the completed work before leaving your property.' },
    ],
    faqH2: 'Frequently Asked Questions About Electrical Services',
    faqs: [
      { question: 'When do I need to upgrade my electrical panel?', answer: 'Signs you need a panel upgrade include frequently tripping breakers, flickering lights, a panel rated under 200 amps in an older home, or adding major appliances like an EV charger or hot tub. Panels over 25–30 years old should be inspected. We can assess your panel and advise honestly.' },
      { question: 'Is it safe to do my own electrical work?', answer: 'DIY electrical work is risky and often illegal without a permit. Improper wiring is a leading cause of house fires and can void your homeowner\'s insurance. Licensed electricians ensure the work is safe, code-compliant, and properly documented.' },
      { question: 'Why do my circuit breakers keep tripping?', answer: 'Frequent tripping usually means a circuit is overloaded, there\'s a short circuit, or a breaker is failing. It can also indicate a more serious wiring issue. We can diagnose and resolve the cause — not just reset the breaker.' },
      { question: 'How much does an electrical panel upgrade cost?', answer: 'A standard panel upgrade to 200 amps typically costs $1,500–$3,500 depending on your home\'s wiring, permit requirements, and local labor rates. We provide a detailed written estimate after a free inspection.' },
      { question: 'Do you install EV chargers?', answer: 'Yes. We install Level 2 home EV chargers (240V) for all major vehicle brands. Installation typically takes 2–4 hours and includes a dedicated circuit and the appropriate outlet or hardwired connection.' },
      { question: 'Do you pull permits for electrical work?', answer: 'Yes, when required. Permitted electrical work is inspected by the city and provides legal documentation that the work was done correctly — important for insurance and when selling your home.' },
      { question: 'What should I do in an electrical emergency?', answer: 'If you see sparking, smell burning, or have a complete power outage, turn off the main breaker if safe to do so, evacuate if there is any sign of fire, and call us immediately. Do not attempt to fix sparking or burning wiring yourself.' },
      { question: 'Are you licensed and insured?', answer: 'Yes. {{businessName}} holds a valid state electrical contractor license and carries full general liability and workers\' compensation insurance. All work is performed by licensed electricians.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted electrical contractor. We provide comprehensive electrical services including panel upgrades, wiring and rewiring, outlet installation, EV charger installation, generator hookups, and 24/7 emergency electrical repair. Our licensed electricians serve homeowners and businesses throughout {{city}} and the surrounding region with code-compliant work and upfront pricing.`,
  },
  seo: {
    schemaType: 'Electrician',
    metaDescriptionTemplate:
      'Licensed electrician in {{city}}. {{keyword}}, panel upgrades, EV chargers & emergency electrical repair. Call {{businessName}} now.',
  },
  calculator: {
    enabled: true,
    title: 'Electrical Cost Estimator',
    tabs: [
      {
        id: 'repair',
        label: 'Electrical Repair',
        resultLabel: 'Estimated Repair Cost',
        baseMin: 100,
        baseMax: 400,
        fields: [
          {
            id: 'type',
            label: 'Type of repair',
            type: 'select',
            options: [
              { label: 'Outlet or switch replacement', value: 1 },
              { label: 'Circuit breaker replacement', value: 1.5 },
              { label: 'Light fixture installation', value: 1.2 },
              { label: 'Ceiling fan installation', value: 1.4 },
              { label: 'Wiring repair (short / burn)', value: 2.5 },
            ],
          },
          {
            id: 'emergency',
            label: 'Emergency / after-hours?',
            type: 'checkbox',
            adder: 150,
          },
        ],
      },
      {
        id: 'panel',
        label: 'Panel Upgrade',
        resultLabel: 'Estimated Panel Upgrade Cost',
        baseMin: 1500,
        baseMax: 3500,
        fields: [
          {
            id: 'size',
            label: 'Upgrade to',
            type: 'select',
            options: [
              { label: '100 amp panel', value: 0.7 },
              { label: '200 amp panel (standard)', value: 1 },
              { label: '400 amp panel (large home)', value: 1.6 },
            ],
          },
          {
            id: 'rewire',
            label: 'Rewiring needed?',
            type: 'checkbox',
            adder: 1500,
          },
        ],
      },
    ],
  },
};

// ─── Locksmith ────────────────────────────────────────────────────────────────

const locksmithConfig: CategoryConfig = {
  id: 'locksmith',
  name: 'Locksmith Services',
  icon: '🔑',
  tagline: 'Lockouts, rekeying & security',
  isEmergency: true,
  defaultPrimaryKeyword: 'Locksmith Services',
  defaultPalette: { primary: '#1c1917', secondary: '#78716c' },
  defaultServices: [
    'Emergency Lockout Service',
    'Car Lockout Service',
    'House Lockout Service',
    'Lock Rekeying',
    'Lock Replacement & Installation',
    'Deadbolt Installation',
    'Smart Lock Installation',
    'Safe Opening & Installation',
    'Master Key System',
    'Commercial Locksmith Services',
    'Key Duplication',
    'Broken Key Extraction',
  ],
  copy: {
    heroTagline: 'Licensed Locksmiths. Fast Arrival.',
    heroSubheading: 'Locked out? Lost your keys? Our certified locksmiths arrive fast — 24/7, with upfront pricing.',
    ctaHeadline: 'Locked Out?',
    ctaSubtext: 'Don\'t break a window. Our licensed locksmiths arrive fast — usually within 30 minutes — with no damage to your lock or door.',
    ctaButton: 'Call Now — Fast Arrival',
    emergencyBadge: '24/7 Emergency Locksmith',
    servicePageBenefits: [
      { heading: 'Licensed, Bonded & Background-Checked', body: 'Every locksmith carries proper licensing and bonding and has passed a background check — giving you verified, trustworthy professionals at your door.' },
      { heading: 'Non-Destructive Entry', body: 'Our locksmiths use professional tools designed to open locks without damaging your hardware or door — saving you the cost of replacement.' },
      { heading: 'Price Quoted Before We Start', body: 'We give you an upfront price over the phone before arriving. If you\'re not comfortable with the quote, there\'s no obligation to proceed.' },
      { heading: 'Fast Arrival', body: 'We aim for 30-minute response times across our service area. Getting you back inside quickly — and safely — is our priority.' },
      { heading: 'Improves Your Security', body: 'A lockout is a good opportunity to assess your locks. We can rekey, upgrade, or replace hardware on the spot to improve your home\'s security.' },
      { heading: 'Available Every Day, Every Hour', body: 'Lockouts happen at inconvenient times. We\'re available 24/7, including weekends and holidays, with no after-hours premium surprises.' },
    ],
    trustBadges: ['Licensed & Bonded', '30-Min Response', 'Upfront Pricing'],
    whyUsPoints: [
      'Licensed, bonded, and background-checked locksmiths',
      'Fast arrival — typically within 30 minutes',
      'Upfront pricing quoted before we start',
      'Non-destructive entry — we protect your locks and doors',
    ],
    schemaDescription: `Licensed locksmith services in {{city}}, {{state}}. 24/7 lockouts, rekeying, lock installation, and smart lock setup. Fast arrival, upfront pricing.`,
    schemaOfferCatalogName: 'Locksmith Services',
    footerEmergencyText: 'Available around the clock for lockouts and security emergencies.',
    whatsappMessage: 'Hi, I need a locksmith!',
    introParas: [
      `Getting locked out of your home, car, or business is stressful — but help is never far away. {{businessName}} provides fast, professional locksmith services throughout {{city}}, arriving quickly with the tools and expertise to get you back inside without damaging your lock or door.`,
      `Beyond lockouts, we handle rekeying, lock upgrades, deadbolt installation, smart lock setup, and commercial security solutions. Every job is quoted upfront so there are never any surprises on your bill.`,
      `{{businessName}} is {{city}}'s trusted locksmith — licensed, bonded, and background-checked for your peace of mind.`,
    ],
    processH2: 'Our Locksmith Service Process',
    processSteps: [
      { step: 1, heading: 'Call Us', body: 'Call anytime — our dispatch team answers 24/7 and will have a licensed locksmith on the way to your location fast.' },
      { step: 2, heading: 'ETA & Upfront Quote', body: 'We give you an accurate arrival time and a clear price quote over the phone before the locksmith arrives — no surprises.' },
      { step: 3, heading: 'Fast, Non-Destructive Entry', body: 'Our locksmith uses professional tools to open your lock without damaging your door or hardware whenever possible.' },
      { step: 4, heading: 'Security Assessment', body: 'We inspect your locks and recommend upgrades if your current hardware is worn, outdated, or easily bypassed.' },
      { step: 5, heading: 'Job Complete', body: 'We verify everything is working correctly, answer any questions, and leave your property secure.' },
    ],
    faqH2: 'Frequently Asked Questions About Locksmith Services',
    faqs: [
      { question: 'How fast can you arrive for a lockout?', answer: 'We typically arrive within 30 minutes in most of our {{city}} service area. Response time depends on your specific location and current call volume. We give you an accurate ETA when you call.' },
      { question: 'Will you damage my lock or door to get me in?', answer: 'In the vast majority of cases, no. Our locksmiths use professional non-destructive entry techniques designed to open locks without causing damage. If destructive entry is truly necessary, we will always discuss it and get your approval first.' },
      { question: 'How much does a lockout service cost?', answer: 'Lockout pricing depends on the type of lock and time of day. Residential lockouts typically range from $75–$150. We quote the price before starting — if you\'re not happy with the quote, you\'re not obligated to proceed.' },
      { question: 'Can you make a key without the original?', answer: 'Yes. We can cut a new key from the lock itself using specialized tools. We can also rekey the lock to a new key if your original is lost and you\'re concerned about security.' },
      { question: 'What is rekeying and when should I do it?', answer: 'Rekeying changes the internal pins of your lock so old keys no longer work. It\'s cheaper than replacing the lock and recommended after moving into a new home, losing keys, ending a relationship, or dismissing an employee who had access.' },
      { question: 'Do you install smart locks?', answer: 'Yes. We install and program all major smart lock brands including Schlage, Kwikset, Yale, and August. Smart locks can be integrated with your existing door hardware and home automation system.' },
      { question: 'Are you available on weekends and holidays?', answer: 'Yes. Our locksmith service is available 24 hours a day, 7 days a week — including weekends and holidays. Lockouts don\'t follow business hours, and neither do we.' },
      { question: 'Are your locksmiths licensed and background-checked?', answer: 'Yes. All {{businessName}} locksmiths are licensed, bonded, and have passed background checks. We carry proper identification and will show it upon arrival.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted locksmith service. We provide 24/7 emergency lockout service for homes, cars, and businesses — plus rekeying, lock replacement, deadbolt and smart lock installation, key duplication, and commercial security solutions. Our licensed, bonded locksmiths serve {{city}} and the surrounding region with fast arrival and upfront pricing.`,
  },
  seo: {
    schemaType: 'Locksmith',
    metaDescriptionTemplate:
      'Licensed locksmith in {{city}}. 24/7 lockouts, rekeying, smart locks & more. Fast arrival. Call {{businessName}} now.',
  },
  calculator: {
    enabled: true,
    title: 'Locksmith Cost Estimator',
    tabs: [
      {
        id: 'lockout',
        label: 'Lockout Service',
        resultLabel: 'Estimated Lockout Cost',
        baseMin: 75,
        baseMax: 150,
        fields: [
          {
            id: 'type',
            label: 'Type of lockout',
            type: 'select',
            options: [
              { label: 'Home / residential', value: 1 },
              { label: 'Car / auto', value: 1.1 },
              { label: 'Business / commercial', value: 1.3 },
              { label: 'Safe lockout', value: 2.5 },
            ],
          },
          {
            id: 'time',
            label: 'Time of day',
            type: 'select',
            options: [
              { label: 'Business hours (8am–6pm)', value: 1 },
              { label: 'Evening (6pm–midnight)', value: 1.3 },
              { label: 'Late night / holiday', value: 1.6 },
            ],
          },
        ],
      },
      {
        id: 'rekey',
        label: 'Rekey / Lock Change',
        resultLabel: 'Estimated Cost',
        baseMin: 60,
        baseMax: 120,
        fields: [
          {
            id: 'service',
            label: 'Service needed',
            type: 'select',
            options: [
              { label: 'Rekey single lock', value: 1 },
              { label: 'Rekey whole home (4–6 locks)', value: 3.5 },
              { label: 'Deadbolt installation', value: 1.5 },
              { label: 'Smart lock installation', value: 2.2 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Fire & Smoke Damage ──────────────────────────────────────────────────────

const fireDamageConfig: CategoryConfig = {
  id: 'fire-damage',
  name: 'Fire Damage Restoration',
  icon: '🔥',
  tagline: 'Fire, smoke & soot cleanup',
  isEmergency: true,
  defaultPrimaryKeyword: 'Fire Damage Restoration',
  defaultPalette: { primary: '#7c2d12', secondary: '#ea580c' },
  defaultServices: [
    'Fire Damage Restoration',
    'Smoke & Soot Cleanup',
    'Odor Removal & Deodorization',
    'Board-Up & Tarping Services',
    'Structural Assessment & Repair',
    'Content Cleaning & Pack-Out',
    'Air Quality Testing & Restoration',
    'Water Damage from Firefighting',
    'Mold Prevention After Fire',
    'Insurance Claim Assistance',
    'Full Property Reconstruction',
    'Commercial Fire Restoration',
  ],
  copy: {
    heroTagline: 'Certified Restoration Experts. 24/7 Response.',
    heroSubheading: 'Fast, certified fire and smoke damage restoration — we secure, clean, and restore your property completely.',
    ctaHeadline: 'Fire or Smoke Damage?',
    ctaSubtext: 'Smoke and soot cause ongoing damage every hour after a fire. Call now for immediate response and a free damage assessment.',
    ctaButton: 'Call Now — Free Assessment',
    emergencyBadge: '24/7 Emergency Response',
    servicePageBenefits: [
      { heading: 'IICRC-Certified Restoration Team', body: 'Fire and smoke restoration requires specialized training. Our IICRC-certified technicians follow proven protocols to restore your property safely and completely.' },
      { heading: 'Immediate Board-Up & Securing', body: 'We secure your property immediately after arrival — boarding up openings and tarping roof damage to prevent further weather, theft, or vandalism damage.' },
      { heading: 'Complete Smoke & Odor Elimination', body: 'Smoke penetrates deep into materials. We use industrial air scrubbers, thermal fogging, and ozone treatment to neutralize odor at the molecular level — not mask it.' },
      { heading: 'Full Insurance Claim Support', body: 'We provide complete damage documentation in the format insurers require, communicate directly with your adjuster, and work to maximize your claim coverage.' },
      { heading: 'Contents Cleaning & Pack-Out', body: 'We professionally clean and restore salvageable belongings — furniture, documents, clothing, electronics — rather than simply replacing everything.' },
      { heading: 'Single Contractor, Full Restoration', body: 'We handle everything from emergency response through structural reconstruction in-house — one point of contact, one timeline, no coordination headaches.' },
    ],
    trustBadges: ['IICRC Certified', 'Licensed & Insured', 'Insurance Claims Help'],
    whyUsPoints: [
      'IICRC-certified fire and smoke restoration technicians',
      'Immediate board-up and tarping to secure your property',
      'Full insurance claim documentation and adjuster support',
      'Complete restoration — from cleanup to reconstruction',
    ],
    schemaDescription: `Professional fire damage restoration in {{city}}, {{state}}. IICRC-certified technicians for fire, smoke, soot cleanup, odor removal, and full property restoration. 24/7 emergency response.`,
    schemaOfferCatalogName: 'Fire Damage Restoration Services',
    footerEmergencyText: 'Available around the clock for fire and smoke damage emergencies.',
    whatsappMessage: 'Hi, I need fire damage restoration help!',
    introParas: [
      `Fire damage extends far beyond what the flames touch. Smoke and soot penetrate walls, ceilings, and belongings — continuing to cause damage and health risks long after the fire is out. {{businessName}} provides fast, IICRC-certified fire damage restoration throughout {{city}} to stop further damage and restore your property completely.`,
      `Our response team arrives quickly to secure the structure, remove debris, and begin the restoration process. We handle everything from smoke odor elimination to full structural reconstruction, so you only need to make one call.`,
      `{{businessName}} works directly with your insurance company from the first call to the final walkthrough — documenting all damage, coordinating with adjusters, and making sure you receive the full benefit of your policy.`,
    ],
    processH2: 'Our Fire Damage Restoration Process',
    processSteps: [
      { step: 1, heading: 'Emergency Response', body: 'We respond 24/7. Our team arrives quickly to assess the damage, secure the structure with board-up or tarping, and prevent further loss.' },
      { step: 2, heading: 'Damage Assessment', body: 'We document all fire, smoke, soot, and water damage with photos and detailed reports — everything your insurance adjuster needs.' },
      { step: 3, heading: 'Water & Debris Removal', body: 'We extract water left by firefighting efforts, remove charred debris, and begin the drying and cleanup process immediately.' },
      { step: 4, heading: 'Smoke & Odor Elimination', body: 'Industrial air scrubbers, thermal fogging, and specialized cleaning agents remove smoke odor from surfaces, air ducts, and belongings.' },
      { step: 5, heading: 'Full Restoration', body: 'We repair and rebuild damaged structural elements, restoring your property to pre-fire condition with full documentation throughout.' },
    ],
    faqH2: 'Frequently Asked Questions About Fire Damage Restoration',
    faqs: [
      { question: 'How soon should I call a restoration company after a fire?', answer: 'Immediately. Smoke and soot are acidic and continue damaging surfaces, metals, and fabrics every hour after a fire. The sooner restoration begins, the more of your property can be saved and the lower the total repair cost.' },
      { question: 'Is smoke damage covered by homeowner\'s insurance?', answer: 'Yes. Most standard homeowner\'s insurance policies cover fire and smoke damage, including cleanup, odor removal, content replacement, and structural repairs. We work directly with your insurance company and provide complete documentation to support your claim.' },
      { question: 'Can smoke smell be completely removed?', answer: 'Yes, in most cases. Professional smoke odor elimination uses thermal fogging, ozone treatment, air scrubbing, and specialized cleaning agents to neutralize odor at the molecular level — not just mask it. DIY methods are rarely effective for serious smoke damage.' },
      { question: 'Do I need to leave my home after a fire?', answer: 'Depending on the severity, you may need to vacate for safety, air quality, or structural reasons. We assess the situation immediately and advise you on the safest course of action. If relocation is necessary, your insurance policy typically covers additional living expenses.' },
      { question: 'Can my belongings be saved after fire damage?', answer: 'Many contents can be professionally cleaned and restored — including furniture, documents, electronics, clothing, and sentimental items. We perform a content assessment early in the process and pack out salvageable belongings for specialized cleaning.' },
      { question: 'What is board-up service?', answer: 'After a fire, windows, doors, and compromised walls must be secured immediately to prevent weather damage, theft, and unauthorized entry. We provide emergency board-up and tarping as part of our immediate response service.' },
      { question: 'How long does fire damage restoration take?', answer: 'Minor fire damage may be cleaned up in a few days. More extensive damage involving structural repairs can take several weeks to months. We provide a detailed timeline after our initial assessment and keep you informed throughout the process.' },
      { question: 'Do you handle the insurance claim process?', answer: 'Yes. We provide complete documentation of all damage, communicate directly with your adjuster, and help you understand and maximize your claim. We have extensive experience working with all major insurance carriers.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted fire damage restoration company. We provide comprehensive restoration services including fire and smoke cleanup, soot removal, odor elimination, board-up and tarping, water extraction, content cleaning, and full structural reconstruction. Our IICRC-certified team serves homeowners and businesses throughout {{city}} and the surrounding region with 24/7 emergency response and complete insurance claim support.`,
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate:
      'Professional fire damage restoration in {{city}}. {{keyword}}, smoke cleanup, odor removal & full reconstruction. 24/7 response. Call {{businessName}}.',
  },
  calculator: {
    enabled: true,
    title: 'Fire Damage Cost Estimator',
    tabs: [
      {
        id: 'cleanup',
        label: 'Cleanup & Restoration',
        resultLabel: 'Estimated Restoration Cost',
        baseMin: 3000,
        baseMax: 8000,
        fields: [
          {
            id: 'severity',
            label: 'Fire severity',
            type: 'select',
            options: [
              { label: 'Minor (one room, mostly smoke)', value: 1 },
              { label: 'Moderate (multiple rooms)', value: 2.5 },
              { label: 'Severe (structural damage)', value: 5 },
              { label: 'Total loss / rebuild needed', value: 12 },
            ],
          },
          {
            id: 'odor',
            label: 'Smoke odor treatment needed?',
            type: 'checkbox',
            adder: 800,
          },
          {
            id: 'content',
            label: 'Content pack-out & cleaning?',
            type: 'checkbox',
            adder: 1500,
          },
        ],
      },
    ],
  },
};

// ─── Mold Remediation ─────────────────────────────────────────────────────────

const moldRemediationConfig: CategoryConfig = {
  id: 'mold-remediation',
  name: 'Mold Remediation',
  icon: '🦠',
  tagline: 'Mold testing, removal & prevention',
  isEmergency: false,
  defaultPrimaryKeyword: 'Mold Remediation',
  defaultPalette: { primary: '#14532d', secondary: '#16a34a' },
  defaultServices: [
    'Mold Inspection & Testing',
    'Mold Remediation & Removal',
    'Black Mold Removal',
    'Crawl Space Mold Remediation',
    'Basement Mold Removal',
    'Attic Mold Remediation',
    'Air Quality Testing',
    'Mold Prevention & Encapsulation',
    'Post-Remediation Verification Testing',
    'HVAC Mold Cleaning',
    'Structural Drying & Moisture Control',
    'Insurance Claim Assistance',
  ],
  copy: {
    heroTagline: 'Certified Mold Experts. Safe Removal.',
    heroSubheading: 'Professional mold inspection, testing, and remediation — protecting your home\'s air quality and your family\'s health.',
    ctaHeadline: 'Mold Problem?',
    ctaSubtext: 'Mold spreads quickly and affects indoor air quality. Get a professional inspection today — before the problem grows.',
    ctaButton: 'Call Now — Free Consultation',
    emergencyBadge: 'IICRC Certified Mold Removal',
    servicePageBenefits: [
      { heading: 'IICRC-Certified Mold Specialists', body: 'Mold remediation requires specialized training and EPA-compliant protocols. Our IICRC-certified specialists handle every job to industry-recognized standards.' },
      { heading: 'Proper Containment', body: 'We establish negative air pressure containment zones before removing mold — preventing spores from spreading to unaffected areas of your property during the process.' },
      { heading: 'Root Cause Correction', body: 'Mold always has a moisture source. We identify and address the underlying cause — not just the visible growth — so the mold doesn\'t return after remediation.' },
      { heading: 'Third-Party Verification Testing', body: 'After remediation, independent air quality testing verifies spore levels are normal — giving you documented proof the job was done completely.' },
      { heading: 'Protects Your Family\'s Health', body: 'Mold exposure causes respiratory issues, allergy symptoms, and other health problems. Professional remediation restores safe indoor air quality for your household.' },
      { heading: 'Insurance Documentation', body: 'We provide complete remediation reports, air quality test results, and work documentation to support your insurance claim from start to finish.' },
    ],
    trustBadges: ['IICRC Certified', 'Licensed & Insured', 'Post-Remediation Testing'],
    whyUsPoints: [
      'IICRC-certified mold remediation specialists',
      'Third-party post-remediation verification testing',
      'Safe containment — prevents cross-contamination',
      'Address root cause to prevent recurrence',
    ],
    schemaDescription: `Professional mold remediation services in {{city}}, {{state}}. IICRC-certified specialists for mold inspection, testing, removal, and prevention. Safe, thorough, and fully documented.`,
    schemaOfferCatalogName: 'Mold Remediation Services',
    footerEmergencyText: 'Contact us anytime for mold inspections and remediation consultations.',
    whatsappMessage: 'Hi, I think I have a mold problem and need help!',
    introParas: [
      `Mold is more than an eyesore — it\'s a health hazard. Exposure to mold spores can cause respiratory problems, allergic reactions, and long-term health issues for your family. {{businessName}} provides professional mold inspection, testing, and remediation throughout {{city}}, addressing both the visible mold and the moisture problem causing it.`,
      `Our IICRC-certified remediation specialists use proper containment and removal protocols to eliminate mold safely — without spreading spores to unaffected areas. We then conduct post-remediation testing to verify the job was done completely.`,
      `{{businessName}} doesn\'t just remove mold — we find and fix the source of moisture that allowed it to grow, giving you lasting results instead of a temporary fix.`,
    ],
    processH2: 'Our Mold Remediation Process',
    processSteps: [
      { step: 1, heading: 'Inspection & Testing', body: 'We perform a thorough visual inspection and air quality testing to identify all affected areas and determine the type and severity of mold present.' },
      { step: 2, heading: 'Containment', body: 'We seal off affected areas using physical barriers and negative air pressure to prevent mold spores from spreading to unaffected parts of your home during removal.' },
      { step: 3, heading: 'Mold Removal', body: 'All mold-contaminated materials are safely removed, bagged, and disposed of per EPA guidelines. Affected surfaces are treated with EPA-registered antimicrobial agents.' },
      { step: 4, heading: 'Moisture Source Fix', body: 'We address the root cause — whether it\'s a leak, poor ventilation, or humidity issue — to prevent mold from returning.' },
      { step: 5, heading: 'Post-Remediation Testing', body: 'Third-party air quality testing verifies that mold levels have returned to normal — giving you documented proof the job was done completely.' },
    ],
    faqH2: 'Frequently Asked Questions About Mold Remediation',
    faqs: [
      { question: 'How do I know if I have mold?', answer: 'Common signs include visible dark spots or discoloration on walls, ceilings, or floors; a persistent musty or earthy odor; unexplained allergy-like symptoms in occupants; or a history of water damage or leaks. If you suspect mold, a professional inspection can confirm it.' },
      { question: 'Is mold dangerous?', answer: 'Yes, depending on the type and level of exposure. Common molds can cause allergy symptoms, respiratory irritation, and headaches. Black mold (Stachybotrys) and other toxic molds can cause more serious health effects. We recommend professional testing and removal for any significant mold growth.' },
      { question: 'Can I remove mold myself?', answer: 'Small surface mold patches (under 10 square feet) on non-porous surfaces can sometimes be cleaned by homeowners. But mold inside walls, in HVAC systems, in crawl spaces, or covering large areas requires professional remediation with proper containment to prevent spreading spores.' },
      { question: 'How long does mold remediation take?', answer: 'A small remediation job may take 1–2 days. Larger infestations involving multiple rooms or structural materials can take 3–7 days or more. We provide a timeline after our initial assessment.' },
      { question: 'Will mold come back after remediation?', answer: 'Not if the moisture source is properly addressed. Mold needs moisture to grow — our process includes identifying and fixing the root cause (leaks, condensation, humidity) as part of remediation. Simply removing visible mold without fixing the moisture problem will result in recurrence.' },
      { question: 'Does homeowner\'s insurance cover mold remediation?', answer: 'It depends on the cause. If mold resulted from a covered peril (like a sudden pipe burst), your insurance may cover remediation. Mold from long-term neglect or gradual leaks is typically not covered. We provide documentation to support your claim.' },
      { question: 'What is post-remediation testing?', answer: 'After remediation is complete, an independent third-party laboratory performs air quality and surface testing to verify that mold levels are back within normal ranges. This provides documented proof that the remediation was successful — important for your peace of mind and for insurance purposes.' },
      { question: 'How much does mold remediation cost?', answer: 'Costs depend on the size of the affected area, the type of mold, and whether structural materials need to be removed. Small jobs may cost $500–$1,500, while larger infestations can run $3,000–$10,000+. We provide a detailed written estimate after inspection.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted mold remediation company. We provide professional mold inspection and testing, safe mold removal and remediation, post-remediation verification testing, and moisture source correction. Our IICRC-certified specialists serve homeowners and businesses throughout {{city}} and the surrounding region with thorough, documented remediation that addresses both the mold and the root cause.`,
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate:
      'Professional mold remediation in {{city}}. {{keyword}}, mold inspection, black mold removal & air quality testing. Call {{businessName}} today.',
  },
  calculator: {
    enabled: true,
    title: 'Mold Remediation Cost Estimator',
    tabs: [
      {
        id: 'remediation',
        label: 'Remediation Cost',
        resultLabel: 'Estimated Remediation Cost',
        baseMin: 500,
        baseMax: 2000,
        fields: [
          {
            id: 'area',
            label: 'Affected area size',
            type: 'select',
            options: [
              { label: 'Small (under 10 sq ft)', value: 1 },
              { label: 'Medium (10–50 sq ft)', value: 2.5 },
              { label: 'Large (50–200 sq ft)', value: 5 },
              { label: 'Extensive (200+ sq ft or structural)', value: 10 },
            ],
          },
          {
            id: 'location',
            label: 'Location of mold',
            type: 'select',
            options: [
              { label: 'Surface / drywall (accessible)', value: 1 },
              { label: 'Crawl space or basement', value: 1.8 },
              { label: 'Inside walls (drywall removal needed)', value: 2 },
              { label: 'Attic', value: 1.5 },
              { label: 'HVAC system', value: 2.2 },
            ],
          },
          {
            id: 'testing',
            label: 'Post-remediation testing?',
            type: 'checkbox',
            adder: 300,
          },
        ],
      },
    ],
  },
};

// ─── Pest Control ─────────────────────────────────────────────────────────────

const pestControlConfig: CategoryConfig = {
  id: 'pest-control',
  name: 'Pest Control',
  icon: '🐛',
  tagline: 'Pest extermination & prevention',
  isEmergency: false,
  defaultPrimaryKeyword: 'Pest Control',
  defaultPalette: { primary: '#365314', secondary: '#65a30d' },
  defaultServices: [
    'General Pest Control',
    'Ant Extermination',
    'Roach Extermination',
    'Bed Bug Treatment',
    'Termite Inspection & Treatment',
    'Rodent Control & Removal',
    'Spider Control',
    'Wasp & Bee Removal',
    'Mosquito Control',
    'Wildlife Removal',
    'Preventive Pest Treatments',
    'Commercial Pest Control',
  ],
  copy: {
    heroTagline: 'Licensed Exterminators. Guaranteed Results.',
    heroSubheading: 'From termites to bed bugs — certified pest control professionals protecting your home and family.',
    ctaHeadline: 'Pest Problem?',
    ctaSubtext: 'Pests spread fast and cause real damage. Get a free inspection today and stop the problem before it gets worse.',
    ctaButton: 'Call Now — Free Inspection',
    emergencyBadge: 'Licensed & Certified Exterminators',
    servicePageBenefits: [
      { heading: 'Licensed & State-Certified', body: 'All our pest control technicians hold valid state pesticide applicator licenses — legally certified to apply treatments safely and effectively.' },
      { heading: 'Child & Pet Safe Treatments', body: 'We use EPA-registered products and apply them precisely to minimize any exposure risk to children, pets, and beneficial insects.' },
      { heading: 'Targets Root Cause', body: 'We find where pests are entering, nesting, and breeding — and treat the source, not just what you see on the surface.' },
      { heading: 'Prevents Costly Damage', body: 'Termites, rodents, and carpenter ants cause billions in structural damage annually. Early professional treatment is far cheaper than repairing the damage later.' },
      { heading: 'Satisfaction Guarantee', body: 'If pests return between scheduled treatments, we come back at no additional charge. Your satisfaction and your pest-free home are our commitment.' },
      { heading: 'Ongoing Prevention Plans', body: 'One-time treatments address current infestations. Our recurring prevention plans keep pests out season after season with scheduled inspections and barrier treatments.' },
    ],
    trustBadges: ['State Licensed', 'Pet Safe Treatments', 'Satisfaction Guarantee'],
    whyUsPoints: [
      'State-licensed, certified pest control technicians',
      'EPA-registered, family-safe treatment products',
      'Free inspections with no-obligation estimates',
      'Satisfaction guarantee — we return if pests do',
    ],
    schemaDescription: `Professional pest control services in {{city}}, {{state}}. Licensed exterminators for termites, bed bugs, rodents, ants, roaches, and more. Free inspections.`,
    schemaOfferCatalogName: 'Pest Control Services',
    footerEmergencyText: 'Call us for fast pest inspections and treatments.',
    whatsappMessage: 'Hi, I have a pest problem and need help!',
    introParas: [
      `A pest infestation in your {{city}} home or business is more than an annoyance — it's a threat to your property, your health, and your peace of mind. {{businessName}} provides professional pest control services throughout {{city}}, eliminating infestations fast and keeping them from coming back.`,
      `Our licensed technicians identify the species, locate nesting and entry points, and apply targeted treatments that address the root of the problem. We use EPA-registered products applied precisely to protect your family and pets while eliminating pests effectively.`,
      `{{businessName}} backs every treatment with a satisfaction guarantee. If pests return between scheduled visits, so do we — at no extra charge.`,
    ],
    processH2: 'Our Pest Control Process',
    processSteps: [
      { step: 1, heading: 'Free Inspection', body: 'Our technician inspects your property thoroughly — identifying the pest species, infestation size, entry points, and nesting areas.' },
      { step: 2, heading: 'Custom Treatment Plan', body: 'We design a targeted treatment plan based on the specific pest, infestation level, and your home\'s layout — not a one-size-fits-all spray.' },
      { step: 3, heading: 'Professional Treatment', body: 'We apply EPA-registered treatments to targeted areas using the safest and most effective methods for your specific pest problem.' },
      { step: 4, heading: 'Entry Point Sealing', body: 'Where possible, we seal gaps, cracks, and entry points to prevent re-infestation after the initial treatment.' },
      { step: 5, heading: 'Follow-Up & Prevention', body: 'We schedule follow-up visits to verify results and offer ongoing prevention plans to keep your home pest-free year-round.' },
    ],
    faqH2: 'Frequently Asked Questions About Pest Control',
    faqs: [
      { question: 'How do I know if I have an infestation?', answer: 'Common signs include droppings, gnaw marks, shed skins, live or dead insects, unusual odors, or unexplained damage to wood, fabric, or food packaging. Some pests like termites can be active for years before visible signs appear — regular inspections are the best early detection.' },
      { question: 'Are pest control treatments safe for my kids and pets?', answer: 'Yes, when applied by a licensed professional. We use EPA-registered products and apply them precisely to targeted areas, minimizing exposure. We provide specific re-entry instructions for each treatment so you know exactly when it\'s safe to return to treated areas.' },
      { question: 'How long does pest control treatment take?', answer: 'A standard residential treatment takes 30 minutes to 2 hours depending on the pest and the size of your home. Termite treatments and fumigations take longer and may require you to vacate temporarily.' },
      { question: 'How long until I see results?', answer: 'Many treatments show results within 24–72 hours. Some treatments, like baiting systems for ants or termites, work more gradually over 1–2 weeks as the product spreads through the colony. We\'ll explain the expected timeline for your specific treatment.' },
      { question: 'Do I need to leave my home during treatment?', answer: 'For most general pest treatments, you can remain home. For certain treatments (fumigation, some bed bug treatments), temporary evacuation is required. We\'ll advise you in advance and provide clear re-entry instructions.' },
      { question: 'Will one treatment be enough?', answer: 'It depends on the pest and severity. Some infestations are resolved with a single treatment. Others, like bed bugs or termites, typically require multiple treatments. Our satisfaction guarantee means we return if pests come back between visits at no additional cost.' },
      { question: 'How can I prevent pests from coming back?', answer: 'Seal entry points, keep food in airtight containers, eliminate standing water, maintain your yard, and schedule regular preventive treatments. Our ongoing prevention plans include quarterly inspections and barrier treatments that dramatically reduce re-infestation risk.' },
      { question: 'Are you licensed to treat termites in {{state}}?', answer: 'Yes. Our technicians hold valid state pesticide applicator licenses covering all pest types including termites. Termite treatment requires specialized licensing, and we maintain all required certifications for {{state}}.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted pest control company. We provide comprehensive extermination and prevention services for termites, bed bugs, rodents, ants, cockroaches, spiders, wasps, mosquitoes, and more. Our licensed technicians serve homeowners and businesses throughout {{city}} and the surrounding region with targeted treatments, free inspections, and a satisfaction guarantee.`,
  },
  seo: {
    schemaType: 'PestControlService',
    metaDescriptionTemplate:
      'Licensed pest control in {{city}}. {{keyword}}, termite inspection, bed bug treatment & more. Free inspection. Call {{businessName}} today.',
  },
  calculator: {
    enabled: true,
    title: 'Pest Control Cost Estimator',
    tabs: [
      {
        id: 'general',
        label: 'General Treatment',
        resultLabel: 'Estimated Treatment Cost',
        baseMin: 150,
        baseMax: 400,
        fields: [
          {
            id: 'pest',
            label: 'Primary pest',
            type: 'select',
            options: [
              { label: 'Ants or roaches', value: 1 },
              { label: 'Spiders or silverfish', value: 0.9 },
              { label: 'Wasps or bees', value: 1.2 },
              { label: 'Bed bugs', value: 3.5 },
              { label: 'Rodents (mice / rats)', value: 2 },
              { label: 'Termites', value: 5 },
            ],
          },
          {
            id: 'size',
            label: 'Property size',
            type: 'select',
            options: [
              { label: 'Apartment / small home', value: 0.8 },
              { label: 'Medium home (1,500–3,000 sq ft)', value: 1 },
              { label: 'Large home (3,000+ sq ft)', value: 1.5 },
              { label: 'Commercial property', value: 2.5 },
            ],
          },
          {
            id: 'recurring',
            label: 'Recurring prevention plan?',
            type: 'checkbox',
            adder: -30,
          },
        ],
      },
    ],
  },
};

// ─── Tree Service ──────────────────────────────────────────────────────────────

const treeServiceConfig: CategoryConfig = {
  id: 'tree-service',
  name: 'Tree Service',
  icon: '🌳',
  tagline: 'Tree removal, trimming & stump grinding',
  isEmergency: true,
  defaultPrimaryKeyword: 'Tree Service',
  defaultPalette: { primary: '#14532d', secondary: '#16a34a' },
  defaultServices: [
    'Tree Removal',
    'Emergency Tree Removal',
    'Tree Trimming & Pruning',
    'Stump Grinding & Removal',
    'Storm Damage Tree Cleanup',
    'Fallen Tree Removal',
    'Dead Tree Removal',
    'Tree Health Assessment',
    'Lot Clearing',
    'Arborist Consulting',
    'Cabling & Bracing',
    'Firewood Processing',
  ],
  copy: {
    heroTagline: 'Certified Arborists. Safe Removal.',
    heroSubheading: 'From emergency storm cleanup to routine trimming — ISA-certified tree professionals protecting your property.',
    ctaHeadline: 'Tree Emergency or Removal Needed?',
    ctaSubtext: 'Damaged or leaning trees are a serious hazard. Call now for a fast, free assessment from certified arborists.',
    ctaButton: 'Call Now — Free Assessment',
    emergencyBadge: '24/7 Emergency Tree Service',
    servicePageBenefits: [
      { heading: 'ISA-Certified Arborists', body: 'Our team includes ISA-certified arborists — the highest professional credential in tree care — ensuring safe, expert work on every job.' },
      { heading: 'Full Liability Insurance', body: 'Tree work carries real risk. We carry comprehensive general liability and workers\' compensation insurance, fully protecting you if anything goes wrong.' },
      { heading: 'Complete Cleanup Included', body: 'We chip or haul away all wood, branches, and debris. Your property is left clean — often cleaner than before we arrived.' },
      { heading: 'Protects Your Property', body: 'Dead, diseased, or storm-damaged trees can fall without warning. Professional removal eliminates the risk of damage to your home, vehicles, and neighbors.' },
      { heading: 'Emergency Response', body: 'Storm damage can\'t wait. We offer 24/7 emergency response for trees on structures, blocking roads, or posing immediate hazards.' },
      { heading: 'Honest Assessment', body: 'Not every tree needs to come down. We give you an honest recommendation — trimming or cabling when it\'s the right solution, not just the most profitable one.' },
    ],
    trustBadges: ['ISA Certified Arborist', 'Fully Insured', 'Free Estimates'],
    whyUsPoints: [
      'ISA-certified arborists on staff',
      'Full liability and workers\' comp insurance',
      'Complete debris cleanup included',
      '24/7 emergency storm response',
    ],
    schemaDescription: `Professional tree service in {{city}}, {{state}}. ISA-certified arborists for tree removal, trimming, stump grinding, and emergency storm cleanup. Free estimates.`,
    schemaOfferCatalogName: 'Tree Services',
    footerEmergencyText: 'Available 24/7 for emergency tree removal and storm cleanup.',
    whatsappMessage: 'Hi, I need tree service help!',
    introParas: [
      `Trees add beauty and value to your {{city}} property — but when they\'re damaged, diseased, or overgrown, they become a serious hazard. {{businessName}} provides professional tree services throughout {{city}}, from routine trimming and pruning to emergency storm removal and complete lot clearing.`,
      `Our ISA-certified arborists assess each tree\'s health and structure before recommending any work. We take safety seriously — for your property, our crew, and your neighbors — using proper rigging, equipment, and techniques on every job.`,
      `{{businessName}} includes complete cleanup on every job. We chip branches, haul debris, and grind stumps — leaving your {{city}} property looking better than when we arrived.`,
    ],
    processH2: 'Our Tree Service Process',
    processSteps: [
      { step: 1, heading: 'Free Assessment', body: 'A certified arborist visits your property, evaluates the tree(s), identifies any hazards, and provides a written estimate at no charge.' },
      { step: 2, heading: 'Safety Planning', body: 'We plan the safest removal or trimming approach, considering proximity to structures, power lines, and neighboring properties before any work begins.' },
      { step: 3, heading: 'Professional Removal or Trimming', body: 'Our crew uses professional rigging, climbing gear, and equipment to complete the work safely and efficiently.' },
      { step: 4, heading: 'Stump Grinding', body: 'We grind the stump below grade and backfill with wood chips, eliminating the tripping hazard and allowing you to replant or sod over the area.' },
      { step: 5, heading: 'Complete Cleanup', body: 'All wood, branches, and debris are chipped or hauled away. We rake and blow the area clean before leaving your property.' },
    ],
    faqH2: 'Frequently Asked Questions About Tree Service',
    faqs: [
      { question: 'How do I know if a tree needs to be removed?', answer: 'Signs that a tree may need removal include: large dead branches, a significant lean toward a structure, cracks or splits in the trunk, visible rot or fungal growth at the base, roots lifting pavement or damaging foundations, or a tree that has died entirely. A free assessment from our certified arborist will give you an honest recommendation.' },
      { question: 'Is tree removal covered by homeowner\'s insurance?', answer: 'If a tree falls and damages a covered structure (your home, garage, or fence), your homeowner\'s insurance typically covers the removal and damage repairs. Removal of a living tree that hasn\'t fallen yet is generally not covered. We provide documentation to support your insurance claim when applicable.' },
      { question: 'How much does tree removal cost?', answer: 'Tree removal costs vary widely based on size, location, and complexity. Small trees may cost $200–$500, while large trees near structures can run $1,500–$3,000+. We provide free written estimates before any work begins.' },
      { question: 'Do you remove the stump as well?', answer: 'Stump removal is typically quoted separately. We offer stump grinding, which removes the stump below grade and leaves wood chips you can use as mulch or haul away. Complete stump removal (including the root ball) is also available for replanting areas.' },
      { question: 'Do you work in all weather conditions?', answer: 'We work in most weather conditions. We do not work during active lightning storms or high winds that would make the work unsafe. For emergency situations after a storm, we respond as soon as conditions are safe.' },
      { question: 'Will you clean up after the job?', answer: 'Yes. Complete cleanup is included on every job. We chip or haul all branches and debris, and grind or remove the stump. We rake and blow the area when finished.' },
      { question: 'Do I need a permit to remove a tree in {{city}}?', answer: 'Permit requirements vary by city and sometimes by tree species or size. We are familiar with local regulations in {{city}} and can advise you on whether a permit is required for your specific situation. In many cases we handle the permit process for you.' },
      { question: 'Are your crews insured?', answer: 'Yes. {{businessName}} carries full general liability insurance and workers\' compensation coverage. Never hire a tree company without verifying insurance — if an uninsured worker is injured on your property, you could be held liable.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted tree service company. We provide professional tree removal, tree trimming and pruning, stump grinding, emergency storm cleanup, dead tree removal, lot clearing, and arborist consulting. Our ISA-certified team serves homeowners and businesses throughout {{city}} and the surrounding region with safe, efficient service and complete cleanup on every job.`,
  },
  seo: {
    schemaType: 'LandscapingBusiness',
    metaDescriptionTemplate:
      'Professional tree service in {{city}}. {{keyword}}, stump grinding, storm cleanup & emergency removal. Free estimates. Call {{businessName}}.',
  },
  calculator: {
    enabled: true,
    title: 'Tree Service Cost Estimator',
    tabs: [
      {
        id: 'removal',
        label: 'Tree Removal',
        resultLabel: 'Estimated Removal Cost',
        baseMin: 300,
        baseMax: 800,
        fields: [
          {
            id: 'size',
            label: 'Tree size',
            type: 'select',
            options: [
              { label: 'Small (under 25 ft)', value: 0.6 },
              { label: 'Medium (25–50 ft)', value: 1 },
              { label: 'Large (50–75 ft)', value: 1.8 },
              { label: 'Extra large (75+ ft)', value: 3 },
            ],
          },
          {
            id: 'location',
            label: 'Tree location',
            type: 'select',
            options: [
              { label: 'Open yard (easy access)', value: 1 },
              { label: 'Near fence or structure', value: 1.4 },
              { label: 'Near power lines', value: 1.7 },
              { label: 'Against house or roof', value: 2.2 },
            ],
          },
          {
            id: 'stump',
            label: 'Stump grinding included?',
            type: 'checkbox',
            adder: 150,
          },
        ],
      },
      {
        id: 'trimming',
        label: 'Trimming & Pruning',
        resultLabel: 'Estimated Trimming Cost',
        baseMin: 150,
        baseMax: 400,
        fields: [
          {
            id: 'size',
            label: 'Tree size',
            type: 'select',
            options: [
              { label: 'Small shrub / ornamental', value: 0.5 },
              { label: 'Medium tree (25–45 ft)', value: 1 },
              { label: 'Large tree (45+ ft)', value: 2 },
            ],
          },
          {
            id: 'count',
            label: 'Number of trees',
            type: 'select',
            options: [
              { label: '1 tree', value: 1 },
              { label: '2–3 trees', value: 1.8 },
              { label: '4–6 trees', value: 2.8 },
              { label: '7+ trees', value: 4 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Garage Door ──────────────────────────────────────────────────────────────

const garageDoorConfig: CategoryConfig = {
  id: 'garage-door',
  name: 'Garage Door Services',
  icon: '🚗',
  tagline: 'Repair, replacement & installation',
  isEmergency: true,
  defaultPrimaryKeyword: 'Garage Door Repair',
  defaultPalette: { primary: '#1e3a5f', secondary: '#475569' },
  defaultServices: [
    'Garage Door Repair',
    'Garage Door Replacement',
    'Garage Door Installation',
    'Garage Door Spring Repair & Replacement',
    'Garage Door Opener Repair & Installation',
    'Broken Cable Repair',
    'Off-Track Door Repair',
    'Garage Door Panel Replacement',
    'Smart Garage Door Opener Installation',
    'Commercial Garage Door Service',
    'Emergency Garage Door Repair',
    'Garage Door Tune-Up & Maintenance',
  ],
  copy: {
    heroTagline: 'Same-Day Garage Door Repair.',
    heroSubheading: 'Broken spring, stuck door, or failed opener — certified technicians fixing it fast, same day.',
    ctaHeadline: 'Garage Door Not Working?',
    ctaSubtext: 'A broken garage door leaves your home unsecured. Call now for same-day repair from certified technicians.',
    ctaButton: 'Call Now — Same-Day Repair',
    emergencyBadge: 'Same-Day & Emergency Service',
    servicePageBenefits: [
      { heading: 'Same-Day Service Available', body: 'Most garage door repairs are completed the same day you call. Our trucks are stocked with common parts so we can fix it in one visit.' },
      { heading: 'Secures Your Home Immediately', body: 'A broken garage door is a security vulnerability. We prioritize getting your door working and your home secured as fast as possible.' },
      { heading: 'Upfront Written Estimates', body: 'We provide a clear price before any work begins. No hourly labor surprises — you approve the cost first, every time.' },
      { heading: 'All Brands Serviced', body: 'We repair and install all major garage door and opener brands — LiftMaster, Chamberlain, Genie, Craftsman, Clopay, and more.' },
      { heading: 'Spring Safety Expertise', body: 'Broken springs are dangerous and should only be replaced by professionals. Our technicians are trained in safe spring replacement procedures.' },
      { heading: 'Maintenance Extends Door Life', body: 'A properly maintained garage door lasts 15–30 years. Our tune-up service adjusts balance, lubricates moving parts, and catches problems before they become costly.' },
    ],
    trustBadges: ['Same-Day Service', 'All Brands', 'Upfront Pricing'],
    whyUsPoints: [
      'Same-day service — most repairs done in one visit',
      'Trucks stocked with parts for all major brands',
      'Upfront flat-rate pricing, no hourly billing',
      'Trained spring and cable specialists',
    ],
    schemaDescription: `Professional garage door repair and installation in {{city}}, {{state}}. Same-day service for broken springs, openers, cables, and panels. All brands serviced.`,
    schemaOfferCatalogName: 'Garage Door Services',
    footerEmergencyText: 'Available for same-day and emergency garage door repair.',
    whatsappMessage: 'Hi, I need garage door repair!',
    introParas: [
      `A broken garage door is more than an inconvenience — it\'s a security risk and a daily disruption. {{businessName}} provides fast, professional garage door repair and installation throughout {{city}}, with same-day service available for most jobs.`,
      `Our technicians arrive with trucks stocked with springs, cables, rollers, and opener parts for all major brands — meaning most repairs are completed in a single visit. We provide upfront written estimates before any work begins.`,
      `{{businessName}} has served {{city}} homeowners with reliable garage door service built on honest pricing and same-day results. Whether it\'s a broken spring at 7am or a failed opener on a weekend, we\'re ready.`,
    ],
    processH2: 'Our Garage Door Service Process',
    processSteps: [
      { step: 1, heading: 'Call & Schedule', body: 'Call anytime — we offer same-day appointments for most garage door repairs and 24/7 emergency service for doors that won\'t close.' },
      { step: 2, heading: 'Diagnosis', body: 'Our technician inspects the door, opener, springs, cables, and tracks — identifying all issues and explaining them clearly before quoting.' },
      { step: 3, heading: 'Upfront Quote', body: 'You receive a written flat-rate estimate covering all parts and labor. We never start without your approval.' },
      { step: 4, heading: 'Same-Day Repair', body: 'Most repairs are completed immediately from parts on our truck. If a specialty part is needed, we schedule a follow-up as fast as possible.' },
      { step: 5, heading: 'Safety Check', body: 'We test balance, force settings, and auto-reverse safety features before leaving — ensuring your door is safe and working perfectly.' },
    ],
    faqH2: 'Frequently Asked Questions About Garage Door Repair',
    faqs: [
      { question: 'How much does garage door repair cost?', answer: 'Costs depend on the repair needed. Spring replacement typically runs $150–$350, opener repair or replacement $150–$400, cable repair $100–$200, and off-track repair $125–$250. We provide a written upfront estimate before starting any work.' },
      { question: 'Can I replace a garage door spring myself?', answer: 'We strongly advise against it. Garage door springs are under extreme tension and can cause serious injury or death if handled incorrectly. Spring replacement is one of the most dangerous DIY home repairs — professional service is highly recommended.' },
      { question: 'How long do garage door springs last?', answer: 'Standard torsion springs are rated for 10,000 cycles (1 open + 1 close = 1 cycle). For a door used 4 times per day, that\'s about 7 years. High-cycle springs rated for 20,000–30,000 cycles are also available and recommended for frequently-used doors.' },
      { question: 'Why is my garage door so loud?', answer: 'Noisy garage doors are usually caused by worn rollers, loose hardware, or lack of lubrication. A tune-up — including roller replacement, hardware tightening, and lubrication — resolves most noise issues and extends the door\'s life significantly.' },
      { question: 'My garage door won\'t close all the way — what\'s wrong?', answer: 'Common causes include misaligned safety sensors, an obstruction in the door\'s path, or an out-of-adjustment limit setting on the opener. In some cases it can indicate a broken spring or cable. We can diagnose and fix the issue same-day.' },
      { question: 'How long does a garage door replacement take?', answer: 'A standard single-car garage door replacement is typically completed in 3–4 hours. A double-car door takes 4–6 hours. This includes removal of the old door, installation of the new door and all hardware, and a full safety check.' },
      { question: 'Do you install smart garage door openers?', answer: 'Yes. We install and program smart openers from LiftMaster, Chamberlain (myQ), Genie, and other brands — allowing you to open, close, and monitor your garage door from your smartphone.' },
      { question: 'What if my door won\'t close and my home is unsecured?', answer: 'Call us immediately. We treat unsecured garage doors as an emergency and prioritize getting to you fast. In the meantime, you can manually disconnect the opener and lock the door with a hasp if needed.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted garage door company. We provide professional garage door repair, spring and cable replacement, opener installation, off-track repair, panel replacement, and new door installation. Our technicians serve homeowners and businesses throughout {{city}} and the surrounding region with same-day service, all-brand expertise, and upfront pricing.`,
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate:
      'Garage door repair in {{city}}. {{keyword}}, spring replacement, opener installation & same-day service. Call {{businessName}} now.',
  },
  calculator: {
    enabled: true,
    title: 'Garage Door Cost Estimator',
    tabs: [
      {
        id: 'repair',
        label: 'Repair Cost',
        resultLabel: 'Estimated Repair Cost',
        baseMin: 100,
        baseMax: 300,
        fields: [
          {
            id: 'issue',
            label: 'Issue type',
            type: 'select',
            options: [
              { label: 'Broken spring (torsion)', value: 1.5 },
              { label: 'Broken cable', value: 1 },
              { label: 'Door off track', value: 1.2 },
              { label: 'Opener repair', value: 1.3 },
              { label: 'Panel replacement (per panel)', value: 1.8 },
              { label: 'Roller / hinge replacement', value: 0.7 },
            ],
          },
          {
            id: 'emergency',
            label: 'Same-day / emergency?',
            type: 'checkbox',
            adder: 75,
          },
        ],
      },
      {
        id: 'replacement',
        label: 'New Door',
        resultLabel: 'Estimated New Door Cost',
        baseMin: 800,
        baseMax: 2000,
        fields: [
          {
            id: 'size',
            label: 'Door size',
            type: 'select',
            options: [
              { label: 'Single car (8–9 ft wide)', value: 0.8 },
              { label: 'Double car (16 ft wide)', value: 1 },
              { label: 'RV / oversized', value: 1.6 },
            ],
          },
          {
            id: 'material',
            label: 'Door material',
            type: 'select',
            options: [
              { label: 'Steel (standard)', value: 1 },
              { label: 'Steel (insulated)', value: 1.3 },
              { label: 'Wood composite', value: 1.7 },
              { label: 'Aluminum / glass', value: 2 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Foundation Repair ────────────────────────────────────────────────────────

const foundationRepairConfig: CategoryConfig = {
  id: 'foundation-repair',
  name: 'Foundation Repair',
  icon: '🏗️',
  tagline: 'Foundation repair & waterproofing',
  isEmergency: false,
  defaultPrimaryKeyword: 'Foundation Repair',
  defaultPalette: { primary: '#292524', secondary: '#78716c' },
  defaultServices: [
    'Foundation Crack Repair',
    'Foundation Settlement Repair',
    'Basement Waterproofing',
    'Crawl Space Encapsulation',
    'Pier & Beam Foundation Repair',
    'Slab Foundation Repair',
    'Helical Pier Installation',
    'Push Pier Installation',
    'Wall Crack Repair',
    'Bowing Wall Repair',
    'Drainage Correction',
    'Foundation Inspection',
  ],
  copy: {
    heroTagline: 'Structural Engineers. Lasting Repairs.',
    heroSubheading: 'Foundation cracks, settling, or bowing walls — certified structural repair specialists protecting your home from the ground up.',
    ctaHeadline: 'Foundation Problem?',
    ctaSubtext: 'Foundation issues worsen over time and cost more the longer they go unaddressed. Get a free inspection before it becomes a major structural problem.',
    ctaButton: 'Call Now — Free Inspection',
    emergencyBadge: 'Structural Repair Specialists',
    servicePageBenefits: [
      { heading: 'Certified Structural Specialists', body: 'Foundation repair requires engineering expertise. Our team includes certified structural repair specialists who assess and fix problems correctly the first time.' },
      { heading: 'Transferable Warranty', body: 'Our foundation repairs come with a written, transferable warranty — protecting your investment and adding value when you sell your home.' },
      { heading: 'Stops Problems from Worsening', body: 'Foundation issues never fix themselves. Professional repair stops settlement, cracking, and water intrusion before they escalate into catastrophic structural failure.' },
      { heading: 'Protects Property Value', body: 'Foundation problems are the most feared issue for home buyers. A professionally repaired and warranted foundation protects — and often restores — your home\'s market value.' },
      { heading: 'Minimally Invasive Methods', body: 'Modern pier and helical anchor systems stabilize and lift foundations with minimal excavation, reducing disruption to your landscaping and property.' },
      { heading: 'Free Detailed Inspection', body: 'We provide a thorough free inspection with a written report, photos, and a clear explanation of findings — no pressure, no obligation to proceed.' },
    ],
    trustBadges: ['Transferable Warranty', 'Free Inspections', 'Certified Specialists'],
    whyUsPoints: [
      'Certified structural repair specialists',
      'Written transferable warranty on all repairs',
      'Free inspections with no-obligation reports',
      'Minimally invasive repair methods',
    ],
    schemaDescription: `Professional foundation repair in {{city}}, {{state}}. Certified specialists for crack repair, settlement, basement waterproofing, and crawl space encapsulation. Free inspections.`,
    schemaOfferCatalogName: 'Foundation Repair Services',
    footerEmergencyText: 'Contact us for free foundation inspections and consultations.',
    whatsappMessage: 'Hi, I have a foundation issue I need assessed!',
    introParas: [
      `Your home\'s foundation is its most critical structural element. Cracks, settling, or water intrusion that go unaddressed can escalate into serious structural damage — and the longer you wait, the more expensive the fix. {{businessName}} provides professional foundation repair throughout {{city}}, stopping problems at their source with proven, warrantied solutions.`,
      `Our certified specialists use the latest repair methods — helical piers, push piers, carbon fiber straps, and drainage correction — to stabilize and restore your foundation with minimal disruption to your property.`,
      `Every {{businessName}} repair comes with a written, transferable warranty. We back our work completely, and our warranty transfers to future owners — protecting your investment and your home\'s resale value.`,
    ],
    processH2: 'Our Foundation Repair Process',
    processSteps: [
      { step: 1, heading: 'Free Inspection', body: 'A certified specialist inspects your foundation inside and out, documents all cracking, settling, and water intrusion with photos and measurements.' },
      { step: 2, heading: 'Written Report & Estimate', body: 'You receive a detailed written report explaining what we found, what\'s causing it, what we recommend, and the exact cost — with no obligation to proceed.' },
      { step: 3, heading: 'Engineering Review', body: 'For complex repairs, our team reviews the structural engineering requirements and obtains any required permits before work begins.' },
      { step: 4, heading: 'Expert Repair', body: 'Our certified crew installs the appropriate repair system — piers, anchors, straps, or waterproofing — following manufacturer specs and structural standards.' },
      { step: 5, heading: 'Warranty & Documentation', body: 'We provide a written transferable warranty and full documentation of all work completed — protecting your investment and your home\'s future resale.' },
    ],
    faqH2: 'Frequently Asked Questions About Foundation Repair',
    faqs: [
      { question: 'How do I know if I have a foundation problem?', answer: 'Warning signs include cracks in drywall (especially diagonal cracks from door and window corners), doors or windows that stick or won\'t close properly, uneven or sloping floors, gaps between walls and ceilings or floors, visible cracks in the foundation itself, and water in the basement or crawl space. A free inspection will confirm whether these symptoms indicate a foundation problem.' },
      { question: 'Are foundation cracks always serious?', answer: 'Not all cracks are equal. Hairline cracks in poured concrete are often normal settling and may not require repair. Horizontal cracks, stair-step cracks in block walls, and cracks wider than 1/4 inch are more serious and warrant professional evaluation. Our free inspection will tell you which category your cracks fall into.' },
      { question: 'How much does foundation repair cost?', answer: 'Foundation repair costs vary widely based on the type and extent of the problem. Crack injection repairs may cost $500–$2,000. Full stabilization with piers can run $5,000–$15,000 or more for serious settlement. We provide a free, detailed estimate after inspection — there are no surprises.' },
      { question: 'Will foundation repair affect my home\'s resale value?', answer: 'A properly repaired and warranted foundation actually protects and often restores your home\'s value. Buyers fear unresolved foundation issues — but a professional repair with a transferable warranty is a documented asset that can reassure buyers and their lenders.' },
      { question: 'How long does foundation repair take?', answer: 'Simple crack repairs can be completed in a day. Pier installation for settlement repair typically takes 1–3 days depending on the number of piers required. Basement waterproofing projects usually take 1–3 days as well. We provide a timeline estimate after our inspection.' },
      { question: 'Do you offer a warranty?', answer: 'Yes. All our structural foundation repairs come with a written warranty. Our warranties are also transferable to future owners of the home — an important selling point that can be documented for buyers and their lenders.' },
      { question: 'Will the repair be disruptive to my landscaping?', answer: 'Modern pier systems are installed with minimal excavation — typically small holes that are backfilled and restored after installation. We take care to minimize disruption to landscaping, concrete, and other finished surfaces. We discuss the scope of any disturbance before work begins.' },
      { question: 'Does homeowner\'s insurance cover foundation repair?', answer: 'Standard homeowner\'s insurance typically does not cover foundation repair caused by soil movement, settling, or drainage issues. Coverage may apply if the damage resulted from a sudden covered event (like a burst pipe). We recommend reviewing your policy and can provide documentation for your insurance company.' },
    ],
    seoBody: `{{businessName}} is {{city}}'s trusted foundation repair company. We provide professional foundation crack repair, settlement stabilization, helical and push pier installation, basement waterproofing, crawl space encapsulation, bowing wall repair, and drainage correction. Our certified specialists serve homeowners throughout {{city}} and the surrounding region with written transferable warranties and free detailed inspections.`,
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate:
      'Foundation repair in {{city}}. {{keyword}}, basement waterproofing, crawl space encapsulation & free inspections. Transferable warranty. Call {{businessName}}.',
  },
  calculator: {
    enabled: true,
    title: 'Foundation Repair Cost Estimator',
    tabs: [
      {
        id: 'crack-repair',
        label: 'Crack Repair',
        resultLabel: 'Estimated Crack Repair Cost',
        baseMin: 400,
        baseMax: 1200,
        fields: [
          {
            id: 'type',
            label: 'Crack type',
            type: 'select',
            options: [
              { label: 'Hairline / minor surface crack', value: 0.5 },
              { label: 'Moderate crack (1/8–1/4 inch)', value: 1 },
              { label: 'Wide crack (over 1/4 inch)', value: 1.8 },
              { label: 'Horizontal / structural crack', value: 3 },
            ],
          },
          {
            id: 'count',
            label: 'Number of cracks',
            type: 'select',
            options: [
              { label: '1 crack', value: 1 },
              { label: '2–3 cracks', value: 1.8 },
              { label: '4+ cracks', value: 2.8 },
            ],
          },
        ],
      },
      {
        id: 'stabilization',
        label: 'Settlement / Piers',
        resultLabel: 'Estimated Stabilization Cost',
        baseMin: 4000,
        baseMax: 10000,
        fields: [
          {
            id: 'type',
            label: 'Foundation type',
            type: 'select',
            options: [
              { label: 'Concrete slab', value: 1 },
              { label: 'Basement / block wall', value: 1.2 },
              { label: 'Pier & beam / crawl space', value: 0.9 },
            ],
          },
          {
            id: 'severity',
            label: 'Settlement severity',
            type: 'select',
            options: [
              { label: 'Minor (cosmetic cracks only)', value: 0.5 },
              { label: 'Moderate (sticking doors, visible slope)', value: 1 },
              { label: 'Severe (significant movement)', value: 2 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Carpet Cleaning ──────────────────────────────────────────────────────────

const carpetCleaningConfig: CategoryConfig = {
  id: 'carpet-cleaning',
  name: 'Carpet Cleaning',
  icon: '🧹',
  tagline: 'Professional Carpet Cleaning Services',
  isEmergency: false,
  defaultPrimaryKeyword: 'carpet cleaning',
  defaultPalette: { primary: '#2563eb', secondary: '#1e40af' },
  defaultServices: [
    'Residential Carpet Cleaning',
    'Commercial Carpet Cleaning',
    'Steam Cleaning',
    'Dry Cleaning',
    'Pet Stain & Odor Removal',
    'Deep Cleaning',
    'Upholstery Cleaning',
    'Area Rug Cleaning',
    'Tile & Grout Cleaning',
    'Stain Protection Treatment',
    'Move-In / Move-Out Cleaning',
    'Water Extraction & Drying',
  ],
  copy: {
    heroTagline: 'Fresh, Clean Carpets — Guaranteed',
    heroSubheading: 'Professional carpet cleaning that removes deep stains, allergens, and odors. Certified technicians, eco-friendly solutions, 100% satisfaction guarantee.',
    ctaHeadline: 'Book Your Carpet Cleaning Today',
    ctaSubtext: 'Same-week appointments available. Free quotes. Satisfaction guaranteed.',
    ctaButton: 'Get a Free Quote',
    emergencyBadge: 'Same-Week Service Available',
    trustBadges: [
      'IICRC Certified Technicians',
      'Eco-Friendly Solutions',
      '100% Satisfaction Guarantee',
      'Licensed & Insured',
    ],
    whyUsPoints: [
      'Hot water extraction removes 98% of allergens',
      'Certified technicians with years of experience',
      'Eco-friendly, pet-safe cleaning solutions',
      'Fast drying — carpets ready in 2–4 hours',
      'Free stain pre-treatment included',
      'Satisfaction guaranteed or we re-clean free',
    ],
    schemaDescription: 'Professional carpet cleaning services in {{city}}, {{state}}. Steam cleaning, pet stain removal, upholstery cleaning, and more.',
    schemaOfferCatalogName: 'Carpet Cleaning Services',
    footerEmergencyText: 'Same-week carpet cleaning appointments available in {{city}}.',
    whatsappMessage: 'Hi, I need carpet cleaning in {{city}}. Can you provide a quote?',
    introParas: [
      'Dirty carpets trap allergens, bacteria, and odors that regular vacuuming can\'t reach. Our professional carpet cleaning service in {{city}} uses hot water extraction to deep-clean fibers and restore your carpet\'s original look and feel.',
      '{{businessName}} serves homeowners and businesses throughout {{city}}, {{state}} with certified technicians, eco-friendly solutions, and a 100% satisfaction guarantee. Book today and enjoy fresh, clean carpets by tomorrow.',
    ],
    processH2: 'Our Carpet Cleaning Process in {{city}}',
    processSteps: [
      { step: 1, heading: 'Pre-Inspection', body: 'We assess carpet condition, fiber type, and identify problem areas like stains or high-traffic zones before cleaning begins.' },
      { step: 2, heading: 'Pre-Treatment', body: 'Stains and soiled areas receive targeted pre-treatment spray to break down embedded dirt and make extraction more effective.' },
      { step: 3, heading: 'Hot Water Extraction', body: 'Our truck-mounted or portable units inject hot water deep into fibers and immediately extract it along with dirt, allergens, and bacteria.' },
      { step: 4, heading: 'Grooming & Drying', body: 'We groom carpet fibers for even drying and set fans to speed drying time — most carpets are ready to walk on within 2–4 hours.' },
      { step: 5, heading: 'Final Inspection', body: 'We walk through the cleaned areas with you to ensure every spot meets our quality standard before we pack up and leave.' },
    ],
    faqH2: 'Carpet Cleaning FAQs',
    faqs: [
      { question: 'How often should I have my carpets professionally cleaned?', answer: 'High-traffic homes should clean every 6–12 months. Homes with pets or allergy sufferers benefit from every 3–6 months.' },
      { question: 'How long does carpet cleaning take?', answer: 'Most homes take 1–3 hours depending on square footage and the number of rooms. Heavily soiled carpets may take longer.' },
      { question: 'How long until carpets are dry?', answer: 'Typically 2–4 hours with proper ventilation. We groom fibers and can set drying fans to speed the process.' },
      { question: 'Is hot water extraction safe for all carpet types?', answer: 'It is safe for most synthetic and wool carpets. We inspect your carpet type first and adjust methods accordingly.' },
      { question: 'Can you remove pet urine odors completely?', answer: 'Yes. We use enzyme-based treatments that break down urine crystals at the molecular level, eliminating both stains and odors.' },
      { question: 'Do I need to vacuum before you arrive?', answer: 'It helps but is not required. We pre-vacuum as part of our standard process at no extra charge.' },
      { question: 'Are your cleaning solutions safe for kids and pets?', answer: 'Yes. We use eco-friendly, non-toxic solutions that are safe for children and pets once dry.' },
      { question: 'What is your satisfaction guarantee?', answer: 'If you are not 100% satisfied with any area we cleaned, we will return within 7 days and re-clean it at no charge.' },
    ],
    seoBody: 'Looking for reliable carpet cleaning in {{city}}? {{businessName}} provides residential and commercial carpet cleaning using proven hot water extraction methods. Our certified technicians remove deep stains, pet odors, and allergens that vacuuming leaves behind. We serve all neighborhoods in {{city}}, {{state}} with same-week scheduling and a full satisfaction guarantee.',
    servicePageBenefits: [
      { heading: 'Hot Water Extraction', body: 'Truck-mounted steam cleaning penetrates deep into carpet fibers, removing embedded dirt and allergens.' },
      { heading: 'Pet Stain & Odor Removal', body: 'Enzyme treatments break down urine crystals at the molecular level — stains and odors gone for good.' },
      { heading: 'Eco-Friendly Solutions', body: 'Non-toxic, biodegradable cleaning agents safe for children, pets, and the environment.' },
      { heading: 'Fast Drying', body: 'Advanced equipment and grooming techniques mean carpets are dry and walkable in 2–4 hours.' },
      { heading: 'IICRC Certified', body: 'Our technicians are certified by the Institute of Inspection Cleaning and Restoration Certification.' },
      { heading: 'Satisfaction Guaranteed', body: 'Not happy with any area? We return within 7 days and re-clean it completely free of charge.' },
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate: 'Professional carpet cleaning in {{city}}, {{state}}. Steam cleaning, pet stain removal, upholstery cleaning. IICRC certified. Call {{businessName}} today.',
  },
  calculator: {
    enabled: true,
    title: 'Carpet Cleaning Cost Estimator',
    tabs: [
      {
        id: 'rooms',
        label: 'By Room',
        resultLabel: 'Estimated Cleaning Cost',
        baseMin: 80,
        baseMax: 130,
        fields: [
          {
            id: 'rooms',
            label: 'Number of rooms',
            type: 'select',
            options: [
              { label: '1 room', value: 1 },
              { label: '2 rooms', value: 2 },
              { label: '3 rooms', value: 3 },
              { label: '4 rooms', value: 4 },
              { label: '5+ rooms', value: 5 },
            ],
          },
          {
            id: 'service',
            label: 'Service type',
            type: 'select',
            options: [
              { label: 'Standard cleaning', value: 1 },
              { label: 'Deep / heavy soil cleaning', value: 1.5 },
              { label: 'Pet stain & odor treatment', value: 1.8 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Window Replacement ───────────────────────────────────────────────────────

const windowReplacementConfig: CategoryConfig = {
  id: 'window-replacement',
  name: 'Window Replacement',
  icon: '🪟',
  tagline: 'Energy-Efficient Window Replacement',
  isEmergency: false,
  defaultPrimaryKeyword: 'window replacement',
  defaultPalette: { primary: '#0ea5e9', secondary: '#0284c7' },
  defaultServices: [
    'Window Replacement',
    'Window Installation',
    'Double-Pane Windows',
    'Triple-Pane Windows',
    'Bay & Bow Windows',
    'Casement Windows',
    'Picture Windows',
    'Sliding Windows',
    'Skylight Installation',
    'Window Frame Repair',
    'Storm Window Installation',
    'Commercial Window Installation',
  ],
  copy: {
    heroTagline: 'New Windows. Lower Bills. Better Comfort.',
    heroSubheading: 'Energy-efficient window replacement that cuts utility costs, reduces noise, and boosts curb appeal. Professional installation with manufacturer warranty.',
    ctaHeadline: 'Get Your Free Window Replacement Quote',
    ctaSubtext: 'Free in-home consultation. Financing available. Licensed installers.',
    ctaButton: 'Schedule Free Consultation',
    emergencyBadge: 'Free In-Home Estimates',
    trustBadges: [
      'Energy Star Certified Products',
      'Licensed & Insured Installers',
      'Manufacturer Warranty Included',
      'Financing Available',
    ],
    whyUsPoints: [
      'Energy Star certified windows cut heating/cooling costs by up to 25%',
      'Licensed, background-checked installation crews',
      'Full manufacturer warranty on all products',
      'Clean, same-day installation with full cleanup',
      'Flexible financing with low monthly payments',
      'Free in-home measurement and consultation',
    ],
    schemaDescription: 'Professional window replacement and installation in {{city}}, {{state}}. Energy-efficient double-pane and triple-pane windows, bay windows, casement windows, and more.',
    schemaOfferCatalogName: 'Window Replacement Services',
    footerEmergencyText: 'Free window replacement consultations available throughout {{city}}.',
    whatsappMessage: 'Hi, I\'d like a quote for window replacement in {{city}}. Can you help?',
    introParas: [
      'Old, drafty windows account for up to 30% of home heating and cooling loss. Our window replacement service in {{city}} installs Energy Star certified windows that lower your utility bills, reduce outside noise, and improve your home\'s curb appeal.',
      '{{businessName}} provides professional window installation throughout {{city}}, {{state}} with licensed crews, clean same-day installation, and manufacturer warranties on every product. Schedule your free in-home consultation today.',
    ],
    processH2: 'Our Window Replacement Process in {{city}}',
    processSteps: [
      { step: 1, heading: 'Free In-Home Consultation', body: 'We visit your home, measure all windows, assess frame conditions, and recommend the best window styles and efficiency ratings for your budget.' },
      { step: 2, heading: 'Custom Order & Scheduling', body: 'Your windows are custom-ordered to exact measurements. We schedule installation once products arrive — typically 2–4 weeks.' },
      { step: 3, heading: 'Old Window Removal', body: 'We carefully remove existing windows, inspect frames for rot or damage, and make any necessary repairs before installing new units.' },
      { step: 4, heading: 'Professional Installation', body: 'New windows are installed level, plumb, and properly sealed with weatherstripping and exterior caulk for maximum energy efficiency.' },
      { step: 5, heading: 'Inspection & Cleanup', body: 'We test every window for smooth operation and proper sealing, then remove all debris and leave your home cleaner than we found it.' },
    ],
    faqH2: 'Window Replacement FAQs',
    faqs: [
      { question: 'How long does window replacement take?', answer: 'Most homes can have all windows replaced in one day. Large projects may take two days. We work efficiently to minimize disruption.' },
      { question: 'How much does window replacement cost?', answer: 'Costs vary by window type and quantity. Most homeowners spend $300–$900 per window installed. We provide free, no-obligation quotes.' },
      { question: 'What is the difference between double-pane and triple-pane windows?', answer: 'Triple-pane windows offer better insulation and noise reduction but cost more. Double-pane is the most popular choice for cost-effectiveness.' },
      { question: 'How soon will I see savings on my energy bill?', answer: 'Most homeowners notice lower utility bills within the first month. Energy Star windows can reduce heating/cooling costs by 15–25% annually.' },
      { question: 'Do you offer financing?', answer: 'Yes. We partner with financing companies to offer low monthly payment plans so you can upgrade your windows without a large upfront cost.' },
      { question: 'What warranty comes with new windows?', answer: 'Our window products come with manufacturer lifetime warranties on glass and frames. Installation labor is also warranted.' },
      { question: 'Can you replace just one window?', answer: 'Absolutely. We replace single windows as well as full-home replacements. Every project gets the same professional installation.' },
      { question: 'Will new windows increase my home value?', answer: 'Yes. Window replacement consistently ranks as one of the best ROI home improvements, often recouping 70–80% of cost at resale.' },
    ],
    seoBody: 'Looking for window replacement in {{city}}? {{businessName}} installs Energy Star certified windows that lower utility bills and improve home comfort. Our licensed crews serve {{city}}, {{state}} with free in-home consultations, same-day installation, and full manufacturer warranties. Get your free quote today.',
    servicePageBenefits: [
      { heading: 'Energy Efficiency', body: 'Energy Star certified windows reduce heating and cooling costs by up to 25% per year.' },
      { heading: 'Noise Reduction', body: 'Double and triple-pane glass significantly reduces outside noise for a quieter, more comfortable home.' },
      { heading: 'Curb Appeal', body: 'New windows instantly modernize your home\'s exterior and increase property value at resale.' },
      { heading: 'Manufacturer Warranty', body: 'Every window comes with a manufacturer lifetime warranty on glass and frame materials.' },
      { heading: 'Financing Available', body: 'Low monthly payment plans make window replacement affordable without a large upfront investment.' },
      { heading: 'Licensed Installation', body: 'Our licensed, insured crews ensure perfect fit, proper sealing, and maximum energy performance.' },
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate: 'Professional window replacement in {{city}}, {{state}}. Energy Star certified windows, licensed installation, manufacturer warranty. Free quote from {{businessName}}.',
  },
  calculator: {
    enabled: true,
    title: 'Window Replacement Cost Estimator',
    tabs: [
      {
        id: 'windows',
        label: 'Per Window',
        resultLabel: 'Estimated Installation Cost',
        baseMin: 350,
        baseMax: 600,
        fields: [
          {
            id: 'quantity',
            label: 'Number of windows',
            type: 'select',
            options: [
              { label: '1–3 windows', value: 1 },
              { label: '4–7 windows', value: 0.95 },
              { label: '8–12 windows', value: 0.9 },
              { label: '13+ windows', value: 0.85 },
            ],
          },
          {
            id: 'type',
            label: 'Window type',
            type: 'select',
            options: [
              { label: 'Standard double-pane', value: 1 },
              { label: 'Triple-pane insulated', value: 1.4 },
              { label: 'Bay / bow window', value: 2.2 },
              { label: 'Skylight', value: 1.8 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── House Painting ────────────────────────────────────────────────────────────

const housePaintingConfig: CategoryConfig = {
  id: 'house-painting',
  name: 'House Painting',
  icon: '🎨',
  tagline: 'Interior & Exterior House Painting',
  isEmergency: false,
  defaultPrimaryKeyword: 'house painting',
  defaultPalette: { primary: '#f59e0b', secondary: '#d97706' },
  defaultServices: [
    'Interior Painting',
    'Exterior Painting',
    'Cabinet Painting & Refinishing',
    'Deck & Fence Staining',
    'Commercial Painting',
    'Pressure Washing',
    'Drywall Repair',
    'Ceiling Painting',
    'Trim & Baseboard Painting',
    'Wallpaper Removal',
    'Epoxy Floor Coating',
    'Color Consultation',
  ],
  copy: {
    heroTagline: 'Professional Painting. Flawless Results.',
    heroSubheading: 'Interior and exterior painting services that transform your home. Licensed painters, premium materials, and a clean job site every time.',
    ctaHeadline: 'Get Your Free Painting Estimate',
    ctaSubtext: 'Free color consultation included. Licensed & insured painters. No mess guaranteed.',
    ctaButton: 'Get a Free Estimate',
    emergencyBadge: 'Free Color Consultation Included',
    trustBadges: [
      'Licensed & Insured Painters',
      'Premium Sherwin-Williams & Benjamin Moore Paints',
      'No-Mess Guarantee',
      '5-Year Workmanship Warranty',
    ],
    whyUsPoints: [
      'Licensed, insured painters with 10+ years experience',
      'Premium paints from Sherwin-Williams and Benjamin Moore',
      'Thorough prep work for a finish that lasts',
      'We protect all furniture, floors, and landscaping',
      'Clean job site — no paint drips, no debris left behind',
      '5-year workmanship warranty on all painting projects',
    ],
    schemaDescription: 'Professional interior and exterior painting services in {{city}}, {{state}}. Residential and commercial painting, cabinet refinishing, deck staining, and more.',
    schemaOfferCatalogName: 'Painting Services',
    footerEmergencyText: 'Free painting estimates and color consultations available in {{city}}.',
    whatsappMessage: 'Hi, I need a painting estimate for my home in {{city}}. Can you help?',
    introParas: [
      'A fresh coat of paint is one of the most cost-effective ways to transform your home. Our professional painting service in {{city}} covers everything from interior rooms to full exterior repaints, using premium materials and meticulous prep work that ensures a finish built to last.',
      '{{businessName}} serves homeowners and businesses throughout {{city}}, {{state}} with licensed painters, a no-mess guarantee, and a 5-year workmanship warranty. Schedule your free estimate and color consultation today.',
    ],
    processH2: 'Our Painting Process in {{city}}',
    processSteps: [
      { step: 1, heading: 'Free Estimate & Color Consultation', body: 'We visit your property, assess the scope of work, discuss color options, and provide a detailed written estimate at no charge.' },
      { step: 2, heading: 'Surface Preparation', body: 'We patch holes, sand rough areas, caulk gaps, and prime surfaces. Proper prep is the foundation of a finish that looks great and lasts for years.' },
      { step: 3, heading: 'Protection & Masking', body: 'All furniture, floors, landscaping, and trim are carefully covered and masked before any paint is applied.' },
      { step: 4, heading: 'Application', body: 'We apply premium paints using the right tools for each surface — brushes for trim, rollers for walls, and sprayers for exteriors and cabinets.' },
      { step: 5, heading: 'Final Walkthrough & Cleanup', body: 'We do a detailed inspection with you, touch up any areas needed, and leave your property spotless. Every drop of paint is cleaned up before we go.' },
    ],
    faqH2: 'House Painting FAQs',
    faqs: [
      { question: 'How long does interior painting take?', answer: 'A typical 3-bedroom home takes 2–4 days for a full interior repaint. Individual rooms can often be done in one day.' },
      { question: 'How often should I repaint my home exterior?', answer: 'Exterior paint typically lasts 7–10 years depending on climate and paint quality. Signs it is time: peeling, fading, or chalking paint.' },
      { question: 'What paint brands do you use?', answer: 'We primarily use Sherwin-Williams and Benjamin Moore — premium brands that provide better coverage, durability, and color retention.' },
      { question: 'Do I need to move my furniture?', answer: 'We handle moving light furniture and protecting everything in place with drop cloths. You only need to remove small personal items.' },
      { question: 'Do you offer exterior pressure washing before painting?', answer: 'Yes. Pressure washing is part of our exterior prep process to remove dirt, mildew, and loose paint for maximum adhesion.' },
      { question: 'Can you match an existing paint color?', answer: 'Absolutely. We use digital color matching technology to perfectly replicate any existing paint color.' },
      { question: 'What is included in your workmanship warranty?', answer: 'Our 5-year warranty covers peeling, blistering, and flaking on any surfaces we painted. We return and repaint at no charge.' },
      { question: 'Do you paint cabinets?', answer: 'Yes. Cabinet painting and refinishing is one of our specialties — a cost-effective alternative to cabinet replacement.' },
    ],
    seoBody: 'Looking for professional house painting in {{city}}? {{businessName}} provides interior and exterior painting services throughout {{city}}, {{state}} with licensed painters, premium materials, and a 5-year workmanship warranty. From single rooms to full home repaints, we deliver flawless results. Get your free estimate today.',
    servicePageBenefits: [
      { heading: 'Premium Materials', body: 'We use Sherwin-Williams and Benjamin Moore paints for superior coverage, durability, and color retention.' },
      { heading: 'Thorough Prep Work', body: 'Patching, sanding, caulking, and priming ensure your paint job looks great and lasts for years.' },
      { heading: '5-Year Warranty', body: 'Our workmanship warranty covers peeling and blistering — we return and repaint at no charge.' },
      { heading: 'No-Mess Guarantee', body: 'We protect all surfaces, furniture, and landscaping and leave your property spotless after every job.' },
      { heading: 'Licensed & Insured', body: 'All painters are licensed, background-checked, and carry full liability and workers comp insurance.' },
      { heading: 'Color Consultation', body: 'Free color consultation with every project — our experts help you choose the perfect palette.' },
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate: 'Professional interior and exterior painting in {{city}}, {{state}}. Licensed painters, premium paints, 5-year warranty. Free estimate from {{businessName}}.',
  },
  calculator: {
    enabled: true,
    title: 'Painting Cost Estimator',
    tabs: [
      {
        id: 'interior',
        label: 'Interior',
        resultLabel: 'Estimated Painting Cost',
        baseMin: 1800,
        baseMax: 4000,
        fields: [
          {
            id: 'sqft',
            label: 'Square footage',
            type: 'select',
            options: [
              { label: 'Under 1,000 sq ft', value: 0.7 },
              { label: '1,000–1,500 sq ft', value: 1 },
              { label: '1,500–2,500 sq ft', value: 1.5 },
              { label: '2,500+ sq ft', value: 2.2 },
            ],
          },
          {
            id: 'type',
            label: 'Project type',
            type: 'select',
            options: [
              { label: 'Interior only', value: 1 },
              { label: 'Exterior only', value: 1.3 },
              { label: 'Interior + Exterior', value: 1.8 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Junk Removal ──────────────────────────────────────────────────────────────

const junkRemovalConfig: CategoryConfig = {
  id: 'junk-removal',
  name: 'Junk Removal',
  icon: '🚛',
  tagline: 'Fast, Affordable Junk Removal',
  isEmergency: false,
  defaultPrimaryKeyword: 'junk removal',
  defaultPalette: { primary: '#16a34a', secondary: '#15803d' },
  defaultServices: [
    'Residential Junk Removal',
    'Commercial Junk Removal',
    'Furniture Removal',
    'Appliance Removal',
    'Mattress Disposal',
    'Hot Tub Removal',
    'Shed & Playhouse Demolition',
    'Garage Cleanout',
    'Attic & Basement Cleanout',
    'Estate Cleanout',
    'Construction Debris Removal',
    'Yard Waste Removal',
  ],
  copy: {
    heroTagline: 'We Haul It All Away — Fast',
    heroSubheading: 'Professional junk removal that clears your home, garage, or office in one visit. Same-day or next-day service available. We donate and recycle when possible.',
    ctaHeadline: 'Book Your Junk Removal Today',
    ctaSubtext: 'Same-day and next-day appointments available. Upfront pricing. No hidden fees.',
    ctaButton: 'Get a Free Quote',
    emergencyBadge: 'Same-Day Service Available',
    trustBadges: [
      'Upfront, All-Inclusive Pricing',
      'We Donate & Recycle When Possible',
      'Same-Day Service Available',
      'Licensed & Insured',
    ],
    whyUsPoints: [
      'Same-day and next-day appointments available',
      'Upfront pricing — you approve before we haul',
      'We donate and recycle to keep items out of landfill',
      'Full-service: we do all the lifting and loading',
      'Handles everything from single items to full cleanouts',
      'Licensed, insured, and background-checked crews',
    ],
    schemaDescription: 'Professional junk removal services in {{city}}, {{state}}. Furniture removal, appliance disposal, garage cleanouts, estate cleanouts, and construction debris removal.',
    schemaOfferCatalogName: 'Junk Removal Services',
    footerEmergencyText: 'Same-day junk removal available throughout {{city}} and surrounding areas.',
    whatsappMessage: 'Hi, I need junk removal in {{city}}. Can you give me a quote?',
    introParas: [
      'Clearing out clutter shouldn\'t be a weekend-long project. Our junk removal service in {{city}} handles all the heavy lifting, loading, and disposal so you can reclaim your space in a single visit. From single furniture pieces to full estate cleanouts, we haul it all.',
      '{{businessName}} offers same-day and next-day junk removal throughout {{city}}, {{state}} with upfront pricing, donation-first disposal, and licensed, insured crews. Get your free quote and book your pickup today.',
    ],
    processH2: 'Our Junk Removal Process in {{city}}',
    processSteps: [
      { step: 1, heading: 'Call or Book Online', body: 'Schedule your appointment online or by phone. We offer same-day and next-day slots in most areas of {{city}}.' },
      { step: 2, heading: 'On-Site Pricing', body: 'Our crew arrives on time, assesses the items to be removed, and gives you an all-inclusive price. You approve before we start.' },
      { step: 3, heading: 'We Do the Lifting', body: 'Our two-man team handles all the heavy lifting, carrying items from any room, floor, or location to our truck.' },
      { step: 4, heading: 'Loading & Cleanup', body: 'We load everything onto our truck and sweep up the area afterward so you are left with clean, clear space.' },
      { step: 5, heading: 'Responsible Disposal', body: 'We sort items at our facility — donating usable goods to local charities, recycling what we can, and only landfilling what cannot be salvaged.' },
    ],
    faqH2: 'Junk Removal FAQs',
    faqs: [
      { question: 'What items do you take?', answer: 'We take most household and commercial items: furniture, appliances, electronics, mattresses, clothing, yard waste, and construction debris. We cannot take hazardous materials.' },
      { question: 'How is junk removal priced?', answer: 'Pricing is based on the volume of space your items take up in our truck. We provide an all-inclusive price on-site before starting any work.' },
      { question: 'How quickly can you come?', answer: 'We offer same-day and next-day appointments in most areas. In many cases we can be there within a few hours.' },
      { question: 'Do I need to sort or prepare my items?', answer: 'No. Just point to what you want removed — we handle all the sorting, lifting, and loading.' },
      { question: 'What happens to my junk after removal?', answer: 'We take a donation-first approach: usable items go to local charities, recyclables go to recycling facilities, and only true waste goes to landfill.' },
      { question: 'Do you remove items from inside the home?', answer: 'Yes. We remove items from anywhere on your property — inside the home, attic, basement, garage, or yard.' },
      { question: 'Can you remove a hot tub or shed?', answer: 'Yes. We specialize in large-item removal including hot tubs, sheds, swing sets, and other structures that require dismantling.' },
      { question: 'Are there items you cannot take?', answer: 'We cannot transport hazardous waste, asbestos, oil drums, fuel tanks, or medical waste. For everything else, give us a call.' },
    ],
    seoBody: 'Need junk removal in {{city}}? {{businessName}} provides fast, affordable junk removal throughout {{city}}, {{state}} with same-day and next-day service. We handle furniture removal, appliance disposal, garage cleanouts, estate cleanouts, and construction debris. Get upfront pricing and book your pickup today.',
    servicePageBenefits: [
      { heading: 'Full-Service Hauling', body: 'We do all the lifting, carrying, and loading — you just point to what you want gone.' },
      { heading: 'Same-Day Service', body: 'Same-day and next-day appointments available throughout {{city}} and surrounding areas.' },
      { heading: 'Upfront Pricing', body: 'Receive an all-inclusive price on-site before we start. No hidden fees, no surprises on the bill.' },
      { heading: 'Eco-Friendly Disposal', body: 'We donate usable items to local charities and recycle materials to minimize landfill waste.' },
      { heading: 'Any Location', body: 'We remove items from inside the home, attic, basement, garage, yard — anywhere on your property.' },
      { heading: 'Licensed & Insured', body: 'All crews are licensed, insured, and background-checked for your peace of mind.' },
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate: 'Professional junk removal in {{city}}, {{state}}. Same-day service, upfront pricing, eco-friendly disposal. Call {{businessName}} for a free quote.',
  },
  calculator: {
    enabled: true,
    title: 'Junk Removal Cost Estimator',
    tabs: [
      {
        id: 'load',
        label: 'By Load Size',
        resultLabel: 'Estimated Removal Cost',
        baseMin: 150,
        baseMax: 250,
        fields: [
          {
            id: 'volume',
            label: 'Estimated truck space',
            type: 'select',
            options: [
              { label: 'Small load (1/8 truck)', value: 1 },
              { label: 'Medium load (1/4 truck)', value: 1.8 },
              { label: 'Large load (1/2 truck)', value: 3 },
              { label: 'Full truck load', value: 5 },
            ],
          },
          {
            id: 'type',
            label: 'Job type',
            type: 'select',
            options: [
              { label: 'Standard items', value: 1 },
              { label: 'Heavy items (appliances, hot tub)', value: 1.4 },
              { label: 'Full property cleanout', value: 1.6 },
            ],
          },
        ],
      },
    ],
  },
};

// ─── Dumpster Rental ─────────────────────────────────────────────────────────

const dumpsterRentalConfig: CategoryConfig = {
  id: 'dumpster-rental',
  name: 'Dumpster Rental',
  icon: '🗑️',
  tagline: 'Reliable Roll-Off Dumpster Rentals',
  isEmergency: false,
  defaultPrimaryKeyword: 'dumpster rental',
  defaultPalette: { primary: '#2563eb', secondary: '#1d4ed8' },
  defaultServices: [
    '10-Yard Dumpster Rental',
    '15-Yard Dumpster Rental',
    '20-Yard Dumpster Rental',
    '30-Yard Dumpster Rental',
    '40-Yard Dumpster Rental',
    'Roll-Off Dumpster Rental',
    'Commercial Dumpster Rental',
    'Residential Dumpster Rental',
    'Construction Dumpster Rental',
    'Concrete & Dirt Dumpsters',
    'Yard Waste Dumpster Rental',
  ],
  copy: {
    heroTagline: 'Affordable, Reliable Roll-Off Dumpsters',
    heroSubheading: 'Professional dumpster rentals for construction, home cleanouts, renovation, and commercial projects in {{city}}. Upfront pricing, flexible rental periods, and prompt delivery & pickup.',
    ctaHeadline: 'Reserve Your Dumpster Today',
    ctaSubtext: 'Same-day and next-day delivery options. Clear, all-inclusive pricing with no hidden delivery fees.',
    ctaButton: 'Get a Free Quote',
    trustBadges: [
      'Upfront, All-Inclusive Flat Rates',
      'Flexible Rental Periods',
      'Same-Day/Next-Day Delivery',
      'Locally Owned & Operated',
    ],
    whyUsPoints: [
      'Flexible rental periods customized to your project timeline',
      'Upfront flat-rate pricing with delivery, pickup, and disposal included',
      'Multiple dumpster sizes (10 to 40 yards) for any size job',
      'Same-day and next-day delivery available throughout {{city}}',
      'Safe driveway placement with protective boards provided',
      'Eco-friendly sorting and disposal practices',
    ],
    schemaDescription: 'Affordable roll-off dumpster rentals in {{city}}, {{state}}. Choose from 10, 15, 20, 30, and 40-yard dumpsters for home cleanouts, construction debris, yard waste, and commercial cleanup.',
    schemaOfferCatalogName: 'Dumpster Rental Services',
    footerEmergencyText: 'Roll-off dumpster rental delivery and pickup available throughout {{city}} and surrounding areas.',
    whatsappMessage: 'Hi, I would like to get a quote for a dumpster rental in {{city}}.',
    introParas: [
      'Whether you are cleaning out your garage, remodeling your kitchen, or managing a large-scale construction site, having the right dumpster makes all the difference. Our dumpster rental service in {{city}} provides a hassle-free solution to dispose of construction debris, household junk, yard waste, and commercial trash.',
      '{{businessName}} offers clean, reliable roll-off dumpsters in a range of sizes throughout {{city}}, {{state}} with prompt drop-off and pickup, flexible terms, and transparent, flat-rate pricing. Get in touch today to find the perfect dumpster size for your next project.',
    ],
    processH2: 'Our Easy Dumpster Rental Process in {{city}}',
    processSteps: [
      { step: 1, heading: 'Choose Your Dumpster Size', body: 'Select from our 10, 15, 20, 30, or 40-yard dumpsters depending on your project scope and weight requirements.' },
      { step: 2, heading: 'Get a Flat-Rate Quote', body: 'We provide an all-inclusive, upfront flat-rate price that covers delivery, pickup, rental period, and weight allowance. No hidden fuel surcharges or environmental fees.' },
      { step: 3, heading: 'Fast Delivery', body: 'We drop off the dumpster at your specified location in {{city}}, ensuring driveway protection with boards if requested.' },
      { step: 4, heading: 'Fill It Up', body: 'Load the dumpster at your own pace during your rental period. Need more time? Simply call us to extend your rental.' },
      { step: 5, heading: 'Prompt Pickup & Disposal', body: 'Once finished, schedule a pickup online or by phone. We haul the dumpster away and dispose of the waste responsibly, recycling what we can.' },
    ],
    faqH2: 'Dumpster Rental FAQs',
    faqs: [
      { question: 'How do I choose the right dumpster size?', answer: 'For minor cleanouts or yard work, a 10 or 15-yard dumpster is ideal. Kitchen remodels or full carpet replacement usually require a 20-yard dumpster. Large construction, demolition, or estate cleanouts are best served by our 30 or 40-yard dumpsters.' },
      { question: 'What is included in the rental price?', answer: 'Our upfront flat-rate pricing includes delivery, drop-off, the agreed rental period, pickup, and a specific tonnage weight limit.' },
      { question: 'Are there items I cannot put in the dumpster?', answer: 'We cannot accept hazardous materials, chemicals, wet paint, car batteries, tires, mattresses (in some municipalities), asbestos, or propane tanks.' },
      { question: 'Will the dumpster damage my driveway?', answer: 'We place protective boards underneath the dumpster wheels if requested, avoiding direct contact with your asphalt or concrete to prevent scratching or cracking.' },
      { question: 'How long can I keep the dumpster?', answer: 'Our standard rental period is 7 to 10 days, but we offer flexible daily or weekly extensions if your project takes longer.' },
      { question: 'Do I need to be home for delivery or pickup?', answer: 'No, as long as the drop-off path is clear of cars, low-hanging tree branches, and overhead wires, our drivers can deliver or pick up without you present.' },
      { question: 'What is the weight limit for a dumpster?', answer: 'Each dumpster size has a dedicated weight limit (typically ranging from 1 to 4 tons). Overweight dumpsters may incur additional disposal fees per ton.' },
      { question: 'Can I request same-day delivery?', answer: 'Yes, same-day and next-day delivery options are available depending on inventory and placement schedule in {{city}}.' },
    ],
    seoBody: 'Looking for dumpster rentals in {{city}}? {{businessName}} offers affordable, flat-rate roll-off dumpsters in 10, 15, 20, 30, and 40-yard sizes throughout {{city}}, {{state}}. Perfect for home cleanouts, remodeling, construction sites, and waste disposal. Enjoy flexible rental periods and prompt delivery. Call for a free estimate today.',
    servicePageBenefits: [
      { heading: 'Flat-Rate Pricing', body: 'All-inclusive flat rates with delivery, pickup, rental period, and weight allowance included. No hidden fees.' },
      { heading: 'Multiple Sizes Available', body: 'Choose from 10, 15, 20, 30, or 40-yard dumpster models to match any project size or volume.' },
      { heading: 'Fast Delivery & Pickup', body: 'Same-day and next-day delivery slots available in {{city}} to keep your project on track.' },
      { heading: 'Safe Driveway Placement', body: 'We use driveway protection boards to safeguard your asphalt or concrete from damage.' },
      { heading: 'Flexible Rental Periods', body: 'Keep the dumpster for as long as you need. Easy extensions available at low daily rates.' },
      { heading: 'Locally Owned & Operated', body: 'Dedicated local waste experts providing responsive customer service and reliable hauling.' },
    ],
  },
  seo: {
    schemaType: 'HomeAndConstructionBusiness',
    metaDescriptionTemplate: 'Reliable roll-off dumpster rentals in {{city}}, {{state}}. Choose 10, 15, 20, 30, or 40-yard dumpsters. Upfront flat-rate pricing. Call {{businessName}} for a free quote.',
  },
  calculator: {
    enabled: true,
    title: 'Dumpster Rental Cost Estimator',
    tabs: [
      {
        id: 'size',
        label: 'By Dumpster Size',
        resultLabel: 'Estimated Rental Cost',
        baseMin: 290,
        baseMax: 650,
        fields: [
          {
            id: 'dumpsterSize',
            label: 'Dumpster Size',
            type: 'select',
            options: [
              { label: '10-Yard Dumpster', value: 1 },
              { label: '15-Yard Dumpster', value: 1.2 },
              { label: '20-Yard Dumpster', value: 1.4 },
              { label: '30-Yard Dumpster', value: 1.8 },
              { label: '40-Yard Dumpster', value: 2.2 },
            ],
          },
          {
            id: 'duration',
            label: 'Rental Duration',
            type: 'select',
            options: [
              { label: 'Up to 7 Days', value: 1 },
              { label: '10 Days', value: 1.15 },
              { label: '14 Days', value: 1.3 },
            ],
          },
        ],
      },
    ],
  },
};


// ─── Category Placeholder Images ──────────────────────────────────────────────
// Category-specific Unsplash placeholder images shown before a user uploads
// their own photos. Keys match data-placeholder attributes in the generator.

export type CategoryPlaceholderImages = {
  hero: string;
  'main-image': string;
  'service-image': string;
  'location-image': string;
  'about-team-photo': string;
};

export const CATEGORY_PLACEHOLDER_IMAGES: Record<string, CategoryPlaceholderImages> = {
  'water-damage': {
    hero:              'https://images.unsplash.com/photo-1525438160292-a4a860951216?w=1200&q=80',  // water damage flood cleanup
    'main-image':      'https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?w=800&q=80',  // professional restoration crew
    'service-image':   'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // industrial equipment
    'location-image':  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',  // residential home exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // professional team meeting
  },
  'plumbing': {
    hero:              'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=80', // plumber fixing pipe
    'main-image':      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',  // plumber with wrench working
    'service-image':   'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80',  // bathroom plumbing fixtures
    'location-image':  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',  // modern house exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // professional plumbing team
  },
  'roofing': {
    hero:              'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1200&q=80', // roofer on roof with shingles
    'main-image':      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',    // roof tiles close-up
    'service-image':   'https://images.unsplash.com/photo-1635424685267-bd8a3f0cde18?w=800&q=80',  // roofing work in progress
    'location-image':  'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',  // beautiful house with roof
    'about-team-photo':'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // construction crew
  },
  'hvac': {
    hero:              'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80', // HVAC unit outdoor
    'main-image':      'https://images.unsplash.com/photo-1631545806609-18e42baa7c34?w=800&q=80',  // HVAC tech working on unit
    'service-image':   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80',  // AC condenser outdoor
    'location-image':  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',  // modern home exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // professional team
  },
  'electrical': {
    hero:              'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200&q=80', // electrician working on panel
    'main-image':      'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80',    // electrical wiring work
    'service-image':   'https://images.unsplash.com/photo-1590330297626-d033d3a35be6?w=800&q=80',  // electrical panel
    'location-image':  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&q=80',  // residential property
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // electrician team
  },
  'locksmith': {
    hero:              'https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',    // door lock close-up
    'main-image':      'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&q=80',  // locksmith working on lock
    'service-image':   'https://images.unsplash.com/photo-1562113530-57ba467cea38?w=800&q=80',    // keys and lock mechanism
    'location-image':  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',  // house front door
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // professional team
  },
  'fire-damage': {
    hero:              'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&q=80',    // fire damage scene
    'main-image':      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // restoration equipment
    'service-image':   'https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?w=800&q=80',  // cleanup crew
    'location-image':  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',  // residential house
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // professional team
  },
  'mold-remediation': {
    hero:              'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80', // mold inspection
    'main-image':      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // remediation equipment
    'service-image':   'https://images.unsplash.com/photo-1585325701953-4dfa0972e9cf?w=800&q=80',  // protective equipment crew
    'location-image':  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',  // home exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // professional team
  },
  'pest-control': {
    hero:              'https://images.unsplash.com/photo-1632935190508-1ee1a05a7868?w=1200&q=80', // pest control technician
    'main-image':      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',  // pest inspection home
    'service-image':   'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=80',  // pest control spraying
    'location-image':  'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',  // suburban home
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // uniformed team
  },
  'tree-service': {
    hero:              'https://images.unsplash.com/photo-1564419320406-aad99b1e6b35?w=1200&q=80', // tree trimming
    'main-image':      'https://images.unsplash.com/photo-1598300056393-4aac492f4344?w=800&q=80',  // arborist cutting tree
    'service-image':   'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80',  // tree canopy
    'location-image':  'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&q=80',  // tree-lined street
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // crew team
  },
  'garage-door': {
    hero:              'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&q=80',    // garage door on house
    'main-image':      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',  // modern garage
    'service-image':   'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80',  // garage mechanism repair
    'location-image':  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',  // luxury house with garage
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // professional team
  },
  'foundation-repair': {
    hero:              'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80', // foundation construction
    'main-image':      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // construction equipment
    'service-image':   'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&q=80',  // concrete foundation work
    'location-image':  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=800&q=80',  // residential house
    'about-team-photo':'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',  // construction crew
  },
  'carpet-cleaning': {
    hero:              'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1200&q=80',    // clean carpet living room
    'main-image':      'https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80',  // carpet cleaning machine
    'service-image':   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',    // clean interior floor
    'location-image':  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',  // modern home
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // cleaning team
  },
  'window-replacement': {
    hero:              'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80', // modern windows on building
    'main-image':      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',    // window installation
    'service-image':   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',  // glass windows close-up
    'location-image':  'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',  // house with windows
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // installation crew
  },
  'house-painting': {
    hero:              'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80', // painter painting wall
    'main-image':      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80',    // paint roller on wall
    'service-image':   'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',  // freshly painted room
    'location-image':  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',  // painted house exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // painting team
  },
  'junk-removal': {
    hero:              'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&q=80', // cleanup/hauling
    'main-image':      'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80',  // organized removal
    'service-image':   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',    // truck/dumpster
    'location-image':  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&q=80',  // clean property
    'about-team-photo':'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800&q=80',  // removal crew
  },
  'dumpster-rental': {
    hero:              'https://images.unsplash.com/photo-1618090584126-129cd1f3fbaa?w=1200&q=80', // dumpster bin
    'main-image':      'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=80',  // waste recycling
    'service-image':   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=80',  // waste removal
    'location-image':  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',  // house exterior
    'about-team-photo':'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',  // team photo
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CATEGORIES: CategoryConfig[] = [
  waterDamageConfig,
  plumbingConfig,
  roofingConfig,
  hvacConfig,
  electricalConfig,
  locksmithConfig,
  fireDamageConfig,
  moldRemediationConfig,
  pestControlConfig,
  treeServiceConfig,
  garageDoorConfig,
  foundationRepairConfig,
  carpetCleaningConfig,
  windowReplacementConfig,
  housePaintingConfig,
  junkRemovalConfig,
  dumpsterRentalConfig,
  // future: pressureWashingConfig, handymanConfig, ...
];

export function getCategoryConfig(id: string): CategoryConfig {
  return CATEGORIES.find(c => c.id === id) ?? waterDamageConfig;
}
