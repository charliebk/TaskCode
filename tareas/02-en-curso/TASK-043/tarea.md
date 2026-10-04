---
id: TASK-043
titulo: "F4-T2 Validacion antes de plan y puertas de cierre"
tipo: feature
sprint: 5
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-043-f4-t2-validacion-antes-de-plan-y-puertas
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-04
actualizado: 2026-10-04
dependencias: []
---
## Objetivo

Que `plan` se niegue a planificar una tarea mal definida, y que `approve` y
`finish` no dejen pasar esqueletos vacios (auditoria del 2026-10-03, C2, C6 y
D5). Reproducido en la auditoria: una tarea entera se cerro con el Objetivo
vacio, un criterio `- [ ] ` vacio, el plan en esqueleto y sin Resultado, y
todos los comandos salieron con 0. Ademas, las tareas con muchos criterios o
criterios vagos («mejorar», «robusto») son las que mas rondas de revision
costaron: las tres con 13 o mas criterios tuvieron peticiones de 110-160 KB.

La validacion es determinista (sin modelo): objetivo no vacio, entre 1 y 8
criterios no vacios, y cada criterio cita algo comprobable (un comando, una
ruta, un numero, codigo entre comillas invertidas o un test). Se calibra
contra las tareas ya cerradas del repo para no rechazar lo razonable.

Fuera de alcance: proponer la particion de una tarea grande (TASK-044).

## Criterios de aceptacion
- [x] `plan` aborta sin mover la tarea si el objetivo esta vacio, hay 0 criterios o mas de 8, o alguno esta vacio (ajustado en el plan aprobado: bloquea con mas de 12, avisa de 9 a 12)
- [x] Lint de verificabilidad: cada criterio cita un comando, una ruta, un numero, codigo o un test; `mejorar`, `robusto` o `correctamente` solos se rechazan con el motivo (ajustado: solo vago bloquea; sin ancla avisa)
- [x] `approve` rechaza un `plan-final.md` con todas las secciones vacias
- [x] `finish` avisa de casillas sin marcar fuera de `### Tras el cierre`
- [x] Probado sobre las 17 tareas cerradas: se listan las que habrian sido rechazadas y por que (eran 27; ver Resultado)

## Resultado

Implementado en `src/core/validacion-tarea.ts` (modulo puro) y tres puertas:

- `plan`: `validarEnunciado` sobre la lectura fresca de la rama base, con o
  sin roles. Bloquea objetivo vacio, 0 criterios, criterio vacio, mas de 12
  criterios y criterios hechos solo de palabras vagas; avisa (stderr, campo
  `avisosEnunciado`) con 9 a 12 criterios y con criterios sin ancla. El
  error dice que hacer: editar en la rama base, commitear y reintentar.
- `approve`: rechaza el `plan-final.md` que, quitando cabeceras y lineas de
  las plantillas posibles (0..N roles, generadas con `planTemplate`), no
  tiene ninguna linea propia.
- `finish`: avisa por `onAviso` ANTES del merge de los criterios sin marcar
  (las casillas de `### Tras el cierre` no cuentan). No bloquea.

Calibracion contra el repo (script sobre `extraerSecciones` real):

- 27 tareas cerradas: bloquearian 3 — TASK-029 (17 criterios), TASK-030
  (objetivo vacio y 18 criterios) y TASK-032 (13 criterios), justo las de
  peticiones de revision de 110-160 KB. 15 recibirian avisos (casi todos,
  criterios de comportamiento sin ancla). Con la regla estricta original
  (ancla obligatoria, maximo 8) habrian bloqueado 13 de 27.
- 12 tareas planificadas: las 12 bloquean por objetivo vacio (las importo el
  plan de la auditoria solo con criterios). Hay que redactar el objetivo de
  cada una antes de su `plan`.

Tests: `test/core/validacion-tarea.test.ts` (8, puros) y
`test/commands/validacion-puertas.test.ts` (5, repos Git reales: plan
rechaza sin mover ni commitear; plan con 9 criterios avisa; approve rechaza
el esqueleto que deja el propio plan y acepta uno redactado; finish avisa
con la rama aun sin integrar; sin casillas pendientes no avisa). El test de
TASK-016 «objetivo vacio sin roles no aborta» se invierte a proposito.
Fixtures de 6 ficheros de test actualizadas (criterios y planes redactados).
Suite: 952 tests, 949 en verde; los 3 rojos son los conocidos de Windows.
Mutantes (7, todos muertos): limite a 13, sin aviso en finish, sin puerta en
approve, puerta solo con roles, contar `Tras el cierre`, sin avisos en plan,
cabeceras como contenido propio. El de esSoloVago encontro un hueco real
(«que sea rapido» no se detectaba): anadidas formas copulativas.
