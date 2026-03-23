import { NextRequest, NextResponse } from "next/server";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

/**
 * GET /api/track/fetch-content?url=<target>
 * Fetches and extracts readable content from any URL server-side.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: "Could not extract content from this page" }, { status: 422 });
    }

    return NextResponse.json({
      title: article.title,
      byline: article.byline,
      content: article.content,   // sanitized HTML
      textContent: article.textContent,
      siteName: article.siteName,
      excerpt: article.excerpt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to fetch content" }, { status: 500 });
  }
}
