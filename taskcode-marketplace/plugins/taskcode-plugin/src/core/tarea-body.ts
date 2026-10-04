/**
 * Lectura de las dos secciones del cuerpo de `tarea.md` que alguien
 * mas que un humano necesita leer: el Objetivo y los criterios de
 * aceptacion.
 *
 * Vive aparte de frontmatter.ts a proposito: aquel parsea el bloque
 * `---` de metadatos y no mira el cuerpo; este solo mira el cuerpo y no
 * sabe nada de metadatos. Su primer consumidor es la heuristica de
 * complejidad (src/core/heuristica.ts), que necesita el texto de esas
 * dos secciones para buscar palabras de alto riesgo y contar cuantos
 * criterios declara la tarea.
 *
 * Tres decisiones que el formato real del repo obliga a tomar:
 *
 * 1. LA CABECERA DE CRITERIOS APARECE CON Y SIN TILDE. En las tareas
 *    ya escritas conviven "## Criterios de aceptación" (las que
 *    escribio una persona) y "## Criterios de aceptacion" (las que
 *    genera `taskctl new`/`import`, que no ponen tildes). Las dos son
 *    validas: el titulo se compara ya normalizado (sin diacriticos y
 *    en minusculas), asi que tambien casa "## CRITERIOS DE ACEPTACIÓN".
 *    Elegir solo una forma dejaria fuera la mitad del repo.
 * 2. UNA SECCION TERMINA DONDE EMPIEZA LA SIGUIENTE CABECERA `##`.
 *    Desde TASK-046 solo el nivel 2 cambia de seccion; los subtitulos de
 *    nivel 3 a 6 quedan dentro (ver extraerSecciones). Un `#` de nivel 1 NO
 *    corta, porque una linea que empieza por "# " dentro de un bloque
 *    de codigo (un comentario de shell, que este repo escribe a
 *    menudo) truncaria el Objetivo por accidente.
 * 3. SI LA MISMA CABECERA SALE DOS VECES, MANDA LA PRIMERA. Es lo
 *    unico que se puede decidir sin inventar: concatenar dos secciones
 *    "Objetivo" mezclaria textos que su autor escribio separados.
 *
 * Nunca lanza. Un cuerpo sin ninguna de las dos secciones devuelve
 * objetivo vacio y cero criterios, que es exactamente lo que dice el
 * fichero. Que eso sea un error o no lo decide quien llama: aqui no
 * hay contexto para saberlo (una tarea recien creada con `taskctl new`
 * tiene el Objetivo en blanco a proposito).
 */

export interface SeccionesTarea {
  /** Texto bajo "## Objetivo", sin la cabecera, trim(). '' si no hay. */
  objetivo: string;
  /**
   * Una entrada por linea de checklist bajo "## Criterios de aceptacion",
   * incluidas las de sus subsecciones `###`, MENOS las de `### Tras el
   * cierre`.
   */
  criterios: string[];
  /**
   * TASK-046: las casillas de `### Tras el cierre` (criterios que solo se
   * verifican despues de `finish`). No cuentan para cerrar la tarea.
   */
  criteriosTrasCierre: string[];
  /**
   * TASK-044: los mismos `criterios`, agrupados como los escribio la
   * persona. Abre grupo un subtitulo `###` (salvo `Tras el cierre`) o una
   * linea sin sangrar que sea solo negrita (`**C4 — config**`, el caso de
   * TASK-030). Los criterios anteriores al primer grupo van en uno con
   * `titulo: null`. Los grupos sin criterios no aparecen.
   */
  grupos: GrupoCriterios[];
}

export interface GrupoCriterios {
  titulo: string | null;
  criterios: string[];
}

/** Linea sin sangrar hecha solo de negrita: cabecera de grupo (TASK-044). */
const RE_GRUPO_NEGRITA = /^\*\*([^*]+)\*\*:?\s*$/;

/** Cabecera ATX de nivel 2 a 6 (ver decision 2 de la cabecera). */
const RE_CABECERA = /^ {0,3}#{2,6}(?:\s|$)/;

/** Subtitulo de nivel 3 a 6: no cambia de seccion (TASK-046). */
const RE_SUBTITULO = /^ {0,3}#{3,6}(?:\s|$)/;

const TITULO_TRAS_CIERRE = 'tras el cierre';

/** Linea de checklist: "- [ ] texto", "- [x] texto", "* [X] texto". */
const RE_CRITERIO = /^\s*[-*]\s+\[[ xX]\]\s*(.*)$/;

/** Continuacion indentada de la linea de checklist anterior. */
const RE_CONTINUACION = /^\s+\S/;

const TITULO_OBJETIVO = 'objetivo';
const TITULO_CRITERIOS = 'criterios de aceptacion';

/**
 * Quita diacriticos y pasa a minusculas. Se descompone en NFD y se
 * borran las marcas combinantes (U+0300..U+036F) en vez de mantener
 * una tabla de reemplazos a mano: la tabla se queda corta el dia que
 * aparece una letra que nadie previo.
 *
 * Se exporta porque la heuristica de complejidad compara sus palabras
 * de alto riesgo contra este mismo texto: si cada modulo normalizara a
 * su manera, "migracion" casaria en un sitio y no en el otro.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** El titulo de una cabecera tal como se escribio (para mostrarlo). */
function textoDeCabecera(linea: string): string {
  return linea.trim().replace(/^#+\s*/, '').replace(/\s*#+$/, '').trim();
}

/** El titulo de una cabecera ATX, sin almohadillas ni diacriticos. */
function tituloDeCabecera(linea: string): string {
  return normalizarTexto(
    linea
      .trim()
      .replace(/^#+\s*/, '')
      .replace(/\s*#+$/, '')
  ).trim();
}

/**
 * Parte el cuerpo de una tarea en sus dos secciones interesantes.
 *
 * Sobre los criterios: se devuelve UNA entrada por linea de checklist,
 * incluidas las vacias ("- [ ] " a secas, que es lo que deja
 * `taskctl new` en una tarea recien creada). Una linea INDENTADA que
 * no sea a su vez un checklist se pega al criterio anterior: en las
 * tareas reales del repo los criterios largos se parten en varias
 * lineas alineadas bajo el texto, y perderlas dejaria fuera parte del
 * enunciado. Lo que no se pega es un parrafo sin indentar: eso ya es
 * prosa suelta detras de la lista, no la continuacion de nada.
 */
export function extraerSecciones(body: string): SeccionesTarea {
  const lineas = body.split(/\r?\n/);
  const objetivo: string[] = [];
  const normales: string[] = [];
  const trasCierre: string[] = [];
  // A que lista van ahora los criterios: los de `### Tras el cierre` van
  // aparte (TASK-046).
  let destino = normales;

  let seccion: 'objetivo' | 'criterios' | 'otra' = 'otra';
  let objetivoVisto = false;
  let criteriosVisto = false;
  // Una linea sangrada solo continua un criterio si va pegada a el.
  let continuable = false;
  // TASK-044: a que grupo pertenece cada criterio normal (indice paralelo
  // a `normales`), y el titulo de cada grupo. El 0 es el de los sueltos.
  const titulosGrupo: (string | null)[] = [null];
  const grupoDe: number[] = [];

  for (const linea of lineas) {
    // TASK-046 (D2 de la auditoria): un subtitulo de nivel 3 o mas dentro
    // del Objetivo o de los Criterios NO cambia de seccion. Antes cualquier
    // `###` la cortaba: criterios agrupados en `### Parser` / `### CLI`
    // daban `criterios: []`, y `### Tras el cierre` quedaba fuera solo por
    // casualidad.
    const tituloSub = RE_SUBTITULO.test(linea) ? tituloDeCabecera(linea) : null;
    // MEN-1 de su revision: un `### Criterios de aceptacion` (o `### Objetivo`)
    // sigue abriendo su seccion como antes; los demas subtitulos no cortan.
    const subtituloDeSeccion =
      tituloSub !== null &&
      ((tituloSub === TITULO_CRITERIOS && !criteriosVisto) || (tituloSub === TITULO_OBJETIVO && !objetivoVisto));
    if (tituloSub !== null && seccion !== 'otra' && !subtituloDeSeccion) {
      if (seccion === 'objetivo') {
        objetivo.push(linea);
      } else {
        destino = tituloSub === TITULO_TRAS_CIERRE ? trasCierre : normales;
        if (destino === normales) titulosGrupo.push(textoDeCabecera(linea));
        // MEN-3: una linea sangrada justo debajo de un subtitulo no es la
        // continuacion del ultimo criterio de la subseccion anterior.
        continuable = false;
      }
      continue;
    }
    if (RE_CABECERA.test(linea)) {
      destino = normales;
      continuable = false;
      const titulo = tituloDeCabecera(linea);
      if (titulo === TITULO_OBJETIVO && !objetivoVisto) {
        seccion = 'objetivo';
        objetivoVisto = true;
      } else if (titulo === TITULO_CRITERIOS && !criteriosVisto) {
        seccion = 'criterios';
        criteriosVisto = true;
      } else {
        seccion = 'otra';
      }
      continue;
    }

    if (seccion === 'objetivo') {
      objetivo.push(linea);
      continue;
    }

    if (seccion === 'criterios') {
      const criterio = RE_CRITERIO.exec(linea);
      if (criterio !== null) {
        destino.push((criterio[1] ?? '').trim());
        if (destino === normales) grupoDe.push(titulosGrupo.length - 1);
        continuable = true;
        continue;
      }
      const negrita = destino === normales ? RE_GRUPO_NEGRITA.exec(linea) : null;
      if (negrita !== null) {
        const tituloNegrita = (negrita[1] ?? '').trim();
        // MEN-3 de la revision de TASK-044: `**Tras el cierre**` en negrita
        // es lo mismo que el subtitulo, no un frente.
        if (normalizarTexto(tituloNegrita).replace(/:$/, '').trim() === TITULO_TRAS_CIERRE) {
          destino = trasCierre;
        } else {
          titulosGrupo.push(tituloNegrita);
        }
        continuable = false;
        continue;
      }
      if (continuable && destino.length > 0 && RE_CONTINUACION.test(linea)) {
        const ultimo = destino[destino.length - 1] ?? '';
        destino[destino.length - 1] = `${ultimo} ${linea.trim()}`.trim();
        continue;
      }
      if (linea.trim() !== '') continuable = false;
    }
  }

  const grupos: GrupoCriterios[] = titulosGrupo
    .map((titulo, i) => ({ titulo, criterios: normales.filter((_, k) => grupoDe[k] === i) }))
    .filter((g) => g.criterios.length > 0);
  return {
    objetivo: objetivo.join('\n').trim(),
    criterios: normales,
    criteriosTrasCierre: trasCierre,
    grupos,
  };
}
