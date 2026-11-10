/** Ruta del ROADMAP relativa a la raiz del repo, con separadores POSIX. */
export const ROADMAP_RUTA = 'tareas/ROADMAP.md';
/** Linea exacta que marca un ROADMAP como generado por taskctl. La version del formato va dentro. */
export const MARCA_TASKCTL = '<!-- generado por taskctl; formato 1; no editar fuera de la zona manual -->';
/** Indice (base 0) de la linea donde tiene que estar la marca: la tercera. */
export const LINEA_MARCA = 2;
/** Cabecera de la tabla de cada hito (la usa tambien la comparacion). */
export const CABECERA_TABLA_HITO = '| Paso | Tarea | Título | Complejidad | Depende de | Estado |';
export const PREFIJO_MANUAL_INICIO = '<!-- manual:inicio';
export const MANUAL_FIN = '<!-- manual:fin -->';
/** Zona manual de un ROADMAP recien creado. */
export const ZONA_MANUAL_POR_DEFECTO = [
    '<!-- manual:inicio (se edita a mano; taskctl la conserva) -->',
    '## Hitos',
    '',
    'Un `### Hn — título` por hito (n es el campo `sprint` de sus tareas), en el orden en que se hacen y con su ' +
        'motivo debajo. taskctl conserva esta zona tal cual y toma de aquí los títulos y el orden de los hitos.',
    MANUAL_FIN,
].join('\n');
export class RoadmapError extends Error {
}
const ESTADOS_LEGIBLES = {
    terminada: '✅ terminada',
    'en-diseno': '▶ en diseño',
    'en-curso': '▶ en curso',
    'en-revision': '▶ en revisión',
};
const EN_MARCHA = ['en-diseno', 'en-curso', 'en-revision'];
/** Quita el `\r` final de cada linea: las marcas se comparan ignorando CRLF. */
export function normalizarFinales(texto) {
    return texto.replace(/\r\n/g, '\n');
}
/** true si la tercera linea es exactamente la marca de taskctl (ignorando CRLF). */
export function llevaMarcaTaskctl(texto) {
    const lineas = normalizarFinales(texto).split('\n');
    return lineas[LINEA_MARCA] === MARCA_TASKCTL;
}
/**
 * La zona manual con sus dos marcas, tal cual esta en `texto` (ya
 * normalizado a LF), o null si no tiene. Una marca de inicio sin la de
 * fin, o una de fin suelta, es un ROADMAP roto: se lanza en vez de
 * adivinar donde acaba, porque adivinar mal perderia texto de la persona.
 */
export function extraerZonaManual(texto) {
    const lf = normalizarFinales(texto);
    const lineas = lf.split('\n');
    const inicio = lineas.findIndex((l) => l.startsWith(PREFIJO_MANUAL_INICIO) && l.trimEnd().endsWith('-->'));
    const finSuelto = lineas.indexOf(MANUAL_FIN);
    if (inicio < 0) {
        if (finSuelto >= 0) {
            throw new RoadmapError(`el ROADMAP tiene "${MANUAL_FIN}" sin la marca de inicio de la zona manual.`);
        }
        return null;
    }
    const fin = lineas.indexOf(MANUAL_FIN, inicio + 1);
    if (fin < 0) {
        throw new RoadmapError(`el ROADMAP abre la zona manual (linea ${inicio + 1}) y no la cierra con "${MANUAL_FIN}".`);
    }
    return lineas.slice(inicio, fin + 1).join('\n');
}
/** Numero de hito -> titulo, en el orden de los `### Hn — titulo` de la zona manual (gana el primero). */
export function titulosDeHitos(zonaManual) {
    const titulos = new Map();
    if (zonaManual === null)
        return titulos;
    for (const m of normalizarFinales(zonaManual).matchAll(/^### H(\d+) — (.+)$/gm)) {
        const n = Number(m[1]);
        if (!titulos.has(n))
            titulos.set(n, (m[2] ?? '').trim());
    }
    return titulos;
}
function numeroDe(id) {
    const m = /(\d+)$/.exec(id);
    return m === null ? Number.MAX_SAFE_INTEGER : Number(m[1]);
}
function comparar(a, b) {
    for (let i = 0; i < a.length; i++) {
        const d = (a[i] ?? 0) - (b[i] ?? 0);
        if (d !== 0)
            return d;
    }
    return 0;
}
/**
 * Orden topologico estable (Kahn con prioridad): de las tareas sin
 * predecesoras pendientes sale primero la de clave menor (rango del hito,
 * hito, numero). Las que quedan dentro de un ciclo no salen nunca por
 * Kahn: se devuelven aparte, en orden de clave.
 */
function ordenar(tareas, rango) {
    const clave = (id) => {
        const t = tareas.get(id);
        return [rango.get(t.sprint) ?? Number.MAX_SAFE_INTEGER, t.sprint, numeroDe(id)];
    };
    const pendientes = new Map();
    const dependientes = new Map();
    for (const id of tareas.keys())
        dependientes.set(id, []);
    for (const [id, t] of tareas) {
        const ds = new Set(t.dependencias.filter((d) => d !== id && tareas.has(d)));
        pendientes.set(id, ds);
        for (const d of ds)
            dependientes.get(d).push(id);
    }
    // Las tareas de un repo son decenas o pocos cientos: una lista ordenada
    // en cada paso basta y se lee mejor que un monticulo.
    const listas = [...tareas.keys()].filter((id) => pendientes.get(id).size === 0);
    const orden = [];
    while (listas.length > 0) {
        listas.sort((a, b) => comparar(clave(a), clave(b)));
        const id = listas.shift();
        orden.push(id);
        for (const s of dependientes.get(id)) {
            const ps = pendientes.get(s);
            ps.delete(id);
            if (ps.size === 0)
                listas.push(s);
        }
    }
    const vistos = new Set(orden);
    const atascadas = [...tareas.keys()]
        .filter((id) => !vistos.has(id))
        .sort((a, b) => comparar(clave(a), clave(b)));
    return { orden, atascadas };
}
/** Ciclos entre las tareas atascadas, cada uno como camino cerrado. Deduplicados por sus miembros. */
function buscarCiclos(tareas, atascadas) {
    const dentro = new Set(atascadas);
    const color = new Map();
    const pila = [];
    const ciclos = [];
    const firmas = new Set();
    const visitar = (u) => {
        color.set(u, 1);
        pila.push(u);
        const ds = [...new Set(tareas.get(u).dependencias)].filter((d) => dentro.has(d)).sort();
        for (const v of ds) {
            const c = color.get(v);
            if (c === 1) {
                const ciclo = [...pila.slice(pila.indexOf(v)), v];
                const firma = [...new Set(ciclo)].sort().join(',');
                if (!firmas.has(firma)) {
                    firmas.add(firma);
                    ciclos.push(ciclo);
                }
            }
            else if (c === undefined) {
                visitar(v);
            }
        }
        color.set(u, 2);
        pila.pop();
    };
    for (const u of [...atascadas].sort())
        if (!color.has(u))
            visitar(u);
    return ciclos;
}
function celda(texto) {
    return texto.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}
/**
 * Genera el ROADMAP completo. `zonaManual` es la del fichero actual (que
 * se conserva tal cual) o null para usar la de por defecto. Nunca lanza
 * por los datos: un ciclo o una dependencia a una tarea inexistente se
 * informan y la generacion sigue.
 */
export function generarRoadmap(lista, zonaManual) {
    const manual = zonaManual === null ? ZONA_MANUAL_POR_DEFECTO : normalizarFinales(zonaManual);
    const titulos = titulosDeHitos(manual);
    const rango = new Map([...titulos.keys()].map((h, i) => [h, i]));
    const tareas = new Map();
    for (const t of [...lista].sort((a, b) => numeroDe(a.id) - numeroDe(b.id) || a.id.localeCompare(b.id))) {
        if (!tareas.has(t.id))
            tareas.set(t.id, t);
    }
    const avisos = [];
    for (const t of tareas.values()) {
        for (const d of t.dependencias) {
            if (!tareas.has(d))
                avisos.push(`${t.id} depende de ${d}, que no existe en tareas/.`);
        }
    }
    const { orden, atascadas } = ordenar(tareas, rango);
    const ciclos = buscarCiclos(tareas, atascadas);
    for (const c of ciclos)
        avisos.push(`dependencia circular: ${c.join(' -> ')}.`);
    if (ciclos.length === 0 && atascadas.length > 0) {
        // Imposible por construccion (lo que Kahn no saca depende de un ciclo),
        // pero si pasa se dice en vez de callarlo.
        avisos.push(`tareas que dependen de un ciclo: ${atascadas.join(', ')}.`);
    }
    const todas = [...orden, ...atascadas];
    const estado = (id) => tareas.get(id).estado;
    const espera = (id) => tareas.get(id).dependencias.filter((d) => tareas.has(d) && estado(d) !== 'terminada');
    const legible = (id) => {
        const fijo = ESTADOS_LEGIBLES[estado(id)];
        if (fijo !== undefined)
            return fijo;
        const e = espera(id);
        return e.length > 0 ? `espera a ${e.join(', ')}` : 'lista para empezar';
    };
    const enMarcha = todas.filter((id) => EN_MARCHA.includes(estado(id)));
    const listas = todas.filter((id) => estado(id) === 'planificada' && espera(id).length === 0);
    const lineas = [
        '# Roadmap de tareas',
        '',
        MARCA_TASKCTL,
        '',
        manual,
        '',
        '## Estado del trabajo',
        '',
        'Orden en que se hacen las tareas, agrupadas por hito (campo `sprint` de cada tarea). Sale de las ' +
            'dependencias: ninguna tarea va antes que aquellas de las que depende y, a igualdad, va primero la del ' +
            'hito anterior (en el orden de los `### Hn — título` de la zona manual) y luego la de número menor. ' +
            'taskctl lo regenera en cada transición que cae en la rama de integración; solo la zona manual se edita a mano.',
        '',
        '- **En marcha:** ' +
            (enMarcha.length === 0
                ? 'ninguna'
                : enMarcha.map((id) => `${id} (${(ESTADOS_LEGIBLES[estado(id)] ?? '').slice(2)})`).join(', ')),
        '- **Listas para empezar:** ' + (listas.length === 0 ? 'ninguna' : listas.join(', ')),
        '',
    ];
    const porHito = new Map();
    for (const id of todas) {
        const h = tareas.get(id).sprint;
        if (!porHito.has(h))
            porHito.set(h, []);
        porHito.get(h).push(id);
    }
    const hitos = [...porHito.keys()].sort((a, b) => (rango.get(a) ?? Number.MAX_SAFE_INTEGER) - (rango.get(b) ?? Number.MAX_SAFE_INTEGER) || a - b);
    // El paso es la posicion en el orden global (sin las terminadas), no en el
    // de las tablas: una tarea de un hito anterior que depende de otra de uno
    // posterior sale en su tabla, pero con el paso que le toca.
    const pasos = new Map();
    for (const id of todas)
        if (estado(id) !== 'terminada')
            pasos.set(id, pasos.size + 1);
    for (const h of hitos) {
        const ids = porHito.get(h);
        const hechas = ids.filter((id) => estado(id) === 'terminada').length;
        lineas.push(`## H${h} — ${titulos.get(h) ?? `H${h}`}`, '', `${hechas} de ${ids.length} terminadas.`, '', CABECERA_TABLA_HITO, '|---|---|---|---|---|---|');
        for (const id of ids) {
            const t = tareas.get(id);
            const n = pasos.has(id) ? String(pasos.get(id)) : '—';
            const deps = t.dependencias.length === 0 ? '—' : t.dependencias.join(', ');
            lineas.push(`| ${n} | ${id} | ${celda(t.titulo)} | ${t.complejidad ?? '—'} | ${deps} | ${legible(id)} |`);
        }
        lineas.push('');
    }
    if (ciclos.length > 0) {
        lineas.push('## Dependencias circulares', '', 'Estas tareas dependen unas de otras en círculo y ninguna puede empezar hasta que se rompa el ciclo ' +
            '(quita una de las dependencias del campo `dependencias`). Van al final de su hito.', '', ...ciclos.map((c) => `- ${c.join(' → ')}`), '');
    }
    return { texto: lineas.join('\n'), ciclos, avisos };
}
