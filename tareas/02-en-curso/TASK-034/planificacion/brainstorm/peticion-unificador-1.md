# Peticion al unificador — TASK-034 (ronda 1)

- Tarea: TASK-034 — F1-T1 Excluir lo generado del diff de revision
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
Que la peticion de `taskctl review` deje de embeber lo que el revisor no
necesita leer: el JS compilado (`dist/`), los lockfiles y la propia carpeta
`tareas/`. Hoy son el 27 % de los bytes de todas las peticiones (auditoria
del 2026-10-03, A1) y el 78 % en el peor caso (TASK-031, 325 KB). Lo excluido
sigue visible como `git diff --stat`, con la orden exacta para pedir su diff,
y la peticion nombra la carpeta de la tarea para que los criterios y el plan
se lean del fichero en lugar del diff.

Fuera de alcance: la ronda 2 incremental (TASK-040) y el contenido de las
instrucciones al revisor (TASK-035).
````

### Criterios de aceptacion

````
Clave opcional `excluir_de_revision` en `.taskcode/config.yml`, por defecto `[**/dist/**, *.lock, *-lock.*, tareas/**]`
La peticion incluye `git diff --stat` de lo excluido y la orden para pedir su diff
Regenerar la peticion de TASK-031 sobre su rama baja de 325 KB a menos de 100 KB (medido)
Test contra un repo real: un cambio en `dist/` no aparece en el diff embebido y si en el `--stat`
````
