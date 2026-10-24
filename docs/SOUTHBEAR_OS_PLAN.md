# SouthBear Studio OS — Plan de gestión integral

## Objetivo

Crear un centro de operaciones único, privado y responsive, para gestionar el estudio creativo **de principio a fin**: captación, clientes, presupuestos, trabajos, facturas, ingresos, gastos, contabilidad, impuestos, documentos, proveedores y seguimiento de resultados. Debe seguir el estilo visual negro/cinematográfico de Producción Audiovisual.

## Estado actual

- **Autenticación:** Cloudflare Access con una política por correo autorizado, verificada en la cuenta de Cloudflare.
- **Interfaz:** Dashboard y páginas de todos los módulos; navegación lateral y móvil.
- **Datos persistentes:** **No implementados**. Los indicadores muestran raya (—), no ceros ni números ficticios.
- **Operaciones:** **No habilitadas**. No emitir facturas ni capturar datos sensibles hasta completar el backend y los controles legales.
- **Separación de proyectos:** no utilizar la base de datos de HyperDrive para datos de SouthBear.

## Áreas y funciones

| Área | Módulo | Alcance previsto |
|---|---|---|
| Dirección | Dashboard | Facturación, cobros, gastos, proyectos, alertas y actividad |
| Comercial | Clientes | Ficha, contacto, historial, datos fiscales, comunicaciones |
| Comercial | Oportunidades | Pipeline, seguimiento, importes y conversión |
| Comercial | Presupuestos | Líneas, impuestos, PDF, aceptación, estados |
| Operaciones | Proyectos | Hitos, entregables, tareas, revisiones, costes y rentabilidad |
| Operaciones | Agenda y tareas | Plazos, reuniones, grabaciones, calendario y recordatorios |
| Finanzas | Facturación | Series, numeración, emisión, PDF, rectificación, histórico |
| Finanzas | Cobros | Pagos, vencimientos, impagos, cobros parciales, conciliación |
| Finanzas | Gastos | Facturas de compra, tickets, impuestos, inversiones y recurrentes |
| Finanzas | Proveedores | Datos, contratos, facturas, pagos, subcontrataciones |
| Finanzas | Contabilidad | Movimientos, libros de registro, conciliación, informes |
| Finanzas | Impuestos | Control de cuotas, periodos, vencimientos, reportes para asesoría |
| Estudio | Servicios y tarifas | Catálogo, paquetes, extras, precios y plantillas |
| Estudio | Documentos | Archivos, contratos, certificados, permisos y justificantes |
| Estudio | Informes | KPIs, rentabilidad, márgenes, exportación |
| Estudio | Configuración | Datos fiscales del emisor, usuarios, seguridad, series, backup |

Ampliaciones futuras según necesidad: contratos firmados, colaboradores, empleados, activos, suscripciones, campañas comerciales, formularios captados en la web, banca y conciliación avanzada.

## Orden de implantación

1. **Infraestructura de datos**: almacenamiento independiente para SouthBear (por ejemplo, Cloudflare D1 con Functions/Workers o Supabase separado), autenticación validada **en servidor**, autorización por propietario/rol, auditoría, copias y exportación. Cloudflare Access sobre páginas HTML **no reemplaza** la seguridad de las APIs ni de la base de datos.
2. **CRM y proyectos**: entidades `clients`, `contacts`, `leads`, `projects`, `tasks`, `project_files`; CRUD validado y relacionado, archivos en almacenamiento privado. Incluye historial y búsqueda.
3. **Presupuestos y facturas**: documentos, líneas, estados, impuestos, PDF y conversiones; definir y validar la información fiscal real del emisor. No permitir modificar o borrar indiscriminadamente facturas emitidas; ofrecer rectificación mediante documentos trazables.
4. **Tesorería y gastos**: facturas recibidas, pagos, cobros, saldos, vencimientos, conciliación, archivos de justificantes.
5. **Contabilidad e impuestos**: libros y resúmenes coherentes con los asientos/registros; exportación para asesoría y validación con normativa española aplicable antes de su puesta en producción.
6. **Automatizaciones**: avisos, recordatorios, renovaciones y reportes, solo cuando existan datos confiables y permisos apropiados.

## Seguridad y cumplimiento antes de utilizar datos reales

- Restringir **todas** las rutas de panel, dominios alternativos y endpoints privados; no insertar información del negocio en el bundle estático de Astro.
- Autenticar/autorizar cada operación del backend por identidad verificada, no por una variable de JavaScript del navegador.
- Separar credenciales de administración y claves secretas en configuraciones seguras del servidor; nunca en GitHub público ni variables `PUBLIC_`.
- Mantener historial inalterable de acciones relevantes (cambio de estados, facturas emitidas, cobros), con marca temporal.
- Proteger documentos adjuntos con acceso privado firmado/autorizado, no carpetas `public/`.
- Establecer política de conservación, copias, restauración, exportación, protección de datos y control de acceso.
- Analizar obligaciones tributarias y de facturación españolas vigentes **en el momento de implantar la emisión** (incluyendo requisitos aplicables a software de facturación); validar los flujos con una asesoría antes de su uso real.
- Al mostrar indicadores, indicar siempre el periodo y la fuente. Si no hay datos conectados, mostrar "Sin datos" o raya, no resultados inventados.

## Principio de producto

**Nada de pantallas que aparenten guardar, emitir o calcular si todavía no lo hacen.** Primero interfaces honestas, después operaciones persistentes y auditables. El panel se ampliará sobre el layout `src/layouts/Private.astro`, el menú `src/components/private/Navigation.astro`, el catálogo `src/data/private-modules.js` y los estilos `src/styles/private-workspace.css`.
