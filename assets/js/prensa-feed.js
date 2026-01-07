/**
 * Prensa Feed Script
 * Fetches content/prensa.json and renders items in Home and Prensa pages.
 * Handles detail view navigation via ?id= query parameter.
 * Adds Search and Filter functionality.
 */

document.addEventListener("DOMContentLoaded", () => {
  const prensaUrl = "/content/prensa.json";

  // Containers
  const homeGrid = document.getElementById("prensa-home-grid");
  const mainGrid = document.getElementById("prensa-section"); // The section wrapping the grid
  const gridContainer = document.getElementById("prensa-grid"); // The grid itself
  const detailContainer = document.getElementById("prensa-detalle");

  // Filter UI
  const searchInput = document.getElementById("prensa-search");
  const categorySelect = document.getElementById("prensa-category-select");
  const resultsCount = document.getElementById("prensa-results-count");
  const countShown = document.getElementById("count-shown");
  const countTotal = document.getElementById("count-total");

  let allItems = []; // Store all fetched items

  // Helper: Normalize Category (Legacy Handling)
  function normalizeCategory(etiqueta) {
    if (!etiqueta) return "Noticia";
    const lower = etiqueta.toLowerCase().trim();
    if (lower === "prensa" || lower === "novedad") return "Noticia";
    return etiqueta; // Return original if it matches new schema or isn't a mapped legacy one
  }

  // Helper: Get Badge Color Class
  function getBadgeClass(etiqueta) {
    const norm = normalizeCategory(etiqueta);
    const map = {
      "Noticia": "badge-blue",
      "Nota": "badge-blue", // Fallback
      "Comunicado": "badge-magenta", // Maybe map to Opinión? User didn't specify "Comunicado" but "Opinión" is magenta.
      "Opinión": "badge-magenta", // New Requirement
      "Documento": "badge-purple", // User req: "violeta (o un tono frío sobrio)" - using purple class if exists, or custom style
      "Proyecto presentado": "badge-orange", // User req: "naranja/amarillo"
      "Actividad": "badge-green", // User req: "verde o turquesa"
      "Escuela de emprendedores": "badge-cyan" // User req: "celeste o degradé especial"
    };

    // Default to blue if not found
    return map[norm] || "badge-blue";
  }

  // Helper: Parse Query Params
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Helper: Generate ID/Slug from Date + Title (Fallback)
  function generateId(item) {
    if (item.id && item.id.trim() !== "") return item.id;

    // Fallback: YYYY-MM-DD-slug-title
    const datePart = item.fecha ? item.fecha.split('T')[0] : '0000-00-00';
    const titleSlug = (item.titulo || 'sin-titulo')
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
      .trim()
      .replace(/\s+/g, "-"); // Replace spaces with dashes

    return `${datePart}-${titleSlug}`;
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
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-blue underline hover:text-brand-magenta" target="_blank" rel="noopener">$1</a>')
      // Lists (* item)
      .replace(/^\s*\*\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // New lines to paragraphs
      .split('\n\n').map(p => `<p class="mb-4 text-lg leading-relaxed text-gray-700">${p.replace(/\n/g, '<br>')}</p>`).join('');

    return html;
  }

  // Helper: Get Instagram ID
  function getInstagramId(url) {
    if (!url) return null;
    // Matches /p/ID or /reel/ID
    const match = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  // Render List Items
  function renderItems(items, container) {
    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <p class="text-gray-500 text-lg mb-4">No encontramos publicaciones con ese criterio.</p>
            <button id="btn-clear-filters" class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                Limpiar filtros
            </button>
        </div>
      `;
      // Attach listener to new button
      const btnClear = document.getElementById("btn-clear-filters");
      if (btnClear) {
        btnClear.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (categorySelect) categorySelect.value = "";
          applyFilters();
        });
      }
      return;
    }

    items.forEach((item) => {
      const itemId = generateId(item); // Ensure we always have an ID
      const detailUrl = `/prensa/?id=${itemId}`;

      const card = document.createElement("a");
      card.href = detailUrl;
      card.className = "prensa-card group";

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

      // Handle Category & Badge
      const normalizedCat = normalizeCategory(item.etiqueta);
      const displayTag = normalizedCat; // Display the normalized name (e.g., Noticia instead of Prensa)
      const badgeClass = getBadgeClass(normalizedCat);

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
        <span class="prensa-card__badge ${badgeClass}">${displayTag}</span>
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

    // Show detail, Hide Grid + Toolbar
    if (mainGrid) mainGrid.classList.add("hidden");

    // Hide Search/Filters if they are outside main-grid (they are inside .prensa-section container in HTML, but check layout)
    // Actually the logic hides the whole section where filters are, so that's fine.

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

    const normalizedCat = normalizeCategory(item.etiqueta);
    const badgeClass = getBadgeClass(normalizedCat);
    const bodyContent = parseMarkdown(item.body || item.cuerpo || item.contenido || "");

    let imageHtml = "";
    if (item.imagen) {
      imageHtml = `
                <div class="mb-8 rounded-2xl overflow-hidden shadow-lg bg-gray-50 flex justify-center items-center">
                    <img src="${item.imagen}" 
                         alt="${item.titulo}" 
                         class="block max-w-full h-auto max-h-[80vh] object-contain mx-auto"
                         loading="eager">
                </div>
            `;
    }

    // Document Download Block
    let documentBtnHtml = "";
    if (item.documento || item.archivo) { // Support both fields
      const docUrl = item.archivo || item.documento;
      documentBtnHtml = `
                <div class="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-3">
                        <svg class="w-8 h-8 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <div>
                            <h4 class="font-bold text-brand-dark">Documento adjunto</h4>
                            <p class="text-sm text-gray-500">Formato PDF/Archivo</p>
                        </div>
                    </div>
                    <a href="${docUrl}" target="_blank" rel="noopener" class="inline-flex items-center px-6 py-3 bg-brand-magenta text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg">
                        Descargar documento
                        <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                </div>
            `;
    }

    // Instagram Embed Block
    let instagramHtml = "";
    if (item.instagram_url) {
      const igId = getInstagramId(item.instagram_url);
      if (igId) {
        instagramHtml = `
                <div class="my-8 flex justify-center">
                    <iframe 
                        src="https://www.instagram.com/p/${igId}/embed" 
                        width="400" 
                        height="480" 
                        frameborder="0" 
                        scrolling="no" 
                        allowtransparency="true"
                        class="rounded-xl shadow-lg border border-gray-100 max-w-full"
                    ></iframe>
                </div>
                <div class="text-center mb-6">
                    <a href="${item.instagram_url}" target="_blank" class="text-brand-blue hover:underline font-medium">Ver publicación en Instagram &rarr;</a>
                </div>
            `;
      } else {
        // Fallback Button
        instagramHtml = `
                <div class="my-8 text-center p-8 bg-gray-50 rounded-xl">
                    <h4 class="text-lg font-bold mb-4">Ver contenido en Instagram</h4>
                    <a href="${item.instagram_url}" target="_blank" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:opacity-90 transition-all shadow-md">
                        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Abrir en Instagram
                    </a>
                </div>
            `;
      }
    }

    detailContainer.innerHTML = `
            <div class="container mx-auto px-4 max-w-4xl">
                <a href="/prensa/" class="inline-flex items-center text-gray-500 hover:text-brand-blue mb-8 transition-colors">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    Volver al listado
                </a>

                <header class="mb-8">
                    <span class="inline-block px-3 py-1 mb-4 rounded-full text-sm font-semibold text-white ${badgeClass}">
                        ${normalizedCat}
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
                
                ${instagramHtml}

                <article class="prose prose-lg prose-indigo mx-auto text-brand-dark">
                    ${bodyContent}
                </article>

                ${documentBtnHtml}

                <div class="mt-12 pt-8 border-t border-gray-100 mobile-only-novedades">
                    <h3 class="text-2xl font-bold mb-6 text-brand-dark">Otras novedades</h3>
                </div>
            </div>
        `;

    // Smooth scroll to top of detail
    detailContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // Render Error
  function renderError(message) {
    if (!detailContainer) return;

    // Hide main grid
    if (mainGrid) mainGrid.classList.add("hidden");

    detailContainer.classList.remove("hidden");
    detailContainer.classList.add("block", "py-12");

    detailContainer.innerHTML = `
        <div class="container mx-auto px-4 max-w-2xl text-center">
            <div class="text-6xl mb-4">😕</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Publicación no encontrada</h2>
            <p class="text-gray-600 mb-8">${message}</p>
            <a href="/prensa/" class="inline-flex items-center px-6 py-3 bg-brand-blue text-white rounded-full font-bold hover:bg-blue-700 transition">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Volver al listado
            </a>
        </div>
    `;
  }

  // Apply Filter Logic
  function applyFilters() {
    if (!gridContainer) return; // Only apply if in list view

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const category = categorySelect ? categorySelect.value : "";

    const filtered = allItems.filter(item => {
      // 1. Check Category (Exact Match - Case Insensitive on inputs but data is usually consistent, we use normalized)
      if (category) {
        const itemCat = normalizeCategory(item.etiqueta);
        if (itemCat !== category) return false;
      }

      // 2. Check Search Text
      if (query) {
        const title = (item.titulo || "").toLowerCase();
        const sub = (item.subtitulo || "").toLowerCase();
        const body = (item.body || item.cuerpo || item.contenido || "").toLowerCase();

        if (!title.includes(query) && !sub.includes(query) && !body.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Update Counts (Optional)
    if (resultsCount && countShown && countTotal) {
      countShown.textContent = filtered.length;
      countTotal.textContent = allItems.length;
      if (allItems.length > 0) resultsCount.classList.remove("hidden");
    }

    renderItems(filtered, gridContainer);
  }

  // SETUP EVENTS
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", applyFilters);
  }

  // MAIN EXECUTION
  fetch(prensaUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Error loading prensa.json");
      return response.json();
    })
    .then((data) => {
      allItems = data.items || [];

      // Sort by date desc
      allItems.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      const currentId = getQueryParam('id');

      // Render Home (First 3)
      if (homeGrid) {
        renderItems(allItems.slice(0, 3), homeGrid);
      }

      // Render Page Logic
      if (gridContainer) {
        // Init Filters
        applyFilters();

        // Logic: specific item ID requested?
        if (currentId) {
          // Find item by ID or fallback generated ID
          const selectedItem = allItems.find(i => generateId(i) === currentId);

          if (selectedItem) {
            renderDetail(selectedItem);
          } else {
            renderError("La nota que buscás no existe o fue eliminada.");
          }
        }
      }
    })
    .catch((error) => console.error("Error fetching prensa:", error));
});
