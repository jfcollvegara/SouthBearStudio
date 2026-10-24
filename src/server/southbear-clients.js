import {apiError,apiResponse} from './southbear-access.js';

export const CLIENT_FIELDS=[
  'display_name','client_type','legal_name','tax_id','email','phone',
  'website','address','postal_code','city','province','country','notes'
];
const LIMITS={display_name:160,client_type:20,legal_name:180,tax_id:35,email:180,
  phone:45,website:250,address:250,postal_code:25,city:100,province:100,country:80,notes:3000};
const EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TYPE_ALLOWED=new Set(['empresa','particular']);
export const CLIENT_COLUMNS='id,display_name,client_type,legal_name,tax_id,email,phone,website,address,postal_code,city,province,country,notes,created_at,updated_at,archived_at';

export async function requestBody(request){
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))throw Error('El formato debe ser JSON.');
  if(Number(request.headers.get('content-length')||0)>20000)throw Error('La solicitud supera el tamaño permitido.');
  const text=await request.text();
  if(text.length>20000)throw Error('La solicitud supera el tamaño permitido.');
  let parsed;
  try{parsed=JSON.parse(text);}catch{throw Error('El JSON de la solicitud no es válido.');}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Los datos enviados no son válidos.');
  return parsed;
}
export function normalizedClient(raw){
  const client={};
  for(const key of CLIENT_FIELDS){
    const value=raw[key]??(key==='client_type'?'empresa':key==='country'?'España':'');
    if(typeof value!=='string')throw Error('Campo no válido: '+key);
    const clean=value.trim();
    if(clean.length>LIMITS[key]||(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)))throw Error('Valor no válido: '+key);
    client[key]=clean;
  }
  if(!client.display_name)throw Error('Indica el nombre del cliente.');
  if(!TYPE_ALLOWED.has(client.client_type))throw Error('Tipo de cliente no válido.');
  if(client.email&&!EMAIL_RE.test(client.email))throw Error('Introduce un correo electrónico válido.');
  if(client.website&&!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(client.website))throw Error('La página web debe comenzar por https:// y tener un dominio válido.');
  return client;
}
export function validId(id){return typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);}
export function logEvent(db,{subjectId,operation,user,fields=[]}){
  return db.prepare('INSERT INTO audit_events(id,subject_type,subject_id,operation,actor_email,field_names) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),'client',subjectId,operation,user.email,JSON.stringify(fields));
}
export function dbError(error){
  console.error('SouthBear DB operation failed:',error?.message||'unknown');
  return apiError('No se ha podido completar la operación. Inténtalo otra vez.',503);
}
export {apiError,apiResponse};
