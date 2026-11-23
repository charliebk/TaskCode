# Informe de revision — TASK-148c (ronda 1)

- Commit revisado: 58964aa
- Revisor: code-quality-reviewer (sonnet, independiente)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | src/core/catalogo-skills.ts (seleccion sin mayusculas, sin test) | implementacion |
| MEN-1 | MENOR | corregido | src/core/doctor-deploy-tareas.ts:63 (copia de recortar) | implementacion |
| MEN-2 | MENOR | corregido | src/core/secretos.ts:64, src/hooks/entrada-pretooluse.ts:26 (copias de esObjeto) | implementacion |
| MEN-3 | MENOR | corregido | src/core/plataforma-remota.ts (hostDeRemoto con puerto 0 sin test) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Reproduccion

- Clon con tsc limpio; utilidades-core, catalogo-skills, complejidad-similar, coste-*, crecimiento-suite, doctor-deploy*, informe-verificacion*, menores, plataforma-remota, progreso, secretos, guardia-merge, estado*, verificar-menores y doctor-deploy: 272/272.
- Mutantes cazados: diaDe por regex, salto de subcomandoGit, rango de puerto, MARCAS_TEST sin spec. Sobrevive: seleccionarSkill comparando con mayusculas (IMP-1); el catalogo real va todo en minusculas, el cambio solo se nota con etiquetas de tarea como Rust.
- MEN-1: doctor-deploy-tareas recorta con «...» por unidades UTF-16. MEN-2: dos guardas de objeto plano en linea. MEN-3: hostDeRemoto con puerto 0 o mayor que 65535 pasa a null (sin-host en detectarPlataforma), sin test del 0.
- Puntos vigilados: la redaccion de credenciales es idempotente y no rompe otros patrones; utilidades-texto no arrastra nada a la via rapida de estado; el resto de hosts (scp, ssh con puerto, mayusculas) igual que antes.

## Regla 4D

- Duplicacion: MEN-1, MEN-2
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-1

## Lecturas fuera del contexto permitido

- scripts/catalogo-skills.yml, src/core/campos-catalogo.ts, src/core/task.ts, src/commands/doctor.ts, src/commands/finish-opciones.ts, src/hooks/entrada-pretooluse.ts, src/core/doctor-deploy-tareas.ts, src/core/documento-estado.ts.
