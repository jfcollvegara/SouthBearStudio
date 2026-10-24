# SouthBear OS · Gastos y pagos internos (fase 7)

## Estado
Módulo privado disponible en `/acceso/panel/gastos/`. Usa Cloudflare Access, comprobación de JWT en middleware y D1. Migración aplicada en producción: `db/migrations/0007_expenses.sql` (`expenses`, `expense_payments`, índices y trigger anti-sobrepago).

## Funciones
- Crear, buscar, filtrar, editar (si no tiene pagos registrados) y archivar/restaurar un gasto.
- Guardar proveedor como nombre libre, categoría, concepto, fecha, vencimiento, referencia de justificante, notas y, opcionalmente, proyecto asociado.
- Indicar **precio total con IVA incluido** y el porcentaje declarado en el justificante (0, 4, 10 o 21 %). La base = redondeo(total / (1 + IVA)); IVA = total − base. Es un desglose informativo, no una decisión de deducibilidad fiscal.
- Registrar pagos parciales y completos, con fecha real, medio, referencia y notas. La base de datos impide pagar por encima del importe original, incluso ante operaciones concurrentes.
- Anular un pago sin borrarlo, indicando motivo obligatorio. El pago anulado deja de computar en los totales, pero permanece visible.
- El estado de cada gasto es **pendiente, parcial o pagado** según movimientos no anulados.
- Los proyectos enlazan a la creación de un gasto con el proyecto preseleccionado.
- Dashboard: cobros del mes, gastos pagados del mes y saldo neto de caja registrado. No se denomina beneficio, facturación ni resultado fiscal.

## Cálculo de tarjetas
- **Pagado este mes:** suma de pagos no anulados cuya fecha de pago pertenece al mes actual, incluidos gastos archivados.
- **Pendiente:** suma de gastos activos menos pagos no anulados de esos gastos.
- **Gastos comprometidos:** suma de importes de gastos activos.
- **Caja neta del mes:** cobros no anulados menos pagos de gastos no anulados, agrupados por fecha de movimiento, introducidos manualmente. No consulta bancos.

## Rutas de servidor
- `GET/POST /api/southbear/gastos`: lista, indicadores y creación.
- `GET/PATCH/DELETE /api/southbear/gastos/:id`: detalle, modificación sin pagos activos, archivar/restaurar.
- `POST /api/southbear/gastos/:id/pagos`: registro de pago.
- `PATCH /api/southbear/gastos/:id/pagos/:payment`: anulación con motivo.

## Limitaciones
- No genera facturas de compra, no adjunta ni custodia justificantes: conservar documentos originales.
- Proveedor introducido como texto. Un directorio normalizado de Proveedores se implementará en su propia fase.
- El IVA y el gasto no se marcan como fiscalmente deducibles; el tratamiento de IRPF, bienes de inversión, facturas intracomunitarias, inversión del sujeto pasivo, exenciones, retenciones, amortización y diferentes bases fiscales requiere otro módulo y revisión profesional.
- No integra bancos y no verifica que un movimiento realmente se haya pagado; la introducción es manual.
- No hay pago recurrente automático ni notificaciones de vencimiento.

## Pruebas manuales
1. Crear gasto de **121,00 €** con IVA **21 %** y verificar base **100,00 €**, IVA **21,00 €**, total **121,00 €**.
2. Guardar, recargar, comprobar persistencia y vínculo con proyecto.
3. Registrar pago de **60,50 €**, observar pendiente **60,50 €**.
4. Registrar segundo pago de **60,50 €** y comprobar que el estado es **PAGADO**.
5. Intentar introducir un pago superior al saldo y comprobar que el servidor lo rechaza.
6. Anular uno de los pagos indicando motivo. Verificar retorno al saldo pendiente y presencia del pago tachado en el historial.
7. Archivar y restaurar sin perder historial.
8. Revisar Dashboard: las cifras son movimientos manuales, nunca facturas emitidas.

Verificado en instalación: migración D1 aplicada y sintaxis SQL de inserción y actualización comprobada con `EXPLAIN` sin introducir transacciones de prueba. Pendiente prueba con navegador autenticado.
