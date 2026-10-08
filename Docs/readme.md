# Biblioteca Universitaria - SPA (Single Page Application)

## Descripcion General

Aplicacion de Pagina Unica (SPA) construida con React para gestionar y explorar libros en una biblioteca universitaria. Los usuarios podran navegar por un catalogo de libros obtenido de una API publica (Open Library API), ver informacion detallada de cada libro, buscar, filtrar, ordenar, tomar libros en prestamo, hacer seguimiento de fechas de vencimiento y gestionar una lista de deseos.

---

## 1. Navegacion de Libros

- Mostrar libros obtenidos de una API publica (Open Library API).
- Mostrar detalles del libro, incluyendo:
  - Imagen de portada
  - Titulo
  - Autor
  - Descripcion
  - Genero
  - Estado de disponibilidad

---

## 2. Busqueda y Filtrado

- Permitir a los usuarios buscar libros por titulo, autor o palabras clave.
- Implementar filtrado basado en categorias (ej. ficcion, ciencia, historia).
- Implementar ordenacion por:
  - Fecha de publicacion
  - Autor
  - Popularidad
- Asegurar manejo eficiente de datos para conjuntos de datos grandes (paginacion, debounce, carga incremental, etc.).

---

## 3. Sistema de Prestamos

- Permitir a los usuarios tomar prestados libros.
- Hacer seguimiento de fechas de vencimiento.
- Implementar un sistema de reservas para libros actualmente prestados.
- Almacenar el historial de prestamos del usuario de forma persistente.

---

## 4. Pagina de Detalles del Libro

- Pagina dedicada por libro con informacion detallada.
- Incluir un rastreador de estado de lectura:
  - Leyendo
  - Completado
  - Lista de deseos

---

## 5. Lista de Deseos (Funcion Avanzada - Opcional)

- Permitir a los usuarios crear y gestionar una lista de deseos de libros.
- Implementar notificaciones cuando los libros en la lista de deseos esten disponibles para prestamo.

---

## 6. Diseno Responsivo

- Experiencia de usuario fluida en todos los dispositivos.
- Enfoque mobile-first para los disenos.

---

## 7. Interfaz de Usuario y Accesibilidad

- Implementar navegacion por teclado.
- Uso correcto de roles ARIA.
- Diseno visualmente atractivo e intuitivo.

---

## 8. Optimizacion del Rendimiento

- Implementar carga perezosa (lazy loading) para imagenes y otros recursos.
- Optimizar la aplicacion para tiempos de carga mas rapidos y mejor rendimiento general.

---

## 9. Medidas de Seguridad

- Validacion y sanitizacion de entradas para prevenir ataques XSS (Cross-Site Scripting).
- Asegurar transmision segura de datos usando HTTPS.
- Proporcionar mecanismos seguros de autenticacion de usuarios.
- Anadir validacion de formularios del lado del cliente para envios seguros y libres de errores.

---

## 10. Construccion y Despliegue

- Implementar archivos de entorno (`.env`) para desarrollo y produccion.
- Desplegar el frontend en un VPS (servidor privado virtual), gestionando manualmente el servidor web (ej. Nginx) y el proceso de build.
- La base de datos y el backend (API, autenticacion) son gestionados por Supabase, sin necesidad de servidor propio para esa capa.

---

## Stack Tecnologico

| Componente               | Eleccion                                      |
|---------------------------|-------------------------------------------------|
| Lenguaje                  | TypeScript                                       |
| Framework Frontend        | React                                            |
| Build Tool                | Vite (`react-ts` template)                       |
| Linter                    | Oxlint                                           |
| API de Libros             | Open Library API                                 |
| Estilizado                | CSS (plano)                                      |
| Enrutamiento              | React Router 8 (`react-router`)                  |
| Gestion de Estado         | React Context API + useReducer                   |
| Persistencia de Datos     | Supabase (PostgreSQL gestionado)                 |
| Despliegue                | VPS (frontend) + Supabase (base de datos/backend) |

---

## Estructura de Carpetas del Proyecto

```
src/
├── api/
│   └── openLibrary.ts        # funciones para llamar a la API
├── components/
│   ├── Layout.tsx             # header, navegacion y <Outlet />
│   ├── BookCard.tsx
│   ├── SearchBar.tsx
│   └── FilterBar.tsx
├── pages/
│   ├── Home.tsx
│   ├── BookDetail.tsx
│   ├── MyLoans.tsx
│   └── NotFound.tsx           # pagina 404
├── types/
│   └── book.ts                # interfaces de TypeScript
├── context/
│   └── LibraryContext.tsx     # Context API para prestamos/wishlist
├── hooks/
│   └── useBooks.ts            # hook personalizado para fetch
├── App.tsx
├── main.tsx
└── vite-env.d.ts              # tipos de las variables de entorno
```

---

## Comandos de Inicializacion

Requisito: Node.js 22.22 o superior (exigido por React Router 8).

```bash
npm create vite@latest capstone -- --template react-ts --no-eslint --no-immediate
cd capstone
npm install
npm install react-router
npm run dev
```

---

## Notas de Implementacion (referencia tecnica)

- API utilizada: Open Library API (https://openlibrary.org/developers/api)
  - Busqueda: `https://openlibrary.org/search.json?q={query}`
  - Portadas: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`
  - Detalle de obra: `https://openlibrary.org/works/{id}.json`
- Persistencia local: LocalStorage para historial de prestamos, lista de deseos y estado de lectura (mientras no haya backend/base de datos).
- Paginacion: parametro `&page=` disponible en la API de busqueda.
- Variables de entorno: `VITE_OPEN_LIBRARY_URL` y `VITE_COVERS_URL` en `.env`, tipadas en `src/vite-env.d.ts`. Solo las variables con prefijo `VITE_` llegan al navegador, por lo que son publicas.
- Rutas: `/` (catalogo), `/libro/:id` (detalle; `id` es la clave de la obra sin `/works/`), `/mis-prestamos` y `*` (404).
