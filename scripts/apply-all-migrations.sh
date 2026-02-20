#!/usr/bin/env bash
# apply-all-migrations.sh
#
# Applies all migration files to the Cloudflare D1 database safely.
# Migrations that have already been applied (e.g. ALTER TABLE ADD COLUMN
# on a column that already exists) will produce an error that is caught
# and reported as a warning -- the script continues to the next file.
#
# Usage (production remote DB):
#   bash scripts/apply-all-migrations.sh
#
# Usage (local dev DB):
#   bash scripts/apply-all-migrations.sh --local
#
# Environment variables:
#   CLOUDFLARE_API_TOKEN  – required for remote (set via CI secret or `wrangler login`)
#   CLOUDFLARE_ACCOUNT_ID – required for remote (set via CI secret or wrangler.toml)

set -euo pipefail

DATABASE_NAME="sistema"
LOCAL_FLAG=""
if [[ "${1:-}" == "--local" ]]; then
  LOCAL_FLAG="--local"
  echo "ℹ️  Running against LOCAL database"
else
  echo "ℹ️  Running against REMOTE (production) database"
fi

MIGRATION_DIR="$(cd "$(dirname "$0")/.." && pwd)/migrations"
ERRORS=0
APPLIED=0
SKIPPED=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Applying migrations to D1 database: ${DATABASE_NAME}"
echo "  Directory: ${MIGRATION_DIR}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for FILE in "${MIGRATION_DIR}"/[0-9][0-9][0-9]_*.sql; do
  NAME=$(basename "$FILE")
  printf "📁 %-55s " "$NAME"

  OUTPUT=$(npx wrangler d1 execute "${DATABASE_NAME}" "${LOCAL_FLAG}" --file="${FILE}" 2>&1) && STATUS=$? || STATUS=$?

  if [[ $STATUS -eq 0 ]]; then
    echo "✅ applied"
    APPLIED=$((APPLIED + 1))
  else
    # Check if the error is "column already exists" or "table already exists" — safe to skip
    if echo "$OUTPUT" | grep -qiE "duplicate column|already exists|table.*already"; then
      echo "⚠️  skipped (already applied)"
      SKIPPED=$((SKIPPED + 1))
    else
      echo "❌ ERROR"
      echo "   $OUTPUT"
      ERRORS=$((ERRORS + 1))
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Applied : ${APPLIED}"
echo "  ⚠️  Skipped : ${SKIPPED}  (already applied)"
echo "  ❌ Errors  : ${ERRORS}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [[ $ERRORS -gt 0 ]]; then
  echo "Some migrations failed. Check the output above for details."
  exit 1
fi

echo "All migrations applied successfully!"
