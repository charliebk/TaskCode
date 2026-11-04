/**
 * Las siete sondas de configuracion de `taskctl doctor-deploy` (TASK-068, puntos
 * 37 a 43): reglas de Firebase, RLS en migraciones de Supabase, tokens en
 * ficheros de gestores de paquetes, contrasenas en docker-compose,
 * `pull_request_target`, acciones de CI sin SHA y Dockerfile sin USER.
 *
 * Todas tienen la misma forma (`sondaPorFicheros`): eligen ficheros por nombre
 * entre los VERSIONADOS (lo que se publica), los leen, pasan el conjunto a un
 * detector puro de `core/doctor-deploy-reglas.ts`, aplican los silencios y
 * deciden el estado:
 * - Ningun fichero que revisar: NO APLICA con el motivo (decision de la
 *   persona en TASK-068; las seis sondas anteriores conservan su convencion).
 * - Un fichero ilegible, binario o mayor que `maxBytesFichero`: NO VERIFICADO,
 *   nunca un salto en silencio hacia OK.
 * - Un hallazgo sin silenciar: FALLA. El valor de un secreto nunca va en la
 *   evidencia ni en el motivo: solo la muestra enmascarada.
 *
 * Las sondas son declaraciones de funcion a proposito: sondas-deploy.ts las
 * registra y este modulo importa sus utilidades (ciclo de modulos), y asi
 * estan inicializadas sea cual sea el modulo que se cargue primero.
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { detectarAccionesSinSha, detectarContrasenasCompose, detectarDockerfile, detectarFirebaseAbierto, detectarPullRequestTarget, detectarTablasSinRls, detectarTokensGestor, } from '../core/doctor-deploy-reglas.js';
import { buscarSilencio, decodificar, evidenciaSilenciada } from './sondas-deploy.js';
const MAX_HALLAZGOS = 200;
const MAX_RUTAS_ALCANCE = 10;
const nombreBase = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1);
/**
 * Construye una sonda: `filtro` elige los ficheros versionados que se miran, `detector`
 * los analiza todos juntos y `textos` pone las frases del resultado.
 */
export function sondaPorFicheros(filtro, detector, textos) {
    return (ctx) => {
        const candidatos = ctx.versionados.filter(filtro);
        if (candidatos.length === 0) {
            return {
                estado: 'no-aplica',
                motivo: `${textos.ninguno}: no hay nada que revisar`,
                evidencias: [{ descripcion: `git ls-files: ninguno de ${textos.queBusca} (sin contar node_modules, vendor, target, dist ni build)` }],
            };
        }
        const max = ctx.opciones.maxBytesFichero;
        const tope = max >= 1024 ? `${Math.round(max / 1024)} KiB` : `${max} bytes`;
        const leidos = [];
        const sinLeer = [];
        for (const rel of candidatos) {
            const abs = path.join(ctx.cwd, rel);
            try {
                const st = statSync(abs);
                if (!st.isFile()) {
                    sinLeer.push(`${rel} (no es un fichero normal)`);
                    continue;
                }
                if (st.size > max) {
                    sinLeer.push(`${rel} (mayor de ${tope})`);
                    continue;
                }
                const contenido = decodificar(readFileSync(abs));
                if (contenido === null) {
                    sinLeer.push(`${rel} (binario)`);
                    continue;
                }
                leidos.push({ ruta: rel, contenido });
            }
            catch (e) {
                sinLeer.push(`${rel} (no se pudo leer: ${e.code ?? 'error'})`);
            }
        }
        const fallos = [];
        const silenciadas = [];
        const cubiertas = [];
        let cortado = false;
        for (const h of leidos.length > 0 ? detector(leidos) : []) {
            const donde = { fichero: h.fichero };
            if (h.linea !== undefined)
                donde.linea = h.linea;
            if (h.muestra !== undefined)
                donde.muestra = h.muestra;
            if (h.cubiertoPor !== undefined) {
                cubiertas.push({ descripcion: `${h.descripcion}: ya lo cuenta ${h.cubiertoPor}, no se repite aqui`, ...donde });
                continue;
            }
            const s = buscarSilencio(ctx, h.patron, h.fichero, h.huella === null ? {} : { huella: h.huella });
            if (s !== null) {
                silenciadas.push(evidenciaSilenciada(s, h.patron, h.fichero, h.linea, undefined));
            }
            else if (fallos.length < MAX_HALLAZGOS) {
                fallos.push({ descripcion: `${h.descripcion} (patron ${h.patron}${h.huella === null ? '' : `, huella ${h.huella}`})`, ...donde });
            }
            else {
                cortado = true;
            }
        }
        const listadas = leidos.slice(0, MAX_RUTAS_ALCANCE).map((f) => f.ruta);
        const alcance = {
            descripcion: `${leidos.length} de ${candidatos.length} fichero(s) revisado(s) de ${textos.queBusca} (${listadas.join(', ')}` +
                `${leidos.length > listadas.length ? `, y ${leidos.length - listadas.length} mas` : ''}): ` +
                `${textos.comprobacion}; ${silenciadas.length} hallazgos silenciados`,
        };
        const textoSinLeer = `${sinLeer.length} fichero(s) sin leer (${sinLeer.join('; ')})`;
        if (fallos.length > 0) {
            return {
                estado: 'falla',
                motivo: `${textos.motivoFalla(fallos.length)}${cortado ? ' (y mas)' : ''}${sinLeer.length > 0 ? `; ademas ${textoSinLeer}` : ''}`,
                evidencias: [...fallos, ...silenciadas, ...cubiertas, alcance],
            };
        }
        if (sinLeer.length > 0) {
            return {
                estado: 'no-verificado',
                motivo: `${textoSinLeer}: no se puede afirmar que esten bien. Revisalos a mano`,
                evidencias: leidos.length > 0 ? [...silenciadas, ...cubiertas, alcance] : [...silenciadas, ...cubiertas],
            };
        }
        return {
            estado: 'ok',
            motivo: textos.motivoOk +
                (cubiertas.length > 0 ? ` (${cubiertas.length} valor(es) que ya da como FALLA secretos-en-arbol no se cuentan dos veces)` : ''),
            evidencias: [alcance, ...silenciadas, ...cubiertas],
        };
    };
}
// ---------------------------------------------------------------------
// Filtros por nombre
// ---------------------------------------------------------------------
export const esReglaFirebase = (ruta) => {
    const b = nombreBase(ruta);
    return /^(?:firestore|storage)(?:[.-][\w.-]+)?\.rules$/i.test(b) || /^database(?:[.-][\w.-]+)?\.rules\.json$/i.test(b);
};
export const esMigracionSupabase = (ruta) => /(?:^|\/)supabase\/migrations\/.+\.sql$/i.test(ruta);
export const esFicheroDeGestor = (ruta) => ['.npmrc', '.pypirc', 'settings.xml'].includes(nombreBase(ruta));
export const esCompose = (ruta) => /^(?:docker-)?compose(?:[.-][\w.-]+)?\.ya?ml$/i.test(nombreBase(ruta));
export const esFlujoGithub = (ruta) => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(ruta);
export const esFlujoOAccion = (ruta) => esFlujoGithub(ruta) || /^action\.ya?ml$/i.test(nombreBase(ruta));
export const esDockerfile = (ruta) => {
    const b = nombreBase(ruta);
    if (/\.dockerignore$/i.test(b))
        return false;
    return /^(?:Dockerfile|Containerfile)(?:\.[\w.-]+)?$/i.test(b) || /\.(?:dockerfile|containerfile)$/i.test(b);
};
// ---------------------------------------------------------------------
// Las siete sondas
// ---------------------------------------------------------------------
export function sondaReglasFirebase(ctx) {
    return sondaPorFicheros(esReglaFirebase, detectarFirebaseAbierto, {
        queBusca: 'reglas de Firebase (firestore.rules, storage.rules, database.rules.json)',
        ninguno: 'no hay ningun fichero de reglas de Firebase versionado',
        comprobacion: 'ningun allow sin condicion, con if true o en modo de prueba por fecha, ni ".read"/".write": true',
        motivoFalla: (n) => `${n} regla(s) de Firebase abierta(s) a cualquiera`,
        motivoOk: 'ninguna regla de Firebase abierta a cualquiera',
    })(ctx);
}
export function sondaMigracionesRls(ctx) {
    return sondaPorFicheros(esMigracionSupabase, detectarTablasSinRls, {
        queBusca: 'migraciones SQL de Supabase (supabase/migrations/*.sql)',
        ninguno: 'no hay ninguna migracion SQL de Supabase versionada',
        comprobacion: 'cada create table tiene enable row level security en alguna migracion del conjunto (esquemas internos o privados aparte)',
        motivoFalla: (n) => `${n} tabla(s) creada(s) en las migraciones sin activar RLS`,
        motivoOk: 'todas las tablas creadas en las migraciones activan RLS',
    })(ctx);
}
export function sondaTokensGestor(ctx) {
    return sondaPorFicheros(esFicheroDeGestor, detectarTokensGestor, {
        queBusca: 'ficheros de gestores de paquetes (.npmrc, .pypirc, settings.xml)',
        ninguno: 'no hay ningun .npmrc, .pypirc ni settings.xml versionado',
        comprobacion: 'ningun _authToken, _auth, _password, password ni <password> literal (${VAR}, ${env.X} y {cifrada} no cuentan)',
        motivoFalla: (n) => `${n} credencial(es) literal(es) en ficheros de gestores de paquetes`,
        motivoOk: 'ninguna credencial literal en los ficheros de gestores de paquetes',
    })(ctx);
}
export function sondaComposeContrasenas(ctx) {
    return sondaPorFicheros(esCompose, detectarContrasenasCompose, {
        queBusca: 'docker-compose (docker-compose*.yml, compose*.yaml)',
        ninguno: 'no hay ningun docker-compose versionado',
        comprobacion: 'ninguna variable *PASSWORD, *SECRET, *TOKEN o *KEY con valor literal (${X}, $X y *_FILE no cuentan)',
        motivoFalla: (n) => `${n} contrasena(s) o token(s) literal(es) en docker-compose`,
        motivoOk: 'ninguna contrasena ni token literal en los docker-compose',
    })(ctx);
}
export function sondaPullRequestTarget(ctx) {
    return sondaPorFicheros(esFlujoGithub, detectarPullRequestTarget, {
        queBusca: 'flujos de GitHub Actions (.github/workflows/*.yml)',
        ninguno: 'no hay ningun flujo de GitHub Actions versionado',
        comprobacion: 'ningun flujo con pull_request_target trae el codigo del PR (ref: head.sha/head.ref/refs/pull, gh pr checkout)',
        motivoFalla: (n) => `${n} paso(s) con pull_request_target que traen el codigo del PR`,
        motivoOk: 'ningun flujo con pull_request_target trae el codigo del PR',
    })(ctx);
}
export function sondaAccionesSinSha(ctx) {
    return sondaPorFicheros(esFlujoOAccion, detectarAccionesSinSha, {
        queBusca: 'flujos y acciones de GitHub Actions (.github/workflows/*.yml, action.yml)',
        ninguno: 'no hay ningun flujo ni accion de GitHub Actions versionado',
        comprobacion: 'cada uses: de terceros fijado a un SHA de 40 caracteres (las de actions/ y github/, las locales ./ y docker:// no cuentan)',
        motivoFalla: (n) => `${n} accion(es) de terceros sin fijar a un SHA`,
        motivoOk: 'todas las acciones de terceros estan fijadas a un SHA',
    })(ctx);
}
export function sondaDockerfileUser(ctx) {
    return sondaPorFicheros(esDockerfile, detectarDockerfile, {
        queBusca: 'Dockerfile',
        ninguno: 'no hay ningun Dockerfile versionado',
        comprobacion: 'la etapa final declara un USER distinto de root (o hereda uno, o usa una imagen nonroot) y ningun ADD de URL sin --checksum',
        motivoFalla: (n) => `${n} problema(s) en Dockerfile: etapa final como root o ADD de una URL`,
        motivoOk: 'la etapa final de cada Dockerfile corre sin root y ningun ADD descarga URLs',
    })(ctx);
}
