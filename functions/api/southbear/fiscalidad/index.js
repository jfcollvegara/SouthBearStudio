import {apiResponse,apiError,dbError,requestBody,validId} from '../../../../src/server/southbear-clients.js';
import {InputError,textValue,dateValue,ensureClient,audit} from '../../../../src/server/southbear-commerce.js';

// Registro de CONTROL: el usuario transcribe facturas ya emitidas por un medio válido.
// NO asigna numeración, NO emite PDF fiscal ni presenta modelos a la AEAT.
const kinds=['ordinaria','simplificada','anticipo','final'];
const rates=[0,400,1000,2100];
const money=v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000000;
const fail=e=>e instanceof InputError?apiError(e.message,e.status):
  /UNIQUE constraint failed: sb_tax_invoices.reference/i.test(e?.message||'')?apiError('Esa referencia de factura ya está registrada.',409):
  dbError(e);
function normalizeInvoice(raw){
  const reference=textValue(raw.reference,'Número real de factura',100,{required:true});
  const description=textValue(raw.description,'Concepto',300,{required:true});
  const issue_date=dateValue(raw.issue_date??'','Fecha de factura',{required:true});
  const tax_date=dateValue(raw.tax_date??'','Fecha de devengo de IVA',{required:true});
  if(!kinds.includes(raw.kind))throw new InputError('Tipo de documento no válido. Las rectificativas necesitan tratamiento individual.');
  const base_cents=raw.base_cents,vat_bps=raw.vat_bps,withholding_bps=raw.withholding_bps;
  if(!money(base_cents)||base_cents===0)throw new InputError('La base imponible debe ser positiva.');
  if(!rates.includes(vat_bps))throw new InputError('Tipo de IVA no válido.');
  if(!Number.isInteger(withholding_bps)||withholding_bps<0||withholding_bps>10000)throw new InputError('Introduce manualmente un IRPF entre 0 % y 100 %; 0 % si no procede.');
  const vat_cents=Math.round(base_cents*vat_bps/10000);
  const withholding_cents=Math.round(base_cents*withholding_bps/10000);
  const total_cents=base_cents+vat_cents-withholding_cents;
  if(raw.kind==='simplificada'&&base_cents+vat_cents>40000)throw new InputError('En este control se admiten simplificadas de hasta 400 € IVA incluido.');
  return {client_id:raw.client_id,reference,description,issue_date,tax_date,kind:raw.kind,base_cents,vat_bps,vat_cents,withholding_bps,withholding_cents,total_cents,notes:textValue(raw.notes??'','Notas',1000)};
}
const cols='i.id,i.client_id,i.reference,i.issue_date,i.tax_date,i.kind,i.description,i.base_cents,i.vat_bps,i.vat_cents,i.withholding_bps,i.withholding_cents,i.total_cents,i.notes,i.created_at,c.display_name AS client_name';
const periodSQL=' WHERE i.archived_at IS NULL AND i.tax_date>=? AND i.tax_date<=?';
const expenseSQL=' FROM expenses e LEFT JOIN sb_tax_expense_flags f ON f.expense_id=e.id WHERE e.archived_at IS NULL AND e.expense_date>=? AND e.expense_date<=?';
export async function onRequestGet({env,request}){
  try{
    const q=new URL(request.url).searchParams;
    const year=Number(q.get('year')||new Date().getUTCFullYear()),quarter=Number(q.get('quarter')||Math.floor(new Date().getUTCMonth()/3)+1);
    if(!Number.isInteger(year)||year<2000||year>2100||!Number.isInteger(quarter)||quarter<1||quarter>4)return apiError('Selecciona un año y trimestre válidos.',400);
    const from=year+'-'+String((quarter-1)*3+1).padStart(2,'0')+'-01';
    const to=year+'-'+String(quarter*3).padStart(2,'0')+'-'+new Date(Date.UTC(year,quarter*3,0)).getUTCDate();
    const db=env.SOUTHBEAR_DB;
    const [invoices,expenses,iSummary,eSummary,yearInvoices,yearExpenses]=await Promise.all([
      db.prepare('SELECT '+cols+' FROM sb_tax_invoices i JOIN clients c ON c.id=i.client_id'+periodSQL+' ORDER BY i.tax_date DESC,i.created_at DESC LIMIT 501').bind(from,to).all(),
      db.prepare('SELECT e.id,e.title,e.supplier_name,e.expense_date,e.document_ref,e.base_cents,e.vat_cents,e.gross_cents,COALESCE(f.vat_deductible_cents,0) AS vat_deductible_cents,COALESCE(f.irpf_deductible_cents,0) AS irpf_deductible_cents'+expenseSQL+' ORDER BY e.expense_date DESC,e.created_at DESC LIMIT 501').bind(from,to).all(),
      db.prepare('SELECT COALESCE(SUM(base_cents),0) AS base_cents,COALESCE(SUM(vat_cents),0) AS vat_cents,COALESCE(SUM(withholding_cents),0) AS withheld_cents,COALESCE(SUM(CASE WHEN withholding_bps>0 THEN base_cents ELSE 0 END),0) AS withheld_base_cents,COUNT(*) AS count FROM sb_tax_invoices i'+periodSQL).bind(from,to).first(),
      db.prepare('SELECT COALESCE(SUM(f.vat_deductible_cents),0) AS vat_deductible_cents,COALESCE(SUM(f.irpf_deductible_cents),0) AS irpf_deductible_cents,COUNT(*) AS count'+expenseSQL).bind(from,to).first(),
      db.prepare("SELECT COALESCE(SUM(base_cents),0) AS base_cents,COALESCE(SUM(withholding_cents),0) AS withheld_cents FROM sb_tax_invoices WHERE archived_at IS NULL AND tax_date>=? AND tax_date<=?").bind(year+'-01-01',to).first(),
      db.prepare("SELECT COALESCE(SUM(f.irpf_deductible_cents),0) AS irpf_deductible_cents FROM expenses e LEFT JOIN sb_tax_expense_flags f ON f.expense_id=e.id WHERE e.archived_at IS NULL AND e.expense_date>=? AND e.expense_date<=?").bind(year+'-01-01',to).first()
    ]);
    const il=invoices.results||[],el=expenses.results||[];
    return apiResponse({ok:true,period:{year,quarter,from,to},invoices:il.slice(0,500),expenses:el.slice(0,500),truncated:{invoices:il.length>500,expenses:el.length>500},summary:{
      issued_base_cents:iSummary.base_cents,issued_vat_cents:iSummary.vat_cents,withheld_irpf_cents:iSummary.withheld_cents,withheld_base_cents:iSummary.withheld_base_cents,
      deductible_vat_cents:eSummary.vat_deductible_cents,deductible_expenses_cents:eSummary.irpf_deductible_cents,
      estimated_vat_balance_cents:iSummary.vat_cents-eSummary.vat_deductible_cents,invoices_count:iSummary.count,expenses_count:eSummary.count
    },yearToDate:{issued_base_cents:yearInvoices.base_cents,withheld_irpf_cents:yearInvoices.withheld_cents,deductible_expenses_cents:yearExpenses.irpf_deductible_cents,
      indicative_profit_cents:yearInvoices.base_cents-yearExpenses.irpf_deductible_cents}});
  }catch(e){return fail(e);}
}
export async function onRequestPost({env,request,data}){
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,16000);
    if(raw.action==='invoice'){
      const obj=normalizeInvoice(raw);await ensureClient(db,obj.client_id);
      const id=crypto.randomUUID();
      const fields=['client_id','reference','issue_date','tax_date','kind','description','base_cents','vat_bps','vat_cents','withholding_bps','withholding_cents','total_cents','notes'];
      await db.batch([db.prepare('INSERT INTO sb_tax_invoices(id,'+fields.join(',')+') VALUES (?,'+fields.map(()=>'?').join(',')+')').bind(id,...fields.map(f=>obj[f])),
        audit(db,'tax_invoice',id,'create',data.southbearUser,fields)]);
      return apiResponse({ok:true,id},201);
    }
    if(raw.action==='expense'){
      if(!validId(raw.expense_id))throw new InputError('Gasto no válido.');
      const e=await db.prepare('SELECT id,base_cents,vat_cents,archived_at FROM expenses WHERE id=?').bind(raw.expense_id).first();
      if(!e||e.archived_at)throw new InputError('Ese gasto no existe o está archivado.',404);
      const v=raw.vat_deductible_cents,n=raw.irpf_deductible_cents;
      if(!money(v)||v>e.vat_cents||!money(n)||n>e.base_cents)throw new InputError('Las cantidades deducibles no pueden superar la cuota IVA y la base registradas.');
      await db.batch([
        db.prepare('INSERT INTO sb_tax_expense_flags(expense_id,vat_deductible_cents,irpf_deductible_cents,updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(expense_id) DO UPDATE SET vat_deductible_cents=excluded.vat_deductible_cents,irpf_deductible_cents=excluded.irpf_deductible_cents,updated_at=CURRENT_TIMESTAMP').bind(raw.expense_id,v,n),
        audit(db,'tax_expense',e.id,'update',data.southbearUser,['vat_deductible_cents','irpf_deductible_cents'])
      ]);
      return apiResponse({ok:true});
    }
    throw new InputError('Operación desconocida.');
  }catch(e){return fail(e);}
}
export async function onRequestPatch({env,request,data}){
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,16000);
    if(!validId(raw.id))throw new InputError('Anotación no válida.');
    const prev=await db.prepare('SELECT id FROM sb_tax_invoices WHERE id=? AND archived_at IS NULL').bind(raw.id).first();
    if(!prev)throw new InputError('No existe la anotación activa.',404);
    const obj=normalizeInvoice(raw);await ensureClient(db,obj.client_id);
    const fields=['client_id','reference','issue_date','tax_date','kind','description','base_cents','vat_bps','vat_cents','withholding_bps','withholding_cents','total_cents','notes'];
    await db.batch([db.prepare('UPDATE sb_tax_invoices SET '+fields.map(f=>f+'=?').join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...fields.map(f=>obj[f]),raw.id),
      audit(db,'tax_invoice',raw.id,'update',data.southbearUser,fields)]);
    return apiResponse({ok:true});
  }catch(e){return fail(e);}
}
export async function onRequestDelete({env,request,data}){
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,3000);
    if(!validId(raw.id))throw new InputError('Anotación no válida.');
    const result=await db.prepare('SELECT id FROM sb_tax_invoices WHERE id=? AND archived_at IS NULL').bind(raw.id).first();
    if(!result)throw new InputError('No se ha encontrado la anotación activa.',404);
    await db.batch([db.prepare('UPDATE sb_tax_invoices SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(raw.id),
      audit(db,'tax_invoice',raw.id,'archive',data.southbearUser,['archived_at'])]);
    return apiResponse({ok:true});
  }catch(e){return fail(e);}
}
