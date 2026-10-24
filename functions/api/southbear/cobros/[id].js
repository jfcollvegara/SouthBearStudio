import {planDetail,normalizePlanMeta,failCollection,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-collections.js';

export async function onRequestGet({env,params}){
  if(!validId(params.id))return apiError('Plan de cobro no válido.',400);
  try{
    const item=await planDetail(env.SOUTHBEAR_DB,params.id);
    return item?apiResponse({ok:true,item}):apiError('No se ha encontrado el plan.',404);
  }catch(error){return failCollection(error);}
}
export async function onRequestPatch({env,params,request,data}){
  if(!validId(params.id))return apiError('Plan de cobro no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const raw=await requestBody(request,20000);
    const previous=await planDetail(db,params.id);
    if(!previous)return apiError('Plan no encontrado.',404);
    if(previous.archived_at){
      if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura el plan para editarlo.',409);
      await db.batch([
        db.prepare('UPDATE collection_plans SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(previous.id),
        audit(db,'collection_plan',previous.id,'restore',data.southbearUser,['archived_at'])
      ]);
      return apiResponse({ok:true,item:await planDetail(db,previous.id)});
    }
    const allowed=['title','notes','advance_cents','advance_due_date','final_due_date'];
    if(Object.keys(raw).some(key=>!allowed.includes(key)))return apiError('Solo pueden editarse el nombre, las fechas y el anticipo; el importe contratado no se modifica.',400);
    const meta=normalizePlanMeta(raw,previous.total_cents);
    await db.batch([
      db.prepare('UPDATE collection_plans SET title=?,notes=?,advance_cents=?,advance_due_date=?,final_due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .bind(meta.title,meta.notes,meta.advance_cents,meta.advance_due_date,meta.final_due_date,previous.id),
      audit(db,'collection_plan',previous.id,'update',data.southbearUser,allowed)
    ]);
    return apiResponse({ok:true,item:await planDetail(db,previous.id)});
  }catch(error){return failCollection(error);}
}
export async function onRequestDelete({env,params,data}){
  if(!validId(params.id))return apiError('Plan de cobro no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,previous=await planDetail(db,params.id);
    if(!previous)return apiError('Plan no encontrado.',404);
    if(previous.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([
      db.prepare('UPDATE collection_plans SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(previous.id),
      audit(db,'collection_plan',previous.id,'archive',data.southbearUser,['archived_at'])
    ]);
    return apiResponse({ok:true,archived:true});
  }catch(error){return failCollection(error);}
}
