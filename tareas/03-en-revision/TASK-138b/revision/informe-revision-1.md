# Informe de revision — TASK-138b (ronda 1)

- Commit revisado: 91b1c964891a28c4c6dff9759cb09c952e64ea55
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/flujo.ts:385 | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/hooks/freno-stop.ts:282 | plan |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/review.ts:1315 | implementacion |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts:490 | implementacion |
| MEN-5 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/doctor.ts:1068 | implementacion |

No hay CRITICOS ni IMPORTANTES.

### Hallazgos

**MEN-1.** El texto nuevo del tope se lee peor que antes:
- la descripcion de la ronda extra lleva un «;» interno;
- `--ronda-extra` queda pegado a la frase equivocada;
- `("taskctl new")` parece el comando de cerrar.

No contradice a las skills, pero el error de review lo hereda.

**MEN-2.** Queda otra copia de la decision omitido/verde/rojo en el cierre `anotar` de freno-stop. No es identica (tiene `excedido`), pero la regla «salio del memo, omitido» esta escrita otra vez.

**MEN-3.** Ningun test fija el cableado de `deMemo` en review: el mutante `deMemo: false` sobrevive.

**MEN-4.** Ningun test fija que `contarTerminadas` cuente las tareas ilegibles. El comportamiento se conserva, pero el mutante que cuenta solo las legibles sobrevive.

**MEN-5.** `runDoctorCommand` pasa `terminadas()` siempre, asi que la lectura ocurre aunque no haya documento de estado. Es un coste de E/S, no un fallo de correccion: solo cambia el caso con la config nula, porque la poda ya leia siempre.

### Reproduccion

En el clon pasan los tests de doctor, siguiente, registro-puertas-verificacion, automatico-rondas, verificar-lote y metricas-puertas. La peticion trae la selectiva en verde (795/795). De los cuatro mutantes, tres sobreviven (MEN-3, MEN-4 y MEN-5); el cuarto es la lectura del texto real del tope (MEN-1).

### Correcciones (coordinador)

- **MEN-1, corregido.** Salidas numeradas, cada una con su comando delante: `(1) "taskctl veredicto ...": cerrar ... (2) "taskctl review ... --ronda-extra": una ronda mas ... (3) "taskctl new": redisenar ...`. El test comprueba el orden y cada comando al principio de su salida.
- **MEN-2, aceptado.** El freno tiene su propio caso (`excedido`, y el «omitido sin ejecutar» del ultimo verde) y su anotacion escribe su tipo de resultado. Unificarlo obligaria a abrir `anotarVerificacion` a un caso que solo tiene el freno. Queda para TASK-140 (cerrojo y verificar-impacto) o para la 4D preventiva.
- **MEN-3, corregido.** Test de review con la selectiva reutilizada del memo: se anota `omitido` y no se vuelve a ejecutar. El mutante cae en rojo.
- **MEN-4, corregido.** Test de `contarTerminadas` con una terminada ilegible y otra sin tarea.md: cuenta 2.
- **MEN-5, aceptado.** Solo cuesta una lectura de 04-terminadas con la config nula. Las llamadas directas a `comprobarDocumentoEstado` siguen leyendo solo con fecha.

## Regla 4D

- Duplicacion: reducida. MEN-2 queda aceptado con su motivo.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: MEN-3 y MEN-4, corregidos con test.

## Lecturas fuera del contexto permitido

- freno-stop.ts, las skills review y task-workflow, y los tests de doctor y verificacion.
