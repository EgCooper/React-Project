interface ImportMetaEnv {
  readonly VITE_OPEN_LIBRARY_URL: string
  readonly VITE_COVERS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
