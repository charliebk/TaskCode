# Plan — TASK-148d: comentarios, diluvio y E/S en core (parte d de TASK-148)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 45 min (parte d del troceo aceptado de TASK-148)

1. Comentarios ciertos (CORE1-14): la cabecera de config.ts deja de decir «TRES claves» (son las de CLAVES_CONFIG) y el doc de `dondeFalla` dice lo que hace (sin repetir; el tope MAX_DONDE lo aplica quien la usa).
2. Heuristica (CORE2-18): la cabecera de 85 lineas de historia se reduce a lo que el codigo necesita (la historia esta en git y en las tareas), y las claves se escriben una vez.
3. `TRIVIAL_SIN_APROBACION` (CORE2-19): se elimina la lista vacia y su condicion; queda una linea que dice que el checkpoint humano antes de start es siempre obligatorio y por que.
4. Formateadores de «—» (CORE2-20): un formateador `null` a «—» para metricas, grupos-metricas y versiones-metricas.
5. E/S en core (CORE2-21): plugin-instalado, heuristica y revisores documentan en su cabecera la E/S que hacen y por que esta en core (se documenta en vez de mover: moverlas cambiaria muchos imports sin ganar comportamiento).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- CLAVES_CONFIG, MAX_DONDE, el formateador de «—» que ya exista en metricas.
- Nuevo: nada salvo, si no existe, el formateador comun de «—».

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Quitar TRIVIAL_SIN_APROBACION no cambia comportamiento (la lista esta vacia): los tests de approve y start lo fijan.

## Plan de pruebas

1 test del formateador comun de «—»; los tests existentes de state-machine, approve, start, metricas y heuristica fijan que el comportamiento no cambia. Mutacion del formateador.

## Lo que necesita decision de una persona

Nada abierto.
