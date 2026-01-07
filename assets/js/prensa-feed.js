/**
 * Prensa Feed Script
 * Fetches content/prensa.json and renders items in Home and Prensa pages.
 * Handles detail view navigation via ?id= query parameter.
 */

document.addEventListener("DOMContentLoaded", () => {
  const prensaUrl = "/content/prensa.json";

  // Containers
  const homeGrid = document.getElementById("prensa-home-grid");
  const mainGrid = document.getElementById("prensa-grid");
  const detailContainer = document.getElementById("prensa-detalle");

  // Helper: Get Badge Color Class
  function getBadgeClass(etiqueta) {
    const map = {
      "Noticia": "badge-blue",
      "Nota": "badge-purple",
      "Comunicado": "badge-magenta",
      "Documento": "badge-gray",
      "Proyecto presentado": "badge-gradient",
      "Actividad": "badge-blue", // Added new mapped tag
      "Entrevista": "badge-purple" // Added new mapped tag
    };
    return map[etiqueta] || "badge-blue";
  }

  // Helper: Parse Query Params
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Helper: Simple Markdown Parser (Basic)
  function parseMarkdown(text) {
    if (!text) return "";
    let html = text
      // Bold (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic (*text*)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Links [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-blue underline hover:text-brand-magenta">$1</a>')
      // Lists (* item)
      .replace(/^\s*\*\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // New lines to paragraphs
      .split('\n\n').map(p => `<p class="mb-4 text-lg leading-relaxed text-gray-700">${p.replace(/\n/g, '<br>')}</p>`).join('');

    return html;
  }

  // Render List Items
  function renderItems(items, container) {
    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = "<p class='text-gray-500'>No hay publicaciones recientes.</p>";
      return;
    }

    items.forEach((item) => {
      const detailUrl = `/prensa/?id=${item.id}`;

      const card = document.createElement("a");
      card.href = detailUrl;
      card.className = "prensa-card group"; // Added group for hover effects if needed

      // Fallback Image
      let imageHtml = "";
      if (item.imagen) {
        imageHtml = `<img src="${item.imagen}" alt="${item.titulo}" class="prensa-card__img" loading="lazy">`;
      } else {
        imageHtml = `
            <div class="prensa-card__placeholder">
                <span class="prensa-card__placeholder-icon">📰</span>
            </div>
        `;
      }

      // Badge Class
      const badgeClass = getBadgeClass(item.etiqueta);

      // Format Date
      let dateStr = "";
      if (item.fecha) {
        const dateObj = new Date(item.fecha);
        dateStr = dateObj.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }

      card.innerHTML = `
      <div class="prensa-card__image-container transform transition-transform duration-300 group-hover:scale-105">
        ${imageHtml}
      </div>
      <div class="prensa-card__body">
        <span class="prensa-card__badge ${badgeClass}">${item.etiqueta || 'Novedad'}</span>
        <h3 class="prensa-card__title group-hover:text-brand-blue transition-colors">${item.titulo || 'Sin título'}</h3>
        ${item.subtitulo ? `<p class="prensa-card__excerpt">${item.subtitulo}</p>` : ''}
        <span class="prensa-card__date">${dateStr}</span>
        <span class="prensa-card__cta mt-auto inline-flex items-center text-brand-blue font-bold">
            Leer más 
            <svg class="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </span>
      </div>
    `;

      container.appendChild(card);
    });
  }

  // Render Single Detail View
  function renderDetail(item) {
    if (!detailContainer) return;

    // Show container
    detailContainer.classList.remove("hidden");
    detailContainer.classList.add("block", "py-12", "bg-white");

    // Format Date
    let dateStr = "";
    if (item.fecha) {
      const dateObj = new Date(item.fecha);
      dateStr = dateObj.toLocaleDateString("es-AR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    const badgeClass = getBadgeClass(item.etiqueta);
    const bodyContent = parseMarkdown(item.body || item.cuerpo || item.contenido || ""); // Support all fields

    let imageHtml = "";
    if (item.imagen) {
      imageHtml = `
                <div class="mb-8 rounded-2xl overflow-hidden shadow-lg">
                    <img src="${item.imagen}" alt="${item.titulo}" class="w-full h-auto object-cover max-h-[600px]">
                </div>
            `;
    }

    let documentBtnHtml = "";
    if (item.documento) {
      documentBtnHtml = `
                <div class="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-3">
                        <svg class="w-8 h-8 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <div>
                            <h4 class="font-bold text-brand-dark">Documento adjunto</h4>
                            <p class="text-sm text-gray-500">Formato PDF/Archivo</p>
                        </div>
                    </div>
                    <a href="${item.documento}" target="_blank" rel="noopener" class="inline-flex items-center px-6 py-3 bg-brand-magenta text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg">
                        Descargar documento
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                </div>
            `;
    }

    detailContainer.innerHTML = `
            <div class="container mx-auto px-4 max-w-4xl">
                <a href="/prensa/" class="inline-flex items-center text-gray-500 hover:text-brand-blue mb-8 transition-colors">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    Volver al listado
                </a>

                <header class="mb-8">
                    <span class="inline-block px-3 py-1 mb-4 rounded-full text-sm font-semibold text-white ${badgeClass}">
                        ${item.etiqueta || 'Novedad'}
                    </span>
                    <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-brand-dark leading-tight mb-4">
                        ${item.titulo}
                    </h1>
                    <p class="text-xl text-gray-600 font-medium mb-4 leading-normal">
                        ${item.subtitulo || ''}
                    </p>
                    <div class="flex items-center text-gray-400 text-sm font-medium">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        ${dateStr}
                    </div>
                </header>

                ${imageHtml}
                
                <article class="prose prose-lg prose-indigo mx-auto text-brand-dark">
                    ${bodyContent}
                </article>

                ${documentBtnHtml}

                <div class="mt-12 pt-8 border-t border-gray-100">
                    <h3 class="text-2xl font-bold mb-6 text-brand-dark">Últimas novedades</h3>
                </div>
            </div>
        `;

    // Smooth scroll to top of detail
    detailContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // MAIN EXECUTION
  fetch(prensaUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Error loading prensa.json");
      return response.json();
    })
    .then((data) => {
      let items = data.items || [];

      // Sort by date desc
      items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      const currentId = getQueryParam('id');

      // Render Home (First 3)
      if (homeGrid) {
        renderItems(items.slice(0, 3), homeGrid);
      }

      // Render Page Logic
      if (mainGrid) {
        // Always render list at bottom/below
        renderItems(items, mainGrid);

        if (currentId && detailContainer) {
          const selectedItem = items.find(i => i.id === currentId);
          if (selectedItem) {
            renderDetail(selectedItem);
          }
        }
      }
    })
    .catch((error) => console.error("Error fetching prensa:", error));
});
