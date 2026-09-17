# Actualización legislativa al 16 de septiembre de 2026

## Alcance y fuentes

Carga en la fuente real de producción (D1 y R2 mediante la API existente), conservando arquitectura, estilos y funcionamiento. Investigación y publicación iniciadas el 16/09/2026; cierre técnico el 17/09/2026. El corte documental es el 16/09/2026.

El último informe local no era julio: ya estaba el archivo suministrado `Informe 16-09-26.pdf`. La producción anterior llegaba al 05/08/2026. Se revisaron 15 sesiones únicas desde el 11/03/2026 y las versiones locales disponibles, además de los dos DOCX auxiliares al 08/07/2026.

Se localizaron cuatro informes posteriores al 08/07: 05/08, 19/08, 26/08 y 16/09. Faltaban localmente tres sesiones (las de agosto), que se descargaron en `Informes HCD actualizado`. También se guardaron la copia oficial de septiembre y la versión oficial actualizada de julio, sin reemplazar originales: cinco archivos descargados en total.

Fuentes principales:

- [Índice oficial de informes HCD](https://hcdcorrientes.gov.ar/sesiones/informe-del-orden-del-dia/).
- [Informe 05/08](https://hcdcorrientes.gov.ar/wp-content/uploads/2026/08/Informe-05-08-26-2.pdf), [19/08](https://hcdcorrientes.gov.ar/wp-content/uploads/2026/08/Informe-19-08-26-3.pdf), [26/08](https://hcdcorrientes.gov.ar/wp-content/uploads/2026/08/Informe-26-08-26-2.pdf) y [16/09](https://hcdcorrientes.gov.ar/wp-content/uploads/2026/09/Informe-16-09-26.pdf).
- Fichas y PDF oficiales de los 49 expedientes agregados; fichas de los 153 expedientes históricos.
- Las 40 páginas del buscador oficial por apellido Gortari y búsquedas por variantes del nombre. Los informes y PDF permiten reconocer casos omitidos por el índice de autores.
- Documentación local de proyectos para corroborar participación sustantiva, sin convertir una firma colectiva en iniciativa individual.

Los archivos JSON de `legislative-update-2026-09-16/` registran las fuentes, decisiones por expediente, hashes SHA-256, inventario y resultados de ejecución. El respaldo integral privado queda fuera del repositorio en `C:\Users\gonza\Documents\Codex\legislative-update-2026-09-16\backup`: 185 proyectos y 216 documentos (40.402.937 bytes), todos íntegros.

## Resultado de la conciliación

Se agregaron **49 expedientes** con sus 49 PDF oficiales: **46 recientes y tres omisiones históricas**. La producción pasa de 185 a 234 registros activos y de 154 a **203 públicos**: 202 expedientes oficiales únicos y el registro histórico P-0067. Los 185 registros anteriores se preservan sin modificaciones.

| Sesión | Expedientes incorporados |
| --- | --- |
| 16/09/2026 | 20413, 20412, 20411, 20410, 20408, 20407, 20406, 20405, 20402, 20401, 20400, 20399, 20398, 20381, 20380, 20367, 20366, 20365, 20364, 20363, 20352, 20351, 20350, 20349 |
| 26/08/2026 | 20332, 20322, 20321, 20320, 20319, 20318, 20317, 20316, 20315, 20314, 20311, 20309, 20308 |
| 19/08/2026 | 20294, 20293, 20292, 20291, 20290, 20289, 20288, 20264, 20262 |
| 17/06/2026 | 20113, 20112 |
| 06/05/2026 | 19947 |

No se eliminaron duplicados ni se corrigieron registros existentes: no se acreditaron errores materiales que justificaran esas acciones. Los 143 expedientes de los DOCX ya estaban cargados. Las 14 diferencias históricas en denominaciones de comisiones son de orden, separadores o singular/plural; se conservó la normalización existente. La fecha de presentación sigue la fecha de sesión utilizada por el sitio, no la de ingreso de Mesa de Entradas.

## Autoría y salvedades

- **12 coautorías**: 20311, 20332, 20349, 20350, 20351, 20352, 20380, 20401, 20405, 20406, 20407 y 20408. El plan detalla la corroboración documental de cada una. Para Cuidados, el antecedente de trabajo previo está registrado, pero su antigua ruta local ya no existe; la presentación y los iniciadores se corroboraron en fuentes oficiales.
- **37 acompañamientos**: participación acreditada, sin evidencia suficiente para atribuir iniciativa individual. No se agregó ninguna autoría exclusiva nueva.
- Salón Blanco Isabel King y Escuela Normal Superior Dr. Mariano I. Loza corresponden al mismo expediente 20408, no a dos iniciativas.
- Yacyretá 20212 ya estaba publicado. El borrador interno P-0069 se conserva como antecedente común de puente 20311 y balsa 20332, dos expedientes distintos.
- SISVIAL y propuestas del Norte Grande: se localizaron materiales de trabajo, pero no un expediente HCD inequívoco; no se inventó presentación ni número.
- P-0067, actividad del Día de la Tierra: permanece como estaba. El documento local acredita iniciativa, pero no se localizó expediente ni sanción inequívoca. La búsqueda negativa no prueba inexistencia y no justifica revertir su edición posterior. Esta excepción impide afirmar que todos los metadatos históricos están plenamente acreditados.
- EXP-20112 está unido a EXP-20104: su PDF oficial comienza con este último. Se verificaron el inicio de 20112 en página 5, firmas en página 8 y Resolución 09/26 en páginas 9–10; se conserva íntegro el archivo oficial.
- Cinco registros de agosto ya tenían cambios editoriales de autoría anteriores a esta tarea. La prueba antigua produjo nueve diferencias contra una instantánea superada; se documentan en `regression-august-original-baseline.json`. La regresión contra la captura real previa a esta actualización pasó sin diferencias; no se revirtieron esas ediciones.

## Implementación y controles

- `scripts/update-legislative-projects.mjs`: validador/importador con simulación por defecto, control de respaldo, detección de cambios concurrentes y auditoría pública. Crea pendientes, adjunta/verifica PDF y recién entonces publica. No sobrescribe registros históricos.
- `legislative-update-2026-09-16/plan.json`: 49 registros, fuentes y decisiones de autoría. SHA-256: `570e9dccebf793856b768d9b7dbf0825f80c527bcea594992aaf5de58a864a16`.
- `src/data/legislative-update.json`: manifiesto de corte y hash del plan servido por producción para comprobar la versión desplegada.
- Sintaxis Node y simulación: aprobadas. Publicación: 49 altas, sin errores.
- Build Eleventy desde directorio vacío: 15 páginas y 174 recursos copiados. Rutas de inicio, proyectos, gestión y novedades y sus recursos locales: verificadas.
- Regresión existente: diez expedientes, diez documentos y cuatro novedades; cero errores contra la captura previa vigente.
- Auditoría completa: recuentos, conservación histórica, cronología descendente, unicidad, detalles y descarga/preview de cada alta, más los documentos públicos históricos. Resultado final en `production-audit.json`.
- El proyecto no define comandos de test/lint en package.json; se utilizaron el validador específico, la regresión existente y la auditoría de producción.

## Git, deployment y navegador

Rama de producción: `main`, integrada con Cloudflare Pages. No se modificaron DNS, secretos, bindings ni infraestructura. El cierre verificable de commit, push, deployment y navegador se registra en `legislative-update-2026-09-16/deployment.json`, agregado después de comprobar el despliegue del commit de contenido. El commit de cierre que contiene ese recibo se identifica mediante `git log -1 --format=%H -- docs/legislative-update-2026-09-16/deployment.json`; un archivo no puede contener su propio hash Git sin autorreferencia.

URL pública: https://ceciliagortari.com.ar/proyectos/

Ejemplo nuevo: https://ceciliagortari.com.ar/proyectos/?id=EXP-20407
