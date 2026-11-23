# Plan — TASK-151: Regla 4D: disfraz en tests

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md, y la seccion Mutacion trae el mutante que dejo cada test en verde).

## Enfoque propuesto

Duracion estimada: 55 min (parte a del troceo; la tarea entera estimaba 110 min)

Cada test sospechoso de disfraz pasa a fallar cuando se rompe lo que dice probar. Por cada uno: se aplica el mutante de la auditoria (o el obvio si no lo hay), se comprueba que el test sigue en verde, se endurece el test y se comprueba que el mutante lo pone en rojo. Solo se tocan tests, salvo que el endurecimiento destape un fallo real del codigo.

1. Core, fs, skills e integracion (parte a): board-format (M1; ordenar por numero con 010 delante de 002 alfabeticamente), state-machine (M2; la guarda de verificar-menores y los ocho comandos), task-store-wip (M4; ilegibles en un orden que no salga solo), git cmdQuoteWindows (M5; un argumento con espacios contado como uno), rondas-aprobada (TCORE-09; diez rondas o mas), plugin-instalado (TRES-06; un estado esperado, no cualquiera de tres) y fases (TRES-09; indexOf distinto de -1).
2. Commands, hooks y cli (parte b): doctor-deploy DIRS_EXCLUIDOS (M6; carpetas versionadas de verdad), review-incremental (M7, M8; corre en Linux y el rejects mira el mensaje), salida-temprana (M9; integra = true no pasa), cli/estado (M10; un flag desconocido sale con 1), doctor-correcciones (TCMD-01; el timeout ausente no es skip), approve, plan y start (TCMD-03, TCMD-05; sin efectos con git status y el mensaje del error) y guardia-documentacion (TRES-07; cuenta-sel).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- Los helpers de test existentes (repo-plantilla, finish-fixtures `git`, tarea-ejemplo) y la guia skills/task-workflow/disfraz-tests.md; el script de mutacion del coordinador.
- Nuevo: nada de produccion; solo aserciones y casos en los tests.

## Troceo

### Parte a: core, fs, skills e integracion
board-format, state-machine, task-store-wip, git cmdQuoteWindows, rondas-aprobada, plugin-instalado y fases fallan con su mutante (M1, M2, M4, M5, TCORE-09, TRES-06, TRES-09).
Duracion estimada: 55 min
- [ ] Las mutaciones M1, M2, M4 y M5 de docs/auditoria-4d-completa.md ponen su test en rojo (board-format, state-machine, task-store-wip, git cmdQuoteWindows) y ultimaRonda se prueba con 10 rondas o mas
- [ ] plugin-instalado y fases comprueban un resultado esperado (un estado concreto; indexOf distinto de -1)

### Parte b: commands, hooks y cli
doctor-deploy, review-incremental, salida-temprana, cli/estado, doctor-correcciones, approve, plan, start y guardia-documentacion fallan con su mutante (M6 a M10, TCMD-01 a TCMD-05, TRES-07).
Duracion estimada: 55 min
- [ ] Las mutaciones M6, M7, M8, M9 y M10 ponen su test en rojo (doctor-deploy DIRS_EXCLUIDOS, review-incremental, salida-temprana, cli/estado); review-incremental corre en Linux; doctor-correcciones no convierte un timeout ausente en skip
- [ ] Los tests que prometen sin efectos secundarios o workspace limpio lo comprueban con git status, los que prometen error claro miran el mensaje, y guardia-documentacion comprueba cuenta-sel

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Endurecer un test puede destapar un fallo real: se corrige en la misma parte si es pequeno y, si no, se abre su tarea.
- Algun caso puede estar ya cubierto por tareas anteriores (board-format por TASK-147b): se comprueba con su mutante y se anota.

## Plan de pruebas

La prueba es el propio mutante: cada test endurecido se ejecuta con su mutante (rojo) y sin el (verde), y se anota en la autorrevision.

## Lo que necesita decision de una persona

Nada abierto. Troceo autorizado de antemano por Carlos para el plan de correcciones 4D.

## Troceo aceptado

Troceo aceptado por una persona el 2026-11-23: TASK-151a, TASK-151b, todas en la misma rama. Este plan es el de TASK-151a; las demas partes se planifican al empezarlas.
