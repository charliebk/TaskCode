# Brainstorm — TASK-066, rol dominio (ronda 1)

- Rol: `brainstorm-dominio`
- Agente: a095e5f4175dff7f9

## Reglas e invariantes que el enfoque debe respetar
- Un secreto que llegó a un remoto se da por comprometido: el arreglo es **revocarlo y rotarlo primero**; reescribir el historial (filter-repo/BFG) es opcional y después. «Limpiar secretos de git» como único arreglo es incorrecto. — OWASP Secrets Management Cheat Sheet; GitHub Docs «Removing sensitive data from a repository».
- No toda «API key» en el cliente es una fuga: la `anon`/`publishable` de Supabase y la `apiKey` (`AIza…`) de la config web de Firebase están hechas para ser públicas. La `service_role`/`sb_secret_…` o una cuenta de servicio de Firebase en el cliente es CRÍTICA.
- Que un escáner no encuentre nada no prueba que no haya nada: un OK de secretos o de dependencias lleva su alcance (patrones o herramienta y versión, commits y ramas recorridos, si el audit incluyó dependencias de desarrollo).
- Desactivar un punto es una **aceptación de riesgo**: motivo, quién y cuándo, y debería revisarse. Silenciar un falso positivo concreto (huella de gitleaks, un CVE) es distinto de desactivar el punto entero.
- El informe vale solo para un commit concreto; con el árbol sucio o con otro commit deja de describir lo que se publica.
- La severidad de una vulnerabilidad de dependencia depende del contexto: solo-desarrollo o herramienta de build no pesa igual que runtime (`npm audit --omit=dev`; govulncheck solo informa de código alcanzable).

## Vocabulario
- Clave de cliente de la DB — Supabase: «anon/publishable key» frente a «service_role/secret key». «Clave pública» se confunde con la criptográfica.
- Informe o evidencia de revisión de seguridad — «certificado» sugiere acreditación de terceros y choca con el certificado TLS.
- Aceptación de riesgo / excepción — la tarea dice «desactivar».
- Falso positivo / supresión — sin nombre en la tarea; no es lo mismo que desactivar.
- Cifrado en reposo y cifrado en tránsito — dos puntos distintos; el de tránsito ya está en HTTPS.

## Casos reales que un enfoque técnico trataría mal
- Claves de ejemplo o de test (`.env.example`, `AKIAIOSFODNN7EXAMPLE`, `sk_test_` de Stripe, fixtures): si salen FALLA igual que una `sk_live_`, la gente deja de leer el informe.
- Librerías y CLI: no aplican HTTPS, cookies, headers, rate limits, backups ni health check; el lockfile no se versiona por convención en libs Python o npm. Con detección solo por lenguaje saldría FALLA o NO VERIFICADO en masa donde toca NO APLICA.
- Secreto en el historial ya rotado: hay que poder marcar ese hallazgo como «rotado», con motivo, o el código 1 bloquea para siempre.
- App móvil o SPA: cualquier clave en el binario o bundle se extrae; el arreglo es moverla al servidor o restringirla (dominio, app, App Check).

## Lo ya existente
Los repos con años de historial darán FALLA de secretos antiguos en la primera ejecución: sin supresiones con motivo, el primer informe es inservible. Los informes en `docs/doctor-deploy/` se versionan y no se reescriben.

## Desacuerdos previstos
- Con los criterios — lo que decide si un punto aplica es el **tipo de aplicación** (web, API, móvil, CLI, librería), además del lenguaje. Hacen falta los dos ejes. Móvil (Android/iOS, Flutter, React Native) y Supabase/Firebase no están entre los marcadores.
- Con los criterios — salida 0 con todo NO VERIFICADO parece «listo para publicar»: el resumen debe decir «N de M sin verificar» bien visible.
- Con el objetivo — faltan puntos deterministas: reglas de Firebase `allow read, write: if true`; tablas de migraciones de Supabase sin `enable row level security`; tokens en `.npmrc`/`.pypirc`/`settings.xml`; contraseñas en `docker-compose.yml`; workflows de CI con `pull_request_target` o secretos impresos; acciones de CI sin fijar a SHA; `Dockerfile` sin `USER` o con `ADD` de URL.

## Suposiciones no verificadas (preguntar a la persona)
- Versiones de referencia (OWASP Top 10 2021/2025, ASVS 4.0.3/5.0, MASVS).
- Si el informe es interno o para terceros.
- Si un secreto rotado deja de ser FALLA y quién lo marca.
- Si las vulnerabilidades de dependencias de desarrollo cuentan como FALLA o aviso, y desde qué severidad.
- Si «tests en verde» lo ejecuta doctor-deploy o solo lee un resultado.
