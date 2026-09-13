# Plan — TASK-022: Documentación de equipo e incorporación de colaboradores

(Consolidado por el agente unificador a partir de un solo rol de brainstorm:
arquitectura. Con uno no hay desacuerdos entre roles que resolver; el
unificador contrasta la propuesta contra el enunciado y verifica lo que
arquitectura dejó como suposición.)

## Enfoque

Crear `docs/contexto/INCORPORACION.md` (arquitectura), mismo patrón que ESTADO/CONVENCIONES/HALLAZGOS, enlazado desde `README.md` y `docs/contexto/README.md`; enlaza instalación (§7.10) y ciclo de vida (`SKILL.md`) sin duplicarlos. Orden: verificar `taskctl --version` como comando suelto, escribir la guía, enlazarla, cerrar el punto 8 de §14.

Corrección propia del unificador sobre el cierre del punto 8: arquitectura propuso una nota aditiva in-place en `PROPUESTA_METODOLOGIA.md` (documento **congelado**, `CONVENCIONES.md:99-101`). Verificado: las 6 decisiones de §14 resueltas *después* del congelado (v15, #1/#2/#9/#11/#12/#13 — `CHECKLIST_TERMINACION.md:531-590`, todas con fecha y atribución a Carlos) se cerraron únicamente ahí; ninguna tocó `PROPUESTA_METODOLOGIA.md` pese a haber "decisión explícita de Carlos" en todas ellas. El punto 8 solo tiene la parte de distribución resuelta desde antes del congelado (línea 385, ya en v15); la parte de "a quién se invita" es una decisión posterior (2026-09-13), igual que las 6 anteriores. Se sigue el patrón verificado: el punto 8 se cierra solo en `CHECKLIST_TERMINACION.md` y `ESTADO.md`, sin editar el documento congelado.

## Desacuerdos resueltos

- ninguno — un solo rol lanzado (arquitectura); no hay discrepancia posible entre roles y no es señal de nada (ver "Sin cubrir" para los puntos de vista que no se lanzaron).

## Riesgos aceptados

- `taskctl` como comando suelto tras `plugin install` no se ha visto funcionar todavía (`CHECKLIST_TERMINACION.md:500-507`, AC7 de E6 "a medias") — arquitectura — se contiene documentando en la guía solo el camino ya probado (`plugin install`, uso en sesión) y marcando el standalone como pendiente, sin prometerlo.
- La guía puede divergir de `taskctl` en cuanto cambien sus comandos — arquitectura — se contiene enlazando `SKILL.md`/§13 en vez de copiar su contenido.
- Cerrar el punto 8 solo en checklist/ESTADO en vez de in-place (corrección del unificador) deja el propio `PROPUESTA_METODOLOGIA.md` con el punto 8 literalmente sin marcar como resuelto del todo en su texto — riesgo aceptado porque es el mismo patrón que ya dejó abiertas en el documento las decisiones #1/#2/#9/#11/#12/#13 sin que nadie lo haya corregido.

## Plan de pruebas

- Cada enlace nuevo (`INCORPORACION.md` ↔ `README.md`, `docs/contexto/README.md`, `SKILL.md`, §7.10, §13) resuelve de verdad — inspección manual — unificador.
- Los comandos de "instalar" citados en la guía (`/plugin marketplace add charliebk/TaskCode`, `/plugin install taskcode-plugin@taskcode-marketplace`) se ejecutan tal cual en una sesión limpia — arquitectura (paso 1 de su orden).
- `taskctl --version` como comando suelto se prueba de verdad antes de incluirlo sin matices en la guía — arquitectura.
- El recorrido de §13 (primera tarea real) se sigue igual desde la guía nueva, sin pasos implícitos que solo el equipo actual ya conoce — unificador (contraste con AC1, "sin ayuda").
- La nota de cierre del punto 8 en `CHECKLIST_TERMINACION.md` sigue el mismo formato que #1/#2/#9/#11/#12/#13: fecha, atribución a Carlos, motivo — unificador.

## Sin cubrir

- AC1 ("que un integrante nuevo pueda seguir sin ayuda"): arquitectura construye la guía pero no propone cómo comprobar que de verdad se sigue sin ayuda — queda como verificación manual (ver Plan de pruebas), no como hecho probado.
- AC2 (guía lista "para cuando" se incorpore alguien, sin ejecutar invitación real hoy): arquitectura no dice si `INCORPORACION.md` deja constancia explícita, dentro de la propia guía, de que hoy no hay a quién invitar, o si eso vive solo en el cierre del punto 8.
- Reflejo en `ESTADO.md`: la convención del propio repo (`CLAUDE.md`, punto 4) pide reflejar el cierre de un ítem también en `ESTADO.md` ("dónde estamos"); la salida de arquitectura no lo menciona, solo `CHECKLIST_TERMINACION.md`.

## Salidas que faltaron

- ninguna — se lanzó un solo rol (arquitectura) y su salida llegó completa.

## Suposiciones no verificadas

- arquitectura asumió sin comprobar que el nombre del repo no estaba ya escrito fuera de esta tarea — **refutado**: `README.md:11` ya trae `/plugin marketplace add charliebk/TaskCode`, y `PROPUESTA_METODOLOGIA.md` (líneas 268 y 402) ya nombra `taskcode-marketplace` — verificado por el unificador.
- arquitectura asumió sin comprobar que no había test simétrico sobre `docs/` raíz — el unificador buscó dirigidamente (no de forma exhaustiva): los tests que mencionan `docs/contexto` o "TaskCode" (p. ej. `test/skills/revisores.test.ts:93`, `test/agents/brainstorm-roles.test.ts:183`) restringen el contenido del PLUGIN, no el de `docs/` en la raíz del repo; no se encontró ningún test que limite esta carpeta, pero no se revisó `npm test` completo.

## Decisión humana pendiente

- Aprobación completa del plan con `taskctl approve` — obligatoria antes de implementar.
- Confirmar el cierre del punto 8 solo en `CHECKLIST_TERMINACION.md`/`ESTADO.md` sin tocar `PROPUESTA_METODOLOGIA.md`: es la corrección que este unificador introduce sobre la nota in-place que arquitectura sí defendía: Carlos puede revertirla si prefiere esa vía.
- Decidir si `INCORPORACION.md` incluye la frase explícita "hoy no hay colaboradores que invitar" (AC2/AC3) o si basta con el cierre del punto 8 en el checklist.
