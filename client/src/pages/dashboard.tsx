import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import ArticlesDashboard from "./articles-dashboard";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ExternalLink,
  Globe,
  Settings,
  Trash2,
  Rocket,
  RefreshCw,
  Eye,
  Edit,
  Calendar,
  User,
  Activity,
  Download
} from "lucide-react";
import { EditLiveUrlButton } from "@/components/edit-live-url-button";
import { QuickEditModal } from "@/components/quick-edit-modal";
import type { Website } from "@shared/schema";

interface NetlifyDeployDialogProps {
  website: Website;
  onSuccess: () => void;
}

function NetlifyDeployDialog({ website, onSuccess }: NetlifyDeployDialogProps) {
  const [netlifyApiKey, setNetlifyApiKey] = useState(website.netlifyApiKey || "");
  const [siteName, setSiteName] = useState(website.title || "");
  const [customSiteName, setCustomSiteName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const { toast } = useToast();

  const deployMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/websites/${website.id}/deploy`, {
        netlifyApiKey,
        siteName: siteName || website.title,
        customDomain: customDomain.trim() || undefined
      });
    },
    onSuccess: () => {
      toast({
        title: "Deployment Started",
        description: "Your website is being deployed to Netlify. This may take a few minutes.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy website",
        variant: "destructive",
      });
    },
  });

  const redeployMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/websites/${website.id}/redeploy`, {
        siteName: customSiteName.trim() || undefined,
        customDomain: customDomain.trim() || undefined
      });
    },
    onSuccess: (result: any) => {
      const data = result instanceof Response ? null : result;
      if (data?.newSite) {
        toast({
          title: "Redeployed to New Site",
          description: "Your website has been deployed to a new Netlify site since the previous one was no longer available.",
        });
      } else {
        toast({
          title: "Redeployment Started",
          description: "Your website is being redeployed to Netlify.",
        });
      }
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Redeployment Failed",
        description: error instanceof Error ? error.message : "Failed to redeploy website",
        variant: "destructive",
      });
    },
  });

  const testNetlifyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/test-netlify", "POST", { apiKey: netlifyApiKey });
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Netlify API key is valid and ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Invalid Netlify API key",
        variant: "destructive",
      });
    },
  });

  const isAlreadyDeployed = website.netlifySiteId && website.netlifyUrl;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={isAlreadyDeployed ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
          data-testid={`button-deploy-${website.id}`}
        >
          <Rocket className="w-4 h-4 mr-2" />
          {isAlreadyDeployed ? "Redeploy" : "Deploy"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAlreadyDeployed ? "Redeploy to Netlify" : "Deploy to Netlify"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isAlreadyDeployed && (
            <>
              <div className="space-y-2">
                <Label htmlFor="netlify-key">Netlify API Key</Label>
                <Input
                  id="netlify-key"
                  type="password"
                  placeholder="Enter your Netlify API key"
                  value={netlifyApiKey}
                  onChange={(e) => setNetlifyApiKey(e.target.value)}
                  data-testid="input-netlify-key"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => testNetlifyMutation.mutate()}
                  disabled={!netlifyApiKey || testNetlifyMutation.isPending}
                  data-testid="button-test-netlify"
                >
                  {testNetlifyMutation.isPending ? "Testing..." : "Test Connection"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name (optional)</Label>
                <Input
                  id="site-name"
                  placeholder="Enter custom site name"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  data-testid="input-site-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain (optional)</Label>
                <Input
                  id="custom-domain"
                  placeholder="yourdomain.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  data-testid="input-custom-domain"
                />
                <p className="text-xs text-gray-500">
                  Used for SEO files (sitemap.xml, robots.txt). If blank, uses Netlify subdomain.
                </p>
              </div>
            </>
          )}

          {isAlreadyDeployed && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This website is already deployed to Netlify. You can redeploy to push any changes.
              </p>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Current URL: <a href={website.netlifyUrl || '#'} target="_blank" className="underline">{website.netlifyUrl}</a>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-site-name">Custom Site Name (optional)</Label>
                <Input
                  id="custom-site-name"
                  placeholder="Enter new site name or leave blank to keep current"
                  value={customSiteName}
                  onChange={(e) => setCustomSiteName(e.target.value)}
                  data-testid="input-custom-site-name"
                />
                <p className="text-xs text-gray-500">
                  {customSiteName ?
                    `New URL will be: ${customSiteName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.netlify.app` :
                    "Leave blank to redeploy to the current site"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="redeploy-custom-domain">Custom Domain (optional)</Label>
                <Input
                  id="redeploy-custom-domain"
                  placeholder="yourdomain.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  data-testid="input-redeploy-custom-domain"
                />
                <p className="text-xs text-gray-500">
                  Used for SEO files (sitemap.xml, robots.txt). If blank, uses Netlify subdomain.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              if (isAlreadyDeployed) {
                redeployMutation.mutate();
              } else {
                deployMutation.mutate();
              }
            }}
            disabled={!isAlreadyDeployed && (!netlifyApiKey || !siteName.trim())}
            className="w-full"
            data-testid={`button-confirm-${isAlreadyDeployed ? 'redeploy' : 'deploy'}`}
          >
            {(deployMutation.isPending || redeployMutation.isPending)
              ? "Processing..."
              : (isAlreadyDeployed ? "Redeploy Now" : "Deploy Now")
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CloudflareDeployDialogProps {
  website: Website;
  onSuccess: () => void;
}

function CloudflareDeployDialog({ website, onSuccess }: CloudflareDeployDialogProps) {
  const [cloudflareApiToken, setCloudflareApiToken] = useState("");
  const [cloudflareAccountId, setCloudflareAccountId] = useState("");
  const [projectName, setProjectName] = useState(
    website.cloudflareProjectName || 
    website.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 63) || 
    ""
  );
  const { toast } = useToast();

  const { data: cloudflareSetting } = useQuery<any>({
    queryKey: ["/api/settings/cloudflare"],
    queryFn: async () => {
      const res = await fetch("/api/settings/cloudflare");
      if (!res.ok) return null;
      return res.json();
    }
  });

  useEffect(() => {
    if (cloudflareSetting) {
      if (cloudflareSetting.apiKey && !cloudflareApiToken) {
        setCloudflareApiToken("•••••••••••");
      }
      if (cloudflareSetting.accessKey && !cloudflareAccountId) {
        setCloudflareAccountId("•••••••••••");
      }
    }
  }, [cloudflareSetting]);

  const deployMutation = useMutation({
    mutationFn: async () => {
      if (
        (cloudflareApiToken && cloudflareApiToken !== "•••••••••••") ||
        (cloudflareAccountId && cloudflareAccountId !== "•••••••••••")
      ) {
        await apiRequest("PUT", "/api/settings/cloudflare", {
          apiKey: cloudflareApiToken !== "•••••••••••" ? cloudflareApiToken : undefined,
          accessKey: cloudflareAccountId !== "•••••••••••" ? cloudflareAccountId : undefined,
          isActive: true
        });
      }

      return apiRequest("POST", `/api/websites/${website.id}/deploy-cloudflare`, {
        cloudflareApiToken,
        cloudflareAccountId,
        projectName: projectName || website.title,
      });
    },
    onSuccess: () => {
      toast({
        title: "Deployment Started",
        description: "Your website is being deployed to Cloudflare Pages. This may take a few minutes.",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy website",
        variant: "destructive",
      });
    },
  });

  const testCloudflareMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/test-cloudflare", "POST", { 
        apiKey: cloudflareApiToken, 
        accountId: cloudflareAccountId 
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Cloudflare credentials are valid and ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Invalid Cloudflare credentials",
        variant: "destructive",
      });
    },
  });

  const isAlreadyDeployed = website.lastDeployedProvider === "cloudflare" && website.cloudflareUrl;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={isAlreadyDeployed ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-zinc-700 hover:bg-zinc-800 text-white"}
          data-testid={`button-deploy-cloudflare-${website.id}`}
        >
          <Rocket className="w-4 h-4 mr-2" />
          {isAlreadyDeployed ? "Redeploy (CF)" : "Deploy CF"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAlreadyDeployed ? "Redeploy to Cloudflare Pages" : "Deploy to Cloudflare Pages"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-token">Cloudflare API Token</Label>
            <Input
              id="cf-token"
              type="password"
              placeholder="Enter your Cloudflare API Token"
              value={cloudflareApiToken}
              onChange={(e) => setCloudflareApiToken(e.target.value)}
              data-testid="input-cf-token"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-account-id">Cloudflare Account ID</Label>
            <Input
              id="cf-account-id"
              placeholder="Enter your Cloudflare Account ID"
              value={cloudflareAccountId}
              onChange={(e) => setCloudflareAccountId(e.target.value)}
              data-testid="input-cf-account-id"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => testCloudflareMutation.mutate()}
              disabled={!cloudflareApiToken || !cloudflareAccountId || testCloudflareMutation.isPending}
              data-testid="button-test-cloudflare"
            >
              {testCloudflareMutation.isPending ? "Testing..." : "Test Connection"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cf-project-name">Project Name (optional)</Label>
            <Input
              id="cf-project-name"
              placeholder="Enter custom project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              data-testid="input-cf-project-name"
            />
            <p className="text-xs text-gray-500">
              {projectName ? `Site will be at: ${projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.pages.dev` : ""}
            </p>
          </div>

          {isAlreadyDeployed && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200/30">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Current URL: <a href={website.cloudflareUrl || '#'} target="_blank" className="underline">{website.cloudflareUrl}</a>
              </p>
            </div>
          )}

          <Button
            onClick={() => deployMutation.mutate()}
            disabled={deployMutation.isPending || !cloudflareApiToken || !cloudflareAccountId || !projectName.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            data-testid={`button-confirm-cf-deploy`}
          >
            {deployMutation.isPending ? "Deploying..." : (isAlreadyDeployed ? "Redeploy Now" : "Deploy Now")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WebsiteCard({ website }: { website: Website }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/websites/${website.id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/website-limits"] });
      toast({
        title: "Website Deleted",
        description: "Website has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete website",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    const status = website.lastDeployedProvider === "cloudflare"
      ? website.cloudflareDeploymentStatus
      : website.netlifyDeploymentStatus;

    if (!status || status === "not_deployed") {
      return <Badge variant="secondary" data-testid={`status-${website.id}`}>Not Deployed</Badge>;
    }

    switch (status) {
      case "deployed":
        return <Badge variant="default" className="bg-green-600" data-testid={`status-${website.id}`}>Deployed</Badge>;
      case "deploying":
        return <Badge variant="outline" className="border-blue-500 text-blue-600" data-testid={`status-${website.id}`}>Deploying...</Badge>;
      case "failed":
        return <Badge variant="destructive" data-testid={`status-${website.id}`}>Failed</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`status-${website.id}`}>Unknown</Badge>;
    }
  };

  return (
    <Card className="h-full" data-testid={`card-website-${website.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg line-clamp-1" data-testid={`title-${website.id}`}>
              {website.title || "Untitled Website"}
            </CardTitle>
            <p className="text-sm text-muted-foreground" data-testid={`business-name-${website.id}`}>
              {(website.businessData as any)?.businessName || 'Unknown Business'}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span data-testid={`date-created-${website.id}`}>
              Created {website.createdAt ? new Date(website.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>

          {website.lastDeployedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span data-testid={`date-deployed-${website.id}`}>
                Deployed {website.lastDeployedAt ? new Date(website.lastDeployedAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          )}

          {(website.cloudflareUrl || website.netlifyUrl) && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-green-600" />
              <a
                href={(website.cloudflareUrl || website.netlifyUrl) ?? undefined}
                target="_blank"
                className="text-blue-600 hover:underline truncate"
                data-testid={`link-live-${website.id}`}
              >
                {website.cloudflareUrl || website.netlifyUrl}
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" asChild data-testid={`button-edit-${website.id}`}>
            <Link href={`/edit/${website.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickEdit(true)}
            data-testid={`button-quick-edit-${website.id}`}
          >
            <Edit className="w-4 h-4 mr-2" />
            Quick Edit
          </Button>

          <NetlifyDeployDialog
            website={website}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
              queryClient.invalidateQueries({ queryKey: ["/api/user/website-limits"] });
            }}
          />

          <CloudflareDeployDialog
            website={website}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
              queryClient.invalidateQueries({ queryKey: ["/api/user/website-limits"] });
            }}
          />

          {(website.cloudflareUrl || website.netlifyUrl) && (
            <Button variant="outline" size="sm" asChild data-testid={`button-view-${website.id}`}>
              <a href={(website.cloudflareUrl || website.netlifyUrl) ?? undefined} target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                View Live
              </a>
            </Button>
          )}

          {website.netlifyUrl && (
            <EditLiveUrlButton website={website} />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-700"
            data-testid={`button-delete-${website.id}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>

      <QuickEditModal
        website={website}
        isOpen={showQuickEdit}
        onClose={() => setShowQuickEdit(false)}
      />
    </Card>
  );
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<"websites" | "articles">("websites");

  // Fetch user websites
  const { data: websites = [], isLoading: websitesLoading, refetch } = useQuery<Website[]>({
    queryKey: ["/api/websites"],
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/api/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || websitesLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-400">Loading your websites...</p>
          </div>
        </div>
      </div>
    );
  }

  const deployedWebsites = websites.filter(w => w.netlifyDeploymentStatus === "deployed");
  const draftWebsites = websites.filter(w => w.netlifyDeploymentStatus === "not_deployed" || !w.netlifyDeploymentStatus);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="heading-dashboard">
              {activeView === "websites" ? "Your Websites" : "SEO Backlinks Syndication"}
            </h1>
            <p className="text-xl text-gray-400" data-testid="text-welcome">
              Welcome back, {(user as any)?.firstName || "User"}! {activeView === "websites" ? "Manage your websites and deployments." : "Generate and syndicate backlink articles."}
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* View Switcher Toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
              <Button
                variant={activeView === "websites" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("websites")}
                className="h-8 text-xs"
              >
                Websites
              </Button>
              <Button
                variant={activeView === "articles" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("articles")}
                className="h-8 text-xs"
              >
                Articles
              </Button>
            </div>

            {activeView === "websites" && (
              <>
                <Button asChild data-testid="button-create-website">
                  <Link href="/">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Website
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </>
            )}
          </div>
        </div>

        {activeView === "websites" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-[#7C3AED]/15 border border-[#7C3AED]/25 rounded-lg">
                      <Globe className="w-6 h-6 text-[#7C3AED]" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">Total Websites</p>
                      <p className="text-2xl font-bold text-white" data-testid="stat-total">{websites.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                      <Rocket className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">Live Websites</p>
                      <p className="text-2xl font-bold text-white" data-testid="stat-deployed">{deployedWebsites.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <Edit className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-400">Draft Websites</p>
                      <p className="text-2xl font-bold text-white" data-testid="stat-drafts">{draftWebsites.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Website Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">All Websites</TabsTrigger>
                <TabsTrigger value="deployed" data-testid="tab-deployed">Live Websites</TabsTrigger>
                <TabsTrigger value="drafts" data-testid="tab-drafts">Draft Websites</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {websites.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Globe className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2" data-testid="text-no-websites">No websites created yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Get started by creating your first website with our AI-powered builder.
                    </p>
                    <Button asChild data-testid="button-create-first">
                      <Link href="/">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Website
                      </Link>
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {websites.map((website) => (
                      <WebsiteCard key={website.id} website={website} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="deployed" className="space-y-6">
                {deployedWebsites.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Rocket className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No deployed websites yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Deploy your websites to Netlify to make them live on the internet.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deployedWebsites.map((website) => (
                      <WebsiteCard key={website.id} website={website} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="drafts" className="space-y-6">
                {draftWebsites.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Edit className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No draft websites</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      All your websites have been deployed. Great job!
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {draftWebsites.map((website) => (
                      <WebsiteCard key={website.id} website={website} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <ArticlesDashboard />
        )}
      </div>
    </div>
  );
}