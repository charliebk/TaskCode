# Plan — TASK-082: Autorrevision del implementador antes de pedir revision

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

- Fuente única = la sección `## Que se revisa` de cada revisora, sin fichero nuevo; se unifica el título en `csharp-autocad-ifc-reviewer` (arquitectura).
- Se crea `src/core/autorrevision.ts` (puro, `avisoAutorrevision(body, id)`, vía `rangoDeSeccion`), y `commands/review.ts` mete su resultado en `avisos` tras la lectura fresca (arquitectura).
- `skills/review/SKILL.md` añade un subpaso antes de `taskctl review`: leer solo `## Que se revisa`, corregir, anotar `## Autorrevision` en `tarea.md` y commitear (arquitectura; lo del commit, también riesgos).
- Orden: 1) ancla, 2) core, 3) enganche en `review.ts`, 4) texto de la skill (arquitectura); 5) `revisores` en `siguiente --json` solo si se aprueba la decisión 1.

## Desacuerdos entre roles, y como se resuelven

- Dónde vive la lista — arquitectura: en la `## Que se revisa` que ya existe, descarta `comprobacion.md` / riesgos: sus tres primeros modos de fallo dan por hecho que la lista se extrae a un fichero compartido — gana arquitectura — cumple el criterio 3 sin mover el bloque ```yaml de enrutado y anula esos tres modos de fallo; no es un choque frontal (riesgos pide «decidir ya que la lista es parte de la skill»), pero sí cambia lo que se prueba.
- Qué cuenta como constancia — arquitectura: «detecta la sección» con `rangoDeSeccion` / riesgos: exigir contenido debajo del encabezado — gana riesgos — si la plantilla trae el encabezado vacío, toda tarea pasa sin aviso; cuesta una comprobación más.
- Canal del aviso — arquitectura: `[AVISO]` por stderr (`cli.ts:701`) basta / riesgos: en modo automático un aviso solo en stderr «es decorativo» — gana arquitectura en esta tarea — el criterio dice literalmente «avisa, sin bloquear»; lo de riesgos entra como riesgo aceptado y como decisión 4.
- Rondas incrementales — arquitectura: lo deja como suposición de dominio / riesgos: la constancia de la ronda 1 tapa la N+1, hay que decidir si es por ronda o única — sin ganador: ningún rol lo fundamenta — decisión 2.

## Riesgos aceptados y que los contiene

- Aviso por stderr ignorado en modo automático — riesgos — la autorrevisión es un paso explícito de la skill `review`; decisión 4.
- Lista equivocada (p. ej. 4 dominios caen al genérico por `umbral_dominios`) — riesgos — `revisores` en `siguiente --json` desde la misma función que `runReviewCommand` (arquitectura); si se rechaza, la imprecisión queda aceptada aquí.
- Una excepción del aviso después de los `writeFile` con `wx` deja la ronda a medias — riesgos — cálculo antes de la primera escritura, y una función total que nunca lanza.
- Constancia sin commitear: `review` aborta por workspace sucio y el aviso no se ve — riesgos — la skill manda commitear antes de `taskctl review`.
- Tareas ya en curso avisarán en su próximo `review` — riesgos — el texto del aviso dice qué hacer.
- El revisor lee «autorrevisado» en `tarea.md` y se ancla — riesgos — formato neutro (decisión 3).

## Plan de pruebas

- `avisoAutorrevision`: sin sección → aviso; solo encabezado → aviso; con contenido → `null`; nunca lanza — tests unitarios sobre cadenas — arquitectura + riesgos.
- `taskctl review` sin constancia → `[AVISO]` en stderr, código 0, ronda creada; con constancia commiteada → sin aviso — repo Git temporal — criterio 2, riesgos.
- Tras renombrar el ancla, el catálogo cargado sigue con 4 dominios + 1 genérico — `cargarCatalogoRevisores` sobre las skills reales — riesgos.
- Las 5 revisoras tienen `## Que se revisa` exacto y `review/SKILL.md` remite a esa sección sin copiar viñetas ni nombrar TaskCode — tests de skills (estilo 10e) — arquitectura.
- Si se aprueba la decisión 1: `siguiente --json` devuelve los mismos revisores que reparte `review` para el mismo diff — repo Git temporal — arquitectura.
- `npm test` en verde salvo los tres rojos conocidos de Windows — suite completa — criterio 4.

## Sin cubrir

- No se lanzó el rol de dominio (2 roles por complejidad). Las reglas que los dos roles le delegan (rondas, `code-quality-reviewer`, neutralidad del texto) se aplican sin él → decisiones 1-3.
- Los campos de cada línea de `## Autorrevision`: arquitectura solo dice «una línea por revisora pasada» → los fija la persona en la decisión 3.
- La heurística da «simple» y la tarea dice «media». Ningún rol lo discute; la propuesta de `siguiente --json` es lo que empuja hacia media → decisión 1.

## Salidas que faltaron

- ninguna (las dos salidas pedidas llegaron rellenas).

## Suposiciones no verificadas

- Añadir `revisores` al JSON de `siguiente` no rompe a quien lo consume — arquitectura — `src/commands/siguiente.ts:24-38` y `task-workflow/avance.md`.
- Ningún lector del cuerpo de `tarea.md` falla ante una sección nueva — riesgos — `core/transiciones.ts`, `core/metricas.ts`, finish.
- La plantilla de `tarea.md` sale de `taskctl new` (y no se sabe si traerá el encabezado vacío) — riesgos — `src/commands/new.ts`.
- `code-quality-reviewer` entra solo como reserva — arquitectura — regla de dominio, no verificada.

## Lo que necesita decision de una persona

Este plan no vale hasta que una persona lo apruebe con `taskctl approve`. Antes, cerrar:

1. ¿Se añade `revisores: string[]` a `taskctl siguiente --json` en fase review, desde una función compartida con `runReviewCommand`? — **Recomiendo: sí** (arquitectura), y que `code-quality-reviewer` entre cuando lo diga el clasificador, ni siempre ni a ojo. Es la única forma de cerrar el escenario de la lista equivocada (riesgos), pero amplía la tarea más allá de la heurística «simple».
2. ¿La constancia vale una vez por tarea o por ronda? — **Recomiendo: una vez.** El aviso solo salta si falta `## Autorrevision` con contenido; la skill pide repetirla en cada ronda, pero no se comprueba. Que sea por ronda (ligada al commit, como propone riesgos) se deja para otra tarea si los datos de ToolsaWeb lo piden.
3. ¿Formato de cada línea? — **Recomiendo: `- <revisora> — <commit>` y nada más**, prohibido escribir juicios del tipo «sin hallazgos», para no anclar al revisor (riesgos).
4. ¿Basta el `[AVISO]` por stderr o el aviso tiene que salir también en `siguiente --json` para el modo automático? — **Recomiendo: basta stderr** en esta tarea (es lo que dice el criterio); llevarlo al JSON, como apunta riesgos, queda como mejora aparte.

## Decisiones tomadas por la persona (2026-11-07)

1. **Revisoras antes de `review`**: sí. `taskctl siguiente TASK-NNN --json` devuelve `revisores: string[]` en la fase review, calculado por una función compartida con `runReviewCommand` (el mismo clasificador, sin copia). `code-quality-reviewer` entra cuando lo diga el clasificador.
2. **Constancia**: una vez por tarea. El aviso salta solo si falta `## Autorrevision` con contenido debajo; la skill pide añadir una línea por ronda, pero el CLI no lo comprueba.
3. **Formato de cada línea**: `- <revisora> — <commit>` y nada más, sin juicios («sin hallazgos») que anclen al revisor.
4. **Canal del aviso**: solo `[AVISO]` por stderr en `taskctl review`. Que salga también en `siguiente --json` queda como mejora aparte.
