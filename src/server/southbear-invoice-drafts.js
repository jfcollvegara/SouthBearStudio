import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';
import {normalizeQuote,textValue,dateValue,ensureClient,InputError,audit} from './southbear-commerce.js';

export {apiResponse,apiError,dbError,requestBody,validId};
export function draftError(error){
  if(error instanceof InputError)return apiError(error.message,error.status);
  if(error?.message && /^(El formato|La solicitud|Los datos|El JSON)/.test(error.message))return apiError(error.message,400);
  return dbError(error);
}
export const draftCols='d.id,d.reference,d.client_id,d.quote_id,d.project_id,d.title,d.planned_date,d.due_date,d.notes,d.subtotal_cents,d.tax_cents,d.total_cents,d.currency,d.created_at,d.updated_at,d.archived_at,c.display_name AS client_name,q.code AS quote_code,p.title AS project_name';
const join=' FROM invoice_drafts d JOIN clients c ON c.id=d.client_id LEFT JOIN quotes q ON q.id=d.quote_id LEFT JOIN projects p ON p.id=d.project_id';
export function listSQL(where){return 'SELECT '+draftCols+join+' WHERE '+where+' ORDER BY d.updated_at DESC LIMIT 51 OFFSET ?';}
export async function draftDetail(db,id){
  const item=await db.prepare('SELECT '+draftCols+join+' WHERE d.id=?').bind(id).first();
  if(!item)return null;
  const result=await db.prepare('SELECT id,position,concept,details,quantity_milli,unit_gross_cents,vat_bps,base_cents,vat_cents,total_cents FROM invoice_draft_lines WHERE draft_id=? ORDER BY position').bind(id).all();
  item.lines=result.results||[];
  return item;
}
export function normalizeDraft(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('El borrador no es válido.');
  const planned_date=dateValue(raw.planned_date??'','Fecha prevista',{required:true});
  const due_date=dateValue(raw.due_date??'','Fecha de vencimiento prevista');
  if(due_date&&due_date<planned_date)throw new InputError('El vencimiento no puede ser anterior a la fecha prevista.');
  const quote=normalizeQuote({
    client_id:raw.client_id,
    title:raw.title,
    issue_date:planned_date,
    valid_until:'',
    notes:raw.notes??'',
    lines:raw.lines
  });
  const quote_id=raw.quote_id===null||raw.quote_id===''||raw.quote_id===undefined?null:raw.quote_id;
  const project_id=raw.project_id===null||raw.project_id===''||raw.project_id===undefined?null:raw.project_id;
  if(quote_id!==null&&!validId(quote_id))throw new InputError('Presupuesto de origen no válido.');
  if(project_id!==null&&!validId(project_id))throw new InputError('Proyecto de origen no válido.');
  return {...quote,quote_id,project_id,planned_date,due_date};
}
export async function validateReferences(db,item){
  await ensureClient(db,item.client_id);
  if(item.quote_id){
    const q=await db.prepare('SELECT id,client_id,status,archived_at FROM quotes WHERE id=?').bind(item.quote_id).first();
    if(!q||q.client_id!==item.client_id||q.status!=='aceptado'||q.archived_at!==null)
      throw new InputError('El presupuesto de origen debe estar aceptado, activo y pertenecer al cliente.');
  }
  if(item.project_id){
    const p=await db.prepare('SELECT client_id,quote_id,archived_at FROM projects WHERE id=?').bind(item.project_id).first();
    if(!p||p.client_id!==item.client_id||p.archived_at!==null)
      throw new InputError('El proyecto debe estar activo y pertenecer al cliente.');
    if(p.quote_id&&item.quote_id&&p.quote_id!==item.quote_id)
      throw new InputError('El presupuesto no corresponde al proyecto seleccionado.');
  }
}
export function insertDraftLines(db,id,lines){
  return lines.map(line=>db.prepare(
    'INSERT INTO invoice_draft_lines(id,draft_id,position,concept,details,quantity_milli,unit_gross_cents,vat_bps,base_cents,vat_cents,total_cents) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(
    crypto.randomUUID(),id,line.position,line.concept,line.details,line.quantity_milli,
    line.unit_gross_cents,line.vat_bps,line.base_cents,line.vat_cents,line.total_cents
  ));
}
export {audit};
