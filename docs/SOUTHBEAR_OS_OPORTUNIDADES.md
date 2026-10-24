# SouthBear OS · Oportunidades comerciales (pipeline CRM)

## Estado y acceso

- Página privada: `/acceso/panel/oportunidades/`.
- API privada: `GET/POST /api/southbear/oportunidades`, `GET/PATCH/DELETE /api/southbear/oportunidades/:id`, `POST /api/southbear/oportunidades/:id/convertir`.
- Cloudflare Access y verificación JWT en servidor protegen todos los endpoints del espacio `/api/southbear`.
- Datos persistentes en D1, migraciones `0010_opportunities.sql` y `0011_opportunity_link_safety.sql`.
- Vista Kanban con columnas Nuevo contacto, Contactado, Propuesta, Negociación, Ganado y Perdido; búsqueda, filtro, archivo y restauración, paginación.

## Información por oportunidad

- Servicio/posible proyecto, contacto, empresa, email, teléfono, cliente asociado opcional.
- Área (diseño, web, audiovisual u otro), origen del contacto, etapa comercial, probabilidad 0–100 %, fecha de próximo seguimiento, descripción, notas internas y motivo obligatorio cuando se marca como perdido.
- Importe potencial en euros **IVA incluido**, expresado en céntimos; se puede dejar en cero cuando todavía no hay estimación.
- Los importes del embudo y la previsión ponderada se calculan solo a partir de oportunidades abiertas y activas: Nuevo, Contactado, Propuesta y Negociación. No son cobros, facturas emitidas ni ventas cerradas.
- La previsión ponderada es la suma de importe estimado × probabilidad asignada. El número no proviene de un pronóstico entrenado ni garantiza el cierre.
- Próximos contactos vencidos se muestran en las tarjetas; **no hay recordatorios enviados ni tareas automáticas**. Agenda y Tareas quedan para la última fase, con Google Calendar.

## Flujo de cliente y presupuesto

1. Puedes registrar una oportunidad sin crear todavía un cliente o vincularla a un cliente activo ya existente.
2. «Crear cliente» confirma expresamente la operación y crea una ficha usando el nombre comercial del contacto/empresa y su información. Si ya existe un cliente activo con ese correo, se rechaza la duplicación: vincúlalo editando la oportunidad.
3. Desde una oportunidad vinculada a cliente, «Preparar presupuesto» abre el formulario de Presupuestos con cliente y título preseleccionados, un concepto inicial y el importe estimado. El IVA sugerido inicialmente es 21 %, **solo como referencia a revisar**. No se guarda el presupuesto hasta pulsar Guardar.
4. Al guardar el presupuesto nuevo, el servidor comprueba que la oportunidad esté activa, abierta, vinculada al mismo cliente y sin un presupuesto anterior. La inserción del presupuesto, sus líneas, el enlace y las auditorías se guardan juntos.
5. El enlace de presupuesto es único: los triggers de D1 impiden sustituirlo por un segundo presupuesto y que pertenezca a otro cliente.
6. Al crear el presupuesto, una oportunidad Nuevo/Contactado pasa a Propuesta; la que ya estaba en Negociación conserva esa fase.
7. Cuando se marca **Aceptado** un presupuesto de esa oportunidad, esta pasa a **Ganado** con probabilidad del 100 %. La aceptación es una declaración manual, no una firma electrónica ni un cobro.
8. Desde Oportunidades puede abrirse el listado de Presupuestos filtrado por su referencia.

## Seguridad e integridad

- Auditoría para alta, edición, archivo, restauración, vinculación a presupuesto y conversión en cliente.
- Los contactos no se publican en la web corporativa.
- La creación de cliente o presupuesto exige acción explícita del usuario.
- El envío de un presupuesto no es un envío automático de correo ni una contratación concluida.
- Archivar una oportunidad no elimina ni modifica clientes, presupuestos, proyectos o cobros.

## Prueba funcional recomendada

1. Crear oportunidad de prueba, guardar, recargar y verificar que persiste.
2. Cambiar etapa Contactado y probabilidad; revisar el valor ponderado.
3. Crear cliente desde la oportunidad y verificar vínculo sin duplicación.
4. Pulsar Preparar presupuesto; verificar cliente, título, línea y precio inicial con IVA.
5. Guardar en borrador y comprobar referencia visible en Oportunidades.
6. Intentar crear otro presupuesto desde la misma oportunidad: no debe permitirlo.
7. Marcar el presupuesto aceptado y comprobar que la oportunidad pasa a Ganado.
8. Marcar otra oportunidad perdida e introducir motivo, luego archivar/restaurar.
9. Comprobar ausencia de datos reales en la web pública y en sesiones sin Access.

No se introducen datos de prueba durante la instalación. Las consultas se han validado mediante lectura y EXPLAIN contra D1.

## Fases posteriores

Documentos privados, exportación/conciliación para asesoría y cumplimiento fiscal. Agenda y Tareas queda al **final** como integración de Google Calendar sin duplicar agendas.
