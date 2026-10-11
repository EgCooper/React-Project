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
- Desplegar el frontend: **por decidir** entre un VPS (servidor web Nginx y build gestionados manualmente) o una plataforma PaaS/Serverless (Vercel o Netlify). El enunciado oficial pide Serverless o PaaS.
- La base de datos y el backend (API, autenticacion) son gestionados por Supabase, sin necesidad de servidor propio para esa capa.

---

## 11. Entregables Adicionales del Enunciado

Ademas de los requisitos anteriores, el cronograma del enunciado oficial (`WebDev-Capstone.es.pdf`) incluye:

- Pruebas unitarias y de integracion (semana 6).
- Diagramas de arquitectura, modelo de datos y maquetas UI/UX (semana 2).
- Documentacion final del proyecto (semana 7).

---

## Stack Tecnologico

| Componente            | Eleccion                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| Lenguaje              | TypeScript 6                                                             |
| Framework Frontend    | React 19                                                                 |
| Build Tool            | Vite 8 (`react-ts` template)                                             |
| Linter                | Oxlint                                                                   |
| API de Libros         | Open Library API                                                         |
| Estilizado            | CSS Modules + variables CSS globales (tema claro y oscuro)               |
| Enrutamiento          | React Router 8 (`react-router`)                                          |
| Gestion de Estado     | React Context API + useReducer; estado del catalogo en la URL            |
| Persistencia/Backend  | Supabase (PostgreSQL gestionado + Auth)                                  |
| Autenticacion         | Supabase Auth con correo y contrasena                                    |
| Despliegue            | Por decidir (VPS o Vercel/Netlify) + Supabase                            |

Nota sobre React Router: el enunciado menciona "React Router DOM". Desde la version 7, `react-router-dom` se fusiono con `react-router`, y en la version 8 el paquete `react-router-dom` dejo de publicarse. Es la misma libreria; todo se importa desde `react-router`.

---

## Plan de Fases y Progreso

- [x] **Fase 1 - Base:** Vite + React + TypeScript, React Router, estructura de carpetas, variables de entorno.
- [x] **Fase 2 - Catalogo:**
  - [x] Tipos y modulo de la API (normalizacion de datos).
  - [x] Listado con hook `useBooks` y tarjetas `BookCard`.
  - [x] Busqueda con debounce (estado en la URL).
  - [x] Filtro por categoria y ordenacion (relevancia, popularidad, fecha, autor).
  - [x] Paginacion con boton de reintento.
  - [x] Pagina de detalle.
- [ ] **Fase 3 - Supabase:**
  - [x] 3.1 Proyecto, cliente y variables de entorno.
  - [x] 3.2 Autenticacion: registro, inicio de sesion, sesion global (`AuthContext`) y ruta protegida.
  - [ ] 3.3 Base de datos: tablas (`loans`, `reservations`, `wishlist`, `reading_status`), politicas RLS e indice de prestamo unico.
- [x] **Migracion a CSS Modules.**
- [ ] **UI y responsive:**
  - [x] UI-1 Fundamentos: paleta, tipografia, modo oscuro, foco visible.
  - [x] UI-2 Layout responsive: header, contenedor, footer, "Saltar al contenido".
  - [ ] UI-3 Componentes: tarjetas, buscador y filtros, boton principal, formularios, detalle.
  - [ ] UI-4 Estados: carga sin parpadeo (`aria-busy`), vacios y errores.
  - [ ] UI-5 Accesibilidad: foco al cambiar de pagina, `role="status"` persistente, titulo por pagina.
  - [ ] UI-6 Verificacion: 360/768/1280 px, solo teclado, Lighthouse.
- [ ] **Fase 4 - Prestamos:** `LibraryContext`, disponibilidad, prestar/devolver con vencimiento, reservas, historial, estado de lectura, lista de deseos (avisos opcionales).
- [ ] **Rendimiento:** estado de carga derivado en `useBooks`, cache del bloque de orden por autor, portadas que fallan (`onError`), `React.lazy` en las paginas.
- [ ] **Pruebas:** Vitest + Testing Library.
- [ ] **Documentacion:** diagramas, modelo de datos, maquetas.
- [ ] **Despliegue.**

---

## Estructura de Carpetas del Proyecto

```
capstone/
├── .env                          # valores reales (no se sube a git)
├── .env.example                  # plantilla de variables, sin valores
├── index.html
└── src/
    ├── api/
    │   ├── openLibrary.ts        # busqueda, detalle, portadas y normalizacion de Open Library
    │   ├── supabase.ts           # cliente unico de Supabase
    │   └── auth.ts               # registro, inicio/cierre de sesion y traduccion de errores
    ├── components/
    │   ├── Layout.tsx            # header, navegacion, sesion, <Outlet /> y footer
    │   ├── ProtectedRoute.tsx    # redirige al inicio de sesion si no hay usuario
    │   ├── BookCard.tsx          # tarjeta de libro del catalogo
    │   ├── SearchBar.tsx         # buscador
    │   ├── FilterBar.tsx         # categoria y orden
    │   ├── Pagination.tsx        # anterior / siguiente
    │   └── FormField.tsx         # campo de formulario accesible (label, pista, error)
    ├── constants/
    │   └── catalog.ts            # categorias y opciones de orden
    ├── context/
    │   ├── authContext.ts        # contexto de la sesion (forma y valor inicial)
    │   └── AuthProvider.tsx      # mantiene la sesion sincronizada con Supabase
    ├── hooks/
    │   ├── useBooks.ts           # busqueda paginada (useReducer + AbortController)
    │   ├── useBookDetail.ts      # detalle de un libro
    │   ├── useDebounce.ts        # retrasa un valor hasta que deja de cambiar
    │   └── useAuth.ts            # acceso a la sesion desde cualquier componente
    ├── pages/
    │   ├── Home.tsx              # catalogo
    │   ├── BookDetail.tsx        # detalle del libro
    │   ├── Login.tsx             # iniciar sesion
    │   ├── Register.tsx          # crear cuenta
    │   ├── MyLoans.tsx           # mis prestamos (privada)
    │   └── NotFound.tsx          # pagina 404
    ├── types/
    │   └── book.ts               # BookSummary, BookDetail, SortOption
    ├── utils/
    │   └── validation.ts         # validacion de formularios (funciones puras)
    ├── index.css                 # variables de diseno, tema oscuro y estilos base (global)
    ├── App.tsx                   # definicion de rutas
    ├── main.tsx                  # punto de entrada (BrowserRouter + AuthProvider)
    └── vite-env.d.ts             # tipos de las variables de entorno
```

Cada componente y pagina con estilos propios tiene su archivo `*.module.css` al lado.

---

## Rutas

| Ruta              | Pagina          | Acceso                                      |
|-------------------|-----------------|---------------------------------------------|
| `/`               | Catalogo        | Publica                                     |
| `/libro/:id`      | Detalle         | Publica (`id` = clave de obra sin `/works/`) |
| `/registro`       | Crear cuenta    | Publica (redirige al catalogo si hay sesion) |
| `/iniciar-sesion` | Iniciar sesion  | Publica (vuelve a la pagina de origen)      |
| `/mis-prestamos`  | Mis prestamos   | Privada (`ProtectedRoute`)                  |
| `*`               | 404             | Publica                                     |

Parametros del catalogo en la URL: `q` (busqueda), `categoria`, `orden` y `pagina`. Ejemplo: `/?q=harry&categoria=fiction&orden=newest&pagina=2`.

---

## Configuracion y Comandos

Requisito: Node.js 22.22 o superior (exigido por React Router 8).

### Instalar el proyecto

```bash
cd capstone
npm install
cp .env.example .env   # completar los valores (ver "Variables de Entorno")
npm run dev
```

### Scripts

| Comando           | Que hace                                                   |
|-------------------|------------------------------------------------------------|
| `npm run dev`     | Servidor de desarrollo en http://localhost:5173            |
| `npm run lint`    | Revisa el codigo con Oxlint                                |
| `npm run build`   | Revisa los tipos (`tsc -b`) y genera la version de produccion en `dist/` |
| `npm run preview` | Sirve la version de produccion en http://localhost:4173    |

### Creacion original del proyecto (referencia)

```bash
npm create vite@latest capstone -- --template react-ts --no-eslint --no-immediate
cd capstone
npm install
npm install react-router @supabase/supabase-js
```

---

## Variables de Entorno

| Variable                         | Ejemplo                            | Uso                          |
|----------------------------------|------------------------------------|------------------------------|
| `VITE_OPEN_LIBRARY_URL`          | `https://openlibrary.org`          | Busqueda, obras y autores    |
| `VITE_COVERS_URL`                | `https://covers.openlibrary.org`   | Portadas                     |
| `VITE_SUPABASE_URL`              | `https://<proyecto>.supabase.co`   | Proyecto de Supabase         |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | `sb_publishable_...`               | Clave publica de Supabase    |

- `.env` no se sube a git; `.env.example` es la plantilla sin valores.
- Solo las variables con prefijo `VITE_` llegan al navegador, por lo que son publicas.
- La clave **publishable** es publica por diseno: la seguridad de los datos la dan las politicas RLS. La clave **secret** (`sb_secret_...`) nunca va en el frontend.
- Los tipos de las variables estan en `src/vite-env.d.ts`.

---

## Decisiones Tecnicas

### API de libros
- **Una sola API: Open Library.** Se descartaron Google Books (sin orden por popularidad, maximo 40 resultados, requiere clave) y Gutendex (solo obras de dominio publico, sin fechas de publicacion).
- **Disponibilidad y prestamos en Supabase:** Open Library no conoce el inventario de la biblioteca. Se une por la clave de obra (`/works/OL...W`), con 1 ejemplar por obra; un indice unico parcial impedira dos prestamos activos del mismo libro.
- **Consulta por defecto `language:spa`:** una busqueda vacia devuelve 0 resultados y `q=*` responde error 422.

### Catalogo
- **Estado en la URL** (`useSearchParams`): la busqueda, categoria, orden y pagina sobreviven a "Atras", a recargar y a compartir el enlace. La escritura usa `replace` (no llena el historial); el cambio de pagina no, para que "Atras" vuelva a la pagina anterior.
- **`<BrowserRouter useTransitions={false}>`:** React Router 8 actualiza la URL dentro de `startTransition`, lo que rompe los inputs controlados por la URL (letras perdidas al escribir rapido).
- **Debounce de 400 ms** y cancelacion de peticiones viejas con `AbortController`.
- **Ordenacion:**
  - Relevancia: orden por defecto de la API.
  - Popularidad: `sort=readinglog`.
  - Fecha: `sort=new` / `sort=old` + filtro `first_publish_year:[1450 TO <anio actual>]` (la API tiene anios erroneos como 0 o 2542).
  - Autor: la API no lo soporta; se piden los 200 resultados mas relevantes y se ordenan en el navegador con `Intl.Collator('es')` (maximo 10 paginas).
- **Validacion de la URL:** categoria, orden y pagina se validan contra listas permitidas; un valor desconocido usa el valor por defecto.
- **Reintento:** Open Library responde a veces con errores 500 intermitentes; los listados y el detalle tienen boton "Reintentar".

### Detalle del libro
- Sigue las redirecciones de obras fusionadas (`type: /type/redirect`).
- La descripcion llega como texto o como objeto `{ value }`; se unifica y se convierten los enlaces Markdown a texto plano (no se renderiza HTML externo, para evitar XSS).
- Los autores llegan solo como clave; sus nombres se piden en paralelo (`Promise.all`).
- El ID de la URL se valida (`OL<digitos>W`) antes de hacer la peticion.

### Autenticacion y seguridad
- **Correo y contrasena** con Supabase Auth.
- **Confirmacion de correo desactivada:** el servidor de correo por defecto de Supabase solo envia a miembros del equipo del proyecto, lo que impediria que otras personas prueben la app.
- **Politica de contrasena (cliente y servidor):** minimo 8 caracteres, con minuscula, mayuscula y digito. La validacion del formulario da respuesta inmediata; la de Supabase es la seguridad real.
- **Errores traducidos por codigo** (`invalid_credentials`, `user_already_exists`, ...), no por el texto en ingles. El inicio de sesion no revela si un correo existe.
- **`ProtectedRoute` es experiencia de usuario, no seguridad:** la proteccion real de los datos seran las politicas RLS de la base de datos.
- Redireccion tras iniciar sesion solo a rutas internas (proteccion contra "open redirect").

### Estilos y accesibilidad
- **CSS Modules** para los estilos de cada componente; `index.css` global con las variables de diseno y los estilos base.
- **Paleta "pizarra y papel"**: colores sobrios con contraste verificado segun WCAG AA (texto >= 4.5:1, bordes y foco >= 3:1) en ambos temas.
- **Modo oscuro automatico** segun el sistema (`prefers-color-scheme`).
- Foco visible con teclado (`:focus-visible`), enlace "Saltar al contenido", `aria-invalid` / `aria-describedby` en formularios, `aria-current` en la navegacion y tamano minimo de 44px en los botones tactiles.

---

## Notas de Implementacion (referencia tecnica)

- API utilizada: Open Library API (https://openlibrary.org/developers/api)
  - Busqueda: `https://openlibrary.org/search.json?q={query}&page={n}&limit=20&fields=key,title,author_name,cover_i,first_publish_year`
  - Filtro por categoria: parametro `&subject={tema}`; orden: `&sort=readinglog|new|old`.
  - Detalle de obra: `https://openlibrary.org/works/{id}.json`
  - Autor: `https://openlibrary.org/authors/{id}.json`
  - Portadas: `https://covers.openlibrary.org/b/id/{cover_i}-{S|M|L}.jpg`
- El parametro `fields` reduce mucho el tamano de las respuestas (rendimiento).
- Persistencia: Supabase (PostgreSQL) para prestamos, reservas, lista de deseos y estado de lectura; la sesion la guarda Supabase en el navegador.
