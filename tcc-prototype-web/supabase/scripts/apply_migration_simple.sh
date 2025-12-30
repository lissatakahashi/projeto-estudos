#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Ler variáveis do .env
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d '=' -f2-)
SUPABASE_SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d '=' -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "ERRO: Variáveis não encontradas em supabase/.env" >&2
    exit 1
fi

SQL_FILE="$1"
if [ ! -f "$SQL_FILE" ]; then
    echo "ERRO: Arquivo not found: $SQL_FILE" >&2
    exit 1
fi

echo "📝 Aplicando: $SQL_FILE"
echo "🌐 URL: $SUPABASE_URL"

# Codificar SQL em base64
SQL_B64=$(base64 -i "$SQL_FILE" | tr -d '\n')

# Criar payload JSON temporário
TEMP_JSON=$(mktemp)
cat > "$TEMP_JSON" <<EOF
{"p_b64": "$SQL_B64"}
EOF

echo "🚀 Enviando requisição..."

# Fazer chamada
curl -s -w "\n%{http_code}" \
  -X POST \
  "$SUPABASE_URL/rest/v1/rpc/run_sql_script_b64" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@$TEMP_JSON" \
  > /tmp/supabase_response.txt

# Ler status e Body
HTTP_CODE=$(tail -n1 /tmp/supabase_response.txt)
BODY=$(head -n-1 /tmp/supabase_response.txt)

rm -f "$TEMP_JSON" /tmp/supabase_response.txt

echo "📊 HTTP Status: $HTTP_CODE"

if [ "$HTTP_CODE" -ge 400 ]; then
    echo "❌ ERRO"
    echo "$BODY"
    exit 1
fi

echo "✅ Sucesso!"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
