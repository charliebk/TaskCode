# Peticion al unificador — TASK-101 (ronda 1)

- Tarea: TASK-101 — Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 1 dependencias (TASK-100) (+1)
  - criterios_aceptacion: 7 criterios (umbral: 5) (+1)

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
Segunda parte de TASK-100 (troceada por la regla de una hora, decision de Carlos 2026-11-10). Con la decision unica de TASK-100 (decidirVerificacion, rutas_documentacion leidas de la base, memo 'documentacion'), el guardian de merges recalcula el diff con merge-base(destino, fuente), sin depender de la tarea ni del memo de finish: deja pasar un merge de solo documentacion con el verde del memo de documentacion (o sin el si no hay comando de documentacion) y sigue bloqueando uno con codigo sin verde de la completa. Si no puede calcular el diff con el destino ya protegido, bloquea. Un valor invalido de la clave nueva no desactiva el guardian. Plan de partida: tareas/04-terminadas/TASK-100/planificacion/plan-final.md (seccion A2).
````

### Criterios de aceptacion

````
Con rutas_documentacion declaradas, el guardian deja pasar el merge de una tarea de solo documentacion sin verde de la completa y bloquea el de una con codigo (un test por caso, repo temporal)
Lanzado el merge a mano sin pasar por finish, el guardian llega a la misma decision que finish para el mismo par fuente-destino (test)
Si no puede calcular el diff con el destino protegido, o la clave nueva tiene un valor invalido, el guardian bloquea igual que hoy (un test por caso)
Sin la configuracion nueva el guardian se comporta exactamente como en la 0.14.0 (test de regresion)
De la revision de TASK-100 (ronda 2): el mensaje de error de rutas_documentacion deja de decir «casa con cualquier fichero» para `*` y `*/**` (MEN-6), y verificacion-selectiva.md corrige la frase sobre core.ignorecase: el pathspec distingue mayusculas siempre salvo con :(icase) (MEN-7)
verificacion-selectiva.md, README y CHANGELOG explican el comportamiento del guardian
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
