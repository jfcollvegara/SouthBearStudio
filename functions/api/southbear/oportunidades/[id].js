import {opportunityFields,normalizeOpportunity,validateOpportunityClient,opportunityDetail,opportunityError,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-opportunities.js';

export async function onRequestGet({env,params}){
 if(!validId(params.id))return apiError('Oportunidad no válida.',400);
 try{const item=await opportunityDetail(env.SOUTHBEAR_DB,params.id);return item?apiResponse({ok:true,item}):apiError('No existe esa oportunidad.',404);}
 catch(error){return opportunityError(error);}
}
export async function onRequestPatch({env,params,request,data}){
 if(!validId(params.id))return apiError('Oportunidad no válida.',400);
 try{
  const db=env.SOUTHBEAR_DB,raw=await requestBody(request,27000),old=await opportunityDetail(db,params.id);
  if(!old)return apiError('No existe esa oportunidad.',404);
  if(old.archived_at){
   if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura la oportunidad para editarla.',409);
   await db.batch([
    db.prepare('UPDATE sales_opportunities SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
    audit(db,'opportunity',old.id,'restore',data.southbearUser,['archived_at'])
   ]);
   return apiResponse({ok:true,item:await opportunityDetail(db,old.id)});
  }
  if(Object.hasOwn(raw,'quote_id')||Object.hasOwn(raw,'archived'))return apiError('La vinculación de presupuestos y el archivo no pueden modificarse directamente.',400);
  const obj=normalizeOpportunity(raw);
  if(old.quote_id&&obj.client_id!==old.client_id)return apiError('No puedes cambiar el cliente si ya existe un presupuesto vinculado.',409);
  await validateOpportunityClient(db,obj);
  const changed=opportunityFields.filter(key=>obj[key]!==old[key]);
  if(!changed.length)return apiResponse({ok:true,item:old});
  await db.batch([
   db.prepare('UPDATE sales_opportunities SET '+opportunityFields.map(x=>x+'=?').join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?')
     .bind(...opportunityFields.map(x=>obj[x]),old.id),
   audit(db,'opportunity',old.id,'update',data.southbearUser,changed)
  ]);
  return apiResponse({ok:true,item:await opportunityDetail(db,old.id)});
 }catch(error){return opportunityError(error);}
}
export async function onRequestDelete({env,params,data}){
 if(!validId(params.id))return apiError('Oportunidad no válida.',400);
 try{
  const db=env.SOUTHBEAR_DB,item=await opportunityDetail(db,params.id);
  if(!item)return apiError('No existe esa oportunidad.',404);
  if(item.archived_at)return apiResponse({ok:true,archived:true});
  await db.batch([
   db.prepare('UPDATE sales_opportunities SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(item.id),
   audit(db,'opportunity',item.id,'archive',data.southbearUser,['archived_at'])
  ]);
  return apiResponse({ok:true,archived:true});
 }catch(error){return opportunityError(error);}
}
