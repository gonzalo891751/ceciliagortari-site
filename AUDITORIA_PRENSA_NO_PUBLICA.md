# AuditorÌa de Prensa no publicada

Fecha de auditorÌa: 2026-01-26
Proyecto: ceciliagortari-site (ceciliagortari.com.ar)

## PASO 1 ó IDENTIFICAR STACK

- Generador del sitio: **Eleventy (11ty)**
  - Evidencia: `package.json` (devDependencies: `@11ty/eleventy`, scripts `dev`/`build` con `eleventy`).
  - Evidencia: `.eleventy.js` (configuraciÛn de input/output y passthrough).
- CMS utilizado: **Sveltia CMS (Decap-compatible)**
  - Evidencia: `src/admin/index.html` carga `https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js`.
  - Evidencia: `src/admin/config.yml` con `backend: github`.
- Hosting/Deploy: **Cloudflare Pages**
  - Evidencia: `ADMIN_SETUP.md` menciona ìCloudflare Pages Functionsî y configuraciÛn en dashboard.
  - Evidencia: existencia de `src/functions/` (estructura tÌpica de Pages Functions).
  - Evidencia: `src/_headers` con polÌticas de cache para Pages.
- Branch de deploy: **main**
  - Evidencia: `src/admin/config.yml` ? `backend.branch: main`.
  - Evidencia: `ADMIN_SETUP.md` indica ìpush a mainî.

## PASO 2 ó AUDITORÕA DEL CMS

### Contenido completo de `src/admin/config.yml`

```
backend:
  name: github
  repo: gonzalo891751/ceciliagortari-site
  branch: main
  base_url: https://sveltia-cms-auth.gonzalo891751.workers.dev
  auth_endpoint: /auth

media_folder: "assets/uploads"
public_folder: "/assets/uploads"

publish_mode: simple

collections:
  - name: "prensa"
    label: "Prensa/Comunicados"
    editor:
      preview: true
    files:
      - name: "items"
        label: "Publicaciones"
        file: "content/prensa.json"
        
        # Structure: { "items": [ ... ] }
        fields:
          - name: "items"
            label: "Art√≠culos"
            label_singular: "Art√≠culo"
            widget: "list"
            collapsed: true
            summary: "{{fecha}} ‚Äî {{titulo}}"
            fields:
              - { label: "Fecha", name: "fecha", widget: "datetime", format: "YYYY-MM-DDTHH:mm:ss.000Z", date_format: "DD/MM/YYYY", time_format: "HH:mm" }
              - { label: "ID (Manual)", name: "id", widget: "string", required: true, hint: "Escribir ID √∫nico (ej: 2024-01-01-titulo-nota)" }
              - { label: "T√≠tulo", name: "titulo", widget: "string" }
              - { label: "Subt√≠tulo / Bajada", name: "subtitulo", widget: "text", required: false }
              - { label: "Etiqueta", name: "etiqueta", widget: "select", options: ["Noticia", "Documento", "Opini√≥n", "Actividad", "Proyecto presentado", "Escuela de emprendedores"], default: "Noticia" }
              - { label: "Imagen destacada", name: "imagen", widget: "image", required: false }
              - { label: "Contenido / Cuerpo", name: "cuerpo", widget: "markdown", required: false }
              - { label: "Documento adjunto (Legacy)", name: "documento", widget: "file", required: false }
```

### IdentificaciÛn solicitada (CMS)

- Collections relacionadas a prensa/comunicados:
  - `collections[0].name: "prensa"`, label: ìPrensa/Comunicadosî.
- Folder/archivo real donde se guardan los artÌculos:
  - `file: "content/prensa.json"` (estructura: `{ "items": [...] }`).
- publish_mode:
  - `publish_mode: simple`.
- backend (git, branch, repo):
  - `backend.name: github`
  - `backend.repo: gonzalo891751/ceciliagortari-site`
  - `backend.branch: main`
- media_folder / public_folder:
  - `media_folder: "assets/uploads"`
  - `public_folder: "/assets/uploads"`

### Comentarios solicitados

- DÛnde deberÌa generarse el archivo del artÌculo:
  - En `src/content/prensa.json` (archivo ˙nico con lista `items`).
- NociÛn de borrador vs publicado:
  - **No hay editorial workflow**. `publish_mode: simple` implica que el CMS publica directo en el repo/branch configurado.

## PASO 3 ó UBICAR EL ARTÕCULO NUEVO

### B˙squeda en repo (fecha/slug/id)

Criterios buscados:
- `2026-01-26`
- `solidaridad`
- `alal`
- `goya`
- `despidos`

Resultado:
- **No se encontrÛ ning˙n archivo nuevo** que coincida con `2026-01-26`, `solidaridad`, `alal`, o `despidos`.
- Solo hay coincidencias de ìgoyaî en otros contenidos/plantillas y en artÌculos ya existentes (no relacionados al nuevo comunicado).

### Estado del contenido en `src/content/prensa.json`

- **No existe un Ìtem con fecha 2026-01-26**.
- ⁄ltimo Ìtem en el archivo (seg˙n orden actual): `2026-01-15T16:52:00.000-03:00`.

Contenido completo actual de `src/content/prensa.json`:

```
{
  "items": [
    {
      "fecha": "2025-12-18T02:35:00.000-03:00",
      "id": "2025-12-18-cuentas-inversion",
      "titulo": "Solicitamos mediante nota la remisi√≥n de Cuentas de Inversi√≥n adeudadas al Gobernador J.P. Vald√©s",
      "subtitulo": "Se pidi√≥ enviar a la Legislatura la documentaci√≥n de los √∫ltimos dos ejercicios fiscales para su an√°lisis y tratamiento, en el marco del debate del Presupuesto 2026.",
      "etiqueta": "Documento",
      "imagen": "/assets/uploads/NOTA informe cuentainversion.png",
      "cuerpo": "**El 18 de diciembre de 2025, la diputada provincial Cecilia Gortari, junto a otros diputadas de la Honorable C√°mara de Diputados de Corrientes, present√≥ una nota dirigida al Gobernador Juan Pablo Vald√©s solicitando la remisi√≥n a la Legislatura de las Cuentas de Inversi√≥n correspondientes a los √∫ltimos dos ejercicios fiscales, que se encuentran pendientes de env√≠o para su an√°lisis y tratamiento.**\n\nLa solicitud se fundamenta en las atribuciones de control y evaluaci√≥n que posee el Poder Legislativo, y busca fortalecer el debate parlamentario y la transparencia institucional, especialmente en el contexto del tratamiento del **Proyecto de Ley de Presupuesto 2026**.\n\n**¬øQu√© se solicit√≥ concretamente?**\n\n*   La **remisi√≥n a la Legislatura** de las **Cuentas de Inversi√≥n** adeudadas de los √∫ltimos dos ejercicios.\n*   El env√≠o de la **documentaci√≥n respaldatoria** correspondiente.\n*   En caso de estar disponibles, los **informes y/o dict√°menes** de los √≥rganos de control vinculados al tema.\n\n**¬øPor qu√© es importante?**\n\nPorque contar con las Cuentas de Inversi√≥n en tiempo y forma permite realizar un an√°lisis responsable y fundado del uso de los recursos p√∫blicos, brindar previsibilidad y claridad a la ciudadan√≠a y fortalecer el correcto funcionamiento institucional.",
      "documento": "/assets/uploads/nota-gobernador.pdf"
    },
    {
      "fecha": "2025-12-19T06:28:00",
      "id": "2025-12-19-presupuesto2026",
      "titulo": "Presupuesto Provincial 2026: acompa√±amos en general y marcamos diferencias en particular",
      "subtitulo": "El Presupuesto 2026 fue aprobado el 19 de diciembre. Acompa√±amos la herramienta en general, pero no avalamos art√≠culos vinculados a endeudamiento y emisi√≥n de Letras de Tesorer√≠a.",
      "etiqueta": "Prensa",
      "imagen": "/assets/uploads/Captura de pantalla 2026-01-07 062938.png",
      "cuerpo": "El **19 de diciembre de 2025** se trat√≥ en la C√°mara de Diputados de Corrientes el **Presupuesto Provincial 2026 (Ley 6745)**.\n\nDesde nuestro lugar, **acompa√±amos el Presupuesto en general** porque es una herramienta necesaria para que el Estado pueda funcionar, planificar y ejecutar pol√≠ticas p√∫blicas.\n\nSin embargo, **en la votaci√≥n en particular** marcamos diferencias en art√≠culos puntuales vinculados a facultades financieras y endeudamiento. En la votaci√≥n nominal, los **art√≠culos 20, 21 y 22** registraron votos negativos.\n\n**¬øQu√© establecen esos art√≠culos?**\n\n- **Art√≠culo 20:** habilita operaciones de cr√©dito p√∫blico y autorizaciones vinculadas a deuda, con montos que alcanzan hasta **$200.000 millones**.\n- **Art√≠culo 22:** autoriza la emisi√≥n de **Letras de Tesorer√≠a** por hasta **$200.000 millones** para cubrir necesidades estacionales de caja, con vencimientos que pueden extenderse.\n\nEn ese marco, se√±alamos que este tipo de herramientas deben usarse con **criterio, transparencia y control**, evitando que se transformen en una ‚Äúsalida f√°cil‚Äù que hipoteque recursos futuros. En notas period√≠sticas se mencion√≥ adem√°s la preocupaci√≥n por el salto en la autorizaci√≥n de Letras de Tesorer√≠a del art√≠culo 22.\n\nüìå Video con mi posici√≥n completa\n\n[Mi intervenci√≥n](https://www.instagram.com/p/DSid-LUCQDn/)",
      "documento": "",
      "archivo": "",
      "instagram_url": "https://www.instagram.com/p/DSid-LUCQDn/",
      "body": "El **19 de diciembre de 2025** se trat√≥ en la C√°mara de Diputados de Corrientes el **Presupuesto Provincial 2026 (Ley 6745)**.\n\nDesde nuestro lugar, **acompa√±amos el Presupuesto en general** porque es una herramienta necesaria para que el Estado pueda funcionar, planificar y ejecutar pol√≠ticas p√∫blicas.\n\nSin embargo, **en la votaci√≥n en particular** marcamos diferencias en art√≠culos puntuales vinculados a facultades financieras y endeudamiento. En la votaci√≥n nominal, los **art√≠culos 20, 21 y 22** registraron votos negativos.\n\n**¬øQu√© establecen esos art√≠culos?**\n\n- **Art√≠culo 20:** habilita operaciones de cr√©dito p√∫blico y autorizaciones vinculadas a deuda, con montos que alcanzan hasta **$200.000 millones**.\n- **Art√≠culo 22:** autoriza la emisi√≥n de **Letras de Tesorer√≠a** por hasta **$200.000 millones** para cubrir necesidades estacionales de caja, con vencimientos que pueden extenderse.\n\nEn ese marco, se√±alamos que este tipo de herramientas deben usarse con **criterio, transparencia y control**, evitando que se transformen en una ‚Äúsalida f√°cil‚Äù que hipoteque recursos futuros. En notas period√≠sticas se mencion√≥ adem√°s la preocupaci√≥n por el salto en la autorizaci√≥n de Letras de Tesorer√≠a del art√≠culo 22.\n\nüìå Video con mi posici√≥n completa\n\n[Mi intervenci√≥n](https://www.instagram.com/p/DSid-LUCQDn/)"
    },
    {
      "fecha": "2025-12-29T12:00:00.000-03:00",
      "id": "2025-12-29-entrega-certificados-escuela-oficios",
      "titulo": "Cerramos la √∫ltima tanda de certificados en la Escuela de Oficios: m√°s de 300 egresados",
      "subtitulo": "Finalizamos una nueva entrega de certificados en nuestra Escuela de Oficios. M√°s de 300 alumnos y alumnas completaron cursos como reposter√≠a y propuestas pr√°cticas para emprender en fechas especiales, sumando herramientas para mejorar sus ingresos.",
      "etiqueta": "Actividad",
      "imagen": "/assets/uploads/WhatsApp Image 2026-01-07 at 07.09.43.jpeg",
      "cuerpo": "Finalizamos la √∫ltima tanda de entrega de certificados en nuestra **Escuela de Oficios**, un espacio pensado para acompa√±ar a vecinos y vecinas que eligen capacitarse, aprender un oficio y abrir nuevas oportunidades laborales.\n\nEn esta etapa, **m√°s de 300 alumnos y alumnas** recibieron su certificado tras completar distintas propuestas formativas. Entre ellas, se destacaron cursos de **reposter√≠a** y contenidos orientados a la **elaboraci√≥n de productos para fechas y celebraciones**, con salida r√°pida para quienes buscan emprender o sumar un ingreso extra.\n\n### Capacitaci√≥n que se transforma en trabajo\n\nCreemos en la formaci√≥n como una herramienta concreta para el d√≠a a d√≠a. Cada certificado representa horas de esfuerzo, constancia y ganas de crecer. Tambi√©n significa un paso m√°s para quienes quieren:\n\n- incorporar habilidades pr√°cticas y aplicables;\n- iniciar o fortalecer un emprendimiento;\n- mejorar su econom√≠a familiar;\n- ganar confianza para ofrecer un servicio o producir para vender.\n\n### M√°s oportunidades, m√°s comunidad\n\nEstos encuentros son tambi√©n espacios de reconocimiento y encuentro. Cuando una comunidad se organiza y se forma, se multiplican las posibilidades: aparece trabajo, circula el conocimiento y se fortalecen los v√≠nculos.\n\nSeguimos impulsando capacitaciones con una mirada de acompa√±amiento, inclusi√≥n y compromiso con el desarrollo local.\n\nüëâ **Conoc√© nuestra Escuela de Emprendedores. En marzo arrancamos con todo:**\n[http://ceciliagortari.com.ar/escuela/](http://ceciliagortari.com.ar/escuela/)",
      "documento": ""
    },
    {
      "fecha": "2026-01-15T16:52:00.000-03:00",
      "id": "2026-01-17-embajadora-comparsa-arami",
      "titulo": "Cecilia Gortari acompa√±√≥ el lanzamiento de los carnavales goyanos 2026 y fue presentada como embajadora de la comparsa Aram√≠",
      "subtitulo": "Con su presencia en el lanzamiento, la diputada provincial ratifica su respaldo a una fiesta profundamente correntina, que combina alegr√≠a, brillo e identidad y se construye, sobre todo, con trabajo y mucha pasi√≥n.",
      "etiqueta": "Noticia",
      "imagen": "/assets/uploads/WhatsApp Image 2026-01-17 at 18.45.47.jpeg",
      "cuerpo": "Seg√∫n lo publicado por el Diario √âpoca, en el marco del lanzamiento oficial de los Carnavales Goyanos 2026, la diputada provincial **Cecilia Gortari** acompa√±√≥ a comparsas, organizadores y referentes de la comunidad carnavalera en la ciudad de Goya. En ese contexto, fue presentada como **embajadora de la comparsa Aram√≠**, en un gesto de reconocimiento al trabajo cultural que sostiene esta fiesta popular.\n\nLejos de ser solo un evento art√≠stico, el carnaval es una expresi√≥n de identidad correntina que se construye desde adentro, con organizaci√≥n, esfuerzo y compromiso colectivo. La presencia de una representante popular de Goya en los lanzamientos de carnavales busca reforzar ese acompa√±amiento institucional, no √∫nicamente desde las palabras, sino **participando plenamente** y acompa√±ando el trabajo que hacen las comparsas durante meses.\n\n## El carnaval como cultura y motor econ√≥mico\n\nLos Carnavales movilizan una cadena de trabajo que, en esta √©poca del a√±o, es fundamental para much√≠sima gente. Detr√°s de cada noche de desfile hay oficios, horas de taller y un verdadero arte puesto al servicio de la alegr√≠a popular: quienes dise√±an, cortan y cosen los trajes; quienes empluman, arman tocados, restauran carrozas; m√∫sicos, bailarines, coordinadores, equipos t√©cnicos y un entramado de personas que sostienen la producci√≥n con dedicaci√≥n y sacrificio.\n\nA esa tarea se suma el movimiento comercial propio de cada jornada: puestos y trabajadores dentro del predio, emprendedores, vendedores y servicios que acompa√±an la actividad, adem√°s del impacto que genera el turismo en la ciudad (alojamiento, gastronom√≠a, transporte y comercios). En conjunto, el carnaval **da trabajo**, impulsa la econom√≠a local y fortalece circuitos productivos vinculados a la cultura.\n\n## Acompa√±ar desde adentro, para una Corrientes que se reconoce en sus fiestas\n\nDesde su rol legislativo y territorial, Cecilia Gortari reafirma el valor de las fiestas populares como espacio de encuentro y pertenencia. Acompa√±ar el carnaval es tambi√©n defender la cultura correntina, reconocer a quienes la hacen posible y sostener una tradici√≥n que, adem√°s de generar actividad econ√≥mica, **lleva alegr√≠a a la gente** y fortalece el v√≠nculo comunitario.\n\nüìå Nota del diario √©poca: https://www.diarioepoca.com/1371738-diputada-provincial-nueva-embajadora-de-comparsa-arami",
      "documento": ""
    }
  ]
}
```

### Resultado requerido si no existe artÌculo nuevo

- **NO SE GENER” ARCHIVO DE CONTENIDO** con fecha 2026-01-26 ni con slug/ID solicitado.

## PASO 4 ó AUDITORÕA DE ESTRUCTURA DE CONTENIDO

### ¡rbol de carpetas relevantes (contenido)

```
D:\GIT\CECILIAGORTARI-SITE\SRC\CONTENT
    prensa.json

No existe ninguna subcarpeta

D:\GIT\CECILIAGORTARI-SITE\SRC\DATA
    prensa-index.json

No existe ninguna subcarpeta
```

### ¡rbol de carpetas relevantes (prensa)

```
D:\GIT\CECILIAGORTARI-SITE\SRC\PRENSA
|   index.njk
|   
+---branding
|       index.njk
|       
\---detalle
        CAMBIOS.md
        index.njk
```

### ¡rbol de carpetas relevantes (admin / functions)

```
D:\GIT\CECILIAGORTARI-SITE\SRC\ADMIN
    config.yml
    custom.css
    index.html

No existe ninguna subcarpeta

D:\GIT\CECILIAGORTARI-SITE\SRC\FUNCTIONS\PRENSA
\---detalle
        index.ts
```

### Observaciones de estructura

- Carpeta donde **escribe el CMS**: `src/content/prensa.json` (seg˙n `admin/config.yml`).
- Carpeta que **lee la web p˙blica**: el front-end **fetch** directo a `/content/prensa.json` (ver `src/assets/js/prensa-feed.js` y `src/assets/js/prensa-detail.js`).
- Diferencias entre carpeta de escritura y lectura:
  - **No hay conversiÛn** a colecciones Eleventy; es un JSON copiado a `dist/content/prensa.json` por passthrough.

## PASO 5 ó AUDITORÕA DE BUILD

### `package.json` (scripts y stack)

```
{
    "name": "ceciliagortari-site",
    "version": "1.0.0",
    "description": "Sitio web de Cecilia Gortari",
    "scripts": {
        "dev": "eleventy --serve",
        "build": "eleventy"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "devDependencies": {
        "@11ty/eleventy": "^3.0.0"
    }
}
```

### `.eleventy.js` (input/output y passthrough)

```
module.exports = function (eleventyConfig) {
  // Passthrough Copy for static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");
  eleventyConfig.addPassthroughCopy("src/data");
  eleventyConfig.addPassthroughCopy("src/functions");
  eleventyConfig.addPassthroughCopy("src/content"); // If exists

  // Root files passthrough
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/sitemap.xml": "sitemap.xml" });
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });
  eleventyConfig.addPassthroughCopy({ "src/manifest.webmanifest": "manifest.webmanifest" });

  // Favicons passthrough (map from src root to output root)
  eleventyConfig.addPassthroughCopy({ "src/favicon.ico": "favicon.ico" });
  eleventyConfig.addPassthroughCopy({ "src/favicon-16x16.png": "favicon-16x16.png" });
  eleventyConfig.addPassthroughCopy({ "src/favicon-32x32.png": "favicon-32x32.png" });
  eleventyConfig.addPassthroughCopy({ "src/android-chrome-192x192.png": "android-chrome-192x192.png" });
  eleventyConfig.addPassthroughCopy({ "src/android-chrome-512x512.png": "android-chrome-512x512.png" });
  eleventyConfig.addPassthroughCopy({ "src/apple-touch-icon.png": "apple-touch-icon.png" });

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes"
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
```

### ConclusiÛn de build (sin resolver)

- Comando de build: `eleventy`.
- Input dir: `src`. Output dir: `dist`.
- **El contenido de prensa NO es generado por Eleventy**: se copia tal cual desde `src/content` a `dist/content`.
- El front-end luego **consume el JSON en runtime** con `fetch`.

## PASO 6 ó AUDITORÕA DE TEMPLATES DE PRENSA

### `/prensa` (listado)

Archivo: `src/prensa/index.njk`

```
---
layout: layouts/base.njk
title: "Prensa | Cecilia Gortari - Diputada Provincial"
description: "Comunicados, notas de prensa, entrevistas y material institucional de Cecilia Gortari."
ogImage: "https://ceciliagortari.com.ar/assets/img/hero-diputados.jpg"
---

    <!-- GRID DE PRENSA (Renderizado por JS) -->
    <section class="prensa-section">
        <div class="container">
            ...
            <div class="prensa-grid" id="prensa-grid">
                <!-- Cards se renderizan desde prensa-data.js -->
            </div>
        </div>
    </section>

{% block scripts %}
    <script defer src="/assets/js/prensa-feed.js?v=202503061200"></script>
    <script src="/assets/js/site.js?v=202503061200"></script>
{% endblock %}
```

### Home / ìNovedadesî

Archivo: `src/index.njk`

```
    <section class="prensa-home prensa-home--dark" id="prensa-novedades">
        ...
        <div id="prensa-home-grid" class="prensa-grid prensa-grid--carousel" data-scroll-reveal>
            <!-- Javascript will load items here -->
            <div class="text-center w-full py-8 text-gray-500">Cargando novedades...</div>
        </div>
        ...
    </section>

{% block scripts %}
    <!-- <script src="/assets/js/prensa-data.js?v=202503061200"></script> --> <!-- Deprecated -->
    <script defer src="/assets/js/prensa-feed.js?v=202503061200"></script>
    <script defer src="/assets/js/bio-animations.js?v=202503061200"></script>
    <script defer src="/assets/js/home-redesign.js?v=202601081200"></script>
    <script src="/assets/js/site.js?v=202503061200"></script>
{% endblock %}
```

### LÛgica de render/filtros (prensa-feed.js)

Archivo: `src/assets/js/prensa-feed.js`

Puntos que pueden excluir un artÌculo nuevo:
- Filtrado por categorÌa (`categorySelect` / `normalizeCategory`).
- B˙squeda por texto (`searchInput`).
- Ordenamiento y cortes:
  - Home muestra **solo 3**: `allItems.slice(0, 3)`.

CÛdigo relevante:

```
  const prensaUrl = "/content/prensa.json";
  ...
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
            renderError("La nota que busc√°s no existe o fue eliminada.");
          }
        }
      }
    })
```

### LÛgica de detalle (prensa-detail.js)

Archivo: `src/assets/js/prensa-detail.js`

CÛdigo relevante (b˙squeda por id/slug):

```
    fetch("/content/prensa.json", { cache: "no-store" })
        .then((response) => {
            if (!response.ok) throw new Error("Error loading prensa.json");
            return response.json();
        })
        .then((data) => {
            const items = data.items || [];

            // Find item by ID or Slug
            const item = items.find(i => {
                const itemId = i.id || generateSlug(i); // Fallback to slug-like ID if no ID field
                const itemSlug = i.slug || generateSlug(i);

                if (id) return itemId === id || itemSlug === id; // Match ID
                return itemSlug === slug;
            });

            if (item) {
                renderDetail(item, container);
                renderLatestNews(items, item); // Pass all items and current one
                setupLightbox();
            } else {
                renderError(container, "Publicaci√≥n no encontrada.");
            }
        })
```

### LÛgica heredada en `site.js` (potencial de placeholders)

Archivo: `src/assets/js/site.js` (secciÛn ìPRENSA GRID & CAROUSELî)

```
  // PRENSA GRID & CAROUSEL (Uses data from prensa-data.js)
  function initPrensaGrid() {
    const container = document.getElementById('prensa-grid');
    if (!container) return;

    // Check if PRENSA_ITEMS exists (from prensa-data.js)
    if (typeof PRENSA_ITEMS === 'undefined' || !PRENSA_ITEMS.length) {
      // Show placeholders if no items
      container.innerHTML = Array(3).fill(0).map(() => `
        <div class="prensa-card prensa-card--placeholder">
          <div class="prensa-card__body">
            <span class="prensa-card__placeholder-icon">üì∞</span>
            <h3 class="prensa-card__title">Pr√≥ximamente</h3>
            <a href="/prensa/" class="prensa-card__cta">Ver Prensa</a>
          </div>
        </div>
      `).join('');
      return;
    }
    ...
  }
```

**ObservaciÛn de exclusiÛn potencial**: si `prensa-feed.js` no carga o falla, `site.js` podrÌa dejar placeholders en el grid (aunque `prensa-feed.js` deberÌa re-renderizar si carga bien).

## PASO 7 ó AUDITORÕA DE DEPLOY

### ConfiguraciÛn Cloudflare Pages

- En el repo **no se encuentra** `wrangler.toml` ni configuraciÛn explÌcita de Pages.
- Evidencia indirecta en `ADMIN_SETUP.md`:
  - Se menciona Cloudflare Pages y Pages Functions.

Resultado:
- **NO VISIBLE DESDE C”DIGO** la configuraciÛn de deploy (proyecto, branch, build config).

## PASO 8 ó CACHE / CDN

### Headers configurados

Archivo: `src/_headers`

```
# Security Headers
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  # Allow popup for OAuth
  Cross-Origin-Opener-Policy: same-origin-allow-popups
  # Default cache policy for HTML
  Cache-Control: no-store

# Long-lived cache for versioned assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### Riesgo de cache para prensa

- `/content/prensa.json` **no** est· bajo `/assets/*`, por lo tanto cae en la regla `/*` con `Cache-Control: no-store`.
- `prensa-feed.js` y `prensa-detail.js` hacen `fetch(..., { cache: "no-store" })`.
- **Riesgo de servir contenido viejo** desde CDN: bajo, dado `no-store` y fetch con no-store.
- **ExcepciÛn**: `src/functions/prensa/detalle/index.ts` responde a bots con `Cache-Control: public, max-age=300` (solo para bots y solo en `/prensa/detalle`).

## PASO 9 ó HIP”TESIS T…CNICAS (SIN RESOLVER)

1) El CMS no escribiÛ el nuevo Ìtem en `src/content/prensa.json` en la branch `main`.
   - A favor: no existe Ìtem con fecha 2026-01-26 ni slug/ID buscado en el repo.
   - En contra: el CMS muestra el artÌculo en el panel (seg˙n contexto, sin evidencia en repo).

2) El artÌculo fue guardado pero en otra rama distinta a `main`.
   - A favor: backend usa GitHub; la rama se define en `admin/config.yml` pero el deploy puede usar otra.
   - En contra: `admin/config.yml` y `ADMIN_SETUP.md` indican `main`.

3) El contenido fue guardado pero en otro archivo/ruta distinta a `content/prensa.json`.
   - A favor: no se detectÛ archivo nuevo bajo `src/content`.
   - En contra: la config del CMS apunta explÌcitamente a `content/prensa.json`.

4) El build/deploy no est· publicando el `dist/content/prensa.json` actualizado.
   - A favor: no hay configuraciÛn visible de deploy en el repo.
   - En contra: Eleventy copia `src/content` a `dist/content` por passthrough.

5) El frontend no est· leyendo el JSON correcto.
   - A favor: depende de `fetch("/content/prensa.json")` en runtime.
   - En contra: la ruta es estable y el archivo existe en `src/content` (y en `dist/content`).

6) La UI filtra el item nuevo por categorÌa/fecha/estado.
   - A favor: hay filtros de categorÌa y b˙squeda; home limita a 3 items.
   - En contra: no hay filtros por ìdraft/publishedî y la lista usa todos los items del JSON.

7) Cache/CDN sirve una versiÛn anterior del JSON.
   - A favor: Cloudflare Pages podrÌa cachear assets por defecto.
   - En contra: `_headers` define `Cache-Control: no-store` para `/*` y los fetch usan `cache: "no-store"`.

