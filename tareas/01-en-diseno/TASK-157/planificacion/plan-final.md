# Plan — TASK-157: Timeout de claude plugin list acorde al binario real

(Modo rapido: plan redactado por quien coordina, sin brainstorm. Con un solo
rol no hay unificador ni desacuerdos que resolver; en su lugar, el plan senala
lo que no se cubre.)

## Enfoque propuesto

Duracion estimada: 25 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, 1 de test, una capa)

- `TIMEOUT_MS` de `src/core/plugin-instalado.ts` pasa de 5000 a 30000 ms. Medida
  real en Windows (TASK-155): `claude plugin list --json` tarda ~18 s con el
  `claude.exe` instalado; 30 s deja margen sin que `taskctl plan` se quede
  colgado indefinidamente si `claude` no responde. El motivo va en un
  comentario junto a la constante.
- `comprobarSkillInstalado` se llama una sola vez por `plan` (solo si el skill
  ganador es externo), asi que el coste extra es acotado.

## Lo que el rol no cubrio

- Hacer el timeout configurable en `.taskcode/config.yml`: nadie lo ha pedido;
  si 30 s se queda corto en otra maquina, sera otra tarea.

## Riesgos aceptados y que los contiene

- Si `claude` se cuelga, `plan` espera hasta 30 s en vez de 5 antes de avisar
  con «no se ha podido comprobar»: aceptable frente a no verificar nunca.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 2: en `test/integracion/plugin-instalado.test.ts`, el doble de
  TASK-155 admite una espera; un `claude` que tarda ~6 s (en Windows `ping -n 7`
  en el `.cmd`, fuera `sleep 6`) da `instalado`. Se comprueba antes del cambio
  que con 5000 ms da `no-verificable`.
- Criterio 1: lo cubre el mismo test (falla si el timeout vuelve a 5 s).
- Criterio 3: prueba a mano con el `claude` real y
  `RAMA_BASE=develop node scripts/verificar-impacto.mjs`.

## Reutilizacion

- El doble `conClaudeDoble` de TASK-155 en el mismo fichero de test, ampliado
  con un parametro de espera; nada nuevo en `src/`.

## Lo que necesita decision de una persona

Nada.
