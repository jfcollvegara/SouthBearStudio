import {projectFields,projectColumns,normalizeProject,ensureClient,ensureQuoteLink,audit,requestBody,validId,apiError,apiResponse,fail}
  from '../../../../src/server/southbear-commerce.js';
const get=async(db,id)=>db.prepare('SELECT '+projectColumns+' FROM projects p JOIN clients c ON c.id=p.client_id LEFT JOIN quotes q ON q.id=p.quote_id WHERE p.id=?').bind(id).first();
export async function onRequestGet({params,env}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{const item=await get(env.SOUTHBEAR_DB,params.id);return item?apiResponse({ok:true,item}):apiError('Proyecto no encontrado.',404);}
  catch(e){return fail(e);}
}
export async function onRequestPatch({params,env,request,data}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request),previous=await get(db,params.id);
    if(!previous)return apiError('Proyecto no encontrado.',404);
    if(previous.archived_at&&raw.archived!==false)return apiError('Restaura el proyecto antes de editarlo.',409);
    const changedInput=Object.fromEntries(projectFields.filter(f=>Object.hasOwn(raw,f)).map(f=>[f,raw[f]]));
    const obj=normalizeProject({...Object.fromEntries(projectFields.map(f=>[f,previous[f]])),...changedInput});
    if(previous.quote_id&&obj.quote_id!==previous.quote_id)return apiError('El presupuesto vinculado no puede cambiarse una vez asociado.',409);
    await ensureClient(db,obj.client_id);await ensureQuoteLink(db,obj.quote_id,obj.client_id,params.id);
    const restore=previous.archived_at!==null&&raw.archived===false;
    const changed=projectFields.filter(f=>obj[f]!==previous[f]);
    if(!changed.length&&!restore)return apiResponse({ok:true,item:previous});
    const sql='UPDATE projects SET '+projectFields.map(f=>f+'=?').join(',')+',archived_at='+(restore?'NULL':'archived_at')+',updated_at=CURRENT_TIMESTAMP WHERE id=?';
    await db.batch([db.prepare(sql).bind(...projectFields.map(f=>obj[f]),params.id),audit(db,'project',params.id,restore?'restore':'update',data.southbearUser,changed)]);
    return apiResponse({ok:true,item:await get(db,params.id)});
  }catch(e){return fail(e);}
}
export async function onRequestDelete({params,env,data}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{
    const db=env.SOUTHBEAR_DB,prev=await get(db,params.id);
    if(!prev)return apiError('Proyecto no encontrado.',404);
    if(prev.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([db.prepare('UPDATE projects SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(params.id),audit(db,'project',params.id,'archive',data.southbearUser,['archived_at'])]);
    return apiResponse({ok:true,archived:true});
  }catch(e){return fail(e);}
}
