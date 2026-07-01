import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Send, Trash, Plus, FileText, Link, Sparkles, CheckCircle2, AlertTriangle, ExternalLink, Eye, Code, Download, FileCode } from "lucide-react";

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
  wordCount: number;
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
  const [aiProvider, setAiProvider] = useState<string>("gemini");
  const [wordCount, setWordCount] = useState<string>("800");

  // Review & Edit Modal States
  const [reviewCampaign, setReviewCampaign] = useState<ArticleCampaign | null>(null);
  const [selectedArtKey, setSelectedArtKey] = useState<string>("art-1");
  const [editorContent, setEditorContent] = useState<string>("");

  // Update editor content when active article changes
  useEffect(() => {
    if (reviewCampaign && reviewCampaign.articles[selectedArtKey]) {
      setEditorContent(reviewCampaign.articles[selectedArtKey]);
    } else {
      setEditorContent("");
    }
  }, [selectedArtKey, reviewCampaign]);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<ArticleCampaign[]>({
    queryKey: ["/api/articles"],
    queryFn: async () => {
      const res = await fetch("/api/articles");
      if (!res.ok) throw new Error("Failed to load article campaigns");
      return res.json();
    },
    refetchInterval: 3000 // Poll every 3 seconds for real-time progress update
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

  // Save edits mutation
  const saveEditsMutation = useMutation<ArticleCampaign, Error, { id: string; articles: Record<string, string> }>({
    mutationFn: async ({ id, articles }) => {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles })
      });
      if (!res.ok) throw new Error("Failed to save changes");
      return res.json();
    },
    onSuccess: (updatedCampaign) => {
      toast({
        title: "Changes Saved",
        description: "Article content updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      setReviewCampaign(updatedCampaign);
    },
    onError: (err) => {
      toast({
        title: "Error Saving",
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
      dofollowLinks: validLinks,
      provider: aiProvider,
      wordCount: parseInt(wordCount) || 800
    });
  };

  const downloadArticle = (fileName: string, htmlContent: string) => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveChanges = () => {
    if (!reviewCampaign) return;
    const updatedArticles = { ...reviewCampaign.articles, [selectedArtKey]: editorContent };
    saveEditsMutation.mutate({ id: reviewCampaign.id, articles: updatedArticles });
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
                  <Label className="text-gray-300">AI Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#7C3AED] h-10">
                      <SelectValue placeholder="Select AI API" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-white/10 text-white">
                      <SelectItem value="gemini">Gemini API</SelectItem>
                      <SelectItem value="openai">OpenAI API</SelectItem>
                      <SelectItem value="deepseek">DeepSeek API</SelectItem>
                      <SelectItem value="openrouter">OpenRouter (Gemini/OpenAI/etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Target Word Count (Per Article)</Label>
                  <Select value={wordCount} onValueChange={setWordCount}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#7C3AED] h-10">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-950 border-white/10 text-white">
                      <SelectItem value="300">Short (~300 words)</SelectItem>
                      <SelectItem value="500">Medium (~500 words)</SelectItem>
                      <SelectItem value="800">Standard (~800 words)</SelectItem>
                      <SelectItem value="1200">Long (~1200 words)</SelectItem>
                      <SelectItem value="1500">In-Depth (~1500 words)</SelectItem>
                    </SelectContent>
                  </Select>
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
                  const isGenerating = generatedCount < 22;

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
                            onClick={() => {
                              setReviewCampaign(campaign);
                              setSelectedArtKey(Object.keys(campaign.articles)[0] || "art-1");
                            }}
                            className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30"
                          >
                            <Eye className="h-4 w-4 mr-1.5" />
                            Review Articles
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isGenerating || deployMutation.isPending}
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

                      {/* Real-time progress bar/status */}
                      {isGenerating ? (
                        <div className="space-y-2 bg-purple-950/20 border border-purple-900/40 p-3 rounded-lg">
                          <div className="flex justify-between text-xs text-purple-300">
                            <span className="flex items-center gap-2 font-semibold">
                              <Loader2 className="h-3.. w-3 animate-spin text-purple-400" />
                              Generating 22 unique articles...
                            </span>
                            <span>{generatedCount} / 22 generated</span>
                          </div>
                          <Progress value={(generatedCount / 22) * 100} className="h-2 bg-black/40 [&>div]:bg-purple-500" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5">
                          <div>
                            <p className="text-gray-500">Articles Generated</p>
                            <p className="text-lg font-bold text-white">
                              {generatedCount} / 22
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
                      )}

                      {/* Provider deployments grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {providers.map((pName) => {
                          const dep = campaign.deployments[pName];
                          const statusColor = dep?.status === "completed" ? "text-emerald-400 border-emerald-950 bg-emerald-950/20" :
                                              dep?.status === "deploying" ? "text-blue-400 border-blue-950 bg-blue-950/20 animate-pulse" :
                                              dep?.status === "failed" ? "text-red-400 border-red-950 bg-red-950/20" :
                                              "text-gray-500 border-gray-800";
                          
                          const badgeText = dep?.status === "completed" ? "Live" :
                                            dep?.status === "deploying" ? "Publishing..." :
                                            dep?.status === "failed" ? "Failed" : "Pending";

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

      {/* Review & Edit Dialog */}
      <Dialog open={!!reviewCampaign} onOpenChange={(open) => !open && setReviewCampaign(null)}>
        <DialogContent className="max-w-5xl bg-gray-950 border-white/10 text-white h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileCode className="h-6 w-6 text-purple-500" />
              Review Generated Articles — {reviewCampaign?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Preview styled layouts, edit HTML code, or download articles before deploying.
            </DialogDescription>
          </DialogHeader>

          {reviewCampaign && (
            <div className="flex-1 grid grid-cols-4 gap-6 min-h-0">
              {/* Left sidebar: articles list */}
              <div className="col-span-1 border border-white/10 rounded-lg p-2 overflow-y-auto space-y-1 bg-black/20">
                {Array.from({ length: 22 }, (_, idx) => {
                  const key = `art-${idx + 1}`;
                  const isAvailable = Boolean(reviewCampaign.articles[key]);
                  const isSelected = selectedArtKey === key;

                  return (
                    <button
                      key={key}
                      disabled={!isAvailable}
                      onClick={() => setSelectedArtKey(key)}
                      className={`w-full text-left p-2 rounded-lg text-xs flex justify-between items-center transition-all ${
                        isSelected ? "bg-purple-600 text-white font-bold" :
                        isAvailable ? "hover:bg-white/5 text-gray-300" : "opacity-40 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <span>Variation #{idx + 1}</span>
                      {isAvailable ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right main panel: tabs */}
              <div className="col-span-3 border border-white/10 rounded-lg p-4 bg-black/40 flex flex-col min-h-0">
                <Tabs defaultValue="preview" className="w-full flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                    <TabsList className="bg-white/5 border border-white/10">
                      <TabsTrigger value="preview" className="text-xs flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </TabsTrigger>
                      <TabsTrigger value="editor" className="text-xs flex items-center gap-1">
                        <Code className="h-3.5 w-3.5" /> Editor
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadArticle(`article-${selectedArtKey.split("-")[1]}.html`, editorContent)}
                        className="bg-white/10 text-white hover:bg-white/20 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <TabsContent value="preview" className="flex-1 min-h-0">
                    <iframe
                      title="Article Preview"
                      srcDoc={editorContent}
                      className="w-full h-full border-0 rounded-lg bg-white"
                      sandbox="allow-scripts"
                    />
                  </TabsContent>

                  <TabsContent value="editor" className="flex-1 flex flex-col min-h-0 space-y-4">
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="flex-1 w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-purple-500 resize-none overflow-y-auto"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={saveEditsMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        {saveEditsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
