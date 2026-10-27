# Plan — TASK-066: Doctor-deploy A (4 roles en paralelo; complejidad declarada media, heuristica critica: de ahi los 4)

## Enfoque
Comando nuevo `taskctl doctor-deploy`, separado de `doctor` (arquitectura): catalogo `scripts/doctor-deploy.yml` aplanado `punto_N_*` + tipos y marcadores como datos `tipo_N_*`, cargador `core/doctor-deploy-catalogo.ts` con capa `.taskcode/doctor-deploy.yml`, nucleo puro `core/doctor-deploy.ts` (4 estados, texto/JSON, codigo, certificado), `fs/deteccion-app.ts` y `fs/sondas-deploy.ts`.
Orden (arquitectura): 1 catalogo+parser+capa; 2 nucleo, deteccion y `--json` (contrato para TASK-067); 3 sondas del arbol; 4 historial y herramientas externas (ausente -> NO VERIFICADO); 5 `--escribir`.
Los puntos `juicio` salen NO VERIFICADO sin codigo (arquitectura, criterio 3). El plan no vale hasta `taskctl approve`.

## Desacuerdos resueltos
- Enmascarado — arquitectura: en origen, `Evidencia` solo lleva `muestraEnmascarada` / riesgos: evidencia = fichero:linea o commit, nunca el contenido — gana arquitectura + punto unico de salida de riesgos como segunda red que cubre stdout, JSON, certificado y stderr reenviado de herramientas — el criterio 5 pide mostrar el valor enmascarado, y riesgos no da forma de cumplirlo sin muestra.
- Recorrido del historial — arquitectura: `rev-list --all --objects` + `cat-file --batch` sobre blobs unicos / riesgos: streaming o por commits, porque `git log -p --all` revienta `GIT_MAX_BUFFER` — gana el mecanismo de arquitectura con las condiciones de riesgos obligatorias: desbordamiento, clon superficial o corte -> NO VERIFICADO, nunca OK ni excepcion; declarar refs recorridos — ambos descartan `log -p`; riesgos delega el rendimiento a arquitectura.
- Valvula frente a falsos positivos — riesgos: la desactivacion por punto con motivo es la unica valvula / dominio: hace falta suprimir un hallazgo concreto (secreto rotado, huella, CVE) distinto de desactivar el punto — NO SE DECIDE AQUI: sube a la persona (D3) — sin supresion por hallazgo, un repo con un secreto viejo ya rotado sale 1 para siempre (dominio); con ella se abre la puerta que riesgos quiere cerrar.
- Eje de deteccion — criterio 1 y arquitectura: tipos por lenguaje/marcadores, como datos / dominio: hacen falta dos ejes (lenguaje + web/API/movil/CLI/libreria), y faltan movil y Supabase/Firebase — NO SE DECIDE AQUI: sube a la persona (D1) — dominio contradice el criterio literal y cambia el tamano.
- Nombre del fichero de `--escribir` — criterio 7: `docs/doctor-deploy/<fecha>.md` / riesgos: nombre con hora o sufijo si ya existe, escritura atomica — gana riesgos con sufijo solo en colision (`<fecha>.md`, luego `<fecha>-2.md`) — respeta el criterio y evita pisar un informe del mismo dia, que dominio pide no reescribir.
- Codigo con todo NO VERIFICADO — arquitectura y riesgos: 0, un modo estricto seria flag futuro / dominio: 0 parece «listo para publicar» — no son incompatibles: gana 0 (criterio 6) + resumen «N de M sin verificar» visible (dominio).

## Riesgos aceptados
- Secreto real en salida o certificado commiteado; es irreversible (hay que rotar) — riesgos — enmascarado en origen + punto unico de salida + test de subcadenas de 8+ caracteres en los tres canales (testing).
- OK falso: herramienta que no arranca (`npm`/`pnpm`/`yarn` son `.cmd` en Windows, ya paso con `codex`), red, salida no parseable — riesgos — ENOENT, timeout, codigo imprevisto o parseo fallido -> NO VERIFICADO; OK solo con evidencia positiva parseada.
- Falsos positivos en masa (fixtures, `.env.example`, `node_modules/`, `vendor/`, `target/`, claves de ejemplo `AKIAIOSFODNN7EXAMPLE`, `sk_test_`) — riesgos y dominio — excluir dependencias/build, distinguir ejemplos; el resto depende de D3.
- Capa del proyecto que rompe o pisa el catalogo — riesgos — id desconocido avisa, duplicado aborta, desactivar sin motivo aborta; el proyecto solo anade `juicio` o reutiliza una sonda registrada (arquitectura).
- Deteccion fallida en monorepos o repo sin marcadores — riesgos — profundidad fija; sin tipos detectados se dice, nunca «todo NO APLICA, codigo 0».
- Parsers de herramientas externas no probados contra la herramienta real — testing — se asume por escrito; solo se prueba la ausencia.

## Plan de pruebas
- Secreto plantado solo en el historial -> FALLA del punto de secretos con hash del commit; mutacion: buscar solo en el arbol — repo git temporal real — testing (y riesgos).
- Enmascarado: ninguna subcadena de 8+ caracteres del secreto en stdout, JSON ni certificado — mismo repo — testing, riesgos.
- Repos limpios Node, Rust y Python: tipo visible, cero FALLA, salida 0, deterministas propios en OK con evidencia, juicio NO VERIFICADO — repos temporales, un fixture por tipo de solo lectura — testing.
- Propiedades sobre el JSON: ningun OK sin evidencia, todo NO VERIFICADO y NO APLICA con motivo; `npm audit` NO APLICA en Rust — salida `--json` — testing.
- Catalogo real: 20 ids + anadidos con todos los campos, ASCII y sin mencionar el proyecto; desactivar sin motivo aborta — `scripts/doctor-deploy.yml` — testing.
- Herramientas ausentes con PATH controlado -> NO VERIFICADO «falta X»; `--escribir` con HEAD, rama, tipos y filas = puntos, fecha inyectada; `cli-flags-desconocidos` pasa de 13 a 14 — testing.

## Sin cubrir
- Que puntos de los ~34 son `determinista` y cuales `juicio`: ningun rol hizo la clasificacion — la hace quien implemente, y entra en la revision.
- Licencias de dependencias, backups/migraciones, health check, variables de entorno documentadas sin valores: nadie dijo como se miden — entran como `juicio` (NO VERIFICADO) salvo D6.
- Tabla `{tipo -> comando, interpretacion}` de las 7 herramientas: arquitectura la nombra, nadie fija umbrales ni flags — depende de D4.
- Arbol sucio al generar el informe: dominio dice que deja de describir lo publicado, nadie propone que hacer — se registra en el certificado; bloquear o no, D2.

## Salidas que faltaron
- ninguna (las 4 llegaron completas).

## Suposiciones no verificadas
- El parser plano (`parseBloqueClaveValor`) soporta el campo `tipos` como lista por punto — arquitectura, riesgos, testing — mirar `src/core/frontmatter.ts` y `heuristica-complejidad.test.ts:254`.
- El guard de workspace limpio de `start`/`finish` salta con un certificado sin trackear — riesgos — probarlo en un repo temporal.
- `npm`/`pnpm`/`yarn` se pueden lanzar en Windows como `codex` (shell condicional, `src/fs/git.ts:446`) — riesgos — reproducirlo en Windows.
- `ContextoDeploy` y el JSON son el contrato que extendera TASK-067 — arquitectura — contrastar con el enunciado de TASK-067.
- `cli-main.test.ts` enumera comandos; el CI de Linux no tiene `gitleaks` — testing — leer el test y el workflow.
- `git log` en Windows no mete CRLF que desplace numeros de linea — testing — test en Windows nativo.

## Decision humana pendiente — Decisiones para la persona (recomendacion del unificador, no de un rol)
- D1 Segundo eje de tipo (web/API/movil/CLI/libreria) y marcadores movil/Supabase/Firebase (dominio) — recomiendo: fuera de 066; pasa a TASK-067, que lo juzga; en 066 tipos como datos para anadirlos sin codigo — contradice el criterio 1 y crece el alcance.
- D2 «Certificado» (criterio) frente a «informe de revision» (dominio: suena a acreditacion y choca con TLS); uso interno o para terceros — recomiendo: «informe», uso interno, con commit y marca de arbol sucio — es nombre de producto.
- D3 Secretos rotados y falsos positivos: supresion por hallazgo con motivo (dominio) o solo desactivar el punto (riesgos) — recomiendo: supresion por hallazgo (commit+fichero+patron, motivo, quien, fecha) en 066; sin ella el criterio de historial no es usable en repos viejos — es desacuerdo entre roles.
- D4 Dependencias de desarrollo y umbral — recomiendo: auditar runtime (`--omit=dev` donde exista), FALLA desde alta/critica, alcance y version de herramienta en la evidencia (dominio) — es politica de riesgo.
- D5 «Tests en verde»: ejecutarlos o leer un resultado (dominio) — recomiendo: no ejecutarlos en 066; NO VERIFICADO — la suite puede tardar minutos.
- D6 Puntos deterministas extra de dominio (reglas Firebase, RLS en migraciones, tokens en `.npmrc`/`.pypirc`/`settings.xml`, `docker-compose`, CI `pull_request_target`, acciones sin SHA, `Dockerfile` sin `USER`) — recomiendo: en 066 como `juicio`; sondas en tarea nueva o TASK-067 — tamano: la heuristica ya marca critica.
- D7 Referencias OWASP/ASVS/MASVS (dominio) — recomiendo: campo opcional `referencia` con la version vigente (Top 10 2025, ASVS 5.0; confirmar que son finales) — nadie lo verifico.
- Y la aprobacion del plan entero con `taskctl approve`: este documento no la da.

## Decisiones de la persona (2026-10-27)

- D1 y D6, alcance: recortar. El segundo eje de tipo de aplicacion (web/API/movil/CLI/libreria) y las comprobaciones extra de dominio (reglas de Firebase, RLS en migraciones, tokens en .npmrc/.pypirc/settings.xml, docker-compose, CI con pull_request_target, acciones sin fijar a SHA, Dockerfile sin USER) entran en el catalogo como puntos de juicio; su sonda determinista pasa a TASK-067 o a una tarea nueva. En 066 los tipos como datos ya permiten anadir marcadores sin codigo.
- D2: se llama «informe», uso interno, con commit y marca de arbol sucio. La ruta del criterio 7 (docs/doctor-deploy/<fecha>.md) se mantiene.
- D3: secretos rotados y falsos positivos se silencian por hallazgo (commit, fichero y patron) con motivo, quien y fecha, ya en 066. Desactivar el punto entero sigue siendo la otra valvula, con motivo.
- D4: dependencias, solo runtime (--omit=dev donde exista); FALLA desde severidad alta o critica; el resto se lista sin fallar; la evidencia lleva alcance y version de la herramienta.
- D5: tests en verde no se ejecutan en 066; el punto queda NO VERIFICADO.
- D7: campo opcional `referencia` (OWASP Top 10 / ASVS) por punto.
- Sondas deterministas de 066 (hueco que dejo el unificador): secretos en el arbol, secretos en el historial, ficheros de secretos versionados, .gitignore que cubre .env, lockfile versionado y scan de dependencias por herramienta externa. Todo lo demas, juicio (NO VERIFICADO hasta TASK-067).
