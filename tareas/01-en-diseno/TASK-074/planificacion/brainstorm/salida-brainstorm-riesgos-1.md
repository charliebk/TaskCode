# Brainstorm — TASK-074, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: `taskcode-plugin:brainstorm-riesgos`

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Lcov viejo da la puerta por buena (falso verde).** `coverage/` en
  `.gitignore` sobrevive a los `checkout`: se generó en la tarea A y se lee al
  cerrar la B, o antes de los commits de corrección. Lcov no lleva commit ni hash
  del fuente. Consecuencia: el freno aprueba en silencio líneas que nadie
  ejecutó. Mitigación: en `finish`, solo vale un lcov con mtime posterior al
  arranque de `comando_verificacion` en esa misma invocación; si no, aborta;
  nunca «sin datos = verde».
- **En review el lcov es viejo por construcción.** Sin ronda incremental,
  `review` lanza primero el update que mergea la base (review.ts:411-416) y
  calcula el diff después: si la base tocó el mismo fichero, las líneas del lcov
  ya no son las de HEAD. Consecuencia: hallazgos desplazados dados por ciertos.
  Mitigación: anotar la fecha del lcov frente a la de HEAD y degradar a aviso si
  el lcov es anterior al commit de HEAD.
- **Rutas de `SF:` que no casan con las del diff: ningún dato.** c8 o
  `node --test` escriben absolutas (en Windows con `\`, letra de unidad en otro
  case, o 8.3 `NULLCA~1`, que aparece en este equipo); Jest o un monorepo,
  relativas al paquete; aquí `npm test` corre en
  `taskcode-marketplace/plugins/taskcode-plugin` y git da rutas desde la raíz.
  Consecuencia: «ausente = 0 %» pone todo en rojo; «ausente = sin dato» pasa
  siempre. Mitigación: resolver `SF` contra un directorio base declarado,
  `realpath`, sin mayúsculas en win32; si ninguna ruta cambiada casa, error
  explícito y no 0 hallazgos.
- **Se mide el compilado, no el fuente.** Aquí la cobertura corre sobre
  `dist/test/**/*.test.js` (package.json:18) y `dist` está en
  `excluir_de_revision`; sin source maps, `SF` apunta a `dist/src/*.js` con
  líneas de JS. Consecuencia: ningún `src/*.ts` cambiado tiene registro, o lo
  tiene con líneas que no corresponden. Mitigación: detectar que el lcov solo
  cubre rutas excluidas y avisar de mala configuración.
- **El umbral se lee de la config de la rama.** El agente edita
  `.taskcode/config.yml` en su rama y lo baja o quita. `puertaVerificacion` lee
  `resolverConfig(o.cwd)` (finish-verificacion.ts:68); held-out lee de la base a
  propósito (MEN-2 de TASK-073, finish-heldout.ts:17,192). Consecuencia: se lo
  salta el mismo a quien frena. Mitigación: umbral y ruta del lcov con
  `configDe(ramaBase)`.
- **Líneas no ejecutables contadas como no cubiertas.** Comentarios, blancos,
  `interface`/`type`, `}`, imports eliminados al compilar, `.md`/`.yml`/`.sh`.
  Consecuencia: ruido que entrena a ignorar el freno. Mitigación: hallazgo solo
  una línea cambiada con `DA:n,0`; sin `DA` es «no aplica»; un fichero sin `SF`
  va aparte como «sin instrumentar».
- **El diff cambia con la config global de git.** `diff.renames=false` convierte
  un rename en borrado + alta (todo el fichero «cambiado»); `diff.noprefix`/
  `mnemonicPrefix` cambian `+++ b/`; `color.diff=always`, `diff.external`.
  `runGit` solo fija `core.quotePath=false` (git.ts:343) y su `.trim()`
  (git.ts:63) se come espacios de rutas al final. Mitigación: diff propio con
  `-U0 --no-color --no-ext-diff -M --src-prefix/--dst-prefix` fijos; borrados y
  binarios no aportan líneas.

## Estados intermedios y fallos parciales

- **Lcov truncado** (se lee mientras otro proceso escribe): el último registro
  sin `end_of_record`; descartarlo en silencio lo convierte en «ausente».
  Rechazar el lcov entero y avisar.
- **`SF` duplicados** (lcov fusionados de monorepo, nyc merge): `DA:10,0` y
  `DA:10,5`; si gana el último, falso rojo o verde. Agregar por máximo o suma.
- **La verificación deja el lcov fuera de `.gitignore`**: `finish` aborta
  («verde pero ha dejado cambios», finish-verificacion.ts:126) y `review` exige
  workspace limpio (incluye untracked, git.ts:68): un `coverage/` sin ignorar
  bloquea review. Verificado en el código.
- **El proceso muere a mitad**: las escrituras de review son `wx` con rollback
  (review.ts:529-589); calcular la cobertura ANTES del bucle de escritura y que
  un fallo del lcov sea aviso, no excepción que se lleve la ronda.
- **Ronda incremental**: `desde` = commit de la ronda anterior
  (review.ts:463-467). Si la cobertura usa ese delta, una línea marcada en ronda
  1 y no corregida desaparece en la 2 pero `finish` (merge base) la sigue
  bloqueando: petición y puerta se contradicen sin aviso.

## Compatibilidad hacia atras

- Sin la clave, sin umbral: nada cambia, siempre que la ausencia de lcov en
  `review` sea aviso y no error (si es error, rompe review en todos los proyectos).
- Plugin viejo con la clave nueva: avisa e ignora. Pero un valor inválido de la
  clave nueva aborta TODOS los comandos que llaman a `resolverConfig`, `board`
  incluido.
- Peticiones ya commiteadas no se tocan; comprobar si `leerRondaPrevia` o
  `seccionPrevia` dependen del orden de secciones (supuesto, no mirado).
- Hotfix: merge base contra la principal, como `resolveBaseBranchForTipo`
  (git.ts:599) y held-out (finish.ts:461); contra `develop` saldrían cientos de
  falsos hallazgos.

## Vuelta atras

- Reversible: quitar el umbral del config de la base; si se lee de la base,
  exige un commit en `develop`/`main` e integrarlo en la rama: documentarlo en el
  mensaje de error.
- No se deshace: la sección queda commiteada en `peticion-revision-N.md` y las
  ramas no se borran (IECA); un dato erróneo queda en la auditoría, solo lo
  corrige una ronda nueva.
- De dominio: si `--sin-verificacion` salta esta puerta. Si no la salta y falla
  por un lcov mal configurado, la única salida es editar el config de la base con
  `finish` bloqueado.

## El riesgo que mas te preocupa (UNO solo)

El falso verde por lcov viejo o con rutas que no casan, cuando «no encuentro
datos» se lee como «no hay líneas sin cubrir»: el freno pasaría siempre sin que
nadie lo note. Regla: cero ficheros cambiados casados con el lcov, o un lcov
anterior a la verificación de esta misma ejecución, es un error, no un aprobado.

Sin verificar: que el reporter lcov de `node --test` y c8 escriban `SF`
absolutas y sin remapear; que `informe_cobertura` sea relativa a la raíz; que
algo dependa del orden de secciones de la petición.
