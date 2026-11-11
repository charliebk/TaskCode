# Brainstorm — TASK-102, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: brainstorm-arquitectura (subagente)

## Enfoque propuesto, con rutas y nombres concretos

Stop y review no deciden nada por su cuenta: los dos llaman a **una misma función nueva** que elige qué verificación toca. El orden es: solo documentación, después selectiva y después la de siempre. La función vive junto a la decisión que ya comparten finish y el guardián:

- `src/fs/decision-documentacion.ts`:
  - `decidirVerificacionEntre(base, hasta, cwd, opciones)` gana la opción `conArbol?: boolean`. Con ella, a las rutas de `base...HEAD` se suman las del árbol de trabajo (cambios preparados y sin preparar frente a HEAD, más los no trackeados). La regla no cambia: sigue en `core/verificacion-proporcional.ts::decidirVerificacion`, que es pura y no se toca.
  - Función nueva `peticionDeTrabajo(config, base, raiz, sinSelectiva: 'completa' | 'nada')`. Devuelve `{ peticion: PeticionVerificacion | null; motivo: string | null }`. Primero comprueba solo documentación, con `decidirVerificacionEntre(base, 'HEAD', raiz, { conArbol: true })`. Si sale documentación: `{tipo:'documentacion', comando}`, o `null` si no hay comando de documentación. Si no, la selectiva (como en TASK-091) o el respaldo `sinSelectiva`. Que Stop y review decidan igual queda garantizado por construcción, no por dos copias del mismo `if`.
- `src/fs/git.ts`: nuevo `rutasDelArbol(patronesDocs, cwd)`, con la misma forma `{todas, fueraDeDocs} | null` y el mismo patrón que `rutasDeTarea` (líneas 1056-1073): `-z`, `--no-renames`, `SIN_COMILLAS`, pathspecs `:(top)` y `:(top,exclude,glob)`. Usa `git diff --name-only HEAD` para lo trackeado y `git ls-files --others --exclude-standard` para lo no trackeado. La unión con el diff de la tarea se hace en `decision-documentacion.ts`, no en `git.ts`.
- `src/hooks/freno-stop.ts`: tras la guarda 7, el bloque de las líneas 169-188, que hoy construye la petición selectiva o completa, se sustituye por `peticionDeTrabajo(config, base, raiz, 'completa')`. Con `peticion === null` deja parar, con el motivo en el stderr. La base sale siempre de `resolveBaseBranchForTipo(tipo)`. Hoy solo se usa así con la selectiva; sin ella la completa no necesita base. Las guardas 1 a 6 no se tocan: sin `rutas_documentacion` no hay ningún git nuevo, porque `decidirVerificacionEntre` sale antes de `rutasDeTarea` (línea 59).
- `src/commands/review.ts::verificacionSelectivaDeRonda` (líneas 1023-1063) pasa a `verificacionDeRonda` y llama a `peticionDeTrabajo(configRama, baseBranch, raiz, 'nada')`. Los mensajes de rojo o de árbol sucio se parametrizan según el tipo. La guarda de la línea 772 (`selectiva !== null` oculta la cobertura) pasa a mirar «se corrió una verificación parcial».
- El memo no cambia: `verificarConMemo` ya acepta `tipo: 'documentacion'` (`fs/verificacion.ts:39`, `:245`). Sin contexto, su huella es la misma que la que guarda finish (`finish-verificacion.ts:233-234`).

## Que se extiende y que se crea

- Se extiende `decidirVerificacionEntre` con la opción `conArbol`, siguiendo el precedente de `heldoutComoCodigo` de TASK-101. Así no aparece una tercera puerta de entrada a la decisión.
- Se crea `rutasDelArbol` en `fs/git.ts`. No vale ni `fotoDelArbol` (`ejecucion-acotada.ts:204`), que calcula huellas de contenido y no clasifica, ni `isWorkspaceClean`. Clasificar con Git y no en JS evita tener dos motores de glob distintos para el mismo hecho.
- Se crea `peticionDeTrabajo`: hoy esa elección está duplicada en `freno-stop.ts:169-188` y en `review.ts:1030-1035`. Se rehúsa meterla en `fs/verificacion.ts`, que ejecuta pero no decide.
- No se tocan `core/verificacion-proporcional.ts`, `core/config.ts` (las dos claves ya existen desde TASK-100), `finish-verificacion.ts` ni `guardia-merge.ts`. Ni finish ni el guardián miran el árbol, ni deben hacerlo: finish exige el workspace limpio.
- Docs: `verificacion-selectiva.md`, README y CHANGELOG.

**Orden de construcción:** 1) `rutasDelArbol`; 2) la opción `conArbol`; 3) `peticionDeTrabajo`; 4) Stop; 5) Review; 6) Docs y suite. Los pasos 1 a 3 se pueden entregar sin cambiar ningún comportamiento.

**Coste:** con la clave declarada, el turno de Stop lanza hasta 6 procesos git nuevos: dos por fuente (`base...HEAD`, árbol trackeado y no trackeado), una para `todas` y otra para `fueraDeDocs`. Se suma la lectura de `configDeRef` de la base. Todo ocurre después de la guarda 6, así que solo pasa en la rama de una tarea en curso. Sin la clave, coste cero. Menos procesos exigiría clasificar en JS, y lo rechazo (ver la alternativa descartada).

## Limites que cruza

- **Contrato de `decidirVerificacionEntre`** (lo usan finish y el guardián): solo se añade una opción, que por defecto conserva el comportamiento de hoy. Ningún llamante existente cambia.
- **Configuración leída de dos árboles:** Stop lee `comando_verificacion` de la config del árbol de trabajo (`resolverConfigConAvisos(raiz)`, línea 138). La decisión de documentación lee `rutas_documentacion` y `comando_verificacion_documentacion` de la base (`configDeRef`). Es coherente con TASK-100 y TASK-101, pero mezcla dos fuentes en el mismo turno, y conviene que quede escrito en el comentario de cabecera de `freno-stop.ts`.
- **Si la config de la base es inválida:** `peticionDeTrabajo` cae a selectiva o completa, con aviso. El precedente es finish (`finish-verificacion.ts:93-98`). Nunca vale como «sin config».
- **Memo `documentacion-*.json`:** lo comparten Stop, review y finish con la misma huella. No cambia el formato.
- **Contrato del hook** (exit 0 o 2): no cambia. Un `null` de la petición es exit 0.
- **Ficheros instalados en proyectos ajenos:** los textos nuevos de Stop no pueden nombrar el producto (`freno-stop.ts:30`).

### Desacuerdos previstos

- **Review sin `comando_verificacion_selectiva`.** Hoy review no corre nada en ese caso (línea 1031). Postura: respaldo `'nada'`; la comprobación de documentación sustituye a la selectiva, pero no aparece donde antes no se corría nada. El criterio 1 admite la otra lectura, y la tiene que zanjar la persona.
- **Held-out (`aceptacion/`).** Propuesta: no pasar `heldoutComoCodigo` en Stop y review, igual que finish, porque ninguno de los dos los ejecuta.

### Alternativa descartada

Clasificar las rutas del árbol en JS (con un `minimatch` hecho a mano) para ahorrar procesos git. Daría dos motores de glob para `rutas_documentacion`, y TASK-100 ya fijó que clasifica Git.

### Suposiciones no verificadas

- Que `git diff HEAD` con pathspecs `:(exclude,glob)` cubre a la vez lo preparado y lo no preparado. Hay que comprobarlo en un repo temporal.
- Que el respaldo de la base en Stop (`config.rama_base` cuando `tipo` es null) es la base correcta sin selectiva. Hay que mirar `resolveBaseBranchForTipo`.

## La decision de diseño que mas te preocupa (UNA sola)

**Que la elección «documentación → selectiva → de siempre» viva en un solo sitio (`peticionDeTrabajo`) cuando Stop y review tienen respaldos distintos (`completa` frente a `nada`).** El criterio 3 pide la misma decisión para el mismo diff. Eso solo se cumple de verdad si la rama de documentación es literalmente el mismo código en los dos, y el parámetro `sinSelectiva` es lo único que los separa. La alternativa tentadora es un `if (decision.tipo === 'documentacion')` copiado en `freno-stop.ts` y en `review.ts`: más corta, pero repite el error que ya hay hoy con la selectiva duplicada, y en cuanto uno añada un matiz (aviso, timeout, base) los dos dejan de decidir igual sin que ningún test lo note.
