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
	sed -e 's/f //g' \
		-e 's/ /,/g' \
		-e 's/\/[0-9]*\/[0-9]*//g' \
		-e 's/^/[/g' \
		-e 's/$/]/g' \
		-e '$s/,$//' |
	tr -d '\r' |
	tr '\n' ',' |
	sed 's/,$//'
)";
norm="$(
	egrep '^vn ' "$f1" |
	sed -e 's/vn //g' -e 's/ /,/g' |
	tr -d '\r' |
	tr '\n' ',' |
	sed 's/,$//'
)";
echo "{" > "$f2";
echo "\"verts\":[$verts]," >> "$f2";
echo "\"faces\":[$faces]," >> "$f2";
echo "\"norms\":[$norm]" >> "$f2";
echo "}" >> "$f2";
