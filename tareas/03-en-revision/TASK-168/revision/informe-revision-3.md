# Informe de revision — TASK-168 (ronda 3)

- Commit revisado: d69cc7b673094417609bb2cc9aca40163bc60145
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:329 | plan |
| IMP-2 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:84 | implementacion |
| NUEVO-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js:67 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Alcance y metodo. Puerta: la peticion trae la verificacion selectiva en verde para el commit revisado
(d69cc7b: `node scripts/verificar-impacto.mjs`, 732 tests, 0 fallos, 97.6 s), asi que no la repeti.
En un clon nuevo en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-168-r3` (checkout de d69cc7b) hice
`npm install`, `npx tsc -p .` (sin errores) y `node --test dist/test/scripts/verificar-impacto.test.js`:
29 tests, 29 ok. Despues hice la mutacion y la reproduccion de abajo, todo sobre el mismo clon. El clon
se ha borrado al terminar y no tenia commits ni cambios que conservar.

### Verificacion de las correcciones pendientes

- **IMP-1 (corregido).** La condicion `loNombra` aplica `sinComentarios` solo cuando el nombre es
  `SKILL.md`, y exige la carpeta de la skill fuera de comentarios. Lo cubren los tests
  `TASK-168: un .md de skill o agente...` (que pasa con el helper correcto) y el fixture
  `usa-comenta.test.ts`, que no debe arrastrar a quien cita la skill solo en comentarios. No he vuelto a
  barrer las 13 carpetas de skill: eso ya se hizo en la ronda 2 y el diff de esta ronda no toca la
  condicion.
- **IMP-2 (corregido, verificado).** `scripts/verificar-impacto.mjs` ya no tiene su propio
  `sinComentarios`: importa `sinComentariosC` del build versionado del plugin (linea 84). El fixture
  `test/glob-flujo.test.ts` (con `'lib/*'`, un `*/` posterior y `'a//b'` seguido de la mencion) se elige
  y se verifica. Mutacion: ver abajo. El caso `'**/*.ts'` seguido de la mencion, que pedia la ronda 2,
  esta cubierto por el mismo fixture (`'lib/*'`, que contiene `/*` dentro de cadena).

### Mutacion

Sustituir la linea 84 (import de `sinComentariosC`) por la funcion ingenua de c879a36 (sin respetar
cadenas): `node --test dist/test/scripts/verificar-impacto.test.js` → 27 ok, 2 rojos:
`TASK-156: un .md de skills/, agents/ o docs/...` y `TASK-168: un .md de skill o agente no elige a
quien solo cita test/skills/...`. La red de regresion existe para IMP-2. Script restaurado con
`git checkout -- scripts/verificar-impacto.mjs`; despues `git status` solo mostraba el `package-lock.json`
del clon (ver nota).

### Clon limpio y recompilacion

- El import desde `scripts/` funciona en un clon limpio: `taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js`
  esta versionado (la lista blanca de `.gitignore`, `!dist/src/`), y `sinComentariosC` se exporta en la
  linea 53. Tras `npm install` y `npx tsc -p .` el arbol no cambio en `dist/`.
- Recompilar mientras corre: el import es estatico y se resuelve al arrancar el script. ESM cachea el
  modulo, asi que un `tsc` posterior en el mismo proceso no cambia la funcion que se esta usando. Esto
  es razonamiento sobre la semantica de ESM: no lo he reproducido con un proceso que reescriba `dist/`
  durante la ejecucion. La restauracion de `dist/src` tras una ejecucion cortada la cubren los tests
  `una ejecucion cortada a mitad...` y `conDistProtegido...` (ambos ok).

## NUEVO-1 — `sinComentariosC` no trata las plantillas (backtick) como cadena: una URL antes de la mencion se come la mencion

- Donde: `taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js:67` (el
  `//` que no mira si esta dentro de una plantilla). Lo usa `loNombra` en `scripts/verificar-impacto.mjs:329`.
- Que pasa: el helper reconoce comillas simples y dobles como cadenas, pero no las plantillas con
  backtick. Un `//` dentro de una plantilla (una URL, por ejemplo) recorta el resto de la linea, y con el
  la mencion que venga despues.
- Reproduccion (en el clon, con el helper de dist y la funcion de la ronda 2 como referencia):
  - `const u = \`https://e.com/x\`; const r = path.join(P, "plan", "SKILL.md");` → helper actual: la
    mencion **no** se conserva (false). Funcion de la ronda 2 (`sinComentarios` ingenua): **si** se
    conserva (true).
  - Control: `const u = 'a//b'; const r = 'plan/SKILL.md';` → el helper actual la conserva (true). Asi
    que lo que falla es el backtick, no el `//`.
- Lo introduce la correccion: la version de la ronda 2 conservaba la mencion. Es la misma familia que
  IMP-2 (se pierde una mencion real y el test asociado no se elige), pero hoy no hay caso real: busque en
  `src/` y `test/` del plugin las lineas con backtick y `//` (22 ficheros) y ninguna tiene una mencion de
  skill en la misma linea. Por eso lo clasifico MENOR: es un borde sin consecuencia actual. Si Carlos
  prefiere tratarlo como IMPORTANTE, el veredicto pasa a `cambios-solicitados`.
- Correccion sugerida (no hecha aqui): tratar el backtick como cadena en `sinComentariosC` (hasta el
  siguiente backtick), o anadir al fixture `glob-flujo` una linea con una plantilla que contenga `//`
  seguida de `plan/SKILL.md`, y comprobar que el test la elige.

## Notas (fuera de la tabla, no abren ronda)

- El helper no quita las lineas que empiezan por `#`, que la version de la ronda 2 si quitaba. Efecto:
  una mencion en una cabecera de `.md` (`# Ver plan/SKILL.md`) o en un comentario `#` de un `.yml` o
  `.sh` ya cuenta como mencion. Selecciona algun test de mas, en la direccion segura. Comprobado con
  `sinComentariosC('# Ver plan/SKILL.md\nTexto')`, que conserva la mencion.
- `npm install` en el clon modifico `taskcode-marketplace/plugins/taskcode-plugin/package-lock.json`
  (anadio 3 paquetes). El diff de esta ronda no toca `package*.json`, asi que no viene de estas correcciones.
  Lo dejo anotado por si el lockfile versionado no esta sincronizado con `package.json`.

## Regla 4D

- Duplicacion: cumple. `scripts/verificar-impacto.mjs` ya no reimplementa `sinComentariosC`: reutiliza el helper del plugin (IMP-2 cerrado en esta parte).
- Desviacion: cumple. El diff de la ronda toca solo la seleccion, sus fixtures y el import. El import de un modulo del plugin desde `scripts/` acopla el script a `dist/src` versionado, pero es lo que pidio la ronda 2 y el script ya depende del plugin compilado.
- Diluvio: cumple. Una funcion reutilizada, sin capas nuevas.
- Disfraz: cumple con nota. Los tests de la ronda discriminan (la mutacion de la linea 84 los pone rojos). NUEVO-1 no es un test que prometa algo falso: es un caso (backtick con `//` antes de la mencion) que ningun test cubre.


## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/doctor-deploy-reglas.js` (lectura de las lineas 45-70 y `grep` de `sinComentariosC`): para contrastar el helper con IMP-2 y reproducir NUEVO-1.
- `taskcode-marketplace/plugins/taskcode-plugin/.gitignore` (en el clon): para confirmar que `dist/src` esta versionado.
- `tareas/03-en-revision/TASK-168/revision/informe-revision-2.md` y la peticion de esta ronda: para cerrar IMP-1, IMP-2 y su origen.
- Busqueda de backticks con `//` en `src/` y `test/` del plugin (solo lectura, sin editar): para medir el alcance de NUEVO-1.

- NUEVO-1 aceptado: sinComentariosC no trata las plantillas con acento grave como cadena; hoy ningun fichero del plugin tiene un // en una plantilla seguido de una mencion de skill en la misma linea. Queda en el backlog.
