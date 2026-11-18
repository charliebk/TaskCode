# Peticion de redaccion del plan — TASK-135 (ronda 1)

- Tarea: TASK-135 — diffRangeForPaths por lotes: ENAMETOOLONG en la revision fragmentada
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-18
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Quien orquesta vuelca tu respuesta en: `../plan-final.md`

**Esta tarea se planifica con un solo rol y no hay unificador**: tu respuesta ES el plan final. Redactala con las secciones de abajo; quien orquesta la vuelca tal cual en `plan-final.md` (tu no escribes ficheros), sin salida intermedia que consolidar.

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

Que lo mires solo tu no te autoriza a cubrirlo todo: lo que queda fuera de tu pregunta no se mira, pero se DICE. Anota en el plan lo que no cubres, para que quien lo apruebe sepa que ese lado no se ha revisado:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 1 rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es el plan.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.

## Enunciado de la tarea

### Objetivo

````
En la revision fragmentada por dominio, review pide el diff de cada grupo con diffRangeForPaths (src/fs/git.ts), que pasa una ruta por argumento sin trocear. Con un grupo de mas de mil ficheros (un volcado de 1218 en un proyecto real) la linea de comandos supera el limite de Windows y git no llega a lanzarse: spawnSync git ENAMETOOLONG. Reproducido con el dist 0.16.1 y 1300 rutas (unos 133.000 caracteres de pathspec): statDeFicheros, que ya va por lotes, pasa; diffRangeForPaths falla. Lo anoto la ronda 2 de TASK-113 como fuera de alcance. Se trocea igual que statDeFicheros y, de paso, se cierra el MENOR pendiente de TASK-113: los dos lotes se cortan tambien por bytes acumulados, no solo por numero de rutas. git-commit.ts y sincronizacion.ts no entran: solo reciben las carpetas de la tarea y las rutas declaradas.
````

### Criterios de aceptacion

````
diffRangeForPaths parte la lista en lotes y concatena las salidas; con 1300 rutas largas devuelve el diff de todas sin ENAMETOOLONG en Windows
El diff concatenado contiene exactamente los ficheros pedidos, en el mismo orden que una sola llamada con pocas rutas, y la lista vacia sigue sin llamar a Git
statDeFicheros y diffRangeForPaths cortan cada lote por numero de rutas y por bytes acumulados del pathspec, lejos de 32.767 caracteres, aunque las rutas midan 300 caracteres
Test de integracion contra un repo Git temporal: peticion fragmentada de review con un grupo de mas de 1000 ficheros que sin el arreglo falla con ENAMETOOLONG en Windows y con el arreglo genera la peticion con el diff del grupo
Las rutas siguen pasando como :(literal), sin regresion del test de TASK-054 con pages/[id].vue y rutas no ASCII
````
