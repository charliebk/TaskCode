# Plan — TASK-112: P-4: el revisor reutiliza la verificacion de ronda y las rondas 2+ solo relanzan al revisor con pendientes

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12; la heuristica
pedia 2 roles por la complejidad declarada `media`.)

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo, 3 de tests, 3 skills, 5 criterios)

Estado de partida (leido en el codigo): desde TASK-095 la ronda 2+ es una
verificacion acotada en la que `planDeVerificacion` relanza a cada revisor con
algun hallazgo no aceptado y a cada dominio que toca la correccion; la peticion
trae la seccion «Verificacion de esta ronda» (TASK-091) con comando, resultado y
salida, pero no el commit ni la huella, y la guia pide correr la suite siempre.

1. **Verificacion reutilizable (criterio 1)**: `verificarConMemo` devuelve el
   commit (HEAD al pedirla) y la huella; la seccion de la peticion los imprime
   (`- Commit verificado`, `- Huella`) y, en verde, la regla `NO_REPITAS`: si el
   commit verificado es el commit revisado, no se repite la suite. Las
   instrucciones (completa y acotada) y las skills revisoras
   (`code-quality-reviewer`, `csharp-autocad-ifc-reviewer`) dicen lo mismo.
2. **Solo CRITICO e IMPORTANTE (criterio 3)**: `leerRondaPrevia` separa por
   revisor sus pendientes CRITICO/IMPORTANTE (los de severidad no reconocida
   tambien, para no descartarlos a ciegas) de sus MENORES; la tabla de la ronda
   acotada lleva solo los primeros y una nota con cuantos MENORES no se
   reverifican; la guia acotada lo dice.
3. **Quien se relanza (criterios 2 y 4)**: un revisor con CRITICO/IMPORTANTE
   pendientes vuelve; uno que solo tiene MENORES vuelve solo si la correccion
   toca sus ficheros (tambien el generico: los suyos son los de ningun dominio);
   si no, no recibe peticion y `review` lo anota en `## Revisores no relanzados`
   de `tarea.md`, en el mismo commit de la transicion.
4. `skills/review/SKILL.md`: la ronda acotada en esos terminos.

## Lo que el rol no cubrio

No se lanzaron roles. La ronda completa (`--completa` o fail-closed) no cambia:
sigue listando todos los pendientes.

## Riesgos aceptados y que los contiene

- Un MENOR corregido no lo reverifica un revisor: lo comprueba quien coordina
  (ya es asi con `verificar-menores` tras aprobar).
- Un revisor que repite la suite porque no lee la regla solo cuesta tiempo.

## Plan de pruebas

- Peticion con selectiva: commit verificado igual al revisado, huella, comando,
  estado y la regla de no repetir (test sobre la peticion).
- Dos revisores en repo temporal: el de dominio con IMPORTANTE vuelve; el
  generico con solo un MENOR y sin ficheros tocados no vuelve y consta en
  tarea.md; con sus ficheros tocados, vuelve sin tabla de MENORES.
- Ajuste de las expectativas de TASK-095/TASK-040 que listaban MENORES.
- `test:rapido` y `verificar-impacto`.

## Lo que necesita decision de una persona

Nada.
