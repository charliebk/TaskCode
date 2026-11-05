# Peticion al unificador — TASK-078 (ronda 1)

- Tarea: TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-05
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

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
Segunda mitad de TASK-073 (depende de ella): que el agente que implementa una tarea no pueda leer ni editar sus tests held-out (carpeta aceptacion/) mientras trabaja en su rama, con un hook PreToolUse sobre herramientas de fichero y Bash/PowerShell.
````

### Criterios de aceptacion

````
Hook PreToolUse con matcher Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob que sale 2 ante una ruta tareas/*/TASK-NNN/aceptacion/ de una tarea cuya rama es la actual, y 0 ante rutas hermanas (tarea.md, aceptacionX/)
El guardian de Bash/PowerShell bloquea comandos cuyo texto nombra esa ruta (cat, Get-Content, git show rama:ruta)
En otra rama (develop, durante el diseno) no bloquea: la persona puede escribirlos con Claude
Rutas con mayusculas, barras invertidas, relativas o con .. se normalizan antes de comparar; Agent/Task fuera del matcher
Tests contra el dist real por stdin y repos temporales; smoke con claude -p --plugin-dir con el exit 2 del hook visible
````
