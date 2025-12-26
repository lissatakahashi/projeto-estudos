#!/usr/bin/env python3
"""
Aplica migration SQL via DATABASE_URL usando psycopg2
"""
import os
import sys

# Ler .env manualmente
env_file = '../.env'
if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    print('❌ ERRO: DATABASE_URL não encontrada em supabase/.env', file=sys.stderr)
    sys.exit(1)

# Tentar importar psycopg2
try:
    import psycopg2
except ImportError:
    print('❌ ERRO: psycopg2 não instalado', file=sys.stderr)
    print('Instale com: pip install psycopg2-binary', file=sys.stderr)
    sys.exit(1)

# Ler SQL
sql_file = sys.argv[1] if len(sys.argv) > 1 else '../sql/pomodoro/create_pomodoros.sql'
if not os.path.exists(sql_file):
    print(f'❌ ERRO: Arquivo não encontrado: {sql_file}', file=sys.stderr)
    sys.exit(1)

with open(sql_file, 'r') as f:
    sql = f.read()

print(f'📝 Lendo SQL: {sql_file}')
print(f'🌐 Conectando ao banco...')

try:
    # Conectar
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print('✅ Conectado!')
    print('🚀 Executando SQL...')
    
    # Executar
    cursor.execute(sql)
    
    print('✅ Migration aplicada com sucesso!')
    
    # Verificar tabela criada
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_name = 'pomodoros'")
    result = cursor.fetchone()
    
    if result:
        print(f'✅ Tabela "pomodoros" criada e verificada!')
    else:
        print('⚠️  Aviso: Tabela não encontrada (pode já existir)')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'❌ ERRO: {e}', file=sys.stderr)
    sys.exit(1)
