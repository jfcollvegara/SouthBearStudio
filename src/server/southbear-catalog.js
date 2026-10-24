import {apiResponse,apiError,requestBody,validId,dbError} from './southbear-clients.js';
import {InputError,textValue,choice,audit} from './southbear-commerce.js';
export {apiResponse,apiError,requestBody,validId,audit};

const kinds=['servicio','paquete','extra'];
const categories=['diseno','web','audiovisual','otro'];
const taxes=[0,400,1000,2100];
export const serviceFields=['name','description','category','service_kind','unit_label','unit_gross_cents','vat_bps','internal_notes','sort_order'];
export const serviceColumns='id,name,description,category,service_kind,unit_label,unit_gross_cents,vat_bps,internal_notes,sort_order,created_at,updated_at,archived_at';

export function normalizeService(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Datos del servicio no válidos.');
  const name=textValue(raw.name,'Nombre del servicio',240,{required:true});
  const description=textValue(raw.description??'','Descripción del servicio',1000);
  const category=choice(raw.category??'otro','Categoría',categories);
  const service_kind=choice(raw.service_kind??'servicio','Tipo',kinds);
  const unit_label=textValue(raw.unit_label??'unidad','Unidad de venta',50,{required:true});
  const unit_gross_cents=raw.unit_gross_cents;
  if(!Number.isSafeInteger(unit_gross_cents)||unit_gross_cents<0||unit_gross_cents>1000000000)throw new InputError('El precio con IVA incluido debe ser un importe válido.');
  const vat_bps=raw.vat_bps;
  if(!Number.isInteger(vat_bps)||!taxes.includes(vat_bps))throw new InputError('Selecciona un tipo de IVA válido.');
  const internal_notes=textValue(raw.internal_notes??'','Notas internas',3000);
  const sort_order=raw.sort_order??0;
  if(!Number.isSafeInteger(sort_order)||sort_order<0||sort_order>100000)throw new InputError('Orden no válido.');
  return {name,description,category,service_kind,unit_label,unit_gross_cents,vat_bps,internal_notes,sort_order};
}
export async function serviceDetail(db,id){
  const item=await db.prepare('SELECT '+serviceColumns+' FROM studio_services WHERE id=?').bind(id).first();
  if(!item)return null;
  const prices=await db.prepare('SELECT gross_cents,vat_bps,changed_at FROM studio_service_price_history WHERE service_id=? ORDER BY changed_at DESC LIMIT 30').bind(id).all();
  item.price_history=prices.results||[];
  return item;
}
export function serviceError(error){
  if(error instanceof InputError)return apiError(error.message,error.status);
  if(error?.message&&/^(El formato|La solicitud|Los datos|El JSON)/.test(error.message))return apiError(error.message,400);
  return dbError(error);
}
export function recordPrice(db,id,obj,actor){
  return db.prepare('INSERT INTO studio_service_price_history(id,service_id,gross_cents,vat_bps,actor_email) VALUES(?,?,?,?,?)')
    .bind(crypto.randomUUID(),id,obj.unit_gross_cents,obj.vat_bps,actor.email);
}
