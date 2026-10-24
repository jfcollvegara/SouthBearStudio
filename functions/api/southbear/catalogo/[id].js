import {serviceFields,normalizeService,serviceDetail,serviceError,recordPrice,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-catalog.js';

export async function onRequestGet({env,params}){
  if(!validId(params.id))return apiError('Servicio no válido.',400);
  try{
    const item=await serviceDetail(env.SOUTHBEAR_DB,params.id);
    return item?apiResponse({ok:true,item}):apiError('Servicio no encontrado.',404);
  }catch(error){return serviceError(error);}
}
export async function onRequestPatch({env,request,params,data}){
  if(!validId(params.id))return apiError('Servicio no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,22000);
    const existing=await serviceDetail(db,params.id);
    if(!existing)return apiError('Servicio no encontrado.',404);
    if(existing.archived_at){
      if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura primero el servicio.',409);
      await db.batch([
        db.prepare('UPDATE studio_services SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(existing.id),
        audit(db,'service',existing.id,'restore',data.southbearUser,['archived_at'])
      ]);
      return apiResponse({ok:true,item:await serviceDetail(db,existing.id)});
    }
    if(Object.hasOwn(raw,'archived'))return apiError('Operación no permitida.',400);
    const obj=normalizeService(raw);
    const changed=obj.unit_gross_cents!==existing.unit_gross_cents||obj.vat_bps!==existing.vat_bps;
    const stmt=db.prepare('UPDATE studio_services SET '+serviceFields.map(k=>k+'=?').join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(...serviceFields.map(k=>obj[k]),existing.id);
    await db.batch([
      stmt,
      ...(changed?[recordPrice(db,existing.id,obj,data.southbearUser)]:[]),
      audit(db,'service',existing.id,'update',data.southbearUser,serviceFields)
    ]);
    return apiResponse({ok:true,item:await serviceDetail(db,existing.id)});
  }catch(error){return serviceError(error);}
}
export async function onRequestDelete({env,params,data}){
  if(!validId(params.id))return apiError('Servicio no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,old=await serviceDetail(db,params.id);
    if(!old)return apiError('Servicio no encontrado.',404);
    if(old.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([
      db.prepare('UPDATE studio_services SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
      audit(db,'service',old.id,'archive',data.southbearUser,['archived_at'])
    ]);
    return apiResponse({ok:true,archived:true});
  }catch(error){return serviceError(error);}
}
