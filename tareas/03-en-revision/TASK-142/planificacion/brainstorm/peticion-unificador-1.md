# Peticion al unificador — TASK-142 (ronda 1)

- Tarea: TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-22
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
Corregir los scripts de Git-Flow que aparentan hacer algo que no hacen (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-01, SCR-09, SCR-10, SCR-11 y SCR-14). SCR-01 es CRITICO: resume-work aplica el stash equivocado.
````

### Criterios de aceptacion

````
resume-work.sh aplica el stash de la rama exacta (stash_ref, sin casar prefijos); un test con dos stashes pause: feature/a y pause: feature/ab falla con el codigo actual y pasa con el arreglo
pause-work.sh --push sin origin no aborta: usa detect_origin_available y _gf_hora como el resto de scripts, con test
push-back-to-remote.sh y mirror-to-remote.sh no dan por COMPLETADO un push rechazado (exit distinto de 0 o resumen con lo fallido) y su cabecera y avisos dicen lo que de verdad copian
El README de gitflow y los textos que hablan de 19 scripts reflejan los 24 scripts actuales y los cambios hechos sobre el zip original
````
