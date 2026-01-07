/**
 * Prensa Detail Script
 * Fetches content/prensa.json and renders a specific item based on ?slug=.
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
 * Generates a slug from date and title.
 * Must match the logic in prensa-feed.js
 */
function generateSlug(item) {
    if (item.slug) return item.slug;

    // Format: YYYY-MM-DD-titulo-sanitizado
    // If no date, use 'sin-fecha'
    // Title to lowercase, replace special chars with -, trim

    const datePart = item.fecha || 'sin-fecha';

    let titlePart = (item.titulo || 'sin-titulo')
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric chars
        .trim()
        .replace(/\s+/g, "-"); // replace spaces with hyphens

    return `${datePart}-${titlePart}`;
}

function renderDetail(item, container) {
    // Determine badge class (reusing logic from feed or simplified map)
    const badgeMap = {
        "Noticia": "badge-blue",
        "Nota": "badge-purple",
        "Comunicado": "badge-magenta",
        "Documento": "badge-gray",
        "Proyecto presentado": "badge-gradient"
    };
    const badgeClass = badgeMap[item.etiqueta] || "badge-blue";

    // Format Date
    let dateStr = "";
    if (item.fecha) {
        const dateObj = new Date(item.fecha);
        // Correct timezone issue by reading strict YYYY-MM-DD
        // Simple hack: split by '-'
        const parts = item.fecha.split('-');
        if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            dateStr = d.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            dateStr = dateObj.toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric' });
        }
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    const contentHtml = item.contenido || `<p>${item.subtitulo}</p>`;

    container.innerHTML = `
        <header class="prensa-detail__header">
            <span class="prensa-detail__badge ${badgeClass}">${item.etiqueta || 'Novedad'}</span>
            <h1 class="prensa-detail__title">${item.titulo}</h1>
            ${item.subtitulo ? `<p class="prensa-detail__subtitle">${item.subtitulo}</p>` : ''}
            <span class="prensa-detail__date">${dateStr}</span>
        </header>

        ${item.imagen ? `<img src="${item.imagen}" alt="${item.titulo}" class="prensa-detail__image">` : ''}

        <div class="prensa-detail__content">
            ${contentHtml}
        </div>
    `;

    // Update Page Title
    document.title = `${item.titulo} | Cecilia Gortari`;
}

function renderError(container, message) {
    container.innerHTML = `
        <div class="text-center py-12">
            <h2 class="text-2xl font-bold text-gray-400 mb-4">😕</h2>
            <p class="text-xl text-gray-600">${message}</p>
            <a href="/prensa/" class="mt-6 inline-block text-brand-blue hover:text-brand-magenta font-medium">Volver a Prensa</a>
        </div>
    `;
}
