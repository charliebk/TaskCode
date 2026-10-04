# Peticion al unificador — TASK-046 (ronda 1)

- Tarea: TASK-046 — F5-T2 Secciones con subtitulos y criterios multilinea
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
Que el parser del cuerpo de una tarea no pierda texto en un subtitulo, y que
`import` acepte criterios en varias lineas (auditoria del 2026-10-03, D2 y
D7). Hoy `extraerSecciones` corta el Objetivo y los criterios en cualquier
`###`: con criterios agrupados en `### Parser` / `### CLI` devuelve
`criterios: []`, la peticion de brainstorm dice «la tarea no declara
criterios» y la heuristica cuenta 0. Y `### Tras el cierre` (la guia que
anadio TASK-033) queda fuera solo por casualidad. TASK-043 (validacion antes
de `plan`) depende de que este recuento sea correcto.

Complejidad `trivial`: dos parsers puros y sus tests.
````

### Criterios de aceptacion

````
`extraerSecciones` no corta el Objetivo ni los criterios en un `###`; `### Tras el cierre` se reconoce como subseccion
`import` acepta la continuacion sangrada de un criterio, igual que `tarea-body.ts`
Tests con criterios agrupados en `### Parser` y `### CLI`
````
