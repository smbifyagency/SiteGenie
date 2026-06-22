import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { Key, ArrowRight, ArrowLeft, ExternalLink, Shield, Info } from "lucide-react";
import { useBusinessData } from "@/contexts/business-data-context";

const providers = [
    { id: "openai", name: "OpenAI", desc: "GPT-4o, GPT-4o Mini", docsUrl: "https://platform.openai.com/api-keys" },
    { id: "gemini", name: "Google Gemini", desc: "Gemini 2.5 Flash (Free tier available)", docsUrl: "https://aistudio.google.com/apikey" },
    { id: "openrouter", name: "OpenRouter", desc: "100+ models via single key", docsUrl: "https://openrouter.ai/keys" },
    { id: "deepseek", name: "DeepSeek", desc: "Affordable AI", docsUrl: "https://platform.deepseek.com/api_keys" },
];

export default function OnboardingApiSetup() {
    const [, setLocation] = useLocation();
    const { businessData, updateBusinessData } = useBusinessData();
    const [selectedProvider, setSelectedProvider] = useState((businessData as any).aiProvider || "gemini");
    const [apiKey, setApiKey] = useState("");

    const handleSaveAndContinue = () => {
        updateBusinessData({ aiProvider: selectedProvider, aiApiKey: apiKey } as any);
        setLocation("/onboarding/generating");
    };

    return (
        <div className="min-h-[80vh] py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    {["Business", "Services", "Locations", "Brand", "API", "Generate", "Preview"].map((step, i) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= 4 ? "bg-gradient-to-r bg-[#7C3AED] text-white" : "bg-white/5 text-gray-500 border border-white/10"
                                }`}>{i + 1}</div>
                            {i < 6 && <div className="w-4 sm:w-8 h-px bg-white/10 mx-1" />}
                        </div>
                    ))}
                </div>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <Key className="h-8 w-8 text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">API Setup</h1>
                    <p className="text-gray-400">Connect your AI provider to generate website content.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 space-y-6">
                    {/* Provider Selection */}
                    <div>
                        <p className="text-sm text-gray-300 font-medium mb-3">Choose your AI provider</p>
                        <div className="space-y-2">
                            {providers.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => setSelectedProvider(provider.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedProvider === provider.id
                                            ? "border-[#7C3AED]/40 bg-[#7C3AED]/10"
                                            : "border-white/10 bg-white/[0.02] hover:bg-white/5"
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium text-white">{provider.name}</p>
                                        <p className="text-sm text-gray-400">{provider.desc}</p>
                                    </div>
                                    <a
                                        href={provider.docsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[#7C3AED] hover:text-[#9333EA] text-xs flex items-center gap-1"
                                    >
                                        Get Key <ExternalLink className="h-3 w-3" />
                                    </a>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <Label className="text-gray-300 text-sm">API Key</Label>
                        <Input
                            type="password"
                            placeholder={`Enter your ${providers.find(p => p.id === selectedProvider)?.name} API key`}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono"
                        />
                    </div>

                    {/* Security Note */}
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 flex gap-3">
                        <Shield className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-emerald-300/80">
                            <strong>Your keys are safe.</strong> API keys are stored in your browser session only
                            and auto-expire. We never store keys on our servers.
                        </div>
                    </div>

                    {/* Skip Option */}
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex gap-3">
                        <Info className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-300/80">
                            You can skip this step and add your API key later from Settings. However, content
                            generation won't work without a valid key.
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setLocation("/onboarding/brand")}
                            className="border-white/20 text-gray-400 hover:bg-white/5 bg-transparent">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setLocation("/onboarding/generating")}
                                className="border-white/20 text-gray-400 hover:bg-white/5 bg-transparent">
                                Skip for Now
                            </Button>
                            <Button onClick={handleSaveAndContinue}
                                className="bg-[#7C3AED] hover:bg-[#9333EA] text-black font-bold px-8">
                                Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
