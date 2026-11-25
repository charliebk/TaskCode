# Plan — TASK-158c: verificar-impacto no devuelve dist/src si HEAD cambio

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los tres roles ni el unificador.)

## Enfoque propuesto

Duracion estimada: 40 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo —`scripts/verificar-impacto.mjs`—, 1 capa, 1 criterio)

La carrera de TASK-145b: el freno `Stop` toma la copia de dist/src mientras
`update-fix` tiene otra rama activa, y al acabar la devuelve sobre la rama
de la tarea (dist/src queda con el contenido de la otra rama y `review`
aborta por arbol sucio).

1. `conDistProtegido` anota el HEAD (`git rev-parse HEAD` en el plugin) al
   tomar la copia, y lo guarda tambien en el marcador.
2. `devolver` recibe ese HEAD: si el HEAD de ahora es otro, no devuelve la
   copia (es de otro commit); deja dist/src como esta en el HEAD actual
   (`git checkout HEAD -- dist/src` y `git clean -fdq -- dist/src`, que solo
   toca salida de compilacion), borra la copia y avisa con los dos commits.
   Sin Git (HEAD null antes o despues) se comporta como hoy.
3. `restaurarHuerfana` pasa el HEAD del marcador a `devolver`: una copia
   huerfana de otro commit tampoco se devuelve.

## Reutilizacion (Regla 4D)

- `git()` — `scripts/verificar-impacto.mjs:112` — para `rev-parse`, `checkout` y `clean`.
- `devolver` — el unico punto que devuelve la copia; lo llaman el cierre de `conDistProtegido` y `restaurarHuerfana` (usos buscados: no hay mas). La comprobacion va ahi, no duplicada en los dos llamadores.
- Test `conDistProtegido (TASK-143c...)` de `test/scripts/verificar-impacto.test.ts` — los tests nuevos siguen su forma (import del script, `dirCopia`, cerrojo).
- Nuevo: `headDe(dir)` (una linea sobre `git()`), porque se pide en tres sitios.

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido).

## Riesgos aceptados y que los contiene

- Restaurar desde HEAD descarta cambios sin commitear de dist/src — solo pasa si HEAD cambio, caso en que la copia ya es de otro commit; se avisa con los dos SHA.
- `git clean` en dist/src — es salida de compilacion versionada; no hay trabajo a mano ahi.
- Fuera de un repo Git (tests antiguos, directorios temporales) — HEAD null: comportamiento de hoy, cubierto por el test existente.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 2 tests en `test/scripts/verificar-impacto.test.ts` contra un repo Git temporal real: (a) HEAD cambia durante `fn` → dist/src queda como en el HEAD nuevo, sin ficheros de mas, arbol limpio, cerrojo suelto y aviso; (b) copia huerfana de otro commit → no se devuelve. El test existente cubre que sin cambio de HEAD se devuelve la copia. Sin pesados.

## Lo que necesita decision de una persona

Nada abierto.
