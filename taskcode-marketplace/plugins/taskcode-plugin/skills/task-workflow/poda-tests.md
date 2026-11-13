# Poda de tests redundantes

Cada tarea y cada ronda anaden tests y ninguno se retira aunque otro posterior
ya cubra lo mismo. `taskctl doctor` (`poda-tests`) propone abrir una tarea de
poda, con el `taskctl new` ya escrito y la etiqueta `poda`, cuando salta el
aviso de crecimiento de la suite o han pasado mas de `tareas_entre_podas` (30
por defecto) tareas terminadas desde la ultima poda.

## 1. Localizar candidatos

- Cuenta los tests por fichero (`node --test` o la herramienta de perfil del
  proyecto) y empieza por los ficheros con mas tests y los mas lentos.
- Busca **variantes del mismo caso** en tests separados: el mismo nombre con
  otro valor («una clave invalida aborta» con cinco valores), la misma funcion
  con entradas distintas y la misma asercion.
- Busca **setups repetidos**: varios tests que montan el mismo escenario caro
  (un repo, un servidor, ficheros) y solo miran cosas distintas.
- Busca **duplicados**: un test cuyas aserciones ya hace otro.

## 2. Fusionar o borrar

- **Fusionar** variantes en un test con una tabla de casos y un bucle; cada
  asercion lleva un mensaje con el caso, para saber cual fallo. Un subtest por
  caso no reduce nada: cuenta igual.
- **Compartir el montaje**: los tests que montan el mismo escenario pasan a uno
  que lo monta una vez y comprueba todo.
- **Borrar** solo el test cuyas aserciones ya hace otro. En la duda, fusiona.
- Nunca: quitar ni aflojar una asercion, cambiar el codigo de produccion, mezclar
  la poda con cambios de comportamiento.

## 3. La cobertura no baja

Antes y despues de podar, la cobertura de lineas de los ficheros de test
tocados (en Node, `node --test --experimental-test-coverage
--test-reporter=lcov`; en otros lenguajes, su informe lcov o equivalente):
por fichero fuente, el conjunto de lineas cubiertas despues tiene que incluir
el de antes. Si una linea se pierde, se deshace la fusion que la quito. La
cobertura total de la suite no puede bajar.

## 4. Medir y anotar

En el plan de la tarea de poda, antes y despues: numero de tests y duracion de
la suite rapida y de la completa (con la herramienta de perfil, o el resumen
del runner), y la comprobacion de cobertura.
