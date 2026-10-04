# Peticion al unificador — TASK-043 (ronda 1)

- Tarea: TASK-043 — F4-T2 Validacion antes de plan y puertas de cierre
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
- Heuristica (1 puntos): **trivial**
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
Que `plan` se niegue a planificar una tarea mal definida, y que `approve` y
`finish` no dejen pasar esqueletos vacios (auditoria del 2026-10-03, C2, C6 y
D5). Reproducido en la auditoria: una tarea entera se cerro con el Objetivo
vacio, un criterio `- [ ] ` vacio, el plan en esqueleto y sin Resultado, y
todos los comandos salieron con 0. Ademas, las tareas con muchos criterios o
criterios vagos («mejorar», «robusto») son las que mas rondas de revision
costaron: las tres con 13 o mas criterios tuvieron peticiones de 110-160 KB.

La validacion es determinista (sin modelo): objetivo no vacio, entre 1 y 8
criterios no vacios, y cada criterio cita algo comprobable (un comando, una
ruta, un numero, codigo entre comillas invertidas o un test). Se calibra
contra las tareas ya cerradas del repo para no rechazar lo razonable.

Fuera de alcance: proponer la particion de una tarea grande (TASK-044).
````

### Criterios de aceptacion

````
`plan` aborta sin mover la tarea si el objetivo esta vacio, hay 0 criterios o mas de 8, o alguno esta vacio
Lint de verificabilidad: cada criterio cita un comando, una ruta, un numero, codigo o un test; `mejorar`, `robusto` o `correctamente` solos se rechazan con el motivo
`approve` rechaza un `plan-final.md` con todas las secciones vacias
`finish` avisa de casillas sin marcar fuera de `### Tras el cierre`
Probado sobre las 17 tareas cerradas: se listan las que habrian sido rechazadas y por que
````
