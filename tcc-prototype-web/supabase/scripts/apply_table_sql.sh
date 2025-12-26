#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 [schema.]table_name" >&2
  exit 1
fi

TABLE="$1"
OUT=\"supabase/sql/${TABLE}.sql\"
if [ ! -f "${OUT}" ]; then
  echo "File not found: ${OUT}" >&2
  exit 1
fi

# Load environment variables from project .env (if present)
if [ -f ../../.env ]; then
  # shellcheck disable=SC1091
  set -a
  . ../../.env
  set +a
fi

# load DATABASE_URL from supabase/.env if present (overrides project .env)
if [ -f ../.env ]; then
  # shellcheck disable=SC1091
  set -a
  . ../.env
  set +a
fi

if [ -n "${DATABASE_URL-}" ]; then
  echo "Applying ${OUT} to database (using DATABASE_URL from environment)..."
  # Do not print DATABASE_URL to avoid leaking secrets in logs
  psql "${DATABASE_URL}" -f "${OUT}"
  echo "Done."
else
  # If DATABASE_URL not set, try to use SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY via supabase CLI
  if [ -n "${SUPABASE_URL-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY-}" ]; then
    if command -v supabase >/dev/null 2>&1; then
      # extract project ref from SUPABASE_URL (subdomain before .supabase.co)
      # e.g. https://uomoyowfbfvpgwqvqwqm.supabase.co -> uomoyowfbfvpgwqvqwqm
      PROJECT_REF=$(echo "${SUPABASE_URL}" | sed -E 's#https?://([^./]+)\..*#\1#')
      if [ -z "${PROJECT_REF}" ]; then
        echo "Failed to extract project ref from SUPABASE_URL (${SUPABASE_URL})." >&2
        exit 1
      fi

      echo "Applying ${OUT} using Supabase CLI (project: ${PROJECT_REF})."
      # Run supabase commands with SUPABASE_ACCESS_TOKEN set to the service role key for this process only
      SUPABASE_ACCESS_TOKEN="${SUPABASE_SERVICE_ROLE_KEY}" supabase db remote set "${PROJECT_REF}"
      SUPABASE_ACCESS_TOKEN="${SUPABASE_SERVICE_ROLE_KEY}" supabase db push --file "../../${OUT}"
      echo "Done."
      exit 0
    else
      echo "DATABASE_URL not set and Supabase CLI not found." >&2
      echo "Install the Supabase CLI (https://supabase.com/docs/guides/cli) or set DATABASE_URL in .env." >&2
      exit 1
    fi
  else
    echo "DATABASE_URL not set. To apply the SQL you can either:" >&2
    echo "  - set DATABASE_URL in .env (postgres connection string) and rerun this script" >&2
    echo "  - or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env and install the Supabase CLI to push the SQL" >&2
    echo "      supabase db remote set <PROJECT_REF>" >&2
    echo "      supabase db push --file ${OUT}" >&2
    echo "Note: this script does not embed or print secrets; set them in your local .env files." >&2
    exit 1
  fi
fi
