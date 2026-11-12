# Plan — TASK-122: Coste por tarea independiente del tamano del proyecto

(Modo rapido, decision de Carlos del 2026-11-12: plan redactado por el coordinador, sin
brainstorm de roles. `taskctl plan` preparo 3 roles por la complejidad `alta`; no se lanzan.
Los datos de partida son los de `docs/auditoria/AUDITORIA-METODO-2026-11-12.md` y
`docs/auditoria/PASOS-PLUGIN-2026-11-12.md`, ya medidos.)

## Enfoque propuesto

Duracion estimada: 150 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo nuevos o tocados en el plugin y 2 scripts del repo, 3 capas: scripts del repo, metricas y documentacion; 6 criterios; una ronda de revision en modo rapido; la ejecucion del perfil de tests corre en segundo plano y no bloquea).

Regla que fija la tarea (Carlos): cada paso de una tarea cuesta en proporcion a lo que
cambia la tarea, nunca al tamano del proyecto; lo que dependa del tamano del proyecto se
paga una vez por version.

Orden de implementacion, un commit por paso:

1. **Verificacion por impacto en TaskCode (criterio 3; es la que mas frena hoy).**
   - Nuevo `scripts/verificar-impacto.mjs` en la raiz del repo (node, sin dependencias; no se
     publica con el plugin: es de este proyecto). Lee `RAMA_BASE` (la que pasa taskctl a la
     selectiva), saca los ficheros cambiados con `git diff --name-only <base>...HEAD` mas los
     no commiteados, compila (`npm run build`) y elige los tests:
     - un `test/**/*.test.ts` cambiado se corre;
     - un `src/**` cambiado: los ficheros de test que lo importan, directa o
       transitivamente, por el grafo de `import ... from` de `test/` y `src/` (leido con una
       expresion regular sobre los `.ts`, sin compilar nada mas);
     - un cambio en `test/helpers/**`, `package.json`, `tsconfig.json`, `bin/` o
       `scripts/gitflow/**`: los tests que importan ese helper o, si es transversal, `npm run
       test:rapido` mas los de `test/commands` que lancen esos scripts (lista explicita en el
       propio script);
     - solo documentacion o `tareas/`: nada (ya lo resuelve la verificacion proporcional).
     - Siempre suma `npm run test:rapido` (10 s): red barata de toda la logica sin Git.
     - Imprime que ficheros de test eligio y por que, y sale con el codigo de `node --test`.
   - `.taskcode/config.yml` de TaskCode declara `comando_verificacion: "npm test"` (la completa,
     la de publicar), `comando_verificacion_selectiva: "node scripts/verificar-impacto.mjs"` y
     `rutas_verificacion_parcial` con `src/**` y `test/**` del plugin, para que `finish`, el
     freno y las rondas usen la selectiva (nivel 2 de TASK-105) y la completa quede para el
     release. Con esto TASK-116 (P-8) se reduce a su parte de `doctor`.
   - Medicion del criterio: una rama con un cambio en un unico modulo (por ejemplo
     `src/core/progreso.ts`) verifica en menos de 2 min; queda el tiempo en el Resultado.
2. **Coste fijo frente al tamano en `metricas` (criterio 5).** `taskctl metricas --evolucion`
   ya agrupa las terminadas por tramos de cierre; se le anaden por tramo la mediana de
   punta a punta, de la fase de revision y de `finish` (P-1), y una linea final que compara el
   primer y el ultimo tramo y dice si el coste fijo crece, baja o se mantiene. Test con repo
   temporal.
3. **Informe de escala (criterio 1).** `docs/auditoria/ESCALA-2026-11-12.md`: para cada paso
   (diseno, implementacion, verificacion, cada ronda, cierre, contexto leido), su coste frente
   al tamano del proyecto con los datos ya medidos de los tres proyectos y la curva de la
   suite (tests por version, sacados de los tags) y de los documentos de contexto (KB por
   fecha). Tabla con la tendencia de cada paso.
4. **Decisiones por paso (criterio 2).** En el mismo informe, para cada paso que crece, su
   arreglo: hecho en esta tarea (verificacion por impacto), tarea ya creada (TASK-112 revision
   que reutiliza la verificacion, TASK-121 troceo, TASK-099 MENORES sin ronda), modo rapido ya
   vigente (diseno de un rol), o tarea nueva que se da de alta (contexto con tamano maximo).
   Lo decide Carlos al aprobar este plan (ver abajo).
5. **Perfil de la suite y piramide (criterio 4).** Nuevo `scripts/perfil-tests.mjs`: corre cada
   fichero de test por separado con un `git` de recuento delante en el PATH (un envoltorio que
   anota cada llamada y llama al git real; solo existe en esta ejecucion de medida, no en la
   suite) y escribe `docs/auditoria/PERFIL-TESTS-<fecha>.md` con duracion y procesos git por
   fichero. Se ejecuta una vez en segundo plano mientras se hace lo demas. Los 10 mas lentos se
   clasifican a mano en «necesita Git real» o «se puede probar sin Git». La regla de la
   piramide (logica sin Git; Git real solo en una capa fina de integracion) se escribe en
   `docs/contexto/CONVENCIONES.md`, junto a «siempre contra recursos reales», que se acota a
   esa capa.

## Desacuerdos entre roles, y como se resuelven

No hubo roles (modo rapido). El punto delicado que un rol de riesgos habria levantado: la
seleccion por impacto puede dejar fuera un test que si se ve afectado (dependencias por
fichero de datos, por texto de un mensaje, por los scripts de Git-Flow). Se contiene con:
`test:rapido` siempre; lista explicita de transversales que fuerzan mas tests; y la completa
obligatoria antes de publicar cada version.

## Riesgos aceptados y que los contiene

- Un fallo que la selectiva no ve llega a `develop` y se descubre en la completa del release:
  aceptado a cambio de la agilidad (decision de Carlos); la completa del release lo para antes
  de publicar.
- El grafo de imports por expresion regular no ve imports dinamicos: en `src/` solo los usa
  `bin/taskctl` (via rapida de `estado`), que esta en la lista de transversales.
- La medicion de 2 min depende de la maquina: se anota con su contexto.

## Plan de pruebas

- `verificar-impacto.mjs`: tests en `test/scripts/` con un repo temporal real: cambio en un
  test → solo ese; cambio en un modulo de `src` → los que lo importan (y no otros); cambio en
  un helper transversal → la lista ampliada; solo documentacion → nada mas que `test:rapido`.
  Mutante: ignorar las dependencias transitivas → un test se pone rojo.
- `metricas --evolucion`: test con repo temporal y tres tramos: medianas por tramo y la linea
  de tendencia; mutante: invertir la comparacion.
- `perfil-tests.mjs`: test sobre dos ficheros de test minimos (uno que lanza git y otro que no)
  que comprueba el recuento de procesos.

## Lo que necesita decision de una persona

- (1) Aprobar el plan entero sin trocear pese a los 150 min (como TASK-110).
- (2) Aceptar que en TaskCode `finish` y el freno verifiquen por impacto y que la completa solo
  se corra antes de publicar (el riesgo aceptado de arriba).
- (3) Para el contexto que leen los agentes (CHECKLIST de 83 KB, README de 98 KB, ESTADO
  desfasado), dar de alta una tarea aparte en vez de hacerlo aqui.
