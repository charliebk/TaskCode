/**
 * Version de taskctl (TASK-084). Vive en el nucleo, y no en `cli.ts`, porque
 * cada fila de `## Transiciones` la anota (`core/transiciones.ts`) y el
 * nucleo no debe depender del punto de entrada.
 *
 * Esta repetida en `package.json` y `.claude-plugin/plugin.json`: un test de
 * empaquetado exige que las tres coincidan, porque una fila escrita con una
 * version desfasada no se puede corregir sin reescribir historia.
 *
 * Regla de publicacion: la version se sube al ABRIR el ciclo (la primera
 * tarea de la version nueva), no al publicar. Asi las tareas que construyen
 * una version se cierran con su numero y `taskctl metricas --por-version`
 * no las mezcla con la anterior.
 */
export const VERSION_TASKCTL = '0.12.0';
