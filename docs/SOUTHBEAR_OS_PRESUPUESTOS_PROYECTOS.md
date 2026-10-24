# SouthBear OS · Presupuestos y Proyectos — fase 2

## Estado

La infraestructura de Cloudflare Pages, Cloudflare Access, Functions y D1 es independiente de HyperDrive. Esta fase añade **Presupuestos** y **Proyectos** vinculados a las fichas de Clientes.

**Esquema:** `db/migrations/0002_quotes_projects.sql`, aplicado a la base D1 de SouthBear, jurisdicción `eu`.
**Tablas:** `quotes`, `quote_lines`, `projects`. Las acciones se anotan en la tabla de auditoría ya existente.

## Presupuestos

- Página: `/acceso/panel/presupuestos/`.
- API privada: `GET/POST /api/southbear/presupuestos`, `GET/PATCH/DELETE /api/southbear/presupuestos/:id`.
- Creación en **borrador**; número comercial `PRE-AAAA-XXXXXXXX` generado a partir de UUID aleatorio (no es un número legal de factura).
- Cliente activo, título, fecha, validez, condiciones y hasta 25 líneas.
- Cada línea: concepto, descripción, cantidad con 3 decimales, precio sin IVA en céntimos, y tipo de IVA elegido explícitamente entre 0/4/10/21%.
- El cálculo se hace en el **servidor**; la vista previa en navegador no determina los importes guardados. Bases e IVA en céntimos; redondeo por línea. Para el tratamiento fiscal definitivo deben configurarse los regímenes aplicables, retenciones y datos del emisor.
- Seguimiento manual de estado: borrador, enviado, aceptado, rechazado y caducado. Un presupuesto enviado o aceptado no se puede modificar en su contenido (evita cambiar la oferta ya comunicada); los estados terminales no pueden revertirse desde la interfaz. La aceptación manual no equivale a firma electrónica ni a prueba de consentimiento del cliente.
- Archivo lógico. No se permite archivar presupuestos aceptados.
- El módulo no realiza todavía generación PDF, envío por email, firma electrónica ni emisión de facturas.

## Proyectos

- Página: `/acceso/panel/proyectos/`.
- API privada: `GET/POST /api/southbear/proyectos`, `GET/PATCH/DELETE /api/southbear/proyectos/:id`.
- Cliente activo, título, categoría (web/diseño/audiovisual/otro), estado, fechas, descripción y notas.
- Estados: planificado, en curso, en revisión, entregado y cancelado.
- Búsqueda y filtros de estado, archivo/restauración y edición.
- Relación opcional con presupuesto **aceptado**, activo, del mismo cliente. Un presupuesto solo puede quedar vinculado a un proyecto; no es posible sustituir una relación ya creada.
- Desde un presupuesto aceptado se puede iniciar la creación de un proyecto vinculado.
- Tareas, archivos, contratos y control de horas/costes serán ampliaciones posteriores.

## Panel de control

- API: `GET /api/southbear/resumen` presenta exclusivamente números reales de clientes activos, presupuestos abiertos y proyectos en marcha, junto con una breve actividad reciente.
- La facturación todavía no está implementada y **no debe inferirse de los presupuestos**. Por ello, su indicador permanece sin valor.

## Seguridad

- Cloudflare Access protege `/acceso/*` y `/api/southbear/*` en dominio principal, www, páginas Pages y previews. La función privada valida criptográficamente JWT de Access y el correo autorizado.
- Los métodos que escriben exigen mismo origen y una cabecera de petición interna; los datos nunca se incorporan al HTML estático.
- Los SQL de la API utilizan consultas preparadas y validación estricta de fechas, campos, estados y límites.
- Auditoría por operación, sin duplicar detalles de propuestas o notas en cada evento.
- Aún no hay subida de adjuntos ni funcionalidad fiscal operativa.

## Comprobación manual recomendada

1. Abrir Presupuestos en una sesión autorizada; crear un borrador asignado a un cliente registrado, con dos conceptos y tipos de IVA diferentes. Confirmar que suma exactamente.
2. Editar el borrador y verificar que persiste tras recargar. Marcarlo como enviado y después aceptado; comprobar que ya no se puede editar su contenido.
3. Utilizar «Crear proyecto ↗», confirmar cliente y presupuesto preseleccionados, guardar. Verificar que aparece en Proyectos y en el Dashboard.
4. Cambiar un estado de proyecto, archivar y restaurar. Comprobar las fechas y búsqueda.
5. Cerrar sesión. Confirmar que la API privada no entrega registros a visitantes anónimos.
6. No introducir datos falsos en el negocio real; si es necesario probar con un cliente real, crear un registro claramente identificable y archivarlo después.

## Fases siguientes

- Crear y vincular tareas, entregables y archivos privados por proyecto.
- Completar datos fiscales del emisor y plantillas profesionales de presupuesto, impresión PDF, aceptación del cliente y condiciones del servicio.
- Diseñar facturación, cobros, gastos y libros contables conforme a obligaciones legales aplicables en España, previa revisión por asesoría.
