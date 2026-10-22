export const onRequest = (context) => {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.ceciliagortari.com.ar') {
    url.hostname = 'ceciliagortari.com.ar';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
};
