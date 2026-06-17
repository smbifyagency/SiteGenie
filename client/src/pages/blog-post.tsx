import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Calendar, Clock, User, ArrowLeft, Share2, Heart, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import NotFound from "@/pages/not-found";

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
  tags?: string[];
  authorName: string;
  authorEmail?: string;
  publishedAt: string;
  updatedAt: string;
  readingTime?: number;
  viewCount?: number;
  isAiGenerated: boolean;
}

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog-posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog-posts/${slug}`);
      if (!response.ok) throw new Error("Post not found");
      return response.json();
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: allPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    enabled: !!post,
  });

  const relatedPosts = allPosts
    .filter(p => p.id !== post?.id && (
      p.category === post?.category ||
      p.tags?.some(tag => post?.tags?.includes(tag))
    ))
    .slice(0, 3);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^1\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="w-full rounded-lg my-6">')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br>');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pt-20">
      {/* SEO Meta Tags */}
      <title>
        {(post.metaTitle || post.title)
          ? (post.metaTitle || post.title).trim().charAt(0).toUpperCase() + (post.metaTitle || post.title).trim().slice(1)
          : ''}
      </title>
      <meta name="description" content={post.metaDescription || post.excerpt} />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative rounded-xl overflow-hidden mb-8 shadow-2xl">
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                className="w-full h-64 md:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
              {post.isAiGenerated && (
                <Badge className="absolute top-4 right-4 bg-[#7C3AED] hover:bg-[#9333EA] text-white border-0">
                  AI Generated
                </Badge>
              )}
            </div>
          )}

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
              {post.category && (
                <Badge variant="outline" className="text-sm border-gray-200 text-gray-600">
                  {post.category}
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.authorName}
              </div>
              {post.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readingTime} min read
                </div>
              )}
              {post.viewCount && (
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {post.viewCount} views
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] bg-clip-text text-transparent">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-500 leading-relaxed mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Social Actions */}
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-600 bg-transparent hover:text-gray-900 hover:bg-gray-100">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-gray-200 text-gray-600 bg-transparent hover:text-gray-900 hover:bg-gray-100">
                <Heart className="h-4 w-4" />
                Like
              </Button>
            </div>
          </div>

          <Separator className="mb-8 border-gray-200" />

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-12 text-gray-700 prose-headings:text-gray-900 prose-a:text-[#7C3AED] prose-strong:text-gray-900">
            <p className="mb-4">
              <span
                dangerouslySetInnerHTML={{
                  __html: formatContent(post.content)
                }}
              />
            </p>
          </div>

          <Separator className="mb-8 border-gray-200" />

          {/* Author Info */}
          <Card className="mb-12 bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">{post.authorName}</CardTitle>
                  <CardDescription className="text-gray-500">Author</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-gray-900">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="group hover:shadow-lg transition-all duration-300 bg-white border-gray-200">
                    {relatedPost.featuredImage && (
                      <div className="relative overflow-hidden">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost.featuredImageAlt || relatedPost.title}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {relatedPost.isAiGenerated && (
                          <Badge className="absolute top-2 right-2 bg-[#7C3AED] text-white border-0 text-xs">
                            AI
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        {relatedPost.category && (
                          <Badge variant="outline" className="text-xs border-gray-200">
                            {relatedPost.category}
                          </Badge>
                        )}
                        {relatedPost.readingTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {relatedPost.readingTime} min
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-[#7C3AED] text-gray-900 transition-colors line-clamp-2">
                        {relatedPost.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm text-gray-500">
                        {relatedPost.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {relatedPost.authorName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(relatedPost.publishedAt)}
                        </div>
                      </div>

                      <Link href={`/blog/${relatedPost.slug}`}>
                        <Button variant="outline" size="sm" className="w-full border-gray-200 text-gray-600 bg-transparent hover:text-gray-900 hover:bg-gray-100 transition-colors">
                          Read More
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Newsletter Signup */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-900">Subscribe to Our Newsletter</CardTitle>
                <CardDescription className="text-gray-600">
                  Get the latest articles and insights delivered straight to your inbox.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#7C3AED]"
                  />
                  <Button className="bg-[#7C3AED] hover:bg-[#9333EA] text-white font-bold border-0">
                    Subscribe
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}