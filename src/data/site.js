import {catalog} from './catalog.js';

export const site = {
  name: 'SOUTHBEAR STUDIO',
  tagline: 'Estudio creativo · Diseño, web y soluciones digitales.',
  email: 'info@southbearstudio.com',
  location: 'Trabajamos con negocios de toda España'
};

// Las categorías y tarifas públicas proceden de un único catálogo.
// Así evitamos que reaparezcan paquetes antiguos en distintas páginas.
export const departments = catalog.map(group=>({
  title: group.title,
  slug: group.slug,
  description: group.intro
}));
export const prices = catalog.map(group=>({
  group: group.title,
  slug: group.slug,
  items: group.packages.filter(item=>item.price!==null).map(item=>[item.name,item.price])
}));
