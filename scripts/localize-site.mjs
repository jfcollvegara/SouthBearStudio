// Generate a dedicated, search-engine-friendly /en/ copy of every prerendered
// page while leaving the original Spanish files untouched.
// Run only after Astro has built the Spanish static site.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from '../src/data/catalog.js';
import { catalogEnglish } from '../src/i18n/catalog-english.mjs';
import { uiEnglish, metaEnglish } from '../src/i18n/ui-english.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(projectRoot, 'dist');
const translations = new Map();

function pair(spanish, english) {
  if (typeof spanish === 'string' && typeof english === 'string' && spanish && english && spanish !== english) {
    // The same piece of Spanish copy always maps to the same English text.
    if (!translations.has(spanish)) translations.set(spanish, english);
  }
}
for (const [original, translated] of Object.entries({ ...uiEnglish, ...metaEnglish })) pair(original, translated);

function fillCatalogue() {
  for (const source of catalog) {
    const target = catalogEnglish[source.slug];
    if (!target) throw new Error('English catalogue is missing service: ' + source.slug);
    pair(source.title, target.title);
    pair(source.intro, target.intro);
    if (source.packages.length !== target.packages.length) throw new Error('Package count mismatch: '+source.slug);
    source.packages.forEach((pkg,index)=>{
      const [name,features] = target.packages[index];
      pair(pkg.name,name);
      if (pkg.features.length !== features.length) throw new Error('Feature count mismatch: '+source.slug+'/'+pkg.name);
      pkg.features.forEach((feature,j)=>pair(feature,features[j]));
    });
    const extras = source.extras || [];
    const enExtras = target.extras || [];
    if (extras.length !== enExtras.length) throw new Error('Extras count mismatch: '+source.slug);
    extras.forEach((item,index)=>{
      pair(item.name,enExtras[index][0]);
      pair(item.detail,enExtras[index][1]);
      pair(item.unit,'/year');
    });
    const sections = source.extraSections || [];
    const enSections = target.extraSections || [];
    if (sections.length !== enSections.length) throw new Error('Extra section count mismatch: '+source.slug);
    sections.forEach((section,index)=>{
      const [title,intro,items] = enSections[index];
      pair(section.title,title);
      pair(section.intro,intro);
      if (section.items.length !== items.length) throw new Error('Extra item count mismatch: '+source.slug+'/'+section.title);
      section.items.forEach((item,j)=>{
        pair(item.name,items[j][0]);
        pair(item.detail,items[j][1]);
      });
    });
    if (source.common.length !== target.common.length) throw new Error('Conditions count mismatch: '+source.slug);
    source.common.forEach((condition,index)=>pair(condition,target.common[index]));
    pair(source.notIncluded,target.notIncluded);
  }
}
fillCatalogue();

// Bespoke branding, graphic design and QR/NFC service pages.
// The shared catalogue translations supply all product details and conditions.
const bespokePageEnglish = {
  "Logotipos": "Logos",
  "e identidad visual": "and visual identity",
  "Logotipos e identidad visual en SouthBear Studio.": "Logos and visual identity at SouthBear Studio.",
  "Paquetes de logotipos e identidad visual": "Logo and visual identity packages",
  "Haz clic para saber más": "Click to learn more",
  "Ver paquete": "View package",
  "← Logotipos e identidad visual": "← Logos and visual identity",
  "Qué incluye": "What's included",
  "Aplicaciones incluidas": "Included brand applications",
  "Elige 3 aplicaciones corporativas sencillas de entre las siguientes opciones:": "Choose 3 simple branded applications from the following options:",
  "Incluye 6 aplicaciones corporativas en total, no 3 + 6. Opciones contempladas:": "Includes 6 branded applications in total, not 3 + 6. Available options:",
  "5 plantillas editables para redes sociales": "5 editable social media templates",
  "También incluye papelería: tarjeta de visita, hoja membretada y sobre.": "Stationery is also included: business card, letterhead and envelope.",
  "Exclusiones y limitaciones": "Exclusions and limitations",
  "Precios con IVA incluido.": "Prices include VAT.",
  "de SouthBear Studio. Conoce qué incluye este paquete de identidad visual.": "at SouthBear Studio. Find out what this visual identity package includes.",
  "Explora los diseños": "Explore the designs",
  "Servicios de diseño gráfico": "Graphic design services",
  "Ideas que": "Ideas that",
  "toman forma": "take shape",
  "Cada formato, una forma distinta de comunicar. Selecciona una pieza y descubre qué incluye.": "Every format is a different way to communicate. Choose a design to see what's included.",
  "Ver detalles de": "View details of",
  "Ponte en contacto": "Get in touch",
  "Complementos": "Add-ons",
  "Un poco": "A little",
  "más": "more",
  "Para cuando una idea necesita llegar más lejos.": "For when an idea needs to go further.",
  "Cómo trabajamos": "How we work",
  "De la idea": "From an idea",
  "a la pieza": "to the finished design",
  "Un proceso sencillo, con todo claro desde el principio.": "A straightforward process, with everything clear from the start.",
  "Nos cuentas tu idea": "Tell us your idea",
  "Qué necesitas, para quién es y dónde se va a utilizar.": "Tell us what you need, who it's for and where it will be used.",
  "Diseñamos": "We design",
  "Preparamos la pieza gráfica adaptada al formato y al alcance acordado.": "We create your design to match the agreed format and scope.",
  "Revisamos y entregamos": "We review and deliver",
  "Aplicamos las revisiones incluidas y entregamos los archivos finales correspondientes.": "We make the included revisions and deliver the agreed final files.",
  "¿También necesitas imprimirlo?": "Need it printed too?",
  "Podemos gestionar la impresión física de tus diseños, bajo presupuesto según cantidades, materiales, acabados y envío. La impresión no está incluida en el precio del diseño.": "We can arrange physical printing for your designs, quoted separately according to quantities, materials, finishes and delivery. Printing is not included in the design price.",
  "Información del servicio": "Service information",
  "Todo claro.": "Everything clear.",
  "El buen diseño también está en los detalles.": "Great design is in the details, too.",
  "No incluido:": "Not included:",
  "Todos los precios indicados incluyen IVA.": "All listed prices include VAT.",
  "¿Tienes una idea?": "Have an idea?",
  "Hagámosla visible.": "Let's bring it to life.",
  "Tu negocio.": "Your business.",
  "En un toque.": "One tap away.",
  "Cartas, catálogos y soluciones QR/NFC para conectar tu negocio con tus clientes. Sencillo, directo y pensado para móviles.": "Digital menus, catalogues and QR/NFC solutions that connect your business with customers. Simple, direct and designed for mobile.",
  "Descubre las soluciones": "Explore the solutions",
  "Vista de carta digital en un smartphone": "Digital menu displayed on a smartphone",
  "Escanea.": "Scan.",
  "Descubre.": "Discover.",
  "Conecta.": "Connect.",
  "Sin instalar aplicaciones. Solo un código QR o un toque NFC para acceder a la información.": "No apps to install. Just scan a QR code or tap with NFC to access the information.",
  "Ejemplo del uso de un código QR": "Example of QR code scanning",
  "Soluciones": "Solutions",
  "a tu medida": "tailored to you",
  "Selecciona una opción para conocer sus características y condiciones.": "Choose an option to see its features and terms.",
  "Reseñas": "Reviews",
  "Catálogos digitales": "Digital catalogues",
  "Ver qué incluye": "See what's included",
  "Todo tu catálogo.": "Your entire catalogue.",
  "Siempre a mano.": "Always within reach.",
  "La información organizada y preparada para consultar desde cualquier móvil.": "Your information, organised and ready to browse on any smartphone.",
  "Ejemplo de catálogo digital": "Digital catalogue example",
  "Del soporte físico": "From physical displays",
  "al mundo digital.": "to the digital world.",
  "Metacrilato, madera y NFC como punto de encuentro con tu contenido.": "Acrylic, wood and NFC: connecting people with your digital content.",
  "Ejemplo de soportes QR y NFC": "QR and NFC display examples",
  "Un poco más": "A little extra",
  "Extras, soportes y complementos para adaptar cada solución a tu negocio.": "Extras, physical displays and add-ons to tailor each solution to your business.",
  "Sin sorpresas.": "No surprises.",
  "Una idea.": "One idea.",
  "Mil conexiones.": "A thousand connections."
};
for (const [spanish, english] of Object.entries(bespokePageEnglish)) pair(spanish, english);

const replacementEntries = [...translations].filter(([key])=>key.length>=3)
  .sort((a,b)=>b[0].length-a[0].length);

function htmlUnescape(value) {
  return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&#x27;/g,"'").replace(/&nbsp;/g,' ');
}
function htmlEscape(value) {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function translate(value) {
  if (!value || !/[a-záéíóúñ]/i.test(value)) return value;
  const unescaped = htmlUnescape(value);
  const stripped = unescaped.trim();
  if (!stripped) return value;
  const exact = translations.get(stripped);
  if (exact) return value.replace(value.trim(), htmlEscape(exact));
  let output = unescaped;
  for (const [es,en] of replacementEntries) {
    if (output.includes(es)) output = output.split(es).join(en);
  }
  return output === unescaped ? value : htmlEscape(output);
}
function englishPath(href) {
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/en/')) return href;
  // Only navigation links, not image/script/font/media URLs.
  return '/en' + href;
}
function translateTag(tag) {
  if (/^<\s*\/|^<!/.test(tag)) return tag;
  const isAnchor = /^<a\b/i.test(tag);
  const isLocaleLink = /\bdata-sb-lang=/.test(tag);
  let output = tag;
  if (isAnchor && !isLocaleLink) {
    output=output.replace(/(\bhref=)(["'])(.*?)\2/gi,(_,key,q,value)=>key+q+englishPath(value)+q);
  }
  output=output.replace(/\b(title|alt|aria-label|placeholder|content|data-text)=(["'])(.*?)\2/gi,
    (whole,key,q,value)=>{
      // URLs, colours, MIME types and data attributes should never be translated.
      if (/^https?:|^#|^image\/|^text\/|^\d|^#[a-f0-9]+$/i.test(value)) return whole;
      return key+'='+q+translate(value)+q;
    }
  );
  return output;
}
function translateMarkup(input) {
  // Preserve JS, JSON, SVG path data, CSS and comments. Translate only
  // rendered text nodes and human-facing HTML attributes.
  return input.replace(
    /(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>|[^<]+)/gi,
    chunk=>chunk.startsWith('<') ? (
      /^<(script|style|!--)/i.test(chunk) ? chunk : translateTag(chunk)
    ) : translate(chunk)
  );
}
function englishHeroLetters(html){
  // Both service hero headlines are composed of individual animated letters:
  // replacing their text nodes would produce gibberish. Rebuild only their
  // letter spans using English letters, retaining the original CSS classes.
  const web='WEB DESIGN & DEVELOPMENT';
  html=html.replace(/(<h1\b[^>]*\bid="sb-web-hero-title"[^>]*>)[\s\S]*?(<\/h1>)/i,(all,open,close)=>{
    const newOpen=open.replace(/aria-label="[^"]*"/i,'aria-label="Web design and development"');
    const chars=[...web].map((ch,index)=>
      '<span class="sb-web-letter" aria-hidden="true" data-char="'+(ch===' '?'&nbsp;':htmlEscape(ch))+'" style="--sb-letter-order:'+index+'">'+(ch===' '?'&nbsp;':htmlEscape(ch))+'</span>'
    ).join('');
    return newOpen+chars+close;
  });
  const film='VIDEO PRODUCTION';
  html=html.replace(/(<h1\b[^>]*\bid="sb-av-title"[^>]*>)[\s\S]*?(<\/h1>)/i,(all,open,close)=>{
    const chars=[...film].map(ch=>
      ch===' '
        ? '<span class="sb-av-hero__character sb-av-hero__space" aria-hidden="true">&nbsp;</span>'
        : '<span class="sb-av-hero__character" aria-hidden="true">'+htmlEscape(ch)+'</span>'
    ).join('');
    return open+chars+'<span class="sb-av-hero__rec" aria-hidden="true"></span>'+close;
  });
  // Rebuild this three-line editorial heading as one natural English phrase.
  html=html.replace(/(<section class="editorial-hero">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/i,
    (_,opening,closing)=>opening+'Graphic<br/><span>design</span><br/><em>&amp; advertising<span class="period">.</span></em>'+closing);
  return html;
}
function urlForPage(relativeFile) {
  const directory=path.posix.dirname(relativeFile);
  return directory==='.'?'/':'/'+directory+'/';
}
function insertSEO(html,route){
  const spanishUrl='https://southbearstudio.com'+route;
  const englishUrl='https://southbearstudio.com/en'+route;
  html=html.replace(/<html\b[^>]*\blang="es"/i, m=>m.replace('lang="es"','lang="en"'));
  html=html.replace(/(<meta\b[^>]*\bproperty="og:locale"[^>]*\bcontent=")es_ES(")/i,'$1en_GB$2');
  html=html.replace(/(<link\b[^>]*\brel="canonical"[^>]*\bhref=")[^"]*(")/i,'$1'+englishUrl+'$2');
  html=html.replace(/(<meta\b[^>]*\bproperty="og:url"[^>]*\bcontent=")[^"]*(")/i,'$1'+englishUrl+'$2');
  const links='<link rel="alternate" hreflang="es" href="'+spanishUrl+'"/>'+
    '<link rel="alternate" hreflang="en" href="'+englishUrl+'"/>'+
    '<link rel="alternate" hreflang="x-default" href="'+spanishUrl+'"/>';
  return html.replace('</head>',links+'</head>');
}
function insertSpanishSEO(html,route){
  const spanishUrl='https://southbearstudio.com'+route;
  const englishUrl='https://southbearstudio.com/en'+route;
  const links='<link rel="alternate" hreflang="es" href="'+spanishUrl+'"/>'+
    '<link rel="alternate" hreflang="en" href="'+englishUrl+'"/>'+
    '<link rel="alternate" hreflang="x-default" href="'+spanishUrl+'"/>';
  return html.replace('</head>',links+'</head>');
}

const files=[];
async function walk(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    if(directory===dist && entry.name==='en') continue;
    const full=path.join(directory,entry.name);
    if(entry.isDirectory()) await walk(full);
    else if(entry.isFile() && entry.name==='index.html') files.push(full);
  }
}
await walk(dist);
if(files.length<8) throw new Error('Expected the full prerendered site, found '+files.length+' HTML pages.');
let enCount=0;
for(const sourceFile of files){
  const rel=path.relative(dist,sourceFile).split(path.sep).join('/');
  const route=urlForPage(rel);
  // No generar copia /en/ ni enlaces hreflang de una entrada privada.
  if (route.startsWith('/acceso/')) continue;
  const original=await readFile(sourceFile,'utf8');
  const translated=insertSEO(englishHeroLetters(translateMarkup(original)),route)
    .replace('</body>','<script type="module" src="/southbear-translate-live.js"></script></body>');
  const destination=path.join(dist,'en',rel);
  await mkdir(path.dirname(destination),{recursive:true});
  // Astro may have already prerendered a native, fully translated English page.
  // Never overwrite it with a machine/dictionary-derived copy of Spanish.
  let nativeEnglishExists=false;
  try { await readFile(destination,'utf8'); nativeEnglishExists=true; }
  catch (error) { if (error.code!=='ENOENT') throw error; }
  if (!nativeEnglishExists) {
    await writeFile(destination,translated);
  }
  await writeFile(sourceFile,insertSpanishSEO(original,route));
  enCount++;
}

// The quote builder adds text and options after page load. Translate those
// newly inserted labels without altering the original Spanish form values.
const dictionary=Object.fromEntries(translations);
const runtime=String.raw`
const dictionary = new Map(Object.entries(DICTIONARY_PLACEHOLDER));
const entries=[...dictionary].sort((a,b)=>b[0].length-a[0].length);
function convert(text){
  const trimmed=text.trim();
  if(dictionary.has(trimmed))return text.replace(trimmed,dictionary.get(trimmed));
  let result=text;
  for(const [es,en] of entries)if(result.includes(es))result=result.split(es).join(en);
  return result;
}
function updateText(node){
  if(node.nodeType===3){
    const parent=node.parentElement;
    if(parent?.closest('script,style,textarea,[contenteditable],.sb-lang-selector'))return;
    const next=convert(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
  } else if(node.nodeType===1){
    if(node.matches('script,style'))return;
    for(const child of node.childNodes)updateText(child);
  }
}
const form=document.querySelector('#quote-form');
if(form){
  form.addEventListener('submit',()=>{
    queueMicrotask(()=>{
      const box=document.querySelector('#quote-text');
      if(box)box.value=convert(box.value);
      const send=document.querySelector('#send-quote');
      if(send && send.href.startsWith('mailto:')){
        const url=new URL(send.href);
        const fields=new URLSearchParams(url.search);
        for(const key of ['subject','body']){
          if(fields.has(key))fields.set(key,convert(fields.get(key)));
        }
        send.href='mailto:'+url.pathname+'?'+fields.toString();
      }
    });
  });
}
const observer=new MutationObserver(records=>{
  for(const record of records){
    for(const node of record.addedNodes)updateText(node);
    if(record.type==='characterData')updateText(record.target);
  }
});
observer.observe(document.body,{childList:true,characterData:true,subtree:true});
for(const node of document.querySelectorAll('#package option, #extras-options *'))updateText(node);
document.querySelectorAll('[data-sb-lang]').forEach(anchor=>{
  anchor.addEventListener('click',()=>{
    const target=new URL(anchor.href);
    target.search=location.search;
    target.hash=location.hash || target.hash;
    anchor.href=target.toString();
  });
});
`;
await writeFile(path.join(dist,'southbear-translate-live.js'),
  runtime.replace('DICTIONARY_PLACEHOLDER', JSON.stringify(dictionary)));
// Add the English static routes to Astro's sitemap, if present.
for (const entry of await readdir(dist,{withFileTypes:true})) {
  if (!entry.isFile() || !/^sitemap-\d+\.xml$/.test(entry.name)) continue;
  const location=path.join(dist,entry.name);
  const xml=await readFile(location,'utf8');
  if (!xml.includes('</urlset>')) continue;
  const extraUrls=files.filter(file=>
    !urlForPage(path.relative(dist,file).split(path.sep).join('/')).startsWith('/acceso/')
  ).map(file=>{
    const pathname=urlForPage(path.relative(dist,file).split(path.sep).join('/'));
    return '<url><loc>https://southbearstudio.com/en'+pathname+'</loc></url>';
  }).join('');
  await writeFile(location,xml.replace('</urlset>',extraUrls+'</urlset>'));
}
console.log('[SouthBear] Spanish default + '+enCount+' English pages generated.');
