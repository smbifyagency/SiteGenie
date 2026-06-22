import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
    Sparkles, Globe, Search, Rocket, Code2, Shield, Layers, FileText,
    Palette, Gauge, Link2, BarChart3, Bot, Database, Lock, Users,
    ArrowRight, CheckCircle, Zap
} from "lucide-react";

const featureGroups = [
    {
        title: "AI Content Engine",
        subtitle: "Generate professional content in seconds",
        features: [
            {
                icon: Bot,
                title: "Multi-Model AI Support",
                description: "Choose between OpenAI GPT-4o, Google Gemini 2.5, or OpenRouter. Bring your own keys — zero platform markup.",
            },
            {
                icon: FileText,
                title: "Smart Page Generation",
                description: "Auto-generate homepage copy, service descriptions, about pages, testimonials, and FAQs tailored to your business category.",
            },
            {
                icon: Code2,
                title: "AI Blog Engine",
                description: "Generate up to 30 SEO-optimized blog posts in one click. Auto-generates titles, meta descriptions, featured images, and categories.",
            },
        ],
    },
    {
        title: "Local SEO Suite",
        subtitle: "Rank higher in local search results",
        features: [
            {
                icon: Search,
                title: "Schema Markup Manager",
                description: "Auto-generate LocalBusiness, Service, FAQ, and BreadcrumbList structured data. Validates against Google's rich results.",
            },
            {
                icon: Link2,
                title: "Internal Links Map",
                description: "Visualize your internal link graph, identify orphan pages, and optimize link equity distribution automatically.",
            },
            {
                icon: BarChart3,
                title: "Keyword Tracker",
                description: "Track your target keywords across generated pages. Monitor coverage and identify content gaps for better rankings.",
            },
        ],
    },
    {
        title: "Design & Templates",
        subtitle: "Professional designs for every industry",
        features: [
            {
                icon: Layers,
                title: "10+ Pro Templates",
                description: "Industry-specific templates for plumbers, dentists, restaurants, law firms, and more. All fully responsive.",
            },
            {
                icon: Palette,
                title: "Smart Color Matching",
                description: "AI analyzes your brand and suggests optimal color palettes. One-click theme switching with live preview.",
            },
            {
                icon: Globe,
                title: "Multi-Page Websites",
                description: "Generate complete multi-page sites with homepage, services, locations, about, contact, and blog sections.",
            },
        ],
    },
    {
        title: "Deploy & Scale",
        subtitle: "Go live in seconds, scale effortlessly",
        features: [
            {
                icon: Rocket,
                title: "One-Click Deploy",
                description: "Deploy directly to Netlify with automatic SSL, CDN, and custom domain support. Your site goes live in under 60 seconds.",
            },
            {
                icon: Database,
                title: "Export Options",
                description: "Download as ZIP for manual hosting, or deploy to Netlify, Vercel, or any static hosting provider.",
            },
            {
                icon: Gauge,
                title: "Performance First",
                description: "All generated sites score 95+ on Google PageSpeed. Optimized HTML, lazy-loaded images, and minimal CSS.",
            },
        ],
    },
    {
        title: "Agency Features",
        subtitle: "Built for scaling agencies",
        features: [
            {
                icon: Users,
                title: "Team Collaboration",
                description: "Invite team members with role-based access. Assign projects, review changes, and manage clients from one dashboard.",
            },
            {
                icon: Shield,
                title: "White-Label Branding",
                description: "Remove SiteGenie branding completely. Use your own logo, colors, and custom domain for the client portal.",
            },
            {
                icon: Lock,
                title: "API Key Security",
                description: "Session-based key storage with auto-expiry. Keys are never stored permanently — full BYOK privacy.",
            },
        ],
    },
];

export default function FeaturesPage() {
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/8 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
                        <Zap className="h-4 w-4 text-[#7C3AED]" />
                        <span className="text-sm text-gray-600">Everything you need to build & rank</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900">
                        Powerful Features for{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#F59E0B]">
                            Local SEO
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
                        From AI content generation to one-click deployment — every tool your
                        local business website needs, built right in.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            size="lg"
                            onClick={() => setLocation("/dashboard/websites")}
                            className="bg-[#7C3AED] hover:bg-[#9333EA] text-white font-bold text-base px-8 py-6 rounded-xl shadow-lg shadow-[#7C3AED]/25"
                        >
                            Try It Free <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setLocation("/pricing")}
                            className="text-base px-8 py-6 rounded-xl border-gray-300 text-gray-900 hover:bg-gray-50 bg-transparent"
                        >
                            View Pricing
                        </Button>
                    </div>
                </div>
            </section>

            {/* Feature Groups */}
            {featureGroups.map((group, groupIdx) => (
                <section key={group.title} className={`py-20 px-4 sm:px-6 lg:px-8 ${groupIdx % 2 !== 0 ? "bg-gray-50" : ""}`}>
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-14">
                            <p className="text-[#7C3AED] font-semibold text-sm uppercase tracking-wider mb-3">
                                {group.subtitle}
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{group.title}</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {group.features.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={feature.title}
                                        className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-purple-200"
                                    >
                                        <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 bg-[#7C3AED]/10 text-[#7C3AED]">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            ))}

            {/* Comparison */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">Why SiteGenie vs. Traditional Web Dev?</h2>
                        <p className="text-gray-600">See how we compare to hiring a developer or using WordPress.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-3 bg-gray-50">
                            <div className="p-4 font-semibold text-gray-500 text-sm"></div>
                            <div className="p-4 text-center font-semibold text-[#7C3AED] text-sm">SiteGenie</div>
                            <div className="p-4 text-center font-semibold text-gray-500 text-sm">Traditional</div>
                        </div>
                        {[
                            ["Time to launch", "5 minutes", "2-8 weeks"],
                            ["Cost", "$0 – $79/mo", "$2,000 – $10,000"],
                            ["SEO optimization", "Built-in", "Extra cost"],
                            ["Content creation", "AI-powered", "Manual"],
                            ["Schema markup", "Automatic", "Manual coding"],
                            ["Blog engine", "Included", "Plugin setup"],
                            ["Maintenance", "Zero", "Ongoing"],
                        ].map(([label, SiteGenie, traditional], i) => (
                            <div key={label} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-gray-50" : ""}`}>
                                <div className="p-4 text-sm text-gray-700 font-medium">{label}</div>
                                <div className="p-4 text-center text-sm text-[#7C3AED] flex items-center justify-center gap-1">
                                    <CheckCircle className="h-3.5 w-3.5" /> {SiteGenie}
                                </div>
                                <div className="p-4 text-center text-sm text-gray-500">{traditional}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 mb-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">Ready to Build?</h2>
                    <p className="text-gray-600 max-w-xl mx-auto mb-8">
                        Start creating SEO-optimized websites in minutes. Completely free to start.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => setLocation("/dashboard/websites")}
                        className="bg-[#7C3AED] hover:bg-[#9333EA] text-white font-bold text-base px-10 py-6 rounded-xl shadow-lg shadow-[#7C3AED]/25"
                    >
                        <Sparkles className="mr-2 h-5 w-5" />
                        Start Building — It's Free
                    </Button>
                </div>
            </section>
        </div>
    );
}
