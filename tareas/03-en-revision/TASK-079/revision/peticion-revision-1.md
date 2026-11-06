# Peticion de revision — TASK-079 (ronda 1)

- Tarea: TASK-079 — Revisor por pares de dominio para Rust y WASM
- Rama revisada: feature/task-079-revisor-por-pares-de-dominio-para-rust-y
- Rama base: develop
- Commit revisado (HEAD): b554c67ac6ab1504ebe5cfa74248c52872846910
- Fecha: 2026-11-06
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-079 (criterios de aceptacion y plan)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Commits a revisar (git log develop..HEAD)

````
b554c67 feat(TASK-079): revisor por pares rust-wasm-reviewer, catalogo, tests, doc y version 0.10.0
3aed391 chore(TASK-079): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.claude-plugin/marketplace.json b/.claude-plugin/marketplace.json
index efbea89..bcef10e 100644
--- a/.claude-plugin/marketplace.json
+++ b/.claude-plugin/marketplace.json
@@ -5,14 +5,14 @@
     "url": "https://github.com/charliebk"
   },
   "description": "Marketplace de TaskCode: metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
-  "version": "0.9.0",
+  "version": "0.10.0",
   "plugins": [
     {
       "name": "taskcode-plugin",
       "displayName": "TaskCode",
       "source": "./taskcode-marketplace/plugins/taskcode-plugin",
       "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista. Expone el CLI taskctl.",
-      "version": "0.9.0",
+      "version": "0.10.0",
       "author": {
         "name": "charlie.bk"
       },
diff --git a/CHANGELOG.md b/CHANGELOG.md
index 8580337..655f28f 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -2,6 +2,19 @@
 
 ## Sin publicar
 
+## 0.10.0 — 2026-11-06
+
+Revisor por pares de dominio para Rust y WebAssembly (TASK-079): la skill
+`rust-wasm-reviewer` reclama `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`,
+`.cargo/config.toml` y la configuracion de toolchain, rustfmt y clippy, y revisa
+ownership, errores sin `unwrap` ni `panic`, el limite JS-WASM con `wasm-bindgen`
+(si cambia una firma exportada pide siempre el llamador TS/JS y el `.d.ts`),
+numerica en `f64`, `unsafe` y rendimiento. Antes todo el Rust iba al generico.
+Registrada en el catalogo de skills (prioridad 10, etiquetas de Rust y WASM). Con
+cuatro revisores de dominio, un diff de Rust, Vue, Java y C# a la vez supera el
+umbral de 3 y va entero al generico, y `code-quality-reviewer` ya lo contempla.
+Actualizar como en 0.9.0, y despues `taskctl doctor` en cada proyecto.
+
 ## 0.9.0 — 2026-11-06
 
 Doctor avisa de los hooks que bloquean los subagentes (TASK-076): con el modo de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
index e60479d..50caac8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/.claude-plugin/plugin.json
@@ -1,7 +1,7 @@
 {
   "name": "taskcode-plugin",
   "displayName": "TaskCode",
-  "version": "0.9.0",
+  "version": "0.10.0",
   "description": "Metodologia de tareas por sprints, revision por pares de agentes y Git-Flow determinista para Claude Code.",
   "author": {
     "name": "charlie.bk"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 7763668..63fcb02 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -31,6 +31,20 @@ en su frontmatter. Es una decisión, no un olvido (TASK-049, comprobado el
 Quien orquesta pasa `modelo_sugerido` como `model` al lanzar cada agente (la
 salida de `taskctl review` ya lo nombra).
 
+## Revisores por pares que trae el plugin
+
+`taskctl review` reparte el diff de la tarea entre las skills revisoras según
+los `patrones_archivo` que declara cada una en su `SKILL.md` (si el diff toca
+más de tres dominios, va entero al genérico):
+
+| Skill | Dominio | Entra si el diff toca |
+|---|---|---|
+| `angular-vue-reviewer` | Angular y Vue | `.vue`, `.component.ts`, plantillas y rutas bajo `src/app`, composables |
+| `csharp-autocad-ifc-reviewer` | C# sobre AutoCAD o IFC | `.cs`, `.csproj`, `.sln`, `.ifc` |
+| `java-spring-reviewer` | Java y Spring Boot | `.java`, `pom.xml`, `build.gradle`, `application*.yml` |
+| `rust-wasm-reviewer` | Rust y WebAssembly | `.rs`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`, toolchain/rustfmt/clippy |
+| `code-quality-reviewer` | Genérico | Lo que no casa con ningún dominio, o más de tres dominios a la vez |
+
 ## Instalación local (para desarrollo y pruebas)
 
 **Corrección respecto al texto original de TASK-006:** la tarea describía
@@ -252,11 +266,11 @@ ejecución aplicado:
 
 ```
 $ node bin/taskctl --help
-taskctl 0.9.0 — TaskCode
+taskctl 0.10.0 — TaskCode
 [...]
 
 $ ./bin/taskctl --help          # ejecución directa vía shebang + bit +x
-taskctl 0.9.0 — TaskCode
+taskctl 0.10.0 — TaskCode
 [...]                            # salida idéntica
 
 $ PATH="$(pwd)/bin:$PATH" taskctl --version   # simula resolución por PATH
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/package.json b/taskcode-marketplace/plugins/taskcode-plugin/package.json
index 43b64dd..07ee195 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/package.json
+++ b/taskcode-marketplace/plugins/taskcode-plugin/package.json
@@ -1,6 +1,6 @@
 {
   "name": "taskcode-plugin",
-  "version": "0.9.0",
+  "version": "0.10.0",
   "description": "TaskCode: metodologia de tareas/sprints + Git-Flow + revision por pares de agentes, como plugin de Claude Code.",
   "private": true,
   "engines": {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
index ef499a9..4a59ce1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
+++ b/taskcode-marketplace/plugins/taskcode-plugin/scripts/catalogo-skills.yml
@@ -71,8 +71,8 @@
 #                               real del SKILL.md correspondiente; no lo
 #                               sustituye ni se lee como fuente de verdad.
 #
-# PRIORIDAD - criterio seguido en esta version. Los tres revisores de
-# dominio (Angular/Vue, C#-AutoCAD-IFC, Java/Spring) llevan la misma
+# PRIORIDAD - criterio seguido en esta version. Los cuatro revisores de
+# dominio (Angular/Vue, C#-AutoCAD-IFC, Java/Spring, Rust/WASM) llevan la misma
 # prioridad (10): ninguno debe ganarle al otro por defecto, porque sus
 # etiquetas no se solapan entre si y en la practica nunca compiten por la
 # misma tarea. code-quality-reviewer lleva la prioridad mas baja (1) a
@@ -103,7 +103,7 @@
 # que no cuadra con el numero de bloques presentes ABORTA taskctl plan
 # entero, con el mismo criterio que cargarHeuristica().
 
-total_skills: 5
+total_skills: 6
 
 # ---------------------------------------------------------------------
 # 1. task-workflow - skills/task-workflow/SKILL.md
@@ -159,3 +159,14 @@ skill_5_prioridad: 10
 skill_5_etiquetas: [java, spring, spring-boot, backend]
 skill_5_patrones_archivo: ["**/*.java", "src/main/java/**", "src/test/java/**", "**/pom.xml", "**/build.gradle", "**/build.gradle.kts", "**/settings.gradle", "**/settings.gradle.kts", "**/application*.properties", "**/application*.yml", "**/application*.yaml", "**/bootstrap*.yml", "**/src/main/resources/db/migration/**", "**/src/main/resources/db/changelog/**"]
 skill_5_descripcion: "Revision por pares de Java y Spring Boot: capas de servicio/repositorio, limites transaccionales y consultas N+1"
+
+# ---------------------------------------------------------------------
+# 6. rust-wasm-reviewer - skills/rust-wasm-reviewer/SKILL.md
+# ---------------------------------------------------------------------
+skill_6_id: rust-wasm-reviewer
+skill_6_origen: taskcode-plugin
+skill_6_rol: revisor
+skill_6_prioridad: 10
+skill_6_etiquetas: [rust, wasm, webassembly, wasm-bindgen, cargo]
+skill_6_patrones_archivo: ["**/*.rs", "**/Cargo.toml", "**/Cargo.lock", "**/build.rs", "**/.cargo/config.toml", "**/rust-toolchain.toml", "**/clippy.toml", "**/rustfmt.toml"]
+skill_6_descripcion: "Revision por pares de Rust y WebAssembly: ownership, errores sin panic, limite JS-WASM con wasm-bindgen y numerica en f64"
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
index eaaa9e4..9cbf378 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md
@@ -48,14 +48,13 @@ En el caso 1 recibes el diff de la rama contra su base. En el caso 2 recibes
 el diff completo a proposito: partirlo por dominio es justo lo que se ha
 decidido no hacer.
 
-**Nota sobre el umbral de 3.** Hoy el camino 2 es teorico: el catalogo de
-revisores de dominio que viaja con este plugin tiene exactamente tres, asi
-que "mas de tres dominios" no puede darse y **no se puede ejercitar**. El
-umbral esta escrito para cuando el catalogo crezca —o cuando un proyecto
-anada revisores propios—, no como comportamiento observable hoy. Quede
-constancia: si alguien afirma haber llegado aqui por exceso de dominios con
-el catalogo actual, se equivoca de camino; llego por descarte (caso 1) o
-porque se lo pidieron (caso 3).
+**Nota sobre el umbral de 3.** El catalogo de revisores de dominio que viaja
+con este plugin tiene cuatro (Angular/Vue, C# con AutoCAD e IFC, Java/Spring y
+Rust/WebAssembly), asi que el camino 2 es real: un diff que toca a la vez
+Rust, Vue, Java y C# supera el umbral y llega aqui entero. Pasa poco —hacen
+falta cuatro ecosistemas en una sola tarea—, pero cuando pasa no es un error
+de enrutado: revisa el diff completo con el metodo de esta skill y di en el
+informe que llegaste por exceso de dominios.
 
 ## Antes de revisar: la puerta determinista
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
new file mode 100644
index 0000000..01c2661
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md
@@ -0,0 +1,385 @@
+---
+name: rust-wasm-reviewer
+description: Revisor por pares de Rust y WebAssembly. Se usa si el diff toca .rs, Cargo.toml, Cargo.lock, build.rs o .cargo/config.toml. Revisa ownership, errores sin unwrap ni panic, el limite JS-WASM con wasm-bindgen, numerica en f64, unsafe y rendimiento.
+---
+
+# Revision por pares de Rust y WebAssembly
+
+Revisa el diff de una tarea que toca codigo Rust, compilado a nativo, a
+WebAssembly o a los dos. **Lo revisa un agente que no implemento la
+tarea**: la independencia es el punto, no un formalismo.
+
+Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
+toda revision (la puerta determinista, una sola ejecucion de la suite por
+ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
+`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
+Rust y de WebAssembly.
+
+## Que recibe este revisor y que no
+
+Recibe el **`git diff` de la rama contra su base**, no el repositorio
+entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
+que casa con los patrones de mas abajo**: la interfaz que consume el modulo
+WASM (un `.vue`, un componente) va a su propio revisor, en paralelo, y el
+TypeScript o JavaScript que llama al modulo cae al generico. Este revisor
+opina sobre el lado Rust del limite: lo que se exporta, como se exporta y
+que cuesta cruzarlo. No opina sobre como la vista pinta el resultado.
+
+Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
+(el `lib.rs` que reexporta el modulo, el tipo que cruza el limite, el
+llamador de JavaScript que lo usa, el `Cargo.toml` del workspace) en vez de
+dar por hecho lo que no se ve. Lo que no vale es cargar el workspace entero
+"por si acaso": pedir tres ficheros concretos es barato.
+
+**Regla obligatoria del limite JS-WASM.** Si el diff cambia una firma
+exportada con `#[wasm_bindgen]` (nombre, parametros, tipo devuelto, un
+`Result` que pasa a lanzar) o un tipo que cruza el limite (un struct
+exportado, un enum, lo que se serializa con `serde`), **pide siempre** el
+llamador TypeScript o JavaScript que lo usa y el `.d.ts` generado (o el
+que el proyecto versione), y revisa los dos lados del contrato: que el
+llamador pasa lo que la firma espera, trata el error nuevo y libera lo que
+recibe. No es opcional: con el diff partido por dominios, nadie mas ve los
+dos lados a la vez. Dejalo escrito en `## Alcance` del informe (que se pidio
+y que se encontro); si el llamador no existe en el repo (un paquete que
+consume un tercero), dilo tambien ahi.
+
+Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
+sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
+quien orquesta, no esta skill.
+
+## Patrones de fichero
+
+Con estos patrones se decide si este revisor entra en un diff. Estan en
+estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:
+
+```yaml
+rol: revisor
+patrones_archivo: ["**/*.rs", "**/Cargo.toml", "**/Cargo.lock", "**/build.rs", "**/.cargo/config.toml", "**/rust-toolchain.toml", "**/clippy.toml", "**/rustfmt.toml"]
+```
+
+El criterio es el mismo que siguen los demas revisores de dominio:
+
+**Se acota el patron cuando existe un sufijo o un corte de ruta que
+discrimina; cuando no lo hay, la variable que decide es si renunciar deja el
+dominio sin revisor: si lo deja, se conserva la cobertura y se documenta el
+hueco en el informe; si el resto de la lista ya cubre el dominio, se
+renuncia al patron y se documenta el hueco igual.**
+
+Aqui casi todo discrimina por si solo, y por eso la lista puede ser ancha
+sin capturar de mas:
+
+- `*.rs` — la extension es exclusiva de Rust. Ningun otro ecosistema
+  corriente la usa, asi que no hace falta acotarla por carpeta: un `src/`,
+  un `crates/<lo-que-sea>/src/`, un `tests/`, un `benches/` o un
+  `examples/` son todos Rust.
+- `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`,
+  `rust-toolchain.toml`, `clippy.toml` y `rustfmt.toml` — nombres fijos de
+  la cadena de Cargo. Un cambio en ellos cambia que se compila, con que
+  version del compilador, con que lints o para que objetivo (el
+  `[build] target = "wasm32-unknown-unknown"` o los `rustflags` viven en
+  `.cargo/config.toml`).
+- `Cargo.lock` — la configuracion por defecto ya lo excluye del diff de
+  revision (`**/*.lock`), asi que el patron solo actua en proyectos que
+  redefinen esa exclusion. Entra para que, en ese caso, un lock suelto no abra
+  un grupo de un solo fichero para el revisor generico. Del lock solo se miran
+  las versiones de los crates del limite (`wasm-bindgen`, `js-sys`,
+  `web-sys`): un salto de version ahi cambia el pegamento generado y debe ir
+  con la version de la herramienta `wasm-bindgen` que usa la build.
+
+Quedan fuera a proposito, aunque un proyecto Rust y WASM tambien los toque:
+
+- `rust-toolchain` sin extension — el formato antiguo. El nombre es
+  inequivoco, pero la extension que falta hace que el patron `**/rust-toolchain`
+  sea poco legible al lado de los demas, y el formato `.toml` es el que se
+  usa hoy. Si el proyecto aun usa el antiguo, el cambio cae al generico.
+- La carpeta que genera `wasm-pack` o `wasm-bindgen` (`pkg/`, con su
+  `.wasm`, su `.js` de pegamento y su `.d.ts`) — es salida de la build, no
+  fuente; se revisa el `.rs` que la produce. Si el proyecto la versiona, un
+  diff que solo la toque cae al generico, y lo que conviene es excluirla del
+  diff de revision.
+- El TypeScript o JavaScript que **llama** al modulo WASM (el worker, el
+  cliente) — no hay sufijo ni carpeta que lo distinga de cualquier otro
+  `.ts`. Lo revisa el generico; pero si el diff cambia el contrato del
+  limite, este revisor lo pide como contexto (ver la regla de abajo).
+- `.cargo/config` sin extension — el nombre antiguo de `.cargo/config.toml`.
+  Igual que `rust-toolchain`: si el proyecto aun lo usa, cae al generico.
+- `deny.toml` — la configuracion de `cargo-deny` (licencias, avisos de
+  seguridad, crates prohibidos). Es politica de dependencias, no codigo, y su
+  nombre no es exclusivo de Rust.
+- `Makefile`, `justfile` o scripts de build que invocan `cargo` — los usan
+  igual proyectos de cualquier lenguaje.
+
+El motivo no es purismo. El enrutado da este revisor por bueno **en cuanto
+casa un patron**, y el revisor generico solo entra cuando **no** casa
+ninguno: un patron de mas no anade un revisor, **sustituye** al que tocaba.
+
+### Que cubre esta lista de verdad, y que no
+
+Cubre todo el Rust del proyecto, sea nativo o WebAssembly: no hay forma de
+saber por la ruta si un `.rs` acaba en `wasm32-unknown-unknown`, y no hace
+falta, porque lo que se revisa del lado WASM (que se exporta, como cruza el
+limite, que hace un `panic`) solo aplica a los ficheros que lo usan. Lo que
+no llega, y conviene saberlo:
+
+- El pegamento JavaScript y TypeScript del limite, y la carpeta `pkg/`
+  generada, como se dice arriba.
+- Los ficheros `.wat` o `.wasm` escritos o versionados a mano, que no son
+  Rust. Son raros; si aparecen, caen al generico.
+- Un `Dockerfile` o un flujo de CI que compila el crate. Cambian el entorno,
+  no el codigo.
+
+Todo eso cae al revisor generico. Es degradacion, no perdida — el generico
+revisa correccion, casos borde, tests y limites; pero **no** revisa
+ownership, la politica de errores, las copias en el limite JS-WASM ni la
+numerica en coma flotante.
+
+## Reproducir antes de reportar
+
+Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
+caso que lo demuestra**, no cuando parece que podria pasar. En Rust el
+compilador ya descarta una clase entera de defectos, asi que lo que queda
+(un `panic` en un caso real, una perdida de precision, una copia de mas en
+cada llamada) casi nunca se ve leyendo: se ve ejecutando.
+
+1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
+   No revisar sobre el arbol de quien implemento: hereda su `target/`, su
+   cache incremental y sus ficheros sin commitear.
+2. **Compilar con el lockfile**: `cargo build --locked` (y `--release` si el
+   cambio toca rendimiento). Si el proyecto compila a WebAssembly, tambien
+   para ese objetivo: `cargo build --locked --target wasm32-unknown-unknown`,
+   o el comando de `wasm-pack` que use el proyecto. Muchos errores (una
+   dependencia que no compila para `wasm32`, un `std::time::Instant` que
+   alli no existe) solo salen ahi. Si no compila, ahi acaba la revision.
+3. **Pasar el formateo y los lints**: `cargo fmt --check` y
+   `cargo clippy --all-targets --locked -- -D warnings`, con los lints que
+   el proyecto ya tenga configurados. Un aviso nuevo de clippy no es por si
+   mismo un hallazgo; lo es si senala un defecto que se puede demostrar.
+4. **Correr la suite entera antes de tocar nada**, para tener la linea base:
+   `cargo test --locked --workspace` (y los tests de WebAssembly con
+   `wasm-pack test` o `wasm-bindgen-test-runner` si el proyecto los tiene).
+   Una sola vez por ronda (ver revision.md).
+5. **Construir el caso que rompe**, con datos que se parezcan a los reales:
+   el fichero de entrada real del proyecto si lo hay, valores extremos
+   (vacio, un elemento, NaN, infinito, coordenadas grandes, longitudes casi
+   nulas) y, para lo que cruza el limite, una llamada desde JavaScript.
+6. **Mutacion**: quitar a proposito la proteccion que el diff anade (la
+   comprobacion de NaN, la tolerancia, el `?` que propaga el error, el
+   limite de un bucle) y comprobar que algun test se pone rojo. Si sigue
+   verde, no hay red. Si el proyecto usa `cargo mutants`, pasarlo sobre los
+   ficheros del diff da la misma respuesta de forma sistematica.
+
+Tecnicas que dan mas hallazgos que la lectura, por area:
+
+- **Panics**: buscar en el diff `unwrap`, `expect`, `panic!`, `unreachable!`,
+  indexado con `[]` sobre datos de entrada y divisiones enteras, y para cada
+  uno construir la entrada que lo dispara. Si existe, es un hallazgo
+  **medido**; si el invariante que lo hace imposible esta en el tipo, no lo
+  es.
+- **Numerica**: evaluar la funcion en los bordes (el valor exacto de una
+  frontera, justo a cada lado, cero, negativos, magnitudes muy distintas
+  sumadas) y comparar contra un valor calculado de forma independiente, no
+  contra lo que devuelve la propia implementacion.
+- **Limite JS-WASM**: medir lo que cruza. Contar llamadas por fotograma u
+  operacion, tamano de lo que se copia en cada una, y el tamano del `.wasm`
+  antes y despues del diff (`ls -l` del binario optimizado, o
+  `twiggy top` si el proyecto lo tiene).
+- **Rendimiento**: medir con el perfil `release` y una carga realista
+  (`cargo bench`, o un ejecutable cronometrado con varias repeticiones), y
+  reportar la diferencia y su variacion, no la intuicion.
+
+## Que se revisa
+
+**Ownership, prestamos y lifetimes.** Que la firma diga la verdad sobre
+quien es dueno de que: recibir `&[T]` o `&str` cuando no hace falta poseer,
+mover cuando la responsabilidad pasa al llamado. Que un `clone()` o un
+`Rc`/`Arc` no esten ahi solo para callar al comprobador de prestamos: antes
+de aceptarlos, mirar el flujo de datos y el alcance del prestamo. Que los
+lifetimes explicitos describan una relacion real y no una que el compilador
+habria inferido igual. Que un `Rc<RefCell<_>>` no convierta en error de
+ejecucion (`BorrowMutError`) lo que el tipo podia haber impedido al
+compilar. Y que `Drop` no esconda trabajo que puede fallar (escribir,
+vaciar un buffer) sin forma de ver el error.
+
+**Errores.** Los fallos esperables (entrada invalida, fichero ausente, dato
+fuera de rango, geometria degenerada) se devuelven con `Result` y un tipo de
+error que conserve la causa y permita al llamador decidir; no con `panic`.
+En codigo de biblioteca y en todo lo que se exporta a WebAssembly, `unwrap`,
+`expect` y `panic!` sobre datos que vienen de fuera son un defecto: en
+`wasm32-unknown-unknown` un `panic` aborta la instancia entera, y el
+JavaScript que llama recibe un `RuntimeError: unreachable` sin contexto, con
+el modulo inservible hasta que se recarga. Se aceptan en tests, en
+invariantes que el propio tipo garantiza (y entonces con un `expect` que diga
+cual), y en el arranque de un binario. Que el error no se convierta en texto
+demasiado pronto: comparar cadenas de error en vez de variantes es fragil.
+Que no se reutilice un enfoque de errores distinto del que ya tiene el
+proyecto sin motivo. Y que un error no se trague en un `let _ =` o un
+`.ok()` que nadie mira.
+
+**El limite JS-WASM.** Cada cruce cuesta: lo que no es un numero se copia o
+se serializa. Mirar que tipos cruzan (`Vec<f64>` y `&[f64]` se copian a la
+memoria lineal o desde ella en cada llamada; un `JsValue` con `serde`
+serializa el objeto entero), cuantas veces por operacion se cruza (una
+llamada por punto en un bucle de JavaScript es mucho peor que una llamada
+con el lote), y quien libera lo que se exporta (un struct exportado con
+`#[wasm_bindgen]` vive en el monton de WASM hasta que JavaScript llama a
+`free()`; si no se llama, es una fuga). Que los `Result` exportados lleguen a
+JavaScript como una excepcion con mensaje util, no como un `unreachable`.
+Que el tiempo no use `std::time::Instant` ni `SystemTime` en el objetivo
+`wasm32-unknown-unknown`, donde no estan disponibles o fallan: hace falta una
+alternativa por compilacion condicional. Que nada bloquee el hilo principal
+del navegador (un bucle largo sin ceder, un `thread::sleep`). Y el tamano del
+binario: una dependencia nueva, un `format!` o un `Debug` derivado en todo
+pueden sumar decenas de kilobytes al `.wasm` que se descarga; el perfil de
+`release` (`opt-level`, `lto`, `codegen-units`, `panic = "abort"`) y el paso
+de `wasm-opt` se revisan cuando el diff los toca.
+
+**Numerica en coma flotante.** Nada de `==` ni `!=` sobre `f64` salvo contra
+un valor que se sabe exacto (cero puesto a proposito, un entero pequeno): se
+compara con una tolerancia **explicita y con nombre**, absoluta, relativa o
+las dos, elegida segun la magnitud del dato y documentada. Que NaN e
+infinitos se traten donde pueden nacer (division por una longitud nula,
+`sqrt` o `acos` de un valor que el redondeo saca de rango, `ln` de cero) y
+no se propaguen en silencio hasta salir como un resultado plausible: un
+`partial_cmp().unwrap()` o un `max_by` que asume orden total revientan con
+NaN, y `f64::max` lo descarta sin avisar. Que `as` entre enteros y
+flotantes no trunque ni sature sin que se vea. Que las sumas largas (areas,
+volumenes, longitudes acumuladas) usen suma compensada (Kahan o Neumaier) o
+un orden que limite el error, y que las restas de cantidades casi iguales
+(coordenadas grandes con diferencias pequenas, `1 - cos` de un angulo
+pequeno) se reformulen para no perder digitos por cancelacion: trasladar al
+origen antes de operar, o usar la identidad trigonometrica estable. Que los
+angulos tengan una unidad y un rango declarados. Y que los tests numericos
+comparen contra un valor calculado de forma independiente con la tolerancia
+de la propia implementacion, no contra el valor que imprimio la primera
+ejecucion.
+
+**`unsafe`.** Cada bloque `unsafe` tiene que estar justificado por una
+necesidad concreta que el codigo seguro no cubre, ser tan pequeno como se
+pueda y llevar un comentario `// SAFETY:` que diga que invariante lo hace
+correcto y quien lo garantiza. Que compile no demuestra que sea correcto.
+En WebAssembly aparece sobre todo al ver la memoria lineal desde JavaScript
+(`Float64Array::view`): esa vista queda invalida en cuanto la memoria crece,
+y cualquier asignacion posterior puede hacerla crecer. Si el proyecto lo
+admite, pasar `cargo miri test` sobre el modulo que cambia.
+
+**Rendimiento y asignaciones en bucles calientes.** Dentro de un bucle que
+corre por punto, por triangulo o por fotograma: un `Vec::new()` o un
+`collect()` en cada vuelta, un `clone()` de algo grande, un `format!` o un
+`to_string()`, un `HashMap` reconstruido, una busqueda lineal que podia ser
+un indice. Primero la complejidad (un cuadratico escondido en un `contains`
+sobre un `Vec`), despues las asignaciones, y solo despues la mecanica fina.
+Una optimizacion sin medicion antes y despues no es un hallazgo ni una
+mejora; y una mas rapida que cambia el resultado numerico, el orden o los
+errores es un defecto.
+
+**Herramientas y higiene.** Que el diff pase `cargo fmt --check` y
+`cargo clippy` sin avisos nuevos, o que cada `#[allow(...)]` nuevo diga por
+que. Que no se anadan dependencias sin necesidad, y que las nuevas compilen
+para todos los objetivos del proyecto (nativo y `wasm32`). Que las
+`features` no rompan la compilacion en alguna combinacion que el proyecto
+usa. Que la version minima de Rust y la edicion del proyecto se respeten.
+
+**Tests.** Que la prueba ejerza la promesa observable que el cambio podria
+romper, con datos que distingan el comportamiento correcto de un defecto
+plausible: los datos reales del proyecto cuando existen, y no solo el caso
+feliz con numeros redondos. Que la expectativa se derive de forma
+independiente de la implementacion. Que cubra los bordes (vacio, un
+elemento, degenerado, NaN, el limite exacto). Que un test de ida y vuelta no
+sea el unico: si el codificador y el decodificador comparten el mismo
+defecto, la ida y vuelta pasa. Que los tests del lado WASM, si los hay,
+corran de verdad en el objetivo `wasm32` y no solo en nativo. Y que exista al
+menos un test que falle si se revierte el cambio: es lo que mide el paso de
+mutacion.
+
+## Clasificacion de los hallazgos
+
+**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
+contrario de lo que dice:
+
+- Un `unwrap` o un indexado sobre datos de entrada en una funcion exportada a
+  WebAssembly, con una entrada real que lo dispara: el modulo aborta y la
+  aplicacion queda inservible hasta recargar.
+- Un NaN que nace en un calculo y sale como un resultado numerico plausible
+  que se guarda o se usa para decidir.
+- Un bloque `unsafe` cuyo invariante no se cumple en un caso alcanzable (una
+  vista de la memoria lineal usada despues de que la memoria crezca).
+- Una suma, un volumen o una medicion que pierde precision hasta cambiar un
+  resultado que alguien va a firmar o a pagar.
+
+**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:
+
+- Comparacion `==` entre `f64` calculados, que falla con datos reales por un
+  error de redondeo.
+- Tolerancia sin nombre ni justificacion, demasiado estricta o demasiado
+  laxa para la magnitud de los datos reales.
+- Un objeto exportado con `#[wasm_bindgen]` que JavaScript nunca libera,
+  creado en cada operacion: la memoria crece sin limite.
+- Un lote de datos copiado por el limite JS-WASM en cada fotograma o en cada
+  punto cuando bastaba una vez.
+- Un error esperable que se convierte en `panic` o se traga, y el llamador
+  no puede distinguir el fallo del exito.
+- Una asignacion en un bucle caliente con efecto medido en el tiempo de una
+  operacion que el usuario espera.
+- Test nuevo que seguiria verde con el comportamiento revertido.
+
+**MENOR** — todo lo demas:
+
+- Un `clone()` evitable fuera de un camino caliente.
+- Un lifetime explicito que el compilador habria inferido.
+- Un `#[allow(...)]` sin comentario.
+- Un `expect` sobre un invariante que el tipo ya garantiza, con un mensaje
+  que no dice cual.
+- Una dependencia o un import que el diff deja sin usar.
+
+## Estructura del informe
+
+Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
+(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
+propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
+lo que el esqueleto ya trae:
+
+```markdown
+# Informe de revision — <ID de la tarea> (ronda <N>)
+
+- Commit revisado: <sha>
+- Revisor: rust-wasm-reviewer
+- Veredicto: aprobada
+
+## Hallazgos
+
+<un bloque por hallazgo, con la plantilla de revision.md>
+
+## Alcance
+- Ficheros revisados: <los del diff que casaron con los patrones>
+- Contexto adicional pedido: <ninguno, o que y por que>
+- Limite JS-WASM: <sin cambios de firma exportada, o llamador y .d.ts pedidos y lo encontrado>
+
+## Reproduccion
+- Clon: <ruta temporal y rama>
+- Build: <comandos, objetivos (nativo, wasm32) y resultado>
+- Formato y lints: <cargo fmt --check, cargo clippy y resultado>
+- Suite: <comando, resultado, y linea base antes del diff>
+- Casos construidos: <entradas reales o extremas usadas para cada hallazgo>
+- Mutacion: <que proteccion se quito y que test se puso rojo, o que no>
+- Medidas: <tiempos, tamano del .wasm o copias por llamada, si aplican>
+
+## Revisado sin hallazgos
+<areas del diff que se miraron y salieron limpias, para que conste que se
+miraron>
+```
+
+Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
+forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
+llegar a esa conclusion.
+
+## Lo que esta skill no hace
+
+Ademas de lo que ningun revisor hace (ver revision.md):
+
+- **No es una revision de estilo.** Lo que `cargo fmt` arregla solo, o una
+  preferencia entre dos formas idiomaticas equivalentes, no es un hallazgo.
+  Un `clone()` o un `Arc` no son un defecto por su aspecto: lo son si se
+  demuestra lo que cuestan o lo que esconden.
+- **No moderniza por modernizar.** Reescribir codigo que funciona a una
+  forma mas nueva, o abstraer lo que hoy es simple, queda fuera del diff
+  revisado.
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
index c2aff6b..9f8124f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/cli.ts
@@ -59,7 +59,7 @@ import {
 import { ConfigError } from './core/config.js';
 import { formatearInstante } from './core/transiciones.js';
 
-const VERSION = '0.9.0';
+const VERSION = '0.10.0';
 
 const HELP = `taskctl ${VERSION} — TaskCode
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
index df97079..abbf839 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/revisores.ts
@@ -3,7 +3,7 @@
  *
  * `taskctl review` invocaba siempre el mismo agente declarado en
  * `tarea.md` (`agente_revisor`), sin mirar que toca de verdad el diff.
- * TASK-032 (D6/D7) dejo cuatro skills revisoras con `patrones_archivo`,
+ * TASK-032 (D6/D7) dejo cuatro skills revisoras (TASK-079 anadio la quinta, rust-wasm) con `patrones_archivo`,
  * `fallback` y `umbral_dominios` declarados en un bloque ```yaml de su
  * SKILL.md, pero SOLO como texto: el unico lector que existia era el
  * helper `bloqueYaml()` de test/skills/revisores.test.ts, sin ningun
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
index ed830b4..c840f94 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/catalogo-skills.test.ts
@@ -135,7 +135,7 @@ function errorAccionable(re: RegExp): (e: unknown) => boolean {
 // --------------------------------------------------------------------
 
 test('parsea el catalogo real del repo sin lanzar', () => {
-  assert.equal(CATALOGO.length, 5);
+  assert.equal(CATALOGO.length, 6);
   assert.deepEqual(
     CATALOGO.map((e) => e.id),
     [
@@ -144,6 +144,7 @@ test('parsea el catalogo real del repo sin lanzar', () => {
       'angular-vue-reviewer',
       'csharp-autocad-ifc-reviewer',
       'java-spring-reviewer',
+      'rust-wasm-reviewer',
     ]
   );
 });
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts
index ed3fef9..2fb96b8 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/revisores.test.ts
@@ -42,13 +42,14 @@ const SKILLS_DIR_REAL = path.join(PLUGIN_ROOT, 'skills');
 
 // --- cargarCatalogoRevisores, contra las skills reales -------------------
 
-test('cargarCatalogoRevisores: lee las skills reales del plugin (3 de dominio + 1 generico con umbral 3)', () => {
+test('cargarCatalogoRevisores: lee las skills reales del plugin (4 de dominio + 1 generico con umbral 3)', () => {
   const catalogo = cargarCatalogoRevisores(SKILLS_DIR_REAL);
   const nombres = catalogo.dominio.map((r) => r.nombre).sort();
   assert.deepEqual(nombres, [
     'angular-vue-reviewer',
     'csharp-autocad-ifc-reviewer',
     'java-spring-reviewer',
+    'rust-wasm-reviewer',
   ]);
   for (const revisor of catalogo.dominio) {
     assert.ok(revisor.patronesArchivo.length > 0, `${revisor.nombre}: sin patrones`);
@@ -57,6 +58,27 @@ test('cargarCatalogoRevisores: lee las skills reales del plugin (3 de dominio +
   assert.equal(catalogo.generico.umbralDominios, 3);
 });
 
+test('catalogo real (TASK-079): un diff con .rs y .vue se parte en dos grupos, rust-wasm y angular-vue', () => {
+  const plan = clasificarPorDominio(['crates/geo/src/area.rs', 'src/components/Mapa.vue'], cargarCatalogoRevisores(SKILLS_DIR_REAL));
+  assert.equal(plan.fragmentado, true);
+  assert.deepEqual(
+    plan.grupos.map((g) => [g.revisor, g.ficheros]).sort(),
+    [
+      ['angular-vue-reviewer', ['src/components/Mapa.vue']],
+      ['rust-wasm-reviewer', ['crates/geo/src/area.rs']],
+    ]
+  );
+});
+
+test('catalogo real (TASK-079): Rust + Vue + Java + C# supera el umbral de 3 y cae al generico', () => {
+  const ficheros = ['src/lib.rs', 'src/App.vue', 'src/main/java/com/acme/A.java', 'src/Exporter/IfcExporter.cs'];
+  const plan = clasificarPorDominio(ficheros, cargarCatalogoRevisores(SKILLS_DIR_REAL));
+  assert.equal(plan.fragmentado, false);
+  assert.equal(plan.grupos.length, 1);
+  assert.equal(plan.grupos[0]!.revisor, 'code-quality-reviewer');
+  assert.deepEqual(plan.grupos[0]!.ficheros, ficheros);
+});
+
 test('cargarCatalogoRevisores: relee el disco en cada llamada, sin cache (no diverge si una skill cambia)', async () => {
   const tmp = await mkdtemp(path.join(tmpdir(), 'taskctl-revisores-'));
   try {
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
index 8115e02..2db5c29 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/doctor-deploy.test.ts
@@ -91,6 +91,7 @@ test('skills/ contiene exactamente las skills esperadas, doctor-deploy entre ell
     'new',
     'plan',
     'review',
+    'rust-wasm-reviewer',
     'start',
     'task-workflow',
   ];
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
index 0d795a3..bb32fab 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/revisores.test.ts
@@ -1,6 +1,6 @@
 /**
- * Tests de las cuatro skills revisoras del plugin (item D6): java-spring,
- * angular-vue, csharp-autocad-ifc y code-quality.
+ * Tests de las skills revisoras del plugin (item D6): java-spring,
+ * angular-vue, csharp-autocad-ifc, code-quality y, desde TASK-079, rust-wasm.
  *
  * El fichero hermano `task-workflow.test.ts` ya cubre a fondo la forma de
  * UNA skill (bytes, BOM, claves del spec, limites de longitud). Aqui no se
@@ -69,6 +69,7 @@ const REVISORES_DE_DOMINIO = [
   'java-spring-reviewer',
   'angular-vue-reviewer',
   'csharp-autocad-ifc-reviewer',
+  'rust-wasm-reviewer',
 ] as const;
 
 const REVISOR_GENERICO = 'code-quality-reviewer';
@@ -349,6 +350,20 @@ const RUTAS_LEGITIMAS: ReadonlyArray<readonly [string, RevisorDeDominio, string]
   ['src/Exporter/Exporter.csproj', 'csharp-autocad-ifc-reviewer', 'csharp'],
   ['Solucion.sln', 'csharp-autocad-ifc-reviewer', 'csharp'],
   ['test/fixtures/minimal.ifc', 'csharp-autocad-ifc-reviewer', 'ifc'],
+
+  // Rust / WebAssembly (TASK-079): crate suelto, workspace y la cadena de Cargo.
+  ['src/lib.rs', 'rust-wasm-reviewer', 'rust'],
+  ['crates/geometria/src/area.rs', 'rust-wasm-reviewer', 'rust workspace'],
+  ['tests/integracion.rs', 'rust-wasm-reviewer', 'rust'],
+  ['benches/triangulos.rs', 'rust-wasm-reviewer', 'rust'],
+  ['build.rs', 'rust-wasm-reviewer', 'cargo'],
+  ['Cargo.toml', 'rust-wasm-reviewer', 'cargo'],
+  ['crates/geometria/Cargo.toml', 'rust-wasm-reviewer', 'cargo workspace'],
+  ['Cargo.lock', 'rust-wasm-reviewer', 'cargo'],
+  ['.cargo/config.toml', 'rust-wasm-reviewer', 'cargo wasm32'],
+  ['rust-toolchain.toml', 'rust-wasm-reviewer', 'cargo'],
+  ['clippy.toml', 'rust-wasm-reviewer', 'cargo'],
+  ['rustfmt.toml', 'rust-wasm-reviewer', 'cargo'],
 ];
 
 /**
@@ -446,6 +461,16 @@ const RUTAS_AJENAS: ReadonlyArray<readonly [string, string]> = [
   ['src/lib/templates/email.html', 'backend ts con plantilla de correo'],
   ['public/index.html', 'sitio estatico'],
   ['src/lib/components/Button.svelte', 'svelte'],
+
+  // Lo que la skill de Rust deja fuera a proposito (TASK-079).
+  ['pkg/geometria.js', 'salida de wasm-pack'],
+  ['pkg/geometria.d.ts', 'salida de wasm-pack'],
+  ['pkg/geometria_bg.wasm', 'salida de wasm-pack'],
+  ['src/worker/geometria.worker.ts', 'llamador TS del modulo wasm'],
+  ['rust-toolchain', 'toolchain sin extension'],
+  ['.cargo/config', 'config de cargo sin extension'],
+  ['deny.toml', 'cargo-deny'],
+  ['pyproject.toml', 'python (otro toml)'],
 ];
 
 /** Patrones leidos de los SKILL.md, una sola vez. */
@@ -480,7 +505,7 @@ test('6b. la tabla de enrutado no esta vacia ni cojea (guard de no-vacuidad)', a
     'la tabla de capturas aceptadas esta vacia: los huecos conocidos dejarian de estar congelados'
   );
 
-  // Los tres revisores de dominio tienen que estar representados; si no, la
+  // Todos los revisores de dominio tienen que estar representados; si no, la
   // direccion positiva estaria verde por no mirar a dos de ellos.
   for (const nombre of REVISORES_DE_DOMINIO) {
     assert.ok(
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
index de3947b..6e84259 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/skills/task-workflow.test.ts
@@ -573,6 +573,7 @@ const DISPARADORES: Record<string, string[]> = {
   'java-spring-reviewer': ['.java', 'pom.xml', 'build.gradle', 'application*.yml', 'Spring'],
   'angular-vue-reviewer': ['.vue', '.component.ts', '.directive.ts', 'composables', 'src/app', 'Angular 19', 'Angular 20'],
   'csharp-autocad-ifc-reviewer': ['.cs', '.csproj', '.ifc', 'AutoCAD', 'ObjectARX', 'IfcOpenShell', 'BIM'],
+  'rust-wasm-reviewer': ['.rs', 'Cargo.toml', 'build.rs', '.cargo/config.toml', 'wasm-bindgen', 'unwrap', 'f64'],
 };
 
 test('19b. las descriptions acortadas conservan sus disparadores', async () => {
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/brainstorm/peticion-unificador-1.md              | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/planificacion/plan-final.md                                    | 0
 tareas/{01-en-diseno => 02-en-curso}/TASK-079/tarea.md                                                       | 3 ++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/cli.js                                                 | 2 +-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/revisores.js                                      | 2 +-
 taskcode-marketplace/plugins/taskcode-plugin/package-lock.json                                               | 4 ++--
 10 files changed, 6 insertions(+), 5 deletions(-)
````
