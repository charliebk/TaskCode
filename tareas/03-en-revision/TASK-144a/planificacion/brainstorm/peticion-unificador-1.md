# Peticion al unificador — TASK-144 (ronda 1)

- Tarea: TASK-144 — Regla 4D: ciclo de vida, cadena y flags en commands
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
Cerrar las decisiones del ciclo de vida y de los flags escritas en varios comandos con reglas distintas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-01, CMD1-09, CMD1-10, CMD1-11, CMD2-01 a CMD2-05, CMD2-09, CMD2-14 y FS-01).
````

### Criterios de aceptacion

````
GUARDADOS_POR_CADENA se deriva de los comandos que escriben o cambian de rama (trocear, verificar-menores, verificar-lote y doctor-deploy incluidos) y un test falla si un comando con autoCommit queda fuera
siguiente, verificar-menores y finish comparten una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda; un test con comando_sincronizacion da finish sin pregunta en modo automatico
Los flags con valor se leen con extraerRepetible (veredicto, verificar-menores, approve, cadena, finish, doctor-deploy, new) y los booleanos estan todos en FLAGS_SIN_VALOR: --flag=valor se comporta igual en todos los comandos
El patron de ficheros de ronda y el de peticiones de rol vienen de rondas.ts y plan-brainstorm.ts; la regla de la tarea vive en su rama y la de que plan cuenta estan en un solo sitio
````
