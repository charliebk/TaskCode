# Plan — TASK-084: Version del plugin en cada tarea y metricas por version

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos. Son 2 porque la complejidad
declarada (media) gana a la heuristica (simple, 1 punto): se lanza el mayor.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

- Version como 5.ª columna `version` de `## Transiciones`, en el mismo commit que la transicion; lectura de 4 o 5 celdas (arquitectura; riesgos exige lo mismo para datos viejos).
- Orden: `core/version.ts` (sale de `cli.ts:62`) → `transiciones.ts` (fila, lectura, parametro `version` por defecto) → `versionCierre` en `core/metricas.ts` → `core/versiones-metricas.ts` nuevo → flag `--por-version` en `commands/metricas.ts` y `HELP` (arquitectura).
- Agregado: rondas y aprobadas a la primera reutilizando `grupos-metricas.ts`, hallazgos por severidad/origen, tokens por fase, grupo «sin version» aparte, orden semver (arquitectura; riesgos pide semver y «sin version»).
- Se actualizan `skills/task-workflow/avance.md:31` y el README con «una version del plugin por repo» (riesgos).

## Desacuerdos entre roles, y como se resuelven

- Cabecera de 4 columnas en tablas existentes — arquitectura: reescribir solo cabecera y separador la primera vez, documentandolo / riesgos: eso es reescribir la seccion, hoy prohibido (`transiciones.ts:30`), y sin ello la version es invisible en GFM — NO SE RESUELVE AQUI — es regla de dominio y del contrato del modulo; sube entera a decision humana.
- Fuente de la version — arquitectura: mover la constante a `core/version.ts` y, si hay duplicados, meterla en el test de sincronia / riesgos: vive en 3 sitios (`cli.ts:62`, `package.json:3`, `plugin.json:4`) y solo vio test `plugin.json`↔`marketplace.json`; exige fuente unica o test de alineacion — gana riesgos como condicion — mover la constante no quita la duplicacion que riesgos leyo; como se cumple (fuente unica o test) va a decision humana.
- JSON de `metricas` — arquitectura: `versionCierre` entra en `FilaMetricas` y «solo se anade una clave opcional» / riesgos: anadir `version` a cada fila del JSON actual lo muta; `--por-version` debe ser forma nueva — gana riesgos como restriccion — el contrato `--json` es publico; si `FilaMetricas` se serializa, el campo no puede aparecer en la salida existente (sin verificar, ver suposiciones).
- Fuera de estos tres, los roles coinciden (lectura 4/5 celdas, «ultimo `finish`», grupo «sin version», semver, ruptura deliberada del lector viejo). No es alarma: riesgos no propone forma, solo la condiciona.

## Riesgos aceptados y que los contiene

- Un plugin 0.11 descarta las filas de 5 celdas y pierde el modo congelado; `siguiente` cae al modo del config y `metricas` a origen `git` en silencio — riesgos (arquitectura lo acepta igual) — ruptura declarada como en TASK-052 y «una version por repo» escrito en README.
- Atribucion a la version equivocada: tareas que construyen la 0.12 se cierran con binario que dice 0.11.0, con aspecto de dato fiable y sin vuelta atras — riesgos (el que mas le preocupa) — solo lo contiene la regla de cuando se sube `VERSION`, abierta abajo.
- Vuelta atras: el codigo se revierte, las filas commiteadas no; tareas entre `plan` y `finish` quedan sin modo congelado y sin aviso — riesgos — nada en el plan lo contiene; se acepta.
- Version escrita pero invisible en GitHub/GitLab bajo cabecera vieja — arquitectura y riesgos — depende de la decision sobre la cabecera.
- Varias filas `finish` con versiones distintas tras un `finish` abortado y reintentado — riesgos — regla «la del ultimo `finish`» documentada (arquitectura la propone).

## Plan de pruebas

- Filas de 4 celdas (fecha de dia y de segundo) dan el mismo modo congelado y las mismas metricas que antes — repos Git temporales — riesgos.
- Toda transicion nueva escribe 5 celdas con la version de `taskctl`; tarea mixta (`plan` sin version, `finish` con version) agrupa por la de cierre — repos Git temporales — riesgos y arquitectura.
- Dos `finish` con versiones distintas cuentan por el ultimo; origen `git` o sin anotar caen en «sin version», nunca deducido por fecha — repos Git temporales — riesgos.
- Orden semver: `0.9.x` < `0.10.0` < `0.11.0` en tabla y `--json` — funcion pura de `versiones-metricas.ts` — riesgos.
- `--por-version --json` trae `porVersion` y la salida `--json` existente no cambia; choca con `--heuristica`, `--tokens`, `--escribir` — CLI contra repo temporal — arquitectura y riesgos.
- La version de `core/version.ts` coincide con `package.json` y `plugin.json` — test de empaquetado — riesgos.

## Sin cubrir

- Aserciones concretas y fixtures: no se lanzo rol de testing; el plan de pruebas sale de los modos de fallo de riesgos, no de un diseno de pruebas.
- Reglas de dominio (cuando se sube la version, que version cuenta, sufijos `-dev`/`-rc`): no se lanzo rol de dominio; ambos roles lo declaran fuera de su alcance.
- Validacion del test de no mencionar TaskCode en `avance.md` y README al reescribirlos: ningun rol lo cito; queda para la revision.

## Salidas que faltaron

- ninguna (llegaron arquitectura y riesgos; dominio y testing no se lanzaron por presupuesto, ver «Sin cubrir»).

## Suposiciones no verificadas

- La version esta repetida en `package.json` y `plugin.json` sin test que alinee con `cli.ts` — riesgos (leido) y arquitectura (supuesto) — buscar `0.11.0` en el plugin y en `test/empaquetado/`.
- Hay tests que comparan la cabecera literal `| fecha | fase | modo | decidido_por |` — arquitectura — buscarla en `test/`.
- `FilaMetricas` no se serializa tal cual en el `--json` actual — implicita en arquitectura — leer `SalidaJsonMetricas`.
- GFM oculta la celda que sobra respecto a la cabecera — arquitectura y riesgos — comprobarlo en GitHub y GitLab.
- «Version de cierre = la del ultimo `finish`» es la regla que quiere dominio — arquitectura — confirmarlo la persona.

## Lo que necesita decision de una persona

Decidido por Carlos el 2026-11-06 (las cuatro, la opcion recomendada):

- **Cuando se sube `VERSION`: al abrir el ciclo.** La primera tarea de una version nueva sube el numero (en `core/version.ts`, `package.json` y `plugin.json`); todas las tareas que la construyen se cierran con esa version. Se documenta en el README como regla de publicacion.
- **Que version cuenta para el cierre: la del ultimo `finish`.** Sin version anotada (filas viejas, origen `git`, edicion a mano) va al grupo «sin version», nunca deducida por fecha ni tag. Orden semver por componentes numericos; un sufijo de pre-release (`-dev`, `-rc`) ordena antes de su release.
- **Cabecera de 4 columnas: se reescribe.** La primera vez que se anade una fila con version bajo una cabecera de 4 columnas, `anadirTransicion` cambia solo la cabecera y el separador a 5; las filas de datos nunca se tocan. La excepcion se documenta en el comentario de contrato de `transiciones.ts`.
- **Fuente de la version: test de alineacion.** La constante vive en `core/version.ts` (sin E/S en runtime) y un test de `test/empaquetado/` exige que coincida con `package.json` y `.claude-plugin/plugin.json`.

Comprobado al redactar (resuelve dos suposiciones): el `--json` actual de `metricas` no serializa `FilaMetricas` (`SalidaJsonMetricas` solo lleva `proyectos`, `sinCoste`, `evolucion?`, `grupos?`), asi que `versionCierre` no cambia la salida existente; y la cabecera literal aparece en `test/core/transiciones.test.ts`, `metricas*.test.ts`, `commands/siguiente.test.ts` y `test/helpers/metricas-repos.ts`, que hay que adaptar (las fixtures de 4 columnas se conservan como caso de compatibilidad).
