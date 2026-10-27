/**
 * Interpretacion de la salida de las herramientas de auditoria de dependencias
 * que `taskctl doctor-deploy` usa si estan instaladas (TASK-066). Funciones
 * puras: reciben lo que la herramienta imprimio y devuelven un veredicto. El
 * lanzamiento del proceso esta en fs/herramientas-deploy.ts.
 *
 * Politica (decision de la persona, D4):
 * - Solo dependencias de runtime, donde la herramienta lo permite.
 * - FALLA desde severidad alta o critica; el resto se lista sin fallar.
 * - Una herramienta que no publica severidad (cargo audit, pip-audit,
 *   govulncheck) no da base para decir «es baja»: se trata como alta.
 * - Cualquier salida que no se entienda es NO VERIFICADO, nunca OK.
 *
 * AVISO: estos interpretes se escribieron contra el formato documentado de cada
 * herramienta y se prueban con muestras de ese formato, no contra la
 * herramienta real (que necesita red). Si una version nueva cambia el formato,
 * el resultado es `no-verificado`, no un OK falso.
 */

export interface VeredictoAuditoria {
  estado: 'ok' | 'falla' | 'no-verificado';
  /** Una frase con los numeros o el motivo. */
  resumen: string;
  /** Paquetes con vulnerabilidad alta o critica (o sin severidad publicada). */
  graves: string[];
  /** El resto, listado sin fallar. */
  otras: string[];
}

const MAX_NOMBRES = 15;

function recortar(t: string, max = 160): string {
  const u = t.replace(/\s+/g, ' ').trim();
  return u.length > max ? `${u.slice(0, max)}...` : u;
}

function ilegible(herramienta: string, detalle: string): VeredictoAuditoria {
  return {
    estado: 'no-verificado',
    resumen: `la salida de ${herramienta} no se pudo interpretar (${detalle})`,
    graves: [],
    otras: [],
  };
}

function limpio(resumen: string): VeredictoAuditoria {
  return { estado: 'ok', resumen, graves: [], otras: [] };
}

function conVulnerabilidades(resumen: string, graves: string[], otras: string[]): VeredictoAuditoria {
  const unicos = (xs: string[]): string[] => [...new Set(xs)].slice(0, MAX_NOMBRES);
  return { estado: graves.length > 0 ? 'falla' : 'ok', resumen, graves: unicos(graves), otras: unicos(otras) };
}

function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function num(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null;
}

/** `npm audit --json` y `pnpm audit --json` (mismo formato de metadata). */
export function interpretarNpmAudit(herramienta: 'npm' | 'pnpm', stdout: string, status: number | null): VeredictoAuditoria {
  let o: unknown;
  try {
    o = JSON.parse(stdout);
  } catch {
    return ilegible(herramienta, 'no es JSON');
  }
  if (!esObjeto(o)) return ilegible(herramienta, 'no es un objeto JSON');
  if (o['error'] !== undefined) {
    const e = o['error'];
    const detalle = esObjeto(e) ? `${String(e['code'] ?? '')} ${String(e['summary'] ?? e['message'] ?? '')}` : String(e);
    return {
      estado: 'no-verificado',
      resumen: `${herramienta} audit devolvio un error: ${recortar(detalle)}`,
      graves: [],
      otras: [],
    };
  }
  const meta = esObjeto(o['metadata']) ? o['metadata'] : null;
  const v = meta !== null && esObjeto(meta['vulnerabilities']) ? meta['vulnerabilities'] : null;
  if (v === null) return ilegible(herramienta, 'falta metadata.vulnerabilities');
  const critical = num(v['critical']);
  const high = num(v['high']);
  const moderate = num(v['moderate']);
  const low = num(v['low']);
  if (critical === null || high === null || moderate === null || low === null) {
    return ilegible(herramienta, 'conteos de vulnerabilidades no numericos');
  }
  const info = num(v['info']) ?? 0;
  const total = critical + high + moderate + low + info;
  if (status !== 0 && status !== 1) return ilegible(herramienta, `codigo de salida ${String(status)}`);
  if (status === 1 && total === 0) return ilegible(herramienta, 'codigo de salida 1 sin vulnerabilidades en el informe');

  const graves: string[] = [];
  const otras: string[] = [];
  const fuente = esObjeto(o['advisories']) ? Object.values(o['advisories']) : esObjeto(o['vulnerabilities']) ? Object.entries(o['vulnerabilities']).map(([nombre, x]) => (esObjeto(x) ? { module_name: nombre, ...x } : x)) : [];
  for (const x of fuente) {
    if (!esObjeto(x)) continue;
    const nombre = String(x['module_name'] ?? x['name'] ?? '?');
    const sev = String(x['severity'] ?? '');
    (sev === 'high' || sev === 'critical' ? graves : otras).push(`${nombre} (${sev})`);
  }
  const resumen = `${critical} criticas, ${high} altas, ${moderate} moderadas, ${low} bajas${info > 0 ? `, ${info} informativas` : ''}`;
  if (total === 0) return limpio(resumen);
  // Si los conteos dicen que hay graves pero no se pudo nombrar ninguna, el conteo manda.
  if (critical + high > 0 && graves.length === 0) graves.push('(ver la salida de la herramienta)');
  return conVulnerabilidades(resumen, graves, otras);
}

/** `yarn audit --json` de Yarn clasico (una linea JSON por evento). */
export function interpretarYarnAudit(stdout: string): VeredictoAuditoria {
  let resumen: Record<string, unknown> | null = null;
  const graves: string[] = [];
  const otras: string[] = [];
  for (const linea of stdout.split(/\r?\n/)) {
    if (linea.trim() === '') continue;
    let o: unknown;
    try {
      o = JSON.parse(linea);
    } catch {
      return ilegible('yarn', 'una linea no es JSON');
    }
    if (!esObjeto(o)) continue;
    if (o['type'] === 'auditSummary' && esObjeto(o['data']) && esObjeto(o['data']['vulnerabilities'])) {
      resumen = o['data']['vulnerabilities'];
    } else if (o['type'] === 'auditAdvisory' && esObjeto(o['data']) && esObjeto(o['data']['advisory'])) {
      const a = o['data']['advisory'];
      const sev = String(a['severity'] ?? '');
      (sev === 'high' || sev === 'critical' ? graves : otras).push(`${String(a['module_name'] ?? '?')} (${sev})`);
    }
  }
  if (resumen === null) return ilegible('yarn', 'falta el resumen auditSummary');
  const c = num(resumen['critical']);
  const h = num(resumen['high']);
  const m = num(resumen['moderate']);
  const l = num(resumen['low']);
  if (c === null || h === null || m === null || l === null) return ilegible('yarn', 'conteos no numericos');
  const texto = `${c} criticas, ${h} altas, ${m} moderadas, ${l} bajas`;
  if (c + h + m + l === 0) return limpio(texto);
  if (c + h > 0 && graves.length === 0) graves.push('(ver la salida de la herramienta)');
  return conVulnerabilidades(texto, graves, otras);
}

/** `cargo audit --json`. */
export function interpretarCargoAudit(stdout: string, status: number | null): VeredictoAuditoria {
  let o: unknown;
  try {
    o = JSON.parse(stdout);
  } catch {
    return ilegible('cargo audit', 'no es JSON');
  }
  if (!esObjeto(o) || !esObjeto(o['vulnerabilities'])) return ilegible('cargo audit', 'falta "vulnerabilities"');
  const v = o['vulnerabilities'];
  if (typeof v['found'] !== 'boolean' || !Array.isArray(v['list'])) return ilegible('cargo audit', 'campos "found"/"list" ausentes');
  if (status !== 0 && status !== 1) return ilegible('cargo audit', `codigo de salida ${String(status)}`);
  if (!v['found']) {
    if (status === 1) return ilegible('cargo audit', 'codigo 1 sin vulnerabilidades en el informe');
    return limpio('0 vulnerabilidades en Cargo.lock');
  }
  const graves = (v['list'] as unknown[]).map((x) => {
    const a = esObjeto(x) && esObjeto(x['advisory']) ? x['advisory'] : {};
    const p = esObjeto(x) && esObjeto(x['package']) ? x['package'] : {};
    return `${String(p['name'] ?? a['package'] ?? '?')} (${String(a['id'] ?? '?')})`;
  });
  return conVulnerabilidades(
    `${graves.length} vulnerabilidades (cargo audit no publica severidad: se tratan como altas)`,
    graves.length > 0 ? graves : ['(ver la salida de la herramienta)'],
    []
  );
}

/** `pip-audit -f json`. */
export function interpretarPipAudit(stdout: string, status: number | null): VeredictoAuditoria {
  let o: unknown;
  try {
    o = JSON.parse(stdout);
  } catch {
    return ilegible('pip-audit', 'no es JSON');
  }
  const deps: unknown = Array.isArray(o) ? o : esObjeto(o) ? o['dependencies'] : undefined;
  if (!Array.isArray(deps)) return ilegible('pip-audit', 'falta "dependencies"');
  if (status !== 0 && status !== 1) return ilegible('pip-audit', `codigo de salida ${String(status)}`);
  const graves: string[] = [];
  for (const d of deps) {
    if (!esObjeto(d) || !Array.isArray(d['vulns']) || d['vulns'].length === 0) continue;
    const ids = (d['vulns'] as unknown[]).map((v) => (esObjeto(v) ? String(v['id'] ?? '?') : '?')).join(', ');
    graves.push(`${String(d['name'] ?? '?')} ${String(d['version'] ?? '')} (${ids})`.replace(/\s+\(/, ' ('));
  }
  if (graves.length === 0) {
    if (status === 1) return ilegible('pip-audit', 'codigo 1 sin vulnerabilidades en el informe');
    return limpio(`${deps.length} dependencias auditadas, 0 con vulnerabilidades`);
  }
  return conVulnerabilidades(
    `${graves.length} paquetes con vulnerabilidades (pip-audit no publica severidad: se tratan como altas)`,
    graves,
    []
  );
}

/** `dotnet list package --vulnerable --include-transitive` (texto, en ingles). */
export function interpretarDotnetVulnerable(stdout: string, status: number | null): VeredictoAuditoria {
  if (status !== 0) return ilegible('dotnet', `codigo de salida ${String(status)}`);
  const graves: string[] = [];
  const otras: string[] = [];
  for (const linea of stdout.split(/\r?\n/)) {
    const m = /^\s*>\s+(\S+)\s+.*?\b(Low|Moderate|High|Critical)\b/.exec(linea);
    if (m === null) continue;
    const sev = m[2] as string;
    (sev === 'High' || sev === 'Critical' ? graves : otras).push(`${m[1] as string} (${sev})`);
  }
  if (graves.length + otras.length > 0) {
    return conVulnerabilidades(`${graves.length} graves, ${otras.length} de severidad baja o moderada`, graves, otras);
  }
  if (/has no vulnerable packages|no vulnerable packages/i.test(stdout)) return limpio('0 paquetes vulnerables (incluye transitivos)');
  return ilegible('dotnet', 'ni lista de paquetes vulnerables ni confirmacion de que no hay');
}

/** `govulncheck ./...` (texto). */
export function interpretarGovulncheck(stdout: string, status: number | null): VeredictoAuditoria {
  const ids = [...stdout.matchAll(/Vulnerability #\d+:\s*(GO-\d+-\d+)/g)].map((m) => m[1] as string);
  if (ids.length > 0) {
    if (status !== 3) return ilegible('govulncheck', `lista vulnerabilidades pero sale con ${String(status)}`);
    return conVulnerabilidades(
      `${ids.length} vulnerabilidades alcanzables (govulncheck no publica severidad: se tratan como altas)`,
      ids,
      []
    );
  }
  if (status === 0 && /No vulnerabilities found/i.test(stdout)) return limpio('0 vulnerabilidades alcanzables');
  return ilegible('govulncheck', `codigo de salida ${String(status)} sin confirmacion de que no hay vulnerabilidades`);
}
