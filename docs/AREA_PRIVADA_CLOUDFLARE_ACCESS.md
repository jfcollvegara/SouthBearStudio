# SouthBear Studio — activar autenticación del área privada

**Estado (24 de octubre de 2026):** Cloudflare Zero Trust y la aplicación **SouthBear Studio · Área privada** están configuradas mediante la API. La política **Solo administrador SouthBear** autoriza exclusivamente `jf.collvegara@gmail.com` mediante One-time PIN, con sesiones de 8 horas. Las rutas `/acceso`, `/acceso/*`, en `southbearstudio.com`, `www.southbearstudio.com`, `southbearstudio.pages.dev` y `*.southbearstudio.pages.dev`, figuran en la aplicación. Queda pendiente comprobar de forma interactiva la redirección y el acceso real en navegador; aún no hay datos administrativos en las rutas.

## Tecnología y alcance

- Cloudflare Access (Zero Trust), aplicación **Self-hosted and private**.
- Acceso mediante **One-time PIN** a una **dirección de correo autorizada expresamente**.
- Sitio público: `https://southbearstudio.com/`, sin ninguna política Access general.
- Zona privada: `https://southbearstudio.com/acceso/` y rutas hijas (por ejemplo, `/acceso/panel/`).
- No crear usuarios en el proyecto Supabase de HyperDrive para SouthBear; son negocios/proyectos diferentes.

## Configuración existente en Cloudflare (ya realizada; solo como referencia)

1. Para revisar o modificar la configuración, entra en [Cloudflare Dashboard](https://dash.cloudflare.com/) con la cuenta que administra `southbearstudio.com`.
2. Ve a **Zero Trust → Integrations → Identity providers**. Si no está disponible **One-time PIN**, añádelo como proveedor.
3. Ve a **Zero Trust → Access controls → Applications → Create new application → Self-hosted and private**.
4. Pon el nombre **SouthBear Studio — Área privada**.
5. En **Public hostname** selecciona el dominio `southbearstudio.com` y define el **Path** `/acceso`. **Comprueba tanto `/acceso/` como `/acceso/panel/`**: las reglas de la ruta padre deben cubrir las rutas descendientes si no existen reglas más específicas. Si tu configuración no cubre ambas, añade `/acceso/*` como una segunda ruta bajo la misma aplicación, con la misma política. Evita proteger el dominio completo, porque la web corporativa debe seguir pública.
6. **Authentication:** selecciona **One-time PIN** (o un proveedor de identidad con MFA propio).
7. **Access policy:** acción **Allow**, selector **Emails**, incluye **solo tu correo de acceso exacto** (el que controles y donde recibirás los códigos). No uses `Everyone`, `Emails ending in`, `Login Methods: One-time PIN` como único criterio, ni `Bypass`.
8. **Application Session Duration:** recomendamos **8 horas** o menos para administración. Si el proveedor permite MFA adicional, actívala.
9. Guarda la aplicación. La protección se aplica desde Cloudflare, antes de servir las páginas de la web.
10. En **Workers & Pages** comprueba además si existen rutas de producción alternativas como `*.pages.dev`: pueden ofrecer una vía de acceso a las mismas páginas si no están protegidas. Asegura por separado esas rutas o desactiva el acceso público alternativo cuando el proyecto lo permita. **No dependas exclusivamente del dominio personalizado para proteger información confidencial.**

## Verificación después de guardar

- En una ventana privada/incógnito abre `https://southbearstudio.com/acceso/`: debe pedir autenticación **antes** de mostrar la página de diseño.
- Con correo no autorizado no debe llegar un código usable ni permitir entrar.
- Con el correo autorizado llega un PIN de un solo uso; al validarlo debe cargar el acceso.
- Abre directamente `https://southbearstudio.com/acceso/panel/` en otra ventana privada: debe solicitar autenticación.
- Comprueba también la ruta raíz `/acceso` sin barra final, redirecciones y cada ruta alternativa `pages.dev`.
- Comprueba que `https://southbearstudio.com/` sigue accesible sin autenticación.
- Cierra sesión desde `https://southbearstudio.com/cdn-cgi/access/logout` y vuelve a probar en modo privado.
- Comprueba que el panel y el acceso no figuran en el sitemap.

## Al añadir datos reales más adelante

Cloudflare Access protege la ruta HTTP configurada. **No basta para proteger APIs, archivos estáticos, Cloudflare R2, bases de datos ni endpoints alojados en otros dominios**: deberán exigir autorización independiente (por ejemplo, validación de JWT de Access o políticas RLS en una base de datos independiente de SouthBear). Nunca guardar información confidencial en archivos públicos de `public/` o contenido estático compilado.

## Referencias oficiales

- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- https://developers.cloudflare.com/pages/platform/known-issues/
- https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
