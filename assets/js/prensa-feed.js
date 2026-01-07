/**
 * Prensa Feed Script
 * Fetches content/prensa.json and renders items in Home and Prensa pages.
 */

document.addEventListener("DOMContentLoaded", () => {
  const prensaUrl = "/content/prensa.json";
  
  // Containers
  const homeGrid = document.getElementById("prensa-home-grid");
  const mainGrid = document.getElementById("prensa-grid");

  if (!homeGrid && !mainGrid) return; // Exit if no containers found

  fetch(prensaUrl, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Error loading prensa.json");
      return response.json();
    })
    .then((data) => {
      let items = data.items || [];
      
      // Sort by date desc (assuming ISO format or similar sortable string)
      // If date is not ISO, we might need parsing. CMS mostly saves as ISO string.
      items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Render Home (First 3)
      if (homeGrid) {
        renderItems(items.slice(0, 3), homeGrid);
      }

      // Render Page (All)
      if (mainGrid) {
        renderItems(items, mainGrid);
      }
    })
    .catch((error) => console.error("Error fetching prensa:", error));
});

function renderItems(items, container) {
  container.innerHTML = "";
  
  if (items.length === 0) {
    container.innerHTML = "<p class='text-gray-500'>No hay publicaciones recientes.</p>";
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("a");
    card.href = "#"; // Links to nothing for now as per static structure, or maybe a detail page later? 
                     // Request didn't specify detailed view, but we keep structure.
                     // Ideally this would go to a dynamic page, but for static site maybe just simple card for now
                     // or linking to external if provided. For now assume "#" or handle click.
    // However, usually CMS items might have a body. The request only asked to SHOW them.
    // We'll keep href="#" unless we have a 'url' field or similar. 
    
    card.className = "prensa-card";
    
    // Fallback Image
    // Using a reliable placeholder or simple colored block if no image
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
        // Capitalize month
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    card.innerHTML = `
      <div class="prensa-card__image-container">
        ${imageHtml}
      </div>
      <div class="prensa-card__body">
        <span class="prensa-card__badge ${badgeClass}">${item.etiqueta || 'Novedad'}</span>
        <h3 class="prensa-card__title">${item.titulo || 'Sin título'}</h3>
        ${item.subtitulo ? `<p class="prensa-card__excerpt">${item.subtitulo}</p>` : ''}
        <span class="prensa-card__date">${dateStr}</span>
        <span class="prensa-card__cta">Leer más &rarr;</span>
      </div>
    `;

    container.appendChild(card);
  });
}

function getBadgeClass(etiqueta) {
    const map = {
        "Noticia": "badge-blue",
        "Nota": "badge-purple",
        "Comunicado": "badge-magenta",
        "Documento": "badge-gray",
        "Proyecto presentado": "badge-gradient"
    };
    return map[etiqueta] || "badge-blue";
}
