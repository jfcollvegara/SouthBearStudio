import {normalizeDraft,validateReferences,insertDraftLines,draftDetail,draftError,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-invoice-drafts.js';

export async function onRequestGet({params,env}){
  if(!validId(params.id))return apiError('Borrador no válido.',400);
  try{
    const item=await draftDetail(env.SOUTHBEAR_DB,params.id);
    return item?apiResponse({ok:true,item}):apiError('No existe ese borrador.',404);
  }catch(error){return draftError(error);}
}

export async function onRequestPatch({params,request,env,data}){
  if(!validId(params.id))return apiError('Borrador no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const raw=await requestBody(request,80000);
    const previous=await draftDetail(db,params.id);
    if(!previous)return apiError('No existe ese borrador.',404);
    if(previous.archived_at){
      if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura el borrador antes de editarlo.',409);
      await db.batch([
        db.prepare('UPDATE invoice_drafts SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(previous.id),
        audit(db,'invoice_draft',previous.id,'restore',data.southbearUser,['archived_at'])
      ]);
      return apiResponse({ok:true,item:await draftDetail(db,previous.id)});
    }
    if(Object.keys(raw).includes('archived'))return apiError('Operación no permitida.',400);
    const obj=normalizeDraft(raw);
    if(obj.client_id!==previous.client_id)return apiError('El cliente del borrador no puede cambiarse; crea uno nuevo.',409);
    await validateReferences(db,obj);
    const stmt=db.prepare(
      'UPDATE invoice_drafts SET quote_id=?,project_id=?,title=?,planned_date=?,due_date=?,notes=?,subtotal_cents=?,tax_cents=?,total_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).bind(obj.quote_id,obj.project_id,obj.title,obj.planned_date,obj.due_date,obj.notes,obj.subtotal_cents,obj.tax_cents,obj.total_cents,previous.id);
    await db.batch([
      db.prepare('DELETE FROM invoice_draft_lines WHERE draft_id=?').bind(previous.id),
      stmt,...insertDraftLines(db,previous.id,obj.lines),
      audit(db,'invoice_draft',previous.id,'update',data.southbearUser,['quote_id','project_id','title','planned_date','due_date','notes','lines'])
    ]);
    return apiResponse({ok:true,item:await draftDetail(db,previous.id)});
  }catch(error){return draftError(error);}
}

export async function onRequestDelete({params,env,data}){
  if(!validId(params.id))return apiError('Borrador no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const previous=await draftDetail(db,params.id);
    if(!previous)return apiError('No existe ese borrador.',404);
    if(previous.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([
      db.prepare('UPDATE invoice_drafts SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(previous.id),
      audit(db,'invoice_draft',previous.id,'archive',data.southbearUser,['archived_at'])
    ]);
    return apiResponse({ok:true,archived:true});
  }catch(error){return draftError(error);}
}
