/**
 * TASK-149c (FS-12): la unica lectura de la cola de un fichero. Modulo sin
 * dependencias a proposito: lo usa fs/progreso.ts, que carga la via rapida de
 * `taskctl estado` (la status line), y esa via no puede cargar nada que lance git.
 */
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';

/**
 * Los ultimos `bytes` bytes de un fichero, sin leerlo entero: un `npm test`
 * puede soltar megas y el coste no debe depender de eso. Si el corte cae en
 * medio de un caracter UTF-8, se descartan los bytes de continuacion sueltos
 * del principio.
 */
export function leerCola(ruta: string, bytes: number): { texto: string; total: number } {
  const fd = openSync(ruta, 'r');
  try {
    const total = fstatSync(fd).size;
    const n = Math.min(total, bytes);
    const buf = Buffer.alloc(n);
    let leidos = 0;
    while (leidos < n) {
      const k = readSync(fd, buf, leidos, n - leidos, total - n + leidos);
      if (k === 0) break;
      leidos += k;
    }
    let desde = 0;
    if (total > n) {
      while (desde < leidos && desde < 4 && ((buf[desde] as number) & 0xc0) === 0x80) desde++;
    }
    return { texto: buf.subarray(desde, leidos).toString('utf8'), total };
  } finally {
    closeSync(fd);
  }
}
