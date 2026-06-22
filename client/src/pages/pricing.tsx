import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Check, X, Sparkles, Zap, Building2, HelpCircle } from "lucide-react";
import { useState } from "react";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description: "Try SiteGenie with your own API keys. Perfect for getting started.",
        icon: Sparkles,
        color: "gray",
        cta: "Start Free",
        features: [
            { name: "1 website", included: true },
            { name: "AI content generation (BYOK)", included: true },
            { name: "5 blog posts per site", included: true },
            { name: "Full SEO optimization", included: true },
            { name: "Download as ZIP", included: true },
            { name: "200+ business categories", included: true },
            { name: "Netlify deployment", included: false },
            { name: "Custom domain support", included: false },
            { name: "Priority support", included: false },
            { name: "Admin dashboard access", included: false },
        ],
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For freelancers & small agencies managing multiple client websites.",
        icon: Zap,
        color: "indigo",
        cta: "Get Pro Access",
        popular: true,
        features: [
            { name: "10 websites", included: true },
            { name: "AI content generation (BYOK)", included: true },
            { name: "Unlimited blog posts", included: true },
            { name: "Advanced SEO suite", included: true },
            { name: "One-click Netlify deploy", included: true },
            { name: "Custom domains", included: true },
            { name: "Visual editor", included: true },
            { name: "Email support", included: true },
            { name: "Admin dashboard access", included: false },
            { name: "White-label branding", included: false },
        ],
    },
    {
        name: "Agency",
        price: "$79",
        period: "/month",
        description: "Unlimited power for agencies scaling local SEO services at volume.",
        icon: Building2,
        color: "violet",
        cta: "Contact Sales",
        features: [
            { name: "Unlimited websites", included: true },
            { name: "AI content generation (BYOK)", included: true },
            { name: "Unlimited blog posts", included: true },
            { name: "Full SEO suite + schema", included: true },
            { name: "All deployment options", included: true },
            { name: "Custom domains", included: true },
            { name: "Full admin dashboard", included: true },
            { name: "User management & roles", included: true },
            { name: "White-label branding", included: true },
            { name: "Priority support", included: true },
        ],
    },
];

const faqs = [
    {
        question: "Do I need my own API keys?",
        answer: "Yes! SiteGenie uses a BYOK (Bring Your Own Key) model. You provide your OpenAI, Google Gemini, or OpenRouter API keys, and you only pay for the tokens you use. This keeps our platform fees low while giving you full control over AI costs.",
    },
    {
        question: "How does the website limit work?",
        answer: "Each plan has a website creation limit. Free users can create 1 website, Pro users get 10, and Agency users get unlimited. You can delete existing websites to free up slots, or upgrade your plan for more capacity.",
    },
    {
        question: "Can I cancel anytime?",
        answer: "Absolutely. All paid plans are month-to-month with no long-term contracts. Cancel anytime — your existing sites remain live and deployed until the end of your billing period.",
    },
    {
        question: "What happens to my deployed sites if I downgrade?",
        answer: "Your existing Netlify-deployed sites stay live and functional. However, you won't be able to create new sites beyond your plan's limit until you upgrade again or delete unused projects.",
    },
    {
        question: "What AI models are supported?",
        answer: "SiteGenie supports OpenAI GPT-4o, GPT-4o Mini, Google Gemini 2.5 Flash, and 100+ models via OpenRouter. You can use any combination with your own API keys.",
    },
    {
        question: "Do you offer custom enterprise plans?",
        answer: "Yes, we offer custom enterprise plans for large agencies with 50+ client sites. Contact our sales team for volume pricing, dedicated support, and custom branding options.",
    },
];

export default function PricingPage() {
    const [, setLocation] = useLocation();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7C3AED]/8 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#7C3AED]/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
                <div className="relative max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-900">
                        Simple, Transparent{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#F59E0B]">
                            Pricing
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        No hidden fees. No per-site charges. Choose the plan that fits your needs
                        and scale as you grow.
                    </p>
                </div>
            </section>

            {/* Plans */}
            <section className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl border p-8 transition-all hover:-translate-y-1 ${plan.popular
                                        ? "border-[#7C3AED]/40 bg-gradient-to-b from-[#7C3AED]/10 to-transparent shadow-lg shadow-[#7C3AED]/10"
                                        : "border-gray-200 bg-white shadow-sm"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-xs font-bold px-4 py-1 rounded-full">
                                        Most Popular
                                    </div>
                                )}
                                <div className="mb-6">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                                    <span className="text-gray-500 ml-1">{plan.period}</span>
                                </div>
                                <Button
                                    onClick={() => setLocation(plan.name === "Agency" ? "/contact" : "/signup")}
                                    className={`w-full mb-8 py-6 text-base font-semibold rounded-xl ${plan.popular
                                            ? "bg-[#7C3AED] hover:bg-[#9333EA] text-white shadow-lg shadow-[#7C3AED]/25"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                                <div className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <div key={feature.name} className="flex items-center gap-3 text-sm">
                                            {feature.included ? (
                                                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                            ) : (
                                                <X className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                            )}
                                            <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
                        <p className="text-gray-600">Everything you need to know about our pricing and plans.</p>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left"
                                >
                                    <span className="font-medium text-gray-900">{faq.question}</span>
                                    <HelpCircle className={`h-5 w-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-45" : ""}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center rounded-2xl border border-gray-200 bg-gray-50 p-12">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900">Ready to Get Started?</h2>
                    <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                        Start building professional websites for your clients today. No credit card required.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => setLocation("/signup")}
                        className="bg-[#7C3AED] hover:bg-[#9333EA] text-white font-bold text-base px-10 py-6 rounded-xl shadow-lg shadow-[#7C3AED]/25"
                    >
                        Start Building Free
                    </Button>
                </div>
            </section>
        </div>
    );
}
