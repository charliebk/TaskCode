# Plan — TASK-133: Rojos de la suite completa de la 0.16.0 y publicacion de la 0.16.1

(Modo rapido: el plan lo redacta el coordinador, sin roles; los dos arreglos
ya estan hechos en el stash `arreglos-suite-0.16.0`.)

## Enfoque propuesto

Duracion estimada: 20 min (de la rama abierta al cierre con merge; senales: 0 ficheros de codigo, 1 test, 1 skill, 4 criterios)

1. Tras `taskctl start`, `git stash pop` del stash `arreglos-suite-0.16.0`:
   - `test/commands/revision-lecturas.test.ts`: `registrar-coste` con dos
     agentes ya no hace commit (TASK-119 lo quito); la asercion espera
     `antes` commits, no `antes + 1`.
   - `skills/task-workflow/SKILL.md`: enlaza `poda-tests.md` (anexo de
     TASK-130 que nadie leia) y acorta la linea de selectiva para no pasar
     de 15 KB.
2. Verificar con los tests afectados y `test:rapido`.
3. Publicacion: por decision de Carlos (2026-11-13) la 0.16.1 sale **tras
   TASK-134**, una sola vez y con las dos tareas dentro. Los criterios 3
   (suite completa) y 4 (publicacion) se comprueban entonces sobre
   `develop` y se anotan en el `Resultado` de esta tarea.

## Riesgos aceptados y que los contiene

- El stash se hizo sobre 0.16.0 y `develop` solo ha cambiado en tareas/docs
  desde entonces: el pop aplica limpio. Si no, se reaplica a mano (2 lineas).

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 0 (se corrige la asercion existente).
- Criterio 2: 0 (los tests de skills ya comprueban enlaces y tope de bytes).
- Criterio 3: 0 (suite completa antes de publicar).
- Criterio 4: 0 (publicacion).

## Lo que necesita decision de una persona

Nada: publicar juntas 133 y 134 como 0.16.1 ya esta decidido.
