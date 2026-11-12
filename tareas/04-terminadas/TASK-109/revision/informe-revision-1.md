# Informe de revision — TASK-109 (ronda 1)

- Commit revisado: 5d13a1b081e7f9c16fcd0ff66faa501b038cd1a8
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: cambios-solicitados

Veredicto propuesto por el revisor: aprobada-con-correcciones. Con dos IMPORTANTE abiertos se escribe cambios-solicitados.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | verificacion-selectiva.md (§ «Cobertura omitida»), README.md (viñeta de cobertura), CHANGELOG.md (párrafo del nivel 2) | especificacion |
| IMP-2 | IMPORTANTE | corregido | verificacion-selectiva.md y README.md (viñeta del guardián), SKILL.md (línea equivalente); también `LINEA_SELECTIVA` de hooks/guardia-merge.ts | implementacion |
| MEN-1 | MENOR | corregido | verificacion-selectiva.md (§ «Release y hotfix van siempre a la completa»), CHANGELOG.md, README.md | implementacion |
| MEN-2 | MENOR | corregido | README.md (viñeta de `taskctl finish`) y CHANGELOG.md («deciden igual») | implementacion |
| MEN-3 | MENOR | aceptado | core/verificacion-proporcional.ts `decidirVerificacion` | plan |
| MEN-4 | MENOR | aceptado | SKILL.md (tamaño), README/CHANGELOG sin test | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — «La cobertura se mide en la completa del release» no es cierto

La guía, el README y el CHANGELOG dicen que, con la selectiva, la puerta de cobertura no se evalúa y que «se mide en la completa del release». El código no lo hace: `finish.ts:476` llama a `puertaCobertura` con `ramaBase = ramaIntegracion` también en un release, y `coberturaDeRama` mide solo las líneas añadidas desde el merge-base de HEAD con esa base, es decir, lo que la rama release añade sobre develop (CHANGELOG y versión). El código de la tarea ya está en develop, así que el release no lo mide.

Reproducción con el `dist` compilado: `develop` que ya integró una feature con 3 líneas sin cubrir en `src/x.js`, rama `release/2.0` con solo un commit de CHANGELOG, lcov con `DA:4,0 DA:5,0 DA:6,0`. `coberturaDeRama(cwd,'develop',...)` devolvió `{"ficheros":[],"sinInstrumentar":["CHANGELOG.md"],"ejecutables":0,"cubiertas":0,"porcentaje":null}`; con `ejecutables === 0`, `cumpleUmbral` devuelve true (`cobertura-cambios.ts:197`).

Consecuencia: con el nivel 2 y `umbral_cobertura`, las líneas de una tarea integrada con la selectiva no se comparan con el umbral en ningún sitio. Corrección: redactarlo como «no se mide en `finish` con la selectiva; el release corre la completa, pero su puerta solo mide lo que añade la propia rama release», o abrir una tarea para medirla de verdad.

### IMP-2 — El remedio documentado tras un conflicto de `finish` no lo respalda el código

Los textos dicen: «si `finish` falla a mitad (un conflicto), resuelve el conflicto y vuelve a lanzar `taskctl finish`, que verifica y mergea por su cuenta». Lo que hace el código:
- `merge-feature-to-develop.sh` hace `checkout develop` y `git merge --no-ff`; ante un conflicto sale con error y deja el merge en curso sobre develop (`_gitflow-common.sh` ~l.466-474).
- Si la persona resuelve terminando ese merge en develop, `rama` ya es ancestro de develop y el reintento entra por el camino idempotente (`finish.ts` ~l.538), que no ejecuta ninguna puerta de verificación.
- El guardián no ve ese `git commit`.
- Si deja el merge a medias y relanza, `puertaVerificacion` aborta con «la rama activa es develop».

Leído en el código, no ejecutado de punta a punta. Corrección: `taskctl abort-merge`, integrar develop en la rama de la tarea y resolver ahí, y relanzar `finish` desde la rama de la tarea. El mensaje del guardián (`LINEA_SELECTIVA`) usa la misma formulación.

### MEN-1 — «Release y hotfix van siempre a la completa» es inexacto para un hotfix de solo documentación

`finish.ts:468` pasa `ramaBase` también a un hotfix y solo le niega `permitirSelectiva`: un hotfix de solo documentación conserva su camino de documentación (test `finish-parcial` «un hotfix de solo documentacion conserva su camino de la 0.14.0»). Frase correcta: «un hotfix nunca usa la selectiva del nivel 2 (con código, la completa)». La prueba de la guía fija la frase literal: cambiar marca y texto a la vez.

### MEN-2 — Frases del README y del CHANGELOG que no distinguen el nivel 2

- README, viñeta de `taskctl finish`: «en rojo, el mensaje recuerda que se exige aunque las rondas usaran la selectiva». Con el nivel 2 y una decisión tomada, `textoDeLaCompleta` dice «porque <motivo>» y no lo recuerda.
- CHANGELOG: «El freno Stop, review y finish deciden igual sobre el mismo diff». Stop y review corren la selectiva siempre que haya código; `finish` corre la completa si el código sale de las rutas parciales. Decide igual la clasificación solo-documentación.

### MEN-3 — Código sin uso sin inventariar

En `decidirVerificacion`, las ramas `!docs && selectiva === null`, `!docs && diff.fueraDeDocs.length === 0` y el uso de `docs` sin `rutas_documentacion` son inalcanzables desde producción (el único llamador, `decidirVerificacionEntre`, devuelve `null` antes). Las ejercitan tests unitarios de la función pura. No es un fallo; conviene dejar el inventario escrito en el Resultado.

### MEN-4 — Margen y cobertura de prueba

- `SKILL.md` pesa 15352 bytes con CRLF en Windows y el límite es 15360: 8 bytes de margen.
- README y CHANGELOG no tienen prueba (aceptado en el plan). Mutar la viñeta del guardián del README no pone nada rojo.

## Reproduccion y verificacion

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-109-r1` (más un clon de mutantes y un repo de demostración, borrados). `npm install` y `npm run build` sin errores.
- Suite completa (una vez): 2223 tests, 2219 pasan, 3 fallan (los conocidos de Windows), 1 omitido.
- Mutantes: borrar la sección «Codigo parcial» (muere), cambiar «Release y hotfix...» (muere), `SKILL.md` «un merge a mano no» por «si» (muere), revertir el ejemplo por clave (muere), quitar el aviso de doctor (muere), cambiar la viñeta del guardián del README (no muere: sin prueba, aceptado).
- Doctor en la práctica: nivel 2 sin `rutas_documentacion` da `[AVISO]` con `Arreglo:`; con ellas, `[ok]` con el texto nuevo; valor inválido en cada clave de patrones da su ejemplo propio.
- Afirmaciones contrastadas y ciertas: rutas leídas de la base; diff vacío o cambio de config a la completa; reutilización del memo selectivo solo verde, con árbol limpio, mismo commit y base; `timeout_verificacion_selectiva` y `RAMA_BASE` en `finish`; `## Verificacion parcial` antes del merge; el guardián exige la completa; Stop y review corren la selectiva con código; release a la completa; sin `rutas_documentacion` no hay efecto.
- Lo añadido a ficheros instalables no contiene «TaskCode» ni `TASK-NNN`.

## Lecturas fuera del contexto permitido

Para contrastar la documentación con el código: `src/core/verificacion-proporcional.ts`, `src/fs/decision-documentacion.ts`, `src/commands/finish.ts`, `finish-verificacion.ts`, `finish-cobertura.ts`, `src/fs/cobertura.ts`, `src/core/cobertura-cambios.ts`, `src/hooks/guardia-merge.ts`, `src/core/transiciones.ts`; `scripts/gitflow/merge-feature-to-develop.sh` y `_gitflow-common.sh`; `test/commands/finish-parcial.test.ts` y `test/skills/task-workflow.test.ts`; `bin/taskctl` y `package.json`.

## Respuesta del implementador

- IMP-1, IMP-2, MEN-1 y MEN-2 corregidos en la guia, el README, SKILL.md, el CHANGELOG y el mensaje del guardian (`LINEA_SELECTIVA`), con sus marcas en las pruebas de la guia, de SKILL.md y del guardian.
- MEN-3 aceptado: las ramas `!docs` de `decidirVerificacion` son defensa de la funcion pura (la ejercitan sus tests unitarios); el inventario de codigo sin uso (nada que borrar) queda en el Resultado.
- MEN-4 aceptado: SKILL.md sigue por debajo de 15 KB tambien con CRLF (15349 bytes); README y CHANGELOG sin prueba, como acepto el plan.
