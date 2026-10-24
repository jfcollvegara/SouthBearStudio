import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';
import {InputError,textValue,dateValue,audit} from './southbear-commerce.js';
import {ensureSupplier} from './southbear-suppliers.js';
export {apiResponse,apiError,requestBody,validId,audit};
const categories=['software','materiales','subcontratacion','equipo','transporte','marketing','alojamiento','otros'];
const methods=['transferencia','tarjeta','efectivo','bizum','otro'];
const taxes=[0,400,1000,2100];
const isMoney=c=>Number.isSafeInteger(c)&&c>=1&&c<=100000000000;
export function expenseError(err){
  if(err instanceof InputError)return apiError(err.message,err.status);
  if(/El gasto está archivado|El pago excede/.test(err?.message||''))return apiError(err.message,409);
  if(/^(El formato|La solicitud|Los datos|El JSON)/.test(err?.message||''))return apiError(err.message,400);
  return dbError(err);
}
export const expenseCols='e.id,e.supplier_id,e.supplier_name,e.title,e.category,e.project_id,e.expense_date,e.due_date,e.document_ref,e.notes,e.gross_cents,e.vat_bps,e.base_cents,e.vat_cents,e.created_at,e.updated_at,e.archived_at,p.title AS project_name';
const join=' FROM expenses e LEFT JOIN projects p ON p.id=e.project_id';
const paidExpr='COALESCE((SELECT SUM(pay.amount_cents) FROM expense_payments pay WHERE pay.expense_id=e.id AND pay.canceled_at IS NULL),0)';
export function expensesQuery(where){
  return 'SELECT '+expenseCols+','+paidExpr+' AS paid_cents'+join+' WHERE '+where+' ORDER BY e.expense_date DESC,e.created_at DESC LIMIT 51 OFFSET ?';
}
export async function expenseDetail(db,id){
  const e=await db.prepare('SELECT '+expenseCols+','+paidExpr+' AS paid_cents'+join+' WHERE e.id=?').bind(id).first();
  if(!e)return null;
  const result=await db.prepare('SELECT id,amount_cents,paid_date,method,reference,notes,canceled_at,cancel_reason,created_at FROM expense_payments WHERE expense_id=? ORDER BY paid_date DESC,created_at DESC LIMIT 300').bind(id).all();
  e.payments=result.results||[];return e;
}
export function normalizeExpense(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Los datos del gasto no son válidos.');
  const supplier_name=textValue(raw.supplier_name,'Proveedor',180,{required:true});
  const supplier_id=raw.supplier_id||null;
  if(supplier_id&&!validId(supplier_id))throw new InputError('La ficha de proveedor no es válida.');
  const title=textValue(raw.title,'Concepto',200,{required:true});
  const category=raw.category;
  if(!categories.includes(category))throw new InputError('Categoría de gasto no válida.');
  const project_id=raw.project_id||null;
  if(project_id&&!validId(project_id))throw new InputError('Proyecto no válido.');
  const expense_date=dateValue(raw.expense_date??'','Fecha del gasto',{required:true});
  const due_date=dateValue(raw.due_date??'','Vencimiento');
  const document_ref=textValue(raw.document_ref??'','Referencia del justificante',120);
  const notes=textValue(raw.notes??'','Notas',3000);
  const gross_cents=raw.gross_cents,vat_bps=raw.vat_bps;
  if(!isMoney(gross_cents))throw new InputError('Importe con IVA no válido.');
  if(!taxes.includes(vat_bps))throw new InputError('Tipo de IVA no válido.');
  const base_cents=Math.round(gross_cents*10000/(10000+vat_bps));
  const vat_cents=gross_cents-base_cents;
  return {supplier_id,supplier_name,title,category,project_id,expense_date,due_date,document_ref,notes,gross_cents,vat_bps,base_cents,vat_cents};
}
export async function validateProject(db,projectId){
  if(!projectId)return;
  const row=await db.prepare('SELECT id,archived_at FROM projects WHERE id=?').bind(projectId).first();
  if(!row||row.archived_at)throw new InputError('Selecciona un proyecto activo.');
}
export function normalizePayment(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Los datos del pago no son válidos.');
  if(!isMoney(raw.amount_cents))throw new InputError('Indica un importe positivo.');
  const paid_date=dateValue(raw.paid_date??'','Fecha de pago',{required:true});
  if(!methods.includes(raw.method))throw new InputError('Método de pago no válido.');
  return {amount_cents:raw.amount_cents,paid_date,method:raw.method,
    reference:textValue(raw.reference??'','Referencia',120),
    notes:textValue(raw.notes??'','Notas del pago',1200)};
}
export function paymentStatement(db,id,payment){
  return db.prepare('INSERT INTO expense_payments(id,expense_id,amount_cents,paid_date,method,reference,notes) VALUES (?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(),id,payment.amount_cents,payment.paid_date,payment.method,payment.reference,payment.notes);
}

export async function resolveExpenseSupplier(db,expense,oldSupplierId=null){
  const supplier=await ensureSupplier(db,expense.supplier_id,oldSupplierId);
  // Con ficha: usar el nombre actual al registrar o editar, dejando constancia
  // del texto usado entonces en el gasto. Sin ficha: mantener proveedor libre.
  if(supplier)expense.supplier_name=supplier.display_name;
  return expense;
}
