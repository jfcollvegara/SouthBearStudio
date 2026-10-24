# SouthBear OS · Proveedores (módulo operativo)

## Estructura y seguridad
- Dirección privada: `/acceso/panel/proveedores/`. API bajo las mismas comprobaciones de Cloudflare Access y JWT que el resto de `/api/southbear/*`.
- Migración aplicada: `db/migrations/0008_suppliers.sql`, tabla `suppliers`, índice de búsqueda y campo opcional `expenses.supplier_id` (FK).
- Datos recogidos: nombre comercial, razón social, NIF, persona de contacto, correo, teléfono, web, domicilio, categoría, condiciones comerciales, notas y fechas de actividad. Ningún dato personal se publica en la parte estática pública.
- Endpoints: `GET/POST /api/southbear/proveedores` y `GET/PATCH/DELETE /api/southbear/proveedores/:id`. Búsqueda por nombre, razón social, NIF y correo; filtro por sector y por activo/archivado; paginación de 50 registros.
- Cambios de ficha y archivo/restauración quedan registrados en `audit_events`. No se borran físicamente las fichas.

## Asociación con Gastos
- El formulario `Gastos` permite escoger un proveedor activo del directorio, o escribir manualmente el nombre cuando no exista ficha.
- Seleccionar una ficha completa automáticamente el nombre del proveedor del gasto. En el servidor se verifica su ID y se copia el nombre real de la ficha para impedir manipulaciones del cliente.
- La ficha muestra **número de gastos activos vinculados**, **importe total de esos gastos**, **pagos no anulados correspondientes** y **saldo pendiente**. No confunde importes previstos con pagos reales.
- `Ver gastos` abre `/acceso/panel/gastos/?proveedor=<id>`, filtrando únicamente los gastos con ese ID de proveedor. Los gastos asociados a fichas archivadas siguen consultables.
- Los **gastos antiguos conservan sus nombres y valores**. No se hace correspondencia automática por texto para evitar vincular por accidente empresas con nombres similares. Si un gasto antiguo no tiene pagos activos, puede editarse para añadir su proveedor; si ya tiene pagos, el formulario impide editarlo por protección histórica. Se preparará una herramienta de vinculación exclusivamente para gastos históricos con pagos en una fase futura, con auditoría y sin alterar importes.

## Límites actuales
- Los datos fiscales son introducidos por el usuario: no hay verificación automática de NIF, titularidad o solvencia.
- Las condiciones de pago son informativas, no crean pagos automáticos ni vencimientos vinculantes por sí solas.
- No hay carga de PDFs de facturas de compra, ni cálculo de IVA deducible, ni contabilidad fiscal, ni consulta bancaria.
- Si cambias el nombre de una ficha de proveedor, los gastos existentes conservan el nombre original anotado (instantánea histórica) y mantienen la relación por ID.

## Comprobación desde navegador autenticado
1. Crear proveedor de prueba (p. ej. «Imprenta de prueba») y guardar.
2. Verificar que aparece al volver a abrir la página.
3. Abrir Gastos y registrar un gasto con la ficha seleccionada.
4. Volver al proveedor y comprobar el gasto vinculado, importe y saldo.
5. Registrar un pago del gasto y comprobar que el total **pagado** del proveedor se actualiza.
6. Archivar el proveedor: sus gastos históricos deben conservarse y seguir visibles. Restaurarlo.
7. Editar un proveedor activo y comprobar que la ficha se guarda sin alterar el gasto ya registrado.

No se generan proveedores ni gastos de prueba desde los procesos de despliegue.
