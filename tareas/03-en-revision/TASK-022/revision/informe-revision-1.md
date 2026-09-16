# Informe de revisión — TASK-022 (ronda 1)

- Agente revisor: code-quality-reviewer
- Commit revisado: 388d12e837697dca96cd2ed58b5abc57bc19670d (el diff de la
  petición es `0a23463`; `388d12e` solo añade la propia petición de revisión)
- Fecha: 2026-09-16

## Metodología

Tarea puramente documental: no hay código que ejecutar, así que "reproducir"
aquí significa resolver a mano cada ruta relativa, contrastar cada afirmación
contra la fuente que la guía cita, y verificar el estado real del repo en vez
de fiarme del diff de la petición.

Lo que ejecuté:

1. **Superficie real del cambio**, no la declarada:
   `git diff --name-status develop..HEAD`. Confirmados 4 ficheros de contenido
   (`README.md`, `docs/contexto/CHECKLIST_TERMINACION.md`,
   `docs/contexto/INCORPORACION.md` nuevo, `docs/contexto/README.md`) más los
   renombrados de la carpeta de la tarea (`01-en-diseno` → `03-en-revision`,
   R100/R087) y los dos ficheros de `revision/`.
2. **Documento congelado intacto**:
   `git diff develop..HEAD -- docs/PROPUESTA_METODOLOGIA.md | od -c` → salida
   vacía (solo el `\n` del `echo` envolvente). El fichero tampoco aparece en
   `--name-status`. **Confirmado: no se ha tocado.**
3. **Todos los enlaces relativos**, resueltos con `os.path.normpath` desde el
   directorio del fichero que los contiene y comprobados con `os.path.exists`,
   en los tres ficheros implicados (`INCORPORACION.md`, `README.md` raíz,
   `docs/contexto/README.md`): **27 enlaces, 27 OK, 0 rotos**. Incluye los seis
   del enunciado (`../../README.md`, `README.md`, `../../taskcode-marketplace/
   plugins/taskcode-plugin/skills/task-workflow/SKILL.md`,
   `../PROPUESTA_METODOLOGIA.md`, `CONVENCIONES.md`,
   `CHECKLIST_TERMINACION.md`).
4. **Contadores del checklist**: conté las casillas marcadas por fase sobre
   `git show develop:...` y `git show HEAD:...`. En `develop` la Fase E decía
   `(2/6)` con **4** casillas `[x]` reales (E3, E4, E5, E6) — el cabecero se
   quedó desfasado en `23f86b1`. HEAD lo pone en `(4/6)`, que es lo correcto y
   concuerda con la tabla de cabecera (`| E — Cierre | 6 | **4** |`, ya a 4 en
   `develop`). La casilla de E1 sigue sin marcar, que es lo que toca.
5. **Contraste de las afirmaciones sobre `taskctl`** contra sus fuentes:
   `CHECKLIST_TERMINACION.md` E6/AC7 (líneas 520-546) y E3 (474-481),
   `HALLAZGOS.md` (249-282), `SKILL.md` (21-39) y el step Q2 de
   `.github/workflows/ci.yml` (144-149).
6. **Punto 8 de la sección 14**: localizado en `docs/PROPUESTA_METODOLOGIA.md`
   (§14, ítem 8) y buscado su "cierre" en el fichero al que la guía remite
   (`grep` de `punto 8|sección 14|§14` sobre `CHECKLIST_TERMINACION.md` → **0
   coincidencias**).
7. **Sección 13 real** de `PROPUESTA_METODOLOGIA.md`, volcada entera para
   compararla con la lista de 8 pasos de la guía.
8. **Arranque del CLI**: `node bin/taskctl --version` → `0.1.0`, exit 0. Y
   `command -v taskctl` en el Bash tool de esta sesión → **no está en el PATH**
   (dato corroborante, no concluyente: no consta que el plugin esté instalado
   en esta sesión).
9. **Formato Markdown** de `INCORPORACION.md`: 77 líneas, sin CRLF, sin espacios
   al final, 4 vallas de código balanceadas (2 bloques), lista numerada 1-8
   correlativa, 5 cabeceras bien anidadas. Columnas de las filas nuevas de
   ambas tablas de índice: 2 en el `README.md` raíz y 3 en
   `docs/contexto/README.md`, **coincidiendo con sus cabeceras**.

No modifiqué ningún fichero del repo salvo este informe.

## Hallazgos

### CRÍTICO

Sin hallazgos. No hay pérdida de datos, corrupción de estado ni comando que
haga lo contrario de lo que dice: el cambio es documental y el documento
congelado (`PROPUESTA_METODOLOGIA.md`) está verificadamente intacto.

### IMPORTANTE

**I1 — El apartado "Camino probado" invierte lo que el proyecto tiene
confirmado y lo que no.**

`docs/contexto/INCORPORACION.md:39-47` afirma:

> **Camino probado**: `taskctl` funciona como comando dentro de una sesión de
> Claude Code con el plugin instalado — es lo único que este proyecto ha
> confirmado en la práctica (`CHECKLIST_TERMINACION.md`, E6). […] Que funcione
> además como comando suelto en una terminal normal fuera de una sesión (PATH
> del sistema) es un punto que este proyecto deja **pendiente de confirmar**
> (E6, AC7 "a medias").

Las dos mitades están al revés respecto de las fuentes que cita:

- Lo **no confirmado** es justamente el caso "dentro de una sesión".
  `HALLAZGOS.md:258-261`: *"Sin confirmar: en la sesión donde se instaló,
  `taskctl` como comando suelto seguía dando `command not found`. La hipótesis
  es que el PATH se compone al arrancar la sesión. **No está comprobado**, y
  cuesta un comando en la siguiente: `taskctl --version`."* Y el propio E6/AC7
  (`CHECKLIST_TERMINACION.md:542-544`) dice *"Pero `taskctl` como comando suelto
  **no se ha visto funcionar**: cuesta un comando en la próxima sesión,
  `taskctl --version`"* — el comando pendiente es en sesión, no fuera.
  `PROMPT_INICIAL.md:73` lo lista como pregunta abierta para la próxima sesión
  en esos mismos términos.
- Lo que sí está **confirmado** es la resolución por PATH en una terminal
  normal, que la guía marca como pendiente: E3
  (`CHECKLIST_TERMINACION.md:478-479`) y la tabla de `HALLAZGOS.md:279`
  responden *"¿`taskctl` resuelve como comando suelto vía PATH? **Sí**"*, y el
  step que lo asevera es `ci.yml:144-149` (`export PATH="$(pwd)/bin:$PATH"` →
  `taskctl --version`) sobre un checkout nativo de Windows.

Impacto real, no de borde: el paso 2 de la guía le da al recién llegado
exactamente un comando de verificación, `taskctl --version`, y a continuación
le dice que ese camino está probado. Es el único escenario que el proyecto ha
visto fallar (`command not found`). Un colaborador que se lo crea concluirá que
la instalación está rota. Además la guía se apoya en esa clasificación errónea
para un aviso normativo ("no lo den por hecho ni lo prometan a quien se
incorpore"), que acaba apuntando al caso equivocado. Añado como dato
corroborante que en el Bash tool de esta sesión `command -v taskctl` no
encuentra nada.

Sugerencia: invertir los dos párrafos — "probado: `bin/` en el PATH resuelve
`taskctl` (E3/CI)"; "pendiente de confirmar: que aparezca en el PATH de una
sesión de Claude Code recién arrancada tras instalar el plugin (E6/AC7,
HALLAZGOS); si da `command not found`, reinicia la sesión y, si persiste, usa
`node "$CLAUDE_PLUGIN_ROOT/bin/taskctl" --version`" — que es literalmente el
orden de diagnóstico de `SKILL.md:27-39` al que la guía ya remite.

**I2 — La referencia al "cierre del punto 8 de la sección 14" apunta a un
documento que no lo documenta.**

`INCORPORACION.md:5-8` dice: *"Esto no es un olvido: es una decisión tomada y
documentada — ver el cierre del punto 8 de la sección 14 en
[`CHECKLIST_TERMINACION.md`](CHECKLIST_TERMINACION.md)"*. El enlace **resuelve
al fichero** (comprobado), pero el contenido al que remite no existe: `grep` de
`punto 8`, `sección 14`, `seccion 14` y `§14` sobre
`docs/contexto/CHECKLIST_TERMINACION.md` da **cero coincidencias**, y la nota
que esta misma tarea añade bajo E1 (líneas 457-461) habla solo de que el
documento ya está escrito y enlazado — no menciona la sección 14, ni el punto
8, ni la decisión de "a nadie por ahora".

Esto deja el AC3 sostenido en un círculo: el único sitio donde consta la
decisión es la propia guía, que para justificarla remite a un documento que no
la recoge. El punto 8 sigue diciendo en `PROPUESTA_METODOLOGIA.md:§14.8`
*"Queda por decidir el nombre exacto del repo y a quién se invita como
colaborador"*, y ese fichero está congelado con razón — pero entonces el cierre
tiene que quedar registrado en algún sitio de verdad. El lugar natural es la
nota de E1 en el checklist, que ya se está tocando en esta tarea: bastan dos
líneas ("cierra el punto 8 de la §14 en lo que respecta a a quién se invita: a
nadie, decisión de Carlos 2026-09-13; la guía queda en `INCORPORACION.md`") y
la referencia deja de ser circular.

**I3 — La guía no basta "sin ayuda" para hacer la primera tarea: faltan el
clon y el nivel de acceso correcto.**

El AC1 exige que un integrante nuevo pueda *"instalar el plugin, entender el
ciclo de vida y hacer su primera tarea"* sin ayuda. Dos huecos que un recién
llegado sí encuentra:

- **Nunca se le dice que clone el repo ni desde dónde ejecutar nada.** El paso
  1 se limita al acceso en GitHub y el paso 2 a `/plugin marketplace add`, que
  clona la *caché del marketplace*, no un árbol de trabajo. En el paso 4, el
  primer comando es `taskctl board`, y `SKILL.md:16-19` es explícito en que la
  skill y el CLI operan sobre un proyecto con la estructura `tareas/00-…04-…`
  delante. Sin un `git clone` previo y sin situarse dentro, el paso 4 no
  arranca.
- **Se le concede un acceso insuficiente para el flujo que luego se le pide.**
  El paso 1 dice *"El dueño te da acceso de **lectura** como colaborador"*, y
  eso cubre solo la instalación del plugin. El paso 4 le hace ejecutar
  `taskctl start` (rama), `taskctl finish` (merge `--no-ff` a `develop`) y, por
  convención del proyecto, las ramas se conservan publicadas para auditoría;
  `pause --push` hace `git push origin <rama>`. Con lectura no puede devolver
  su trabajo. Conviene separarlo: lectura para instalar, escritura (push) para
  contribuir.

### MENOR

**M1 — "Sigue estos tres pasos en orden" y luego hay cuatro.**
`INCORPORACION.md:11` anuncia *"tres pasos en orden: acceso, instalación,
primera tarea"*, pero el documento tiene cuatro secciones numeradas (`## 1.`
Acceso, `## 2.` Instalar, `## 3.` Entender el ciclo de vida, `## 4.` Primera
tarea). Peor con la frase que sigue —*"Si algo falla, no sigas al paso
siguiente"*—: obliga a contar bien. O son cuatro, o el 3 se pliega dentro del 4
como lectura previa.

**M2 — El paso 3 declara que no duplica y el paso 4 duplica; y la copia ya
diverge de su fuente.**
`INCORPORACION.md:51` dice *"No se duplica aquí: el ciclo completo, sus cinco
estados y sus comandos están en SKILL.md y en la sección 13"*, y doce líneas
después el paso 4 reproduce la secuencia entera de comandos. Además anuncia
*"Sigue el flujo diario de la sección 13 […] **tal cual**, sin pasos
implícitos"* y lo que lista no es "tal cual": la §13 real tiene **diez** pasos
(`1. Instala el plugin … 2. git pull · 3. taskctl board · … · 9. taskctl
codex-review si aplica · 10. taskctl finish`) y la guía deja **ocho**. Omitir
`codex-review` es correcto (no está entre los comandos del CLI: `new | import |
board | plan | approve | start | review | finish` + los cinco wrappers), pero
**`git pull` se cae sin querer**: el recién llegado se ramifica desde un
`develop` viejo en su primera tarea. Si se mantiene la lista —es útil como
recorrido guiado—, conviene reponer el `git pull` y cambiar "tal cual" por
"resumido; la versión canónica está en la §13".

**M3 — Una misma ruta, dos formas, una de ellas no resoluble.**
En el paso 2 (línea 43) `skills/task-workflow/SKILL.md` aparece como texto en
crudo y esa ruta no resuelve desde ningún directorio del repo (el fichero vive
en `taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/`). En el
paso 3 (línea 52) el mismo fichero sí está enlazado correctamente con la ruta
relativa completa (verificado). Como el paso 2 es donde el lector va a ir
cuando algo le falle, es justo el sitio donde conviene el enlace real.

### Comprobaciones que pasaron limpias

Las dejo escritas para que no haya que repetirlas: los 27 enlaces relativos de
los tres ficheros resuelven; el Markdown de `INCORPORACION.md` es válido
(vallas balanceadas, lista 1-8 correlativa, sin CRLF ni espacios finales); las
filas nuevas de las dos tablas de índice tienen el número de columnas de su
cabecera y están colocadas coherentemente (en `docs/contexto/README.md` con el
marcador `—`, junto a `PROMPT_INICIAL.md`, porque no forma parte del orden de
lectura numerado); `PROPUESTA_METODOLOGIA.md` no se tocó; la casilla de E1 no
se marcó, que es lo correcto hasta `taskctl finish`; y el cabecero de la Fase E
pasa de `(2/6)` a `(4/6)`, corrigiendo de paso un desfase que venía de
`develop`. El AC2 ("sin colaboradores que invitar por ahora") sí está cumplido
sin reservas: consta en el bloque de cita de cabecera con fecha y autor de la
decisión, y no se ejecutó ninguna invitación real.

Sobre los tres criterios marcados `[x]` en `tarea.md`: el AC2 se sostiene; el
AC1 se sostiene a medias (I1 y I3); el AC3 se sostiene solo por la propia guía,
con la referencia rota de I2.

## Veredicto
- Veredicto: cambios-solicitados
