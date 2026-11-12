# Plan — TASK-124: Contexto con tamano maximo: lo que leen los agentes no crece con el proyecto

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador, sin brainstorm de roles ni unificador.)

## De donde se parte (medido el 2026-11-12 con wc -c)

- `CLAUDE.md` 5 852 B. `docs/contexto/CHECKLIST_TERMINACION.md` 86 476 B,
  `ESTADO.md` 32 783 B (ultima actualizacion escrita: 2026-10-05, 38 dias),
  `HALLAZGOS.md` 53 298 B.
- README del plugin 106 KB: casi la mitad es historia de sesiones
  (TASK-006, TASK-031, CI de Windows, `core.fileMode`) y la referencia de
  claves de `.taskcode/config.yml` y del aviso de release (~300 lineas).
- Skills: `task-workflow/SKILL.md` 15,4 KB; fases 1,2-7,8 KB; revisoras
  11-22,5 KB (`rust-wasm-reviewer` la mayor).
- Tests que leen el README del plugin: `test/empaquetado/distribucion.test.ts`
  (funcion de perfil de PowerShell) y `test/commands/doctor-hooks-subagente.test.ts`
  (seccion «Problemas conocidos»). Si esas secciones se mueven, el test pasa
  a leer el fichero nuevo con la misma asercion (no se debilita).

## Enfoque propuesto

Duracion estimada: 150 min (de la rama abierta al cierre con merge; senales: ficheros de codigo previstos 3 (doctor, config, un test nuevo de tamanos), capas 3 (docs del repo, docs del plugin, CLI), criterios 5)

1. **Topes de tamano con test** (`test/skills/tamanos.test.ts`, nuevo). Una
   tabla fichero → tope en bytes: tamano actual + ~15 % redondeado al KB
   (`CLAUDE.md` 8 KB; cada `SKILL.md` de fase y `task-workflow/*.md`; cada
   revisora y cada agente), mas un tope del total de `skills/` + `agents/`.
   El mensaje de fallo dice el fichero, los bytes y el tope, y que se
   archive o se parta en vez de subir el tope. `CLAUDE.md` se lee desde la
   raiz del repo (tres niveles por encima del plugin). Un fichero nuevo en
   `skills/` o `agents/` sin tope en la tabla hace fallar el test (no se
   escapa por omision).
2. **README del plugin < 40 KB sin perder contenido.** Queda como portada:
   que es, instalacion, comandos en una tabla corta y un indice con enlaces.
   El resto pasa a `docs/` del plugin (se distribuye con el):
   `docs/configuracion.md` (claves de `.taskcode/config.yml`, verificacion,
   hooks, held-out, cobertura, guardian de merges), `docs/cierre-y-release.md`
   (puntos de juicio, `--crear-tareas`, aviso de release, GitLab propio),
   `docs/instalacion-y-distribucion.md` (dist versionado, PATH, PowerShell,
   historia de TASK-006/031, `core.fileMode`) y `docs/problemas-conocidos.md`.
   Test (`test/empaquetado/readme.test.ts`): README < 40 960 B; todo enlace
   relativo del README y de `docs/*.md` apunta a un fichero que existe (y a
   un encabezado que existe si lleva ancla); y la lista de encabezados del
   README de hoy (fijada en el test) aparece entera entre README y `docs/`.
   Los mensajes del CLI que dicen «ver el README» siguen valiendo: el README
   enlaza cada seccion movida.
3. **Archivo de lo cerrado** (`docs/contexto/archivo/`, nuevo):
   `CHECKLIST-fases-cerradas.md` recibe las fases A-O cerradas y el detalle
   de las decisiones resueltas; `CHECKLIST_TERMINACION.md` conserva la
   cabecera, la tabla de contadores, la fase P abierta, lo pendiente de C/E y
   las decisiones abiertas, con un enlace al archivo. `ESTADO.md` se
   reescribe al dia (version publicada, cola de la 0.16, como retomar,
   trampas vivas) y su historia pasa a `archivo/ESTADO-hasta-2026-11-12.md`.
   Topes: 20 KB y 10 KB, comprobados con `wc -c` y en el test del punto 1
   (para que no vuelvan a crecer). `CONVENCIONES.md` dice que lo cerrado se
   archiva ahi.
4. **`taskctl doctor` vigila el documento de estado.** Clave opcional nueva
   `documento_estado` en `.taskcode/config.yml` (ruta relativa al repo). Sin
   la clave, la comprobacion sale `omitida` (el plugin no presupone ningun
   documento). Con ella: fecha = la del ultimo commit que toca el fichero
   (`git log -1 --format=%cI`, no mtime, que un checkout cambia). `aviso` si
   tiene mas de 14 dias, o si alguna tarea de `04-terminadas` tiene
   `actualizado` posterior a esa fecha (dice cuantas y la mas reciente).
   `aviso` si la ruta no existe. Logica pura en `core/doctor.ts`
   (dias, comparacion de fechas) y la lectura en `commands/doctor.ts`. Este
   repo declara `documento_estado: docs/contexto/ESTADO.md` (toca la config:
   `finish --sin-verificacion`). Documentado en `docs/configuracion.md`.

## Desacuerdos entre roles, y como se resuelven

No hay roles (modo rapido).

## Riesgos aceptados y que los contiene

- El plugin instalado (0.14.0) avisa de la clave desconocida
  `documento_estado` hasta publicar: aviso, no aborta (comportamiento
  documentado).
- Mover secciones del README rompe enlaces de otros documentos del repo
  (docs/, tareas cerradas): el test de enlaces cubre README y `docs/` del
  plugin; los enlaces de tareas cerradas no se tocan (son historia).
- «Va por detras» con granularidad de dia: una tarea cerrada el mismo dia
  despues de actualizar el documento no avisa. Se acepta: sin falsos
  positivos.

## Plan de pruebas

- `tamanos.test.ts`: pasa con los tamanos de hoy; contraprueba con un tope
  menor que el fichero (la funcion de comprobacion es pura y se prueba con
  datos) y con un fichero sin tope.
- `readme.test.ts`: tamano, enlaces y encabezados; contraprueba con un
  enlace roto y un encabezado ausente sobre textos de prueba.
- doctor: tests de la funcion pura (13, 14, 15 dias; tarea posterior y no
  posterior) y de integracion con un repo Git temporal (clave ausente →
  omitida; fichero commiteado hace 20 dias con `GIT_COMMITTER_DATE` →
  aviso; al dia → ok; ruta inexistente → aviso).
- `wc -c` de CHECKLIST y ESTADO en el `## Resultado`.
- Verificacion: `RAMA_BASE=develop node scripts/verificar-impacto.mjs` +
  `npm run test:rapido`.

## Troceo

Pasa de 60 min con tres bloques que se verifican solos.

### Parte a: topes de tamano y README del plugin por debajo de 40 KB

Puntos 1 y 2 del enfoque: test de topes de CLAUDE.md, skills y agentes, y el README del plugin partido en docs/ sin perder contenido.

- [ ] CLAUDE.md, las skills de flujo y las revisoras tienen un tamano maximo en bytes con un test que falla si se supera
- [ ] El README del plugin pasa la referencia detallada a ficheros aparte y queda por debajo de 40 KB, sin perder contenido (test que comprueba el tamano y los enlaces)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

Duracion estimada: 60 min

### Parte b: archivo de CHECKLIST y ESTADO

Punto 3 del enfoque: lo cerrado a docs/contexto/archivo/, ESTADO.md reescrito al dia.

- [ ] CHECKLIST_TERMINACION.md y ESTADO.md archivan lo cerrado en docs/contexto/archivo/ y lo vivo queda por debajo de 20 KB y 10 KB (comprobado con wc -c y con test)

Duracion estimada: 40 min

### Parte c: doctor vigila el documento de estado

Punto 4 del enfoque: clave documento_estado y aviso de doctor.

- [ ] taskctl doctor avisa si el documento de estado declarado lleva mas de 14 dias sin actualizarse o va por detras de las tareas cerradas (test)
- [ ] Los tests afectados y npm run test:rapido pasan sin debilitar ningun test

Duracion estimada: 50 min

## Lo que necesita decision de una persona

- Trocear en a/b/c o hacerla entera (150 min). **Decidido por Carlos el
  2026-11-12: entera, sin trocear.** La seccion `## Troceo` queda como
  orden de trabajo dentro de la tarea (a, b, c).
