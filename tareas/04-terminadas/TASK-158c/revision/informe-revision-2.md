# Informe de revision — TASK-158c (ronda 2)

- Commit revisado: 5bf9f9917aa332450e60bcabe824e4fd5bcaf520
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:534 | implementacion |
| MEN-1 | MENOR | corregido | scripts/verificar-impacto.mjs:719-720 | plan |
| MEN-2 | MENOR | aceptado | scripts/verificar-impacto.mjs:715 | plan |

Sin hallazgos nuevos. Ninguno CRITICO ni IMPORTANTE abierto, y la correccion no abre fallos nuevos (ver las mutaciones y la nota sobre `git clean`).

Puerta: la peticion trae la verificacion de la ronda en verde para el commit revisado (`Commit verificado` = 5bf9f99, 731 tests, 0 fallos) y se cita sin repetir la suite. En el clon de revision (`npm install`, `npx tsc -p .`: sin errores) corri el fichero `verificar-impacto.test.js` completo: 28 tests, 28 pasan, 0 fallos (87,5 s).

### IMP-1 — corregido (el marcador lleva `head` y un test lo protege)

- Verificacion: en el clon se quito `head` del `JSON.stringify` del marcador (mutante) y se ejecuto `node --test --test-name-pattern="TASK-158c|cortada|huerfana|HEAD|TASK-136|143c" dist/test/scripts/verificar-impacto.test.js`: `not ok 8 - TASK-158c: si HEAD cambia durante la ejecucion...`, `pass 9 / fail 1`. En la ronda 1 el mismo mutante daba `pass 9 / fail 0`. Ahora el test nuevo (`assert.equal(marcador.head, headMain)`) lo detecta. Restaurado con `git checkout -- scripts/verificar-impacto.mjs`.

### MEN-1 — corregido en lo que afirma el aviso (con un residuo menor, ver nota)

- Verificacion: el `checkout` ahora se comprueba (`restaurado`) y el `clean` solo corre si el `checkout` funciona. Con el mutante `git clean` incondicional, el test nuevo `TASK-158c (MEN-1 de su revision)...` cae: `not ok 10`, `pass 9 / fail 1`. Y con el mutante que fuerza el texto antiguo del aviso (`lo dejo como esta en el HEAD actual` siempre), el mismo test cae. Los dos casos del hallazgo quedan cubiertos: dist/src sin versionar (el `checkout` falla y el `clean` no borra nada; el test comprueba que `x.js` sigue con `compilado` y que el aviso dice `no he podido sacarlo de Git`) y el `checkout` que funciona (camino de siempre).

### MEN-2 — aceptado (sin cambios en el diff de esta ronda)

- El diff de la ronda no toca el comportamiento de "HEAD avanza en la misma rama": se sigue descartando la copia y se pisa el dist/src sin commitear. Se mantiene el riesgo aceptado en el plan (salida de compilacion regenerable, con aviso de los dos SHA).

### Nota (MENOR, no abre ronda)

- El residuo de MEN-1: el resultado de `git clean` sigue sin comprobarse. Si el `checkout` funciona y el `clean` falla (por ejemplo, un fichero no versionado bloqueado por otro proceso en Windows), el aviso "lo dejo como esta en el HEAD actual" puede no ser cierto del todo. No lo he reproducido: el fallo del `clean` depende del bloqueo de ficheros de Windows y no lo he podido construir de forma fiable en este entorno (no verificado). Si se quisiera cerrar del todo: comprobar tambien el retorno del `clean` y, si falla, avisar con el texto real.
- Al fallar el `checkout` en un dist/src sin versionar, la copia se borra igualmente (`rmSync(copia)`). Es el comportamiento previo a esta ronda y el aviso lo dice ("npm run build lo regenera"): es salida de compilacion, asi que no es perdida de datos real. Anotado, no es hallazgo.
- Los tests de la tarea siguen usando dist/src en la raiz del repo; la forma real (plugin en subcarpeta) se comprobo en la ronda 1 por inspeccion manual y la correccion no la cambia.

## Regla 4D

- Duplicacion: cumple (la comprobacion de `checkout` y `clean` vive en un solo punto, `devolver`, que usan los dos llamadores; no se reimplementa).
- Desviacion: cumple (el diff de la ronda se limita a la rama de HEAD cambiado, al aviso y al marcador).
- Diluvio: cumple (dos lineas de logica nueva y un test).
- Disfraz: cumple (el test del marcador y el del `clean` discriminan: cada mutante de la correccion deja un test en rojo, ver IMP-1 y MEN-1).

## Mutaciones y ejecuciones (lista completa)

- Suite de `verificar-impacto.test.js` sobre 5bf9f99 sin cambios: 28/28 en verde.
- Mutante A (quitar `head` del marcador): `pass 9 / fail 1` con el patron de tests afectados. Rojo.
- Mutante B (`git clean` incondicional): `pass 9 / fail 1` con el mismo patron. Rojo.
- Mutante C (aviso con el texto antiguo siempre): `pass 9 / fail 1`. Rojo.
- Restauracion tras cada mutante con `git checkout -- scripts/verificar-impacto.mjs`; el arbol del clon queda limpio salvo el `package-lock.json` que genera `npm install` (solo en el clon).

## Lecturas fuera del contexto permitido

- taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/revision.md: para la cabecera exacta del informe, la columna `Origen` y la Regla 4D (lo pide la propia peticion, "formato del informe y Regla 4D").
