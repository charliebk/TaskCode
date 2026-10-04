# Informe de revision — TASK-046 (ronda 1)

- Commit revisado: 7521cd7f51204de5ee7abe4c31907d865303a922 (clon en temporal de la rama, HEAD 3f93e71 = 7521cd7 + peticion de revision)
- Revisor: code-quality-reviewer (agente independiente, no implemento la tarea)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts:129 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/import-parser.ts:124 y :136 |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts:133 y :163 |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts:22 y :138 |

Sin CRITICO ni IMPORTANTE.

## Verificacion empirica

- **Clon limpio** de `fix/task-046-f5-t2-secciones-con-subtitulos-y-criteri` en temporal, `npm install && npm run build` OK.
- **Suite completa** (`npm test`, una vez): 937 tests, **934 pass, 3 fail**, 0 cancelados, ~5 min. Los 3 rojos son los conocidos de Windows:
  `approve: propaga cualquier error de stat que NO sea ENOENT` (EPERM del symlink),
  `plan: propaga cualquier error de escritura que NO sea EEXIST` (chmod en NTFS) y
  `plan: la rama base real tiene la tarea en un estado distinto...` (CRLF). Ningun cuarto rojo.
  `tarea-body-subtitulos.test.js` con 100 % de cobertura de lineas y ramas.
- **Corpus real, develop vs rama.** Pase `extraerSecciones` de `dist/` de `develop` (`git show develop:...`) y de la rama por todos los `tareas/*/*/tarea.md` (frontmatter quitado):
  - TaskCode, 54 tareas: **una sola diferencia**, TASK-033. `criterios` 8 -> 8 (identicos); su Objetivo pasa de 160 a 3403 caracteres (ahora incluye sus `### 1. ...`, `### 2. ...`, que develop cortaba: es justo la correccion D2); `criteriosTrasCierre` recoge sus 3 casillas de `### Tras el cierre`, que siguen fuera de `criterios`.
  - OpenGisViewer (el otro proyecto que usa el plugin), 97 tareas: **cero diferencias**.
- **Consumidores de `criterios`/`objetivo`.**
  - Heuristica: `resolverNumeroAgentes` con el `dist` de develop y el de la rama sobre las 151 tareas: **resultado identico en todas** (TASK-033: 4 puntos, `media`, 2 agentes en ambos; el Objetivo mas largo no anade palabras de riesgo nuevas).
  - `plan` (peticion de brainstorm, `src/commands/plan.ts:808/889`): solo cambia el Objetivo que se embebe para TASK-033 (ya terminada); los criterios no cambian en ninguna tarea real. `criteriosTrasCierre` no se pasa al brainstorm, que es lo que dice el plan.
  - `new --desde` (`src/commands/new.ts:323`): ahora conserva los criterios agrupados en `###` (aplanados, sin subtitulo). Las casillas de `### Tras el cierre` se descartan al componer el cuerpo, pero en develop tambien se perdian (el `###` cortaba la seccion): no es regresion.
- **Bordes pedidos** (sonda con el `dist` de la rama):
  - `#### Grupo` y `##### Tras el cierre` dentro de los criterios: no cortan; el segundo va a `criteriosTrasCierre`. Correcto.
  - `### Tras el Cierre`, `### Tras el cierre ###`: reconocidos (normalizacion de mayusculas/tildes y almohadillas de cierre). `### TRAS EL CIERRE:` (con dos puntos) NO se reconoce y sus casillas cuentan como criterios normales — trivial, lo dejo como nota, no como hallazgo.
  - Lista anidada en el Objetivo (`- uno` / `  - dos` / `    - tres`, con un `### Sub` en medio): se conserva entera con su sangrado.
  - `import`, linea sangrada tras un criterio que es en realidad un bloque de codigo: ver MEN-2.
- **Mutantes** contra `dist/test/core/tarea-body-subtitulos.test.js` (editando el `dist`, restaurado y verificado con `cmp`):
  - M1 `### Tras el cierre` va a `normales`: **muere** (1 fallo).
  - M2 desactivar la rama de subtitulos (`if (false)`): **muere** (3 fallos).
  - M3 en `import`, aceptar como continuacion una linea sin sangrar (`/^\s*\S/`): **muere** (test de prosa sin sangrar).
  - M4 quitar `destino = normales;` al ver un `##`: **sobrevive**, pero es un mutante equivalente (ver MEN-4).

## Reproduccion

### MEN-1 — `### Criterios de aceptacion` bajo `## Objetivo` deja de reconocerse

Regresion respecto a develop. La decision 2 de la cabecera de `tarea-body.ts` aceptaba cualquier cabecera de nivel 2 a 6 como inicio de seccion. Ahora, dentro del Objetivo, un `###` es solo texto aunque su titulo sea el de los criterios:

```
body = '## Objetivo\n\nHacer X.\n\n### Criterios de aceptación\n- [ ] a\n- [ ] b\n'
develop: {"objetivo":"Hacer X.","criterios":["a","b"]}
rama:    {"objetivo":"Hacer X.\n\n### Criterios de aceptación\n- [ ] a\n- [ ] b","criterios":[],"criteriosTrasCierre":[]}
```

No hay ningun caso en las 151 tareas reales (54 + 97), asi que es de borde, no IMPORTANTE. Pero el sintoma es justo el que la tarea quiere quitar: `plan` diria «la tarea no declara criterios» y TASK-043 bloquearia. Tambien llega por `new --desde` con una especificacion escrita a mano. Arreglo barato: dentro del Objetivo, un subtitulo cuyo titulo normalizado sea `criterios de aceptacion` (y no se haya visto ya) sigue abriendo la seccion de criterios.

### MEN-2 — `import` aplana en silencio un bloque de codigo sangrado

`if (line.trim() === '') continue;` (l. 124) va antes de la regla nueva (l. 136), asi que «justo despues de un criterio» no se cumple: una linea sangrada tras una linea en blanco tambien se une. Un bloque de codigo sangrado, o un fence sangrado, acaba dentro del criterio como una sola linea:

```
'### Tarea\n- Ejecuta esto:\n\n      npm test\n      rm -rf x\n- Otro\n'
-> ok: true, criterios: ["Ejecuta esto: npm test rm -rf x", "Otro"]

'### Tarea\n- Ejecuta:\n  ```bash\n  npm test\n  ```\n- Otro\n'
-> ok: true, criterios: ["Ejecuta: ```bash npm test ```", "Otro"]
```

En develop las dos entradas se rechazaban con el motivo de la linea suelta. No se pierde texto (solo los saltos de linea) y es coherente con `tarea-body.ts`, que hace lo mismo con las continuaciones, pero el comentario de la l. 132 promete «justo despues». Si se quiere que una linea en blanco corte la continuacion, basta con anotarlo en el bucle. Si no, conviene corregir el comentario.

### MEN-3 — Una linea sangrada tras un subtitulo se pega al criterio de la subseccion anterior

```
'## Criterios de aceptacion\n- [ ] a\n### CLI\n  sangrada huerfana\n- [ ] c\n'
-> criterios: ["a sangrada huerfana", "c"]
```

Al cambiar de subtitulo, `destino` sigue siendo `normales` y su ultimo elemento es `a`, de otra subseccion. Con `### Tras el cierre` -> `### CLI` pasa lo mismo hacia `normales`. Es de borde (sangrar texto justo bajo un subtitulo es raro) y no pierde texto, pero lo atribuye mal. Lo evitaria marcar «sin criterio abierto» al cruzar un subtitulo.

### MEN-4 — Comentario de cabecera desactualizado y una asignacion muerta

- La decision 2 de la cabecera (l. 22-26) sigue diciendo que una seccion termina en la siguiente cabecera y que «se reconocen cabeceras ATX de nivel 2 a 6». Desde este cambio, dentro de Objetivo y Criterios solo corta el nivel 2; los niveles 3-6 solo abren seccion desde fuera de ellas. El comentario de `RE_CABECERA` (l. ~57) hereda el mismo texto.
- `destino = normales;` en la rama de `RE_CABECERA` (l. 138) no tiene efecto observable. `destino` solo se usa en la seccion de criterios, que se entra una sola vez (`criteriosVisto`) y siempre con `destino` ya en `normales`: la segunda cabecera de criterios va a `otra`. Por eso el mutante M4 sobrevive. Se puede dejar como defensa, pero conviene decirlo en el comentario.

## Notas (no son hallazgos)

- Un `## ...` dentro de un bloque de codigo del Objetivo sigue truncandolo (`## tampoco` dentro de un fence). Ya pasaba en develop y la decision 2 lo asume: queda fuera del alcance.
- `  - [ ] anidado` dentro de los criterios cuenta como criterio propio, igual que en develop.
- El criterio «Tests con criterios agrupados en `### Parser` y `### CLI`» esta cubierto (test 1). Los otros dos criterios de aceptacion se cumplen segun lo reproducido arriba.
