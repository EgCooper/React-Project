interface ImportMetaEnv {
  readonly VITE_OPEN_LIBRARY_URL: string
  readonly VITE_COVERS_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string

}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
