# Actualización legislativa y rediseño — 22 de octubre de 2026

Rama `feat/rediseno-proyectos-legislativos`. Nada de esto se aplicó en producción: D1 y R2 de producción solo se consultaron en modo lectura.

## A. Auditoría legislativa

### Alcance real de la verificación

| Fuente | Resultado |
| --- | --- |
| D1 `gestionproyectos` (producción, solo lectura) | Consultada. 294 registros, 234 activos, **203 públicos**. Última modificación: 16/09/2026 18:31 UTC; **ningún cambio posterior**. 361 documentos. Instantánea en `d1-snapshot-2026-10-22.txt`. |
| Fichas oficiales de la Cámara (153) y plan oficial de la actualización del 16/09 (49) | Versionadas en `docs/legislative-update-2026-09-16/`; usadas como fuente oficial con corte **16/09/2026**. |
| Informes de sesión posteriores al 16/09 (23/09, 30/09, 07/10, 14/10, 21/10) | **No verificados.** Desde este entorno `hcdcorrientes.gov.ar` no resuelve (DNS) y `ceciliagortari.com.ar` está bloqueado por la política de red; el buscador web no indexa esos informes. |
| Auditoría preliminar de 49 expedientes mencionada en el pedido | **No llegó adjunta** a la sesión. |

No se inventó ningún expediente: los nuevos de septiembre–octubre quedan pendientes de cargar con la herramienta descrita en la sección H.

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
| Duermen en comisión | 117 (58 %); 85 con más de 3 meses al 22/10 |
| Tratados sobre tablas | 84 |
| Estados desactualizados respecto de la fuente | 0 al 16/09 |
| Diferencias de comisión | 0 sustantivas (19875: singular/plural en la ficha oficial) |

Detalle por expediente: `auditoria.json` y `auditoria-expedientes.csv`.

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

En el sitio, "De autoría" muestra los de impulso propio. "Del bloque" (191) y "Acompañamos" (12) no se superponen y suman el total. "De autoría" es un subconjunto del bloque, y el contador lo aclara.

## B y C. Rediseño y mejoras funcionales

- **Portada**: el botón principal del hero es "Ver proyectos legislativos". Novedades, Escuela e Instagram pasan a ser accesos secundarios. Después del hero va la nueva vidriera "Proyectos legislativos", con cifras en vivo (con nuestra firma, de autoría, duermen en comisión) y los tres últimos expedientes con descarga directa. Novedades queda a continuación y se quitó la sección anterior de proyectos.
- **/proyectos/**:
  - Muestra todos los proyectos por defecto.
  - Contadores grandes: total, de autoría, duermen en comisión (% del total) y esperan hace más de 3 meses. No hay contador de aprobados.
  - Filtros: participación (Todos / De autoría / Del bloque / Acompañamos), buscador por título, palabra o N.º (también con punto, "20.413"), comisión, tipo y estado. Se eliminó el filtro por área temática.
  - Panel lateral "Análisis por comisión", que se puede colapsar (en móvil, sección desplegable). Muestra barras clicables, su propio selector de alcance y una nota sobre el doble conteo.
  - Tarjetas con botón verde **Descargar proyecto**, que baja el PDF oficial directamente, y "Ficha oficial" de la Cámara. Si no hay PDF, se ofrece la ficha oficial.
  - "Más información" se despliega dentro de la tarjeta y muestra firmantes, origen, comisiones, estado con número de norma, fuente, verificación y enlace para copiar.
  - Los enlaces existentes `?id=EXP-…` siguen funcionando.
  - Los filtros quedan en la URL.
- **Voz**: textos en primera persona del plural ("nuestra firma", "de autoría", "acompañamos").
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

El sitio funciona igual antes y después de aplicarlas. Mientras falten las columnas, la API completa los datos con `lib/datos-oficiales.mjs` (los mismos datos oficiales), y lo cargado en D1 siempre tiene prioridad. Se probó con una copia local del esquema y los datos: 0 diferencias entre la salida previa y la posterior a la migración, y re-ejecutar 0011 no produce cambios.

## E. Código

Rama `feat/rediseno-proyectos-legislativos` y Pull Request en borrador (enlace en el PR).

## F. Pruebas

- Entorno local: `wrangler pages dev` con D1 y R2 locales que reproducen el esquema de producción, los 203 registros públicos (estados, autoría, comisiones y cantidad de documentos de la instantánea) y 260 documentos de prueba.
- **48 de 48 pruebas automatizadas superadas** (`pruebas-funcionales.txt`):
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
  - axe-core WCAG 2 A/AA sin violaciones.
  - Sin errores de JavaScript.
  - Sin scroll horizontal a 375 px.
- Seguridad, verificada por pruebas manuales con curl contra el servidor local (no forman parte de las 48):
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

Si el proyecto de Cloudflare Pages tiene la integración con GitHub, el push de la rama genera una vista previa automática (`<rama>.ceciliagortari-site.pages.dev`), que lee la D1 de producción sin modificarla. Desde esta sesión no se pudo comprobar porque `pages.dev` y la API de Cloudflare están bloqueados por la red. En la vista previa, el panel interno queda cerrado hasta configurar `ADMIN_PIN` en el entorno *Preview*.

## H. Pasos para publicar (después de aprobar)

1. **Secretos (antes de fusionar).** En Cloudflare → Workers & Pages → `ceciliagortari-site` → Settings → Variables and secrets, en *Production* y *Preview*, agregar:
   - `ADMIN_PIN` (secreto, 6 caracteres o más).
   - `ADMIN_SESSION_SECRET` (secreto, 32 caracteres aleatorios o más).

   Sin ellos el sitio público funciona, pero el panel queda bloqueado.
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
4. **Opcional, limpieza de duplicados.** Comparar el SHA-256 de cada par listado en `r2-objetos-duplicados.txt`, luego aplicar `migrations/0012…` y borrar los objetos R2 duplicados con `npx wrangler r2 object delete ceciliagortari-projects/<clave> --remote`.
5. **Publicar**: fusionar el PR en `main`; Cloudflare Pages despliega automáticamente.
6. **Verificar**:
   - `/proyectos/` muestra 203 proyectos.
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
