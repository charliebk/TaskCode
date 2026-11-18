# Plan — TASK-136: Cerrojo en verificar-impacto: dos ejecuciones solapadas borran dist/src

(Modo rapido: tarea pequena, el plan lo redacta quien orquesta, sin lanzar el
rol de arquitectura ni unificador.)

## Enfoque propuesto

Duracion estimada: 50 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, 1 de test, 5 criterios)

Todo en `scripts/verificar-impacto.mjs`, alrededor del tramo que ya protege
`dist/src` (copia, build, tests, `devolver`). La seleccion y `--listar` no
cambian ni toman el cerrojo.

1. **Cerrojo atomico por plugin**: `<tmpdir>/verificar-impacto-<hash>.cerrojo`
   (mismo hash que `dirCopia`), creado con `writeFileSync(..., { flag: 'wx' })`
   y contenido `{ pid, desde }`. Crearlo es la unica operacion atomica; la
   carpeta de copia y su marcador siguen igual, pero solo se tocan con el
   cerrojo en la mano.
2. **Si ya existe**: se lee su pid.
   - Vivo (`process.kill(pid, 0)` no lanza ESRCH): otra ejecucion trabaja.
     Se avisa una vez («espero a la ejecucion <pid> que tiene el cerrojo …»)
     y se reintenta cada 500 ms con espera sincrona (`Atomics.wait`), hasta
     el tope `VERIFICAR_IMPACTO_ESPERA_S` (por defecto 1800). Al agotarlo:
     sale con 1 y un mensaje con el pid, la ruta del cerrojo y como
     liberarlo si se sabe que esa ejecucion ya no existe.
   - Muerto, o cerrojo ilegible: ejecucion cortada. Se borra el cerrojo y se
     reintenta tomarlo (otra ejecucion puede ganar la carrera: entonces se
     espera a ella). Con el cerrojo tomado, `restaurarHuerfana` recupera la
     copia como hasta ahora (ya es seguro: nadie vivo la usa).
3. **Liberarlo** en el `finally`, despues de `devolver`, solo si el cerrojo
   sigue siendo de este pid.
4. **`devolver` seguro**: si `habiaDist` y no existe `copia/src`, no borra
   `dist/src`; avisa de que no hay copia y lo deja como este. Es la segunda
   barrera: aunque algo pisara la copia, nunca se pierde `dist/src` entero.

Por que esperar y no abortar: quien llega segundo es `finish`, una ronda de
`review` o el freno Stop; abortar convertiria un solape normal en un fallo de
verificacion. Esperar cuesta lo que tarde la primera (minutos), y con el tope
no se queda colgado para siempre.

## Lo que el rol no cubrio

No se lanzo el rol. Sin mirar: reutilizacion de pid en Windows (un pid muerto
reasignado a otro proceso se veria vivo: la segunda esperaria hasta el tope y
lo diria; aceptado). Un cerrojo mas viejo que el tope de espera con pid vivo
no se roba: lo decide la persona con el mensaje.

## Riesgos aceptados y que los contiene

- Pid reutilizado: espera de mas, nunca borrado; el mensaje del tope lo
  explica.
- `process.kill(pid, 0)` con EPERM (proceso de otro usuario) cuenta como vivo.
- El test de solape depende de tiempos: el build del repo de prueba dura
  ~2 s para que las ejecuciones se pisen con seguridad; se comprueba el
  orden por el aviso de espera, no por milisegundos.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- C1 (solape): dos ejecuciones lanzadas a la vez (`spawn` asincrono) sobre el
  mismo repo de prueba, con un build lento que reescribe `dist/src/x.js`:
  las dos salen con 0, una dice que espera, `git status` limpio. Hoy deja
  `dist/src` borrado o una sale con error (se comprueba antes del arreglo).
- C2 (cerrojo con pid muerto): cerrojo escrito a mano con el pid de un
  proceso ya terminado: la ejecucion sale con 0, avisa y deja el arbol limpio.
- C3 (`devolver` sin copia): se cubre por C1 (antes del arreglo es lo que
  borra `dist/src`) y por una prueba manual del mutante; sin test propio.
- C4 (tope): cerrojo con el pid del propio test (vivo) y
  `VERIFICAR_IMPACTO_ESPERA_S=1`: sale con 1, el mensaje nombra el pid y la
  ruta, y no toca `dist/src`.
- C5: el resto de `test/scripts/verificar-impacto.test.ts` en verde, incluida
  la ejecucion cortada a mitad (el cerrojo queda con pid muerto y la
  siguiente lo recupera).

## Lo que necesita decision de una persona

Nada.
