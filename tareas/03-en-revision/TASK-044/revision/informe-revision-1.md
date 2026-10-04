# Informe de revision — TASK-044 (ronda 1)

- Commit revisado: 6f27987cf523a0bbc347a4baa969a0a9e06cf98d
- Revisor: code-quality-reviewer (agente independiente, clon temporal propio)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/particion-tarea.ts:53 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/particion.test.ts |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts:69, src/core/validacion-tarea.ts:30 |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md:364 |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/tarea-body.ts:105 |

Sin CRITICO ni IMPORTANTE.

## Entorno y evidencia general

- Clon propio en el scratchpad, rama de la tarea en 648dcfc (el codigo es el de 6f27987).
  `npm install` + `npx tsc -p .`: sin errores, y `git status` limpio despues: el
  `dist/` versionado es reproducible.
- Suite completa (una vez): 974 tests, 970 en verde, 4 rojos. Tres son los
  conocidos de Windows (approve stat, plan EEXIST/chmod, plan CRLF). El cuarto,
  `origin-deteccion.test.js` («si la lista de ramas del destino expira...»),
  fallo por un timeout de conexion bajo carga («No hay conexion con 'destino'»).
  Solo, ese fichero da 5/5 en verde, y el diff no toca nada de Git-Flow. No es
  una regresion de esta tarea.
- Finales de linea: los blobs de `import-parser.ts`, `import.ts` y el resto de
  `src/` estan en LF en `develop` y en HEAD (0 CR), y `git ls-files --eol` da
  `i/lf w/lf` en los 43 ficheros de `src/`. `.gitattributes` fija `*.ts text eol=lf`
  (TASK-031). Si una copia de trabajo tenia CRLF, era una copia antigua; dejarlo
  en LF es lo correcto. **No afecta.**
- Skills y agentes: el diff no los toca. Las unicas coincidencias de «taskcode»
  en `skills/` son las de `.taskcode/config.yml` (el nombre del directorio de
  configuracion del producto), que ya estaban en `develop` (7). El test que lo
  vigila pasa.

## Cadena real con bin/taskctl (repo temporal con espacios en la ruta)

Repo `scratchpad/repo con espacios` (con `git init`, `develop`). Ahi copie TASK-029,
TASK-030 y TASK-032 de `04-terminadas` a `00-planificadas`, con `estado: planificada`,
las casillas desmarcadas y sin `## Resultado`. Para TASK-030 deje el Objetivo vacio,
como el original.

1. `taskctl plan TASK-029|030|032`: los tres terminan con exit 1, sin tocar
   el workspace ni HEAD, y nombran la propuesta en
   `C:\Users\nullcad2025\AppData\Local\Temp\taskctl-particion-<ID>-XXXX\particion-<ID>.md`.
   `os.tmpdir()` venia en 8.3 (`NULLCA~1`) y la ruta sale expandida por realpath.
   - TASK-029 (17 criterios): 4 hijas (S1..S4), con Transversal (3) copiado en cada una: 7, 8, 5 y 6 criterios.
   - TASK-030 (18 criterios): 2 hijas (C4 config, C2 auto-commit) de 11 cada una. Es justo la particion que se hizo a mano en su dia.
   - TASK-032 (13 criterios): 3 hijas (D7 heuristica, D7 roles, D6 skills) con «Comunes» (3) copiado.
   Las tres particiones tienen sentido. El Objetivo original, que lleva listas y
   negritas, llega citado a cada hija.
2. `taskctl import "<ruta>" --tipo feature --sprint 5` de las tres propuestas:
   crea 4+2+3 tareas, 0 errores, 0 omitidas, y hace un commit por import.
   Los titulos con backticks, `—` y `/` dan YAML valido y slugs correctos.
3. `taskctl plan TASK-037` (la hija C4 de TASK-030) pasa a `01-en-diseno` (exit 0)
   y solo avisa (11 criterios, 4 sin ancla). La cadena sirve de verdad.

Barrido del detector de frentes en las 54 tareas reales del repo: solo
TASK-029, TASK-030 y TASK-032 dan frentes. No hay falsos positivos, y ninguna tarea
de 00/01 recibe el aviso nuevo. Compare `extraerSecciones` de `develop` contra la de HEAD
en las 54: `objetivo`, `criterios` y `criteriosTrasCierre` salen identicos (0 diferencias).

## Compatibilidad del formato de import

Fuzz diferencial: 50 000 ficheros aleatorios, en LF y en CRLF, hechos con lineas
`###`, `-`, `*`, sangradas, `> q`, `>`, `>q`, ` > ind`, prosa, `##` y `####`. Cada
uno pasa por el `parseImportMarkdown` de `develop` y por el de HEAD.
Resultado: `{ okOld: 3931, bad: 0, nuevosOk: 1195 }`. Las 3931 entradas que antes
eran validas siguen igual (mismo titulo, mismos criterios, `objetivo: ''`). Solo cambian
entradas que antes eran invalidas. **Ningun fichero valido de hoy cambia de significado.**
Un `>` sangrado o puesto despues de un criterio sigue siendo prosa suelta.

## Windows: 8.3 y espacios

- La ruta del repo lleva espacios. El comando que imprime `plan` va entrecomillado y
  funciona tal cual, copiado y pegado.
- `TMP`/`TEMP` con el nombre 8.3 de un directorio de dentro del repo, y cwd en
  nombre largo: `plan` responde «(No se pudo escribir la particion propuesta: el
  directorio temporal "...\repo con espacios\tmpdentro" cae dentro del repo.)».
  No escribe nada y `git status` queda limpio.
- `taskctl` solo funciona desde la raiz del repo (`tareas` va relativo al cwd), asi
  que el caso de lanzarlo desde un subdirectorio no se da.

## Mutantes (contra el fichero de test concreto, sobre dist/ del clon)

| Mutante | Test | Resultado |
|---|---|---|
| sin comprobar `estaDentro` | particion.test.js | muerto |
| umbral de frentes `>= 3` | particion + validacion-tarea | muerto |
| `>` aceptado tras un criterio | import-parser + import | muerto (2) |
| sin grupos en negrita | particion.test.js | muerto (4) |
| sin `realpath` en la base | particion.test.js | muerto |
| sin numerar titulos repetidos | particion.test.js | **vivo** (MEN-2) |
| sin `hijasGrandes.push` | particion.test.js | **vivo** (MEN-2) |
| `citar` sin `>` en lineas en blanco | particion.test.js | **vivo** (MEN-2) |

## Reproduccion de cada hallazgo

### MEN-1 — El deduplicado de titulos no coincide con la clave de duplicados de import

`proponerParticion` compara los titulos en minusculas. Import, en cambio, compara
`normalizedTitleKey`: el slug, sin diacriticos y **cortado a 40 caracteres**. Como
el prefijo `TASK-NNN ` se come 9, dos frentes que comparten sus primeros ~31
caracteres dan el mismo slug, y lo mismo dos frentes que solo se distinguen en
una tilde. Tambien falla el sufijo «(2)», porque queda fuera de los 40 caracteres
cuando el titulo es largo.
Reproducido con `bin/taskctl`: una tarea de 18 criterios con los frentes
«Migracion del comando de importacion: parser» y «...: escritura» da una propuesta
de 4 tareas. Al importarla: `Omitida "TASK-090 Migracion del comando de importacion:
escritura": ya existe una tarea con el titulo normalizado
"task-090-migracion-del-comando-de-import"` y `3 creada(s), 1 omitida(s)`.
Lo llevo a MENOR porque import lo dice, la tarea padre conserva sus criterios y basta
renombrar en el fichero y reimportar. Ademas, ningun caso real llega ahi.
Sugerencia: deduplicar con `normalizedTitleKey` (o `slugify`) y, si chocan, meter el
numero en el prefijo (`TASK-090.2 ...`) para que caiga dentro de los 40 caracteres.

### MEN-2 — Tres comportamientos sin test (mutantes vivos)

La tabla de arriba lo muestra. Quitar la numeracion de titulos repetidos, el aviso
«Ojo: ... sigue(n) con mas de 12» o el `>` de las lineas en blanco (que separa los
parrafos del Objetivo citado) deja `particion.test.js` en verde. Comprobe a mano que
el codigo actual hace lo correcto: frente de 10 + Transversal de 4 da
`hijasGrandes: ['TASK-9 Uno']`. Lo que falta es solo el test.

### MEN-3 — Bordes de la deteccion de grupos

Probado con los modulos de `dist/`:
- `**Tras el cierre**` en negrita (no como `###`) abre un **frente**, y su criterio
  pasa a ser un criterio normal de una hija «TASK-900 Tras el cierre». No es
  incoherente con TASK-046, que solo reconoce el `###`, pero si es sorprendente.
- `**Comunes a ambos**` no cuenta como transversal y sale como hija propia: solo
  se reconocen las palabras exactas de `GRUPOS_TRANSVERSALES`.
- `**Nota** leer **antes**` se toma como cabecera de grupo, con titulo
  `Nota** leer **antes`, porque la regex lazy retrocede.
Es MENOR porque el resultado es una propuesta que revisa una persona, y el barrido de
las 54 tareas reales no da ningun falso positivo.

### MEN-4 — La skill no documenta la particion ni el `> Objetivo` de import

`skills/task-workflow/SKILL.md:364` describe la puerta de `plan` sin mencionar
la propuesta de particion, los grupos por `###` o negrita, el aviso de 2+ frentes
ni la nueva sintaxis `> ...` del fichero de import. Esta skill es lo que leen
los agentes en los proyectos que instalan el plugin. El mensaje de error si lo explica.

### MEN-5 — JSDoc huerfano

En `tarea-body.ts:105` quedan dos bloques `/** */` seguidos delante de
`textoDeCabecera`. El que dice «El titulo de una cabecera ATX, sin almohadillas
ni diacriticos» pertenece a `tituloDeCabecera`, que se ha quedado sin su doc.
Es cosmetico.

## Notas sin hallazgo

- La desviacion del AC1 (frentes contados en los criterios y no en el Objetivo,
  y aviso en vez de bloqueo con 12 criterios o menos) esta anotada en las decisiones
  del orquestador. Sigue pendiente de que la acepte una persona, como dice el plan.
- Cada `plan` bloqueado crea un `taskctl-particion-<ID>-XXXX` nuevo en el directorio
  temporal y no lo limpia. Es intencionado (decision 7: no pisar una propuesta editada).
