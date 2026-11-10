Leidos: `guardia-merge.ts`, `finish-verificacion.ts`, `finish-cobertura.ts`, la cabecera de `freno-stop.ts`,
`skills/task-workflow/verificacion-selectiva.md` y los tests de `test/` que leen `skills/` y `agents/`.
Lo marcado (supuesto) no esta comprobado.

## Modos de fallo, de mas a menos grave

- **CRITICO — un `.md` que se ejecuta clasificado como documentacion.** Si un proyecto declara `**/*.md`,
  un cambio en `skills/**/SKILL.md`, `agents/*.md`, `CLAUDE.md` o `.claude/commands/*.md` se salta los
  tests e integra contenido roto que Claude carga en todos los proyectos. En TaskCode hay unos 20 tests
  que leen esos `.md` (`test/skills/*.test.ts`, `test/agents/brainstorm-roles.test.ts`,
  `test/empaquetado/distribucion.test.ts`...), entre ellos el que impide nombrar el producto en lo que se
  instala. Mitigacion: nunca por extension, solo rutas declaradas, y documentacion con ejemplos.
- **CRITICO — la propia rama amplia las rutas de documentacion.** La tarea anade `src/**` como
  documentacion en su `.taskcode/config.yml` y se salta la suite en el mismo diff. Precedente:
  `finish-cobertura.ts:60` lee el umbral de la config de `ramaBase`. Mitigacion: leer las rutas de
  documentacion de la base y tratar como codigo cualquier cambio en `.taskcode/config.yml`.
- **CRITICO — los renombres esconden el origen.** `git diff --name-only` detecta renombres por defecto
  (supuesto) y solo da el destino: mover `src/x.ts` a `docs/x.md` sale como `docs/x.md`, documentacion, y
  el codigo desaparece sin tests. Mitigacion: `--no-renames` o `--name-status` con las dos rutas.
- **CRITICO — diff vacio por verdad vacua.** `every()` sobre lista vacia es `true`: reintento de `finish`
  tras un merge a medias, o rama cuyos commits ya estan en la base, sale vacio y se trataria como solo
  documentacion. Mitigacion: diff vacio → verificacion de siempre.
- **IMPORTANTE — Stop no ve el arbol sucio.** Con `base...HEAD` a secas, un `.ts` sin commitear o sin
  seguimiento no aparece y el turno sale como solo documentacion. `verificacion-selectiva.md:42-45` ya
  pide sumar `git diff HEAD` y `ls-files --others`. Mitigacion: Stop y `review` clasifican tambien el arbol.
- **IMPORTANTE — un memo verde falso abre el guardian.** Si al saltarse la suite se guarda un memo verde
  con la huella de la completa, el guardian lo acepta (`guardia-merge.ts:153-158`); la huella no incluye
  las rutas de documentacion. Mitigacion: nunca escribir memo de la completa sin correrla; el guardian
  recalcula la decision.
- **IMPORTANTE — rojo falso o informe viejo en la puerta de cobertura.** `puertaCobertura` solo distingue
  `omitida` y `sin-comando`; un resultado nuevo de solo documentacion caeria en el camino verde y leeria
  `o.verificacion.inicioMs` (`finish-cobertura.ts:75-101`): o aborta por «informe ausente» o la
  comparacion con `undefined` no lo cuenta como viejo. Mitigacion: tratarlo como `omitida`; igual en
  `puertaHeldout` (supuesto: no leida).

## Estados intermedios y fallos parciales

- `finish` verifica antes del script de merge; si el merge muere, el agente puede lanzar el script a mano
  y el guardian decide sin memo: el guardian debe llegar a la misma clasificacion con el par
  fuente→destino, sin depender de la tarea.
- **IMPORTANTE — un fallo al leer la config ya hoy deja pasar el merge** (`guardia-merge.ts:88-92`, el
  `catch` hace `continue`). Si un valor invalido de la clave nueva hace lanzar la config, el guardian
  queda desactivado para todo el proyecto. Mitigacion: un valor invalido de la clave nueva no puede
  convertir «hay comando» en «no hay config».
- No poder calcular el diff (clon superficial, base inexistente en local, git que falla, timeout de 30 s
  del hook) → completa en `finish`, Stop y `review`; bloqueo en el guardian (paso 5 o posterior, con el
  destino ya protegido; no meter el calculo antes de esa linea).
- Base equivocada: una base atrasada mete codigo ajeno (falso «codigo», lado seguro). Peligroso es
  comparar contra algo que ya contiene el codigo de la rama (la ronda anterior de `review` en rondas
  incrementales, una `origin/<rama>` ya empujada). `finish` y el guardian: `merge-base(destino, fuente)`,
  nunca la ultima ronda.
- Merge de develop en la rama: con tres puntos los conflictos resueltos en codigo si aparecen (supuesto
  razonable); con dos puntos el codigo posterior de develop sale como cambio (mas suite, seguro).
- Rutas con tildes: `core.quotePath` las devuelve entrecomilladas con escapes octales; no casan y van a
  codigo (seguro, pero sin beneficio para proyectos en espanol). Mitigacion: `-z`.
- Mayusculas: casar distinguiendo mayusculas en todas las plataformas (en Windows `Docs/` frente a
  `docs/` podria colar codigo).
- Borrados: con `--name-only` el borrado de `src/x.ts` sale con su ruta → codigo, salvo con renombres.

## Compatibilidad hacia atras

- Sin la clave nueva no se calcula ni el diff (ni latencia ni fallo nuevo en Stop o el guardian): salir antes.
- Proyecto con la clave y la 0.14.0: la clave desconocida avisa y se ignora → completa (seguro; el aviso
  en cada turno de Stop puede molestar).
- Los memos ya guardados con la huella de la completa siguen valiendo; no cambiar su formato.
- Convivencia con `comando_verificacion_selectiva` (TASK-091): «solo documentacion» se decide antes que
  la selectiva y de forma identica en Stop y `review`.

## Vuelta atras

- Lo integrado sin suite no se «desverifica»: la vuelta atras es quitar la clave en la base y lanzar la
  completa a mano sobre develop; lo que entro se detecta en el siguiente finish con codigo.
- Quitar la clave devuelve la 0.14.0 en el siguiente turno, si no se guardaron memos verdes falsos.
- `finish` deja escrito en `tarea.md` que la verificacion fue «solo documentacion» y por que (auditable,
  como `--sin-verificacion`).

## El riesgo que mas preocupa

Un `.md` que se ejecuta (skill, agente) clasificado como documentacion: es el tipo de tarea mas frecuente
aqui y en los proyectos que lo usan, el fail-closed no lo protege (la ruta si esta clasificada) y el fallo
se publica dentro del plugin. Mitigacion estructural: rutas leidas de la base, nunca por extension, y un
ejemplo explicito en `verificacion-selectiva.md` de que `.md` no son documentacion.

Suposiciones sin comprobar: que `git diff` detecta renombres por defecto en la version instalada; que
existe `puertaHeldout` acoplada al resultado de la verificacion; como calcula hoy `review` su diff en las
rondas incrementales.
