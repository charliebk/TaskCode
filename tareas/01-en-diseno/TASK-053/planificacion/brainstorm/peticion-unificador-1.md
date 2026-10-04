# Peticion al unificador — TASK-053 (ronda 1)

- Tarea: TASK-053 — moveTareaFile reintenta el rename ante un EPERM o EBUSY transitorio de Windows
- Tipo: fix · Complejidad declarada: trivial
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **trivial**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles coinciden. Se lanzan ningun rol.

## Como consolidas

No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de roles sale del lookup de complejidad, no de un descuido).

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Que `finish` no se quede a medias por un `EPERM`/`EBUSY` transitorio de
Windows al mover la carpeta de la tarea. Paso dos veces seguidas en este
proyecto (TASK-037 y TASK-040): el merge ya estaba hecho y subido, el
`rename` de `03-en-revision/TASK-NNN` a `04-terminadas/` fallo porque algun
proceso (antivirus, indexador) tenia un handle abierto un instante, y hubo que
reintentar `finish` a mano. `moveTareaFile` debe reintentar el `rename` unas
pocas veces con espera creciente antes de fallar.

Complejidad `trivial` (no `simple`, como se importo): un reintento acotado en
una funcion, sin diseno que explorar.
````

### Criterios de aceptacion

````
`moveTareaFile` reintenta el `rename` hasta 5 veces con espera creciente ante `EPERM` o `EBUSY`, y solo entonces falla
Test que simula el fallo transitorio (un rename que falla las 2 primeras veces) y comprueba que la tarea se mueve
`finish` sigue siendo reintentable si el rename falla de verdad tras los reintentos (test)
````
