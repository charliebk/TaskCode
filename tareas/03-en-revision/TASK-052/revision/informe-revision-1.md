# Informe de revision — TASK-052 (ronda 1)

- Commit revisado: 70ce4346babc6efcf5deea02064c262f4c37cb69
- Revisor: code-quality-reviewer (agente general-purpose independiente, modelo sonnet; clon propio, ya borrado)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MENOR-1 | MENOR | corregido | src/core/metricas.ts (`marcasDe`), test/core/metricas.test.ts |
| MENOR-2 | MENOR | corregido | src/commands/metricas.ts, src/cli.ts |
| MENOR-3 | MENOR | corregido | scripts/heuristica-complejidad.yml, test/commands/plan-brainstorm.test.ts |
| MENOR-4 | MENOR | corregido en la release 0.5.0 | README del plugin, CHANGELOG.md |
| MENOR-5 | MENOR | aceptado (decision de diseno) | src/core/metricas.ts |

Sin CRITICO ni IMPORTANTE.

- **MENOR-1 — El «ultimo finish» no lo asevera ningun test**: mutar
  `finishes[finishes.length-1]` por `finishes[0]` deja `metricas` en verde.
  Una tarea con dos pares review/finish cambiaria de medida sin aviso.
- **MENOR-2 — `metricas --heuristica` sin muestra dice «No hay tareas que
  medir»**: con tareas pero ninguna terminada con informes, el mensaje es
  falso. (Ademas, con filas de solo dia sale «0 d», un valor medido y
  documentado en `NOTA_CALENDARIO`.)
- **MENOR-3 — Calibracion defendible pero fina, sin test del efecto**: cifras
  del YML reproducidas (n=43; 0 puntos n=16, 1,19 rondas; 1 punto n=14,
  2,29; 2+ n=13, 1,92; coincidencias 9/43). Pero las 16 de 0 puntos son todas
  recientes (confusor temporal no mencionado), y ningun test de
  comportamiento cubre «trivial con 1 punto lanza 1 rol»: volver a
  `nivel_trivial_hasta: 1` solo pone rojos tests atados a la config.
  Reproducido por CLI: trivial con 1 dependencia → «1 punto: se lanzan 1
  rol» (antes 0).
- **MENOR-4 — Version incoherente**: el README dice «desde la 0.5.0» con
  `plugin.json`/`package.json`/`VERSION` en 0.4.0, y el aviso prometido en el
  CHANGELOG (un plugin anterior no lee filas con hora) no esta.
- **MENOR-5 — `revision` acumula el hueco entre rondas**: medida de
  calendario, la salida lo dice y el plan lo acepta.

## Lo ejecutado

1. **`npm test` completo**: 1124 tests, 1121 pass, 3 rojos (los conocidos de
   Windows), 509 s, cobertura de lineas 98,92 %. `npm run build` sin diff en
   `dist/src`; `lint` limpio.
2. **Riesgo principal (modo congelado) por CLI real**: `plan` en `manual`
   escribe `| 2026-10-05T13:39:57Z | plan | manual | persona |`; con el config
   cambiado a `automatico`, `siguiente --json` sigue diciendo `manual`. Tabla
   mezclada: manda el ultimo plan valido. Filas invalidas
   (`T99:99:99Z`, `2026-02-30`, offset `+02:00`) se ignoran sin romper.
3. **`metricas` sobre el repo** (59 tareas): sin NaN, `undefined` ni
   negativos; origenes 36 git, 7 registro, 16 «—». Comprobado a mano contra
   `git log`: TASK-040 (6m/14m/16m, 1 ronda), TASK-031 (3), TASK-033 (2),
   TASK-038 (2). Casos limite de `calcularFila` correctos.
4. **Claves quitadas**: sin restos fuera de comentarios historicos; 19 claves;
   mensajes con «reinstala el plugin».
5. **Mutaciones**: M1 regex viejo → 6 rojos (incluido `modoCongelado` con
   hora); M2-M10 y M12 rojos; M11 sobrevive (MENOR-1); M13 solo rojos atados
   a la config (MENOR-3).
