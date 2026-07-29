# Actualización integral de proyectos y expedientes 2026

Fecha de ejecución: 28 y 29 de julio de 2026 (America/Buenos_Aires).

Rama: `chore/actualizacion-expedientes-proyectos-2026`.

Base: `eae999c` (`origin/main`). No se hizo merge a `main` ni despliegue de código.

## Resultado

La actualización de datos de producción quedó completada y verificada.

| Control | Resultado |
|---|---:|
| Proyectos activos antes de la actualización | 80 |
| Proyectos presentados antes de la actualización | 50 |
| Expedientes únicos en los informes | 143 |
| Proyectos activos finales en el panel | 174 |
| Proyectos presentados visibles públicamente | 143 |
| Proyectos de ley | 28 |
| Proyectos de resolución | 57 |
| Proyectos de declaración | 58 |
| Proyectos de autoría/coautoría según filas celestes | 40 |
| Proyectos que Cecilia acompaña | 103 |
| Expedientes oficiales incorporados y verificados | 143 |
| Expedientes oficiales no localizados | 0 |
| Proyectos posteriores al 8/7/2026 | 0 |
| Duplicados de número de expediente | 0 |
| Registros que requieren decisión humana | 1 |

Los 174 proyectos activos finales no contradicen los 143 del informe: los 143 son los presentados conciliados y publicados. El panel conserva además 31 registros preexistentes que no pertenecían a esa nómina: 30 permanecieron sin cambios y `P-0067` quedó preservado como pendiente de revisión.

## Arquitectura inspeccionada

El sitio usa Eleventy para la construcción estática, Cloudflare Pages Functions para la API, D1 para proyectos y metadatos, y R2 para documentos. La actualización utilizó los endpoints del sistema y no escribió directamente en D1 ni R2.

El modelo vigente no tiene un campo separado para el número de expediente. Para mantener una clave única y permitir la búsqueda pública por número se usó el identificador estable `EXP-{numero}`, por ejemplo `EXP-19669`.

Los endpoints públicos ya daban prioridad al documento de tipo `expediente` sobre el DOCX principal. No fue necesario modificar la aplicación ni rediseñar la sección.

## Respaldo

Antes de escribir se generó un respaldo completo fuera del repositorio:

`C:\Users\gonza\Documents\Codex\2026-07-28\files-mentioned-by-the-user-proyectos\work\backups\proyectos-20260728-233138`

Integridad del respaldo inicial:

- 80 proyectos;
- 88 documentos listados y descargados;
- 0 archivos vacíos;
- 0 descargas fallidas;
- metadatos, URLs, tamaños y SHA-256 conservados.

Después de finalizar se generó un segundo respaldo verificable:

`C:\Users\gonza\Documents\Codex\2026-07-28\files-mentioned-by-the-user-proyectos\work\backups\proyectos-final-20260729-000755`

Integridad del respaldo final:

- 174 proyectos;
- 203 documentos listados y descargados;
- 39.052.828 bytes;
- 0 archivos vacíos;
- 0 descargas fallidas.

Los respaldos no están versionados.

## Conciliación

La fuente principal fue `Proyectos presentados al 8-7-26.docx`; `Proyectos por comisión al 8-7-26.docx` se usó para comisiones, áreas y contrastes.

Resultados:

- 143 expedientes únicos;
- 49 registros preexistentes conciliados y migrados;
- 94 proyectos ausentes creados;
- 38 DOCX útiles conservados al migrar;
- 27 expedientes preexistentes reemplazados o normalizados con la copia oficial;
- 49 identificadores legados retirados mediante borrado lógico después de verificar su reemplazo;
- 30 registros preexistentes ajenos a la nómina quedaron sin cambios;
- 1 registro no conciliado (`P-0067`) quedó preservado como `Pendiente`.

La clasificación de autoría se tomó exclusivamente del fondo celeste `DBE5F1`:

- celeste: `coautoria`, visible en “Proyectos de autoría”;
- no celeste: `acompanado`, visible en “Proyectos que acompañamos”.

No se infirió autoría por las firmas del PDF.

La matriz completa se entrega en:

- `docs/actualizacion-proyectos-2026/matriz-conciliacion.csv`;
- `docs/actualizacion-proyectos-2026/matriz-conciliacion.json`.

## Expedientes oficiales

Se consultó la ficha individual de cada expediente en el sitio oficial de la Honorable Cámara de Diputados de Corrientes. Los 143 PDF se descargaron desde enlaces oficiales, se validaron por cabecera `%PDF-`, tamaño, número, tipo, objeto y páginas iniciales, y se subieron como `expediente definitivo`.

Los archivos se nombraron con el patrón:

`EXPTE-{numero}-{TIPO}-{slug-breve}.pdf`

Control posterior a la carga:

- 143/143 metadatos con expediente;
- 143/143 enlaces públicos con estado HTTP 200;
- 143/143 archivos remotos con SHA-256 idéntico al PDF oficial descargado;
- 0 archivos de cero bytes;
- 0 enlaces 404.

Los expedientes 19790 y 19793 eran escaneos sin texto extraíble y se verificaron visualmente. Siete fichas oficiales tenían autores abreviados, omitidos o con errores ortográficos; esas observaciones no alteraron la regla de autoría del informe.

## Proyectos posteriores al 8/7/2026

Se revisó el buscador oficial por Cecilia Gortari, Emiliano Fernández Recalde y Gustavo Canteros. En las tres búsquedas, los resultados más recientes tenían fecha 8/7/2026. No se encontró ningún expediente posterior verificable para incorporar.

El detalle de consultas queda en `docs/actualizacion-proyectos-2026/proyectos-posteriores-2026-07-08.json`.

## Automatización e idempotencia

La carga se ejecutó en lotes de 10 mediante `scripts/actualizacion_proyectos_2026.mjs`.

El proceso:

1. valida la integridad del respaldo y que el plan tenga 143 expedientes únicos;
2. crea o actualiza por `EXP-{numero}`;
3. conserva DOCX y materiales útiles;
4. carga el PDF oficial como expediente definitivo;
5. verifica metadatos antes de retirar el identificador legado;
6. guarda un punto de control después de cada proyecto y cada lote;
7. admite `--resume` y omite registros ya confirmados;
8. tolera reanudaciones concurrentes sin duplicar ni fallar por un legado ya retirado.

La ejecución final terminó con 143 expedientes procesados, el registro preservado `P-0067`, cero errores y `success: true`. Una segunda ejecución de reanudación no creó duplicados.

## Control de calidad de datos

La auditoría `scripts/auditar_proyectos_2026.mjs` comparó producción con el plan y descargó nuevamente los 143 expedientes públicos.

Resultado:

- 143 objetivos presentes y en estado `Presentado`;
- 28 leyes, 57 resoluciones y 58 declaraciones;
- 40 coautorías y 103 acompañamientos;
- 0 títulos vacíos;
- 0 resúmenes vacíos;
- 0 fechas vacías;
- 0 identificadores duplicados;
- 143 descargas verificadas por SHA-256;
- 0 errores.

La evidencia completa está en `docs/actualizacion-proyectos-2026/evidencia-produccion.json`.

## Verificación pública

Se probó `https://ceciliagortari.com.ar/proyectos/` con Chromium en:

- escritorio: 1440 × 1000;
- móvil: 390 × 844.

Pruebas superadas en ambos tamaños:

- pestaña “Todos”: 143;
- “Proyectos de autoría”: 40;
- “Proyectos que acompañamos”: 103;
- filtro Ley: 28;
- filtro Educación: 34;
- filtro Aprobado: 59;
- búsqueda por título “Instituto del Nordeste”: 1;
- búsqueda por expediente 19669: 1;
- apertura del detalle;
- texto “Descargar expediente”;
- descarga HTTP 200 con cabecera PDF;
- vista previa HTTP 200 con `application/pdf`;
- expediente definitivo priorizado sobre el DOCX;
- sin errores de consola ni solicitudes propias fallidas;
- sin desborde horizontal en escritorio ni móvil.

Evidencia:

- `docs/actualizacion-proyectos-2026/evidencia-publica.json`;
- `docs/actualizacion-proyectos-2026/captura-escritorio.png`;
- `docs/actualizacion-proyectos-2026/captura-movil.png`.

En Chromium headless el visor PDF embebido aparece vacío en la captura, una limitación del visor del navegador sin interfaz; la URL del mismo iframe respondió 200 con `application/pdf`, y su descarga fue validada byte a byte.

## Pendientes y errores

No quedaron expedientes oficiales pendientes ni errores de carga.

El único caso para decisión humana es `P-0067`, “Declaración de interés: Actividad por el día de la tierra”. No figura en los dos informes y no se obtuvo una ficha oficial inequívoca. No se borró: se conservó con su DOCX, se movió a `Pendiente` y se retiraron la fecha y el estado de trámite para que no aparezca como presentado.

Detalle: `docs/actualizacion-proyectos-2026/expedientes-no-encontrados.json`.

## Cambios en el repositorio

Se agregaron únicamente:

- documentación y matrices de la ejecución;
- evidencia de producción y capturas;
- script idempotente de actualización;
- script de auditoría.

No se modificaron `src/`, `functions/`, migraciones D1, configuración de R2 ni `wrangler.toml`. La credencial temporal del panel no fue almacenada ni usada en archivos, registros, capturas o commits.

## Despliegue

No se requiere ni se realizó un despliegue del sitio: los cambios funcionales fueron únicamente datos escritos mediante la API de producción, y los archivos versionados son documentación y herramientas operativas fuera de `src/`.

Para publicar la documentación en Git, revisar esta rama y abrir un pull request. No hacer merge automático a `main`.
