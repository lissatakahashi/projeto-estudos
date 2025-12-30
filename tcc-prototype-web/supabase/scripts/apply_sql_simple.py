#!/usr/bin/env python3
"""
Script simples para aplicar SQL via Supabase REST API
Não requer dependências externas além de Python 3
"""
import os
import sys
import json
import base64
import urllib.request
import urllib.error

# Carregar .env manualmente
env_file = '../.env'
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_ROLE:
    print('ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar em supabase/.env', file=sys.stderr)
    sys.exit(1)

# Ler arquivo SQL
sql_file = sys.argv[1] if len(sys.argv) > 1 else '../../supabase/sql/pomodoro/create_pomodoros.sql'
if not os.path.exists(sql_file):
    print(f'ERRO: arquivo não encontrado: {sql_file}', file=sys.stderr)
    sys.exit(1)

with open(sql_file, 'rb') as f:
    sql_content = f.read()

# Base64 encode
b64_sql = base64.b64encode(sql_content).decode('ascii')

# Preparar requisição
url = SUPABASE_URL.rstrip('/') + '/rest/v1/rpc/run_sql_script_b64'
headers = {
    'apikey': SERVICE_ROLE,
    'Authorization': f'Bearer {SERVICE_ROLE}',
    'Content-Type': 'application/json',
}
data = json.dumps({'p_b64': b64_sql}).encode('utf-8')

# Fazer requisição
req = urllib.request.Request(url, data=data, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req, timeout=120) as response:
        status = response.status
        body = response.read().decode('utf-8')
        print(f'STATUS: {status}')
        try:
            print(json.dumps(json.loads(body), indent=2, ensure_ascii=False))
        except:
            print(body)
        if status >= 400:
            sys.exit(2)
except urllib.error.HTTPError as e:
    print(f'ERRO HTTP {e.code}: {e.reason}', file=sys.stderr)
    print(e.read().decode('utf-8'), file=sys.stderr)
    sys.exit(2)
except Exception as e:
    print(f'ERRO: {e}', file=sys.stderr)
    sys.exit(1)

print('\n✅ Migration aplicada com sucesso!')
