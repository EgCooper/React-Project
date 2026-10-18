# Preguntas frecuentes

## ¿Redux o reducer y Context? ¿Dónde?
No usamos Redux, solo herramientas nativas de React. Usamos Context para la sesión del usuario (`AuthProvider` + `useAuth`) y para los préstamos, reservas y lista de deseos (`LibraryProvider` + `useLibrary`), que además usa `useReducer` para sus acciones (prestar, devolver, reservar...). `useBooks` también usa `useReducer` para el estado de la búsqueda (éxito o error; la carga se deriva).

## ¿Cómo gestionamos los renderizados?
Con decisiones de diseño: debounce en el buscador, cancelación de peticiones viejas con `AbortController`, estado derivado (de la URL y del estado de carga) en vez de duplicado, constantes fuera de los componentes y `key` estables en las listas. No usamos `memo` ni `useMemo` porque no hay cálculos costosos, y React recomienda medir antes de memorizar.

## ¿Cómo controlamos las páginas?
Con React Router 8: `App.tsx` define las rutas dentro de un `Layout` común, y "Mis préstamos" y "Mis libros" están protegidas con `ProtectedRoute`. Las páginas se cargan con `React.lazy` (el catálogo no, porque es la portada). La paginación del catálogo usa el parámetro `?pagina=` de la URL y vuelve a la página 1 al cambiar la búsqueda o un filtro.

## ¿Cómo gestionamos las restricciones de URL?
Todo lo que llega por la URL se valida:

- Categoría y orden, contra listas permitidas.
- La página debe ser un entero mayor o igual a 1.
- El ID del libro debe cumplir el formato `OL…W`.
- Las rutas privadas redirigen al inicio de sesión.
- Después de iniciar sesión solo se redirige a rutas internas.
- Las rutas desconocidas van a la página 404.

## ¿Grid o Flexbox?
Los dos. Grid para los diseños en dos dimensiones: la cuadrícula del catálogo, las dos columnas del detalle y las filas de "Mis préstamos". Flexbox para alinear en una dimensión: el header, los filtros, los formularios y la paginación.

## ¿Cómo gestionamos el estado?
Según su alcance:

- `useState` para el estado local (formularios).
- `useReducer` para el estado de las peticiones y de la biblioteca del usuario.
- Context para lo global (la sesión y los préstamos, reservas y lista).
- La URL para el catálogo (búsqueda, filtros y página).
- Supabase para los datos persistentes.

## ¿Dónde definimos el Provider?
Hay dos, en `src/context/`: `AuthProvider.tsx`, que escucha los cambios de sesión de Supabase, y `LibraryProvider.tsx`, que carga los préstamos, reservas y lista del usuario al iniciar sesión. Se montan en `src/main.tsx` envolviendo a `<App />` (`LibraryProvider` dentro de `AuthProvider`, porque necesita saber quién inició sesión) y se consumen con `useAuth()` y `useLibrary()`.

## ¿Cómo funciona el filtro?
`FilterBar` tiene dos selects, categoría y orden. Al cambiar uno, el valor se guarda en la URL, `Home` lo valida y `useBooks` repite la búsqueda. La capa de API lo traduce a Open Library:

- La categoría va como `subject`.
- La popularidad se envía como `readinglog`.
- Las fechas usan `new` u `old`, más un filtro de años válidos.
- El orden por autor ordena en el navegador los 200 resultados más relevantes.

## ¿Cómo funcionan los préstamos y las reservas?
Open Library no sabe qué libros tiene la biblioteca, así que los préstamos viven en Supabase (1 ejemplar por libro). Se presta por 14 días, con un máximo de 3 préstamos activos y sin préstamos vencidos. Si el libro está prestado, se puede reservar: el primero de la fila tiene prioridad cuando se devuelve. Las reglas las aplican funciones SQL en el servidor, no el navegador. Más detalle en [Architecture.md](Architecture.md).
