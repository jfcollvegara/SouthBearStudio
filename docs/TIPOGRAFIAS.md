# Tipografías de SOUTHBEAR STUDIO

## Combinación 02 — Space Grotesk + Inter

- **Space Grotesk Variable**: títulos, encabezados y elementos tipográficos destacados.
- **Inter Variable**: textos, navegación, botones, formularios y demás interfaz.

Ambas familias son de uso comercial gratuito y se distribuyen bajo la **SIL Open Font License 1.1 (OFL-1.1)**.

- Space Grotesk: Copyright 2020 The Space Grotesk Project Authors — https://github.com/floriankarsten/space-grotesk
- Inter: Copyright 2016 The Inter Project Authors — https://github.com/rsms/inter
- Texto y condiciones de la licencia: https://openfontlicense.org/open-font-license-official-text/

## Alojamiento local, sin Google Fonts

Las dependencias `@fontsource-variable/space-grotesk` y `@fontsource-variable/inter` están declaradas en `package.json`.

Cuando Cloudflare Pages ejecuta `npm install` y `npm run build`, Astro/Vite incorpora los archivos WOFF2 en los recursos estáticos publicados desde el mismo dominio de SouthBear. El navegador del visitante no necesita descargar las fuentes desde Google Fonts.

Las importaciones están en `src/layouts/Base.astro`.

## Cambiar fuentes en el futuro

Las variables CSS están declaradas en `src/styles/global.css`:

```css
--font-heading: 'Space Grotesk Variable', system-ui, Arial, sans-serif;
--font-body: 'Inter Variable', system-ui, Arial, sans-serif;
```

El logotipo principal SVG no se ha alterado.
