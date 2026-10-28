export function resumir(puntos) {
    const cuenta = (e) => puntos.filter((p) => p.estado === e).length;
    return {
        ok: cuenta('ok'),
        falla: cuenta('falla'),
        noVerificado: cuenta('no-verificado'),
        noAplica: cuenta('no-aplica'),
        total: puntos.length,
    };
}
/** 1 si algun punto FALLA; NO VERIFICADO y NO APLICA no cuentan. */
export function codigoSalida(puntos) {
    return puntos.some((p) => p.estado === 'falla') ? 1 : 0;
}
/**
 * Invariante «ningun OK sin evidencia»: un OK sin evidencias se degrada a NO
 * VERIFICADO, para que ni un fallo de una sonda lo deje pasar.
 */
export function sanearPunto(p) {
    if (p.estado === 'ok' && p.evidencias.length === 0) {
        return {
            ...p,
            estado: 'no-verificado',
            motivo: `la comprobacion no aporto evidencia de que este bien (${p.motivo})`,
        };
    }
    return p;
}
const ETIQUETA_ESTADO = {
    ok: 'OK',
    falla: 'FALLA',
    'no-verificado': 'NO VERIFICADO',
    'no-aplica': 'NO APLICA',
};
export function etiquetaEstado(e) {
    return ETIQUETA_ESTADO[e];
}
/** Una evidencia en una linea: `fichero:linea (commit abc1234) descripcion [muestra]`. */
export function textoEvidencia(e) {
    const donde = e.fichero === undefined ? '' : e.linea === undefined ? `${e.fichero}: ` : `${e.fichero}:${e.linea}: `;
    const commit = e.commit === undefined ? '' : ` (commit ${e.commit})`;
    const muestra = e.muestra === undefined ? '' : ` [${e.muestra}]`;
    return `${donde}${e.descripcion}${commit}${muestra}`;
}
export function textoResumen(r) {
    const sinVerificar = `${r.noVerificado} de ${r.total} sin verificar`;
    return (`Resumen: ${r.ok} OK, ${r.falla} FALLA, ${r.noVerificado} NO VERIFICADO, ${r.noAplica} NO APLICA. ` +
        `${sinVerificar}.`);
}
function textoTipos(tipos) {
    if (tipos.length === 0)
        return 'ninguno (sin ficheros marcadores: los puntos que dependen de un tipo salen NO APLICA)';
    return tipos.map((t) => `${t.nombre} (${t.rutas.join(', ')})`).join('; ');
}
/** Las tareas de `--crear-tareas` en texto: lo creado, lo reutilizado (y se dice) y las huerfanas. */
export function lineasTareas(t) {
    const l = [];
    if (t.creadas.length === 0 && t.reutilizadas.length === 0)
        l.push('Tareas: ningun punto FALLA, no se ha creado nada.');
    else
        l.push(`Tareas: ${t.creadas.length} creada(s), ${t.reutilizadas.length} reutilizada(s).`);
    for (const c of t.creadas)
        l.push(`    ${c.id} creada para ${c.punto}`);
    for (const c of t.reutilizadas)
        l.push(`    ${c.id} ya estaba abierta para ${c.punto}: se reutiliza, no se crea otra`);
    for (const h of t.huerfanas) {
        l.push(`    [AVISO] ${h.id} (punto ${h.punto}): ${h.motivo}. Comprueba si se puede cerrar; doctor-deploy no cierra tareas.`);
    }
    return l;
}
/** Maximo de evidencias que se listan por punto en la salida de texto. */
const MAX_EVIDENCIAS_TEXTO = 12;
export function formatearTexto(informe) {
    const r = resumir(informe.puntos);
    const l = [];
    l.push('taskctl doctor-deploy');
    l.push(`Commit: ${informe.commit ?? '(sin commits)'}   Rama: ${informe.rama ?? '(desconocida)'}${informe.arbolSucio ? '   ARBOL SUCIO: lo comprobado puede no ser lo publicado' : ''}`);
    l.push(`Tipos detectados: ${textoTipos(informe.tipos)}`);
    for (const a of informe.avisos)
        l.push(`[AVISO] ${a}`);
    l.push('');
    for (const p of informe.puntos) {
        const marca = `[${etiquetaEstado(p.estado)}]`;
        l.push(`${marca} ${p.id} (${p.severidad}, ${p.metodo})${p.desactivado ? ' DESACTIVADO' : ''}${p.origen === 'agente' ? ' [agente]' : ''}: ${p.motivo}`);
        if (p.estado === 'falla' || p.estado === 'ok') {
            for (const e of p.evidencias.slice(0, MAX_EVIDENCIAS_TEXTO))
                l.push(`    - ${textoEvidencia(e)}`);
            if (p.evidencias.length > MAX_EVIDENCIAS_TEXTO) {
                l.push(`    - ... y ${p.evidencias.length - MAX_EVIDENCIAS_TEXTO} mas (todas en --json)`);
            }
        }
        if (p.estado === 'falla')
            l.push(`    Arreglo: ${p.arreglo}`);
    }
    l.push('');
    if (informe.veredictos !== null) {
        l.push(`Veredictos del agente: ${informe.veredictos.aceptados} aceptado(s), ${informe.veredictos.rechazados.length} rechazado(s).`);
        for (const x of informe.veredictos.rechazados)
            l.push(`    [RECHAZADO] ${x.punto}: ${x.motivo}`);
        l.push('');
    }
    if (informe.tareas !== null)
        l.push(...lineasTareas(informe.tareas), '');
    l.push(textoResumen(r));
    if (r.falla === 0 && r.noVerificado > 0) {
        l.push(`Sin FALLA no es «listo para publicar»: ${r.noVerificado} puntos no se han podido comprobar y siguen ` +
            'pendientes (los de juicio, hasta que se revisen con criterio; los de herramienta, hasta instalarla).');
    }
    l.push(r.falla === 0 ? 'Salida 0.' : `Salida 1: ${r.falla} punto(s) FALLA.`);
    return `${l.join('\n')}\n`;
}
/** Una sola linea de JSON (v2, TASK-067). */
export function formatearJson(informe) {
    const resumen = resumir(informe.puntos);
    return `${JSON.stringify({ ...informe, resumen, codigo: codigoSalida(informe.puntos) })}\n`;
}
function celda(t) {
    return t.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}
/** Informe en Markdown para `--escribir`. */
export function formatearInforme(informe) {
    const r = resumir(informe.puntos);
    const l = [];
    l.push('# Informe de doctor-deploy');
    l.push('');
    l.push('Informe de uso interno de las comprobaciones previas a publicar. Describe el commit indicado y ' +
        'nada mas: no es una certificacion ni una auditoria de terceros.');
    l.push('');
    l.push(`- Fecha: ${informe.fecha}`);
    l.push(`- Commit: ${informe.commit ?? '(sin commits)'}`);
    l.push(`- Rama: ${informe.rama ?? '(desconocida)'}`);
    l.push(`- Arbol de trabajo: ${informe.arbolSucio ? 'SUCIO (habia cambios sin commitear: este informe puede no describir lo que se publica)' : 'limpio'}`);
    l.push(`- Tipos detectados: ${textoTipos(informe.tipos)}`);
    l.push(`- ${textoResumen(r)}`);
    l.push(`- Codigo de salida: ${codigoSalida(informe.puntos)}`);
    if (informe.tareas !== null) {
        l.push(`- Tareas: ${informe.tareas.creadas.length} creada(s) (${informe.tareas.creadas.map((c) => c.id).join(', ') || 'ninguna'}), ${informe.tareas.reutilizadas.length} reutilizada(s)`);
        for (const h of informe.tareas.huerfanas)
            l.push(`  - ${h.id} (${celda(h.punto)}): ${celda(h.motivo)}`);
    }
    if (informe.veredictos !== null) {
        l.push(`- Veredictos del agente: ${informe.veredictos.aceptados} aceptado(s), ${informe.veredictos.rechazados.length} rechazado(s)`);
        for (const x of informe.veredictos.rechazados)
            l.push(`  - Rechazado (${celda(x.punto)}): ${celda(x.motivo)}`);
    }
    l.push('');
    if (informe.avisos.length > 0) {
        l.push('## Avisos');
        l.push('');
        for (const a of informe.avisos)
            l.push(`- ${a}`);
        l.push('');
    }
    l.push('## Puntos');
    l.push('');
    l.push('| Punto | Severidad | Metodo | Origen | Estado | Detalle |');
    l.push('|---|---|---|---|---|---|');
    for (const p of informe.puntos) {
        l.push(`| ${celda(p.id)} | ${p.severidad} | ${p.metodo} | ${p.origen} | ${etiquetaEstado(p.estado)} | ${celda(p.motivo)}${p.desactivado ? ' (desactivado)' : ''} |`);
    }
    l.push('');
    const conEvidencia = informe.puntos.filter((p) => p.estado === 'falla' || p.estado === 'ok');
    if (conEvidencia.length > 0) {
        l.push('## Evidencias');
        l.push('');
        for (const p of conEvidencia) {
            l.push(`### ${p.id} - ${etiquetaEstado(p.estado)}`);
            l.push('');
            for (const e of p.evidencias)
                l.push(`- ${textoEvidencia(e)}`);
            if (p.estado === 'falla') {
                l.push('');
                l.push(`Arreglo: ${p.arreglo}`);
            }
            l.push('');
        }
    }
    return `${l.join('\n')}\n`;
}
