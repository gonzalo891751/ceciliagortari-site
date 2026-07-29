# Actualización editorial integral de Novedades — Proyectos de autoría 2026

Fecha de cierre: 29 de julio de 2026

Sitio: https://www.ceciliagortari.com.ar

Rama de trabajo: `chore/noticias-proyectos-autoria-2026`

Commit funcional publicado: `2cff013`

## Resultado

La sección Novedades quedó actualizada y verificada en producción con las iniciativas que el sistema vigente clasifica como:

- `tipo_autoria=propio`
- `estado_preparacion=Presentado`
- expediente y fuente oficial verificables

El corte produjo los siguientes resultados:

| Indicador | Cantidad |
|---|---:|
| Proyectos detectados con el criterio del sistema | 36 |
| Proyectos publicables con respaldo oficial | 35 |
| Noticias nuevas | 28 |
| Noticias existentes actualizadas sin cambiar su ID | 7 |
| Publicaciones totales en Novedades antes de la actualización | 13 |
| Publicaciones totales en Novedades después de la actualización | 41 |
| Casos pendientes de verificación documental | 1 |
| Proyectos clasificados como acompañados incorporados | 0 |

La expectativa inicial de “alrededor de 40” se resolvió contra el sistema actual y la documentación oficial. No se forzó una cantidad objetivo: se publicaron exactamente los 35 casos que superaron el control.

## Control de autoría y fuentes

La matriz se construyó desde la API pública del sitio y se concilió con los expedientes oficiales de la Honorable Cámara de Diputados de Corrientes.

Cada noticia publicada quedó asociada a:

- un único número de expediente;
- la fecha efectiva de presentación informada por el sistema;
- una página oficial del expediente;
- el PDF oficial correspondiente;
- una imagen con fuente y licencia registradas;
- un enlace interno a la sección Proyectos.

El control automatizado final registró cero errores y cero advertencias. Los 70 enlaces oficiales comprobados —35 páginas de expediente y 35 PDF— respondieron correctamente.

## Contenido editorial

Los 35 textos tienen:

- títulos de 55 a 81 caracteres;
- bajadas de 142 a 167 caracteres;
- cuerpos de 250 a 281 palabras;
- lenguaje periodístico claro y verificable;
- distinción explícita entre presentación, tratamiento y eventual aprobación;
- ausencia de resultados legislativos no respaldados;
- fecha de publicación a las 12:00, zona `-03:00`;
- ID único y URL estable.

Las siete noticias preexistentes vinculadas con los expedientes 19669, 19670, 19675, 19715, 19753, 19788 y 19841 conservaron sus IDs. Cuando una publicación anterior agrupaba asuntos distintos, se la reorientó al expediente correspondiente y se crearon artículos individuales para las demás iniciativas.

## Imágenes

Se incorporaron 35 imágenes WebP, todas de 1600 × 900 píxeles:

- 33 composiciones editoriales originales;
- 2 imágenes de Wikimedia Commons, con atribución visible y licencia registrada.

La comprobación local cargó las 35 imágenes con sus dimensiones correctas. La comprobación en producción obtuvo respuesta válida `image/webp` para los 35 archivos.

La trazabilidad completa se encuentra en `docs/FUENTES_IMAGENES_NOTICIAS_PROYECTOS_2026.csv`.

## Verificaciones ejecutadas

- copia de seguridad previa de las 13 publicaciones y sus archivos asociados;
- control de hashes y manifiesto del respaldo;
- sintaxis y unicidad de `src/content/prensa.json`;
- correspondencia uno a uno entre noticia y expediente;
- exclusión de proyectos clasificados como `acompanado`;
- rangos editoriales de títulos, bajadas y cuerpos;
- existencia local de todos los archivos de imagen;
- compilación completa con `npm run build`;
- carga local de 41 tarjetas y 35 imágenes de proyecto;
- revisión de detalle en escritorio y móvil;
- ausencia de desborde horizontal;
- 70 de 70 enlaces oficiales operativos;
- publicación mediante avance lineal de `main`, sin `force push`;
- verificación pública de 41 publicaciones;
- verificación pública de la noticia del expediente 20075, sus enlaces, fecha e imagen;
- 35 de 35 imágenes nuevas servidas correctamente en producción.

## Respaldo y reversión

El estado previo se conserva en:

`docs/backups/prensa-20260729-005232`

Incluye el JSON original, los medios y documentos referenciados, un manifiesto y un registro SHA-256. No se eliminó ninguna publicación ni archivo preexistente.

Para una reversión controlada puede utilizarse el respaldo o revertirse el commit funcional `2cff013`. No debe sobrescribirse el contenido actual sin verificar primero los cambios posteriores.

## Caso pendiente

Quedó fuera de publicación:

- `P-0067`, fecha informada 22 de abril de 2026, “Declaración de interés: Actividad por el Día de la Tierra”.

El registro no posee número de expediente, texto oficial, fuente legislativa ni firmas verificables. Antes de publicarlo se debe confirmar esa información y repetir el control editorial.

## Archivos de control

- `docs/MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.csv`
- `docs/MATRIZ_NOTICIAS_PROYECTOS_AUTORIA_2026.json`
- `docs/LISTA_ARTICULOS_NOTICIAS_PROYECTOS_2026.csv`
- `docs/FUENTES_IMAGENES_NOTICIAS_PROYECTOS_2026.csv`
- `docs/INFORME_AUDITORIA_NOTICIAS_PROYECTOS_2026.json`
- `docs/INFORME_ENLACES_OFICIALES_NOTICIAS_PROYECTOS_2026.json`
- `docs/INFORME_IMAGENES_PRODUCCION_NOTICIAS_PROYECTOS_2026.json`
- `docs/INFORME_PENDIENTES_NOTICIAS_PROYECTOS_2026.md`

## Estado final

Actualización publicada y verificada en:

- https://www.ceciliagortari.com.ar/novedades/
- https://www.ceciliagortari.com.ar/novedades/detalle/?id=2026-06-17-transparencia-ofertas-educativas
