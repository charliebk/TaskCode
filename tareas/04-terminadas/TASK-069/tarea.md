---
id: TASK-069
titulo: "Spike: hooks Stop y PreToolUse de Claude Code en Windows/IntelliJ"
tipo: feature
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-069-spike-hooks-stop-y-pretooluse-de-claude
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: 2946223
creado: 2026-11-03
actualizado: 2026-11-03
dependencias: []
---
## Objetivo

Antes de construir frenos sobre hooks hay que saber como se comportan de verdad en la plataforma de Carlos. Inspirado en gemba-app/brakes (Apache-2.0): se toman ideas, no codigo.

## Criterios de aceptacion
- [x] Documentado contra la documentacion oficial vigente: entrada JSON de Stop y PreToolUse, efecto de exit code 2, uso de stderr como respuesta al agente, campo stop_hook_active y forma de declarar hooks dentro de un plugin (hooks/hooks.json)
- [ ] Un hook de plugin escrito en Node sin dependencias se ejecuta en Windows nativo (PowerShell tool y Git Bash) y en Linux; verificado en el CI de Windows con un step que asevera cada hipotesis
- [x] Comprobado que un Stop hook que devuelve exit 2 hace que el agente siga trabajando y que stop_hook_active evita el bucle infinito
- [x] Comprobado que un PreToolUse sobre Bash puede bloquear un comando concreto (git merge) y que el agente recibe el motivo
- [x] Resultado en docs/spikes/ con cada hipotesis marcada como confirmada o refutada y la evidencia

## Resultado

**Implementado.** Sonda de hooks inerte por defecto (`hooks/sonda-hooks.mjs`, Node sin
dependencias, forma exec) declarada en `hooks/hooks.json` del plugin para Stop y PreToolUse
(matcher `Bash|PowerShell`); test determinista `hooks/test/sonda-hooks.test.sh` (16 casos); steps
de CI H1, H2 (Linux y Windows) y H2b (cmd.exe); regla `*.sh text eol=lf` en `.gitattributes`;
informe en `docs/spikes/TASK-069-resultado.md`.

**Evidencia.** H1 confirmada en local (`claude plugin validate`, Windows). H2 confirmada en Linux
(VM del bridge) y en uso real en Windows nativo. H3, H4, H5 y H6 confirmadas el 2026-11-03 con
Claude Code 2.1.317 sin interfaz (`claude -p --plugin-dir`) en un repo temporal: el Stop con exit 2
devuelve al agente al trabajo y `stop_hook_active` corta el bucle; el PreToolUse bloquea
`git merge` por Bash y por PowerShell, el agente recibe el motivo literal, y tambien dentro de un
subagente (`agent_id` en la entrada). Suite del plugin: 1607/1613; los 6 rojos son ajenos (los 3
conocidos de Windows, uno de tiempo de `origin-deteccion` que aislado pasa, y dos «contraprueba de
descubrimiento» rotos por el aviso `✘ README missing` de `claude plugin validate` desde Claude Code
2.1.316).

**Criterio 2 sin marcar.** El hook corre en Windows nativo y en Linux, pero «verificado en el CI de
Windows» no se ha podido cumplir: no hay conexion con `origin` y la rama no se ha subido, asi que
los steps H1/H2/H2b no se han ejecutado nunca en CI. H2b ademas va con `continue-on-error: true`:
su resultado hay que mirarlo a mano en el primer CI de Windows.

**Revision por pares.** Ronda 1 (cambios-solicitados): IMP-1 la regex de merge bloqueaba
`git merge-base`, que usa `taskctl start` → corregido (`merge(?![\w-])`, soporte de `-C`, tests);
MEN-1 entrada `null` hacia fallar la sonda → corregido; MEN-2 mutantes supervivientes → corregido;
MEN-3 H2b sin verificar → aceptado y documentado; MEN-4 estado de H1 y limitaciones → corregido.
Ronda 2 (aprobada-con-correcciones), aceptados sin corregir: MEN-5, mutantes que aun sobreviven
(guard de evento en `stop2`, guards de objeto/array equivalentes, contenido del campo `salida` del
registro sin aserción); MEN-6, limites de la regex (`git -C "a b"`, `--no-pager`, `git.exe`,
mayusculas, y falsos positivos `git merge.ff` y `echo git merge`). Motivo: la sonda es inerte y la
sustituyen TASK-071/072, que deben resolver o aceptar por escrito esos limites (anotados en
«Implicaciones» del informe).

**Fuera de alcance, candidatas a tarea propia.** `create-feature.sh` sale 0 si falla el `source`;
`taskctl start` lento sobre el bridge; las dos contrapruebas de descubrimiento rotas por el
validador de Claude Code 2.1.316+.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-03T10:04:15Z | plan | automatico | persona |
| 2026-11-03T10:54:57Z | approve | automatico | persona |
| 2026-11-03T11:14:07Z | start | automatico | persona |
| 2026-11-03T12:48:47Z | review | automatico | persona |
| 2026-11-03T13:11:04Z | review | automatico | persona |
| 2026-11-03T13:33:23Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-03T13:05:10Z | revision | agente:afd2b476e340883e0 | 42 | 112542 | 1952147 | 11675 | 3 | 2076406 |
| 2026-11-03T13:21:10Z | revision | agente:aedebfdb5cfde4998 | 18 | 102736 | 760229 | 6834 | 2 | 869817 |
