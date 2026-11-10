# Inventario de agilidad frente a calidad — de la 0.8 a la 0.13

Fecha: 2026-11-10. Datos: 147 tareas terminadas (137 de ToolsaWeb, 10 de
OpenDockTrading), leídas de `tarea.md` (transiciones, coste), de los informes de
revisión y de `git log`. Scripts de medición fuera del repo.

## Objetivo y reglas del inventario

- **Objetivo principal: aumentar la agilidad sin perder calidad**, y mejorar la
  calidad donde se pueda. Agilidad frente a calidad, siempre las dos.
- **La 0.8 es la base que funcionaba y se conserva entera.** Este inventario solo
  juzga lo añadido de la 0.9 a la 0.13. No se trata de simplificar por simplificar
  ni de volver a una versión anterior: cada mecanismo se mantiene, se corrige o se
  retira según su coste medido y lo que aporta en calidad.
- Un mecanismo que no cuesta nada mientras un proyecto no lo declara (es
  opcional) no frena a nadie: se mantiene.

## Lo que dicen los datos (ToolsaWeb, medianas por versión)

| versión | tareas | plan → cierre | 1.ª revisión → cierre | rondas medias | Mtok revisión | Mtok revisión por ronda |
|---|---|---|---|---|---|---|
| 0.8 | 51 | 192 min | 56 min | 2,3 | 5,6 | 2,6 |
| 0.11 | 7 | 124 min | 51 min | 2,7 | 9,9 | 4,6 |
| 0.12 | 8 | 172 min | 97 min | 3,8 | 18,4 | 6,4 |
| 0.13 | 2 | 584 min | 191 min | 3,0 | 20,1 | 6,6 |

- **La pérdida está en la revisión y en la verificación**, no en el diseño: los
  tokens de diseño no cambian (2,1 → 1,7–2,5 M).
- Los tokens de implementación **no son comparables**: desde la 0.12 (TASK-085)
  se registra la sesión entera, antes solo los agentes. La subida aparente
  (15 → 31–42 M) es en buena parte cambio de medida.
- Los hallazgos por ronda no bajan desde la 0.11 (11, 17, 16; 13, 19, 19, 14, 17;
  un ADR de OpenDockTrading con 14 rondas de unos 11 hallazgos cada una).
- **Las rondas tardías apenas aportan calidad nueva**: de unas 77 rondas 3.ª o
  posteriores en los dos proyectos, 2 encontraron un CRÍTICO nuevo, los dos en
  documentos (ADR-028 de ToolsaWeb, ADR-003 de OpenDockTrading). Antes de la 0.8,
  la ronda 3 solía traer solo MENOR (10 de 16).
- **Los revisores de dominio sí aportan calidad propia**: de 88 CRÍTICO/IMPORTANTE
  suyos en rondas con el genérico, 63 caen en ficheros que el genérico no marcó.
- Limitaciones: los tiempos incluyen esperas de la persona (por eso medianas);
  de la 0.13 en ToolsaWeb solo hay 2 tareas; la versión anterior a la 0.12 se
  deduce por fecha; no hay historial de cada verificación, solo de la última.

## Inventario de la 0.9 a la 0.13

| mecanismo (versión, tarea) | coste en agilidad medido | aporte en calidad medido | veredicto |
|---|---|---|---|
| `comando_verificacion` declarado (0.9, TASK-070) | ninguno por sí solo | base de los frenos | **mantener** |
| Freno de fin de turno `Stop` (0.9, TASK-071; con selectiva desde 0.13) | corre la verificación al final de **cada turno** con tarea en curso; en ToolsaWeb la selectiva tiene tope de 3300 s y corre siempre los pasos 0–16. No hay registro de cuántas veces corre | evita dar por hecho algo en rojo; no hay registro de cuántos rojos cazó | **corregir** (TASK-096): coste proporcional a lo que cambió el turno |
| Puerta de verificación completa en `finish` (0.9, TASK-072) | 20–40 min por tarea en ToolsaWeb, también en tareas sin código; se repetía cuando el ROADMAP quedaba atrasado (corregido en TASK-092) | garantiza que no se integra nada roto | **mantener la garantía, corregir el coste** (TASK-096): proporcional al cambio |
| Guardián de merges (0.9, TASK-072/077) | hook que sale sin cargar nada si el comando no tiene `merge` | impide merges manuales sin verde | **mantener** |
| Tests held-out (0.9, TASK-073/078) | 0: ningún proyecto lo declara | sin uso aún | **mantener** (opcional) |
| Cobertura de líneas cambiadas (0.9, TASK-074) | 0: ningún proyecto lo declara | sin uso aún | **mantener** (opcional) |
| Doctor-deploy (0.9, TASK-066–068) | 0 en el flujo (comando aparte; aviso en `finish` de release) | revisión de seguridad antes de publicar | **mantener** |
| Doctor: hooks que bloquean subagentes (0.9, TASK-076) | 0 en el flujo | evita paradas inexplicadas | **mantener** |
| Revisor de dominio Rust/WASM (0.10, TASK-079) | un segundo revisor por ronda en diffs de Rust: ~3,5 M tokens más por ronda; en 5 de 24 rondas con dos revisores solo él dejó la ronda abierta | 63 de 88 CRÍTICO/IMPORTANTE de dominio en ficheros que el genérico no marcó | **mantener**; que sus rondas converjan (TASK-095) |
| Accesibilidad en angular-vue y rol de rendimiento (0.11, TASK-080) | rol condicional por etiquetas; diseño sin subida de tokens | criterios de WCAG y de rendimiento | **mantener** |
| Versión del plugin en cada tarea y métricas por versión (0.12, TASK-084) | 0 en el flujo | es lo que ha permitido este inventario | **mantener** |
| Revisión más barata: contexto permitido y modelo más barato en ronda 2+ (0.12, TASK-081) | pretendía bajar el coste; el coste por ronda siguió subiendo (4,6 → 6,4 M) y no se puede aislar su efecto | — | **mantener**; medir de nuevo tras TASK-095 |
| Autorrevisión del implementador (0.12, TASK-082) | poco tiempo del implementador | no se ve efecto en los hallazgos de la ronda 1 (mediana ~10–11 antes y después) | **mantener**; medir de nuevo tras TASK-095 |
| Ronda siguiente acotada solo si quedan MENOR (0.12, TASK-083) | **causa principal, con el fallo localizado** en `src/core/informe-revision.ts:340-370`: un CRÍTICO o IMPORTANTE «en CUALQUIER estado (también `corregido` o `aceptado`)» obliga a la ronda completa. Los revisores vuelven a listar los IMPORTANTE ya corregidos, así que la condición no se cumple nunca y cada ronda relanza una completa desde la base que encuentra otra tanda. El ADR-003 de OpenDockTrading (TASK-008): 14 rondas de ~10 min, todas completas por «tiene un IMPORTANTE (N-46, corregido)». La acotada saltó en 1 de 42 rondas en OpenDockTrading | la idea es buena; la condición, con los informes reales, es imposible | **corregir** (TASK-095) |
| Coste de implementación automático (0.12, TASK-085) | hook que solo anota rutas y sale con 0 | medida completa del coste (cambia la comparación con la 0.8) | **mantener** |
| Pausas fuera de las duraciones; doctor de versión y de verificación (0.12, TASK-086–088) | 0 en el flujo | mejores métricas y avisos | **mantener** |
| Guardián de secretos en los tests de TaskCode (0.12, TASK-089/090) | solo en la suite de TaskCode | evita bloqueos de push | **mantener** |
| Verificación selectiva por impacto (0.13, TASK-091) | antes de cada ronda y en cada `Stop`; además, con ella el `Stop` deja de guardar el verde de la completa, así que nadie lo reutiliza | verificación más rápida que la completa en cada ronda | **mantener**; ajustar su papel en TASK-096 |

## Conclusión

Dos causas explican la pérdida de agilidad de la 0.8 a la 0.13, y ninguna exige
quitar calidad:

1. **Rondas de revisión que no convergen** (0.10 + 0.12): con dos revisores, casi
   siempre queda algún IMPORTANTE abierto, y eso relanza una ronda completa desde
   la base con revisores nuevos, que encuentran otra tanda. → **TASK-095**: desde
   la ronda 2, cada revisor verifica sus hallazgos y el diff de la corrección (el
   de dominio sigue verificando lo suyo), y solo abre hallazgos nuevos si son
   CRÍTICOS o los causa la corrección. Tras la ronda 3, decide una persona.
2. **Verificar más de lo que cambia** (0.9 + 0.13): completa en cada `finish`
   aunque la tarea no toque código, y verificación al final de cada turno. →
   **TASK-096**: el coste de verificar crece con lo que cambia la tarea, sin
   perder la garantía de no integrar nada roto.

Retiradas antes de este inventario, por poco valor medido: TASK-093 (reutilizar
el verde en `finish`) y TASK-094 (cerrojo de verificación).

Aparte, y fuera de este alcance: la propia suite de TaskCode ha pasado de 115 a
163 ficheros de test (2087 tests, ~25 min en Windows con la máquina cargada). Es
la misma curva que sufren los proyectos y TASK-096 le aplicaría igual.
