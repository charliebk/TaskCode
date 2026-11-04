# Plan — TASK-070: Clave comando_verificacion en .taskcode/config.yml

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Precedente casi uno a uno: la pareja `comando_sincronizacion` +
`timeout_sincronizacion` de `src/core/config.ts` (comando de shell + timeout en
segundos, validacion conjunta en `validarSincronizacionCompleta`). Las dos
claves nuevas entran por el mismo camino (tabla de cabecera, `TaskcodeConfig`,
`CONFIG_DEFAULTS`, `CLAVES_CONFIG`, un `case` en `parsearConfigConAvisos`) y se
reutilizan los validadores existentes generalizados con un parametro. Doctor
solo informa: no ejecuta el comando. El ejecutor queda para TASK-071/072.

Piezas:

- `src/core/config.ts` (contrato, se extiende): `comando_verificacion: string | null`
  (defecto `null`) y `timeout_verificacion: number` en segundos (defecto 600).
- `validarComando(donde, valor)` pasa a `validarComando(donde, clave, valor, ejemplo)`:
  hoy el nombre `comando_sincronizacion` esta fijo en el mensaje. Un unico
  validador: texto no vacio, recortado, pista de entrecomillar si lleva `#`.
  Ejemplo para la clave nueva: `comando_verificacion: "npm test"`.
- `validarEnteroPositivo`: se amplia la union `clave` con `'timeout_verificacion'`
  y su frase de consecuencia. Cero, negativo, decimal o texto abortan (fallo cerrado).
- Se crea `validarVerificacionCompleta(ruta, vistas)`, hermana de
  `validarSincronizacionCompleta`: `timeout_verificacion` sin
  `comando_verificacion` aborta («no hace nada. Borrala o declara tambien
  comando_verificacion»).
- `src/commands/doctor.ts`: se crea `comprobarVerificacion(cfg)`, id
  `verificacion`, envuelta con `envolver`, despues de `csConfig`. Con
  `cfg === null` → `omitida`. Con comando → `ok` «comando_verificacion: "<cmd>"
  (timeout N s)». Sin comando → `omitida` con el arreglo en el propio mensaje (D1).
- Documentacion: subseccion nueva en el README del plugin junto a las claves del
  remoto; `CHANGELOG.md` raiz bajo «## Sin publicar»; lista de claves de
  `skills/task-workflow/SKILL.md` (fichero que se instala fuera: sin nombrar
  TaskCode), corrigiendo de paso «una clave mal escrita aborta», que dejo de ser
  verdad con TASK-061.
- No se toca `src/fs/sincronizacion.ts`: extraer `lanzarEnvoltorio` es trabajo de
  TASK-071, que tendra el consumidor.

Orden:

1. Generalizar `validarComando` y `validarEnteroPositivo` sin cambiar
   comportamiento (suite actual en verde).
2. Claves, sus `case` y `validarVerificacionCompleta`, con tests de config.
3. `comprobarVerificacion` en doctor y sus tests.
4. Tabla de cabecera, README, `SKILL.md` y CHANGELOG.

Alternativas descartadas: modulo `core/verificacion.ts` propio (dos validadores
para el mismo fichero, contra la doctrina de un solo punto de resolucion);
timeout en milisegundos (rompe con `timeout_sincronizacion`, en segundos).

## Lo que el rol no cubrio

- Riesgos (no hubo rol): comando que cuelga, salida CRLF, etc. El criterio 1
  (fallo cerrado) lo cubre la forma del diseno; nadie busco mas casos.
- Testing en profundidad: el plan de pruebas es el minimo que se desprende de la forma.
- Dominio: si la clave deberia admitir lista o depender de la rama no se reviso.
  Contraste con criterios: 1 y 2 cubiertos por el diseno; 3 depende de D1
  (resuelta abajo); 4 cubierto por el paso 4.

## Riesgos aceptados y que los contiene

- Generalizar dos validadores toca codigo compartido: lo acota el paso 1, con la
  suite en verde antes de anadir nada.
- La clave no tiene efecto real hasta TASK-071: lo acota D3.
- Suposiciones no verificadas que la implementacion debe comprobar: que el
  parser entrega numeros como `number` y conserva comillas/espacios/`#`; que
  ningun test compara `CONFIG_DEFAULTS`/`CLAVES_CONFIG` con `deepEqual`.

## Plan de pruebas

`node:test` con repos Git temporales reales, como los tests de config y doctor.

- Config: sin clave → `comando_verificacion` null y `timeout_verificacion` 600;
  comando entrecomillado con espacios y `#` se conserva recortado; comando vacio
  o numerico aborta nombrando clave y linea; timeout `0`, `-5`, `1.5`, `"diez"`
  aborta; timeout sin comando aborta; clave repetida aborta; errata
  (`comando_verificacon`) avisa con sugerencia y no aborta.
- Doctor: con la clave → `ok` con el comando en el mensaje; sin la clave →
  `omitida` con el arreglo en el mensaje; config rota → `omitida`; `--json`
  mantiene `arreglo/id/mensaje/nivel`.
- Regresion: suite completa, solo los tres rojos conocidos de Windows, ningun
  test existente editado.

## Lo que necesita decision de una persona

Modo `automatico`: sin checkpoint humano en approve. Las tres decisiones las
resuelve quien orquesta con la recomendacion del rol (ninguna cambia una regla
del metodo):

- **D1 — nivel de doctor sin la clave: opcion A.** `omitida`, `arreglo: null`,
  y el arreglo dentro del mensaje: «sin comando_verificacion: los frenos no
  actuan. Declara en .taskcode/config.yml: comando_verificacion: "<tu comando de
  tests>"». Motivo: `test/commands/doctor.test.ts:452` exige `avisos === 1` en
  repo limpio y `:118` una linea por comprobacion; un `aviso` romperia el
  criterio 2 y dejaria un aviso permanente en proyectos que no usan frenos.
- **D2 — timeout por defecto: 600 s.** `npm test` de este repo tarda ~10 min.
  El limite superior lo fija TASK-071, que conoce el timeout del hook.
- **D3 — clave sin consumidor real hasta TASK-071: se acepta.** No se publica
  version hasta cerrar TASK-071; la entrada del CHANGELOG queda en «Sin
  publicar» indicando que el freno llega con la tarea siguiente.
