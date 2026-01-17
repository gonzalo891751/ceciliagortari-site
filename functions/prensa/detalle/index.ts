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

    // 2. Parse ID from query string
    const id = url.searchParams.get("id");
    if (!id) {
        return ctx.next();
    }

    // 3. Fetch data index
    // We fetch from the deployed URL or local origin to get the JSON file
    const indexUrl = \`\${url.origin}/data/prensa-index.json\`;
  let items: PressItem[] = [];

  try {
    const dataReq = await fetch(indexUrl);
    if (dataReq.ok) {
      items = await dataReq.json() as PressItem[];
    } else {
        // Fallback or error logging if needed
        console.error("Failed to load prensa-index.json");
    }
  } catch (err) {
    console.error("Error fetching prensa-index.json", err);
  }

  // 4. Find the post
  const post = items.find((p) => p.id === id);
  if (!post) {
    return ctx.next();
  }

  // 5. Construct tags
  const canonicalUrl = \`\${CANONICAL_DOMAIN}/prensa/detalle/?id=\${encodeURIComponent(post.id)}\`;
  
  // Ensure absolute image URL
  let imageUrl = post.image;
  if (imageUrl.startsWith("/")) {
    imageUrl = \`\${CANONICAL_DOMAIN}\${imageUrl}\`;
  }

  const title = esc(post.title);
  const description = esc(post.excerpt);
  const safeImageUrl = esc(imageUrl);

  // 6. Build HTML response
  const html = \`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>\${title} | Cecilia Gortari</title>
  <meta name="description" content="\${description}">
  <link rel="canonical" href="\${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Cecilia Gortari">
  <meta property="og:url" content="\${canonicalUrl}">
  <meta property="og:title" content="\${title}">
  <meta property="og:description" content="\${description}">
  <meta property="og:image" content="\${safeImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="\${title}">
  <meta name="twitter:description" content="\${description}">
  <meta name="twitter:image" content="\${safeImageUrl}">
</head>
<body>
</body>
</html>\`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Vary": "User-Agent",
    },
  });
};
