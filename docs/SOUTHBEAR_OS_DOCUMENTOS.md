# SouthBear OS · Documentos privados

## Estado actual

La fase documental incluye interfaz, API protegida, metadatos en D1 y código de subida/descarga segura. **El almacenamiento de archivos NO está operativo hasta que se active Cloudflare R2 en la cuenta y se cree y vincule el bucket a Pages.** Al consultar Cloudflare el 24/10/2026, el API rechazó el listado de buckets con error 403 / 10042, que indica que R2 debe habilitarse desde el panel de Cloudflare. El proyecto Pages no tiene ninguna vinculación R2. En este estado el usuario verá «El almacenamiento R2 todavía no está configurado» y el botón Subir estará deshabilitado. El API rechaza cualquier intento de subida con 503.

## Cómo activar el almacenamiento (requiere actuación del titular de la cuenta)

1. Ir al Dashboard de Cloudflare con el usuario titular de la cuenta, habilitar R2 Object Storage (aceptar sus condiciones y pasos de activación si se solicitan).
2. Crear un **bucket privado exclusivo de SouthBear OS**, por ejemplo `southbear-os-private`, sin dominio público ni URL r2.dev habilitada; verificar que no existe ninguna exposición pública.
3. En Workers & Pages → `southbearstudio` → Settings → Bindings, vincular el bucket R2, con el nombre exacto **`SOUTHBEAR_FILES`**, en **producción**. Si se requieren pruebas con previews, configurar un bucket distinto para preview y nunca compartir documentos reales con previews.
4. Volver a desplegar Pages para que se active el binding. Comprobar `/api/southbear/documentos/estado` desde sesión autorizada: `storage_ready:true`.
5. Después validar subir, listar, descargar, archivar y restaurar, con documentos **sin datos sensibles** en la prueba inicial.
6. Revisar ubicación regional, retención, copias de seguridad, cumplimiento y tratamiento de datos antes de usar documentos reales de clientes.

No se deben subir archivos mediante GitHub, ni almacenarlos en `/public` de Astro, Pages Assets o repositorios públicos. La API de documentos exige Cloudflare Access y JWT verificado en servidor.

## Arquitectura

- Migración de metadatos D1: `db/migrations/0012_private_documents.sql`, aplicada sin insertar archivos.
- Tabla `studio_documents`: ID UUID, título, categoría, nombre original, MIME, tamaño, SHA-256, clave aleatoria de objeto R2, notas, autor, fecha, archivo lógico y **una asociación opcional** a cliente/proyecto/presupuesto/gasto. Claves foráneas y límite de una asociación por documento.
- Los binarios se guardarían en el bucket R2 `env.SOUTHBEAR_FILES`, con claves aleatorias `private/AAAA/MM/<uuid>` que no incluyen nombres de clientes ni archivos.
- No se crean URLs públicas ni firmas temporales; cada descarga atraviesa `/api/southbear/documentos/:id/descargar`, protegida por el middleware de Access y JWT.
- La descarga fuerza `Content-Disposition: attachment`, `application/octet-stream`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`, `Cache-Control: no-store`, sin vista previa en línea.
- Extensiones permitidas: PDF, JPG/JPEG, PNG, WebP, DOCX, XLSX, PPTX, TXT. Firma mínima de formato validada y UTF-8 válido en TXT. Límite 10 MiB. Se excluyen SVG, HTML, ejecutables y ZIP genéricos.
- Huella SHA-256 creada mediante Web Crypto de los bytes subidos. No constituye firma digital ni garantiza contenido inocuo.
- No hay antivirus, revisión de macros ni DLP. La comprobación de formato es limitada: no sustituye el análisis de seguridad de archivos, especialmente contenido OOXML malicioso.
- Escrituras: primero se coloca el objeto en R2 y luego se registra D1; si falla la base, se intenta borrar el objeto para evitar huérfanos. Para conciliación operativa futura, conviene agregar control automatizado de huérfanos y copias/recuperación.
- El archivo lógico no destruye bytes. Por ahora no hay borrado físico ni políticas de retención automáticas. La estrategia de conservación, acceso y eliminación de datos personales debe definirse antes del uso real.

## API

- `GET /api/southbear/documentos/estado`: disponibilidad del binding R2 (no requiere acceso a la lista de buckets desde el navegador).
- `GET /api/southbear/documentos`: listado paginado, búsqueda, categorías, archivados, filtro por relación.
- `POST /api/southbear/documentos`: multipart/form-data con fichero y metadatos, requiere R2, máximo 10 MiB.
- `GET /api/southbear/documentos/:id`: ficha.
- `DELETE /api/southbear/documentos/:id`: archivado lógico, conserva metadatos y bytes.
- `PATCH /api/southbear/documentos/:id` con `{ "archived": false }`: restauración.
- `GET /api/southbear/documentos/:id/descargar`: descarga adjunta privada con R2.

## Integraciones

Desde Clientes, Proyectos, Presupuestos y Gastos, los botones «Documentos»/«Justificantes» abren la misma vista filtrada por el ID del registro. No alteran registros del módulo origen.

## Límites

No es un gestor documental con firma digital ni un sistema de archivo fiscal certificado. No emite facturas ni contratos y no identifica automáticamente a los firmantes. No hay previsualización, OCR, búsquedas dentro de los archivos, versiones, antivirus, carpetas jerárquicas, enlaces a clientes ni copias de seguridad automatizadas. Integraciones con Google Calendar quedan para la última fase, según la preferencia acordada.

## Comprobación actual

- La migración D1 se ha aplicado en producción.
- El estado R2 sigue bloqueado por activación pendiente del propietario de la cuenta.
- La interfaz evita habilitar subidas sin binding. No se han insertado archivos ficticios ni expuesto documentos al público.
