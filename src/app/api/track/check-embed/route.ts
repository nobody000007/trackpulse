import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/track/check-embed?url=<target>
 * Checks server-side whether the target URL allows iframe embedding.
 * Returns { embeddable: boolean }
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ embeddable: false });

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrackPulse/1.0)" },
    });

    const xfo = res.headers.get("x-frame-options") ?? "";
    const csp = res.headers.get("content-security-policy") ?? "";

    const blocked =
      /deny|sameorigin/i.test(xfo) ||
      /frame-ancestors\s+('none'|[^;]*(?!\*)[^;]*)/i.test(csp);

    return NextResponse.json({ embeddable: !blocked });
  } catch {
    // Network error or timeout — assume blocked to avoid showing error
    return NextResponse.json({ embeddable: false });
  }
}
