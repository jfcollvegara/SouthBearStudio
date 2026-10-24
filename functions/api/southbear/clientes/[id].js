import {CLIENT_FIELDS,CLIENT_COLUMNS,normalizedClient,requestBody,validId,logEvent,dbError,apiError,apiResponse}
  from '../../../../src/server/southbear-clients.js';

export async function onRequestGet(context){
  const id=context.params.id;
  if(!validId(id))return apiError('Identificador no válido.',400);
  try{
    const item=await context.env.SOUTHBEAR_DB.prepare('SELECT '+CLIENT_COLUMNS+' FROM clients WHERE id=?').bind(id).first();
    return item?apiResponse({ok:true,item}):apiError('El cliente no existe.',404);
  }catch(error){return dbError(error);}
}

export async function onRequestPatch(context){
  const id=context.params.id;
  if(!validId(id))return apiError('Identificador no válido.',400);
  let body;
  try{body=await requestBody(context.request);}
  catch(error){return apiError(error.message||'Solicitud no válida.',400);}
  try{
    const db=context.env.SOUTHBEAR_DB;
    const previous=await db.prepare('SELECT '+CLIENT_COLUMNS+' FROM clients WHERE id=?').bind(id).first();
    if(!previous)return apiError('El cliente no existe.',404);
    const current=Object.fromEntries(CLIENT_FIELDS.map(field=>[field,previous[field]]));
    const input={...current,...Object.fromEntries(CLIENT_FIELDS.filter(f=>Object.hasOwn(body,f)).map(f=>[f,body[f]]))};
    let data;
    try{data=normalizedClient(input);}
    catch(error){return apiError(error.message||'Datos no válidos.',400);}
    const changed=CLIENT_FIELDS.filter(field=>data[field]!==previous[field]);
    const restore=body.archived===false&&previous.archived_at!==null;
    if(!changed.length&&!restore)return apiResponse({ok:true,item:previous});
    const assigns=CLIENT_FIELDS.map(f=>f+'=?').join(',');
    const update='UPDATE clients SET '+assigns+',archived_at='+ (restore?'NULL':'archived_at') +',updated_at=strftime("%Y-%m-%dT%H:%M:%fZ","now") WHERE id=?';
    // SQLite admite comillas dobles para cadenas por compatibilidad,
    // pero aquí utilizamos la expresión CURRENT_TIMESTAMP en el SQL de producción.
    const safeUpdate=update.replace('strftime("%Y-%m-%dT%H:%M:%fZ","now")','CURRENT_TIMESTAMP');
    await db.batch([
      db.prepare(safeUpdate).bind(...CLIENT_FIELDS.map(f=>data[f]),id),
      logEvent(db,{subjectId:id,operation:restore?'restore':'update',user:context.data.southbearUser,fields:changed})
    ]);
    const saved=await db.prepare('SELECT '+CLIENT_COLUMNS+' FROM clients WHERE id=?').bind(id).first();
    return apiResponse({ok:true,item:saved});
  }catch(error){return dbError(error);}
}

export async function onRequestDelete(context){
  const id=context.params.id;
  if(!validId(id))return apiError('Identificador no válido.',400);
  try{
    const db=context.env.SOUTHBEAR_DB;
    const existing=await db.prepare('SELECT id, archived_at FROM clients WHERE id=?').bind(id).first();
    if(!existing)return apiError('El cliente no existe.',404);
    if(existing.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([
      db.prepare("UPDATE clients SET archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=? AND archived_at IS NULL").bind(id),
      logEvent(db,{subjectId:id,operation:'archive',user:context.data.southbearUser,fields:['archived_at']})
    ]);
    return apiResponse({ok:true,archived:true});
  }catch(error){return dbError(error);}
}
