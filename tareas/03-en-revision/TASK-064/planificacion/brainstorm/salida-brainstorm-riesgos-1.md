# Brainstorm — TASK-064, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Hallazgos contados dos o mas veces entre rondas.** Sumar las filas de todos los `informe-revision-N*.md` repite hallazgos: TASK-057 repite MEN-1 y MEN-5 en las rondas 2 y 3 con estado `corregido`, y otras 12 tareas terminadas tienen filas `corregido` en rondas 2 o 3 (comprobado). «IMPORTANTE por tarea» y «CRIT+IMP» salen inflados justo en las tareas con mas rondas. Mitigacion: decidir (con dominio) si se cuenta cada ID una vez por tarea o cada hallazgo en la ronda en que aparecio, y que la salida diga que criterio usa.
2. **Choque de IDs entre proyectos con `--repo`.** TASK-010 existe en los tres repos; `porId` (eventos de git) y `cuerpoPorId` en `commands/metricas.ts` usan solo `task.id` (comprobado). Duraciones, cierres y cuerpos de un proyecto se atribuyen a otro sin aviso. Mitigacion: clave (repo, id) en todos los Map y `git log` con el cwd de cada repo.
3. **Informe sin tabla reconocible cuenta como 0 hallazgos.** `leerHallazgos` da `tabla:false` en informes anteriores a TASK-036 o sin columna ID o Estado (comprobado). Tareas antiguas y proyectos con otra plantilla parecen limpios. Mitigacion: `tabla:false` = «sin dato», fuera de las medias, y la salida dice cuantas tareas quedaron fuera.
4. **Severidades descartadas sin aviso.** `Importante`, `Alta`, `Major` o celda con texto anadido: `normalizarCelda` quita enfasis y tildes pero no pasa a mayusculas (comprobado). Mitigacion: comparar sin distinguir mayusculas y avisar de cada severidad fuera del vocabulario.
5. **Escritura en repos ajenos con `--repo` + `--escribir`/`--tokens`.** `--escribir` regenera `docs/METRICAS.md` de `repoCwd` (comprobado) con tareas de otros proyectos, y se rompe «git status no cambia». Mitigacion: rechazar `--escribir` junto con `--repo`, como hoy con `--heuristica`.
6. **`--json` que no pasa `JSON.parse`.** La rama sin tareas escribe texto plano «No hay tareas que medir» en stdout (`cli.ts:494`, comprobado); una mediana de grupo vacio da `NaN`/`Infinity` y `JSON.stringify` la convierte en `null`. Mitigacion: texto humano y avisos por stderr; vacios explicitos en el JSON.
7. **Tramos inestables y tareas perdidas.** Cierre con precision de dia en filas antiguas, y `origen '—'` da null (comprobado en `calcularFila`): tareas cerradas el mismo dia cambian de tramo segun el orden de lectura, y las sin cierre desaparecen de `--evolucion`. Mitigacion: desempate estable por (repo, numero de ID) y recuento visible de tareas sin fecha de cierre.
8. **Diferencia `tokens_<fase>` − desglose negativa** (frontmatter editado a mano) y filas repetidas por MEN-2 que suman doble. Mitigacion: mostrar el negativo como incoherencia con aviso, nunca `max(0, …)`.

Descartado a proposito: carrera con un `finish` que mueve una carpeta durante `metricas` (solo lectura, se repite); KB distintos con CRLF/LF (~3 %, lo absorben los terciles); `GIT_MAX_BUFFER` en `git log --all` de repos grandes (hoy sale «—» con aviso, no dato falso).

## Estados intermedios y fallos parciales

- Tareas cuyo `tarea.md` no valida con la version actual (en ToolsaWeb u OpenGisViewer) salen de la muestra; hay que ver los `[AVISO] ... tarea.md invalido` al ejecutar `metricas` en cada repo.
- Informes fragmentados por revisor pueden repetir el mismo hallazgo con IDs que chocan entre revisores (no visto en TaskCode; buscarlo en los otros dos).
- «Aprobado a la primera» = ultima ronda == 1 es una suposicion: no cubre tareas con `revision/` vacia ni las que se rechazaron en ronda 1 y se cerraron sin ronda 2.

## Compatibilidad hacia atras

- Si cambia la salida de la tabla por defecto o la de `--tokens --escribir`, `docs/METRICAS.md` se regenera con diff y hay que revisar `skills/task-workflow/coste.md` y `skills/task-workflow/SKILL.md`, que citan `metricas`.
- Informes de plantillas antiguas (sin tabla, sin Origen) tienen que seguir leyendose como «sin dato» o «sin clasificar», no como cero.

## Vuelta atras

El codigo se revierte con git, pero la linea base copiada en el Resultado y las decisiones tomadas con ella no: si sale con cifras infladas (riesgos 1-3) queda como referencia «oficial».

Desacuerdos previstos: con dominio, como contar hallazgos entre rondas (es su regla, pero no puede quedar a la implementacion); con arquitectura, el identificador compuesto (repo, id) tiene que estar en el modelo de fila, no anadirse al imprimir.

## El riesgo que mas te preocupa (UNO solo)

Los hallazgos contados varias veces entre rondas: inflan exactamente la cifra con la que se van a priorizar las mejoras.
