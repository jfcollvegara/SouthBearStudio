import {expenseDetail,normalizeExpense,resolveExpenseSupplier,validateProject,expenseError,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-expenses.js';

export async function onRequestGet({env,params}){
  if(!validId(params.id))return apiError('Gasto no válido.',400);
  try{const item=await expenseDetail(env.SOUTHBEAR_DB,params.id);return item?apiResponse({ok:true,item}):apiError('No existe ese gasto.',404);}catch(e){return expenseError(e);}
}
export async function onRequestPatch({env,request,params,data}){
  if(!validId(params.id))return apiError('Gasto no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,25000),old=await expenseDetail(db,params.id);
    if(!old)return apiError('No existe ese gasto.',404);
    if(old.archived_at){
      if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura el gasto antes de editarlo.',409);
      await db.batch([db.prepare('UPDATE expenses SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
        audit(db,'expense',old.id,'restore',data.southbearUser,['archived_at'])]);
      return apiResponse({ok:true,item:await expenseDetail(db,old.id)});
    }
    if(Object.keys(raw).includes('archived'))return apiError('Operación no permitida.',400);
    // Después de iniciar pagos se bloquean los importes para no alterar retrospectivamente la contabilidad interna.
    if(old.paid_cents>0)return apiError('Este gasto ya tiene pagos registrados. Para modificar importes, anula antes los pagos asociados con su motivo.',409);
    const obj=normalizeExpense(raw);
    await validateProject(db,obj.project_id);
    await resolveExpenseSupplier(db,obj,old.supplier_id);
    const fields=['supplier_id','supplier_name','title','category','project_id','expense_date','due_date','document_ref','notes','gross_cents','vat_bps','base_cents','vat_cents'];
    await db.batch([db.prepare('UPDATE expenses SET '+fields.map(f=>f+'=?').join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...fields.map(f=>obj[f]),old.id),
      audit(db,'expense',old.id,'update',data.southbearUser,fields)]);
    return apiResponse({ok:true,item:await expenseDetail(db,old.id)});
  }catch(e){return expenseError(e);}
}
export async function onRequestDelete({env,params,data}){
  if(!validId(params.id))return apiError('Gasto no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,old=await expenseDetail(db,params.id);
    if(!old)return apiError('No existe ese gasto.',404);
    if(old.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([db.prepare('UPDATE expenses SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
      audit(db,'expense',old.id,'archive',data.southbearUser,['archived_at'])]);
    return apiResponse({ok:true,archived:true});
  }catch(e){return expenseError(e);}
}
