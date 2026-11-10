# Peticion al unificador — TASK-095 (ronda 1)

- Tarea: TASK-095 — Revision que converge: desde la ronda 2 solo se verifican las correcciones
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-10
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos
- `salida-brainstorm-testing-1.md` — rol testing

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **alta**
- Heuristica (2 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

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
Objetivo principal: aumentar la agilidad sin perder calidad. Que la revision por pares converja en vez de reabrirse en cada ronda, conservando todos los revisores que tiene hoy. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): en ToolsaWeb las rondas medias pasan de 2,3 (0.8) a 3,8 (0.12), el tramo revision-cierre de 56 a 97 min y los tokens de revision por ronda de 2,6 a 6,4 M; los hallazgos por ronda no bajan (11, 17, 16; 13, 19, 19, 14, 17; un ADR con 14 rondas de unos 11 cada una). La causa esta en la regla de TASK-083 (0.12): un solo IMPORTANTE de cualquier revisor hace la ronda siguiente completa desde la base con todos los revisores, que encuentran otra tanda; la acotada salto en 1 de 42 rondas en OpenDockTrading. Las rondas tardias apenas aportan calidad nueva (2 CRITICOS nuevos en unas 77 rondas 3.a o posteriores), mientras que los revisores de dominio si aportan calidad propia (63 de 88 CRITICO/IMPORTANTE en ficheros que el generico no marco): se mantienen. Esta tarea corrige la regla de alcance de TASK-083; no anade otro mecanismo encima ni retira revisores.
````

### Criterios de aceptacion

````
Desde la ronda 2, la peticion de taskctl review lleva siempre 'Alcance: verificacion acotada' (aunque la ronda anterior tenga CRITICO o IMPORTANTE) y su diff va desde el ultimo commit revisado; tests en test/commands que lo comprueban con IMPORTANTE abierto, con CRITICO abierto y con merges entre rondas
La peticion acotada indica al revisor que verifique cada hallazgo abierto y el diff de la correccion, y que solo abra un hallazgo nuevo si es CRITICO o lo introduce la propia correccion; test que comprueba ese texto en la peticion de la ronda 2
En la ronda acotada, cada revisor de dominio que dejo hallazgos abiertos recibe su propia peticion para verificarlos (no los verifica el generico en su lugar); test con un diff de Rust y un IMPORTANTE de rust-wasm-reviewer abierto
Tras la ronda 3 con hallazgos abiertos, taskctl siguiente devuelve accion preguntar en cualquier modo, y lo abierto se acepta documentado en Resultado o pasa a una tarea nueva; test de integracion en un repo temporal
taskctl review --completa sigue forzando una ronda completa desde la base (test de regresion)
El codigo de la regla antigua de alcance que deje de usarse se borra, y sus tests cambian de expectativa con el motivo escrito en Resultado; ningun test se borra sin sustituto
skills/review, skills/task-workflow, README y CHANGELOG describen la regla nueva y el principio de coste proporcional a la correccion
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
````
