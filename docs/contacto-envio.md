# Envío directo del formulario de contacto de SouthBear Studio

La página **Contacto** usa **Cloudflare Pages Functions** y **Turnstile** para comprobar solicitudes, controlar abuso y enviar correos a `info@southbearstudio.com` mediante Resend.

## Pasos que faltan para activar el envío

1. Crea una cuenta en https://resend.com/ (puedes empezar con el plan gratuito).
2. En Resend, verifica **solo** el subdominio `notificaciones.southbearstudio.com`. Copia los registros DNS que indique Resend en la zona de Cloudflare. **No sustituyas ni elimines los registros MX existentes de `southbearstudio.com`**: el buzón sigue en Hostalia.
3. En Resend crea una API key con permisos de envío y, si lo permite, con el dominio verificado restringido.
4. En Cloudflare, entra en Workers & Pages → `southbearstudio` → Settings → Variables and Secrets → **Add**. Crea `RESEND_API_KEY` como variable **cifrada (Secret)**. No añadas la clave al repositorio ni la pegues en un chat.
5. Lanza una nueva implementación de Pages tras guardar el secreto y prueba el envío real desde `https://southbearstudio.com/contacto/`. Comprueba también la carpeta de spam de Hostalia.

El remitente técnico configurado en el servidor es `formularios@notificaciones.southbearstudio.com`, y los mensajes se reciben exclusivamente en `info@southbearstudio.com`. El correo del visitante se utiliza en la cabecera **Reply-To**, para permitir responderle fácilmente desde Hostalia. El servidor no accede al buzón de Hostalia ni conoce su contraseña.

**Configurado ya:** widget Turnstile `0x4AAAAAAFmX61EyBU-OotNU`, secret `TURNSTILE_SECRET` en producción, tabla D1 de límites por hora. El endpoint `GET /api/contacto/` indica si existe la clave; si no está configurado, el botón de envío permanece desactivado para evitar falsas confirmaciones. El endpoint `POST /api/contacto/` nunca informa de éxito sin una respuesta correcta del proveedor de correo.

**Protección:** validación en cliente y servidor, comprobación de origen, verificación Turnstile por API, campo trampa (honeypot), datos limitados por tamaño y 5 mensajes máximos por IP y hora (solo hash, nunca IP ni mensajes en la base de datos).

**Pendiente de revisión legal:** completar y publicar aviso legal y política de privacidad con los datos reales del titular, plazos de conservación, información al interesado y proveedores antes de considerar el formulario plenamente preparado para producción RGPD.
