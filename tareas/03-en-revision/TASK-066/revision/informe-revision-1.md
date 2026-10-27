# Informe de revision — TASK-066 (ronda 1)

- Commit revisado: 92422185bf17c7de4d5985648e803f3f44e34442
- Revisor: code-quality-reviewer (agente revisor independiente a76f6d0cfd7e65566; clon propio en %LOCALAPPDATA%\pruebas-claude\taskcode\task-066-r1, ya borrado)
- Veredicto: cambios-solicitados

El revisor propuso aprobada-con-correcciones; con 6 IMPORTANTE abiertos la regla del flujo es cambios-solicitados.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/fs/deteccion-app.ts:42 + src/fs/sondas-deploy.ts:214 (ficheros-secretos) | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:129 y :524 (exclusion de build/dist/vendor/target en arbol e historial) | plan |
| IMP-3 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:74 y :144 (esBinario) | implementacion |
| IMP-4 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:80 y src/core/doctor-deploy-catalogo.ts:~478 (silenciar sin commit) | implementacion |
| IMP-5 | IMPORTANTE | abierto | src/fs/sondas-deploy.ts:249 (gitignore-env con regla negada) | implementacion |
| IMP-6 | IMPORTANTE | abierto | test/commands/doctor-deploy.test.ts (tres mutantes sobreviven) | implementacion |
| MEN-1 | MENOR | abierto | src/fs/sondas-deploy.ts:136 (ficheros >1 MiB) | plan |
| MEN-2 | MENOR | abierto | src/fs/sondas-deploy.ts:441 (rutas no ASCII en el historial) | implementacion |
| MEN-3 | MENOR | abierto | src/commands/doctor-deploy.ts (--escribir y workspace limpio) | plan |
| MEN-4 | MENOR | abierto | src/fs/sondas-deploy.ts:249, :293 (falsos FALLA/OK de gitignore y lockfile) | implementacion |
| MEN-5 | MENOR | abierto | src/commands/doctor-deploy.ts:224 (fallo al escribir pierde el informe) | implementacion |
| MEN-6 | MENOR | abierto | src/core/doctor-deploy.ts:sanearPunto (sin test que lo exija) | implementacion |
| MEN-7 | MENOR | abierto | scripts/doctor-deploy.yml (referencia OWASP 2021) | plan |
| MEN-8 | MENOR | aceptado | src/core/doctor-deploy.ts:resumir (desactivados cuentan como NO APLICA) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

## Resultado de la reproduccion

- Clon limpio, `npm install` y `npm test` desde Git Bash: 1501 tests, 1496 ok, 5 fallos, exactamente los 5 conocidos (74 y 1500 README_MISSING, 114 symlink EPERM, 513 chmod NTFS, 519 CRLF). Ningun test de doctor-deploy falla.
- CLI real (`doctor-deploy`, `--json`, `--escribir`) sobre unos 17 repos temporales con Git real: Node, Rust, Python, Go, vacio, sin commits, clon superficial, clon parcial con el remoto caido, secretos solo en el historial, claves de ejemplo, `.env.example`, PEM, JWT de Supabase anon y service_role, URL con credenciales, CRLF y la capa `.taskcode/doctor-deploy.yml`. Herramientas simuladas con `npm.cmd` y `gitleaks.cmd` falsos en el PATH.
- Secretos en la salida: ningun trozo de 8+ caracteres sale por stdout, JSON (28 KB, `JSON.parse` correcto), informe de `--escribir` ni stderr (`sk_live_`, `ghp_`, contrasena de URL, cuerpo PEM, campo `Secret` de gitleaks falso). Con `--json --escribir`, stdout es una sola linea y el aviso va a stderr.
- Nunca OK sin evidencia ni con herramienta ausente o rota: correcto en lo probado (npm falso con `{}`, ENOTFOUND, codigo raro, herramientas ausentes, clon superficial, clon parcial sin remoto: NO VERIFICADO; npm falso con vulnerabilidad alta: FALLA). Los OK falsos encontrados (IMP-1, IMP-3, IMP-5) vienen de la cobertura, no del invariante.
- Capa del proyecto: desactivar sin motivo aborta; id repetido aborta; id desconocido, clave rara y silencio sin coincidencia avisan; desactivar marca NO APLICA con motivo.

### Mutantes (18; 72 tests de doctor-deploy, secretos, auditoria y catalogo)

- Mueren: historial ignora hallazgos, `enmascarar` devuelve el crudo, sin segunda red, clon superficial ignorado, AWS EXAMPLE como secreto, codigo de salida siempre 0, lockfile usa `presentes`, `.env.example` como secreto, `npm audit` ignora el codigo, recorte por limite de blobs ignorado, silencio ignora el fichero, aviso de `--escribir` a stdout con `--json`, `--escribir` pisa el informe.
- Sobreviven (IMP-6): M8 (regla de `.git/info/exclude` o global cuenta como cubierta), M12 (`git rev-list --all --objects` falla y sigue), M16 (`rev-list --all` cambiado por `HEAD`).
- M4 (`sanearPunto` anulado) sobrevive como mutante equivalente (MEN-6). M14 no compila; comprobado a mano.

### IMP-1 — `ficheros-secretos-versionados` ignora `.env` y claves bajo build/, dist/, vendor/, target/ y node_modules/
`listarArchivos` quita esas carpetas de `versionados` y la sonda decide sobre esa lista. Repro: `build/.env`, `vendor/.env` y `dist/id_rsa` versionados con `git add -f`: `[OK]` con evidencia «3 ficheros versionados revisados... ninguno es un .env». Comprobar nombres no da falsos positivos: esta sonda debe usar el `git ls-files` completo.

### IMP-2 — El escaneo de contenido no mira build/dist/vendor/target aunque esten versionados, y en el historial decide por la primera ruta del blob
Repro: `src/c.js` con `sk_live_...` y `git mv src/c.js build/c.js`: `secretos-en-arbol` y `secretos-en-historial` OK. `rev-list --objects` da cada blob una vez con su ruta mas reciente. Igual con un bundle versionado en `dist/`. Arreglo: excluir `node_modules`/`vendor` solo si no estan versionados y no descartar un blob por su primera ruta; como minimo, contar y mostrar los blobs omitidos.

### IMP-3 — Un fichero UTF-16 se salta como «binario» y el punto sale OK
`esBinario` busca NUL en los primeros 8000 bytes; un fichero UTF-16LE (PowerShell 5.1 `>`) lo tiene. Repro: `cfg.txt` UTF-16LE con BOM y `sk_live_...`: arbol e historial OK. El arbol ademas no informa de cuantos binarios salto. Arreglo: detectar BOM UTF-16 y decodificar, e informar siempre de los saltados.

### IMP-4 — Silenciar sin `commit` tapa tambien claves nuevas del mismo patron en el mismo fichero
D3 dice «por hallazgo (commit, fichero y patron)», pero `silenciar_N_commit` es opcional y sin el vale para todo el fichero y todos los commits. Repro: silenciar `stripe-live` en `config/prod.env.js` y anadir otra `sk_live_...` al mismo fichero: todo OK, 0 FALLA. Arreglo: exigir `commit` para el historial; en el arbol, ligar el silencio a un identificador estable (hash del valor) o mostrar «N hallazgos silenciados».

### IMP-5 — `gitignore-cubre-env` da OK con una regla negada
Repro: `.gitignore` con `.env` y luego `!.env`: `[OK] ... la regla "!.env" ignora .env`. `git check-ignore -v` sale con 0 tambien para un patron negado. Arreglo: patron que empieza por `!` es FALLA.

### IMP-6 — Tres protecciones centrales sin test que se ponga rojo al quitarlas
- M8: sin prueba de «solo lo cubre `.git/info/exclude` o el `excludesFile` global» (a mano acierta: FALLA «regla local»).
- M12: sin prueba de «`git rev-list` falla, NO VERIFICADO» (a mano con clon parcial sin remoto: NO VERIFICADO).
- M16: ninguna prueba planta el secreto en una rama o etiqueta distinta de HEAD, que es lo que afirma el README (a mano funciona con una etiqueta).

### MEN-1 — Un fichero de mas de 1 MiB deja el punto en OK
`bundle.js` de 1,1 MB con clave de produccion: OK con «1 omitidos por tamano». Coherente seria NO VERIFICADO u OK explicito de «cobertura parcial».

### MEN-2 — Rutas no ASCII en el historial
`git log --raw` sin `-z` escapa (`"contrase\303\261a.js"`); `silenciar_N_fichero: contraseña.js` nunca coincide. Arreglo: `-z` o `-c core.quotepath=false`.

### MEN-3 — `--escribir` deja un informe sin trackear que ensucia el workspace
Verificado: `isWorkspaceClean` (`git status --porcelain === ''`) lo usan `start`, `finish`, `review` y `wrappers`; abortan hasta commitear. La segunda ejecucion del dia marca `arbolSucio: true` solo por el informe anterior. Mejor excluir `docs/doctor-deploy/` del calculo de «sucio».

### MEN-4 — Falsos FALLA y OK en gitignore y lockfile
Monorepo con `.gitignore` solo en `apps/web/`: FALLA (solo mira el `.env` de la raiz). Modulo Go sin dependencias (sin `go.sum`): FALLA de lockfile. Python con `requirements.txt` sin versiones fijadas: OK «lockfile versionado» (OK falso).

### MEN-5 — Si falla la escritura del informe, se pierde tambien la salida
Con `docs/doctor-deploy` siendo un fichero, `--escribir` lanza EEXIST y el CLI sale con 1 sin mostrar ningun punto. Arreglo: imprimir el analisis y avisar de que no se pudo escribir.

### MEN-6 — `sanearPunto` sin test que lo exija
Mutante equivalente: hoy ninguna sonda devuelve OK sin evidencia. Es la red del invariante principal y merece un test unitario directo.

### MEN-7 — Referencias solo OWASP Top 10 2021
D7 pedia la version vigente; no se verifico. Metadatos opcionales sin efecto; fijar version (y ASVS) en una tarea posterior.

### MEN-8 — El resumen mezcla desactivados con NO APLICA
Cada punto muestra «DESACTIVADO», pero el resumen los cuenta como NO APLICA. Aceptado: no cambia el codigo de salida.

## Juicio de las desviaciones declaradas

1. Dependencias en un solo punto: aceptable (un unico «scan de dependencias» en el enunciado; ecosistema sin herramienta degrada el punto a NO VERIFICADO). El JSON no separa el estado por ecosistema, lo que TASK-067 podria querer.
2. Sin severidad publicada cuenta como alta: aceptable, falla hacia lo seguro, documentado y coherente con D4.
3. Referencias solo OWASP 2021: MEN-7.
4. Segunda ejecucion de `--escribir` marca SUCIO: confirmado, MEN-3.
5. Guard de workspace limpio: verificado, el informe sin trackear lo dispara (MEN-3).

## Lo que no pude reproducir (no verificado)

- Timeout real de una herramienta externa en Windows (`shell:true` con `.cmd` puede dejar vivo al hijo).
- Salida real de `cargo audit`, `pip-audit`, `dotnet` y `govulncheck` (no instalados): interpretes probados solo con muestras.
- Un clon superficial de mas de 200 000 blobs.

Sin hallazgos CRITICOS: ningun secreto se filtra y ningun camino de herramienta rota llega a OK. Los IMPORTANTES son falsos OK por cobertura, arreglables con poco codigo.
