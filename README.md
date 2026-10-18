# Biblioteca Universitaria

Aplicación web de página única (SPA) hecha con **React** para explorar un catálogo de libros, pedirlos prestados y llevar una lista de lectura.

**Demo:** https://react-project-nu-three-53.vercel.app/

![Catálogo de la Biblioteca Universitaria: buscador, filtros y libros con su disponibilidad](Docs/Maquetas/UI.png)

## Descripción

El catálogo se obtiene de la API pública de [Open Library](https://openlibrary.org/developers/api). Quien crea una cuenta puede:

- Buscar libros por título, autor o palabra clave, filtrarlos por categoría y ordenarlos.
- Ver el detalle de cada libro y si está disponible.
- Pedirlo prestado por 14 días, devolverlo y consultar su historial.
- Reservar un libro prestado y esperar su turno en la fila.
- Marcar libros como *Lista de deseos*, *Leyendo* o *Completado*, con aviso cuando un libro deseado queda disponible.

## Objetivo

Es el proyecto final de un curso de Desarrollo Web: una aplicación completa que reúne los conceptos de un frontend moderno, desde los componentes y el manejo de estado hasta la seguridad, las pruebas y el despliegue.

## Tecnologías

| Área | Herramienta |
|---|---|
| Interfaz | React 19 + TypeScript |
| Build | Vite |
| Rutas | React Router |
| Estilos | CSS Modules (tema claro y oscuro) |
| Datos de libros | Open Library API |
| Cuentas y base de datos | Supabase (Auth + PostgreSQL) |
| Pruebas | Vitest, Testing Library y MSW |
| Calidad de código | Oxlint |
| Despliegue | Vercel |

## Conceptos aplicados

- Componentes reutilizables y hooks personalizados.
- Estado global con Context API + `useReducer`, y estado del catálogo en la URL.
- Rutas protegidas y carga perezosa de páginas (`React.lazy`).
- Consumo de APIs con debounce y cancelación de peticiones (`AbortController`).
- Seguridad en la base de datos con políticas RLS y funciones SQL.
- Diseño responsivo (mobile-first) y accesibilidad: navegación por teclado, roles ARIA y foco gestionado.
- Pruebas unitarias y de integración, ejecutadas antes de cada despliegue.

## Estructura del repositorio

```
capstone/   código de la aplicación
Docs/       documentación
```

## Ejecutar en local

```bash
cd capstone
npm install
cp .env.example .env   # completar con los datos de Supabase y Open Library
npm run dev
```

Más detalles en [capstone/README.md](capstone/README.md).

## Documentación

- [Arquitectura, modelo de datos y maquetas](Docs/Architecture.md)
- [Autenticación](Docs/Authentication.md)
- [Pruebas](Docs/Testing.md)
- [Despliegue](Docs/DeploymentSetting.md)
- [Preguntas frecuentes](Docs/FAQ.md)
