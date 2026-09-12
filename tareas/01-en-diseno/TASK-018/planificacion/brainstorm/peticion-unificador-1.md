# Peticion al unificador — TASK-018 (ronda 1)

- Tarea: TASK-018 — Enrutado de revisor por diff real, fragmentado por dominio
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-09-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-013) (+1)

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
Hoy `taskctl review` siempre invoca al mismo agente revisor declarado en
`tarea.md` (`agente_revisor`), sin mirar qué toca de verdad el diff de la
rama. TASK-032 (D6/D7) ya dejó redactadas cuatro skills revisoras por dominio
(java-spring, angular-vue, csharp-autocad-ifc, code-quality) con sus
`patrones_archivo` declarados y probados en las dos direcciones
(`path.matchesGlob`), y `code-quality-reviewer` ya se marca `fallback: true`
con el umbral de dominios fijado en 3 (decisión #16). Falta la pieza que los
conecta con el ciclo real: que `taskctl review` clasifique el diff real de la
rama por esos patrones, lance un revisor por cada dominio detectado hasta el
umbral, y caiga al revisor genérico por encima de él o cuando ningún patrón
case.
````

### Criterios de aceptacion

````
Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
Fragmenta la revisión en un agente por dominio hasta el umbral que fije el punto 16 de la sección 14, y por encima de ese umbral cae a un único revisor genérico.
Cada revisor recibe solo el subconjunto del diff de su dominio.
Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral y varios por encima.
````
