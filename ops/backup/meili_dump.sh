#!/usr/bin/env bash
set -euo pipefail
: "${MEILI_HOST:?}"
: "${MEILI_API_KEY:?}"
STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
FILE="meili-dump-${STAMP}.tar.gz"

echo "[1/3] Creating Meilisearch dump..."
DUMP_RESPONSE=$(curl -fsSL -X POST "${MEILI_HOST}/dumps" \
  -H "Authorization: Bearer ${MEILI_API_KEY}" \
  -H "Content-Type: application/json")

DUMP_UID=$(echo "$DUMP_RESPONSE" | jq -r '.taskUid')

if [[ "$DUMP_UID" == "null" || -z "$DUMP_UID" ]]; then
  echo "Failed to create dump: $DUMP_RESPONSE"
  exit 1
fi

echo "[2/3] Waiting for dump to complete..."
while true; do
  STATUS_RESPONSE=$(curl -fsSL "${MEILI_HOST}/tasks/${DUMP_UID}" \
    -H "Authorization: Bearer ${MEILI_API_KEY}")
  
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  
  if [[ "$STATUS" == "succeeded" ]]; then
    echo "Dump completed successfully"
    break
  elif [[ "$STATUS" == "failed" ]]; then
    echo "Dump failed: $STATUS_RESPONSE"
    exit 1
  fi
  
  echo "Dump status: $STATUS, waiting..."
  sleep 5
done

echo "[3/3] Downloading dump..."
curl -fsSL "${MEILI_HOST}/dumps/${DUMP_UID}/download" \
  -H "Authorization: Bearer ${MEILI_API_KEY}" \
  -o "$FILE"

echo "Meilisearch dump saved to: $FILE"
