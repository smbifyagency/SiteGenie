/**
 * CMS-like Publish Website Modal
 * 
 * Flow:
 *  1. API Status — auto-checks if Netlify token is configured
 *  2. URL Search — user enters desired slug, checks availability
 *  3. Deploy — progressive deployment (homepage first, then background pages)
 *  4. Success — shows live URL with visit button
 *
 * Redeploy mode — pre-fills current URL, allows editing with warning
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Search,
  Rocket,
  Globe,
  AlertTriangle,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

type PublishStep = "checklist" | "api-check" | "url-search" | "deploying" | "success";

interface ChecklistCompletionState {
  completedCount: number;
  totalCount: number;
  percent: number;
  incompleteItems: string[];
}

const modalStepLabels: Record<Exclude<PublishStep, "success">, string> = {
  checklist: "Checklist",
  "api-check": "API",
  "url-search": "URL",
  deploying: "Deploy",
};

interface PublishWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDeployTab?: () => void;
  websiteId: string;
  /** Pre-filled slug (e.g. from urlSlug field) */
  defaultSlug?: string;
  /** Currently deployed URL - enables redeploy mode */
  deployedUrl?: string;
  /** Current Netlify site name (for redeploy) */
  currentSiteName?: string;
  /** Netlify token (may be masked) */
  netlifyToken?: string;
  /** Whether token was already verified */
  tokenVerified?: boolean;
  /** Checklist completion state shown before publish */
  checklistCompletion?: ChecklistCompletionState;
  /** Opens the checklist tab in the editor */
  onReviewChecklist?: () => void;
  /** Flush latest editor state to the backend before deploy starts */
  onBeforeDeploy?: () => Promise<void> | void;
  /** Callback when deployment succeeds */
  onDeploySuccess?: (url: string, siteName: string) => void;
  publishTier?: '1' | '2' | '3';
  onChangePublishTier?: (tier: '1' | '2' | '3') => void;
}

export function PublishWebsiteModal({
  isOpen,
  onClose,
  onOpenDeployTab,
  websiteId,
  defaultSlug = "",
  deployedUrl = "",
  currentSiteName = "",
  netlifyToken = "",
  tokenVerified = false,
  checklistCompletion,
  onReviewChecklist,
  onBeforeDeploy,
  onDeploySuccess,
  publishTier,
  onChangePublishTier,
}: PublishWebsiteModalProps) {
  const { toast } = useToast();
  const isRedeploy = Boolean(deployedUrl);

  // ── State ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<PublishStep>("api-check");
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  // URL search
  const [slug, setSlug] = useState("");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState("");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Deploy
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployPhase, setDeployPhase] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultSiteName, setResultSiteName] = useState("");
  const [localTier, setLocalTier] = useState<'1' | '2' | '3'>('1');
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checklistNeedsAttention = (checklistCompletion?.percent ?? 100) < 100;
  const modalSteps = (checklistNeedsAttention
    ? ["checklist", "api-check", "url-search", "deploying"]
    : ["api-check", "url-search", "deploying"]) as PublishStep[];
  const currentStepIndex = step === "success"
    ? modalSteps.length - 1
    : Math.max(modalSteps.indexOf(step), 0);

  // ── Polling & Status Check ─────────────────────────────────────────
  const startPollingStatus = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/generation-status`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status === 'generating') {
          setDeployProgress(Math.max(data.progress || 0, 15));
          setDeployPhase("Generating website pages copy...");
        } else if (data.status === 'deploying') {
          setDeployProgress(Math.max(data.progress || 0, 75));
          setDeployPhase("Publishing to Netlify CDN...");
        } else if (data.status === 'completed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setDeployProgress(100);
          setDeployPhase("Website is live!");
          const finalUrl = `https://${slug || data.siteName || resultSiteName || currentSiteName || defaultSlug}.netlify.app`;
          setResultUrl(finalUrl);
          setResultSiteName(slug || data.siteName || resultSiteName || currentSiteName || defaultSlug);
          setStep("success");
          setIsDeploying(false);
          onDeploySuccess?.(finalUrl, slug || data.siteName || resultSiteName || currentSiteName || defaultSlug);
        } else if (data.status === 'failed') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setIsDeploying(false);
          setStep("url-search");
          toast({
            title: "Background Generation Failed",
            description: data.error || "An unknown error occurred during AI generation.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error polling generation status:", err);
      }
    }, 2000);
  }, [websiteId, slug, resultSiteName, currentSiteName, defaultSlug, onDeploySuccess, toast]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const wasOpenRef = useRef(false);

  // ── Initialize on open ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    // Reset state
    setStep(checklistNeedsAttention ? "checklist" : "api-check");
    setApiConnected(null);
    setIsCheckingApi(false);
    setSlugAvailable(null);
    setSlugMessage("");
    setIsEditingUrl(false);
    setDeployProgress(0);
    setDeployPhase("");
    setResultUrl("");
    setResultSiteName("");
    setIsDeploying(false);
    setLocalTier(publishTier || '1');

    // Pre-fill slug
    if (isRedeploy && currentSiteName) {
      setSlug(currentSiteName);
    } else if (defaultSlug) {
      setSlug(defaultSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    } else {
      setSlug("");
    }

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    if (!checklistNeedsAttention) {
      void checkApiStatus();
    }

    // Load publishTier and background generation status from server
    fetch(`/api/websites/${websiteId}/generation-status`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          if (d.publishTier) {
            setLocalTier(d.publishTier);
          }
          if (d.status === 'generating' || d.status === 'deploying') {
            setStep('deploying');
            setIsDeploying(true);
            setDeployProgress(d.progress || 0);
            setDeployPhase(d.status === 'deploying' ? 'Publishing to Netlify CDN...' : 'Generating website pages copy...');
            startPollingStatus();
          }
        }
      })
      .catch(err => console.error("Error fetching status on load:", err));
  }, [checklistNeedsAttention, currentSiteName, defaultSlug, isOpen, isRedeploy, publishTier, websiteId, startPollingStatus]);

  // ── API Status Check ──────────────────────────────────────────────
  async function checkApiStatus() {
    setIsCheckingApi(true);
    setApiConnected(null);

    try {
      // If token was already verified externally
      if (tokenVerified && netlifyToken) {
        setApiConnected(true);
        setIsCheckingApi(false);
        setStep("url-search");
        return;
      }

      // Check from server settings
      const res = await fetch("/api/settings/netlify", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data?.apiKey) {
          setApiConnected(true);
          setStep("url-search");
          // If redeploy, auto-set availability for current site
          if (isRedeploy && currentSiteName) {
            setSlugAvailable(true);
            setSlugMessage(`"${currentSiteName}.netlify.app" is your current site. Ready to update.`);
          }
        } else {
          setApiConnected(false);
        }
      } else {
        setApiConnected(false);
      }
    } catch {
      setApiConnected(false);
    } finally {
      setIsCheckingApi(false);
    }
  }

  function continueFromChecklist() {
    setStep("api-check");
    void checkApiStatus();
  }

  // ── Debounced slug availability check ──────────────────────────────
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    const cleaned = slugToCheck.toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
    if (!cleaned || cleaned.length < 3) {
      setSlugAvailable(null);
      setSlugMessage(cleaned.length > 0 ? "Site name must be at least 3 characters." : "");
      return;
    }

    setIsCheckingSlug(true);
    setSlugAvailable(null);
    setSlugMessage("");

    try {
      const res = await fetch("/api/netlify/check-site-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          siteName: cleaned,
          websiteId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSlugAvailable(null);
        setSlugMessage(data?.message || "Could not verify availability.");
        return;
      }

      setSlugAvailable(Boolean(data?.available));
      setSlugMessage(data?.message || (data?.available
        ? `"${cleaned}.netlify.app" is available!`
        : `"${cleaned}.netlify.app" is not available.`));
    } catch {
      setSlugAvailable(null);
      setSlugMessage("Network error. Could not check availability.");
    } finally {
      setIsCheckingSlug(false);
    }
  }, [websiteId]);

  // Debounce slug input
  function handleSlugChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    setSlugAvailable(null);
    setSlugMessage("");

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    if (cleaned.length >= 3) {
      checkTimeoutRef.current = setTimeout(() => {
        checkSlugAvailability(cleaned);
      }, 600);
    }
  }

  // ── Deploy ────────────────────────────────────────────────────────
  async function handlePublish() {
    console.log("[PublishWebsiteModal] handlePublish clicked.", { slug, slugAvailable, localTier });
    if (!slug || slugAvailable !== true) {
      console.warn("[PublishWebsiteModal] Cannot publish: slug is empty or not available.");
      return;
    }

    setStep("deploying");
    setIsDeploying(true);
    setDeployProgress(10);
    setDeployPhase("Saving latest changes...");

    try {
      // Phase 1: Save latest content
      console.log("[PublishWebsiteModal] Calling onBeforeDeploy...");
      await onBeforeDeploy?.();
      console.log("[PublishWebsiteModal] onBeforeDeploy completed.");

      setDeployProgress(15);
      setDeployPhase("Initiating deployment...");

      // Phase 2: Deploy via the WD endpoint
      console.log("[PublishWebsiteModal] Sending deploy-wd POST request...");
      const res = await fetch(`/api/websites/${websiteId}/deploy-wd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          netlifyApiKey: netlifyToken || "masked",
          siteName: slug,
          publishTier: localTier,
        }),
      });

      console.log("[PublishWebsiteModal] deploy-wd response status:", res.status);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("[PublishWebsiteModal] deploy-wd error response data:", errData);
        throw new Error(errData.error || errData.message || `Server error ${res.status}`);
      }

      const data = await res.json();
      console.log("[PublishWebsiteModal] deploy-wd response data:", data);
      
      if (data.status === 'generating') {
        setDeployProgress(15);
        setDeployPhase("Generating website pages copy...");
        startPollingStatus();
      } else {
        const url = data.url || `https://${slug}.netlify.app`;
        setDeployProgress(100);
        setDeployPhase("Website is live!");
        setResultUrl(url);
        setResultSiteName(slug);
        setStep("success");
        onDeploySuccess?.(url, slug);
        setIsDeploying(false);
      }
    } catch (err) {
      console.error("[PublishWebsiteModal] Exception caught in handlePublish:", err);
      toast({
        title: "Deployment Failed",
        description: err instanceof Error ? err.message : String(err),

        variant: "destructive",
      });
      setStep("url-search");
      setIsDeploying(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  function handleClose() {
    if (isDeploying) return; // prevent closing during deployment
    onClose();
  }

  function handleOpenDeployTab() {
    onOpenDeployTab?.();
    handleClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-gray-950 border-gray-800 text-white">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-gray-800">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Rocket className="w-5 h-5 text-[#7C3AED]" />
            {isRedeploy ? "Update Website" : "Publish Website"}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {modalSteps.map((modalStep, index) => {
              const isActive = currentStepIndex === index;
              const isPast = currentStepIndex > index;
              return (
                <div key={modalStep} className="flex items-center gap-2">
                  {index > 0 && <div className={`w-8 h-px ${isPast || isActive ? 'bg-[#7C3AED]' : 'bg-gray-700'}`} />}
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                    isActive ? 'bg-[#7C3AED]/20 text-[#7C3AED]' :
                    isPast ? 'bg-green-900/30 text-green-400' :
                    'bg-gray-800 text-gray-500'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 flex items-center justify-center text-[10px]">{index + 1}</span>}
                    {modalStepLabels[modalStep as Exclude<PublishStep, "success">]}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-5 min-h-[280px]">
          {step === "checklist" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-amber-700/40 bg-amber-950/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-200">Checklist is not fully complete yet</p>
                    <p className="text-xs text-amber-100/80 mt-1">
                      You can still publish now, but finishing the remaining items reduces the chance of launch mistakes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Checklist completion</span>
                  <span>{checklistCompletion?.completedCount ?? 0}/{checklistCompletion?.totalCount ?? 0}</span>
                </div>
                <Progress value={checklistCompletion?.percent ?? 0} className="h-2 bg-gray-800" />
                <p className="text-sm font-medium text-white">{checklistCompletion?.percent ?? 0}% completed</p>
              </div>

              {!!checklistCompletion?.incompleteItems?.length && (
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                  <p className="text-xs font-medium text-gray-300 mb-2">Still pending</p>
                  <div className="space-y-1.5">
                    {checklistCompletion.incompleteItems.slice(0, 5).map((item) => (
                      <p key={item} className="text-xs text-gray-400">• {item}</p>
                    ))}
                    {checklistCompletion.incompleteItems.length > 5 && (
                      <p className="text-xs text-gray-500">+{checklistCompletion.incompleteItems.length - 5} more items in the checklist</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onReviewChecklist?.();
                    handleClose();
                  }}
                  className="flex-1 border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                >
                  Review Checklist
                </Button>
                <Button
                  onClick={continueFromChecklist}
                  className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white font-medium"
                >
                  Continue Anyway
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 1: API Check ───────────────────────────────── */}
          {step === "api-check" && (
            <div className="space-y-4">
              <div className="text-center py-6">
                {isCheckingApi ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Checking Netlify connection...</p>
                  </>
                ) : apiConnected === true ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-green-400 font-medium">Netlify API Connected</p>
                    <p className="text-xs text-gray-500 mt-1">Your API token is configured and ready.</p>
                  </>
                ) : apiConnected === false ? (
                  <>
                    <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-sm text-red-400 font-medium">Netlify Not Connected</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Add your Netlify Personal Access Token in the Deploy tab or API Settings page.
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenDeployTab}
                        className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Setup in Deploy Tab
                      </Button>
                      <Link href="/api-setup">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleClose}
                          className="border-[#7C3AED]/40 bg-gray-900 text-[#7C3AED] hover:bg-[#7C3AED]/10"
                        >
                          Go to API Settings
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : null}
              </div>

              {apiConnected === true && (
                <Button
                  onClick={() => setStep("url-search")}
                  className="w-full bg-[#7C3AED] hover:bg-[#9333EA] text-white font-medium"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* ── Step 2: URL Search ──────────────────────────────── */}
          {step === "url-search" && (
            <div className="space-y-5">
              {/* Redeploy banner */}
              {isRedeploy && !isEditingUrl && (
                <div className="rounded-lg bg-blue-950/40 border border-blue-800/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-blue-300 font-medium flex items-center gap-1.5">
                        <Globe className="w-4 h-4" /> Currently Live
                      </p>
                      <a href={deployedUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 underline break-all mt-1 inline-block">
                        {deployedUrl}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingUrl(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 whitespace-nowrap"
                    >
                      Change URL
                    </Button>
                  </div>
                </div>
              )}

              {/* URL change warning */}
              {isRedeploy && isEditingUrl && (
                <div className="rounded-lg bg-amber-950/40 border border-amber-700/50 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="text-amber-300 font-medium">URL Change Warning</p>
                      <p className="text-amber-400/80 mt-1">
                        Changing the URL will create a new Netlify site. The old site ({currentSiteName}.netlify.app) 
                        will remain active separately. Google may need to re-index the new URL.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* URL input */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 font-medium">
                  {isRedeploy && !isEditingUrl ? "Deploy to" : "Choose your site URL"}
                </Label>
                <div className="flex items-center gap-0">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      disabled={isRedeploy && !isEditingUrl}
                      className="bg-gray-900 border-gray-700 text-white pl-9 pr-3 h-10 rounded-r-none border-r-0 focus-visible:ring-[#7C3AED]"
                      placeholder="your-business-name"
                      autoFocus={!isRedeploy}
                    />
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-900 border border-gray-700 border-l-0 px-3 h-10 flex items-center rounded-r-md">
                    .netlify.app
                  </span>
                </div>

                {/* Availability status */}
                {isCheckingSlug && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking availability...
                  </div>
                )}
                {!isCheckingSlug && slugMessage && (
                  <p className={`text-xs flex items-center gap-1.5 ${
                    slugAvailable === true ? 'text-green-400' : 
                    slugAvailable === false ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {slugAvailable === true ? <CheckCircle2 className="w-3 h-3" /> : 
                     slugAvailable === false ? <XCircle className="w-3 h-3" /> : null}
                    {slugMessage}
                  </p>
                )}
              </div>

              {/* Deployment Tier Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400 font-medium">Select Publish Scope (Deployment Stage)</Label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    {
                      id: '1',
                      title: 'Core Pages Only',
                      desc: 'Home, About, Contact, Gallery, FAQ. Dropdowns and location links hidden to index safely.',
                    },
                    {
                      id: '2',
                      title: 'Complete Site',
                      desc: 'Core + individual service and target location pages for standard local search.',
                    },
                    {
                      id: '3',
                      title: 'Matrix Pages',
                      desc: 'Core + service-location combination pages for maximum local footprint.',
                    },
                  ].map((tierItem) => {
                    const isSelected = localTier === tierItem.id;
                    return (
                      <button
                        key={tierItem.id}
                        type="button"
                        onClick={() => {
                          setLocalTier(tierItem.id as '1' | '2' | '3');
                          onChangePublishTier?.(tierItem.id as '1' | '2' | '3');
                        }}
                        className={`flex flex-col text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white'
                            : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 w-full">
                          <span className="text-xs font-semibold">{tierItem.title}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-gray-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 leading-tight">{tierItem.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {/* Manual check button (when not using debounce) */}
                {slug.length >= 3 && slugAvailable === null && !isCheckingSlug && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkSlugAvailability(slug)}
                    className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                  >
                    <Search className="w-4 h-4 mr-1" /> Check Again
                  </Button>
                )}
              </div>

              {/* Publish button */}
              <Button
                onClick={handlePublish}
                disabled={!slug || slugAvailable !== true}
                className="w-full bg-[#7C3AED] hover:bg-[#9333EA] text-white font-medium h-11 text-sm disabled:opacity-40"
              >
                <Rocket className="w-4 h-4 mr-2" />
                {isRedeploy ? "Update Website" : "Publish Website"}
              </Button>

              {slug && slugAvailable === null && !isCheckingSlug && slug.length >= 3 && (
                <p className="text-xs text-center text-yellow-500/80">
                  Wait for availability check or click "Check Again"
                </p>
              )}
            </div>
          )}

          {/* ── Step 3: Deploying ───────────────────────────────── */}
          {step === "deploying" && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <div className="relative inline-flex">
                  <Loader2 className="w-12 h-12 animate-spin text-[#7C3AED]" />
                </div>
                <p className="text-sm font-medium text-white mt-4">{deployPhase}</p>
                <p className="text-xs text-gray-500 mt-1">{slug}.netlify.app</p>
              </div>

              <div className="space-y-2">
                <Progress value={deployProgress} className="h-2 bg-gray-800" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Deploying</span>
                  <span>{deployProgress}%</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className={`flex items-center gap-2 ${deployProgress >= 15 ? 'text-gray-400' : ''}`}>
                  {deployProgress >= 30 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : deployProgress >= 15 ? <Loader2 className="w-3 h-3 animate-spin text-[#7C3AED]" /> : <span className="w-3 h-3" />}
                  Generating website files
                </div>
                <div className={`flex items-center gap-2 ${deployProgress >= 30 ? 'text-gray-400' : ''}`}>
                  {deployProgress >= 70 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : deployProgress >= 30 ? <Loader2 className="w-3 h-3 animate-spin text-[#7C3AED]" /> : <span className="w-3 h-3" />}
                  Uploading to Netlify
                </div>
                <div className={`flex items-center gap-2 ${deployProgress >= 85 ? 'text-gray-400' : ''}`}>
                  {deployProgress >= 100 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : deployProgress >= 85 ? <Loader2 className="w-3 h-3 animate-spin text-[#7C3AED]" /> : <span className="w-3 h-3" />}
                  CDN propagation
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Success ─────────────────────────────────── */}
          {step === "success" && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-900/40 border-2 border-green-500 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-semibold text-white">
                  {isRedeploy ? "Website Updated!" : "Website Published!"}
                </p>
                <p className="text-sm text-gray-400 mt-1">Your site is live and accessible worldwide.</p>
              </div>

              <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
                <Label className="text-xs text-gray-500 mb-1 block">Live URL</Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-green-400 break-all flex-1">{resultUrl}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(resultUrl);
                      toast({ title: "Copied!", description: "URL copied to clipboard." });
                    }}
                    className="text-gray-400 hover:text-white shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(resultUrl, "_blank")}
                  className="flex-1 bg-[#7C3AED] hover:bg-[#9333EA] text-white font-medium"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Visit Website
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
