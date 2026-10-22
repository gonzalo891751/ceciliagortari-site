const MarkdownIt = require('markdown-it');
const { items } = require('../src/content/prensa.json');

const ORIGIN = 'https://ceciliagortari.com.ar';
const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false });
const publicPosts = items.filter(post => post.id && post.titulo && post.publicado !== false && post.borrador !== true);

function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function postUrl(post) {
  return `${ORIGIN}/novedades/detalle/?id=${encodeURIComponent(post.id)}`;
}

function safeUrl(value, fallback = '') {
  try {
    const url = new URL(value, ORIGIN);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : fallback;
  } catch { return fallback; }
}

function postMetadata(post) {
  const title = `${post.titulo} | Prensa | Cecilia Gortari`;
  const description = post.subtitulo || post.titulo;
  const url = postUrl(post);
  const image = safeUrl(post.imagen || '/assets/img/hero-diputados.jpg');
  const schema = { '@context': 'https://schema.org', '@type': 'Article', headline: post.titulo, description, url, mainEntityOfPage: url, image };
  if (post.fecha && !Number.isNaN(Date.parse(post.fecha))) schema.datePublished = post.fecha;
  return { title, description, url, image, schema };
}

function renderArticle(post) {
  const date = post.fecha && !Number.isNaN(Date.parse(post.fecha))
    ? new Date(post.fecha).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const image = post.imagen ? safeUrl(post.imagen) : '';
  const attachment = post.archivo || post.documento;
  const documentUrl = attachment ? safeUrl(attachment) : '';
  const instagram = post.instagram_url ? safeUrl(post.instagram_url) : '';
  const body = post.cuerpo || post.cuerpo_legacy || post.contenido || post.body || '';
  return `<header class="prensa-detail__header">
    <span class="prensa-detail__brand-chip badge-blue">${escapeHtml(post.etiqueta || 'Novedad')}</span>
    <h1 class="prensa-detail__title">${escapeHtml(post.titulo)}</h1>
    ${post.subtitulo ? `<p class="prensa-detail__subtitle">${escapeHtml(post.subtitulo)}</p>` : ''}
    ${date ? `<div class="prensa-detail__meta"><time datetime="${escapeHtml(post.fecha)}">${escapeHtml(date)}</time></div>` : ''}
  </header>
  ${image ? `<div class="prensa-detail__image-container"><img src="${escapeHtml(image)}" alt="${escapeHtml(post.titulo)}" class="prensa-detail__image"></div>` : ''}
  ${documentUrl ? `<div class="download-block"><a href="${escapeHtml(documentUrl)}" class="download-btn">Descargar documento adjunto</a></div>` : ''}
  <div class="prensa-detail__content">${markdown.render(body)}</div>
  ${instagram ? `<p><a href="${escapeHtml(instagram)}" rel="noopener">Ver en Instagram</a></p>` : ''}`;
}

module.exports = { ORIGIN, publicPosts, postUrl, postMetadata, renderArticle, escapeHtml };
