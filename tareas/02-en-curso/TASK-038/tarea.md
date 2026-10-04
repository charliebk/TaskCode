---
id: TASK-038
titulo: "F2-T2 Una sola deteccion de origin por invocacion, con timeout"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-038-f2-t2-una-sola-deteccion-de-origin-por-i
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

Que cada invocacion de un script de Git-Flow pregunte a `origin` una sola vez
y nunca espere mas de unos segundos (auditoria del 2026-10-03, B2 y D9). Hoy
`detect_origin_available` esta reimplementada en linea en 7 scripts, cada
`git ls-remote` espera lo que tarde la red (con la VPN caida, del orden de
30 s) y puede quedarse esperando credenciales, y `resolve_main_branch` hace
dos consultas mas. Ademas, `merge-feature-to-develop.sh` no distingue «origin
configurado pero caido» de «sin origin».

## Criterios de aceptacion
- [x] `detect_origin_available` cachea su resultado por invocacion; `update-feature.sh` deja de reimplementarla
- [x] `git ls-remote` con limite de 5 s, portatil en Git Bash y Linux
- [x] `merge-feature-to-develop.sh` aplica la guarda de origin configurado pero caido (como aviso, no como aborto: ver Resultado)
- [x] Test con un origin inalcanzable: el comando responde en menos de 10 s

## Resultado

**Implementado.** `_gf_ls_remote` en `_gitflow-common.sh`: `git ls-remote` con
`GIT_TERMINAL_PROMPT=0` y limite de `GF_TIMEOUT_REMOTO` s (5 por defecto) via
el `timeout` de coreutils, que solo se usa si responde a `--version` (en
Windows tambien existe el `timeout.exe` de cmd, con otra sintaxis). Todas las
consultas a remotos de los 15 scripts pasan por ahi. `detect_origin_available`
cachea por invocacion, no consulta la red sin origin configurado y acepta el
aviso como parametro: sustituye a las 7 copias en linea (`update-feature`,
`update-fix`, `update-hotfix`, `update-release`, `create-hotfix`,
`create-release`, `start-work`), cada una con su texto de siempre.
`resolve_main_branch` hace una consulta para `main` y `master`, y ninguna si ya
se sabe que origin no responde.

**Divergencia del criterio 3, decidida por el orquestador:** en el merge a
`develop`, «origin configurado pero caido» **avisa y no aborta**. En `main` si
se aborta porque el tag se crearia sobre una `main` obsoleta; en `develop` no
hay tag y abortar bloquearia cualquier cierre con la VPN caida. El aviso dice
que la `develop` local puede estar desfasada y que hay que sincronizar al
volver la red. Reversible a aborto si se prefiere.

**Medicion (Windows).** Un `git ls-remote` contra un origin que no responde
(TEST-NET-1): 21,3 s sin limite, 2,2 s con `timeout 2`. `update-feature.sh`
completo con origin caido: **22,9 s → 6,6 s** (limite por defecto, 5 s).

**Pruebas.** `test/gitflow/origin-deteccion.test.ts` (4): origin inalcanzable
responde en segundos y avisa; una sola consulta por invocacion (contada con
`GIT_TRACE2_EVENT`); ninguna sin origin; el merge a `develop` con origin
caido se hace y avisa. Mutante (quitar la cache): rojo. `test/gitflow/` +
`start` + `finish` + `wrappers`: 128/128.
