import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Key, TestTube2, ExternalLink, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Provider = "openai" | "gemini" | "openrouter" | "deepseek" | "netlify" | "unsplash" | "cloudflare" | "vercel" | "firebase" | "surge";

interface ApiSetting {
  name: string;
  displayName: string;
  apiKey: string;
  accessKey?: string;
  isActive: boolean;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
}

interface ProviderConfig {
  service: Provider;
  title: string;
  description: string;
  docsUrl: string;
  placeholder: string;
}

const providerConfigs: ProviderConfig[] = [
  {
    service: "gemini",
    title: "Google Gemini API",
    description: "Primary AI provider for automatic website content generation",
    docsUrl: "https://ai.google.dev/",
    placeholder: "AIza..."
  },
  {
    service: "openai",
    title: "OpenAI API",
    description: "Alternative AI provider for website and blog generation",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    placeholder: "sk-..."
  },
  {
    service: "deepseek",
    title: "DeepSeek API",
    description: "Affordable and highly efficient AI provider for content generation",
    docsUrl: "https://platform.deepseek.com/",
    placeholder: "sk-..."
  },
  {
    service: "openrouter",
    title: "OpenRouter API",
    description: "Route AI generation across multiple model providers",
    docsUrl: "https://openrouter.ai/settings/keys",
    placeholder: "sk-or-v1-..."
  },
  {
    service: "netlify",
    title: "Netlify API",
    description: "Deploy generated websites directly to Netlify",
    docsUrl: "https://docs.netlify.com/api/get-started/",
    placeholder: "nfp_..."
  },
  {
    service: "unsplash",
    title: "Unsplash API",
    description: "Fetch high-quality images for generated content",
    docsUrl: "https://unsplash.com/developers",
    placeholder: "Access Key"
  },
  {
    service: "cloudflare",
    title: "Cloudflare Pages API",
    description: "Deploy generated websites directly to Cloudflare Pages",
    docsUrl: "https://dash.cloudflare.com/",
    placeholder: "API Token"
  },
  {
    service: "vercel",
    title: "Vercel API",
    description: "Deploy generated websites directly to Vercel",
    docsUrl: "https://vercel.com/docs",
    placeholder: "Vercel Token"
  },
  {
    service: "firebase",
    title: "Firebase Hosting API",
    description: "Deploy generated websites directly to Google Firebase Hosting",
    docsUrl: "https://firebase.google.com/docs/hosting",
    placeholder: "Firebase Token"
  },
  {
    service: "surge",
    title: "Surge.sh API",
    description: "Deploy generated websites directly to Surge.sh",
    docsUrl: "https://surge.sh/help",
    placeholder: "Surge Token"
  }
];

const emptyProviderState = {
  openai: "",
  gemini: "",
  openrouter: "",
  deepseek: "",
  netlify: "",
  unsplash: "",
  cloudflare: "",
  vercel: "",
  firebase: "",
  surge: ""
} as const;

export default function ApiSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [apiKeys, setApiKeys] = useState<Record<Provider, string>>(emptyProviderState);
  const [testResults, setTestResults] = useState<Record<Provider, TestResult | null>>({
    openai: null,
    gemini: null,
    openrouter: null,
    deepseek: null,
    netlify: null,
    unsplash: null,
    cloudflare: null,
    vercel: null,
    firebase: null,
    surge: null
  });
  const [testingStates, setTestingStates] = useState<Record<Provider, boolean>>({
    openai: false,
    gemini: false,
    openrouter: false,
    deepseek: false,
    netlify: false,
    unsplash: false,
    cloudflare: false,
    vercel: false,
    firebase: false,
    surge: false
  });

  const [cfAccountId, setCfAccountId] = useState("");
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [surgeDomain, setSurgeDomain] = useState("");

  // Fetch existing API settings
  const { data: openaiSetting } = useQuery({ queryKey: ["/api/settings/openai"], enabled: true });
  const { data: geminiSetting } = useQuery({ queryKey: ["/api/settings/gemini"], enabled: true });
  const { data: openrouterSetting } = useQuery({ queryKey: ["/api/settings/openrouter"], enabled: true });
  const { data: deepseekSetting } = useQuery({ queryKey: ["/api/settings/deepseek"], enabled: true });
  const { data: netlifySetting } = useQuery({ queryKey: ["/api/settings/netlify"], enabled: true });
  const { data: unsplashSetting } = useQuery({ queryKey: ["/api/settings/unsplash"], enabled: true });
  const { data: cloudflareSetting } = useQuery({ queryKey: ["/api/settings/cloudflare"], enabled: true });
  const { data: vercelSetting } = useQuery({ queryKey: ["/api/settings/vercel"], enabled: true });
  const { data: firebaseSetting } = useQuery({ queryKey: ["/api/settings/firebase"], enabled: true });
  const { data: surgeSetting } = useQuery({ queryKey: ["/api/settings/surge"], enabled: true });

  const settingsByProvider: Record<Provider, ApiSetting | undefined> = {
    openai: openaiSetting as ApiSetting | undefined,
    gemini: geminiSetting as ApiSetting | undefined,
    openrouter: openrouterSetting as ApiSetting | undefined,
    deepseek: deepseekSetting as ApiSetting | undefined,
    netlify: netlifySetting as ApiSetting | undefined,
    unsplash: unsplashSetting as ApiSetting | undefined,
    cloudflare: cloudflareSetting as ApiSetting | undefined,
    vercel: vercelSetting as ApiSetting | undefined,
    firebase: firebaseSetting as ApiSetting | undefined,
    surge: surgeSetting as ApiSetting | undefined,
  };

  useEffect(() => {
    if (cloudflareSetting && (cloudflareSetting as any).accessKey && !cfAccountId) {
      setCfAccountId("•••••••••••");
    }
    if (firebaseSetting && (firebaseSetting as any).accessKey && !firebaseProjectId) {
      setFirebaseProjectId("•••••••••••");
    }
    if (surgeSetting && (surgeSetting as any).accessKey && !surgeDomain) {
      setSurgeDomain("•••••••••••");
    }
  }, [cloudflareSetting, firebaseSetting, surgeSetting]);

  const updateApiKeyMutation = useMutation<
    { service: Provider; apiKey?: string; accessKey?: string },
    Error,
    { service: Provider; apiKey?: string; accessKey?: string }
  >({
    mutationFn: async ({ service, apiKey, accessKey }) => {
      const isGeneric = service === 'vercel' || service === 'firebase' || service === 'surge';
      const endpoint = isGeneric ? `/api/settings/generic/${service}` : `/api/settings/${service}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, accessKey, isActive: true })
      });

      if (!response.ok) {
        let errorMessage = "Failed to update API key";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          if (response.status === 401) {
            errorMessage = "Please log in to save API keys.";
          }
        }
        throw new Error(errorMessage);
      }

      return { service, apiKey, accessKey };
    },
    onSuccess: ({ service, apiKey }) => {
      toast({
        title: "API Key Saved",
        description: `${service.toUpperCase()} is configured. Testing connection now...`
      });
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${service}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });

      setTimeout(() => {
        testConnection(service, apiKey || "");
      }, 300);
    },
    onError: (error, { service }) => {
      toast({
        title: "Save Failed",
        description: `Could not save ${service.toUpperCase()} key: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const testViaEndpoint = async (
    endpoint: string,
    payload: Record<string, string>,
    successMessage: string
  ): Promise<TestResult> => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return {
          success: true,
          message: data?.message || successMessage,
          details: data?.details
        };
      }

      return {
        success: false,
        message: data?.error || data?.message || "Connection test failed",
        details: data?.details
      };
    } catch {
      return {
        success: false,
        message: "Unable to run connection test"
      };
    }
  };

  const testConnection = async (service: Provider, apiKey: string) => {
    setTestingStates((prev) => ({ ...prev, [service]: true }));

    try {
      let testResult: TestResult;

      switch (service) {
        case "openai":
          testResult = await testViaEndpoint("/api/test-openai", { apiKey }, "OpenAI API connection successful");
          break;
        case "gemini":
          testResult = await testViaEndpoint("/api/test-gemini", { apiKey }, "Gemini API connection successful");
          break;
        case "openrouter":
          testResult = await testViaEndpoint("/api/test-openrouter", { apiKey }, "OpenRouter API connection successful");
          break;
        case "deepseek":
          testResult = await testViaEndpoint("/api/test-deepseek", { apiKey }, "DeepSeek API connection successful");
          break;
        case "netlify":
          testResult = await testViaEndpoint("/api/test-netlify", { apiKey }, "Netlify API connection successful");
          break;
        case "unsplash":
          testResult = await testViaEndpoint("/api/test-unsplash", { apiKey }, "Unsplash API connection successful");
          break;
        case "cloudflare":
          testResult = await testViaEndpoint("/api/test-cloudflare", { apiKey, accountId: cfAccountId }, "Cloudflare API connection successful");
          break;
        case "vercel":
          testResult = await testViaEndpoint("/api/test-generic-connection", { provider: service, apiKey }, "Vercel API connection successful");
          break;
        case "firebase":
          testResult = await testViaEndpoint("/api/test-generic-connection", { provider: service, apiKey, accessKey: firebaseProjectId }, "Firebase Hosting connection successful");
          break;
        case "surge":
          testResult = await testViaEndpoint("/api/test-generic-connection", { provider: service, apiKey, accessKey: surgeDomain }, "Surge connection successful");
          break;
        default:
          testResult = { success: false, message: "Unknown service" };
      }

      setTestResults((prev) => ({ ...prev, [service]: testResult }));
    } finally {
      setTestingStates((prev) => ({ ...prev, [service]: false }));
    }
  };

  const handleSaveKey = (service: Provider) => {
    const apiKey = apiKeys[service];
    
    let accessKey: string | undefined = undefined;
    if (service === "cloudflare") accessKey = cfAccountId;
    else if (service === "firebase") accessKey = firebaseProjectId;
    else if (service === "surge") accessKey = surgeDomain;

    const isMissingAccessKey = (service === "cloudflare" && !cfAccountId.trim()) || 
                             (service === "firebase" && !firebaseProjectId.trim()) || 
                             (service === "surge" && !surgeDomain.trim());

    if (!apiKey.trim() && isMissingAccessKey) {
      toast({
        title: "API Key Required",
        description: "Enter an API key before saving.",
        variant: "destructive"
      });
      return;
    }

    setTestResults((prev) => ({ ...prev, [service]: null }));
    setApiKeys((prev) => ({ ...prev, [service]: "" }));
    
    const isGenericOrCF = service === "cloudflare" || service === "vercel" || service === "firebase" || service === "surge";
    if (isGenericOrCF) {
      updateApiKeyMutation.mutate({ 
        service, 
        apiKey: apiKey !== "•••••••••••" ? apiKey : undefined, 
        accessKey: accessKey !== "•••••••••••" ? accessKey : undefined 
      });
    } else {
      updateApiKeyMutation.mutate({ service, apiKey });
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          API Settings
        </h1>
        <p className="text-gray-400">
          Manage all AI and deployment API keys here. The website builder form no longer asks for API keys.
        </p>
      </div>

      <Alert className="mb-6 border-amber-500/20 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-200">Before You Generate</AlertTitle>
        <AlertDescription className="text-amber-300">
          Save at least one AI provider key (Gemini, OpenAI, or OpenRouter). If no AI key is saved, generation is blocked and you will be asked to fix API setup first.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {providerConfigs.map(({ service, title, description, docsUrl, placeholder }) => {
          const currentValue = settingsByProvider[service]?.apiKey || "";
          const hasCurrentKey = currentValue.length > 0;
          const testResult = testResults[service];
          const isTesting = testingStates[service];

          return (
            <Card key={service} className="relative bg-white/[0.02] border-white/10 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-[#7C3AED]" />
                    <div>
                      <CardTitle className="text-lg text-white">{title}</CardTitle>
                      <CardDescription className="mt-1 text-gray-400">{description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCurrentKey && (
                      <Badge
                        variant="secondary"
                        className={`text-xs font-semibold ${testResult?.success === true
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : testResult?.success === false
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                      >
                        {testResult?.success === true ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : testResult?.success === false ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {testResult?.success === true ? "Working" : testResult?.success === false ? "Error" : "✓ Configured"}
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" className="border-white/10 text-gray-300 bg-transparent hover:text-white hover:bg-white/5" asChild>
                      <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Docs
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {service === "cloudflare" || service === "firebase" || service === "surge" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`${service}-key`} className="text-gray-300">
                        {service === "cloudflare" ? "API Token" : "Access Token"}
                      </Label>
                      <Input
                        id={`${service}-key`}
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys[service]}
                        onChange={(e) =>
                          setApiKeys((prev) => ({
                            ...prev,
                            [service]: e.target.value,
                          }))
                        }
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys[service]
                            ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700"
                            : "bg-white/5"
                          }`}
                        data-testid={`input-${service}-key`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${service}-access-key`} className="text-gray-300">
                        {service === "cloudflare" ? "Account ID" : service === "firebase" ? "Project ID" : "Surge Domain (optional)"}
                      </Label>
                      <Input
                        id={`${service}-access-key`}
                        placeholder={
                          settingsByProvider[service]?.accessKey 
                            ? "•••••••••••••••••••••" 
                            : service === "cloudflare" ? "Enter Account ID" : service === "firebase" ? "Enter Project ID" : "mysite.surge.sh"
                        }
                        value={
                          service === "cloudflare" ? cfAccountId : service === "firebase" ? firebaseProjectId : surgeDomain
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (service === "cloudflare") setCfAccountId(val);
                          else if (service === "firebase") setFirebaseProjectId(val);
                          else if (service === "surge") setSurgeDomain(val);
                        }}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${settingsByProvider[service]?.accessKey && 
                          !(service === "cloudflare" ? cfAccountId : service === "firebase" ? firebaseProjectId : surgeDomain)
                            ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700"
                            : "bg-white/5"
                          }`}
                        data-testid={`input-${service}-account-id`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`${service}-key`} className="text-gray-300">API Key</Label>
                    <Input
                      id={`${service}-key`}
                      type="password"
                      placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                      value={apiKeys[service]}
                      onChange={(e) =>
                        setApiKeys((prev) => ({
                          ...prev,
                          [service]: e.target.value,
                        }))
                      }
                      className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys[service]
                          ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700"
                          : "bg-white/5"
                        }`}
                      data-testid={`input-${service}-key`}
                    />
                  </div>
                )}
                {hasCurrentKey && (
                  <p className="text-xs text-emerald-400/70">
                    ✓ Key is saved and active. Enter a new value to replace it.
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleSaveKey(service)}
                    disabled={updateApiKeyMutation.isPending}
                    size="sm"
                    className="bg-[#7C3AED] hover:bg-[#9333EA] text-black font-bold text-white border-0"
                    data-testid={`button-save-${service}`}
                  >
                    {updateApiKeyMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Key"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-gray-300 bg-transparent hover:text-white hover:bg-white/5"
                    onClick={async () => {
                      const userEnteredKey = apiKeys[service];

                      if (userEnteredKey && userEnteredKey.trim()) {
                        testConnection(service, userEnteredKey);
                      } else if (hasCurrentKey) {
                        setTestingStates((prev) => ({ ...prev, [service]: true }));
                        try {
                          const isGeneric = service === 'vercel' || service === 'firebase' || service === 'surge';
                          const endpoint = isGeneric ? `/api/test-generic-connection` : `/api/test-stored-key/${service}`;
                          const body = isGeneric ? JSON.stringify({ provider: service }) : undefined;
                          const res = await fetch(endpoint, {
                            method: "POST",
                            headers: isGeneric ? { "Content-Type": "application/json" } : undefined,
                            body,
                            credentials: "include",
                          });
                          const data = await res.json();
                          setTestResults((prev) => ({
                            ...prev,
                            [service]: {
                              success: res.ok && data.success,
                              message: data.message || data.error || "Test completed",
                              details: data.details,
                            },
                          }));
                        } catch {
                          setTestResults((prev) => ({
                            ...prev,
                            [service]: { success: false, message: "Unable to test stored key" },
                          }));
                        } finally {
                          setTestingStates((prev) => ({ ...prev, [service]: false }));
                        }
                      } else {
                        toast({
                          title: "API Key Required",
                          description: "Enter an API key before testing.",
                          variant: "destructive"
                        });
                      }
                    }}
                    disabled={isTesting}
                    data-testid={`button-test-${service}`}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube2 className="h-4 w-4 mr-2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-lg border ${testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
                      }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <p
                        className={`font-medium ${testResult.success
                          ? "text-emerald-300"
                          : "text-red-300"
                          }`}
                      >
                        {testResult.message}
                      </p>
                      {testResult.details && (
                        <p
                          className={`text-xs mt-1 ${testResult.success
                            ? "text-emerald-400/70"
                            : "text-red-400/70"
                            }`}
                        >
                          {testResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-8 border-white/10" />

      <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-white">API Key Security</CardTitle>
          <CardDescription className="text-gray-400">
            Your API keys are securely stored and encrypted. They are only used for the services you enable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Keys are encrypted before storage in the database</li>
            <li>• Keys are never logged or exposed in error messages</li>
            <li>• Each user's keys are isolated and private</li>
            <li>• You can update keys any time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}