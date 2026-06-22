import { BlogPostData } from "./openai.js";

// Generic helper for simple text generation with OpenRouter
export async function generateWithOpenRouter(prompt: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "SiteGenie"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || '{}';
  } catch (error) {
    console.error("OpenRouter generation error:", error);
    throw new Error("Failed to generate content with OpenRouter");
  }
}

export async function generateBlogPostWithOpenRouter(
  keyword: string,
  aiPrompt: string,
  businessContext: any,
  customApiKey?: string
): Promise<BlogPostData> {
  try {
    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    const systemPrompt = `You are a local business expert who writes blog posts that real people actually want to read. You have 15 years of hands-on experience in the ${businessContext.category} industry and you write the way you talk — clear, specific, and helpful.
    
Business Context:
- Business Name: ${businessContext.businessName}
- Category: ${businessContext.category}
- Location: ${businessContext.heroLocation}
- Services: ${businessContext.services}

WRITING VOICE:
- Write like a knowledgeable American professional explaining something to a homeowner. Confident, direct, specific.
- Use contractions (it's, you'll, we're, don't). This is how Americans write and talk.
- Second person (you, your) and first person plural (we, our). Active voice.
- Short paragraphs (2-4 sentences). Vary sentence length for natural rhythm.
- Give concrete details: cost ranges, timeframes, tool names, material types, measurements.
- Include real scenarios (a pipe bursting at 2am, finding mold after a renovation, a storm damaging the roof).

BANNED WORDS (never use):
- "Comprehensive" / "Cutting-edge" / "State-of-the-art" / "Top-notch" / "World-class"
- "Leverage" / "Utilize" / "Facilitate" / "Streamline" / "Navigate" / "Landscape" (non-literal)
- "Whether you're... or..." / "Don't hesitate" / "Look no further" / "Rest assured" / "Peace of mind"
- "Game-changer" / "Revolutionize" / "Delve" / "Elevate" / "Empower" / "Robust" / "Seamless"
- "Harness" / "Pivotal" / "Paramount" / "Invaluable" / "Unparalleled" / "Second to none"
- Do NOT use slash constructions ("repair/replacement") — write "repair or replacement" instead

SEO REQUIREMENTS:
- Include primary keyword "${keyword}" in title, first 100 words, 2-3 H2s, and conclusion
- Include at least 10 LSI and semantic keywords: related terms, tool names, material types, process terminology, industry certifications, and variations a searcher would expect
- Include high-intent phrases: "cost of ${keyword}," "${keyword} near me," "hire a professional," "free estimate"
- Include location keywords: ${businessContext.heroLocation} woven in naturally
- Include 1-2 external dofollow links to authoritative sources (.gov, industry associations, certification bodies). Format: <a href="URL" target="_blank" rel="dofollow">anchor</a>
- Structure with clear H2 and H3 headings that answer real search queries
- Target 1500-2000 words with a FAQ section of 5-8 questions

Return the response as a JSON object with the exact structure requested.`;

    const userPrompt = `${aiPrompt}

Create a thorough, genuinely helpful blog post about: "${keyword}"

Write something that would actually help a homeowner make a decision. Include specific details, real cost ranges, honest advice about when to DIY and when to call a pro. Make it scannable with clear headings.

REQUIREMENTS:
- 1500-2000 words minimum with proper markdown headings (##, ###)
- Include at least 10 semantically related terms and named entities (tool names, material types, certifications, process terminology)
- FAQ section with 5-8 real questions and detailed answers
- 1-2 external dofollow links to authoritative sources
- No slash constructions — write "and" or "or" instead
- Write like a real person, not a marketing department

Return a JSON object with these exact fields:
{
  "title": "Clear, keyword-rich title (60 characters or less) — no clickbait",
  "slug": "url-friendly-slug-from-title",
  "excerpt": "Compelling 150-160 character summary with the keyword",
  "content": "Full 1500-2000 word blog post in Markdown with ##, ### headings. Include semantic keywords, named entities, FAQ section, and 1-2 external dofollow links naturally. No image tags. No slashes.",
  "metaTitle": "SEO title for meta tag (60 characters or less) with keyword and location",
  "metaDescription": "Meta description for SEO (150-160 characters) with clear value proposition",
  "tags": ["relevant", "tags", "array"],
  "category": "Most relevant category for this business type",
  "keywords": "${keyword}",
  "aiPrompt": "${aiPrompt}"
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://replit.com",
        "X-Title": "SiteGenie"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated from OpenRouter");
    }

    const blogPost = JSON.parse(content) as Omit<BlogPostData, 'id'>;

    // Validate required fields
    if (!blogPost.title || !blogPost.content || !blogPost.excerpt) {
      throw new Error("Invalid blog post structure generated");
    }

    // Add required ID field
    const blogPostWithId: BlogPostData = {
      ...blogPost,
      id: `blog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    return blogPostWithId;
  } catch (error) {
    console.error("Error generating blog post with OpenRouter:", error);
    throw new Error(`Failed to generate blog post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateMultipleBlogPostsWithOpenRouter(
  keywords: string[],
  aiPrompt: string,
  businessContext: any,
  customApiKey?: string,
  wordCount: number = 1500
): Promise<BlogPostData[]> {
  const blogPosts: BlogPostData[] = [];

  for (const keyword of keywords) {
    try {
      // Pass word count to the prompt
      const modifiedPrompt = aiPrompt.replace(/\$\{wordCount\}/g, wordCount.toString());
      const blogPost = await generateBlogPostWithOpenRouter(keyword.trim(), modifiedPrompt, businessContext, customApiKey);
      blogPosts.push(blogPost);

      // Add a minimal delay to avoid rate limiting  
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to generate blog post for keyword "${keyword}":`, error instanceof Error ? error.message : error);
      // Continue with other keywords instead of failing completely
    }
  }

  return blogPosts;
}