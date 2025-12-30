#!/usr/bin/env bash
set -euo pipefail

# Carregar variáveis do .env do supabase
if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

# Verificar se as variáveis estão definidas
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo "ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas em supabase/.env" >&2
    exit 1
fi

# Arquivo SQL a aplicar
SQL_FILE="${1:-../../supabase/sql/pomodoro/create_pomodoros.sql}"

if [ ! -f "$SQL_FILE" ]; then
    echo "ERRO: arquivo não encontrado: $SQL_FILE" >&2
    exit 1
fi

echo "📝 Lendo arquivo SQL: $SQL_FILE"
echo "🌐 Supabase URL: $SUPABASE_URL"

# Codificar SQL em base64
SQL_B64=$(base64 < "$SQL_FILE" | tr -d '\n')

# Preparar payload JSON
PAYLOAD=$(cat <<EOF
{
  "p_b64": "$SQL_B64"
}
EOF
)

echo "🚀 Aplicando migration..."

# Fazer requisição via curl
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  "$SUPABASE_URL/rest/v1/rpc/run_sql_script_b64" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Extrair status HTTP
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Status HTTP: $HTTP_STATUS"

if [ "$HTTP_STATUS" -ge 400 ]; then
    echo "❌ ERRO: Falha ao aplicar migration"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 1
else
    echo "✅ Migration aplicada com sucesso!"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
fi
