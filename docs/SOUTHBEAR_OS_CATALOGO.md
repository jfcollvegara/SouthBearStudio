# SouthBear OS · Servicios y tarifas

## Módulo operativo

Ruta privada `/acceso/panel/catalogo/`. API `GET/POST /api/southbear/catalogo` y `GET/PATCH/DELETE /api/southbear/catalogo/:id`, bajo Cloudflare Access y validación JWT. Almacenamiento en D1: migración `db/migrations/0009_services_catalog.sql`.

Permite crear, buscar, filtrar, modificar, archivar y restaurar un catálogo comercial de:
- Diseño gráfico, desarrollo web, producción audiovisual y otros.
- Servicios individuales, paquetes y extras.
- Nombre, descripción que se copiará a los presupuestos (máximo 1.000 caracteres), unidad de venta, precio final **IVA incluido**, tipo impositivo, orden y notas privadas.

Los valores iniciales están **vacíos**: no se inventan servicios ni tarifas del estudio.

## Precios y trazabilidad

- `studio_services.unit_gross_cents` almacena los céntimos del precio final por unidad.
- `studio_service_price_history` registra precio e IVA en la creación y cuando cambian; `audit_events` registra altas, ediciones, archivo y restauración.
- El desglose base e IVA se muestra como cálculo orientativo. Los tipos disponibles son 0, 4, 10 y 21 %, no sustituyen la comprobación de la tributación real.
- Una tarifa de 0 € es admisible como precio todavía no fijado; antes de entregar el presupuesto debe revisarse manualmente.
- El catálogo nunca reescribe líneas de presupuestos, ni modifica presupuestos aceptados, facturas o cobros.

## Integración de presupuestos

En `/acceso/panel/presupuestos/`, dentro de un formulario editable aparece el selector «Añadir desde Servicios y tarifas». Seleccionar un servicio activo y pulsar «Añadir servicio» añade una **copia** del nombre, descripción, precio bruto, IVA y cantidad 1.

- Si existe una línea inicial vacía, se reemplaza por el servicio seleccionado.
- Máximo 25 conceptos por presupuesto.
- El cliente puede personalizar los campos del concepto sin modificar el catálogo.
- Desde cada tarjeta del catálogo se puede abrir `/acceso/panel/presupuestos/?servicio=<uuid>` para iniciar una nueva propuesta con ese servicio.
- Se conserva el desglose inferior original (base imponible, IVA y total) calculado a partir del precio final.
- Los presupuestos guardados con antelación y los ya aceptados no cambian.

## Agenda con Google

Por decisión del estudio, el módulo «Agenda y tareas» se implanta **al final del proyecto**, con enfoque de integración con Google Calendar, evitando mantener una segunda agenda desconectada.

## Pruebas recomendadas

1. Crear servicio de prueba con tarifa 121,00 € y 21 % de IVA. Comprobar desglose 100,00 € base + 21,00 € IVA.
2. Editar el precio a 145,20 € y comprobar historial.
3. Abrir un presupuesto nuevo e insertar el servicio desde el selector. Comprobar precio IVA incluido y posibilidad de personalizarlo.
4. Guardar el presupuesto. Cambiar después la tarifa en el catálogo; verificar que la línea del presupuesto sigue intacta.
5. Abrir desde la tarjeta «Usar en presupuesto» y comprobar que el formulario añade el servicio una sola vez.
6. Archivar el servicio y verificar que deja de ofrecerse en nuevas propuestas; restaurarlo y comprobar que vuelve.
7. Comprobar el acceso a la API desde sesión autorizada y que la zona pública no incorpora los datos del catálogo.

La migración de D1 se aplicó en producción. La verificación completa requiere pruebas desde la sesión de usuario.
