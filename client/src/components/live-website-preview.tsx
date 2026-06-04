import React, { useState, useEffect, useMemo } from "react";
import { BusinessData } from "@shared/schema";
import { generateWebsiteFiles } from "@/lib/website-generator";
import { generateAllWebsiteFiles } from "@/lib/dynamic-website-generator";

interface LiveWebsitePreviewProps {
  businessData: Partial<BusinessData>;
  template: string;
  useDynamicGenerator?: boolean;
}

export function LiveWebsitePreview({ businessData, template, useDynamicGenerator = false }: LiveWebsitePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('index.html');
  const [allWebsiteFiles, setAllWebsiteFiles] = useState<{ [filename: string]: string }>({});

  // Generate all website files when data changes
  const websiteFiles = useMemo(() => {
    try {
      // Only generate if we have minimum required data
      if (!businessData.businessName && !businessData.heroService) {
        return { 'index.html': getPlaceholderHtml() };
      }

      // Create a complete business data object with fallbacks for required fields
      const completeData: BusinessData = {
        primaryZipCode: businessData.primaryZipCode || "",
        secondaryZipCode: businessData.secondaryZipCode || "",
        specificServices: businessData.specificServices || "",
        countryCode: businessData.countryCode || "+1",
        metaTitle: businessData.metaTitle || "",
        metaDescription: businessData.metaDescription || "",
        heroService: businessData.heroService || "Professional Services",
        heroLocation: businessData.heroLocation || "Your City",
        heroDescription: businessData.heroDescription || "Quality services you can trust",
        businessName: businessData.businessName || "Your Business",
        category: businessData.category || "Handyman",
        phone: businessData.phone || "(555) 123-4567",
        email: businessData.email || "info@yourbusiness.com",
        address: businessData.address || "123 Main St, Your City",
        yearsInBusiness: businessData.yearsInBusiness || 5,
        services: businessData.services || "Professional services available",
        serviceAreas: businessData.serviceAreas || "Local area",
        targetedKeywords: businessData.targetedKeywords || "",
        additionalLocations: businessData.additionalLocations || "",
        additionalServices: businessData.additionalServices || "",
        featureHeadlines: businessData.featureHeadlines || "Quality,Professional,Reliable",
        featureDescriptions: businessData.featureDescriptions || "Top quality service,Professional approach,Reliable results",
        aboutDescription: businessData.aboutDescription || "We provide professional services with dedication to quality and customer satisfaction.",
        businessHours: businessData.businessHours || "Mon-Fri: 9AM-5PM\nSat: 10AM-4PM\nSun: Closed",
        facebookUrl: businessData.facebookUrl || "https://facebook.com/yourbusiness",
        twitterUrl: businessData.twitterUrl || "https://twitter.com/yourbusiness",
        linkedinUrl: businessData.linkedinUrl || "https://linkedin.com/company/yourbusiness",
        pinterestUrl: businessData.pinterestUrl || "https://pinterest.com/yourbusiness",
        footerTitle: businessData.footerTitle || "Contact Us Today",
        footerDescription: businessData.footerDescription || "Get in touch for professional service",
        keyFacts: businessData.keyFacts || "Professional service provider",
        contentAiProvider: businessData.contentAiProvider || "openai",
        seoHeading1: businessData.seoHeading1 || "",
        seoContent1: businessData.seoContent1 || "",
        seoHeading2: businessData.seoHeading2 || "",
        seoContent2: businessData.seoContent2 || "",
        seoHeading3: businessData.seoHeading3 || "",
        seoContent3: businessData.seoContent3 || "",
        seoHeading4: businessData.seoHeading4 || "",
        seoContent4: businessData.seoContent4 || "",
        seoHeading5: businessData.seoHeading5 || "",
        seoContent5: businessData.seoContent5 || "",
        seoHeading6: businessData.seoHeading6 || "",
        seoContent6: businessData.seoContent6 || "",
        aboutImage2: businessData.aboutImage2 || "",
        aboutImageAlt: businessData.aboutImageAlt || "",
        aboutImage2Alt: businessData.aboutImage2Alt || "",
        faqQuestion1: businessData.faqQuestion1 || "",
        faqAnswer1: businessData.faqAnswer1 || "",
        faqQuestion2: businessData.faqQuestion2 || "",
        faqAnswer2: businessData.faqAnswer2 || "",
        faqQuestion3: businessData.faqQuestion3 || "",
        faqAnswer3: businessData.faqAnswer3 || "",
        faqQuestion4: businessData.faqQuestion4 || "",
        faqAnswer4: businessData.faqAnswer4 || "",
        faqQuestion5: businessData.faqQuestion5 || "",
        faqAnswer5: businessData.faqAnswer5 || "",
        faqQuestion6: businessData.faqQuestion6 || "",
        faqAnswer6: businessData.faqAnswer6 || "",
        faqQuestion7: businessData.faqQuestion7 || "",
        faqAnswer7: businessData.faqAnswer7 || "",
        faqQuestion8: businessData.faqQuestion8 || "",
        faqAnswer8: businessData.faqAnswer8 || "",
        faqQuestion9: businessData.faqQuestion9 || "",
        faqAnswer9: businessData.faqAnswer9 || "",
        faqQuestion10: businessData.faqQuestion10 || "",
        faqAnswer10: businessData.faqAnswer10 || "",
        ctaCallButton: businessData.ctaCallButton || false,
        ctaWhatsappNumber: businessData.ctaWhatsappNumber || "",
        ctaCustomUrl: businessData.ctaCustomUrl || "",
        ctaCustomText: businessData.ctaCustomText || "",
        leadGenDisclaimer: businessData.leadGenDisclaimer || "",

        // Testimonials Section
        testimonial1Name: businessData.testimonial1Name || "",
        testimonial1Text: businessData.testimonial1Text || "",
        testimonial1Rating: businessData.testimonial1Rating || 5,
        testimonial2Name: businessData.testimonial2Name || "",
        testimonial2Text: businessData.testimonial2Text || "",
        testimonial2Rating: businessData.testimonial2Rating || 5,
        testimonial3Name: businessData.testimonial3Name || "",
        testimonial3Text: businessData.testimonial3Text || "",
        testimonial3Rating: businessData.testimonial3Rating || 5,

        // Blog Generation Options - provide safe defaults
        generateBlog: businessData.generateBlog || false,
        blogMode: businessData.blogMode || "ai",
        blogPromptId: businessData.blogPromptId || "conversational", // Default to first available prompt
        blogKeywords: businessData.blogKeywords || "professional services",
        blogTitles: businessData.blogTitles || "",
        blogWordCount: businessData.blogWordCount || 1500,
        blogUseImages: businessData.blogUseImages !== undefined ? businessData.blogUseImages : true,
        blogAiProvider: businessData.blogAiProvider || "openai",
        blogOutputOption: businessData.blogOutputOption || "blog_integrated",
        blogPosts: businessData.blogPosts || [],
        blogCategories: businessData.blogCategories || [],
        publishTier: businessData.publishTier || "1",
        generationStatus: businessData.generationStatus || "idle",
        generationProgress: businessData.generationProgress || 0,
      };

      if (useDynamicGenerator) {
        const files = generateAllWebsiteFiles(completeData, template);
        return files;
      } else {
        const website = generateWebsiteFiles(completeData, template);
        // Inline the CSS and JS into the HTML for single-page preview
        const inlinedHtml = website.html.replace(
          '<link rel="stylesheet" href="styles.css">',
          `<style>${website.css}</style>`
        ).replace(
          '<script src="script.js"></script>',
          `<script>${website.js}</script>`
        );
        return { 'index.html': inlinedHtml };
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      return { 'index.html': getPlaceholderHtml() };
    }
  }, [businessData, template, useDynamicGenerator]);

  // Get current page HTML with navigation handling
  const currentPageHtml = useMemo(() => {
    const files = websiteFiles;
    let html = files[currentPage] || files['index.html'] || getPlaceholderHtml();

    // For dynamic generator, inline CSS and JS and enable navigation
    if (useDynamicGenerator && files['styles.css'] && files['script.js']) {
      html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        `<style>${files['styles.css']}</style>`
      ).replace(
        '<script src="script.js"></script>',
        `<script>
          ${files['script.js']}
          
          // Override navigation to work within iframe
          document.addEventListener('DOMContentLoaded', function() {
            // Handle all HTML page links
            const links = document.querySelectorAll('a[href$=".html"]');
            links.forEach(link => {
              link.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                window.parent.postMessage({ type: 'navigate', page: href }, '*');
              });
            });
            
            // Handle dropdown toggles
            const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
            dropdownToggles.forEach(toggle => {
              toggle.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.closest('.dropdown');
                const menu = dropdown.querySelector('.dropdown-menu');
                
                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu').forEach(otherMenu => {
                  if (otherMenu !== menu) {
                    otherMenu.style.display = 'none';
                  }
                });
                
                // Toggle current dropdown
                if (menu.style.display === 'block') {
                  menu.style.display = 'none';
                } else {
                  menu.style.display = 'block';
                }
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
            
            // Handle mobile menu toggle
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navLinks = document.querySelector('#navLinks');
            if (mobileMenuBtn && navLinks) {
              mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
              });
            }
          });
        </script>`
      );
    }

    return html;
  }, [websiteFiles, currentPage, useDynamicGenerator]);

  // Handle navigation messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigate') {
        setCurrentPage(event.data.page);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Force iframe refresh when content changes
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [currentPageHtml]);

  // Update available files when websiteFiles change
  useEffect(() => {
    setAllWebsiteFiles(websiteFiles);
  }, [websiteFiles]);

  function getPlaceholderHtml(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Preview</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .placeholder-content {
            max-width: 500px;
            opacity: 0.9;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        p {
            font-size: 1.25rem;
            line-height: 1.6;
            margin-bottom: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 2rem;
            opacity: 0.7;
        }
    </style>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="placeholder-content">
        <div class="icon">
            <i class="fas fa-globe"></i>
        </div>
        <h1>Live Preview</h1>
        <p>Fill in your business information in the form to see your website come to life!</p>
        <p>Start with Business Name and Service Type to see the preview.</p>
    </div>
</body>
</html>`;
  }

  // Get list of available pages for navigation
  const availablePages = Object.keys(allWebsiteFiles).filter(filename =>
    filename.endsWith('.html')
  ).sort();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900">Live Website Preview</h3>
            {useDynamicGenerator && availablePages.length > 1 && (
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              >
                {availablePages.map(page => (
                  <option key={page} value={page}>
                    {page === 'index.html' ? 'Home' :
                      page.startsWith('location-') ? `Location: ${page.replace('location-', '').replace('.html', '').replace(/-/g, ' ')}` :
                        page.startsWith('service-') ? `Service: ${page.replace('service-', '').replace('.html', '').replace(/-/g, ' ')}` :
                          page}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 transition-colors ${viewMode === 'desktop' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'} rounded`}
              title="Desktop View"
            >
              <i className="fas fa-desktop text-sm"></i>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 transition-colors ${viewMode === 'mobile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'} rounded`}
              title="Mobile View"
            >
              <i className="fas fa-mobile-alt text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-gray-100 rounded-lg overflow-hidden flex justify-center" style={{ height: "700px" }}>
          <div
            className={`bg-white h-full overflow-hidden transition-all duration-300 ${viewMode === 'mobile' ? 'w-80 mx-2' : 'w-full'
              }`}
            style={{
              maxWidth: viewMode === 'mobile' ? '380px' : '100%',
              minWidth: viewMode === 'mobile' ? '380px' : '1000px'
            }}
          >
            <iframe
              key={previewKey}
              srcDoc={currentPageHtml}
              className="w-full h-full border-0"
              title="Website Preview"
              sandbox="allow-scripts allow-same-origin"
              style={{
                transform: viewMode === 'mobile' ? 'scale(0.9)' : 'scale(1)',
                transformOrigin: 'top center',
                width: viewMode === 'mobile' ? '111%' : '100%',
                height: viewMode === 'mobile' ? '111%' : '100%'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}