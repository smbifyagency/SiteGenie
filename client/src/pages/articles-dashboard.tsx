import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Trash, Plus, FileText, Link, Sparkles, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface DofollowLink {
  url: string;
  anchor: string;
}

interface ArticleCampaign {
  id: string;
  title: string;
  businessDetails: string;
  keywords: string[];
  dofollowLinks: DofollowLink[];
  provider: string;
  articles: Record<string, string>;
  deployments: Record<string, { status: "pending" | "deploying" | "completed" | "failed"; url?: string; error?: string }>;
  createdAt: string;
}

export default function ArticlesDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [title, setTitle] = useState("");
  const [businessDetails, setBusinessDetails] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [links, setLinks] = useState<DofollowLink[]>([{ url: "", anchor: "" }]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<ArticleCampaign[]>({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Failed to load article campaigns");
      return res.json();
    },
    refetchInterval: 5000 // Poll every 5 seconds to get real-time generation/deployment status
  });

  // Generate mutation
  const generateMutation = useMutation<ArticleCampaign, Error, any>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate articles");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Generation Initiated",
        description: "Your 22 unique articles are being generated in the background."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      // Reset form
      setTitle("");
      setBusinessDetails("");
      setKeywordsInput("");
      setLinks([{ url: "", anchor: "" }]);
    },
    onError: (err) => {
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  // Syndicate/Deploy mutation
  const deployMutation = useMutation<{ message: string }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/articles/${id}/deploy`, { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to deploy articles");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Syndication Started",
        description: "Publishing articles to configured platforms in the background."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
    onError: (err) => {
      toast({
        title: "Deployment Failed",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "The article campaign has been removed."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    }
  });

  const handleAddLink = () => {
    setLinks([...links, { url: "", anchor: "" }]);
  };

  const handleLinkChange = (index: number, field: keyof DofollowLink, value: string) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !businessDetails.trim() || !keywordsInput.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }

    const keywords = keywordsInput.split(",").map(k => k.trim()).filter(Boolean);
    const validLinks = links.filter(l => l.url.trim() && l.anchor.trim());

    generateMutation.mutate({
      title,
      businessDetails,
      keywords,
      dofollowLinks: validLinks
    });
  };

  return (
    <div className="space-y-8 p-6 text-white min-h-screen bg-[#030014]/60">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
          SEO Article Syndication
        </h1>
        <p className="text-gray-400 text-sm">
          Write and syndicates 22 unique AI articles to Vercel, Netlify, FTP servers, GitHub Pages, and cloud buckets in a single click.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                New SEO Campaign
              </CardTitle>
              <CardDescription className="text-gray-400">
                AI will compose distinct variations for each deployment provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-title" className="text-gray-300">Campaign Title</Label>
                  <Input
                    id="campaign-title"
                    placeholder="e.g. Roof Repair Service SEO Campaign"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-details" className="text-gray-300">Business Details / Context</Label>
                  <textarea
                    id="business-details"
                    placeholder="Describe the business, services offered, locations, and special guarantees..."
                    value={businessDetails}
                    onChange={(e) => setBusinessDetails(e.target.value)}
                    className="w-full min-h-[100px] bg-white/5 border border-white/10 text-white rounded-lg p-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-gray-300">Target Keywords (Comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="roof replacement, emergency roof repair, roofing contractor"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#7C3AED]"
                  />
                </div>

                {/* Dofollow Link builder */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-300">Embed Dofollow Links</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddLink}
                      className="text-pink-500 hover:text-pink-400 p-0 h-auto"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Link
                    </Button>
                  </div>

                  {links.map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="flex-1 space-y-1">
                        <Input
                          placeholder="URL (https://example.com)"
                          value={link.url}
                          onChange={(e) => handleLinkChange(idx, "url", e.target.value)}
                          className="h-8 bg-black/20 border-white/5 text-xs text-white"
                        />
                        <Input
                          placeholder="Anchor Text"
                          value={link.anchor}
                          onChange={(e) => handleLinkChange(idx, "anchor", e.target.value)}
                          className="h-8 bg-black/20 border-white/5 text-xs text-white"
                        />
                      </div>
                      {links.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLink(idx)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating 22 variations...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Article Variations
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Campaigns List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                SEO Campaigns
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor content generation, deployment logs, and syndicated backlink statuses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg text-gray-500">
                  No SEO syndication campaigns found. Compose one on the left panel!
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const providers = Object.keys(campaign.deployments);
                  const generatedCount = Object.keys(campaign.articles).length;
                  const completedCount = Object.values(campaign.deployments).filter(d => d.status === "completed").length;
                  const failedCount = Object.values(campaign.deployments).filter(d => d.status === "failed").length;

                  return (
                    <div key={campaign.id} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                      {/* Campaign header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {campaign.title}
                            <span className="text-xs font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                              AI: {campaign.provider.toUpperCase()}
                            </span>
                          </h3>
                          <p className="text-xs text-gray-500">
                            Created at {new Date(campaign.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={generatedCount === 0 || deployMutation.isPending}
                            onClick={() => deployMutation.mutate(campaign.id)}
                            className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/40 border border-purple-500/30"
                          >
                            <Send className="h-4 w-4 mr-1.5" />
                            Syndicate All
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(campaign.id)}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Content generation progress */}
                      <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                        <div>
                          <p className="text-gray-500">Articles Generated</p>
                          <p className="text-lg font-bold text-white">
                            {generatedCount} / {providers.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deploy Status</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {completedCount} Success
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Failures</p>
                          <p className="text-lg font-bold text-red-400">
                            {failedCount} Failed
                          </p>
                        </div>
                      </div>

                      {/* Provider deployments grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {providers.map((pName) => {
                          const dep = campaign.deployments[pName];
                          const hasArticle = Boolean(campaign.articles[pName]);
                          
                          let statusColor = "text-gray-500 border-gray-800";
                          let badgeText = "Pending Article";

                          if (hasArticle && (!dep || dep.status === "pending")) {
                            statusColor = "text-purple-400 border-purple-950 bg-purple-950/20";
                            badgeText = "Ready to deploy";
                          } else if (dep?.status === "deploying") {
                            statusColor = "text-blue-400 border-blue-950 bg-blue-950/20 animate-pulse";
                            badgeText = "Publishing...";
                          } else if (dep?.status === "completed") {
                            statusColor = "text-emerald-400 border-emerald-950 bg-emerald-950/20";
                            badgeText = "Live";
                          } else if (dep?.status === "failed") {
                            statusColor = "text-red-400 border-red-950 bg-red-950/20";
                            badgeText = "Failed";
                          }

                          return (
                            <div 
                              key={pName} 
                              className={`p-2 rounded-lg border flex flex-col justify-between h-16 ${statusColor}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold uppercase tracking-wider">{pName}</span>
                                {dep?.status === "completed" && dep.url && (
                                  <a 
                                    href={dep.url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-emerald-400 hover:text-emerald-300"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 truncate">
                                {dep?.error ? dep.error : badgeText}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
