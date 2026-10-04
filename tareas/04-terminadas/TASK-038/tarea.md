---
id: TASK-038
titulo: "F2-T2 Una sola deteccion de origin por invocacion, con timeout"
tipo: feature
sprint: 3
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
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

**Revision ronda 1: cambios-solicitados** (1 importante, 4 menores; suite
completa 912 tests, solo los 3 rojos conocidos; 4 mutantes, los 4 en rojo).
- IMP-1, corregido: en `push-back-to-remote.sh --mirror`, si una consulta de la
  vista previa expiraba, la lista de ramas salia vacia, la vista previa decia
  «nada que borrar» y `push --mirror` borraba de verdad esas ramas del destino
  (reproducido por el revisor con repos reales). Ahora la lista de ramas del
  destino se pide una vez, con su codigo de salida comprobado, y se aborta si
  falla; igual los tags. De paso, el paso 5 deja de hacer una consulta por
  rama. Test con un `uploadpack` que se vuelve lento: pasa con la correccion y
  falla con el script de la ronda 1.
- MEN-1, corregido: 5 scripts resolvian la rama principal antes de detectar
  origin y hacian dos consultas (~12 s con la red caida); ahora detectan antes.
- MEN-2, corregido: el umbral del test baja de 20 s a 12 s (limite 2 s).
- MEN-4, corregido: un `GF_TIMEOUT_REMOTO` que no es un numero positivo avisa y
  usa 5, en vez de dejarlo todo en modo local sin decirlo.
- MEN-3, sin corregir: un timeout se lee como «la rama no esta en origin» en
  los `_gf_ls_remote ... | grep -q` (p. ej. `recover-branch`). El mensaje
  engana pero no se pierde nada; distinguirlo pide tocar cada llamador.

**Revision ronda 2: aprobada** (solo el delta; 0 criticos, 0 importantes, 3
menores; `test/gitflow/` 45/45). Sin corregir, documentados:
- R2-MEN-1: no hay test para la lista de tags del mirror. Impacto bajo: el
  `fetch --prune --tags` previo ya trae los tags; el revisor comprobo a mano
  que la rama aborta bien con la lista de tags lenta.
- R2-MEN-2: ningun test fija que `detect_origin_available` vaya antes de
  `resolve_main_branch` (la correccion de MEN-1); el revisor midio 1 consulta
  frente a 2 con un `uploadpack` que las cuenta.
- R2-MEN-3, aceptado: el `.` de un nombre de rama actua como comodin en el
  grep del paso 5; inofensivo (`rev-list` da 0 y la rama no sale divergente).
