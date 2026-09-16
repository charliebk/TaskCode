# Informe de revisión — TASK-022 (ronda 2)

- Agente revisor: code-quality-reviewer
- Commit revisado: 79faf6ed94546b45ab9e24d6bb4676bed951b36f (`79faf6e`; el diff
  de las correcciones es `c66a3d8`, `79faf6e` solo añade la petición de ronda 2)
- Fecha: 2026-09-16

## Metodología

Revisor independiente: no he participado en la ronda 1. Tarea documental, así
que "reproducir" significa resolver a mano cada ruta, contrastar cada
afirmación contra la fuente que cita y leer el diff real, no su resumen.

Comandos ejecutados (desde la raíz del repo):

1. `git log --oneline --name-status 388d12e..HEAD` y
   `git diff 388d12e..HEAD` por fichero. Superficie real de esta ronda: **3
   ficheros** en `c66a3d8` (`docs/contexto/INCORPORACION.md` +39/-31,
   `docs/contexto/CHECKLIST_TERMINACION.md` +5/-1,
   `tareas/.../revision/informe-revision-1.md` +218/-5) y 1 en `79faf6e`
   (`peticion-revision-2.md`, alta). Coincide con lo declarado en la petición.
2. `git diff develop..HEAD -- docs/PROPUESTA_METODOLOGIA.md | od -c` → un único
   `\n` (el del `echo` envolvente): **salida vacía**. El fichero tampoco
   aparece en `git diff --name-status develop..HEAD`. Documento congelado
   **intacto, verificado dos veces**.
3. **Enlaces relativos de `INCORPORACION.md`, resueltos de nuevo tras las
   ediciones**: extraídos con regex y normalizados con `os.path.normpath`
   desde `docs/contexto/`, más una pasada independiente con `test -f` +
   `realpath` en Bash. **7 enlaces, 7 OK, 0 rotos**, incluidos los **dos** que
   apuntan a `skills/task-workflow/SKILL.md` (líneas 54 y 59), ambos con la
   ruta `../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md`
   → resuelve a
   `TaskCode/taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md`,
   que existe.
4. **Fuentes de la afirmación sobre `taskctl`**: leídos íntegros el item E3
   (`CHECKLIST_TERMINACION.md:481-489`), el item E6 y su AC7 (`524-546`), la
   sección de `HALLAZGOS.md` sobre la instalación real (`249-268`) y su tabla
   de Windows (`274-282`), el prerrequisito 1 de
   `skills/task-workflow/SKILL.md:21-45`, y el job `windows-latest` de
   `.github/workflows/ci.yml:130-166` (steps Q1-Q5).
5. `grep -n -E "punto 8|secci[oó]n 14|§14" docs/contexto/CHECKLIST_TERMINACION.md`
   → **1 coincidencia**, línea 474 (en la ronda 1 eran 0), dentro de la nota de
   E1; leído el bloque E1 completo (`469-479`).
6. **Sección 13 real** de `PROPUESTA_METODOLOGIA.md:372-374`, contada paso a
   paso, contra la lista de la sección 4 de la guía.
7. **Formato y consistencia numérica** de `INCORPORACION.md`: 84 líneas, sin
   CRLF, sin espacios al final, 4 vallas de código balanceadas, 5 cabeceras
   (`#` + `## 1.`…`## 4.`), lista de la sección 4 numerada **1-9 correlativa**.
8. **Contadores del checklist**: `grep -c "^- \[x\] \*\*E"` → **4**, cabecera
   `## Fase E — Cierre (4/6)` y tabla `| E — Cierre | 6 | **4** |`. Coherentes;
   la casilla de E1 sigue **sin marcar**, que es lo correcto hasta `finish`.
9. `grep -rn "INCORPORACION" --include="*.md" .` para ver qué otros ficheros
   describen la guía, y `grep -n -E "tres pasos|tal cual"` sobre la guía →
   **0 coincidencias** (ya no sobreviven en ningún sitio del fichero).
10. `grep -rn -E "terminal normal|PATH del sistema" docs/contexto/*.md` → la
    única aparición en todo `docs/contexto/` es la propia línea 47 de
    `INCORPORACION.md`; ninguna fuente del proyecto usa esa formulación.

No modifiqué ningún fichero del repo salvo este informe. No borré nada de
`revision/`.

## Verificación de las correcciones de la ronda 1

**I1 (importante) — `taskctl`: probado vs. pendiente → CORREGIDO A MEDIAS.**
La inversión que denunciaba la ronda 1 **sí** desapareció: el caso "dentro de
una sesión" ya no se vende como probado, y el aviso ahora apunta al caso que
de verdad está pendiente, con la remisión correcta al orden de diagnóstico de
`SKILL.md` (reiniciar sesión primero). Eso está bien. Pero la mitad
"**Probado**" (líneas 46-49) se pasa de frenada y afirma algo que su fuente no
prueba — detalle y evidencia en el hallazgo **N1** de abajo, que lo trato como
hallazgo nuevo porque la afirmación es nueva, no la de la ronda 1.

**I2 (importante) — cierre del punto 8 de la §14 → CORREGIDO.**
Comprobado sobre el fichero, no sobre el resumen: `CHECKLIST_TERMINACION.md`
contiene ahora "punto 8" y "sección 14" (línea 474, antes cero coincidencias),
dentro de la nota de E1:

> *… Cierra, en cuanto se mergee, el punto 8 de la sección 14 de
> `PROPUESTA_METODOLOGIA.md` (documento congelado, no editado) **en lo que
> respecta a a quién se invita**: a día de hoy, a nadie — decisión de Carlos,
> 2026-09-13; la guía queda en `INCORPORACION.md` para cuando haga falta.*

**No es circular**, que era el fondo del hallazgo: la nota enuncia la decisión
*in situ* (a nadie, con autor y fecha) y menciona `INCORPORACION.md` solo como
el sitio donde vive la guía, no como la fuente de la decisión. La cita de
cabecera de la guía se ajustó en paralelo para señalar el item concreto ("bajo
el item **E1** de la Fase E"), así que el lector aterriza donde debe. El
enunciado original del punto 8 en `PROPUESTA_METODOLOGIA.md:§14.8` ("Queda por
decidir el nombre exacto del repo y a quién se invita como colaborador") sigue
intacto, como toca en un documento congelado.

**I3 (importante) — clon del repo y nivel de acceso → CORREGIDO.**
Los dos huecos están tapados y, además, son coherentes entre sí y con lo que
la sección 4 le pide hacer después:

- El clon: la sección 2 se retitula "Clonar el repo e instalar el plugin" y
  abre con *"Clona `charliebk/TaskCode` … y sitúate dentro — todo lo que sigue
  (`taskctl`, la carpeta `tareas/`) opera sobre ese árbol de trabajo, no sobre
  la caché del marketplace"*. Justo la distinción que faltaba, y concuerda con
  `SKILL.md:16-19` (la skill exige la estructura `tareas/00-…04-…` delante).
- El acceso: la sección 1 pide ahora *"**con permiso de escritura**, no solo
  lectura"*, y lo justifica con el flujo real de la sección 4 (`taskctl
  start`/`finish` sobre rama propia y publicar esa rama, que no se borra —
  política IECA). Contrastado con `CLAUDE.md` del proyecto ("Las ramas no se
  borran tras el merge (política IECA)") y con la sección 4 de la propia guía:
  sin escritura no se puede devolver el trabajo. La frase de cierre ("La
  lectura basta únicamente para instalar el plugin (paso 2)") sigue siendo
  cierta también para el clon, que solo necesita lectura.

**M1 — "tres pasos" con cuatro secciones → CORREGIDO.**
Línea 11: *"Sigue estos cuatro pasos en orden: acceso, clonar e instalar,
entender el ciclo de vida, primera tarea"*. Contado sobre el fichero: hay
exactamente **cuatro** cabeceras `## N.` (`1. Acceso al repo`, `2. Clonar el
repo e instalar el plugin`, `3. Entender el ciclo de vida`, `4. Hacer tu
primera tarea`) y la enumeración de la intro las nombra en el mismo orden y
con las mismas palabras que sus títulos. Cuadra. "tres pasos" ya no aparece en
el fichero (grep a 0).

**M2 — "tal cual", `git pull` y conteo de pasos → CORREGIDO.**
"tal cual" no sobrevive en ninguna parte del fichero (grep a 0). La sección 4
se presenta como *"Recorrido resumido de la sección 13 … — la versión
canónica, con los diez pasos completos, está ahí"* y `git pull` vuelve como
paso 1 con la razón ("parte siempre de `develop` al día"). Verifiqué el
"diez": la §13 real (`PROPUESTA_METODOLOGIA.md:374`) tiene en efecto **10**
ítems (`1. Instala el plugin … 2. git pull · 3. board · 4. plan · 5. revisar
plan-final/approve · 6. start · 7. trabajar · 8. review · 9. codex-review si
aplica · 10. finish`). La guía lista 9, y las dos omisiones son defendibles y
ya no se presentan como equivalencia: "instala el plugin" es su propia sección
2, y `codex-review` no existe en el CLI. Numeración 1-9 correlativa,
verificada.

**M3 — ruta cruda `skills/task-workflow/SKILL.md` → CORREGIDO.**
Las dos apariciones (líneas 54 y 59) son ahora enlaces Markdown con la misma
ruta relativa completa, y ambas resuelven (`test -f` + `normpath`). El texto
visible sigue siendo corto, que es lo deseable. No queda ninguna otra ruta
cruda sin resolver: revisé todos los fragmentos entre backticks con `/` — el
resto son `bin/`, `tareas/`, `charliebk/TaskCode` y los dos comandos
`/plugin …`, que son identificadores, no rutas de fichero.

## Hallazgos nuevos

### CRÍTICO

Sin hallazgos. Cambio documental, sin pérdida de datos ni de estado; el
documento congelado está verificadamente intacto y ningún comando de la guía
hace lo contrario de lo que anuncia.

### IMPORTANTE

**N1 — La nueva mitad "Probado" afirma como confirmado el eslabón que E6/AC7
declara no visto funcionar, y se lo atribuye a un CI que nunca instaló un
plugin.**

`docs/contexto/INCORPORACION.md:46-49` dice ahora:

> **Probado**: `bin/` de un plugin instalado se añade al PATH y `taskctl`
> resuelve como comando suelto en una terminal normal — confirmado por el job
> `windows-latest` de CI sobre un checkout nativo (item E3 del checklist de
> terminación).

Tres cosas que no cuadran con las fuentes, comprobadas una a una:

1. **El CI no instala ningún plugin.** El step que respalda la frase es Q2
   (`ci.yml:144-149`), y es literalmente:
   `export PATH="$(pwd)/bin:$PATH"` seguido de `taskctl --version`, sobre el
   `bin/` del *checkout del repo*. `grep -i "plugin install\|marketplace add"`
   sobre `ci.yml` → **cero coincidencias**. Lo que Q2 prueba es la implicación
   trivial *"si el directorio que contiene `taskctl` está en el PATH, el
   comando suelto resuelve en Windows nativo"*. No prueba el antecedente —
   que instalar el plugin ponga ese directorio en el PATH —, que es
   justamente la parte que le importa al recién llegado.
2. **Ese antecedente es, textualmente, lo que E6/AC7 marca como no visto.**
   `CHECKLIST_TERMINACION.md:542-546`: *"se confirmó por primera vez … que el
   mecanismo de `bin/` en PATH existe de verdad. **Pero `taskctl` como comando
   suelto no se ha visto funcionar**"*. Y `HALLAZGOS.md:258-261` acota la
   evidencia positiva a *"en el PATH de **una sesión** aparecen los `bin/` de
   otros plugins cacheados"*. La guía convierte ese "existe el mecanismo, no
   se ha visto funcionar" en un "Probado" liso.
3. **"en una terminal normal" no lo dice ninguna fuente, y el mecanismo
   documentado apunta a lo contrario.** `grep -rn "terminal normal|PATH del
   sistema" docs/contexto/*.md` devuelve **solo esta línea** en todo
   `docs/contexto/`. E3 describe su propio Q2 como *"`taskctl` resuelve como
   comando suelto por PATH"*, sin "plugin instalado" ni "terminal normal" — las
   dos cualificaciones las añade la guía. Y el prerrequisito 1 de
   `SKILL.md:21-24` dice que el `bin/` del plugin es algo que *"Claude Code
   anade al PATH **del Bash tool** mientras el plugin este habilitado"*: un
   PATH de sesión, no el de una consola del sistema.

Impacto real, no de borde, y del mismo tipo que el I1 de la ronda 1 pero en el
sentido opuesto: el colaborador que lea "Probado … en una terminal normal"
abrirá `cmd`/Git Bash fuera de Claude Code, obtendrá `command not found` y
concluirá que su instalación está rota — y el remedio que la guía ofrece
("reinicia la sesión (el PATH se compone al arrancar)") no aplica a una
terminal del sistema, porque está escrito para el otro caso. La frase,
además, se contradice dentro de sí misma: sujeto "un plugin instalado",
evidencia "un checkout nativo".

Sugerencia (un párrafo, sin tocar nada más): *"**Probado**: en Windows nativo,
con el directorio `bin/` del CLI en el PATH, `taskctl` resuelve como comando
suelto — job `windows-latest` del CI, step Q2 (item E3). **Pendiente de
confirmar**: que instalar el plugin deje ese `bin/` en el PATH de forma
utilizable. Lo único confirmado es que el mecanismo existe (aparecen los
`bin/` de otros plugins cacheados en el PATH de una sesión); `taskctl` como
comando suelto todavía no se ha visto funcionar (E6/AC7, `HALLAZGOS.md`). Ese
PATH lo compone Claude Code para su Bash tool (`SKILL.md`), así que **no
cuentes con `taskctl` en una consola del sistema**: dentro de la sesión, si
`--version` da `command not found`, reinicia la sesión y, si persiste, sigue
el orden de diagnóstico de `SKILL.md`."*

### MENOR

**N2 — "de inmediato … justo después de instalar" desdibuja cuál de los dos
escenarios de sesión es el pendiente.**
`INCORPORACION.md:49-52` deja como pendiente *"que aparezca así de inmediato
en el PATH de una sesión de Claude Code recién arrancada justo después de
instalar el plugin"*. Las fuentes distinguen dos casos y les dan estatus
distinto: en la **misma** sesión de la instalación ya está **comprobado que
falla** (`HALLAZGOS.md:258-260`: *"en la sesión donde se instaló … seguía dando
`command not found`"*), y lo que queda **pendiente** es la sesión
**siguiente** (*"cuesta un comando en la siguiente: `taskctl --version`"*;
igual en E6/AC7). "De inmediato / justo después de instalar" se lee con más
naturalidad como el primer caso, que no es pendiente sino negativo conocido.
La frase que sigue ("reinicia la sesión primero") ya empuja al lector en la
dirección correcta, por eso es menor; bastaría decir "en la **siguiente**
sesión, tras reiniciar".

**N3 — La ficha de la guía en el `README.md` raíz se quedó con la enumeración
vieja de tres pasos.**
`README.md:69` describe el documento como *"Guía para incorporar a un nuevo
colaborador: acceso, instalación, primera tarea."* — los tres de antes. La
corrección de M1 cambió la enumeración de la guía a cuatro y retituló el paso
2 ("Clonar el repo e instalar el plugin"), pero esta línea no se actualizó, así
que el índice del repo sigue anunciando un recorrido que ya no es el del
documento. Es cosmético (la tabla no promete ser exhaustiva, y la fila de
`docs/contexto/README.md:13` es genérica y no ha quedado desfasada), pero es
divergencia introducida por esta ronda. Sugerencia: *"acceso, clon e
instalación, ciclo de vida, primera tarea"*.

**N4 — El informe de la ronda 1 se commiteó dentro del mismo commit que sus
correcciones.**
`git log --name-status 388d12e..HEAD` muestra que `informe-revision-1.md`
(+218/-5, la sustitución de la plantilla por el informe real) viaja en
`c66a3d8`, el commit `fix(TASK-022): corrige hallazgos de la ronda 1`. El
contenido está íntegro y no se ha borrado nada, así que no hay daño; pero el
historial no tiene ningún estado en el que los hallazgos consten sin estar ya
corregidos, que es justo lo que una auditoría posterior querría poder ver por
separado. Proceso, no documento: lo dejo anotado para futuras rondas (informe
en su propio commit antes del `fix`), no como algo que rehacer aquí.

### Comprobaciones que pasaron limpias

Para que no haya que repetirlas: los 7 enlaces relativos de `INCORPORACION.md`
resuelven tras las ediciones (incluidos los dos de `SKILL.md`);
`PROPUESTA_METODOLOGIA.md` sigue byte a byte como en `develop`; el Markdown es
válido (84 líneas, sin CRLF, sin espacios finales, 4 vallas balanceadas, 5
cabeceras, lista 1-9 correlativa); el "diez pasos" que la guía atribuye a la
§13 es exacto; la nota de E1 cierra el punto 8 sin circularidad; los
contadores de la Fase E (4 casillas `[x]`, cabecera `(4/6)`, tabla `**4**`)
son coherentes y la casilla de E1 sigue sin marcar, como corresponde hasta
`taskctl finish`; y no queda en el fichero ni una aparición de "tres pasos",
"tal cual" ni de ninguna ruta cruda sin resolver.

### Criterios de aceptación de `tarea.md`

- **AC1** (guía seguible sin ayuda: instalar, entender el ciclo, primera
  tarea): **casi**. Los dos huecos estructurales de la ronda 1 (clon y nivel
  de acceso) están resueltos y el recorrido es ahora autosuficiente de punta a
  punta. Lo que impide darlo por sostenido *sin reservas* es N1: el único
  punto de verificación que la guía le da al recién llegado (`taskctl
  --version`) va acompañado de una etiqueta "Probado" que no se sostiene y que
  puede llevarle a diagnosticar mal el primer fallo. Es una frase.
- **AC2** (sin invitaciones reales, guía lista): **sostenido sin reservas**.
  Consta en el bloque de cita de cabecera con autor y fecha, y no hay rastro
  de ninguna invitación ejecutada.
- **AC3** (cierre del punto 8 de la §14 documentado): **sostenido sin
  reservas** tras la corrección de I2. La decisión consta ahora en
  `CHECKLIST_TERMINACION.md:474-479` con autor y fecha, citando el punto y la
  sección explícitamente, sin depender de la guía para justificarse.

## Veredicto
- Veredicto: cambios-solicitados
