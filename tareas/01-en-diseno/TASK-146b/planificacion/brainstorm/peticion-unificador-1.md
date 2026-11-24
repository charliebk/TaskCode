# Peticion al unificador — TASK-146b (ronda 1)

- Tarea: TASK-146b — registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)
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
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-146a) (+1)

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
Parte b del troceo de TASK-146 (Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste), partes TASK-146a, TASK-146b en la rama fix/task-146-regla-4d-duplicacion-en-new-import-roadm.

registrar-coste suma con CAMPOS_COSTE, un helper de readdir tolerante y claveRuta en un sitio, diaLocal en doctor-deploy y creado con la regla de new, cabeceras fieles y la historia de runPlan fuera del codigo.
````

### Criterios de aceptacion

````
registrar-coste suma con CAMPOS_COSTE, los readdir tolerantes y claveRuta tienen un solo helper, y doctor-deploy usa diaLocal con la fecha de creado igual que new
Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo, y runPlan deja la historia de las rondas en el CHANGELOG
````
