/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_DEV?: boolean;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AUTH_REDIRECT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
