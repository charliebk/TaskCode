# Peticion al unificador — TASK-057 (ronda 1)

- Tarea: TASK-057 — Flujo C: fases como skills invocables en modo manual
- Tipo: feature · Complejidad declarada: no declarada (decide la heuristica)
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **no declarada (decide la heuristica)**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

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
Parte de TASK-055 (su plan-final es el diseno de referencia). Un comando por fase para reanudar cualquier tarea en cualquier sesion, implementado como skill invocable por la persona (la documentacion de Claude Code recomienda skills frente a commands/).
````

### Criterios de aceptacion

````
Existen las skills `new`, `board`, `plan`, `approve`, `start`, `review` y `finish`, invocables como `/taskcode-plugin:<fase>`, con frontmatter valido (`description`, `arguments`, `allowed-tools`)
Cada skill de fase ejecuta su subcomando de `taskctl` y el trabajo de agentes de su fase (roles y unificador en plan, revisor independiente en review, segunda opinion si `revision_codex` es true)
Cada skill de fase llama a `taskctl siguiente` al terminar y, en modo manual, termina nombrando la skill de la siguiente fase sin encadenar nada; un test ata cada skill al subcomando que nombra
La skill de plan conserva la seleccion del mejor skill (`skills_recomendados`) y la de review el enrutado de revisor por dominio
Las skills de fase hacen `cd` a la raiz del repo antes de llamar a `taskctl`
Test de marcas propio para las skills de fase: no mencionan rutas ni documentos internos de este repo, con una lista de marcas justificada que si permite nombrar `taskctl`
`task-workflow/SKILL.md` describe los tres modos y las skills de fase
````
