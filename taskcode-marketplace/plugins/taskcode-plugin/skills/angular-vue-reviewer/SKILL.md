---
name: angular-vue-reviewer
description: Revisor por pares de diffs de frontend Angular y Vue. Se usa cuando el diff de una tarea toca ficheros .vue, .component.ts, plantillas de componente, directivas o composables y hay que revisar reactividad y gestion de estado, fugas de suscripciones, limites entre componentes, accesibilidad, rendimiento de renderizado, tipado de props y entradas, y tests de componente antes de cerrar la tarea.
---

# Revision por pares de Angular y Vue

Revisa el diff de una tarea que toca la capa de interfaz en Angular o Vue.
**Lo revisa un agente que no implemento la tarea**: la independencia es el
punto, no un formalismo.

## Que recibe este revisor y que no

Recibe el **`git diff` de la rama contra su base**, no el repositorio
entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
que casa con los patrones de mas abajo**: el backend, la infraestructura o
la base de datos van a su propio revisor, en paralelo. Este revisor no
opina sobre el endpoint, solo sobre como el frontend lo consume.

Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
(el componente padre, el store que se lee, el tipo de la respuesta) en vez
de dar por hecho lo que no se ve. Lo que no vale es cargar el proyecto
entero "por si acaso": pedir tres ficheros concretos es barato.

Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
quien orquesta, no esta skill.

## Patrones de fichero

Con estos patrones se decide si este revisor entra en un diff. Estan en
estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:

```yaml
rol: revisor
patrones_archivo: ["**/*.vue", "**/*.component.ts", "**/*.component.html", "**/*.component.scss", "**/*.component.css", "**/*.component.spec.ts", "**/*.directive.ts", "**/composables/**/*.ts", "**/composables/**/*.js", "**/angular.json", "**/nuxt.config.ts", "**/vue.config.js"]
```

La lista es **deliberadamente estrecha**: solo entran convenciones que no
comparte ningun otro ecosistema. Quedan fuera a proposito, aunque Angular o
Vue tambien los usen:

- `*.module.ts`, `*.guard.ts`, `*.pipe.ts` y `*.resolver.ts` — son
  exactamente las convenciones de NestJS, que es backend.
- `*.spec.ts` a secas — lo usa cualquier proyecto TypeScript con tests. Si
  entra el sufijo `*.component.spec.ts`, que si es de Angular.
- `src/app/**` — es tambien el enrutado por directorios de Next.js, y en
  monorepos la ruta `apps/<lo-que-sea>/src/app/` la generan por igual un
  proyecto de frontend y uno de backend.
- `stores/**` — ese nombre de carpeta lo usan React, Go y cualquier otro; no
  filtra por lenguaje siquiera.

El motivo no es purismo. El enrutado da este revisor por bueno **en cuanto
casa un patron**, y el revisor generico solo entra cuando **no** casa
ninguno: un patron de mas no anade un revisor, **sustituye** al que tocaba.
Un diff de backend capturado aqui acabaria revisado solo por una skill que
se declara incompetente para el.

La contrapartida, asumida: un diff que **solo** toca `auth.guard.ts`, un
store de Pinia o un test que no es de componente no llega aqui, cae al
revisor generico. Eso es degradacion, no perdida — el generico revisa
correccion, casos borde, tests y limites. Si hace falta ademas esta revision
sobre esos ficheros, se pide a mano.

Un componente de React o de Svelte tampoco llega aqui: buena parte de los
criterios de accesibilidad y de rendimiento le aplican igual, pero el
enrutado automatico no lo va a mandar a este revisor.

## Reproducir antes de reportar

Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
caso que lo demuestra**, no cuando parece que podria pasar. En frontend esto
importa el doble: casi todos los defectos de verdad (fugas, renders de mas,
foco perdido) son **invisibles en el diff** y evidentes en cuanto se
ejercita la vista.

1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
   No revisar sobre el arbol de quien implemento: hereda su estado, su cache
   de build y sus ficheros sin commitear.
2. **Instalar con el lockfile**: `npm ci` (o el equivalente del gestor del
   proyecto), no `npm install`. Un clon no hereda `node_modules`, y `ci`
   evita revisar contra un arbol de dependencias distinto del real.
3. **Compilar y pasar el linter y los tipos**: la build de produccion, no
   solo el servidor de desarrollo. Muchos errores de tipado solo salen ahi.
   Si no compila, ahi acaba la revision.
4. **Correr la suite entera antes de tocar nada**, para tener la linea base.
5. **Levantar la aplicacion y ejercitar la vista de verdad**, con el
   navegador, entrando y saliendo de la ruta y con datos que se parezcan a
   los reales en volumen.
6. **Mutacion**: quitar a proposito la proteccion que el diff anade (el
   `trackBy`, la baja de la suscripcion, la validacion) y comprobar que
   algun test se pone rojo. Si sigue verde, no hay red.

Tecnicas que dan mas hallazgos que la lectura, por area:

- **Fugas**: montar y desmontar el componente 20 veces navegando de ida y
  vuelta, y contar lo que queda vivo (un contador en el `subscribe`, los
  listeners del elemento, o una comparativa de instantaneas de memoria). Si
  el numero crece con las vueltas, es una fuga **medida**; si se mantiene,
  no lo es.
- **Rendimiento**: contar renders o ciclos de deteccion (un contador en el
  render, o el profiler de las herramientas del framework) con 10 elementos
  y con 1000. El dato es la diferencia, no la intuicion.
- **Accesibilidad**: recorrer la vista **solo con teclado** (Tab, Shift+Tab,
  Enter, Espacio, Escape) y pasar un analizador automatico sobre la vista ya
  montada. Reportar la regla concreta que falla y el elemento, no "no es
  accesible".
- **Reactividad**: cambiar el dato en su origen y comprobar en la vista real
  que se refleja, sin forzar la deteccion de cambios a mano.

## Que se revisa

**Gestion de estado y reactividad.** Que el estado tenga un unico dueno y no
este duplicado entre el store y el componente, donde acaba
desincronizandose. Que la reactividad no se pierda por el camino:
destructurar un objeto reactivo de Vue devuelve valores sueltos que ya no
reaccionan; mutar un array en el sitio bajo `OnPush` no cambia la referencia
y la vista no se entera. Que los valores derivados sean derivados
(`computed`) y no copias que alguien tiene que acordarse de actualizar, y
que no escondan efectos secundarios. Que los observadores tengan motivo:
un `watch` profundo sobre una estructura grande se paga en cada cambio.

**Ciclo de vida y fugas de suscripciones.** Toda suscripcion, temporizador,
listener de `window`, `ResizeObserver` o `IntersectionObserver` abierto en
el montaje tiene que cerrarse en el desmontaje. Los sitios donde mas se
cuela: suscripciones creadas en el gancho de cambios de entrada, que se
acumulan **una por cambio**; observadores registrados fuera del contexto de
`setup`, que no se limpian solos; y flujos infinitos (eventos, intervalos,
websockets) que no se cierran por si mismos. En una vista de ruta, cada fuga
se multiplica por cada navegacion.

**Limites entre componentes.** Que el hijo no mute lo que recibe por
propiedad (Vue avisa con primitivos y calla con objetos; Angular no avisa en
absoluto). Que un componente de presentacion no lea el store global por su
cuenta, porque deja de poder reutilizarse y de poder probarse aislado. Que
la logica de negocio no viva en la plantilla. Que el contrato sea entrada
mas evento cuando el padre es el dueno del dato, en vez de un enlace
bidireccional que difumina quien manda. Y que no se manipule el DOM interno
de un hijo desde el padre.

**Accesibilidad.** Elementos interactivos que son un `div` con un manejador
de clic, sin rol, sin poder recibir foco y sin responder al teclado. Campos
sin etiqueta asociada. Imagenes sin texto alternativo, o con uno redundante.
Dialogos que no atrapan el foco, no lo devuelven al cerrarse y no responden
a Escape. Atributos ARIA que contradicen el rol del elemento o que apuntan a
un identificador que no existe. Estados que cambian sin anunciarse. Foco
visible eliminado sin nada que lo sustituya. Y el orden del DOM discrepando
del orden visual.

**Rendimiento de renderizado.** Listas sin identidad estable (`trackBy`
ausente, o la clave puesta al indice en una lista que se reordena o se
edita): los nodos se recrean, se pierde el foco y el estado local de cada
fila. Funciones o getters invocados desde la plantilla, que se reevaluan en
cada ciclo. Componentes caros sin estrategia de deteccion acotada.
Transformaciones impuras en la plantilla. Listas largas sin virtualizacion.
Y lo que engorda el paquete: importar la libreria entera para usar una
funcion, o cargar de golpe una ruta que podria ir aparte.

**Tipado de propiedades y entradas.** `any` en una entrada es un contrato
sin contrato. Propiedades declaradas sin tipo, sin obligatoriedad y sin
valor por defecto, con la plantilla asumiendo despues que el dato viene.
Aserciones de no-nulo sobre una entrada que perfectamente puede llegar sin
valor, que convierten un caso previsto en una pantalla en blanco. Eventos
emitidos con carga sin tipar. Y contratos que solo se sostienen porque el
proyecto tiene el modo estricto apagado.

**Tests de componente.** Que la prueba haga algo mas que montar y comprobar
que no explota. Que consulte por rol y por texto accesible y no por clases
CSS ni por la forma del arbol, porque lo segundo se rompe al maquetar y no
detecta ninguna regresion real. Que cubra los estados de carga, de vacio y
de error, no solo el camino feliz. Que no doble justo la pieza que la tarea
cambio. Que espere al ciclo de renderizado antes de aseverar, en vez de
depender de que llegue a tiempo. Y que exista al menos un test que falle si
se revierte el cambio.

## Clasificacion de los hallazgos

**CRITICO** — perdida de datos, corrupcion de estado, o la interfaz hace lo
contrario de lo que dice:

- Suscripcion no cerrada en un componente de ruta que ademas dispara una
  escritura: cada navegacion duplica las peticiones y los datos escritos.
- El envio del formulario se dispara dos veces por un manejador duplicado, y
  crea dos registros.
- El store no se limpia al cerrar sesion y la vista muestra datos del
  usuario anterior.
- Una accion destructiva ejecutandose sin confirmacion porque el dialogo
  resuelve por defecto a "aceptar".
- Un valor de configuracion sensible incrustado en el codigo del cliente,
  que viaja en el paquete servido al navegador.

**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:

- Lista editable sin identidad estable: al refrescar se pierde el foco y lo
  escrito en la fila.
- Dialogo sin trampa de foco, sin cierre con Escape y sin devolver el foco
  al abridor: con teclado la vista queda inutilizable.
- Entrada tipada como `any` u obligatoria por asercion, con la plantilla
  accediendo a un campo que puede no venir: pantalla en blanco.
- Observador o intervalo que sigue disparando peticiones despues de salir de
  la vista.
- Campo de formulario sin etiqueta asociada en un flujo que se usa a diario.
- Test nuevo que consulta por clase CSS y por tanto seguiria verde con el
  comportamiento revertido.

**MENOR** — todo lo demas:

- Clave por indice en una lista que no se reordena ni se edita.
- Componente barato sin la estrategia de deteccion acotada.
- Estilo global anadido donde bastaba uno con alcance al componente.
- Texto alternativo redundante que el lector de pantalla repite.
- Import o dependencia que el diff deja sin usar.

Todos los hallazgos se documentan, **tambien los que se decide no
corregir**, con el motivo. Un "sin hallazgos" explicito es una respuesta
valida; inventar hallazgos para tener algo que reportar, no.

## Estructura del informe

`taskctl review` deja el esqueleto del informe en la carpeta de revision de
la tarea, numerado por ronda. **Se rellena ese esqueleto, respetando su
cabecera**: el titulo tal cual, la linea `- Commit revisado:` con el sha, la
linea `- Revisor:` con el nombre de esta skill, y la linea `- Veredicto:`,
que se **sustituye** en su sitio — nunca se borra de la cabecera ni se
repite mas abajo. Las secciones propias de este revisor van **despues** de
`## Hallazgos`, donde no chocan con lo que el esqueleto ya trae:

```markdown
# Informe de revision — <ID de la tarea> (ronda <N>)

- Commit revisado: <sha>
- Revisor: angular-vue-reviewer
- Veredicto: aprobada

## Hallazgos

### CRITICO-1 — <titulo corto>
- Donde: <fichero:linea>
- Que hace hoy: <comportamiento observado>
- Como se ha reproducido: <pasos o test, y la medida obtenida>
- Por que es CRITICO: <consecuencia concreta>
- Que deberia hacer: <la correccion propuesta, no aplicada>

### IMPORTANTE-1 — <titulo corto>
<mismos campos>

### MENOR-1 — <titulo corto>
<mismos campos, mas si se propone no corregirlo y por que>

## Alcance
- Ficheros revisados: <los del diff que casaron con los patrones>
- Contexto adicional pedido: <ninguno, o que y por que>

## Reproduccion
- Clon: <ruta temporal y rama>
- Instalacion y build: <comandos y resultado>
- Suite: <comando, resultado, y linea base antes del diff>
- Vista ejercitada: <ruta, navegador, volumen de datos, recorrido de teclado>
- Casos construidos: <que se ejecuto para demostrar cada hallazgo>

## Revisado sin hallazgos
<areas del diff que se miraron y salieron limpias, para que conste que se
miraron>
```

Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
llegar a esa conclusion.

Dos rondas es lo normal, no una excepcion: la ronda 2 revisa las
correcciones de la ronda 1, que es justo donde entran los fallos nuevos. En
la ronda 2 se comprueba **cada hallazgo de la ronda anterior** ademas del
codigo nuevo.

## La linea del veredicto

`taskctl finish` decide si la tarea puede cerrarse leyendo esa linea, y lo
hace fail-closed: acepta una linea que, sin espacios y en minusculas,
empiece por `- veredicto:` y cuyo **valor empiece** por `aprobada`. Si el
valor contiene `pendiente` o `cambios-solicitados`, no aprueba. Y si el
informe tiene varias lineas de veredicto, **todas** tienen que aprobar — por
eso se **sustituye** la linea de la plantilla, no se anade otra debajo.

| Linea escrita | Resultado |
|---|---|
| `- Veredicto: aprobada` | aprueba |
| `- Veredicto: aprobada con correcciones menores` | aprueba (el valor empieza por `aprobada`) |
| `- Veredicto: cambios-solicitados` | no aprueba, y es lo correcto si hay CRITICO o IMPORTANTE |
| `- Veredicto: rechazada` | no aprueba |
| `- Veredicto: no aprobada` | no aprueba: el valor no *empieza* por `aprobada` |
| `- Veredicto: PENDIENTE (rellenar)` | no aprueba: es la plantilla sin sustituir |
| `- Veredicto: **APROBADA**` | no aprueba: los asteriscos rompen el inicio |
| `- Veredicto: aprobado` | no aprueba: `aprobado` no es `aprobada` |
| `Veredicto: aprobada` | no cuenta como linea de veredicto, y sin ninguna no aprueba |

El matiz va en el cuerpo del informe, nunca en esa linea. Un revisor que
escriba el veredicto en su propio vocabulario bloquea el cierre y obliga a
un commit de normalizacion que no arregla nada.

## Lo que esta skill no hace

- **No implementa la correccion.** Propone el arreglo en el informe; lo
  aplica quien implemento la tarea.
- **No reescribe el codigo ajeno** ni commitea en la rama revisada. Los
  unicos ficheros que toca son los suyos temporales y el informe.
- **No aprueba por simpatia.** Si hay un CRITICO o un IMPORTANTE sin
  corregir, el veredicto es `cambios-solicitados`, aunque el resto del diff
  este impecable y aunque la tarea vaya con prisa.
- **No es una revision de estetica.** Se revisa comportamiento,
  accesibilidad y contratos, no si el color gusta ni si el espaciado
  convence. Una preferencia visual sin consecuencia medible no es un
  hallazgo.
- **No inventa hallazgos** para que el informe no salga vacio.
- **No revisa ficheros fuera de sus patrones**: si al leer el diff aparece
  algo de otro dominio que preocupa, se anota en una linea y se deja para su
  revisor, no se juzga aqui.
- **No sustituye a la puerta determinista** (build, linter, tests). Si eso
  esta rojo, no hay nada que revisar todavia.
