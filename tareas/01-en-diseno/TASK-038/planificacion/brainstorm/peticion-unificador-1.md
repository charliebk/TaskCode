# Peticion al unificador — TASK-038 (ronda 1)

- Tarea: TASK-038 — F2-T2 Una sola deteccion de origin por invocacion, con timeout
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (0 puntos): **trivial**
- Senales encontradas:
  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)

Los dos niveles NO coinciden. Se lanzan 1 rol, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

**Esta tarea se planifico con un solo rol**, asi que aqui no hay desacuerdos que resolver: no te los inventes ni trates la ausencia de discrepancia como una senal de nada.

1. Lee la salida de arriba. Si falta o esta sin rellenar, dilo en el plan en vez de suplirla en silencio.
2. **Contrasta esa propuesta contra el enunciado de la tarea**, que tienes al final. Lo util que puedes aportar aqui no es mediar entre puntos de vista, es senalar QUE QUEDO SIN CUBRIR: criterios de aceptacion que el rol no toca, riesgos que no mira porque no era su papel, decisiones que da por hechas.
3. Cada afirmacion del plan que venga del rol se atribuye a el; lo que anadas tu, tambien.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Que cada invocacion de un script de Git-Flow pregunte a `origin` una sola vez
y nunca espere mas de unos segundos (auditoria del 2026-10-03, B2 y D9). Hoy
`detect_origin_available` esta reimplementada en linea en 7 scripts, cada
`git ls-remote` espera lo que tarde la red (con la VPN caida, del orden de
30 s) y puede quedarse esperando credenciales, y `resolve_main_branch` hace
dos consultas mas. Ademas, `merge-feature-to-develop.sh` no distingue «origin
configurado pero caido» de «sin origin».
````

### Criterios de aceptacion

````
`detect_origin_available` cachea su resultado por invocacion; `update-feature.sh` deja de reimplementarla
`git ls-remote` con limite de 5 s, portatil en Git Bash y Linux
`merge-feature-to-develop.sh` aplica la guarda de origin configurado pero caido
Test con un origin inalcanzable: el comando responde en menos de 10 s
````
