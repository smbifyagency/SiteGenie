import React, { useState, useEffect, useMemo, useRef } from "react";
import { BusinessData } from "@shared/schema";
import { generateWebsiteFiles } from "@/lib/website-generator";
import { generateAllWebsiteFiles } from "@/lib/dynamic-website-generator";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Smartphone, Monitor, Edit3, Rocket } from "lucide-react";
import { PublishWebsiteModal } from "@/components/publish-website-modal";
import { VisualEditor } from "@/components/visual-editor";

const VISUAL_EDITOR_CSS_KEY = "__visual_editor_css__";

interface FullPagePreviewProps {
  businessData: Partial<BusinessData>;
  template: string;
  isOpen: boolean;
  onClose: () => void;
  websiteId?: string;
  onWebsiteIdAssigned?: (websiteId: string) => void;
  useDynamicGenerator?: boolean;
  editedFiles?: Record<string, string>;
  setEditedFiles?: (files: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function FullPagePreview({
  businessData,
  template,
  isOpen,
  onClose,
  websiteId,
  onWebsiteIdAssigned,
  useDynamicGenerator = false,
  editedFiles = {},
  setEditedFiles
}: FullPagePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showNetlifyModal, setShowNetlifyModal] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [localEditedFiles, setLocalEditedFiles] = useState<Record<string, string>>({});
  const liveEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeEditedFiles = editedFiles && Object.keys(editedFiles).length > 0 ? editedFiles : localEditedFiles;
  const updateEditedFiles = setEditedFiles || setLocalEditedFiles;

  const [currentPage, setCurrentPage] = useState<string>('index.html');

  // Generate all the website files when data changes
  const generatedFiles = useMemo<Record<string, string> | null>(() => {
    try {
      if (!businessData.businessName && !businessData.heroService) {
        return null;
      }

      // Create a complete business data object with fallbacks for required fields
      const completeData: BusinessData = {
        primaryZipCode: businessData.primaryZipCode || "12345",
        secondaryZipCode: businessData.secondaryZipCode || "67890",
        specificServices: businessData.specificServices || "Professional services",
        countryCode: businessData.countryCode || "+1",
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
        metaTitle: businessData.metaTitle || `${businessData.businessName || "Your Business"} - ${businessData.heroService || "Professional Services"}`,
        metaDescription: businessData.metaDescription || `Professional ${businessData.heroService || "services"} in ${businessData.heroLocation || "your area"}`,
        aboutImage: businessData.aboutImage || "",
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
        testimonial1Name: businessData.testimonial1Name || "",
        testimonial1Text: businessData.testimonial1Text || "",
        testimonial1Rating: businessData.testimonial1Rating || 5,
        testimonial2Name: businessData.testimonial2Name || "",
        testimonial2Text: businessData.testimonial2Text || "",
        testimonial2Rating: businessData.testimonial2Rating || 5,
        testimonial3Name: businessData.testimonial3Name || "",
        testimonial3Text: businessData.testimonial3Text || "",
        testimonial3Rating: businessData.testimonial3Rating || 5,
        generateBlog: businessData.generateBlog || false,
        blogMode: businessData.blogMode || "ai",
        blogPromptId: businessData.blogPromptId || "",
        blogKeywords: businessData.blogKeywords || "",
        blogTitles: businessData.blogTitles || "",
        blogWordCount: businessData.blogWordCount || 1500,
        blogUseImages: businessData.blogUseImages || true,
        blogAiProvider: businessData.blogAiProvider || "openai",
        blogOutputOption: businessData.blogOutputOption || "blog_integrated",
        blogPosts: businessData.blogPosts || [],
        blogCategories: businessData.blogCategories || [],
        publishTier: businessData.publishTier || "3",
        generationStatus: businessData.generationStatus || "idle",
        generationProgress: businessData.generationProgress || 0,
      };

      if (useDynamicGenerator) {
        return generateAllWebsiteFiles(completeData, template) as Record<string, string>;
      } else {
        const website = generateWebsiteFiles(completeData, template);
        return {
          'index.html': website.html.replace(
            '<link rel="stylesheet" href="styles.css">',
            `<style>${website.css}</style>`
          ).replace(
            '<script src="script.js"></script>',
            `<script>${website.js}</script>`
          ),
          'styles.css': website.css,
          'script.js': website.js || ''
        } as Record<string, string>;
      }
    } catch (error) {
      console.error("Error generating preview files:", error);
      return null;
    }
  }, [businessData, template, useDynamicGenerator]);

  // Handle cross-document navigation
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE') {
        const targetUrl = event.data.url;
        let fileKey = targetUrl;

        // Remove leading slashes
        if (fileKey.startsWith('/')) fileKey = fileKey.substring(1);

        // Strip out anchor hash
        const hashIndex = fileKey.indexOf('#');
        const pagePath = hashIndex > -1 ? fileKey.substring(0, hashIndex) : fileKey;

        // Only navigate if it's a real page path, ignore pure anchor jump
        if (pagePath !== '') {
          let targetPage = pagePath;

          if (generatedFiles && generatedFiles[targetPage]) {
            setCurrentPage(targetPage);
          } else if (generatedFiles && generatedFiles[targetPage + '.html']) {
            setCurrentPage(targetPage + '.html');
          } else {
            console.warn("Page not found in preview suite:", targetPage);
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [generatedFiles]);

  // Reset to index correctly when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPage('index.html');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (liveEditTimeoutRef.current) {
        clearTimeout(liveEditTimeoutRef.current);
      }
    };
  }, []);

  const mergeEditedBodyIntoDocument = (baseHtml: string, editedHtml: string) => {
    if (!editedHtml?.trim()) return baseHtml;

    if (/<html[\s>]/i.test(editedHtml) || /<body[\s>]/i.test(editedHtml)) {
      return editedHtml;
    }

    const bodyOpenMatch = baseHtml.match(/<body[^>]*>/i);
    if (!bodyOpenMatch) {
      return editedHtml;
    }

    const bodyOpenTag = bodyOpenMatch[0];
    const bodyPattern = /<body[^>]*>[\s\S]*<\/body>/i;
    if (!bodyPattern.test(baseHtml)) {
      return editedHtml;
    }

    return baseHtml.replace(bodyPattern, `${bodyOpenTag}\n${editedHtml}\n</body>`);
  };

  const ensurePageHtmlDocument = (candidateHtml: string, pageKey: string) => {
    if (!candidateHtml?.trim()) return getPlaceholderHtml();
    if (/<html[\s>]/i.test(candidateHtml)) return candidateHtml;

    const baseDocument =
      generatedFiles?.[pageKey] ||
      generatedFiles?.["index.html"] ||
      getPlaceholderHtml();

    return mergeEditedBodyIntoDocument(baseDocument, candidateHtml);
  };

  const pageSourceHtml = useMemo(() => {
    if (!generatedFiles) return getPlaceholderHtml();

    const isLikelyCorruptEditedHtml = (candidate: string | undefined, fallbackHtml?: string) => {
      if (!candidate || typeof candidate !== "string") return true;
      const trimmed = candidate.trim();
      if (!trimmed) return true;

      // Body fragments are allowed; they'll be merged into a full document below.
      const hasDocumentStructure = /<html[\s>]/i.test(trimmed) || /<body[\s>]/i.test(trimmed);
      if (!hasDocumentStructure) return false;

      try {
        if (typeof window !== "undefined") {
          const parser = new DOMParser();
          const doc = parser.parseFromString(trimmed, "text/html");
          const body = doc.body;
          if (!body) return true;

          const meaningfulNodes = Array.from(body.querySelectorAll("*")).filter((el) => {
            const tag = el.tagName.toLowerCase();
            return !["script", "style", "meta", "link"].includes(tag);
          });
          const text = (body.textContent || "").replace(/\s+/g, " ").trim();

          if (meaningfulNodes.length === 0) return true;
          if (meaningfulNodes.length < 5 && text.length < 60) return true;
        } else {
          if (trimmed.length < 120) return true;
        }
      } catch {
        // Keep candidate on parser failure to avoid dropping legitimate edits.
        return false;
      }

      if (fallbackHtml && trimmed === fallbackHtml.trim()) return false;
      return false;
    };

    const safeEditedCurrentPage = isLikelyCorruptEditedHtml(
      activeEditedFiles[currentPage],
      generatedFiles[currentPage]
    )
      ? undefined
      : activeEditedFiles[currentPage];

    const safeEditedIndex = isLikelyCorruptEditedHtml(
      activeEditedFiles["index.html"],
      generatedFiles["index.html"]
    )
      ? undefined
      : activeEditedFiles["index.html"];

    const candidateHtml =
      safeEditedCurrentPage ||
      generatedFiles[currentPage] ||
      safeEditedIndex ||
      generatedFiles['index.html'] ||
      getPlaceholderHtml();

    return ensurePageHtmlDocument(candidateHtml, currentPage);
  }, [generatedFiles, activeEditedFiles, currentPage]);

  const applyVisualEdits = (editedBodyHtml: string, editedCss: string) => {
    const mergedPageHtml = mergeEditedBodyIntoDocument(pageSourceHtml, editedBodyHtml);
    const normalizedVisualCss = normalizeVisualEditorCss(editedCss);

    updateEditedFiles((prev) => {
      const nextFiles = {
        ...prev,
        [currentPage]: mergedPageHtml
      } as Record<string, string>;

      if (normalizedVisualCss) {
        nextFiles[VISUAL_EDITOR_CSS_KEY] = normalizedVisualCss;
      } else {
        delete nextFiles[VISUAL_EDITOR_CSS_KEY];
      }

      return nextFiles;
    });
  };

  const normalizeCssForComparison = (css: string) =>
    css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();

  const stripBaseCssSnapshot = (candidateCss: string, baseCss: string) => {
    const candidate = candidateCss?.trim();
    if (!candidate) return "";

    const base = baseCss?.trim();
    if (!base) return candidate;

    if (candidate === base) return "";
    if (candidate.startsWith(base)) {
      return candidate.slice(base.length).trim();
    }

    const indexOfExactBase = candidate.indexOf(base);
    if (indexOfExactBase >= 0) {
      return `${candidate.slice(0, indexOfExactBase)}\n${candidate.slice(indexOfExactBase + base.length)}`
        .trim();
    }

    const normalizedCandidate = normalizeCssForComparison(candidate);
    const normalizedBase = normalizeCssForComparison(base);
    if (!normalizedCandidate || !normalizedBase) return candidate;
    if (normalizedCandidate === normalizedBase) return "";

    if (
      normalizedCandidate.length >= Math.floor(normalizedBase.length * 0.95) &&
      normalizedBase.length > 200 &&
      normalizedCandidate.startsWith(normalizedBase.slice(0, 200)) &&
      normalizedCandidate.endsWith(normalizedBase.slice(-200))
    ) {
      return "";
    }

    return candidate;
  };

  const normalizeLegacyCustomCss = (customCss: string, generatedCss: string) => {
    let normalized = customCss || "";
    normalized = stripBaseCssSnapshot(normalized, generatedCss);
    return normalized.trim();
  };

  const normalizeVisualEditorCss = (visualCss: string) => {
    const generatedCss = generatedFiles?.["styles.css"] || "";
    const legacyCustomCss = activeEditedFiles["styles.css"] || "";

    let normalized = visualCss || "";
    normalized = stripBaseCssSnapshot(normalized, generatedCss);
    normalized = stripBaseCssSnapshot(normalized, legacyCustomCss);
    return normalized.trim();
  };

  const getCombinedGlobalCss = () => {
    const generatedCss = generatedFiles?.["styles.css"] || "";
    const legacyCustomCss = normalizeLegacyCustomCss(activeEditedFiles["styles.css"] || "", generatedCss);
    const visualEditorCss = normalizeVisualEditorCss(activeEditedFiles[VISUAL_EDITOR_CSS_KEY] || "");

    return [generatedCss, legacyCustomCss, visualEditorCss]
      .filter(Boolean)
      .join("\n\n");
  };

  const inlinePreviewAssets = (html: string, css: string, js: string) => {
    if (!html?.trim()) return html;

    let withInlineAssets = html
      .replace(/<style[^>]*data-preview-inline=["']styles["'][^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*data-preview-inline=["']script["'][^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<link[^>]*href=["'][^"']*styles\.css(?:\?[^"']*)?["'][^>]*>\s*/gi, "")
      .replace(/<script[^>]*src=["'][^"']*script\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi, "");

    if (css?.trim()) {
      const inlineStyleTag = `<style data-preview-inline="styles">${css}</style>`;
      withInlineAssets = /<\/head>/i.test(withInlineAssets)
        ? withInlineAssets.replace(/<\/head>/i, `${inlineStyleTag}</head>`)
        : `${inlineStyleTag}${withInlineAssets}`;
    }

    if (js?.trim()) {
      const inlineScriptTag = `<script data-preview-inline="script">${js}</script>`;
      withInlineAssets = /<\/body>/i.test(withInlineAssets)
        ? withInlineAssets.replace(/<\/body>/i, `${inlineScriptTag}</body>`)
        : `${withInlineAssets}${inlineScriptTag}`;
    }

    return withInlineAssets;
  };

  const rawWebsiteHtml = useMemo(() => {
    let html = pageSourceHtml;

    // Robustly inline CSS/JS in preview so edited pages don't break when relative asset links vary.
    if (generatedFiles) {
      const globalCss = useDynamicGenerator ? getCombinedGlobalCss() : (activeEditedFiles['styles.css'] || generatedFiles['styles.css'] || '');
      const globalJs = activeEditedFiles['script.js'] || generatedFiles['script.js'] || '';
      html = inlinePreviewAssets(html, globalCss, globalJs);
    }

    return html;
  }, [generatedFiles, activeEditedFiles, pageSourceHtml, useDynamicGenerator]);

  const websiteHtml = useMemo(() => {
    let html = rawWebsiteHtml;

    // Inject the navigation interceptor script
    const interceptScript = `
      <script>
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a && a.getAttribute('href') && !a.getAttribute('href').startsWith('http') && !a.getAttribute('href').startsWith('tel:') && !a.getAttribute('href').startsWith('mailto:')) {
            e.preventDefault();
            let href = a.getAttribute('href');
            window.parent.postMessage({ type: 'NAVIGATE', url: href }, '*');
          }
        });
      </script>
    `;

    if (html.includes('</body>')) {
      return html.replace('</body>', `${interceptScript}</body>`);
    }
    return html + interceptScript;
  }, [rawWebsiteHtml]);

  const [blobUrl, setBlobUrl] = useState<string>("");

  const safeWebsiteHtml = useMemo(() => {
    const trimmed = websiteHtml?.trim();
    if (!trimmed) return getPlaceholderHtml();
    return websiteHtml;
  }, [websiteHtml]);

  useEffect(() => {
    const htmlForBlob = safeWebsiteHtml?.trim() ? safeWebsiteHtml : getPlaceholderHtml();
    const blob = new Blob([htmlForBlob], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [safeWebsiteHtml]);

  function getPlaceholderHtml(): string {
    return `<!DOCTYPE html>
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
        <h1>Website Preview</h1>
        <p>Fill in your business information in the form to see your website!</p>
        <p>Start with Business Name and Service Type for the best preview experience.</p>
    </div>
</body>
</html>`;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Website Preview</h2>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded transition-colors ${viewMode === 'desktop'
                  ? 'text-blue-600 bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Desktop View"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded transition-colors ${viewMode === 'mobile'
                  ? 'text-blue-600 bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
                title="Mobile View"
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVisualEditor(true)}
              className="text-[#7C3AED] border-[#7C3AED]/20 hover:bg-[#7C3AED]/5"
            >
              <Edit3 size={16} className="mr-2" />
              Visual Editor
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowNetlifyModal(true)}
              data-testid="button-deploy-netlify"
            >
              <Rocket size={16} className="mr-2" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([safeWebsiteHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }}
              data-testid="button-open-new-tab"
              className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
            >
              <ExternalLink size={16} className="mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              data-testid="button-close"
              className="text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
            >
              <X size={16} className="mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
          <div className="h-full flex justify-center">
            <div
              className={`bg-white h-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 ${viewMode === 'mobile' ? 'w-80' : 'w-full'
                }`}
              style={{
                maxWidth: viewMode === 'mobile' ? '380px' : '100%',
                minWidth: viewMode === 'mobile' ? '380px' : 'auto'
              }}
            >
              <iframe
                key={`${currentPage}-${safeWebsiteHtml.length}`}
                src={blobUrl || undefined}
                srcDoc={safeWebsiteHtml}
                className="w-full h-full border-0 rounded-lg"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Publish Website Modal */}
      {websiteId && (
        <PublishWebsiteModal
          isOpen={showNetlifyModal}
          onClose={() => setShowNetlifyModal(false)}
          websiteId={websiteId}
          onDeploySuccess={(url, siteName) => {
            // handled by the modal
          }}
        />
      )}

      {/* Visual Editor Modal */}
      <VisualEditor
        initialHtml={pageSourceHtml}
        globalCss={getCombinedGlobalCss()}
        isOpen={showVisualEditor}
        onClose={() => setShowVisualEditor(false)}
        onLiveChange={(newHtml, newCss) => {
          if (liveEditTimeoutRef.current) {
            clearTimeout(liveEditTimeoutRef.current);
          }

          liveEditTimeoutRef.current = setTimeout(() => {
            applyVisualEdits(newHtml, newCss);
          }, 180);
        }}
        onSave={(newHtml, newCss) => {
          if (liveEditTimeoutRef.current) {
            clearTimeout(liveEditTimeoutRef.current);
            liveEditTimeoutRef.current = null;
          }

          applyVisualEdits(newHtml, newCss);
          setShowVisualEditor(false);
        }}
      />
    </div>
  );
}
