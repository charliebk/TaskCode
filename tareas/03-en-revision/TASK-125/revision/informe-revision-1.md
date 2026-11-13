# Informe de revision — TASK-125 (ronda 1)

- Commit revisado: 8cde3133c9bd024e7207c690a7698d7c2e1bcda4
- Revisor: agente revisor independiente (general-purpose, skill code-quality-reviewer)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | test/hooks/freno-presupuesto.test.ts (falta caso); src/fs/verificacion.ts:~318 | implementacion |
| MEN-2 | MENOR | corregido | docs/configuracion.md (seccion «Comando y presupuesto propios del freno»); src/hooks/freno-stop.ts:~222 | implementacion |

### MEN-1 — Mutante superviviente: el memo del freno con el arbol sucio no tiene test

Mutante sobre `dist/src/fs/verificacion.js`: quitar `|| p.tipo === 'freno'` de la condicion que
decide guardar el memo (el memo del freno dejaria de guardarse con el arbol sucio). Resultado:
`config-freno.test.js` + `freno-presupuesto.test.js` en verde (13/13). Ningun test lo detecta:
el unico test que mira `freno-verificacion-rapida.json` trabaja con el arbol limpio, y el ultimo
verde del freno (TASK-111) cubre el caso verde con arbol sucio, pero no el rojo ni el `cortada`
guardados. Es una decision explicita del diff (comentario «se guarda tambien con el arbol
sucio»), asi que falta fijarla con un test (arbol sucio, dos turnos seguidos con el mismo rojo:
el segundo sale de memo y se anota `omitido`).

### MEN-2 — La doc dice que un `timeout_verificacion*` menor que el presupuesto corta como rojo; con `comando_verificacion_freno` no se aplica

`docs/configuracion.md` afirma: «un corte por un `timeout_verificacion*` menor que el presupuesto
tambien (es un rojo)». En `freno-stop.ts`, con `comando_verificacion_freno` declarado
`rapido === true` y `timeoutPlan = presupuesto`: el timeout de la completa/selectiva se ignora y
solo manda el presupuesto. La frase solo es cierta sin comando propio (es el caso del test
«un timeout de la selectiva menor que el presupuesto sigue siendo rojo»). Reproduccion: traza del
codigo (no ejecutada): config con `comando_verificacion_freno`, `timeout_verificacion: 1`,
`presupuesto_freno_s: 60` y un comando de 20 s: corre hasta 60 s y sale verde, no rojo. Basta
precisar la frase de la doc («sin comando propio»).

Nota (no es hallazgo): `CHANGELOG.md` no se toca en la rama, aunque el criterio 5 lo nombra; en este
repo lo genera `finish` (entradas «TASK-NNN (tipo) — ...»), asi que se espera al cierre.

## Verificacion hecha

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-125-r1`, `npm install` + `npm run build` sin errores.

- Tests afectados (los 8 ficheros indicados: config-freno, freno-presupuesto, freno-stop,
  freno-registro, freno-stop-documentacion, verificacion-selectiva, doctor, tamanos): 149 pass, 0 fail.
- Mutantes sobre `dist/` (conjunto: config-freno, freno-presupuesto, freno-registro, doctor):

| Mutante | Resultado |
|---|---|
| M1 el freno usa la selectiva aunque haya `comando_verificacion_freno` (`rapido = false`) | detectado (3 rojos) |
| M2 un corte por presupuesto bloquea (se anula la rama `cortada && porPresupuesto`) | detectado (2 rojos) |
| M3 `excedido` se anota como `rojo` | detectado (8 rojos en el conjunto ampliado, 2 en el reducido) |
| M4 se quita la validacion del techo 3600 del presupuesto | detectado (1 rojo) |
| M5 el memo del tipo freno se guarda en `freno-verificacion.json` (el de la completa) | detectado (1 rojo) |
| M6 se quita la exigencia de `comando_verificacion` con `comando_verificacion_freno` | detectado (1 rojo) |
| M7 el memo del freno no se guarda con el arbol sucio | SOBREVIVE (MEN-1) |

- Revision de logica sin hallazgos: el memo propio del freno no abre guardian ni `finish`
  (huella con contexto `freno\0...`, fichero aparte); el presupuesto sin comando propio tambien
  corta la verificacion de siempre; un rojo dentro del presupuesto sigue bloqueando; el recorte
  al tope del hook avisa; la documentacion se decide antes que el comando del freno.
- No se ejecuto la suite completa (modo rapido).

## Reproduccion

- Tests y mutantes: `node --test dist/test/core/config-freno.test.js dist/test/hooks/freno-presupuesto.test.js ...`
  en el clon, aplicando cada mutante con `sed` sobre `dist/` y restaurando con `git checkout -- dist`.
- MEN-1: mutante M7 (arriba). MEN-2: traza del codigo descrita.

## Lecturas fuera del contexto permitido

- `src/fs/freno-ultimo-verde.ts` y el resto de `src/fs/verificacion.ts`: para comprobar que el memo
  del freno no cruza con el de la completa y como se guardan los resultados `cortada`.
- `src/core/registro-puertas.ts` (grep): para comprobar que `modo` acepta el valor `freno`.
- `CHANGELOG.md` (grep): para saber si lo genera `finish`.
