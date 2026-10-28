# Actualización legislativa — sesión del 28 de octubre de 2026

Fuente: informe oficial de la 18.ª Sesión Ordinaria del 28/10/2026 (`Informe-28-10-26.pdf`, enviado por el equipo; copia en esta carpeta, SHA-256 `b483ce0c…f9de35`). **D1 y R2 de producción no se modificaron.**

## Alcance real de la verificación

| Fuente | Resultado |
| --- | --- |
| Informe de la sesión del 28/10/2026 | Leído completo. 16 expedientes con firma de Gortari, Fernández Recalde o Canteros. El detector de `sincronizar-expedientes-hcd.mjs` encuentra los mismos 16. |
| Fichas oficiales (`hcdcorrientes.gov.ar/expedientes/N/`) | **No verificadas.** La red del entorno bloquea `hcdcorrientes.gov.ar`. |
| D1 de producción | **No consultada**: el entorno no tiene credenciales de Cloudflare y bloquea `api.cloudflare.com` y el sitio. La conciliación usa la instantánea del 22/10/2026 (`docs/legislative-update-2026-10-22/d1-snapshot-2026-10-22.txt`). Ningún número nuevo coincide con ella ni con las altas de 0013. |
| URL oficial del informe | Sin verificar. Por eso la fuente de las altas cita el nombre del archivo y no una URL. |

## Altas: 15 expedientes (`migrations/0014_altas_sesion_2026-10-28.sql`)

Todas entran con fecha de sesión 28/10/2026, `impulso='pendiente'`, sin título oficial ni PDF y sin `verificado_at`.

| Expte. | Tipo | Asunto (del informe) | Estado | Participación |
| --- | --- | --- | --- | --- |
| 20542 | Ley | Carrera y Escalafón Sanitario de la Provincia de Corrientes | En comisión: Legislación del Trabajo | Bloque |
| 20550 | Ley | Programa Provincial "Mi Mérito, Mi Orgullo" | En comisión: Educación | Bloque |
| 20539 | Resolución | Interpelación a los ministros de Seguridad y de Educación (docente Nanci Estela Godoy) | En comisión: Seguridad · Educación | Acompañamos |
| 20543 | Resolución | Reglamentación de la ley 6309 de Actividad Turística | En comisión: Producción | Bloque |
| 20544 | Resolución | Cooperación federal en la búsqueda de la docente Nanci Estela Godoy | En comisión: Seguridad | Acompañamos |
| 20545 | Resolución | Informe sobre establecimientos educativos rurales estatales | En comisión: Educación | Acompañamos |
| 20547 | Resolución | Situación laboral de la docente Godoy y Escuela N.º 626 de El Malezal | En comisión: Educación · Legislación del Trabajo | Acompañamos |
| 20551 | Resolución | Partidas 2027 para el edificio del ISFD de Gobernador Virasoro | En comisión: Hacienda | Bloque |
| 20552 | Resolución | Postergación de la resolución ministerial 875/25 | En comisión: Educación | Bloque |
| 20559 | Resolución | Mantenimiento y reparación de la RN 120 (RN 14 a RN 12) | En comisión: Energía y Obras Públicas | Bloque |
| 20534 | Declaración | 145.º aniversario de la fundación de Sauce | Aprobado, sobre tablas: Declaración 442/26 | Bloque |
| 20546 | Declaración | Muestra Técnica 2026 de la Escuela Técnica Valentín Virasoro, Goya | Aprobado, sobre tablas: Declaración 445/26 | Bloque |
| 20548 | Declaración | Jornada "Nuevas modalidades de las violencias y sus diferentes abordajes" | Aprobado, sobre tablas: Declaración 446/26 | Bloque |
| 20563 | Declaración | 41.º aniversario del Hospital Geriátrico Juana Francisca Cabral | Aprobado, sobre tablas: Declaración 451/26 | Bloque |
| 20564 | Declaración | Día de la Educación Física | Aprobado, sobre tablas: Declaración 452/26 | Bloque |

Total: 10 en comisión y 5 aprobadas; 11 del bloque y 4 que acompañamos.

- 20539 lo firma solo Gortari por el bloque, con Aparicio, Gauna, Lezcano y Vidal Domínguez.
- 20544, 20545 y 20547 llevan nueve firmas: el bloque y Almirón, Aparicio, Gauna, Lezcano, Ojeda y Vidal Domínguez.
- 20563 es distinto de 20556 (Bloque Partido Popular, Declaración 449, agasajo por el mismo aniversario). El informe no los marca como igual tema.

## Actualización de un registro existente: EXP-20332 (pendiente de ficha)

El Orden del Día (punto 08) trata el Despacho 3363 sobre la balsa Goya-Reconquista, con sanción favorable sin modificaciones: **"RESOLUCIÓN 17"**. En D1 figura "En comisiones".

La sentencia está en `actualizaciones-pendientes-de-ficha.sql` (estado `Aprobado`, `Resolución 17/26`, aprobado el 28/10/2026). **No se aplica sin validar la ficha** (regla 7). El número es coherente con la serie de resoluciones del año (04/26 en mayo y 09/26 en junio).

## Existentes sin cambios y plazos

- Ningún otro expediente del informe estaba cargado.
- Plazos de caducidad: ningún proyecto en comisión supera los 2 años. El más antiguo es del 11/03/2026 y vence en marzo de 2028.

## Cifras del sitio (base local con el estado esperado de producción, 0010–0013 aplicadas)

| | Antes | Con 0014 | Con 0014 y 20332 |
| --- | --- | --- | --- |
| Proyectos públicos | 227 | 242 | 242 |
| Esperando ser tratados | 122 (54 %) | 132 (55 %) | 131 (54 %) |
| Del bloque / acompañamos | 212 / 14 | 223 / 18 | 223 / 18 |
| Impulso pendiente | 169 | 184 | 184 |

El total del bloque no incluye P-0067, que no tiene firmantes. Pruebas en `pruebas-funcionales.txt` y capturas en `capturas/`.

## Pendientes

1. **Ficha de 20332**: confirmar Resolución 17/26 y aplicar `actualizaciones-pendientes-de-ficha.sql`.
2. **Fichas de las 15 altas**: título oficial (Asunto), PDF del expediente y verificación de comisiones. Recién entonces completar `verificado_at`.
3. **Impulso**: clasificar las 15 altas desde el panel; entran como `pendiente`.
4. **URL oficial del informe**: reemplazar el nombre del archivo en `fuente` si se quiere enlazar.
5. **Instantánea de D1 de producción**: tomarla antes de aplicar (paso 1 abajo).

## Aplicar en producción (requiere respaldo y autorización expresa)

```bash
# 1. Instantánea y control de cambios desde el panel
npx wrangler d1 execute gestionproyectos --remote --command "SELECT COUNT(*), MAX(updated_at) FROM projects WHERE deleted_at IS NULL AND estado_preparacion='Presentado'"
# 2. Requisitos: columnas de 0010 (esperado 1) y altas de 0013 (esperado 2)
npx wrangler d1 execute gestionproyectos --remote --command "SELECT (SELECT COUNT(*) FROM pragma_table_info('projects') WHERE name='impulso') AS col_0010, (SELECT COUNT(*) FROM projects WHERE id IN ('EXP-20443','EXP-20530')) AS altas_0013"
#    Si col_0010 = 0, aplicar antes 0010 y 0011; si altas_0013 = 0, aplicar 0013 (ver docs/legislative-update-2026-10-22/INFORME.md).
# 3. Respaldo verificado y bookmark
npx wrangler d1 export gestionproyectos --remote --output=backup-gestionproyectos-20261028.sql
grep -c "INSERT INTO \"\?projects" backup-gestionproyectos-20261028.sql   # debe ser > 0
npx wrangler d1 time-travel info gestionproyectos                          # anotar el bookmark
# 4. Altas
npx wrangler d1 execute gestionproyectos --remote --file=migrations/0014_altas_sesion_2026-10-28.sql
npx wrangler d1 execute gestionproyectos --remote --command "SELECT id, estado_tramite, norma_numero FROM projects WHERE id IN ('EXP-20534','EXP-20539','EXP-20542','EXP-20543','EXP-20544','EXP-20545','EXP-20546','EXP-20547','EXP-20548','EXP-20550','EXP-20551','EXP-20552','EXP-20559','EXP-20563','EXP-20564')"   # 15 filas
# 5. Solo después de validar la ficha de 20332
npx wrangler d1 execute gestionproyectos --remote --file=docs/actualizacion-2026-10-28/actualizaciones-pendientes-de-ficha.sql
# Revertir
npx wrangler d1 time-travel restore gestionproyectos --bookmark=<bookmark del paso 3>
```

Las altas aparecen en el sitio en cuanto se aplica la migración, sin volver a desplegar: la API lee D1 y su caché dura como máximo 2 minutos.
