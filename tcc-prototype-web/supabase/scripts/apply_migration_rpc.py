#!/usr/bin/env python3
"""Call a Supabase/PostgREST RPC to apply a migration.

Usage:
  python3 supabase/scripts/apply_migration_rpc.py --rpc RPC_NAME [--file path/to/file.sql]

- If RPC_NAME is `run_sql_script_b64`, the `--file` argument is required and
  the script will base64-encode the file content and send it as parameter
  `p_b64` to the RPC.
- For RPCs that take no parameters (for example `apply_migration_01_add_course_mode`),
  call without `--file` and the script will POST an empty JSON body.

The script reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from environment
or from `supabase/.env` when present.
"""
import os
import sys
import argparse
import base64
import json

from dotenv import load_dotenv
import requests


load_dotenv(dotenv_path=os.path.join('supabase', '.env'))


def main():
    parser = argparse.ArgumentParser(description='Call a Supabase PostgREST RPC to apply migration')
    parser.add_argument('--rpc', '-r', default='apply_migration_01_add_course_mode',
                        help='RPC name to call (default: apply_migration_01_add_course_mode)')
    parser.add_argument('--file', '-f', help='Path to SQL file to send (required for run_sql_script_b64)')
    parser.add_argument('--timeout', type=int, default=120, help='HTTP timeout in seconds')
    args = parser.parse_args()

    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not SUPABASE_URL or not SERVICE_ROLE:
        print('ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em supabase/.env ou no ambiente', file=sys.stderr)
        sys.exit(1)

    rpc = args.rpc
    url = SUPABASE_URL.rstrip('/') + f'/rest/v1/rpc/{rpc}'
    headers = {
        'apikey': SERVICE_ROLE,
        'Authorization': f'Bearer {SERVICE_ROLE}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }

    body = {}
    if rpc == 'run_sql_script_b64':
        if not args.file:
            print('ERRO: --file é obrigatório quando rpc=run_sql_script_b64', file=sys.stderr)
            sys.exit(1)
        path = args.file
        if not os.path.exists(path):
            print(f'ERRO: arquivo não encontrado: {path}', file=sys.stderr)
            sys.exit(1)
        # read file as bytes and base64 encode
        with open(path, 'rb') as fh:
            data = fh.read()
        b64 = base64.b64encode(data).decode('ascii')
        body = {'p_b64': b64}
    else:
        if args.file:
            print('Aviso: --file será ignorado para RPCs sem parâmetro', file=sys.stderr)

    try:
        resp = requests.post(url, headers=headers, json=body, timeout=args.timeout)
    except Exception as e:
        print(f'ERRO: falha ao conectar: {e}', file=sys.stderr)
        sys.exit(1)

    # Print status and JSON (if possible)
    print(f'STATUS: {resp.status_code}')
    text = resp.text
    # try parse json
    try:
        j = resp.json()
        print(json.dumps(j, indent=2, ensure_ascii=False))
    except Exception:
        print(text)

    if resp.status_code >= 400:
        sys.exit(2)


if __name__ == '__main__':
    main()
