# Brainstorm — TASK-105, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura (subagente)

## Enfoque propuesto, con rutas y nombres concretos

- No hay módulos nuevos. B2 toca tres ficheros de `src/`: `fs/decision-documentacion.ts`, `fs/git.ts` y `fs/verificacion.ts`. Además hace falta una guarda de una línea en `hooks/guardia-merge.ts` para que nada observable cambie (ver Límites).
- `decidirVerificacionEntre` (decision-documentacion.ts:69). La salida temprana de la línea 82 pasa de `!documentacionDeclarada(config)` a `!documentacionDeclarada(config) && !parcialDeclarada(config)`. El core ya admite la clave sin `rutas_documentacion` (verificacion-proporcional.ts:113). Sin la clave, el camino es byte a byte el de la 0.14.0: cero git de más.
- La segunda pasada es perezosa. Solo se lanza si `parcialDeclarada(config)`, `diff !== null`, `diff.todas` no está vacío, no incluye `RUTA_CONFIG` y `diff.fueraDeDocs.length > 0`. En cualquier otro caso `decidirVerificacion` ya resuelve sin `fueraDeParcial`. Sus patrones son `patronesParcial(config)`, que ya existe (verificacion-proporcional.ts:93).
- Esa pasada pide a Git solo la lista excluida. No repite `rutasDeTarea` entero: eso relanzaría el `diff -- :(top)` de `todas`, que ya se tiene. Para eso se extrae de `rutasDeTarea` (git.ts:1065) una hermana `rutasFueraDe(base, hasta, patrones, cwd): string[] | null`. La versión del árbol, `rutasDelArbolFueraDe(patrones, cwd)`, sale de `rutasDelArbol` (git.ts:1092). Un solo motor (los pathspec de Git), el mismo que en TASK-100 y TASK-102.
- `conArbol` y `heldoutComoCodigo` se aplican igual a `fueraDeParcial`. Para ello `unir` (decision-documentacion.ts:56) y el añadido de los held-out (línea 87) cubren el tercer campo. Si cualquiera de los lados da null, `fueraDeParcial` se queda en `undefined`, y el core ya lo trata como completa (verificacion-proporcional.ts:145).
- `ResultadoDecision.decision` gana un campo aditivo: `timeoutSelectivaS` = `timeout_verificacion_selectiva` de la BASE. Mismo patrón que `timeoutS` en TASK-101: quien guarda la huella (B3) y quien la busca (B5) la calculan con el timeout de la base, nunca con el del árbol.
- `huellaDeCommit(raiz, ref, comando, timeoutS, contexto?: string)` (verificacion.ts:144) copia la línea 131 de `huellaDelArbol`: añade `ctx\0${contexto}\0` tras la cabecera. Comparadas las dos fórmulas: con el árbol limpio y el contexto añadido dan la misma huella, así que no hace falta subir `VERSION_MEMO`.
- `contextoSelectiva(raiz, base)` (verificacion.ts:227) deja de ser privada y se exporta, para que quien llame a `huellaDeCommit` con contexto use la misma cadena que guarda `verificarConMemo`.
- En `verificarConMemo`, la condición de guardado de la línea 273 pasa a ser `p.tipo === 'completa' || arbolLimpio(raiz)`. Mismo criterio que TASK-102 aplicó al memo de documentación, extendido a la selectiva (reserva en la última sección).

## Que se extiende y que se crea

- Se extiende: `decidirVerificacionEntre` (salida temprana y segunda pasada perezosa). Es el único sitio que comparten finish, el guardián y Stop/review (TASK-101/102).
- Se extiende: `unir` y el bloque de held-out de decision-documentacion.ts, para el campo `fueraDeParcial`.
- Se crean en `fs/git.ts`: `rutasFueraDe` y `rutasDelArbolFueraDe`, extraídas de las dos funciones existentes; `rutasDeTarea` y `rutasDelArbol` las usan por dentro y su firma no cambia.
- Se extienden `huellaDeCommit` (parámetro opcional al final) y `ResultadoDecision` (`timeoutSelectivaS`).
- Pasa a pública: `contextoSelectiva`.
- No se tocan: `core/verificacion-proporcional.ts`, `peticionDeTrabajo`, `freno-stop.ts`, `review.ts`, `finish-verificacion.ts` ni `finish-cobertura.ts`. En finish, `selectiva` ya cae en la completa: la línea 156 solo actúa ante `'documentacion'`.

## Limites que cruza

- Contrato de `decidirVerificacionEntre` con sus tres llamantes. Hoy `selectiva` no sale nunca; tras B2 sí.
  - finish (finish-verificacion.ts:156) y `peticionDeTrabajo` (decision-documentacion.ts:148) solo miran `'documentacion'`: tratan `selectiva` como completa.
  - El guardián **no**: `exencionDocumentacion` (guardia-merge.ts:267) solo corta ante `'completa'`, así que una `selectiva` sigue hasta la línea 280 y busca el memo `'documentacion'` con el comando de la selectiva. Cambiaría el texto del bloqueo y la frontera de D1 quedaría al azar.
  - Propuesta: en B2, cambiar esa guarda a `d.tipo !== 'documentacion'`, con su propio detalle de bloqueo. B5 la completará.
- Formato del memo (`.git/freno-verificacion-selectiva.json`): no cambia el esquema, cambian las condiciones de escritura. `VERSION_MEMO` se queda en 1.
- Configuración: `rutas_verificacion_parcial` y `timeout_verificacion_selectiva` se leen de la base (`configDeRef`), nunca del árbol.
- Coste: sin clave, cero procesos de más. Con clave y diff de código: +1 `git diff` en finish y guardián; +2 (diff y ls-files) por turno de Stop con `conArbol`. Un proceso menos que repetir `rutasDeTarea`.
- Descartado: calcular `fueraDeParcial` en JS con un glob propio (dos motores de pathspec; contra la decisión de TASK-102, git.ts:1088-1089).
- Descartado: que el Stop se salte la pasada parcial (decisiones distintas en Stop y finish; B4 depende de que coincidan).

## La decision de diseño que mas te preocupa (UNA sola)

- No guardar el memo `selectiva` con el árbol sucio cambia el comportamiento del freno Stop, contra el «nada observable cambia todavía». Hoy un turno con cambios sin commitear idénticos al anterior sale del memo; con el criterio, cada turno así vuelve a ejecutar la selectiva (hasta `timeout_verificacion_selectiva`, 600 s). El precedente de TASK-102 era para el comando de documentación, barato.
- Posición: cumplir el criterio en la ranura que leen finish y el guardián (solo árbol limpio) y que el Stop con árbol sucio guarde en una segunda ranura interna de `FICHEROS_MEMO`; `leerMemo` buscaría en las dos. Si la persona prefiere el criterio al pie de la letra, que acepte esa repetición y conste en el Resultado.
- Sin verificar: cuánto ejecuta hoy el Stop con el árbol sucio (mirar `freno-stop.ts:220`).
