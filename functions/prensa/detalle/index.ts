interface Env {
  ASSETS: Fetcher;
}

interface PressItem {
  id: string;
  title: string;
  excerpt: string;
  image: string;
}

const BOT_UA = /(facebookexternalhit|WhatsApp|Twitterbot|Slackbot|Discordbot|LinkedInBot|TelegramBot)/i;
const CANONICAL_DOMAIN = "https://www.ceciliagortari.com.ar";

function esc(s: string) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const userAgent = ctx.request.headers.get("User-Agent") || "";

  // 1. Check if it's a bot
  if (!BOT_UA.test(userAgent)) {
    return ctx.next();
  }

  // IT IS A BOT - We match the logic requested: do NOT return ctx.next()
  // We must return a response now.

  const id = url.searchParams.get("id") || "";
  let found = false;
  let post: PressItem | undefined;

  // 2. Try to fetch data
  // We try fetching from /data/prensa-index.json (root based)
  const indexUrl = new URL("/data/prensa-index.json", url.origin);

  try {
    const dataReq = await fetch(indexUrl.toString());
    if (dataReq.ok) {
      const items = (await dataReq.json()) as PressItem[];
      if (id) {
        post = items.find((p) => p.id === id);
        if (post) found = true;
      }
    } else {
      console.error(`Failed to load index from ${indexUrl}: status ${dataReq.status}`);
    }
  } catch (err) {
    console.error("Error fetching prensa-index.json", err);
  }

  // 3. Construct Data (Found or Fallback)
  // Canonical URL always includes the ID if present
  const canonicalUrl = id
    ? `${CANONICAL_DOMAIN}/prensa/detalle/?id=${encodeURIComponent(id)}`
    : `${CANONICAL_DOMAIN}/prensa/detalle/`;

  let title = "Prensa | Cecilia Gortari";
  let description = "Detalle de la publicación.";
  let imageUrl = `${CANONICAL_DOMAIN}/assets/images/hero-diputados.jpg`; // Default generic image if you have one, or keep whatever was default
  // Use a sensible default image if specific one not found. 
  // If the user didn't specify a fallback image in the prompt, we use the one they mentioned as current default 'hero-diputados.jpg' or similar. 
  // Let's assume 'hero-diputados.jpg' is at /assets/images/ or root. 
  // The user prompt said: "og:image = hero-diputados.jpg" (relative).
  // I will try to make it absolute.

  if (found && post) {
    title = post.title;
    description = post.excerpt;
    imageUrl = post.image;
  }

  // Verify absolute image URL
  if (imageUrl.startsWith("/")) {
    imageUrl = `${CANONICAL_DOMAIN}${imageUrl}`;
  } else if (!imageUrl.startsWith("http")) {
    // It's a relative path without leading slash?
    imageUrl = `${CANONICAL_DOMAIN}/${imageUrl}`;
  }

  // Escape HTML
  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeImage = esc(imageUrl);
  const safeCanonical = esc(canonicalUrl);

  // 4. Build Minimal HTML
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <!-- OG_FUNCTION hit=true found=${found} id=${esc(id)} -->
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <link rel="canonical" href="${safeCanonical}">
  
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Cecilia Gortari">
  <meta property="og:url" content="${safeCanonical}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:secure_url" content="${safeImage}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${safeTitle}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">
</head>
<body>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Vary": "User-Agent",
      // Debug headers
      "x-og-function": "hit",
      "x-og-found": found.toString(),
      "x-og-id": id,
    },
  });
};
