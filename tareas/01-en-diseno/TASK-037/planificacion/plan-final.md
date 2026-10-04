# Plan — TASK-037: Logging de los scripts de Git-Flow sin lanzar procesos

**Desviacion documentada:** `plan` pidio 1 rol; no se lanza porque el diseno ya
esta especificado y medido en `docs/auditoria/PLAN-SOLUCION-2026-10-03.md`
(F2-T1) y en el informe de rendimiento de la auditoria.

## Enfoque propuesto

- `_gitflow-common.sh`: helpers `_gf_hora VAR FORMATO` y `_gf_epoch VAR` que, con
  bash >= 4.2 (`BASH_VERSINFO`), usan `printf -v VAR '%(FORMATO)T' -1` y
  `EPOCHSECONDS` si existe; con bash anterior, caen a `date`.
- `_do_log` deja la linea en la variable global `GF_LINE` (sin stdout) en vez
  de devolverla por stdout; `log_info/ok/warn/error` imprimen `GF_LINE`. Se
  acaba el subshell `$(_do_log ...)` por linea.
- `initialize_gitflow_log` y `log_summary` usan los helpers para su `date`.
- Ningun otro script llama a `_do_log` (comprobado con grep): la interfaz
  publica (`log_*`) no cambia.

## Riesgos aceptados y que los contiene

- bash 3.2 (macOS): la caida a `date` mantiene el comportamiento de hoy.
- `printf '%(...)T'` y el formato de fecha: mismo formato que `date`; un test
  compara la forma de la linea con una expresion regular.

## Plan de pruebas

- Tiempo de `initialize_gitflow_log` + 20 `log_info` antes (3,65 s medido) y
  despues, y de `update-feature.sh` en un repo temporal; anotados en el Resultado.
- Test: la salida de `log_info` y la linea del fichero de log tienen la forma
  `[AAAA-MM-DD HH:MM:SS] [INFO ] mensaje`; la caida a `date` se fuerza
  simulando una version antigua y da la misma forma.
- `test/gitflow/` en verde.

## Lo que necesita decision de una persona

Nada.
