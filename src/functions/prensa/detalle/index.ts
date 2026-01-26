interface Env {
  ASSETS: Fetcher;
}

interface PressItem {
  id: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string;
  imagen?: string;
  cuerpo?: string;
  body?: string;
  contenido?: string;
}

const BOT_UA = /(facebookexternalhit|WhatsApp|Twitterbot|Slackbot|Discordbot|LinkedInBot|TelegramBot)/i;
const CANONICAL_DOMAIN = "https://www.ceciliagortari.com.ar";
const DEFAULT_TITLE = "Detalle de Prensa | Cecilia Gortari";
const DEFAULT_DESCRIPTION = "Detalle de la publicación.";
const DEFAULT_IMAGE = `${CANONICAL_DOMAIN}/assets/img/hero-diputados.jpg`;

function esc(s: string) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripMarkdown(value: string) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`>#]/g, " ")
    .replace(/^\s*[-*+]\s+/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

async function loadPressItems(ctx: { env: Env }, url: URL) {
  // Prefer loading from the Pages static assets (robust in CF Pages and preview envs).
  const dataUrl = new URL("/content/prensa.json", url.origin);
  try {
    const assetsRes = await ctx.env.ASSETS.fetch(dataUrl.toString(), {
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (assetsRes.ok) {
      const data = (await assetsRes.json()) as { items?: PressItem[] };
      return Array.isArray(data.items) ? data.items : [];
    }
  } catch (err) {
    console.error("Error fetching prensa.json from ASSETS", err);
  }

  try {
    const res = await fetch(dataUrl.toString(), { cf: { cacheTtl: 300 } });
    if (res.ok) {
      const data = (await res.json()) as { items?: PressItem[] };
      return Array.isArray(data.items) ? data.items : [];
    }
  } catch (err) {
    console.error("Error fetching prensa.json via fetch", err);
  }

  return [];
}

function toAbsoluteImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return DEFAULT_IMAGE;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("/")) {
    return `${CANONICAL_DOMAIN}${pathOrUrl}`;
  }
  return `${CANONICAL_DOMAIN}/${pathOrUrl}`;
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const userAgent = ctx.request.headers.get("User-Agent") || "";
  const id = url.searchParams.get("id") || "";

  // 1. Check if it's a bot
  if (!id || !BOT_UA.test(userAgent)) {
    return ctx.next();
  }

  // IT IS A BOT - Return minimal HTML
  let found = false;
  let post: PressItem | undefined;

  // 2. Try to fetch data
  const items = await loadPressItems(ctx, url);
  if (id && items.length) {
    post = items.find((p) => p.id === id || p.slug === id);
    if (post) found = true;
  }

  // 3. Construct Data
  const canonicalUrl = id
    ? `${CANONICAL_DOMAIN}/prensa/detalle/?id=${encodeURIComponent(id)}`
    : `${CANONICAL_DOMAIN}/prensa/detalle/`;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let imageUrl = DEFAULT_IMAGE;

  if (found && post) {
    const rawTitle = post.titulo || DEFAULT_TITLE;
    const rawDescription =
      post.subtitulo ||
      truncate(
        stripMarkdown(post.cuerpo || post.body || post.contenido || ""),
        180
      );

    title = `${rawTitle} | Cecilia Gortari`;
    description = rawDescription || DEFAULT_DESCRIPTION;
    imageUrl = toAbsoluteImageUrl(post.imagen || "");
  }

  // Ensure absolute image URL with encoded spaces
  const encodedImageUrl = encodeURI(imageUrl);

  const safeTitle = esc(title);
  const safeDesc = esc(description);
  const safeImage = esc(encodedImageUrl);
  const safeCanonical = esc(canonicalUrl);

  // 4. Build Minimal HTML
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <!-- OG_FUNCTION hit=true found=${found} id=${esc(id)} -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  <meta property="og:image:alt" content="${safeTitle}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">
</head>
<body>
  <main class="press-detail flex-grow">
    <div class="press-detail__bg"></div>
    <div class="container mx-auto px-4 relative z-10">
      <a href="/prensa/" class="press-detail__back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver a Prensa
      </a>

      <article class="press-article" id="prensa-detail-container">
        <div class="loading-spinner"></div>
      </article>

      <section id="latest-news-container" class="latest-news-section hidden">
        <h3 class="latest-news__title">Ultimas novedades</h3>
        <div class="prensa-grid" id="latest-news-grid"></div>
      </section>
    </div>
  </main>

  <div id="lightbox" class="lightbox">
    <button class="lightbox__close" aria-label="Cerrar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    <img src="" alt="Zoom" class="lightbox__img" id="lightbox-img">
  </div>

  <script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="/assets/js/prensa-feed.js?v=202503061200"></script>
  <script src="/assets/js/prensa-detail.js?v=202503061200"></script>
  <script src="/assets/js/site.js?v=202503061200"></script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Vary": "User-Agent",
      "x-og-function": "hit",
      "x-og-found": found.toString(),
      "x-og-id": id,
      "x-og-image": safeImage,
    },
  });
};
