# Roadmap de tareas

<!-- generado por scripts/grafo-tareas.py --escribir; no editar a mano -->

Orden en que se hacen las tareas, agrupadas por hito (`sprint` del frontmatter). Sale de las dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del hito y el número menores. El motivo de cada hito está en `docs/planificacion/hitos.md` §1. Las tareas descartadas (en `tareas/05-archivadas/`) no salen.

- **En marcha:** TASK-298 (en curso)
- **Listas para empezar:** TASK-211, TASK-194, TASK-234, TASK-257, TASK-117, TASK-198, TASK-217, TASK-228, TASK-158, TASK-159, TASK-160, TASK-161, TASK-163, TASK-164, TASK-165, TASK-166, TASK-193, TASK-169, TASK-183, TASK-184, TASK-185, TASK-199, TASK-201, TASK-219, TASK-236, TASK-024, TASK-039, TASK-040, TASK-041, TASK-151, TASK-046, TASK-235, TASK-011, TASK-111, TASK-048, TASK-043, TASK-044, TASK-052, TASK-100, TASK-119, TASK-248, TASK-249, TASK-250, TASK-252, TASK-253, TASK-254, TASK-255, TASK-256, TASK-279, TASK-296, TASK-283, TASK-293, TASK-276, TASK-286, TASK-291, TASK-292

## H0 — Relaciones y modelo de datos

44 de 45 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-001 | Límites de módulos: cuestionar la división clásica antes de fijarla | alta | — | ✅ terminada |
| — | TASK-002 | Arnés de evidencias: galería con estado y diferencias respecto a lo aprobado | media | — | ✅ terminada |
| — | TASK-003 | Registro único de servicios para start-all y stop-all | simple | — | ✅ terminada |
| — | TASK-004 | Arnés de arquitectura funcional extremo a extremo (walking skeleton) | alta | — | ✅ terminada |
| — | TASK-008 | Inventario de la instalación de Clip: catálogos, aparatos de vía, normativa y plantillas | alta | — | ✅ terminada |
| — | TASK-012 | Replanificación en hitos y tareas pequeñas a partir del estudio de Clip | media | TASK-008 | ✅ terminada |

## H14 — Motor de CivilBoot (núcleo de SOLIDOS)

7 de 8 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-112 | Definiciones de CivilBoot versionadas con huella, origen, firma y aceptación por versión | media | TASK-101, TASK-224 | ✅ terminada |
| — | TASK-113 | tw-expresion: lenguaje del motor de CivilBoot con unidades, sin nada de fuera y determinista | media | TASK-112, TASK-224 | ✅ terminada |
| — | TASK-114 | Receta de CivilBoot como texto y nodos, con su validador y el orden deducido o forzado | alta | TASK-112, TASK-113, TASK-224 | ✅ terminada |
| — | TASK-115 | Núcleo de sólidos: extrusión, barrido por eje, corte y booleanas con origen local | alta | TASK-114 | ✅ terminada |
| — | TASK-238 | Ejecutor del motor de CivilBoot (tw-civilboot): contrato único, pila interna, intentar/capturar, presupuesto y tabla de errores | media | TASK-113, TASK-114 | ✅ terminada |
| — | TASK-239 | Repetición y agrupación en el motor de CivilBoot | media | TASK-238 | ✅ terminada |
| — | TASK-116 | Anclaje de piezas a eje, rasante y terreno | alta | TASK-114, TASK-074, TASK-083, TASK-033 | ✅ terminada |
| 2 | TASK-117 | Recálculo incremental de piezas por nodo con niveles de invalidación | alta | TASK-115, TASK-116 | lista para empezar |

## H17 — Publicidad, redes sociales y programa de partners (último hito)

0 de 3 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| 150 | TASK-288 | Publicidad y redes sociales: estudio completo con su tributación | media | TASK-286, TASK-291, TASK-292 | espera a TASK-286, TASK-291, TASK-292 |
| 151 | TASK-289 | Programa de partners bronce, plata y oro y afiliados: estudio completo con su tributación | media | TASK-285, TASK-286, TASK-291 | espera a TASK-285, TASK-286, TASK-291 |
| 152 | TASK-290 | Publicidad y partners: features de los estudios y partición del hito H17 en tareas | media | TASK-288, TASK-289 | espera a TASK-288, TASK-289 |
