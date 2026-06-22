import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Wand2, 
  CheckCircle, 
  Loader2, 
  Clock, 
  Eye, 
  Edit3,
  Save,
  Trash2,
  Plus,
  FileText,
  Target,
  Sparkles,
  Download,
  Image as ImageIcon,
  Info,
  RotateCcw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { BlogPromptSelector } from './blog-prompt-selector';
import { useToast } from '@/hooks/use-toast';
import type { BusinessData } from '../../../shared/schema';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  category?: string;
  tags: string[];
  status: 'draft' | 'published';
  authorName?: string;
  isAiGenerated: boolean;
  keywords?: string;
  publishedAt?: string;
  readingTime?: number;
}

interface BlogGenerationInterfaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessData: BusinessData;
  onPostsGenerated?: (posts: BlogPost[]) => void;
}

export function BlogGenerationInterface({ 
  open, 
  onOpenChange, 
  businessData,
  onPostsGenerated 
}: BlogGenerationInterfaceProps) {
  const [currentStep, setCurrentStep] = useState('setup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedPosts, setGeneratedPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  // Generation settings
  const [keywords, setKeywords] = useState('');
  const [blogCount, setBlogCount] = useState(3);
  const [wordCount, setWordCount] = useState(1500);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [includeImages, setIncludeImages] = useState(true);
  const [availableAIProviders, setAvailableAIProviders] = useState<string[]>([]);

  const { toast } = useToast();

  // Load available AI providers on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/settings/openai", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/settings/gemini", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/settings/openrouter", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/settings/deepseek", { credentials: "include" }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([openai, gemini, openrouter, deepseek]) => {
      const available: string[] = [];
      if (openai?.apiKey) available.push('openai');
      if (gemini?.apiKey) available.push('gemini');
      if (openrouter?.apiKey) available.push('openrouter');
      if (deepseek?.apiKey) available.push('deepseek');
      setAvailableAIProviders(available);
      if (available.length > 0 && !available.includes(aiProvider)) {
        setAiProvider(available[0]);
      }
    });
  }, []);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean'],
      ['blockquote', 'code-block']
    ],
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'align', 'color', 'background',
    'script', 'code-block'
  ];

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateReadingTime = (content: string): number => {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  const generateBlogPosts = async () => {
    if (!keywords.trim()) {
      toast({
        title: "Keywords Required",
        description: "Please enter keywords or topics for blog generation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStep('generating');
    setProgress(0);

    try {
      const keywordList = keywords.split('\n').filter(k => k.trim()).slice(0, blogCount);
      const newPosts: BlogPost[] = [];

      for (let i = 0; i < keywordList.length; i++) {
        const keyword = keywordList[i].trim();
        setProgress((i / keywordList.length) * 90);

        console.log("Sending API request with keyword:", keyword);
        console.log("Full API payload:", {
          businessName: businessData.businessName,
          category: businessData.category,
          location: businessData.heroLocation,
          services: businessData.services,
          serviceAreas: businessData.serviceAreas,
          keyword: keyword,
          promptId: selectedPrompt,
          wordCount: wordCount,
          useImages: includeImages,
          aiProvider: aiProvider
        });

        const response = await fetch('/api/ai/blog-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: businessData.businessName,
            category: businessData.category,
            location: businessData.heroLocation,
            services: businessData.services,
            serviceAreas: businessData.serviceAreas,
            keyword: keyword.trim(),
            promptId: selectedPrompt || undefined,
            wordCount: wordCount,
            useImages: includeImages,
            aiProvider: aiProvider
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to generate post for "${keyword}"`);
        }

        const result = await response.json();
        
        if (result.success && result.blogPost) {
          const blogPost: BlogPost = {
            id: `blog-${Date.now()}-${i}`,
            title: result.blogPost.title,
            slug: result.blogPost.slug,
            excerpt: result.blogPost.excerpt,
            content: result.blogPost.content,
            featuredImage: result.blogPost.featuredImage,
            featuredImageAlt: result.blogPost.featuredImageAlt,
            metaTitle: result.blogPost.metaTitle,
            metaDescription: result.blogPost.metaDescription,
            category: result.blogPost.category,
            tags: result.blogPost.tags || [],
            status: 'draft',
            authorName: businessData.businessName || 'Admin',
            isAiGenerated: true,
            keywords: keyword,
            publishedAt: new Date().toISOString(),
            readingTime: calculateReadingTime(result.blogPost.content)
          };
          
          newPosts.push(blogPost);
        }
      }

      setProgress(100);
      setGeneratedPosts(newPosts);
      setCurrentStep('review');
      
      toast({
        title: "Success!",
        description: `Generated ${newPosts.length} blog posts successfully.`
      });

    } catch (error) {
      console.error('Blog generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate blog posts",
        variant: "destructive"
      });
      setCurrentStep('setup');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost({ ...post });
    setSelectedPost(post);
    setActiveTab('content');
  };

  const handleSavePost = () => {
    if (!editingPost) return;

    if (!editingPost.title || !editingPost.content || !editingPost.excerpt) {
      toast({
        title: "Validation Error",
        description: "Please fill in title, excerpt, and content fields.",
        variant: "destructive"
      });
      return;
    }

    const updatedPosts = generatedPosts.map(post => 
      post.id === editingPost.id ? {
        ...editingPost,
        readingTime: calculateReadingTime(editingPost.content)
      } : post
    );

    setGeneratedPosts(updatedPosts);
    setSelectedPost(editingPost);
    setEditingPost(null);
    
    toast({
      title: "Saved",
      description: "Blog post updated successfully!"
    });
  };

  const handleDeletePost = (postId: string) => {
    setGeneratedPosts(prev => prev.filter(post => post.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
      setEditingPost(null);
    }
    
    toast({
      title: "Deleted",
      description: "Blog post removed successfully."
    });
  };

  const finalizePosts = () => {
    if (onPostsGenerated) {
      onPostsGenerated(generatedPosts);
    }
    
    toast({
      title: "Blog Posts Ready",
      description: `${generatedPosts.length} posts are ready for your website.`
    });
    
    onOpenChange(false);
  };

  const resetGeneration = () => {
    setCurrentStep('setup');
    setGeneratedPosts([]);
    setSelectedPost(null);
    setEditingPost(null);
    setProgress(0);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            AI Blog Post Generator
            {currentStep === 'review' && (
              <Badge variant="outline" className="ml-2">
                {generatedPosts.length} posts generated
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'setup' && (
          <div className="space-y-6 p-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Generate high-quality, SEO-optimized blog posts (1500-2000 words) with semantic keywords and FAQs included.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keywords" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Keywords / Topics (one per line)
                  </Label>
                  <Textarea
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder={`HVAC maintenance tips\nEmergency plumbing services\nElectrical safety for homeowners\nRoof inspection checklist\nSolar panel installation guide`}
                    rows={6}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter keywords or blog post topics, one per line. Maximum {blogCount} posts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="blogCount">Number of Posts</Label>
                    <Select value={blogCount.toString()} onValueChange={(value) => setBlogCount(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Post</SelectItem>
                        <SelectItem value="2">2 Posts</SelectItem>
                        <SelectItem value="3">3 Posts</SelectItem>
                        <SelectItem value="4">4 Posts</SelectItem>
                        <SelectItem value="5">5 Posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="wordCount">Word Count</Label>
                    <Select value={wordCount.toString()} onValueChange={(value) => setWordCount(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1000 words</SelectItem>
                        <SelectItem value="1500">1500 words</SelectItem>
                        <SelectItem value="2000">2000 words</SelectItem>
                        <SelectItem value="2500">2500 words</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>AI Writing Style</Label>
                  <BlogPromptSelector value={selectedPrompt} onChange={setSelectedPrompt} />
                </div>

                <div>
                  <Label htmlFor="aiProvider">AI Provider {aiProvider && <span className="text-green-400 text-xs ml-1">• Using {aiProvider === 'openai' ? 'OpenAI' : aiProvider === 'gemini' ? 'Gemini' : aiProvider === 'openrouter' ? 'OpenRouter' : 'DeepSeek'}</span>}</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider} disabled={availableAIProviders.length === 0}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAIProviders.length === 0 && <SelectItem value="">No AI providers configured</SelectItem>}
                      {availableAIProviders.includes('openai') && <SelectItem value="openai">OpenAI (GPT-4o) {aiProvider === 'openai' && '✓'}</SelectItem>}
                      {availableAIProviders.includes('gemini') && <SelectItem value="gemini">Google Gemini {aiProvider === 'gemini' && '✓'}</SelectItem>}
                      {availableAIProviders.includes('openrouter') && <SelectItem value="openrouter">OpenRouter {aiProvider === 'openrouter' && '✓'}</SelectItem>}
                      {availableAIProviders.includes('deepseek') && <SelectItem value="deepseek">DeepSeek {aiProvider === 'deepseek' && '✓'}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeImages"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="includeImages" className="text-sm">
                    Include featured images from Unsplash
                  </Label>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Each post will include semantic keywords, comprehensive FAQs, and local SEO optimization for {businessData.heroLocation}.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={generateBlogPosts} disabled={!keywords.trim()}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Blog Posts
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'generating' && (
          <div className="space-y-6 p-8 text-center">
            <div className="mx-auto w-16 h-16 relative">
              <Loader2 className="w-16 h-16 animate-spin text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Generating Your Blog Posts</h3>
              <p className="text-gray-600 mb-4">
                Creating high-quality, SEO-optimized content with semantic keywords and FAQs...
              </p>
              <Progress value={progress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="flex h-[80vh] gap-4">
            {/* Left Panel - Post List */}
            <div className="w-1/3 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Generated Posts</h3>
                  <Button variant="outline" size="sm" onClick={resetGeneration}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate More
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {generatedPosts.map((post) => (
                    <Card 
                      key={post.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedPost?.id === post.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm line-clamp-2">{post.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{post.excerpt}</p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {post.readingTime} min
                            </Badge>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPost(post);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <Button onClick={finalizePosts} className="w-full" disabled={generatedPosts.length === 0}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use These Posts
                </Button>
              </div>
            </div>

            {/* Right Panel - Post Editor/Viewer */}
            <div className="w-2/3 flex flex-col">
              {selectedPost ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b">
                    <TabsList>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex gap-2">
                      {editingPost ? (
                        <>
                          <Button variant="outline" onClick={() => setEditingPost(null)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSavePost}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => handleEditPost(selectedPost)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Post
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="content" className="h-full p-4 space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        {editingPost ? (
                          <Input
                            value={editingPost.title}
                            onChange={(e) => setEditingPost({
                              ...editingPost,
                              title: e.target.value,
                              slug: generateSlug(e.target.value)
                            })}
                          />
                        ) : (
                          <h2 className="text-xl font-bold">{selectedPost.title}</h2>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        {editingPost ? (
                          <Textarea
                            value={editingPost.excerpt}
                            onChange={(e) => setEditingPost({
                              ...editingPost,
                              excerpt: e.target.value
                            })}
                            rows={3}
                          />
                        ) : (
                          <p className="text-gray-600">{selectedPost.excerpt}</p>
                        )}
                      </div>

                      <div className="flex-1">
                        <Label>Content</Label>
                        {editingPost ? (
                          <div className="border rounded-md mt-1">
                            <ReactQuill
                              theme="snow"
                              value={editingPost.content}
                              onChange={(content) => setEditingPost({
                                ...editingPost,
                                content
                              })}
                              modules={quillModules}
                              formats={quillFormats}
                              style={{ height: '400px' }}
                            />
                          </div>
                        ) : (
                          <ScrollArea className="h-[400px] border rounded-md p-4 mt-1">
                            <div 
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                            />
                          </ScrollArea>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="seo" className="h-full p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Meta Title</Label>
                          {editingPost ? (
                            <Input
                              value={editingPost.metaTitle || ''}
                              onChange={(e) => setEditingPost({
                                ...editingPost,
                                metaTitle: e.target.value
                              })}
                            />
                          ) : (
                            <p className="text-sm">{selectedPost.metaTitle}</p>
                          )}
                        </div>

                        <div>
                          <Label>Category</Label>
                          {editingPost ? (
                            <Input
                              value={editingPost.category || ''}
                              onChange={(e) => setEditingPost({
                                ...editingPost,
                                category: e.target.value
                              })}
                            />
                          ) : (
                            <Badge variant="outline">{selectedPost.category}</Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Meta Description</Label>
                        {editingPost ? (
                          <Textarea
                            value={editingPost.metaDescription || ''}
                            onChange={(e) => setEditingPost({
                              ...editingPost,
                              metaDescription: e.target.value
                            })}
                            rows={3}
                          />
                        ) : (
                          <p className="text-sm text-gray-600">{selectedPost.metaDescription}</p>
                        )}
                      </div>

                      <div>
                        <Label>Tags</Label>
                        {editingPost ? (
                          <Input
                            value={editingPost.tags.join(', ')}
                            onChange={(e) => setEditingPost({
                              ...editingPost,
                              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                            })}
                            placeholder="tag1, tag2, tag3"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {selectedPost.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Featured Image</Label>
                        {selectedPost.featuredImage && (
                          <div className="mt-2">
                            <img 
                              src={selectedPost.featuredImage} 
                              alt={selectedPost.featuredImageAlt}
                              className="w-full h-48 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="preview" className="h-full p-4">
                      <ScrollArea className="h-full">
                        <article className="prose max-w-none">
                          <header className="mb-8">
                            <h1 className="text-3xl font-bold mb-4">{selectedPost.title}</h1>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                              <span>By {selectedPost.authorName}</span>
                              <span>•</span>
                              <span>{selectedPost.readingTime} min read</span>
                              <Badge variant="outline">
                                <Wand2 className="h-3 w-3 mr-1" />
                                AI Generated
                              </Badge>
                            </div>

                            {selectedPost.featuredImage && (
                              <img 
                                src={selectedPost.featuredImage} 
                                alt={selectedPost.featuredImageAlt}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                              />
                            )}

                            <p className="text-lg text-gray-600 leading-relaxed">
                              {selectedPost.excerpt}
                            </p>
                          </header>

                          <div 
                            className="prose-content"
                            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                          />

                          {selectedPost.tags.length > 0 && (
                            <footer className="mt-8 pt-4 border-t">
                              <div className="flex flex-wrap gap-2">
                                {selectedPost.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </footer>
                          )}
                        </article>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select a Post</h3>
                    <p>Choose a post from the list to view and edit it</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}