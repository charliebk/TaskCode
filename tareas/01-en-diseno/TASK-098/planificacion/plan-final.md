# Plan — TASK-098: ROADMAP de tareas generado por taskctl en todos los proyectos, sin pisar los existentes

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

Reglas de la persona: el objetivo principal es la agilidad sin perder calidad. Regla número uno: no entrar en conflicto con ToolsaWeb ni con OpenDockTrading (su ROADMAP queda byte a byte igual). Migrar esos proyectos solo se permite si no rompe nada ni pierde datos; va en tareas aparte en cada repo y la decide la persona. `taskctl roadmap --comparar` es la comprobación previa.

## Enfoque propuesto

- (arquitectura) Orden: 1) `src/core/roadmap.ts`, puro: Kahn con prioridad `(rangoHito, sprint, número)`, sin fecha en la salida (así no hay commit vacío); los ciclos van a una sección «Dependencias circulares». 2) `src/fs/roadmap.ts` (`prepararRoadmap`): el único sitio que decide si se escribe. 3) Gancho en las transiciones antes de su `autoCommit`; `git-commit.ts` y `sincronizacion.ts` no se tocan. 4) `taskctl roadmap [--comparar|--escribir]` en `cli.ts`, con `src/core/roadmap-comparar.ts`, un extractor tolerante (filas `TASK-NNN` bajo `H\d+`) que declara no comparable lo que no case. 5) Skills, README y CHANGELOG.
- (arquitectura) Los títulos de los hitos salen de los `### Hn — título` de la zona manual. No hay clave nueva en config; de la config solo se lee `rutas_sincronizacion`.
- (riesgos, no es desacuerdo, entra entero) Generación tolerante: una `tarea.md` rota, una dependencia inexistente o un ciclo nunca tumban la transición. Cualquier fallo deja el ROADMAP como estaba y solo avisa, como hace el tablero con sus `advertencias`. Arquitectura ya lo pide para los ciclos; riesgos lo extiende a todo fallo, porque en `finish` el merge ya está hecho.

## Desacuerdos entre roles, y como se resuelven

- (1) Dónde regenerar. Arquitectura: en cada uno de los seis comandos, antes de su autoCommit, también los que commitean en la rama de la tarea. Riesgos: así dos ramas vivas cambian las mismas líneas, el merge falla y `finish` aborta (`finish.ts:560-566`, `update-feature.sh:62`). Propone o que `finish` resuelva el conflicto regenerando, o regenerar solo en la rama de integración. Recomendación: **regenerar solo en los commits que caen en la rama de integración** (new, plan, approve y finish tras el merge; start si su commit cae en develop). Es la única opción sin conflicto por construcción y no toca los scripts de Git-Flow; resolver conflictos dentro de `finish` añade código frágil justo después del merge. Cuesta **ajustar el criterio 1**: «cada transición cuyo commit cae en la rama de integración lo regenera en ese commit; en la rama de la tarea no se toca».
- (2) Marcas. Riesgos: la marca de taskctl debe ser exacta, llevar versión, ir en una línea fija y no confundirse con las de ODT, que tiene «taskctl» y «generado por … no editar a mano» en el cuerpo. Arquitectura: una línea de marca propia, pero la zona manual con las mismas `manual:inicio/fin` de ODT, casando la de inicio por prefijo. Recomendación, dividida por sub-tema: **riesgos en la marca** (exacta, versionada, en línea fija, sin búsqueda por subcadena) y **arquitectura en la zona manual**. La protección depende solo de la marca de taskctl, y reutilizar las de ODT hace que su migración no pierda la zona manual ni los títulos de los hitos. El temor de riesgos sigue vivo: un test lo fija (ver pruebas).
- (3) Cuándo crear. Arquitectura: crear si `tareas/ROADMAP.md` no existe. Riesgos: además, no crear si existe en la rama de integración o si tiene historia en git (`git log --all`). Recomendación: **riesgos**. Es barato y cubre la regla número uno ante un `git rm` temporal o una rama vieja. La salida explícita es `taskctl roadmap --escribir`.
- (5) Cambios sin commitear. Riesgos: si el ROADMAP tiene cambios sin commitear, no regenerar y avisar, como la salvaguarda (a) de TASK-033, mirando el nombre real en disco. Arquitectura no lo contempla. Recomendación: **riesgos**. Es la única pérdida de datos sin vuelta atrás que se ha identificado.
- (6) Cómo entra en el commit. Arquitectura: añadir la ruta a las `rutas` del autoCommit, como `boardPath`. Riesgos: prepararlo aparte, como las rutas de sincronización, porque un fallo de su `git add` tumbaría el commit de la tarea (`git-commit.ts:244-251`). Recomendación: **riesgos**. Sigue entrando en el mismo commit, y si falla solo avisa.

## Riesgos aceptados y que los contiene

- Se puede olvidar una transición: import, pausa y doctor-deploy no regeneran (arquitectura). Lo contiene que el criterio nombra seis transiciones y que `roadmap --escribir` está a mano.
- Mayúsculas y CRLF en Windows (riesgos). Lo contienen el nombre real en disco y que las marcas se comparan ignorando el final de línea.
- Con una versión vieja del plugin, el ROADMAP con marca queda desactualizado sin aviso (riesgos). Se documenta.
- El comentario de `config.ts:281-283` deja de ser cierto (riesgos). Se reescribe.

## Plan de pruebas

Todas contra repos Git temporales reales.
- Sin ROADMAP, cada transición que cae en integración lo crea o regenera en su mismo commit, con todas sus secciones; dos ramas paralelas cierran sin conflicto (criterio 1, desacuerdo 1).
- Las copias reales de los ROADMAP de ToolsaWeb y ODT, y uno declarado en `rutas_sincronizacion`, quedan byte a byte igual tras cada transición. Incluye ODT con sus `manual:inicio/fin` y sin la marca de taskctl (criterio 2, riesgos 1-2).
- La zona manual se conserva al regenerar; un ciclo, una `tarea.md` rota o una dependencia archivada solo avisan (criterio 3, riesgos 6).
- No crea si hay historia o existe en integración; con el ROADMAP sin commitear, no regenera y avisa (desacuerdos 3 y 5).
- `roadmap --comparar` no escribe nada y lista tareas, hitos, dependencias, estado y zona manual, también contra las copias ajenas (criterio 4).
- Suite en verde sin debilitar tests. Revisar `auto-commit.test.ts:188` y las aserciones de `status --porcelain` vacío (riesgos): cambiar su expectativa con razón no es debilitarlas, y se documenta.

## Lo que necesita decision de una persona

- Desacuerdo 1: aceptar regenerar solo en la rama de integración y reescribir el criterio 1, o mantenerlo literal y pagar la resolución de conflictos en `finish`. Antes hay que verificar en qué rama commitean `start` y `review`: es una suposición sin verificar de riesgos.
- Desacuerdo 2: confirmar que se reutilizan las `manual:inicio/fin` de ODT. Es contrato compartido con otro repo y caro de deshacer.
- (7) La TASK-068 propia de ODT («Roadmap siempre al día», riesgos) quedaría sustituida. Cancelarla o reescribirla es una tarea en ese repo y la decide la persona. Esta tarea no toca ODT ni ToolsaWeb.
- Sin cubrir por ningún rol: el contenido de la documentación (criterio 5). Tampoco cómo migraría ToolsaWeb sus títulos de `docs/planificacion/hitos.md`: arquitectura lo deja sin verificar, y va a la tarea de migración de ese repo.
- La aprobación del plan entero con `taskctl approve`: sin ella no se implementa.

## Decisiones de la persona (2026-11-10)

1. Se regenera solo en los commits que caen en la rama de integracion (new, plan, approve, finish tras el merge, y start si su commit cae ahi): dos ramas en paralelo nunca chocan. El criterio 1 de la tarea se ajusta en ese sentido.
2. Marca de taskctl exacta, con version, en una linea fija y sin busqueda por subcadena; la zona manual reutiliza las marcas manual:inicio y manual:fin de OpenDockTrading. Un test fija que la copia de OpenDockTrading queda byte a byte igual.
3. No se crea el fichero si tiene historia en git o existe en la rama de integracion; roadmap --escribir es la salida explicita.
4. Generacion tolerante: ningun fallo tumba una transicion; el ROADMAP queda como estaba y se avisa.
5. Con cambios sin commitear en el ROADMAP no se regenera y se avisa.
6. El ROADMAP entra en el mismo commit pero se prepara aparte: un fallo al anadirlo solo avisa.
7. La TASK-068 de OpenDockTrading se sustituye por la tarea de migracion de ese proyecto, tras publicar la 0.14.0.
8. Plan aprobado tal cual por la persona.
