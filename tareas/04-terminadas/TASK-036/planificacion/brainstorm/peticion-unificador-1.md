# Peticion al unificador — TASK-036 (ronda 1)

- Tarea: TASK-036 — F1-T3 Veredicto con un comando e informe estructurado
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
Quitar la friccion del veredicto y dejar el informe de revision legible por
una maquina (auditoria del 2026-10-03, A5 y A6). Hoy el revisor escribe la
linea `- Veredicto:` a mano, en su propio vocabulario (`**APROBADO CON
CAMBIOS**`, `**cambios-solicitados**`), y eso obliga a commits de
normalizacion; TASK-017 llego a cerrarse con un veredicto que el propio gate
rechaza. El comando `taskctl veredicto` escribe la linea canonica y la
commitea; el parser de `finish` tolera el enfasis de markdown sin aflojar la
regla («no aprobada» sigue fallando); y el scaffold del informe trae la tabla
de hallazgos que usara la ronda incremental (TASK-040).

Fuera de alcance: leer la tabla para generar la ronda 2 (TASK-040).
````

### Criterios de aceptacion

````
`taskctl veredicto TASK-NNN aprobada|aprobada-con-correcciones|cambios-solicitados` sustituye la linea del informe de mayor N
El scaffold de `informe-revision-N.md` trae la tabla `| ID | Severidad | Estado | Fichero |`
El parser de `finish` acepta `**aprobada**`; `no aprobada` sigue fallando, con test
Test del comando contra un repo real
````
