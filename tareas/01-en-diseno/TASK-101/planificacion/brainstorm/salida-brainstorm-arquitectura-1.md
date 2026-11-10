## Enfoque

Sacar a un helper de `fs/` la decision que hoy es privada en `finish-verificacion.ts`
(`decisionDocumentacion`, lineas 91-109: `configDeRef` + `rutasDeTarea` + `decidirVerificacion`),
para que `finish` (con `(ramaBase, 'HEAD')`) y el guardian (con `(destino, sha)`) llamen a la misma
funcion: el criterio 2 se cumple por construccion, sin una copia que se desvie. En
`guardia-merge.ts`, un paso 6b dentro de `motivoDeBloqueo`, despues del memo de la completa
(lineas 152-160) y antes del bloqueo: solo se calcula si no hay verde de la completa, asi que el
camino de la 0.14.0 no cambia ni de coste ni de resultado.

## Piezas y limites

- `src/fs/decision-documentacion.ts` (nuevo): `decidirVerificacionEntre(base, hasta, cwd)` →
  `{ decision, timeoutS } | { invalida: ConfigError } | null` (`null`: la base no declara
  `rutas_documentacion`). En `fs/` porque hace I/O de Git; `core/verificacion-proporcional.ts` sigue
  puro. Dependencias `hooks`/`commands` → `fs` → `core`, sin ciclos.
- `src/commands/finish-verificacion.ts` — se extiende: `decisionDocumentacion` llama al helper y
  conserva solo su aviso. Refactor sin cambio de comportamiento.
- `src/hooks/guardia-merge.ts` — paso 6b con `decidirVerificacionEntre(destino, sha, raiz)`:
  documentacion sin comando → pasa; con comando → `leerMemo(raiz, huellaDeCommit(raiz, sha,
  decision.comando, timeoutS), 'documentacion')` verde → pasa; `completa` o `invalida` → el bloqueo
  de hoy con `decision.motivo` en el mensaje. Contrato interno: la huella del memo de documentacion
  usa el `timeout_verificacion` de la config de la BASE (`finish-verificacion.ts:108` y `:241`); el
  helper lo devuelve para que nadie lo deduzca por su cuenta.
- `mensaje()` del guardian — linea opcional de motivo; sin config nueva no cambia nada (criterio 4).
- `src/core/config.ts:764` — texto del error (MEN-6); `verificacion-selectiva.md` (MEN-7), README y
  CHANGELOG. Las cabeceras de `config.ts:27-28` y `verificacion-proporcional.ts` nombran el guardian.
- No se toca: `fs/verificacion.ts`, `fs/git.ts`, `core/comando-merge.ts`, `freno-stop.ts` (TASK-102).

## Orden de construccion

1. Helper y `finish` usandolo sin cambiar nada (la suite de finish en verde lo prueba).
2. Paso 6b del guardian con el helper y el motivo en el mensaje. Coste: como mucho 3 procesos git
   mas (`git show` y dos `git diff --name-only`), solo cuando hoy ya iba a bloquear; cabe en 30 s.
3. Tratar el `ConfigError` del arbol en el paso 3 (ver desacuerdos).
4. MEN-6, MEN-7 y documentar el guardian en `verificacion-selectiva.md`, README y CHANGELOG.
5. Estimacion de punta a punta: ~90 min (helper ~15, guardian ~20, ConfigError ~15, pruebas ~25,
   docs y MEN ~10, suite ~10, mas una ronda). Pasa de 60. Senales: 3 modulos de codigo; el paso 3
   cambia el comportamiento para todas las claves; docs en 3 ficheros. Corte posible: sacar el paso 3
   a su propia tarea (independiente de A2); lo decide Carlos.

## Alternativa descartada

- Recalcular en el guardian con su propio codigo: duplica la composicion y el detalle del timeout de
  la base; el criterio 2 dependeria de que dos copias no se desvien, y TASK-102 anadiria una tercera.
- Leer `rutas_documentacion` del arbol de trabajo: la rama que se integra podria relajar sus rutas;
  rompe la decision de TASK-100 y `finish` y el guardian decidirian distinto.

## Desacuerdos previstos

- Riesgos/dominio — lo que mas preocupa: hoy una config invalida en el arbol hace `continue` en el
  paso 3 (`guardia-merge.ts:88-93`) y el guardian deja pasar; un `rutas_documentacion` invalido en la
  rama lo desactiva. Posicion: un `ConfigError` no es «sin config»: usar `configDeRef(<destino
  candidato>)` para saber `rama_base` y `comando_verificacion`, y bloquear si integra en una rama
  protegida. El criterio 3 dice «bloquea igual que hoy», y eso choca con el codigo de hoy: hay que
  resolverlo explicitamente.
- Rendimiento/riesgos — calcular el diff siempre, antes del memo de la completa: no, de forma
  perezosa despues; sin config nueva, cero llamadas git de mas.

## Suposiciones no verificadas

- Que `git show <destino>:.taskcode/config.yml` resuelve el destino como rama y no como tag cuando hay
  ambiguedad (¿`refs/heads/<destino>`?).
- Que el destino `main` de release/hotfix decide con la config de `main`, igual que `finish`.
- Que el memo de documentacion de `finish` se guarda con HEAD igual al commit que se integra.
- Que existe `verificacion-selectiva.md` donde dice MEN-7.
