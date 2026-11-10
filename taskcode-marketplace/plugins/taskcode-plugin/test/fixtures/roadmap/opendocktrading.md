# Roadmap de tareas

Único documento de planificación de OpenDockTrading. La cabecera (leyes, modelo de negocio y motivo de cada hito) se edita a mano; el resto lo genera `python -I scripts/grafo-tareas.py --escribir` a partir del frontmatter de cada `tarea.md` y no se edita a mano.

<!-- manual:inicio (se edita a mano; scripts/grafo-tareas.py lo conserva) -->
**Origen:** planificación del 2026-11-09 a partir de [diagnostico-opentrading.md](../docs/planificacion/diagnostico-opentrading.md), con los cambios de la persona del mismo día. Esta cabecera sustituye al antiguo documento de hitos, que quedó obsoleto y se borró.

## Hitos

### H0 — Diagnóstico y decisiones

Estudio y ADR, sin código de producto. Empieza por el **catálogo de fallos de OpenTrading** (TASK-062) y el

### H1 — Esqueleto andante con interfaz

Workspace Rust con axum sirviendo la web Vue compilada, el registro de servicios, el arnés de arquitectura,

### H2 — Base de datos optimizada, aditiva e insensible al escalado

La primera ley hecha código: el proyecto `.odtp` y sus cachés, el límite de 3+3 carteras, el migrador solo aditivo, los esquemas de hechos y de órdenes y

### H3 — Frontera con Kraken

Cliente REST firmado, limitador por coste con prioridad para órdenes, WebSocket v2 público y privado, colocación

### H4 — Motor de dominio

Decimal exacto con los incrementos del par, libro de lotes FIFO incremental, conciliación, actor de cuenta como

### H5 — Estrategias, simulación y medida

Estrategias de compra versionadas, venta con protección en el exchange, universo con filtros de calidad y tope de

### H6 — Disposiciones y varios monitores

Disposiciones con nombre y grupos en ventanas propias del navegador para repartir paneles entre monitores. El

### H8 — Cuentas y suscripción

El modelo de negocio hecho código, antes de la puesta en marcha: crate de derechos compartido por el programa y el

### H7 — Migración y puesta en marcha

Importación del historial de OpenTrading sin copiar credenciales, ensayo en papel de 7 días en paralelo, avisos
<!-- manual:fin -->

## Estado del trabajo

<!-- generado por scripts/grafo-tareas.py --escribir; no editar a mano desde aquí -->

Orden en que se hacen las tareas, agrupadas por hito (`sprint` del frontmatter). Sale de las dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del hito menor, luego la de interfaz (segunda ley) y luego la de número menor. Las tareas descartadas (en `tareas/05-archivadas/`) no salen.

- **En marcha:** TASK-009 (en revisión)
- **Listas para empezar:** TASK-067, TASK-077, TASK-078, TASK-081, TASK-082, TASK-083, TASK-011, TASK-068, TASK-069

## H0 — Diagnóstico y decisiones

10 de 19 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| — | TASK-001 | Inventario de datos de OpenTrading: hechos, derivados y telemetría | — | — | ✅ terminada |
| — | TASK-006 | ADR-001 Stack tecnológico y límites de módulos | — | — | ✅ terminada |
| — | TASK-061 | Corpus de Kraken de OpenTrading: documentación, grabaciones e histórico | — | — | ✅ terminada |
| — | TASK-062 | Catálogo de fallos de OpenTrading y su antídoto | — | — | ✅ terminada |
| — | TASK-003 | Censo de parámetros de configuración y propuesta de perfiles | — | TASK-062 | ✅ terminada |
| — | TASK-004 | Estudio de la API de Kraken para órdenes idempotentes y protección en el exchange | — | TASK-061, TASK-062 | ✅ terminada |
| — | TASK-076 | Autopsia del rendimiento real de OpenTrading: dónde se ganó y dónde se perdió el dinero | — | — | ✅ terminada |
| — | TASK-002 | Catálogo de reglas de negocio de compra, venta, riesgo y caja | — | TASK-062, TASK-076 | ✅ terminada |
| — | TASK-005 | Visión de negocio y KPIs: cómo se sabe si el bot gana dinero | — | TASK-076 | ✅ terminada |
| — | TASK-008 | ADR-003 Máquina de estados de órdenes y lotes e idempotencia contra Kraken | — | TASK-002, TASK-004, TASK-062 | ✅ terminada |
| 1 | TASK-009 | ADR-004 Sistema de interfaz: armazón dockview con el tema de ToolsaWeb | — | TASK-003, TASK-005, TASK-062 | ▶ en revisión |
| 2 | TASK-067 | ADR-005 Modelo de negocio: suscripción, proyecto .odtp en el PC del cliente y límite de carteras | — | TASK-005 | lista para empezar |
| 3 | TASK-007 | ADR-002 Modelo de datos: proyecto .odtp y cachés, evolución solo aditiva e insensible al escalado | — | TASK-001, TASK-062, TASK-067 | espera a TASK-067 |
| 4 | TASK-077 | Criterios de calidad del universo de monedas: qué entra, qué sale y cuánto capital por moneda | — | TASK-061, TASK-076 | lista para empezar |
| 5 | TASK-078 | Política de salida para no dejar capital parado: stop real, tiempo máximo y coste de oportunidad | — | TASK-061, TASK-076 | lista para empezar |
| 6 | TASK-081 | Mapa de todas las vías de ganancia: Earn, comisiones, estrategias y régimen de mercado, medidas con datos | — | TASK-004, TASK-076 | lista para empezar |
| 7 | TASK-082 | Glosario del negocio: definición exacta y fórmula de cada dato antes del modelo | — | TASK-001, TASK-005, TASK-062 | lista para empezar |
| 8 | TASK-010 | Modelo relacional completo de OpenDockTrading | — | TASK-007, TASK-008, TASK-082 | espera a TASK-007, TASK-082 |
| 9 | TASK-083 | Oscilaciones de pocos segundos: cuántas hay, cuánto duran y si dejan ganancia neta tras comisiones | — | TASK-061, TASK-076 | lista para empezar |

## H7 — Migración y puesta en marcha

0 de 5 terminadas.

| Paso | Tarea | Título | Complejidad | Depende de | Estado |
|---|---|---|---|---|---|
| 72 | TASK-054 | Importador del historial de OpenTrading sin copiar credenciales | — | TASK-019, TASK-032, TASK-059 | espera a TASK-019, TASK-032, TASK-059 |
| 73 | TASK-055 | Ensayo en papel en paralelo con OpenTrading durante 7 días | — | TASK-044, TASK-050, TASK-054 | espera a TASK-044, TASK-050, TASK-054 |
| 74 | TASK-056 | Avisos remotos por ntfy y vigía externo | — | TASK-039, TASK-050 | espera a TASK-039, TASK-050 |
| 75 | TASK-057 | Runbook de operación y checklist de seguridad de claves | — | TASK-040, TASK-056 | espera a TASK-040, TASK-056 |
| 76 | TASK-058 | Paso a real con capital mínimo y retirada de OpenTrading | — | TASK-055, TASK-057, TASK-074, TASK-079, TASK-080 | espera a TASK-055, TASK-057, TASK-074, TASK-079, TASK-080 |

