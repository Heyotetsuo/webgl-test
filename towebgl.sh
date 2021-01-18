#!/usr/bin/env bash

if [ -z "$1" ];
then
	echo "Not enough arguments.";
	echo "Usage: ./towebgl.sh [file]";
	exit;
fi;

f1="$1";
f2="$( sed 's/\.obj$/.json/' <<< "$f1" )";
verts="$(
	egrep '^v ' "$f1" |
	sed -e 's/v //g' -e 's/ /,/g' |
	tr -d '\r' |
	tr '\n' ',' |
	sed 's/,$//'
)";
faces="$(
	egrep '^f ' "$f1" |
	sed -e 's/f //g' -e 's/ /,/g' |
	sed 's/\/[0-9]*\/[0-9]*//g' |
	tr -d '\r' |
	tr '\n' ',' |
	sed 's/,$//'
)";
echo "{" > "$f2";
echo "\"verts\":[$verts]," >> "$f2";
echo "\"faces\":[$faces]" >> "$f2";
echo "}" >> "$f2";
