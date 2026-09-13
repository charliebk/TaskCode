## Riesgos, de mayor a menor dano
- Nadie define quien escribe la linea "- Veredicto:" en informe-codex-N.md — el CLI de Codex no la emite (evidencia: la salida real de `codex review` capturada en esta sesion no contiene ningun "Veredicto") — finish.ts es fail-closed y exige esa linea para aprobar, asi que sin decision explicita el informe queda PENDIENTE indefinidamente o alguien la rellena sin criterio fijado — mitigacion: decidir ya que la escribe un humano/agente tras leer el informe, igual que en revision primaria, y no inferirla del exit code.
- El exit code no distingue "codex ausente" de "codex instalado pero fallando" — disparador real en esta maquina: `codex review --base develop~1 --title smoke` devolvio exit 1 con `ERROR: {"status":400,...'gpt-5.6-sol' is not supported when using Codex with a ChatGPT account"}` — si solo se detecta ENOENT como "ausente" y cualquier otro !=0 se trata como fallo duro, el criterio de aceptacion 3 no cubre el caso mas probable en la practica — mitigacion: tratar TODO exit!=0 como degradar-con-aviso, igual que `isRemoteAvailable` (src/fs/git.ts) no distingue "sin origin" de "origin con red caida".
- La salida de `codex review` mezcla un log de tracing, banner, warnings de modelo y un bloque JSON de error en el mismo stdout, sin flag de salida estructurada (`codex review --help` no ofrece `--json`) — si codex-review.ts intenta parsear ese texto para decidir algo, extrae ruido; si lo vuelca crudo a informe-codex-N.md, el fichero lleva avisos de "skills context budget" y session id delante de lo que deberia leerse como veredicto.
- Proceso que cuelga esperando red sin timeout propio del wrapper — no verificado con red realmente caida (no desconecte la maquina), pero `codex review` no expone ningun flag de timeout; si cuelga, taskctl codex-review bloquea al humano sin una salida limpia desde un pipe no interactivo.
- Concurrencia: dos `taskctl codex-review` a la vez sobre la misma tarea calculan la misma "siguiente ronda" antes de escribir — con flag 'wx' (mismo patron que review.ts) una de las dos falla con EEXIST crudo si codex-review.ts no reusa el try/catch(isEexist) que review.ts ya tiene para este caso.
- review.ts envuelve TODAS las escrituras de una ronda en un unico try/catch antes de mover la tarea y comitear; si codex-review.ts no replica ese orden (escribe informe-codex-N.md sin ese blindaje, o comitea antes de saber si la llamada a Codex termino bien) puede quedar un informe a medio escribir sin commitear, invisible para un `taskctl finish` corrido desde otra copia del repo.

## Puntos sin retorno
- Con `--push`, un informe-codex-N.md fundado en una aprobacion equivocada (o con ruido del CLI leido como aprobacion) queda comiteado y empujado a origin: deshacerlo exige reescribir historia compartida, no un simple descarte local.
- El diff enviado a la API de Codex sale de la maquina hacia un tercero en cuanto se ejecuta `codex review`, sea cual sea el resultado despues — no hay vuelta atras sobre ese envio en si.

## Descartado a proposito
- Mapear cada codigo/tipo de error de Codex (400, 401, 429, 5xx) a un mensaje distinto no merece el gasto ahora: tratar todo exit!=0 igual (avisa y degrada) ya cubre el criterio de aceptacion sin mantener esa tabla.
- Reintentos automaticos con backoff ante fallo de red: no evaluado aqui (no se probo red intermitente en esta sesion) y es una decision de arquitectura, no un riesgo mio.

## Desacuerdos previstos
- con arquitectura — si el diseño asume que exit code 0 de `codex review` equivale a "aprobada" sin exigir una linea "- Veredicto:" explicita — mi posicion: mantener el mismo contrato que revision primaria (aprobacion por texto explicito, fail-closed), porque ya se ha visto que exit!=0 aparece por motivos ajenos a la calidad de la revision (cuenta/modelo, no el diff).

## Suposiciones no verificadas
- No pude desconectar la red real de esta maquina: el comportamiento de `codex review` sin red (cuelgue, timeout, mensaje) sigue sin comprobar — revisar bloqueando el acceso a la API y repitiendo la prueba.
- No probe un camino "feliz" con una cuenta/modelo compatible: el formato de exito (con o sin hallazgos) es una suposicion, no evidencia — conseguir una cuenta con modelo soportado y repetir.
- No aisle si `--base <rama-inexistente>` falla por Git antes de llamar a la red, porque el error de cuenta/modelo enmascaro esa ruta en las dos pruebas que hice — repetir con una cuenta valida y una rama inexistente.
- Asumo que `spawnSync('codex', ...)` en Node da `result.error.code === 'ENOENT'` cuando el binario falta, igual que ya maneja `isRemoteAvailable` para "git" — no lo he probado invocando spawnSync directamente, solo el "command not found" del shell (exit 127).
