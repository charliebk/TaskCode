# Informe de revision — TASK-167a (ronda 1)

- Commit revisado: af87a4195849627ba94283d27a910facdf4b34ad
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MENOR-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/duplicacion.md:20 | implementacion |
| MENOR-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md:85 | implementacion |
| MENOR-3 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/skills/start/SKILL.md:32 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Alcance: completa (primera ronda). Verificacion de la ronda: la peticion trae la
selectiva en verde (`node scripts/verificar-impacto.mjs`, salio con 0, 2064 tests,
0 fallos) sobre el commit revisado (af87a41, igual al de la cabecera); la cito y no
repito la suite. Lo que si ejecute para reproducir, en un clon en
`%LOCALAPPDATA%\pruebas-claude\taskcode\task-167a-r1` (ya borrado):
`npm install`, `npx tsc -p .` (sin errores), `node --test "dist/test/skills/**/*.test.js"`
(115 pasan, 0 fallan), y los mutantes de abajo.

### MENOR-1 — La guia omite dos patrones que las auditorias repiten mucho
- Donde: skills/task-workflow/duplicacion.md:186-207
- Que pasa: la guia recoge siete patrones (helper copiado, lector repetido, envoltorio, lista dos veces, regla entre documentos, helpers de test, correccion a medias) y cubre bien lo que mas se repite en `auditoria-4d-completa.md` y `auditoria-4d-segunda.md`: lectores de seccion/bloques (CORE1-04, CORE2-02/06), envoltorios de git/fs (CMD1-02, FS-07/08/14), listas (CORE1-08, FS-10), tests. Faltan dos familias frecuentes: (1) **el mismo concepto validado o decidido en varios sitios con reglas distintas** (regex de ID copiada ~8 veces: CORE2-01, CORE2-14, FS-04, CMD2-08; dos validaciones de fecha, dos de ruta relativa, "que plan cuenta" decidido en 4 sitios, "base de la rama" en 5: CORE1-10/11, CMD1-06/10, CMD2-01/03/04), que es mas amplio que "helper copiado" y es la causa de que dos comandos respondan distinto al mismo hecho; (2) **los textos y valores por defecto repetidos a mano** (mensajes de error x5-x6, `'sonnet'` x3, texto `aMano` copiado: CMD1-12, CMD2-06, FS-15). La primera se cubre parcialmente con "helper copiado" y "lector repetido", la segunda con "lista escrita dos veces", pero ninguna lo nombra.
- Reproduccion: lectura cruzada de las dos auditorias contra los siete patrones de la guia (`Grep "| Duplicaci"` sobre `docs/auditoria-4d-completa.md`, 70 de ~120 filas leidas, mas la segunda). Hay margen: la guia pesa 2119 B con CRLF y su tope es 3072 B (`test/skills/tamanos.test.ts`).
- Impacto: un agente que repase el diff con la lista no recibe la pista de buscar "la misma decision en varios sitios" (la de mayor coste segun las auditorias) salvo que la deduzca de "helper copiado".
- Sugerencia: ampliar una viñeta ("El mismo hecho decidido en varios sitios: ID, fecha, ruta valida, rama base, 'fichero de test'; si dos comandos pueden contestar distinto, es duplicacion aunque el codigo no se parezca") y anadir "textos de error y defaults repetidos" a "La lista escrita dos veces". No bloquea: el criterio de aceptacion se cumple con los patrones existentes y quedan ~950 B de tope.

### MENOR-2 — revision.md queda a 7 bytes de su tope (medido con CRLF)
- Donde: skills/task-workflow/revision.md:85 (y skills/task-workflow/SKILL.md, a 29 B)
- Que pasa: con CRLF `revision.md` pesa 15353 B frente a un tope de 15 KB = 15360 B (margen de 7 B) y `task-workflow/SKILL.md` pesa 15331 B frente a los 15 KB del test 18 (15360 B, margen de 29 B). Ambos tests pasan (comprobado: `tamanos.test.ts` 18/18 y el test 18 de `task-workflow.test.ts`), pero la siguiente edicion de cualquiera de los dos los rompe. La linea anadida en revision.md (`Patrones: [duplicacion.md](duplicacion.md).`) y el cambio de "(K, la ronda cuyos hallazgos corrige)" a "(K, la ronda corregida)" son lo que lo ha dejado ahi.
- Reproduccion: `wc -c` en el clon (revision.md 15353, SKILL.md 15331) frente a 15 * 1024 = 15360.
- Impacto: ninguno hoy; las partes b, c y d de TASK-167 tocaran estos ficheros y chocaran con el tope.
- Sugerencia: no subir el tope (el propio test dice "archiva o parte"); si una parte posterior necesita sitio, mover contenido a una guia hermana. Se acepta como esta; se anota por el margen.

### MENOR-3 — Linea larga en start/SKILL.md y remision ambigua
- Donde: skills/start/SKILL.md:32
- Que pasa: "patrones en `task-workflow/disfraz-tests.md` y `duplicacion.md`" mezcla una ruta completa con un nombre suelto; se lee bien, pero `duplicacion.md` no existe junto a `start/SKILL.md`, asi que el nombre solo resuelve por la ruta anterior. Ademas la linea quedo de ~90 columnas frente a las ~78 del resto del fichero, y en `code-quality-reviewer/SKILL.md:226` el reflujo dejo una linea corta ("duplicacion, en duplicacion.md. En un pase"). Es cosmetico: el 20b y el test nuevo no detectan enlaces de este tipo (van entre comillas invertidas, no son enlaces markdown).
- Reproduccion: lectura del diff; el test nuevo solo comprueba `/`duplicacion\.md`/` en start, asi que una ruta rota no se cazaria. No lo mute: es una observacion de lectura.
- Impacto: ninguno funcional.
- Sugerencia: escribir `task-workflow/duplicacion.md` en start, igual que en review; ajustar el reflujo. Se acepta no corregir si no compensa una ronda.

Sin CRITICO ni IMPORTANTE. Lo que se ejecuto para llegar a esa conclusion (ademas de la verificacion de la peticion):

- Utilidad para un proyecto cualquiera: `duplicacion.md` (2119 B) solo habla de funciones, parsers, listas, tests y documentos; sin TaskCode, rutas del repo ni TASK-NNN (grep -i "taskcode|tareas/|TASK-" sin resultados; y el test 21 de `task-workflow.test.ts` pasa). Los ejemplos son genericos ("lector de secciones de un markdown", "lanzar git").
- Remisiones sin frases rotas (leidas en el diff): start, review, revision.md (viñeta Duplicacion), task-workflow/SKILL.md (linea "Tests y Regla 4D", con sus cuatro enlaces) y las cinco revisoras (la misma frase "los patrones de duplicacion, en duplicacion.md").
- Tamanos con CRLF: `duplicacion.md` es CRLF (comprobado con `file`) 2119 B frente a 3 KB; `tamanos.test.ts` 18/18 y test 18 de `task-workflow.test.ts` en verde.
- Mutacion, con `node --test dist/test/skills/regla-4d.test.js dist/test/skills/task-workflow.test.js` (36 tests, 36 pasan de base) y restaurando con `git checkout -- skills` entre mutantes:
  1. quitar la remision de `rust-wasm-reviewer` a la guia: cae el test 11 de regla-4d.test.ts.
  2. quitar `y duplicacion.md` de `start/SKILL.md`: cae el 11.
  3. quitar la linea `Patrones:` de `revision.md`: cae el 11.
  4. renombrar el patron "El lector repetido" de la guia: cae el 11.
  5. quitar el enlace a `duplicacion.md` de `task-workflow/SKILL.md`: cae el 20b (la guia queda huerfana).
  6. quitar la remision de `review/SKILL.md`: cae el 11.
  7. quitar el fichero de la guia (no se instala): caen el 11 de regla-4d, el 10 y el 20 de task-workflow.test.ts (enlaces rotos). 7 de 7 mutantes detectados.

## Regla 4D

- Duplicacion: cumple. La guia no repite a `revision.md` (alli solo la definicion de la D y la severidad, y la remision) ni a `disfraz-tests.md` (que trata de tests que no discriminan; la guia solo toca los helpers de test por fichero, otro asunto). La guia sigue el modelo de `disfraz-tests.md`. El test nuevo reutiliza `leer`, `seccion` y `cargarCatalogoRevisores` ya existentes en regla-4d.test.ts. La autorrevision cita los usos buscados.
- Desviacion: cumple. El diff se limita a la guia, a sus remisiones, a dos tests y al tope; el cambio de "(K, la ronda cuyos hallazgos corrige)" por "(K, la ronda corregida)" en revision.md es un recorte para caber (ver MENOR-2), sin cambio de sentido.
- Diluvio: cumple. 34 lineas de guia, una viñeta por patron.
- Disfraz: cumple. El test nuevo se muta de seis formas y cae cada vez (ver arriba); no asevera con `assert.ok` generico. Lo unico que no distingue es la ruta completa de la remision en start (MENOR-3).

## Lecturas fuera del contexto permitido

- docs/auditoria-4d-completa.md: la tarea y la peticion piden contrastar los patrones de la guia con las auditorias; leidas las filas de duplicacion con grep.
- docs/auditoria-4d-segunda.md: idem, por la segunda auditoria (filas C1-x y C2-x).
- taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts: citado en la peticion de revision del encargo (test 18) para confirmar el tope de 15 KB con CRLF.
