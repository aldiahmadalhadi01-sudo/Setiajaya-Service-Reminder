/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_APP_SCRIPT_URL?: string;
  readonly VITE_WEB_APP_URL?: string;
  readonly VITE_GAS_URL?: string;
  readonly VITE_APPS_SCRIPT_URL?: string;
  readonly VITE_GOOGLE_SCRIPT_URL?: string;
  readonly VITE_SPREADSHEET_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
