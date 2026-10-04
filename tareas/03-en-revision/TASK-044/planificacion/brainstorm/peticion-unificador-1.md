# Peticion al unificador — TASK-044 (ronda 1)

- Tarea: TASK-044 — F4-T3 Particion propuesta de las tareas grandes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-04
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
Que, cuando `plan` rechaza una tarea por demasiado grande, deje hecha la
particion en vez de solo decir «partela» (auditoria del 2026-10-03, C3).
TASK-043 ya bloquea por encima de 12 criterios; falta proponer como partirla.
Caso real: TASK-030 tenia 18 criterios en dos frentes independientes (config
y auto-commit), agrupados bajo lineas en negrita (`**C4 — ...**`,
`**C2 — ...**`) mas un grupo `**Transversal**`; costo varias rondas de
revision con peticiones de 110-160 KB. Los frentes se reconocen por los
grupos de criterios (subtitulos `###` o lineas solo en negrita), no por
interpretar el texto.

La propuesta es un fichero que `taskctl import` acepta, escrito fuera del
repo (dentro ensuciaria el workspace y el guard de import abortaria).

Fuera de alcance: partir automaticamente sin grupos (eso lo decide una
persona).
````

### Criterios de aceptacion

````
Con mas de 12 criterios o varios frentes en el Objetivo, `plan` aborta y lo explica
Escribe un fichero de `import` fuera del repo con una tarea por frente y lo nombra en el error
Test con una tarea de dos frentes (el caso de TASK-030)
````
