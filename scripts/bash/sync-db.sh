#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
Usage: scripts/bash/sync-db.sh [--yes] [--no-backup] [SOURCE_URL] [TARGET_URL]

Replaces the public schema of TARGET with an exact copy of SOURCE (tables, types and data).
Everything currently in TARGET's public schema is deleted.

SOURCE_URL  defaults to \$SOURCE_DATABASE_URL, then \$DATABASE_URL
TARGET_URL  defaults to \$TARGET_DATABASE_URL
Variables are also read from .env in the project root.

  --yes        skip the confirmation prompt
  --no-backup  skip backing up TARGET to backups/ before overwriting it
  -h, --help   show this help
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSUME_YES=false
BACKUP=true
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) ASSUME_YES=true ;;
    --no-backup) BACKUP=false ;;
    -h | --help) usage; exit 0 ;;
    -*) usage >&2; die "unknown option $1" ;;
    *) POSITIONAL+=("$1") ;;
  esac
  shift
done

[[ ${#POSITIONAL[@]} -le 2 ]] || { usage >&2; die "expected at most two URLs"; }

load_env() {
  local line key value

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$ ]] || continue

    key="${BASH_REMATCH[2]}"
    value="${BASH_REMATCH[3]}"

    if [[ "$value" =~ ^\"(.*)\"[[:space:]]*$ || "$value" =~ ^\'(.*)\'[[:space:]]*$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi

    [[ -n "${!key+set}" ]] || export "$key=$value"
  done <"$1"
}

[[ -f "$ROOT/.env" ]] && load_env "$ROOT/.env"

SOURCE="${POSITIONAL[0]:-${SOURCE_DATABASE_URL:-${DATABASE_URL:-}}}"
TARGET="${POSITIONAL[1]:-${TARGET_DATABASE_URL:-}}"

[[ -n "$SOURCE" ]] || die "no source database, pass SOURCE_URL or set SOURCE_DATABASE_URL / DATABASE_URL"
[[ -n "$TARGET" ]] || die "no target database, pass TARGET_URL or set TARGET_DATABASE_URL"

for tool in pg_dump pg_restore psql; do
  command -v "$tool" >/dev/null || die "$tool not found, install the PostgreSQL client tools"
done

clean_url() {
  local url="$1" base query kept="" param
  local -a params=()

  base="${url%%\?*}"

  if [[ "$url" == *\?* ]]; then
    query="${url#*\?}"
    if [[ -n "$query" ]]; then
      IFS='&' read -ra params <<<"$query"
      for param in "${params[@]}"; do
        [[ "$param" == *=* ]] && kept="${kept:+$kept&}$param"
      done
    fi
  fi

  if [[ "$base" == *-pooler.*neon.tech* ]]; then
    echo "note: using Neon's direct host instead of its pooler for dump/restore" >&2
    base="${base/-pooler./.}"
  fi

  echo "${base}${kept:+?$kept}"
}

describe() {
  echo "$1" | sed -E 's#^[a-z]+://([^@]*@)?([^/?]+)/?([^?]*).*#\3 on \2#'
}

query() {
  psql -X -A -t -q -v ON_ERROR_STOP=1 -d "$1" -c "$2"
}

SOURCE="$(clean_url "$SOURCE")"
TARGET="$(clean_url "$TARGET")"

[[ "$SOURCE" != "$TARGET" ]] || die "source and target are the same database"

SOURCE_INFO="$(query "$SOURCE" "select current_setting('server_version_num')::int / 10000, (select count(*) from information_schema.tables where table_schema = 'public')")" ||
  die "cannot connect to source ($(describe "$SOURCE"))"
TARGET_INFO="$(query "$TARGET" "select current_database(), (select count(*) from information_schema.tables where table_schema = 'public')")" ||
  die "cannot connect to target ($(describe "$TARGET"))"

SOURCE_MAJOR="${SOURCE_INFO%%|*}"
SOURCE_TABLES="${SOURCE_INFO##*|}"
TARGET_DB="${TARGET_INFO%%|*}"
TARGET_TABLES="${TARGET_INFO##*|}"
CLIENT_MAJOR="$(pg_dump --version | grep -oE '[0-9]+' | head -1)"

[[ "$CLIENT_MAJOR" -ge "$SOURCE_MAJOR" ]] ||
  die "pg_dump $CLIENT_MAJOR is older than the source server ($SOURCE_MAJOR), install PostgreSQL $SOURCE_MAJOR client tools"

echo "source: $(describe "$SOURCE") ($SOURCE_TABLES tables)"
echo "target: $(describe "$TARGET") ($TARGET_TABLES tables, all will be replaced)"

if [[ "$ASSUME_YES" != true ]]; then
  read -r -p "Type the target database name ($TARGET_DB) to continue: " answer
  [[ "$answer" == "$TARGET_DB" ]] || die "confirmation did not match, nothing was changed"
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

if [[ "$BACKUP" == true ]]; then
  mkdir -p "$ROOT/backups"
  BACKUP_FILE="$ROOT/backups/${TARGET_DB}-$(date +%Y%m%d-%H%M%S).dump"
  echo "backing up target to ${BACKUP_FILE#"$ROOT"/}"
  pg_dump --format=custom --no-owner --no-privileges --file="$BACKUP_FILE" "$TARGET"
fi

echo "dumping source"
pg_dump --format=custom --schema=public --no-owner --no-privileges --file="$WORK_DIR/source.dump" "$SOURCE"

echo "replacing target public schema"
{
  echo "SET client_min_messages = warning;"
  echo "DROP SCHEMA IF EXISTS public CASCADE;"
  echo "CREATE SCHEMA public;"
  pg_restore --no-owner --no-privileges --file=- "$WORK_DIR/source.dump" | grep -vE '^CREATE SCHEMA public;$'
} | psql -X -q -v ON_ERROR_STOP=1 --single-transaction -d "$TARGET" -f - >/dev/null

echo "done: target now has $(query "$TARGET" "select count(*) from information_schema.tables where table_schema = 'public'") tables"
[[ "$BACKUP" == true ]] && echo "restore the previous target with: pg_restore --clean --if-exists --no-owner -d <TARGET_URL> ${BACKUP_FILE#"$ROOT"/}"
exit 0
