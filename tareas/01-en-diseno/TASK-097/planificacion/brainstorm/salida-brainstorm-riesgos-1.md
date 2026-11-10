# Brainstorm — TASK-097, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

Referencias relativas a `taskcode-marketplace/plugins/taskcode-plugin/`.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **Aprobación automática que se salta la regla.** Si la regla solo vive en `siguiente` (`flujo.ts`), `approve --decidido-por automatico` no la consulta: solo mira el modo congelado (`approve.ts:181-190`). Un agente que llame a approve directamente aprueba un plan de 300 min. Mitigación: approve rechaza `automatico` cuando la estimación pase de 60.
- **«Preguntar en cualquier modo» no se cumple en manual.** `accionPara` devuelve `detener` en manual antes de evaluar `exigePersona` (`flujo.ts:100`, `:108`). O se reordena, o se acepta y se deja escrito (decisión de dominio).
- **La estimación se puede maquillar.** La escribe el mismo agente que quiere seguir solo (`Duracion estimada: 55 min`, o contar menos ficheros). Mitigación: recalcular con las señales (ficheros, capas, criterios) y usar el máximo entre lo declarado y lo derivado. La cifra declarada sola no sirve como guarda.
- **finish rompe después del merge.** La anotación se escribiría tras el merge (`finish.ts:635-656`); si el cálculo lanza (plan sin línea, formato raro, `start` ausente o con precisión de día), la tarea queda mergeada sin estado `terminada`. Mitigación: el cálculo nunca lanza; si falta un dato, «—» o «sin estimación».
- **Detector de plantilla roto para planes viejos.** `planEsEsqueleto` compara por conjunto de líneas contra el `planTemplate` actual (`validacion-tarea.ts:169-179`, `approve.ts:285-293`): añadir líneas es seguro; reescribir las existentes, no. Un placeholder `Duracion estimada: N min` no parsea.
- **Formatos raros**: `~90 min`, `1h30`, `90-120 min`, `90 minutos`, coma decimal, negrita, varias líneas (una en un bloque de código), «Duración» con tilde. Lo que no se entiende se trata como «preguntar», nunca como ≤60.

## Estados intermedios y fallos parciales

- Reintento de finish: ya puede dejar dos filas `finish` (`transiciones.ts:325-333`); la anotación debe reemplazarse, no añadirse.
- Tarea re-planificada: `metricas` usa el primer `plan` y el primer `start` (`metricas.ts:302-306`); hay que comparar con la estimación del plan vigente.
- Sin `start` o con `start` de solo día (filas anteriores a TASK-052; `deps.ahora ?? today` en `start.ts:296`, `finish.ts:655`): «—», nunca 0 (criterio de `metricas.ts:195-196`).
- Pausas: solo cuentan las filas de `taskctl pausa` (`pausa.ts:90`); los wrappers `pause`/`resume` no escriben fila, así que una noche de pausa cuenta como trabajo; y una `pausa` cierra en la fila siguiente (`metricas.ts:285-296`). Sesgan la calibración.

## Compatibilidad hacia atras

- Tareas ya diseñadas sin la línea: approve solo avisa; `siguiente` trata «sin estimación» como hoy. Si no, el backlog de `01-en-diseno` se atasca al actualizar.
- Plan en la ubicación heredada (`plan-final.md` suelto, `approve.ts:169`): misma resolución que approve.
- Un plugin anterior ignora la línea y la anotación si van en el cuerpo, no en el frontmatter.

## Vuelta atras

- Revertir el commit basta; las líneas ya escritas quedan como texto muerto, inocuo si no son filas de `## Transiciones` ni campos del frontmatter.
- Punto sin retorno: solo si se añadiera una columna a `## Transiciones` (`transiciones.ts:30-38`).

## El riesgo que mas te preocupa (UNO solo)

La guarda de >60 min se basa en una cifra que escribe el propio agente y que solo comprueba `siguiente`. Con `approve --decidido-por automatico` directo (`approve.ts:181`) o con una estimación de 59 no se aplica. Tiene que valer también en approve y apoyarse en señales recalculadas, no solo en la cifra declarada.

No cubre: dónde encaja el cambio, qué tests escribir y si el umbral y las señales son los correctos.
