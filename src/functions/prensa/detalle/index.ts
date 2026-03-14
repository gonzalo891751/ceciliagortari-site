/**
 * Redirect old /prensa/detalle/ URLs to /novedades/detalle/
 * Preserves query parameters (like ?id=...)
 */
export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const newUrl = new URL("/novedades/detalle/", url.origin);
  newUrl.search = url.search;

  return new Response(null, {
    status: 301,
    headers: {
      Location: newUrl.toString(),
      "Cache-Control": "public, max-age=31536000",
    },
  });
};
