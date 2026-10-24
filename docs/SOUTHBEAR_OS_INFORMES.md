# SouthBear OS · Informes y rentabilidad comercial

## Módulo privado

La nueva vista /acceso/panel/informes/ consulta registros de D1 mediante GET /api/southbear/informes?desde=AAAA-MM-DD&hasta=AAAA-MM-DD. Reutiliza Cloudflare Access y verificación de JWT del middleware privado. No modifica ningún registro.

Incluye filtros de periodo (hasta 24 meses), gráfico mensual de entradas y salidas anotadas, pagos de gastos por categoría y análisis histórico por proyecto. Exporta CSV desde el navegador (UTF-8 con BOM y separación por punto y coma), con protecciones para el texto exportado.

## Tesorería por periodo

- Cobros: suma de collection_receipts.amount_cents con canceled_at nulo y fecha paid_date dentro del periodo, independientemente del archivo del plan.
- Pagos: suma de expense_payments.amount_cents con canceled_at nulo y paid_date dentro del periodo, independientemente del archivo posterior del gasto.
- Saldo de caja anotado: cobros menos pagos. No es beneficio fiscal, saldo bancario ni facturación emitida.
- Categorías: pagos no anulados, dentro de fecha, agrupados por la categoría del gasto de origen.

## Rentabilidad comercial por proyecto (toda la vida del proyecto)

**No se aplica el filtro de fechas a los indicadores por proyecto.** Se muestran proyectos activos no archivados, como máximo 500.

- Presupuesto aceptado con IVA: total guardado del presupuesto vinculado si su estado es aceptado.
- Costes vinculados: suma de importes con IVA de gastos no archivados asociados explícitamente al proyecto.
- Diferencia comercial: presupuesto aceptado menos esos costes. Porcentaje calculado sobre el presupuesto, si es positivo. NO es beneficio real, resultado fiscal ni margen neto. Falta imputar trabajo propio, costes generales y fiscalidad.
- Cobros: movimientos no anulados de planes asociados explícitamente al proyecto; alternativamente, vinculados a su presupuesto, o a un borrador inequívocamente asociado a ese proyecto. El mismo plan no se duplica aunque encaje en dos criterios.
- Pagos: movimientos no anulados de gastos asociados al proyecto, incluso si el gasto fue archivado.
- Saldo de caja vinculado: cobros anteriores menos pagos anteriores durante toda la vida del proyecto.

Los presupuestos no aceptados y los borradores de factura no se consideran facturación ni ingresos reales.

## Limitaciones

Los movimientos bancarios y los justificantes no se verifican automáticamente, ya que la introducción es manual. Los importes comparados incorporan IVA; no se calculan IVA deducible, beneficio neto, amortizaciones ni liquidaciones fiscales. El sistema de emisión de facturas legales continúa separado y bloqueado.

## Comprobaciones recomendadas

1. Entrar en Informes y comprobar el resumen y el gráfico con los registros de D1.
2. Cambiar las fechas y confirmar que la parte histórica por proyecto permanece estable.
3. Entrar desde «Ver rentabilidad» en un proyecto y comprobar que filtra a ese proyecto.
4. Comparar importe presupuestado, costes y cobros con sus fichas.
5. Exportar CSV de tesorería y proyectos; verificar las filas y los decimales.
6. Intentar un intervalo de más de 24 meses y comprobar el rechazo.
7. Confirmar que el API no permite acceder sin Cloudflare Access.

La estructura de las consultas y la consulta real de proyectos se han comprobado frente a la base D1 sin insertar datos de prueba.