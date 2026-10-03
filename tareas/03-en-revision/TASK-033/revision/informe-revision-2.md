# Informe de revision — TASK-033, ronda 2

- Commit revisado: 74ed68d (delta 707990a..HEAD: c8ba509, 274529c)
- Revisor: agente general-purpose independiente (no implemento la tarea)
- Veredicto: aprobada con correcciones

## Como se ha revisado

Clon temporal de la rama `fix/task-033-comando-de-sincronizacion-tras-cada-tran`,
`npm install && npm run build` (exit 0, `git status` del clon limpio tras el
build: el `dist/` commiteado coincide con el fuente). El arbol del repo no se ha
tocado salvo este informe. Alcance: solo el delta; la suite completa no se ha
repetido (medida por la implementacion).

- `node --test dist/test/commands/sincronizacion.test.js dist/test/core/config-sincronizacion.test.js`
  → **24/24 en verde**, 172 s.
- Sondas directas sobre `autoCommit` (dist), Windows 11, Node 22 (abajo).
- Al terminar se mataron 2 procesos `node` huerfanos de los tests/mutantes.

## Verificacion de las correcciones de la ronda 1

- **IMP-1 (ruta ignorada / mayusculas)**: corregido. Los dos tests nuevos
  reproducen exactamente los casos 1a y 1b de la ronda 1 y pasan: `fallida`,
  tarea commiteada, arbol limpio.
- **IMP-1, segunda barrera (`sincronizacionFallidaAlPreparar`)**: funciona con
  un caso REAL que `motivoNoCommiteable` no preve — ruta declarada dentro de un
  repo Git anidado (`sub/gen.md`, con `sub/.git`):
  ```
  estado fallida  commiteado true  ficheros ['tareas/t.md']
  aviso: ... Git no pudo prepararlos (fatal: Pathspec 'sub/gen.md' is in submodule 'sub') ...
  status ""   (indice y arbol limpios)
  ```
  Con dos rutas (`[a.md, sub/gen.md]`), donde el `add` de `a.md` SI entra al
  indice antes de que falle el segundo: `status ""` tambien. El `reset` previo
  deja el indice limpio. Pregunta del encargo contestada: no, el indice no
  queda sucio.
- **MEN-2 (124 propio / senal)**: corregido. Test nuevo en verde; la marca
  `[taskctl:timeout]` es la que decide (mutante MD muerto). En POSIX, por
  lectura: muerte por senal → el envoltorio sale con 1 y escribe "termino por la
  senal X", que acaba en el aviso via stderr. Correcto.
- **MEN-3 (el test no veia el arbol vivo)**: corregido. El test del nieto mide
  que el testigo deja de crecer.
- **`lanzarEnvoltorio` con ficheros**: el borrado del temporal esta en
  `try/catch` (un huerfano con el fichero abierto deja el directorio en el
  `tmpdir` del sistema, nunca en el repo; no filtra al arbol de trabajo ni
  rompe la transicion). Ver hallazgo 3 por el doble `closeSync`.

## Mutacion (4 mutantes sobre el dist compilado)

| Mutante | Cambio | Resultado |
|---|---|---|
| MA proteccion de `antes` | `if (objetivo !== r && antes.has(objetivo)) continue` → `if (false)` | **sobrevive** (hallazgo 2) |
| MB nombre real en `restaurarAHead` | `objetivo = nombreRealEnDisco(...) ?? r` → `objetivo = r` | muerto: test IMP-1 de mayusculas en rojo |
| MC segunda barrera | el `catch` de `autoCommit` hace `throw e` | **sobrevive**: ningun test la ejercita (hallazgo 1) |
| MD marca de timeout | el envoltorio no escribe `[taskctl:timeout]` | muerto: test del timeout en rojo |

## Hallazgos

### 1. MENOR — La segunda barrera no tiene test, y su restauracion borra ficheros de un repo anidado

MC sobrevive: `sincronizacionFallidaAlPreparar` no la cubre ningun test,
aunque hay un caso real y barato para ello (repo anidado, sonda de arriba).

Ademas, en ese caso la restauracion no deja la ruta "como en HEAD" (lo que dice
el aviso): `restaurarAHead` no la encuentra en el HEAD del repo exterior y la
borra. Reproducido con `sub/gen.md` versionado en el repo anidado
(contenido `persona\n`):

```
estado fallida  commiteado true
sub/gen.md existe false   inner status " D gen.md"
outer status " M sub"
```

El fichero del repo anidado desaparece (recuperable desde su propio Git) y el
arbol exterior queda sucio, asi que el siguiente comando de taskctl aborta por
workspace sucio. Antes de la correccion este caso abortaba la transicion entera,
asi que es una mejora neta; pero el aviso miente. Exige una configuracion
erronea (ruta dentro de un submodulo): MENOR. Sugerencia: test con repo anidado
y, en la segunda barrera, no borrar lo que no es del repo exterior (o
limitarse a despreparar y avisar).

### 2. MENOR — El check (a) no ve un fichero sucio con otras mayusculas; la guarda que lo compensa no tiene test

En Windows (`core.ignorecase=true`), `git status --porcelain -- docs/plan.md`
NO lista un `docs/PLAN.md` modificado (comprobado: salida vacia). Con
`rutas_sincronizacion: [docs/plan.md]` y trabajo de la persona en
`docs/PLAN.md`, el check (a) deja pasar, el comando se ejecuta y sobrescribe
ese trabajo antes de que `motivoNoCommiteable` lo detecte. La guarda nueva de
`restaurarAHead` (`objetivo !== r && antes.has(objetivo)`) solo evita
ademas el `checkout HEAD`; el contenido ya se perdio. Y esa guarda no la
protege ningun test (MA sobrevive). Sugerencia: hacer (a) con el nombre real
en disco (`nombreRealEnDisco`) para abortar antes de ejecutar, y un test.

### 3. MENOR — Doble `closeSync` del mismo descriptor en `lanzarEnvoltorio`

Los fd se cierran en el `try` y otra vez en el `finally` (el segundo suele dar
`EBADF` y se traga). Si entre los dos cierres el numero de fd se reutiliza
(otro `open` del proceso, p. ej. del threadpool de libuv), el `finally`
cerraria un descriptor ajeno. En el CLI, todo sincrono, no es explotable hoy;
es un patron fragil. Sugerencia: cerrar solo en el `finally` o marcar los fd
como cerrados. Por lectura, sin reproduccion.

### 4. MENOR — En POSIX, `nombreRealEnDisco` puede inventar un error de mayusculas

Por lectura, sin poder ejecutarlo en POSIX desde esta maquina. En un disco que
SI distingue mayusculas, si la ruta declarada no existe tras el comando (el
comando la borro, caso que la ronda 1 dio por bueno como `aplicada`) y existe
una hermana que solo cambia en mayusculas (`docs/plan.md` borrada,
`docs/PLAN.md` presente), el fallback sin distinguir mayusculas devuelve
`docs/PLAN.md`. Entonces `motivoNoCommiteable` da `fallida` con un motivo
falso, y `restaurarAHead` trabaja sobre `docs/PLAN.md` en vez de restaurar
`docs/plan.md`, que se queda borrada (arbol sucio). Muy improbable (dos
ficheros que solo difieren en mayusculas). Sugerencia: usar el fallback sin
distinguir mayusculas solo cuando el disco no las distinga, o solo cuando no
exista una coincidencia exacta en HEAD.

## Conclusion

Las tres correcciones de la ronda 1 estan bien y lo he comprobado ejecutandolas.
La segunda barrera hace lo que promete con un caso real: la transicion no se
aborta y el indice queda limpio. Nada de lo nuevo es CRITICO ni IMPORTANTE. Los
cuatro hallazgos son MENOR: dos huecos de test (MA y MC sobreviven), un caso
limite de restauracion en repos anidados y dos fragilidades vistas leyendo el
codigo.
