---
id: TASK-070
titulo: "Clave comando_verificacion en .taskcode/config.yml"
tipo: feature
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-070-clave-comando-verificacion-en-taskcode-c
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 725035
tokens_implementacion: null
tokens_revision: 974410
creado: 2026-11-03
actualizado: 2026-11-04
dependencias: []
---
## Objetivo

Declarar como se verifica un proyecto, para que los frenos ejecuten el comando del repo y nunca uno inventado.

## Criterios de aceptacion
- [x] Nuevas claves opcionales comando_verificacion y timeout_verificacion en resolverConfig, con fallo cerrado ante valor invalido y defecto null (sin freno)
- [x] Sin la clave, el comportamiento de todos los comandos es identico al actual; los tests existentes pasan sin tocarlos
- [x] taskctl doctor informa si falta comando_verificacion, con el arreglo en la misma linea
- [x] Tabla de claves de config.ts, README y CHANGELOG al dia

## Resultado

Implementado (commit 9c9a684):
- `src/core/config.ts`: claves `comando_verificacion` (texto, defecto null = sin freno) y
  `timeout_verificacion` (entero >= 1, segundos, defecto 600). Se reutilizan `validarComando` y
  `validarEnteroPositivo`, generalizados con la clave (los mensajes de sincronizacion no cambian;
  hay test que lo fija). Nueva `validarVerificacionCompleta`: el timeout sin comando aborta.
  Tabla de claves de la cabecera al dia.
- `src/commands/doctor.ts`: comprobacion `verificacion` tras la de config. Con comando, `ok` con
  comando y timeout; sin el, `omitida` con el arreglo en el propio mensaje (D1 del plan: un aviso
  habria cambiado el recuento de avisos que fijan los tests existentes y dejaria un aviso permanente
  en proyectos sin frenos); con la config rota, `omitida`.
- README del plugin (comprobacion de doctor y subseccion de la clave), CHANGELOG (bloque en «Sin
  publicar»: no se publica version hasta TASK-071) y `skills/task-workflow/SKILL.md` (lista de
  claves completa; corregido «una clave mal escrita aborta», falso desde TASK-061).
- Tests: `test/core/config-verificacion.test.ts` (8) y 3 nuevos en `test/commands/doctor.test.ts`;
  ningun test existente editado.

Verificacion: suite completa 1716/1721; los 5 rojos son los conocidos de Windows (symlink EPERM,
chmod de directorio, CRLF) y las 2 contrapruebas de descubrimiento de TASK-075. Smoke del CLI en
repo temporal: sin clave, con clave, timeout sin comando, timeout de texto, comando vacio y errata
(aviso con sugerencia).

Revision por pares (ronda 1, code-quality-reviewer): **aprobada**, sin CRITICO ni IMPORTANTE.
Reprodujo en clon propio (103 tests afectados en verde) y 4 mutantes, 3 detectados limpiamente.
- MEN-1 (aceptado): con la config rota la verificacion sale `omitida`, que no distingue «no
  evaluable» de «no declarada»; es el mismo criterio que rama-base, origin y plataforma.
- MEN-2 (aceptado): no hay test de CLI de punta a punta para el timeout sin comando; lo cubren
  los tests de config y de doctor, y todos los comandos pasan por `resolverConfig`.

Decisiones tomadas por el orquestador en modo automatico (plan, D1-D3): `omitida` en doctor,
600 s por defecto, y aceptar una clave que solo lee doctor hasta TASK-071.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-04T13:52:07Z | plan | automatico | persona |
| 2026-11-04T13:56:20Z | approve | automatico | persona |
| 2026-11-04T13:56:21Z | start | automatico | persona |
| 2026-11-04T14:14:48Z | review | automatico | persona |
| 2026-11-04T14:24:02Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04T13:56:11Z | diseno | agente:a6ba99584f516f5e1 | 36 | 53945 | 660351 | 10703 | 29 | 725035 |
| 2026-11-04T14:23:21Z | revision | agente:ad5cb455dcdc21f65 | 20 | 102875 | 866648 | 4867 | 1 | 974410 |
