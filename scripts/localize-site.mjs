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
  output=output.replace(/\b(title|alt|aria-label|placeholder|content)=(["'])(.*?)\2/gi,
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
