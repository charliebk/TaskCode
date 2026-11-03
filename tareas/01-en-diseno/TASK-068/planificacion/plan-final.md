# Plan — TASK-068: Doctor-deploy C: tipo de aplicacion y sondas deterministas extra

## Enfoque
Según arquitectura, el tipo de aplicación es un segundo eje: familia `aplicacion_N_{id,nombre,marcadores,contiene}` y `punto_N_aplicaciones` en `scripts/doctor-deploy.yml`, combinado en `evaluarPunto` con Y entre ejes y O dentro de cada eje. Se crean `src/core/doctor-deploy-reglas.ts` (detectores puros sobre el conjunto de ficheros) y `src/fs/sondas-deploy-config.ts` (`sondaPorFicheros` y 7 sondas). Se extienden el catálogo, `sondas-deploy.ts`, `deteccion-app.ts` e `InformeDeploy` (v3).
Orden (arquitectura): 1) tipado del registro y helper, sin cambiar comportamiento; 2) sondas una a una, con su punto 37–43 pasando a `determinista`; 3) eje de aplicación; 4) etiquetado de los puntos 11, 13, 20, 21, 33 y 34; 5) OWASP/ASVS, README y CHANGELOG.
Se lanzaron 3 roles porque la heurística dio **alta** (6 puntos) frente a la complejidad **media** declarada, y se toma el mayor. Nada de esto se implementa sin aprobar antes el plan con `taskctl approve`.

## Desacuerdos resueltos
- Dónde sale el tipo de app — testing: aseverar sobre `tipos` del JSON / arquitectura: campo `aplicaciones` aparte y `version: 3` — gana arquitectura — riesgos verificó que `tipos` es O (`commands/doctor-deploy.ts:136-138`): una CLI de Node casaría con `node` y el criterio 2 no se cumpliría nunca. Testing también pide no mezclar los dos ejes.
- Sonda sin ficheros que revisar — testing: NO APLICA con motivo, para no inflar «sin verificar» / riesgos: NO APLICA o NO VERIFICADO, nunca OK / convención actual: `revisados === 0` da NO VERIFICADO (testing, `sondas-deploy.ts:255`) — no se decide aquí — ver la decisión 2.
- `.npmrc` contado dos veces — arquitectura: supone que tokens-gestor no duplica a `secretos-arbol` / riesgos: [V] `secretos-arbol` ya escanea `.npmrc` y saldría doble FALLA — gana riesgos — es un hecho verificado frente a una suposición. Nadie propuso cómo deduplicar (ver «Sin cubrir»).
- Número de sondas — testing: 13 o 12 deterministas, según si Dockerfile es una sonda o dos / arquitectura: 7 sondas, una por punto 37–43 — gana arquitectura — mantiene un punto por sonda y los ids que riesgos pide no renombrar.

## Riesgos aceptados
- Una API clasificada como librería apaga 6 puntos en silencio y sus tareas salen huérfanas — riesgos — solo hay NO APLICA con marcador positivo de librería o CLI y ninguno de web o API; el informe dice qué marcador decidió; test «sin tipo» (testing).
- Un secreto llega a `docs/doctor-deploy/` o a una tarea, sin vuelta atrás — riesgos — misma máscara que `buscarSecretos`, sin línea cruda ni valor en el `motivo`; test de enmascarado (testing).
- OK falso en Firebase o RLS (reglas en varias líneas, `.read: true`, RLS en otra migración, fichero ilegible) — riesgos — un fichero ilegible o mayor que `maxBytesFichero` da NO VERIFICADO, nunca `continue` hacia OK; detector sobre el conjunto (arquitectura).
- YAML y Dockerfile leídos línea a línea, sin parser (flujo `[pull_request_target]`, `\`, CRLF, multietapa) — riesgos — se acepta que algo se escape; las variantes van a funciones puras con test.
- Falsos positivos masivos (`@v4`, Flyway/Prisma, distroless, `${X}`) — riesgos — se excluyen `./`, `docker://` e interpolaciones; RLS solo en `supabase/migrations/`; un silencio por hallazgo (requiere generalizar `parsearCapaProyecto:517`, según arquitectura).
- Un CI que use `doctor-deploy` como puerta se pone rojo al actualizar, porque los puntos 37–43 pueden dar FALLA — riesgos — aviso en el CHANGELOG; los ids de tipo y de punto no se tocan.

## Plan de pruebas
- Detección por tipo: una fixture por tipo con la estructura real (RN a profundidad 4) y su negativo (`package.json` sin `bin` ni `react-native`) — repo Git temporal, `--json` → `aplicaciones` — testing.
- NO APLICA por tipo: los 6 ids nombrados salen `no-aplica` en librería y en CLI, y aplican en web y sin tipo detectado — repo Git temporal — testing (y riesgos).
- Por sonda, un par detecta / no da falso positivo, con el id del punto: RLS en una migración posterior, Dockerfile multietapa, `_authToken` que los patrones genéricos no cazan — funciones puras más una integración — testing.
- Enmascarado: ninguna ventana de 8 o más caracteres de la contraseña del compose ni del token del `.npmrc` en stdout, JSON, informe ni tarea — repo Git temporal — testing y riesgos.
- Conversión: los 7 ids nombrados con `metodo: determinista`, y un `--resultado` con veredicto para ellos que se rechaza — `doctor-deploy-veredictos` — testing.
- El parser aborta si un tipo de aplicación es desconocido o está en el eje equivocado; test de intersección de los dos ejes; ninguna `referencia` contiene `2021` — catálogo — testing.

## Sin cubrir
- Rol dominio, no lanzado: qué puntos aplican a móvil y qué severidad merece cada sonda nueva (riesgos y arquitectura lo derivan a dominio) — queda abierto en la revisión.
- «Secretos impresos» en workflows de CI: está en el Objetivo pero no en ningún criterio, y ningún rol propone sonda (testing lo señala) — ver la decisión 3.
- Cómo evitar el doble FALLA de `.npmrc` entre `secretos-arbol` y el punto 39 — nadie lo diseñó; lo propone quien implemente y lo valida el revisor.
- «Verificada contra la fuente oficial» (criterio 6) no se puede comprobar con un test (testing) — evidencia manual en el Resultado, referencia a referencia por significado (riesgos).
- Repo con marcadores de CLI y de web a la vez — no se trató de forma explícita; por la regla O de arquitectura, el punto aplicaría.

## Salidas que faltaron
- ninguna: llegaron las tres (arquitectura, riesgos, testing).

## Suposiciones no verificadas
- Que el nombre del fichero más `contiene` distingue CLI, librería y móvil — arquitectura — contrastarlo con repos reales.
- Que la regla `parsearCapaProyecto:517` bloquea silenciar las sondas nuevas — arquitectura — leer esa regla y sus tests.
- Que nadie valida `version: 2` del JSON — arquitectura — mirar la skill y la documentación del JSON.
- Que Top 10 2025 y ASVS 5.0 renumeran categorías y capítulos — riesgos [S] — owasp.org.
- Que dos ejecuciones simultáneas son seguras — riesgos [S] — leer la escritura atómica de `informes-deploy.ts`.
- Que el rechazo de veredictos a puntos no de juicio ya tiene test, y si `punto_35` necesita `referencia` — testing — `doctor-deploy-resultado.test.ts` y el yml.

## Decisiones de la persona (2026-11-03)
- (1) **Aplican.** Sin tipo de aplicación detectado, los puntos dependientes del tipo siguen aplicando; solo salen NO APLICA con un marcador positivo de librería o CLI y ninguno de web o API. El informe dice qué marcador decidió el tipo.
- (2) **NO APLICA con motivo**, solo para las 7 sondas nuevas (p. ej. «no hay Dockerfile versionado»). Las sondas existentes conservan su convención (`revisados === 0` → NO VERIFICADO). Nunca OK sin evidencia; fichero ilegible o mayor que `maxBytesFichero` → NO VERIFICADO.
- (3) **Excluido.** «Secretos impresos en CI» queda fuera de alcance; si interesa, irá en una tarea aparte creada en `develop`, en `tareas/00-planificadas`.
- (4) **Aceptada** la redacción propuesta del criterio 2; ya está cambiada en `tarea.md`.

## Decision humana pendiente (texto original, ya resuelta arriba)
- (1) Sin tipo de aplicación detectado, ¿los puntos que dependen del tipo aplican o salen NO APLICA? Los tres roles dicen que aplican (riesgos: fallo en abierto). Esa unanimidad no tiene detrás al rol dominio — es una decisión de producto, y deshacerla cierra tareas en silencio.
- (2) Sonda sin ficheros que revisar: ¿NO APLICA con motivo (testing) o NO VERIFICADO (convención actual)? — Cambia la convención de las sondas existentes y la expectativa de `commands/doctor-deploy.test.ts:155`.
- (3) «Secretos impresos en CI», del Objetivo: ¿se añade una sonda con su criterio y su par de tests, o se excluye por escrito? — Cambia el alcance de la tarea.
- (4) El criterio 2 no cita nada comprobable. Redacción propuesta, sacada del plan de testing: «Los puntos del catalogo declaran punto_N_aplicaciones; con doctor-deploy --json, en una fixture de libreria y otra de CLI, https-obligatorio, cookies-seguras, security-headers, rate-limits, backups-y-migraciones y health-check salen no-aplica con un motivo que nombra el tipo, y en una fixture web y otra sin tipo detectado no salen no-aplica; test» — Cambiar un criterio de aceptación le toca a la persona.
