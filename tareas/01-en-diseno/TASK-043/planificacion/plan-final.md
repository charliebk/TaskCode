# Plan — TASK-043: F4-T2 Validacion antes de plan y puertas de cierre

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

- Se crea el modulo puro `src/core/validacion-tarea.ts`, sin E/S y sin lanzar nunca (arquitectura); devuelve `{ bloqueos: string[]; avisos: string[] }` (orquestador, decision 1). El recuento de criterios sale de `extraerSecciones`, que tras TASK-046 ya no corta en `###` y separa `criteriosTrasCierre` (dato del orquestador, no de los roles).
- Orden (arquitectura): 1) modulo y script de calibracion desechable, 2) puerta en `plan`, 3) puerta en `approve`, 4) aviso en `finish` y `cli.ts`.
- `plan` bloquea: objetivo vacio, 0 criterios, criterio vacio, mas de 12, criterio solo de palabras vagas sin ancla; avisa de 9 a 12 y de criterios sin ancla (riesgos 1 y 4; orquestador, decision 2). La puerta del objetivo se aplica tambien con 0 roles (arquitectura; orquestador, decision 5).
- `approve` rechaza si, quitando cabeceras `#` y el texto de `planTemplate` con 0, 1 y N roles, no queda nada (arquitectura + riesgos 6). `finish` avisa de casillas sin marcar fuera de `### Tras el cierre`, antes del script de merge, sin bloquear (riesgos 7).
- El numero de roles (2) sale de la heuristica: declarada media, heuristica trivial (1 punto); se lanza el mayor. La discrepancia sugiere que el enunciado infraestima la tarea.

## Desacuerdos entre roles, y como se resuelven

- Que lectura se valida — arquitectura: solo la fresca, la preliminar puede venir de una rama vieja (CRITICO de TASK-012) / riesgos: tambien la preliminar, para rechazar sin que `ensureBaseBranchReady` cambie de rama — gana riesgos (orquestador, decision 4: ambas) — pero el motivo de arquitectura NO queda contestado: rechazar por la preliminar puede bloquear una tarea que en la rama base fresca es valida. Sube a decision humana.
- Tope de criterios — enunciado y arquitectura: 1..8 / riesgos: bloquear >12, avisar 9..12 (el 8 tumba 6 de 27 cerradas: 026, 027, 028, 029, 030, 032) — gana riesgos — esta medido; arquitectura solo repite el enunciado. Contradice el criterio 1 literal: sube a decision humana.
- Criterios sin ancla — enunciado: «se rechazan» / riesgos: solo bloquear vacios o vagos sin ancla, el resto aviso (13 de 27 tareas caerian, criterios de comportamiento, no vagos) — gana riesgos — esta medido. Contradice la lectura literal del criterio 2.
- Universo de calibracion — arquitectura y enunciado: 17 cerradas / riesgos: 27 — gana riesgos — son las que hay en `tareas/04-terminadas`; el orquestador anade las de `00-planificadas`.
- Momento del aviso de `finish` — arquitectura: en el resultado, lo imprime `cli.ts` (es decir, tras el merge) / riesgos: antes de invocar el script — gana riesgos — despues del merge el aviso ya no sirve.
- Barrido de casillas — arquitectura: `casillasPendientes` con barrido propio / orquestador: `criteriosTrasCierre` de `extraerSecciones` o barrido con la misma regla — gana reutilizar el parser — el motivo de arquitectura para un barrido propio (D2, parser roto) desaparece con TASK-046 cerrada.

## Riesgos aceptados y que los contiene

- La regla estricta rechaza la mitad del historial — riesgos — se rebaja a aviso; la calibracion lo vuelve a medir.
- La lista de palabras vagas no tiene ni un caso real — riesgos — se declara como casos construidos en los tests y en el Resultado.
- El ancla «un numero» se cuela con IDs (AC1, C6, TASK-018, §8.3) — riesgos — exclusion explicita de IDs y secciones (orquestador, decision 3), con tests por cada forma.
- El aborto puede dejar el workspace en otra rama — riesgos — validar la preliminar y que el error diga en que rama editar `tarea.md` y que hay que commitear antes de reintentar.
- `approve` puede rechazar planes validos o aceptar el esqueleto — riesgos — comparar contra las tres variantes de `planTemplate`, sin textos copiados (arquitectura).
- Cambio de conducta: con 0 roles ahora tambien se exige objetivo — arquitectura y riesgos (este como suposicion) — se documenta en el Resultado.

### Sin cubrir

- El criterio 2 y el objetivo piden como ancla «un comando»; las anclas de la decision 3 solo lo cubren si va entre comillas invertidas o lleva `--flag` — ningun rol lo trato; se decide en la puerta humana.
- El criterio 5 dice «17 tareas cerradas»; el plan mide 27 — hay que corregir el criterio o aceptar la divergencia.

### Salidas que faltaron

- Ninguna: llegaron las dos. Los puntos de vista no lanzados por la heuristica (los demas roles de brainstorm) son huecos reales, cubiertos solo por este contraste contra el enunciado.

### Suposiciones no verificadas

- Ninguna cerrada se bloquea salvo 029, 030 y 032 — orquestador, decision 8 — lo confirma o refuta el script de calibracion; las cifras de riesgos se midieron con el parser anterior a TASK-046 (riesgos).
- Las continuaciones sangradas de criterios (027, 028, 031, 032) se leen como un solo criterio — riesgos — mirar como las trata `extraerSecciones` hoy.
- Re-planificar reutiliza el brainstorm sin efectos tras un rechazo — riesgos — comprobar que el rechazo ocurre antes de toda escritura.
- Recalcular roles en `approve` da el mismo scaffold que en `plan` — arquitectura — de ahi comparar con 0, 1 y N.

## Plan de pruebas

- Tests puros del modulo: cada bloqueo y aviso, cada forma de ID excluida como ancla, vagos construidos — en memoria — arquitectura y riesgos 2-3.
- `plan` rechaza sin mover la tarea ni cambiar de rama y el error nombra la rama — repo Git temporal real — riesgos 5.
- `plan` rechaza tambien por la lectura fresca cuando la preliminar era valida — repo Git temporal real — arquitectura.
- `approve` rechaza el esqueleto de 0, 1 y N roles y acepta un plan escrito a mano — repo Git temporal real — riesgos 6 y arquitectura.
- `finish` avisa antes de invocar el merge e ignora `### Tras el cierre` — repo Git temporal real — riesgos 7.
- Mutantes sobre los umbrales (12, 9) y la exclusion de IDs; calibracion de las 27 + 00-planificadas al Resultado — script desechable — orquestador y riesgos.

## Lo que necesita decision de una persona

- Aceptar que el plan contradice los criterios 1 («mas de 8»), 2 («se rechazan») y 5 («17»), o reescribirlos en `tarea.md` antes de implementar — el unificador no puede cambiar el enunciado.
- Si un rechazo por la lectura preliminar puede bloquear aunque la fresca fuera valida (objecion de arquitectura sin respuesta) — requiere leer `plan.ts`, fuera de este rol.
- Si un comando sin comillas invertidas cuenta como ancla — ningun rol lo propuso.
- Aprobar el plan entero con `taskctl approve`: este plan no vale ni se implementa hasta esa aprobacion.

## Resuelto por el orquestador al aprobar (2026-10-04)

Con la autorizacion de Carlos del 2026-10-03 para ejecutar el backlog en
continuo:
- **Lectura validada: solo la FRESCA** (corrige la decision 4 del orquestador;
  gana arquitectura). La preliminar puede venir de una rama vieja (CRITICO de
  TASK-012). Tras `ensureBaseBranchReady` la persona ya esta en la rama base,
  que es donde hay que editar la tarea: el error lo dice expresamente («estas
  en <rama base>; edita <ruta>, commitea y reintenta `taskctl plan`»).
- **Comandos como ancla:** un nombre de comando sin comillas invertidas
  (`taskctl`, `git`, `npm`, `pnpm`, `node`, `bash`) cuenta como ancla.
- **Divergencia con los criterios 1, 2 y 5 aceptada:** bloqueo por encima de
  12 (aviso de 9 a 12), los criterios sin ancla avisan, y la calibracion se
  hace sobre las 27 cerradas; lo justifica la medicion del rol de riesgos. Se
  re-mide con el parser ya corregido por TASK-046 y el resultado va al
  Resultado.
