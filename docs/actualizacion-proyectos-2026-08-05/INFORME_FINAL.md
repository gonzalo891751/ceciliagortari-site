# Actualización integral de proyectos — sesión del 5 de agosto de 2026

## Resultado

La actualización fue completada, publicada y verificada en producción. Se incorporaron diez expedientes legislativos, diez PDF oficiales y cuatro novedades con imágenes propias. La rama de trabajo fue integrada a `main`, desplegada en Cloudflare Pages y comprobada en escritorio y móvil.

- Sitio: <https://ceciliagortari.com.ar>
- Proyectos: <https://ceciliagortari.com.ar/proyectos/>
- Novedades: <https://ceciliagortari.com.ar/novedades/>
- Fecha de ejecución: 5 de agosto de 2026

## Fuente y control documental

El insumo fue `Informe 05-08-26.pdf`, de 10 páginas. Se validó su estructura, se extrajo el contenido completo y se realizó una revisión visual de páginas representativas. SHA-256 del informe: `799F86E73CBDBA8ECDBA295AB4F7B1CE9E48C63471D77D707CE6D1043068120C`.

Los diez expedientes se contrastaron con las fichas públicas de la Honorable Cámara de Diputados de Corrientes. Los diez PDF oficiales respondieron HTTP 200, fueron reconocidos como PDF, no estaban vacíos y quedaron registrados con tamaño y SHA-256 en `manifiesto-expedientes.json`.

Anomalía conservada y documentada: la ficha y la URL oficial del expediente 20225 corresponden al 20225 y su objeto, tipo e iniciadores coinciden; sin embargo, la primera línea interna del PDF oficial dice `EXPTE 20254`. No se alteró el documento oficial ni se encontró una variante corregida.

## Respaldo previo y reconciliación

Antes de modificar producción se creó un respaldo en `work/backups/proyectos-20260805-150932`:

- 178 proyectos relevados.
- 206 documentos descargados y verificados.
- 0 documentos vacíos o fallidos.
- 39.319.850 bytes respaldados.

Se reconciliaron tres borradores ya existentes, evitando duplicaciones:

- `P-0086` → `EXP-20212`.
- `P-0089` → `EXP-20214`.
- `P-0088` → `EXP-20215`.

Sus documentos principales fueron copiados y verificados en los identificadores definitivos; recién después los registros anteriores fueron dados de baja lógica. No se eliminó ningún documento.

## Proyectos incorporados

| Expediente | Tipo | Título público | Autoría | Estado |
|---|---|---|---|---|
| [20211](https://ceciliagortari.com.ar/proyectos/?id=EXP-20211) | Resolución | Pedido de informes sobre obras públicas anunciadas por el Gobierno Provincial | Coautoría | En comisiones |
| [20212](https://ceciliagortari.com.ar/proyectos/?id=EXP-20212) | Ley | Aprovechamiento social y productivo de las regalías de Yacyretá | Coautoría | En comisiones |
| [20213](https://ceciliagortari.com.ar/proyectos/?id=EXP-20213) | Ley | Efectividad e implementación de las leyes provinciales | Acompañado | En comisiones |
| [20214](https://ceciliagortari.com.ar/proyectos/?id=EXP-20214) | Ley | Adopción del nuevo Símbolo Internacional de Accesibilidad Universal | Coautoría | En comisiones |
| [20215](https://ceciliagortari.com.ar/proyectos/?id=EXP-20215) | Resolución | Reforma del Reglamento para evitar la paralización de los proyectos | Coautoría | En comisiones |
| [20224](https://ceciliagortari.com.ar/proyectos/?id=EXP-20224) | Ley | Regulación de la sedación consciente en odontología | Acompañado | En comisiones |
| [20225](https://ceciliagortari.com.ar/proyectos/?id=EXP-20225) | Ley | Actualización de la Ley de Accesibilidad Cognitiva y Lectura Fácil | Acompañado | En comisiones |
| [20226](https://ceciliagortari.com.ar/proyectos/?id=EXP-20226) | Declaración | Reconocimiento a las cabañas correntinas premiadas en Palermo | Acompañado | Aprobado |
| [20231](https://ceciliagortari.com.ar/proyectos/?id=EXP-20231) | Declaración | Actividades en honor a San Cayetano, patrono del trabajo | Acompañado | Aprobado |
| [20232](https://ceciliagortari.com.ar/proyectos/?id=EXP-20232) | Declaración | Conmemoración del Día Nacional de la Educación Especial | Acompañado | Aprobado |

Totales comprobados: 5 proyectos de ley, 2 de resolución y 3 de declaración; 4 de coautoría y 6 acompañados; 3 aprobados y 7 en comisiones.

## Novedades publicadas

Se redactaron cuatro notas con lenguaje fiel al estado parlamentario, sin presentar propuestas en tratamiento como normas aprobadas:

- [Estado y financiamiento de obras públicas](https://ceciliagortari.com.ar/novedades/detalle/?id=2026-08-05-informes-obras-publicas).
- [Regalías de Yacyretá y desarrollo para Corrientes](https://ceciliagortari.com.ar/novedades/detalle/?id=2026-08-05-regalias-yacyreta).
- [Símbolo de accesibilidad universal](https://ceciliagortari.com.ar/novedades/detalle/?id=2026-08-05-simbolo-accesibilidad-universal).
- [Mecanismos contra la paralización en comisión](https://ceciliagortari.com.ar/novedades/detalle/?id=2026-08-05-reforma-reglamento-comisiones).

Cada nota incluye enlaces a la ficha del proyecto y a su PDF. Se generaron cuatro imágenes WebP de 1600 × 900, coherentes con cada tema y sin texto institucional inventado.

## Validación técnica y funcional

- Carga inicial: 10 proyectos creados, 10 documentos oficiales asociados, 0 errores.
- Reanudación idempotente: 10 registros actualizados semánticamente, 0 PDF vueltos a subir, 0 documentos remigrados y todos los identificadores estables.
- Estado público final: 185 proyectos activos, sin duplicados para los diez expedientes.
- `npm ci` y `npm run build`: correctos con Eleventy 3.1.2.
- Auditoría de novedades: 45 notas totales, 0 errores y 0 advertencias.
- Auditorías local, preview y producción: correctas.
- Los diez PDF se descargan desde la API pública y conservan formato PDF.
- Búsqueda individual de los diez expedientes: una tarjeta correcta por búsqueda.
- Enlaces profundos `?id=EXP-...`: modal correcto y descarga visible.
- QA visual: 1440 × 1000 y 390 × 844, sin desborde horizontal.
- Las cuatro novedades, sus enlaces y sus imágenes fueron verificadas en producción.
- Consola del navegador: 0 errores.

El análisis de dependencias informa 8 vulnerabilidades transitivas preexistentes (1 moderada, 6 altas y 1 crítica). No se aplicó una actualización indiscriminada porque no forma parte de esta publicación y podría introducir cambios incompatibles; queda registrado como deuda técnica separada.

## Git y despliegue

- Rama: `feat/sesion-2026-08-05-proyectos`.
- Commit de proyectos: `0492eb3`.
- Commit de novedades: `b8fe47c`.
- Integración: avance rápido a `main`.
- Preview validado: <https://8a8d35f0.ceciliagortari-site.pages.dev>.
- Despliegue de producción: Cloudflare Pages, control principal satisfactorio.

## Evidencia

La carpeta `docs/actualizacion-proyectos-2026-08-05` conserva la matriz completa en JSON/CSV, hashes de los documentos, respaldo previo, resultados de carga y reanudación, auditorías local/preview/producción y capturas de escritorio y móvil.

Estado de cierre: actualización publicada, datos y documentos accesibles, novedades visibles, evidencia preservada y sin pendientes funcionales de esta entrega.
