# SouthBear OS · Cobros y anticipos

## Etapa operativa

El módulo `/acceso/panel/cobros/` registra **planes de pago** y **cobros recibidos anotados manualmente**. Se distingue estrictamente entre:
- Total planificado: importe contratado de los planes **activos**.
- Pendiente previsto: total de planes activos menos cobros no anulados asignados a esos planes.
- Cobrado registrado: todos los movimientos de ingreso no anulados, incluso si posteriormente se archivó el plan.
- Cobrado este mes (Dashboard): importes de movimientos no anulados cuya fecha real anotada pertenece al mes actual. No equivale a ingresos fiscalmente devengados ni al IVA repercutido.

Los datos se guardan únicamente en la base D1 privada y las rutas API están protegidas por Cloudflare Access más verificación JWT. La migración es `0006_collections.sql`.

## Flujos y reglas

1. Nuevo plan: seleccionar cliente; opcionalmente un presupuesto **aceptado** o un borrador interno de facturación, junto a un proyecto del mismo cliente. Si hay origen económico, se toma su importe real en servidor, sin aceptar cifras manipuladas del navegador.
2. Por defecto, según el dossier contractual v1.0: hasta **99,00 €** el anticipo sugerido es **100 %**; superiores a 99,00 €, **50 % anticipo y 50 % final**. Los importes y fechas del plan se pueden ajustar a las condiciones expresamente pactadas. Un céntimo residual por redondeo se asigna al pago final.
3. Registrar ingreso: indicar importe realmente recibido, fecha, método, referencia y notas. No se infiere automáticamente un pago a partir de la aceptación de un presupuesto o de una factura en borrador.
4. Pagos parciales: se pueden registrar varios movimientos hasta alcanzar el importe total; el trigger `collection_no_overpayment` evita sobrecobros concurrentes.
5. Correcciones: los movimientos nunca se borran; se marcan como **anulados** con motivo obligatorio. Siguen visibles en el historial, excluidos de las sumas de cobros.
6. Los planes se pueden archivar/restaurar y editar en cuanto a título, fechas, notas y porcentaje/importe de anticipo; el importe total y los vínculos de origen se mantienen fijos. Para cambiar el importe/cliente del encargo, revisar contrato y crear otra planificación cuando corresponda.
7. Solo se permite un plan por presupuesto, proyecto o borrador asociado, para prevenir duplicar accidentalmente los importes.
8. Los enlaces de origen aparecen en Presupuestos aceptados, Proyectos y Borradores de facturación. Los planes no editan ninguno de esos registros.

## API

- `GET/POST /api/southbear/cobros`: lista, totales y crear plan.
- `GET/PATCH/DELETE /api/southbear/cobros/:id`: detalle, editar metadatos del plan, archivar/restaurar.
- `POST /api/southbear/cobros/:id/movimientos`: registrar ingreso.
- `PATCH /api/southbear/cobros/:id/movimientos/:receipt`: anular ingreso indicando `reason`.

Registros en `collection_plans` y `collection_receipts`; cambios anotados además en `audit_events`.

## Restricciones fiscales importantes

- El sistema **NO** acredita la recepción bancaria: depende de los datos introducidos por el usuario. Verificar los movimientos con el banco y conservar justificantes.
- El sistema **NO** emite facturas válidas ni facturas de anticipo. Conforme a la operación y normativa, los anticipos pueden requerir factura y devengo de IVA. Deben documentarse mediante procedimientos de facturación separados y revisión fiscal.
- No son libros tributarios ni conciliación bancaria.
- No están modeladas devoluciones reales del dinero, contracargos, retenciones o diferencias por cambio de divisa.
- Solo se usan euros. La visibilidad de planes archivados no elimina recibos históricos, que siguen computando en el dinero anotado como recibido.
- No se envían alertas ni correos por vencimientos: las fechas se muestran para consulta manual.
- Las reglas de pago se inspiran en el dossier contractual de SouthBear fechado 21 de octubre de 2026, aún pendiente de revisión jurídica y alta de actividad. No sustituyen el acuerdo particular.

## Pruebas

- Crear plan a partir de presupuesto aceptado de 120,00 €. Comprobar anticipo sugerido de 60,00 € y saldo final 60,00 €.
- Crear plan manual de 80,00 €: anticipo sugerido de 80,00 € y segundo pago 0,00 €.
- Guardar, recargar y verificar totales.
- Registrar cobro parcial; verificar saldo y Dashboard.
- Registrar segundo cobro para completar el total. Rechazar intento de superar el importe total.
- Anular un movimiento con motivo y verificar que se recupera el saldo pendiente sin perder historial.
- Archivar y restaurar el plan y verificar conservación de cobros.
- Confirmar que el sistema no genera facturas, PDF fiscales ni comunica automáticamente ingresos a la AEAT.

Verificación inicial: migración D1 aplicada y consultas SQL validables por EXPLAIN sin introducir datos de prueba. Las operaciones desde el navegador deben comprobarse desde la sesión autenticada.
