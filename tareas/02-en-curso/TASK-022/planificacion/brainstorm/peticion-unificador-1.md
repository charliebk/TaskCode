# Peticion al unificador — TASK-022 (ronda 1)

- Tarea: TASK-022 — Documentación de equipo e incorporación de colaboradores
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-09-13
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (1 puntos): **trivial**
- Senales encontradas:
  - dependencias: 1 dependencias (TASK-021) (+1)

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
El repo (`charliebk/TaskCode`, privado) hoy solo tiene un colaborador: el
propio dueño. La sección 14, punto 8 de la metodología queda "resuelta" en
la distribución (marketplace privado en GitHub, sección 7.10) pero deja
pendiente "el nombre exacto del repo y a quién se invita como colaborador".
El nombre del repo ya está fijado (`TaskCode`); falta a quién invitar —
confirmado con Carlos (2026-09-13): **a nadie por ahora**, no hay
colaboradores reales que incorporar todavía. Esta tarea se centra en dejar
lista la guía de incorporación (para cuando haga falta) y en documentar
esa decisión, en vez de ejecutar invitaciones que no hacen falta hoy.
````

### Criterios de aceptacion

````
Guía de incorporación que un integrante nuevo pueda seguir sin ayuda: instalar el plugin, entender el ciclo de vida y hacer su primera tarea.
Sin colaboradores que invitar por ahora (decisión de Carlos, 2026-09-13); la guía queda lista para cuando se incorpore alguien, sin ejecutar ninguna invitación real.
Deja resuelto el punto 8 de la sección 14 en lo que respecta a a quién se invita: documentado que, a día de hoy, no hay nadie que invitar.
````
