// Consolidate legacy links and social previews on the canonical news URL.
export const onRequest = ({ request }) => {
  const url = new URL(request.url);
  url.protocol = 'https:';
  url.hostname = 'ceciliagortari.com.ar';
  url.pathname = '/novedades/detalle/';
  return Response.redirect(url.toString(), 301);
};
