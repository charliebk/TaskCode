# Incorporación de nuevos colaboradores

> Guía de referencia para cuando se incorpore alguien al equipo. **A día de
> hoy no hay colaboradores que invitar** — el repo `charliebk/TaskCode`
> (privado) solo tiene un colaborador, el propio dueño (decisión de Carlos,
> 2026-09-13). Esto no es un olvido: es una decisión tomada y documentada —
> ver el cierre del punto 8 de la sección 14, documentado bajo el item **E1**
> de la Fase E en [`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md).
> Esta guía queda lista para cuando de verdad haga falta.

Sigue estos cuatro pasos en orden: acceso, clonar e instalar, entender el
ciclo de vida, primera tarea. Si algo falla, no sigas al paso siguiente —
cada uno depende del anterior.

## 1. Acceso al repo

El marketplace (`taskcode-marketplace`) vive en el mismo repo privado
`charliebk/TaskCode` que el propio proyecto. El dueño te da acceso como
colaborador en GitHub — **con permiso de escritura**, no solo lectura: hacer
tu primera tarea (paso 4) implica `taskctl start`/`finish` sobre una rama
propia y, por convención del proyecto, publicar esa rama (nunca se borra,
queda para auditoría — política IECA); con solo lectura no puedes devolver
tu trabajo. La lectura basta únicamente para instalar el plugin (paso 2).

## 2. Clonar el repo e instalar el plugin

Clona `charliebk/TaskCode` con tus credenciales de Git/GitHub ya
configuradas (SSH o `gh`) y sitúate dentro — todo lo que sigue (`taskctl`, la
carpeta `tareas/`) opera sobre ese árbol de trabajo, no sobre la caché del
marketplace.

Dentro de una sesión de Claude Code abierta en ese repo, dos comandos (ver
[`README.md`](../../README.md)):

```
/plugin marketplace add charliebk/TaskCode
/plugin install taskcode-plugin@taskcode-marketplace
```

Verifica que `taskctl` responde:

```bash
taskctl --version
```

**Probado**: `bin/` de un plugin instalado se añade al PATH y `taskctl`
resuelve como comando suelto en una terminal normal — confirmado por el job
`windows-latest` de CI sobre un checkout nativo (item E3 del checklist de
terminación). **Pendiente de confirmar**: que aparezca así de inmediato en el
PATH de una sesión de Claude Code recién arrancada justo después de instalar
el plugin (item E6/AC7 del checklist; también señalado en `HALLAZGOS.md`) —
si `--version` da `command not found`, reinicia la sesión primero (el PATH se
compone al arrancar) y, si persiste, sigue el resto del orden de diagnóstico
de [`skills/task-workflow/SKILL.md`](../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md).

## 3. Entender el ciclo de vida

No se duplica aquí: el ciclo completo, sus cinco estados y sus comandos
están en [`skills/task-workflow/SKILL.md`](../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md)
(se carga solo con el plugin instalado) y en la sección 13 de
[`PROPUESTA_METODOLOGIA.md`](../PROPUESTA_METODOLOGIA.md) ("Flujo diario
para un integrante del equipo"). Antes de tocar nada, lee también
[`README.md`](README.md) de esta carpeta — el orden de lectura recomendado
para cualquiera que abra el repo por primera vez.

## 4. Hacer tu primera tarea

Recorrido resumido de la sección 13 de `PROPUESTA_METODOLOGIA.md` — la
versión canónica, con los diez pasos completos, está ahí:

1. `git pull` — parte siempre de `develop` al día.
2. `taskctl board` — ver qué hay planificado.
3. `taskctl plan TASK-NNN` — mueve la tarea a diseño, dispara el brainstorm.
4. Revisar `plan-final.md` que deja el brainstorm.
5. `taskctl approve TASK-NNN` — **checkpoint humano**, lo ejecuta siempre una
   persona, nunca un agente.
6. `taskctl start TASK-NNN` — crea la rama y mueve la tarea a en curso.
7. Implementar.
8. `taskctl review TASK-NNN` — revisión por pares, agente independiente.
9. `taskctl finish TASK-NNN` — mergea y cierra.

Revisión por pares obligatoria: ninguna tarea se cierra sin que otro agente
la haya revisado empíricamente (reproduciendo, no solo leyendo el diff) —
ver [`CONVENCIONES.md`](CONVENCIONES.md).
