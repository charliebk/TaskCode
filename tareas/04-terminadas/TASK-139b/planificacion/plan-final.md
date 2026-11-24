# Plan — TASK-139b: la selectiva no recorta en silencio (parte b de TASK-139)

Redactado por el coordinador (modo rapido; el diseno ya se decidio en el plan de TASK-139).

## Enfoque propuesto

Duracion estimada: 45 min (parte b del troceo de TASK-139; senales: 2 ficheros de produccion, src/fs/verificacion.ts y scripts/verificar-impacto.mjs, mas README y config; 2 criterios)

1. `verificarConMemo` (src/fs/verificacion.ts) ya anade `RAMA_BASE` al entorno del comando. Ahora anade tambien `TIPO_VERIFICACION` con el tipo de la peticion (`selectiva` en review y finish, `freno` en el Stop, `completa`, `documentacion`), en el mismo sitio. La constante se exporta junto a `VARIABLE_RAMA_BASE`.
2. scripts/verificar-impacto.mjs:
   - Con `TIPO_VERIFICACION=selectiva`, el tope es infinito: se corren todos los afectados.
   - Si no sabe que afecta (`todo`), corre la suite completa (`npm test`) en vez de los directos.
   - La salida lo dice («sin tope: verificacion de review/finish»).
   - Con `freno`, sin la variable (a mano) o con `VERIFICAR_IMPACTO_TOPE` explicito fuera de selectiva, sigue igual.
3. .taskcode/config.yml: `timeout_verificacion_selectiva` pasa a 3600, para que quepan todos los afectados o la completa. El freno sigue recortado y termina rapido; el timeout solo es un techo.
4. README del plugin: la variable documentada en la seccion de la verificacion selectiva, para cualquier proyecto.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- El entorno con `RAMA_BASE` de `verificarConMemo`: la variable nueva entra en el mismo objeto `env`.
- `seleccionar(..., tope)` y `leerTope` de verificar-impacto: sin tope = `Infinity`, sin funcion nueva. `npm('test', dirPlugin)` para la completa.
- Los tests existentes de verificacion (test/fs) y de verificar-impacto (test/scripts) y sus helpers.
- Nuevo: la constante `VARIABLE_TIPO_VERIFICACION` y una funcion pura `topeEfectivo(env)` en el script, para probarla sin procesos.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Review y finish tardan mas cuando hay muchos afectados: es justo lo que pide el criterio. El freno no cambia.
- Un proyecto cuyo comando ignore la variable no cambia nada.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 test (un comando que vuelca su entorno: con selectiva llega `TIPO_VERIFICACION=selectiva`, con freno `freno`). README: la asercion va en el test existente de documentacion, si lo hay.
- Criterio 2: 2 tests (`topeEfectivo` puro con cada tipo; y verificar-impacto `--listar` con `TIPO_VERIFICACION=selectiva` no recorta, y con `freno` si).

Cada uno se comprueba con su mutante.

## Lo que necesita decision de una persona

Nada abierto.
