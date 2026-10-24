# SouthBear OS · Presupuestos PDF y datos del emisor

## Estado de esta fase

- **Configuración de datos del emisor**: interfaz privada en `/acceso/panel/configuracion/` y API `GET/PUT /api/southbear/configuracion`.
- **Descarga PDF profesional**: botón «Descargar PDF» en cada presupuesto y endpoint privado `GET /api/southbear/presupuestos/pdf?id=UUID`.
- **Plantilla**: A4, identidad negro + lima + blanco, paginación, referencia, fechas, emisor y cliente, conceptos, precios por unidad **IVA incluido**, tipo impositivo, subtotales, IVA, total y condiciones. Documento identificado como **PRESUPUESTO COMERCIAL · NO ES FACTURA**.
- **Generación en servidor**: librería `pdf-lib` dentro de Cloudflare Pages Functions. Los datos proceden de Cloudflare D1, nunca de datos incrustados en la página pública. El archivo se devuelve con `Content-Type: application/pdf` y `Cache-Control: private, no-store`.
- **Seguridad**: toda `/api/southbear/*` sigue cubierta por Access y por verificación criptográfica del JWT en el middleware. La descarga no guarda ficheros personales en `public/` ni crea URLs de almacenamiento públicas.
- **Persistencia**: tabla singleton `studio_settings`, migración `db/migrations/0004_studio_settings.sql`. No se rellenó ningún dato fiscal por defecto.
- **Auditoría**: guarda un evento cuando se modifican los datos del emisor.

## Pasos para utilizarlo

1. Visita `/acceso/panel/configuracion/` con tu sesión autorizada.
2. Escribe los datos reales del emisor: nombre comercial, nombre fiscal/razón social, NIF, dirección, código postal, municipio y país. El resto de datos y las condiciones generales pueden completarse según proceda.
3. Pulsa «Guardar datos del estudio». El indicador mostrará si la identificación fiscal está completa.
4. En `/acceso/panel/presupuestos/`, pulsa «Descargar PDF» en el presupuesto deseado. Se descargará un archivo con nombre basado en su referencia.
5. Revisa cuidadosamente los importes, el tratamiento del IVA y todos los datos antes de enviarlo a un cliente.

## Presupuestos antiguos

- El PDF reproduce los totales y el desglose **guardados** en la base de datos, sin reinterpretar presupuestos aceptados.
- Las líneas anteriores a la actualización de precio con IVA utilizan una estimación del precio bruto por unidad para la columna visual. El **importe de la línea y los totales oficiales del presupuesto** se toman de los campos históricos persistidos.
- Cambiar los datos del emisor afectará a las descargas realizadas posteriormente, ya que todavía no se guarda una copia histórica inmutable del documento emitido. El PDF descargado es una representación actual, no un sistema de custodia documental.

## Límites importantes

- **No es factura** ni activa numeración fiscal, remisiones a la AEAT, VeriFactu, factura electrónica, rectificativas ni contabilidad.
- Si faltan datos fiscales del emisor, el PDF se marca **DOCUMENTO PROVISIONAL · DATOS FISCALES DEL EMISOR INCOMPLETOS**. La interfaz solicita confirmación antes de descargarlo.
- Se admite IVA 0/4/10/21 % según el sistema comercial actual. El usuario debe confirmar el tipo impositivo aplicable a sus servicios, así como el tratamiento de retenciones, regímenes especiales o operaciones intracomunitarias, que **no están modelados**.
- Esta fase no implementa envío por correo, firma del cliente, numeración consecutiva fiscal ni archivo probatorio.
- No hay test automatizado de descarga autenticada ejecutado con la cuenta del propietario: probar desde el navegador la primera descarga y revisar el PDF en un lector.

## Mejoras previstas

- Plantillas configurables, logo gráfico, firma y condiciones por servicio.
- Versionado/snapshot inmutable del presupuesto al marcar «Enviado», para futuras referencias y trazabilidad.
- Módulo separado de facturación y gastos sujetos a validación de obligaciones fiscales españolas vigentes.
