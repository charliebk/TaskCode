## Enfoque
- (arquitectura) 1) `extraerSecciones` en `tarea-body.ts` gana `grupos` (abre grupo un `###` distinto de «Tras el cierre» o una linea sin sangrar solo en negrita); 2) modulo puro nuevo `particion-tarea.ts` con `proponerParticion` → markdown de `import`, `null` si hay menos de 2 frentes.
- (arquitectura) 3) `ResultadoValidacion` gana `demasiadoGrande`; 4) `plan.ts`, antes de lanzar el bloqueo, escribe `particion-<ID>.md` en `mkdtempSync(tmpdir()/taskctl-particion-<ID>-)` y cita ruta y comando `taskctl import` exacto.
- (riesgos) Se mantiene que el aborto ocurre antes de escribir nada en el repo (`plan.ts:468-476` frente a `:511`); si falla la escritura, se aborta con el bloqueo original sin nombrar un fichero que no existe.
- Sin 2+ frentes no hay particion: solo el error de TASK-043 mas la pista de agrupar (arquitectura).

## Desacuerdos resueltos
- Titulo de las hijas — arquitectura: `### <titulo tarea> — <titulo grupo>` / riesgos: solo el ID delante («TASK-030 C4 — ...»), porque el titulo del padre choca con `slugify` (corta a 40, `new.ts:246`) y con el rechazo de duplicados normalizados (`import.ts:265-269`) — gana riesgos — trae la colision verificada en codigo [V]; arquitectura no la evaluo.
- Bloquear por 2+ frentes con 12 criterios o menos — arquitectura: bloquear, por el AC1 literal / riesgos: solo avisar, porque para quien escriba grupos hoy el bloqueo no tiene salida y partir sin grupos esta fuera de alcance — SIN RESOLVER, sube a decision humana — arquitectura se apoya en el texto del AC1 y riesgos en una conducta que el AC1 contradice; elegir es reinterpretar el criterio de aceptacion.
- Objetivo de las hijas — arquitectura: poner el Objetivo original como preambulo antes del primer `###`, que el parser ignora (lo marca como suposicion) / riesgos: import escribe Objetivo vacio (`import.ts:275`) y la hija nace bloqueada [V]; llevar el Objetivo en el formato de import o avisarlo — SIN RESOLVER, sube a decision humana — si el parser ignora el preambulo, la propuesta de arquitectura no lo hace llegar al Objetivo; queda la opcion de ampliar `import`, que es cambio de alcance.
- Nombre y ciclo de vida del fichero — arquitectura: `mkdtemp` nuevo en cada ejecucion, descarta ruta fija / riesgos [S]: ruta estable que, si existe igual, no se toca y, si es distinta, se respeta y se nombra — gana arquitectura — `mkdtemp` ya tiene precedente (`src/fs/sincronizacion.ts`) y resuelve tambien las colisiones entre proyectos y entre dos `plan` a la vez que levanta riesgos; el riesgo de pisar una edicion es [S] y desaparece sin ruta fija.
- Transversal y criterios sueltos — arquitectura: copiarlos al final de cada frente / riesgos: copiarlos o que decida una persona, nunca tarea propia — coinciden en lo esencial; gana copiar (arquitectura), y riesgos deja abierta la alternativa humana (ver Decision humana pendiente).

## Riesgos aceptados
- «La particion funciona y no sirve»: import la acepta y la hija no pasa `plan` — riesgos — solo lo contiene el test de cadena entera y la decision humana sobre el Objetivo; sin esa decision, el riesgo sigue abierto.
- «### Tras el cierre» convertido en criterio normal hace que `finish` exija marcarlo — riesgos [V] — arquitectura lo excluye de los grupos; riesgos pide ademas avisar de que import no tiene donde ponerlo.
- Falsos positivos del detector (TASK-033 con `### 1.` en el Objetivo, TASK-032 con negritas en linea) — riesgos [V] — detector limitado a criterios (arquitectura y riesgos coinciden).
- Volcado de `- [x]` como «- [ ] [x] ...», grupo vacio, linea en blanco entre cabecera en negrita y lista (TASK-032) — riesgos [V] — normalizar la casilla, descartar grupos vacios, tolerar la linea en blanco.
- Escritura no atomica: un truncado lo acepta import en parte — riesgos [S] — escribir en temporal y renombrar.
- Windows: `tmpdir` en 8.3 (`NULLCA~1`) engana a `path.relative`; rutas con espacios; Storage Sense borra la propuesta — riesgos [S] — `realpath` a los dos lados, entrecomillar la ruta en el error; el borrado se tolera porque se regenera.

## Plan de pruebas
- Cadena entera plan → import → plan de una hija con una tarea de dos frentes tipo TASK-030 (C4, C2, Transversal) — repo Git temporal — riesgos (cubre AC3; arquitectura avisa de que TASK-030 tiene el Objetivo vacio y hay que rellenarlo).
- La salida de `proponerParticion` pasa por `parseImportMarkdown` sin entradas `ok:false` y con 7+4 criterios por hija — modulo puro — arquitectura.
- El fichero se escribe fuera de `git rev-parse --show-toplevel` (con `realpath`) y el error lo nombra — repo Git temporal — riesgos (AC2).
- Sin grupos o con 1 frente no se escribe nada y el error trae la pista de agrupar — repo Git temporal — arquitectura.
- «Tras el cierre», `- [x]`, grupo vacio y linea en blanco tras la cabecera en negrita — `extraerSecciones` — riesgos.
- Fallo de escritura: `plan` aborta con el bloqueo original y no cita ruta — repo Git temporal — riesgos.

## Sin cubrir
- El AC1 dice «varios frentes en el Objetivo» y los dos roles detectan en los criterios (riesgos con falsos positivos verificados) — la desviacion del texto del AC1 la tiene que aceptar una persona.
- Nadie verifico la regla «mas de 12 criterios» de TASK-043 con criterios copiados: cada hija de TASK-030 queda en 11, pero una de 3 frentes con transversal grande puede pasar de 12 — que lo mida quien implemente.
- Que hacer con la tarea padre tras importar las hijas (queda bloqueada y duplica criterios en el board) — arquitectura lo deja como suposicion y riesgos pide que el error lo diga; nadie propone que dice — decision humana.
- Discrepancia de complejidad (declarada media, heuristica trivial por 0 senales): ningun rol la comento; los hallazgos de ambos sugieren que el coste real esta mas cerca de media.

## Salidas que faltaron
- brainstorm-testing — no se lanzo (2 roles por el calculo de complejidad: el mayor entre media declarada y trivial heuristica) — el plan de pruebas sale de arquitectura y riesgos, no de un rol dedicado.
- brainstorm-dominio — no se lanzo (mismo motivo) — nadie miro el significado de «frente» ni la relacion padre-hijas desde el dominio de la metodologia.

## Suposiciones no verificadas
- `os.tmpdir()` cae siempre fuera del repo; con TMPDIR dentro, no — arquitectura y riesgos — comprobar contra `git rev-parse --show-toplevel` con `realpath`.
- Un campo nuevo en `SeccionesTarea` no afecta a `heuristica.ts` — arquitectura — revisar sus consumidores y tests.
- Tests de TASK-043 comparan literalmente el mensaje de bloqueo — riesgos [S] — buscar aserciones literales sobre ese texto.
- El preambulo antes del primer `###` sobrevive al import — arquitectura — leer `parseImportMarkdown` e `import.ts:275`.
- Ninguna tarea en 00/01 tiene grupos en criterios, asi que nada cambia de conducta — riesgos [V], pero solo cierto si el detector se limita a criterios y excluye «Tras el cierre».
- Si se amplia `import`, los ficheros ya escritos siguen valiendo — riesgos [V] como requisito, no como hecho del diseno — test de compatibilidad con un fichero antiguo.

## Decision humana pendiente
- Bloquear o solo avisar con 2+ frentes y 12 criterios o menos (arquitectura frente a riesgos), y si se acepta detectar en criterios aunque el AC1 dice «en el Objetivo» — reinterpreta un criterio de aceptacion; no es de este rol.
- Como llega el Objetivo a las hijas: ampliar el formato de `import` (cambio de alcance, compatibilidad hacia atras) o solo avisar en el error — sin eso la particion no sirve (riesgos [V]) y ningun rol verifico una solucion.
- Que dice el error sobre la tarea padre tras importar y que se hace con «Tras el cierre» — el import es lo caro de deshacer (crea tareas y commitea, sin comando para cancelar; riesgos [V]).
- Aprobar este plan entero con `taskctl approve`: no vale ni se implementa hasta que una persona lo apruebe.

## Decisiones del orquestador (2026-10-04)

Bajo la autorizacion permanente de ejecutar el backlog de la auditoria; quedan
anotadas para que una persona las revise y, si no esta de acuerdo, se
reabra.

1. **Bloquear solo por mas de 12 criterios** (lo que ya hace TASK-043); con 2
   o mas frentes y 12 o menos, **aviso**, no bloqueo. Gana riesgos: el bloqueo
   no tendria salida (partir sin grupos esta fuera de alcance) y ninguna tarea
   real esta en ese caso. Se ajusta el criterio 1 como se ajusto en TASK-043.
2. **Los frentes se cuentan en los criterios, no en el Objetivo**: grupos
   abiertos por `###` (salvo «Tras el cierre») o por una linea que sea solo
   negrita. El Objetivo da falsos positivos (TASK-033).
3. **El Objetivo llega a las hijas ampliando `import`** de forma compatible:
   las lineas `> ...` bajo el `### titulo`, antes de los criterios, son el
   Objetivo de esa tarea. Antes eran «prosa suelta» que invalidaba la entrada,
   asi que ningun fichero valido de hoy cambia de significado. El Objetivo de
   cada hija dice de que tarea y frente sale, y cita el Objetivo del padre.
4. **«Transversal», «Comunes», «General» y los criterios sueltos** se copian
   en cada hija. Si alguna hija pasa de 12 criterios tras la copia, se dice
   en el aviso (el `plan` de la hija la bloqueara igual).
5. **«Tras el cierre»** no entra como criterio; se lista en el preambulo del
   fichero (antes del primer `###`, que import ignora) para reponerlo a mano.
6. **Titulos**: `<ID padre> <titulo del grupo>`, y el slug sale distinto por
   grupo.
7. **Fichero**: `mkdtemp(os.tmpdir()/taskctl-particion-<ID>-)` +
   `particion-<ID>.md`, nuevo en cada intento. Si `realpath` cae dentro del
   repo, no se escribe. Si escribir falla, el error es el del bloqueo, sin
   nombrar un fichero inexistente.
8. **Tarea padre**: el error dice que, tras importar, la original sigue en
   `00-planificadas` y hay que retirarla a mano (no hay comando de cancelar).
9. **La prueba es la cadena entera**: plan del padre bloquea y escribe la
   propuesta → import del fichero → plan de una hija pasa.
