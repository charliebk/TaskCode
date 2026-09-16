# Informe de revisión — TASK-022 (ronda 3)

- Agente revisor: code-quality-reviewer
- Commit revisado: 78513c8 (HEAD; el diff de las correcciones es `7767716`,
  `78513c8` solo añade `peticion-revision-3.md`)
- Fecha: 2026-09-16

## Metodología

Revisor independiente: no he participado en las rondas 1 ni 2. Tarea
documental, así que "reproducir" significa resolver cada ruta a mano,
contrastar cada afirmación contra el fichero fuente que cita —leído íntegro,
no el fragmento citado— y leer el diff real.

Comandos ejecutados desde la raíz del repo:

1. `git diff a9f1224..HEAD` → superficie real de esta ronda: **3 ficheros**.
   `README.md` (+1/-1), `docs/contexto/INCORPORACION.md` (+14/-9) en
   `7767716`, y `peticion-revision-3.md` (alta) en `78513c8`. Coincide con lo
   declarado en la petición: no hay cambios colaterales.
2. `git diff --name-only develop..HEAD` → 14 ficheros, todos dentro del
   alcance de la tarea (`README.md`, `docs/contexto/{INCORPORACION,
   CHECKLIST_TERMINACION,README}.md` y la carpeta de TASK-022). Ningún
   fichero de código ni de plugin tocado.
3. `git diff develop..HEAD -- docs/PROPUESTA_METODOLOGIA.md` → **salida
   vacía**; el fichero tampoco aparece en `git diff --name-only
   develop..HEAD`. Documento congelado **intacto**, verificado por las dos
   vías.
4. **Enlaces relativos**: extraídos los 7 con regex sobre el fichero y
   resueltos uno a uno con `realpath -m` desde `docs/contexto/` + `test -e`.
   Resultado: **7 enlaces, 7 OK, 0 rotos** (líneas 8, 33, 59, 64, 66, 68,
   89), incluidos los dos que apuntan a
   `../../taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/SKILL.md`.
   La línea del enlace a `SKILL.md` se movió de la 54 a la 59 en esta ronda y
   sigue resolviendo.
5. **Fuentes del párrafo nuevo**, leídas íntegras: item E3
   (`CHECKLIST_TERMINACION.md:480-487`), item E6 con su AC7 (`524-560`), la
   sección "La instalación real del plugin: lo que quedó confirmado y lo que
   no" y la tabla de Windows de `HALLAZGOS.md` (`249-282`), el prerrequisito 1
   de `skills/task-workflow/SKILL.md` (`21-45`) y el job `test-windows` de
   `.github/workflows/ci.yml`, step **Q2** incluido, leído literal.
6. `grep -ic "plugin install\|marketplace add" .github/workflows/ci.yml` →
   **0**. Confirma por mi cuenta que el CI no instala ningún plugin, que era
   el fondo de N1.
7. `grep -rn "terminal normal\|PATH del sistema\|tres pasos\|tal cual"
   docs/contexto/INCORPORACION.md` → **0 coincidencias**.
8. **Formato**: 89 líneas, UTF-8 sin CRLF, sin espacios al final, 5 cabeceras
   (`#` + `## 1.`…`## 4.`), lista de la sección 4 numerada 1-9 correlativa.
9. **Contadores del checklist**: `## Fase E — Cierre (4/6)` + tabla
   `| E — Cierre | 6 | **4** |` + 4 casillas `[x]` en la fase. Coherentes; E1
   sigue sin marcar, correcto hasta `finish` según la convención declarada en
   la cabecera del propio checklist ("Se marca cada casilla al cerrar el
   trabajo real, mergeado a `develop`"). Comprobado además con `git show
   develop:...` que la cabecera `(2/6)` estaba **desalineada con su propia
   tabla en `develop`** y que esta rama la corrige: es una mejora, no una
   regresión.
10. **§13 de `PROPUESTA_METODOLOGIA.md`** (línea 374), contada paso a paso:
    **10 ítems**, como afirma la guía. Las dos omisiones de la guía siguen
    siendo defendibles: "instala el plugin" es su propia sección 2, y
    `codex-review` no existe en el CLI (`CLAUDE.md` lista los 8 comandos + 5
    wrappers, sin él).

No modifiqué ningún fichero del repo salvo este informe. No borré nada de
`revision/`.

## Verificación de las correcciones de la ronda 2

**N1 (importante) — "Probado" atribuía al CI lo que E6/AC7 declara no visto →
CORREGIDO.**

Verificado contra las fuentes, no contra el resumen. El texto nuevo
(`INCORPORACION.md:46-59`) resiste frase a frase:

- *"en Windows nativo, con el directorio `bin/` del CLI en el PATH, `taskctl`
  resuelve como comando suelto — job `windows-latest` del CI, step que hace
  `export PATH="$(pwd)/bin:$PATH"` sobre el checkout"*. El step Q2 de
  `ci.yml` es **literalmente** eso:

  ```
  - name: "Q2 (TASK-006): taskctl resuelve como comando suelto via PATH"
    shell: bash
    continue-on-error: true
    run: |
      export PATH="$(pwd)/bin:$PATH"
      taskctl --version
  ```

  La afirmación ya no tiene sujeto "plugin instalado" ni predicado "terminal
  normal": describe exactamente el antecedente que el CI sí prueba. Cotejado
  con E3, que registra ese step como uno de los cinco en verde.
- *"**Pendiente de confirmar**: que instalar el plugin deje ese `bin/` en el
  PATH de forma utilizable"*. Es justo el antecedente que Q2 **no** prueba, y
  la nueva redacción lo coloca del lado pendiente. Correcto.
- *"Lo único confirmado es que el mecanismo existe (aparecen los `bin/` de
  otros plugins cacheados en el PATH de una sesión)"*. Calco fiel de
  `HALLAZGOS.md`: *"el mecanismo de `bin/` en PATH existe de verdad: en el
  PATH de una sesión aparecen los `bin/` de otros plugins cacheados"*.
- *"`taskctl` como comando suelto todavía no se ha visto funcionar (item
  E6/AC7…)"*. Calco fiel de E6/AC7: *"Pero `taskctl` como comando suelto **no
  se ha visto funcionar**"*. Y `HALLAZGOS.md` lo respalda por su lado ("Sin
  confirmar: … seguía dando `command not found`").
- *"Ese PATH lo compone Claude Code para su Bash tool (`SKILL.md`)"*.
  Sostenido por el prerrequisito 1: *"Su ejecutable vive en `bin/`, que Claude
  Code anade al PATH **del Bash tool** mientras el plugin este habilitado"*.
- *"reinicia la sesión y, si persiste, sigue el resto del orden de diagnóstico
  de `SKILL.md`"*. Coincide con el orden real del prerrequisito 1 (1.
  reiniciar → 2. `$CLAUDE_PLUGIN_ROOT` → 3. conclusión), y hace bien en no
  duplicarlo: la guía remite en vez de copiar, que es la política del repo.

Ninguna afirmación del párrafo se queda sin fuente, y ninguna fuente dice más
de lo que el párrafo afirma. La inversión que arrastraban las dos rondas
anteriores está deshecha en los dos sentidos.

**N2 (menor) — "de inmediato / justo después de instalar" → CORREGIDO.**
El texto dice ahora *"si en la **sesión siguiente** a la instalación
`--version` da `command not found`"*. Es el escenario que las fuentes dejan
abierto (`HALLAZGOS.md`: *"cuesta un comando en la siguiente: `taskctl
--version`"*; igual en AC7), y ya no el de la misma sesión, que es negativo
**conocido**, no pendiente. La corrección va incluso más lejos que la
sugerencia de la ronda 2, y en la dirección correcta. Ver, eso sí, el hallazgo
menor M2 de abajo sobre el efecto colateral de ese "sesión siguiente".

**N3 (menor) — ficha del `README.md` raíz con la enumeración vieja →
CORREGIDO.**
`README.md:69` dice ahora *"acceso, clon e instalación, ciclo de vida, primera
tarea"*. Contrastado contra las cabeceras reales del documento (`1. Acceso al
repo`, `2. Clonar el repo e instalar el plugin`, `3. Entender el ciclo de
vida`, `4. Hacer tu primera tarea`): los cuatro pasos, en orden y con las
mismas palabras que la intro de la propia guía (línea 11). Ninguna otra fila
de la tabla quedó desfasada, y `docs/contexto/README.md:13` sigue siendo
genérica y correcta.

**N4 (menor, proceso) — informe y fix en el mismo commit → CORREGIDO en esta
ronda.**
No era algo que rehacer, pero se adoptó: `a9f1224` (informe ronda 2) va en su
propio commit, anterior a `7767716` (fix). El historial ya tiene el estado
"hallazgos sin corregir" que pedía la auditoría.

## Hallazgos nuevos

### CRÍTICO

Sin hallazgos. Cambio puramente documental; el documento congelado está
verificadamente intacto, no hay pérdida de contenido en el diff (los -9 son
las líneas reescritas), y ningún comando que la guía propone hace algo
distinto de lo que anuncia.

### IMPORTANTE

Sin hallazgos. El párrafo que motivó las tres rondas queda, a mi juicio y tras
cotejarlo con las cuatro fuentes, **más preciso que las propias fuentes por
separado**: separa el antecedente del consecuente, nombra qué está probado y
por qué medio, y no promete nada que E6/AC7 no permita prometer.

### MENOR

**M1 — El "Probado" no dice que el step del CI corre bajo Git Bash, y con
`taskctl` eso no es un detalle neutro.**
`INCORPORACION.md:46-48` afirma *"en Windows nativo, con el directorio `bin/`
del CLI en el PATH, `taskctl` resuelve como comando suelto"*. Cierto, pero el
step Q2 lleva `shell: bash`, y `bin/taskctl` es un script `#!/usr/bin/env
node` sin extensión y sin `.cmd` acompañante (comprobado: el directorio `bin/`
del plugin contiene un único fichero). En `cmd.exe` o PowerShell, con ese
mismo PATH, el comando suelto **no** resolvería — y de hecho el CI formula esa
pregunta aparte, como Q4, y la formula como `node bin/taskctl`, no como
`taskctl`. El `export PATH=…` que la propia frase cita ya delata el shell a
quien sepa leerlo, y dos líneas más abajo el texto avisa de no contar con
`taskctl` en una consola del sistema, así que el riesgo práctico es bajo: por
eso es menor y no bloqueante. Bastaría un inciso: *"…con el directorio `bin/`
del CLI en el PATH, `taskctl` resuelve como comando suelto **bajo Git Bash**"*.

**M2 — El bloque "Verifica que `taskctl` responde" pide ejecutar en la sesión
de la instalación algo que el párrafo siguiente da por fallido en esa sesión.**
Las líneas 40-44 instruyen *"Verifica que `taskctl` responde: `taskctl
--version`"* justo después de los dos comandos `/plugin …`, es decir, en la
misma sesión. El párrafo nuevo, al desplazar el escenario a *"la **sesión
siguiente** a la instalación"* (corrección de N2, acertada en sí misma), deja
sin cubrir explícitamente lo que el recién llegado va a ver primero: un
`command not found` en la sesión donde acaba de instalar, que `HALLAZGOS.md`
registra como **comprobado que ocurre**. Y la intro de la guía (líneas 11-13)
le ha dicho *"si algo falla, no sigas al paso siguiente"*. El lector atento
deduce del propio párrafo que debe reiniciar, y el remedio está ahí mismo, por
eso es menor; pero media frase lo cerraría del todo, por ejemplo: *"en la
sesión donde acabas de instalar es normal que aún no responda —el PATH se
compone al arrancar—; reinicia y vuelve a probar. Si en la **sesión
siguiente**…"*. Lo señalo porque es lo único que la reescritura de esta ronda
ha podido introducir de nuevo, y afecta al único punto de verificación que la
guía le da al colaborador.

**M3 — `HALLAZGOS.md` y la primera mención a `SKILL.md` van sin enlazar,
contra el criterio del resto del fichero.**
En las líneas 53-55, `HALLAZGOS.md` (hermano en `docs/contexto/`, enlazable
como `HALLAZGOS.md`) y `SKILL.md` aparecen entre backticks y sin enlace,
mientras que **todos** los demás documentos citados en la guía sí lo llevan
(`CHECKLIST_TERMINACION.md`, `README.md` ×2, `PROPUESTA_METODOLOGIA.md`,
`CONVENCIONES.md`, `SKILL.md` ×2). La mención suelta a `SKILL.md` en la línea
55 precede además en cuatro líneas a su enlace completo de la 59, así que el
lector se topa antes con el nombre pelado que con la ruta. Cosmético; la de
`HALLAZGOS.md` viene de rondas anteriores, la de `SKILL.md` es nueva.

## Criterios de aceptación

- **AC1** (guía seguible sin ayuda: instalar el plugin, entender el ciclo de
  vida y hacer su primera tarea): **sostenido**. Los cuatro pasos existen, van
  en orden, cada uno declara su dependencia del anterior, el acceso y el clon
  —los huecos estructurales de la ronda 1— están cubiertos, y el único punto
  de verificación de la guía ya no lleva una etiqueta "Probado" que induzca a
  un diagnóstico erróneo, que era la reserva de la ronda 2: eso **está
  corregido y verificado contra las fuentes**. La única arista que queda es
  M2, media frase de ergonomía sobre un fallo cuyo remedio ya está escrito en
  el mismo párrafo; no impide seguir la guía sin ayuda, así que no la
  considero reserva bloqueante.
- **AC2** (sin invitaciones reales; guía lista para cuando haga falta):
  **sostenido sin reservas**. El bloque de cita de cabecera (líneas 3-9) lo
  declara con autor y fecha (Carlos, 2026-09-13), remite al item E1, y no hay
  en todo el diff contra `develop` rastro de ninguna invitación ejecutada ni
  de cambios fuera de documentación.
- **AC3** (punto 8 de la §14 resuelto en lo que respecta a a quién se invita):
  **sostenido sin reservas**. Verificado sobre el fichero: la nota de E1 en
  `CHECKLIST_TERMINACION.md` enuncia la decisión *in situ* ("a día de hoy, a
  nadie", con autor y fecha) citando el punto y la sección, sin circularidad
  —menciona `INCORPORACION.md` solo como sede de la guía—, y el enunciado
  original de `PROPUESTA_METODOLOGIA.md:§14.8` sigue intacto, como toca en un
  documento congelado.

## Nota fuera de alcance (no es hallazgo de esta tarea)

La cabecera de `CHECKLIST_TERMINACION.md` dice "**41 / 42** items terminados
(98%)" mientras la suma de su propia tabla da **40** (12+3+7+8+6+4) y la fila
"Total pendiente" dice **2**. Verificado con `git show develop:…` que esa
línea es **idéntica en `develop`**: es preexistente, no lo introduce esta
tarea, y esta rama de hecho corrige la otra desalineación que sí había
(cabecera de Fase E `(2/6)` → `(4/6)`). Lo dejo anotado para quien marque la
casilla E1 al hacer `finish`, que es cuando tocará recalcular.

## Veredicto
- Veredicto: aprobada
