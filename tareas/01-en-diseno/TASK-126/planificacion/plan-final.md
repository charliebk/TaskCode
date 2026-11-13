# Plan — TASK-126: Verificacion por tipo de rama: los tests pesados solo en la puerta de release

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 80 min (de la rama abierta al cierre con merge; senales: 5 ficheros de codigo, 3 de tests, skill finish, docs y CHANGELOG, 6 criterios)

No se trocea: decision de Carlos del 2026-11-13.

1. `core/config.ts`: dos claves.
   - `comando_verificacion_pesada` (comando; exige `comando_verificacion`).
   - `verificacion_pesada_en` (lista de tipos de rama, `[release]` por
     defecto; admite `release` y `hotfix`; otro valor aborta; la lista sin el
     comando aborta: no haria nada). Usa `timeout_verificacion`.
2. `fs/verificacion.ts`: tipo `pesada` con su propio memo
   (`freno-verificacion-pesada.json`): el verde de la completa no vale por el
   de los pesados ni al reves.
3. `commands/finish-verificacion.ts`: `puertaPesada(...)`: si la tarea es de
   un tipo de `verificacion_pesada_en` y hay comando, tras la completa en
   verde corre el comando pesado sobre el mismo arbol, guarda su memo (arbol
   limpio), anota la puerta `finish` modo `pesada` y en rojo aborta como la
   completa (sin merge, con `--sin-verificacion` como salida de la persona).
   `finish.ts` la llama justo despues de `puertaVerificacion` solo si esta
   devolvio `verde` (la completa corrio): feature y fix nunca la corren;
   `--sin-verificacion` la salta tambien.
4. `hooks/guardia-merge.ts`: en el paso 6, con el verde de la completa, si lo
   que entra es una release (o un hotfix, si esta en la lista) y hay comando
   pesado, exige tambien el verde de los pesados para ese commit (memo
   `pesada`, misma huella de commit); si falta, bloquea con su motivo y remite
   a `taskctl finish`. Feature y fix: como hoy.
5. `commands/doctor.ts`: `puertas-verificacion` anade «pesados <comando> en
   release[, hotfix]» o «sin pesados».
6. Skill `finish`, docs/configuracion.md, README (indice) y CHANGELOG: como
   separar los pesados del comando de verificacion, con el ejemplo de
   `cargo test` frente a `cargo test -- --ignored`.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Las features se cierran sin pesados: lo pide la tarea; la release los exige
  antes de llegar a la principal y el guardian bloquea un merge a mano sin ellos.
- Las claves se leen de la config del arbol, como `comando_verificacion` en
  finish y en el guardian (si no, las huellas dejarian de casar).

## Plan de pruebas

- `test/core/config`: claves, defecto `[release]`, `hotfix` admitido, tipo
  desconocido aborta, lista sin comando aborta, comando sin completa aborta.
- `test/commands/verificacion-pesada` (repo temporal, scripts reales): finish
  de una feature no corre los pesados; finish de una release los corre tras la
  completa y en rojo no integra; un hotfix solo si esta en la lista; sin la
  clave, como hoy (regresion).
- Guardian: release sin verde de pesados bloquea, con el verde pasa; feature
  no lo pide.
- doctor: el mensaje de `puertas-verificacion` con y sin pesados.
- Skill finish: test de que explica la clave y el ejemplo de `--ignored`.
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.
