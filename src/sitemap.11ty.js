const { publicPosts, postUrl, escapeHtml } = require('../lib/news-seo.cjs');

module.exports = class {
  data() {
    return { permalink: '/sitemap.xml', eleventyExcludeFromCollections: true };
  }

  render() {
    const paths = ['/', '/biografia/', '/proyectos/', '/escuela/', '/novedades/', '/prensa/', '/prensa/recursos-graficos/', '/galeria/', '/contacto/'];
    const urls = [...paths.map(path => `https://ceciliagortari.com.ar${path}`), ...publicPosts.map(postUrl)];
    // No lastmod is emitted: publication dates are not verified modification dates.
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  }
};
