# Incorporación de nuevos colaboradores

> Guía de referencia para cuando se incorpore alguien al equipo. **A día de
> hoy no hay colaboradores que invitar** — el repo `charliebk/TaskCode`
> (privado) solo tiene un colaborador, el propio dueño (decisión de Carlos,
> 2026-09-13). Esto no es un olvido: es una decisión tomada y documentada —
> ver el cierre del punto 8 de la sección 14 en
> [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md). Esta guía queda
> lista para cuando de verdad haga falta.

Sigue estos tres pasos en orden: acceso, instalación, primera tarea. Si algo
falla, no sigas al paso siguiente — cada uno depende del anterior.

## 1. Acceso al repo

El marketplace (`taskcode-marketplace`) vive en el mismo repo privado
`charliebk/TaskCode` que el propio proyecto. El dueño te da acceso de
lectura como colaborador en GitHub. Sin eso, ningún paso siguiente funciona:
el repo es privado y `/plugin marketplace add` clona por HTTPS/SSH con tus
credenciales de Git/GitHub ya configuradas (SSH o `gh`), no con un token
aparte.

## 2. Instalar el plugin

Dentro de una sesión de Claude Code, dos comandos (ver
[`README.md`](../../README.md)):

```
/plugin marketplace add charliebk/TaskCode
/plugin install taskcode-plugin@taskcode-marketplace
```

Verifica que `taskctl` responde:

```bash
taskctl --version
```

**Camino probado**: `taskctl` funciona como comando dentro de una sesión de
Claude Code con el plugin instalado — es lo único que este proyecto ha
confirmado en la práctica (`CHECKLIST_TERMINACION.md`, E6). Si `--version`
no responde a la primera, sigue el orden de diagnóstico de
`skills/task-workflow/SKILL.md` (reiniciar sesión antes que sospechar del
plugin). Que funcione además como comando suelto en una terminal normal
fuera de una sesión (PATH del sistema) es un punto que este proyecto deja
**pendiente de confirmar** (E6, AC7 "a medias") — no lo den por hecho ni lo
prometan a quien se incorpore.

## 3. Entender el ciclo de vida

No se duplica aquí: el ciclo completo, sus cinco estados y sus comandos
están en [`skills/task-workflow/SKILL.md`](../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md)
(se carga solo con el plugin instalado) y en la sección 13 de
[`PROPUESTA_METODOLOGIA.md`](../PROPUESTA_METODOLOGIA.md) ("Flujo diario
para un integrante del equipo"). Antes de tocar nada, lee también
[`README.md`](README.md) de esta carpeta — el orden de lectura recomendado
para cualquiera que abra el repo por primera vez.

## 4. Hacer tu primera tarea

Sigue el flujo diario de la sección 13 de `PROPUESTA_METODOLOGIA.md` tal
cual, sin pasos implícitos:

1. `taskctl board` — ver qué hay planificado.
2. `taskctl plan TASK-NNN` — mueve la tarea a diseño, dispara el brainstorm.
3. Revisar `plan-final.md` que deja el brainstorm.
4. `taskctl approve TASK-NNN` — **checkpoint humano**, lo ejecuta siempre una
   persona, nunca un agente.
5. `taskctl start TASK-NNN` — crea la rama y mueve la tarea a en curso.
6. Implementar.
7. `taskctl review TASK-NNN` — revisión por pares, agente independiente.
8. `taskctl finish TASK-NNN` — mergea y cierra.

Revisión por pares obligatoria: ninguna tarea se cierra sin que otro agente
la haya revisado empíricamente (reproduciendo, no solo leyendo el diff) —
ver [`CONVENCIONES.md`](CONVENCIONES.md).
