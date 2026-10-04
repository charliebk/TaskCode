# Peticion al unificador — TASK-041 (ronda 1)

- Tarea: TASK-041 — F4-T1 taskctl new con objetivo y criterios
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
Que una tarea nazca con su objetivo y sus criterios, sin editar `tarea.md`
despues (auditoria del 2026-10-03, C1). Hoy `taskctl new` deja el Objetivo
vacio y un criterio `- [ ] ` vacio a proposito, y cada tarea de este backlog ha
necesitado un commit aparte solo para escribirlos. Con `--objetivo` y
`--criterio` (repetible), o con `--desde <fichero>` que ya tenga esas dos
secciones, la tarea queda definida en el mismo commit en que se crea.

Fuera de alcance: validar que los criterios sean verificables (TASK-043).
````

### Criterios de aceptacion

````
`taskctl new --objetivo "<texto>" --criterio "<texto>"` (repetible) escribe ambas secciones
`taskctl new --desde <fichero fuera del repo>` toma objetivo y criterios de un markdown
Sin esos flags el comportamiento es el de hoy
````
