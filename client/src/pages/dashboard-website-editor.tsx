import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft, Save, Globe, Eye, Rocket,
    Image as ImageIcon, Youtube, Plus, MapPin, Wrench, Loader2, Trash2, PlusCircle, LayoutTemplate
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WaterDamageTemplatePreview from "@/components/water-damage-template-preview";

type AIProvider = "openai" | "gemini" | "openrouter" | "deepseek";

const isAIProvider = (value: unknown): value is AIProvider =>
    value === "openai" || value === "gemini" || value === "openrouter" || value === "deepseek";

const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
        if (file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(e.target?.result as string);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = () => resolve(e.target?.result as string);
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
};

export default function DashboardWebsiteEditor() {
    const [, setLocation] = useLocation();
    const [match, params] = useRoute("/dashboard/websites/:id");
    const id = match ? params?.id : null;
    const { toast } = useToast();

    // Data Loading & Operation States
    const [websiteConfig, setWebsiteConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [activeTab, setActiveTab] = useState("identity");

    // Mock Data State for the Water Damage Template
    const [formData, setFormData] = useState({
        businessName: "Rapid Dry Water Restoration",
        phone: "(555) 019-2837",
        email: "emergency@rapiddry.com",
        address: "123 Recovery Way, Austin, TX 78701",
        category: "Water Damage Restoration",
        keywords: "",
        hours: "24/7 Emergency Service",
        websiteUrl: "",

        // Brand & Media
        primaryColor: "#E85D04", // High contrast orange
        secondaryColor: "#023E8A", // Deep water blue
        logoUrl: "",
        heroImageUrl: "",
        youtubeUrl: "https://www.youtube.com/watch?v=placeholder",

        // Services and Locations (Arrays for the UI form builder)
        services: ["Water Extraction", "Mold Remediation", "Flood Cleanup", "Structural Drying"],
        locations: ["Austin", "Round Rock", "Cedar Park", "Georgetown", "Leander"],

        // Content Options
        heroHeadline: "Austin's Fastest 24/7 Water Damage Restoration",
        heroSubheadline: "On-site in 60 minutes. Direct insurance billing. Family owned and operated.",
        aboutText: "Rapid Dry relies on advanced structural drying techniques and industrial-grade water extractors to save your property before secondary mold damage can occur. We bill your insurance directly, minimizing your out-of-pocket costs.",
        contentAiProvider: "gemini" as AIProvider,
    });

    useEffect(() => {
        if (!id) return;

        const loadWebsite = async () => {
            try {
                const response = await fetch(`/api/websites/${id}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Failed to load website");

                setWebsiteConfig(data);

                // If it has business data saved, map it directly back to our specific template state
                if (data.businessData) {
                    setFormData(prev => ({
                        ...prev,
                        ...data.businessData,
                        // Ensure colors fallback cleanly if not set
                        primaryColor: data.businessData.primaryColor || prev.primaryColor,
                        secondaryColor: data.businessData.secondaryColor || prev.secondaryColor,
                        // Services and Locations are merged from DB format
                        services: data.businessData.additionalServices
                            ? (Array.isArray(data.businessData.additionalServices)
                                ? data.businessData.additionalServices
                                : data.businessData.additionalServices.split(",").map((s: string) => s.trim()))
                            : prev.services,
                        locations: data.businessData.additionalLocations
                            ? (Array.isArray(data.businessData.additionalLocations)
                                ? data.businessData.additionalLocations
                                : data.businessData.additionalLocations.split(",").map((l: string) => l.trim()))
                            : prev.locations,
                    }));
                }
            } catch (error: any) {
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        loadWebsite();
    }, [id, toast]);

    // Load available AI providers
    useEffect(() => {
        Promise.all([
            fetch("/api/settings/openai", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch("/api/settings/gemini", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch("/api/settings/openrouter", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch("/api/settings/deepseek", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]).then(([openai, gemini, openrouter, deepseek]) => {
            const available: AIProvider[] = [];
            if (openai?.apiKey) available.push('openai');
            if (gemini?.apiKey) available.push('gemini');
            if (openrouter?.apiKey) available.push('openrouter');
            if (deepseek?.apiKey) available.push('deepseek');
            setAvailableAIProviders(available);
        });
    }, []);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStats, setGeneratedStats] = useState<{ services: number, locations: number } | null>(null);
    const [availableAIProviders, setAvailableAIProviders] = useState<AIProvider[]>([]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveData = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            // Shape the payload specifically as our config needs
            const payload = {
                ...formData,
                additionalServices: formData.services.join(', '),
                additionalLocations: formData.locations.join(', '),
                heroService: formData.category || "Water Damage Restoration",
                heroLocation: formData.locations[0]?.trim() || "Local Area",
                category: formData.category || "Restoration",
            };

            const response = await fetch(`/api/websites/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessData: payload })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed to save website");

            setWebsiteConfig(data);
            toast({ title: "✓ Configuration Saved", description: "Website data saved successfully" });
        } catch (error: any) {
            toast({ title: "Save Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncNetlify = async () => {
        if (!id) return;
        setIsDeploying(true);
        try {
            // Guarantee data is saved before publishing
            await handleSaveData();

            toast({ title: "Deploying...", description: "Syncing latest configuration payload to Netlify" });

            const response = await fetch(`/api/websites/${id}/redeploy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Netlify sync failed");

            // Re-fetch to update "lastDeployed" and correct Netlify URL status in UI
            const websiteReq = await fetch(`/api/websites/${id}`);
            const websiteData = await websiteReq.json();
            setWebsiteConfig(websiteData);

            toast({ title: "✓ Sync Successful", description: "Changes are live on Netlify!" });
        } catch (error: any) {
            toast({ title: "Sync Error", description: error.message, variant: "destructive" });
        } finally {
            setIsDeploying(false);
        }
    };

    const handleGeneratePages = async () => {
        setIsGenerating(true);
        try {
            const provider = isAIProvider((formData as any).contentAiProvider)
                ? ((formData as any).contentAiProvider as AIProvider)
                : "gemini";

            // Map our specialized template data to the shape the master AI generator expects
            const mappedBusinessData = {
                ...formData,
                heroService: formData.category || "Water Damage Restoration", // Core category
                heroLocation: formData.locations[0]?.trim() || "Local Area", // Fallback to first city
                additionalServices: formData.services.join(', '),
                additionalLocations: formData.locations.join(', '),
                category: formData.category || "Restoration",
                contentAiProvider: provider
            };

            const response = await fetch("/api/websites/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessData: mappedBusinessData, provider })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Generation failed");

            setGeneratedStats({
                services: result.data.serviceContent?.length || 0,
                locations: result.data.locationContent?.length || 0
            });

            toast({
                title: "✓ Generation Complete",
                description: result.message || "Unique AI pages successfully built in memory.",
                variant: "default",
            });

        } catch (error: any) {
            toast({
                title: "Generation Error",
                description: error.message || "Failed to trigger AI content generation.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/dashboard/websites" className="text-gray-400 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">Site Configurator: {formData.businessName}</h1>
                        <p className="text-sm text-gray-400">Template Master: Water Damage Restoration</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setActiveTab("preview")}
                            className="border-white/20 text-gray-300 hover:bg-white/5 bg-transparent"
                        >
                            <Eye className="mr-2 h-4 w-4" /> Live Preview
                        </Button>
                        <Button
                            onClick={handleSyncNetlify}
                            disabled={isDeploying || isLoading}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                        >
                            {isDeploying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                            Sync to Netlify
                        </Button>
                        <Button
                            onClick={handleSaveData}
                            disabled={isSaving || isLoading}
                            className="bg-[#7C3AED] hover:bg-[#9333EA] text-black"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Data
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Main Configuration Area */}
                    <div className="lg:col-span-3">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="mb-6 bg-white/[0.02] border border-white/10 p-1 rounded-xl">
                                <TabsTrigger value="identity" className="data-[state=active]:bg-white/10 rounded-lg">Identity & Brand</TabsTrigger>
                                <TabsTrigger value="content" className="data-[state=active]:bg-white/10 rounded-lg">Core Content</TabsTrigger>
                                <TabsTrigger value="media" className="data-[state=active]:bg-white/10 rounded-lg">Media & Video</TabsTrigger>
                                <TabsTrigger value="generator" className="data-[state=active]:bg-white/10 rounded-lg text-[#7C3AED]">
                                    <LayoutTemplate className="h-4 w-4 mr-2" /> Service & Location Pages
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg">
                                    <Eye className="h-4 w-4 mr-2" /> Live Preview
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: IDENTITY */}
                            <TabsContent value="identity" className="space-y-6">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">Business Details</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Business Name</Label>
                                            <Input
                                                value={formData.businessName}
                                                onChange={(e) => handleChange("businessName", e.target.value)}
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Template Category</Label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => handleChange("category", e.target.value)}
                                                className="mt-2 w-full h-10 px-3 rounded-md bg-[#1a1a2e] border border-white/10 text-white focus:outline-none focus:border-[#7C3AED]"
                                            >
                                                <option value="Water Damage Restoration">Water Damage Restoration</option>
                                                <option value="Plumbing">Plumbing (Coming Soon)</option>
                                                <option value="Roofing">Roofing (Coming Soon)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-gray-300">Full Address</Label>
                                            <Input
                                                value={formData.address}
                                                onChange={(e) => handleChange("address", e.target.value)}
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Emergency Phone</Label>
                                            <Input
                                                value={formData.phone}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Target Keywords</Label>
                                            <Input
                                                value={formData.keywords}
                                                onChange={(e) => handleChange("keywords", e.target.value)}
                                                placeholder="e.g. water damage repair, flood cleanup"
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Business Hours</Label>
                                            <Input
                                                value={formData.hours}
                                                onChange={(e) => handleChange("hours", e.target.value)}
                                                placeholder="e.g. 24/7 Emergency Service"
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Target Website URL</Label>
                                            <Input
                                                value={formData.websiteUrl}
                                                onChange={(e) => handleChange("websiteUrl", e.target.value)}
                                                placeholder="https://..."
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Primary Brand Color</Label>
                                            <div className="flex mt-2 gap-3">
                                                <div className="w-10 h-10 rounded border border-white/20" style={{ backgroundColor: formData.primaryColor }}></div>
                                                <Input
                                                    value={formData.primaryColor}
                                                    onChange={(e) => handleChange("primaryColor", e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-300">Secondary Accent Color</Label>
                                            <div className="flex mt-2 gap-3">
                                                <div className="w-10 h-10 rounded border border-white/20" style={{ backgroundColor: formData.secondaryColor }}></div>
                                                <Input
                                                    value={formData.secondaryColor}
                                                    onChange={(e) => handleChange("secondaryColor", e.target.value)}
                                                    className="bg-white/5 border-white/10 text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: CONTENT */}
                            <TabsContent value="content" className="space-y-6">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">Homepage Messaging</h3>
                                    <div className="space-y-6">
                                        <div>
                                            <Label className="text-gray-300">Hero Headline (H1)</Label>
                                            <Input
                                                value={formData.heroHeadline}
                                                onChange={(e) => handleChange("heroHeadline", e.target.value)}
                                                className="mt-2 bg-white/5 border-white/10 text-white text-lg font-medium"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-300">Hero Sub-headline (Trust factors)</Label>
                                            <Input
                                                value={formData.heroSubheadline}
                                                onChange={(e) => handleChange("heroSubheadline", e.target.value)}
                                                className="mt-2 bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-300">About Us / Our Process (Company Pitch)</Label>
                                            <Textarea
                                                value={formData.aboutText}
                                                onChange={(e) => handleChange("aboutText", e.target.value)}
                                                rows={4}
                                                className="mt-2 bg-white/5 border-white/10 text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 3: MEDIA */}
                            <TabsContent value="media" className="space-y-6">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                    <h3 className="text-lg font-semibold text-white mb-6">Visual Assets</h3>
                                    <div className="space-y-8">
                                        {/* Logo Upload */}
                                        <div className="p-6 border-2 border-dashed border-white/10 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center text-center">
                                            <ImageIcon className="h-8 w-8 text-gray-400 mb-3" />
                                            <p className="text-sm font-medium text-white">Upload Business Logo</p>
                                            <p className="text-xs text-gray-500 mt-1 mb-4">PNG, JPG, SVG.</p>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id="logo-upload"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        try {
                                                            const url = await compressImage(file, 600, 300, 0.85);
                                                            handleChange("logoUrl", url);
                                                            toast({ title: "Logo updated", description: "Save to apply." });
                                                        } catch (err) {
                                                            toast({ title: "Upload failed", description: String(err), variant: "destructive" });
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-white/20 text-gray-300"
                                                onClick={() => document.getElementById('logo-upload')?.click()}
                                            >
                                                Select File
                                            </Button>
                                            {formData.logoUrl && (
                                                <div className="mt-4">
                                                    <p className="text-xs text-emerald-400 mb-2">Logo loaded.</p>
                                                    <img src={formData.logoUrl} alt="Logo Preview" className="h-12 object-contain mx-auto rounded" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Sticky Video Feature */}
                                        <div>
                                            <Label className="text-gray-300 flex items-center gap-2 mb-2">
                                                <Youtube className="h-4 w-4 text-red-500" />
                                                Main YouTube Video (Sticky Feature)
                                            </Label>
                                            <Input
                                                value={formData.youtubeUrl}
                                                onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                                                className="bg-white/5 border-white/10 text-white"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                            />
                                            <p className="text-xs text-info text-blue-400 mt-2">
                                                * This video will automatically embed in the "Watch Our Process" Hero modal and the rich media section.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 4: MASS GENERATOR */}
                            <TabsContent value="generator" className="space-y-6">
                                <div className="rounded-2xl border border-[#7C3AED]/25 bg-indigo-500/5 p-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <LayoutTemplate className="h-5 w-5 text-[#7C3AED]" /> Mass Page Generator
                                            </h3>
                                            <p className="text-sm text-gray-300 mt-1 max-w-xl">
                                                Add the explicit services and cities you want pages for. When you click generate, the AI writes unique technical content for *each one* of these individual pages automatically.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="w-full min-w-[220px]">
                                                <Label className="text-xs uppercase tracking-[0.2em] text-gray-400">AI Provider {isAIProvider((formData as any).contentAiProvider) && <span className="text-green-400 text-xs ml-1">• Using {(formData as any).contentAiProvider === 'openai' ? 'OpenAI' : (formData as any).contentAiProvider === 'gemini' ? 'Gemini' : (formData as any).contentAiProvider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'}</span>}</Label>
                                                <select
                                                    value={isAIProvider((formData as any).contentAiProvider) ? (formData as any).contentAiProvider : "gemini"}
                                                    onChange={(e) => handleChange("contentAiProvider", e.target.value)}
                                                    className="mt-2 w-full h-10 px-3 rounded-md bg-[#1a1a2e] border border-white/10 text-white focus:outline-none focus:border-[#7C3AED] disabled:opacity-50"
                                                    disabled={availableAIProviders.length === 0}
                                                >
                                                    {availableAIProviders.length === 0 && <option value="">No AI providers configured</option>}
                                                    {availableAIProviders.includes('gemini') && <option value="gemini">Google Gemini {isAIProvider((formData as any).contentAiProvider) && (formData as any).contentAiProvider === 'gemini' && '✓'}</option>}
                                                    {availableAIProviders.includes('openai') && <option value="openai">OpenAI {isAIProvider((formData as any).contentAiProvider) && (formData as any).contentAiProvider === 'openai' && '✓'}</option>}
                                                    {availableAIProviders.includes('openrouter') && <option value="openrouter">OpenRouter {isAIProvider((formData as any).contentAiProvider) && (formData as any).contentAiProvider === 'openrouter' && '✓'}</option>}
                                                    {availableAIProviders.includes('deepseek') && <option value="deepseek">DeepSeek {isAIProvider((formData as any).contentAiProvider) && (formData as any).contentAiProvider === 'deepseek' && '✓'}</option>}
                                                </select>
                                                <p className="mt-2 text-xs text-gray-400">
                                                    Uses the saved API key for the selected provider from API Setup.
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleGeneratePages}
                                                disabled={isGenerating}
                                                className="bg-[#7C3AED] hover:bg-[#9333EA] text-black text-white shadow-lg transition-all"
                                            >
                                                {isGenerating ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Pages...</>
                                                ) : (
                                                    <><Rocket className="mr-2 h-4 w-4" /> Run AI Generator</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {generatedStats && (
                                        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">✓</div>
                                                <div>
                                                    <p className="text-sm font-semibold text-emerald-400">Generation Successful in Memory</p>
                                                    <p className="text-xs text-emerald-500/80">Ready to deploy <strong>{generatedStats.services} Service Pages</strong> and <strong>{generatedStats.locations} Location Pages</strong>.</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">View Payloads</Button>
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Services Form List */}
                                        <div className="space-y-4">
                                            <Label className="text-white flex items-center gap-2 font-medium text-lg">
                                                <Wrench className="h-4 w-4" /> Service Pages to Create
                                            </Label>
                                            <div className="space-y-3">
                                                {formData.services.map((service, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <Input
                                                            value={service}
                                                            onChange={(e) => {
                                                                const newServices = [...formData.services];
                                                                newServices[idx] = e.target.value;
                                                                handleChange("services", newServices as any);
                                                            }}
                                                            placeholder="e.g. Mold Remediation"
                                                            className="bg-black/40 border-[#7C3AED]/25 text-white flex-1"
                                                        />
                                                        <Button
                                                            variant="outline" size="icon"
                                                            onClick={() => {
                                                                const newServices = formData.services.filter((_, i) => i !== idx);
                                                                handleChange("services", newServices as any);
                                                            }}
                                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleChange("services", [...formData.services, ""] as any)}
                                                    className="w-full border-dashed border-[#7C3AED]/25 text-[#9333EA] hover:bg-[#7C3AED]/10"
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service Page
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Locations Form List */}
                                        <div className="space-y-4">
                                            <Label className="text-white flex items-center gap-2 font-medium text-lg">
                                                <MapPin className="h-4 w-4" /> City/Location Pages to Create
                                            </Label>
                                            <div className="space-y-3">
                                                {formData.locations.map((loc, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <Input
                                                            value={loc}
                                                            onChange={(e) => {
                                                                const newLocs = [...formData.locations];
                                                                newLocs[idx] = e.target.value;
                                                                handleChange("locations", newLocs as any);
                                                            }}
                                                            placeholder="e.g. Austin, TX"
                                                            className="bg-black/40 border-[#7C3AED]/25 text-white flex-1"
                                                        />
                                                        <Button
                                                            variant="outline" size="icon"
                                                            onClick={() => {
                                                                const newLocs = formData.locations.filter((_, i) => i !== idx);
                                                                handleChange("locations", newLocs as any);
                                                            }}
                                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleChange("locations", [...formData.locations, ""] as any)}
                                                    className="w-full border-dashed border-[#7C3AED]/25 text-[#9333EA] hover:bg-[#7C3AED]/10"
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Location Page
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 5: LIVE PREVIEW */}
                            <TabsContent value="preview" className="space-y-6">
                                <div className="rounded-2xl border border-emerald-500/30 bg-black p-1 relative">
                                    <div className="absolute top-4 right-4 z-10 bg-black/80 text-white px-3 py-1 rounded gap-2 flex items-center shadow-lg border border-white/10 text-sm backdrop-blur">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Live Render
                                    </div>
                                    <WaterDamageTemplatePreview data={formData} />
                                </div>
                            </TabsContent>

                        </Tabs>
                    </div>

                    {/* Sidebar / Deployment Status */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Deployment Status</h3>
                            <div className="space-y-4">
                                {websiteConfig?.netlifyUrl ? (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                            <span className="text-sm font-medium">Live on Netlify</span>
                                        </div>
                                        <a href={websiteConfig.netlifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400/80 hover:text-emerald-300 truncate block underline">
                                            {websiteConfig.netlifyUrl}
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                        <div className="flex items-center gap-2 text-yellow-400 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                            <span className="text-sm font-medium">Not Deployed</span>
                                        </div>
                                        <p className="text-xs text-yellow-400/80">Click Sync to Netlify to publish.</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Total Generated Pages:</span>
                                        <span className="text-white font-medium">{(generatedStats?.services || 0) + (generatedStats?.locations || 0) || 1} Pages</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Master Template ID:</span>
                                        <span className="text-white font-medium">WD-v2.1.4</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Last Data Sync:</span>
                                        <span className="text-white font-medium">
                                            {websiteConfig?.lastDeployedAt
                                                ? new Date(websiteConfig.lastDeployedAt).toLocaleDateString() + ' ' + new Date(websiteConfig.lastDeployedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : "Never"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                            <h3 className="text-sm font-semibold text-white mb-4">Template Anatomy</h3>
                            <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                This site is locked to the <strong>Water Damage High-Converter</strong> layout. Structural layout cannot be changed to ensure perfect PageSpeed and Mobile Responsiveness.
                            </p>
                            <ul className="text-xs text-gray-400 space-y-2">
                                <li className="flex items-center gap-2">✓ Sticky Emergency Header Call</li>
                                <li className="flex items-center gap-2">✓ Glassmorphism Trust Badges</li>
                                <li className="flex items-center gap-2">✓ Rich Video Modal Integrated</li>
                                <li className="flex items-center gap-2">✓ AI Service & Location Hubs</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
