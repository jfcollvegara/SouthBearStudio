// Presentación de los paquetes de Diseño web.
// La información comercial completa se conserva en catalog.js.
// Para añadir un PNG a cada tarjeta, coloca el archivo en public/ y
// sustituye image: null por la ruta pública, por ejemplo:
// image: '/web-packages/landing-page.png'.
import { catalog } from './catalog.js';

const webService = catalog.find(service => service.slug === 'diseno-web');
const presentation = {
  'Landing Page': {
    slug:'landing-page',
    summary:'Una página con todo lo esencial para presentar tu negocio y convertir visitas en contactos.',
    image:null
  },
  'Web Esencial': {
    slug:'web-esencial',
    summary:'Una web clara y profesional para mostrar tus servicios y hacer crecer tu presencia online.',
    image:null
  },
  'Web Profesional': {
    slug:'web-profesional',
    summary:'Más páginas y funcionalidades para una presencia digital completa y preparada para crecer.',
    image:null
  },
  'Web Premium': {
    slug:'web-premium',
    summary:'Diseño exclusivo, detalles avanzados y una experiencia web que marca la diferencia.',
    image:null
  }
};

export const webPackages = webService.packages.map(pkg => ({
  ...pkg,
  ...presentation[pkg.name]
}));

export const formatWebPackagePrice = pkg =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits:2 }).format(pkg.price)+' €';

// Extras compartidos con el catálogo principal: el precio y las
// condiciones se editan en un solo lugar, src/data/catalog.js.
export const webExtras = webService.extras ?? [];

export const formatWebExtraPrice = item => {
  if (item.price === null) return item.priceLabel || 'Bajo presupuesto';
  const amount = new Intl.NumberFormat('es-ES', { maximumFractionDigits:2 }).format(item.price);
  return (item.from ? 'Desde ' : '') + amount + ' €' + (item.unit || '');
};
