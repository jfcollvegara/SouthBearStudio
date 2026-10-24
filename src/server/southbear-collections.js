import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';
import {InputError,ensureClient,textValue,dateValue,audit} from './southbear-commerce.js';
export {apiResponse,apiError,requestBody,validId,audit};

export function failCollection(error){
  if(error instanceof InputError)return apiError(error.message,error.status);
  if(error?.message&&/^(El formato|La solicitud|Los datos|El JSON)/.test(error.message))return apiError(error.message,400);
  if(/UNIQUE constraint failed: collection_plans/i.test(error?.message||''))return apiError('Este presupuesto, proyecto o borrador ya tiene un plan de cobros. Abre su plan existente.',409);
  if(/El cobro excede|El plan está archivado/.test(error?.message||''))return apiError(error.message,409);
  return dbError(error);
}
const validCents=(v,min=0,max=100000000000)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
export const planColumns='p.id,p.client_id,p.quote_id,p.project_id,p.draft_id,p.title,p.total_cents,p.advance_cents,p.advance_due_date,p.final_due_date,p.notes,p.archived_at,p.created_at,p.updated_at,c.display_name AS client_name,q.code AS quote_code,pr.title AS project_name,d.reference AS draft_reference';
const join=' FROM collection_plans p JOIN clients c ON c.id=p.client_id LEFT JOIN quotes q ON q.id=p.quote_id LEFT JOIN projects pr ON pr.id=p.project_id LEFT JOIN invoice_drafts d ON d.id=p.draft_id ';
const receiptSum='COALESCE((SELECT SUM(r.amount_cents) FROM collection_receipts r WHERE r.plan_id=p.id AND r.canceled_at IS NULL),0)';
export const selectedPlanColumns=planColumns+','+receiptSum+' AS paid_cents';
export function plansSQL(where){
  return 'SELECT '+selectedPlanColumns+join+' WHERE '+where+' ORDER BY p.updated_at DESC LIMIT 51 OFFSET ?';
}
export async function planDetail(db,id){
  const row=await db.prepare('SELECT '+selectedPlanColumns+join+' WHERE p.id=?').bind(id).first();
  if(!row)return null;
  const receipts=await db.prepare('SELECT id,amount_cents,paid_date,method,reference,notes,canceled_at,cancel_reason,created_at FROM collection_receipts WHERE plan_id=? ORDER BY paid_date DESC,created_at DESC LIMIT 300').bind(id).all();
  row.receipts=receipts.results||[];
  return row;
}
export function normalizePlanMeta(raw,total){
  const title=textValue(raw.title,'Nombre del trabajo',200,{required:true});
  const notes=textValue(raw.notes??'','Notas',3000);
  const advance_due_date=dateValue(raw.advance_due_date??'','Vencimiento del anticipo');
  const final_due_date=dateValue(raw.final_due_date??'','Vencimiento final');
  if(advance_due_date&&final_due_date&&final_due_date<advance_due_date)throw new InputError('El vencimiento final debe ser posterior al anticipo.');
  const advance_cents=raw.advance_cents;
  if(!validCents(advance_cents,0,total))throw new InputError('El importe del anticipo no es válido.');
  return {title,notes,advance_due_date,final_due_date,advance_cents};
}
export async function normalizeNewPlan(db,raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Datos de plan no válidos.');
  const client_id=await ensureClient(db,raw.client_id);
  const quote_id=raw.quote_id||null,project_id=raw.project_id||null,draft_id=raw.draft_id||null;
  for(const id of [quote_id,project_id,draft_id])if(id&&!validId(id))throw new InputError('La referencia asociada no es válida.');
  if(quote_id&&draft_id)throw new InputError('El plan debe proceder de un presupuesto o un borrador, no de ambos.');
  const [quote,project,draft]=await Promise.all([
    quote_id?db.prepare('SELECT client_id,status,archived_at,total_cents FROM quotes WHERE id=?').bind(quote_id).first():null,
    project_id?db.prepare('SELECT client_id,quote_id,archived_at FROM projects WHERE id=?').bind(project_id).first():null,
    draft_id?db.prepare('SELECT client_id,quote_id,project_id,archived_at,total_cents FROM invoice_drafts WHERE id=?').bind(draft_id).first():null
  ]);
  if(quote_id&&(!quote||quote.client_id!==client_id||quote.status!=='aceptado'||quote.archived_at))
    throw new InputError('Selecciona un presupuesto aceptado y activo del cliente.');
  if(project_id&&(!project||project.client_id!==client_id||project.archived_at))
    throw new InputError('Selecciona un proyecto activo de ese cliente.');
  if(draft_id&&(!draft||draft.client_id!==client_id||draft.archived_at))
    throw new InputError('Selecciona un borrador de facturación activo de ese cliente.');
  if(quote&&project?.quote_id&&project.quote_id!==quote_id)
    throw new InputError('El proyecto pertenece a otro presupuesto.');
  if(draft&&project&&draft.project_id&&draft.project_id!==project_id)
    throw new InputError('El borrador corresponde a otro proyecto.');
  if(draft&&project?.quote_id&&draft.quote_id&&project.quote_id!==draft.quote_id)
    throw new InputError('El borrador y el proyecto no corresponden al mismo presupuesto.');
  const total_cents=quote?quote.total_cents:draft?draft.total_cents:raw.total_cents;
  if(!validCents(total_cents,1))throw new InputError('El importe total del trabajo no es válido.');
  const meta=normalizePlanMeta(raw,total_cents);
  // Si el cliente selecciona un presupuesto/borrador, el servidor toma su importe guardado.
  return {client_id,quote_id,project_id,draft_id,total_cents,...meta};
}
export function normalizeReceipt(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Movimiento no válido.');
  const amount_cents=raw.amount_cents;
  if(!validCents(amount_cents,1))throw new InputError('Indica un importe cobrado positivo.');
  const paid_date=dateValue(raw.paid_date??'','Fecha de cobro',{required:true});
  const method=raw.method;
  if(!['transferencia','tarjeta','efectivo','bizum','otro'].includes(method))throw new InputError('Método de pago no válido.');
  return {
    amount_cents,paid_date,method,
    reference:textValue(raw.reference??'','Referencia',120),
    notes:textValue(raw.notes??'','Notas del movimiento',1500)
  };
}
export function receiptStatement(db,planId,receipt){
  return db.prepare('INSERT INTO collection_receipts(id,plan_id,amount_cents,paid_date,method,reference,notes) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),planId,receipt.amount_cents,receipt.paid_date,receipt.method,receipt.reference,receipt.notes);
}
