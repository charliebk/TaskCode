# Peticion al unificador — TASK-138 (ronda 1)

- Tarea: TASK-138 — Regla 4D: duplicacion en metricas, suite y registro de puertas
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-24
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

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
Corregir las duplicaciones que encontro la auditoria 4D de TASK-137 (docs/auditoria-4d.md, casos A1-A6): un solo agregador de la suite por version, una sola mediana, una sola decision verde/rojo/omitido por puerta, sin regex ni constantes duplicadas o muertas.
````

### Criterios de aceptacion

````
metricas --por-version y el aviso de crecimiento de doctor usan el mismo agregador de suite por version; un test con una tarea que corre la completa dos veces da la misma cifra en las dos vistas
Una sola funcion mediana (versiones-metricas, crecimiento-suite, la exportada en metricas.ts y la de tramoDe en evolucion.ts la comparten; TASK-141, CORE2-11) y la regex de pytest se evalua una vez en contarTests
anotarFinish, el bloque de review, anotarSuite y verificar-lote (TASK-141) comparten la decision verde/rojo/omitido; PUERTAS_VERIFICACION se usa en metricas o se elimina con su test
Los textos de las salidas del tope de rondas (siguiente, salidasTopeRondas, error de review) salen de una sola fuente y doctor lee las terminadas una vez
````
