# SouthBear Studio OS — Plan de gestión integral

## Objetivo

Crear un centro de operaciones único, privado y responsive, para gestionar el estudio creativo **de principio a fin**: captación, clientes, presupuestos, trabajos, facturas, ingresos, gastos, contabilidad, impuestos, documentos, proveedores y seguimiento de resultados. Debe seguir el estilo visual negro/cinematográfico de Producción Audiovisual.

## Estado actual (24 de octubre de 2026)

- **Autenticación:** Cloudflare Access y comprobación del JWT en el servidor.
- **Almacenamiento:** Cloudflare D1 de SouthBear Studio, separada de HyperDrive.
- **Módulos con operaciones persistentes:** Clientes, Presupuestos (precios IVA incluido y descarga PDF comercial), Proyectos, Configuración fiscal del emisor, Facturación en modo **borradores internos sin emisión**, Cobros, Gastos, Proveedores y Servicios y tarifas.
- **Analítica:** Dashboard e Informes de tesorería y diferencias comerciales estimadas por proyecto. No representan libros fiscales ni ingresos devengados.
- **Servicios y tarifas:** catálogo privado con categorías, paquetes y extras; historial de cambios de precio y copia a conceptos de presupuestos, sin alterar históricos.
- **Pendientes prioritarios:** Oportunidades, archivo documental privado, conciliación/exportación contable para asesoría, validación legal y técnica antes de habilitar cualquier factura fiscal.
- **Agenda y tareas:** **última fase**, orientada a integración con Google Calendar. No crear un segundo calendario independiente; concretar la integración y sus permisos cuando toque.
- **Facturación:** las facturas fiscales definitivas y los módulos de Impuestos y Contabilidad siguen pendientes de diseño y validación normativa y profesional.

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

1. **Infraestructura de datos (primera fase implementada)**: D1 en UE con Pages Functions; rutas API protegidas por Cloudflare Access y validación criptográfica del JWT también en servidor. Restricción por correo del titular, preparados clientes y auditoría; pendientes automatización de copias/exportación e identidades/roles adicionales.
2. **CRM y proyectos (parcialmente implementado)**: `clients` y `projects` operativos, relacionados; siguientes entidades `contacts`, `leads`, `tasks`, `project_files`, archivos en almacenamiento privado. Incluye historial y búsqueda.
3. **Presupuestos y facturas (presupuestos implementados)**: presupuestos con líneas, estados, IVA y vinculación a proyectos; pendientes PDF, envío, aceptación firmada y facturación. Definir y validar la información fiscal real del emisor. No permitir modificar o borrar indiscriminadamente facturas emitidas; ofrecer rectificación mediante documentos trazables.
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

## Prioridades ajustadas (octubre de 2026)

1. Catálogo comercial «Servicios y tarifas» y reutilización en presupuestos (fase actual).
2. Pipeline de oportunidades: contacto potencial → negociación → presupuesto → proyecto.
3. Archivo documental privado de contratos, entregables y justificantes, con almacenamiento no público y permisos.
4. Exportación para asesoría y conciliación de cobros/gastos. La emisión fiscal quedará bloqueada hasta verificar requisitos aplicables.
5. Agenda y tareas **al final**, priorizando Google Calendar conectado y evitando funcionalidades duplicadas.
