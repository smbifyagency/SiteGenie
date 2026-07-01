import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export async function generateArticle(
  provider: "gemini" | "openai" | "deepseek" | "openrouter",
  apiKey: string,
  businessDetails: string,
  keywords: string[],
  dofollowLinks: { url: string; anchor: string }[],
  variationIndex: number
): Promise<string> {
  const prompt = `You are an expert SEO content writer and HTML/CSS web designer.
Write a unique, highly professional, standalone HTML page about this business:
Business Details: ${businessDetails}
Keywords: ${keywords.join(", ")}
Target Dofollow Links to Embed:
${dofollowLinks.map(l => `- URL: ${l.url}, Anchor: ${l.anchor}`).join("\n")}

This is for Platform Variation #${variationIndex} out of 22 platforms. It MUST be 100% unique, humanized, and well-written. It should NOT sound like duplicate content from other platforms.
Use modern inline CSS styling inside a <style> block (e.g. clean dark mode or light card layout, beautiful typography, gradients, glassmorphism) so the page looks extremely premium and professional as a standalone landing page or article.
Return ONLY the raw HTML string (including <!DOCTYPE html> and <html> tags). Do not put markdown code fences (like \`\`\`html) or any conversational text. Start with <!DOCTYPE html> and end with </html>.`;

  if (provider === "gemini") {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    return text;
  } else if (provider === "openai") {
    const ai = new OpenAI({ apiKey });
    const completion = await ai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    });
    let text = completion.choices[0]?.message?.content || "";
    text = text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    return text;
  } else if (provider === "deepseek") {
    const ai = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com/v1" });
    const completion = await ai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }]
    });
    let text = completion.choices[0]?.message?.content || "";
    text = text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    return text;
  } else if (provider === "openrouter") {
    const ai = new OpenAI({ 
      apiKey, 
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://sitegenie.app",
        "X-Title": "SiteGenie"
      }
    });
    const completion = await ai.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }]
    });
    let text = completion.choices[0]?.message?.content || "";
    text = text.replace(/^```html\s*/i, "").replace(/```\s*$/i, "").trim();
    return text;
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
