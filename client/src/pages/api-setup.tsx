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

type Provider = "openai" | "gemini" | "openrouter" | "deepseek" | "netlify" | "unsplash" | "cloudflare" | "vercel" | "firebase" | "surge" | "aws-s3" | "gcs" | "b2" | "github-pages" | "ftp";

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
  },
  {
    service: "aws-s3",
    title: "AWS S3 Bucket",
    description: "Deploy generated websites directly to an AWS S3 Bucket",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html",
    placeholder: "Secret Access Key"
  },
  {
    service: "gcs",
    title: "Google Cloud Storage",
    description: "Deploy generated websites directly to Google Cloud Storage Bucket (HMAC)",
    docsUrl: "https://cloud.google.com/storage/docs",
    placeholder: "GCS HMAC Secret Key"
  },
  {
    service: "b2",
    title: "Backblaze B2 Storage",
    description: "Deploy generated websites directly to Backblaze B2 (S3-compatible)",
    docsUrl: "https://www.backblaze.com/docs/cloud-storage",
    placeholder: "B2 Application Key"
  },
  {
    service: "github-pages",
    title: "GitHub Pages",
    description: "Push website to a GitHub repository branch to host via GitHub Pages",
    docsUrl: "https://pages.github.com/",
    placeholder: "GitHub Personal Access Token"
  },
  {
    service: "ftp",
    title: "FTP/SFTP Server",
    description: "Upload generated website files directly to any FTP/SFTP server",
    docsUrl: "https://en.wikipedia.org/wiki/File_Transfer_Protocol",
    placeholder: "FTP Password"
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
  surge: "",
  "aws-s3": "",
  gcs: "",
  b2: "",
  "github-pages": "",
  ftp: ""
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
    surge: null,
    "aws-s3": null,
    gcs: null,
    b2: null,
    "github-pages": null,
    ftp: null
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
    surge: false,
    "aws-s3": false,
    gcs: false,
    b2: false,
    "github-pages": false,
    ftp: false
  });

  const [cfAccountId, setCfAccountId] = useState("");
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [surgeDomain, setSurgeDomain] = useState("");

  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsBucket, setAwsBucket] = useState("");
  const [awsRegion, setAwsRegion] = useState("");
  const [awsCustomDomain, setAwsCustomDomain] = useState("");

  const [gcsAccessKeyId, setGcsAccessKeyId] = useState("");
  const [gcsBucket, setGcsBucket] = useState("");
  const [gcsCustomDomain, setGcsCustomDomain] = useState("");

  const [b2KeyId, setB2KeyId] = useState("");
  const [b2Bucket, setB2Bucket] = useState("");
  const [b2Endpoint, setB2Endpoint] = useState("");
  const [b2CustomDomain, setB2CustomDomain] = useState("");

  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("");
  const [githubCustomDomain, setGithubCustomDomain] = useState("");

  const [ftpHost, setFtpHost] = useState("");
  const [ftpPort, setFtpPort] = useState("21");
  const [ftpUser, setFtpUser] = useState("");
  const [ftpRemoteDir, setFtpRemoteDir] = useState("");
  const [ftpSecure, setFtpSecure] = useState("false");
  const [ftpCustomDomain, setFtpCustomDomain] = useState("");

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
  const { data: awsS3Setting } = useQuery({ queryKey: ["/api/settings/aws-s3"], enabled: true });
  const { data: gcsSetting } = useQuery({ queryKey: ["/api/settings/gcs"], enabled: true });
  const { data: b2Setting } = useQuery({ queryKey: ["/api/settings/b2"], enabled: true });
  const { data: githubPagesSetting } = useQuery({ queryKey: ["/api/settings/github-pages"], enabled: true });
  const { data: ftpSetting } = useQuery({ queryKey: ["/api/settings/ftp"], enabled: true });

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
    "aws-s3": awsS3Setting as ApiSetting | undefined,
    gcs: gcsSetting as ApiSetting | undefined,
    b2: b2Setting as ApiSetting | undefined,
    "github-pages": githubPagesSetting as ApiSetting | undefined,
    ftp: ftpSetting as ApiSetting | undefined,
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
    if (awsS3Setting) {
      if ((awsS3Setting as any).accessKey && !awsAccessKeyId) setAwsAccessKeyId("•••••••••••");
      if ((awsS3Setting as any).secretKey) {
        try {
          const parsed = JSON.parse((awsS3Setting as any).secretKey);
          if (parsed.bucket && !awsBucket) setAwsBucket(parsed.bucket);
          if (parsed.region && !awsRegion) setAwsRegion(parsed.region);
          if (parsed.customDomain && !awsCustomDomain) setAwsCustomDomain(parsed.customDomain);
        } catch {
          if (!awsBucket) setAwsBucket((awsS3Setting as any).secretKey);
        }
      }
    }
    if (gcsSetting) {
      if ((gcsSetting as any).accessKey && !gcsAccessKeyId) setGcsAccessKeyId("•••••••••••");
      if ((gcsSetting as any).secretKey) {
        try {
          const parsed = JSON.parse((gcsSetting as any).secretKey);
          if (parsed.bucket && !gcsBucket) setGcsBucket(parsed.bucket);
          if (parsed.customDomain && !gcsCustomDomain) setGcsCustomDomain(parsed.customDomain);
        } catch {
          if (!gcsBucket) setGcsBucket((gcsSetting as any).secretKey);
        }
      }
    }
    if (b2Setting) {
      if ((b2Setting as any).accessKey && !b2KeyId) setB2KeyId("•••••••••••");
      if ((b2Setting as any).secretKey) {
        try {
          const parsed = JSON.parse((b2Setting as any).secretKey);
          if (parsed.bucket && !b2Bucket) setB2Bucket(parsed.bucket);
          if (parsed.endpoint && !b2Endpoint) setB2Endpoint(parsed.endpoint);
          if (parsed.customDomain && !b2CustomDomain) setB2CustomDomain(parsed.customDomain);
        } catch {
          if (!b2Bucket) setB2Bucket((b2Setting as any).secretKey);
        }
      }
    }
    if (githubPagesSetting) {
      if ((githubPagesSetting as any).accessKey && !githubOwner) {
        setGithubOwner((githubPagesSetting as any).accessKey);
      }
      if ((githubPagesSetting as any).secretKey) {
        try {
          const parsed = JSON.parse((githubPagesSetting as any).secretKey);
          if (parsed.repo && !githubRepo) setGithubRepo(parsed.repo);
          if (parsed.branch && !githubBranch) setGithubBranch(parsed.branch);
          if (parsed.customDomain && !githubCustomDomain) setGithubCustomDomain(parsed.customDomain);
        } catch {}
      }
    }
    if (ftpSetting) {
      if ((ftpSetting as any).accessKey && !ftpUser) {
        setFtpUser((ftpSetting as any).accessKey);
      }
      if ((ftpSetting as any).secretKey) {
        try {
          const parsed = JSON.parse((ftpSetting as any).secretKey);
          if (parsed.host && !ftpHost) setFtpHost(parsed.host);
          if (parsed.port && !ftpPort) setFtpPort(parsed.port);
          if (parsed.remoteDir && !ftpRemoteDir) setFtpRemoteDir(parsed.remoteDir);
          if (parsed.secure && !ftpSecure) setFtpSecure(parsed.secure);
          if (parsed.customDomain && !ftpCustomDomain) setFtpCustomDomain(parsed.customDomain);
        } catch {}
      }
    }
  }, [cloudflareSetting, firebaseSetting, surgeSetting, awsS3Setting, gcsSetting, b2Setting, githubPagesSetting, ftpSetting]);

  const updateApiKeyMutation = useMutation<
    { service: Provider; apiKey?: string; accessKey?: string; secretKey?: string },
    Error,
    { service: Provider; apiKey?: string; accessKey?: string; secretKey?: string }
  >({
    mutationFn: async ({ service, apiKey, accessKey, secretKey }) => {
      const isGeneric = service === 'vercel' || service === 'firebase' || service === 'surge' || service === 'aws-s3' || service === 'gcs' || service === 'b2' || service === 'github-pages' || service === 'ftp';
      const endpoint = isGeneric ? `/api/settings/generic/${service}` : `/api/settings/${service}`;
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, accessKey, secretKey, isActive: true })
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
        case "aws-s3":
          testResult = await testViaEndpoint("/api/test-generic-connection", { 
            provider: service, 
            apiKey, 
            accessKey: awsAccessKeyId,
            secretKey: JSON.stringify({ bucket: awsBucket, region: awsRegion, customDomain: awsCustomDomain })
          }, "AWS S3 connection successful");
          break;
        case "gcs":
          testResult = await testViaEndpoint("/api/test-generic-connection", { 
            provider: service, 
            apiKey, 
            accessKey: gcsAccessKeyId,
            secretKey: JSON.stringify({ bucket: gcsBucket, customDomain: gcsCustomDomain })
          }, "Google Cloud Storage connection successful");
          break;
        case "b2":
          testResult = await testViaEndpoint("/api/test-generic-connection", { 
            provider: service, 
            apiKey, 
            accessKey: b2KeyId,
            secretKey: JSON.stringify({ bucket: b2Bucket, endpoint: b2Endpoint, customDomain: b2CustomDomain })
          }, "Backblaze B2 connection successful");
          break;
        case "github-pages":
          testResult = await testViaEndpoint("/api/test-generic-connection", { 
            provider: service, 
            apiKey, 
            accessKey: githubOwner,
            secretKey: JSON.stringify({ repo: githubRepo, branch: githubBranch, customDomain: githubCustomDomain })
          }, "GitHub Pages connection successful");
          break;
        case "ftp":
          testResult = await testViaEndpoint("/api/test-generic-connection", { 
            provider: service, 
            apiKey, 
            accessKey: ftpUser,
            secretKey: JSON.stringify({ host: ftpHost, port: ftpPort, remoteDir: ftpRemoteDir, secure: ftpSecure, customDomain: ftpCustomDomain })
          }, "FTP connection successful");
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
    let secretKey: string | undefined = undefined;
    if (service === "cloudflare") accessKey = cfAccountId;
    else if (service === "firebase") accessKey = firebaseProjectId;
    else if (service === "surge") accessKey = surgeDomain;
    else if (service === "aws-s3") {
      accessKey = awsAccessKeyId;
      secretKey = JSON.stringify({ bucket: awsBucket, region: awsRegion, customDomain: awsCustomDomain });
    } else if (service === "gcs") {
      accessKey = gcsAccessKeyId;
      secretKey = JSON.stringify({ bucket: gcsBucket, customDomain: gcsCustomDomain });
    } else if (service === "b2") {
      accessKey = b2KeyId;
      secretKey = JSON.stringify({ bucket: b2Bucket, endpoint: b2Endpoint, customDomain: b2CustomDomain });
    } else if (service === "github-pages") {
      accessKey = githubOwner;
      secretKey = JSON.stringify({ repo: githubRepo, branch: githubBranch, customDomain: githubCustomDomain });
    } else if (service === "ftp") {
      accessKey = ftpUser;
      secretKey = JSON.stringify({ host: ftpHost, port: ftpPort, remoteDir: ftpRemoteDir, secure: ftpSecure, customDomain: ftpCustomDomain });
    }

    const isMissingAccessKey = (service === "cloudflare" && !cfAccountId.trim()) || 
                             (service === "firebase" && !firebaseProjectId.trim()) || 
                             (service === "surge" && !surgeDomain.trim()) ||
                             (service === "aws-s3" && (!awsAccessKeyId.trim() || !awsBucket.trim())) ||
                             (service === "gcs" && (!gcsAccessKeyId.trim() || !gcsBucket.trim())) ||
                             (service === "b2" && (!b2KeyId.trim() || !b2Bucket.trim() || !b2Endpoint.trim())) ||
                             (service === "github-pages" && (!githubOwner.trim() || !githubRepo.trim())) ||
                             (service === "ftp" && (!ftpHost.trim() || !ftpUser.trim()));

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
    
    const isGenericOrCF = service === "cloudflare" || service === "vercel" || service === "firebase" || service === "surge" || service === "aws-s3" || service === "gcs" || service === "b2" || service === "github-pages" || service === "ftp";
    if (isGenericOrCF) {
      updateApiKeyMutation.mutate({ 
        service, 
        apiKey: apiKey !== "•••••••••••" ? apiKey : undefined, 
        accessKey: accessKey !== "•••••••••••" ? accessKey : undefined,
        secretKey: secretKey !== undefined ? secretKey : undefined
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
                {service === "aws-s3" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="aws-s3-key" className="text-gray-300">Secret Access Key</Label>
                      <Input
                        id="aws-s3-key"
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys["aws-s3"]}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, "aws-s3": e.target.value }))}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys["aws-s3"] ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aws-s3-access" className="text-gray-300">Access Key ID</Label>
                      <Input
                        id="aws-s3-access"
                        placeholder={settingsByProvider["aws-s3"]?.accessKey ? "•••••••••••••••••••••" : "Enter Access Key ID"}
                        value={awsAccessKeyId}
                        onChange={(e) => setAwsAccessKeyId(e.target.value)}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${settingsByProvider["aws-s3"]?.accessKey && !awsAccessKeyId ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aws-s3-bucket" className="text-gray-300">S3 Bucket Name</Label>
                        <Input
                          id="aws-s3-bucket"
                          placeholder="e.g. my-site-bucket"
                          value={awsBucket}
                          onChange={(e) => setAwsBucket(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="aws-s3-region" className="text-gray-300">AWS Region</Label>
                        <Input
                          id="aws-s3-region"
                          placeholder="e.g. us-east-1"
                          value={awsRegion}
                          onChange={(e) => setAwsRegion(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aws-s3-domain" className="text-gray-300">Custom Domain / CDN URL (Optional)</Label>
                      <Input
                        id="aws-s3-domain"
                        placeholder="e.g. https://my-site.com"
                        value={awsCustomDomain}
                        onChange={(e) => setAwsCustomDomain(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                  </>
                ) : service === "gcs" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gcs-key" className="text-gray-300">GCS HMAC Secret Key</Label>
                      <Input
                        id="gcs-key"
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys["gcs"]}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, "gcs": e.target.value }))}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys["gcs"] ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcs-access" className="text-gray-300">GCS HMAC Access Key</Label>
                      <Input
                        id="gcs-access"
                        placeholder={settingsByProvider["gcs"]?.accessKey ? "•••••••••••••••••••••" : "Enter GCS HMAC Access Key"}
                        value={gcsAccessKeyId}
                        onChange={(e) => setGcsAccessKeyId(e.target.value)}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${settingsByProvider["gcs"]?.accessKey && !gcsAccessKeyId ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcs-bucket" className="text-gray-300">GCS Bucket Name</Label>
                      <Input
                        id="gcs-bucket"
                        placeholder="e.g. my-gcs-bucket"
                        value={gcsBucket}
                        onChange={(e) => setGcsBucket(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gcs-domain" className="text-gray-300">Custom Domain / CDN URL (Optional)</Label>
                      <Input
                        id="gcs-domain"
                        placeholder="e.g. https://my-site.com"
                        value={gcsCustomDomain}
                        onChange={(e) => setGcsCustomDomain(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                  </>
                ) : service === "b2" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="b2-key" className="text-gray-300">B2 Application Key</Label>
                      <Input
                        id="b2-key"
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys["b2"]}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, "b2": e.target.value }))}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys["b2"] ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b2-access" className="text-gray-300">B2 Key ID</Label>
                      <Input
                        id="b2-access"
                        placeholder={settingsByProvider["b2"]?.accessKey ? "•••••••••••••••••••••" : "Enter Key ID"}
                        value={b2KeyId}
                        onChange={(e) => setB2KeyId(e.target.value)}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${settingsByProvider["b2"]?.accessKey && !b2KeyId ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="b2-bucket" className="text-gray-300">B2 Bucket Name</Label>
                        <Input
                          id="b2-bucket"
                          placeholder="e.g. my-b2-bucket"
                          value={b2Bucket}
                          onChange={(e) => setB2Bucket(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="b2-endpoint" className="text-gray-300">S3 Endpoint</Label>
                        <Input
                          id="b2-endpoint"
                          placeholder="e.g. s3.us-west-004.backblazeb2.com"
                          value={b2Endpoint}
                          onChange={(e) => setB2Endpoint(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="b2-domain" className="text-gray-300">Custom Domain / CDN URL (Optional)</Label>
                      <Input
                        id="b2-domain"
                        placeholder="e.g. https://my-site.com"
                        value={b2CustomDomain}
                        onChange={(e) => setB2CustomDomain(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                  </>
                ) : service === "github-pages" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="github-key" className="text-gray-300">GitHub Personal Access Token (PAT)</Label>
                      <Input
                        id="github-key"
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys["github-pages"]}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, "github-pages": e.target.value }))}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys["github-pages"] ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github-owner" className="text-gray-300">Repository Owner (Username/Organization)</Label>
                      <Input
                        id="github-owner"
                        placeholder={(settingsByProvider["github-pages"] as any)?.accessKey ? "•••••••••••••••••••••" : "Enter Owner"}
                        value={githubOwner}
                        onChange={(e) => setGithubOwner(e.target.value)}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${(settingsByProvider["github-pages"] as any)?.accessKey && !githubOwner ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="github-repo" className="text-gray-300">Repository Name</Label>
                        <Input
                          id="github-repo"
                          placeholder="e.g. my-website"
                          value={githubRepo}
                          onChange={(e) => setGithubRepo(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github-branch" className="text-gray-300">Target Branch</Label>
                        <Input
                          id="github-branch"
                          placeholder="e.g. gh-pages"
                          value={githubBranch}
                          onChange={(e) => setGithubBranch(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github-domain" className="text-gray-300">Custom Domain (Optional)</Label>
                      <Input
                        id="github-domain"
                        placeholder="e.g. https://my-site.com"
                        value={githubCustomDomain}
                        onChange={(e) => setGithubCustomDomain(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                  </>
                ) : service === "ftp" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ftp-key" className="text-gray-300">FTP Password</Label>
                      <Input
                        id="ftp-key"
                        type="password"
                        placeholder={hasCurrentKey ? "•••••••••••••••••••••" : placeholder}
                        value={apiKeys["ftp"]}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, "ftp": e.target.value }))}
                        className={`border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] ${hasCurrentKey && !apiKeys["ftp"] ? "bg-emerald-500/5 border-emerald-500/20 placeholder:text-emerald-700" : "bg-white/5"}`}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="ftp-host" className="text-gray-300">FTP Host</Label>
                        <Input
                          id="ftp-host"
                          placeholder="e.g. ftp.atwebpages.com"
                          value={ftpHost}
                          onChange={(e) => setFtpHost(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftp-port" className="text-gray-300">Port</Label>
                        <Input
                          id="ftp-port"
                          placeholder="21"
                          value={ftpPort}
                          onChange={(e) => setFtpPort(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp-username" className="text-gray-300">FTP Username</Label>
                      <Input
                        id="ftp-username"
                        placeholder="Enter Username"
                        value={ftpUser}
                        onChange={(e) => setFtpUser(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftp-dir" className="text-gray-300">Remote Directory</Label>
                        <Input
                          id="ftp-dir"
                          placeholder="e.g. /public_html"
                          value={ftpRemoteDir}
                          onChange={(e) => setFtpRemoteDir(e.target.value)}
                          className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ftp-secure" className="text-gray-300">Encryption (FTPS)</Label>
                        <select
                          id="ftp-secure"
                          value={ftpSecure}
                          onChange={(e) => setFtpSecure(e.target.value)}
                          className="w-full border border-white/10 text-white focus:border-[#7C3AED] bg-gray-900 rounded-lg p-2 text-sm"
                        >
                          <option value="false">Plain FTP (Insecure)</option>
                          <option value="true">Require Implicit FTPS</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ftp-domain" className="text-gray-300">Custom Domain (Optional)</Label>
                      <Input
                        id="ftp-domain"
                        placeholder="e.g. https://my-site.com"
                        value={ftpCustomDomain}
                        onChange={(e) => setFtpCustomDomain(e.target.value)}
                        className="border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED] bg-white/5"
                      />
                    </div>
                  </>
                ) : service === "cloudflare" || service === "firebase" || service === "surge" ? (
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
                          const isGeneric = service === 'vercel' || service === 'firebase' || service === 'surge' || service === 'aws-s3' || service === 'gcs' || service === 'b2' || service === 'github-pages' || service === 'ftp';
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