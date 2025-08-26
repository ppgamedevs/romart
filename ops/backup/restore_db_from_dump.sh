#!/usr/bin/env bash
set -euo pipefail
DUMP_FILE="${1:?Usage: restore_db_from_dump.sh <path-to-dump[.age|.xz|.dump]>}"
TARGET_URL="${2:?Usage: … <target-postgres-url>}"

TMP="$DUMP_FILE"
if [[ "$DUMP_FILE" == *.age ]]; then
  : "${AGE_KEY_FILE:?Missing AGE_KEY_FILE (private key)}"
  echo "[1/3] age decrypt…"
  TMP="${DUMP_FILE%.age}"
  age -d -i "$AGE_KEY_FILE" -o "$TMP" "$DUMP_FILE"
fi

echo "[2/3] pg_restore to $TARGET_URL"
pg_restore --no-owner --clean --if-exists --dbname="$TARGET_URL" "$TMP"

echo "[3/3] done."
