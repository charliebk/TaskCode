# Informe de revision — TASK-043 (ronda 1)

- Commit revisado: 6d27bc41238fd11a1db4cca42c46f69dd8290819
- Revisor: code-reviewer (agente independiente; clon limpio en el scratchpad, sin tocar el repo de trabajo)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts:287-291 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts:316 |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts:124-131 |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts:395 |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/validacion-tarea.ts:406-415 |
| MEN-6 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/cli/main.test.ts, test/core/validacion-tarea.test.ts |

Sin CRITICOS ni IMPORTANTES.

## Lo verificado (sin hallazgo)

- **Suite completa** (una sola vez, clon en `scratchpad/rev43`): 952 tests, 949
  en verde. Los 3 rojos son los conocidos de Windows (approve: error de stat
  que no es ENOENT; plan: chmod / «propaga cualquier error de escritura»;
  plan: «estado distinto al de la lectura preliminar»). Cobertura de
  `validacion-tarea.js`: 100 % de lineas, 98,21 % de ramas; `approve.js`: 100 %.
  `npx tsc -p .` no da errores y el `dist/` regenerado coincide con el
  commiteado (`git status` limpio).
- **Puerta de `plan` con el CLI real** (`bin/taskctl`, repo Git temporal):
  - tarea recien creada con `new` (objetivo y criterio vacios): exit 1, lista
    los dos motivos, sigue en `00-planificadas`, sin commit y workspace limpio;
  - `--criterio "Que sea robusto"`: exit 1 con el motivo «solo dice palabras vagas»;
  - tarea correcta con criterios de comportamiento: exit 0 y el `[AVISO]` de
    «no citan nada comprobable» sale por stderr.
- **Puerta de `approve` con el CLI real**: el `plan-final.md` que deja el
  propio `plan` (2 roles) se rechaza con exit 1 y `plan_aprobado` sigue en
  false; con una linea propia aprueba. Probado tambien en puro con las
  plantillas de 0..3 roles, con CRLF, y con un titulo distinto en la cabecera
  (sigue siendo esqueleto: las cabeceras se excluyen). Una linea de la plantilla
  copiada tal cual como unico contenido se trata, con razon, como esqueleto.
  No encontre falsos positivos con un plan redactado normal (ver MEN-4 para el
  unico caso raro).
- **Aviso de `finish` antes del merge, en el CLI real**: en un ciclo completo
  `new → plan → approve → start → review → veredicto → finish` con 2 criterios
  sin marcar, la linea 1 de la salida es el `[AVISO] ... 2 criterio(s) ... sin
  marcar`, y la vista previa y el «Merge completado» de los scripts de Git-Flow
  van despues (las lineas 2-30). Exit 0: no bloquea. Las casillas de
  `### Tras el cierre` no se cuentan.
- **Compatibilidad con tareas ya en `en-diseno`**: una tarea en
  `01-en-diseno` con `plan_aprobado: false` y el objetivo vacio (como podia
  quedar antes de esta tarea con 0 roles) ya no se puede re-planificar: exit 1,
  sigue en `en-diseno`, sin commits nuevos. La misma tarea se aprueba sin
  problema con un plan redactado (`approve` no valida el enunciado). La unica
  tarea real en `01-en-diseno` (TASK-023) ya tiene `plan_aprobado: true` y no
  se ve afectada. El hueco con esqueletos de plantillas antiguas esta en MEN-3.
- **Skill** (`skills/task-workflow/SKILL.md`): el diff no anade ninguna
  mencion a TaskCode, sus rutas ni sus documentos; las unicas apariciones de
  `.taskcode/` son preexistentes (el directorio de configuracion del
  producto). El test de no-filtracion pasa.
- **`esSoloVago`**: bloquea «Funciona correctamente», «Mejorar la calidad»,
  «El codigo es correcto», «Que el codigo sea limpio y mantenible»; no bloquea
  «Mejorar el rendimiento», «Funciona en Windows», «Quede limpio el
  workspace», «Rendimiento adecuado». No encontre falsos positivos (criterios
  legitimos bloqueados); los huecos son falsos negativos (MEN-1, MEN-2).
- **Mutantes propios**, contra el fichero de test concreto:
  - `enTrasCierre` pegajoso (una vez en `### Tras el cierre`, los subtitulos
    siguientes no lo resetean) contra `validacion-tarea.test.js` +
    `validacion-puertas.test.js`: **sobrevive** (13/13 en verde) → MEN-6;
  - quitar `onAviso` de `finish` y `avisosEnunciado` de `plan` en `cli.js`
    contra `cli/main.test.js`: **sobrevive** (10/10 en verde) → MEN-6.

## Reproduccion de cada hallazgo

### MEN-1 — La lista de palabras vagas solo tiene la forma masculina singular / infinitivo

`PALABRAS_VAGAS` tiene `rapido`, `correcto`, `limpio`, `optimizado`,
`funciona`, pero no `rapida`, `correcta`, `limpia`, `optimizada`, `funcione`.
`validarEnunciado` sobre cada uno:

```
"Que sea rapida"        -> bloqueos: []  (solo aviso de "sin ancla")
"La salida es correcta" -> bloqueos: []
"Que quede limpia"      -> bloqueos: []
"Optimizada"            -> bloqueos: []
"Que funcione correctamente" -> esSoloVago = false
```

Es el mismo tipo de hueco que el implementador ya encontro con «que sea
rapido». No rompe nada (siguen dando aviso), pero la regla es menos estricta
de lo que dice la skill. Propuesta: anadir las formas femeninas/plurales y
`funcione(n)`, o comparar por raiz.

### MEN-2 — Cualquier barra cuenta como ruta, asi que «y/o» es un ancla

La regex de ruta `[\w.-]+\/[\w./-]+` acepta `y/o`, `si/no`,
`entrada/salida`. Resultado:

```
"Robusto y/o eficiente" -> {"bloqueos":[],"avisos":[]}
```

Un criterio solo vago pasa sin bloqueo **y sin aviso**. Propuesta: exigir que
la ruta tenga al menos un segmento de mas de 2 caracteres, o una extension, o
un `/` inicial.

### MEN-3 — `approve` no reconoce el esqueleto de una plantilla anterior

`approve` genera las plantillas con el `planTemplate` **actual**. El comentario
dice que asi «sigue valiendo si la plantilla cambia», y eso es cierto para los
planes que se creen despues del cambio, pero no para los que ya existen: el
esqueleto que dejaba el `plan` anterior a TASK-016
(`(Esta tarea no lanza brainstorm: su complejidad resuelve 0 roles. El plan` /
`se redacta directamente a partir del enunciado.)`) se toma como contenido
propio:

```
plantilla pre-TASK-016 detectada como esqueleto: false
```

Afecta a proyectos que actualicen el plugin con una tarea en `en-diseno`.
Es un falso negativo (la puerta deja pasar algo, no bloquea nada valido).
Propuesta: aceptarlo y documentarlo, o ademas descartar las lineas que
empiezan por `(` y acaban por `)` en el bloque de origen.

### MEN-4 — Un plan hecho solo de subtitulos se rechaza como «plantilla sin rellenar»

`planEsEsqueleto` descarta todas las cabeceras `#{1,6}`, tambien las que
escribe la persona:

```
planEsEsqueleto('# Plan\n\n## Enfoque propuesto\n\n### Modulo puro en src/core/x.ts\n### Puerta en plan antes de mover\n', plantillas) -> true
```

Es un falso positivo raro (un plan sin ninguna linea de cuerpo), y el mensaje
de error («es la plantilla sin rellenar») es falso en ese caso. Propuesta:
descartar solo las cabeceras que esten en la plantilla (la comparacion por
`Set` ya lo hace), no todas.

### MEN-5 — `casillasSinMarcar` no reconoce los mismos criterios que `extraerSecciones`

`extraerSecciones` abre la seccion de criterios tambien con un
`### Criterios de aceptacion` (MEN-1 de la revision de TASK-046), y `plan` los
valida. `casillasSinMarcar` solo la abre con nivel 2:

```
casillasSinMarcar('## Objetivo\nX\n### Criterios de aceptacion\n- [ ] a\n') -> []
```

Con esa estructura, `plan` ve el criterio pero `finish` nunca avisa de que
esta sin marcar. Ademas, de un criterio con linea de continuacion solo se
muestra la primera linea. Es la logica de secciones duplicada en dos sitios;
propuesta: que `casillasSinMarcar` reutilice el recorrido de
`tarea-body.ts` (o que `extraerSecciones` devuelva tambien si cada criterio
esta marcado).

### MEN-6 — Huecos de test

1. Nada comprueba que el CLI pase los avisos al usuario: con `onAviso`
   eliminado de `finish` y `avisosEnunciado` eliminado de `plan` en
   `dist/src/cli.js`, `node --test dist/test/cli/main.test.js` sigue en verde
   (10/10). Lo he comprobado a mano con `bin/taskctl` y funciona, pero un
   test de `main` que capture stderr cerraria el hueco.
2. El mutante «`enTrasCierre` no se resetea en el siguiente `###`» sobrevive:
   ningun test pone un subtitulo normal **despues** de `### Tras el cierre`.
   Basta con anadir `### Otra\n- [ ] tres\n` tras `Tras el cierre` en el test
   de `casillasSinMarcar`.

## Comandos ejecutados (evidencia)

```
git clone <repo> scratchpad/rev43 && git checkout feature/task-043-f4-t2-validacion-antes-de-plan-y-puertas
npm install && npx tsc -p .            # sin errores, git status limpio
npm --prefix .../taskcode-plugin test  # 952 / 949 pass / 3 fail (los conocidos)
node scratchpad/probe.mjs, probe2.mjs  # esSoloVago / tieneAncla / planEsEsqueleto / casillasSinMarcar sobre dist
# e2e con node .../bin/taskctl en un repo Git temporal (scratchpad/e2e1):
taskctl new ... ; taskctl plan TASK-001   # exit 1, sin mover
taskctl plan TASK-002                     # criterio vago: exit 1
taskctl plan TASK-003                     # exit 0 + [AVISO]
taskctl approve TASK-003                  # esqueleto: exit 1; redactado: exit 0
taskctl start / review / veredicto aprobada / finish TASK-003   # [AVISO] en linea 1, merge despues
taskctl plan TASK-004 (re-plan en-diseno con objetivo vacio)   # exit 1, sin commits
# mutantes sobre dist, contra el fichero de test concreto:
node --test dist/test/core/validacion-tarea.test.js dist/test/commands/validacion-puertas.test.js
node --test dist/test/cli/main.test.js
```
