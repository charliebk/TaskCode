# Informe de revision — TASK-139b (ronda 1)

- Commit revisado: 99a5aa4e26d6e2474b3e60491d8206d8de59feab
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | scripts/verificar-impacto.mjs:411 | implementacion |
| MEN-2 | MENOR | abierto | scripts/verificar-impacto.mjs:463 | implementacion |
| MEN-3 | MENOR | abierto | scripts/verificar-impacto.mjs:411 | implementacion |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/docs/configuracion.md:44-49 y :219-240 | implementacion |

No hay CRITICOS ni IMPORTANTES.

### Alcance y reproduccion

En el clon se instalo y compilo sin errores (`npm install` y `tsc`). La peticion trae la selectiva en verde (815/815), asi que no se repite. Los tres ficheros tocados pasan: 54 tests en verde. El glob de la suite entera es el mismo que usa `npm test`.

### Los cuatro puntos del encargo

1. **¿Llega un verde recortado a finish o al guardian?** No hay ningun camino.
   - El freno con `comando_verificacion_freno` usa el tipo `freno` y escribe su propio memo, que solo lee el freno.
   - El guardian solo lee los memos `completa`, `pesada` y `documentacion`.
   - El memo `selectiva` que usa `finish` solo lo escriben ejecuciones que reciben `selectiva`, es decir, sin tope.
2. **¿Es correcto borrar la variable del entorno de los tests hijos?** Si. La proteccion no tenia test: es MEN-2.
3. **¿Los tests son deterministas?** Si.
4. **¿Esta documentado el caso sin `comando_verificacion_freno`?** A medias: es MEN-4.

### Mutantes

| # | Mutacion | Resultado |
|---|---|---|
| M1 | `topeEfectivo` ignora `selectiva` | ROJO |
| M3 | se pasa `completa` en vez de `p.tipo` | ROJO |
| M2 | la rama `suiteEntera` con un glob vacio | VERDE (MEN-1) |
| M4 | sin el `delete` de la variable | VERDE (MEN-2) |

### Correcciones (coordinador)

- **MEN-1:** test que lanza el script con `selectiva` y un cambio que ningun test nombra. Comprueba que corre un test de fuera de test/core y test/cli. Con M2 cae en rojo.
- **MEN-2:** el test de «no heredan RAMA_BASE» comprueba tambien `TASKCODE_VERIFICACION`. Con M4 cae en rojo.
- **MEN-3:** con la suite entera se quitan «(la completa queda para antes de publicar)» del motivo y el recorte. El test de MEN-1 lo comprueba, y con su mutante cae en rojo.
- **MEN-4:** `finish` solo recibe `selectiva` con `rutas_verificacion_parcial`. Sin comando del freno, el Stop tarda lo que la selectiva entera. La seccion del freno dice que recibe `freno`.

## Regla 4D

- Duplicacion: cumple.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: MEN-1 y MEN-2, corregidos con un test que cae en rojo con su mutante.

## Lecturas fuera del contexto permitido

- freno-stop.ts, guardia-merge.ts, finish-verificacion.ts, config.ts, package.json y README.md: para trazar los memos y comprobar la documentacion.
