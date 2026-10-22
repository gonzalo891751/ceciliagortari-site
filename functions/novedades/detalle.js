import news from '../../lib/news-seo.cjs';

export const onRequest = async (context) => {
  if (!['GET', 'HEAD'].includes(context.request.method)) return context.next();
  const url = new URL(context.request.url);
  const id = url.searchParams.get('id') || url.searchParams.get('slug');
  if (!id) return Response.redirect(`${news.ORIGIN}/novedades/`, 301);
  const post = news.publicPosts.find(post => post.id === id || post.slug === id);
  const response = await context.next();
  if (!response.headers.get('Content-Type')?.includes('text/html')) return response;

  if (!post) {
    const missing = new Response(response.body, response);
    missing.headers.set('X-Robots-Tag', 'noindex');
    missing.headers.set('Cache-Control', 'no-store');
    const rewritten = new HTMLRewriter()
      .on('title', { element: element => element.setInnerContent('Publicación no encontrada | Cecilia Gortari') })
      .on('link[rel="canonical"]', { element: element => element.remove() })
      .on('#prensa-detail-container', { element: element => element.setInnerContent('<h1>Publicación no encontrada</h1><p>Podés consultar las publicaciones disponibles en <a href="/novedades/">Novedades</a>.</p>', { html: true }) })
      .transform(missing);
    return new Response(rewritten.body, { status: 404, headers: rewritten.headers });
  }

  const meta = news.postMetadata(post);
  if (url.hostname === 'www.ceciliagortari.com.ar' || !url.searchParams.get('id') || id !== post.id) {
    return Response.redirect(meta.url, 301);
  }
  const result = new Response(response.body, response);
  result.headers.set('Cache-Control', 'no-store');
  result.headers.delete('ETag');
  const setContent = value => ({ element: element => element.setAttribute('content', value) });
  const schema = JSON.stringify(meta.schema).replace(/</g, '\\u003c');
  return new HTMLRewriter()
    .on('title', { element: element => element.setInnerContent(meta.title) })
    .on('link[rel="canonical"]', { element: element => element.setAttribute('href', meta.url) })
    .on('meta[name="description"]', setContent(meta.description))
    .on('meta[property="og:title"], meta[name="twitter:title"]', setContent(meta.title))
    .on('meta[property="og:description"], meta[name="twitter:description"]', setContent(meta.description))
    .on('meta[property="og:image"], meta[name="twitter:image"]', setContent(meta.image))
    .on('meta[property="og:url"]', setContent(meta.url))
    .on('meta[property="og:type"]', setContent('article'))
    .on('head', { element: element => element.append(`<script type="application/ld+json">${schema}</script>`, { html: true }) })
    .on('#prensa-detail-container', { element: element => element.setInnerContent(news.renderArticle(post), { html: true }) })
    .transform(result);
};
