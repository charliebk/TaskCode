# Informe de revision — TASK-053 (ronda 1)

- Commit revisado: 78ff3a4164887fbaf74c78533fc25d04f2f0f43d (HEAD de la rama: cb6bf2f, solo la peticion)
- Revisor: code-quality-reviewer (agente independiente, no implemento)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/fs/task-store.ts:224 |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/fs/task-store-reintento.test.ts:73 |
| MEN-3 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/src/commands/plan.ts:503 |

Sin CRITICO ni IMPORTANTE.

## Evidencia general

- Clon limpio de `fix/task-053-movetareafile-reintenta-el-rename-ante-u` en un temporal, `npm install && npm run build`.
- `npm test` completo, una vez: **925 tests, 922 pass, 3 fail**. Los tres son los rojos conocidos de Windows nativo:
  `approve: propaga cualquier error de stat que NO sea ENOENT` (EPERM en `symlink`),
  `plan: propaga cualquier error de escritura que NO sea EEXIST` (chmod sobre directorio en NTFS) y
  `plan: la rama base real tiene la tarea en un estado distinto...` (CRLF). Ningun cuarto rojo.
- Mutantes sobre `dist/src/fs/task-store.js` con `timeout 300 node --test dist/test/fs/task-store-reintento.test.js` (base: 3/3 en verde):
  - M1: quitar `EBUSY` de los codigos transitorios → **muerto** (falla el test 2).
  - M2: off-by-one `intento >= esperas.length` → `>` → **muerto** (falla el test 2: 5 intentos en vez de 4).
  - M3 (extra): `transitorio = true` para cualquier codigo → **muerto** (falla el test 3, ENOTDIR).
- `tolerateMissingSource`: sin cambios en su comportamiento. Un ENOENT en el primer intento no es transitorio y llega
  intacto al `catch` de siempre; un EPERM/EBUSY persistente acaba propagandose como EPERM/EBUSY (antes igual, solo que
  sin esperar). El unico caso donde cambia algo es MEN-1, y con `tolerateMissingSource: true` cambia a mejor.

## MEN-1 — Un EPERM "fantasma" (el rename SI movio la carpeta) acaba en un ENOENT enganoso sin `tolerateMissingSource`

Si el `rename` mueve la carpeta pero devuelve EPERM (raro, pero posible en Windows), el reintento intenta renombrar un
origen que ya no existe y obtiene ENOENT. En `finish` (que no pasa `tolerateMissingSource`) el error que ve el usuario
es `ENOENT: no such file or directory, rename '...03-en-revision/TASK-NNN' -> ...`, que sugiere que la tarea no estaba
donde debia, cuando en realidad ya esta en `04-terminadas/` con el `tarea.md` sin reescribir.

Reproduccion (script contra el `dist` del clon, rename inyectado que mueve de verdad y luego lanza EPERM la primera vez):

```
tolerate=false: ERROR code=ENOENT intentos=2 msg=ENOENT: no such file or directory, rename '...\03-en-revision\TASK-961' -> ... | carpeta en 04=true origen existe=false
tolerate=true: OK intentos=2 destino existe=true
```

Por que es MENOR y no IMPORTANTE: el estado en disco es identico al de antes del cambio (antes se propagaba el EPERM con
la carpeta igualmente movida y el `tarea.md` sin reescribir); solo cambia el codigo del error. Con
`tolerateMissingSource: true` (`start`) el resultado es incluso el correcto: el ENOENT se tolera, `mkdir` es no-op y se
escribe `tarea.md`. Mejora posible, no exigida: ante ENOENT en un reintento (no en el primer intento) comprobar si
`hasta` existe y `desde` no, y darlo por bueno.

## MEN-2 — El nombre del test 2 dice EPERM pero simula EBUSY; el tope por defecto (5 reintentos) no se prueba

El test `un EPERM que no cede se propaga...` lanza `EBUSY`, no `EPERM`; el camino EPERM-permanente no tiene test propio
(si lo cubre el test 1 para EPERM transitorio). Ademas, los tests pasan `esperasReintento: [1,1,1]`, asi que el
criterio "hasta 5 veces" depende solo de la constante `ESPERAS_RENAME_MS` (5 elementos), sin aserto que la fije.
Cosmetico: los mutantes M1 y M2 se matan igualmente.

## MEN-3 — Hay otro `rename` sin proteccion: la migracion de `plan-final.md` legado en `plan.ts`

`src/commands/plan.ts:503` hace `rename(ubicacion.legada, ubicacion.canonica)` sin reintento. Es el unico otro `rename`
del CLI (`grep -rn rename src`). Puede sufrir el mismo EPERM transitorio, pero el impacto es mucho menor que en
`finish`: renombra un unico fichero dentro de la carpeta de la tarea, ocurre antes de mover nada y antes de cualquier
merge, y solo en tareas planificadas con el CLI anterior a TASK-027; si falla, `plan` se puede repetir sin estado a
medias (solo queda creada `planificacion/`). No merece ampliar esta tarea; si se quisiera, bastaria con exportar
`renombrarConReintentos` y usarlo ahi.
