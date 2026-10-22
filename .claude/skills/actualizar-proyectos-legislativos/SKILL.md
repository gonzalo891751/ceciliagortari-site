---
name: actualizar-proyectos-legislativos
description: Actualiza la sección /proyectos/ de ceciliagortari.com.ar con los informes de sesión y las fichas de la Cámara de Diputados de Corrientes. Detecta expedientes nuevos del bloque, aprobaciones, números de norma, cambios de comisión y proyectos que vencen, prepara migraciones D1 revisables, verifica en local y publica. Usar cuando pidan "actualizar los proyectos", "cargar la sesión del …", "subir los expedientes nuevos", "actualizar con el informe de la Cámara" o adjunten un informe o una lista de expedientes.
---

# Actualizar proyectos legislativos

Es la tarea que más se repite en este sitio. Seguí los pasos en orden: cada actualización debe dejar un reporte claro de **altas, actualizaciones, existentes y pendientes** antes de tocar la base.

## Reglas que no se negocian

Las fijó el equipo de Cecilia Gortari y valen siempre:

1. **D1 de producción:** no escribir sin un **respaldo verificado** y la **autorización expresa** del usuario para esa escritura. La autorización para publicar código no alcanza para la base. Las consultas `SELECT` sí están permitidas.
2. **R2:** no sobrescribir ni borrar archivos sin comprobar antes sus referencias en `project_documents` y su contenido.
3. **No inventar.** Ningún campo se completa sin respaldo documental: informe de sesión, ficha oficial o PDF del expediente. Si falta un dato, va vacío y se informa como pendiente.
4. **Autoría formal ≠ impulso político.**
   - `firmantes` es lo que dice el expediente.
   - `impulso` (`cecilia`, `emiliano`, `gustavo`, `conjunto`, `otros` o `pendiente`) solo lo define el equipo.
   - No asumir que un proyecto firmado por los tres lo impulsó Cecilia. Toda alta nueva entra con `impulso='pendiente'`.
5. **Identificar siempre por número de expediente** (`EXP-NNNNN`), nunca por título. Tratar por separado los expedientes que tramitan juntos o tienen títulos parecidos; ya hubo casos como 20332, 20367, 20496 y 20530.
6. **Declaraciones y resoluciones con número** (por ejemplo, "Declaración 438/26") cuentan como aprobadas: `estado_tramite='Aprobado'` y `norma_*` completos.
7. **Cambiar estados solo con la ficha individual.** Un cambio de estado de un expediente ya cargado se valida contra su ficha (`https://hcdcorrientes.gov.ar/expedientes/N/`), no solo contra el informe.
8. **No publicar** borradores sin número de expediente como si estuvieran presentados.
9. **No publicar anexos internos** ni documentos con datos personales.
10. **Voz del sitio:** primera persona del plural ("presentamos", "acompañamos"). Usar "De autoría", no "Impulsados por Cecilia".

## Mapa del sistema

| Pieza | Dónde |
| --- | --- |
| Base | D1 `gestionproyectos` (binding `DB`, id `72124dc1-c97a-45c6-8f75-006d9ca62714`), tablas `projects` y `project_documents` |
| Archivos | R2 `ceciliagortari-projects` (binding `PROJECTS_BUCKET`) |
| API pública | `functions/api/projects/public.js` → `lib/proyectos-publicos.mjs` (detecta columnas con `PRAGMA`, así que funciona antes y después de las migraciones) |
| Reglas compartidas | `lib/legislativo.mjs`: participación, impulso, estados, enlaces oficiales y norma |
| Respaldo oficial | `lib/datos-oficiales.mjs`. Completa campos vacíos y lo cargado en D1 siempre tiene prioridad |
| Sitio | `src/proyectos/index.njk`, `src/assets/js/proyectos.js`, `src/assets/js/legislativo-core.js` (contadores, reloj de caducidad, tarjetas) y la vidriera de la portada en `src/assets/js/legislativo-home.js` |
| Panel interno | `/gestionproyectos/` con sesión en el servidor (secreto `ADMIN_PIN`). Ahí se cargan los PDF y se clasifica el impulso |
| Scripts | `scripts/conciliar-auditoria-preliminar.mjs` (altas desde informes), `scripts/sincronizar-expedientes-hcd.mjs` (cambios desde fichas), `scripts/update-legislative-projects.mjs` (publica un plan por la API con `ADMIN_PIN`) |
| Antecedentes | `docs/legislative-update-2026-10-22/INFORME.md` (último informe completo y formato de referencia) |

Fuentes oficiales:
- Informes de sesión (PDF): `https://hcdcorrientes.gov.ar/sesiones/tratamiento-parlamentario/`. Las URL suelen tener la forma `https://hcdcorrientes.gov.ar/wp-content/uploads/AAAA/MM/Informe-DD-MM-AA.pdf`.
- Fichas: `https://hcdcorrientes.gov.ar/expedientes/<número>/`.

Si la red del entorno bloquea `hcdcorrientes.gov.ar` (ya pasó), pedile al usuario los PDF de los informes o una lista con número, tipo, asunto, firmantes, comisiones y norma. No sigas con datos supuestos.

## Paso a paso

Trabajá en una carpeta nueva: `docs/actualizacion-AAAA-MM-DD/`.

### 1. Instantánea de D1, solo lectura

Con la herramienta de consultas D1 (Cloudflare) o `npx wrangler d1 execute gestionproyectos --remote --command "…"`:

```sql
SELECT p.id, p.fecha_presentacion, p.estado_tramite, p.tipo_autoria,
  (SELECT COUNT(*) FROM project_documents d WHERE d.project_id = p.id AND d.kind = 'main') AS docs_main,
  (SELECT COUNT(*) FROM project_documents d WHERE d.project_id = p.id AND d.kind = 'expediente') AS docs_expediente,
  p.comisiones
FROM projects p
WHERE p.deleted_at IS NULL AND p.estado_preparacion = 'Presentado'
ORDER BY p.id;
```

Guardalo como `d1-snapshot-AAAA-MM-DD.txt`, con el formato de `docs/legislative-update-2026-10-22/d1-snapshot-2026-10-22.txt`: líneas `id|fecha|estado|autoria|docs_main|docs_expediente|comision1;comision2` y encabezado con `#`. Anotá también `MAX(updated_at)` para saber si alguien editó desde el panel.

### 2. Auditoría de los informes

Armá `auditoria.json` con el esquema de `docs/legislative-update-2026-10-22/auditoria-preliminar-49.json`:

```json
{
  "descripcion": "Qué informes se revisaron y cuándo",
  "informes": { "AAAA-MM-DD": "URL del PDF del informe" },
  "expedientes": [
    { "sesion": "AAAA-MM-DD", "numero": "20530", "tipo": "Declaración", "asunto": "…",
      "comisiones": [], "sobre_tablas": true, "norma": "438/26",
      "firmantes": "Canteros, Fernández Recalde y Gortari", "adjuntos": ["20531"] }
  ]
}
```

- `tipo` es `Ley`, `Resolución` o `Declaración`.
- `norma` es `null` si no se aprobó.
- `sobre_tablas: true` cuando se trató sin giro a comisión.
- `adjuntos` y `mismo_tema` son opcionales.
- Incluí todos los expedientes donde figure Gortari, Fernández Recalde o Canteros.

Con un PDF a mano, `node scripts/sincronizar-expedientes-hcd.mjs --informe Informe.pdf --out docs/actualizacion-…` detecta los números del bloque (usa `pdftotext`) y lee cada ficha si hay red.

### 3. Conciliar y preparar las altas

```bash
node scripts/conciliar-auditoria-preliminar.mjs --dir docs/actualizacion-AAAA-MM-DD \
  --auditoria docs/actualizacion-AAAA-MM-DD/auditoria.json \
  --snapshot docs/actualizacion-AAAA-MM-DD/d1-snapshot-AAAA-MM-DD.txt \
  --migracion migrations/00NN_altas_sesion_AAAA-MM-DD.sql \
  --nota "Alta desde informe oficial de sesión (actualización DD/MM/AAAA); impulso sin clasificar."
```

- `00NN` es el número de migración siguiente al último de `migrations/`.
- Genera `conciliacion-auditoria-preliminar.json` con cuatro listas: existentes que coinciden, existentes con diferencias, altas y pendientes.
- Las altas entran con `INSERT … ON CONFLICT(id) DO NOTHING` y no tocan registros existentes.
- Revisá **cada** diferencia contra la ficha oficial antes de convertirla en `UPDATE` (regla 7). `sincronizar-expedientes-hcd.mjs --expedientes 20413,20450` arma `actualizaciones.sql` para aprobaciones, normas y firmantes.

### 4. Plazos de caducidad

Los expedientes caducan a los **2 años** de presentados si no se tratan (`CADUCIDAD_ANIOS` en `legislativo-core.js`). El reloj y los "próximos vencimientos" se recalculan solos con la fecha del día.

En cada actualización:
- Listá los proyectos `En comisiones` con `fecha_presentacion` de hace más de 2 años. El sitio ya los separa como "superaron el plazo".
- Verificá su ficha. Si la Cámara los dio por caducos, proponé `estado_tramite='Caducado'`: `grupoEstado` lo agrupa como archivado.

### 5. Verificar en local

1. `node node_modules/@11ty/eleventy/cmd.cjs` para compilar. `.bin/eleventy` es un atajo de Windows y acá no funciona.
2. `npx wrangler pages dev dist --d1 DB=… --r2 PROJECTS_BUCKET=… --persist-to <carpeta temporal>`.
3. Aplicá las migraciones nuevas con `npx wrangler d1 execute gestionproyectos --local --persist-to <misma carpeta> --file=…`.
4. Revisá:
   - `/api/projects/public`: cantidad total y los nuevos, sin números de expediente duplicados.
   - `/proyectos/`: contadores, "Esperando ser tratados", reloj, filtros, vista lista y descarga.
   - Portada: vidriera, contadores y últimos expedientes.
   - Sin errores de JavaScript y sin scroll horizontal a 375 px.

### 6. Reportar y pedir autorización

Antes de cualquier escritura en producción, mostrale al usuario:
- Altas, con número, tipo, asunto, sesión, estado y participación (bloque o acompañamos).
- Actualizaciones de registros existentes, cada una con su fuente.
- Existentes sin cambios.
- Pendientes: título oficial, PDF, impulso a clasificar, sesiones sin informe y fichas sin verificar.
- Cifras antes y después: total, esperando ser tratados y su porcentaje.

Después pedí autorización expresa para escribir en D1.

### 7. Aplicar en producción (solo con autorización)

```bash
npx wrangler d1 export gestionproyectos --remote --output=backup-gestionproyectos-AAAAMMDD.sql   # respaldo
npx wrangler d1 time-travel info gestionproyectos                                               # anotar el bookmark
npx wrangler d1 execute gestionproyectos --remote --file=migrations/00NN_….sql
```

Verificá el respaldo (que el archivo exista y contenga `INSERT INTO projects`) **antes** de aplicar. Después:
- Comprobá con `SELECT COUNT(*)` y una consulta por los números nuevos.
- Abrí el sitio.
- Para revertir: `npx wrangler d1 time-travel restore gestionproyectos --bookmark=<bookmark>`.

Si alguna de las columnas de `migrations/0010` todavía no existe en producción, aplicá antes `0010` y `0011` con el mismo procedimiento.

### 8. Cerrar

- Actualizá `verificado_at` en los registros verificados contra su ficha. No lo completes en los que solo salen del informe.
- Escribí `docs/actualizacion-AAAA-MM-DD/INFORME.md` breve, con fuentes, resultados, pendientes y comandos aplicados.
- Rama nueva, commit, PR y merge según lo que haya autorizado el usuario para publicar código. Cloudflare Pages despliega `main` automáticamente.
- Recordá al equipo qué queda para el panel: subir PDF, completar el título oficial y clasificar el impulso.
