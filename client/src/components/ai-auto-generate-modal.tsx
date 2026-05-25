import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { businessCategories, BusinessData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Wand2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Suppress ResizeObserver errors for this component
const useResizeObserverSuppression = () => {
  useState(() => {
    // Silently catch and ignore ResizeObserver errors
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string' && message.includes('ResizeObserver')) {
        return true; // Prevent default error handling
      }
      return originalError ? originalError(message, source, lineno, colno, error) : false;
    };
    return null;
  });
};

interface AIAutoGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (generatedData: Partial<BusinessData>) => void;
}

interface GenerationProgress {
  step: string;
  completed: boolean;
}

type AIProvider = "openai" | "gemini" | "openrouter" | "deepseek";

export function AIAutoGenerateModal({ open, onOpenChange, onGenerate }: AIAutoGenerateModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  useResizeObserverSuppression();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [generationSteps, setGenerationSteps] = useState<GenerationProgress[]>([]);

  // Form fields
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contentAiProvider, setContentAiProvider] = useState("gemini");

  // Check API settings
  const { data: openaiSetting } = useQuery({
    queryKey: ["/api/settings/openai"],
    enabled: open
  });
  const { data: geminiSetting } = useQuery({
    queryKey: ["/api/settings/gemini"],
    enabled: open
  });
  const { data: openrouterSetting } = useQuery({ queryKey: ["/api/settings/openrouter"] });
  const { data: deepseekSetting } = useQuery({
    queryKey: ["/api/settings/deepseek"],
    enabled: open
  });

  // Check for both database-stored API keys (for registered users) and session-stored keys (for guests)
  const hasOpenAI = ((openaiSetting as any)?.apiKey && (openaiSetting as any)?.isActive) ||
    !!sessionStorage.getItem('guest_openai_key');
  const hasGemini = ((geminiSetting as any)?.apiKey && (geminiSetting as any)?.isActive) ||
    !!sessionStorage.getItem('guest_gemini_key');
  const hasOpenRouter = ((openrouterSetting as any)?.apiKey && (openrouterSetting as any)?.isActive) || !!sessionStorage.getItem('guest_openrouter_key');
  const hasDeepSeek = ((deepseekSetting as any)?.apiKey && (deepseekSetting as any)?.isActive) || !!sessionStorage.getItem('guest_deepseek_key');
  const hasAnyAI = hasOpenAI || hasGemini || hasOpenRouter || hasDeepSeek;
  const availableProviders: AIProvider[] = [
    ...(hasGemini ? ["gemini" as const] : []),
    ...(hasOpenAI ? ["openai" as const] : []),
    ...(hasOpenRouter ? ["openrouter" as const] : []),
    ...(hasDeepSeek ? ["deepseek" as const] : []),
  ];

  // Check if user has AI access
  const isAIUser = !!(user as any)?.role || (user as any)?.id === "admin";

  useEffect(() => {
    if (!open || availableProviders.length === 0) return;

    if (!availableProviders.includes(contentAiProvider as AIProvider)) {
      setContentAiProvider(availableProviders[0]);
    }
  }, [open, availableProviders, contentAiProvider]);

  const generationStepsData = [
    { step: "Generating hero section content", completed: false },
    { step: "Creating business description", completed: false },
    { step: "Generating services list and dynamic pages", completed: false },
    { step: "Creating SEO content sections", completed: false },
    { step: "Generating FAQ questions & answers", completed: false },
    { step: "Creating customer testimonials", completed: false },
    { step: "Optimizing meta titles & descriptions", completed: false },
    { step: "Finalizing all content", completed: false },
  ];

  const validateForm = () => {
    if (!serviceType.trim()) {
      toast({
        title: "Service Type Required",
        description: "Please enter the type of service your business provides",
        variant: "destructive",
      });
      return false;
    }
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter your business location",
        variant: "destructive",
      });
      return false;
    }
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your business phone number",
        variant: "destructive",
      });
      return false;
    }
    if (!businessCategory) {
      toast({
        title: "Business Category Required",
        description: "Please select your business category",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const showApiSetupRequiredToast = () => {
    toast({
      title: "API Setup Required",
      description: "Please configure and save at least one AI provider in API Setup before generating content.",
      action: (
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/api-setup"}>
          Setup APIs
        </Button>
      ),
    });
  };

  const generateContent = async () => {
    if (!hasAnyAI) {
      showApiSetupRequiredToast();
      return;
    }

    if (!availableProviders.includes(contentAiProvider as AIProvider)) {
      toast({
        title: "AI Provider Not Available",
        description: "Select a configured AI provider, or add it in API Setup.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    setIsGenerating(true);
    setProgress(0);
    setGenerationSteps(generationStepsData.map(step => ({ ...step, completed: false })));

    try {
      const guestApiKey = !(user as any)?.id
        ? sessionStorage.getItem(`guest_${contentAiProvider}_key`)
        : null;

      const response = await fetch('/api/ai/generate-all-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          location,
          phoneNumber,
          businessCategory,
          businessName: businessName || `${serviceType} in ${location}`,
          contentAiProvider: contentAiProvider,
          apiKey: guestApiKey || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to generate content';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          // Ignore JSON parsing failures and use default error message.
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        console.log('🔥 Starting to read streaming response...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Stream reading completed');
            break;
          }

          // Add new chunk to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) {
                continue;
              }

              let data: any;
              try {
                data = JSON.parse(jsonStr);
              } catch (e) {
                if (!jsonStr.includes('...')) {
                  console.error('Error parsing progress data:', jsonStr, e);
                }
                continue;
              }

              console.log('📊 Progress update received:', data);

              if (data.type === 'progress') {
                setProgress(data.progress);
                setCurrentStep(data.step);
                console.log(`📈 Progress: ${data.progress}% - ${data.step}`);

                // Update completed steps - mark current and previous steps as completed
                setGenerationSteps(prev =>
                  prev.map((step, index) => ({
                    ...step,
                    completed: index <= data.stepIndex
                  }))
                );
              } else if (data.type === 'completed') {
                console.log('🎉 Generation completed!');
                // Show completion state briefly before closing
                setProgress(100);
                setCurrentStep("Content generation completed!");
                setGenerationSteps(prev =>
                  prev.map(step => ({ ...step, completed: true }))
                );

                // Wait a moment to show completion before updating form
                setTimeout(() => {
                  if (data.generatedData) {
                    onGenerate(data.generatedData);
                    toast({
                      title: "Content Generated Successfully",
                      description: "All website content has been generated and populated in the form",
                    });
                    onOpenChange(false);
                    resetForm();
                    return;
                  }

                  toast({
                    title: "Generation Failed",
                    description: "No generated data was returned by the server.",
                    variant: "destructive",
                  });
                }, 1500);
              } else if (data.type === 'error') {
                console.error('❌ Generation error:', data.message);
                throw new Error(data.message || 'Generation failed');
              }
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.startsWith('data: ')) {
          try {
            const jsonStr = buffer.slice(6).trim();
            if (jsonStr) {
              const data = JSON.parse(jsonStr);
              if (data.type === 'error') {
                throw new Error(data.message || 'Generation failed');
              }

              if (data.type === 'completed' && data.generatedData) {
                onGenerate(data.generatedData);
                toast({
                  title: "Content Generated Successfully",
                  description: "All website content has been generated and populated in the form",
                });
                onOpenChange(false);
                resetForm();
              }
            }
          } catch (e) {
            console.error('Error parsing final buffer:', buffer, e);
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error
          ? error.message
          : "Failed to generate content. Please check your AI settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep("");
    }
  };

  const resetForm = () => {
    setServiceType("");
    setLocation("");
    setPhoneNumber("");
    setBusinessCategory("");
    setBusinessName("");
    setContentAiProvider("gemini");
    setProgress(0);
    setCurrentStep("");
    setGenerationSteps([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5 text-purple-500" />
            Auto-Generate All Content with AI
          </DialogTitle>
          <DialogDescription>
            Generate professional website content optimized for SEO using just basic business information.
          </DialogDescription>
        </DialogHeader>

        {!isGenerating ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="aiProvider" className="text-sm">AI Provider *</Label>
              <Select
                value={contentAiProvider}
                onValueChange={setContentAiProvider}
                data-testid="select-ai-provider"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai" disabled={!hasOpenAI}>
                    <div className="flex items-center gap-2">
                      <span>OpenAI (GPT-4.1)</span>
                      {hasOpenAI ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini" disabled={!hasGemini}>
                    <div className="flex items-center gap-2">
                      <span>Google Gemini</span>
                      {hasGemini ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="openrouter" disabled={!hasOpenRouter}>
                    <div className="flex items-center gap-2">
                      <span>OpenRouter</span>
                      {hasOpenRouter ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="deepseek" disabled={!hasDeepSeek}>
                    <div className="flex items-center gap-2">
                      <span>DeepSeek</span>
                      {hasDeepSeek ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!hasAnyAI && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                  <p className="text-xs text-amber-700 mb-2">
                    No AI providers configured. Configure one in API Setup first.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => window.location.href = "/api-setup"}
                    data-testid="button-open-api-setup-from-ai-modal"
                  >
                    Open API Setup
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="serviceType" className="text-sm">Service Type *</Label>
              <Input
                id="serviceType"
                placeholder="e.g., Plumbing Services, HVAC Repair, Landscaping"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                data-testid="input-service-type"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="location" className="text-sm">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Boston, MA or Los Angeles, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                data-testid="input-location"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phoneNumber" className="text-sm">Phone Number *</Label>
              <Input
                id="phoneNumber"
                placeholder="e.g., (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="businessCategory" className="text-sm">Business Category *</Label>
              <Select value={businessCategory} onValueChange={(value) => {
                try {
                  setBusinessCategory(value);
                } catch (error) {
                  // Silently handle any focus errors
                  console.warn('Focus error in category select:', error);
                }
              }}>
                <SelectTrigger data-testid="select-business-category" className="resize-observer-suppress">
                  <SelectValue placeholder="Select your business category" />
                </SelectTrigger>
                <SelectContent className="resize-observer-suppress max-h-60 overflow-y-auto">
                  {businessCategories.map((category: { name: string; competition: string }) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="businessName" className="text-sm">Business Name (Optional)</Label>
              <Input
                id="businessName"
                placeholder="Leave empty to auto-generate"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                data-testid="input-business-name"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">What will be generated:</h4>
              <ul className="text-xs text-blue-800 space-y-0.5">
                <li>• Hero section & descriptions</li>
                <li>• Service listings & features</li>
                <li>• Service areas & cities</li>
                <li>• FAQ section</li>
                <li>• Customer testimonials</li>
                <li>• Meta titles & SEO content</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-muted-foreground">Generating content...</p>
              <p className="text-xs font-medium mt-1">{currentStep}</p>
            </div>

            <Progress value={progress} className="w-full" />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {generationSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={step.completed ? "text-green-700" : "text-gray-600"}>
                    {step.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          {!isGenerating && (
            <Button
              onClick={generateContent}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
              data-testid="button-generate-content"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate All Content
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
