import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Sparkles, Globe, Palette, Layers, Bot, Rocket, Download,
  CheckCircle2, ArrowRight, HelpCircle, AlertTriangle, Monitor,
  Sliders, PenTool, Image, BookOpen
} from "lucide-react";

export default function HowToUsePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("generator");

  const tabs = [
    {
      id: "generator",
      label: "🚀 Website Generator",
      icon: Sparkles,
      title: "Generate Your Website with AI",
      description: "Create a fully functioning, SEO-optimized local service website in less than 60 seconds.",
      steps: [
        {
          title: "Select Your Category",
          desc: "Choose from our local business niches (e.g., Water Damage Restoration, Appliance Repair, Plumbing, Dumpster Rental)."
        },
        {
          title: "Input Business Details",
          desc: "Provide your business name, primary location, phone number, and service areas to customize the generated copy."
        },
        {
          title: "Generate Content",
          desc: "Our AI engine uses advanced models (like Gemini 2.5) to write professional headings, lists, testimonials, and SEO tags."
        }
      ],
      tip: "We sanitize all inputs automatically to title-case your primary keywords and clean up duplicate commas or formatting bugs."
    },
    {
      id: "design",
      label: "🎨 Layout & Styling",
      icon: Palette,
      title: "Customize Design & Brand Colors",
      description: "Match the design layout and colors with your brand identity.",
      steps: [
        {
          title: "Pick a Professional Palette",
          desc: "Choose between dynamic themes like Sky Blue, Emerald Green, Dark Slate, or Amber Gold to fit your brand identity."
        },
        {
          title: "Upload Your Logo",
          desc: "Add your custom brand logo. The footer and headers will automatically update to display it perfectly."
        },
        {
          title: "Map & Contacts Placement",
          desc: "The Google Map is automatically formatted and embedded full-width at the footer for all pages (except Contact) to maximize user trust."
        }
      ],
      tip: "Every template layout is built performance-first to score 95+ on Google PageSpeed Insights."
    },
    {
      id: "gallery",
      label: "📸 Images & Slider Toggle",
      icon: Image,
      title: "Manage Gallery & Comparisons",
      description: "Showcase your work and control before/after image sliders.",
      steps: [
        {
          title: "Add Showcase Images",
          desc: "Upload photos of your team, equipment, or recent service jobs directly to the media gallery."
        },
        {
          title: "Control Before/After Toggle",
          desc: "In the editor's Images tab, you can turn off the 'Before/After Comparison' slider if you don't have comparison photos."
        },
        {
          title: "Instant Preview Rebuild",
          desc: "Toggling the Before/After option updates the live preview instantly so you can see the changes in real-time."
        }
      ],
      tip: "If the before/after toggle is turned off, the gallery will neatly display static showcase images instead."
    },
    {
      id: "blog",
      label: "✍️ AI Blog Engine",
      icon: Bot,
      title: "Generate & Manage SEO Blog Posts",
      description: "Rank higher on search engines by posting regular, helpful articles.",
      steps: [
        {
          title: "Enable Blog Page Toggle",
          desc: "Turn on the 'Enable Blog Page' switch in the Blog editor tab. This instantly injects the Blog link into the main navigation and sitemaps."
        },
        {
          title: "One-Click AI Generation",
          desc: "Select a content prompt and let our AI engine generate up to 30 high-quality, relevant articles in one click."
        },
        {
          title: "SEO Meta Optimization",
          desc: "Every post comes complete with custom meta titles, meta descriptions, focus keywords, and schema markup."
        }
      ],
      tip: "For custom pages, the editor automatically capitalizes the first letter of all generated meta titles for professional search result presentation."
    },
    {
      id: "deploy",
      label: "⚡ Publish & ZIP Download",
      icon: Rocket,
      title: "Deploy Live or Download Clean Code",
      description: "Get your site hosted on the web or download clean static files.",
      steps: [
        {
          title: "Instant Netlify Deployment",
          desc: "Deploy directly to our cloud servers. Your site gets a secure SSL certificate, CDN, and goes live in under 60 seconds."
        },
        {
          title: "Download ZIP Option",
          desc: "Paid plan users (Tier 2/3) can download the entire website's static HTML/CSS/JS code as a ZIP archive."
        },
        {
          title: "Google Search Console Ready",
          desc: "Sitemaps (`sitemap.xml`, `sitemap.html`) are fully compiled with clean static extensions to prevent crawler indexation issues."
        }
      ],
      tip: "Paid tier users have access to both options: 1-click Netlify deploy or download files for manual hosting."
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];
  const IconComponent = currentTab.icon;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pt-24 pb-16">
      {/* Hero Header */}
      <section className="relative px-4 sm:px-6 lg:px-8 overflow-hidden text-center mb-12">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100/60 border border-purple-200/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <BookOpen className="h-4 w-4 text-purple-700" />
            <span className="text-sm font-medium text-purple-900">SiteGenie Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-slate-950">
            How to Use{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-amber-500">
              SiteGenie
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Follow this visual guide to learn how to build, customize, and publish your professional websites in minutes.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0 bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 px-2">Guides & Workflows</span>
            <div className="flex flex-col gap-1.5">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/15"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`}
                  >
                    <TabIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label.split(" ").slice(1).join(" ")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Guide Pane */}
          <div className="flex-grow w-full bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-950">{currentTab.title}</h2>
                <p className="text-sm text-slate-500">{currentTab.description}</p>
              </div>
            </div>

            <hr className="border-slate-100 mb-8" />

            {/* Steps Visual Layout */}
            <div className="grid gap-6 mb-8">
              {currentTab.steps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start group">
                  <div className="h-8 w-8 rounded-full bg-purple-50 border border-purple-200/50 flex-shrink-0 flex items-center justify-center font-bold text-sm text-purple-700 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition-colors">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-purple-700 transition-colors">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tip Box */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 flex gap-3 items-start">
              <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Pro Tip</span>
                <p className="text-sm text-amber-900/90 leading-relaxed">{currentTab.tip}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Quick FAQ / Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-950 mb-2">Frequently Asked Questions</h2>
          <p className="text-slate-600">Got questions about SiteGenie? Here are quick answers.</p>
        </div>

        <div className="grid gap-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          {[
            {
              q: "Can I host the generated website on my own servers?",
              a: "Yes! If you are on a paid plan (Tier 2/3), you can download the entire website files in a ZIP package and upload them to any hosting provider (GoDaddy, Bluehost, Hostinger, etc.)."
            },
            {
              q: "How fast will my website load?",
              a: "Extremely fast! Generated websites are pure static HTML, CSS, and Vanilla JavaScript. They score 95+ out of 100 on Google PageSpeed Insights and load under 1 second."
            },
            {
              q: "Why did Google Search Console say my sitemap couldn't be read?",
              a: "Older versions generated paths without the .html extension. We have patched this! All sitemaps now contain clean static extensions (.html) to ensure indexation works flawlessly."
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0 pt-4 first:pt-0">
              <h4 className="font-bold text-slate-950 mb-1.5 flex gap-2 items-center">
                <HelpCircle className="h-4.5 w-4.5 text-purple-600 flex-shrink-0" />
                {faq.q}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed pl-6.5">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="text-center mt-12 bg-gradient-to-r from-purple-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-purple-900/10 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-purple-500/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="text-2xl font-bold mb-2">Ready to launch your site?</h3>
            <p className="text-purple-100/90 text-sm mb-6">Create fully SEO-optimized, blazing-fast local websites in just a few clicks.</p>
            <Button
              onClick={() => setLocation("/dashboard/websites")}
              className="bg-white hover:bg-slate-100 text-purple-800 font-bold px-8 py-5.5 rounded-xl shadow-lg"
            >
              Start Building Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
