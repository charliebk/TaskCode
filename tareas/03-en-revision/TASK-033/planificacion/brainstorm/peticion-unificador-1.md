# Peticion al unificador — TASK-033 (ronda 1)

- Tarea: TASK-033 — Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-03
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (4 puntos): **media**
- Senales encontradas:
  - etiquetas_adicionales: 4 etiquetas (3 mas alla de la primera) (+3)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 2 roles.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Enunciado de la tarea

### Objetivo

````
Corregir dos huecos que ha destapado el primer proyecto externo que usa el
plugin (OpenGisViewer, TASK-003), y publicarlos como versión de corrección
**0.1.1**.
````

### Criterios de aceptacion

````
Con las claves nuevas configuradas, `approve`, `start`, `review` y `finish` ejecutan el comando de sincronización y las rutas declaradas entran en **su mismo** commit automático. Test contra un repo Git real con un script que reescribe un fichero a partir de `tareas/`.
Después de cada una de esas transiciones, `git status --porcelain` sale vacío: no queda el `MM` del hook de pre-commit y el siguiente comando no aborta en el guard de la §8.3. Test que encadena `approve → start → review` sin commits manuales en medio.
Sin las claves, el comportamiento es idéntico al de hoy: la suite existente pasa sin tocar sus expectativas.
Un comando de sincronización que falla (exit ≠ 0) o que toca rutas no declaradas no se traga en silencio. La semántica exacta sale del plan y tiene test de contraprueba.
Una clave mal escrita o con un valor inválido aborta con la lista de claves válidas, igual que las tres que ya existen (fallo cerrado).
`SKILL.md` documenta las dos claves nuevas y la guía de criterios post-cierre. Los tests de «no mencionar el proyecto» siguen en verde.
Versión 0.1.1 en `package.json` y `plugin.json` (y en el marketplace si la declara). Entrada en `CHANGELOG.md`.
Verificación de extremo a extremo en OpenGisViewer (o en un clon desechable suyo): con las claves configuradas, una transición deja `pnpm check:plan` en verde sin commit manual.
````
