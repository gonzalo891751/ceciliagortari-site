# Actualización legislativa y rediseño — 22 de octubre de 2026

Rama `feat/rediseno-proyectos-legislativos` (PR #23). El código se publica en producción al fusionar el PR, con autorización expresa del 22/10/2026. **D1 y R2 de producción no se modificaron**: solo se consultaron en modo lectura. Las migraciones de la sección D esperan respaldo verificado y autorización.

## A. Auditoría legislativa

### Alcance real de la verificación

| Fuente | Resultado |
| --- | --- |
| D1 `gestionproyectos` (producción, solo lectura) | Consultada. 294 registros, 234 activos, **203 públicos**. Última modificación: 16/09/2026 18:31 UTC; **ningún cambio posterior**. 361 documentos. Instantánea en `d1-snapshot-2026-10-22.txt`. |
| Fichas oficiales de la Cámara (153) y plan oficial de la actualización del 16/09 (49) | Versionadas en `docs/legislative-update-2026-09-16/`; usadas como fuente oficial con corte **16/09/2026**. |
| Auditoría preliminar del equipo (49 expedientes de los informes del 26/08, 16/09, 23/09 y 14/10) | Recibida y conciliada contra D1 (ver más abajo). Versionada en `auditoria-preliminar-49.json`; resultado en `conciliacion-auditoria-preliminar.json`. |
| Informes del 30/09, 07/10 y 21/10, y fichas individuales de las altas | **No verificados.** Desde este entorno `hcdcorrientes.gov.ar` no resuelve (DNS); falta confirmar si hubo sesión esos días y leer cada ficha. |

No se inventó ningún expediente: las altas salen de los informes oficiales citados en la auditoría preliminar y quedan con título oficial, PDF e impulso pendientes.

### Resultado de la conciliación D1 ↔ fuentes oficiales (corte 16/09/2026)

| Indicador | Valor |
| --- | --- |
| Proyectos públicos | 203 (202 con expediente oficial + P-0067 sin expediente localizado) |
| Expedientes duplicados | 0 |
| Firmados solo por el bloque (Gortari, Fernández Recalde, Canteros) | 190 |
| Firmados junto a otros bloques | 12: 19790, 19791, 19792, 19859, 20043, 20073, 20112, 20113, 20155, 20311, 20332, 20367 |
| De autoría (impulso de Cecilia, clasificación interna previa) | 41 |
| Elaboración conjunta documentada | 17 |
| Impulso **pendiente de clasificación interna** | 145 (firma conjunta acreditada, sin evidencia del impulso individual) |
| Aprobados en D1 | 86 — 85 con número de Declaración/Resolución en la fuente oficial |
| Esperando ser tratados (en comisión, sin dictamen) | 117 (58 %) |
| Tratados sobre tablas | 84 |
| Estados desactualizados respecto de la fuente | 0 al 16/09 |
| Diferencias de comisión | 0 sustantivas (19875: singular/plural en la ficha oficial) |

Detalle por expediente: `auditoria.json` y `auditoria-expedientes.csv`.

### Conciliación de la auditoría preliminar (49 expedientes)

`scripts/conciliar-auditoria-preliminar.mjs` compara cada expediente de la auditoría con la instantánea de D1 y los datos oficiales.

| Resultado | Cantidad |
| --- | --- |
| Ya cargados y coincidentes (estado, comisiones, norma, fecha y firmantes) | 25 |
| Ya cargados con diferencias | 0 |
| **Altas nuevas** (6 del 23/09 y 18 del 14/10) | **24**: 19 aprobadas con número de norma y 5 en comisión |
| Altas firmadas junto a otros bloques | 2: 20496 y 20530 |

Las altas están en `migrations/0013_altas_sesiones_2026-09-23_y_2026-10-14.sql`. Cada fila lleva expediente, tipo, asunto del informe, fecha de sesión, firmantes, participación, comisiones o "Sobre Tablas", norma y fuente (URL del informe y expedientes que tramitan juntos). Quedan sin dato y marcadas como pendientes el título oficial de la ficha, el PDF y el impulso (`pendiente`). La migración inserta con `ON CONFLICT(id) DO NOTHING` y no toca registros existentes. Con ella, el sitio pasa de 203 a **227** proyectos, y de 117 a **122** esperando ser tratados (54 %).

Se respetaron las precauciones de la auditoría: identificación por número de expediente; 20332, 20367, 20496 y 20530 tratados por separado; declaraciones con número registradas como aprobadas; sin borradores ni anexos internos; sin escrituras en D1.

### Hallazgos

1. **15 PDF de expediente duplicados** (mismo archivo cargado dos veces con < 1 s de diferencia): 20011, 20014, 20043, 20056, 20067, 20084, 20100, 20116, 20117, 20118, 20119, 20134, 20145, 20176, 20192. Limpieza preparada en `migrations/0012` y `r2-objetos-duplicados.txt`.
2. **57 PDF de normas sancionadas** (Dec-NNN / Res-NNN) disponibles en la Cámara y no cargados. Listados en `auditoria.json` (`pdf_sancion_no_cargado`).
3. **Números de norma no cargados como dato**: 85 aprobados tienen Declaración/Resolución identificada (antes solo figuraba, en 23 casos, dentro del resumen). Se incorporan en el backfill.
4. **"Sobre Tablas" cargado como si fuera una comisión** (84 registros). Ahora el sitio lo muestra como tratamiento, separado de las comisiones y fuera de las barras por comisión.
5. **Firmantes genéricos**: 19790, 19791, 19792 y 19859 figuran como "Varios Señores Diputados"; conviene completar los nombres desde el PDF.
6. **EXP-20067**: proyecto de Declaración que la ficha oficial registra como **Resolución 180/26**. Se registra lo que dice la ficha; conviene confirmarlo.
7. **P-0067** (Día de la Tierra) sigue sin expediente oficial localizado, como en la auditoría anterior.
8. **Seguridad**: el panel se protegía solo con un PIN verificado en el navegador (por defecto `1234`) y **todas las rutas de escritura de la API eran públicas** (proyectos, documentos, archivos, agenda, gacetillas y autocompletado con IA, que consume la clave de Anthropic). Además, los 42 borradores Word internos eran descargables por la ruta pública. Corregido (sección C).

### Autoría formal e impulso político

Son dos campos distintos:

- `firmantes`: autores tal como figuran en el expediente oficial (autoría formal). Determina `participacion`: `bloque` o `acompanamos`.
- `impulso`: origen político según el equipo: `cecilia`, `emiliano`, `gustavo`, `conjunto`, `otros` o `pendiente`.

La migración solo traslada la clasificación existente (`propio` → `cecilia`, `coautoria` → `conjunto`). Los 145 registros `acompanado` firmados por el bloque quedan como **`pendiente`**: no hay respaldo documental para atribuirlos a Emiliano, a Gustavo o a Cecilia. El equipo puede clasificarlos desde el panel (campo "Impulso político" y su respaldo interno, que no se publica).

En el sitio, "De autoría" muestra los de impulso propio. "Del bloque" y "Acompañamos" no se superponen y suman el total (191 + 12 al 16/09; 213 + 14 con las altas de 0013). "De autoría" es un subconjunto del bloque, y el contador lo aclara.

## B y C. Rediseño y mejoras funcionales

- **Portada**: el botón principal del hero es "Ver proyectos legislativos". Novedades, Escuela e Instagram pasan a ser accesos secundarios. Después del hero va la nueva vidriera "Proyectos legislativos", con cifras en vivo (con nuestra firma, de autoría y, en rojo, **esperando ser tratados**) y los tres últimos expedientes con descarga directa. Novedades queda a continuación y se quitó la sección anterior de proyectos.
- **/proyectos/**:
  - Muestra todos los proyectos por defecto.
  - Contadores grandes: total, de autoría y **Esperando ser tratados**, en rojo, con ícono de cajón y el % del total. No hay contador de aprobados.
  - **Reloj de caducidad**, plegado al entrar ("Ver cronología"). Muestra, sobre el plazo de 2 años del expediente en espera más antiguo, cuántos proyectos siguen sin tratar por mes de presentación. El tiempo transcurrido aparece sombreado hasta la línea "Hoy", y la caducidad se marca al final. Al tocar un mes, el listado muestra solo los proyectos de ese mes que siguen esperando (`?estado=comision&mes=2026-03`). En móvil se suman botones por mes. Se reemplazó la barra con perilla, que podía confundirse con un control deslizable.
  - En cada tarjeta en espera: "Guardado hace X meses · caduca en Y" y un medidor segmentado de 24 tramos (un tramo por mes). En "Más información" se agrega la fecha de caducidad.
  - El plazo de caducidad de 2 años se toma desde la fecha de presentación. Conviene confirmarlo con el reglamento de la Cámara (por ejemplo, si se cuenta por período parlamentario).
  - Filtros: participación (Todos / De autoría / Del bloque / Acompañamos), buscador por título, palabra o N.º (también con punto, "20.413"), comisión, tipo y estado. Se eliminó el filtro por área temática.
  - Panel lateral "Análisis por comisión", que se puede colapsar (en móvil, sección desplegable). Muestra barras clicables, su propio selector de alcance y una nota sobre el doble conteo.
  - Tarjetas con botón verde **Descargar proyecto**, que baja el PDF oficial directamente, y "Ficha oficial" de la Cámara. Si no hay PDF, se ofrece la ficha oficial.
  - "Más información" se despliega dentro de la tarjeta y muestra firmantes, origen, comisiones, estado con número de norma, fuente, verificación y enlace para copiar.
  - Los enlaces existentes `?id=EXP-…` siguen funcionando.
  - Los filtros quedan en la URL.
- **Voz**: textos en primera persona del plural ("nuestra firma", "de autoría", "acompañamos").
- **Hero de la portada en pantallas bajas** (por ejemplo, notebooks con escala de Windows del 125 %, unos 1536×730): se compacta según la altura disponible para que el botón principal y los secundarios queden visibles sin desplazarse. Se verificó en 1280×600, 1366×657, 1440×780, 1536×730, 1920×1080 y 2560×1300.
- **Efectos**: aurora animada en el encabezado, contadores que suben, brillo que sigue al cursor en las tarjetas, barras que crecen y reloj de arena animado. Todo se desactiva con "reducir movimiento".
- **Favicon**: monograma "CG" en Outfit ExtraBold sobre el degradé institucional magenta→azul. Incluye SVG, ICO (16/32/48), PNG 16/32, Apple Touch 180 (a sangre), Android 192/512 e ícono *maskable*. El manifiesto se actualizó, las referencias llevan `?v=3` para renovar la caché y los íconos tienen reglas propias de caché en `_headers`.
- **API pública**: un único endpoint entrega cada proyecto normalizado, con número, firmantes, participación, impulso, norma, comisiones sin "Sobre Tablas", documento principal y adicionales. La descarga de borradores internos (`main`) solo se permite cuando no existe el PDF oficial.
- **Protección del panel y la API interna**:
  - `functions/api/_middleware.js` exige una sesión firmada (cookie HttpOnly, SameSite=Strict, HMAC-SHA256) en todo `/api/*`, salvo el catálogo público, el formulario de contacto y las rutas de sesión.
  - El PIN se valida en el servidor contra el secreto `ADMIN_PIN`, con límite de intentos.
  - Se rechazan pedidos de escritura de otro origen.
  - Sin el secreto configurado, la API interna queda cerrada.
- **Panel de gestión**: login contra el servidor (vuelve a pedir el PIN si la sesión vence) y nuevos campos:
  - N.º de expediente y ficha oficial.
  - Título oficial y firmantes.
  - Impulso político y su respaldo.
  - Norma aprobada: tipo, número y fecha.
  - Fuente y fecha de verificación.
  - Estados de trámite ampliados.
- **CSS**: se quitaron unas 1.700 líneas del diseño anterior que ya ninguna página usaba (`additions.css` pasó de 115 KB a 77 KB).

## D. Base de datos (preparado, sin ejecutar en producción)

| Archivo | Qué hace |
| --- | --- |
| `migrations/0010_campos_parlamentarios.sql` | Agrega columnas con valores por defecto (no modifica datos). |
| `migrations/0011_backfill_campos_parlamentarios.sql` | Completa número, título oficial, firmantes, participación, enlace, fuente, verificación, norma e impulso **solo donde el campo está vacío**. Es idempotente. Crea un índice único parcial que impide expedientes duplicados. |
| `migrations/0012_limpieza_documentos_duplicados.sql` | Borra 15 registros duplicados de documentos y conserva el más antiguo. Es opcional. |
| `migrations/0013_altas_sesiones_2026-09-23_y_2026-10-14.sql` | Inserta las 24 altas de la auditoría preliminar sin sobrescribir nada. Requiere 0010. |

El sitio funciona igual antes y después de aplicarlas. Mientras falten las columnas, la API completa los datos con `lib/datos-oficiales.mjs` (los mismos datos oficiales), y lo cargado en D1 siempre tiene prioridad. Se probó con una copia local del esquema y los datos: 0 diferencias entre la salida previa y la posterior a la migración, y re-ejecutar 0011 no produce cambios.

## E. Código

Rama `feat/rediseno-proyectos-legislativos` y Pull Request en borrador (enlace en el PR).

## F. Pruebas

- Entorno local: `wrangler pages dev` con D1 y R2 locales que reproducen el esquema de producción, los 203 registros públicos (estados, autoría, comisiones y cantidad de documentos de la instantánea), las 24 altas de 0013 y 260 documentos de prueba.
- **51 de 51 pruebas automatizadas superadas**, más 13 del reloj de caducidad (`pruebas-funcionales.txt`):
  - Contadores contra la API.
  - Pestañas y la ausencia de solapamiento.
  - Filtro por comisión, incluso con expedientes girados a dos comisiones.
  - Barras y doble conteo.
  - Búsqueda.
  - URL.
  - Descarga real de un PDF sin modales.
  - "Mostrar más".
  - Fichas expandibles.
  - Ausencia de duplicados.
  - Enlaces oficiales.
  - Enlace anterior `?id=`.
  - Orden de secciones en la portada.
  - Reloj: plegado al entrar, despliegue accesible, filtro por mes con la misma cantidad que la barra, chip para quitarlo y enlace directo por URL.
  - axe-core WCAG 2 A/AA sin violaciones.
  - Sin errores de JavaScript.
  - Sin scroll horizontal a 375 px.
- Seguridad, verificada por pruebas manuales con curl contra el servidor local (no forman parte de las 51):
  - PIN incorrecto → 401.
  - Origen ajeno → 403.
  - Cookie adulterada → 401.
  - Rutas internas sin sesión → 401.
  - Borrador interno con PDF oficial → 404.
  - Proyecto eliminado o no presentado → 404.
- Panel probado en Chromium: login incorrecto y correcto, carga de campos parlamentarios y guardado.
- Compilación de Eleventy correcta (15 páginas). Las demás páginas (novedades, escuela, biografía, prensa, contacto) se revisaron visualmente.
- Peso: la API pública pesa 26 KB comprimida (203 proyectos); `legislativo.css` 7,5 KB y el JS de proyectos 11 KB comprimidos.
- Capturas de escritorio, móvil, panel y favicon en `capturas/`. Están tomadas sobre los datos locales: los PDF son de prueba, por eso figuran de 1 KB.

## G. Vista previa

Cada push de la rama genera una vista previa en Cloudflare Pages (`feat-rediseno-proyectos-legi.ceciliagortari-site.pages.dev`), que lee la D1 de producción sin modificarla. El equipo la revisó el 22/10, y de esa revisión salieron los ajustes del hero y del reloj de caducidad. En la vista previa, el panel interno queda cerrado hasta configurar `ADMIN_PIN` en el entorno *Preview*.

## H. Pasos para publicar (después de aprobar)

1. **Secretos.** En Cloudflare → Workers & Pages → `ceciliagortari-site` → Settings → Variables and secrets, en *Production* y *Preview*, agregar:
   - `ADMIN_PIN` (secreto, 6 caracteres o más). **No reutilizar `1234`**: era el PIN por defecto del panel anterior y figuraba en el código público de la página.
   - `ADMIN_SESSION_SECRET` (opcional y recomendado: 32 caracteres aleatorios o más). Si falta, la firma de la sesión se deriva de `ADMIN_PIN`.

   Después, volver a desplegar (Deployments → último despliegue de producción → *Retry deployment*) para que tomen efecto. Sin `ADMIN_PIN`, el sitio público funciona, pero el panel y la API interna quedan cerrados.
2. **Respaldo verificado de D1:**
   ```bash
   npx wrangler d1 export gestionproyectos --remote --output=backup-gestionproyectos-$(date +%Y%m%d).sql
   npx wrangler d1 time-travel info gestionproyectos   # anotar el bookmark actual
   ```
3. **Migraciones:**
   ```bash
   npx wrangler d1 execute gestionproyectos --remote --file=migrations/0010_campos_parlamentarios.sql
   npx wrangler d1 execute gestionproyectos --remote --file=migrations/0011_backfill_campos_parlamentarios.sql
   npx wrangler d1 execute gestionproyectos --remote --command "SELECT impulso, participacion, COUNT(*) FROM projects WHERE deleted_at IS NULL AND estado_preparacion='Presentado' GROUP BY 1,2"
   ```
   El resultado esperado es: cecilia/bloque 40, cecilia/'' 1, conjunto/bloque 10, conjunto/acompanamos 7, pendiente/bloque 140 y pendiente/acompanamos 5.

   Luego, las altas:
   ```bash
   npx wrangler d1 execute gestionproyectos --remote --file=migrations/0013_altas_sesiones_2026-09-23_y_2026-10-14.sql
   ```
   Se suman 24 proyectos: pendiente/bloque +22 y pendiente/acompanamos +2.
4. **Opcional, limpieza de duplicados.** Comparar el SHA-256 de cada par listado en `r2-objetos-duplicados.txt`, luego aplicar `migrations/0012…` y borrar los objetos R2 duplicados con `npx wrangler r2 object delete ceciliagortari-projects/<clave> --remote`.
5. **Publicar**: fusionar el PR en `main`; Cloudflare Pages despliega automáticamente. El código funciona antes y después de las migraciones.
6. **Verificar**:
   - `/proyectos/` muestra 203 proyectos sin las migraciones y 227 después de 0013.
   - La descarga de un PDF funciona.
   - `/api/projects` devuelve 401 sin sesión.
   - El panel pide el PIN y guarda.
   - Los íconos nuevos aparecen (puede requerir recargar).
7. **Scripts**: `scripts/update-legislative-projects.mjs` ahora inicia sesión con `ADMIN_PIN=<pin> node scripts/…`.
8. **Revertir**: revertir el PR. Para la base, `npx wrangler d1 time-travel restore gestionproyectos --bookmark=<bookmark del paso 2>`.

### Cargar los informes del 23/09 en adelante

```bash
# Descargar los PDF de https://hcdcorrientes.gov.ar/sesiones/tratamiento-parlamentario/ y luego:
node scripts/sincronizar-expedientes-hcd.mjs --informe Informe-14-10-26.pdf --out docs/actualizacion-2026-10-xx
```

El script detecta en el informe los expedientes firmados por el bloque, lee cada ficha oficial y genera:

- `plan-altas.json`: altas nuevas con el impulso **pendiente** y los campos a revisar marcados. Se publica con `scripts/update-legislative-projects.mjs`.
- `actualizaciones.sql`: aprobaciones, números de norma y firmantes de expedientes ya cargados.

No escribe en la base; todo queda para revisar antes de aplicar.

### Recomendaciones fuera de alcance

- `_headers` aplica `Cache-Control: no-store` a todo (`/*`), y Cloudflare lo combina con la regla de `/assets/*`; en la práctica los recursos estáticos no se cachean. Conviene agregar `! Cache-Control` en `/assets/*` (los íconos nuevos ya lo tienen).
- `node_modules` está versionado en el repositorio (incluye shims de Windows), algo que conviene revisar.

## Segunda ronda de ajustes (22/10/2026, publicada)

Pedidos del equipo después de ver el sitio en producción:

- **Menú superior**:
  - "Proyectos legislativos" pasa a ser el acceso destacado y "Escuela de Emprendedores" queda como enlace común. En móvil, Proyectos es la primera opción del menú.
  - Al desplazarse, la barra se convierte en una cápsula flotante de vidrio. El logo usa una versión recortada (`logo-cecilia-nav`), así que ya no se achica de más.
- **Hero**: dos accesos destacados, "Ver proyectos legislativos" y "Seguime en Instagram" (con los colores de Instagram). Debajo quedan Novedades y Escuela.
- **Reloj de caducidad**:
  - Explicación para el público: los proyectos tienen 2 años de vida y, si no se tratan, vencen en silencio.
  - "Próximos vencimientos": cada botón muestra los proyectos que vencen ese mes, por ejemplo "12 vencen en marzo de 2028".
  - El titular plegado muestra el vencimiento más próximo.
  - Los proyectos que superan los 2 años sin actualizar su estado se cuentan aparte hasta verificarlos.
- **/proyectos/**:
  - El buscador queda arriba, junto al orden y al cambio de vista: **cuadrícula o lista**. La preferencia se recuerda y queda en la URL con `vista=lista`.
  - Participación, estado, tipo y análisis por comisión quedan juntos en el panel derecho. Se quitaron el selector de comisión y el de participación, que estaban duplicados. En móvil, el panel se despliega con un botón e indica cuántos filtros hay activos.
- **Portada**:
  - La biografía tiene márgenes propios, la etiqueta "Quién soy" y la foto en vertical en escritorio.
  - La Escuela ya no se corta en móvil: el contenido ensanchaba la grilla. Su fondo pasa a ser CSS; la imagen anterior traía un marco dentro del archivo.
  - Emojis reemplazados por íconos de línea en la Escuela y en "¿Querés ser parte?".
  - Las cifras de la Escuela usan el azul noche del sitio.
  - El botón de Instagram tiene los colores de la marca y el logo del pie es más grande.
- **Rendimiento**:
  - Las fotos del carrusel pasan a WebP (unos 450 KB menos).
  - Se quitó `instagram.com/embed.js`, que no se usaba.
  - El widget de Instagram se carga recién al acercarse a su sección.
- **Accesibilidad**: axe WCAG 2 A/AA sin violaciones en la portada y en /proyectos/, en escritorio y en móvil. Se corrigió el rol de los puntos del carrusel.
- **Skill** `.claude/skills/actualizar-proyectos-legislativos/` con el procedimiento para las próximas actualizaciones desde los informes de la Cámara. `scripts/conciliar-auditoria-preliminar.mjs` acepta `--dir`, `--migracion` y `--nota`, y sin opciones reproduce 0013 sin cambios.

Pruebas:
- 60 de 60 pruebas funcionales y 13 del reloj superadas.
- El hero entra completo entre 1280×600 y 2560×1300.
- Sin scroll horizontal a 375 px.

Quedan fuera de alcance algunos avisos de axe que ya existían en otras páginas: contraste en /escuela/, /prensa/ y /contacto/, el nombre del selector en /novedades/ y una zona con desplazamiento en /biografia/.
