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
    // Generate Slug
    const slug = generateSlug(item);
    const detailUrl = `/prensa/detalle/?slug=${slug}`;

    const card = document.createElement("a");
    card.href = detailUrl; // Makes the whole card clickable if CSS allows, or at least semantically linked
    card.className = "prensa-card";

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
      // Date formatting fix for timezones if string is YYYY-MM-DD
      const parts = item.fecha.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        dateStr = d.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        dateStr = dateObj.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
      }
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

/**
 * Generates a slug from date and title.
 * Must match the logic in prensa-detail.js
 */
function generateSlug(item) {
  if (item.slug) return item.slug;

  const datePart = item.fecha || 'sin-fecha';

  let titlePart = (item.titulo || 'sin-titulo')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric chars
    .trim()
    .replace(/\s+/g, "-"); // replace spaces with hyphens

  return `${datePart}-${titlePart}`;
}
