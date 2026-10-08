#!/usr/bin/env bash
# Sonda de `taskctl doctor`: comprueba que ESTE bash puede ejecutar un script
# de Git-Flow de verdad, es decir, que encuentra las herramientas que esos
# scripts usan (mktemp, dirname, grep, sed, tr, wc, git). No toca el repo ni
# escribe fuera de un directorio temporal propio, que borra al salir.
# Imprime "taskctl-sonda-ok <version de bash>" solo si todo funciono.
set -e
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
fichero="$tmp/sonda.txt"
printf 'alfa\nbeta\n' > "$fichero"
[ "$(dirname "$fichero")" = "$tmp" ]
grep -q '^beta$' "$fichero"
[ "$(sed -n '1p' "$fichero" | tr 'a-z' 'A-Z')" = "ALFA" ]
[ "$(wc -l < "$fichero" | tr -d ' ')" = "2" ]
git --version > /dev/null
echo "taskctl-sonda-ok ${BASH_VERSION}"
