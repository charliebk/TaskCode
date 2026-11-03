# Brainstorm — TASK-068, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (ad1a7e7bb38b33839)

## Enfoque propuesto, con rutas y nombres concretos

El tipo de aplicación es un **segundo eje**, independiente del lenguaje. Tendrá su propia familia `aplicacion_N_{id,nombre,marcadores,contiene}` en `scripts/doctor-deploy.yml` y un campo opcional `punto_N_aplicaciones`. `evaluarPunto` (`src/commands/doctor-deploy.ts:113`) los combina así: los dos ejes con AND entre sí y OR dentro de cada eje. Las 7 sondas nuevas comparten un único helper «leer ficheros elegidos → detector puro → silencios → estado», y los detectores puros van en core, como ya hacen los intérpretes de `doctor-deploy-auditoria.ts`.

Orden de construcción:
1. Tipado del registro, exportar utilidades y `sondaPorFicheros` con su contrato, sin cambiar comportamiento.
2. Las sondas de una en una, y en el mismo paso su punto 37–43 pasa a `metodo: determinista` + `sonda`. La skill solo entrega al agente los puntos con `metodo: "juicio"` (`skills/doctor-deploy/SKILL.md:29`, `doctor-deploy-veredictos.ts:237`), así que el punto deja de recibirlo sin tocar nada más.
3. Eje de aplicación: parser + detección + AND en `evaluarPunto` + salida texto/JSON/md (v3).
4. Etiquetar con `aplicaciones` los puntos 11, 13, 20, 21, 33 y 34 (cookies, rate limits, headers, HTTPS, backups, health check).
5. Referencias OWASP/ASVS en el yml (solo datos, sin código), README y CHANGELOG.

Alternativas descartadas:
- Meter web/cli/libreria como más `tipo_N_` dentro del campo `tipos` actual — `tipos` es OR: una librería Node casa con `node` y HTTPS seguiría aplicando. Habría que inventar grupos AND en una lista plana y mezclar dos ejes.
- Una sonda genérica con regex declaradas en el YAML — RLS entre ficheros y «pull_request_target + checkout del head» son lógica, no un patrón; además el parser hecho a mano no está pensado para escapar regex.

## Que se extiende y que se crea

- `src/core/doctor-deploy-catalogo.ts` — se extiende — familia `aplicacion` en `parsearCatalogoDeploy`, campo `aplicaciones` en `CAMPOS_PUNTO`/`PuntoCatalogo` validado contra los ids de aplicación, y `SONDAS_REGISTRADAS` pasa a `as const` para que sea la fuente de verdad.
- `src/fs/sondas-deploy.ts` — se extiende — `SONDAS` se tipa como `Record<(typeof SONDAS_REGISTRADAS)[number], Sonda>`, así el compilador obliga a que las dos listas (hoy duplicadas) coincidan; se exportan `decodificar`, `buscarSilencio` y `evidenciaSilenciada` para reutilizarlos, no copiarlos.
- `src/fs/sondas-deploy-config.ts` — se crea — `sondaPorFicheros(filtro, detector, patron)` y las 7 sondas (firebase, rls, tokens-gestor, compose, pr-target, acciones-sha, dockerfile). El fichero actual ya tiene 1030 líneas y estas sondas tienen otra forma (leen config, no escanean claves).
- `src/core/doctor-deploy-reglas.ts` — se crea — detectores puros `(ficheros: {ruta, contenido}[]) => Hallazgo[]`, sin disco, que siguen el precedente de `interpretarNpmAudit`.
- `src/fs/deteccion-app.ts` — se extiende — `detectarAplicaciones(cwd, archivos, aplicaciones)` reutiliza `coincideMarcador` y la profundidad 3, y añade una lectura opcional del contenido (`contiene`, p. ej. `"bin"` en `package.json`). Solo lee los ficheros marcador.
- `src/core/doctor-deploy.ts` — se extiende — `InformeDeploy` gana `aplicaciones: TipoDetectado[]` y pasa a `version: 3` (precedente: TASK-067 subió a v2 al añadir campos); `formatearTexto` e informe muestran «Aplicación detectada».

## Limites que cruza

Desacuerdos previstos:
- dominio — punto sin `aplicaciones`, o ninguna aplicación detectada — posición: aplica (no NO APLICA). Solo se excluye con detección positiva, al revés que el eje de lenguaje (`textoTipos`, `doctor-deploy.ts:157`).
- riesgos — sondas sobre `ctx.versionados` o sobre `presentes` — posición: versionados, porque el criterio dice «versionados» y es lo que se publica; igual que `ficheros-secretos`.
- dominio — solape de los puntos 6 (rls-activo) y 28 (contenedor-sin-root) con 38/43 — posición: siguen de juicio con la parte determinista quitada de su descripción; no se fusionan.

Suposiciones no verificadas:
- Que con nombre de fichero + `contiene` basta para distinguir CLI de librería y móvil (Flutter `pubspec.yaml`, RN, `AndroidManifest.xml`) — habría que contrastarlo con dominio y con repos reales.
- La regla de `parsearCapaProyecto:517` (sin commit ni huella solo vale `fichero-secreto`) bloquea silenciar las sondas nuevas — habría que generalizarla a un conjunto exportado de «patrones sin huella»; no comprobado qué espera riesgos.
- Que ningún consumidor externo valide `version: 2` — en `src/` no lo valida nadie (grep); falta mirar la skill y la documentación del JSON.
- Que tokens-gestor no duplique hallazgos de `secretos-arbol` sobre el mismo `.npmrc` — habría que mirar si los patrones de `core/secretos.ts` ya cubren `_authToken`.
- Que las 7 sondas recorran `versionados` como mucho 7 veces sin coste apreciable: solo filtran por nombre y leen pocos ficheros, con tope `maxBytesFichero`. Con muchas migraciones, el coste lo marca el tamaño total de los `.sql`.

## La decision de diseño que mas te preocupa (UNA sola)

El contrato del detector. Tiene que recibir el **conjunto** de ficheros, no uno solo, porque el RLS puede activarse en una migración posterior a la del `create table`. Si se fija «por fichero», habrá que rehacerlo.
