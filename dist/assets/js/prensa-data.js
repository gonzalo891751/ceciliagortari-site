/* ==========================================================================
   PRENSA/COMUNICADOS - DATOS EDITABLES
   ========================================================================== 
   
   INSTRUCCIONES PARA EDITAR:
   - Agregar nuevos items al principio del array (el más reciente primero)
   - El array se ordena automáticamente por fecha DESC
   - Types válidos: COMUNICADO, NOTA, EVENTO, ENTREVISTA, INSTAGRAM, EXTERNO, DESCARGA
   - Si no hay imagen: dejar image: null (se muestra placeholder)
   - Si external: true → abre en nueva pestaña
   - ctaLabel es opcional, si es null se calcula automáticamente según type
   
   ========================================================================== */

const PRENSA_ITEMS = [
    {
        id: "impulso-tabacalero",
        type: "COMUNICADO",
        title: "Aprobación del Impulso Tabacalero",
        excerpt: "La Cámara de Diputados aprobó el proyecto que beneficia a más de 2000 productores tabacaleros de la provincia.",
        date: "2025-12-20",
        image: null,
        url: "#",
        external: false,
        ctaLabel: null
    },
    {
        id: "recorrida-escuelas-rurales",
        type: "NOTA",
        title: "Recorrida por escuelas rurales",
        excerpt: "Visita a 12 establecimientos educativos en la zona de Mercedes para evaluar necesidades de conectividad.",
        date: "2025-12-15",
        image: null,
        url: "#",
        external: false,
        ctaLabel: null
    },
    {
        id: "taller-marketing-digital",
        type: "EVENTO",
        title: "Taller de Marketing Digital",
        excerpt: "Más de 80 emprendedores participaron del taller gratuito organizado por la Escuela de Emprendedores.",
        date: "2025-12-05",
        image: null,
        url: "#",
        external: false,
        ctaLabel: null
    },
    {
        id: "presupuesto-2026",
        type: "COMUNICADO",
        title: "Presupuesto 2026 con foco social",
        excerpt: "Posición sobre el proyecto de presupuesto provincial y nuestras propuestas para mayor inversión social.",
        date: "2025-11-28",
        image: null,
        url: "#",
        external: false,
        ctaLabel: null
    },
    {
        id: "entrevista-radio-goya",
        type: "ENTREVISTA",
        title: "Entrevista en Radio Goya",
        excerpt: "Hablamos sobre los proyectos en agenda y el balance del primer año de la Escuela de Emprendedores.",
        date: "2025-11-20",
        image: null,
        url: "#",
        external: false,
        ctaLabel: null
    },
    {
        id: "egresados-escuela-nov",
        type: "INSTAGRAM",
        title: "Nueva camada de egresados",
        excerpt: "Felicitaciones a los nuevos egresados del curso de Pastelería Artesanal en Goya.",
        date: "2025-11-15",
        image: null,
        url: "https://www.instagram.com/cecilia.diputada/",
        external: true,
        ctaLabel: null
    }
];

/* ==========================================================================
   UTILIDADES - NO MODIFICAR
   ========================================================================== */

// Ordenar por fecha descendente
function getSortedPrensaItems() {
    return [...PRENSA_ITEMS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Obtener los N items más recientes
function getRecentPrensaItems(count = 6) {
    return getSortedPrensaItems().slice(0, count);
}

// Formatear fecha a español
function formatPrensaDate(isoDate) {
    const date = new Date(isoDate + 'T00:00:00');
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-AR', options);
}

// Obtener CTA label según tipo
function getCtaLabel(item) {
    if (item.ctaLabel) return item.ctaLabel;

    const labels = {
        'COMUNICADO': 'Leer más →',
        'NOTA': 'Leer más →',
        'EVENTO': 'Leer más →',
        'ENTREVISTA': 'Escuchar →',
        'INSTAGRAM': 'Ver en Instagram →',
        'EXTERNO': 'Abrir nota →',
        'DESCARGA': 'Descargar →'
    };
    return labels[item.type] || 'Ver más →';
}

// Obtener colores del badge según tipo
function getBadgeClasses(type) {
    // Todos usan acento magenta→azul suave como indicó el usuario
    return 'prensa-card__badge';
}
