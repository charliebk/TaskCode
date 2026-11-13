/**
 * Un caso dentro de un test fusionado (TASK-130, poda de tests): ejecuta `fn`
 * y, si lanza un Error, le antepone `[nombre]` al mensaje y lo relanza, para
 * saber que caso fallo sin partir el test. No es un subtest: no cuenta como
 * test aparte. Compartido desde TASK-132 (antes, una copia en cada fichero).
 */
export async function caso(nombre: string, fn: () => unknown): Promise<void> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof Error) e.message = `[${nombre}] ${e.message}`;
    throw e;
  }
}
