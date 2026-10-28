/**
 * Aviso de `taskctl finish` de una tarea `release` (TASK-067): avisa, sin
 * bloquear, si no hay un informe de doctor-deploy que describa lo que se
 * publica, o si ese informe trae alguna FALLA de severidad critica. Modulo
 * puro: las consultas a Git se inyectan, y nunca se ejecutan las sondas
 * (finish solo LEE informes que alguien dejo en docs/doctor-deploy/).
 *
 * Que informe vale: el criterio original pedia el del commit que se cierra,
 * pero el informe se commitea DESPUES de generarse, asi que su commit nunca es
 * la punta. Vale el informe cuyo commit es la punta, o un ancestro con solo
 * `docs/doctor-deploy/` o `tareas/` cambiados entre ambos (decision de la persona;
 * `tareas/` desde la ronda 2 de revision: review, veredictos y costes commitean ahi
 * despues del informe sin tocar el codigo). Si hay varios validos, el mas reciente.
 *
 * Es un aviso, no un control de seguridad: un informe editado a mano lo
 * engana, y no se pretende evitarlo.
 */
/** Carpeta de los informes de `--escribir`, con `/` de Git. */
export const CARPETA_INFORMES_REL = 'docs/doctor-deploy';

/** Carpetas cuyos cambios no invalidan un informe: el propio informe y el registro de tareas. */
export const CARPETAS_SIN_CODIGO: readonly string[] = [CARPETA_INFORMES_REL, 'tareas'];

/** true si la ruta (con `/` de Git) esta dentro de una carpeta que no es codigo publicado. */
export function esRutaSinCodigo(ruta: string): boolean {
  return CARPETAS_SIN_CODIGO.some((c) => ruta.startsWith(`${c}/`));
}

export interface PuntoInformeLeido {
  id: string;
  estado: string;
  severidad: string;
}

/** Lo que `finish` necesita de un informe `<fecha>.json`. */
export interface InformeLeido {
  /** Nombre del fichero (`2026-10-27.json`). */
  archivo: string;
  fecha: string;
  commit: string | null;
  puntos: PuntoInformeLeido[];
}

/** Consultas a Git que el aviso necesita (inyectadas: este modulo no toca nada). */
export interface ConsultasGit {
  /** true si `ancestro` es antepasado de `descendiente` (false tambien si no se puede saber). */
  esAncestro: (ancestro: string, descendiente: string) => boolean;
  /** Rutas cambiadas entre los dos commits, o null si no se pudo saber. */
  rutasCambiadas: (desde: string, hasta: string) => string[] | null;
}

export interface EntradaAvisoRelease {
  idTarea: string;
  /** Commit que se cierra (HEAD de la rama de la release), o null si no se pudo leer. */
  punta: string | null;
  informes: readonly InformeLeido[];
  /** Ficheros `.json` de la carpeta que no se pudieron leer como informe. */
  ilegibles: readonly string[];
  /** Ficheros `.md` de la carpeta (informes de antes del JSON). */
  soloMarkdown: number;
  git: ConsultasGit;
}

const CIERRA = 'La tarea se cierra igualmente.';

function cuantos(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Avisos (0 o mas) para el cierre de una release. Vacio si hay un informe valido sin FALLA critica. */
export function avisosRelease(e: EntradaAvisoRelease): string[] {
  const hacer =
    'Ejecuta "taskctl doctor-deploy --escribir" (o la skill doctor-deploy), commitea el informe de ' +
    `${CARPETA_INFORMES_REL}/ y vuelve a cerrar.`;
  if (e.punta === null) {
    return [`${e.idTarea}: no se pudo leer el commit que se cierra, asi que no se comprobo si hay un informe de doctor-deploy al dia. ${CIERRA}`];
  }
  const punta = e.punta;

  const validos: Array<{ informe: InformeLeido; motivoDescartado: string | null }> = [];
  for (const informe of e.informes) {
    if (informe.commit === null) {
      validos.push({ informe, motivoDescartado: 'se hizo en un repositorio sin commits' });
    } else if (informe.commit === punta) {
      validos.push({ informe, motivoDescartado: null });
    } else if (!e.git.esAncestro(informe.commit, punta)) {
      validos.push({ informe, motivoDescartado: `es del commit ${informe.commit.slice(0, 12)}, que no esta en la historia de la release` });
    } else {
      const cambiadas = e.git.rutasCambiadas(informe.commit, punta);
      if (cambiadas === null) {
        validos.push({ informe, motivoDescartado: 'no se pudo comparar su commit con el que se cierra' });
      } else {
        const codigo = cambiadas.filter((r) => !esRutaSinCodigo(r));
        validos.push(
          codigo.length === 0
            ? { informe, motivoDescartado: null }
            : {
                informe,
                motivoDescartado: `es del commit ${informe.commit.slice(0, 12)} y desde entonces ha cambiado ${cuantos(codigo.length, 'fichero', 'ficheros')} fuera de ${CARPETAS_SIN_CODIGO.map((c) => `${c}/`).join(' y ')}`,
              }
        );
      }
    }
  }

  const buenos = validos.filter((v) => v.motivoDescartado === null).map((v) => v.informe);
  if (buenos.length === 0) {
    const masNuevo = [...e.informes].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const detalle =
      masNuevo === undefined
        ? e.soloMarkdown > 0
          ? `solo hay informes en Markdown (${cuantos(e.soloMarkdown, 'fichero', 'ficheros')}): el aviso lee los .json que deja --escribir`
          : `no hay ningun informe en ${CARPETA_INFORMES_REL}/`
        : `el mas reciente (${masNuevo.archivo}) ${validos.find((v) => v.informe === masNuevo)?.motivoDescartado ?? 'no vale'}`;
    const ilegibles = e.ilegibles.length > 0 ? ` (ademas, ${cuantos(e.ilegibles.length, 'fichero .json no se pudo leer', 'ficheros .json no se pudieron leer')}: ${e.ilegibles.join(', ')})` : '';
    return [`${e.idTarea}: no hay un informe de doctor-deploy al dia para este commit: ${detalle}${ilegibles}. ${hacer} ${CIERRA}`];
  }

  const informe = [...buenos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0] as InformeLeido;
  const criticas = informe.puntos.filter((p) => p.estado === 'falla' && p.severidad === 'critica').map((p) => p.id);
  if (criticas.length > 0) {
    return [
      `${e.idTarea}: el informe de doctor-deploy ${informe.archivo} tiene ${cuantos(criticas.length, 'FALLA critica', 'FALLAS criticas')}: ` +
        `${criticas.join(', ')}. Arreglalas (o documenta por que se publica asi) antes de publicar. ${CIERRA}`,
    ];
  }
  return [];
}
