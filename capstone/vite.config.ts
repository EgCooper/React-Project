/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom: un navegador simulado en Node (document, window, localStorage...)
    environment: 'jsdom',
    // Se ejecuta antes de cada archivo de pruebas
    setupFiles: ['./tests/support/setup.ts'],
    // URLs falsas: las pruebas nunca llaman a Open Library ni a Supabase reales (las responde MSW)
    env: {
      VITE_OPEN_LIBRARY_URL: 'https://openlibrary.test',
      VITE_COVERS_URL: 'https://covers.test',
      VITE_SUPABASE_URL: 'https://supabase.test',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    },
  },
})
