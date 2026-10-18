# Biblioteca Universitaria (aplicacion)

SPA en React + TypeScript (Vite) para explorar el catalogo de Open Library, pedir libros prestados, reservarlos y llevar una lista de lectura. La autenticacion y los datos de cada usuario viven en Supabase.

- **Produccion:** https://react-project-nu-three-53.vercel.app/
- **Documentacion completa:** [../Docs/readme.md](../Docs/readme.md) (requisitos, decisiones, arquitectura, pruebas y despliegue)

## Empezar

Requisito: Node.js 22.22 o superior.

```bash
npm install
cp .env.example .env   # completar con las URLs de Open Library y los datos de Supabase
npm run dev            # http://localhost:5173
```

## Scripts

| Comando | Que hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | Revisa el codigo con Oxlint |
| `npm test` | Pruebas en modo vigilancia |
| `npm run test:run` | Pruebas una sola vez |
| `npm run build` | Revisa los tipos y genera la version de produccion en `dist/` |
| `npm run preview` | Sirve la version de produccion |

## Base de datos

[`supabase/schema.sql`](supabase/schema.sql) crea las tablas, las politicas RLS y las funciones de prestamos. Se ejecuta completo en el SQL Editor de Supabase sobre una base vacia; la seccion de funciones (desde `-- Paso 2`) se puede volver a ejecutar para actualizarlas.
