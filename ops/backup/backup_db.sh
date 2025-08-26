#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Missing DATABASE_URL}"
: "${BACKUP_BUCKET:?Missing BACKUP_BUCKET}"
: "${R2_ENDPOINT:?Missing R2_ENDPOINT}"
: "${R2_ACCESS_KEY_ID:?Missing R2_ACCESS_KEY_ID}"
: "${R2_SECRET_ACCESS_KEY:?Missing R2_SECRET_ACCESS_KEY}"

STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
NAME="romart-db-${STAMP}.dump.xz"
TMP="tmp-${NAME}"
OUT="${TMP}"

echo "[1/4] pg_dump…"
# custom format (-Fc) e mai rapid la restore cu pg_restore
pg_dump --no-owner --format=custom "$DATABASE_URL" | xz -z -T0 -9 -c > "${TMP}"

if [[ -n "${AGE_RECIPIENT:-}" ]]; then
  echo "[2/4] age encrypt…"
  age -r "$AGE_RECIPIENT" -o "${TMP}.age" "${TMP}"
  rm -f "${TMP}"
  OUT="${TMP}.age"
fi

KEY="${BACKUP_PREFIX:-db/}${NAME}${AGE_RECIPIENT:+.age}"

echo "[3/4] upload to R2 s3://${BACKUP_BUCKET}/${KEY}"
AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${OUT}" "s3://${BACKUP_BUCKET}/${KEY}" --endpoint-url "${R2_ENDPOINT}" --only-show-errors

echo "[4/4] done → ${KEY}"
rm -f "${TMP}" "${TMP}.age" || true
