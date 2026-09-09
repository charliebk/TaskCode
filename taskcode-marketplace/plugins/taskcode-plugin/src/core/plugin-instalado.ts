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
 * Formato real de "claude plugin list --json" (verificado en revision
 * por pares de TASK-017 contra el binario real): un array de objetos
 * con `id` de la forma "plugin@marketplace" (entre otras claves como
 * `version`, `scope`, `enabled`). No hay campo `marketplace` suelto.
 * Un elemento del array que no sea un objeto con `id` de tipo string
 * no es reconocible; si NINGUN elemento de un array no vacio es
 * reconocible, el formato no encaja con lo esperado y el resultado
 * colapsa a 'no-verificable' en vez de asumirse 'no-instalado'.
 *
 * IMPORTANTE (hallazgo IMP-5, revision por pares ronda 2): la
 * comprobacion es por `id` COMPLETO ("plugin@marketplace"), nunca solo
 * por el tramo del marketplace. Comparar solo el marketplace confunde
 * "hay algun plugin instalado de este marketplace" con "esta instalado
 * ESTE plugin", y reporta como 'instalado' un plugin que no existe si
 * cualquier otro del mismo marketplace si esta instalado -- justo el
 * "candidato real que falta" escondido que este modulo existe para
 * evitar.
 *
 * Decision aceptada (hallazgo MENOR, revision por pares ronda 2): un
 * elemento con `id` coincidente pero `enabled: false` en el JSON real
 * cuenta como 'instalado', igual que uno habilitado -- el campo
 * `enabled` no se mira. `EstadoInstalacionSkill` solo distingue si el
 * plugin YA esta descargado y registrado en la maquina (que es lo que
 * hace innecesario el "/plugin install" que sugiere plan.ts), no si
 * esta activo ahora mismo; habilitarlo no requiere reinstalar. Anadir
 * un cuarto estado para "instalado pero deshabilitado" exigiria ademas
 * un aviso distinto en plan.ts ("/plugin enable" en vez de
 * "/plugin install") que nadie ha pedido todavia.
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
 *
 * `pluginId` es el identificador COMPLETO esperado, con la forma
 * "plugin@marketplace" (ver hallazgo IMP-5 en el docblock del fichero).
 */
export function interpretarResultadoPluginList(
  result: ResultadoPluginList,
  pluginId: string
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
  if (lista.length === 0) {
    return 'no-instalado';
  }

  const reconocibles = lista.filter(
    (entrada): entrada is { id: string } =>
      typeof entrada === 'object' && entrada !== null && typeof (entrada as { id?: unknown }).id === 'string'
  );
  if (reconocibles.length === 0) {
    return 'no-verificable';
  }

  const instalado = reconocibles.some((entrada) => entrada.id === pluginId);
  return instalado ? 'instalado' : 'no-instalado';
}

export function comprobarSkillInstalado(pluginId: string): EstadoInstalacionSkill {
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
    pluginId
  );
}
