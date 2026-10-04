# Plan — TASK-038: Una sola deteccion de origin por invocacion, con timeout

**Desviacion documentada:** sin brainstorm; el diseno esta especificado en
`docs/auditoria/PLAN-SOLUCION-2026-10-03.md` (F2-T2) y en el informe de Git de
la auditoria.

## Enfoque propuesto

- `_gf_ls_remote ARGS...` en `_gitflow-common.sh`: `git ls-remote` con
  `GIT_TERMINAL_PROMPT=0` (nunca espera credenciales) y limite de
  `GF_TIMEOUT_REMOTO` segundos (5 por defecto) via `timeout` de coreutils. Solo
  se usa `timeout` si responde a `--version`: en Windows el `timeout.exe` de
  cmd tiene otra sintaxis y haria fallar siempre la consulta. Sin `timeout`
  (macOS sin coreutils), consulta sin limite, como hoy.
- `detect_origin_available [aviso]`: cachea por invocacion (`GF_ORIGIN_DETECTADO`);
  sin origin configurado no consulta la red; el aviso es parametrizable para
  conservar los textos de cada script. Las 7 copias en linea (`update-feature`,
  `update-fix`, `update-hotfix`, `update-release`, `create-hotfix`,
  `create-release`, `start-work`) pasan a llamarla.
- `resolve_main_branch`: una sola consulta (`--heads origin main master`), y
  ninguna si ya se sabe que origin no responde.
- El resto de `git ls-remote` de los scripts pasa por `_gf_ls_remote`.
- `invoke_merge_work_branch_to_develop`, con origin configurado pero caido:
  **aviso explicito, no aborto** (divergencia del criterio, decidida por el
  orquestador): en `main` se aborta porque el tag se crearia sobre una `main`
  obsoleta; en `develop` no hay tag y abortar bloquearia cualquier `finish` con
  la VPN caida. El aviso dice que la `develop` local puede estar desfasada y
  que hay que sincronizar al volver la red.

## Riesgos aceptados y que los contiene

- Un remoto lento de verdad (mas de 5 s) se trata como caido: se avisa y se
  sigue en modo local; `GF_TIMEOUT_REMOTO` lo ajusta.

## Plan de pruebas

- Test con origin inalcanzable (`http://10.255.255.1:9/x.git`): el script
  responde en menos de 10 s y avisa.
- Test de la cache: `detect_origin_available` dos veces = una consulta (contada
  con `GIT_TRACE2_EVENT`).
- Test de la guarda de `develop`: con origin configurado y caido, el merge se
  hace y avisa.
- `test/gitflow/` y los tests de comandos con scripts reales, en verde.

## Lo que necesita decision de una persona

Nada nuevo: la divergencia de `develop` se puede revertir a aborto si Carlos
lo prefiere.
