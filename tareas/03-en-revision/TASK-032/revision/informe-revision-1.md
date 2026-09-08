# Informe de revision — TASK-032 (ronda 1)

- Commit revisado: 4e0a31121bd02774577536ccf7d7e260ae63b1ea
- Revisor: tres agentes independientes en paralelo, uno por frente (heuristica, roles de brainstorm, skills revisoras)
- Veredicto: cambios-solicitados

Los tres frentes se revisaron por separado, cada uno en un clon temporal
propio, con la suite ejecutada de cero (`npm install && npm run build`) y
mutaciones del codigo fuente para comprobar que los tests discriminan. Los
tres coinciden en el veredicto. **Cero criticos, 7 importantes, 12 menores.**

Que se ejecuto, en total: la suite completa tres veces (612 tests, 609
verdes, los 3 rojos conocidos de Windows verificados uno a uno, sin cuarto
rojo), 44 mutaciones de los artefactos, 4 sondas de vacuidad, las 33 lineas
de veredicto de las cuatro skills pasadas por `veredictoAprobado` real, los
cuatro bloques de patrones pasados por el parser real, el enrutado por glob
contra 11 ficheros de dominios ajenos, y la puntuacion heuristica de las 32
tareas reales del repo.

## Hallazgos

### D7 — heuristica de complejidad

**[IMPORTANTE] 1. El fichero usa un nivel de complejidad que el plugin no reconoce (`compleja`) y no tiene entrada para el que si (`alta`)**
- Donde: `scripts/heuristica-complejidad.yml:64` y `:103`.
- Que pasa: el enum canonico del plugin es `trivial | simple | media | alta |
  critica` (`src/core/task.ts:8`, validado por `requireEnum`). El YML declara
  `nivel_compleja_hasta` y `agentes_brainstorm_compleja`, y no existe
  `agentes_brainstorm_alta`. El fichero es fiel a la §16.1 y a la decision
  #2 —que dicen `compleja`—, pero esos documentos divergen del codigo
  implementado, y esa divergencia no estaba registrada en ningun sitio. D7
  es el primer artefacto que la convierte en una tabla de lookup ejecutable.
- Reproduccion: `validateTask` con `complejidad: compleja` -> RECHAZADA
  ("debe ser uno de: trivial, simple, media, alta, critica");
  con `alta` -> ACEPTADA. Conteo sobre las tareas del repo: 3 `alta`,
  13 `media`, 15 `simple`, 1 `trivial`.
- Impacto: las 3 tareas `alta` (TASK-016, 017 y 018, justo las que mas
  agentes pedirian) no casan con ningun nivel del YML, y el lookup que el
  fichero promete no tiene respuesta para ellas. Quien implemente D1/D2
  fiandose del fichero escribe codigo que rompe o adivina en ~9% del
  historial real.
- Sugerencia: renombrar a `nivel_alta_hasta` / `agentes_brainstorm_alta`,
  documentar la divergencia con §16.1, y en el test importar
  `TASK_COMPLEXITIES` de `src/core/task.js` para aseverar que todo sufijo
  esta en el enum.

**[IMPORTANTE] 2. No esta definido si una palabra de riesgo se cobra por entrada o por ocurrencia**
- Donde: `scripts/heuristica-complejidad.yml:31-35` y `:80-84`.
- Que pasa: dice "cada palabra de alto riesgo encontrada" y "la comparacion
  es por subcadena", pero no si una palabra repetida tres veces suma +2 o
  +6, ni si aparecer en objetivo y en criterios cuenta una o dos veces.
- Reproduccion: tarea con 2 etiquetas, 3 criterios, `tipo: feature` y
  `rendimiento` tres veces: por entrada -> 3 puntos -> `simple` -> 1 agente;
  por ocurrencia -> 7 puntos -> `compleja` -> 3 agentes.
- Impacto: la misma tarea sale `simple` o `alta` segun quien implemente D1,
  con 1 o 3 agentes de brainstorm y un escalon de modelo de diferencia. Es
  la senal que mas pesa y la unica sin regla de conteo, y ademas la unica
  que puede crecer sin tope.
- Sugerencia: cerrar la regla en el comentario (una vez por entrada de la
  lista) y aseverarla en el test.

**[IMPORTANTE] 3. La tabla de agentes no recoge la excepcion de `hotfix`, y se declara lookup completo**
- Donde: `scripts/heuristica-complejidad.yml:86-104`.
- Que pasa: la seccion dice "es un lookup, no un juicio: nadie tiene que
  decidirlo en caliente", pero la §7.5 manda que un `hotfix` se planifique
  con un solo agente, sin brainstorm multi-agente. El YML conoce el tipo
  `hotfix` —le dedica un peso— y aun asi su tabla no lo menciona.
- Reproduccion: aplicar la tabla a un hotfix que puntue 8 da 4 agentes;
  la §7.5 dice 1.
- Impacto: quien implemente TASK-016 con este fichero lanza 3-4 agentes en
  paralelo sobre un hotfix, que es justo donde la metodologia dice que no se
  espera una ronda de consenso.
- Sugerencia: `agentes_brainstorm_hotfix: 1`, que el consumidor aplique
  antes que la tabla por nivel.

**[MENOR] 4. `direccion_de_riesgo` es una clave sin efecto operativo, del tipo que la decision #9 rechaza**
- Donde: `scripts/heuristica-complejidad.yml:126`. La asimetria ya la
  describe entera `tolerancia_extra_si_heuristica_menor`, cuyo nombre fija
  la direccion; `direccion_de_riesgo` no tiene semantica declarada y el test
  la fija a un unico valor posible.

**[MENOR] 5. `"esquema de base de datos"` es letra muerta bajo comparacion por subcadena**
- Donde: `scripts/heuristica-complejidad.yml:84`. La redaccion natural
  ("esquema de **la** base de datos") no casa. En las 32 tareas del repo esa
  entrada dispara 0 veces — como las otras 13.

**[MENOR] 6. El fichero afirma en presente un mecanismo de configuracion por repo que la decision #9 descarto**
- Donde: `scripts/heuristica-complejidad.yml:73-74`. Un agente buscara ese
  punto de extension y no lo encontrara.

### D7 — roles de brainstorm

**[IMPORTANTE] 7. Dos roles declaran como contexto obligatorio un artefacto que en el lanzamiento paralelo todavia no existe**
- Donde: `agents/brainstorm-riesgos.md:62` y `agents/brainstorm-testing.md:61`
  (y su consecuencia en `:82`).
- Que pasa: ambos listan en "Necesitas" el enfoque que se esta evaluando,
  como entrada distinta de los criterios. Pero el enfoque lo produce
  `brainstorm-arquitectura` (su seccion de salida se llama `## Enfoque`) y
  los cuatro se lanzan en paralelo — lo dicen los propios ficheros. En la
  primera pasada, que es el caso normal, no hay enfoque previo.
- Impacto: quien implemente TASK-016 tiene tres salidas y ninguna esta
  escrita: serializar arquitectura (rompiendo el paralelismo de §6), pasar
  el item vacio (dejando sin sujeto la pregunta central de riesgos y la
  primera seccion obligatoria de testing), o dejar que cada rol se lo
  invente, que es el modo de fallo que el resto del fichero evita.
- Sugerencia: decir de donde sale, o marcarlo opcional y admitir "no hay
  enfoque previo que evaluar".

**[IMPORTANTE] 8. La nota del rol de testing usa niveles que no existen y en `compleja` dice lo contrario que su fuente**
- Donde: `agents/brainstorm-testing.md:116-117`.
- Que pasa: habla de complejidad "baja o media" y de "las altas"; "baja" no
  es un nivel de la escalera. Y la §16.4 punto 2 designa expresamente
  `media/compleja` como el tramo donde el rol se degrada a checklist,
  mientras que la nota mete `compleja` en el lado de conservarlo.
- Reproduccion: tarea en `compleja`: presupuesto de 3 agentes; la fuente
  dice quitar testing; la nota dice conservarlo, luego habria que quitar
  riesgos o dominio, cosa que ningun documento respalda.
- Sugerencia: usar los nombres reales de la escalera y alinear con §16.4.2.

**[MENOR] 9. Nada asevera el contenido de `tools`**
- Donde: `test/agents/brainstorm-roles.test.ts`. Los cuatro roles prometen
  por escrito no modificar ficheros, y lo que de verdad lo impide es
  `tools: Read, Grep, Glob`, que no lo mira nadie. Sonda de vacuidad:
  anadir `Write, Edit, Bash` deja la suite en verde.

**[MENOR] 10. El test 9 se conforma con que existan las cabeceras de contexto, no con que listen algo**
- Vaciar las dos listas conservando las cabeceras deja la suite en verde.

**[MENOR] 11. El test 10 valida el tope contra un rango arbitrario (1..100), no contra la plantilla del propio rol**
- Un tope declarado de 5 lineas con una plantilla que necesita 36 pasa
  desapercibido, que es justo lo que el tope pretende evitar. Hoy los cuatro
  topes reales son coherentes (35/60, 30/55, 38/50, 36/50).

**[MENOR] 12. El test 13 solo detecta copia literal de `## Que miras`**
- Dos roles con secciones semanticamente identicas pasan si difieren en un
  caracter. El nombre del test promete mas de lo que mide.

**[MENOR] 13. Rendimiento y escalabilidad se quedan sin dueno entre los cuatro roles**
- `dominio` lo excluye expresamente y ningun `## Que miras` lo reclama. Con
  el techo de cuatro roles de la decision #2 no hay sitio para un quinto.

**[MENOR] 14. Solape sin arbitrar entre riesgos y dominio sobre los datos ya existentes**
- Ambos tienen hueco reservado para lo preexistente; la linea que los separa
  es deducible pero no esta escrita en ningun `## Que NO miras`.

### D6 — las cuatro skills revisoras

**[IMPORTANTE] 15. Los patrones de `angular-vue-reviewer` capturan backend y React, y la skill afirma lo contrario**
- Donde: `skills/angular-vue-reviewer/SKILL.md:36` (la lista) y `:39` (la
  afirmacion que se contradice).
- Que pasa: `**/*.module.ts`, `**/*.guard.ts`, `**/*.pipe.ts` y
  `**/*.spec.ts` son exactamente las convenciones de NestJS, y
  `**/src/app/**` es el App Router de Next.js. La linea 39 dice que un
  componente de React "no lo captura ninguno de esos patrones, a proposito":
  es falso para cualquier proyecto Next.js con `src/app/`.
- Reproduccion (con `path.matchesGlob`): `src/users/users.module.ts`,
  `src/auth/jwt-auth.guard.ts`, `src/common/validation.pipe.ts`,
  `src/users/users.service.spec.ts`, `src/app/page.tsx`,
  `src/app/dashboard/layout.tsx`, `internal/stores/pg.go` -> todos al
  revisor de Angular/Vue.
- Impacto: como SI casa un patron de dominio, el generico —cuyo disparador
  es "ningun otro patron casa"— no entra. Un diff de backend NestJS acaba
  revisado unicamente por la skill de frontend, que ademas se declara
  incompetente para ello. Revision mala con autoridad, que es el riesgo que
  este item tenia que evitar. El test 6 no puede detectarlo: compara
  patrones identicos entre revisores, no solapes con dominios sin revisor.
- Sugerencia: acotar los patrones ambiguos por ruta o retirarlos y dejar que
  caigan al generico; y corregir la afirmacion de la linea 39.

**[IMPORTANTE] 16. Dos formatos de informe incompatibles entre las cuatro; el de `java-spring` y `angular-vue` no es el que genera `taskctl review`**
- Donde: `skills/java-spring-reviewer/SKILL.md:184-188` y
  `skills/angular-vue-reviewer/SKILL.md:193-198` frente a
  `informeTemplate()` (`src/commands/review.ts:136-146`).
- Que pasa: el CLI genera el titulo `# Informe de revision — <ID> (ronda
  <N>)` con `- Commit revisado:`, `- Revisor:` y `- Veredicto:` en cabecera.
  `csharp` y `code-quality` prescriben ese esqueleto tal cual; las otras dos
  prescriben otro titulo, **sin `- Commit revisado:`**, y con el veredicto
  reubicado a una seccion al final. Ambas dicen ademas que "`taskctl review`
  deja el esqueleto... se rellena con esta estructura", y la estructura que
  dan no es el esqueleto.
- Reproduccion: aplicar cada estructura al esqueleto real —
  sustituir la linea de cabecera (csharp/code-quality) -> aprueba `true`;
  anadir `## Veredicto` al final sin tocar la cabecera (java/angular) ->
  aprueba `false`, con dos lineas de veredicto en el fichero.
- Impacto: dos formatos distintos en el mismo repo, y uno empuja a mover la
  linea de veredicto fuera de donde el CLI la dejo; si no se borra la
  original, `finish` exige que todas aprueben y la tarea no se cierra. No es
  CRITICO porque ambas skills avisan de que la linea se sustituye, no se
  anade — el escenario malo exige desoir un aviso presente en el documento.
  La perdida de `- Commit revisado:` si es una regresion de trazabilidad.
- Sugerencia: alinear las cuatro con `informeTemplate()` y dejar las
  secciones extra de java/angular como adicionales bajo `## Hallazgos`.

**[MENOR] 17. El test de severidades no discrimina: se puede borrar MENOR entera de una skill y la suite sigue verde**
- La asercion es `includes('MENOR')` en mayusculas, y la prosa "aprobada con
  correcciones menores" de la tabla de veredictos la satisface sola.
  Reproducido: `grep -c MENOR` = 0 en una skill y `# fail 0`.

**[MENOR] 18. La lista de marcas del repo del test deja pasar `PLAN_SPRINTS` y los nombres de simbolos del codigo**
- Colar "Ver docs/PLAN_SPRINTS.md" o "usa veredictoAprobado() de
  src/commands/finish.ts" deja la suite en verde. Es sensibilidad del test,
  no fuga en curso: hoy las cuatro skills estan limpias.

**[MENOR] 19. `**/*.cs` enruta cualquier C# al revisor de AutoCAD/IFC**
- Un diff de ASP.NET Core o de Unity casa el patron y el generico no entra.
  Mitigado en parte porque la seccion de trampas de C# aplica a cualquier
  C#, pero la clausula de escape cubre el caso ".csproj solo", no este.

**[MENOR] 20. La rama de `umbral_dominios: 3` es inalcanzable con lo que el plugin empaqueta**
- El fallback por exceso salta con mas de tres dominios y el plugin trae
  exactamente tres revisores de dominio. No es un error —la §16.5 anticipa
  el escenario y la decision #16 fija el 3 a proposito—, pero conste que ese
  camino no esta demostrado.

## Revisado sin hallazgos

Areas miradas a fondo que salieron limpias, para que conste que se miraron:

- **La linea de veredicto de las cuatro skills**: las 33 lineas prescritas o
  tabuladas coinciden al 100% con lo que hace `veredictoAprobado`, incluidos
  los casos finos (`aprobada con ...` aprueba por la frontera de palabra;
  `**APROBADA**`, `aprobado`, `no aprobada`, `PENDIENTE` y la variante sin
  guion, no). Ninguna skill deja la tarea imposible de cerrar por esta via.
- **Fidelidad de los pesos de la heuristica**: las seis senales de §16.1 con
  sus pesos exactos, el mapeo de niveles tal cual, y los dos niveles
  intermedios de la tabla de agentes declarados explicitamente como decision
  del propio fichero. Las 8 palabras anadidas sobre las 6 de la metodologia
  son genericas y defendibles.
- **Los cuatro bloques `patrones_archivo`** parsean con el parser real sin
  excepcion: el formato que se unifico en la integracion aguanta.
- **El reparto entre los cuatro roles de brainstorm**: los cuatro
  `## Que miras` son claramente distintos y cada `## Que NO miras` remite
  por nombre a los otros tres. Las declaraciones de contexto de §16.2 son
  defendibles, no decorativas, y los cuatro topes de longitud son coherentes
  con sus plantillas, con holgura de 12 a 25 lineas.
- **Contradicciones con la metodologia en las skills: ninguna.** Las cuatro
  reciben el diff y no el repo, situan la puerta determinista antes de la
  revision y niegan expresamente la revision ligera por urgencia.
- **Calidad de dominio, no relleno**: las tecnicas de reproduccion son
  ejecutables y especificas (contar sentencias SQL con 2 y con 20 filas para
  medir el N+1; forzar la excepcion y mirar la tabla, no la anotacion;
  montar/desmontar 20 veces contando lo que queda vivo; round-trip IFC con
  una libreria distinta de la que escribio; cambiar la cultura del proceso).
- **Portabilidad de los nueve artefactos**: cero marcas de este repo, ni con
  la lista del test ni con listas mas amplias que usaron los revisores por
  su cuenta.
- **El validador oficial, medido**: `plugin validate` recorre `agents/` y
  `skills/` por autodescubrimiento, sin que `plugin.json` las declare — pero
  un frontmatter ausente da warning con **exit 0**, y la falta de `name` no
  produce ni un aviso. El bloque estructural de los tests es lo unico que
  protege eso.
