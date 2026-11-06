# Peticion de revision — TASK-079 (ronda 2)

- Tarea: TASK-079 — Revisor por pares de dominio para Rust y WASM
- Rama revisada: feature/task-079-revisor-por-pares-de-dominio-para-rust-y
- Rama base: develop
- Commit revisado (HEAD): 829cb646c68b3185fb9df8ffde6e112cccffb260
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-079 (criterios de aceptacion y plan)
- Revision incremental: solo los cambios desde b554c67ac6ab1504ebe5cfa74248c52872846910 (el commit revisado en la ronda anterior)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-2.md), sin borrar la
peticion.

## Hallazgos de la ronda 1 que siguen abiertos

Comprueba que cada uno queda resuelto por los cambios de esta ronda, y que la
correccion no abre otro fallo: es justo donde se cuelan.

| ID | Severidad | Estado | Fichero | Informe |
|---|---|---|---|---|
| MEN-2 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (`Instant` en wasm32 compila y falla en ejecucion; la skill dice que no compila) | informe-revision-1.md |
| MEN-3 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (un panic no deja el modulo inservible; faltan `console_error_panic_hook` y `JsError`) | informe-revision-1.md |
| MEN-4 | MENOR | abierto | skills/rust-wasm-reviewer/SKILL.md (`.rustfmt.toml` y `.clippy.toml` con punto, hueco sin documentar) | informe-revision-1.md |
| MEN-6 | MENOR | abierto | CLAUDE.md, scripts/catalogo-skills.yml (recuentos de skills desfasados) | informe-revision-1.md |

## Commits a revisar (git log b554c67ac6ab1504ebe5cfa74248c52872846910..HEAD)

````
829cb64 fix(TASK-079): correcciones de la ronda 1 (MEN-2, MEN-3, MEN-4, MEN-6)
85bb5ea chore(TASK-079): veredicto ronda 1 (cambios-solicitados)
71110da chore(TASK-079): coste revision +4026078 tokens (1 agente)
e60cb58 chore(TASK-079): informe de revision ronda 1
7ee6419 chore(TASK-079): peticion de revision ronda 1
````

## Diff desde la ronda anterior (git diff b554c67ac6ab1504ebe5cfa74248c52872846910..HEAD)

````diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 54002b0..5d87fd4 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -48,8 +48,9 @@ approve | start | review | finish [--tag <nombre>] [--merge-request] [--sin-veri
 recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
 cerradas.
 
-El plugin además **expone contenido a Claude Code**: cinco skills
-(`task-workflow` y los cuatro revisores por dominio) y cuatro agentes (los
+El plugin además **expone contenido a Claude Code**: sus skills
+(`task-workflow`, las de cada fase, `doctor-deploy` y cinco revisoras: cuatro
+de dominio y el genérico `code-quality-reviewer`) y cuatro agentes (los
 roles del brainstorm), más `scripts/heuristica-complejidad.yml`. Todo eso se
 instala en proyectos que **no son este**, así que ninguno de esos ficheros
 puede mencionar TaskCode, sus rutas ni sus documentos internos — hay tests
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
index 4a59ce1..556397c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
@@ -83,8 +83,9 @@
 # este mismo repo (y en cualquier proyecto que instale el plugin) es la
 # skill de ejecucion mas relevante siempre que exista la carpeta `tareas/`.
 #
-# CONTENIDO INICIAL - alcance de TASK-017. Las cinco entradas de abajo son
-# los cinco skills que YA trae `taskcode-plugin` (carpeta `skills/`), leidos
+# CONTENIDO INICIAL - alcance de TASK-017 (TASK-079 anadio la sexta,
+# rust-wasm-reviewer). Las cinco entradas de entonces eran
+# los cinco skills que YA traia `taskcode-plugin` (carpeta `skills/`), leidos
 # de su SKILL.md real. Ningun rol del brainstorm de disenio propuso que
 # skills externos entrar en esta primera version (quedo anotado en
 # plan-final.md como hueco de dominio, sin rol de especialista lanzado esa
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
index 01c2661..712e959 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -101,6 +101,10 @@ Quedan fuera a proposito, aunque un proyecto Rust y WASM tambien los toque:
   cliente) — no hay sufijo ni carpeta que lo distinga de cualquier otro
   `.ts`. Lo revisa el generico; pero si el diff cambia el contrato del
   limite, este revisor lo pide como contexto (ver la regla de abajo).
+- `.rustfmt.toml` y `.clippy.toml` con punto delante — rustfmt y clippy los
+  leen igual que sin punto, pero son la variante menos comun. Si el proyecto
+  los usa, un cambio en ellos cae al generico; no cambian el codigo, solo como
+  se formatea o que lints se aplican.
 - `.cargo/config` sin extension — el nombre antiguo de `.cargo/config.toml`.
   Igual que `rust-toolchain`: si el proyecto aun lo usa, cae al generico.
 - `deny.toml` — la configuracion de `cargo-deny` (licencias, avisos de
@@ -147,9 +151,13 @@ cada llamada) casi nunca se ve leyendo: se ve ejecutando.
 2. **Compilar con el lockfile**: `cargo build --locked` (y `--release` si el
    cambio toca rendimiento). Si el proyecto compila a WebAssembly, tambien
    para ese objetivo: `cargo build --locked --target wasm32-unknown-unknown`,
-   o el comando de `wasm-pack` que use el proyecto. Muchos errores (una
-   dependencia que no compila para `wasm32`, un `std::time::Instant` que
-   alli no existe) solo salen ahi. Si no compila, ahi acaba la revision.
+   o el comando de `wasm-pack` que use el proyecto. Algunos errores (una
+   dependencia que no compila para `wasm32`, una funcion de `std` que ese
+   objetivo no tiene) solo salen ahi. Si no compila, ahi acaba la revision.
+   Ojo: otros compilan limpios y fallan al ejecutar en `wasm32` —el caso
+   tipico es `std::time::Instant::now()`, que hace `panic`—; esos solo los
+   encuentra el paso 4 con los tests de WebAssembly o una llamada real desde
+   JavaScript, no el build.
 3. **Pasar el formateo y los lints**: `cargo fmt --check` y
    `cargo clippy --all-targets --locked -- -D warnings`, con los lints que
    el proyecto ya tenga configurados. Un aviso nuevo de clippy no es por si
@@ -205,9 +213,14 @@ fuera de rango, geometria degenerada) se devuelven con `Result` y un tipo de
 error que conserve la causa y permita al llamador decidir; no con `panic`.
 En codigo de biblioteca y en todo lo que se exporta a WebAssembly, `unwrap`,
 `expect` y `panic!` sobre datos que vienen de fuera son un defecto: en
-`wasm32-unknown-unknown` un `panic` aborta la instancia entera, y el
-JavaScript que llama recibe un `RuntimeError: unreachable` sin contexto, con
-el modulo inservible hasta que se recarga. Se aceptan en tests, en
+`wasm32-unknown-unknown` un `panic` aborta la llamada con un
+`RuntimeError: unreachable` sin contexto (solo `console_error_panic_hook`, si
+el proyecto lo instala, deja el mensaje en la consola), y la instancia sigue
+invocable pero con su estado posiblemente inconsistente: objetos exportados a
+medio modificar, prestamos de `wasm_bindgen` que no se liberaron. Lo que se
+espera es que la funcion exportada devuelva `Result<_, JsError>` (o
+`Result<_, JsValue>`) y que JavaScript reciba una excepcion con mensaje. Se
+aceptan en tests, en
 invariantes que el propio tipo garantiza (y entonces con un `expect` que diga
 cual), y en el arranque de un binario. Que el error no se convierta en texto
 demasiado pronto: comparar cadenas de error en vez de variantes es fragil.
@@ -297,8 +310,8 @@ mutacion.
 contrario de lo que dice:
 
 - Un `unwrap` o un indexado sobre datos de entrada en una funcion exportada a
-  WebAssembly, con una entrada real que lo dispara: el modulo aborta y la
-  aplicacion queda inservible hasta recargar.
+  WebAssembly, con una entrada real que lo dispara: la llamada aborta sin
+  mensaje util y la instancia queda con su estado a medias.
 - Un NaN que nace en un calculo y sale como un resultado numerico plausible
   que se guarda o se usa para decidir.
 - Un bloque `unsafe` cuyo invariante no se cumple en un caso alcanzable (una
````

## Excluido del diff (9 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff b554c67ac6ab1504ebe5cfa74248c52872846910..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/brainstorm/peticion-unificador-1.md              |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |   0
 tareas/{02-en-curso => 03-en-revision}/TASK-079/planificacion/plan-final.md                                    |   0
 tareas/03-en-revision/TASK-079/revision/informe-revision-1.md                                                  |  65 +++++++
 tareas/03-en-revision/TASK-079/revision/peticion-revision-1.md                                                 | 811 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 tareas/{02-en-curso => 03-en-revision}/TASK-079/tarea.md                                                       |   6 +-
 9 files changed, 880 insertions(+), 2 deletions(-)
````
