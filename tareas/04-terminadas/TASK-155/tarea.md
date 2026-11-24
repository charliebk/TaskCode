---
id: TASK-155
titulo: "comprobarSkillInstalado verificable en Windows (claude.cmd)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: fix/task-155-comprobarskillinstalado-verificable-en-w
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: 3939361
tokens_revision: 1449419
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

En Windows claude es un .cmd y spawnSync sin shell no lo ejecuta, asi que comprobarSkillInstalado devuelve siempre no-verificable y plan sugiere instalar skills que ya estan. Resolver el ejecutable en el PATH con PATHEXT (candidatosEnPath) y lanzar un .cmd/.bat de forma segura, para que el estado real (instalado / no-instalado) se pueda verificar.

## Criterios de aceptacion
- [x] comprobarSkillInstalado localiza claude en el PATH con candidatosEnPath y, en Windows, lanza un .cmd o .bat a traves del shell con la ruta citada; sin claude en el PATH sigue siendo no-verificable sin lanzar nada
- [x] Un test de integracion pone un claude.cmd (Windows) o un claude ejecutable (resto) de prueba en un PATH temporal que imprime el JSON de plugin list y comprueba instalado y no-instalado; antes del cambio da no-verificable en Windows
- [x] La verificacion por impacto queda en verde

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:44:26Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T09:45:19Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T09:45:21Z | start | automatico | persona | 0.16.1 |
| 2026-11-24T10:04:01Z | review | automatico | persona | 0.16.1 |
| 2026-11-24T10:14:25Z | finish | automatico | persona | 0.16.1 |

## Autorrevision

- code-quality-reviewer — 6213377

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total | ronda | revisor |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-24T10:04:01Z | implementacion | sesion:8b5a4a51-b3bc-4278-83ca-facf23e674de | 62 | 26892 | 3901816 | 10591 | 4 | 3939361 | - | - |
| 2026-11-24T10:12:29Z | revision | agente:a4eba0615a95cdbaf | 28 | 110153 | 1332721 | 6517 | 2 | 1449419 | 1 | - |

## Resultado

- `comprobarSkillInstalado` (`src/core/plugin-instalado.ts`) ya no lanza `spawnSync('claude')` sin shell: localiza `claude` con `localizarHerramienta` (PATHEXT, via `candidatosEnPath`) y lo lanza con `ejecutarHerramienta`, que pasa por el shell con la ruta citada solo si es un `.cmd`/`.bat` en Windows. Sin `claude` en el PATH, `no-verificable` sin lanzar nada.
- Tests: dos nuevos en `test/integracion/plugin-instalado.test.ts` con un doble `claude.cmd` (Windows) o script `sh` ejecutable (resto) como unico PATH: `instalado` y `no-instalado`. Contra el codigo anterior ambos dan `no-verificable` (rojo comprobado antes del cambio y por mutacion en la revision).
- Verificacion por impacto: 766/767; el unico rojo fue el `EBUSY ... rmdir` del teardown de `doctor-correcciones.test.ts` (intermitente conocido, ajeno); repetido aislado, 6/6 verde.
- Revision por pares (ronda 1, code-quality-reviewer): aprobada, sin hallazgos. Probo ademas rutas con espacios, `&` y parentesis, stdout no JSON, status 1 y stdout vacio. Observaciones no corregidas: un timeout con shell puede dejar huerfano el proceso `claude` hijo de `cmd.exe` (de borde, degrada a `no-verificable`); un `claude` `.ps1` o sin extension queda fuera (declarado en el plan).
- Fuera del alcance, para tarea aparte: en esta maquina `claude` es `claude.exe` y `claude plugin list --json` tarda ~18 s, mas que `TIMEOUT_MS` (5 s), asi que con el binario real el estado sigue saliendo `no-verificable`.

## Verificacion parcial

- 2026-11-24T10:13:07Z: todo el codigo que cambia la tarea (3 fichero(s)) cae en rutas_verificacion_parcial de "develop": basta la verificacion de lo afectado; se ejecuta la selectiva `node scripts/verificar-impacto.mjs` en verde, no la completa `npm --prefix taskcode-marketplace/plugins/taskcode-plugin test`

## Duracion

- Estimada: 30 min
- Real (de la rama abierta al cierre con merge, sin pausas): 29 min
- Cierre (finish): 78 s, de 2026-11-24T10:13:07Z a 2026-11-24T10:14:25Z
