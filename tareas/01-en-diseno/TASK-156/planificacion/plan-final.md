# Plan — TASK-156: verificar-impacto elige los tests que leen los md de skills, agents y docs del plugin

(Modo rapido: plan redactado por quien orquesta, sin brainstorm. El rol de
arquitectura propuesto por `taskctl plan` no se lanza: el cambio es de un
solo fichero de script y su test, y el enfoque se valido antes midiendo con
`--listar` sobre el repo real.)

## Enfoque propuesto

Duracion estimada: 45 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo, `scripts/verificar-impacto.mjs`, mas su test; 1 capa; 4 criterios).

Diagnostico medido: un `.md` cambiado bajo `skills/` del plugin no es
documentacion para el script (no esta en la raiz del plugin) y cae en la rama
«ficheros que los tests usan sin importarlos», que elige por el **nombre** del
fichero. Con `skills/task-workflow/verificacion-selectiva.md` elegia 3 tests
(los que lo nombran) y dejaba fuera `test/skills/task-workflow.test.ts`, que
lee todas las skills recorriendo la carpeta. Con `SKILL.md` es peor: lo nombra
media suite por motivos ajenos, o nadie.

Cambio en `scripts/verificar-impacto.mjs`:

1. `CARPETAS_LEIDAS`: por carpeta del plugin (`skills`, `agents`, `docs`), el
   patron con el que un test la lee entera: `'skills'` o `skills/`;
   `'agents'` o `agents/`; para `docs`, solo `PLUGIN_ROOT, 'docs'` (medido:
   `'docs'` a secas aparece en 50 tests, casi todos para sus repos temporales;
   los que leen el `docs/` del plugin por nombre de fichero ya los elige el
   nombre).
2. En `seleccionar`, un fichero del plugin bajo una de esas carpetas elige la
   **union** de los que mencionan su nombre (como hasta ahora) y los tests que
   leen su carpeta. Union y no sustitucion: no se pierde nada de lo que hoy
   se elige.
3. En `proximidad` (orden bajo tope), `skills/<x>/f.md` cuenta como cercano a
   `test/skills/` (p = 2), igual que `scripts/gitflow/` a `test/gitflow/`: con
   el tope del freno, primero entran los de `test/skills/`.
4. Cabecera del script: la regla nueva en la lista del paso 2 y el ejemplo de
   proximidad.

Efecto medido en el repo real (`TIPO_VERIFICACION=selectiva`, un `.md` de
`skills/task-workflow/` cambiado): 29 ficheros, con los 9 de `test/skills/`
que leen la carpeta, `task-workflow.test.ts` incluido.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa: el mecanismo de `MARCADORES` (patron sobre el texto
del test) y la busqueda por nombre de la misma rama de `seleccionar`; la
funcion `proximidad` y su escala 0..3; en el test, la plantilla `conRepo`, el
mapa `FICHEROS`, `cambiarYCommitear` y `listar` de
`test/scripts/verificar-impacto.test.ts`. Nuevo: solo la tabla
`CARPETAS_LEIDAS` y su helper `carpetaLeida`. No se reutiliza `MARCADORES` tal
cual porque alli un marcador **sustituye** a la busqueda por nombre, y aqui
hace falta la union.

## Lo que el rol no cubrio

No aplica (sin rol). Fuera de alcance: los `.md` de la raiz del plugin
(README) siguen siendo documentacion, como decidio TASK-122.

## Riesgos aceptados y que los contiene

- Mas tests por un cambio de skill (22 leen `skills`): con
  `TIPO_VERIFICACION=selectiva` es lo que se busca (sin tope); con el freno,
  el tope y la proximidad recortan a los de `test/skills/` primero.
- Un test que lea el `docs/` del plugin con otro identificador que
  `PLUGIN_ROOT` y sin nombrar el fichero no se elige; hoy no hay ninguno
  (medido) y la completa antes de publicar lo cubre.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterios 1-3: 1 test nuevo en `test/scripts/verificar-impacto.test.ts`
  con cuatro casos sobre el repo miniatura (un `.md` de skill nombrado por
  otro test → union; `SKILL.md` que nadie nombra → el lector de la carpeta y
  no la suite entera; `agents/` → su lector; `docs/` del plugin → el que lee
  `PLUGIN_ROOT, 'docs'` y no el que usa `'docs'` en su repo temporal) mas el
  orden bajo tope. Mutacion: con los lectores vaciados, el test cae en rojo.
  Ninguno pesado.
- Criterio 1 (repo real): `--listar` con un `.md` de skill cambiado, anotado
  en el Resultado.
- Criterio 4: lectura de la cabecera en la revision.

## Lo que necesita decision de una persona

Nada.
