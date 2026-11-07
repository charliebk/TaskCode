/**
 * TASK-089: claves falsas de los tests, en un solo sitio y siempre troceadas.
 *
 * La proteccion de push de GitHub (secret scanning) bloquea un push si el
 * texto de un fichero casa con la forma de una clave real, aunque sea falsa.
 * Por eso ninguna de estas constantes aparece entera en el codigo fuente: se
 * arman por concatenacion y solo existen enteras en tiempo de ejecucion.
 * El test test/empaquetado/sin-literales-secretos.test.ts vigila que nadie
 * vuelva a escribir una entera en un fichero versionado.
 *
 * Sin imports a proposito: lo importan los tests de core (test:rapido) sin
 * arrastrar los comandos.
 */

/** Clave secreta de Stripe en produccion. */
export const STRIPE_LIVE = 'sk_live_' + 'Zq81xKd0TvR4mNb7YcW2pLfH';
/** Otra distinta, para los casos que necesitan dos claves. */
export const STRIPE_LIVE_OTRA = 'sk_live_' + 'Nueva0Clave1Dist';
/** Clave de prueba de ejemplo de la documentacion publica de Stripe. */
export const STRIPE_TEST_EJEMPLO = 'sk_test_' + '4eC39HqLyjWDarjtT1zdp7dc';
/** Access key id de AWS. */
export const AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
/** Access key id de ejemplo de la documentacion de AWS. */
export const AWS_EJEMPLO = 'AKIA' + 'IOSFODNN7EXAMPLE';
/** Cabecera de una clave privada RSA en PEM. */
export const PEM_CABECERA = '-----BEGIN RSA ' + 'PRIVATE KEY-----';
/** Pie de la misma. */
export const PEM_PIE = '-----END RSA ' + 'PRIVATE KEY-----';
/** Token de bot de Slack. */
export const SLACK = 'xoxb' + '-1234567890-abcdefghij';
/** Token personal clasico de GitHub. */
export const GITHUB_TOKEN = 'ghp_' + 'a1B2c3D4e5'.repeat(4);
