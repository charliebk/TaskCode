# Informe de revision — TASK-092 (ronda 1)

- Commit revisado: 97a0d2cc99f682342ae76fd66a72f267af4cfb6a
- Revisor: general-purpose (sonnet) con code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-092 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos.

## Reproduccion y resumen de lo ejecutado

Entorno: clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-092-r1`, rama de la tarea en el commit ed53572 (el de la peticion, que solo añade el fichero de peticion sobre 97a0d2c). `npm install` y `npm run build` sin errores de compilacion.

**Tests afectados.** `node --test dist/test/core/config-sincronizacion.test.js dist/test/core/cobertura.test.js dist/test/commands/sincronizacion-*.test.js`: 46 tests, 46 pasan, 0 fallan. Incluye `sincronizacion-ciclo`, `-raiz-tareas`, `-revision` y `-scripts`; el integral new → plan → approve → start → review → finish con `tareas/ROADMAP.md` pasa, y los tres de salvaguardas (a), (b) y (c) tambien.

**`npm run test:rapido`.** 682 tests, 682 pasan, 0 fallan. La suite completa no se corrio: no hacia falta para ninguna conclusion.

**Mutantes en `motivoRutaInvalida` (`src/core/config.ts`).** Recompilando y corriendo `config-sincronizacion` y `cobertura` tras cada uno; todos detectados, original restaurado despues de cada uno.

| Mutante | Resultado |
|---|---|
| M1: quitar la comprobacion de carpeta de estado | 2 tests en rojo |
| M2: quitar `toLowerCase` | 2 en rojo |
| M3: quitar todo el recorte de puntos y espacios finales | 1 en rojo |
| M3b: recortar solo puntos, no espacios | 1 en rojo |
| M4: aceptar hasta 3 segmentos | 1 en rojo |
| M5: aceptar `tareas` como un solo segmento | 1 en rojo |
| M6: pasar `ficheroEnRaizDeTareas` a `informe_cobertura` | 1 en rojo |

El mutante intentado sobre `STATE_FOLDER` quedo sin efecto (la sustitucion era un no-op) y se descarta; las cinco carpetas de estado las cubre el test que recorre `00-planificadas` a `04-terminadas`.

**Criterios de aceptacion, uno a uno.**
1. Cumplido: aceptacion con normalizacion (`./tareas/ROADMAP.md`, `tareas\ROADMAP.md`, `tareas/01-en-diseno/../ROADMAP.md`) y rechazos (las 5 carpetas de estado, `tareas`, `tareas/`, `tareas/otra/x.md`, `.taskcode/`, `.git/`, variantes con mayusculas y con puntos o espacios finales, e `informe_cobertura` sin la excepcion).
2. Cumplido: tras cada transicion, `aplicada`, ROADMAP en `ficherosDeHead`, arbol limpio y la fila esperada; en `finish`, lo commiteado coincide con disco.
3. Cumplido, un test por caso: (a) ruta con cambios previos, (b) comando que falla tras escribir, (c) fichero no declarado en `tareas/`.
4. Cumplido: `sincronizacion.md`, el README (seccion nueva) y `CHANGELOG.md` (0.14.0 sin publicar) describen la regla, su motivo y el cambio de comportamiento por mayusculas.
5. Suite completa no corrida por el revisor; `test:rapido` en verde, sin regresion en los afectados y sin tests debilitados ni borrados.

**Cambio de expectativa `'[tareas/x.md]'`.** Justificado y no debilita la suite: es justo el comportamiento que cambia la tarea. Se sustituye por 7 rechazos nuevos dentro de `tareas/`, mas los de mayusculas y puntos finales, mas un test positivo con normalizacion; `informe_cobertura` conserva el rechazo `esta bajo tareas/` con test propio.

**Otras comprobaciones.**
- `motivoRutaInvalida` tiene dos llamadas; solo `rutas_sincronizacion` pasa el flag. `informe_cobertura` no lo pasa (lo confirma M6).
- Ningun sitio de `taskctl` escribe ficheros sueltos en la raiz de `tareas/`: la premisa se sostiene.
- No quedan referencias a la regla antigua "fuera de tareas/" en docs o codigo.
- El mensaje de error de `rutas_sincronizacion` refleja la regla nueva.
- Observacion sin severidad: los alias de ruta de Windows (nombres cortos 8.3, flujos `::$DATA`) no se contemplan; es endurecimiento fuera del alcance.

**Limpieza.** El clon solo tenia `package-lock.json` modificado por `npm install`, sin commits ni nada que conservar; borrado, y `pruebas-claude\taskcode` queda vacio. El working tree del repo original no se toco.

## Lecturas fuera del contexto permitido

- `src/core/config.ts` fuera del diff, para comprobar los dos usos de `motivoRutaInvalida` y su cabecera: confirmar que `informe_cobertura` queda sin la excepcion.
- `grep` sobre `src/` y los `.md` del repo: buscar escrituras de `taskctl` en la raiz de `tareas/` y referencias residuales a la regla antigua.
- `package.json`, para localizar los scripts de test.
