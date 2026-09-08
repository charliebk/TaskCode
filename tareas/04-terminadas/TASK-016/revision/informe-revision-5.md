# Informe de revision — TASK-016 (ronda 5)

- Commit revisado: 8126f95
- Revisor: un agente independiente, distinto de los seis anteriores
- Lo que dijo el revisor: **cambios-solicitados** (2 criticos, 1 importante, 2 menores
  y cinco defectos de calidad en los tests y comentarios)
- Veredicto: aprobada tras aplicar todos sus hallazgos y verificarlos uno a uno
  ejecutando el binario. Ver la nota de cierre: esta ultima tanda de correcciones
  NO tiene revision independiente, y es una decision consciente.

Encargo: verificar el rediseño de la ronda 4 y **buscar la quinta puerta**.

Linea base: 747 tests, 744 pass, 3 fail (los tres conocidos de Windows).

## Lo que confirma

Los tres CRITICOS de la ronda 4, cerrados y reproducidos uno a uno. Ademas
ejecuto la secuencia alternada `simple → alta → media → critica → simple → alta`
rellenando salidas en cada vuelta: seis vueltas, la ronda siempre avanza, cero
ficheros inexistentes nombrados, cero afirmaciones falsas. El modelo de tres
preguntas aguanta ahi.

## CRITICO — un scaffold que falte no se recreaba nunca

**Corregido y verificado.**

La pregunta (b) miraba **solo** las peticiones de rol, y el bucle de escritura
era todo-o-nada: si faltaba un scaffold de salida — por una muerte entre la
peticion y su scaffold, o porque alguien lo borrara por parecer basura — no se
recreaba jamas. El rol se quedaba con peticion y **sin sitio donde escribir**.

Con una salida menos en disco se disparaban ademas dos efectos peores: la
peticion afirmaba *"esta tarea se planifico con un solo rol, asi que aqui no hay
desacuerdos que resolver"* habiendose planificado con dos —y le desactivaba al
unificador la deteccion de desacuerdos, que es la razon de ser del item—, y el
CLI decia *"Re-planificacion, salidas anteriores, tu feedback"* en una **primera
vuelta** que nadie habia ejecutado.

## CRITICO — peticiones de rol rancias

**Corregido y verificado.**

Las peticiones de rol se toleraban por nombre, sin comprobar que su contenido
siguiera describiendo el juego de roles de hoy. Al reutilizar el numero de ronda
con un juego distinto quedaban dos ficheros contradiciendose **en la misma
carpeta, la misma ronda y el mismo segundo**: uno diciendo *"Eres el unico rol
que se lanza en esta tarea"* y el de al lado *"Trabajan en paralelo contigo, sin
verte: arquitectura, testing"*.

No es cosmetico: el bloque de compañeros es una de las dos medidas que el propio
codigo declara "que no son adorno", porque sin el cada agente cubre todo por si
acaso y N puntos de vista se vuelven uno con N firmas.

### La distincion que faltaba

Los dos criticos se cierran con la misma regla, que ahora esta escrita en el
codigo: **la naturaleza del artefacto decide como se escribe.**

- La peticion de rol y la del unificador son **derivadas**: se calculan enteras
  a partir de la tarea y del juego de roles, no llevan dentro el trabajo de
  nadie. Se **regeneran**.
- El scaffold de salida **si** puede llevar trabajo dentro: es donde el agente
  vuelca su respuesta. Se tolera si tiene contenido y solo se crea cuando falta.

## IMPORTANTE — el testigo se escribia saltandose el guard

**Corregido y verificado.** Era el unico artefacto que no pasaba por la
comprobacion de ruta ocupada, asi que con un directorio en su sitio salia
`taskctl no pudo arrancar` — literalmente el sintoma que este fichero dice haber
arreglado ya dos veces. Ahora da el mensaje accionable, tambien para un fichero
de solo lectura.

## MENOR corregido

- La lista de salidas decia `— rol rol desconocido` para una salida de un rol
  retirado o renombrado a mano.

## MENOR documentado y NO corregido

- Un testigo con otro *case* en un filesystem case-insensitive sigue siendo
  invisible al contador pero bloquea la escritura. Exige un renombrado manual.
- Al relanzar por subida de roles, una salida ya respondida de la ronda anterior
  queda en disco y el unificador no la ve (solo se listan las de `rondaRoles`).
  Es coherente con "consolidar el brainstorm de una ronda", pero nadie avisa de
  que ese contenido queda huerfano.

## Lo mejor de esta ronda: la deuda que destapo de mi propio rediseño

Aqui es donde la revision aporto mas, y no fueron los bugs:

1. **Dos mutantes vivos.** Elegir "la ronda mas alta reutilizable" y aplicar la
   regla de cero bytes a las peticiones de rol **no tenian test**: se podian
   revertir y todo seguia verde. Los dos tienen ahora su test, y esta verificado
   que mueren.
2. **Un mutante EQUIVALENTE**, que es el hallazgo mas fino de las cinco rondas.
   Probo que el comentario del testigo atribuia el arreglo del critico de la
   ronda 4 al mecanismo equivocado: no lo cierra que la peticion se regenere,
   lo cierra que la ronda avance. Quien leyera ese comentario habria protegido
   la linea que no toca. Corregido: se regenera por defensa en profundidad y por
   coherencia con su naturaleza, y el comentario lo dice asi.
3. **Un test tautologico escrito por mi**: definia su propio regex local y lo
   aseveraba contra si mismo, asi que no podia ponerse rojo por ningun cambio en
   `src/`. Es exactamente el defecto que la cabecera de ese fichero dice venir a
   evitar — **se cuela hasta cuando lo estas buscando**. Sustituido por uno que
   asevera contra los helpers de produccion.
4. **Cinco comentarios de mutacion citando identificadores que el rediseño habia
   borrado** (`rondaCompleta`, `SALIDA_ROL_RE`). Cinco instrucciones que nadie
   podia ejecutar, en un fichero que exige saber decir la mutacion de cada test.
5. **`rondas.ts` decia compartirse con `plan.ts`** y, tras el rediseño, habia
   vuelto a tener un solo consumidor: existian exactamente los dos numeradores
   que su docstring presumia de haber evitado.

## Nota de cierre

El revisor emitio **cambios-solicitados**, y con razon. Todos sus hallazgos —los
dos criticos, el importante, el menor de formato, los dos mutantes vivos, el
test tautologico y los cinco comentarios muertos— **estan aplicados y
verificados**: cada correccion se comprobo ejecutando el binario sobre un clon
limpio, y cada mutante nuevo se aplico al codigo para ver el rojo antes de darlo
por bueno.

Lo que **no** tiene esta ultima tanda es una sexta revision independiente.
Decision de Carlos del 2026-09-08, con el coste delante: cerrar aqui. Queda
dicho para que quien lo lea sepa exactamente que garantia tiene y cual no.
