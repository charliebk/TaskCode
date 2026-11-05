---
id: TASK-074
titulo: "Cobertura sobre las lineas cambiadas"
tipo: feature
sprint: 0
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: terminada
plan_aprobado: true
rama: feature/task-074-cobertura-sobre-las-lineas-cambiadas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 922803
tokens_implementacion: null
tokens_revision: 20812018
creado: 2026-11-03
actualizado: 2026-11-05
dependencias: [TASK-072]
---
## Objetivo

Freno 8 de brakes: una linea cambiada que ningun test ejecuta es un hallazgo, medido contra la merge base y no sobre todo el repo.

## Criterios de aceptacion
- [x] Calculo de lineas cambiadas con git diff contra la merge base de la rama de la tarea, respetando excluir_de_revision
- [x] Lectura de un informe lcov generado por el comando del proyecto, sin ejecutar tests por su cuenta
- [x] taskctl review incluye en la peticion las lineas no cubiertas; umbral opcional en config.yml que convierte el hallazgo en puerta de finish
- [x] Tests con un lcov y un diff de ejemplo

## Resultado

Freno 8: una linea cambiada que ningun test ejecuta es un hallazgo, medida desde la merge base.

- Piezas: `core/lcov.ts` (parser propio, cero dependencias), `core/cobertura-cambios.ts` (unico sitio
  que decide «sin cubrir»: cruce, umbral, texto), `fs/cobertura.ts` (lee el informe y resuelve las
  `SF:`), `fs/git.ts` (`lineasAnadidas` con `git diff -U0` y opciones fijas: renombres, prefijos, sin
  color ni diff externo; `pathspecSinExcluidos` compartido con el diff de la peticion),
  `commands/finish-cobertura.ts` (puerta tras la verificacion y antes de los held-out) y
  `fs/config-de-ref.ts` (config de otra rama, extraida de `finish-heldout.ts`). Claves nuevas
  `informe_cobertura` y `umbral_cobertura`.
- `review` informa (seccion «Cobertura de las lineas cambiadas», solo con `informe_cobertura`, avisos
  si el informe falta, esta cortado, es viejo o no es del repo); `finish` frena con el umbral.
- Decisiones de Carlos: (a) umbral e informe de la config de la RAMA BASE; (b)+(c) sin datos fiables no
  cierra, y `--sin-verificacion` salta tambien esta puerta; (d) porcentaje minimo cubierto, el valor
  exacto pasa, precisada tres veces por la revision: un fichero que el informe no lista cuenta entero
  sin cubrir solo si es codigo de una carpeta medida, sin contar la raiz del repo ni la del proyecto
  que genero el informe, y nunca los `*.d.ts`; (e) dogfooding fuera de alcance (este repo mide `dist/`).
- Hallazgo de entorno: `node --test` escribe `SF:` RELATIVO al cwd y con `\` en Windows, no absoluto
  como suponian los tres roles del diseño: los tests usan un lcov real, no uno escrito a mano.
- Smoke con el CLI real en un repo temporal: `review` con el aviso de informe ausente; `finish` con
  90 % frente a 95 % bloqueado nombrando `src/a.mjs: 6` y sin mover `develop`; con la linea cubierta,
  cerro y mergeo.
- Suite completa 1838/1841: los 3 rojos conocidos de Windows (symlink EPERM, chmod de directorio, CRLF).

Revision por pares, 4 rondas (la 4 autorizada por la persona):
- Ronda 1 (`cambios-solicitados`): IMP-1/IMP-2 (codigo nuevo sin test fuera del informe no contaba),
  IMP-3 (proyecto en subcarpeta), IMP-4 (protecciones sin test), MEN-1..4. Corregidos.
- Ronda 2 (`cambios-solicitados`): IMP-5 (falsos rojos con tests excluidos y `.d.ts`), MEN-5, MEN-6.
  Corregidos; al escribir el test de `--no-merges` salio un fallo real (hacia falta `--first-parent`).
- Ronda 3 (`cambios-solicitados`): IMP-6 (la raiz del proyecto en subcarpeta), MEN-7, MEN-8. Corregidos.
- Ronda 4 (`aprobada-con-correcciones`): MEN-9 y MEN-10, dos huecos de test sobre codigo correcto
  (`padre()` y `clave` en el descuento de raices; `raices` vacio con `SF:` absolutas). **Aceptados por
  la persona** sin ronda 5; quedan como seguimiento barato.
- Seguimiento: dogfooding de la cobertura en este repo (source maps o cobertura sobre `src/`).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-05T17:07:09Z | plan | automatico | persona |
| 2026-11-05T17:15:49Z | approve | automatico | automatico |
| 2026-11-05T17:15:50Z | start | automatico | persona |
| 2026-11-05T17:54:47Z | review | automatico | persona |
| 2026-11-05T18:58:41Z | review | automatico | persona |
| 2026-11-05T19:58:21Z | review | automatico | persona |
| 2026-11-05T20:53:16Z | review | automatico | persona |
| 2026-11-05T21:47:18Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-05T17:15:36Z | diseno | agente:a6e758af87c52ec67,a27c5a90f106d2646,acf962f629a824993,a1dff1917970a1488 | 62 | 181258 | 708750 | 32733 | 47 | 922803 |
| 2026-11-05T18:23:53Z | revision | agente:a3be9170e0df89f6f | 116 | 179937 | 8073404 | 34257 | 9 | 8287714 |
| 2026-11-05T19:33:15Z | revision | agente:acc6b61581ede013b | 102 | 307390 | 6132082 | 28134 | 9 | 6467708 |
| 2026-11-05T20:23:10Z | revision | agente:a400dcc94dc9bdd15 | 64 | 256401 | 3282805 | 18351 | 2 | 3557621 |
| 2026-11-05T21:18:33Z | revision | agente:add6a1a8cb3a368b3 | 50 | 239700 | 2245187 | 14038 | 3 | 2498975 |
