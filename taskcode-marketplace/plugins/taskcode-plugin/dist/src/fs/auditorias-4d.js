/**
 * TASK-167d: los informes de auditoria 4D de un repo
 * (`docs/auditoria-4d-<fecha>.md`, de la skill `auditoria-4d`). Un informe
 * que no se puede leer es un aviso con su motivo, no un error: las metricas
 * siguen saliendo.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CARPETA_AUDITORIA_4D, fechaDeInforme4D, leerResumenAuditoria4D } from '../core/auditoria-4d.js';
import { listarSiExiste } from './task-store.js';
export async function leerAuditorias4D(repoRuta) {
    const carpeta = path.join(repoRuta, CARPETA_AUDITORIA_4D);
    const nombres = await listarSiExiste(carpeta);
    const auditorias = [];
    const avisos = [];
    for (const fichero of nombres.sort()) {
        const fecha = fechaDeInforme4D(fichero);
        if (fecha === null)
            continue;
        let texto;
        try {
            texto = await readFile(path.join(carpeta, fichero), 'utf8');
        }
        catch (e) {
            // Una carpeta con ese nombre o un fichero sin permiso: aviso, como un informe roto.
            const motivo = e instanceof Error && 'code' in e ? String(e.code) : String(e);
            avisos.push(`${CARPETA_AUDITORIA_4D}/${fichero} no entra en la tendencia de auditorias 4D: no se pudo leer (${motivo}).`);
            continue;
        }
        const lectura = leerResumenAuditoria4D(texto);
        if (lectura.ok) {
            auditorias.push({ fichero, ...fecha, cifras: lectura.cifras });
        }
        else {
            avisos.push(`${CARPETA_AUDITORIA_4D}/${fichero} no entra en la tendencia de auditorias 4D: ${lectura.motivo}. ` +
                'Corrige su tabla de "## Resumen" con el formato de la skill auditoria-4d.');
        }
    }
    return { auditorias, avisos };
}
