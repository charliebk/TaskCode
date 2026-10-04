---
name: csharp-autocad-ifc-reviewer
description: Revision por pares de codigo C# que interopera con la API de AutoCAD o que produce/consume modelos IFC. Se usa cuando el diff de una tarea toca ficheros .cs, .csproj, .sln, .ifc o .ifcxml, o cuando la tarea menciona AutoCAD, ObjectARX, AcDbMgd, Civil 3D, BricsCAD, IFC, IfcOpenShell, xBIM o BIM. Es una skill de revision, no de implementacion.
---

# Revisor de C# sobre AutoCAD e IFC

Revisa el trabajo de **otro** agente sobre codigo C# que habla con la API de
AutoCAD, con un modelo IFC, o con los dos. El objetivo no es opinar sobre el
diff: es **encontrar el caso que lo rompe y demostrarlo**.

## Cuando aplica

Cuando el diff de la tarea toca ficheros que casan con estos patrones. Se
declaran aqui para que el comando que enruta la revision los lea tal cual:

```yaml
rol: revisor
patrones_archivo: ["**/*.cs", "**/*.csproj", "**/*.sln", "**/*.ifc", "**/*.ifcxml", "**/*.ifcjson"]
```

Matiz que evita revisiones vacias: `**/*.cs` es el patron decisivo. Un diff
que **solo** toca `.csproj` o `.sln` es un cambio de empaquetado, y ahi esta
skill tiene poco que decir mas alla del apartado de referencias a los
ensamblados de AutoCAD; si el diff no contiene C# ni IFC, dilo en el informe
en vez de rellenar.

**C# que no es de AutoCAD ni de IFC.** `**/*.cs` casa con cualquier C#:
tambien con una API web, un servicio de fondo o un juego. Ese diff llega
aqui igualmente, y —al haber casado un patron de dominio— **el revisor
generico no entra**, asi que esta skill es la unica revision que ese cambio
va a tener. La regla en ese caso:

- **Si aplica**: la seccion "Trampas de C# que aparecen aqui" (cultura,
  comparacion de dobles, precision, `catch` vacio, `async void`, nulos,
  recursos no liberados) y todo el metodo — puerta determinista, clon,
  suite, mutacion, caso que rompe.
- **No aplica**: las secciones de interoperabilidad con AutoCAD, de modelo
  de datos IFC y de rendimiento sobre modelos grandes. No se fuerzan
  hallazgos sobre transacciones o unidades que el diff no tiene.
- **Y se dice en el informe**, con esas palabras: que el C# revisado no toca
  AutoCAD ni IFC, que criterios se aplicaron y cuales no, y que por tanto
  conviene una revision generica adicional si el cambio es de peso. Un
  informe que calla esto se lee como una revision de dominio completa
  cuando fue media.

Por que aqui se conserva `**/*.cs` entero y el revisor de frontend, en
cambio, retiro sus patrones ambiguos: es el mismo criterio resuelto al
reves, porque el dato es distinto.

**Se acota el patron cuando existe un sufijo o un corte de ruta que
discrimina; cuando no lo hay, la variable que decide es si renunciar deja el
dominio sin revisor: si lo deja, se conserva la cobertura y se documenta el
hueco en el informe; si el resto de la lista ya cubre el dominio, se
renuncia al patron y se documenta el hueco igual.**

En C# no hay ningun sufijo ni ruta que separe un `.cs` de AutoCAD de un
`.cs` de una API web, y renunciar a `**/*.cs` dejaria sin revisor a todo el
dominio: se conserva la cobertura y el aviso va en el informe. En Angular y
Vue el discriminante tampoco es completo —desde la version 20 el sufijo de
tipo ya no va en el nombre del fichero—, pero alli el resto de la lista
(`*.vue`, `*.component.*`, las plantillas y las rutas bajo `src/app/`) sigue
cubriendo el dominio, asi que los patrones ambiguos se renuncian y el hueco
se documenta igual. Misma frase, dos resultados, porque lo que cambia es si
renunciar deja el dominio sin revisor.

Si el diff toca ademas otros dominios, cada revisor recibe **solo la parte que
casa con su patron**. No pidas el resto del diff por comodidad; pidelo si un
hallazgo concreto lo necesita para sostenerse.

## Antes de revisar: la puerta determinista

La revision **no empieza** hasta que pasan, en este orden:

1. **Build** (`dotnet build` / la solucion completa, en Release si el proyecto
   lo usa).
2. **Linter / analizadores** (analizadores de Roslyn, `dotnet format
   --verify-no-changes`, reglas del `.editorconfig`).
3. **La suite de tests existente**, entera.

Si algo de eso falla, la revision **se detiene ahi**: se reporta el fallo y se
devuelve la tarea. No se gasta un solo token revisando codigo que no compila o
que ya tiene la suite en rojo. Un fallo en la puerta no es un hallazgo de
revision; es un requisito que no se cumplio.

Advertencia especifica del dominio: en muchos entornos la puerta **no puede
incluir a AutoCAD**, porque el producto no esta instalado en la maquina donde
se revisa. Eso no es excusa para saltarse los pasos 1-3, que si se pueden
correr; ver "Lo que no se puede reproducir" mas abajo.

## Como se revisa: reproducir, no leer

Leer el diff sirve para saber **donde mirar**. El hallazgo se construye
ejecutando:

1. **Clonar el repo a un directorio temporal** fuera del arbol de trabajo de
   nadie, y situarse en la rama de la tarea. Un clon nuevo no hereda nada:
   ni paquetes NuGet restaurados, ni `bin/`, ni `obj/`. Restaurar y compilar
   siempre, **y otra vez tras cada cambio de rama dentro del mismo clon**.
2. **Correr la suite entera uno mismo**, y anotar el resultado real (numero de
   tests, fallos, tiempo). "Los tests pasan" sin haberlos corrido no vale.
   **Una sola ejecucion por ronda:** la puerta y la linea base son la misma
   pasada de la suite completa; no se repite. Los mutantes se comprueban con
   el fichero o la clase de test concretos que cubren la linea mutada, no
   con la suite entera. Con varios revisores en paralelo en la misma
   maquina, la suite se corre con concurrencia reducida o por turnos: si no,
   compiten por la CPU y todas tardan mas.
3. **Mutar las protecciones**: romper a proposito la linea que el diff dice
   proteger (el `Commit()`, la comprobacion de `IsErased`, el
   `CultureInfo.InvariantCulture`, el factor de unidades) y comprobar que
   algun test se pone rojo. Si sigue verde, la red de regresion no existe y
   eso ya es un hallazgo.
4. **Construir el caso que rompe**: un test, un fichero IFC minimo, un dibujo
   de prueba, o un programa de consola de veinte lineas. Un hallazgo con
   reproduccion se corrige; un hallazgo sin ella se discute.
5. **Ejercitar la entrada real**, no solo la API interna: el comando que el
   usuario escribe, el exportador completo, el fichero que sale al disco.

Reproducciones baratas que este dominio agradece:

- **Round-trip de IFC**: exportar, volver a leer con una libreria distinta de
  la que escribio (o con un visor), y comparar. Los ficheros IFC rotos suelen
  escribirse sin error y fallar al leerse.
- **Cambiar la cultura del proceso** a una con coma decimal
  (`es-ES`, `de-DE`) y repetir la exportacion/importacion. Rompe mas codigo
  del que parece.
- **Modelo grande de verdad**: si el diff toca rendimiento, medir con un
  modelo del orden de magnitud real, no con tres elementos.

## Que se revisa en este dominio

### Interoperabilidad con la API de AutoCAD

- **Transacciones.** Toda lectura o escritura de la base de datos del dibujo
  va dentro de una transaccion, y toda transaccion que modifica termina en un
  `Commit()` explicito. Sin `Commit()`, el `Dispose` aborta y **los cambios
  desaparecen en silencio**: el comando dice que hizo el trabajo y no lo hizo.
- **`using` / `Dispose`.** La transaccion, el `DocumentLock`, las bases de
  datos laterales (`new Database(...)`) y los `DBObject` creados y **no**
  anadidos a la base de datos van en `using` o se disponen. Y al reves: un
  objeto que ya pertenece a la base de datos **no** se dispone a mano; hacerlo
  es corrupcion, no limpieza.
- **Modo de apertura.** `GetObject(..., OpenMode.ForWrite)` cuando solo se
  lee, o `ForRead` seguido de una escritura sin `UpgradeOpen()`. Objetos
  abiertos con una transaccion y usados dentro de otra.
- **Objetos borrados.** `IsErased` antes de usar un `ObjectId` guardado, e
  iteradores que devuelven borrados cuando se piden explicitamente.
- **`ObjectId` frente a `Handle`.** El `ObjectId` es valido dentro de la
  sesion; persistirlo entre sesiones o entre dibujos no funciona. Lo que se
  persiste es el `Handle`.
- **Hilos y contexto del documento.** La API no es segura para hilos:
  cualquier acceso a `Database`, `Document` o `Editor` desde un `Task.Run`, un
  `Parallel.For` o la continuacion de un `await` que no vuelve al hilo del
  documento. `LockDocument()` cuando se escribe desde contexto de aplicacion,
  desde una paleta o sobre un documento que no es el activo.
  `MdiActiveDocument` puede ser nulo.
- **Excepciones de la API.** Capturar la excepcion generica y tragarse un
  `ErrorStatus` (`eLockViolation`, `eWasErased`, `eNotOpenForWrite`) convierte
  un fallo concreto en un comportamiento raro sin mensaje.
- **Eventos.** Suscribirse a eventos de la base de datos o del gestor de
  documentos y no desuscribirse deja el plugin llamando sobre documentos
  cerrados durante el resto de la sesion de AutoCAD.
- **Estado estatico.** Un plugin vive tanto como la sesion: un `static`
  mutable arrastra estado de un dibujo al siguiente.
- **Referencias a los ensamblados de AutoCAD.** Van con copia local
  desactivada. Copiadas al directorio de salida, el plugin falla al cargar o
  tumba el producto. Y la version del framework debe seguir siendo la que
  soporta la version de AutoCAD declarada.

### Modelo de datos IFC

- **Jerarquia espacial.** Proyecto, emplazamiento, edificio, planta y
  elementos, agregados con las relaciones correspondientes. Un elemento sin
  contencion espacial se escribe sin error y desaparece en la mitad de los
  visores.
- **Identificadores globales.** Deben ser identificadores IFC validos, unicos
  y **estables entre exportaciones**. Regenerarlos en cada exportacion rompe
  el seguimiento de cambios, las anotaciones y la federacion de modelos, y no
  se nota hasta la segunda exportacion.
- **Propiedades.** Conjuntos de propiedades enlazados por la relacion correcta
  y con el tipo de valor correcto. Un numero escrito como texto pasa la
  exportacion y falla en la medicion.
- **Unidades.** La asignacion de unidades del proyecto tiene que coincidir con
  los numeros que se escriben. El error clasico es el dibujo en milimetros
  exportado a un proyecto declarado en metros: el factor 1000 aplicado dos
  veces, o ninguna. Angulos en radianes frente a grados, misma historia.
- **Sistemas de coordenadas.** Colocacion relativa frente a absoluta mezcladas
  en el mismo modelo; el norte real y la georreferenciacion del emplazamiento;
  coordenadas de proyecto frente a coordenadas topograficas. Un modelo con
  coordenadas grandes (del orden de las UTM) escrito con precision
  insuficiente sale desplazado o deformado, no roto: por eso se cuela.
- **Version del esquema.** Lo que declara la cabecera y lo que contiene el
  fichero tienen que ser lo mismo. Entidades y atributos que existen en una
  version y no en otra, entidades marcadas como obsoletas, y la definicion de
  vista declarada frente a la que el fichero cumple de verdad.
- **Serializacion.** Codificacion del fichero y escapado de los caracteres no
  ASCII en nombres y descripciones. Un nombre con una letra acentuada o una
  ene con virgulilla mal escapada invalida el fichero entero.

### Rendimiento sobre modelos grandes

- Una transaccion por elemento dentro de un bucle de decenas de miles de
  elementos, o transacciones anidadas innecesarias.
- Abrir cada objeto para filtrar por una propiedad que se podia filtrar antes
  de abrirlo.
- Materializar la coleccion entera en memoria cuando se podia recorrer.
- Busqueda lineal dentro de un bucle sobre las relaciones IFC: es cuadratico y
  se nota solo a partir de cierto tamano. Indexar por identificador.
- Refrescos de pantalla o escritura en la linea de comandos por elemento.
- Concatenacion de cadenas en el bucle de serializacion.
- **Y la regla que las cubre a todas**: una mejora de rendimiento sin un
  numero medido antes y despues, sobre un modelo del tamano real, no es una
  mejora — es una hipotesis. Pidela medida.

### Trampas de C# que aparecen aqui

- **Cultura.** Convertir numeros a texto o al reves sin cultura invariante al
  escribir o leer IFC, DXF o cualquier formato de intercambio. En una maquina
  con coma decimal el fichero sale corrupto y en la del desarrollador no.
- **Comparacion de dobles.** Coordenadas comparadas con igualdad exacta en vez
  de con la tolerancia del modelo.
- **Precision.** Coordenadas de modelo grandes en simple precision.
- **`catch` vacio** o que captura la excepcion base y sigue como si nada.
- **`async void`**, y esperas sincronas sobre tareas en el hilo de interfaz:
  bloqueo permanente del producto.
- **Nulos.** El documento activo, la seleccion y el resultado de una peticion
  al usuario pueden no existir; el usuario puede cancelar.
- **Recursos no liberados cuando salta la excepcion**: sin `using`, un `return`
  temprano o un fallo deja el bloqueo del documento puesto.

## Clasificacion de hallazgos

**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
contrario de lo que dice. En este dominio:

- Transaccion sin `Commit()` en un camino que dice modificar: el usuario
  ejecuta el comando, no sale error, y el dibujo no cambia.
- Llamada a la API de AutoCAD desde un hilo distinto al del documento: tumba
  el producto y se lleva el trabajo sin guardar del usuario.
- `Dispose` sobre un objeto propiedad de la base de datos.
- Factor de unidades mal aplicado en la exportacion: el modelo entero sale a
  escala equivocada y el error se propaga a mediciones y presupuestos.
- Identificadores globales regenerados en cada exportacion.
- Conversion numerica dependiente de la cultura al escribir el fichero de
  intercambio.
- Un fichero declarado en una version del esquema que contiene entidades de
  otra: el receptor no puede abrirlo.

**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:

- Elementos exportados sin contencion espacial: no se ven en el visor del
  cliente.
- Falta el bloqueo del documento al escribir desde una paleta: falla la
  primera vez que alguien lo usa sin el dibujo enfocado.
- `ErrorStatus` tragado: el comando falla en silencio ante un objeto bloqueado.
- Eventos nunca desuscritos.
- Recorrido cuadratico de las relaciones IFC: correcto, pero el modelo real
  del cliente tarda horas.
- Propiedades escritas con el tipo de valor equivocado.

**MENOR** — todo lo demas: nombres, comentarios que ya no son ciertos,
duplicacion sin consecuencia demostrada, un `using` de mas, estilo.

**Todos los hallazgos se documentan, tambien los que se decide no corregir**,
con el motivo. Sin esa nota, el siguiente lector concluye que hay un bug donde
hay una decision. Un "sin hallazgos" explicito es una respuesta valida;
inventar hallazgos para tener algo que reportar, no.

## Lo que no se puede reproducir

Si AutoCAD no esta disponible en la maquina de revision, hay hallazgos que no
se pueden demostrar ejecutando. En ese caso:

- Reproduce lo que si se puede sin el producto: la logica pura, la
  serializacion IFC, la conversion de unidades, el comportamiento con otra
  cultura, la suite de tests.
- Para lo demas, **dilo tal cual en el informe**: "no verificado, requiere
  AutoCAD instalado", con el caso concreto que habria que ejecutar y el
  resultado esperado. Un hallazgo declarado como no verificado es util; el
  mismo hallazgo presentado como comprobado es una mentira que alguien
  descubrira mas tarde.

Lo que **no** vale es degradar la revision entera a lectura de diff y no
decirlo.

## El informe

Se escribe sobre el fichero de informe de la ronda que genera `taskctl
review`, sin borrar la peticion. Estructura fija:

```
# Informe de revision — <ID de la tarea> (ronda <N>)

- Commit revisado: <sha>
- Revisor: csharp-autocad-ifc-reviewer
- Veredicto: aprobada

## Hallazgos

### CRITICO-1 — <titulo corto>
- Donde: <fichero:linea>
- Que pasa: <comportamiento observado, en una o dos frases>
- Reproduccion: <los pasos exactos que se ejecutaron, y su salida>
- Impacto: <la consecuencia concreta para quien use esto>
- Sugerencia: <la direccion de la correccion, no el parche>

### IMPORTANTE-1 — <titulo corto>
<mismos campos>

### MENOR-1 — <titulo corto>
<mismos campos, mas si se propone no corregirlo y por que>
```

Si no hay nada que reportar, la seccion de hallazgos dice **"sin hallazgos"**
de forma explicita, y se anade que se ejecuto para llegar a esa conclusion.

### La linea del veredicto

`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
hace fail-closed. **Sustituye** la linea de la plantilla; no anadas otra
debajo, porque *todas* las lineas de veredicto del informe tienen que aprobar.

| Linea escrita | Resultado |
|---|---|
| `- Veredicto: aprobada` | aprueba |
| `- Veredicto: aprobada con menores documentados` | aprueba (el valor empieza por `aprobada`) |
| `- Veredicto: cambios-solicitados` | **no aprueba** — es lo correcto si pides cambios |
| `- Veredicto: rechazada` | **no aprueba** |
| `- Veredicto: PENDIENTE (...)` | **no aprueba** — es la plantilla sin sustituir |
| `- Veredicto: **aprobada**` | **no aprueba** — los asteriscos rompen el inicio |
| `- Veredicto: aprobado` | **no aprueba** — `aprobado` no es `aprobada` |
| `Veredicto: aprobada` (sin el guion) | **no aprueba** — no cuenta como linea de veredicto |
| (sin ninguna linea de veredicto) | **no aprueba** |

Reglas del valor, para no pelearse con el parser: tiene que **empezar** por
`aprobada`, y no puede contener la palabra `pendiente` ni la cadena
`cambios-solicitados`. El matiz va en el **cuerpo** del informe, no en esa
linea.

## Lo que esta skill NO hace

- **No implementa la correccion.** Escribe el caso que falla y donde; el
  arreglo lo hace quien implemento la tarea.
- **No reescribe el codigo del otro** ni "aprovecha para" refactorizar,
  renombrar o reordenar. Un revisor que edita deja de ser independiente.
- **No redisena la tarea.** Si la implementacion contradice al diseno, se
  documenta la divergencia; cambiarlo es una decision de la persona
  responsable.
- **No aprueba por simpatia**, ni porque "casi todo esta bien", ni porque la
  tarea ya vaya por la tercera ronda. Tampoco inventa hallazgos para justificar
  el pase.
- **No sustituye a la puerta determinista** de build, linter y tests. Si esa
  puerta esta en rojo, aqui no se empieza.
- **No mueve la tarea de estado, no mergea y no commitea.** Eso es trabajo de
  `taskctl finish`, y solo ocurre si el veredicto aprueba.
- **No revisa el repositorio entero**: revisa el diff que le llega. Si de
  verdad necesita mas contexto, lo pide para un hallazgo concreto.
