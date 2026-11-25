# Informe de revision — TASK-158c (ronda 1)

- Commit revisado: 9369bf40f67cc106caebd939ba3cd5d755bb219a
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:534 | implementacion |
| MEN-1 | MENOR | corregido | scripts/verificar-impacto.mjs:717 | plan |
| MEN-2 | MENOR | aceptado | scripts/verificar-impacto.mjs:715 | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Puerta: la peticion trae la verificacion de la ronda en verde (730 tests, 0 fallos) con `Commit verificado` igual al `Commit revisado`; se cita y no se repite la suite. En el clon (`npm install`, `npx tsc -p .`: sin errores) se corrieron solo los tests de `verificar-impacto.test.js` que cubren lo revisado (`--test-name-pattern`): los 3 de TASK-158c/143c en verde. No hay linter configurado que se haya ejecutado aparte de `tsc`.

### IMPORTANTE-1 — El head del marcador de huerfanas no tiene ningun test que lo proteja
- Donde: scripts/verificar-impacto.mjs:534 (escritura del marcador) y :754 (lectura en `restaurarHuerfana`)
- Que pasa: el segundo test de la tarea («copia huerfana de otro commit») escribe a mano un `marcador.json` con `head`, de modo que solo prueba la lectura. Nada comprueba que `conDistProtegido` escriba `head` en el marcador. Si no lo escribe, una ejecucion cortada (la que importa: el proceso muere con la copia tomada en otra rama) vuelve a devolver la copia de otro commit al arrancar la siguiente, que es justo la carrera que la tarea cierra.
- Reproduccion: en un clon en 9369bf4, se quita `head` del `JSON.stringify` del marcador (mutante M5: `JSON.stringify({ dirPlugin, habiaDist, pid: process.pid })`). Con `node --test --test-name-pattern="TASK-158c" dist/test/scripts/verificar-impacto.test.js`: `pass 2 / fail 0`. Con el patron ampliado `cortada|huerfana|HEAD|TASK-136|143c`: `pass 9 / fail 0`. Ningun test se entera.
- Impacto: una proteccion nueva (la mitad de «y en el marcador» del plan, punto 1) puede romperse sin ruido; el caso de orfandad real queda sin red.
- Sugerencia: un test que escriba el marcador por el camino real (p. ej. `fn` que lee `marcador.json` de `dirCopia(dir)` y comprueba que `head` es el sha de `git rev-parse HEAD`), o el flujo completo: tomar la copia, simular el corte sin devolver, cambiar de rama y entrar de nuevo.

### MENOR-1 — `git checkout` y `git clean` no se comprueban; el aviso afirma un estado que puede no darse
- Donde: scripts/verificar-impacto.mjs:717-718
- Que pasa: `git()` devuelve `null` si falla y el codigo lo ignora; el aviso dice siempre «lo dejo como esta en el HEAD actual». Dos casos construidos: (a) dist/src no versionado en el HEAD actual (y no ignorado): el `checkout` falla (pathspec sin coincidencia) y el `clean -fdq` borra TODO dist/src, lo que la segunda barrera de TASK-136 queria evitar («bin/taskctl dejaria de arrancar»); (b) `index.lock` tomado por el otro proceso git (justo el escenario de la carrera): el `checkout` falla, el `clean` solo quita lo no versionado y dist/src queda con la salida de compilacion de la otra rama, arbol sucio, y el aviso dice lo contrario.
- Reproduccion: repo temporal con el plugin en `sub/plugin/`, dist/src commiteado en `main`, `git rm -r --cached sub/plugin/dist` antes del commit (dist/src queda en disco, sin versionar), `conDistProtegido(sub/plugin, fn)` con `fn` que cambia a otra rama: tras la llamada `readFileSync(dist/src/x.js)` lanza ENOENT (dist/src borrado) y el aviso se imprimio igual. Con dist/src versionado y plugin en subcarpeta funciona bien (ver abajo).
- Impacto: en este repo dist/src esta versionado, asi que (a) no ocurre hoy; (b) es poco probable. Pero un fallo silencioso con mensaje falso es peor que una caida.
- Sugerencia: comprobar el retorno de `checkout`; solo si funciona, `clean`; si falla, avisar con el texto verdadero y dejar dist/src como esta. Aceptable corregirlo o dejarlo `aceptado` con este motivo.

### MENOR-2 — Si HEAD cambia, se descarta tambien lo que dist/src tuviera sin commitear
- Donde: scripts/verificar-impacto.mjs:715
- Que pasa: el HEAD cambia tambien con un commit normal en la misma rama (no solo un cambio de rama). Entonces la copia se descarta y `checkout HEAD -- dist/src` pisa cualquier dist/src sin commitear que la persona tuviera al tomar la copia. Es salida de compilacion regenerable (`npm run build`), y el plan lo declara como riesgo aceptado, con aviso de los dos SHA.
- Reproduccion: razonado sobre el codigo, no ejecutado.
- Impacto: bajo; se regenera compilando.
- Sugerencia: dejarlo `aceptado` con este motivo; opcionalmente distinguir «otra rama» de «avance de la misma» (p. ej. `merge-base --is-ancestor head ahora`) y en el segundo caso devolver la copia.

### Comprobaciones pedidas (con resultado)

- Plugin en subcarpeta: repo con el plugin en `sub/plugin/` y dist/src versionado. Con la copia tomada en `main` y cambio de rama durante `fn`: dist/src queda con el contenido de la otra rama (`v2`), `nuevo.js` desaparece, un fichero no versionado en `sub/plugin/otro-no-dist.txt` y otro bajo `dist/otrodir/` (hermano de dist/src) NO se tocan. El pathspec relativo (`dist/src` con `cwd = dirPlugin`) funciona y `git clean` queda acotado a dist/src: no borra nada que no sea la salida de compilacion. Los tests de la tarea solo cubren el caso con dist/src en la raiz del repo, no la subcarpeta (la forma real); lo anoto, no es hallazgo porque la comprobacion manual pasa.
- dist/src sin versionar o checkout que falla: MENOR-1.
- Fuera de Git (HEAD null): `conDistProtegido` sobre un directorio sin repo devuelve la copia como antes (x.js recuperado a su valor original). Marcador viejo sin `head`: se restaura la copia como antes y se borra (`x.js = vieja`). Ambos correctos.
- `perfil-tests.mjs` (otro llamador, linea 210): la firma de `conDistProtegido` no cambia, `fn` async sigue yendo por el `.finally(cerrar)`; sin cambios de comportamiento fuera de Git o sin cambio de HEAD. No se rompe.
- Mutacion sobre el codigo nuevo (con `--test-name-pattern="TASK-158c"`): M1 condicion de HEAD siempre falsa: rojo (0 pass, 2 fail); M2 sin `git clean`: rojo; M3 sin `git checkout`: rojo; M4 `restaurarHuerfana` ignora el head: rojo; M6 no anotar HEAD al tomar la copia: rojo; M7 cierre sin pasar `head` a `devolver`: rojo; M5 marcador sin `head`: VERDE (IMP-1). Todo restaurado con `git checkout -- scripts/verificar-impacto.mjs`.
- Candidato de duplicacion `devolver` (scripts/verificar-impacto.mjs:713) ~ `devolver` (src/fs/pendientes.ts:168): son funciones homonimas de modulos sin relacion (copia de dist/src frente a pendientes); no hay incoherencia nombrable al tocar una y no la otra. No es duplicacion.

## Regla 4D

- Duplicacion: cumple (`headDe` reutiliza `git()`; la comprobacion esta en un solo punto, `devolver`, usado por los dos llamadores)
- Desviacion: cumple (el diff se limita a la carrera de HEAD)
- Diluvio: cumple
- Disfraz: IMP-1 (proteccion del marcador sin test que caiga al quitarla); el test principal («HEAD cambia durante la ejecucion») si discrimina: 6 de 7 mutantes lo ponen en rojo

## Lecturas fuera del contexto permitido

- tareas/03-en-revision/TASK-158c/revision/peticion-revision-1.md y taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md: los pide la propia instruccion de la ronda (formato del informe y Regla 4D).
- scripts/perfil-tests.mjs (solo la linea 210 y los usos de `conDistProtegido`): para comprobar que el otro llamador no se rompe.

- MEN-2 aceptado: riesgo ya recogido en el plan; dist/src es salida de compilacion regenerable y, con HEAD cambiado, la copia ya no es de ese commit.
