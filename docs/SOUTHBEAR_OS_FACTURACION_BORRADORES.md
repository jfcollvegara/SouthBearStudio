# SouthBear OS · Facturación (etapa 1: borradores internos)

**Estado:** preparado para pruebas privadas. **Emisión fiscal real deshabilitada.**

## Funciones

- Ruta privada `/acceso/panel/facturas/` con búsqueda, paginación, creación, edición, archivo y restauración de borradores.
- Backend protegido por Cloudflare Access y verificación JWT mediante `functions/api/southbear/_middleware.js`.
- API `GET/POST /api/southbear/facturas` y `GET/PATCH/DELETE /api/southbear/facturas/:id`.
- D1 migración `db/migrations/0005_invoice_drafts.sql`: tablas `invoice_drafts` y `invoice_draft_lines`, relación con cliente, presupuesto y proyecto, índices y claves externas.
- Relaciones verificadas en servidor: presupuesto **aceptado, activo y del mismo cliente**; proyecto **activo y del mismo cliente**; presupuestos de proyectos coherentes cuando ambos están seleccionados.
- Conceptos de 1 a 25, cantidad hasta 3 decimales, precio final **IVA incluido**, elección explícita de IVA (0 / 4 / 10 / 21 %). Los cálculos se recalculan en el servidor y se guardan en céntimos.
- Desde cada presupuesto aceptado y cada proyecto se puede abrir el formulario de borrador vinculado, con la importación de conceptos cuando haya presupuesto de origen.
- Las referencias `BOR-AAAA-XXXXXXXX` son códigos **internos no fiscales** y no se corresponden con series ni numeración de facturas expedidas.
- Creación, edición, archivo y restauración en la tabla `audit_events`.

## Límites de la fase

- **No hay facturas emitidas**, ni documentos llamados factura PDF, ni numeración fiscal, ni registro de ingreso/cobro/IVA repercutido.
- No hay anticipos de facturación implementados, rectificativas, certificación de software o funciones de VERI*FACTU.
- Un borrador puede ser editado o archivado; no representa una deuda exigible ni un documento fiscal entregable.
- No se modelan retenciones de IRPF, inversión del sujeto pasivo, exenciones, regímenes especiales ni facturación internacional. Si proceden, se validarán fiscalmente antes de habilitar la emisión.
- Cuando se importen presupuestos anteriores al cambio de precios con IVA, la aplicación estima su precio bruto unitario a partir de los importes históricos. **Se deben comprobar redondeos antes de facturar**, sin cambiar los presupuestos originales.
- Los datos legales del emisor continúan en `/acceso/panel/configuracion/` y requieren verificación real.

## Verificación

1. Abrir Facturación, confirmar aviso «Emisión fiscal bloqueada».
2. Crear borrador de un cliente válido, introducir dos conceptos con distinto IVA y guardar.
3. Recargar y comprobar persistencia; editar el borrador y actualizar importes.
4. Desde un presupuesto aceptado elegir «Preparar factura», comprobar cliente, origen y conceptos.
5. Desde un proyecto abrir «Preparar factura» y comprobar su vínculo.
6. Archivar y restaurar un borrador, verificar que no cambian ni presupuestos ni proyectos.
7. Confirmar que no aparecen botones «Emitir», «Marcar pagada» ni PDF fiscal.

## Pendiente antes de emitir legalmente

- Validar alta y régimen fiscal, datos de emisor y destinatario y supuestos de IRPF e IVA aplicables.
- Sistema de numeración y series correlativas, fecha real de operación, registro inalterable, rectificaciones.
- Diseñar y probar el cumplimiento de SIF conforme a la normativa española aplicable, QR y huella/encadenamiento y/o servicio VERI*FACTU si procede, declaración responsable del software, y requisitos de factura electrónica.
- Definir procesos de cobro, anticipos, conservación, exportación a asesoría, seguridad y soporte.
- Revisión jurídica/fiscal y pruebas extremo a extremo antes de permitir cualquier emisión.

Fuentes regulatorias de consulta, sujetos a actualizaciones: AEAT, «Contenido de las facturas» y «Sistemas Informáticos de Facturación (SIF) y VERI*FACTU».
