import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';

export {apiResponse,apiError,dbError,requestBody,validId};
export class InputError extends Error{
  constructor(message,status=400){super(message);this.status=status;}
}
export function textValue(value,name,max,{required=false}={}){
  if(typeof value!=='string')throw new InputError('Revisa el campo «'+name+'».');
  const text=value.trim();
  if(text.length>max||(required&&!text)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))throw new InputError('Revisa el campo «'+name+'».');
  return text;
}
export function choice(value,name,choices){
  if(!choices.includes(value))throw new InputError('El valor de «'+name+'» no es válido.');
  return value;
}
export function dateValue(value,name,{required=false}={}){
  const text=textValue(value,name,10,{required});
  if(!text)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text))throw new InputError('La fecha «'+name+'» no es válida.');
  const parsed=new Date(text+'T00:00:00Z');
  if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==text)throw new InputError('La fecha «'+name+'» no es válida.');
  return text;
}
export async function ensureClient(db,id){
  if(!validId(id))throw new InputError('Selecciona un cliente válido.');
  const row=await db.prepare('SELECT id FROM clients WHERE id=? AND archived_at IS NULL').bind(id).first();
  if(!row)throw new InputError('El cliente no existe o está archivado.');
  return id;
}
export function audit(db,entity,id,operation,user,fields=[]){
  return db.prepare('INSERT INTO audit_events(id,subject_type,subject_id,operation,actor_email,field_names) VALUES (?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),entity,id,operation,user.email,JSON.stringify(fields));
}
export function fail(error){
  return error instanceof InputError?apiError(error.message,error.status):
    error?.message&&/^(El formato|La solicitud|Los datos|El JSON)/.test(error.message)?apiError(error.message,400):dbError(error);
}
export const projectFields=['client_id','quote_id','title','category','status','start_date','due_date','description','notes'];
export const projectColumns='p.id,p.client_id,p.quote_id,p.title,p.category,p.status,p.start_date,p.due_date,p.description,p.notes,p.created_at,p.updated_at,p.archived_at,c.display_name AS client_name,q.code AS quote_code';
export function normalizeProject(input){
  const quote=input.quote_id==null||input.quote_id===''?null:input.quote_id;
  if(quote!==null&&!validId(quote))throw new InputError('Presupuesto asociado no válido.');
  const start=dateValue(input.start_date??'','Inicio');
  const due=dateValue(input.due_date??'','Entrega');
  if(start&&due&&due<start)throw new InputError('La entrega no puede ser anterior al inicio.');
  return {
    client_id:input.client_id,quote_id:quote,
    title:textValue(input.title,'Título',200,{required:true}),
    category:choice(input.category??'otro','Categoría',['diseno','web','audiovisual','otro']),
    status:choice(input.status??'planificado','Estado',['planificado','en_curso','en_revision','entregado','cancelado']),
    start_date:start,due_date:due,
    description:textValue(input.description??'','Descripción',5000),
    notes:textValue(input.notes??'','Notas',4000)
  };
}
export async function ensureQuoteLink(db,quoteId,clientId,projectId=null){
  if(!quoteId)return;
  const q=await db.prepare('SELECT id,client_id,status,archived_at FROM quotes WHERE id=?').bind(quoteId).first();
  if(!q||q.client_id!==clientId||q.status!=='aceptado'||q.archived_at!==null)throw new InputError('El presupuesto asociado debe estar aceptado, activo y pertenecer al cliente.');
  const existing=await db.prepare('SELECT id FROM projects WHERE quote_id=?').bind(quoteId).first();
  if(existing&&existing.id!==projectId)throw new InputError('Ese presupuesto ya está vinculado a otro proyecto.',409);
}
export const quoteColumns='q.id,q.code,q.client_id,q.title,q.status,q.issue_date,q.valid_until,q.notes,q.subtotal_cents,q.tax_cents,q.total_cents,q.currency,q.created_at,q.updated_at,q.archived_at,c.display_name AS client_name';
const TAXES=new Set([0,400,1000,2100]);
export function normalizeQuote(input){
  const title=textValue(input.title,'Título',200,{required:true});
  const issue_date=dateValue(input.issue_date??'','Fecha del presupuesto',{required:true});
  const valid_until=dateValue(input.valid_until??'','Válido hasta');
  if(valid_until&&valid_until<issue_date)throw new InputError('La validez no puede terminar antes de la fecha de emisión.');
  const notes=textValue(input.notes??'','Condiciones y notas',4000);
  if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>25)throw new InputError('Añade entre 1 y 25 conceptos.');
  let subtotal_cents=0,tax_cents=0;
  const lines=input.lines.map((line,position)=>{
    if(!line||typeof line!=='object'||Array.isArray(line))throw new InputError('Concepto no válido.');
    const concept=textValue(line.concept,'Concepto '+(position+1),240,{required:true});
    const details=textValue(line.details??'','Descripción '+(position+1),1000);
    const quantity_milli=line.quantity_milli,unit_cents=line.unit_cents,vat_bps=line.vat_bps;
    if(!Number.isSafeInteger(quantity_milli)||quantity_milli<1||quantity_milli>100000000)throw new InputError('Cantidad no válida en el concepto '+(position+1)+'.');
    if(!Number.isSafeInteger(unit_cents)||unit_cents<0||unit_cents>1000000000)throw new InputError('Precio no válido en el concepto '+(position+1)+'.');
    if(!Number.isInteger(vat_bps)||!TAXES.has(vat_bps))throw new InputError('Tipo de IVA no válido en el concepto '+(position+1)+'.');
    const base_cents=Math.round(quantity_milli*unit_cents/1000);
    const vat_cents=Math.round(base_cents*vat_bps/10000);
    if(!Number.isSafeInteger(base_cents)||!Number.isSafeInteger(vat_cents)||base_cents>100000000000)throw new InputError('El importe supera el límite admitido.');
    subtotal_cents+=base_cents;tax_cents+=vat_cents;
    return {position,concept,details,quantity_milli,unit_cents,vat_bps,base_cents,vat_cents,total_cents:base_cents+vat_cents};
  });
  if(!Number.isSafeInteger(subtotal_cents+tax_cents)||subtotal_cents+tax_cents>100000000000)throw new InputError('El importe supera el límite admitido.');
  return {client_id:input.client_id,title,issue_date,valid_until,notes,lines,subtotal_cents,tax_cents,total_cents:subtotal_cents+tax_cents};
}
export async function quoteDetail(db,id){
  const item=await db.prepare('SELECT '+quoteColumns+' FROM quotes q JOIN clients c ON c.id=q.client_id WHERE q.id=?').bind(id).first();
  if(!item)return null;
  const results=await db.prepare('SELECT id,position,concept,details,quantity_milli,unit_cents,vat_bps,base_cents,vat_cents,total_cents FROM quote_lines WHERE quote_id=? ORDER BY position').bind(id).all();
  item.lines=results.results||[];
  return item;
}
export function quoteInserts(db,quoteId,lines){
  return lines.map(line=>db.prepare('INSERT INTO quote_lines(id,quote_id,position,concept,details,quantity_milli,unit_cents,vat_bps,base_cents,vat_cents,total_cents) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(
    crypto.randomUUID(),quoteId,line.position,line.concept,line.details,line.quantity_milli,line.unit_cents,line.vat_bps,line.base_cents,line.vat_cents,line.total_cents));
}
