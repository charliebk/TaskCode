/**
 * Comprueba si un skill "externo" del catalogo (catalogo-skills.ts) ya
 * esta instalado en esta maquina, para el paso 4 de la seccion 6.6:
 * anotar "/plugin install X@Y" solo cuando de verdad haga falta.
 *
 * Vive aparte de catalogo-skills.ts y de commands/plan.ts porque es la
 * unica pieza de la seleccion de skill que sale a un subproceso, y
 * aislarla evita que un fallo de "claude plugin list" se confunda con
 * un fallo de parseo del catalogo.
 *
 * Mismo patron de subproceso que runGit() en fs/git.ts (spawnSync +
 * comprobar result.error / result.status), pero con una semantica de
 * error DISTINTA a proposito: runGit() LANZA porque un fallo de Git
 * debe abortar el comando que lo pidio. Aqui un fallo del subproceso
 * (binario ausente, timeout, JSON mal formado, forma inesperada) NUNCA
 * aborta "taskctl plan" — se colapsa en 'no-verificable', que es un
 * estado de negocio valido, no una excepcion. Riesgo aceptado en
 * plan-final.md: mejor no confirmar nada que arriesgar una instalacion
 * automatica ('no-instalado' erroneo dispararia la sugerencia de
 * instalar algo que ya esta) o esconder un candidato real que falta
 * ('instalado' erroneo por defecto).
 *
 * El formato exacto de "claude plugin list --json" quedo sin verificar
 * a mano en la seccion 6.6 de la metodologia ("a confirmar en Sprint
 * 0"): se asume un array de objetos con un campo `marketplace`, y
 * cualquier forma que no encaje con eso tambien cae en
 * 'no-verificable' en vez de asumirse como 'no-instalado'.
 */
import { spawnSync } from 'node:child_process';

export type EstadoInstalacionSkill = 'instalado' | 'no-instalado' | 'no-verificable';

const TIMEOUT_MS = 5000;

interface ResultadoPluginList {
  error?: Error | undefined;
  status: number | null;
  stdout: string | null;
}

/**
 * Separada de comprobarSkillInstalado para poder probar cada desenlace
 * (binario ausente, timeout, status != 0, JSON mal formado, forma
 * inesperada, encontrado/no encontrado) con datos literales, sin lanzar
 * un subproceso real — mismo motivo por el que parsearCatalogoSkills
 * vive aparte de cargarCatalogoSkills en catalogo-skills.ts.
 */
export function interpretarResultadoPluginList(
  result: ResultadoPluginList,
  marketplace: string
): EstadoInstalacionSkill {
  if (result.error || result.status !== 0 || typeof result.stdout !== 'string') {
    return 'no-verificable';
  }

  let lista: unknown;
  try {
    lista = JSON.parse(result.stdout);
  } catch {
    return 'no-verificable';
  }
  if (!Array.isArray(lista)) {
    return 'no-verificable';
  }

  const instalado = lista.some(
    (entrada) =>
      typeof entrada === 'object' &&
      entrada !== null &&
      (entrada as { marketplace?: unknown }).marketplace === marketplace
  );
  return instalado ? 'instalado' : 'no-instalado';
}

export function comprobarSkillInstalado(marketplace: string): EstadoInstalacionSkill {
  const result = spawnSync('claude', ['plugin', 'list', '--json'], {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
  });
  return interpretarResultadoPluginList(
    {
      error: result.error,
      status: result.status,
      stdout: typeof result.stdout === 'string' ? result.stdout : null,
    },
    marketplace
  );
}
