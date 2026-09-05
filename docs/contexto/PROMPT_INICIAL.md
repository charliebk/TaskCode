# Prompt inicial para una sesión nueva

Pégalo como primer mensaje de una sesión de Claude Code abierta en la raíz del
repo (`C:\Users\nullcad2025\Documents\sources\Personal\TaskCode`).

---

```
Vamos a seguir con TaskCode. Antes de proponer nada, lee en este orden:
docs/contexto/ESTADO.md, docs/contexto/CHECKLIST_TERMINACION.md,
docs/contexto/CONVENCIONES.md y docs/contexto/HALLAZGOS.md.

Contexto en una frase: Sprint 0 y 1 están cerrados y la Fase A del plan de
terminación también (16/40 items). Toca la Fase B, que es el hito real de
usabilidad: hasta que existan `taskctl review` y `taskctl finish` no se puede
cerrar una tarea.

Empieza por B2 (corregir el bug de `origin` sin guard en
merge-hotfix-to-main.sh y merge-release-to-main.sh), que es precondición de B3
y son ~30 minutos. Luego seguimos con B1.

Trabaja como dice CONVENCIONES.md: rama propia por tarea, tests reales contra
repos Git temporales, revisión por pares con un agente independiente antes de
dar nada por cerrado, y merge a develop con --no-ff.

Al terminar cada item: marca su casilla en
docs/contexto/CHECKLIST_TERMINACION.md, actualiza los contadores de la
cabecera, y muéstrame el checklist actualizado en tu respuesta.

Todo en español. Los mensajes de commit sin tildes.

Una cosa antes de empezar: la decisión #13 sigue abierta y bloquea B7
(¿el límite de WIP es único, una sola tarea activa de punta a punta, o dos
límites independientes para diseño y ejecución?). Pregúntamela cuando
lleguemos ahí, no ahora.
```

---

## Variantes

**Si solo quieres ver el estado sin empezar a trabajar:**

```
Lee docs/contexto/ESTADO.md y docs/contexto/CHECKLIST_TERMINACION.md y
dame el estado actual del proyecto y qué toca ahora. No empieces a
implementar nada todavía.
```

**Para cerrar lo que le queda a TASK-021** (es lo único que necesita una sesión
nativa de Claude Code, y ahora por fin la tienes):

```
Quiero cerrar lo que le queda a TASK-021. Lee
tareas/00-planificadas/TASK-021/tarea.md, sección "Avance parcial".

Falta probar de verdad, no suponer:
1. /plugin marketplace add charliebk/TaskCode
2. /plugin install taskcode-plugin@taskcode-marketplace
3. Que `taskctl --help` responda como comando suelto en el Bash tool de esta
   sesión, sin rutas absolutas.
4. Qué hace realmente /plugin marketplace update (es el punto 10 de la
   sección 14 de la metodología, lleva abierto desde el diseño).

Documenta el resultado real de cada paso en el tarea.md, incluido lo que
falle. Si algo no funciona, dilo: no lo maquilles.
```
