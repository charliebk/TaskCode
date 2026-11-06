---
name: rust-wasm-reviewer
description: Revisor por pares de Rust y WebAssembly. Se usa si el diff toca .rs, Cargo.toml, Cargo.lock, build.rs o .cargo/config.toml. Revisa ownership, errores sin unwrap ni panic, el limite JS-WASM con wasm-bindgen, numerica en f64, unsafe y rendimiento.
---

# Revision por pares de Rust y WebAssembly

Revisa el diff de una tarea que toca codigo Rust, compilado a nativo, a
WebAssembly o a los dos. **Lo revisa un agente que no implemento la
tarea**: la independencia es el punto, no un formalismo.

Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
toda revision (la puerta determinista, una sola ejecucion de la suite por
ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
Rust y de WebAssembly.

## Que recibe este revisor y que no

Recibe el **`git diff` de la rama contra su base**, no el repositorio
entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
que casa con los patrones de mas abajo**: la interfaz que consume el modulo
WASM (un `.vue`, un componente) va a su propio revisor, en paralelo, y el
TypeScript o JavaScript que llama al modulo cae al generico. Este revisor
opina sobre el lado Rust del limite: lo que se exporta, como se exporta y
que cuesta cruzarlo. No opina sobre como la vista pinta el resultado.

Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
(el `lib.rs` que reexporta el modulo, el tipo que cruza el limite, el
llamador de JavaScript que lo usa, el `Cargo.toml` del workspace) en vez de
dar por hecho lo que no se ve. Lo que no vale es cargar el workspace entero
"por si acaso": pedir tres ficheros concretos es barato.

**Regla obligatoria del limite JS-WASM.** Si el diff cambia una firma
exportada con `#[wasm_bindgen]` (nombre, parametros, tipo devuelto, un
`Result` que pasa a lanzar) o un tipo que cruza el limite (un struct
exportado, un enum, lo que se serializa con `serde`), **pide siempre** el
llamador TypeScript o JavaScript que lo usa y el `.d.ts` generado (o el
que el proyecto versione), y revisa los dos lados del contrato: que el
llamador pasa lo que la firma espera, trata el error nuevo y libera lo que
recibe. No es opcional: con el diff partido por dominios, nadie mas ve los
dos lados a la vez. Dejalo escrito en `## Alcance` del informe (que se pidio
y que se encontro); si el llamador no existe en el repo (un paquete que
consume un tercero), dilo tambien ahi.

Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
quien orquesta, no esta skill.

## Patrones de fichero

Con estos patrones se decide si este revisor entra en un diff. Estan en
estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:

```yaml
rol: revisor
patrones_archivo: ["**/*.rs", "**/Cargo.toml", "**/Cargo.lock", "**/build.rs", "**/.cargo/config.toml", "**/rust-toolchain.toml", "**/clippy.toml", "**/rustfmt.toml"]
```

El criterio es el mismo que siguen los demas revisores de dominio:

**Se acota el patron cuando existe un sufijo o un corte de ruta que
discrimina; cuando no lo hay, la variable que decide es si renunciar deja el
dominio sin revisor: si lo deja, se conserva la cobertura y se documenta el
hueco en el informe; si el resto de la lista ya cubre el dominio, se
renuncia al patron y se documenta el hueco igual.**

Aqui casi todo discrimina por si solo, y por eso la lista puede ser ancha
sin capturar de mas:

- `*.rs` — la extension es exclusiva de Rust. Ningun otro ecosistema
  corriente la usa, asi que no hace falta acotarla por carpeta: un `src/`,
  un `crates/<lo-que-sea>/src/`, un `tests/`, un `benches/` o un
  `examples/` son todos Rust.
- `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/config.toml`,
  `rust-toolchain.toml`, `clippy.toml` y `rustfmt.toml` — nombres fijos de
  la cadena de Cargo. Un cambio en ellos cambia que se compila, con que
  version del compilador, con que lints o para que objetivo (el
  `[build] target = "wasm32-unknown-unknown"` o los `rustflags` viven en
  `.cargo/config.toml`).
- `Cargo.lock` — la configuracion por defecto ya lo excluye del diff de
  revision (`**/*.lock`), asi que el patron solo actua en proyectos que
  redefinen esa exclusion. Entra para que, en ese caso, un lock suelto no abra
  un grupo de un solo fichero para el revisor generico. Del lock solo se miran
  las versiones de los crates del limite (`wasm-bindgen`, `js-sys`,
  `web-sys`): un salto de version ahi cambia el pegamento generado y debe ir
  con la version de la herramienta `wasm-bindgen` que usa la build.

Quedan fuera a proposito, aunque un proyecto Rust y WASM tambien los toque:

- `rust-toolchain` sin extension — el formato antiguo. El nombre es
  inequivoco, pero la extension que falta hace que el patron `**/rust-toolchain`
  sea poco legible al lado de los demas, y el formato `.toml` es el que se
  usa hoy. Si el proyecto aun usa el antiguo, el cambio cae al generico.
- La carpeta que genera `wasm-pack` o `wasm-bindgen` (`pkg/`, con su
  `.wasm`, su `.js` de pegamento y su `.d.ts`) — es salida de la build, no
  fuente; se revisa el `.rs` que la produce. Si el proyecto la versiona, un
  diff que solo la toque cae al generico, y lo que conviene es excluirla del
  diff de revision.
- El TypeScript o JavaScript que **llama** al modulo WASM (el worker, el
  cliente) — no hay sufijo ni carpeta que lo distinga de cualquier otro
  `.ts`. Lo revisa el generico; pero si el diff cambia el contrato del
  limite, este revisor lo pide como contexto (ver la regla de abajo).
- `.cargo/config` sin extension — el nombre antiguo de `.cargo/config.toml`.
  Igual que `rust-toolchain`: si el proyecto aun lo usa, cae al generico.
- `deny.toml` — la configuracion de `cargo-deny` (licencias, avisos de
  seguridad, crates prohibidos). Es politica de dependencias, no codigo, y su
  nombre no es exclusivo de Rust.
- `Makefile`, `justfile` o scripts de build que invocan `cargo` — los usan
  igual proyectos de cualquier lenguaje.

El motivo no es purismo. El enrutado da este revisor por bueno **en cuanto
casa un patron**, y el revisor generico solo entra cuando **no** casa
ninguno: un patron de mas no anade un revisor, **sustituye** al que tocaba.

### Que cubre esta lista de verdad, y que no

Cubre todo el Rust del proyecto, sea nativo o WebAssembly: no hay forma de
saber por la ruta si un `.rs` acaba en `wasm32-unknown-unknown`, y no hace
falta, porque lo que se revisa del lado WASM (que se exporta, como cruza el
limite, que hace un `panic`) solo aplica a los ficheros que lo usan. Lo que
no llega, y conviene saberlo:

- El pegamento JavaScript y TypeScript del limite, y la carpeta `pkg/`
  generada, como se dice arriba.
- Los ficheros `.wat` o `.wasm` escritos o versionados a mano, que no son
  Rust. Son raros; si aparecen, caen al generico.
- Un `Dockerfile` o un flujo de CI que compila el crate. Cambian el entorno,
  no el codigo.

Todo eso cae al revisor generico. Es degradacion, no perdida — el generico
revisa correccion, casos borde, tests y limites; pero **no** revisa
ownership, la politica de errores, las copias en el limite JS-WASM ni la
numerica en coma flotante.

## Reproducir antes de reportar

Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
caso que lo demuestra**, no cuando parece que podria pasar. En Rust el
compilador ya descarta una clase entera de defectos, asi que lo que queda
(un `panic` en un caso real, una perdida de precision, una copia de mas en
cada llamada) casi nunca se ve leyendo: se ve ejecutando.

1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
   No revisar sobre el arbol de quien implemento: hereda su `target/`, su
   cache incremental y sus ficheros sin commitear.
2. **Compilar con el lockfile**: `cargo build --locked` (y `--release` si el
   cambio toca rendimiento). Si el proyecto compila a WebAssembly, tambien
   para ese objetivo: `cargo build --locked --target wasm32-unknown-unknown`,
   o el comando de `wasm-pack` que use el proyecto. Muchos errores (una
   dependencia que no compila para `wasm32`, un `std::time::Instant` que
   alli no existe) solo salen ahi. Si no compila, ahi acaba la revision.
3. **Pasar el formateo y los lints**: `cargo fmt --check` y
   `cargo clippy --all-targets --locked -- -D warnings`, con los lints que
   el proyecto ya tenga configurados. Un aviso nuevo de clippy no es por si
   mismo un hallazgo; lo es si senala un defecto que se puede demostrar.
4. **Correr la suite entera antes de tocar nada**, para tener la linea base:
   `cargo test --locked --workspace` (y los tests de WebAssembly con
   `wasm-pack test` o `wasm-bindgen-test-runner` si el proyecto los tiene).
   Una sola vez por ronda (ver revision.md).
5. **Construir el caso que rompe**, con datos que se parezcan a los reales:
   el fichero de entrada real del proyecto si lo hay, valores extremos
   (vacio, un elemento, NaN, infinito, coordenadas grandes, longitudes casi
   nulas) y, para lo que cruza el limite, una llamada desde JavaScript.
6. **Mutacion**: quitar a proposito la proteccion que el diff anade (la
   comprobacion de NaN, la tolerancia, el `?` que propaga el error, el
   limite de un bucle) y comprobar que algun test se pone rojo. Si sigue
   verde, no hay red. Si el proyecto usa `cargo mutants`, pasarlo sobre los
   ficheros del diff da la misma respuesta de forma sistematica.

Tecnicas que dan mas hallazgos que la lectura, por area:

- **Panics**: buscar en el diff `unwrap`, `expect`, `panic!`, `unreachable!`,
  indexado con `[]` sobre datos de entrada y divisiones enteras, y para cada
  uno construir la entrada que lo dispara. Si existe, es un hallazgo
  **medido**; si el invariante que lo hace imposible esta en el tipo, no lo
  es.
- **Numerica**: evaluar la funcion en los bordes (el valor exacto de una
  frontera, justo a cada lado, cero, negativos, magnitudes muy distintas
  sumadas) y comparar contra un valor calculado de forma independiente, no
  contra lo que devuelve la propia implementacion.
- **Limite JS-WASM**: medir lo que cruza. Contar llamadas por fotograma u
  operacion, tamano de lo que se copia en cada una, y el tamano del `.wasm`
  antes y despues del diff (`ls -l` del binario optimizado, o
  `twiggy top` si el proyecto lo tiene).
- **Rendimiento**: medir con el perfil `release` y una carga realista
  (`cargo bench`, o un ejecutable cronometrado con varias repeticiones), y
  reportar la diferencia y su variacion, no la intuicion.

## Que se revisa

**Ownership, prestamos y lifetimes.** Que la firma diga la verdad sobre
quien es dueno de que: recibir `&[T]` o `&str` cuando no hace falta poseer,
mover cuando la responsabilidad pasa al llamado. Que un `clone()` o un
`Rc`/`Arc` no esten ahi solo para callar al comprobador de prestamos: antes
de aceptarlos, mirar el flujo de datos y el alcance del prestamo. Que los
lifetimes explicitos describan una relacion real y no una que el compilador
habria inferido igual. Que un `Rc<RefCell<_>>` no convierta en error de
ejecucion (`BorrowMutError`) lo que el tipo podia haber impedido al
compilar. Y que `Drop` no esconda trabajo que puede fallar (escribir,
vaciar un buffer) sin forma de ver el error.

**Errores.** Los fallos esperables (entrada invalida, fichero ausente, dato
fuera de rango, geometria degenerada) se devuelven con `Result` y un tipo de
error que conserve la causa y permita al llamador decidir; no con `panic`.
En codigo de biblioteca y en todo lo que se exporta a WebAssembly, `unwrap`,
`expect` y `panic!` sobre datos que vienen de fuera son un defecto: en
`wasm32-unknown-unknown` un `panic` aborta la instancia entera, y el
JavaScript que llama recibe un `RuntimeError: unreachable` sin contexto, con
el modulo inservible hasta que se recarga. Se aceptan en tests, en
invariantes que el propio tipo garantiza (y entonces con un `expect` que diga
cual), y en el arranque de un binario. Que el error no se convierta en texto
demasiado pronto: comparar cadenas de error en vez de variantes es fragil.
Que no se reutilice un enfoque de errores distinto del que ya tiene el
proyecto sin motivo. Y que un error no se trague en un `let _ =` o un
`.ok()` que nadie mira.

**El limite JS-WASM.** Cada cruce cuesta: lo que no es un numero se copia o
se serializa. Mirar que tipos cruzan (`Vec<f64>` y `&[f64]` se copian a la
memoria lineal o desde ella en cada llamada; un `JsValue` con `serde`
serializa el objeto entero), cuantas veces por operacion se cruza (una
llamada por punto en un bucle de JavaScript es mucho peor que una llamada
con el lote), y quien libera lo que se exporta (un struct exportado con
`#[wasm_bindgen]` vive en el monton de WASM hasta que JavaScript llama a
`free()`; si no se llama, es una fuga). Que los `Result` exportados lleguen a
JavaScript como una excepcion con mensaje util, no como un `unreachable`.
Que el tiempo no use `std::time::Instant` ni `SystemTime` en el objetivo
`wasm32-unknown-unknown`, donde no estan disponibles o fallan: hace falta una
alternativa por compilacion condicional. Que nada bloquee el hilo principal
del navegador (un bucle largo sin ceder, un `thread::sleep`). Y el tamano del
binario: una dependencia nueva, un `format!` o un `Debug` derivado en todo
pueden sumar decenas de kilobytes al `.wasm` que se descarga; el perfil de
`release` (`opt-level`, `lto`, `codegen-units`, `panic = "abort"`) y el paso
de `wasm-opt` se revisan cuando el diff los toca.

**Numerica en coma flotante.** Nada de `==` ni `!=` sobre `f64` salvo contra
un valor que se sabe exacto (cero puesto a proposito, un entero pequeno): se
compara con una tolerancia **explicita y con nombre**, absoluta, relativa o
las dos, elegida segun la magnitud del dato y documentada. Que NaN e
infinitos se traten donde pueden nacer (division por una longitud nula,
`sqrt` o `acos` de un valor que el redondeo saca de rango, `ln` de cero) y
no se propaguen en silencio hasta salir como un resultado plausible: un
`partial_cmp().unwrap()` o un `max_by` que asume orden total revientan con
NaN, y `f64::max` lo descarta sin avisar. Que `as` entre enteros y
flotantes no trunque ni sature sin que se vea. Que las sumas largas (areas,
volumenes, longitudes acumuladas) usen suma compensada (Kahan o Neumaier) o
un orden que limite el error, y que las restas de cantidades casi iguales
(coordenadas grandes con diferencias pequenas, `1 - cos` de un angulo
pequeno) se reformulen para no perder digitos por cancelacion: trasladar al
origen antes de operar, o usar la identidad trigonometrica estable. Que los
angulos tengan una unidad y un rango declarados. Y que los tests numericos
comparen contra un valor calculado de forma independiente con la tolerancia
de la propia implementacion, no contra el valor que imprimio la primera
ejecucion.

**`unsafe`.** Cada bloque `unsafe` tiene que estar justificado por una
necesidad concreta que el codigo seguro no cubre, ser tan pequeno como se
pueda y llevar un comentario `// SAFETY:` que diga que invariante lo hace
correcto y quien lo garantiza. Que compile no demuestra que sea correcto.
En WebAssembly aparece sobre todo al ver la memoria lineal desde JavaScript
(`Float64Array::view`): esa vista queda invalida en cuanto la memoria crece,
y cualquier asignacion posterior puede hacerla crecer. Si el proyecto lo
admite, pasar `cargo miri test` sobre el modulo que cambia.

**Rendimiento y asignaciones en bucles calientes.** Dentro de un bucle que
corre por punto, por triangulo o por fotograma: un `Vec::new()` o un
`collect()` en cada vuelta, un `clone()` de algo grande, un `format!` o un
`to_string()`, un `HashMap` reconstruido, una busqueda lineal que podia ser
un indice. Primero la complejidad (un cuadratico escondido en un `contains`
sobre un `Vec`), despues las asignaciones, y solo despues la mecanica fina.
Una optimizacion sin medicion antes y despues no es un hallazgo ni una
mejora; y una mas rapida que cambia el resultado numerico, el orden o los
errores es un defecto.

**Herramientas y higiene.** Que el diff pase `cargo fmt --check` y
`cargo clippy` sin avisos nuevos, o que cada `#[allow(...)]` nuevo diga por
que. Que no se anadan dependencias sin necesidad, y que las nuevas compilen
para todos los objetivos del proyecto (nativo y `wasm32`). Que las
`features` no rompan la compilacion en alguna combinacion que el proyecto
usa. Que la version minima de Rust y la edicion del proyecto se respeten.

**Tests.** Que la prueba ejerza la promesa observable que el cambio podria
romper, con datos que distingan el comportamiento correcto de un defecto
plausible: los datos reales del proyecto cuando existen, y no solo el caso
feliz con numeros redondos. Que la expectativa se derive de forma
independiente de la implementacion. Que cubra los bordes (vacio, un
elemento, degenerado, NaN, el limite exacto). Que un test de ida y vuelta no
sea el unico: si el codificador y el decodificador comparten el mismo
defecto, la ida y vuelta pasa. Que los tests del lado WASM, si los hay,
corran de verdad en el objetivo `wasm32` y no solo en nativo. Y que exista al
menos un test que falle si se revierte el cambio: es lo que mide el paso de
mutacion.

## Clasificacion de los hallazgos

**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
contrario de lo que dice:

- Un `unwrap` o un indexado sobre datos de entrada en una funcion exportada a
  WebAssembly, con una entrada real que lo dispara: el modulo aborta y la
  aplicacion queda inservible hasta recargar.
- Un NaN que nace en un calculo y sale como un resultado numerico plausible
  que se guarda o se usa para decidir.
- Un bloque `unsafe` cuyo invariante no se cumple en un caso alcanzable (una
  vista de la memoria lineal usada despues de que la memoria crezca).
- Una suma, un volumen o una medicion que pierde precision hasta cambiar un
  resultado que alguien va a firmar o a pagar.

**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:

- Comparacion `==` entre `f64` calculados, que falla con datos reales por un
  error de redondeo.
- Tolerancia sin nombre ni justificacion, demasiado estricta o demasiado
  laxa para la magnitud de los datos reales.
- Un objeto exportado con `#[wasm_bindgen]` que JavaScript nunca libera,
  creado en cada operacion: la memoria crece sin limite.
- Un lote de datos copiado por el limite JS-WASM en cada fotograma o en cada
  punto cuando bastaba una vez.
- Un error esperable que se convierte en `panic` o se traga, y el llamador
  no puede distinguir el fallo del exito.
- Una asignacion en un bucle caliente con efecto medido en el tiempo de una
  operacion que el usuario espera.
- Test nuevo que seguiria verde con el comportamiento revertido.

**MENOR** — todo lo demas:

- Un `clone()` evitable fuera de un camino caliente.
- Un lifetime explicito que el compilador habria inferido.
- Un `#[allow(...)]` sin comentario.
- Un `expect` sobre un invariante que el tipo ya garantiza, con un mensaje
  que no dice cual.
- Una dependencia o un import que el diff deja sin usar.

## Estructura del informe

Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
lo que el esqueleto ya trae:

```markdown
# Informe de revision — <ID de la tarea> (ronda <N>)

- Commit revisado: <sha>
- Revisor: rust-wasm-reviewer
- Veredicto: aprobada

## Hallazgos

<un bloque por hallazgo, con la plantilla de revision.md>

## Alcance
- Ficheros revisados: <los del diff que casaron con los patrones>
- Contexto adicional pedido: <ninguno, o que y por que>
- Limite JS-WASM: <sin cambios de firma exportada, o llamador y .d.ts pedidos y lo encontrado>

## Reproduccion
- Clon: <ruta temporal y rama>
- Build: <comandos, objetivos (nativo, wasm32) y resultado>
- Formato y lints: <cargo fmt --check, cargo clippy y resultado>
- Suite: <comando, resultado, y linea base antes del diff>
- Casos construidos: <entradas reales o extremas usadas para cada hallazgo>
- Mutacion: <que proteccion se quito y que test se puso rojo, o que no>
- Medidas: <tiempos, tamano del .wasm o copias por llamada, si aplican>

## Revisado sin hallazgos
<areas del diff que se miraron y salieron limpias, para que conste que se
miraron>
```

Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
llegar a esa conclusion.

## Lo que esta skill no hace

Ademas de lo que ningun revisor hace (ver revision.md):

- **No es una revision de estilo.** Lo que `cargo fmt` arregla solo, o una
  preferencia entre dos formas idiomaticas equivalentes, no es un hallazgo.
  Un `clone()` o un `Arc` no son un defecto por su aspecto: lo son si se
  demuestra lo que cuestan o lo que esconden.
- **No moderniza por modernizar.** Reescribir codigo que funciona a una
  forma mas nueva, o abstraer lo que hoy es simple, queda fuera del diff
  revisado.
