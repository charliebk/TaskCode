# Plan — TASK-125: Freno Stop con presupuesto de tiempo y clave propia: si se pasa, anota y no bloquea

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 75 min (de la rama abierta al cierre con merge; senales: 4 ficheros de codigo, 3 de tests, skill, README/docs y CHANGELOG, 6 criterios)

No se trocea: decision de Carlos del 2026-11-13.

1. `core/config.ts`: dos claves nuevas.
   - `comando_verificacion_freno` (comando, como los demas; null por defecto).
     Exige `comando_verificacion` (la completa sigue siendo la puerta).
   - `presupuesto_freno_s` (entero positivo, null por defecto). Mayor que
     `TECHO_HOOK_STOP_S` (3600, el `timeout` del hook Stop en hooks.json)
     aborta. Se admite sola: pone tope a la verificacion de siempre.
   - Funcion `presupuestoFreno(cfg)`: la clave si esta; 180 si solo hay
     `comando_verificacion_freno`; null sin ninguna (sin tope propio).
   - `TECHO_HOOK_S` de freno-stop pasa a reexportar `TECHO_HOOK_STOP_S`
     (el test que lo compara con hooks.json sigue valiendo).
2. `fs/verificacion.ts`: tipo nuevo `freno` con su propio memo
   (`freno-verificacion-rapida.json`): un verde del comando rapido nunca abre
   la puerta del guardian ni pisa los memos de completa/selectiva. Base
   opcional: si viene, va en `RAMA_BASE` y en la huella. Su memo se guarda
   tambien con el arbol sucio (nadie mas lo lee).
3. `hooks/freno-stop.ts`, tras decidir el plan (la documentacion se decide
   igual que hoy):
   - con `comando_verificacion_freno` y plan completa o selectiva, corre ese
     comando (tipo `freno`, base: la de la selectiva o la del tipo de la
     tarea si se resuelve sin red; si no, `rama_base`);
   - timeout efectivo = minimo de (timeout del plan, presupuesto), y el tope
     del hook. Con el comando rapido, el timeout es el presupuesto.
   - si la verificacion sale `cortada` y el corte lo puso el presupuesto:
     no bloquea; sale 0 con una linea de aviso y anota `excedido` (u
     `omitido` si vino del memo, como en TASK-111).
   - un rojo dentro del presupuesto bloquea como hoy; un corte por
     `timeout_verificacion*` menor que el presupuesto sigue siendo rojo.
4. `commands/doctor.ts`: comprobacion nueva `puertas-verificacion` (solo con
   `comando_verificacion`): que comando corre el freno (y su presupuesto o
   «sin presupuesto»), review (selectiva o «no verifica») y finish
   (completa, y la selectiva con `rutas_verificacion_parcial`).
5. Docs: README del plugin (tabla de claves) y docs/configuracion.md,
   verificacion-selectiva.md de la skill task-workflow (seccion del reparto
   por puerta) y una frase en su SKILL.md; CHANGELOG.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Un turno excedido deja parar sin verde: lo pide la tarea; review y finish
  siguen verificando con sus comandos.
- Un `cortada` por presupuesto queda en el memo del tipo: el mismo arbol se
  da por excedido sin volver a ejecutar (como un rojo de memo).

## Plan de pruebas

- `test/core/config`: claves validas, presupuesto 0/no entero/3601 abortan,
  freno sin completa aborta, `presupuestoFreno` (180 por defecto, la clave,
  null sin ninguna).
- `test/hooks/freno-presupuesto` (repo temporal, script real): con la clave el
  freno corre el comando rapido y no la selectiva ni la completa; sin ella,
  la selectiva como hoy (regresion); comando mas lento que el presupuesto ->
  0, una linea, `excedido`; rojo dentro del presupuesto -> 2 y `rojo`; el
  verde del comando rapido no deja memo de completa (no abre el guardian).
- `test/commands/doctor` (o verificacion-selectiva.test): la comprobacion
  nueva con y sin claves.
- Skill: test de que verificacion-selectiva.md explica las dos claves.
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.
