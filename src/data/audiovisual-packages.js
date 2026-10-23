// Fuente única para las tarjetas y páginas de paquetes audiovisuales.
// Las características comerciales, condiciones y precios siguen en catalog.js.
import { catalog } from './catalog.js';

export const audiovisualService = catalog.find(service => service.slug === 'audiovisual');

const presentation = {
  'Reel Profesional': {
    slug: 'reel-profesional',
    summary: 'Piezas breves y dinámicas para comunicar con fuerza en redes sociales y captar todas las miradas.',
    video: '/videos/audiovisual/5.mp4'
  },
  'Vídeo Promocional': {
    slug: 'video-promocional',
    summary: 'Muestra lo mejor de tu producto o servicio con una historia que conecta con tu público.',
    video: '/videos/audiovisual/6.mp4'
  },
  'Vídeo Corporativo': {
    slug: 'video-corporativo',
    summary: 'Presenta tu marca, sus valores y su esencia a través de una producción cuidada al detalle.',
    video: '/videos/audiovisual/7.mp4'
  },
  'Vídeo Personalizado': {
    slug: 'video-personalizado',
    summary: 'Una producción singular, concebida desde cero para dar forma a aquello que tienes en mente.',
    video: '/videos/audiovisual/8.mp4'
  }
};

export const audiovisualPackages = audiovisualService.packages.map(pkg => ({
  ...pkg,
  ...presentation[pkg.name]
}));

export const formatAudiovisualPackagePrice = pkg => pkg.price == null
  ? 'Bajo presupuesto'
  : 'Desde ' + new Intl.NumberFormat('es-ES', {maximumFractionDigits:2}).format(pkg.price) + ' €';

export const formatAudiovisualExtraPrice = extra => extra.price == null
  ? 'Bajo presupuesto'
  : new Intl.NumberFormat('es-ES', {maximumFractionDigits:2}).format(extra.price) + ' €';
