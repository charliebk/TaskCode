# ROADMAP de tareas (`tareas/ROADMAP.md`)

Lee esto antes de editar `tareas/ROADMAP.md` a mano, si el proyecto ya tiene
un ROADMAP propio o si un aviso de una transicion habla de el.

## Que es

Una tabla por hito (el campo `sprint` de cada tarea) con las columnas Paso,
Tarea, Titulo, Complejidad, Depende de y Estado, mas un resumen de lo que
esta **en marcha** y lo que esta **listo para empezar**. El orden sale de las
dependencias: ninguna tarea va antes que aquellas de las que depende y, a
igualdad, va primero la del hito anterior y luego la de numero menor. Las
terminadas salen sin numero de paso. Un ciclo de dependencias no aborta
nada: sale en una seccion "Dependencias circulares" y como aviso.

## Cuando se regenera

`new`, `plan`, `approve` y `finish` (tras el merge) lo regeneran dentro de su
propio commit, pero solo cuando ese commit cae en la rama de integracion
(`rama_base`). En la rama de una tarea no se toca nunca: por eso dos ramas en
paralelo no chocan en el al cerrar. No lleva fecha: si nada cambia, no entra
en el commit. A mano: `taskctl roadmap` lo muestra sin escribir y
`taskctl roadmap --escribir` lo regenera (sin commitear).

## La marca y la regla de no pisar

La tercera linea de un ROADMAP generado es exactamente:

    <!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->

Se compara la linea entera, no un trozo. Las transiciones solo escriben el
fichero si lleva esa marca o si no existe y nunca ha existido en git. No lo
tocan nunca si:

- no lleva la marca (es del proyecto, aunque lo genere otro script);
- esta declarado en `rutas_sincronizacion` (lo regenera el comando del
  proyecto);
- tiene cambios sin commitear (avisan; commitealos o descartalos y regenera);
- existio y se borro (avisan; `roadmap --escribir` lo recrea);
- en disco se llama con otras mayusculas, p. ej. `Roadmap.md`.

Si algo falla al generarlo (una `tarea.md` ilegible, una zona manual sin
cerrar), el fichero se queda como estaba, la transicion sigue y se avisa.

## La zona manual

Todo lo que va entre una linea que empieza por `<!-- manual:inicio` (y acaba
en `-->`) y la linea `<!-- manual:fin -->` se conserva byte a byte. Ahi van
el motivo de cada hito y lo que quieras escribir a mano. Un `### Hn — titulo`
por hito dentro de la zona da el titulo de la tabla de ese hito y su orden:
los hitos salen en el orden de esos titulos, y los que no tienen, al final
por numero. Fuera de la zona, cualquier edicion se pierde en la siguiente
regeneracion.

## Migrar un proyecto que ya tiene su ROADMAP

Mientras el ROADMAP propio no lleve la marca, taskctl lo deja en paz. Para
pasarlo al de taskctl:

1. `taskctl roadmap --comparar`: genera en seco y lista, sin escribir nada,
   lo que difiere del actual (tareas, hitos, dependencias, estado y zona
   manual). Sale con 1 si hay diferencias.
2. Corrige lo que salga: normalmente, mover a una zona manual los textos y
   los `### Hn — titulo` de los hitos, o arreglar dependencias y estados que
   el script propio calculaba distinto.
3. Cuando `--comparar` salga limpio, `taskctl roadmap --escribir` lo
   sustituye (con la marca y conservando la zona manual). Sin comparacion
   limpia se niega. Revisa el diff, commitealo y retira el script propio.

Con una version vieja del plugin, un ROADMAP con la marca se queda
desactualizado sin aviso: actualiza el plugin en todas las maquinas.
