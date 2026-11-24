# Plan — TASK-139: Regla 4D: tests que no protegen lo que dicen

Redactado por el coordinador (modo rapido: los casos B1-B5 tienen fichero y linea en docs/auditoria-4d.md, y el criterio 5 sale de lo visto en TASK-153c y TASK-144b).

## Enfoque propuesto

Duracion estimada: 80 min (pasa de 60: se trocea en dos partes, abajo; troceo autorizado de antemano por Carlos para el plan de correcciones 4D)

1. B1: un test en test/core/poda-tests.test.ts que falla si skills/task-workflow/SKILL.md deja de enlazar poda-tests.md.
2. B3: un test de scripts/verificar-impacto.mjs con un cerrojo ilegible (JSON roto, `pid === null`): la ejecucion espera y reintenta en vez de tomarlo a ciegas; se comprueba con su mutante.
3. B4: las aserciones del mensaje «bash de Git» de doctor tienen una version pura que corre en Linux (la funcion que compone el mensaje, con una ruta de bash de Windows inventada), o se documenta en el test por que no.
4. B5: el test de 1100 ficheros de review-tests-stat se elimina si el de 1300 rutas cubre la misma regresion (ENAMETOOLONG), comprobandolo con el mutante; y los criterios 1 y 2 de TASK-133 se marcan segun su Resultado.
5. Criterio 5 (la selectiva no recorta en silencio): el plugin pasa al comando de verificacion la variable `TASKCODE_VERIFICACION` con el tipo (`selectiva` en review y finish, `freno` en el Stop). scripts/verificar-impacto.mjs, con `selectiva`, no aplica el tope (corre todos los afectados) y, si no sabe que afecta (`todo`), corre la suite completa; con `freno` o a mano sigue con el tope de 10. `timeout_verificacion_selectiva` sube en .taskcode/config.yml lo necesario para que quepa. README del plugin: la variable documentada para cualquier proyecto.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- `verificarConMemo` (src/fs/verificacion.ts) ya anade `RAMA_BASE` al entorno del comando: la variable nueva va en el mismo sitio, no en cada llamador.
- `seleccionar(cambiadas, nodos, tope)` y `leerTope` de verificar-impacto ya admiten el tope como parametro: sin tope = `Infinity`, sin funcion nueva.
- test/scripts/verificar-impacto.test.ts y sus helpers para el cerrojo y la seleccion; test/core/poda-tests.test.ts para el enlace.
- Nuevo: la constante del nombre de la variable, exportada junto a `VARIABLE_RAMA_BASE`.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Correr todos los afectados alarga review y finish. Con `timeout_verificacion` en 3600 s cabe la completa; el freno, que corre en cada fin de turno, no cambia.
- Un proyecto cuyo comando selectivo ignore la variable no cambia de comportamiento: la variable es informativa.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- B1: 1. B3: 1. B4: 1 o una nota. B5: 0 (se borra uno, comprobando con mutante que el otro caza la regresion). Criterio 5: 2 (la variable llega al comando con su tipo; verificar-impacto sin tope con `selectiva` y con tope con `freno`).

Cada test nuevo se comprueba con su mutante (rojo con el, verde sin el). Ninguno es pesado.

## Lo que necesita decision de una persona

Nada abierto. Troceo autorizado de antemano por Carlos para el plan de correcciones 4D.

## Troceo

### Parte a: disfraces B1-B5
Enlace de poda-tests, cerrojo ilegible, mensaje bash de Git en Linux, test duplicado de review-tests-stat y criterios de TASK-133.
Duracion estimada: 40 min
- [ ] Un test falla si task-workflow/SKILL.md deja de enlazar poda-tests.md, y la rama de cerrojo ilegible de scripts/verificar-impacto.mjs tiene un test que falla al romperla
- [ ] Las aserciones del mensaje bash de Git de doctor tienen equivalente que corre en Linux (o se documenta por que no), el test de 1100 ficheros de review-tests-stat se elimina o se justifica, y los criterios de TASK-133 quedan marcados segun su Resultado

### Parte b: la selectiva no recorta en silencio
El plugin pasa TASKCODE_VERIFICACION al comando; verificar-impacto corre todos los afectados en review y finish.
Duracion estimada: 45 min
- [ ] El comando de verificacion recibe TASKCODE_VERIFICACION con su tipo (selectiva en review y finish, freno en el Stop), con test, y el README del plugin lo documenta
- [ ] Con TASKCODE_VERIFICACION=selectiva, scripts/verificar-impacto.mjs no recorta: corre todos los afectados, y la suite completa si no sabe que afecta; con freno o a mano mantiene el tope, con test
