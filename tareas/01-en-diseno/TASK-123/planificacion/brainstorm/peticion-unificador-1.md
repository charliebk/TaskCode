# Peticion al unificador — TASK-123 (ronda 1)

- Tarea: TASK-123 — F-16: finish no cierra sin verificar tras un merge a mano o un conflicto
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-12
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 5 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

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
Hallazgo CRITICO de la auditoria del 2026-11-12, reproducido de punta a punta (docs/auditoria/AUDITORIA-METODO-2026-11-12.md, seccion 11): la via de reintento de finish (rama ya integrada en la de integracion) no ejecuta la puerta de verificacion, y el guardian de merges no ve el git commit que cierra un merge en curso. Caso A: merge a mano en develop con la verificacion en rojo y luego taskctl finish: cierra sin verificar. Caso B, el remedio que documenta la guia tras un conflicto: el guardian deja pasar el commit que cierra el merge y el reintento de finish cierra sin volver a verificar la resolucion. El metodo promete no integrar codigo sin verificacion en verde. Urgente para la version 0.16.0 (decision de Carlos, 2026-11-12), en modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Tras un merge a mano en develop con la verificacion en rojo, taskctl finish no cierra la tarea: verifica el arbol de la rama de integracion o aborta diciendo que falta (test con repo temporal, caso A)
Tras un conflicto en finish resuelto en develop, el reintento verifica la resolucion antes de cerrar o aborta (test con repo temporal, caso B)
El guardian de merges trata como merge un git commit con MERGE_HEAD presente sobre la rama de integracion o la principal, con los tres comandos del caso B (test)
La guia y los mensajes de finish proponen como remedio taskctl abort-merge, integrar la base en la rama de la tarea y relanzar finish desde ella (test sobre el texto)
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
````
