import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, integer, timestamp, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (legacy, kept for type compatibility)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for email/password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("ai_user"), // All users are ai_users now
  websiteLimit: integer("website_limit").default(10), // How many websites user can create
  websitesCreated: integer("websites_created").default(0), // How many websites created so far
  isActive: boolean("is_active").default(true),
  expiryDate: timestamp("expiry_date"), // Account expiry date set by admin
  personalApiKey: text("personal_api_key"), // Individual user's OpenAI API key
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const websites = pgTable("websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Link website to user
  businessData: json("business_data").notNull(),
  template: text("template").notNull(),
  selectedTemplate: text("selected_template"),
  blogOptions: json("blog_options"), // Blog generation settings
  generatedBlogPosts: json("generated_blog_posts"), // Array of generated blog posts
  blogPosts: json("blog_posts"), // Combined blog posts for website generation
  customFiles: jsonb("custom_files"), // Visual edits and overrides

  // Netlify deployment fields
  netlifyApiKey: text("netlify_api_key"), // User's Netlify API key
  netlifyUrl: text("netlify_url"), // Deployed website URL
  netlifySiteId: text("netlify_site_id"), // Netlify site ID
  netlifyDeploymentStatus: text("netlify_deployment_status").default("not_deployed"), // not_deployed, deploying, deployed, failed
  lastDeployedAt: timestamp("last_deployed_at"), // Last deployment timestamp

  title: text("title").notNull(), // Website title for CMS display
  description: text("description"), // Website description
  isActive: boolean("is_active").default(true), // Whether website is active

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull(), // Make websiteId required
  userId: varchar("user_id").notNull(), // Add userId for direct user association
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  featuredImageAlt: text("featured_image_alt"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  tags: text("tags").array(),
  category: text("category"),
  aiPrompt: text("ai_prompt"), // The prompt used to generate this post
  keywords: text("keywords"), // Original keywords/title used for generation
  status: text("status").default("published"), // draft, published, scheduled
  authorName: text("author_name").default("Admin"),
  authorEmail: text("author_email"),
  scheduledAt: text("scheduled_at"), // For scheduled posts
  publishedAt: text("published_at").default(sql`NOW()`),
  updatedAt: text("updated_at").default(sql`NOW()`),
  isPublished: text("is_published").default("true"),
  readingTime: integer("reading_time").default(5), // estimated reading time in minutes
  viewCount: integer("view_count").default(0),
  isAiGenerated: boolean("is_ai_generated").default(false),
});

export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#3b82f6"),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const blogTags = pgTable("blog_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").default(sql`NOW()`),
});

export const blogMedia = pgTable("blog_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Add userId for user association
  websiteId: varchar("website_id"), // Optional website association
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  caption: text("caption"),
  uploadedAt: timestamp("uploaded_at").default(sql`NOW()`),
});

export const apiSettings = pgTable("api_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Make API settings user-specific
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  apiKey: text("api_key"),
  accessKey: text("access_key"),
  secretKey: text("secret_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});


export const dashboardMetrics = pgTable("dashboard_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalWebsites: integer("total_websites").default(0),
  totalBlogPosts: integer("total_blog_posts").default(0),
  blogGenerationAttempts: integer("blog_generation_attempts").default(0),
  blogGenerationSuccess: integer("blog_generation_success").default(0),
  blogGenerationFailures: integer("blog_generation_failures").default(0),
  totalPageViews: integer("total_page_views").default(0),
  totalRevenue: integer("total_revenue").default(0), // In cents
  activeProjects: integer("active_projects").default(0),
  pendingTasks: integer("pending_tasks").default(0),
  recordedAt: timestamp("recorded_at").default(sql`NOW()`),
});

// Add a new table for blog generation prompts
export const blogPrompts = pgTable("blog_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  prompt: text("prompt").notNull(),
  isDefault: boolean("is_default").default(false),
  category: text("category"), // e.g., "professional", "conversational", "technical"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const adsenseSettings = pgTable("adsense_settings", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").default(""),
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

// Comprehensive site settings table for all tracking codes and snippets
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey(),
  category: text("category").notNull(), // 'analytics', 'verification', 'ads', 'custom'
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  code: text("code").default(""),
  isActive: boolean("is_active").default(true),
  placement: text("placement"), // 'head', 'body_start', 'body_end', 'header', 'footer'
  createdAt: timestamp("created_at").default(sql`NOW()`),
  updatedAt: timestamp("updated_at").default(sql`NOW()`),
});

export const businessCategories = [
  // High Competition Categories
  { name: "Bathroom and Kitchen Remodeling", competition: "High" },
  { name: "Insurance", competition: "High" },
  { name: "Roofing Replacement", competition: "High" },
  { name: "Solar Panel Installation", competition: "High" },
  { name: "Towing", competition: "High" },
  { name: "Weight Loss", competition: "High" },

  // Low Competition Categories (from CSV + existing)
  { name: "AC Companies", competition: "Low" },
  { name: "AC Repair", competition: "Low" },
  { name: "Air Duct Cleaning", competition: "Low" },
  { name: "Appliance Repair", competition: "Low" },
  { name: "Artificial Grass", competition: "Low" },
  { name: "Asphalt Paving", competition: "Low" },
  { name: "Attic Fan", competition: "Low" },
  { name: "Attic Insulation", competition: "Low" },
  { name: "Awnings", competition: "Low" },
  { name: "Backyard Design", competition: "Low" },
  { name: "Basement Remodeling", competition: "Low" },
  { name: "Basement Waterproofing", competition: "Low" },
  { name: "Bathroom Remodeling", competition: "Low" },
  { name: "Bathtub Refinishing", competition: "Low" },
  { name: "Bed Bug Exterminator", competition: "Low" },
  { name: "Boiler Repair", competition: "Low" },
  { name: "Brick Pavers", competition: "Low" },
  { name: "Cabinet Painting", competition: "Low" },
  { name: "Carpet Cleaning", competition: "Low" },
  { name: "Ceiling Fan Repair", competition: "Low" },
  { name: "Ceiling Repair", competition: "Low" },
  { name: "Chimney Sweeping", competition: "Low" },
  { name: "Cleaning Services", competition: "Low" },
  { name: "Closet Design", competition: "Low" },
  { name: "Commercial Painting", competition: "Low" },
  { name: "Concrete Countertops", competition: "Low" },
  { name: "Concrete Pavers", competition: "Low" },
  { name: "Concrete Repair", competition: "Low" },
  { name: "Copper Gutters", competition: "Low" },
  { name: "Crown Molding", competition: "Low" },
  { name: "Custom Closet", competition: "Low" },
  { name: "Custom Home Builders", competition: "Low" },
  { name: "Deck Builder", competition: "Low" },
  { name: "Deck Repair", competition: "Low" },
  { name: "Demolition", competition: "Low" },
  { name: "Door Repair", competition: "Low" },
  { name: "Drain Cleaning", competition: "Low" },
  { name: "Driveway Paving", competition: "Low" },
  { name: "Dryer Repair", competition: "Low" },
  { name: "Dryer Vent Cleaning", competition: "Low" },
  { name: "Drywall Repair", competition: "Low" },
  { name: "Electrical", competition: "Low" },
  { name: "Electrical Repair", competition: "Low" },
  { name: "Emergency Plumbing", competition: "Low" },
  { name: "Entry Doors", competition: "Low" },
  { name: "Epoxy Flooring", competition: "Low" },
  { name: "Exterior Doors", competition: "Low" },
  { name: "Exterior Painting", competition: "Low" },
  { name: "Faux Painting", competition: "Low" },
  { name: "Fence Installation", competition: "Low" },
  { name: "Fences", competition: "Low" },
  { name: "Fireplace Repair", competition: "Low" },
  { name: "Foam Roof", competition: "Low" },
  { name: "Foundation Repair", competition: "Low" },
  { name: "French Doors", competition: "Low" },
  { name: "Front Doors", competition: "Low" },
  { name: "Fumigation", competition: "Low" },
  { name: "Furnace Repair", competition: "Low" },
  { name: "Furniture Restoration", competition: "Low" },
  { name: "Garage Door Repair", competition: "Low" },
  { name: "General Contractors", competition: "Low" },
  { name: "Granite Countertops", competition: "Low" },
  { name: "Grout Cleaning", competition: "Low" },
  { name: "Gutter Cleaning", competition: "Low" },
  { name: "Gutters", competition: "Low" },
  { name: "Handyman", competition: "Low" },
  { name: "Handyman Services", competition: "Low" },
  { name: "Hardscape", competition: "Low" },
  { name: "Hardwood Floors", competition: "Low" },
  { name: "Heat Pump", competition: "Low" },
  { name: "Heating Repair", competition: "Low" },
  { name: "Home Builders", competition: "Low" },
  { name: "Home Energy Audit", competition: "Low" },
  { name: "Home Inspection", competition: "Low" },
  { name: "Home Security Systems", competition: "Low" },
  { name: "House Cleaning Services", competition: "Low" },
  { name: "House Painting", competition: "Low" },
  { name: "Humidifier", competition: "Low" },
  { name: "HVAC", competition: "Low" },
  { name: "Insulation", competition: "Low" },
  { name: "Interior Designer", competition: "Low" },
  { name: "Interior Painting", competition: "Low" },
  { name: "Iron Doors", competition: "Low" },
  { name: "Jacuzzi Repair", competition: "Low" },
  { name: "Junk Removal", competition: "Low" },
  { name: "Kitchen Remodeling", competition: "Low" },
  { name: "Laminate Countertops", competition: "Low" },
  { name: "Laminate Flooring", competition: "Low" },
  { name: "Land Surveyor", competition: "Low" },
  { name: "Landscaping", competition: "Low" },
  { name: "Landscapers", competition: "Low" },
  { name: "Lawn Aeration", competition: "Low" },
  { name: "Lawn Care", competition: "Low" },
  { name: "Lawn Mowing", competition: "Low" },
  { name: "Leak Detection", competition: "Low" },
  { name: "Locksmith", competition: "Low" },
  { name: "Maid Service", competition: "Low" },
  { name: "Metal Fabrication", competition: "Low" },
  { name: "Metal Roofing", competition: "Low" },
  { name: "Mold Removal", competition: "Low" },
  { name: "Moving Help", competition: "Low" },
  { name: "Moving Services", competition: "Low" },
  { name: "Organic Pest Control", competition: "Low" },
  { name: "Oriental Rug Cleaning", competition: "Low" },
  { name: "Oven Repair", competition: "Low" },
  { name: "Painting Contractors", competition: "Low" },
  { name: "Patio Covers", competition: "Low" },
  { name: "Pea Gravel", competition: "Low" },
  { name: "Pest Control", competition: "Low" },
  { name: "Plumbing", competition: "Low" },
  { name: "Plumbing Repair", competition: "Low" },
  { name: "Plumbing Service", competition: "Low" },
  { name: "Poison Ivy Removal", competition: "Low" },
  { name: "Pool Cleaning", competition: "Low" },
  { name: "Pool Installation", competition: "Low" },
  { name: "Pool Repair", competition: "Low" },
  { name: "Popcorn Ceiling Removal", competition: "Low" },
  { name: "Pressure Cleaning", competition: "Low" },
  { name: "Quartz Countertops", competition: "Low" },
  { name: "Rain Gutters", competition: "Low" },
  { name: "Refrigerator Repair", competition: "Low" },
  { name: "Retaining Walls", competition: "Low" },
  { name: "Roof Cleaning", competition: "Low" },
  { name: "Roof Coating", competition: "Low" },
  { name: "Roof Inspection", competition: "Low" },
  { name: "Roof Repair", competition: "Low" },
  { name: "Roof Replacement", competition: "Low" },
  { name: "Roof Tiles", competition: "Low" },
  { name: "Roofing", competition: "Low" },
  { name: "Roofing Contractors", competition: "Low" },
  { name: "Rug Cleaning", competition: "Low" },
  { name: "Seamless Gutters", competition: "Low" },
  { name: "Septic Pumping", competition: "Low" },
  { name: "Septic Repair", competition: "Low" },
  { name: "Septic Service", competition: "Low" },
  { name: "Septic Tank Cleaning", competition: "Low" },
  { name: "Shower Doors", competition: "Low" },
  { name: "Skylight Repairs", competition: "Low" },
  { name: "Sliding Glass Door Repair", competition: "Low" },
  { name: "Solar Panels", competition: "Low" },
  { name: "Soundproofing", competition: "Low" },
  { name: "Spa Repair", competition: "Low" },
  { name: "Spray Foam Insulation", competition: "Low" },
  { name: "Sprinkler Repair", competition: "Low" },
  { name: "Stair Builders", competition: "Low" },
  { name: "Stone Pavers", competition: "Low" },
  { name: "Sump Pump Installation", competition: "Low" },
  { name: "Sunroom", competition: "Low" },
  { name: "Tankless Water Heater", competition: "Low" },
  { name: "Termite Control", competition: "Low" },
  { name: "Termite Inspection", competition: "Low" },
  { name: "Tile Installation", competition: "Low" },
  { name: "Tree Removal", competition: "Low" },
  { name: "Tree Trimming", competition: "Low" },
  { name: "Upholstery Cleaning", competition: "Low" },
  { name: "Vinyl Siding", competition: "Low" },
  { name: "Walk-In Tubs", competition: "Low" },
  { name: "Wallpaper Removal", competition: "Low" },
  { name: "Washing Machine Repair", competition: "Low" },
  { name: "Water Damage", competition: "Low" },
  { name: "Water Heater Repair", competition: "Low" },
  { name: "Welding", competition: "Low" },
  { name: "Window Cleaning", competition: "Low" },
  { name: "Window Glass Repair", competition: "Low" },
  { name: "Window Installation", competition: "Low" },
  { name: "Window Repair", competition: "Low" },
  { name: "Window Replacement", competition: "Low" },

  // Existing categories not in CSV (keeping as Low competition)
  { name: "Siding & Exterior Work", competition: "Low" },
  { name: "Flooring Installation & Repair", competition: "Low" },
  { name: "Smart Home Installation", competition: "Low" },
  { name: "Masonry & Brickwork", competition: "Low" },
  { name: "Excavation & Demolition", competition: "Low" },
  { name: "Structural Engineering & Repair", competition: "Low" },
  { name: "Custom Carpentry", competition: "Low" },
  { name: "Metal Roofing & Sheet Metal Work", competition: "Low" },
  { name: "Fire Damage Restoration", competition: "Low" },
  { name: "Mold Remediation", competition: "Low" },
  { name: "Hoarding Clean-Up Services", competition: "Low" },
  { name: "Med Spa / Aesthetics Clinics", competition: "Low" },
  { name: "Hair Salons & Barbers", competition: "Low" },
  { name: "Nail Salons", competition: "Low" },
  { name: "Massage Therapists", competition: "Low" },
  { name: "Personal Trainers / Fitness Coaches", competition: "Low" },
  { name: "Dog Grooming", competition: "Low" },
  { name: "Dog Training", competition: "Low" },
  { name: "Pet Boarding / Pet Sitting", competition: "Low" },
  { name: "Mobile Vet Services", competition: "Low" },
  { name: "Legal Services", competition: "Low" },
  { name: "Financial Advisors & Tax Prep", competition: "Low" },
  { name: "Real Estate Agents", competition: "Low" },
  { name: "Insurance Agents", competition: "Low" },
  { name: "Notary Services", competition: "Low" },
  { name: "Wedding & Event Planners", competition: "Low" },
  { name: "Local SEO Agency", competition: "Low" },
  { name: "SEO Agency", competition: "Low" },
  { name: "Marketing Agency", competition: "Low" },
  { name: "Website Designer", competition: "Low" }
] as const;

export const businessCategoryNames = [
  // High Competition Categories
  "Bathroom and Kitchen Remodeling",
  "Insurance",
  "Roofing Replacement",
  "Solar Panel Installation",
  "Towing",
  "Weight Loss",

  // Low Competition Categories
  "AC Companies",
  "AC Repair",
  "Air Duct Cleaning",
  "Appliance Repair",
  "Artificial Grass",
  "Asphalt Paving",
  "Attic Fan",
  "Attic Insulation",
  "Awnings",
  "Backyard Design",
  "Basement Remodeling",
  "Basement Waterproofing",
  "Bathroom Remodeling",
  "Bathtub Refinishing",
  "Bed Bug Exterminator",
  "Boiler Repair",
  "Brick Pavers",
  "Cabinet Painting",
  "Carpet Cleaning",
  "Ceiling Fan Repair",
  "Ceiling Repair",
  "Chimney Sweeping",
  "Cleaning Services",
  "Closet Design",
  "Commercial Painting",
  "Concrete Countertops",
  "Concrete Pavers",
  "Concrete Repair",
  "Copper Gutters",
  "Crown Molding",
  "Custom Closet",
  "Custom Home Builders",
  "Deck Builder",
  "Deck Repair",
  "Demolition",
  "Door Repair",
  "Drain Cleaning",
  "Driveway Paving",
  "Dryer Repair",
  "Dryer Vent Cleaning",
  "Drywall Repair",
  "Electrical",
  "Electrical Repair",
  "Emergency Plumbing",
  "Entry Doors",
  "Epoxy Flooring",
  "Exterior Doors",
  "Exterior Painting",
  "Faux Painting",
  "Fence Installation",
  "Fences",
  "Fireplace Repair",
  "Foam Roof",
  "Foundation Repair",
  "French Doors",
  "Front Doors",
  "Fumigation",
  "Furnace Repair",
  "Furniture Restoration",
  "Garage Door Repair",
  "General Contractors",
  "Granite Countertops",
  "Grout Cleaning",
  "Gutter Cleaning",
  "Gutters",
  "Handyman",
  "Handyman Services",
  "Hardscape",
  "Hardwood Floors",
  "Heat Pump",
  "Heating Repair",
  "Home Builders",
  "Home Energy Audit",
  "Home Inspection",
  "Home Security Systems",
  "House Cleaning Services",
  "House Painting",
  "Humidifier",
  "HVAC",
  "Insulation",
  "Interior Designer",
  "Interior Painting",
  "Iron Doors",
  "Jacuzzi Repair",
  "Junk Removal",
  "Kitchen Remodeling",
  "Laminate Countertops",
  "Laminate Flooring",
  "Land Surveyor",
  "Landscaping",
  "Landscapers",
  "Lawn Aeration",
  "Lawn Care",
  "Lawn Mowing",
  "Leak Detection",
  "Locksmith",
  "Maid Service",
  "Metal Fabrication",
  "Metal Roofing",
  "Mold Removal",
  "Moving Help",
  "Moving Services",
  "Organic Pest Control",
  "Oriental Rug Cleaning",
  "Oven Repair",
  "Painting Contractors",
  "Patio Covers",
  "Pea Gravel",
  "Pest Control",
  "Plumbing",
  "Plumbing Repair",
  "Plumbing Service",
  "Poison Ivy Removal",
  "Pool Cleaning",
  "Pool Installation",
  "Pool Repair",
  "Popcorn Ceiling Removal",
  "Pressure Cleaning",
  "Quartz Countertops",
  "Rain Gutters",
  "Refrigerator Repair",
  "Retaining Walls",
  "Roof Cleaning",
  "Roof Coating",
  "Roof Inspection",
  "Roof Repair",
  "Roof Replacement",
  "Roof Tiles",
  "Roofing",
  "Roofing Contractors",
  "Rug Cleaning",
  "Seamless Gutters",
  "Septic Pumping",
  "Septic Repair",
  "Septic Service",
  "Septic Tank Cleaning",
  "Shower Doors",
  "Skylight Repairs",
  "Sliding Glass Door Repair",
  "Solar Panels",
  "Soundproofing",
  "Spa Repair",
  "Spray Foam Insulation",
  "Sprinkler Repair",
  "Stair Builders",
  "Stone Pavers",
  "Sump Pump Installation",
  "Sunroom",
  "Tankless Water Heater",
  "Termite Control",
  "Termite Inspection",
  "Tile Installation",
  "Tree Removal",
  "Tree Trimming",
  "Upholstery Cleaning",
  "Vinyl Siding",
  "Walk-In Tubs",
  "Wallpaper Removal",
  "Washing Machine Repair",
  "Water Damage",
  "Water Heater Repair",
  "Welding",
  "Window Cleaning",
  "Window Glass Repair",
  "Window Installation",
  "Window Repair",
  "Window Replacement",
  "Siding & Exterior Work",
  "Flooring Installation & Repair",
  "Smart Home Installation",
  "Masonry & Brickwork",
  "Excavation & Demolition",
  "Structural Engineering & Repair",
  "Custom Carpentry",
  "Metal Roofing & Sheet Metal Work",
  "Fire Damage Restoration",
  "Mold Remediation",
  "Hoarding Clean-Up Services",
  "Med Spa / Aesthetics Clinics",
  "Hair Salons & Barbers",
  "Nail Salons",
  "Massage Therapists",
  "Personal Trainers / Fitness Coaches",
  "Dog Grooming",
  "Dog Training",
  "Pet Boarding / Pet Sitting",
  "Mobile Vet Services",
  "Legal Services",
  "Financial Advisors & Tax Prep",
  "Real Estate Agents",
  "Insurance Agents",
  "Notary Services",
  "Wedding & Event Planners",
  "Local SEO Agency",
  "SEO Agency",
  "Marketing Agency",
  "Website Designer"
] as const;

export const businessDataSchema = z.object({


  // Location Header (appears at top of page)
  primaryZipCode: z.string().optional().default(""),
  secondaryZipCode: z.string().optional().default(""),
  specificServices: z.string().optional().default(""),

  // Hero Section
  heroService: z.string().min(1, "Service type is required"),
  heroLocation: z.string().min(1, "Location is required"),
  heroDescription: z.string().min(1, "Hero description is required"),
  headerImage: z.string().optional(),

  // Business Information
  businessName: z.string().min(1, "Business name is required"),
  category: z.enum(businessCategoryNames),
  logo: z.string().optional(),
  logoUrl: z.string().optional(),
  countryCode: z.string().optional().default("+1"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  yearsInBusiness: z.number().min(1).max(100),

  // Services & Areas
  services: z.string().min(1, "Services are required"),
  serviceAreas: z.string().min(1, "Service areas are required"),
  targetedKeywords: z.string().min(1, "Keywords are required"),

  // Additional dynamic pages
  additionalLocations: z.string().optional().default(""),
  additionalServices: z.string().optional().default(""),

  // SEO Meta Data
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),

  // Features & About
  featureHeadlines: z.string().optional().default("Professional Service, Quality Results, Expert Team, Trusted Experience, Fast Response, Customer Satisfaction"),
  featureDescriptions: z.string().optional().default("Expert professionals with years of experience, Quality workmanship and materials, Experienced team you can trust, Professional service with proven results, Quick response and efficient service, Customer satisfaction priority"),
  aboutDescription: z.string().min(1, "About description is required"),
  aboutImage: z.string().optional(),

  // Hours & Social
  businessHours: z.string().optional().default("Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 4:00 PM, Sunday: Emergency Only"),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  pinterestUrl: z.string().url().optional().or(z.literal("")),

  // Footer
  footerTitle: z.string().optional().default(""),
  footerDescription: z.string().optional().default(""),
  keyFacts: z.string().optional().default("Trusted & Verified, Years of Experience, Professional Service, Expert Solutions"),

  // SEO Content Sections
  seoHeading1: z.string().optional().default("Professional Service You Can Trust"),
  seoContent1: z.string().optional().default("Our experienced team delivers high-quality results with professional service standards that exceed expectations."),
  seoHeading2: z.string().optional().default("Expert Solutions for Your Needs"),
  seoContent2: z.string().optional().default("We provide comprehensive solutions tailored to your specific requirements with attention to detail and customer satisfaction."),
  seoHeading3: z.string().optional().default("Professional Workmanship Standards"),
  seoContent3: z.string().optional().default("Every project is completed with the highest standards of workmanship and professional service commitment."),
  seoHeading4: z.string().optional().default("Fast and Reliable Service"),
  seoContent4: z.string().optional().default("Quick response times and efficient service delivery ensure your project is completed on time and within budget."),
  seoHeading5: z.string().optional().default("Trusted and Verified Professionals"),
  seoContent5: z.string().optional().default("Our trusted and verified team provides peace of mind and professional service for every project we provide."),
  seoHeading6: z.string().optional().default("Customer Satisfaction First"),
  seoContent6: z.string().optional().default("We prioritize customer satisfaction with transparent communication, fair pricing, and quality results that last."),

  // About Business Images with Alt Text
  aboutImage2: z.string().optional(),
  aboutImageAlt: z.string().optional().default(""),
  aboutImage2Alt: z.string().optional().default(""),

  // FAQ Section
  faqQuestion1: z.string().optional().default("What services do you offer?"),
  faqAnswer1: z.string().optional().default("We provide comprehensive professional services tailored to your specific needs with quality workmanship and customer satisfaction."),
  faqQuestion2: z.string().optional().default("Are you trusted and verified?"),
  faqAnswer2: z.string().optional().default("Yes, we are trusted and verified professionals committed to providing peace of mind and quality service for every project."),
  faqQuestion3: z.string().optional().default("Do you offer free estimates?"),
  faqAnswer3: z.string().optional().default("Yes, we provide free, no-obligation estimates for all our services. Contact us to schedule your consultation."),
  faqQuestion4: z.string().optional().default("What areas do you serve?"),
  faqAnswer4: z.string().optional().default("We proudly serve the local area and surrounding communities. Contact us to confirm service availability in your location."),
  faqQuestion5: z.string().optional().default("How quickly can you start my project?"),
  faqAnswer5: z.string().optional().default("We strive to begin projects as soon as possible, typically within days of approval. Timeline depends on project scope and current schedule."),
  faqQuestion6: z.string().optional().default("Do you stand behind your work?"),
  faqAnswer6: z.string().optional().default("Yes, we stand behind our work with professional service commitment. We're committed to quality results and customer satisfaction."),
  faqQuestion7: z.string().optional().default("What payment methods do you accept?"),
  faqAnswer7: z.string().optional().default("We accept various payment methods including cash, check, and major credit cards for your convenience."),
  faqQuestion8: z.string().optional().default("Do you provide emergency services?"),
  faqAnswer8: z.string().optional().default("We offer emergency services for urgent situations. Contact us directly for immediate assistance and rapid response."),
  faqQuestion9: z.string().optional().default("Can you help with permits and inspections?"),
  faqAnswer9: z.string().optional().default("Yes, we can assist with necessary permits and coordinate inspections to ensure all work meets local codes and regulations."),
  faqQuestion10: z.string().optional().default("How do I schedule a service appointment?"),
  faqAnswer10: z.string().optional().default("Simply call us or use our contact form to schedule your service appointment. We'll work with your schedule to find a convenient time."),

  // Call-to-Action Buttons (Optional)  
  ctaCallButton: z.boolean().optional().default(false),
  ctaWhatsappNumber: z.string().optional().default(""),
  ctaCustomUrl: z.string().optional().default(""),
  ctaCustomText: z.string().optional().default(""),

  // Lead Generation Disclaimer (Optional)
  leadGenDisclaimer: z.string().optional().default(""),

  // Testimonials Section
  testimonial1Name: z.string().optional().default(""),
  testimonial1Text: z.string().optional().default(""),
  testimonial1Rating: z.number().min(1).max(5).optional().default(5),
  testimonial2Name: z.string().optional().default(""),
  testimonial2Text: z.string().optional().default(""),
  testimonial2Rating: z.number().min(1).max(5).optional().default(5),
  testimonial3Name: z.string().optional().default(""),
  testimonial3Text: z.string().optional().default(""),
  testimonial3Rating: z.number().min(1).max(5).optional().default(5),

  // Blog Generation Options
  generateBlog: z.boolean().optional().default(false),
  blogMode: z.enum(["ai", "manual"]).optional().default("ai"),
  blogPromptId: z.string().optional().default("professional"),
  blogKeywords: z.string().optional().default(""),
  blogTitles: z.string().optional().default(""),
  blogWordCount: z.number().optional().default(1500),
  blogUseImages: z.boolean().optional().default(true),
  blogAiProvider: z.enum(["openai", "gemini", "openrouter", "deepseek"]).optional().default("openai"),

  // Content AI Provider (for general website content generation)
  contentAiProvider: z.enum(["openai", "gemini", "openrouter", "deepseek"]).optional().default("openai"),
  blogOutputOption: z.enum(["direct_download", "blog_integrated"]).optional().default("blog_integrated"),

  // Publish and Background Generation Tiers
  publishTier: z.enum(["1", "2", "3"]).optional().default("1"),
  generationStatus: z.enum(["idle", "generating", "deploying", "completed", "failed"]).optional().default("idle"),
  generationProgress: z.number().optional().default(0),
  generationError: z.string().optional(),

  // Manual Blog Data (session-based, cleared on new generation)
  blogPosts: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    excerpt: z.string().min(1, "Excerpt is required"),
    content: z.string().min(1, "Content is required"),
    featuredImage: z.string().optional(),
    featuredImageUrl: z.string().url().optional(),
    featuredImageAlt: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(["draft", "published"]).default("published"),
    authorName: z.string().optional(),
    isAiGenerated: z.boolean().default(false),
  })).max(30, "Maximum 30 blog articles allowed").default([]),

  blogCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
  })).default([]),
}).refine((data) => {
  // If blog generation is enabled and mode is AI, require prompt ID and blog titles
  if (data.generateBlog && data.blogMode === "ai") {
    return data.blogPromptId && data.blogPromptId.length > 0 &&
      data.blogTitles && data.blogTitles.length > 0;
  }
  return true;
}, {
  message: "When AI blog generation is enabled, AI writing style and blog titles are required (no keywords - titles only)",
  path: ["blogPromptId"]
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWebsiteSchema = insertWebsiteSchema.partial();

export type BusinessData = z.infer<typeof businessDataSchema>;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type UpdateWebsite = z.infer<typeof updateWebsiteSchema>;
export type Website = typeof websites.$inferSelect;

// Bulk import schema for CSV processing
export const bulkImportSchema = z.object({
  businesses: z.array(businessDataSchema),
  template: z.string().default("modern"),
});

export type BulkImportData = z.infer<typeof bulkImportSchema>;

// Blog post schemas
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
});

export const updateBlogPostSchema = insertBlogPostSchema.partial();

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>;

// Blog Categories schemas
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
});

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

// Blog Tags schemas
export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
});

export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;

// Blog Media schemas
export const insertBlogMediaSchema = createInsertSchema(blogMedia).omit({
  id: true,
  uploadedAt: true,
});

export type BlogMedia = typeof blogMedia.$inferSelect;
export type InsertBlogMedia = z.infer<typeof insertBlogMediaSchema>;


// API Settings schemas
export const insertApiSettingSchema = createInsertSchema(apiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateApiSettingSchema = insertApiSettingSchema.partial();

export type ApiSetting = typeof apiSettings.$inferSelect;
export type InsertApiSetting = z.infer<typeof insertApiSettingSchema>;
export type UpdateApiSetting = z.infer<typeof updateApiSettingSchema>;

// Blog Prompt schemas
export const insertBlogPromptSchema = createInsertSchema(blogPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBlogPromptSchema = insertBlogPromptSchema.partial();

export type BlogPrompt = typeof blogPrompts.$inferSelect;
export type InsertBlogPrompt = z.infer<typeof insertBlogPromptSchema>;
export type UpdateBlogPrompt = z.infer<typeof updateBlogPromptSchema>;

// AdSense Settings schemas
export const insertAdSenseSettingSchema = createInsertSchema(adsenseSettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateAdSenseSettingSchema = insertAdSenseSettingSchema.partial();

export type AdSenseSetting = typeof adsenseSettings.$inferSelect;
export type InsertAdSenseSetting = z.infer<typeof insertAdSenseSettingSchema>;
export type UpdateAdSenseSetting = z.infer<typeof updateAdSenseSettingSchema>;

// Site Settings schemas
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateSiteSettingSchema = insertSiteSettingSchema.partial();

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type UpdateSiteSetting = z.infer<typeof updateSiteSettingSchema>;

// Dashboard Metrics schemas
export const insertDashboardMetricsSchema = createInsertSchema(dashboardMetrics).omit({
  id: true,
  recordedAt: true,
});

export type DashboardMetrics = typeof dashboardMetrics.$inferSelect;
export type InsertDashboardMetrics = z.infer<typeof insertDashboardMetricsSchema>;

// User schema types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = insertUserSchema.partial();

export const upsertUserSchema = createInsertSchema(users, {
  id: z.string(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

// Blog generation options schema
export const blogGenerationSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(["ai", "manual"]).default("ai"),
  // AI generation options
  aiPrompt: z.string().optional(),
  keywords: z.string().optional(),
  useImages: z.boolean().default(true),
  postsCount: z.number().min(1).max(20).default(5),
  aiProvider: z.enum(["openai", "gemini", "openrouter", "deepseek"]).default("gemini"),
  // Manual blog data (session-based)
  manualPosts: z.array(z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    content: z.string(),
    featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    status: z.enum(["draft", "published"]).default("published"),
    authorName: z.string().default("Admin"),
    isAiGenerated: z.boolean().default(false),
  })).max(100).default([]),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
  })).default([]),
});

export type BlogGenerationOptions = z.infer<typeof blogGenerationSchema>;

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
