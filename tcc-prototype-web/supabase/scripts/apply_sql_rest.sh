#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Ler variáveis
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env | cut -d '=' -f2- | tr -d ' ')
SERVICE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d '=' -f2- | tr -d ' ')

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
    echo "❌ ERRO: Variáveis não encontradas" >&2
    exit 1
fi

SQL_FILE="$1"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ ERRO: Arquivo não encontrado: $SQL_FILE" >&2
    exit 1
fi

echo "📝 Lendo SQL de: $SQL_FILE"
echo "🌐 Supabase: $SUPABASE_URL"

# Ler SQL e escapar para JSON
SQL_CONTENT=$(cat "$SQL_FILE" | jq -Rs .)

# Preparar payload
PAYLOAD="{\"query\": $SQL_CONTENT}"

echo "🚀 Executando SQL via REST API..."

# Executar via endpoint /rest/v1/rpc/query
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  "$SUPABASE_URL/rest/v1/rpc/query" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$PAYLOAD" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Status: $HTTP_CODE"

if [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  RPC 'query' não existe. Tentando via SQL Editor endpoint..."
    
    # Tentar endpoint alternativo para execução direta
    RESPONSE2=$(curl -s -w "\n%{http_code}" \
      -X POST \
      "$SUPABASE_URL/rest/v1/" \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      -H "Content-Type: application/sql" \
      --data-binary "@$SQL_FILE" 2>&1)
    
    HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
    BODY2=$(echo "$RESPONSE2" | sed '$d')
    
    echo "📊 Status alternativo: $HTTP_CODE2"
    
    if [ "$HTTP_CODE2" -lt 300 ]; then
        echo "✅ SQL executado com sucesso!"
        exit 0
    else
        echo "❌ Falha no endpoint alternativo"
        echo "$BODY2"
        exit 1
    fi
fi

if [ "$HTTP_CODE" -lt 300 ]; then
    echo "✅ SQL executado com sucesso!"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 0
else
    echo "❌ Erro ao executar SQL"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    exit 1
fi
