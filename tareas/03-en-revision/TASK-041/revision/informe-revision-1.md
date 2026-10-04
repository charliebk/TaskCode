# Informe de revision — TASK-041 (ronda 1)

- Commit revisado: 4878298381ef62a58318d3b64cde7fd305a30fce (HEAD de la rama; incluye el recorte de la skill posterior a la peticion)
- Revisor: code-quality-reviewer (agente independiente, no implemento la tarea)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts:127-130 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:300 |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/new-contenido.test.ts:98 |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts:86 |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts:113-122 |
| MEN-6 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts:55 |
| MEN-7 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts:308-312 |

Ningun CRITICO ni IMPORTANTE.

## Entorno y evidencia general

- Clon limpio de `feature/task-041-f4-t1-taskctl-new-con-objetivo-y-criteri` en
  un temporal (HEAD 4878298), `npm install && npm run build`: el `dist/`
  regenerado no difiere del commiteado (`git status` limpio tras el build).
- Suite completa una vez (`npm test`): **930 tests, 927 pass, 3 fail**. Los tres
  rojos son los conocidos de Windows: `approve ... error de stat que NO sea
  ENOENT` (#119), `plan ... error de escritura que NO sea EEXIST` (#285) y
  `plan ... rama base real ... estado distinto` (#291). Ningun cuarto rojo.
- CLI real en un repo Git temporal (`main` + `develop`):
  `taskctl new --titulo "Prueba CLI" --tipo feature --objetivo "Que X | haga #Y.<LF>Segunda linea" --criterio "A | pasa" --criterio "# empieza por almohadilla" --criterio "- empieza por guion" --criterio "multi<LF>linea" --criterio "[x] ya marcado"`
  crea TASK-001 en un unico commit `chore(TASK-001): tarea creada`, workspace
  limpio. `taskctl plan TASK-001` la acepta (no aborta por objetivo vacio) y
  la peticion de brainstorm muestra el objetivo de dos lineas y los criterios;
  `extraerSecciones` sobre el tarea.md devuelve
  `["A | pasa","# empieza por almohadilla","- empieza por guion","multi","[x] ya marcado"]`.
  `|`, `#` al inicio y `- ` al inicio se conservan bien. El salto de linea en
  un criterio, no (MEN-1).
- `--criterio=--no-force funciona` funciona; `-v da verbose` como `--objetivo`
  tambien.
- `--desde` con fichero dentro del repo sin commitear: aborta con
  `[ERROR] Hay cambios sin guardar en "develop". ...`, sin escribir ni
  commitear nada (`?? borrador.md` es lo unico en `git status`). Correcto pero
  generico (MEN-6).
- `--desde` con fichero commiteado, CRLF y cabecera `## CRITERIOS DE ACEPTACIÓN`
  (mayusculas y tilde): reconocido; `- uno` y `* dos` pasan a casillas.
- `--desde <directorio>`: `No se pudo leer --desde "tareas": EISDIR ...`, sin
  commit. Claro.
- `import` no se ve afectado: `import.ts` no esta en el diff, sus tests pasan,
  y un `taskctl import` real de dos entradas `###` (una con un criterio
  `- --objetivo no es flag aqui`) crea las dos tareas con sus criterios tal
  cual, en un commit.
- Mutantes (`timeout 300 node --test dist/test/commands/new-contenido.test.js`,
  sobre `dist/src/commands/new.js`, restaurado con `git checkout` tras cada uno):
  - M1 `criterios.push(v)` -> `criterios = [v]` (el ultimo gana): **muerto** (1 fail).
  - M3 `vinetasComoCasillas` devuelve la linea sin tocar: **muerto** (1 fail).
  - M2 quitar la exclusion `--desde` + `--objetivo/--criterio`: **sobrevive**
    (MEN-3).

## Reproduccion de cada hallazgo

### MEN-1 — un `--criterio` o `--objetivo` con salto de linea o cabecera `##` no sobrevive al parser de `plan`

`componerCuerpo` interpola el texto tal cual. Un criterio multilinea deja la
segunda linea sin indentar, y `extraerSecciones` la descarta (no es checklist
ni continuacion indentada):

```
taskctl new ... --criterio "multi
linea"
# tarea.md:   - [ ] multi\nlinea
# extraerSecciones -> criterio "multi"; "linea" desaparece para plan/heuristica
```

Y un `--objetivo` que contiene una linea `## Criterios de aceptacion` roba la
seccion: con `--objetivo "Texto<LF>## Criterios de aceptacion<LF>- [ ] colado" --criterio real`,
el tarea.md tiene dos cabeceras de criterios, manda la primera (decision 3 de
`tarea-body.ts`) y el criterio `real` se pierde para `plan`. Sin perdida en
disco (el texto esta en el fichero), pero si silenciosa en lo que lee `plan`.
Correccion sugerida: indentar con dos espacios las lineas de continuacion de
cada criterio, o rechazar saltos de linea en `--criterio` y cabeceras `##` en
`--objetivo`. El plan solo aceptaba el riesgo de saltos de linea en
`--objetivo`.

### MEN-2 — `new` sigue diciendo "Rellena ## Objetivo..." aunque se hayan pasado

Las tres salidas exitosas del CLI de arriba (con `--objetivo`/`--criterio` y con
`--desde`) imprimen `Rellena "## Objetivo" y los criterios de aceptacion antes
de "taskctl plan"`. Con TASK-041 ese aviso deberia salir solo si el cuerpo es
`DEFAULT_BODY` (p. ej. devolverlo en el resultado de `runNewCommand`).

### MEN-3 — el test de exclusion `--desde` + `--criterio` no prueba la exclusion

El caso `['--desde', 'x.md', '--criterio', 'A']` usa un fichero que no existe,
asi que lanza `NewTaskArgError` por el `readFile`, no por la exclusion. El
mutante M2 (`if (false && contenido.desde !== null && ...)`) pasa 4/4. Con la
exclusion quitada, `--desde <fichero real> --criterio A` ignoraria el criterio
en silencio. Basta con que el caso apunte a un fichero existente fuera del repo.

### MEN-4 — un valor que empieza por `--` se rechaza con un mensaje enganoso

`taskctl new --titulo X --tipo feature --objetivo o --criterio "--no-force funciona"`
-> `[ERROR] --criterio necesita un valor: --criterio "<texto>".` El valor si
esta; el error no menciona que la forma `--criterio=--no-force funciona` (que
si funciona) es la salida. Rechazarlo es razonable (coherente con `parseArgs`);
el mensaje deberia decir la alternativa.

### MEN-5 — `vinetasComoCasillas` y `extraerSecciones` no cortan secciones igual

`vinetasComoCasillas` trata `#` de nivel 1 como cabecera (`/^#{1,6}\s/`) y
convierte cualquier vineta, tambien las anidadas: un `--desde` con
`- uno` / `  - anidado` / `* dos` en criterios produce tres criterios de primer
nivel (`- [ ] uno`, `- [ ] anidado`, `- [ ] dos`), perdiendo la jerarquia; y una
linea `# comentario` dentro de un bloque de codigo en la seccion de criterios
apagaria la conversion de lo que sigue, cosa que `extraerSecciones` evita a
proposito (decision 2 de `tarea-body.ts`). Borde, sin perdida de texto.

### MEN-6 — `--desde` dentro del repo sin commitear: el error no nombra el fichero, y la ayuda no lo avisa

El plan dice "el mensaje de ayuda lo dice"; la ayuda (`cli.ts:55`) y la skill
solo anaden la sinopsis. El error real es el generico del guard (`Hay cambios
sin guardar en "develop"...`), que no apunta a que la causa es el propio
fichero de `--desde`. Es la misma trampa que `import` ya documenta. Bastaria
una linea en la ayuda/skill, o detectar que el fichero de `--desde` es el
unico cambio y decirlo.

### MEN-7 — `--desde` con un fichero vacio crea la tarea con el cuerpo por defecto sin avisar

`taskctl new --titulo X7 --tipo feature --desde vacio.md` (0 bytes) -> exit 0,
tarea con `DEFAULT_BODY`, commit hecho. Un `--criterio ""` aborta por vacio;
un `--desde` vacio, por coherencia, tambien deberia (casi seguro es un error
de ruta o de redireccion).
