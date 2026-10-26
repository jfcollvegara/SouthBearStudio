# Envío directo del formulario de SouthBear Studio

## Arquitectura

El formulario `/contacto/` publica una función `POST /api/contacto/` en Cloudflare Pages. Tras validar campos, origen, Cloudflare Turnstile y límites de frecuencia, la función se conecta mediante **SMTP autenticado y STARTTLS** al correo contratado en **Hostalia**. El correo siempre se dirige a `info@southbearstudio.com`. No se emplean Resend, Supabase ni otras cuentas.

- Servidor: `smtp.servidor-correo.net`.
- Puerto: `587`.
- Seguridad: **STARTTLS obligatorio**. No se aceptan contraseñas antes del cifrado.
- Usuario: `info@southbearstudio.com`.
- Remitente: `info@southbearstudio.com`.
- Destinatario: `info@southbearstudio.com`.
- **Reply-To**: dirección válida indicada por el cliente para contestarle desde Hostalia.
- Formato: SMTP AUTH PLAIN o LOGIN, cuerpo MIME codificado en UTF-8/Base64.
- La respuesta exitosa se muestra **solo si el servidor SMTP acepta el mensaje** (respuesta 250 tras DATA). Esto no garantiza entrega instantánea en la bandeja de entrada.

## Variables de Cloudflare

Proyecto: `southbearstudio` → **Settings → Variables and secrets → Production**.

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `SMTP_HOST` | Text | `smtp.servidor-correo.net` |
| `SMTP_PORT` | Text | `587` |
| `SMTP_USER` | Text | `info@southbearstudio.com` |
| `SMTP_FROM` | Text | `info@southbearstudio.com` |
| `SMTP_PASSWORD` | **Secret** | Contraseña del buzón introducida directamente en Cloudflare |
| `TURNSTILE_SECRET` | **Secret** | Clave privada existente de Turnstile |
| `SOUTHBEAR_DB` | D1 Binding | Base de datos ya vinculada al proyecto |

La contraseña SMTP **no debe introducirse en GitHub, código fuente ni chat**. Para cambios de secretos, vuelve a desplegar la versión de producción si la configuración no se aplica de inmediato. Nunca se hacen conexiones en claro por el puerto 25.

## Verificación

1. Comprobar que `GET /api/contacto/` devuelve `{"ready":true}`.
2. En `https://southbearstudio.com/contacto/`, rellenar el formulario con un correo de prueba y marcar el consentimiento.
3. Completar Turnstile y pulsar «Enviar consulta» una sola vez.
4. El sitio debe confirmar el éxito solo tras el OK SMTP. Verificar recepción en el webmail de Hostalia, incluyendo spam.
5. Probar un campo obligatorio vacío y un token Turnstile ausente: no deben enviarse mensajes. Si Hostalia rechaza la autenticación, el navegador mostrará un error genérico y **no** una falsa confirmación.

## Seguridad y mantenimiento

- Destinatario SMTP fijo y servidor SMTP limitado a Hostalia (no puede convertirse en relay abierto).
- Validación del correo de respuesta para evitar la inyección de cabeceras, validación de tamaños de campo.
- Verificación Turnstile en servidor, comprobación de origen y honeypot.
- D1 guarda solo un hash seudónimo de IP y contador horario, nunca los mensajes ni la contraseña.
- Protección básica: máximo 5 intentos de consulta por IP y hora.
- Queda pendiente revisar y publicar el **aviso legal y política de privacidad** con los datos reales del titular, finalidad, base jurídica, información a interesados, destinatarios, derechos y retención conforme al RGPD. No inventar datos legales.
