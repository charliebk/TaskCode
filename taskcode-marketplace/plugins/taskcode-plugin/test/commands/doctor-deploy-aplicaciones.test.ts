/**
 * TASK-068: deteccion del tipo de aplicacion (web, api, Android, iOS, Flutter,
 * React Native, CLI, libreria) y su efecto en los puntos, con
 * `taskctl doctor-deploy --json` sobre repos Git temporales reales con la
 * estructura de carpetas de cada tipo (nunca aplanada).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { motivoNoAplicaPorAplicacion } from '../../src/commands/doctor-deploy.js';
import type { PuntoCatalogo } from '../../src/core/doctor-deploy-catalogo.js';
import type { AplicacionDetectada, InformeDeploy } from '../../src/core/doctor-deploy.js';
import { analisis, commit, conRepo, ejecutar, escribir, NODE, punto } from '../helpers/deploy-fixtures.js';

/** Los puntos que nombra el criterio 2. */
const SEIS = ['https-obligatorio', 'cookies-seguras', 'security-headers', 'rate-limits', 'backups-y-migraciones', 'health-check'];

const GITIGNORE = { '.gitignore': 'node_modules/\n.env\n' };

const WEB: Record<string, string> = {
  ...GITIGNORE,
  'package.json': '{"name":"web","private":true,"scripts":{"dev":"vite"},"devDependencies":{"vite":"^5.0.0"}}\n',
  'package-lock.json': '{"name":"web","lockfileVersion":3}\n',
  'vite.config.ts': 'import { defineConfig } from "vite";\nexport default defineConfig({});\n',
  'index.html': '<!doctype html><div id="app"></div>\n',
  'src/main.ts': 'document.querySelector("#app")!.textContent = "hola";\n',
};

const API: Record<string, string> = {
  ...GITIGNORE,
  'package.json': '{"name":"api","version":"1.0.0","main":"src/server.js","dependencies":{"express":"^4.19.0"}}\n',
  'package-lock.json': '{"name":"api","lockfileVersion":3}\n',
  'src/server.js': 'const express = require("express");\nexpress().listen(3000);\n',
};

const ANDROID: Record<string, string> = {
  '.gitignore': '.gradle/\nbuild/\nlocal.properties\n',
  'settings.gradle': 'rootProject.name = "MiApp"\ninclude ":app"\n',
  'build.gradle': 'plugins {\n  id "com.android.application" version "8.5.0" apply false\n}\n',
  'app/build.gradle': 'plugins {\n  id "com.android.application"\n}\nandroid { namespace "com.ejemplo.miapp" }\n',
  'app/src/main/AndroidManifest.xml': '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n  <application android:label="MiApp" />\n</manifest>\n',
  'app/src/main/java/com/ejemplo/miapp/MainActivity.kt': 'package com.ejemplo.miapp\nclass MainActivity\n',
};

const IOS: Record<string, string> = {
  '.gitignore': 'xcuserdata/\nPods/\n',
  'MiApp.xcodeproj/project.pbxproj': '// !$*UTF8*$!\n{\n  buildSettings = {\n    SDKROOT = iphoneos;\n    TARGETED_DEVICE_FAMILY = "1,2";\n  };\n}\n',
  'MiApp/AppDelegate.swift': 'import UIKit\n@main class AppDelegate: UIResponder, UIApplicationDelegate {}\n',
  'MiApp/Info.plist': '<?xml version="1.0"?><plist version="1.0"><dict/></plist>\n',
};

const FLUTTER: Record<string, string> = {
  '.gitignore': '.dart_tool/\nbuild/\n',
  'pubspec.yaml': 'name: mi_app\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n',
  'pubspec.lock': 'packages: {}\n',
  'lib/main.dart': 'import "package:flutter/material.dart";\nvoid main() => runApp(const SizedBox());\n',
  'android/app/build.gradle': 'plugins {\n  id "com.android.application"\n  id "dev.flutter.flutter-gradle-plugin"\n}\n',
  'android/app/src/main/AndroidManifest.xml': '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application/></manifest>\n',
  'ios/Runner.xcodeproj/project.pbxproj': '{\n  buildSettings = { SDKROOT = iphoneos; };\n}\n',
  'ios/Runner/AppDelegate.swift': 'import Flutter\n',
};

const REACT_NATIVE: Record<string, string> = {
  ...GITIGNORE,
  'package.json': '{"name":"MiApp","version":"0.0.1","private":true,"dependencies":{"react":"18.3.1","react-native":"0.75.0"}}\n',
  'package-lock.json': '{"name":"MiApp","lockfileVersion":3}\n',
  'index.js': 'import { AppRegistry } from "react-native";\n',
  'metro.config.js': 'const { getDefaultConfig } = require("@react-native/metro-config");\nmodule.exports = getDefaultConfig(__dirname);\n',
  'android/app/build.gradle': 'apply plugin: "com.android.application"\napply plugin: "com.facebook.react"\n',
  'android/app/src/main/AndroidManifest.xml': '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application/></manifest>\n',
  'ios/MiApp.xcodeproj/project.pbxproj': '{\n  buildSettings = { SDKROOT = iphoneos; };\n}\n',
};

const CLI: Record<string, string> = {
  ...GITIGNORE,
  'package.json': '{"name":"mi-cli","version":"1.0.0","bin":{"mi-cli":"bin/cli.js"},"dependencies":{}}\n',
  'package-lock.json': '{"name":"mi-cli","lockfileVersion":3}\n',
  'bin/cli.js': '#!/usr/bin/env node\nconsole.log("hola");\n',
};

const LIBRERIA: Record<string, string> = {
  ...GITIGNORE,
  'package.json': '{"name":"mi-lib","version":"1.0.0","exports":{".":"./src/index.js"},"peerDependencies":{}}\n',
  'package-lock.json': '{"name":"mi-lib","lockfileVersion":3}\n',
  'src/index.js': 'export const suma = (a, b) => a + b;\n',
};

function ids(informe: InformeDeploy): string[] {
  return informe.aplicaciones.map((a) => a.id).sort();
}

function marcadorDe(informe: InformeDeploy, id: string): string[] {
  return (informe.aplicaciones.find((a) => a.id === id)?.marcadores ?? []).map((m) => m.fichero);
}

// ---------------------------------------------------------------------
// Deteccion, una fixture por tipo
// ---------------------------------------------------------------------

test('web: vite.config.ts lo decide; sin cli, api ni libreria', async () => {
  await conRepo(WEB, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['web']);
    assert.deepEqual(marcadorDe(j, 'web'), ['vite.config.ts']);
    assert.equal(j.version, 3);
  });
});

test('api: package.json con express', async () => {
  await conRepo(API, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['api']);
    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'package.json', contiene: '"express"' }]);
  });
});

test('android nativo: app/build.gradle con com.android.application y el manifiesto a 3 carpetas', async () => {
  await conRepo(ANDROID, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['android']);
    const m = marcadorDe(j, 'android');
    assert.ok(m.includes('app/build.gradle'), m.join(', '));
    assert.ok(m.includes('app/src/main/AndroidManifest.xml'), m.join(', '));
  });
});

test('ios: project.pbxproj con SDKROOT = iphoneos', async () => {
  await conRepo(IOS, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['ios']);
    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'MiApp.xcodeproj/project.pbxproj', contiene: 'iphoneos' }]);
  });
});

test('flutter: pubspec.yaml con sdk: flutter (y sus carpetas android e ios)', async () => {
  await conRepo(FLUTTER, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['android', 'flutter', 'ios']);
    assert.deepEqual(marcadorDe(j, 'flutter'), ['pubspec.yaml']);
    // El manifiesto de android/app/src/main/ esta a 4 carpetas: no es lo que detecta Android.
    assert.deepEqual(marcadorDe(j, 'android'), ['android/app/build.gradle']);
  });
});

test('react native: package.json con react-native, con la estructura real (manifiesto a 4 carpetas)', async () => {
  await conRepo(REACT_NATIVE, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['android', 'ios', 'react-native']);
    assert.deepEqual(marcadorDe(j, 'react-native'), ['metro.config.js', 'package.json']);
    assert.ok(!marcadorDe(j, 'android').includes('android/app/src/main/AndroidManifest.xml'));
  });
});

test('react native sin carpeta android ni ios: se detecta igual por su manifiesto de raiz', async () => {
  const soloRaiz = Object.fromEntries(Object.entries(REACT_NATIVE).filter(([k]) => !k.startsWith('android/') && !k.startsWith('ios/')));
  await conRepo(soloRaiz, async (raiz, op) => {
    assert.deepEqual(ids(analisis(raiz, op)), ['react-native']);
  });
});

test('cli: package.json con "bin"; no sale libreria, api ni react-native', async () => {
  await conRepo(CLI, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['cli']);
    assert.deepEqual(j.aplicaciones[0]?.marcadores, [{ fichero: 'package.json', contiene: '"bin"' }]);
  });
});

test('libreria: package.json con "exports"', async () => {
  await conRepo(LIBRERIA, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['libreria']);
    assert.deepEqual(marcadorDe(j, 'libreria'), ['package.json']);
  });
});

// ---------------------------------------------------------------------
// Negativos
// ---------------------------------------------------------------------

test('negativo: un package.json sin bin ni react-native no sale cli ni react-native (ni ningun tipo)', async () => {
  await conRepo(NODE, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), []);
    assert.deepEqual(j.tipos.map((t) => t.id).sort(), ['node', 'npm']);
  });
});

test('negativo: pubspec.yaml de un paquete Dart sin flutter, y build.gradle de Java sin Android', async () => {
  await conRepo(
    {
      'pubspec.yaml': 'name: utilidades\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  path: ^1.9.0\n',
      'build.gradle': 'plugins {\n  id "java-library"\n}\n',
      'lib/utilidades.dart': 'int suma(int a, int b) => a + b;\n',
    },
    async (raiz, op) => {
      assert.deepEqual(ids(analisis(raiz, op)), []);
    }
  );
});

test('negativo: la palabra en otro fichero que no es marcador no cuenta (README con "bin" y react-native)', async () => {
  await conRepo({ ...NODE, 'README.md': 'Instala con "bin" y usa "react-native" o "express".\n' }, async (raiz, op) => {
    assert.deepEqual(ids(analisis(raiz, op)), []);
  });
});

test('negativo: un marcador mas hondo que 3 carpetas no cuenta', async () => {
  await conRepo({ ...NODE, 'a/b/c/d/package.json': '{"bin":{"x":"x.js"}}\n' }, async (raiz, op) => {
    assert.deepEqual(ids(analisis(raiz, op)), []);
  });
});

// ---------------------------------------------------------------------
// Criterio 2: NO APLICA por tipo de aplicacion
// ---------------------------------------------------------------------

for (const [nombre, fixture, tipo] of [
  ['libreria', LIBRERIA, 'libreria'],
  ['CLI', CLI, 'cli'],
] as const) {
  test(`criterio 2: en una ${nombre}, los seis puntos salen no-aplica con un motivo que nombra el tipo`, async () => {
    await conRepo(fixture, async (raiz, op) => {
      const j = analisis(raiz, op);
      for (const id of SEIS) {
        const p = punto(j, id);
        assert.equal(p.estado, 'no-aplica', `${id}: ${p.estado} (${p.motivo})`);
        assert.match(p.motivo, new RegExp(`aplicacion detectada: ${tipo} \\(por package\\.json contiene "`), `${id}: ${p.motivo}`);
      }
      // Un punto que no depende del tipo de aplicacion sigue aplicando.
      assert.notEqual(punto(j, 'auth-en-servidor').estado, 'no-aplica');
      assert.notEqual(punto(j, 'secretos-en-arbol').estado, 'no-aplica');
    });
  });
}

for (const [nombre, fixture] of [
  ['web', WEB],
  ['sin tipo de aplicacion detectado', NODE],
] as const) {
  test(`criterio 2: en una fixture ${nombre}, ninguno de los seis sale no-aplica`, async () => {
    await conRepo(fixture, async (raiz, op) => {
      const j = analisis(raiz, op);
      for (const id of SEIS) {
        const p = punto(j, id);
        assert.notEqual(p.estado, 'no-aplica', `${id}: ${p.motivo}`);
      }
    });
  });
}

test('un tipo movil no apaga los puntos de servicio (solo cli o libreria lo hacen)', async () => {
  await conRepo(REACT_NATIVE, async (raiz, op) => {
    const j = analisis(raiz, op);
    for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
  });
});

test('dentro del eje basta con uno: un repo con marcadores de cli y de web aplica', async () => {
  await conRepo({ ...CLI, 'vite.config.ts': 'export default {};\n' }, async (raiz, op) => {
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['cli', 'web']);
    for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
  });
});

test('cli y api a la vez (un servidor express con bin) aplica', async () => {
  await conRepo(
    { ...API, 'package.json': '{"name":"srv","bin":{"srv":"src/server.js"},"dependencies":{"express":"^4.19.0"}}\n' },
    async (raiz, op) => {
      const j = analisis(raiz, op);
      assert.deepEqual(ids(j), ['api', 'cli']);
      for (const id of SEIS) assert.notEqual(punto(j, id).estado, 'no-aplica', id);
    }
  );
});

// ---------------------------------------------------------------------
// Interseccion de los dos ejes
// ---------------------------------------------------------------------

const CAPA_INTERSECCION =
  'punto_1_id: solo-rust-cli\npunto_1_severidad: baja\npunto_1_tipos: [rust]\npunto_1_aplicaciones: [cli]\n' +
  'punto_1_metodo: juicio\npunto_1_arreglo: Arreglo largo\npunto_1_descripcion: Descripcion larga\n' +
  'punto_2_id: node-cli\npunto_2_severidad: baja\npunto_2_tipos: [node]\npunto_2_aplicaciones: [cli]\n' +
  'punto_2_metodo: juicio\npunto_2_arreglo: Arreglo largo\npunto_2_descripcion: Descripcion larga\n' +
  'punto_3_id: node-sin-eje-app\npunto_3_severidad: baja\npunto_3_tipos: [node]\n' +
  'punto_3_metodo: juicio\npunto_3_arreglo: Arreglo largo\npunto_3_descripcion: Descripcion larga\n';

test('interseccion: los ejes se combinan con Y (lenguaje Y aplicacion)', async () => {
  await conRepo({ ...CLI, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
    const j = analisis(raiz, op);
    // Aplicacion si (cli), lenguaje no (no hay rust): NO APLICA por el lenguaje.
    const rustCli = punto(j, 'solo-rust-cli');
    assert.equal(rustCli.estado, 'no-aplica');
    assert.match(rustCli.motivo, /solo aplica a rust/);
    // Los dos ejes casan: aplica (de juicio, sale NO VERIFICADO).
    assert.equal(punto(j, 'node-cli').estado, 'no-verificado');
    assert.equal(punto(j, 'node-sin-eje-app').estado, 'no-verificado');
  });
  await conRepo({ ...LIBRERIA, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
    const j = analisis(raiz, op);
    // Lenguaje si (node), aplicacion no (libreria): NO APLICA por la aplicacion.
    const nodeCli = punto(j, 'node-cli');
    assert.equal(nodeCli.estado, 'no-aplica');
    assert.match(nodeCli.motivo, /solo aplica a aplicaciones de tipo cli; aplicacion detectada: libreria/);
    // Sin campo aplicaciones, el eje no lo toca.
    assert.equal(punto(j, 'node-sin-eje-app').estado, 'no-verificado');
  });
  await conRepo({ ...NODE, '.taskcode/doctor-deploy.yml': CAPA_INTERSECCION }, async (raiz, op) => {
    // Sin tipo de aplicacion detectado, el eje de aplicacion no apaga nada.
    assert.equal(punto(analisis(raiz, op), 'node-cli').estado, 'no-verificado');
  });
});

const PUNTO_BASE: PuntoCatalogo = {
  id: 'p',
  severidad: 'media',
  tipos: ['todos'],
  aplicaciones: ['web', 'api'],
  metodo: 'juicio',
  sonda: null,
  arreglo: 'a',
  descripcion: 'd',
  referencia: null,
  origen: 'plugin',
};

const app = (id: string, fichero = 'package.json', contiene: string | null = null): AplicacionDetectada => ({
  id,
  nombre: id,
  rutas: ['.'],
  marcadores: [{ fichero, contiene }],
});

test('motivoNoAplicaPorAplicacion: tabla de la regla', () => {
  // Sin deteccion: aplica.
  assert.equal(motivoNoAplicaPorAplicacion(PUNTO_BASE, []), null);
  // Punto sin campo: aplica a todo.
  assert.equal(motivoNoAplicaPorAplicacion({ ...PUNTO_BASE, aplicaciones: null }, [app('cli')]), null);
  // Alguno de los detectados esta en la lista: aplica.
  assert.equal(motivoNoAplicaPorAplicacion(PUNTO_BASE, [app('cli'), app('api')]), null);
  // Ninguno esta: NO APLICA, con cada tipo y su marcador.
  const m = motivoNoAplicaPorAplicacion(PUNTO_BASE, [app('cli', 'package.json', '"bin"'), app('libreria', 'Cargo.toml', '[lib]')]);
  assert.equal(m, 'solo aplica a aplicaciones de tipo web o api; aplicacion detectada: cli (por package.json contiene "bin"), libreria (por Cargo.toml contiene "[lib]")');
});

// ---------------------------------------------------------------------
// Salidas: texto, informe en Markdown y JSON
// ---------------------------------------------------------------------

test('la salida de texto y el informe dicen la aplicacion detectada y su marcador', async () => {
  await conRepo(CLI, async (raiz, op) => {
    const texto = ejecutar(raiz, op, []).salida;
    assert.match(texto, /^Aplicacion detectada: Herramienta de linea de comandos \[cli\] \(package\.json contiene "bin"\)$/m);
    const r = ejecutar(raiz, op, ['--escribir']);
    const md = await readFile(r.rutaInforme as string, 'utf8');
    assert.match(md, /^- Aplicacion detectada: Herramienta de linea de comandos \[cli\] \(package\.json contiene "bin"\)$/m);
    const j = JSON.parse(await readFile(r.rutaJson as string, 'utf8')) as InformeDeploy;
    assert.equal(j.version, 3);
    assert.deepEqual(j.aplicaciones.map((a) => a.id), ['cli']);
  });
});

test('sin tipo de aplicacion, el texto lo dice y que los puntos aplican', async () => {
  await conRepo(NODE, async (raiz, op) => {
    assert.match(ejecutar(raiz, op, []).salida, /^Aplicacion detectada: ninguna \(.*aplican\)$/m);
  });
});

test('un fichero marcador sin versionar (no ignorado) tambien cuenta, como en los tipos', async () => {
  await conRepo(NODE, async (raiz, op) => {
    await escribir(raiz, { 'herramienta/package.json': '{"bin":"cli.js"}\n' });
    const j = analisis(raiz, op);
    assert.deepEqual(ids(j), ['cli']);
    assert.deepEqual(j.aplicaciones[0]?.rutas, ['herramienta']);
    await commit(raiz, 'herramienta');
  });
});
