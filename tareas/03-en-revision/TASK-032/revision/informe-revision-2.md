# Informe de revision — TASK-032 (ronda 2)

- Commit revisado: 03339ef0e59ee3cc5af5adced35daadafcdc0a92
- Revisor: tres agentes independientes en paralelo, ninguno de la ronda 1, uno por frente
- Veredicto: cambios-solicitados

A los tres se les pidio expresamente que NO repitieran la ronda 1, sino que
atacaran las correcciones mismas: verificar que cada una hace lo que dice,
buscar defectos **introducidos por los propios arreglos**, y mirar lo que la
ronda 1 no miro. Es el patron que ya dio fruto en C6 y en E6.

Funciono: **dos de los tres hallazgos de mas peso de esta ronda son defectos
de las correcciones de la ronda 1, no del trabajo original.**

Veredictos por frente: heuristica **aprobada** (4 menores), roles
**aprobada** (6 menores), skills **cambios-solicitados** (2 importantes, 4
menores). **Cero criticos.**

Que se ejecuto: la suite completa tres veces (622 tests, 619 verdes, los 3
rojos conocidos de Windows, sin cuarto rojo), 59 mutaciones y sondas de
vacuidad, una bateria propia de 89 rutas enrutadas con `path.matchesGlob`, la
puntuacion heuristica de las 32 tareas del repo, 15 textos de control para
falsos positivos, y el validador oficial con su contraprueba.

## Hallazgos

### D7 — heuristica de complejidad (aprobada)

**[MENOR] 1. La excepcion de hotfix, escrita como sustitucion incondicional, SUBIA de 0 a 1 los agentes de un hotfix trivial**
- **Defecto introducido por la correccion 3 de la ronda 1.**
- Donde: `scripts/heuristica-complejidad.yml`, bloque de
  `agentes_brainstorm_hotfix`, frente a la tabla por nivel.
- Que pasa: la tabla dice 0 agentes en `trivial` ("no se paga un brainstorm
  para algo trivial"). La excepcion decia "salga el nivel que salga: se
  aplica ANTES que la tabla y la sustituye". Un hotfix pequeno puntua 0 ->
  `trivial` -> la tabla da 0, y la excepcion lo subia a 1.
- Impacto: acotado a un agente, pero la clave que existe para **abreviar** el
  brainstorm acababa anadiendo uno en el caso donde la urgencia mas pesa. El
  test lo fijaba sin verlo: aseveraba `trivial === 0` y `hotfix === 1` por
  separado, nunca la interaccion.
- **Corregido**: es un TOPE, no una sustitucion (el menor de los dos), con la
  interaccion aseverada.

**[MENOR] 2. La cota de 28 no acota nada operativo**
- Donde: comentario de `peso_palabra_alto_riesgo`. La escala termina en 8, asi
  que **4 entradas distintas ya saturan el nivel maximo**: la cota es 3,5
  veces el techo de la escala. La regla de conteo aporta determinismo —ese es
  su valor real—, pero la frase que la acompanaba prometia un techo que no
  entrega, y es la que leeria quien implemente el consumidor.
- **Corregido**: se dice lo que la cota hace y lo que no, y que el ajuste, si
  molesta, es el peso y no la cota.

**[MENOR] 3. Las tres aserciones de prosa fijaban la frase, no la regla**
- Donde: `test/core/heuristica-complejidad.test.ts`. `PROSA` colapsa el
  fichero entero, sin localidad. Tres sondas dejaban la suite **verde**:
  negar la regla de conteo ("NO se cuenta una vez por entrada distinta, sino
  por ocurrencia"), negar la precedencia del hotfix, y mover la frase de la
  revision a la seccion de otra clave.
- **Corregido**: cada asercion se ancla al bloque de comentario de su propia
  clave, mas una asercion negativa. Las tres sondas ahora se ponen rojas.

**[MENOR] 4. El fichero declara con que parser se lee, pero no que hay que encender los comentarios**
- `permitirComentariosDeLinea` va apagado por defecto: quien siga el fichero
  al pie de la letra revienta en su primera linea. Falla ruidoso, no
  silencioso. **Corregido** con un aviso en el bloque de formato.

### D7 — roles de brainstorm (aprobada)

Las ocho correcciones de la ronda 1 verificadas una a una. La del tope de
longitud salio **mas solida de lo que su autor declaro**: la formula da
35/30/38/36, que coincide al numero con lo que la ronda 1 midio por su
cuenta, y la asercion es exacta en el borde (tope 35 verde, 34 rojo). El
revisor intento colar un tope imposible explotando el orden de las regex y
**no pudo**.

**[MENOR] 5. El reparto de rendimiento se declara en un solo sentido**
- La vinneta nueva de `arquitectura` reclama rendimiento y escalabilidad,
  pero solo `dominio` los cede; los cuatro temas preexistentes estan
  excluidos por los tres roles restantes. Como cada agente lee solo su
  fichero, es duplicacion previsible.

**[MENOR] 6. Las cuatro correcciones de contenido de la ronda 1 van sin red**
- Cuatro reversiones literales dejan la suite en 55/55 **verde**. La que
  duele: devolver la nota del rol de testing a su redaccion rota, que era un
  hallazgo IMPORTANTE. El mecanismo para fijarlo ya se uso en el frente
  hermano en el mismo commit (importar el enum del codigo).

**[MENOR] 7. La lista de herramientas prohibidas es negra y por igualdad exacta**
- `tools: Read, Grep, Glob, mcp__fs__write_file` pasa en verde; tambien
  `bash, write` en minusculas y `Bash(git status:*)`. El test existe
  justamente porque `tools` es lo unico que de verdad impide escribir.

**[MENOR] 8. La lista de marcas del repo se quedo atras respecto a la del test hermano**
- 9 entradas y sensible a mayusculas, frente a las 15 en minusculas del test
  de skills. Colar `TASKCODE` en mayusculas deja la suite verde. Sin fuga
  real: con 30 patrones propios los cuatro ficheros salen limpios.

**[MENOR] 9. `MIN_VINETAS_CONTEXTO = 3` deja a `brainstorm-dominio.md` sin margen**
- Margenes 4/4, 5/4, 4/4 y 5/**3**: fusionar dos vinnetas legitimamente
  pondria el test rojo.

**[MENOR] 10. En `media` la aritmetica de la nota no cierra del todo**
- En `alta` cuadra exacto (3 agentes = 4 roles menos testing). En `media` el
  presupuesto es 2 y quitar testing deja tres roles para dos plazas: falta
  uno y ningun documento dice cual.

### D6 — las cuatro skills revisoras (cambios-solicitados)

**[IMPORTANTE] 11. El recorte de patrones dejo a Angular moderno sin revisor**
- **Defecto introducido por la correccion 15 de la ronda 1.**
- Donde: `skills/angular-vue-reviewer/SKILL.md`, la lista y el parrafo de
  contrapartida.
- Que pasa: la guia de estilo oficial vigente de Angular (v20+) elimina el
  sufijo de tipo del nombre de fichero. Un componente vive hoy en
  `user-profile.ts` / `.html` / `.css` / `.spec.ts`, y una directiva en
  `highlight.ts`. **Ninguno casa con los 12 patrones**: medido, 0 de 6
  ficheros por defecto de Angular 20, y de los 12 patrones solo sobrevivia
  `angular.json`, que casi nunca esta en un diff. Antes del recorte si
  llegaban, via `**/src/app/**`.
- Impacto: dos capas. Funcional, un proyecto Angular que siga la guia actual
  nunca activa la skill y su diff cae al generico, que no revisa reactividad,
  fugas de suscripcion, deteccion de cambios ni accesibilidad. Y documental,
  que es peor: el parrafo presentaba la perdida como tres casos de borde
  ("un diff que **solo** toca un guard, un store de Pinia...") cuando para
  Angular >= 20 *todos* los ficheros son ese caso.
- **Corregido**: 15 patrones. Angular >= 20 pasa de 0/9 a 4/9 rutas
  capturadas, las legitimas totales de 26/40 a 32/40, y las ajenas siguen en
  37/37 sin casar — cero regresion en la direccion que arreglo la ronda 1.
  Dos de los tres candidatos evidentes se descartaron **midiendo**:
  `src/app/**/*.scss` y `*.css` fugan a Next.js, que deja `globals.css` justo
  ahi; solo `.html` discrimina. Queda un hueco sin arreglo posible y ahora
  escrito en la skill: una directiva suelta no se distingue por nombre de un
  `app.service.ts` de NestJS.

**[IMPORTANTE] 12. La correccion 15 se aplico sin red: se podia revertir entera dejandolo todo verde**
- Donde: `test/skills/revisores.test.ts`. El test 5 solo miraba que la lista
  no estuviera vacia; el 6, que no hubiera patrones identicos entre
  revisores. Ninguno miraba que casan ni que no casan.
- Reproduccion: reintroducir `**/*.module.ts` y `**/src/app/**` —el hallazgo
  15 tal cual— deja `pass=17 fail=0`; reducir la lista entera a
  `["**/*.vue"]`, tambien.
- Impacto: la lista de patrones es el dato de mas consecuencia de estas
  skills y el unico que ya habia fallado en las dos rondas, por exceso y por
  defecto. La medicion se hizo, pero no quedo en la suite.
- **Corregido**: tres tests con una tabla de 32 rutas legitimas y 37 ajenas,
  en las dos direcciones, con los patrones leidos de los propios SKILL.md.
  Las cuatro sondas que antes pasaban ahora se ponen rojas.

**[MENOR] 13. El test del informe comprobaba que los campos de cabecera existen, no que esten en la cabecera** — mover `- Commit revisado:` dentro de `## Hallazgos` dejaba la suite verde, y es justo el campo cuya perdida motivo el hallazgo 16 de la ronda 1. **Corregido** aseverando la posicion.

**[MENOR] 14. La lista de marcas seguia dejando pasar otros documentos del repo** (`docs/CONVENCIONES.md`, `docs/HALLAZGOS.md`). Sin fuga real: con 50 marcas propias las cuatro skills salen limpias. **Corregido** con un patron generico y su contraprueba.

**[MENOR] 15. Dos dialectos de campos de hallazgo** conviviendo bajo `## Hallazgos`. **Corregido**: uno solo, identico en las cuatro.

**[MENOR] 16. Las correcciones de `angular-vue` y de `csharp` resolvian el mismo problema de forma opuesta sin decir por que** — retirar los patrones ambiguos frente a conservar `**/*.cs` y avisar en el informe. **Corregido** con el criterio escrito en ambas: se acota cuando hay un sufijo o corte de ruta que discrimina, se documenta el hueco cuando no lo hay.

## Lo verificado sin hallazgo

- **Las seis correcciones de la heuristica**, una a una, incluida la ausencia
  de cualquier referencia funcional a `compleja` en todo el paquete, que la
  asercion del enum no es vacua (renombrar a `_compleja` la pone roja) y que
  la lista acortada **no introduce falsos positivos**: 0 disparos en las 32
  tareas reales del repo.
- **Las ocho correcciones de los roles**, con 22 mutaciones. El mapeo de la
  nota del rol de testing contra el enum del plugin y contra la tabla del YML
  cierra exacto en `alta` y en `critica`.
- **Las cuatro correcciones restantes de las skills** (formato de informe
  derivado de `informeTemplate`, severidades aseveradas por su definicion,
  marcas ampliadas, y los dos casos documentados de C# y del umbral).
- **Portabilidad**, con listas propias mas amplias que las de los tests: 30
  patrones sobre los roles y 50 sobre las skills. Cero marcas de este repo en
  los nueve artefactos.
- **El validador oficial** sobre el clon, con contraprueba, y el
  autodescubrimiento de `agents/` sin que `plugin.json` la declare.
