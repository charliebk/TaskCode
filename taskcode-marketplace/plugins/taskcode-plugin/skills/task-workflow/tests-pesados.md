# Tests pesados y presupuesto de tests

La suite solo crece: cada criterio y cada ronda anaden tests, y los lentos
corren con los demas en cada cierre. Dos frenos.

## Presupuesto de tests por criterio

En `## Plan de pruebas` del plan, por cada criterio, cuantos tests nuevos se
preven: **de 1 a 3**. Si un criterio necesita mas, el plan dice por que. Antes
de escribir un test, busca si ya hay uno que cubra lo mismo: ampliarlo es
mejor que duplicarlo. En la revision, un test que duplica a otro ya existente
es un hallazgo MENOR.

## Marcar un test como pesado

Un test de rendimiento, escala o carga (segundos o minutos, datos grandes) se
marca como pesado para que quede **fuera** de `comando_verificacion` y corra
solo con `comando_verificacion_pesada`, que `finish` exige en las ramas release
(y hotfix si el proyecto lo declara en `verificacion_pesada_en`).

| Lenguaje | Como marcarlo | Completa | Pesados |
|---|---|---|---|
| Node (`node --test`) | En un directorio aparte (`test/pesados/`) o con sufijo `.pesado.test.js` | `node --test "test/unit/**/*.test.js"` | `node --test "test/pesados/**/*.test.js"` |
| Rust | `#[ignore]` en el test | `cargo test` | `cargo test -- --ignored` |
| Java (JUnit 5) | `@Tag("pesado")` | `mvn test -DexcludedGroups=pesado` | `mvn test -Dgroups=pesado` |
| .NET (xUnit) | `[Trait("Categoria", "Pesado")]` | `dotnet test --filter "Categoria!=Pesado"` | `dotnet test --filter "Categoria=Pesado"` |

```yaml
# .taskcode/config.yml
comando_verificacion: "cargo test"
comando_verificacion_pesada: "cargo test -- --ignored"
```

Sin `comando_verificacion_pesada` no hay puerta de pesados: un test marcado
asi no lo corre nadie, asi que no lo marques sin declarar la clave.

## El aviso de crecimiento

`taskctl metricas --por-version` muestra por version el numero de tests y la
duracion de la verificacion completa (del registro de puertas), y
`taskctl doctor` avisa si cualquiera crecio mas de `umbral_crecimiento_suite`
(20 % por defecto) desde la version anterior. Es la senal para podar tests
redundantes o marcar pesados.
