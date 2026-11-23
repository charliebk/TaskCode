# Peticion al unificador — TASK-147 (ronda 1)

- Tarea: TASK-147 — Regla 4D: lectores de secciones e IDs en core
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles NO coinciden. Se lanzan 3 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Que cada seccion de tarea.md y cada ID se lean con un solo lector (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04 a CORE2-07, CORE2-12 a CORE2-14, FS-04 y CMD2-08).
````

### Criterios de aceptacion

````
duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue
casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip
FaseMedida y FaseRegistrada son un solo tipo y fila a Marca se convierte una vez en metricas
````
