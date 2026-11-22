# Plan — TASK-141: Auditoria 4D inicial: reconocimiento completo del codigo existente

Redactado por el coordinador (modo rapido, sin brainstorm: la tarea solo lee
y documenta, con el mismo metodo que la auditoria de TASK-137 ampliado a
todo el codigo).

## Enfoque propuesto

Duracion estimada: 180 min (de la rama abierta al cierre con merge; senales:
0 ficheros de codigo, 1 informe nuevo, ~46.000 lineas de codigo y ~58.000 de
tests que leer, 4 criterios, N tareas de seguimiento)

1. **Mapa** (coordinador): lineas por area con `git ls-files | xargs wc -l`,
   responsabilidad de cada area en una frase. Excluidas con motivo: `dist/`
   (generado por `tsc`), `node_modules/`, `tareas/` y `docs/` (historico y
   documentacion, no codigo), `test/fixtures/` (datos).
2. **Reparto en 10 agentes de solo lectura, en paralelo, mismo formato de
   fila** (`ID | Area | D | fichero:linea | evidencia | severidad |
   confianza`). Cada agente recibe la definicion de la Regla 4D
   (`skills/task-workflow/revision.md`), la lista de casos ya conocidos
   (A1..A13 de `docs/auditoria-4d.md` y TASK-138..140) para no repetirlos, y
   la consigna de buscar tambien duplicados contra el resto del repo (con
   `grep`) antes de reportar una funcion como unica:
   - core-1: `src/core` de la a a la l
   - core-2: `src/core` de la m a la z
   - commands-1: `src/commands` de la a a la l
   - commands-2: `src/commands` de la m a la z
   - fs-hooks-cli: `src/fs`, `src/hooks`, `src/cli`, `src/*.ts`
   - scripts: `scripts/` del plugin (gitflow incluido) y `scripts/` de la raiz
   - contenido: `skills/`, `agents/`, `hooks/` (duplicacion de texto entre
     skills, instrucciones que se contradicen, skills que aparentan una
     comprobacion que nada hace)
   - tests-commands: `test/commands`
   - tests-core: `test/core`, `test/fs`
   - tests-resto: `test/hooks`, `test/gitflow`, `test/integracion`,
     `test/skills`, `test/helpers`, `test/cli`, el resto
   Los agentes de tests buscan sobre todo disfraz (aserciones que no
   distinguen el comportamiento, tests que no ejecutan lo que nombran,
   `skip` silenciosos) y duplicacion de helpers de test.
3. **Consolidacion y verificacion** (coordinador, distinto de los agentes):
   cada caso de confianza alta se vuelve a abrir en el codigo; los que no se
   sostienen se descartan y se cuentan. Mutacion: al menos 5 tests
   sospechosos de disfraz, rompiendo en una copia de `dist/` (scratchpad,
   como en TASK-137) el codigo que dicen probar y ejecutando solo ese test;
   resultado (rojo/verde) anotado por test.
4. **Informe** `docs/auditoria-4d-completa.md`: mapa, metodo, tabla de
   casos, resultado de la mutacion, descartados, resumen por area y
   conclusion. `docs/auditoria-4d.md` gana una linea que remite al nuevo.
5. **Seguimiento**: `taskctl new` agrupando por D y area (no una por caso);
   la columna `seguimiento` de cada fila nombra su tarea. Los que caen en el
   alcance de TASK-138..140 se anaden a esas tareas (su criterio o su
   Objetivo) en vez de crear otra.

## Troceo

No se trocea, aunque pasa de 60 min: lo decidio la persona («no importa el
tiempo, es necesario», 2026-11-22). Motivo tecnico: la consolidacion y la
deteccion de duplicados entre areas necesitan ver todas las areas juntas;
trocear por areas partiria justo los casos entre areas.

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- **Ruido**: agentes que inflan casos. Lo contiene la verificacion del
  coordinador y la regla de evidencia (fichero:linea y la incoherencia que
  produciria tocar una copia y no la otra).
- **Huecos**: un area poco leida. Cada agente declara que ficheros leyo; el
  mapa marca el area como auditada solo si los cubre todos.
- **Desviacion propia**: la tentacion de corregir al paso. No se toca codigo;
  el diff de la tarea es solo `docs/` y `tareas/`.

## Plan de pruebas

Tests nuevos por criterio: 0 en los cuatro. Motivo: la tarea no cambia
codigo; su comprobacion es el propio informe (criterio 3: verificacion por
el coordinador y mutacion de al menos 5 tests). La verificacion por impacto
no tiene codigo que seleccionar; se ejecuta `test:rapido` una vez para
confirmar que no se ha roto nada.

## Lo que necesita decision de una persona

Nada abierto: tipo `feature`, informe aparte y no trocear quedan decididos.
