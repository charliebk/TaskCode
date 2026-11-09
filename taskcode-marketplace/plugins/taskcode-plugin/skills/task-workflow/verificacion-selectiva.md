# Verificacion selectiva por impacto

Cuando la verificacion completa del proyecto tarda mucho (decenas de minutos),
repetirla en cada fin de turno y en cada ronda de revision no compensa si la
tarea no ha tocado esa parte. El proyecto puede declarar dos verificaciones:

| Clave | Que corre | Quien la usa |
|---|---|---|
| `comando_verificacion` | **todo**, siempre | `finish` y el guardian de merges: la puerta de integracion |
| `comando_verificacion_selectiva` | solo lo afectado por los cambios | el hook `Stop` (fin de turno) y `taskctl review` |

La selectiva solo acelera las rondas. **Antes de integrar se exige siempre la
completa** en verde sobre el commit que entra, aunque las rondas pasaran con la
selectiva. Por eso la selectiva sin la completa es un error de configuracion.

## Declarar las dos claves

```yaml
# .taskcode/config.yml
comando_verificacion: "npm test"                                  # la completa
comando_verificacion_selectiva: "node scripts/verificar-selectiva.js"
timeout_verificacion_selectiva: 600                               # opcional, segundos
```

Sin `comando_verificacion_selectiva`, todo funciona como siempre: el `Stop`
corre la completa y `review` no verifica nada.

## Lo que recibe el comando

- Se ejecuta en la raiz del repo, con el shell del sistema, tal cual.
- La **rama base** de la tarea llega en la variable de entorno `RAMA_BASE`
  (la de integracion, o la principal en un hotfix). No se anade nada al
  comando.
- Verde es salir con codigo 0. Cualquier otro codigo, o pasarse del timeout,
  es rojo.

## Como escribir el clasificador

El mapa de capas es del proyecto: que carpetas son la capa de datos, cuales el
frontend, que tests cubren cada una. El script hace tres cosas:

1. **Listar lo cambiado respecto a la base, incluido el arbol de trabajo.**
   `git diff --name-only $RAMA_BASE...HEAD` no ve lo que aun no se ha
   commiteado, y el fin de turno corre con el arbol sucio. Suma
   `git diff --name-only HEAD` y `git ls-files --others --exclude-standard`.
2. **Traducir cada fichero a lo que hay que correr**, con una tabla propia
   (por ejemplo `src/datos/**` -> tests de datos; `web/**` -> tests del
   frontend).
3. **Correr solo eso**, y salir con su codigo.

## Que cambios fuerzan la completa (corre todo)

El clasificador falla cerrado: ante la duda, corre todo. Como minimo:

- no se puede calcular el diff (`RAMA_BASE` vacia, la base no existe en local,
  clon superficial): corre todo, nunca salgas con 0 sin haber corrido nada;
- un fichero que no cae en ninguna capa de la tabla;
- dependencias y build: lockfiles, `package.json`, `Cargo.toml`, `pom.xml`,
  ficheros de proyecto, configuracion de compilacion o de tests;
- codigo compartido por varias capas, migraciones y esquemas;
- el propio clasificador o su tabla.

## Lo que no puede hacer

- **La completa no se convierte en el clasificador.** `comando_verificacion`
  no depende de argumentos ni de `RAMA_BASE`: corre todo, siempre. Si
  reescribes tu verificador para que decida por impacto, que sea un comando
  aparte.
- **No escribir ficheros en el arbol** (informes, artefactos): ignoralos en
  `.gitignore`. `review` aborta si la verificacion deja el arbol sucio.
- **No regenerar el informe de cobertura** que mide la completa: en las
  rondas con selectiva, la peticion de revision no muestra cobertura porque
  el informe podria ser parcial.

## Que pasa en cada sitio

- **Fin de turno (`Stop`)**: con tarea en curso en la rama, corre la
  selectiva; en rojo devuelve el turno con su salida. Guarda el resultado
  aparte del de la completa: un verde de la selectiva nunca abre un merge.
- **`taskctl review`**: corre la selectiva antes de escribir la ronda (en la
  primera ronda, despues de integrar la base en la rama; las rondas
  incrementales no la integran). En rojo aborta: no abre ronda y la tarea sigue
  en curso; el mensaje dice si la base quedo integrada. En verde, la peticion de
  revision lleva una seccion con el tipo (selectiva), el comando, el
  resultado y su salida.
- **`taskctl finish`**: corre la completa; en rojo no integra y dice como
  correrla.
- **`taskctl doctor`**: avisa si hay completa y falta la selectiva.
