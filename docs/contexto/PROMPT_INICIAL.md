# Prompt inicial para una sesión nueva

Pégalo como primer mensaje de una sesión de Claude Code abierta en la raíz del
repo (`C:\Users\nullcad2025\Documents\sources\Personal\TaskCode`).

---

```
Vamos a seguir con TaskCode. Antes de proponer nada, lee en este orden:
docs/contexto/ESTADO.md, docs/contexto/CHECKLIST_TERMINACION.md,
docs/contexto/CONVENCIONES.md y docs/contexto/HALLAZGOS.md.

Contexto en una frase: Sprint 0 y 1 cerrados, Fases A y B cerradas enteras, y
la Fase C por 3 de 8 (26/42 items). El ciclo de vida completo
(import -> plan -> approve -> start -> review -> finish) funciona y ya se usa
a si mismo; 417 tests.

Empieza por C3: subcarpetas planificacion/ y revision/ en cada carpeta de
tarea (~1h). "review" ya crea la de revision; falta la de planificacion y
mover ahi plan-final.md. Ojo con las tareas ya cerradas en 04-terminadas: hay
que decidir si se migran o solo aplica a las nuevas, y decirlo explicitamente.

Despues, por orden de lo que esta libre: C5 (la primera skill del plugin) y C6
(bug de origin sin guard en 3 scripts, mas las tres cosas que le dejo C1: el
registro dentro del repo, los mensajes que remiten a los menus de IntelliJ, y
el cherry-pick que abort-merge.sh no ve). C2 y C4 siguen bloqueados por tus
decisiones #14 y #9.

Trabaja como dice CONVENCIONES.md: rama propia por tarea creada por taskctl,
tests reales contra repos Git temporales, smoke test manual en un clon cuando
se toque el CLI o Git, revision por pares con un agente independiente antes de
dar nada por cerrado, y merge a develop con --no-ff.

Al terminar cada item: marca su casilla en
docs/contexto/CHECKLIST_TERMINACION.md, actualiza los contadores de la
cabecera, y muestrame el checklist actualizado en tu respuesta.

Todo en espanol. Los mensajes de commit sin tildes.

Tres cosas del entorno que te ahorran tiempo (estan en HALLAZGOS.md, pero
mejor que las tengas ya):
- Antes de nada, prepende "C:\Program Files\Git\usr\bin" al PATH; si no, bash
  resuelve al de WSL y revienta todo lo que spawnea scripts.
- "Suite verde" en local = fallan solo 3 tests conocidos (2 de symlinks EPERM
  y 1 de CRLF); ademas plan.test.ts y main.test.ts tienen fallos
  intermitentes bajo carga: antes de acusar a un cambio, corre el fichero
  aislado.
- Los ficheros que le pases a taskctl import tienen que vivir fuera del repo.
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
