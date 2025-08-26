#!/usr/bin/env bash
set -euo pipefail
TARGET_URL="${1:?Usage: verify_restore.sh <target-postgres-url>}"

echo "[1/3] Checking database connectivity..."
psql "$TARGET_URL" -c "SELECT version();" > /dev/null

echo "[2/3] Verifying key tables..."
TABLES=("User" "Artwork" "Order" "Artist" "Shipment" "Payment" "Notification" "CuratorBadge")

for table in "${TABLES[@]}"; do
  COUNT=$(psql "$TARGET_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" | tr -d ' ')
  echo "  ✓ $table: $COUNT records"
done

echo "[3/3] Checking data integrity..."
# Check for orphaned records
ORPHANED_ORDERS=$(psql "$TARGET_URL" -t -c "SELECT COUNT(*) FROM \"Order\" o LEFT JOIN \"User\" u ON o.buyerId = u.id WHERE u.id IS NULL;" | tr -d ' ')
ORPHANED_ARTWORKS=$(psql "$TARGET_URL" -t -c "SELECT COUNT(*) FROM \"Artwork\" a LEFT JOIN \"Artist\" ar ON a.artistId = ar.id WHERE ar.id IS NULL;" | tr -d ' ')

if [[ "$ORPHANED_ORDERS" -gt 0 ]]; then
  echo "  ⚠️  Found $ORPHANED_ORDERS orphaned orders"
else
  echo "  ✓ No orphaned orders"
fi

if [[ "$ORPHANED_ARTWORKS" -gt 0 ]]; then
  echo "  ⚠️  Found $ORPHANED_ARTWORKS orphaned artworks"
else
  echo "  ✓ No orphaned artworks"
fi

echo "✅ Database restore verification complete"
