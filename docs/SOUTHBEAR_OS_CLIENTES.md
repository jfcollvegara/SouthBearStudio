# SouthBear OS · Clientes (primera fase operativa)

## Acceso

- Panel de Clientes: `/acceso/panel/clientes/`
- API: `/api/southbear/clientes` (GET, POST) y `/api/southbear/clientes/:id` (GET, PATCH, DELETE)
- Autenticación: Cloudflare Access OTP al único correo autorizado; protección por rutas tanto en dominio principal, `www`, `pages.dev` y previews. **La API verifica además el JWT RS256 en el servidor**, comprobando audiencia, emisor, vigencia y correo.
- No hay CORS público. Las operaciones que modifican datos requieren mismo origen y cabecera `X-SouthBear-Request: 1`.

## Base de datos

- Cloudflare D1: `southbear-studio-os`, jurisdicción `eu`.
- Enlace de producción de Cloudflare Pages: `SOUTHBEAR_DB`.
- Migración inicial: `db/migrations/0001_clients.sql`.
- Tablas: `clients`, `audit_events`, `schema_migrations`.
- Clientes guardados con identificadores aleatorios UUID, fechas, información de contacto, datos de facturación opcionales, notas y estado archivado.
- Auditoría por acción y correo verificado, sin duplicar todos los datos personales en el registro. El borrado de interfaz es un archivo lógico, no eliminación irreversible.
- La vista de clientes muestra hasta 50 por página, con búsqueda sobre nombres, empresa, correo y NIF; incluye listado de archivados y opción de restauración.
- **Preview:** la base de datos de producción no se vincula al entorno de preview.

## Verificaciones completadas

- D1 responde a consultas; migración `0001_clients` aplicada.
- Cloudflare Pages confirmó compilación y despliegue correctos con Functions.
- La política de Cloudflare Access protege también `/api/southbear` y `/api/southbear/*` para los hosts usados por Pages.
- El JWT se verifica criptográficamente, incluso si alguien intentara acceder a la API por una ruta alternativa.

## Validación de navegador pendiente

Es necesario comprobar con la sesión real del administrador: listar clientes, crear uno, editarlo, archivarlo, restaurarlo y cerrar sesión. También comprobar que desde una sesión anónima no se puedan consultar datos.

## Límites y obligaciones futuras

- No hay todavía módulo operativo de facturas ni contabilidad.
- No se han introducido datos personales ni clientes ficticios.
- Evitar subir documentos fiscales a `public/`; utilizar almacenamiento privado con controles de acceso por servidor.
- Antes de operar de forma continuada con datos personales: confirmar acuerdo de tratamiento y responsabilidades RGPD con proveedores, información de privacidad, política de retención, gestión de solicitudes de rectificación/supresión, exportaciones y copias de seguridad verificadas.
- El backend actual está dirigido al titular; en caso de añadir personal o asesores, diseñar identidades y permisos diferentes, no compartir el mismo correo/código.
- La autenticación en el edge y en las API no sustituye una evaluación de seguridad y mantenimiento periódico.
