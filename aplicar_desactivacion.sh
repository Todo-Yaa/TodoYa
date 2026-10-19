#!/usr/bin/env bash
set -euo pipefail
if [[ ! -f "src/app/_layout.tsx" || ! -d "src/app/api" ]]; then
  echo "ERROR: Ejecuta desde la raíz de Todo_ya-" >&2
  exit 1
fi
mkdir -p legacy-disabled/expo-api
count=0
files=(
  src/app/api/reports+api.ts
  src/app/api/applications+api.ts
  src/app/api/chat+api.ts
  src/app/api/db-status+api.ts
  src/app/api/matching+api.ts
  src/app/api/orders+api.ts
  src/app/api/ratings+api.ts
  src/app/api/seed+api.ts
  src/app/api/sync+api.ts
  src/app/api/veripagos+api.ts
  src/app/api/wallet+api.ts
)
for f in "${files[@]}"; do
  if [[ -f "$f" ]]; then
    target="legacy-disabled/expo-api/${f##*/}.disabled.txt"
    if [[ -e "$target" ]]; then
      echo "ERROR: Ya existe el respaldo $target; no se sobrescribe." >&2
      exit 1
    fi
    mv -- "$f" "$target"
    echo "Archivado: $f -> $target"
    count=$((count+1))
  else
    echo "Omitido (no existe): $f"
  fi
done
echo "Total archivados: $count. Reinicia Expo y ejecuta npx tsc --noEmit."
