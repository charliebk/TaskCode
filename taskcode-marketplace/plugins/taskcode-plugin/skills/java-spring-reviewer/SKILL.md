---
name: java-spring-reviewer
description: Revisor por pares de Java y Spring Boot. Se usa si el diff toca .java, pom.xml, build.gradle o application*.yml. Revisa capas de servicio y repositorio, transacciones, excepciones, inyeccion, consultas N+1, validacion de entrada, perfiles y tests con contexto real antes de cerrar la tarea.
---

# Revision por pares de Java y Spring

Revisa el diff de una tarea que toca codigo Java o Spring Boot. **Lo revisa
un agente que no implemento la tarea**: la independencia es el punto, no un
formalismo.

Antes de empezar, lee [revision.md](../task-workflow/revision.md): lo comun a
toda revision (la puerta determinista, una sola ejecucion de la suite por
ronda, la plantilla de cada hallazgo, las rondas, la linea del veredicto que
`taskctl finish` acepta y lo que un revisor no hace). Aqui queda lo propio de
Java y Spring.

## Que recibe este revisor y que no

Recibe el **`git diff` de la rama contra su base**, no el repositorio
entero. Y si el diff toca varios dominios a la vez, recibe **solo la parte
que casa con los patrones de mas abajo**: los ficheros de frontend, de
infraestructura o de otro lenguaje van a su propio revisor, en paralelo.

Si para juzgar un cambio hace falta mas contexto, **pedirlo explicitamente**
(el fichero completo, la entidad que la consulta toca, el `pom.xml`) en vez
de dar por hecho lo que no se ve. Lo que no vale es leer el repositorio
entero "por si acaso": pedir tres ficheros concretos es barato, cargar el
proyecto no.

Si el diff toca tantos dominios distintos que fragmentarlo deja de tener
sentido, el enrutado puede caer a un unico pase generico. Eso lo decide
quien orquesta, no esta skill.

## Patrones de fichero

Con estos patrones se decide si este revisor entra en un diff. Estan en
estilo flow para que un catalogo los recoja **tal cual**, sin reescribirlos:

```yaml
rol: revisor
patrones_archivo: ["**/*.java", "src/main/java/**", "src/test/java/**", "**/pom.xml", "**/build.gradle", "**/build.gradle.kts", "**/settings.gradle", "**/settings.gradle.kts", "**/application*.properties", "**/application*.yml", "**/application*.yaml", "**/bootstrap*.yml", "**/src/main/resources/db/migration/**", "**/src/main/resources/db/changelog/**"]
```

Un servicio de Spring escrito en Kotlin **no lo captura ninguno de esos
patrones, a proposito**. Los criterios de este documento aplican igual a ese
codigo, pero el enrutado automatico no lo va a mandar aqui: si alguien
quiere esa revision, la pide a mano.

## Reproducir antes de reportar

Esto no es leer el diff y opinar. Un hallazgo se reporta **cuando existe el
caso que lo demuestra**, no cuando parece que podria pasar.

1. **Clonar el repo a un directorio temporal** y hacer checkout de la rama.
   No revisar sobre el arbol de trabajo de quien implemento: hereda su
   estado, su cache y sus ficheros sin commitear.
2. **Compilar de cero**: `./mvnw -q verify -DskipTests` o
   `./gradlew build -x test`. Un clon no hereda `target/`, `build/` ni nada
   compilado, y esa es justo la gracia. Si no compila, ahi acaba la
   revision: se reporta eso y nada mas.
3. **Correr la suite entera antes de tocar nada**, para tener la linea base.
   Un test que ya estaba rojo antes del diff no es un hallazgo de esta
   tarea, pero si es un dato que va en el informe. Una sola vez por ronda
   (ver revision.md).
4. **Construir el caso que rompe.** Un test nuevo que falla contra la rama,
   o una llamada real contra la aplicacion levantada. Lo que no se ha
   ejecutado no se afirma.
5. **Mutacion**: romper a proposito la proteccion que el diff dice anadir y
   comprobar que algun test se pone rojo. Si sigue verde, la proteccion no
   tiene red y eso es un hallazgo por si solo.

Tecnicas que dan mas hallazgos que la lectura, por area:

- **N+1 y consultas**: activar el log de SQL
  (`logging.level.org.hibernate.SQL=DEBUG`, o un contador de sentencias
  alrededor del caso) y **contar las consultas con 2 filas y con 20**. Si el
  numero crece con las filas, es un N+1 medido; si no crece, no lo es, por
  mucho que el codigo lo parezca.
- **Transacciones**: forzar la excepcion en mitad del metodo y **mirar en la
  base de datos** si la primera escritura quedo. El rollback se comprueba en
  la tabla, no en la anotacion.
- **Perfiles**: arrancar con el perfil que la tarea toca, no solo con el de
  test. Media configuracion rota solo se ve ahi.
- **Validacion**: mandar la peticion malformada de verdad y mirar el codigo
  de estado y el cuerpo que salen.

## Que se revisa

**Capas de servicio y repositorio.** Que la logica de negocio no se haya
colado en el controlador ni en el repositorio. Que las entidades JPA no
escapen a la capa web serializadas tal cual (cambiar una columna deja de ser
una decision interna y pasa a romper clientes). Que el repositorio no
devuelva entidades gestionadas para que otro las navegue fuera de la
transaccion.

**Transacciones y sus limites.** Donde empieza y donde acaba cada una:

- `@Transactional` en un metodo llamado **desde el mismo bean**: el proxy no
  intercepta la auto-invocacion y la anotacion no hace absolutamente nada.
  Igual en metodos `private`, `final` o `static`.
- Rollback: por defecto solo revierte con `RuntimeException` y `Error`. Una
  excepcion comprobada **commitea** salvo `rollbackFor`.
- Transacciones que envuelven una llamada de red, un envio de correo o una
  espera: la conexion queda ocupada lo que dure el timeout ajeno.
- Escrituras en varias tablas o servicios sin un limite transaccional claro:
  ahi es donde queda el estado a medias.
- `readOnly = true` ausente en consultas puras, y `REQUIRES_NEW` puesto sin
  entender que abre una segunda conexion.

**Gestion de excepciones.** Que no haya `catch (Exception e)` que registra y
sigue como si el fallo no hubiera ocurrido. Que la causa no se pierda
(`throw new X(e.getMessage())` tira la traza). Que las excepciones de
dominio se traduzcan a codigos HTTP con sentido en un `@ControllerAdvice` y
no salgan como 500 con la traza dentro del cuerpo. Que no queden
`printStackTrace` ni bloques `catch` vacios.

**Inyeccion.** Constructor frente a `@Autowired` sobre el campo (lo segundo
esconde dependencias y estorba en los tests). Colaboradores instanciados con
`new` dentro del servicio, que ya no se pueden sustituir. Y sobre todo
**estado mutable en un bean singleton**: un campo no final que se escribe
por peticion es estado compartido entre peticiones concurrentes, y falla
solo bajo carga.

**Consultas N+1.** Relaciones `LAZY` recorridas dentro de un bucle, `EAGER`
puesto para "arreglarlo" (que lo convierte en un problema global), falta de
`join fetch` o `@EntityGraph` donde se sabe que se va a navegar la relacion,
y el caso que casi siempre se cuela: **paginacion junto a un `join fetch` de
coleccion**, que Hibernate resuelve trayendose todo y paginando en memoria
(avisa con `HHH000104` y nadie lee el log).

**Validacion de entrada.** `@Valid` o `@Validated` presentes donde entra el
`@RequestBody`; restricciones declaradas en el DTO y no solo en la entidad;
el manejador que traduce `MethodArgumentNotValidException` a una respuesta
util en vez de a un 500; limites en los parametros que el cliente controla
(tamano de pagina, longitud de listas); y cero concatenacion de entrada de
usuario en JPQL o SQL nativo.

**Configuracion por perfiles.** Propiedades que solo existen en el perfil de
desarrollo y revientan el arranque en el resto. Secretos escritos en un
fichero versionado. `@Profile` que deja un bean sin candidato en produccion.
Y `ddl-auto` en `update` o `create-drop` en cualquier perfil que no sea
estrictamente local.

**Tests con contexto real.** Que la prueba ejercite lo que la tarea cambio y
no un doble de ello: `@MockBean` sobre el repositorio bajo prueba significa
que la consulta rota pasa el test. Que la base de datos de test se parezca a
la real (una en memoria acepta SQL que el motor de produccion rechaza). Que
el `@Transactional` del propio test no este ocultando que el codigo de
produccion nunca commitea. Y que exista al menos un test que falle si se
revierte el cambio.

## Clasificacion de los hallazgos

**CRITICO** — perdida de datos, corrupcion de estado, o el codigo hace lo
contrario de lo que dice:

- `@Transactional` que no aplica por auto-invocacion en un metodo que
  escribe en dos tablas: la segunda falla, la primera queda escrita.
- Excepcion comprobada lanzada dentro de una transaccion sin `rollbackFor`:
  commitea el estado a medias.
- `catch (Exception e)` que se traga el fallo de una operacion de pago o de
  borrado y devuelve 200.
- `ddl-auto: update` activo en el perfil de produccion.
- Secreto o credencial anadido a un fichero de configuracion versionado.
- Consulta de borrado o actualizacion masiva sin el filtro que la acota.

**IMPORTANTE** — comportamiento incorrecto en un caso real, no de borde:

- N+1 **medido** en un endpoint que la tarea toca.
- `@RequestBody` sin `@Valid` en un endpoint expuesto, con restricciones
  declaradas que por tanto no se aplican.
- Excepcion de dominio que llega al cliente como 500 en vez de 404 o 409.
- Estado mutable compartido en un bean singleton.
- Paginacion con `join fetch` de coleccion: pagina en memoria.
- Test nuevo que mockea justo la pieza que la tarea cambio, de modo que
  seguiria verde con el cambio revertido.

**MENOR** — todo lo demas:

- Inyeccion por campo en vez de por constructor.
- Falta `readOnly = true` en un metodo de solo lectura.
- Nivel de log inadecuado, o mensaje que ya no dice la verdad.
- Nombre de metodo de repositorio que no describe lo que consulta.
- Import o dependencia que el diff deja sin usar.

## Estructura del informe

Se rellena el esqueleto que deja `taskctl review`, respetando su cabecera
(ver revision.md), con el nombre de esta skill en `- Revisor:`. Las secciones
propias de este revisor van **despues** de `## Hallazgos`, donde no chocan con
lo que el esqueleto ya trae:

```markdown
# Informe de revision — <ID de la tarea> (ronda <N>)

- Commit revisado: <sha>
- Revisor: java-spring-reviewer
- Veredicto: aprobada

## Hallazgos

<un bloque por hallazgo, con la plantilla de revision.md>

## Alcance
- Ficheros revisados: <los del diff que casaron con los patrones>
- Contexto adicional pedido: <ninguno, o que y por que>

## Reproduccion
- Clon: <ruta temporal y rama>
- Build: <comando y resultado>
- Suite: <comando, resultado, y linea base antes del diff>
- Casos construidos: <que se ejecuto para demostrar cada hallazgo>

## Revisado sin hallazgos
<areas del diff que se miraron y salieron limpias, para que conste que se
miraron>
```

Si no hay nada que reportar, `## Hallazgos` dice **"sin hallazgos"** de
forma explicita, y `## Reproduccion` deja constancia de que se ejecuto para
llegar a esa conclusion.

## Lo que esta skill no hace

Lo que ningun revisor hace esta en revision.md; este no anade nada propio.
