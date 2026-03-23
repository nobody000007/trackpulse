import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
]);

// Injected into every proxied HTML page:
// 1. Sets base href so relative URLs resolve correctly
// 2. Intercepts link clicks and posts the new URL to the parent frame
const INJECTED_SCRIPT = (baseUrl: string) => `
<base href="${baseUrl}">
<script>
(function() {
  // Intercept all link navigations and route them through the proxy
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a');
    if (!el || !el.href) return;
    var href = el.href;
    // Skip anchors, javascript:, mailto:, tel:
    if (!href.startsWith('http')) return;
    e.preventDefault();
    window.parent.postMessage({ type: 'proxy-navigate', url: href }, '*');
  }, true);

  // Tell parent we loaded successfully
  window.addEventListener('load', function() {
    window.parent.postMessage({ type: 'proxy-loaded', title: document.title }, '*');
  });
})();
</script>
`;

async function proxyFetch(url: string, req: NextRequest) {
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": req.headers.get("accept") ?? "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "identity",
    },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });
  return upstream;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("http")) {
    return new NextResponse("Missing or invalid url", { status: 400 });
  }

  try {
    const upstream = await proxyFetch(url, req);
    const contentType = upstream.headers.get("content-type") ?? "";

    // ── HTML: inject base + nav script, strip security headers ──
    if (contentType.includes("text/html")) {
      let html = await upstream.text();

      // Determine the base URL (use the final redirected URL)
      const base = url.replace(/\/[^/]*$/, "/"); // directory of the URL

      // Inject just before </head> or at the start
      const injection = INJECTED_SCRIPT(base);
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${injection}</head>`);
      } else if (html.includes("<head>")) {
        html = html.replace("<head>", `<head>${injection}`);
      } else {
        html = injection + html;
      }

      const headers = new Headers();
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "no-store");
      // Explicitly NOT setting X-Frame-Options so our iframe can load it

      return new NextResponse(html, { status: upstream.status, headers });
    }

    // ── CSS: proxy through (may have relative url() for fonts/images) ──
    if (contentType.includes("text/css")) {
      const css = await upstream.text();
      const headers = new Headers();
      headers.set("content-type", "text/css");
      headers.set("cache-control", "public, max-age=3600");
      return new NextResponse(css, { status: upstream.status, headers });
    }

    // ── Everything else (images, fonts, JS): stream through ──
    const body = await upstream.arrayBuffer();
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=3600");

    return new NextResponse(body, { status: upstream.status, headers });

  } catch (err: any) {
    return new NextResponse(`Proxy error: ${err.message}`, { status: 502 });
  }
}
