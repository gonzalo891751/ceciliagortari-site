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
    // Note: /content/prensa.json must exist in the dist folder.
    const dataPath = "/content/prensa.json";
    try {
        const dataUrl = new URL(dataPath, url.origin);
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

    // Fallback: fetch from origin if ASSETS fails (shouldn't happen in Prod but good safety)
    try {
        const fallbackUrl = new URL(dataPath, url.origin);
        const res = await fetch(fallbackUrl.toString(), { cf: { cacheTtl: 300 } });
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

    // If not found, let the SPA handle it (or serve default OG)
    // But if we want to ensure OG tags even on failure, we can proceed with defaults.
    // The user requested: "Si no existe, devolver ctx.next()".
    if (!found || !post) {
        return ctx.next();
    }

    // 3. Construct Data
    const canonicalUrl = `${CANONICAL_DOMAIN}/prensa/detalle/?id=${encodeURIComponent(id)}`;

    const rawTitle = post.titulo || DEFAULT_TITLE;
    const rawDescription =
        post.subtitulo ||
        truncate(
            stripMarkdown(post.cuerpo || post.body || post.contenido || ""),
            180
        );

    const title = `${rawTitle} | Cecilia Gortari`;
    const description = rawDescription || DEFAULT_DESCRIPTION;
    const imageUrl = toAbsoluteImageUrl(post.imagen || "");

    // Ensure absolute image URL with encoded spaces
    // encodeURI encodes spaces as %20 but leaves / : etc.
    const safeImage = encodeURI(imageUrl);

    const safeTitle = esc(title);
    const safeDesc = esc(description);
    const safeCanonical = esc(canonicalUrl);

    // 4. Build Minimal HTML
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
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
  <h1>${safeTitle}</h1>
  <p>${safeDesc}</p>
  <img src="${safeImage}" alt="${safeTitle}" style="max-width:100%;height:auto;">
  <br>
  <a href="${safeCanonical}">Abrir publicación original</a>
</body>
</html>`;

    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=600", // Cache for bots
            "Vary": "User-Agent",
        },
    });
};
