/**
 * Prensa Detail Script (Enhanced for 2026 Redesign)
 * Renders the full article with editorial layout, interactive features, and related news.
 */

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");
    const container = document.getElementById("prensa-detail-container");

    if (!container) return;

    if (!slug) {
        renderError(container, "Publicación no especificada.");
        return;
    }

    fetch("/content/prensa.json", { cache: "no-store" })
        .then((response) => {
            if (!response.ok) throw new Error("Error loading prensa.json");
            return response.json();
        })
        .then((data) => {
            const items = data.items || [];

            // Find item by slug (either explicit or generated)
            const item = items.find(i => {
                const itemSlug = i.slug || generateSlug(i);
                return itemSlug === slug;
            });

            if (item) {
                renderDetail(item, container);
                renderLatestNews(items, item); // Pass all items and current one
                setupLightbox();
            } else {
                renderError(container, "Publicación no encontrada.");
            }
        })
        .catch((error) => {
            console.error(error);
            renderError(container, "Error al cargar la publicación.");
        });
});

/**
 * Renders the main detail card
 */
function renderDetail(item, container) {
    // 1. Prepare Data
    const badgeClass = getBadgeClass(item.etiqueta);
    const dateStr = formatDate(item.fecha);
    const readingTime = calculateReadingTime(item.cuerpo || item.subtitulo || "");
    const currentUrl = window.location.href;
    const shareText = encodeURIComponent(`Leé "${item.titulo}" de Cecilia Gortari`);

    // 2. SEO Update
    document.title = `${item.titulo} | Prensa | Cecilia Gortari`;
    // Update OpenGraph if possible (basic tags often static, but we can try)
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", item.subtitulo || item.titulo);

    // 3. Document Block Logic
    let documentBlock = "";
    if (item.documento) {
        const docName = item.documento.split('/').pop();
        documentBlock = `
            <div class="download-block">
                <div class="download-block__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <div class="download-block__info">
                    <span class="download-block__title">Documento adjunto</span>
                    <span class="download-block__meta">${docName}</span>
                </div>
                <a href="${item.documento}" class="download-btn" download target="_blank">
                    Descargar PDF
                </a>
            </div>
        `;
    }

    // 4. Render HTML
    container.innerHTML = `
        <header class="prensa-detail__header">
            <span class="prensa-detail__brand-chip chip--${(item.etiqueta || '').toLowerCase()} ${badgeClass}">
                ${getIconForTag(item.etiqueta)}
                ${item.etiqueta || 'Novedad'}
            </span>
            
            <h1 class="prensa-detail__title">${item.titulo}</h1>
            
            ${item.subtitulo ? `<p class="prensa-detail__subtitle">${item.subtitulo}</p>` : ''}
            
            <div class="prensa-detail__meta">
                <span class="prensa-detail__meta-item">
                    <svg class="prensa-detail__meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${dateStr}
                </span>
                <span class="prensa-detail__meta-item">
                    <svg class="prensa-detail__meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${readingTime}
                </span>
            </div>
        </header>

        ${item.imagen ? `
            <div class="prensa-detail__image-container" id="zoom-trigger">
                <img src="${item.imagen}" alt="${item.titulo}" class="prensa-detail__image">
                <div class="prensa-detail__image-overlay">Click para ampliar</div>
            </div>
        ` : ''}

        ${documentBlock}

        <div class="prensa-detail__content">
            ${parseContent(item.cuerpo || item.contenido)}
        </div>

        <div class="prensa-footer-actions">
            <div class="prensa-share">
                <span class="prensa-share__label">Compartir:</span>
                <a href="https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}" target="_blank" class="share-btn share-btn--wa" aria-label="WhatsApp">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118 1.571-.037 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </a>
                <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(currentUrl)}" target="_blank" class="share-btn share-btn--x" aria-label="X (Twitter)">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}" target="_blank" class="share-btn share-btn--fb" aria-label="Facebook">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <button onclick="copyToClipboard()" class="share-btn share-btn--link" aria-label="Copiar Link" title="Copiar Link">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </button>
            </div>
            
        </div>
    `;
}

/**
 * Renders the "Latest News" grid (3 items, excluding current)
 */
function renderLatestNews(items, currentItem) {
    const listContainer = document.getElementById("latest-news-grid");
    const sectionContainer = document.getElementById("latest-news-container");

    if (!listContainer || !sectionContainer) return;

    // Filter out current item and ensure sorted by date desc
    const others = items
        .filter(i => (i.slug || generateSlug(i)) !== (currentItem.slug || generateSlug(currentItem)))
        // Sort by date desc (if not already)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 3);

    if (others.length === 0) return;

    // Show section
    sectionContainer.classList.remove("hidden");

    listContainer.innerHTML = others.map(item => {
        const itemSlug = item.slug || generateSlug(item);
        const permalink = `/prensa/detalle/?slug=${itemSlug}`;
        const dateStr = formatDate(item.fecha);
        const badgeClass = getBadgeClass(item.etiqueta);

        return `
            <article class="prensa-card group h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                <a href="${permalink}" class="block relative aspect-video overflow-hidden">
                    ${item.imagen
                ? `<img src="${item.imagen}" alt="${item.titulo}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">`
                : `<div class="w-full h-full bg-brand-light flex items-center justify-center text-gray-300"><span class="text-4xl">📄</span></div>`
            }
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${badgeClass}">
                            ${item.etiqueta || 'Novedad'}
                        </span>
                        <span class="text-xs text-gray-400 font-medium">${dateStr}</span>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-brand-magenta transition-colors">
                        <a href="${permalink}">${item.titulo}</a>
                    </h3>
                    <p class="text-gray-600 text-sm line-clamp-3 mb-4">${item.subtitulo || ''}</p>
                    <div class="mt-auto pt-4 border-t border-gray-50 flex items-center text-brand-blue font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        Leer más 
                        <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

/**
 * Setup Lightbox functionality
 */
function setupLightbox() {
    const trigger = document.getElementById("zoom-trigger");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".lightbox__close");

    if (!trigger || !lightbox) return;

    trigger.addEventListener("click", () => {
        const src = trigger.querySelector("img").src;
        lightboxImg.src = src;
        lightbox.classList.add("is-open");
    });

    const closeLightbox = () => {
        lightbox.classList.remove("is-open");
    };

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
    });
}

/**
 * Helpers
 */

function generateSlug(item) {
    if (item.slug) return item.slug;
    const datePart = item.fecha ? item.fecha.split('T')[0] : 'sin-fecha';
    let titlePart = (item.titulo || 'sin-titulo')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
    return `${datePart}-${titlePart}`;
}

function formatDate(dateString) {
    if (!dateString) return "";
    // Handle "YYYY-MM-DD" or ISO string
    const date = new Date(dateString);
    // Adjust for timezone offset if it's just a date string dateString.includes('T') ? ...
    // Fallback: Split manual
    if (dateString.length === 10) {
        const parts = dateString.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return date.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
}

function calculateReadingTime(text) {
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min lectura`;
}

function getBadgeClass(tag) {
    const map = {
        "Noticia": "badge-blue",
        "Nota": "badge-purple",
        "Comunicado": "badge-magenta",
        "Documento": "badge-gray",
        "Proyecto presentado": "badge-gradient"
    };
    return map[tag] || "badge-blue";
}

function getIconForTag(tag) {
    // Return simple SVG string based on tag
    if (tag === 'Documento') return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    if (tag === 'Comunicado') return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
}

function parseContent(content) {
    if (!content) return "";
    // Basic Markdown parser or pass-through if HTML
    // Handling simple markdown bold/italic/links if needed, but assuming HTML or simple MD
    // Converting newlines to paragraphs if plaintext

    // Check if it looks like HTML
    if (content.trim().startsWith("<")) return content;

    // Convert Markdown-like **bold** to <strong>
    let html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(?:\r\n|\r|\n){2,}/g, '</p><p>')
        .replace(/(?:\r\n|\r|\n)/g, '<br>');

    return `<p>${html}</p>`;
}

function renderError(container, message) {
    container.innerHTML = `
        <div class="text-center py-12">
            <h2 class="text-2xl font-bold text-gray-400 mb-4">😕</h2>
            <p class="text-xl text-gray-600">${message}</p>
            <a href="/prensa/" class="mt-6 inline-block px-6 py-2 bg-brand-blue text-white rounded-full font-medium hover:bg-blue-700 transition">Volver a Prensa</a>
        </div>
    `;
}

// Global scope for onclick
window.copyToClipboard = function () {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.querySelector('.share-btn--link');
        const originalBg = btn.style.background;
        btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>`;
        btn.style.background = '#10b981'; // Green
        setTimeout(() => {
            btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
            btn.style.background = originalBg;
        }, 2000);
    });
};
