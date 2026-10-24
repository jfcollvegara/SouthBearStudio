// Cliente ligero para las pantallas privadas de presupuestos y proyectos.
// No hay claves ni datos personales embebidos en los ficheros estáticos.
export const API='/api/southbear';
export const el=(tag,text,klass)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(klass)node.className=klass;return node;};
export async function requestApi(resource,{method='GET',payload}={}){
  const init={method,credentials:'same-origin',cache:'no-store',headers:{'X-SouthBear-Request':'1','Accept':'application/json'}};
  if(payload!==undefined){init.headers['Content-Type']='application/json';init.body=JSON.stringify(payload);}
  let response;
  try{response=await fetch(API+resource,init);}catch{throw new Error('No se ha podido conectar con el servidor.');}
  let data;
  try{data=await response.json();}catch{throw new Error('La sesión puede haber caducado. Abre el acceso privado de nuevo.');}
  if(!response.ok||!data?.ok)throw new Error(data?.error||'No se pudo completar la operación.');
  return data;
}
export async function getAll(resource,maxPages=50){
  const rows=[];
  for(let page=1;page<=maxPages;page++){
    const result=await requestApi(resource+(resource.includes('?')?'&':'?')+'page='+page);
    rows.push(...result.items);
    if(!result.hasMore)return rows;
  }
  throw Error('Demasiados registros para el selector. Utiliza la búsqueda del módulo correspondiente.');
}
export function fillOptions(select,rows,{empty='Seleccionar…',selected='',value='id',label='display_name'}={}){
  select.replaceChildren(new Option(empty,''));
  for(const row of rows)select.add(new Option(row[label],row[value]));
  select.value=selected||'';
}
export function todayLocal(){
  const n=new Date(),pad=x=>String(x).padStart(2,'0');
  return n.getFullYear()+'-'+pad(n.getMonth()+1)+'-'+pad(n.getDate());
}
export function formatEuro(cents){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(cents/100);}
export function formatDate(date){if(!date)return 'Sin fecha';const d=date.slice(0,10);return d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4);}
export function minorUnits(raw,places,name){
  let value=String(raw).trim().replace(',','.');
  if(!/^\d+(?:\.\d{1,3})?$/.test(value))throw Error('Revisa '+name+'.');
  const [whole,decimal='']=value.split('.');
  if(decimal.length>places)throw Error('Introduce como máximo '+places+' decimales en '+name+'.');
  const number=Number(whole)*10**places+Number(decimal.padEnd(places,'0'));
  if(!Number.isSafeInteger(number))throw Error('El valor de '+name+' es demasiado grande.');
  return number;
}
export function setBusy(button,isBusy){button.disabled=isBusy;button.setAttribute('aria-busy',String(isBusy));}
export function message(element,value,error=false){element.textContent=value;element.classList.toggle('is-error',error);}
export function clearNodes(parent){parent.replaceChildren();}
export function field(form,name){return form.elements.namedItem(name);}
export function textCell(parent,tag,text,cls){const node=el(tag,text,cls);parent.append(node);return node;}
